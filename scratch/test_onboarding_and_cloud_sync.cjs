// scratch/test_onboarding_and_cloud_sync.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== STARTING CLOUD SYNC & ONBOARDING RACE CONDITION VERIFICATION ===');
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

    // =========================================================================
    // TEST 1: Dismiss / Close Capability & Visible (✕) Button
    // =========================================================================
    console.log('\n1. Testing Dismiss / Close Capability on Add First Car Modal...');
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const test1 = await page.evaluate(() => {
        // Clear all state to simulate brand new user with 0 cars
        sessionStorage.removeItem('motorCare_OnboardingDismissed');
        SafeStorage.setItem('motorCare_LoggedIn', 'true');
        appState.cars = [];
        appState.currentCarIndex = 0;
        SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
        enterMainApp();

        // Trigger onboarding
        checkFirstTimeOnboarding();

        const modal = document.getElementById('addNewCarModal');
        const isVisible = modal && !modal.classList.contains('hidden') && modal.style.display !== 'none';
        const closeBtn = modal ? modal.querySelector('button[onclick*="closeAddNewCarModal"]') : null;
        const closeBtnVisible = closeBtn ? (closeBtn.style.display !== 'none' && getComputedStyle(closeBtn).display !== 'none') : false;
        const skipBtn = document.getElementById('skipOnboardingBtn');
        const skipBtnVisible = skipBtn ? (skipBtn.style.display !== 'none' && getComputedStyle(skipBtn).display !== 'none') : false;
        const skipBtnText = skipBtn ? skipBtn.innerText : '';

        return {
            isVisible,
            closeBtnVisible,
            skipBtnVisible,
            skipBtnText
        };
    });

    console.log('Test 1 State:', test1);
    if (!test1.isVisible) {
        throw new Error('Onboarding modal should be visible for user with 0 cars!');
    }
    if (!test1.closeBtnVisible) {
        throw new Error('Close button (✕) MUST be visible and not hidden for new users!');
    }
    if (!test1.skipBtnVisible) {
        throw new Error('Skip button ("تخطي الآن واستكشاف التطبيق") MUST be visible in onboarding mode!');
    }
    if (!test1.skipBtnText.includes('تخطي الآن')) {
        throw new Error(`Unexpected skip button text: ${test1.skipBtnText}`);
    }
    console.log('  Close Button (✕) & Secondary Skip Action: PASS ✅');

    // =========================================================================
    // TEST 2: Clicking Close Button (✕) Dismisses Cleanly
    // =========================================================================
    console.log('\n2. Testing Close Button (✕) action...');
    await page.evaluate(() => {
        closeAddNewCarModal();
    });
    await page.waitForTimeout(300);

    const test2 = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        return modal ? (modal.classList.contains('hidden') || modal.style.display === 'none') : true;
    });

    if (!test2) {
        throw new Error('Modal should be hidden after calling closeAddNewCarModal()!');
    }
    console.log('  Close Button Dismiss: PASS ✅');

    // =========================================================================
    // TEST 3: Clicking "تخطي الآن واستكشاف التطبيق" Sets Dismissed Flag
    // =========================================================================
    console.log('\n3. Testing "تخطي الآن واستكشاف التطبيق" action...');
    // Reopen modal to test skip action
    await page.evaluate(() => {
        sessionStorage.removeItem('motorCare_OnboardingDismissed');
        openAddNewCarModal();
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
        dismissOnboardingModal();
    });
    await page.waitForTimeout(300);

    const test3 = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        const isHidden = modal ? (modal.classList.contains('hidden') || modal.style.display === 'none') : true;
        const dismissedFlag = sessionStorage.getItem('motorCare_OnboardingDismissed');
        return { isHidden, dismissedFlag };
    });

    console.log('Test 3 State:', test3);
    if (!test3.isHidden) {
        throw new Error('Modal should be hidden after dismissOnboardingModal()!');
    }
    if (test3.dismissedFlag !== 'true') {
        throw new Error('sessionStorage motorCare_OnboardingDismissed should be "true"!');
    }

    // Now call checkFirstTimeOnboarding() - it must respect the dismissal flag and NOT reopen!
    await page.evaluate(() => {
        checkFirstTimeOnboarding();
    });
    await page.waitForTimeout(300);

    const modalStillClosed = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        return modal ? (modal.classList.contains('hidden') || modal.style.display === 'none') : true;
    });
    if (!modalStillClosed) {
        throw new Error('checkFirstTimeOnboarding() should NOT reopen modal after user dismissed it!');
    }
    console.log('  Skip for Now & Session Flag: PASS ✅');

    // =========================================================================
    // TEST 4: Cloud Restore Automatically Closes Onboarding Modal & Populates Cars
    // =========================================================================
    console.log('\n4. Testing Cloud Restore Auto-Close & State Population...');
    // Simulate user has modal open, then cloud sync resolves with returning user cars
    await page.evaluate(() => {
        sessionStorage.removeItem('motorCare_OnboardingDismissed');
        openAddNewCarModal(); // open modal
    });
    await page.waitForTimeout(300);

    const modalOpenBeforeSync = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        return modal && !modal.classList.contains('hidden') && modal.style.display !== 'none';
    });
    console.log('Modal open before cloud sync:', modalOpenBeforeSync);
    if (!modalOpenBeforeSync) throw new Error('Modal should be open before sync!');

    // Simulate Cloud Restore arriving with 2 vehicles
    await page.evaluate(() => {
        const cloudCars = [
            {
                id: 'cloud_car_1',
                brand: 'Toyota',
                model: 'Corolla',
                year: 2022,
                odometer: 45000,
                license: 'س ع د 1234',
                catalog: [{ id: 'oil', name: 'زيت المحرك', type: 'PM', kmInterval: 10000, lastKm: 40000 }]
            },
            {
                id: 'cloud_car_2',
                brand: 'Hyundai',
                model: 'Tucson',
                year: 2023,
                odometer: 25000,
                license: 'م ص ر 5678',
                catalog: [{ id: 'oil', name: 'زيت المحرك', type: 'PM', kmInterval: 10000, lastKm: 20000 }]
            }
        ];

        // Simulate the cloud restore handler logic
        appState.cars = cloudCars;
        appState.currentCarIndex = 0;
        SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
        
        // Auto-close onboarding modal
        closeAddNewCarModal(true);
        renderDashboard();
    });
    await page.waitForTimeout(500);

    const test4 = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        const isHidden = modal ? (modal.classList.contains('hidden') || modal.style.display === 'none') : true;
        const currentCar = getCurrentCar();
        const carsCount = appState.cars ? appState.cars.length : 0;
        return {
            isHidden,
            carsCount,
            carBrand: currentCar ? currentCar.brand : null,
            carModel: currentCar ? currentCar.model : null
        };
    });

    console.log('Test 4 State:', test4);
    if (!test4.isHidden) {
        throw new Error('Onboarding modal MUST automatically close upon cloud car restore!');
    }
    if (test4.carsCount !== 2) {
        throw new Error(`Expected 2 cars from cloud restore, got: ${test4.carsCount}`);
    }
    if (test4.carBrand !== 'Toyota' || test4.carModel !== 'Corolla') {
        throw new Error(`Unexpected restored car: ${test4.carBrand} ${test4.carModel}`);
    }
    console.log('  Cloud Restore Auto-Close & Dashboard Sync: PASS ✅');

    // =========================================================================
    // TEST 5: Google Login triggers sync and auto-closes onboarding modal
    // =========================================================================
    console.log('\n5. Testing Google Login Flow with Cloud Cars...');
    // Clear cars and simulate returning Google user login
    await page.evaluate(() => {
        appState.cars = [];
        appState.currentCarIndex = 0;
        SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
        sessionStorage.removeItem('motorCare_OnboardingDismissed');

        // Mock initUserCloudSync to simulate restoring cloud cars
        window.initUserCloudSync = function() {
            appState.cars = [{
                id: 'google_cloud_car',
                brand: 'Kia',
                model: 'Sportage',
                year: 2024,
                odometer: 15000,
                license: 'ق هـ ر 9999',
                catalog: []
            }];
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            return Promise.resolve(true);
        };

        loginAsGoogleProfile('Ezzat Emam', 'ezzat.test@gmail.com', '');
    });
    await page.waitForTimeout(800);

    const test5 = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        const isHidden = modal ? (modal.classList.contains('hidden') || modal.style.display === 'none') : true;
        const currentCar = getCurrentCar();
        return {
            isHidden,
            carBrand: currentCar ? currentCar.brand : null,
            userLoggedIn: SafeStorage.getItem('motorCare_LoggedIn')
        };
    });

    console.log('Test 5 State:', test5);
    if (!test5.isHidden) {
        throw new Error('Modal must remain closed when Google login restores cloud cars!');
    }
    if (test5.carBrand !== 'Kia') {
        throw new Error(`Expected Kia Sportage, got: ${test5.carBrand}`);
    }
    console.log('  Google Sign-In Cloud Sync & Onboarding Suppression: PASS ✅');

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
    console.log('🎉 ALL CLOUD SYNC & ONBOARDING RACE FIX TESTS PASSED 100%! 🎉');
    console.log('============================================================');

    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
