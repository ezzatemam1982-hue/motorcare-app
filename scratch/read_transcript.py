# -*- coding: utf-8 -*-
import json
import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

p = r"C:\Users\Ezzat Emam\.gemini\antigravity-ide\brain\48a177bb-8e79-44c2-977f-941dbec7bc64\.system_generated\logs\transcript_full.jsonl"
with open(p, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in [1355, 1356, 1357, 1358, 1359, 1360]:
            obj = json.loads(line)
            t = obj.get('type')
            print(f"=== STEP {i} ({t}) ===")
            content = obj.get('content') or ''
            print(content[:600])
