import os
import re

MAPPING = {
    "eye": "Eye",
    "eye-off": "EyeOff",
    "search": "Search",
    "search-outline": "Search",
    "map-outline": "MapPin",
    "briefcase-outline": "Briefcase",
    "person-outline": "User",
    "people-outline": "Users",
    "checkmark-circle": "CheckCircle",
    "close-circle": "XCircle",
    "close": "X",
    "arrow-forward": "ArrowRight",
    "arrow-back": "ArrowLeft",
    "chevron-forward": "ChevronRight",
    "chevron-back": "ChevronLeft",
    "calendar-outline": "Calendar",
    "time-outline": "Clock",
    "mail-outline": "Mail",
    "call-outline": "Phone",
    "document-text-outline": "FileText",
    "star-outline": "Star",
    "star": "Star",
    "star-half-outline": "StarHalf",
    "alert-circle-outline": "AlertCircle",
    "add-circle-outline": "PlusCircle",
    "home-outline": "Home",
    "settings-outline": "Settings",
    "log-out-outline": "LogOut",
    "lock-closed-outline": "Lock",
    "lock-open-outline": "Unlock",
    "information-circle-outline": "Info",
    "help-circle-outline": "HelpCircle",
    "warning-outline": "AlertTriangle",
    "trash-outline": "Trash2",
    "pencil-outline": "Edit2",
    "create-outline": "Edit2",
    "download-outline": "Download",
    "share-social-outline": "Share2",
    "camera-outline": "Camera",
    "image-outline": "Image",
    "business-outline": "Building",
    "school-outline": "GraduationCap",
    "document-outline": "File",
    "checkmark": "Check",
    "heart-outline": "Heart",
    "heart": "Heart",
    "filter-outline": "Filter",
    "options-outline": "Sliders",
    "menu-outline": "Menu",
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "Ionicons" not in content:
        return

    # Extract all Ionicon names used
    names = set(re.findall(r'<Ionicons[^>]*name=[\'"]([a-zA-Z0-9\-]+)[\'"]', content))
    names.update(re.findall(r'<Ionicons[^>]*name=\{[^\}]+\?[^\:]+\:\s*[\'"]([a-zA-Z0-9\-]+)[\'"]\}', content))
    names.update(re.findall(r'<Ionicons[^>]*name=\{[^\}]+\?[\s]*[\'"]([a-zA-Z0-9\-]+)[\'"]', content))
    
    # Check if we need to map a ternary or variable (basic handling)
    
    lucide_components = set()
    
    # Function to replace tags
    def replace_tag(match):
        full_tag = match.group(0)
        
        # Replace simple names
        for old, new in MAPPING.items():
            if f'name="{old}"' in full_tag or f"name='{old}'" in full_tag:
                lucide_components.add(new)
                return full_tag.replace("Ionicons", new).replace(f'name="{old}"', "").replace(f"name='{old}'", "")
        
        # Ternary logic (e.g., name={visible ? 'eye-off' : 'eye'})
        if 'name={' in full_tag:
            # We'll just replace the whole tag and try to figure out the components later manually
            # But wait, ternary in JSX tag component name is not valid React (e.g. <{cond?A:B} />)
            # We can't simply replace <Ionicons name={cond ? 'a' : 'b'} /> with <Cond ? A : B />
            # For these, we must keep a wrapper or replace it with {cond ? <A /> : <B />}
            pass

        return full_tag

    # Try manual replacements for ternaries first
    # Example: <Ionicons name={visible ? 'eye-off' : 'eye'} size={19} color={C.textMuted} />
    # Should become {visible ? <EyeOff size={19} color={C.textMuted} /> : <Eye size={19} color={C.textMuted} />}
    def replace_ternary(match):
        props = match.group(3)
        cond = match.group(1).strip()
        icon_true = MAPPING.get(match.group(2), match.group(2))
        icon_false = MAPPING.get(match.group(4), match.group(4))
        
        lucide_components.add(icon_true)
        lucide_components.add(icon_false)
        
        return f"{{{cond} ? <{icon_true} {props}/> : <{icon_false} {props}/>}}"

    content = re.sub(r'<Ionicons\s+name=\{([^\}]+)\s*\?\s*[\'"]([a-zA-Z0-9\-]+)[\'"]\s*:\s*[\'"]([a-zA-Z0-9\-]+)[\'"]\}\s*([^>]+)/>', 
                     lambda m: replace_ternary(m), content)

    # Now handle simple ones
    def replace_simple(match):
        name = match.group(1)
        props = match.group(2)
        new_name = MAPPING.get(name, name)
        lucide_components.add(new_name)
        return f"<{new_name} {props}/>"
        
    content = re.sub(r'<Ionicons\s+name=[\'"]([a-zA-Z0-9\-]+)[\'"]\s*([^>]*)/>', lambda m: replace_simple(m), content)
    
    # Handle the case where name is first and props are after, or vice versa
    # Actually the regex above handles <Ionicons name="eye" props /> but not <Ionicons props name="eye" />
    def replace_simple_2(match):
        props1 = match.group(1)
        name = match.group(2)
        props2 = match.group(3)
        new_name = MAPPING.get(name, name)
        lucide_components.add(new_name)
        return f"<{new_name} {props1} {props2}/>"
        
    content = re.sub(r'<Ionicons\s+([^>]*?)name=[\'"]([a-zA-Z0-9\-]+)[\'"]([^>]*?)/>', lambda m: replace_simple_2(m), content)

    # Clean up imports
    if lucide_components:
        import_str = "import { " + ", ".join(sorted(lucide_components)) + " } from 'lucide-react-native';"
        content = re.sub(r"import\s*\{\s*Ionicons\s*\}\s*from\s*['\"]@expo/vector-icons['\"];?", import_str, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(r'e:\React-Django-Project-master\PFE\mobile\src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            process_file(os.path.join(root, file))

print("Done")
