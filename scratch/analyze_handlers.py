import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pattern = re.compile(r'\bon[a-zA-Z]+\s*=\s*["\']([^"\']+)["\']')
matches = pattern.findall(text)

calls = set()
for m in matches:
    fns = re.findall(r'([a-zA-Z0-9_$]+)\s*\(', m)
    for fn in fns:
        if fn not in ['if', 'for', 'while', 'catch', 'alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent']:
            calls.add(fn)

print(f"Total unique inline event calls: {len(calls)}")
for c in sorted(calls):
    print(f"  {c}")
