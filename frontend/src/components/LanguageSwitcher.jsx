import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import useLayoutStore from '../store/layoutStore';

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLayoutStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find(l => l.code === language) || LANGS[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setLanguage(code);
    localStorage.setItem('internhub-lang', code);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Changer de langue / Change language / تغيير اللغة"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.3rem 0.6rem',
          background: open ? 'var(--surface-hover, rgba(0,0,0,0.05))' : 'transparent',
          border: '1px solid var(--surface-border)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: '600',
          color: 'var(--text-muted)',
          transition: 'background 0.15s, border-color 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover, rgba(0,0,0,0.05))'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--surface-border)'; } }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{current.flag}</span>
        <span style={{ letterSpacing: '0.04em' }}>{current.code.toUpperCase()}</span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          minWidth: '148px',
          zIndex: 999,
          overflow: 'hidden',
        }}>
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.875rem',
                background: language === lang.code ? 'rgba(99,102,241,0.07)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: language === lang.code ? '700' : '500',
                color: language === lang.code ? '#6366F1' : 'var(--text-main)',
                textAlign: 'start',
                transition: 'background 0.15s',
                direction: lang.code === 'ar' ? 'rtl' : 'ltr',
              }}
              onMouseEnter={e => { if (language !== lang.code) e.currentTarget.style.background = 'var(--surface-hover, rgba(0,0,0,0.04))'; }}
              onMouseLeave={e => { if (language !== lang.code) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '1rem' }}>{lang.flag}</span>
              <span>{lang.label}</span>
              {language === lang.code && (
                <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#6366F1', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
