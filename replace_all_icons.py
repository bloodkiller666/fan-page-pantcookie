import os
import re

def to_camel_case(snake_str):
    components = snake_str.split('_')
    # Special rule for numbers if they are separate words, but title() might handle it ok?
    # e.g., 'qr_code_2' -> ['qr', 'code', '2'] -> 'QrCode2'
    return ''.join(x.title() for x in components)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match simple string classNames
    pattern_string = re.compile(r'<span\s+className="([^"]*?material-symbols-outlined[^"]*?)"([^>]*)>\s*([a-z_0-9]+)\s*</span>')
    
    matches_string = pattern_string.findall(content)
    
    icons_to_import = set()
    
    def replacer_string(match):
        classes = match.group(1).replace('material-symbols-outlined', '').strip()
        classes = re.sub(r'\s+', ' ', classes)
        other_attrs = match.group(2)
        icon_name = match.group(3)
        
        camel_icon = "Md" + to_camel_case(icon_name)
        icons_to_import.add(camel_icon)
        
        class_str = f' className="{classes}"' if classes else ''
        return f'<{camel_icon}{class_str}{other_attrs} />'
        
    new_content = pattern_string.sub(replacer_string, content)
    
    if icons_to_import:
        import_str = f"import {{ {', '.join(sorted(icons_to_import))} }} from 'react-icons/md';\n"
        if 'import ' in new_content:
            last_import_idx = new_content.rfind('import ')
            end_of_line = new_content.find('\n', last_import_idx)
            new_content = new_content[:end_of_line+1] + import_str + new_content[end_of_line+1:]
        else:
            new_content = import_str + new_content
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path} with imports: {icons_to_import}")
        
def main():
    src_dir = r"c:\Users\LENOVO\Documents\fan-page-pantcookie\src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
