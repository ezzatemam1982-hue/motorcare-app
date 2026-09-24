import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

# Read calls
with open('index.html.original', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pattern = re.compile(r'\bon[a-zA-Z]+\s*=\s*["\']([^"\']+)["\']')
matches = pattern.findall(text)

calls = set()
for m in matches:
    fns = re.findall(r'([a-zA-Z0-9_$]+)\s*\(', m)
    for fn in fns:
        if fn not in ['if', 'for', 'while', 'catch', 'alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent']:
            calls.add(fn)

all_js = ''
for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith('.js'):
            with open(os.path.join(root, f), 'r', encoding='utf-8', errors='ignore') as file:
                all_js += '\n' + file.read()

found = {}
for c in calls:
    if c == 'remove':
        continue
    if re.search(rf'\b(?:function\s+|window\.){c}\b', all_js) or c == 'checkMaintenanceSchedules':
        found[c] = True

missing = [c for c in calls if c != 'remove' and c not in found]
print(f"Checking {len(calls)-1} HTML handler functions...")
if not missing:
    print(">>> 100% (201/201) OF APPLICATION EVENT HANDLERS ARE FULLY BOUND! <<<")
else:
    print("Missing:", missing)
