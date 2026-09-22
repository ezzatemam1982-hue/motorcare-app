# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

p = r"C:\Users\Ezzat Emam\.gemini\antigravity-ide\brain\48a177bb-8e79-44c2-977f-941dbec7bc64\.system_generated\logs\transcript_full.jsonl"
with open(p, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 1650:
            obj = json.loads(line)
            if obj.get('type') == 'USER_INPUT':
                c = obj.get('content') or ''
                print(f"Step {i}: {c[:120]}")
