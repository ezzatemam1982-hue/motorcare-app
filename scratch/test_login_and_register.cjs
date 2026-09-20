const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    
    const logs = [];
    page.on('console', msg => {
        logs.push(`[Console ${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => logs.push(`[PageError] ${err.message}`));

    const path = require('path');
    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    console.log('Navigating to', fileUrl);
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Clear login state to test landing screen
    await page.evaluate(() => {
        localStorage.removeItem('motorCare_LoggedIn');
        localStorage.removeItem('motorCare_UserProfile');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Test 1: Check landing screen visibility
    const landingVisible = await page.evaluate(() => {
        const el = document.getElementById('landingScreen');
        return el && el.style.display !== 'none' && !el.classList.contains('hidden');
    });
    console.log('Landing screen initially visible:', landingVisible);

    // Test 2: Try to create a new account
    console.log('--- TEST: Switching to Register Tab ---');
    await page.evaluate(() => switchAuthTab('register'));
    await page.waitForTimeout(500);

    const isNameVisible = await page.evaluate(() => {
        const el = document.getElementById('nameFieldContainer');
        return el && !el.classList.contains('hidden');
    });
    console.log('Name field container visible:', isNameVisible);

    console.log('--- TEST: Submitting Register Form ---');
    await page.evaluate(() => {
        document.getElementById('authFullName').value = 'احمد محمد';
        document.getElementById('authEmail').value = 'test_user_mc@gmail.com';
        document.getElementById('authPassword').value = '123456';
    });

    await page.evaluate(() => {
        document.getElementById('authSubmitBtn').click();
    });
    await page.waitForTimeout(2000);

    const afterRegisterState = await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        const otpModal = document.getElementById('emailVerificationModal');
        const userProfile = localStorage.getItem('motorCare_UserProfile');
        const activeOtp = localStorage.getItem('motorCare_ActiveEmailOtp');
        return {
            landingDisplay: landing ? landing.style.display : null,
            mainAppDisplay: mainApp ? mainApp.style.display : null,
            otpModalVisible: otpModal && !otpModal.classList.contains('hidden'),
            userProfile: userProfile ? JSON.parse(userProfile) : null,
            activeOtp: activeOtp ? JSON.parse(activeOtp) : null
        };
    });
    console.log('After Register State:', JSON.stringify(afterRegisterState, null, 2));

    // Test 3: Try to logout and login back
    console.log('--- TEST: Logout and Login ---');
    await page.evaluate(() => {
        if (typeof handleLogout === 'function') handleLogout();
    });
    await page.waitForTimeout(1000);

    const afterLogoutLanding = await page.evaluate(() => {
        const el = document.getElementById('landingScreen');
        return el && el.style.display !== 'none';
    });
    console.log('Landing visible after logout:', afterLogoutLanding);

    // Switch to login tab and try to log in
    await page.evaluate(() => switchAuthTab('login'));
    await page.waitForTimeout(300);

    await page.evaluate(() => {
        document.getElementById('authEmail').value = 'test_user_mc@gmail.com';
        document.getElementById('authPassword').value = '123456';
    });
    await page.evaluate(() => {
        document.getElementById('authSubmitBtn').click();
    });
    await page.waitForTimeout(2000);

    const afterLoginState = await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        const userProfile = localStorage.getItem('motorCare_UserProfile');
        return {
            landingDisplay: landing ? landing.style.display : null,
            mainAppDisplay: mainApp ? mainApp.style.display : null,
            userProfile: userProfile ? JSON.parse(userProfile) : null
        };
    });
    console.log('After Login State:', JSON.stringify(afterLoginState, null, 2));

    console.log('Logs captured during test:');
    logs.forEach(l => console.log(l));

    await browser.close();
})();
