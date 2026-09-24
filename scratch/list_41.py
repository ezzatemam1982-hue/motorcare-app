import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('service_centers.json', 'r', encoding='utf-8') as f:
    centers = json.load(f)

defaults = []
for c in centers:
    if abs(c.get('lat', 0) - 30.0444) < 0.001 and abs(c.get('lng', 0) - 31.2357) < 0.001:
        defaults.append({
            'id': c['id'],
            'name': c['name'],
            'gov': c.get('gov', ''),
            'area': c.get('area', ''),
            'address': c.get('address', '')
        })

print(f"Total: {len(defaults)}")
with open('scratch/defaults_41.json', 'w', encoding='utf-8') as out:
    json.dump(defaults, out, ensure_ascii=False, indent=2)
print("Saved to scratch/defaults_41.json")
