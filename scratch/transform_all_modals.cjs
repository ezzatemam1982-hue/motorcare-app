const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// First fix the drawer header if needed
const drawerFixSearch = `            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <i class="fa-solid fa-grip text-sky-500"></i>
                    <span data-i18n="drawerTitle">أقسام وخدمات التطبيق</span>
                </div>

            <!-- أزرار التحكم بالمظهر واللغة داخل الـ Drawer -->
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
            </div>
                <button onclick="closeMobileMoreDrawer()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>`;

const drawerFixReplace = `            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <i class="fa-solid fa-grip text-sky-500"></i>
                    <span data-i18n="drawerTitle">أقسام وخدمات التطبيق</span>
                </div>
                <button type="button" onclick="closeMobileMoreDrawer()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
                    <i class="fa-solid fa-xmark text-sm"></i>
                </button>
            </div>

            <!-- أزرار التحكم بالمظهر واللغة داخل الـ Drawer -->
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

if (content.includes(drawerFixSearch)) {
    content = content.replace(drawerFixSearch, drawerFixReplace);
    console.log('✓ Drawer header structure corrected.');
}

// Modal transformation definitions
const modalConfigs = [
  {
    id: 'recordModal',
    closeFn: 'closeRecordModal()',
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-\[90vh\] flex flex-col overflow-hidden text-start shadow-2xl border border-slate-200 dark:border-slate-800">/,
    newOuter: '<div id="recordModal" onclick="if(event.target === this) closeRecordModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden text-start shadow-2xl border border-slate-200 dark:border-slate-800 safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'fuelModal',
    closeFn: 'closeFuelModal()',
    oldOuterRegex: /<div id="fuelModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800">[\s\S]*?<h4 class="font-black text-sm text-slate-900 dark:text-white" data-i18n="modalFuelTitle">تسجيل تفويلة بنزين<\/h4>/,
    newOuter: '<div id="fuelModal" onclick="if(event.target === this) closeFuelModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: `<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">
            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->
            <div class="drag-handle-bar sm:hidden"></div>
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h4 class="font-black text-sm text-slate-900 dark:text-white" data-i18n="modalFuelTitle">تسجيل تفويلة بنزين</h4>
                <button type="button" onclick="closeFuelModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>`
  },
  {
    id: 'driverToolsModal',
    closeFn: 'closeDriverToolsModal()',
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-\[92vh\] flex flex-col">/,
    newOuter: '<div id="driverToolsModal" onclick="if(event.target === this) closeDriverToolsModal()" class="fixed inset-0 z-[99999] bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300" style="z-index: 99999 !important;">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-t-3xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 max-h-[88vh] flex flex-col safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'serviceCentersModal',
    closeFn: 'closeServiceCentersModal()',
    oldOuterRegex: /<div id="serviceCentersModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-h-\[92vh\] flex flex-col safe-area-pb">/,
    newOuter: '<div id="serviceCentersModal" onclick="if(event.target === this) closeServiceCentersModal()" class="fixed inset-0 z-50 bg-black/75 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] flex flex-col safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'customReportExportModal',
    closeFn: 'closeExportReportsModal()',
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-\[92vh\] flex flex-col">/,
    newOuter: '<div id="customReportExportModal" onclick="if(event.target === this) closeExportReportsModal()" class="fixed inset-0 z-[99999] bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300" style="z-index: 99999 !important;">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 max-h-[88vh] flex flex-col safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'contactCommunityModal',
    closeFn: 'closeContactModal()',
    oldOuterRegex: /<div id="contactCommunityModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 text-start shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden my-auto">/,
    newOuter: '<div id="contactCommunityModal" onclick="if(event.target === this) closeContactModal()" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet transition-all duration-300 overflow-y-auto">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'obdEncyclopediaModal',
    closeFn: 'closeObdEncyclopediaModal()',
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 max-h-\[92vh\] flex flex-col">/,
    newOuter: '<div id="obdEncyclopediaModal" onclick="if(event.target === this) closeObdEncyclopediaModal()" class="fixed inset-0 z-[99999] bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300" style="z-index: 99999 !important;">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-t-3xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 max-h-[88vh] flex flex-col safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'batteryModal',
    closeFn: 'closeBatteryModal()',
    oldOuterRegex: /<div id="batteryModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-\[90vh\] overflow-y-auto">/,
    newOuter: '<div id="batteryModal" onclick="if(event.target === this) closeBatteryModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'batteryCatalogModal',
    closeFn: 'closeBatteryCatalogModal()',
    oldOuterRegex: /<div id="batteryCatalogModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-\[90vh\] overflow-y-auto">/,
    newOuter: '<div id="batteryCatalogModal" onclick="if(event.target === this) closeBatteryCatalogModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'tiresDetailModal',
    closeFn: 'closeTiresDetailModal()',
    oldOuterRegex: /<div id="tiresDetailModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800">/,
    newOuter: '<div id="tiresDetailModal" onclick="if(event.target === this) closeTiresDetailModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'emergencyModal',
    closeFn: 'closeEmergencyModal()',
    oldOuterRegex: /<div id="emergencyModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-5 sm:p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-\[92vh\] overflow-y-auto safe-area-pb">/,
    newOuter: '<div id="emergencyModal" onclick="if(event.target === this) closeEmergencyModal()" class="fixed inset-0 z-50 bg-black/75 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'documentsModal',
    closeFn: 'closeDocumentsModal()',
    oldOuterRegex: /<div id="documentsModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-\[90vh\] flex flex-col p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto">/,
    newOuter: '<div id="documentsModal" onclick="if(event.target === this) closeDocumentsModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'trafficFinesModal',
    closeFn: 'closeTrafficFinesModal()',
    oldOuterRegex: /<div id="trafficFinesModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-\[92vh\] overflow-y-auto safe-area-pb">/,
    newOuter: '<div id="trafficFinesModal" onclick="if(event.target === this) closeTrafficFinesModal()" class="fixed inset-0 z-50 bg-black/75 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'notificationsHubModal',
    closeFn: 'closeNotificationsHubModal()',
    oldOuterRegex: /<div id="notificationsHubModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-5 sm:p-6 space-y-5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-\[90vh\] overflow-y-auto safe-area-pb">/,
    newOuter: '<div id="notificationsHubModal" onclick="if(event.target === this) closeNotificationsHubModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'addCustomPMModal',
    closeFn: 'closeAddCustomPMModal()',
    oldOuterRegex: /<div id="addCustomPMModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800">/,
    newOuter: '<div id="addCustomPMModal" onclick="if(event.target === this) closeAddCustomPMModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'editCatalogItemModal',
    closeFn: 'closeEditCatalogItemModal()',
    oldOuterRegex: /<div id="editCatalogItemModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800">/,
    newOuter: '<div id="editCatalogItemModal" onclick="if(event.target === this) closeEditCatalogItemModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'garageModal',
    closeFn: 'closeGarageModal()',
    oldOuterRegex: /<div id="garageModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800">/,
    newOuter: '<div id="garageModal" onclick="if(event.target === this) closeGarageModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'addNewCarModal',
    closeFn: 'closeAddNewCarModal()',
    oldOuterRegex: /<div id="addNewCarModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-\[92vh\] flex flex-col text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">/,
    newOuter: '<div id="addNewCarModal" onclick="if(event.target === this) closeAddNewCarModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'editCarModal',
    closeFn: 'closeEditCarModal()',
    oldOuterRegex: /<div id="editCarModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-\[92vh\] flex flex-col text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">/,
    newOuter: '<div id="editCarModal" onclick="if(event.target === this) closeEditCarModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[88vh] flex flex-col text-start shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  },
  {
    id: 'googleSheetsModal',
    closeFn: 'closeGoogleSheetsModal()',
    oldOuterRegex: /<div id="googleSheetsModal"[\s\S]*?class="[^"]*fixed inset-0[^"]*"[^>]*>/,
    oldCardRegex: /<div class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 text-start shadow-2xl border border-slate-200 dark:border-slate-800">/,
    newOuter: '<div id="googleSheetsModal" onclick="if(event.target === this) closeGoogleSheetsModal()" class="fixed inset-0 z-50 bg-black/60 hidden flex items-end sm:items-center justify-center p-0 sm:p-4 modal-bottom-sheet backdrop-blur-xs transition-all duration-300">',
    newCard: '<div class="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 text-start shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto safe-area-pb">\n            <!-- Drag Handle Bar for Native Bottom Sheet Feel -->\n            <div class="drag-handle-bar sm:hidden"></div>'
  }
];

let transformedCount = 0;
modalConfigs.forEach(cfg => {
  if (cfg.oldOuterRegex && cfg.oldOuterRegex.test(content)) {
    content = content.replace(cfg.oldOuterRegex, cfg.newOuter);
  } else if (cfg.newOuter && content.includes('id="' + cfg.id + '"')) {
    // If exact regex doesn't match, replace the line with id
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('id="' + cfg.id + '"')) {
        lines[i] = cfg.newOuter;
        break;
      }
    }
    content = lines.join('\n');
  }

  if (cfg.oldCardRegex && cfg.oldCardRegex.test(content)) {
    content = content.replace(cfg.oldCardRegex, cfg.newCard);
    transformedCount++;
    console.log(`✓ Transformed modal card: ${cfg.id}`);
  } else {
    console.log(`ℹ Checking card replacement for: ${cfg.id}`);
  }
});

fs.writeFileSync('index.html', content, 'utf8');
fs.writeFileSync('src/index.html', content, 'utf8');
console.log(`Total transformed modal cards: ${transformedCount}`);
