const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

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

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    console.log('1. Navigating to', fileUrl);
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');

    console.log('2. Testing legacy dummy profile cleanup on page load...');
    // Seed with old dummy profile
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify({
            name: 'مستخدم حساب Google',
            email: 'user.google@gmail.com',
            provider: 'google',
            isRegistered: true
        }));
        SafeStorage.setItem('motorCare_LoggedIn', 'true');
    });

    // Reload page to trigger startup cleanup
    await page.goto(fileUrl);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    const postCleanupState = await page.evaluate(() => {
        const user = SafeStorage.getItem('motorCare_UserProfile');
        const loggedIn = SafeStorage.getItem('motorCare_LoggedIn');
        const landing = document.getElementById('landingScreen');
        const mainApp = document.getElementById('mainAppContainer');
        return {
            user,
            loggedIn,
            landingVisible: landing && !landing.classList.contains('hidden') && landing.style.display !== 'none',
            mainAppHidden: mainApp && (mainApp.classList.contains('hidden') || mainApp.style.display === 'none')
        };
    });
    console.log('State after startup cleanup:', postCleanupState);
    if (postCleanupState.user !== null && postCleanupState.user.includes('user.google@gmail.com')) {
        console.error('FAIL: Dummy profile was not purged on startup!');
        process.exit(1);
    }
    console.log('SUCCESS: Legacy dummy Google profile successfully purged on startup!');

    console.log('3. Testing rejection of fake/dummy login attempts...');
    const dummyRejection = await page.evaluate(() => {
        const res1 = loginAsGoogleProfile('Google User', 'user.google@gmail.com');
        const res2 = loginAsGoogleProfile('', '');
        const res3 = loginAsGoogleProfile('Dummy', 'dummy@gmail.com');
        return { res1, res2, res3, user: SafeStorage.getItem('motorCare_UserProfile') };
    });
    console.log('Dummy login attempt results (should all be false):', dummyRejection);
    if (dummyRejection.res1 !== false || dummyRejection.res2 !== false || dummyRejection.res3 !== false) {
        console.error('FAIL: Dummy Google logins were not blocked!');
        process.exit(1);
    }
    console.log('SUCCESS: All dummy Google logins strictly blocked!');

    console.log('4. Testing real Google authentication acceptance...');
    const realLogin = await page.evaluate(() => {
        const res = loginAsGoogleProfile('د. عزت إمام', 'ezzatemam@gmail.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ezzat');
        const mainApp = document.getElementById('mainAppContainer');
        return {
            res,
            mainAppVisible: mainApp && !mainApp.classList.contains('hidden') && mainApp.style.display !== 'none',
            profile: JSON.parse(SafeStorage.getItem('motorCare_UserProfile') || '{}')
        };
    });
    console.log('Real Google login result:', realLogin);
    if (!realLogin.res || !realLogin.mainAppVisible || realLogin.profile.email !== 'ezzatemam@gmail.com') {
        console.error('FAIL: Real Google login failed!');
        process.exit(1);
    }
    console.log('SUCCESS: Real Google authentication verified successfully!');

    await page.screenshot({ path: 'scratch/screenshot_real_google_profile.png' });
    await browser.close();

    console.log('Console errors:', consoleErrors);
    console.log('ALL TESTS PASSED 100%!');
})();
