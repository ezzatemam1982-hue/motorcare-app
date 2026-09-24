// scratch/test_odometer_validation.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== STARTING GLOBAL ODOMETER VALIDATION & CALCULATION SAFEGUARDS VERIFICATION ===');
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
            if (!txt.includes('gstatic') && !txt.includes('ERR_CONNECTION') && !txt.includes('503') && !txt.includes('favicon')) {
                console.error('[Browser Console Error]:', txt);
                consoleErrors.push(txt);
            }
        }
    });

    page.on('pageerror', err => {
        const msg = err.message;
        if (!msg.includes('INTERNAL') && !msg.includes('gstatic')) {
            console.error('[Browser Page Error]:', msg);
            pageErrors.push(msg);
        }
    });

    console.log('1. Loading http://localhost:8089/index.html...');
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Setup a clean vehicle state: Toyota Corolla with odometer = 50,000 km
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_LoggedIn', 'true');
        let car = {
            id: 'car_val_test',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2022,
            odometer: 50000,
            license: 'ق ر ط 9876',
            catalog: [
                { id: 'oil_filter', name: 'زيت وفلتر المحرك', type: 'PM', category: 'engine', kmInterval: 10000, monthInterval: 6, lastKm: 45000, lastDate: '2026-01-01' },
                { id: 'spark_plugs', name: 'شمعات الاحتراق (البوجيهات)', type: 'PM', category: 'engine_parts', kmInterval: 30000, monthInterval: 24, lastKm: 30000, lastDate: '2025-01-01' }
            ],
            history: [
                { id: 'h_past_1', type: 'PM', partId: 'oil_filter', partName: 'زيت وفلتر المحرك', odometer: 45000, date: '2026-01-01', totalCost: 1200 }
            ],
            fuelLogs: [
                { id: 'f_past_1', odometer: 49000, liters: 40, cost: 500, octane: 'بنزين 92', date: '2026-02-01' }
            ]
        };
        appState.cars = [car];
        appState.currentCarIndex = 0;
        SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
        enterMainApp();
    });
    await page.waitForTimeout(1000);

    // =========================================================================
    // TEST 1: Calculation Safeguards in evaluateMaintenanceItem
    // =========================================================================
    console.log('\n2. Testing Calculation Safeguards in evaluateMaintenanceItem...');
    const calcResults = await page.evaluate(() => {
        const itemNormal = { id: 'oil', kmInterval: 10000, lastKm: 45000 };
        const itemAnomaly = { id: 'oil', kmInterval: 10000, lastKm: 60000 }; // lastKm > currentOdo
        const currentOdo = 50000;

        const evalNormal = evaluateMaintenanceItem(itemNormal, currentOdo);
        const evalAnomaly = evaluateMaintenanceItem(itemAnomaly, currentOdo);

        return { evalNormal, evalAnomaly };
    });

    console.log('Calc Results:', calcResults);
    // Normal: diffKm = 5000, remainingKm = 5000, percent = 50%
    if (calcResults.evalNormal.diffKm !== 5000 || calcResults.evalNormal.remainingKm !== 5000 || calcResults.evalNormal.percent !== 50) {
        throw new Error('Normal calculation safeguard failed!');
    }
    // Anomaly: diffKm should be 0 (not -10000), remainingKm should be 10000 (clamped to intervalKm), percent should be 0% (never negative)
    if (calcResults.evalAnomaly.diffKm !== 0 || calcResults.evalAnomaly.remainingKm !== 10000 || calcResults.evalAnomaly.percent !== 0) {
        throw new Error(`Anomaly calculation safeguard failed! diffKm: ${calcResults.evalAnomaly.diffKm}, remainingKm: ${calcResults.evalAnomaly.remainingKm}, percent: ${calcResults.evalAnomaly.percent}`);
    }
    console.log('  Calculation Safeguards (Clamping & Non-negative): PASS ✅');

    // =========================================================================
    // TEST 2: Quick Calibration Ceiling Validation (Exceeding current odometer)
    // =========================================================================
    console.log('\n3. Testing Quick Calibration Ceiling Validation...');
    await page.evaluate(() => {
        switchTab('maintenance');
        renderCatalogItems();
        openQuickCalibrationModal();
    });
    await page.waitForTimeout(500);

    // Try to enter 55,000 km for oil_filter (exceeds car.odometer which is 50,000 km)
    await page.evaluate(() => {
        const kmInp = document.getElementById('calib_km_oil_filter');
        if (kmInp) kmInp.value = '55000';
        saveQuickCalibration();
    });
    await page.waitForTimeout(500);

    const calibCheck = await page.evaluate(() => {
        const modal = document.getElementById('quickCalibrationModal');
        const modalStillOpen = modal && !modal.classList.contains('hidden') && modal.style.display !== 'none';
        const car = getCurrentCar();
        const oilItem = car.catalog.find(i => i.id === 'oil_filter');
        const kmInp = document.getElementById('calib_km_oil_filter');
        const hasErrorRing = kmInp ? kmInp.classList.contains('ring-rose-500') : false;
        return {
            modalStillOpen: !!modalStillOpen,
            oilLastKm: oilItem.lastKm,
            hasErrorRing
        };
    });

    console.log('Quick Calibration Ceiling Check:', calibCheck);
    if (!calibCheck.modalStillOpen) {
        throw new Error('Quick Calibration modal should stay open when ceiling is violated!');
    }
    if (calibCheck.oilLastKm !== 45000) {
        throw new Error('Quick Calibration should not have saved the invalid 55,000 km reading!');
    }
    if (!calibCheck.hasErrorRing) {
        throw new Error('Offending input should be highlighted with ring-rose-500!');
    }
    console.log('  Quick Calibration Ceiling Validation: PASS ✅');

    await page.evaluate(() => closeQuickCalibrationModal());
    await page.waitForTimeout(300);

    // =========================================================================
    // TEST 3: Editing Past Maintenance Record Ceiling Validation
    // =========================================================================
    console.log('\n4. Testing Past Maintenance Record Ceiling Validation...');
    await page.evaluate(() => {
        openRecordModal('h_past_1'); // editing existing past record
        const odoInput = document.getElementById('recordOdometerInput');
        if (odoInput) odoInput.value = '58000'; // Exceeds current car odo (50000)
        saveMaintenanceRecord();
    });
    await page.waitForTimeout(500);

    const pastRecordCheck = await page.evaluate(() => {
        const modal = document.getElementById('recordModal');
        const modalStillOpen = modal && !modal.classList.contains('hidden');
        const car = getCurrentCar();
        const rec = car.history.find(h => h.id === 'h_past_1');
        return {
            modalStillOpen: !!modalStillOpen,
            savedOdo: rec.odometer
        };
    });

    console.log('Past Record Ceiling Check:', pastRecordCheck);
    if (!pastRecordCheck.modalStillOpen) {
        throw new Error('Record modal should stay open when past maintenance reading exceeds vehicle odometer!');
    }
    if (pastRecordCheck.savedOdo !== 45000) {
        throw new Error('Past record should NOT have saved the invalid 58,000 km reading!');
    }
    console.log('  Past Maintenance Ceiling Validation: PASS ✅');

    await page.evaluate(() => closeRecordModal());
    await page.waitForTimeout(300);

    // =========================================================================
    // TEST 4: Dynamic Auto-Update on New Maintenance Operation
    // =========================================================================
    console.log('\n5. Testing Dynamic Auto-Update on New Maintenance Operation...');
    await page.evaluate(() => {
        openRecordModal('oil_filter'); // New operation (fresh service)
        const odoInput = document.getElementById('recordOdometerInput');
        if (odoInput) odoInput.value = '52500'; // Car drove to 52,500 km
        saveMaintenanceRecord();
    });
    await page.waitForTimeout(800);

    const freshServiceCheck = await page.evaluate(() => {
        const car = getCurrentCar();
        const oilItem = car.catalog.find(i => i.id === 'oil_filter');
        return {
            carOdometer: car.odometer,
            oilLastKm: oilItem.lastKm,
            latestHistoryOdo: car.history[0]?.odometer
        };
    });

    console.log('Fresh Service Auto-Update Check:', freshServiceCheck);
    if (freshServiceCheck.carOdometer !== 52500) {
        throw new Error(`Vehicle odometer should have auto-updated to 52,500 km, got: ${freshServiceCheck.carOdometer}`);
    }
    if (freshServiceCheck.oilLastKm !== 52500) {
        throw new Error(`Oil lastKm should be 52,500 km, got: ${freshServiceCheck.oilLastKm}`);
    }
    console.log('  Fresh Maintenance Odometer Auto-Update: PASS ✅');

    // =========================================================================
    // TEST 5: Dynamic Auto-Update on New Fuel Entry
    // =========================================================================
    console.log('\n6. Testing Dynamic Auto-Update on New Fuel Entry...');
    await page.evaluate(() => {
        switchTab('fuel');
        openFuelModal(); // Fresh fuel entry
        const odoInput = document.getElementById('fuelOdometerInput');
        if (odoInput) odoInput.value = '53200'; // Car drove to 53,200 km
        const litersInput = document.getElementById('fuelLitersInput');
        if (litersInput) litersInput.value = '42';
        const costInput = document.getElementById('fuelCostInput');
        if (costInput) costInput.value = '550';
        saveFuelLog();
    });
    await page.waitForTimeout(800);

    const freshFuelCheck = await page.evaluate(() => {
        const car = getCurrentCar();
        return {
            carOdometer: car.odometer,
            latestFuelOdo: car.fuelLogs[0]?.odometer
        };
    });

    console.log('Fresh Fuel Auto-Update Check:', freshFuelCheck);
    if (freshFuelCheck.carOdometer !== 53200) {
        throw new Error(`Vehicle odometer should have auto-updated to 53,200 km, got: ${freshFuelCheck.carOdometer}`);
    }
    if (freshFuelCheck.latestFuelOdo !== 53200) {
        throw new Error(`Fuel log odometer should be 53,200 km, got: ${freshFuelCheck.latestFuelOdo}`);
    }
    console.log('  Fresh Fuel Odometer Auto-Update: PASS ✅');

    // =========================================================================
    // TEST 6: Editing Past Fuel Log Ceiling Validation
    // =========================================================================
    console.log('\n7. Testing Past Fuel Log Ceiling Validation...');
    await page.evaluate(() => {
        openFuelModal('f_past_1'); // Editing past fuel log
        const odoInput = document.getElementById('fuelOdometerInput');
        if (odoInput) odoInput.value = '60000'; // Exceeds current vehicle odo (53200)
        saveFuelLog();
    });
    await page.waitForTimeout(500);

    const pastFuelCheck = await page.evaluate(() => {
        const modal = document.getElementById('fuelModal');
        const modalStillOpen = modal && !modal.classList.contains('hidden');
        const car = getCurrentCar();
        const fuelLog = car.fuelLogs.find(f => f.id === 'f_past_1');
        return {
            modalStillOpen: !!modalStillOpen,
            fuelOdo: fuelLog.odometer
        };
    });

    console.log('Past Fuel Ceiling Check:', pastFuelCheck);
    if (!pastFuelCheck.modalStillOpen) {
        throw new Error('Fuel modal should stay open when editing past fuel log exceeds car odometer!');
    }
    if (pastFuelCheck.fuelOdo !== 49000) {
        throw new Error('Past fuel log should NOT have saved the invalid 60,000 km reading!');
    }
    console.log('  Past Fuel Ceiling Validation: PASS ✅');

    await page.evaluate(() => closeFuelModal());
    await page.waitForTimeout(300);

    // =========================================================================
    // Error Checks
    // =========================================================================
    console.log('\n--- Final Error Summary ---');
    console.log('Console Errors Count:', consoleErrors.length);
    console.log('Page Exceptions Count:', pageErrors.length);

    if (consoleErrors.length > 0 || pageErrors.length > 0) {
        throw new Error('Unexpected console or page errors encountered!');
    }

    console.log('\n============================================================');
    console.log('🎉 ALL GLOBAL ODOMETER VALIDATION & SAFEGUARD TESTS PASSED 100%! 🎉');
    console.log('============================================================');

    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
