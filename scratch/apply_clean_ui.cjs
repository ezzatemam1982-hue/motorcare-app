const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Accordion for urgentAlertsContainer
const oldUrgentAlerts = `                    <div id="urgentAlertsContainer" class="hidden space-y-2">
                        <div class="text-rose-600 font-bold text-xs"><i class="fa-solid fa-triangle-exclamation animate-bounce ml-1"></i> <span data-i18n="urgentTitle">تنبيهات عاجلة تتطلب انتباهك:</span></div>
                        <div id="urgentAlertsList" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>
                    </div>`;

const newUrgentAlerts = `                    <!-- كرت تنبيهات الصيانة العاجلة المجمع والأنيق مع Accordion للطي والفرد -->
                    <div id="urgentAlertsContainer" class="hidden mb-3">
                        <div class="bg-gradient-to-r from-rose-50 via-rose-50/70 to-amber-50/40 dark:from-rose-950/40 dark:via-rose-950/30 dark:to-amber-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all">
                            <div onclick="toggleUrgentAlertsAccordion()" class="flex items-center justify-between cursor-pointer select-none">
                                <div class="flex items-center gap-2 min-w-0">
                                    <span class="w-7 h-7 rounded-xl bg-rose-500/15 dark:bg-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs shrink-0">
                                        <i class="fa-solid fa-triangle-exclamation animate-pulse"></i>
                                    </span>
                                    <h4 class="text-xs sm:text-sm font-black text-rose-800 dark:text-rose-200 truncate">
                                        ⚠️ <span data-i18n="urgentTitle">تنبيهات عاجلة تتطلب انتباهك</span> (<span id="urgentAlertsCount">0</span>)
                                    </h4>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <span id="urgentAlertsToggleHint" class="text-[10px] font-bold text-rose-600 dark:text-rose-400 hidden sm:inline">عرض / إخفاء</span>
                                    <button type="button" aria-label="Toggle alerts" class="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-300 flex items-center justify-center border border-rose-200/80 dark:border-rose-800 shadow-2xs cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                                        <i id="urgentAlertsChevron" class="fa-solid fa-chevron-down text-xs transition-transform duration-200"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="urgentAlertsListWrapper" class="mt-2.5 pt-2.5 border-t border-rose-200/70 dark:border-rose-900/50 transition-all duration-300">
                                <div id="urgentAlertsList" class="grid grid-cols-1 md:grid-cols-2 gap-2"></div>
                            </div>
                        </div>
                    </div>`;

if (content.includes(oldUrgentAlerts)) {
    content = content.replace(oldUrgentAlerts, newUrgentAlerts);
    console.log('[OK] Replaced urgentAlertsContainer with Accordion card');
} else {
    // Check line endings
    const oldNormalized = oldUrgentAlerts.replace(/\r\n/g, '\n');
    const contentNormalized = content.replace(/\r\n/g, '\n');
    if (contentNormalized.includes(oldNormalized)) {
        content = contentNormalized.replace(oldNormalized, newUrgentAlerts.replace(/\r\n/g, '\n'));
        console.log('[OK] Replaced urgentAlertsContainer (normalized)');
    } else {
        console.error('[FAIL] Could not match oldUrgentAlerts');
    }
}

// 2. Remove language and dark mode from top header
const oldHeaderButtons = `                    <!-- زر تبديل اللغة (عربي / EN) -->
                    <button onclick="toggleLanguage()" class="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition-all shadow-2xs active:scale-95 flex items-center gap-1 shrink-0" title="Language">
                        <i class="fa-solid fa-globe text-sky-500 text-[11px]"></i>
                        <span id="langBtnText" class="text-[11px] font-bold">EN</span>
                    </button>

                    <!-- زر تبديل المظهر (نهاري / ليلي) -->
                    <button onclick="toggleDarkMode()" class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 rounded-xl text-xs sm:text-sm cursor-pointer border border-slate-200 dark:border-slate-700 transition-all shadow-2xs active:scale-95 shrink-0" title="تبديل المظهر (Dark/Light)">
                        <i class="fa-solid fa-moon dark:hidden"></i>
                        <i class="fa-solid fa-sun hidden dark:inline"></i>
                    </button>`;

if (content.includes(oldHeaderButtons)) {
    content = content.replace(oldHeaderButtons, '');
    console.log('[OK] Removed Language and Dark Mode buttons from top header');
} else {
    const oldNorm = oldHeaderButtons.replace(/\r\n/g, '\n');
    const contentNorm = content.replace(/\r\n/g, '\n');
    if (contentNorm.includes(oldNorm)) {
        content = contentNorm.replace(oldNorm, '');
        console.log('[OK] Removed Language and Dark Mode buttons from top header (normalized)');
    } else {
        console.error('[FAIL] Could not match oldHeaderButtons');
    }
}

// 3. Add Language & Dark Mode inside topHeaderDropdownMenu (right after user profile card)
const targetDropdownProfileEnd = `                            <!-- جرس الإشعارات مدمج هنا -->
                            <button onclick="openNotificationsHubModal(); closeTopHeaderMenu();" id="headerNotificationBtn" class="relative p-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-500 rounded-xl text-xs cursor-pointer border border-slate-200 dark:border-slate-600 transition-colors shrink-0" title="مركز الإشعارات">
                                <i class="fa-solid fa-bell"></i>
                                <span id="headerNotificationBadge" class="hidden absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center shadow-sm animate-pulse">0</span>
                            </button>
                        </div>`;

const dropdownControls = `                            <!-- جرس الإشعارات مدمج هنا -->
                            <button onclick="openNotificationsHubModal(); closeTopHeaderMenu();" id="headerNotificationBtn" class="relative p-2 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-500 rounded-xl text-xs cursor-pointer border border-slate-200 dark:border-slate-600 transition-colors shrink-0" title="مركز الإشعارات">
                                <i class="fa-solid fa-bell"></i>
                                <span id="headerNotificationBadge" class="hidden absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white dark:ring-slate-900 flex items-center justify-center shadow-sm animate-pulse">0</span>
                            </button>
                        </div>

                        <!-- أزرار تبديل اللغة والمظهر داخل القائمة المنسدلة -->
                        <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                            <button type="button" onclick="toggleLanguage()" class="flex items-center justify-center gap-2 py-1.5 px-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                                <i class="fa-solid fa-globe text-sky-500 text-[11px]"></i>
                                <span class="text-[11px]">اللغة:</span>
                                <span class="langBtnText font-black text-sky-600 dark:text-sky-400 text-[11px]">EN</span>
                            </button>
                            <button type="button" onclick="toggleDarkMode()" class="flex items-center justify-center gap-2 py-1.5 px-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                                <i class="fa-solid fa-moon text-indigo-500 dark:hidden text-[11px]"></i>
                                <i class="fa-solid fa-sun text-amber-400 hidden dark:inline text-[11px]"></i>
                                <span class="text-[11px]" data-i18n="themeToggle">المظهر</span>
                            </button>
                        </div>`;

const targetNorm = targetDropdownProfileEnd.replace(/\r\n/g, '\n');
const contentNorm2 = content.replace(/\r\n/g, '\n');
if (contentNorm2.includes(targetNorm)) {
    content = contentNorm2.replace(targetNorm, dropdownControls.replace(/\r\n/g, '\n'));
    console.log('[OK] Added Language & Dark mode inside topHeaderDropdownMenu');
} else {
    console.error('[FAIL] Could not match targetDropdownProfileEnd');
}

// 4. Add Language & Dark Mode inside mobileMoreDrawerModal (right after header div)
const oldDrawerHeader = `            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <i class="fa-solid fa-grip text-sky-500"></i>
                    <span data-i18n="drawerTitle">أقسام وخدمات التطبيق</span>
                </div>
                <button onclick="closeMobileMoreDrawer()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>`;

const newDrawerHeader = `            <div class="drag-handle-bar sm:hidden"></div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <i class="fa-solid fa-grip text-sky-500"></i>
                    <span data-i18n="drawerTitle">أقسام وخدمات التطبيق</span>
                </div>
                <button onclick="closeMobileMoreDrawer()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- أزرار تبديل اللغة والمظهر داخل القائمة الجانبية (Drawer) -->
            <div class="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                <button type="button" onclick="toggleLanguage()" class="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                    <i class="fa-solid fa-globe text-sky-500"></i>
                    <span>اللغة:</span>
                    <span id="langBtnText" class="langBtnText font-black text-sky-600 dark:text-sky-400">EN</span>
                </button>
                <button type="button" onclick="toggleDarkMode()" class="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                    <i class="fa-solid fa-moon text-indigo-500 dark:hidden"></i>
                    <i class="fa-solid fa-sun text-amber-400 hidden dark:inline"></i>
                    <span data-i18n="themeToggle">المظهر</span>
                </button>
            </div>`;

const drawerNorm = oldDrawerHeader.replace(/\r\n/g, '\n');
const contentNorm3 = content.replace(/\r\n/g, '\n');
if (contentNorm3.includes(drawerNorm)) {
    content = contentNorm3.replace(drawerNorm, newDrawerHeader.replace(/\r\n/g, '\n'));
    console.log('[OK] Added Language & Dark mode inside mobileMoreDrawerModal');
} else {
    console.error('[FAIL] Could not match oldDrawerHeader');
}

fs.writeFileSync(filePath, content, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'index.html'), content, 'utf8');
console.log('Saved index.html and src/index.html');
