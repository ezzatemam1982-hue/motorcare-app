# -*- coding: utf-8 -*-
"""
Apply Official MotorCare Logo & Reports_And_App_Headers:
1. Landing screen top-left brand and center logo
2. Main app header (logged-in navbar)
3. Report headers (both technical inspection report and financial custom statement report)
4. Email templates (with base64 embedded official logo)
5. Service Worker caching & version bump
"""
import sys, io, re, os, base64

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('scratch/logo_email_b64.txt', 'r', encoding='utf-8') as f:
    LOGO_B64 = f.read().strip()

print(f"Loaded logo b64 (length: {len(LOGO_B64)})")

# =========================================================================
# 1. LANDING SCREEN REPLACEMENTS
# =========================================================================
# Old landing top brand (from add_logo_to_app.py)
OLD_LANDING_TOP_1 = '''<div class="flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 38" width="96" height="30" class="shrink-0">
      <rect width="120" height="38" rx="8" class="fill-slate-900 dark:fill-slate-900" fill="#0f172a"/>
      <g transform="translate(4,3)">
        <path d="M5 17 C5 13,9 10,14 10 L52 10 C57 10,61 13,61 17 L63 21 C64 23,62 25,59.5 25 L5.5 25 C3 25,1.5 23,2.5 21 Z" fill="#2563eb"/>
        <path d="M16 10 L20 4 L46 4 L50 10 Z" fill="#38bdf8" opacity="0.85"/>
        <rect x="2" y="18" width="3" height="2.5" rx="0.5" fill="#ffffff"/>
        <rect x="60" y="18" width="3" height="2.5" rx="0.5" fill="#ef4444"/>
        <circle cx="17" cy="25" r="4" fill="#070a13" stroke="#38bdf8" stroke-width="1.5"/>
        <circle cx="17" cy="25" r="1.5" fill="#2563eb"/>
        <circle cx="49" cy="25" r="4" fill="#070a13" stroke="#38bdf8" stroke-width="1.5"/>
        <circle cx="49" cy="25" r="1.5" fill="#2563eb"/>
      </g>
      <text x="92" y="13" font-family="Arial,Helvetica,sans-serif" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle">Motor</text>
      <text x="92" y="26" font-family="Arial,Helvetica,sans-serif" font-size="9" font-weight="800" fill="#38bdf8" text-anchor="middle">Care</text>
    </svg>
  </div>'''

NEW_LANDING_TOP = '''<div class="flex items-center gap-2">
                    <img src="logo.png" alt="MotorCare" class="w-8 h-8 rounded-xl object-contain shadow-xs border border-slate-200/60 dark:border-slate-800 bg-white">
                    <span class="text-sm font-black tracking-tight text-slate-900 dark:text-white">Motor<span class="text-sky-500">Care</span></span>
                </div>'''

# Old landing center logo
OLD_LANDING_CENTER_RE = re.compile(
    r'<div class="text-center mb-3 shrink-0">\s*<div class="flex justify-center mb-2">\s*<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130".*?</svg>\s*</div>\s*<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">موتور كير <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">MotorCare</span></h1>\s*<p class="text-\[11px\] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed" data-i18n="landingDesc">.*?</p>\s*</div>',
    re.DOTALL
)

NEW_LANDING_CENTER = '''<div class="text-center mb-3 shrink-0">
                <div class="flex justify-center mb-2.5">
                  <div class="p-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 transition-all hover:scale-105 duration-300">
                    <img src="logo-wide.png" alt="MotorCare" class="h-24 sm:h-28 w-auto max-w-[270px] object-contain rounded-2xl">
                  </div>
                </div>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">موتور كير <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">MotorCare</span></h1>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed" data-i18n="landingDesc">المنظومة الاحترافية لإدارة وصيانة السيارات وتوثيق الفواتير بدقة.</p>
              </div>'''

# =========================================================================
# 2. MAIN APP NAVBAR / HEADER REPLACEMENT
# =========================================================================
OLD_APP_NAV_LOGO = '''<div class="hidden md:flex items-center gap-0" title="MotorCare - تطبيق الصيانة الذكي">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 34" width="88" height="28">
    <!-- Car body -->
    <g transform="translate(2,2)">
      <path d="M6 18 C6 14,10 11,15 11 L55 11 C60 11,64 14,64 18 L66.5 22.5 C67.5 24,66 26,63.5 26 L6.5 26 C4 26,2.5 24,3.5 22.5 Z" fill="#2563eb"/>
      <path d="M18 11 L22 4 L48 4 L52 11 Z" fill="#38bdf8" opacity="0.9"/>
      <rect x="3" y="19.5" width="3" height="2.5" rx="0.5" fill="#ffffff"/>
      <rect x="64" y="19.5" width="3" height="2.5" rx="0.5" fill="#ef4444"/>
      <circle cx="19" cy="26" r="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="19" cy="26" r="1.5" fill="#2563eb"/>
      <circle cx="51" cy="26" r="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="51" cy="26" r="1.5" fill="#2563eb"/>
    </g>
    <!-- MotorCare text -->
    <text x="78" y="14" font-family="Arial,Helvetica,sans-serif" font-size="8.5" font-weight="800" fill="currentColor" text-anchor="middle" class="text-slate-900 dark:text-white">Motor</text>
    <text x="78" y="24" font-family="Arial,Helvetica,sans-serif" font-size="8.5" font-weight="800" fill="#0284c7" text-anchor="middle">Care</text>
  </svg>
</div>'''

NEW_APP_NAV_LOGO = '''<div class="hidden md:flex items-center gap-2 p-1 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs" title="MotorCare - تطبيق الصيانة الذكي">
  <img src="logo.png" alt="MotorCare" class="w-6 h-6 rounded-md object-contain bg-white">
  <span class="text-xs font-black tracking-tight text-slate-900 dark:text-white">Motor<span class="text-sky-500">Care</span></span>
</div>'''

# =========================================================================
# 3. REPORT HEADERS: Use Reports_And_App_Headers.png
# =========================================================================
# Technical Inspection Report
OLD_REP_PRINT_HDR_RE = re.compile(
    r'<div class="border-b-2 border-sky-600 pb-5 mb-6 flex justify-between items-center">\s*<div class="flex items-center gap-4">\s*<div class="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shrink-0">.*?</div>\s*<div>\s*<h1 class="text-2xl font-black text-slate-900 tracking-wide">MotorCare Fleet &amp; Inspection Report</h1>\s*<p class="text-xs text-slate-500 font-bold" id="printReportSub">.*?</p>\s*</div>\s*</div>\s*<div class="text-end">\s*<span class="text-xs font-bold text-sky-600 block" id="printDateSpan"></span>\s*<span class="text-\[10px\] text-slate-400 font-semibold uppercase tracking-wider" id="printBadgeText">Certified Inspection Sheet</span>\s*</div>\s*</div>',
    re.DOTALL
)

NEW_REP_PRINT_HDR = '''<div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-center gap-4">
            <div class="flex items-center gap-4">
                <img src="Reports_And_App_Headers.png" alt="MotorCare" class="h-16 sm:h-20 w-auto object-contain rounded-xl drop-shadow-sm shrink-0">
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">MotorCare Fleet &amp; Inspection Report</h1>
                    <p class="text-xs text-slate-500 font-bold" id="printReportSub">تقرير الفحص الفني الشامل وسجل الصيانة الوقائية المعتمد (Multi-Point Inspection)</p>
                </div>
            </div>
            <div class="text-end shrink-0">
                <span class="text-xs font-bold text-sky-600 block" id="printDateSpan"></span>
                <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider" id="printBadgeText">Certified Inspection Sheet</span>
            </div>
        </div>'''

# Custom Financial Statement Report
OLD_CUSTOM_PRINT_HDR_RE = re.compile(
    r'<div class="border-b-2 border-sky-600 pb-5 mb-6 flex justify-between items-center">\s*<div class="flex items-center gap-3\.5">\s*<div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">\s*<i class="fa-solid fa-car-tunnel text-2xl"></i>\s*</div>\s*<div>\s*<div class="flex items-center gap-2">\s*<h1 class="text-2xl font-black text-slate-900 tracking-tight">MotorCare</h1>\s*<span class="px-2 py-0\.5 rounded-md text-\[11px\] font-black bg-sky-100 text-sky-800 border border-sky-200 uppercase">Official Statement</span>\s*</div>\s*<p class="text-xs text-slate-500 font-bold mt-0\.5" id="customPrintSubtitle">.*?</p>\s*</div>\s*</div>\s*<div class="text-end">\s*<span class="text-xs font-black text-sky-700 block" id="customPrintRefCode">MC-REP-XXXXXX</span>\s*<span class="text-\[11px\] text-slate-500 font-bold block" id="customPrintDateSpan">.*?</span>\s*<span class="text-\[10px\] text-slate-400 font-semibold" id="customPrintRangeSpan">.*?</span>\s*</div>\s*</div>',
    re.DOTALL
)

NEW_CUSTOM_PRINT_HDR = '''<div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-center gap-4">
            <div class="flex items-center gap-4">
                <img src="Reports_And_App_Headers.png" alt="MotorCare" class="h-16 sm:h-20 w-auto object-contain rounded-xl drop-shadow-sm shrink-0">
                <div>
                    <div class="flex items-center gap-2">
                        <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">MotorCare</h1>
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-200 uppercase">Official Statement</span>
                    </div>
                    <p class="text-xs text-slate-500 font-bold mt-0.5" id="customPrintSubtitle">تقرير فواتير ومصروفات الصيانة والوقود المعتمد</p>
                </div>
            </div>
            <div class="text-end shrink-0">
                <span class="text-xs font-black text-sky-700 block" id="customPrintRefCode">MC-REP-XXXXXX</span>
                <span class="text-[11px] text-slate-500 font-bold block" id="customPrintDateSpan">تاريخ الإصدار: 2026-09-17</span>
                <span class="text-[10px] text-slate-400 font-semibold" id="customPrintRangeSpan">الفترة: كل السجلات</span>
            </div>
        </div>'''

# =========================================================================
# 4. EMAIL TEMPLATES: Update email header with base64 logo
# =========================================================================
EMAIL_LOGO_TAG = f'''<div style="display:inline-block;margin-bottom:12px;background:#ffffff;padding:8px 14px;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);"><img src="data:image/jpeg;base64,{LOGO_B64}" alt="MotorCare" style="max-width:130px;height:auto;display:block;border:0;" /></div>'''

# Pattern for the old SVG in userHtml
OLD_EMAIL_SVG_RE = re.compile(
    r'<div style="display:inline-block;margin-bottom:10px;"><svg xmlns="http://www\.w3\.org/2000/svg" viewBox="0 0 200 72".*?</svg></div>',
    re.DOTALL
)

# Process both index.html and src/index.html
files = ['index.html', 'src/index.html']
for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_len = len(content)
    changed = False

    # 1. Landing top brand
    if OLD_LANDING_TOP_1 in content:
        content = content.replace(OLD_LANDING_TOP_1, NEW_LANDING_TOP)
        print(f"[{fn}] Replaced landing top brand.")
        changed = True
    else:
        print(f"[{fn}] Landing top brand pattern not found (might be already changed or formatted differently).")

    # 2. Landing center logo
    if OLD_LANDING_CENTER_RE.search(content):
        content = OLD_LANDING_CENTER_RE.sub(NEW_LANDING_CENTER, content, count=1)
        print(f"[{fn}] Replaced landing center logo.")
        changed = True
    else:
        print(f"[{fn}] Landing center logo pattern not found.")

    # 3. Main app navbar logo
    if OLD_APP_NAV_LOGO in content:
        content = content.replace(OLD_APP_NAV_LOGO, NEW_APP_NAV_LOGO)
        print(f"[{fn}] Replaced main app navbar logo.")
        changed = True
    else:
        print(f"[{fn}] Main app navbar logo pattern not found.")

    # 4. Technical report header
    if OLD_REP_PRINT_HDR_RE.search(content):
        content = OLD_REP_PRINT_HDR_RE.sub(NEW_REP_PRINT_HDR, content, count=1)
        print(f"[{fn}] Replaced technical report header.")
        changed = True
    else:
        print(f"[{fn}] Technical report header pattern not found.")

    # 5. Custom statement report header
    if OLD_CUSTOM_PRINT_HDR_RE.search(content):
        content = OLD_CUSTOM_PRINT_HDR_RE.sub(NEW_CUSTOM_PRINT_HDR, content, count=1)
        print(f"[{fn}] Replaced custom statement report header.")
        changed = True
    else:
        print(f"[{fn}] Custom statement report header pattern not found.")

    # 6. Email template SVG logo
    if OLD_EMAIL_SVG_RE.search(content):
        content = OLD_EMAIL_SVG_RE.sub(EMAIL_LOGO_TAG, content)
        print(f"[{fn}] Replaced email template logo with base64 official logo.")
        changed = True
    else:
        print(f"[{fn}] Email template SVG pattern not found.")

    if changed:
        with open(fn, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[{fn}] Written successfully. Length: {orig_len} -> {len(content)}")
    else:
        print(f"[{fn}] No changes applied!")

print("\nHTML updates completed.")
