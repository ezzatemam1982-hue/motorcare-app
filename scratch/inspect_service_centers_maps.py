import re
import json

with open('service_centers.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove window.MOTORCARE_SERVICE_CENTERS = and trailing semicolon
json_str = content.replace('window.MOTORCARE_SERVICE_CENTERS =', '').strip()
if json_str.endswith(';'):
    json_str = json_str[:-1].strip()

try:
    data = json.loads(json_str)
    print(f"Total service centers: {len(data)}")
    raw_coord_count = 0
    for item in data:
        url = item.get('mapsUrl', '')
        if re.search(r'query=-?\d+\.\d+,-?\d+\.\d+', url):
            raw_coord_count += 1
    print(f"Count of raw coordinate query URLs: {raw_coord_count} / {len(data)}")
    print("Example raw url:", data[0].get('mapsUrl'))
except Exception as e:
    print("Error parsing json:", e)
