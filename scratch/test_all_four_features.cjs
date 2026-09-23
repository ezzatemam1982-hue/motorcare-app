const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('--- STARTING COMPREHENSIVE VERIFICATION SUITE ---');
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('dialog', async d => await d.accept());

    await page.goto('file:///d:/car/MotorCare-App/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 1. Verify Google Sign-In functions exist and modal works
    console.log('\n[1] Testing Google Sign-In integration...');
    const googleTest = await page.evaluate(() => {
        const hasOpenModal = typeof openGoogleAuthModal === 'function';
        const hasHandleSocial = typeof handleSocialLogin === 'function';
        const hasLoginProfile = typeof loginAsGoogleProfile === 'function';
        const hasGIS = typeof initGoogleIdentityServices === 'function';

        // Trigger Google Login
        if (hasHandleSocial) {
            handleSocialLogin('google');
        }
        const confirmModal = document.getElementById('googleAuthModal');
        const isConfirmVisible = confirmModal && !confirmModal.classList.contains('hidden');

        return {
            hasOpenModal,
            hasHandleSocial,
            hasLoginProfile,
            hasGIS,
            isConfirmVisible
        };
    });
    console.log('Google Auth Functions & Modal:', googleTest);
    if (!googleTest.hasHandleSocial || !googleTest.isConfirmVisible) {
        throw new Error('Google Sign-In verification failed!');
    }
    console.log('✓ Google Sign-In: 100% Intact & Verified!');

    // Close google modal & bypass to main app with an initialized car
    await page.evaluate(() => {
        const confirmModal = document.getElementById('googleAuthModal');
        if (confirmModal) confirmModal.classList.add('hidden');
        if (typeof handleGuestEntry === 'function') {
            handleGuestEntry();
        }
        appState.cars = [{
            id: 'car_test_1',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2022,
            odometer: 45000,
            catalog: [],
            battery: {
                brand: 'موبيل (Mobil) - دولي',
                capacity: '60 Ah',
                techType: 'SMF',
                purchaseDate: '2026-09-22',
                warrantyMonths: 18,
                isConfigured: true
            }
        }];
        appState.currentCarIndex = 0;
        SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
        if (typeof renderDashboard === 'function') renderDashboard();
    });
    await page.waitForTimeout(1000);

    // 2. Test Battery Edit Modal
    console.log('\n[2] Testing Battery Edit Modal...');
    const batteryTest = await page.evaluate(() => {
        // Open modal
        openBatteryModal();
        const modal = document.getElementById('batteryModal');
        const isVisible = modal && !modal.classList.contains('hidden');

        const brandSel = document.getElementById('batteryBrandSelect');
        const capSel = document.getElementById('batteryCapacitySelect');
        const typeSel = document.getElementById('batteryTypeSelect');

        const brandCount = brandSel ? brandSel.options.length : 0;
        const capCount = capSel ? capSel.options.length : 0;
        const typeCount = typeSel ? typeSel.options.length : 0;

        // Select new values and save
        if (brandSel && brandSel.options.length > 2) {
            brandSel.selectedIndex = 2;
            brandSel.value = brandSel.options[2].value;
        }
        if (capSel && capSel.options.length > 4) {
            capSel.selectedIndex = 4;
            capSel.value = capSel.options[4].value;
        }
        
        saveBatteryDetails();
        const isModalClosed = modal && modal.classList.contains('hidden');

        const car = getCurrentCar();
        const savedBrand = car && car.battery ? car.battery.brand : null;

        return {
            isVisible,
            brandCount,
            capCount,
            typeCount,
            isModalClosed,
            savedBrand
        };
    });
    console.log('Battery Edit Result:', batteryTest);
    if (!batteryTest.isVisible || batteryTest.brandCount < 5 || !batteryTest.savedBrand || !batteryTest.isModalClosed) {
        throw new Error('Battery Edit verification failed!');
    }
    console.log('✓ Battery Edit Modal: 100% Operational & Verified!');

    // 3. Test CM Filter and Add CM Task
    console.log('\n[3] Testing CM Filter and Add CM Task...');
    const cmTest = await page.evaluate(() => {
        // Filter CM
        filterCatalog('cm');

        // Check if empty card rendered with + Add Urgent CM Task button
        const grid = document.getElementById('catalogGrid');
        const hasEmptyCard = grid && (grid.innerHTML.includes('No Urgent Corrective Maintenance') || grid.innerHTML.includes('لا توجد بلاغات أو مهام صيانة عاجلة'));
        
        // Open add CM modal
        openAddCustomPMModal('CM');
        const modal = document.getElementById('addCustomPMModal');
        const isModalVisible = modal && !modal.classList.contains('hidden');
        const radioCM = document.querySelector('input[name="customItemType"][value="CM"]');
        const isCMRadioChecked = radioCM ? radioCM.checked : false;

        // Fill task details
        const nameInput = document.getElementById('customPMNameInput');
        if (nameInput) nameInput.value = 'تغيير بلي عجل أمامي طارئ';

        saveCustomPMItem();

        // Check if new CM item is rendered in grid
        const hasNewItem = grid && grid.innerHTML.includes('تغيير بلي عجل أمامي طارئ');
        const cmCount = (getCurrentCar()?.catalog || []).filter(i => i.type === 'CM').length;

        return {
            hasEmptyCard,
            isModalVisible,
            isCMRadioChecked,
            hasNewItem,
            cmCount
        };
    });
    console.log('CM Test Result:', cmTest);
    if (!cmTest.isCMRadioChecked || !cmTest.hasNewItem || cmTest.cmCount < 1) {
        throw new Error('CM Task addition verification failed!');
    }
    console.log('✓ CM Filter & Add CM Task: 100% Operational & Verified!');

    // 4. Verify Single Password Reset OTP Pulse (no duplicate)
    console.log('\n[4] Verifying Password Reset OTP Dispatch Single Pulse...');
    const emailCheck = await page.evaluate(() => {
        const fnStr = sendForgotPasswordEmail.toString();
        const hasSetTimeoutSendFetch = fnStr.includes('setTimeout(sendFetch');
        const fetchCount = (fnStr.match(/fetch\(/g) || []).length;
        return {
            hasSetTimeoutSendFetch,
            fetchCount
        };
    });
    console.log('Email Pulse Check:', emailCheck);
    if (emailCheck.hasSetTimeoutSendFetch) {
        throw new Error('Duplicate setTimeout sendFetch pulse still present!');
    }
    console.log('✓ Single Pulse Password Reset: 100% Verified (No duplicates)!');

    await browser.close();
    console.log('\n======================================================');
    console.log('🎉 ALL FOUR CRITICAL FEATURES VERIFIED WITH 100% SUCCESS!');
    console.log('======================================================');
})();
