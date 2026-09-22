# -*- coding: utf-8 -*-
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

print("File read successfully, length:", len(text))

# Find landing screen
pos = text.find('id="landingScreen"')
if pos != -1:
    print("\n--- LANDING SCREEN (around pos) ---")
    print(text[pos:pos+1500])

# Find app header
pos_hdr = text.find('id="appHeader"')
if pos_hdr == -1:
    pos_hdr = text.find('header id=')
if pos_hdr == -1:
    pos_hdr = text.find('<header')
print("\n--- APP HEADER ---")
if pos_hdr != -1:
    print(text[pos_hdr:pos_hdr+1200])

# Find Report Headers
for m in re.finditer(r'<div id="(?:reportPrintSection|customPrintSection)"', text):
    p = m.start()
    print(f"\n--- REPORT SECTION at {p} ---")
    print(text[p:p+1000])
