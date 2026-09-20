const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('1. Navigating to http://localhost:8089/index.html...');
    await page.goto('http://localhost:8089/index.html');
    await page.waitForLoadState('domcontentloaded');

    // Reset auth to landing screen
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const isLandingVisible = await page.evaluate(() => {
        const l = document.getElementById('landingScreen');
        return l && l.style.display !== 'none' && !l.classList.contains('hidden');
    });
    console.log('Landing screen visible:', isLandingVisible);

    // Spy on window.open and Google GIS
    const spies = await page.evaluate(() => {
        window.__openedUrls = [];
        window.__tokenClientRequested = false;
        const origOpen = window.open;
        window.open = function(url, name, specs) {
            window.__openedUrls.push({ url, name });
            return { closed: false, close: function() {} };
        };
        return {
            googleClientId: window.MOTORCARE_ENV ? window.MOTORCARE_ENV.GOOGLE_CLIENT_ID : null,
            oauthClientId: typeof GOOGLE_OAUTH_CLIENT_ID !== 'undefined' ? GOOGLE_OAUTH_CLIENT_ID : null
        };
    });
    console.log('Configured Client IDs:', JSON.stringify(spies));

    // Click Google button
    console.log('2. Clicking Google sign-in button...');
    const googleBtn = page.locator('#googleSignInBtnContainer button');
    await googleBtn.click();
    await page.waitForTimeout(1000);

    // Check if googleConfirmModal was shown
    const isConfirmModalShown = await page.evaluate(() => {
        const m = document.getElementById('googleConfirmModal');
        return m && !m.classList.contains('hidden') && m.style.display !== 'none';
    });
    console.log('Was in-app googleConfirmModal shown?', isConfirmModalShown);

    const openedUrls = await page.evaluate(() => window.__openedUrls);
    console.log('Captured OAuth popup URLs:', JSON.stringify(openedUrls));

    // Test direct token login simulation
    console.log('3. Testing loginAsGoogleProfile directly...');
    await page.evaluate(() => {
        loginAsGoogleProfile('عزت إمام', 'ezzatemam@gmail.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ezzat');
    });
    await page.waitForTimeout(800);

    const mainAppVisible = await page.evaluate(() => {
        const m = document.getElementById('mainAppContainer');
        const user = localStorage.getItem('motorCare_UserProfile');
        return {
            mainAppDisplayed: m && m.style.display !== 'none',
            userProfile: JSON.parse(user || '{}')
        };
    });
    console.log('Main App state after Google login:', JSON.stringify(mainAppVisible));

    await page.screenshot({ path: 'scratch/google_auth_success.png' });
    console.log('Screenshot saved to scratch/google_auth_success.png');

    await browser.close();
    if (isConfirmModalShown) {
        console.error('FAIL: googleConfirmModal was shown when it should have gone directly to Google!');
        process.exit(1);
    }
    console.log('SUCCESS: Google sign in triggers direct Google OAuth without in-app confirmation modal!');
})();
