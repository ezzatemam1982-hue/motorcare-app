# -*- coding: utf-8 -*-
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Find main app navbar / header (after login)
# Usually after landingScreen ends or search for main app container
landing_end = text.find('</section>', text.find('id="landingScreen"'))
if landing_end == -1:
    landing_end = text.find('</div>', text.find('id="landingScreen"'))

print("Searching after landing screen pos:", landing_end)
# search for <header or nav in the main app
for m in re.finditer(r'<(?:header|nav)\b[^>]*>', text[landing_end:landing_end+100000]):
    p = landing_end + m.start()
    print(f"\nHeader/Nav at {p}:")
    print(text[p:p+500])
