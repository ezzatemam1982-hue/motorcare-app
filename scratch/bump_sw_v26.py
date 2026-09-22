# -*- coding: utf-8 -*-
sw_files = ['sw.js', 'service-worker.js', 'src/sw.js', 'src/service-worker.js']
for fn in sw_files:
    with open(fn, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('motorcare-cache-v2.0.25', 'motorcare-cache-v2.0.26')
    if './logo-tight.jpg' not in c:
        c = c.replace("'./Reports_And_App_Headers.png',", "'./Reports_And_App_Headers.png',\n  './logo-tight.jpg',")
    with open(fn, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'[{fn}] bumped to v2.0.26')
