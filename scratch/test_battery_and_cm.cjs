const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: err.message }));

    console.log('1. Loading file directly: file:///d:/car/MotorCare-App/index.html');
    await page.goto('file:///d:/car/MotorCare-App/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    console.log('Console logs on load:', consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror'));

    // Check if landing screen or main app
    const hasLanding = await page.evaluate(() => {
        const l = document.getElementById('landingScreen');
        return l && !l.classList.contains('hidden') && l.style.display !== 'none';
    });
    console.log('Landing screen visible:', hasLanding);

    // Bypass to guest or main app to test battery & CM
    await page.evaluate(() => {
        if (typeof handleGuestEntry === 'function') {
            handleGuestEntry();
        } else if (typeof loginAsGuest === 'function') {
            loginAsGuest();
        } else {
            // direct bypass
            const l = document.getElementById('landingScreen');
            if (l) l.classList.add('hidden');
            const m = document.getElementById('mainApp');
            if (m) m.classList.remove('hidden');
            if (typeof renderDashboard === 'function') renderDashboard();
        }
    });
    await page.waitForTimeout(1000);

    // 2. Test battery modal
    console.log('\n2. Testing Battery Modal...');
    const batteryTest = await page.evaluate(() => {
        try {
            if (typeof openBatteryModal === 'function') {
                openBatteryModal();
                const m = document.getElementById('batteryModal');
                const isVisible = m && !m.classList.contains('hidden');
                return { success: true, isVisible };
            }
            return { success: false, reason: 'openBatteryModal not a function' };
        } catch(e) {
            return { success: false, error: e.message, stack: e.stack };
        }
    });
    console.log('Battery modal test result:', batteryTest);

    // 3. Test CM filter and Add Custom CM
    console.log('\n3. Testing CM filter and Add Custom...');
    const cmTest = await page.evaluate(() => {
        try {
            // Filter CM
            if (typeof filterCatalog === 'function') {
                filterCatalog('cm');
            }
            const cmBtn = document.getElementById('filterBtn-cm');
            const subContainer = document.getElementById('pmSubCategoriesContainer');
            const hasPointerEventsNone = subContainer && subContainer.classList.contains('pointer-events-none');
            
            // Check custom PM/CM modal
            let modalResult = {};
            if (typeof openAddCustomPMModal === 'function') {
                openAddCustomPMModal();
                const modal = document.getElementById('addCustomPMModal');
                const isModalVisible = modal && !modal.classList.contains('hidden');
                const radioCM = document.querySelector('input[name="customItemType"][value="CM"]');
                const isCMRadioChecked = radioCM ? radioCM.checked : false;
                modalResult = { isModalVisible, isCMRadioChecked };
            }

            return {
                filterSuccess: true,
                hasPointerEventsNone,
                modalResult
            };
        } catch(e) {
            return { filterSuccess: false, error: e.message, stack: e.stack };
        }
    });
    console.log('CM test result:', cmTest);

    console.log('\nAll Errors captured during test:');
    consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror').forEach(e => console.log('  [ERROR]', e.text));

    await browser.close();
})();
