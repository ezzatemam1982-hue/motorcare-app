const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('--- STARTING COMPREHENSIVE MODULAR BROWSER VERIFICATION ---');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            // Ignore external CDN failures if any (e.g. 3rd party tracker/fonts/analytics if offline)
            consoleErrors.push(`[Console Error] ${msg.text()}`);
            console.log('Console error:', msg.text());
        }
    });

    const pageErrors = [];
    page.on('pageerror', err => {
        pageErrors.push(err.message);
        console.error('[Browser Exception]', err.message);
    });

    console.log('1. Loading http://127.0.0.1:8089/index.html ...');
    await page.goto('http://127.0.0.1:8089/index.html', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. Verify Global Namespace Bindings
    console.log('\n2. Verifying Global Objects & Functions on window...');
    const requiredGlobals = [
        'SafeStorage', 'MotorCareIndexedDB', 'validateAndSanitizeAppState', 'saveAppState',
        'MotorCareSecurity', 'hasShownOfflineNotice', 'updateNetworkStatus',
        'MotorCareNotifications', 'DICTIONARY', 'CAR_BRAND_LOGOS', 'BATTERY_MARKET_DATA',
        'appState', 'currentActiveTab', 'getCurrentCar', 'getLocalizedItemName', 'toggleLanguage',
        'buildSpecificCatalog', 'evaluateMaintenanceItem', 'getBatteryStatus',
        'renderDashboard', 'switchTab', 'toggleDarkMode',
        'filterCatalog', 'toggleFreeEditMode', 'openFuelModal', 'renderCharts',
        'openGarageModal', 'openDocumentsModal', 'openBatteryModal', 'openServiceCentersModal',
        'openOdometerModal', 'renderInspectionTab', 'openObdEncyclopediaModal',
        'openDriverToolsModal', 'printVehicleReport', 'openAdminPinModal', 'MotorCareEmergency'
    ];

    const globalsCheck = await page.evaluate((names) => {
        const results = {};
        for (const name of names) {
            results[name] = typeof window[name] !== 'undefined';
        }
        return results;
    }, requiredGlobals);

    let allGlobalsOk = true;
    for (const [name, exists] of Object.entries(globalsCheck)) {
        if (!exists) {
            console.error(`  FAIL: window.${name} is undefined!`);
            allGlobalsOk = false;
        }
    }
    if (allGlobalsOk) {
        console.log(`  PASS: All ${requiredGlobals.length} core global symbols exist on window!`);
    }

    // 3. Test Guest Login / App Entry if on landing page
    console.log('\n3. Checking App State & Authentication View...');
    const isAuthVisible = await page.evaluate(() => {
        const authSec = document.getElementById('authSection');
        return authSec && !authSec.classList.contains('hidden');
    });

    if (isAuthVisible) {
        console.log('  Auth section is visible. Clicking Guest Access button...');
        await page.click('button:has-text("الدخول كضيف"), button:has-text("Guest Entry"), #guestEntryBtn').catch(() => {});
        await page.waitForTimeout(1000);
    } else {
        console.log('  Main app is already active.');
    }

    // 4. Test Tab Switching
    console.log('\n4. Testing Tab Switching...');
    const tabsToTest = ['dashboard', 'maintenance', 'fuel', 'analytics', 'garage'];
    for (const tab of tabsToTest) {
        const switched = await page.evaluate((t) => {
            if (typeof window.switchTab === 'function') {
                window.switchTab(t);
                return true;
            }
            return false;
        }, tab);
        await page.waitForTimeout(300);
        console.log(`  Switched to tab: ${tab} (success: ${switched})`);
    }

    // Return to dashboard
    await page.evaluate(() => window.switchTab('dashboard'));
    await page.waitForTimeout(300);

    // 5. Test Dark Mode Toggle
    console.log('\n5. Testing Dark Mode Toggle...');
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.evaluate(() => {
        if (typeof window.toggleDarkMode === 'function') {
            window.toggleDarkMode();
        }
    });
    const toggledDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log(`  Initial Dark: ${initialDark}, After Toggle: ${toggledDark} (Success: ${initialDark !== toggledDark})`);
    // Revert toggle
    await page.evaluate(() => window.toggleDarkMode());

    // 6. Test Language Toggle
    console.log('\n6. Testing Language Toggle...');
    const initialLang = await page.evaluate(() => window.appState ? window.appState.lang : null);
    await page.evaluate(() => {
        if (typeof window.toggleLanguage === 'function') {
            window.toggleLanguage();
        }
    });
    const toggledLang = await page.evaluate(() => window.appState ? window.appState.lang : null);
    console.log(`  Initial Lang: ${initialLang}, After Toggle: ${toggledLang} (Success: ${initialLang !== toggledLang})`);
    // Revert back
    await page.evaluate(() => window.toggleLanguage());

    // 7. Test Modals Open & Close
    console.log('\n7. Testing Modals Open & Close...');
    const modalsToTest = [
        { open: 'openOdometerModal', close: 'closeOdometerModal', id: 'odometerModal' },
        { open: 'openFuelModal', close: 'closeFuelModal', id: 'fuelLogModal' },
        { open: 'openObdEncyclopediaModal', close: 'closeObdEncyclopediaModal', id: 'obdEncyclopediaModal' },
        { open: 'openDriverToolsModal', close: 'closeDriverToolsModal', id: 'driverToolsModal' }
    ];

    for (const m of modalsToTest) {
        const modalStatus = await page.evaluate((spec) => {
            if (typeof window[spec.open] === 'function') {
                window[spec.open]();
                const el = document.getElementById(spec.id);
                const isOpen = el && !el.classList.contains('hidden');
                if (typeof window[spec.close] === 'function') {
                    window[spec.close]();
                }
                const isClosed = el && el.classList.contains('hidden');
                return { isOpen, isClosed };
            }
            return { error: 'function missing' };
        }, m);
        console.log(`  Modal ${m.id}: open=${modalStatus.isOpen}, closed=${modalStatus.isClosed}`);
    }

    // 8. Capture Full Screenshot
    console.log('\n8. Capturing Verification Screenshot...');
    await page.screenshot({ path: 'scratch/screenshot_modular_verification.png', fullPage: false });
    console.log('  Screenshot saved to scratch/screenshot_modular_verification.png');

    // 9. Summary
    console.log('\n======================================================');
    console.log(`PAGE ERRORS: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
        pageErrors.forEach(e => console.log('  - ' + e));
    }
    console.log(`CRITICAL CONSOLE ERRORS: ${consoleErrors.length}`);
    console.log('======================================================');

    await browser.close();
    process.exit(pageErrors.length === 0 ? 0 : 1);
})();
