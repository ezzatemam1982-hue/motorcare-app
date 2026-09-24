const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== STARTING FIRST-TIME USER ONBOARDING VERIFICATION ===');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(`[Console Error] ${msg.text()}`);
        }
    });

    const pageErrors = [];
    page.on('pageerror', err => {
        pageErrors.push(err.message);
        console.error('[Browser Exception]', err.message);
    });

    page.on('dialog', async dialog => {
        console.log(`[Browser Dialog (${dialog.type()})]`, dialog.message());
        await dialog.accept();
    });

    // 1. First navigate and completely clear storage & indexedDB
    console.log('1. Clearing localStorage & IndexedDB to emulate fresh first-time user...');
    await page.goto('http://127.0.0.1:8089/index.html', { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        if (window.indexedDB) {
            indexedDB.deleteDatabase('MotorCareDB_v140');
        }
    });

    // 2. Reload the page as fresh first-time user
    console.log('2. Reloading page as fresh new user...');
    await page.goto('http://127.0.0.1:8089/index.html', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);

    // 3. Trigger enterMainApp as guest
    console.log('3. Triggering enterMainApp()...');
    await page.evaluate(() => {
        window.enterMainApp();
    });
    await page.waitForTimeout(1000);

    // 4. Verify Add Car Modal opened automatically
    console.log('4. Verifying Add Car modal opened automatically & is non-dismissible...');
    const modalStatus = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        const isOpen = modal && !modal.classList.contains('hidden');
        const closeBtns = modal.querySelectorAll('button[onclick*="closeAddNewCarModal"]');
        let allCloseHidden = true;
        closeBtns.forEach(btn => {
            if (btn.style.display !== 'none') allCloseHidden = false;
        });

        // Test calling closeAddNewCarModal():
        const closeResult = window.closeAddNewCarModal();
        const stillOpen = modal && !modal.classList.contains('hidden');

        // Check input field values:
        const odoVal = document.getElementById('newCarOdoInput')?.value;
        const yearVal = document.getElementById('newCarYearInput')?.value;
        const brandVal = document.getElementById('newCarBrandSelect')?.value;
        const modelVal = document.getElementById('newCarModelSelect')?.value;
        const licenseVal = document.getElementById('newCarLicenseInput')?.value;
        const vinVal = document.getElementById('newCarVinInput')?.value;

        // Check empty states
        const noCarEmptyStateVisible = !document.getElementById('noCarEmptyState')?.classList.contains('hidden');
        const activeContentHidden = document.getElementById('dashboardActiveContent')?.classList.contains('hidden');
        const catalogText = document.getElementById('catalogGrid')?.innerText || '';
        const fuelText = document.getElementById('fuelHistoryContainer')?.innerText || '';
        const historyText = document.getElementById('historyListContainer')?.innerText || '';

        return {
            isOpen,
            allCloseHidden,
            closeResult,
            stillOpen,
            odoVal,
            yearVal,
            brandVal,
            modelVal,
            licenseVal,
            vinVal,
            noCarEmptyStateVisible,
            activeContentHidden,
            catalogText,
            fuelText,
            historyText
        };
    });

    console.log('  Modal auto-opened:', modalStatus.isOpen ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Close/Cancel buttons hidden:', modalStatus.allCloseHidden ? 'PASS ✅' : 'FAIL ❌');
    console.log('  closeAddNewCarModal blocked (returned false):', modalStatus.closeResult === false ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Modal still open after attempted close:', modalStatus.stillOpen ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Odometer input is empty (""):', modalStatus.odoVal === '' ? 'PASS ✅' : `FAIL ❌ (got "${modalStatus.odoVal}")`);
    console.log('  Year input is empty (""):', modalStatus.yearVal === '' ? 'PASS ✅' : `FAIL ❌ (got "${modalStatus.yearVal}")`);
    console.log('  License input is empty (""):', modalStatus.licenseVal === '' ? 'PASS ✅' : `FAIL ❌ (got "${modalStatus.licenseVal}")`);
    console.log('  Dashboard #noCarEmptyState visible:', modalStatus.noCarEmptyStateVisible ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Dashboard #dashboardActiveContent hidden:', modalStatus.activeContentHidden ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Maintenance catalog shows empty state:', modalStatus.catalogText.includes('لا توجد سيارة محددة') ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Fuel container shows empty state:', modalStatus.fuelText.includes('لا توجد بيانات مسجلة بعد') ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Maintenance history shows empty state:', modalStatus.historyText.includes('لا توجد بيانات مسجلة بعد') ? 'PASS ✅' : 'FAIL ❌');

    // 5. Fill out the car information and save
    console.log('\n5. Filling out first vehicle details (Toyota Corolla 2022, 42000 km) and saving...');
    await page.evaluate(() => {
        // Quick select Toyota
        window.quickSelectCarBrand('Toyota');
        
        // Select Model: Corolla
        const modelSel = document.getElementById('newCarModelSelect');
        if (modelSel) {
            modelSel.value = 'Corolla';
            window.onNewCarModelChanged();
        }

        // Set year
        const yearInput = document.getElementById('newCarYearInput');
        if (yearInput) yearInput.value = '2022';

        // Set odometer
        const odoInput = document.getElementById('newCarOdoInput');
        if (odoInput) odoInput.value = '42000';

        // Set plate
        const plateInput = document.getElementById('newCarLicenseInput');
        if (plateInput) plateInput.value = 'ق س د 1234';

        // Save
        window.saveNewCar();
    });

    await page.waitForTimeout(1000);

    // 6. Verify Post-Save State
    console.log('\n6. Verifying dashboard and app state after saving car...');
    const postSaveStatus = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        const isModalClosed = modal && modal.classList.contains('hidden');
        const closeBtns = modal.querySelectorAll('button[onclick*="closeAddNewCarModal"]');
        let closeBtnsRestored = true;
        closeBtns.forEach(btn => {
            if (btn.style.display === 'none') closeBtnsRestored = false;
        });

        const noCarEmptyStateHidden = document.getElementById('noCarEmptyState')?.classList.contains('hidden');
        const activeContentVisible = !document.getElementById('dashboardActiveContent')?.classList.contains('hidden');
        const heroCarName = document.getElementById('dashHeroCarName')?.innerText || '';
        const odoDisplay = document.getElementById('currentOdometerDisplay')?.innerText || '';
        const carCount = window.appState.cars ? window.appState.cars.length : 0;
        const currentCar = window.getCurrentCar();

        // Check storage
        const stored = window.SafeStorage.getJSON('motorCare_AppState_v140');
        const storedOdo = stored?.cars?.[0]?.odometer;
        const storedBrand = stored?.cars?.[0]?.brand;

        return {
            isModalClosed,
            closeBtnsRestored,
            noCarEmptyStateHidden,
            activeContentVisible,
            heroCarName,
            odoDisplay,
            carCount,
            currentCarBrand: currentCar?.brand,
            currentCarOdo: currentCar?.odometer,
            storedBrand,
            storedOdo
        };
    });

    console.log('  Modal cleanly closed:', postSaveStatus.isModalClosed ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Close/Cancel buttons restored:', postSaveStatus.closeBtnsRestored ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Dashboard active content visible:', postSaveStatus.activeContentVisible ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Hero car name populated:', postSaveStatus.heroCarName.includes('Toyota') ? `PASS ✅ ("${postSaveStatus.heroCarName}")` : 'FAIL ❌');
    console.log('  Odometer reading matches entered data (42,000):', postSaveStatus.odoDisplay.includes('42,000') || postSaveStatus.odoDisplay.includes('42000') ? `PASS ✅ ("${postSaveStatus.odoDisplay}")` : 'FAIL ❌');
    console.log('  appState.cars has 1 car:', postSaveStatus.carCount === 1 ? 'PASS ✅' : 'FAIL ❌');
    console.log('  SafeStorage contains saved car data:', postSaveStatus.storedBrand === 'Toyota' && postSaveStatus.storedOdo === 42000 ? 'PASS ✅' : 'FAIL ❌');

    // 7. Capture screenshot for verification artifact
    const screenshotPath = 'C:\\Users\\Ezzat Emam\\.gemini\\antigravity-ide\\brain\\6b086bac-c89d-422d-adf7-ae9627e996da\\screenshot_onboarding_verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`\nScreenshot saved: ${screenshotPath}`);

    // 8. Refresh and ensure modal does NOT re-open now that car exists
    console.log('\n7. Reloading page to verify modal DOES NOT pop up again...');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const recheckStatus = await page.evaluate(() => {
        const modal = document.getElementById('addNewCarModal');
        const isHidden = modal && modal.classList.contains('hidden');
        const heroCarName = document.getElementById('dashHeroCarName')?.innerText || '';
        return { isHidden, heroCarName };
    });

    console.log('  Modal remains closed on reload:', recheckStatus.isHidden ? 'PASS ✅' : 'FAIL ❌');
    console.log('  Dashboard loaded saved car smoothly:', recheckStatus.heroCarName.includes('Toyota') ? `PASS ✅ ("${recheckStatus.heroCarName}")` : 'FAIL ❌');

    console.log('\nConsole Errors:', consoleErrors.length === 0 ? 'ZERO (None) ✅' : consoleErrors);
    console.log('Page Exceptions:', pageErrors.length === 0 ? 'ZERO (None) ✅' : pageErrors);

    await browser.close();

    const isAllSuccessful = 
        modalStatus.isOpen &&
        modalStatus.allCloseHidden &&
        modalStatus.closeResult === false &&
        modalStatus.stillOpen &&
        modalStatus.odoVal === '' &&
        modalStatus.yearVal === '' &&
        modalStatus.noCarEmptyStateVisible &&
        modalStatus.activeContentHidden &&
        postSaveStatus.isModalClosed &&
        postSaveStatus.activeContentVisible &&
        postSaveStatus.carCount === 1 &&
        postSaveStatus.storedOdo === 42000 &&
        recheckStatus.isHidden;

    if (isAllSuccessful) {
        console.log('\n🎉 ALL FIRST-TIME ONBOARDING FLOW TESTS PASSED FLAWLESSLY! 🎉');
        process.exit(0);
    } else {
        console.error('\n❌ SOME ONBOARDING TESTS FAILED!');
        process.exit(1);
    }
})();
