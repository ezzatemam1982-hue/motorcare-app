const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING UI/UX REFACTORING ===');

// Check index.html and src/index.html
['index.html', 'src/index.html'].forEach(filePath => {
    console.log(`Checking ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Dashboard: Urgent Alerts Accordion
    assert(content.includes('id="urgentAlertsContainer"'), 'urgentAlertsContainer exists');
    assert(content.includes('toggleUrgentAlertsAccordion()'), 'toggleUrgentAlertsAccordion exists in html');
    assert(content.includes('id="urgentAlertsCount"'), 'urgentAlertsCount exists');
    assert(content.includes('id="urgentAlertsChevron"'), 'urgentAlertsChevron exists');
    assert(content.includes('id="urgentAlertsListWrapper"'), 'urgentAlertsListWrapper exists');
    assert(content.includes('id="urgentAlertsList"'), 'urgentAlertsList exists');

    // 2. Header Cleanup: language & dark mode removed from top header bar
    // The topHeaderMenuBtn is in header, but not the standalone toggleLanguage and toggleDarkMode before it
    const headerSnippet = content.substring(content.indexOf('<!-- 2. أزرار الإجراءات العلوية المباشرة'), content.indexOf('<!-- القائمة المنسدلة الموحدة الذكية'));
    assert(!headerSnippet.includes('toggleLanguage()'), 'Language button not directly in top header row');
    assert(!headerSnippet.includes('toggleDarkMode()'), 'Dark mode button not directly in top header row');

    // 3. Drawer: Language & Dark mode inside mobileMoreDrawerModal
    const drawerSnippet = content.substring(content.indexOf('id="mobileMoreDrawerModal"'), content.indexOf('<!-- شبكة الأقسام السريعة -->'));
    assert(drawerSnippet.includes('toggleLanguage()'), 'Language toggle inside drawer');
    assert(drawerSnippet.includes('toggleDarkMode()'), 'Dark mode toggle inside drawer');
    assert(drawerSnippet.includes('langBtnText'), 'langBtnText inside drawer');
    assert(drawerSnippet.includes('drag-handle-bar'), 'drag-handle-bar inside drawer');

    // 4. Top Menu Dropdown: also has language & dark mode
    const dropdownSnippet = content.substring(content.indexOf('id="topHeaderDropdownMenu"'), content.indexOf('<!-- قائمة الخدمات المدمجة -->'));
    assert(dropdownSnippet.includes('toggleLanguage()'), 'Language toggle inside top dropdown');
    assert(dropdownSnippet.includes('toggleDarkMode()'), 'Dark mode toggle inside top dropdown');

    // 5. Modals as Bottom Sheets with Drag Handle Bar
    const targetModals = [
        'recordModal',
        'fuelModal',
        'driverToolsModal',
        'serviceCentersModal',
        'customReportExportModal',
        'contactCommunityModal',
        'obdEncyclopediaModal',
        'emergencyModal',
        'batteryModal',
        'batteryCatalogModal',
        'tiresDetailModal',
        'addCustomPMModal',
        'editCatalogItemModal',
        'documentsModal',
        'odometerModal',
        'garageModal',
        'addNewCarModal',
        'editCarModal',
        'googleSheetsModal',
        'notificationsHubModal',
        'trafficFinesModal'
    ];

    targetModals.forEach(mId => {
        const modalStart = content.indexOf(`id="${mId}"`);
        assert(modalStart !== -1, `Modal ${mId} exists`);
        const modalChunk = content.substring(modalStart, modalStart + 800);
        assert(modalChunk.includes('modal-bottom-sheet'), `${mId} has modal-bottom-sheet class`);
        assert(modalChunk.includes('drag-handle-bar'), `${mId} has drag-handle-bar`);
        assert(modalChunk.includes('rounded-t-3xl'), `${mId} has rounded-t-3xl`);
        assert(modalChunk.includes('max-h-[88vh]'), `${mId} has max-h-[88vh]`);
    });
});

// Check css/style.css and src/css/style.css
['css/style.css', 'src/css/style.css'].forEach(filePath => {
    console.log(`Checking ${filePath}...`);
    const css = fs.readFileSync(filePath, 'utf8');
    assert(css.includes('.modal-bottom-sheet'), 'modal-bottom-sheet in CSS');
    assert(css.includes('bottomSheetSlideIn'), 'bottomSheetSlideIn keyframes in CSS');
    assert(css.includes('.drag-handle-bar'), 'drag-handle-bar in CSS');
    assert(css.includes('.card-compact'), 'card-compact in CSS');
    assert(css.includes('.badge-compact'), 'badge-compact in CSS');
    assert(css.includes('#f8fafc'), 'Slate 50 background in CSS');
});

// Check js/services/mobile.js
['js/services/mobile.js', 'src/js/services/mobile.js'].forEach(filePath => {
    console.log(`Checking ${filePath}...`);
    const js = fs.readFileSync(filePath, 'utf8');
    assert(js.includes('closeMobileMoreDrawer'), 'closeMobileMoreDrawer hook present');
    assert(js.includes('closeTopHeaderMenu'), 'closeTopHeaderMenu hook present');
});

console.log('=== ALL UI/UX REFACTORING VERIFICATIONS PASSED! ===');
