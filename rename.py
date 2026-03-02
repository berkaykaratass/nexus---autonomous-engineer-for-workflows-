import os

replacements = {
    "tembo": "nexus",
    "Tembo": "Nexus",
    "TEMBO": "NEXUS"
}
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file == 'rename.py':
            continue
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            new_content = content
            for k, v in replacements.items():
                new_content = new_content.replace(k, v)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
        except Exception as e:
            pass
