import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if any(k in line.lower() for k in ['mobile-nav', 'bottom-0', 'sticky top-0', 'header', 'z-40', 'sos']):
        if '<nav' in line or '<header' in line or 'bottom-0' in line or 'sticky' in line or 'fixed bottom' in line:
            print(f"Line {idx+1}: {line.strip()[:140]}")
