const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    console.log('1. Navigating to http://localhost:8089/index.html...');
    await page.goto('http://localhost:8089/index.html');
    await page.waitForLoadState('domcontentloaded');

    // 1. Enter as Guest
    console.log('2. Entering as Guest Explorer...');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        handleGuestEntry();
    });
    await page.waitForTimeout(600);

    const guestState = await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        return {
            landingVisible: landing && !landing.classList.contains('hidden') && landing.style.display !== 'none',
            mainAppVisible: mainApp && !mainApp.classList.contains('hidden') && mainApp.style.display !== 'none',
            isLoggedIn: SafeStorage.getItem('motorCare_LoggedIn')
        };
    });
    console.log('Guest state in main app:', guestState);

    // 2. Open Account Center modal as Guest
    console.log('3. Opening Account Center modal...');
    await page.evaluate(() => {
        openAccountCenter();
    });
    await page.waitForTimeout(500);

    const modalStateGuest = await page.evaluate(() => {
        const modal = document.getElementById('accountCenterModal');
        const upgradeBtn = document.getElementById('btnUpgradeAccount');
        const badge = document.getElementById('accountModalUserBadge');
        return {
            modalVisible: modal && !modal.classList.contains('hidden') && modal.style.display !== 'none',
            upgradeBtnVisible: upgradeBtn && !upgradeBtn.classList.contains('hidden') && upgradeBtn.style.display !== 'none',
            badgeText: badge ? badge.innerText : ''
        };
    });
    console.log('Account Modal state for Guest:', modalStateGuest);
    if (!modalStateGuest.upgradeBtnVisible) {
        console.error('FAIL: btnUpgradeAccount should be visible for guest users!');
        process.exit(1);
    }

    await page.screenshot({ path: 'scratch/screenshot_guest_account_modal.png' });

    // 3. Click Upgrade Account button
    console.log('4. Clicking "ترقية لحساب كامل مسجل" (btnUpgradeAccount)...');
    await page.click('#btnUpgradeAccount');
    await page.waitForTimeout(600);

    const upgradeResult = await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        const nameField = document.getElementById('nameFieldContainer');
        const submitText = document.getElementById('authSubmitBtnText');
        return {
            landingVisible: landing && !landing.classList.contains('hidden') && landing.style.display !== 'none',
            mainAppHidden: mainApp && (mainApp.classList.contains('hidden') || mainApp.style.display === 'none'),
            nameFieldVisible: nameField && !nameField.classList.contains('hidden'),
            submitButtonText: submitText ? submitText.innerText : '',
            isLoggedIn: SafeStorage.getItem('motorCare_LoggedIn')
        };
    });
    console.log('State after Upgrade click:', upgradeResult);
    if (!upgradeResult.landingVisible || !upgradeResult.nameFieldVisible) {
        console.error('FAIL: Upgrade button did not properly transition to register screen!');
        process.exit(1);
    }

    await page.screenshot({ path: 'scratch/screenshot_upgrade_landing_screen.png' });

    // 4. Enter as Registered User
    console.log('5. Logging in as a Registered User...');
    await page.evaluate(() => {
        loginAsGoogleProfile('د. عزت إمام', 'ezzatemam@gmail.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ezzat');
    });
    await page.waitForTimeout(600);

    // 5. Open Account Center as Registered User
    console.log('6. Opening Account Center modal as registered user...');
    await page.evaluate(() => {
        openAccountCenter();
    });
    await page.waitForTimeout(500);

    const modalStateRegistered = await page.evaluate(() => {
        const upgradeBtn = document.getElementById('btnUpgradeAccount');
        const badge = document.getElementById('accountModalUserBadge');
        return {
            upgradeBtnHidden: upgradeBtn && upgradeBtn.classList.contains('hidden'),
            badgeText: badge ? badge.innerText : ''
        };
    });
    console.log('Account Modal state for Registered User:', modalStateRegistered);
    if (!modalStateRegistered.upgradeBtnHidden) {
        console.error('FAIL: btnUpgradeAccount should be hidden for registered users!');
        process.exit(1);
    }

    // 6. Test Logout from Account Center
    console.log('7. Clicking "تسجيل الخروج" (handleLogout)...');
    await page.evaluate(() => {
        handleLogout();
    });
    await page.waitForTimeout(600);

    const logoutResult = await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        const nameField = document.getElementById('nameFieldContainer');
        const submitText = document.getElementById('authSubmitBtnText');
        return {
            landingVisible: landing && !landing.classList.contains('hidden') && landing.style.display !== 'none',
            mainAppHidden: mainApp && (mainApp.classList.contains('hidden') || mainApp.style.display === 'none'),
            isLoginTabActive: nameField && nameField.classList.contains('hidden'),
            submitButtonText: submitText ? submitText.innerText : '',
            isLoggedIn: SafeStorage.getItem('motorCare_LoggedIn')
        };
    });
    console.log('State after Logout click:', logoutResult);
    if (!logoutResult.landingVisible || !logoutResult.isLoginTabActive) {
        console.error('FAIL: Logout did not properly transition to login screen!');
        process.exit(1);
    }

    await page.screenshot({ path: 'scratch/screenshot_logout_success.png' });

    console.log('Console errors during test:', consoleErrors);
    await browser.close();

    if (consoleErrors.length > 0) {
        console.error('FAIL: Console errors detected:', consoleErrors);
        process.exit(1);
    }

    console.log('SUCCESS: All logout and upgrade functionality tested and verified 100%!');
})();
