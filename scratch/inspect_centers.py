import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('service_centers.json', 'r', encoding='utf-8') as f:
    centers = json.load(f)

defaults = [c for c in centers if abs(c.get('lat', 0) - 30.0444) < 0.001 and abs(c.get('lng', 0) - 31.2357) < 0.001]
print(f"Centers with default 30.0444, 31.2357: {len(defaults)}")
for d in defaults:
    print(f"{d['id']} | {d['name']} | {d.get('gov','')} | {d.get('area','')} | {d.get('address','')}")
