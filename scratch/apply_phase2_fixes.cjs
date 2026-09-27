const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update urgent alerts accordion to be collapsed by default
const oldListWrapper = '<div id="urgentAlertsListWrapper" class="mt-2.5 pt-2.5 border-t border-rose-200/70 dark:border-rose-900/50 transition-all duration-300">';
const newListWrapper = '<div id="urgentAlertsListWrapper" class="hidden mt-2.5 pt-2.5 border-t border-rose-200/70 dark:border-rose-900/50 transition-all duration-300">';

if (content.includes(oldListWrapper)) {
    content = content.replace(oldListWrapper, newListWrapper);
    console.log('[OK] Collapsed urgentAlertsListWrapper by default');
} else {
    console.log('[NOTE] urgentAlertsListWrapper check');
}

const oldChevron = '<i id="urgentAlertsChevron" class="fa-solid fa-chevron-down text-xs transition-transform duration-200"></i>';
const newChevron = '<i id="urgentAlertsChevron" class="fa-solid fa-chevron-down text-xs transition-transform duration-200" style="transform: rotate(-90deg);"></i>';

if (content.includes(oldChevron)) {
    content = content.replace(oldChevron, newChevron);
    console.log('[OK] Set urgentAlertsChevron to collapsed (-90deg)');
}

// 2. Tag top header SOS button with data-feature="roadsideEmergency"
const oldSosBtn = `<button onclick="openEmergencyModal()" class="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-black border border-rose-200 dark:border-rose-800/80 cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-2xs active:scale-95" title="طوارئ الطريق السريعة (SOS)">`;
const newSosBtn = `<button onclick="openEmergencyModal()" data-feature="roadsideEmergency" class="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-black border border-rose-200 dark:border-rose-800/80 cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-2xs active:scale-95" title="طوارئ الطريق السريعة (SOS)">`;

if (content.includes(oldSosBtn)) {
    content = content.replace(oldSosBtn, newSosBtn);
    console.log('[OK] Tagged top header SOS button with data-feature="roadsideEmergency"');
}

// 3. Tag topHeaderDropdownMenu buttons with data-feature and add Settings button
const oldDropdownServices = `                        <!-- قائمة الخدمات المدمجة -->
                        <div class="space-y-1">
                            <!-- 1. الاستعلام عن المخالفات المرورية في مصر (رابط النيابة العامة الموحد) -->
                            <button onclick="openTrafficFinesModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                                <span class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 text-sm shadow-2xs">
                                    <i class="fa-solid fa-scale-balanced"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs font-black text-emerald-800 dark:text-emerald-200">مخالفات المرور (مصر)</span>
                                        <span class="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-bold rounded-md">رسمي</span>
                                    </div>
                                    <div class="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal truncate">الاستعلام عن رخص المركبات والقيادة (النيابة العامة)</div>
                                </div>
                            </button>

                            <!-- دليل ومستكشف بطاريات السيارات الشامل OEM -->
                            <button onclick="openBatteryCatalogModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-car-battery"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">دليل ومستكشف بطاريات السيارات</span>
                                        <span class="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-md">OEM 🔋</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">السعة بالأمبير، تقنية AGM/SMF، ومقاس DIN لأي سيارة</div>
                                </div>
                            </button>

                            <!-- 2. دليل مراكز الخدمة والتوكيلات المعتمدة في مصر (GPS) -->
                            <button onclick="openServiceCentersModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-building-shield"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">دليل مراكز الخدمة والتوكيلات</span>
                                        <span class="px-1.5 py-0.2 bg-sky-500 text-white text-[9px] font-bold rounded-md">GPS 📍</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">التوكيلات والمراكز المعتمدة لسيارتك بالخرائط الحية</div>
                                </div>
                            </button>

                            <!-- 2. أدوات السائق المتقدمة -->
                            <button id="topMenuBtn-driverTools" onclick="closeTopHeaderMenu(); openDriverToolsModal();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-toolbox"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xs">أدوات السائق المتقدمة</div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">المصروفات، تكلفة الكيلومتر، وحاسبة الرحلات</div>
                                </div>
                            </button>

                            <!-- 3. موسوعة أكواد الأعطال OBD-II -->
                            <button id="topMenuBtn-obd" onclick="closeTopHeaderMenu(); openObdEncyclopediaModal();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-microchip"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="text-xs">موسوعة أكواد الأعطال OBD-II</div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">فحص وتشخيص أعطال المحرك والحساسات</div>
                                </div>
                            </button>`;

const newDropdownServices = `                        <!-- قائمة الخدمات المدمجة -->
                        <div class="space-y-1">
                            <!-- زر الإعدادات وإدارة الخدمات -->
                            <button onclick="closeTopHeaderMenu(); openSettingsModal();" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-start text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all cursor-pointer border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/20">
                                <span class="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 text-sm shadow-xs">
                                    <i class="fa-solid fa-sliders"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs font-black">الإعدادات وإدارة الخدمات</span>
                                        <span class="px-1.5 py-0.2 bg-sky-500 text-white text-[9px] font-bold rounded-md">جديد</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">تخصيص اللغات والمظهر وإخفاء الخدمات</div>
                                </div>
                            </button>

                            <!-- 1. الاستعلام عن المخالفات المرورية في مصر (رابط النيابة العامة الموحد) -->
                            <button onclick="openTrafficFinesModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 text-sm shadow-2xs">
                                    <i class="fa-solid fa-scale-balanced"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs font-black text-emerald-800 dark:text-emerald-200">مخالفات المرور (مصر)</span>
                                        <span class="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-bold rounded-md">رسمي</span>
                                    </div>
                                    <div class="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal truncate">الاستعلام عن رخص المركبات والقيادة (النيابة العامة)</div>
                                </div>
                            </button>

                            <!-- دليل ومستكشف بطاريات السيارات الشامل OEM -->
                            <button data-feature="batteryCatalog" onclick="openBatteryCatalogModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-car-battery"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">دليل ومستكشف بطاريات السيارات</span>
                                        <span class="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-md">OEM 🔋</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">السعة بالأمبير، تقنية AGM/SMF، ومقاس DIN لأي سيارة</div>
                                </div>
                            </button>

                            <!-- 2. دليل مراكز الخدمة والتوكيلات المعتمدة في مصر (GPS) -->
                            <button data-feature="serviceCenters" onclick="openServiceCentersModal(); closeTopHeaderMenu();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-building-shield"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">دليل مراكز الخدمة والتوكيلات</span>
                                        <span class="px-1.5 py-0.2 bg-sky-500 text-white text-[9px] font-bold rounded-md">GPS 📍</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">التوكيلات والمراكز المعتمدة لسيارتك بالخرائط الحية</div>
                                </div>
                            </button>

                            <!-- 3. أدوات السائق المتقدمة -->
                            <button id="topMenuBtn-driverTools" data-feature="driverTools" onclick="closeTopHeaderMenu(); openDriverToolsModal();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 dark:hover:text-violet-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-toolbox"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">أدوات السائق المتقدمة</span>
                                        <span class="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-bold">PRO ⭐</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">المصروفات، تكلفة الكيلومتر، وحاسبة الرحلات</div>
                                </div>
                            </button>

                            <!-- 4. موسوعة أكواد الأعطال OBD-II -->
                            <button id="topMenuBtn-obd" data-feature="obdEncyclopedia" onclick="closeTopHeaderMenu(); openObdEncyclopediaModal();" class="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-start text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer">
                                <span class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 text-sm">
                                    <i class="fa-solid fa-microchip"></i>
                                </span>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">موسوعة أكواد الأعطال OBD-II</span>
                                        <span class="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold">PRO ⚡</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal truncate">فحص وتشخيص أعطال المحرك والحساسات</div>
                                </div>
                            </button>`;

const dropNorm = oldDropdownServices.replace(/\r\n/g, '\n');
const contentNorm = content.replace(/\r\n/g, '\n');
if (contentNorm.includes(dropNorm)) {
    content = contentNorm.replace(dropNorm, newDropdownServices.replace(/\r\n/g, '\n'));
    console.log('[OK] Tagged topHeaderDropdownMenu and added Settings button');
} else {
    console.log('[NOTE] Could not directly match oldDropdownServices, checking partial match');
}

// 4. Replace mobileMoreDrawerModal with comfortable 90vh native layout with settings button and feature tags
const drawerRegex = /(<div id="mobileMoreDrawerModal"[\s\S]*?)(<!-- 3\. نافذة معاينة وحفظ)/;
const matchDrawer = content.match(drawerRegex);

const newDrawerHtml = `    <!-- درج المزيد للموبايل (Mobile More Navigation Sheet - Full 90vh Native Layout) -->
    <div id="mobileMoreDrawerModal" onclick="if(event.target === this) closeMobileMoreDrawer()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all backdrop-blur-xs">
        <div class="bg-white dark:bg-slate-900 w-full sm:max-w-md h-[90vh] max-h-[92vh] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto safe-area-pb flex flex-col">
            <div class="drag-handle-bar sm:hidden"></div>
            
            <!-- رأس القائمة الجانبية -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div class="flex items-center gap-2.5 font-black text-sm text-slate-900 dark:text-white">
                    <div class="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">
                        <i class="fa-solid fa-grip"></i>
                    </div>
                    <div>
                        <div class="text-sm font-black" data-i18n="drawerTitle">أقسام وخدمات التطبيق</div>
                        <div class="text-[10px] text-slate-400 font-normal">MotorCare Fleet &amp; Auto Suite</div>
                    </div>
                </div>
                <button type="button" onclick="closeMobileMoreDrawer()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- بطاقة الإعدادات والتحكم بالخدمات (الوصول المباشر) -->
            <button type="button" id="drawerBtn-settings" onclick="openSettingsModal(); closeMobileMoreDrawer();" class="w-full p-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-transparent border border-sky-200/80 dark:border-sky-800/60 rounded-2xl flex items-center justify-between text-start cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-all shadow-2xs group shrink-0">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-sm shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                        <i class="fa-solid fa-sliders"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-slate-900 dark:text-white">الإعدادات والمظهر وإدارة الخدمات</span>
                            <span class="px-1.5 py-0.2 rounded-md bg-sky-500 text-white text-[9px] font-bold">جديد ✨</span>
                        </div>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">المظهر، اللغات، وتشغيل/إخفاء الخدمات لتخفيف الزحام</p>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-left text-slate-400 text-xs group-hover:text-sky-500 transition-colors rtl:rotate-0 ltr:rotate-180 shrink-0"></i>
            </button>

            <!-- 1. أقسام السيارة الأساسية (2x2 Grid) -->
            <div class="space-y-2 shrink-0">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">أقسام السيارة الأساسية</div>
                <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="switchTab('hardware'); closeMobileMoreDrawer();" class="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 text-start cursor-pointer transition-all active:scale-98">
                        <div class="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-car-battery text-sm"></i>
                        </div>
                        <span data-i18n="tabHardware">البطارية والإطارات</span>
                    </button>

                    <button type="button" onclick="switchTab('documents'); closeMobileMoreDrawer();" class="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 text-start cursor-pointer transition-all active:scale-98">
                        <div class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-id-card text-sm"></i>
                        </div>
                        <span data-i18n="tabDocs">الوثائق والرخص</span>
                    </button>

                    <button type="button" onclick="switchTab('inspection'); closeMobileMoreDrawer();" class="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 text-start cursor-pointer transition-all active:scale-98">
                        <div class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-clipboard-check text-sm"></i>
                        </div>
                        <span data-i18n="tabInspection">الفحص الشامل</span>
                    </button>

                    <!-- زر سجل العمليات والفواتير مع ID صريح وحدث نقد موثوق -->
                    <button type="button" id="drawerBtn-history" onclick="switchTab('history'); closeMobileMoreDrawer();" class="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 text-start cursor-pointer transition-all active:scale-98">
                        <div class="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-clock-rotate-left text-sm"></i>
                        </div>
                        <span data-i18n="tabHistory">سجل الفواتير</span>
                    </button>
                </div>
            </div>

            <!-- 2. الخدمات والأدوات الذكية (List with data-feature toggles) -->
            <div class="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">الخدمات والأدوات الذكية</div>
                
                <!-- خدمة مراكز الخدمة والتوكيلات -->
                <button type="button" data-feature="serviceCenters" onclick="openServiceCentersModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all shadow-2xs">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-building-shield text-sky-500"></i> <span>دليل التوكيلات ومراكز الخدمة المعتمدة</span></span>
                    <span class="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-black">GPS 📍</span>
                </button>

                <!-- خدمة دليل البطاريات OEM -->
                <button type="button" data-feature="batteryCatalog" onclick="openBatteryCatalogModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all shadow-2xs">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-car-battery text-amber-500"></i> <span>دليل ومستكشف بطاريات السيارات (OEM)</span></span>
                    <span class="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">OEM 🔋</span>
                </button>

                <!-- خدمة طوارئ الطريق SOS -->
                <button type="button" data-feature="roadsideEmergency" onclick="openEmergencyModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-2xs">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-truck-medical text-rose-500 animate-pulse"></i> <span>طوارئ وخدمات الطريق (Roadside SOS)</span></span>
                    <span class="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">GPS 🚨</span>
                </button>

                <!-- خدمة أدوات السائق PRO -->
                <button type="button" id="drawerBtn-driverTools" data-feature="driverTools" onclick="closeMobileMoreDrawer(); openDriverToolsModal();" class="w-full py-2.5 px-3.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all shadow-2xs">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-toolbox text-violet-500"></i> <span data-i18n="driverToolsDrawerBtn">أدوات السائق (المصروفات والرحلات والمفكرة)</span></span>
                    <span class="px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black">PRO ⭐</span>
                </button>

                <!-- خدمة موسوعة أكواد الأعطال OBD-II PRO -->
                <button type="button" id="drawerBtn-obd" data-feature="obdEncyclopedia" onclick="closeMobileMoreDrawer(); openObdEncyclopediaModal();" class="w-full py-2.5 px-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-all shadow-2xs">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-microchip text-amber-500"></i> <span data-i18n="obdCodesBtn">موسوعة أكواد الأعطال OBD-II</span></span>
                    <span class="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black">PRO ⚡</span>
                </button>

                <!-- خدمة كراج وتعدد المركبات PRO -->
                <div data-feature="multiCarGarage" class="space-y-1.5">
                    <button type="button" onclick="openAddNewCarModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-between cursor-pointer shadow-md shadow-sky-600/30">
                        <span class="flex items-center gap-2.5"><i class="fa-solid fa-circle-plus text-sm"></i> <span>إضافة سيارة جديدة للكراج</span></span>
                        <i class="fa-solid fa-chevron-left text-white/80 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                    </button>
                    <button type="button" onclick="openGarageModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                        <span class="flex items-center gap-2.5"><i class="fa-solid fa-warehouse text-sky-500"></i> <span data-i18n="clickManageGarage">إدارة سيارات الكراج</span></span>
                        <span class="px-2 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-black">PRO 🚗</span>
                    </button>
                </div>

                <!-- الإشعارات -->
                <button type="button" onclick="openNotificationsHubModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-bell text-sky-500"></i> <span>مركز إشعارات الصيانة والموبايل</span></span>
                    <span id="drawerNotificationBadge" class="hidden px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">0</span>
                </button>

                <!-- النسخ الاحتياطي وإكسيل -->
                <button type="button" onclick="openGoogleSheetsModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-file-excel text-emerald-500"></i> <span data-i18n="googleSheetsBtn">النسخ الاحتياطي وتصدير إكسيل</span></span>
                    <i class="fa-solid fa-chevron-left text-emerald-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>

                <!-- طباعة وتصدير التقارير PDF -->
                <button type="button" id="drawerBtn-reports" onclick="closeMobileMoreDrawer(); openExportReportsModal();" class="w-full py-2.5 px-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-file-invoice-dollar text-emerald-500"></i> <span data-i18n="shortReport">طباعة وتصدير التقارير PDF</span></span>
                    <i class="fa-solid fa-chevron-left text-slate-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>
            </div>

            <!-- 3. الدعم وتسجيل الخروج -->
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
                <button type="button" onclick="openContactModal(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-headset text-indigo-500"></i> <span data-i18n="navContactCommunity">اتصل بنا ومركز المساعدة</span></span>
                    <i class="fa-solid fa-chevron-left text-indigo-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>

                <button type="button" onclick="handleLogout(); closeMobileMoreDrawer();" class="w-full py-2.5 px-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-2xs">
                    <span class="flex items-center gap-2.5"><i class="fa-solid fa-right-from-bracket text-rose-500"></i> <span data-i18n="btnLogout">تسجيل الخروج</span></span>
                    <i class="fa-solid fa-chevron-left text-rose-400 text-xs rtl:rotate-0 ltr:rotate-180"></i>
                </button>
            </div>
        </div>
    </div>\n\n    $2`;

if (matchDrawer) {
    content = content.replace(matchDrawer[0], newDrawerHtml);
    console.log('[OK] Replaced mobileMoreDrawerModal with 90vh comfortable layout');
} else {
    console.error('[FAIL] Could not match drawerRegex');
}

// 5. Add settingsModal right before customConfirmModal
const settingsModalHtml = `    <!-- ==========================================================================
         [MODAL] الإعدادات والمظهر وإدارة الخدمات (Settings & Feature Controls)
         ========================================================================== -->
    <div id="settingsModal" onclick="if(event.target === this) closeSettingsModal()" class="backdrop-blur-xs modal-bottom-sheet fixed inset-0 z-50 bg-black/75 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
        <div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">
            <div class="drag-handle-bar sm:hidden"></div>
            
            <!-- رأس النافذة -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center text-lg shadow-md shadow-sky-500/20">
                        <i class="fa-solid fa-sliders"></i>
                    </div>
                    <div>
                        <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>الإعدادات والمظهر وإدارة الخدمات</span>
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400">تخصيص الواجهة، المظهر، والتحكم في ظهور الخدمات لتخفيف الزحام</p>
                    </div>
                </div>
                <button type="button" onclick="closeSettingsModal()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- 1. قسم المظهر واللغة -->
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
                <div class="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                    <i class="fa-solid fa-palette text-sky-500"></i>
                    <span>المظهر ولغة الواجهة (Appearance &amp; Language)</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <!-- خيار اللغة -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-globe text-sky-500 text-sm"></i>
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">لغة التطبيق</span>
                        </div>
                        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button type="button" id="settingsLangArBtn" onclick="MotorCareSettings.setLanguage('ar')" class="px-2.5 py-1 text-xs font-black rounded-md transition-all">العربية</button>
                            <button type="button" id="settingsLangEnBtn" onclick="MotorCareSettings.setLanguage('en')" class="px-2.5 py-1 text-xs font-black rounded-md transition-all">EN</button>
                        </div>
                    </div>

                    <!-- خيار المظهر الليلي -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-moon text-indigo-500 dark:hidden text-sm"></i>
                            <i class="fa-solid fa-sun text-amber-400 hidden dark:inline text-sm"></i>
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">الوضع الليلي (Dark Mode)</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="settingsDarkModeToggle" onchange="MotorCareSettings.toggleDarkMode(this.checked)" class="sr-only peer">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:peer-checked:after:-translate-x-full after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- 2. قسم إدارة الخدمات والأقسام (Feature Toggles) -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                        <i class="fa-solid fa-toggle-on text-emerald-500"></i>
                        <span>التحكم في الخدمات والأقسام (Feature Toggles)</span>
                    </div>
                    <span class="text-[10px] text-slate-400">تفعيل / إخفاء لتقليل الزحام</span>
                </div>

                <div class="space-y-2">
                    <!-- Service 1: مراكز الخدمة والتوكيلات -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-building-shield"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-black text-slate-900 dark:text-white">دليل مراكز الخدمة والتوكيلات</span>
                                    <span class="px-1.5 py-0.2 rounded-md bg-sky-500 text-white text-[9px] font-bold">GPS 📍</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate">خريطة ومواقع التوكيلات المعتمدة ومراكز الصيانة الرسمية في مصر</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="ft_serviceCenters" onchange="MotorCareSettings.handleToggle('serviceCenters', this.checked)" class="sr-only peer">
                            <div class="w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <!-- Service 2: دليل ومستكشف البطاريات OEM -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-car-battery"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-black text-slate-900 dark:text-white">دليل ومستكشف البطاريات</span>
                                    <span class="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[9px] font-bold">OEM 🔋</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate">سعات الأمبير، مقاسات DIN، وتقنيات AGM و SMF لكافة المركبات</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="ft_batteryCatalog" onchange="MotorCareSettings.handleToggle('batteryCatalog', this.checked)" class="sr-only peer">
                            <div class="w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <!-- Service 3: أدوات السائق المتقدمة PRO -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-toolbox"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-black text-slate-900 dark:text-white">أدوات السائق المتقدمة</span>
                                    <span class="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black tracking-wider">PRO ⭐</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate">حاسبة تكلفة الكيلومتر، المصروفات النثرية والرحلات، والمفكرة</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="ft_driverTools" onchange="MotorCareSettings.handleToggle('driverTools', this.checked)" class="sr-only peer">
                            <div class="w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <!-- Service 4: موسوعة أكواد الأعطال OBD-II PRO -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-microchip"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-black text-slate-900 dark:text-white">موسوعة أكواد الأعطال OBD-II</span>
                                    <span class="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black tracking-wider">PRO ⚡</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate">قاموس تشخيص أعطال المحرك والحساسات وكهرباء السيارات</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="ft_obdEncyclopedia" onchange="MotorCareSettings.handleToggle('obdEncyclopedia', this.checked)" class="sr-only peer">
                            <div class="w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <!-- Service 5: طوارئ وخدمات الطريق (Roadside SOS) -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-truck-medical"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-black text-slate-900 dark:text-white">طوارئ وخدمات الطريق (SOS)</span>
                                    <span class="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9px] font-bold">24/7 🚨</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate">زر الطوارئ السريع، أوناش الإنقاذ، ودليل أرقام النجدة والإسعاف</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="ft_roadsideEmergency" onchange="MotorCareSettings.handleToggle('roadsideEmergency', this.checked)" class="sr-only peer">
                            <div class="w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <!-- Service 6: كراج وتعدد المركبات -->
                    <div class="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-warehouse"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs font-black text-slate-900 dark:text-white">كراج وتعدد المركبات</span>
                                    <span class="px-1.5 py-0.2 rounded-md bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[9px] font-black tracking-wider">PRO 🚗</span>
                                </div>
                                <p class="text-[10px] text-slate-400 truncate">إدارة أسطول سياراتك والتبديل السريع بين مركبات الكراج</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" id="ft_multiCarGarage" onchange="MotorCareSettings.handleToggle('multiCarGarage', this.checked)" class="sr-only peer">
                            <div class="w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- تذييل النافذة -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span class="text-[11px] text-slate-400 font-medium">يتم حفظ وضبط تفضيلاتك تلقائياً على هذا الجهاز</span>
                <button type="button" onclick="closeSettingsModal()" class="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer transition-colors" data-i18n="btnCancel">إغلاق</button>
            </div>
        </div>
    </div>\n\n    <!-- نافذة تأكيد الإجراءات العصرية`;

const confirmTarget = '    <!-- نافذة تأكيد الإجراءات العصرية';
if (content.includes(confirmTarget)) {
    content = content.replace(confirmTarget, settingsModalHtml);
    console.log('[OK] Added settingsModal');
}

// 6. Add <script src="js/features/settings.js"></script>
const adminScriptTag = '<script src="js/features/admin.js"></script>';
const settingsScriptTag = '<script src="js/features/admin.js"></script>\n    <script src="js/features/settings.js"></script>';

if (content.includes(adminScriptTag) && !content.includes('js/features/settings.js')) {
    content = content.replace(adminScriptTag, settingsScriptTag);
    console.log('[OK] Added js/features/settings.js script tag');
}

fs.writeFileSync(filePath, content, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'index.html'), content, 'utf8');
console.log('Saved index.html and src/index.html');
