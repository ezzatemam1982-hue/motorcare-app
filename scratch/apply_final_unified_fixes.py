# -*- coding: utf-8 -*-
import sys
import os
import re
import hashlib
import shutil

sys.stdout.reconfigure(encoding='utf-8')

ROOT_INDEX = 'index.html'
SRC_INDEX = os.path.join('src', 'index.html')
CLEAN_TEST = os.path.join('scratch', 'clean_test.html')

with open(ROOT_INDEX, 'r', encoding='utf-8') as f:
    html = f.read()

with open(CLEAN_TEST, 'r', encoding='utf-8') as f:
    clean = f.read()

print("Initial index.html length:", len(html))

# =========================================================================
# 1. RESTORE GOOGLE SIGN-IN FUNCTIONS EXACTLY FROM clean_test.html
# =========================================================================
# Extract the Google OAuth chunk from clean_test.html
g_start = clean.find('        function openGoogleAuthModal(')
g_end = clean.find('        async function handleAuthSubmit(')
assert g_start != -1 and g_end != -1, "Could not find google chunk in clean_test.html"

# In clean_test.html, chunk ends with 'let _isSubmittingAuth = false;\n        '
# Let's extract up to 'let _isSubmittingAuth = false;'
submit_flag_marker = 'let _isSubmittingAuth = false;'
sub_idx = clean.find(submit_flag_marker, g_start)
assert sub_idx != -1 and sub_idx < g_end, "Could not locate _isSubmittingAuth in clean_test.html"
google_chunk = clean[g_start:sub_idx].rstrip() + "\n\n"

print("Extracted google_chunk length:", len(google_chunk))

# Insert google_chunk right before 'let _isSubmittingAuth = false;' in index.html
if 'function openGoogleAuthModal' not in html:
    sub_pos = html.find('        let _isSubmittingAuth = false;')
    if sub_pos == -1:
        sub_pos = html.find('let _isSubmittingAuth = false;')
    assert sub_pos != -1, "Could not find _isSubmittingAuth insertion point in index.html"
    
    html = html[:sub_pos] + google_chunk + "        " + html[sub_pos:]
    print("✓ Successfully restored all Google Sign-In functions into index.html")
else:
    print("Google functions already present in index.html")

# =========================================================================
# 2. ELIMINATE DUPLICATE PASSWORD RESET OTP EMAIL (REMOVE DELAYED PULSE)
# =========================================================================
# In sendForgotPasswordEmail, remove setTimeout(sendFetch, 1200);
dup_send_pulse = """                sendFetch();
                setTimeout(sendFetch, 1200);"""

single_send_pulse = """                sendFetch();"""

if dup_send_pulse in html:
    html = html.replace(dup_send_pulse, single_send_pulse, 1)
    print("✓ Successfully removed duplicate pulse in sendForgotPasswordEmail (now sends exactly once)")
else:
    print("Duplicate send pulse not found or already removed")

# =========================================================================
# 3. DEFINE BATTERY_MARKET_DATA FOR BATTERY EDIT MODAL
# =========================================================================
battery_market_data_code = """        /* ==========================================================================
           [BATTERY MARKET DATA] قاعدة بيانات بطاريات السوق ومواصفاتها
           ========================================================================== */
        const BATTERY_MARKET_DATA = {
            brands: [
                { id: 'chloride', name: 'كلورايد (Chloride Gold / Platinum) - رائد محلي', nameEn: 'Chloride (Gold / Platinum)' },
                { id: 'varta', name: 'فارتا (Varta: Black / Blue / Silver / AGM) - ألماني', nameEn: 'Varta (Black / Blue / Silver / AGM)' },
                { id: 'acdelco', name: 'إيه سي ديلكو (ACDelco Advantage / Professional)', nameEn: 'ACDelco (Advantage / Professional)' },
                { id: 'solite', name: 'سولايت (Solite) - كوري أصلي (هيونداي وكيا)', nameEn: 'Solite - Korean OEM (Hyundai / Kia)' },
                { id: 'energizer', name: 'إنرجايزر (Energizer Premium / AGM) - أمريكي ألماني', nameEn: 'Energizer (Premium / AGM)' },
                { id: 'mutlu', name: 'موتلو (Mutlu Calcium / EFB / AGM) - تركي ممتاز', nameEn: 'Mutlu (Calcium / EFB / AGM)' },
                { id: 'hankook', name: 'هانكوك / أتلس (Hankook / AtlasBX) - كوري ممتاز', nameEn: 'Hankook / AtlasBX' },
                { id: 'bosch', name: 'بوش (Bosch S4 / S5 / S6 AGM) - ألماني رائد', nameEn: 'Bosch (S4 / S5 / S6 AGM)' },
                { id: 'exide', name: 'إكسايد (Exide Start-Stop / AGM) - أوروبي رائد', nameEn: 'Exide (Start-Stop / AGM)' },
                { id: 'other', name: 'ماركة أخرى غير مدرجة...', nameEn: 'Other Brand...' }
            ],
            capacities: [
                { value: '35 Ah', label: '35 أمبير (Ah) - سيارات مدمجة شديدة الصغر (سوزوكي ماروتي / ألتو 800cc)', labelEn: '35 Ah - Subcompact Mini (Maruti, Alto)' },
                { value: '45 Ah', label: '45 أمبير (Ah) - هاتشباك وسيارة مدينة (بيكانتو، i10، ألتو K10، ياريس)', labelEn: '45 Ah - City Hatchback (Picanto, i10, Yaris)' },
                { value: '50 Ah', label: '50 أمبير (Ah) - مدمج خفيف (سويفت، ديزاير، بونتو، فييستا)', labelEn: '50 Ah - Compact (Swift, Dzire, Punto)' },
                { value: '55 Ah', label: '55 أمبير (Ah) - الأكثر شيوعاً (فيرنا، أكسنت، صني، لانوس، أفيو، لادا)', labelEn: '55 Ah - Popular Egyptian Market (Sunny, Verna, Lanos)' },
                { value: '60 Ah', label: '60 أمبير (Ah) - سيدان قياسي (كورولا، سيراتو، إلنترا، لانسر، إم جي 5، تيبو)', labelEn: '60 Ah - Standard Compact Sedan (Corolla, Cerato, Elantra)' },
                { value: '65 Ah', label: '65 أمبير (Ah) - سيدان متوسط وسيارات آسيوية متطورة (سيفيك، مازدا 3، سنترا، سوبارو XV)', labelEn: '65 Ah - Midsize (Civic, Mazda 3, Sentra, XV)' },
                { value: '70 Ah', label: '70 أمبير (Ah) - كروس أوفر وSUV (توسان، سبورتاج، قشقاي، داستر، بيجو 3008، تيجو)', labelEn: '70 Ah - Crossover & SUV (Tucson, Sportage, Qashqai)' },
                { value: '74 Ah', label: '74 - 75 أمبير (Ah) - سيارات أوروبية وفولكس فاجن (أوكتافيا، باسات، جولف، ميجان، أسترا)', labelEn: '74-75 Ah - European Standard (Octavia, Passat, Megane)' },
                { value: '80 Ah', label: '80 أمبير (Ah) - صالون ألماني فاخر ودفع رباعي (مرسيدس C/E، بي إم دبليو 3/5، جيب)', labelEn: '80 Ah - German Luxury (Mercedes, BMW, Jeep)' },
                { value: '90 Ah', label: '90 - 100 أمبير (Ah) - محركات V6/V8 ودفع رباعي كبير (لاندكروزر، باجيرو، جراند شيروكي)', labelEn: '90-100 Ah - Full-size SUV & V6/V8 (Land Cruiser, Pajero)' }
            ],
            types: [
                { value: 'SMF', label: 'جافة خالية من الصيانة (SMF / Calcium) - للسيارات العادية القياسية', labelEn: 'Sealed Maintenance Free (SMF / Calcium)' },
                { value: 'EFB', label: 'سائلة محسنة (EFB) - لأنظمة إطفاء المحرك الذاتي (Start/Stop) وسيارات مازدا وفيات', labelEn: 'Enhanced Flooded Battery (EFB) - Entry Start/Stop' },
                { value: 'AGM', label: 'فايبر جلاس ماص (AGM) - لأنظمة Start/Stop المتقدمة واسترجاع طاقة الفرامل والسيارات الفاخرة', labelEn: 'Absorbent Glass Mat (AGM) - Advanced Start/Stop & Luxury' }
            ]
        };

"""

if 'const BATTERY_MARKET_DATA =' not in html:
    open_battery_target = '        function openBatteryModal() {'
    assert open_battery_target in html, "Could not find function openBatteryModal() in index.html"
    html = html.replace(open_battery_target, battery_market_data_code + open_battery_target, 1)
    print("✓ Successfully added BATTERY_MARKET_DATA definition before openBatteryModal()")
else:
    print("BATTERY_MARKET_DATA already defined in index.html")

# =========================================================================
# 4. FIX CM MAINTENANCE FILTER AND ADD CM ITEM
# =========================================================================
# A. Update filterCatalog to handle CM add button properly without disabling pointer-events on the button
old_sub_block = """            // تحديث فلاتر الأقسام الفرعية التابعة للـ PM
            const subContainer = document.getElementById('pmSubCategoriesContainer');
            if (subContainer) {
                if (isMacroCM) {
                    subContainer.classList.add('opacity-40', 'pointer-events-none');
                } else {
                    subContainer.classList.remove('opacity-40', 'pointer-events-none');
                }
            }"""

new_sub_block = """            // تحديث فلاتر الأقسام الفرعية التابعة للـ PM مع إبقاء زر الإضافة نشطاً ومناسباً لنوع الصيانة المختار
            const subChips = document.getElementById('pmSubFilterChips');
            const subContainer = document.getElementById('pmSubCategoriesContainer');
            const addBtn = document.getElementById('mainScheduleAddCustomBtn');
            const isEn = appState.lang === 'en';

            if (subChips) {
                if (isMacroCM) {
                    subChips.classList.add('opacity-40', 'pointer-events-none');
                } else {
                    subChips.classList.remove('opacity-40', 'pointer-events-none');
                }
            } else if (subContainer) {
                // توافق تراجعي
                subContainer.classList.remove('pointer-events-none');
            }

            if (addBtn) {
                if (isMacroCM) {
                    addBtn.className = "px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95";
                    addBtn.onclick = () => openAddCustomPMModal('CM');
                    addBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-[11px]"></i> <span>${isEn ? '+ Add Urgent CM' : '+ إضافة صيانة عاجلة (CM)'}</span>`;
                } else {
                    addBtn.className = "px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95";
                    addBtn.onclick = () => openAddCustomPMModal('PM');
                    addBtn.innerHTML = `<i class="fa-solid fa-circle-plus text-[11px]"></i> <span data-i18n="btnAddCustomPM">${isEn ? 'Add Custom Item' : 'إضافة بند مخصص'}</span>`;
                }
            }"""

if old_sub_block in html:
    html = html.replace(old_sub_block, new_sub_block, 1)
    print("✓ Successfully updated filterCatalog sub-categories & CM dynamic button logic")
else:
    print("old_sub_block not found in html (checking...)")

# Add id="pmSubFilterChips" and id="mainScheduleAddCustomBtn" in HTML
old_chips_markup = """                        <!-- الصف الثاني: الأقسام الفرعية التابعة للصيانة الدورية (PM Sub-Categories) مع زر إضافة بند مخصص -->
                        <div id="pmSubCategoriesContainer" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5 transition-all duration-200">
                            <div class="flex flex-wrap items-center gap-2">
                                <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                    <i class="fa-solid fa-turn-down text-emerald-500 text-[10px] rotate-90 rtl:-rotate-90"></i>
                                    <span data-i18n="lblPmSubCategories">أقسام الصيانة الوقائية (PM):</span>
                                </div>
                                <!-- شرائح الفئات الفرعية -->
                                <div class="flex flex-wrap items-center gap-1.5">"""

new_chips_markup = """                        <!-- الصف الثاني: الأقسام الفرعية التابعة للصيانة الدورية (PM Sub-Categories) مع زر إضافة بند مخصص -->
                        <div id="pmSubCategoriesContainer" class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5 transition-all duration-200">
                            <div id="pmSubFilterChips" class="flex flex-wrap items-center gap-2 transition-all duration-200">
                                <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                    <i class="fa-solid fa-turn-down text-emerald-500 text-[10px] rotate-90 rtl:-rotate-90"></i>
                                    <span data-i18n="lblPmSubCategories">أقسام الصيانة الوقائية (PM):</span>
                                </div>
                                <!-- شرائح الفئات الفرعية -->
                                <div class="flex flex-wrap items-center gap-1.5">"""

if old_chips_markup in html:
    html = html.replace(old_chips_markup, new_chips_markup, 1)
    print("✓ Added id='pmSubFilterChips' to subcategories row")

old_add_btn_markup = """<button onclick="openAddCustomPMModal('PM')" type="button" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95">
                                        <i class="fa-solid fa-circle-plus text-[11px]"></i>
                                        <span data-i18n="btnAddCustomPM">إضافة بند مخصص</span>
                                    </button>"""

new_add_btn_markup = """<button id="mainScheduleAddCustomBtn" onclick="openAddCustomPMModal(appState.activeFilter === 'cm' ? 'CM' : 'PM')" type="button" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95">
                                        <i class="fa-solid fa-circle-plus text-[11px]"></i>
                                        <span data-i18n="btnAddCustomPM">إضافة بند مخصص</span>
                                    </button>"""

if old_add_btn_markup in html:
    html = html.replace(old_add_btn_markup, new_add_btn_markup, 1)
    print("✓ Added id='mainScheduleAddCustomBtn' with dynamic type support to add button")

# B. Update renderCatalogItems empty state and CM header
old_empty_block = """            if (filteredItems.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-2">
                        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                            <i class="fa-solid fa-filter"></i>
                        </div>
                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">${isEn ? 'No items in this category' : 'لا توجد بنود مطابقة لهذا التصنيف'}</h4>
                        <p class="text-xs text-slate-400">${isEn ? 'Try selecting another category or add a custom task.' : 'جرّب اختيار تصنيف آخر أو إضافة بند مخصص.'}</p>
                    </div>
                `;
                return;
            }"""

new_empty_block = """            if (filteredItems.length === 0) {
                if (activeFilter === 'cm') {
                    grid.innerHTML = `
                        <div class="col-span-full p-8 text-center rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-dashed border-rose-300 dark:border-rose-800 space-y-4 shadow-sm">
                            <div class="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                                <i class="fa-solid fa-wrench"></i>
                            </div>
                            <div class="space-y-1">
                                <h4 class="text-sm font-black text-slate-800 dark:text-slate-100">
                                    ${isEn ? 'No Urgent Corrective Maintenance (CM) Tasks' : 'لا توجد بلاغات أو مهام صيانة عاجلة (CM) مسجلة'}
                                </h4>
                                <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                    ${isEn 
                                        ? 'All vehicle systems are currently operating normally. If you encountered any sudden breakdown or urgent repair, add it here to track and alert.' 
                                        : 'كافة المنظومات تعمل بحالة طبيعية. إذا ظهر أي عطل طارئ أو كسر أو تلف مفاجئ بالمركبة، يمكنك إضافته هنا فوراً للمتابعة والتنبيه.'}
                                </p>
                            </div>
                            <div>
                                <button type="button" onclick="openAddCustomPMModal('CM')" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-rose-600/25 inline-flex items-center gap-2 active:scale-95">
                                    <i class="fa-solid fa-circle-plus text-sm"></i>
                                    <span>${isEn ? '+ Add Urgent CM Task' : '+ إضافة بند صيانة عاجلة / عطل طارئ (CM)'}</span>
                                </button>
                            </div>
                        </div>
                    `;
                    return;
                }
                grid.innerHTML = `
                    <div class="col-span-full py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                            <i class="fa-solid fa-filter"></i>
                        </div>
                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">${isEn ? 'No items in this category' : 'لا توجد بنود مطابقة لهذا التصنيف'}</h4>
                        <p class="text-xs text-slate-400">${isEn ? 'Try selecting another category or add a custom task.' : 'جرّب اختيار تصنيف آخر أو إضافة بند مخصص.'}</p>
                        <div>
                            <button type="button" onclick="openAddCustomPMModal('PM')" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center gap-2 active:scale-95">
                                <i class="fa-solid fa-circle-plus"></i>
                                <span>${isEn ? 'Add Custom Item' : 'إضافة بند مخصص'}</span>
                            </button>
                        </div>
                    </div>
                `;
                return;
            }"""

if old_empty_block in html:
    html = html.replace(old_empty_block, new_empty_block, 1)
    print("✓ Successfully updated renderCatalogItems empty states with rich CM add card")
else:
    print("old_empty_block not found in html (checking...)")

# Add top CM action header when activeFilter === 'cm' and items exist
old_cards_init = """            let cardsHtml = '';
            filteredItems.forEach(item => {"""

new_cards_init = """            let cardsHtml = '';
            if (activeFilter === 'cm') {
                cardsHtml += `
                    <div class="col-span-full flex flex-wrap items-center justify-between gap-3 p-3.5 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <div>
                                <h5 class="text-xs font-bold text-slate-900 dark:text-white">${isEn ? 'Urgent Corrective Maintenance (CM)' : 'مهام الصيانة العاجلة والأعطال الطارئة (CM)'}</h5>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400">${isEn ? 'Active repairs requiring immediate attention' : 'أعطال وإصلاحات فورية مسجلة تتطلب التدخل والمتابعة'}</p>
                            </div>
                        </div>
                        <button type="button" onclick="openAddCustomPMModal('CM')" class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
                            <i class="fa-solid fa-circle-plus"></i>
                            <span>${isEn ? '+ Add Another CM Task' : '+ إضافة صيانة عاجلة جديدة (CM)'}</span>
                        </button>
                    </div>
                `;
            }

            filteredItems.forEach(item => {"""

if old_cards_init in html:
    html = html.replace(old_cards_init, new_cards_init, 1)
    print("✓ Successfully added top CM action bar when activeFilter === 'cm'")
else:
    print("old_cards_init not found in html")

# =========================================================================
# 5. WRITE OUT INDEX.HTML AND MIRROR TO SRC/INDEX.HTML
# =========================================================================
with open(ROOT_INDEX, 'w', encoding='utf-8') as f:
    f.write(html)

shutil.copy2(ROOT_INDEX, SRC_INDEX)

h_root = hashlib.sha256(open(ROOT_INDEX, 'rb').read()).hexdigest()
h_src = hashlib.sha256(open(SRC_INDEX, 'rb').read()).hexdigest()
assert h_root == h_src, f"SHA mismatch! {h_root} != {h_src}"
print(f"✓ 100% SHA-256 Parity between root index.html and src/index.html: {h_root}")

# =========================================================================
# 6. BUMP SERVICE WORKER CACHE VERSION TO motorcare-cache-v2.0.26
# =========================================================================
new_cache_ver = 'motorcare-cache-v2.0.26'
sw_files = [
    'sw.js',
    'service-worker.js',
    os.path.join('src', 'sw.js'),
    os.path.join('src', 'service-worker.js')
]

sw_pattern = re.compile(r"const CACHE_NAME = 'motorcare-cache-v[^']+';")
for p in sw_files:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            c = f.read()
        c_new = sw_pattern.sub(f"const CACHE_NAME = '{new_cache_ver}';", c)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c_new)
        print(f"✓ Bumped cache version to {new_cache_ver} in {p}")

print("\nAll fixes successfully applied!")
