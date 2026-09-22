# -*- coding: utf-8 -*-
"""
Add professional MotorCare SVG logo to:
1. Landing screen header (top-left brand area)
2. Landing screen main logo/icon area
3. Main app header brand badge
4. Export reports header
"""

# Inline SVG logo for app header (compact, dark/light mode aware)
APP_HEADER_LOGO = '''<div class="hidden md:flex items-center gap-0" title="MotorCare - تطبيق الصيانة الذكي">
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

# Landing screen top-left brand SVG (replaces the icon + text)
LANDING_TOP_BRAND = '''<div class="flex items-center gap-2">
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

# Large landing screen central logo
LANDING_CENTER_LOGO = '''<div class="text-center mb-3 shrink-0">
                <div class="flex justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130" width="160" height="104" class="drop-shadow-xl">
                    <defs>
                      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#070a13"/>
                        <stop offset="50%" style="stop-color:#0f172a"/>
                        <stop offset="100%" style="stop-color:#1e3a5f"/>
                      </linearGradient>
                    </defs>
                    <rect width="200" height="130" rx="22" fill="url(#bgGrad)"/>
                    <!-- Car body -->
                    <g transform="translate(18,20)">
                      <path d="M10 52 C10 42,20 34,34 34 L130 34 C144 34,154 42,154 52 L160 67 C162 72,158 77,152 77 L12 77 C6 77,2 72,4 67 Z" fill="#2563eb"/>
                      <path d="M42 34 L52 10 L112 10 L122 34 Z" fill="#38bdf8" opacity="0.9"/>
                      <!-- headlights -->
                      <rect x="5" y="57" width="8" height="5" rx="1.5" fill="#ffffff" opacity="0.95"/>
                      <!-- tail lights -->
                      <rect x="151" y="57" width="8" height="5" rx="1.5" fill="#ef4444" opacity="0.9"/>
                      <!-- wheels -->
                      <circle cx="44" cy="77" r="16" fill="#070a13" stroke="#38bdf8" stroke-width="4"/>
                      <circle cx="44" cy="77" r="6" fill="#2563eb"/>
                      <circle cx="44" cy="77" r="2" fill="#38bdf8"/>
                      <circle cx="120" cy="77" r="16" fill="#070a13" stroke="#38bdf8" stroke-width="4"/>
                      <circle cx="120" cy="77" r="6" fill="#2563eb"/>
                      <circle cx="120" cy="77" r="2" fill="#38bdf8"/>
                    </g>
                    <!-- Text -->
                    <text x="100" y="120" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">Motor<tspan fill="#38bdf8">Care</tspan></text>
                  </svg>
                </div>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">موتور كير <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">MotorCare</span></h1>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed" data-i18n="landingDesc">المنظومة الاحترافية لإدارة وصيانة السيارات وتوثيق الفواتير بدقة.</p>
              </div>'''

files = ['index.html', 'src/index.html']

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content

        # =====================================================================
        # FIX 1: Replace top-left brand in landing screen
        # =====================================================================
        old_landing_brand = '''<div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center text-xs shadow-md shadow-sky-500/20">
                        <i class="fa-solid fa-car-tunnel"></i>
                    </div>
                    <div>
                        <span class="text-sm font-black tracking-tight text-slate-900 dark:text-white">MotorCare</span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold ml-1">v2.0.5</span>
                    </div>
                </div>'''
        content = content.replace(old_landing_brand, LANDING_TOP_BRAND)

        # =====================================================================
        # FIX 2: Replace central landing screen logo/icon
        # =====================================================================
        old_landing_center = '''            <!-- الشعار والترويسة بصيغة متناسقة ومدمجة دون إهدار مساحة الشاشة -->
            <div class="text-center mb-3 shrink-0">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/15 to-indigo-500/15 border border-sky-500/30 text-sky-500 dark:text-sky-400 mb-1.5 shadow-md">
                    <i class="fa-solid fa-gauge-high text-xl animate-pulse"></i>
                </div>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">موتور كير <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">MotorCare</span></h1>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto leading-relaxed" data-i18n="landingDesc">المنظومة الاحترافية لإدارة وصيانة السيارات وتوثيق الفواتير بدقة.</p>
            </div>'''
        content = content.replace(old_landing_center, LANDING_CENTER_LOGO)

        # =====================================================================
        # FIX 3: Replace header brand badge with SVG logo
        # =====================================================================
        old_header_badge = '''                    <!-- شارة وهوية التطبيق الفاخرة (MotorCare) -->
                    <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-black">
                        <i class="fa-solid fa-shield-halved text-xs"></i>
                        <span>موتور كير</span>
                    </div>'''
        content = content.replace(old_header_badge, APP_HEADER_LOGO)

        if content != original:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print('[OK] Fixed: ' + filename)
        else:
            print('[WARN] No changes in: ' + filename)

    except FileNotFoundError:
        print('[SKIP] Not found: ' + filename)
    except Exception as e:
        print('[ERR] ' + filename + ': ' + str(e))

print('Done.')
