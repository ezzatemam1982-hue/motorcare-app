# -*- coding: utf-8 -*-
"""
Sets official webhook to AKfycbw9 (motorcare.auto@gmail.com)
and removes AKfycbwv (ezzat.emam1982@gmail.com)
"""

TARGET_OLD = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec'
OFFICIAL_NEW = 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec'

files = [
    'index.html',
    'src/index.html',
    'app_config.js',
    'src/app_config.js',
    '.env',
    '.env.example'
]

for fpath in files:
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        if TARGET_OLD in content:
            content = content.replace(TARGET_OLD, OFFICIAL_NEW)
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'[{fpath}] Swapped webhook to official motorcare.auto@gmail.com (AKfycbw9).')
        else:
            print(f'[{fpath}] Target not found (might already be AKfycbw9).')
    except Exception as e:
        print(f'[{fpath}] Error: {e}')
