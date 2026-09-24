// scratch/test_calibration_banner.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== STARTING SMART MAINTENANCE CALIBRATION BANNER VERIFICATION ===');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const txt = msg.text();
            if (!txt.includes('gstatic') && !txt.includes('ERR_CONNECTION') && !txt.includes('503')) {
                console.error('[Browser Console Error]:', txt);
                consoleErrors.push(txt);
            }
        }
    });

    page.on('pageerror', err => {
        console.error('[Browser Page Error]:', err.message);
        pageErrors.push(err.message);
    });

    console.log('1. Loading http://localhost:8089/index.html...');
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Ensure we enter main app with a vehicle
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_LoggedIn', 'true');
        let car = {
            id: 'car_test_calib_1',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2022,
            odometer: 60000,
            license: 'أ ب ج 1234',
            catalog: [
                { id: 'oil_filter', name: 'زيت وفلتر المحرك', type: 'PM', category: 'engine', kmInterval: 10000, monthInterval: 6, lastKm: 50000, lastDate: '2026-01-01' },
                { id: 'air_filter', name: 'فلتر الهواء', type: 'PM', category: 'filters', kmInterval: 20000, monthInterval: 12, lastKm: 40000, lastDate: '2025-06-01' },
                { id: 'brake_pads', name: 'تيل الفرامل الأمامي', type: 'PM', category: 'brakes', kmInterval: 30000, monthInterval: 18, lastKm: 30000, lastDate: '2025-01-01' }
            ],
            history: [],
            fuelLogs: []
        };
        appState.cars = [car];
        appState.currentCarIndex = 0;
        SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
        
        // Ensure calibration banner is not dismissed for this test
        localStorage.removeItem('maintenance_calibration_dismissed_car_test_calib_1');
        localStorage.removeItem('maintenance_calibration_dismissed');

        enterMainApp();
    });
    await page.waitForTimeout(1000);

    // Switch to Maintenance Tab
    console.log('2. Switching to Maintenance tab...');
    await page.evaluate(() => {
        if (typeof switchTab === 'function') switchTab('maintenance');
        renderCatalogItems();
    });
    await page.waitForTimeout(800);

    // 3. Verify Banner Presence & Positioning
    console.log('3. Verifying Smart Maintenance Calibration Banner...');
    const bannerInfo = await page.evaluate(() => {
        const b = document.getElementById('smartMaintenanceCalibrationBanner');
        const grid = document.getElementById('catalogGrid');
        if (!b) return null;
        
        const isVisible = b.offsetWidth > 0 && b.offsetHeight > 0 && b.style.display !== 'none';
        const isBeforeGrid = b.nextElementSibling === grid;
        const text = b.innerText;

        return {
            exists: true,
            isVisible,
            isBeforeGrid,
            text
        };
    });

    console.log('Banner Info:', bannerInfo);
    if (!bannerInfo || !bannerInfo.exists || !bannerInfo.isVisible) {
        throw new Error('Calibration banner is not visible!');
    }
    if (!bannerInfo.isBeforeGrid) {
        throw new Error('Calibration banner is not placed immediately above catalogGrid!');
    }

    const expectedSnippet = 'لضمان دقة مواعيد التنبيهات ونسبة الاستهلاك: يُرجى مراجعة وتحديث قراءة (آخر صيانة)';
    if (!bannerInfo.text.includes(expectedSnippet)) {
        throw new Error(`Banner text mismatch! Got: ${bannerInfo.text}`);
    }
    console.log('  Banner text and position: PASS ✅');

    // 4. Test "تعديل سريع" (Quick Edit Action)
    console.log('4. Testing Quick Edit action button...');
    await page.evaluate(() => {
        startQuickCalibration();
    });
    await page.waitForTimeout(500);

    const modalState = await page.evaluate(() => {
        const modal = document.getElementById('quickCalibrationModal');
        const isModalVisible = modal && !modal.classList.contains('hidden') && modal.style.display !== 'none';
        const highlightedBoxes = document.querySelectorAll('.maintenance-last-service-box.ring-2');
        const oilInput = document.getElementById('calib_km_oil_filter');

        return {
            isModalVisible,
            highlightCount: highlightedBoxes.length,
            oilInputVal: oilInput ? oilInput.value : null
        };
    });

    console.log('Modal & Highlight State:', modalState);
    if (!modalState.isModalVisible) {
        throw new Error('Quick Calibration modal did not open!');
    }
    if (modalState.highlightCount === 0) {
        throw new Error('Cards last-service boxes were not highlighted!');
    }
    if (modalState.oilInputVal !== '50000') {
        throw new Error(`Expected oil_filter lastKm 50000, got: ${modalState.oilInputVal}`);
    }
    console.log('  Quick Edit modal & card highlights: PASS ✅');

    // 5. Test Calibration Save
    console.log('5. Modifying value and saving calibration...');
    await page.evaluate(() => {
        const oilInput = document.getElementById('calib_km_oil_filter');
        if (oilInput) oilInput.value = '55000';
        saveQuickCalibration();
    });
    await page.waitForTimeout(800);

    const postSaveState = await page.evaluate(() => {
        const modal = document.getElementById('quickCalibrationModal');
        const modalHidden = !modal || modal.classList.contains('hidden') || modal.style.display === 'none';
        const car = getCurrentCar();
        const oilItem = car.catalog.find(i => i.id === 'oil_filter');
        const banner = document.getElementById('smartMaintenanceCalibrationBanner');
        const bannerHidden = !banner || banner.style.display === 'none';
        const dismissedFlag = localStorage.getItem('maintenance_calibration_dismissed_car_test_calib_1');

        return {
            modalHidden,
            savedKm: oilItem ? oilItem.lastKm : null,
            bannerHidden,
            dismissedFlag
        };
    });

    console.log('Post Save State:', postSaveState);
    if (!postSaveState.modalHidden) throw new Error('Modal did not close after saving!');
    if (postSaveState.savedKm !== 55000) throw new Error(`Expected savedKm 55000, got: ${postSaveState.savedKm}`);
    if (!postSaveState.bannerHidden) throw new Error('Banner was not hidden after saving calibration!');
    if (postSaveState.dismissedFlag !== 'true') throw new Error('Vehicle dismissal flag was not saved in localStorage!');
    console.log('  Calibration save and auto-dismiss: PASS ✅');

    // 6. Test Explicit Dismiss Button (✕)
    console.log('6. Testing explicit Dismiss button on a fresh vehicle...');
    await page.evaluate(() => {
        // Switch to car 2
        let car2 = {
            id: 'car_test_calib_2',
            brand: 'Nissan',
            model: 'Sunny',
            year: 2021,
            odometer: 40000,
            catalog: [
                { id: 'oil_filter', name: 'زيت وفلتر المحرك', type: 'PM', kmInterval: 10000, lastKm: 30000 }
            ]
        };
        appState.cars.push(car2);
        appState.currentCarIndex = 1;
        renderCatalogItems();
    });
    await page.waitForTimeout(600);

    const car2BannerBefore = await page.evaluate(() => {
        const b = document.getElementById('smartMaintenanceCalibrationBanner');
        return b && b.style.display !== 'none';
    });
    console.log('Car 2 Banner visible initially:', car2BannerBefore);
    if (!car2BannerBefore) throw new Error('Banner should be visible for newly selected car 2!');

    // Click Dismiss (✕)
    await page.evaluate(() => {
        dismissMaintenanceCalibrationBanner();
    });
    await page.waitForTimeout(500);

    const car2BannerAfter = await page.evaluate(() => {
        const b = document.getElementById('smartMaintenanceCalibrationBanner');
        const isHidden = !b || b.style.display === 'none';
        const flag = localStorage.getItem('maintenance_calibration_dismissed_car_test_calib_2');
        return { isHidden, flag };
    });
    console.log('Car 2 Banner after dismiss:', car2BannerAfter);
    if (!car2BannerAfter.isHidden || car2BannerAfter.flag !== 'true') {
        throw new Error('Dismiss button did not properly hide banner or set vehicle flag!');
    }
    console.log('  Explicit Dismiss button & vehicle isolation: PASS ✅');

    // 7. Verify page errors
    console.log('\n--- Final Error Check ---');
    console.log('Console Errors Count:', consoleErrors.length);
    console.log('Page Exceptions Count:', pageErrors.length);

    if (consoleErrors.length > 0 || pageErrors.length > 0) {
        throw new Error('Unexpected console or page errors encountered!');
    }

    console.log('\n============================================================');
    console.log('🎉 ALL SMART MAINTENANCE CALIBRATION BANNER TESTS PASSED! 🎉');
    console.log('============================================================');

    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
