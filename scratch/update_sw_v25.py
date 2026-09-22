# -*- coding: utf-8 -*-
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sw_files = ['sw.js', 'service-worker.js', 'src/sw.js', 'src/service-worker.js']

for fn in sw_files:
    with open(fn, 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Update version to v2.0.25
    c = c.replace("motorcare-cache-v2.0.24", "motorcare-cache-v2.0.25")
    c = c.replace("motorcare-cache-v2.0.23", "motorcare-cache-v2.0.25")

    # 2. Add new assets to PRECACHE_ASSETS if not present
    if "'./Reports_And_App_Headers.png'" not in c:
        c = c.replace(
            "'./manifest.json',",
            "'./manifest.json',\n  './logo.png',\n  './logo-wide.png',\n  './Reports_And_App_Headers.png',"
        )

    with open(fn, 'w', encoding='utf-8') as f:
        f.write(c)

    print(f"[{fn}] Updated successfully to v2.0.25.")

print("All SW files updated.")
