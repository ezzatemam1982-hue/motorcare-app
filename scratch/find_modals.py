import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

modal_ids = re.findall(r'id=["\']([^"\']*[Mm]odal[^"\']*)["\']', content)
print("Found modals:", len(modal_ids))
for m in sorted(set(modal_ids)):
    print("-", m)

drawers = re.findall(r'id=["\']([^"\']*[Dd]rawer[^"\']*)["\']', content)
print("Found drawers:", len(drawers))
for d in sorted(set(drawers)):
    print("-", d)
