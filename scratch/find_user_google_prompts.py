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
        obj = json.loads(line)
        if obj.get('type') == 'USER_INPUT':
            content = obj.get('content') or ''
            if 'جوجل' in content or 'google' in content.lower():
                print(f"Step {i}: {content}")
