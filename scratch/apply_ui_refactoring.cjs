const fs = require('fs');

function refactorHtml(content) {
    let updated = content;

    // 1. Refactor urgentAlertsContainer
    const oldAlertsRegex = /<div id="urgentAlertsContainer" class="hidden space-y-2">[\s\S]*?<div id="urgentAlertsList" class="grid grid-cols-1 md:grid-cols-2 gap-3"><\/div>\s*<\/div>/;
    const newAlertsHtml = `<!-- كرت تنبيهات الصيانة العاجلة المجمع والأنيق مع Accordion للطي والفرد -->
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
                            <!-- القائمة المجمعة للبنود المستحقة -->
                            <div id="urgentAlertsListWrapper" class="mt-2.5 pt-2.5 border-t border-rose-200/70 dark:border-rose-900/50 transition-all duration-300">
                                <div id="urgentAlertsList" class="grid grid-cols-1 md:grid-cols-2 gap-2"></div>
                            </div>
                        </div>
                    </div>`;

    if (oldAlertsRegex.test(updated)) {
        updated = updated.replace(oldAlertsRegex, newAlertsHtml);
        console.log('✓ urgentAlertsContainer successfully transformed to Accordion.');
    } else {
        console.warn('⚠️ urgentAlertsContainer regex did not match, checking alternative.');
    }

    // 2. Remove language toggle and dark mode toggle from top header
    const headerBtnsRegex = /<!-- زر تبديل اللغة \(عربي \/ EN\) -->[\s\S]*?<!-- زر تبديل المظهر \(نهاري \/ ليلي\) -->[\s\S]*?<\/button>\s*/;
    if (headerBtnsRegex.test(updated)) {
        updated = updated.replace(headerBtnsRegex, '');
        console.log('✓ Header buttons (Language & Dark Mode) removed from top bar.');
    } else {
        console.warn('⚠️ Header buttons regex did not match.');
    }

    // 3. Add Language and Theme controls into mobileMoreDrawerModal
    const drawerHeaderRegex = /(<div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">[\s\S]*?<\/div>)/;
    const drawerControls = `$1\n\n            <!-- أزرار التحكم بالمظهر واللغة داخل الـ Drawer -->
            <div class="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
                <button type="button" onclick="toggleLanguage()" class="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                    <i class="fa-solid fa-globe text-sky-500"></i>
                    <span>اللغة:</span>
                    <span id="langBtnText" class="font-black text-sky-600 dark:text-sky-400">EN</span>
                </button>
                <button type="button" onclick="toggleDarkMode()" class="flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all active:scale-95">
                    <i class="fa-solid fa-moon text-indigo-500 dark:hidden"></i>
                    <i class="fa-solid fa-sun text-amber-400 hidden dark:inline"></i>
                    <span data-i18n="themeToggle">المظهر</span>
                </button>
            </div>`;

    if (drawerHeaderRegex.test(updated) && !updated.includes('<!-- أزرار التحكم بالمظهر واللغة داخل الـ Drawer -->')) {
        updated = updated.replace(drawerHeaderRegex, drawerControls);
        console.log('✓ Language & Theme toggles added to Drawer.');
    }

    return updated;
}

const html = fs.readFileSync('index.html', 'utf8');
const processed = refactorHtml(html);
fs.writeFileSync('index.html', processed, 'utf8');
fs.writeFileSync('src/index.html', processed, 'utf8');
console.log('index.html & src/index.html updated successfully.');
