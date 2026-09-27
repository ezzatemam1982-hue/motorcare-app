import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

print("--- Modals related to car, insp, doc, fuel, record, garage ---")
for m in re.finditer(r'<div[^>]*id=["\']([^"\']*(?:car|insp|garage|doc|fuel|record|sheet)[^"\']*)["\']', text, re.IGNORECASE):
    print("Found ID:", m.group(1))

print("\n--- Search for 'نافذة' or 'فحص' comments ---")
for line_no, line in enumerate(text.splitlines(), 1):
    if any(k in line for k in ['الفحص الفني', 'كراج', 'إرفاق', 'تصوير', 'معاينة']):
        print(f"L{line_no}: {line.strip()[:120]}")
