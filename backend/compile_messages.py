"""
Pure-Python .po → .mo compiler.
Replicates what `django-admin compilemessages` does via msgfmt,
but requires no GNU gettext installation.

Usage:  python compile_messages.py
"""

import struct
import os
import re

MAGIC = 0x950412DE   # little-endian .mo magic


def parse_po(po_path):
    """Return list of (msgid, msgstr) pairs from a .po file."""
    entries = {}
    msgid = msgstr = None
    in_msgid = in_msgstr = False
    buf = []

    def flush():
        nonlocal msgid, msgstr
        if msgid is not None and msgstr is not None:
            entries[msgid] = msgstr
        msgid = msgstr = None

    with open(po_path, encoding='utf-8') as f:
        for raw_line in f:
            line = raw_line.rstrip('\n')

            if line.startswith('#') or line == '':
                # blank line ends the current entry
                if in_msgid or in_msgstr:
                    text = '\n'.join(buf).encode('raw_unicode_escape').decode('unicode_escape')
                    if in_msgid:
                        msgid = text
                    else:
                        msgstr = text
                    buf = []
                    in_msgid = in_msgstr = False
                if line == '':
                    flush()
                continue

            m = re.match(r'^msgid\s+"(.*)"$', line)
            if m:
                if in_msgstr:
                    text = '\n'.join(buf).encode('raw_unicode_escape').decode('unicode_escape')
                    msgstr = text
                    buf = []
                    in_msgstr = False
                    flush()
                in_msgid = True
                buf = [m.group(1)]
                continue

            m = re.match(r'^msgstr\s+"(.*)"$', line)
            if m:
                if in_msgid:
                    text = '\n'.join(buf).encode('raw_unicode_escape').decode('unicode_escape')
                    msgid = text
                    buf = []
                    in_msgid = False
                in_msgstr = True
                buf = [m.group(1)]
                continue

            m = re.match(r'^"(.*)"$', line)
            if m and (in_msgid or in_msgstr):
                buf.append(m.group(1))
                continue

        # flush last entry
        if buf:
            text = '\n'.join(buf).encode('raw_unicode_escape').decode('unicode_escape')
            if in_msgid:
                msgid = text
            elif in_msgstr:
                msgstr = text
        flush()

    return entries


def compile_po(po_path, mo_path):
    entries = parse_po(po_path)

    # Always include the empty-string header entry
    ids = []
    strs = []
    for msgid, msgstr in sorted(entries.items()):
        if not msgstr:
            continue
        ids.append(msgid.encode('utf-8'))
        strs.append(msgstr.encode('utf-8'))

    n = len(ids)
    # offsets section starts after header (7 * 4 bytes) + 2 * n * 8 bytes (id+str tables)
    keystart = 7 * 4 + 2 * n * 8
    valuestart = keystart + sum(len(k) + 1 for k in ids)

    koffsets = []
    voffsets = []
    cur = keystart
    for k in ids:
        koffsets.append((len(k), cur))
        cur += len(k) + 1
    cur = valuestart
    for v in strs:
        voffsets.append((len(v), cur))
        cur += len(v) + 1

    os.makedirs(os.path.dirname(mo_path), exist_ok=True)
    with open(mo_path, 'wb') as f:
        f.write(struct.pack('<IIIIIII',
            MAGIC,           # magic
            0,               # revision
            n,               # number of strings
            7 * 4,           # offset of id table
            7 * 4 + n * 8,  # offset of str table
            0,               # size of hash table
            7 * 4 + 2 * n * 8,  # offset of hash table
        ))
        for length, offset in koffsets:
            f.write(struct.pack('<II', length, offset))
        for length, offset in voffsets:
            f.write(struct.pack('<II', length, offset))
        for k in ids:
            f.write(k + b'\x00')
        for v in strs:
            f.write(v + b'\x00')

    print(f"  compiled: {po_path} -> {mo_path}  ({n} strings)")


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    locale_dir = os.path.join(base, 'locale')

    for lang in os.listdir(locale_dir):
        po = os.path.join(locale_dir, lang, 'LC_MESSAGES', 'django.po')
        mo = os.path.join(locale_dir, lang, 'LC_MESSAGES', 'django.mo')
        if os.path.isfile(po):
            compile_po(po, mo)

    print("Done.")


if __name__ == '__main__':
    main()
