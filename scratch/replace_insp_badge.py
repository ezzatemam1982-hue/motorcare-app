# -*- coding: utf-8 -*-
import sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

old_badge = '<div class="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-xs">MC</div>'
new_badge = '<img src="logo.png" alt="MotorCare" class="w-6 h-6 rounded-lg object-contain bg-white border border-slate-200 dark:border-slate-700">'

for fn in ['index.html', 'src/index.html']:
    with open(fn, 'r', encoding='utf-8') as f:
        c = f.read()
    if old_badge in c:
        c = c.replace(old_badge, new_badge)
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"[{fn}] Replaced inspection badge.")
    else:
        print(f"[{fn}] Old badge not found.")

print("Done.")
