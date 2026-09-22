# -*- coding: utf-8 -*-
"""
Update remaining email templates (OTP, Welcome, Password Reset) with official base64 logo
"""
import sys, io, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('scratch/logo_email_b64.txt', 'r', encoding='utf-8') as f:
    LOGO_B64 = f.read().strip()

EMAIL_LOGO_TAG = f'''<div style="display:inline-block;margin-bottom:12px;background:#ffffff;padding:6px 12px;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);"><img src="data:image/jpeg;base64,{LOGO_B64}" alt="MotorCare" style="max-width:120px;height:auto;display:block;border:0;" /></div>'''

files = ['index.html', 'src/index.html']

for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_len = len(content)
    
    # 1. Pattern with MC in verification / welcome email
    pattern_mc1 = re.compile(
        r'<div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba\(255,255,255,0\.15\); border: 2px solid rgba\(255,255,255,0\.25\); border-radius: 14px; font-size: 20px; font-weight: 900; color: #ffffff; margin-bottom: 8px;">MC</div>'
    )
    content, count1 = pattern_mc1.subn(EMAIL_LOGO_TAG, content)
    print(f"[{fn}] Replaced pattern_mc1 {count1} times.")

    # 2. Pattern with MC in password reset email
    pattern_mc2 = re.compile(
        r'<div style="display:inline-block;width:44px;height:44px;line-height:44px;background:rgba\(255,255,255,0\.15\);border:2px solid rgba\(255,255,255,0\.25\);border-radius:14px;font-size:20px;font-weight:900;color:#ffffff;margin-bottom:8px">MC</div>'
    )
    content, count2 = pattern_mc2.subn(EMAIL_LOGO_TAG, content)
    print(f"[{fn}] Replaced pattern_mc2 {count2} times.")

    with open(fn, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[{fn}] Written successfully. Length: {orig_len} -> {len(content)}")

print("All email templates updated with official logo!")
