const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Seed a test account
    await page.evaluate(() => {
        const testAcc = [{
            id: 'acc_test_existing',
            name: 'مستخدم تجريبي',
            email: 'existing@test.com',
            password: 'pass1234',
            provider: 'email',
            isRegistered: true,
            isVerified: true,
            emailVerified: true
        }];
        SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(testAcc));
        SafeStorage.removeItem('motorCare_LoggedIn');
        SafeStorage.removeItem('motorCare_UserProfile');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Test 1: Try to create account with existing email + same password from Register tab
    console.log('--- TEST 1: Try to register with existing email (same password) ---');
    await page.evaluate(() => switchAuthTab('register'));
    await page.waitForTimeout(300);
    await page.evaluate(() => {
        document.getElementById('authFullName').value = 'اسم جديد';
        document.getElementById('authEmail').value = 'existing@test.com';
        document.getElementById('authPassword').value = 'pass1234';
    });
    await page.evaluate(() => document.getElementById('authSubmitBtn').click());
    await page.waitForTimeout(1500);

    const state1 = await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        const nameContainer = document.getElementById('nameFieldContainer');
        return {
            // Should still be on landing (not logged in)
            landingVisible: landing && landing.style.display !== 'none' && !landing.classList.contains('hidden'),
            mainAppVisible: mainApp && mainApp.style.display !== 'none' && !mainApp.classList.contains('hidden'),
            // Should be switched to login tab
            onLoginTab: nameContainer && nameContainer.classList.contains('hidden'),
        };
    });
    console.log('Test 1 - Existing email (same password) in register tab:');
    console.log('  - Still on landing (good=true):', state1.landingVisible);
    console.log('  - Main app NOT shown (good=false):', state1.mainAppVisible);
    console.log('  - Switched to login tab (good=true):', state1.onLoginTab);

    // Test 2: Try to register with existing email + WRONG password
    console.log('--- TEST 2: Try to register with existing email (different password) ---');
    await page.evaluate(() => switchAuthTab('register'));
    await page.waitForTimeout(300);
    await page.evaluate(() => {
        document.getElementById('authFullName').value = 'اسم آخر';
        document.getElementById('authEmail').value = 'existing@test.com';
        document.getElementById('authPassword').value = 'wrongpassword';
    });
    await page.evaluate(() => document.getElementById('authSubmitBtn').click());
    await page.waitForTimeout(1500);

    const state2 = await page.evaluate(() => {
        const nameContainer = document.getElementById('nameFieldContainer');
        return {
            onLoginTab: nameContainer && nameContainer.classList.contains('hidden')
        };
    });
    console.log('Test 2 - Existing email (different password) in register tab:');
    console.log('  - Switched to login tab (good=true):', state2.onLoginTab);

    // Test 3: Register with a NEW email (should work)
    console.log('--- TEST 3: Register with new email ---');
    await page.evaluate(() => switchAuthTab('register'));
    await page.waitForTimeout(300);
    await page.evaluate(() => {
        document.getElementById('authFullName').value = 'عميل جديد';
        document.getElementById('authEmail').value = 'newuser2026@test.com';
        document.getElementById('authPassword').value = 'secure123';
    });
    await page.evaluate(() => document.getElementById('authSubmitBtn').click());
    await page.waitForTimeout(2000);

    const state3 = await page.evaluate(() => {
        const mainApp = document.getElementById('mainAppContainer');
        const otpModal = document.getElementById('emailVerificationModal');
        const profile = SafeStorage.getItem('motorCare_UserProfile');
        return {
            mainAppVisible: mainApp && mainApp.style.display !== 'none',
            otpModalVisible: otpModal && !otpModal.classList.contains('hidden'),
            profileCreated: !!profile
        };
    });
    console.log('Test 3 - New email register:');
    console.log('  - Main app shown (good=true):', state3.mainAppVisible);
    console.log('  - OTP modal shown (good=true):', state3.otpModalVisible);
    console.log('  - Profile created (good=true):', state3.profileCreated);

    const allPassed = (
        !state1.mainAppVisible &&
        state1.onLoginTab &&
        state2.onLoginTab &&
        state3.mainAppVisible &&
        state3.profileCreated
    );
    console.log('\n=== ALL TESTS PASSED:', allPassed, '===');

    await browser.close();
})();
