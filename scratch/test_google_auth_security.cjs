const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('Testing Google Auth Security & Vulnerability Elimination...');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();

    try {
        await page.goto('http://127.0.0.1:8089/index.html');
        await page.waitForLoadState('networkidle');

        // 1. Verify googleAuthModal does NOT exist in DOM
        const modalExists = await page.evaluate(() => {
            return document.getElementById('googleAuthModal') !== null;
        });
        console.log(`1. googleAuthModal exists in DOM: ${modalExists} (Should be false)`);
        if (modalExists) {
            throw new Error('FAIL: googleAuthModal still exists in DOM!');
        }

        // 2. Verify legacy functions do not exist on window
        const legacyFuncs = await page.evaluate(() => {
            return {
                openGoogleAuthModal: typeof window.openGoogleAuthModal,
                closeGoogleAuthModal: typeof window.closeGoogleAuthModal,
                handleGoogleAuthModalSubmit: typeof window.handleGoogleAuthModalSubmit
            };
        });
        console.log('2. Legacy window functions:', legacyFuncs);
        if (legacyFuncs.openGoogleAuthModal !== 'undefined' ||
            legacyFuncs.closeGoogleAuthModal !== 'undefined' ||
            legacyFuncs.handleGoogleAuthModalSubmit !== 'undefined') {
            throw new Error('FAIL: Legacy insecure Google modal functions are still defined!');
        }

        // 3. Check login screen state before clicking Google Sign-in
        const isAuthScreenVisibleBefore = await page.evaluate(() => {
            const screen = document.getElementById('landingScreen');
            return screen && screen.style.display !== 'none' && !screen.classList.contains('hidden');
        });
        console.log(`3. Auth screen (landingScreen) visible before: ${isAuthScreenVisibleBefore}`);

        // 4. Click Google Sign-in button
        const googleBtn = await page.$('#googleSignInBtnContainer button');
        if (googleBtn) {
            console.log('Found #googleSignInBtnContainer button, clicking it...');
            await googleBtn.click();
            await page.waitForTimeout(1000);
        } else {
            console.log('Warning: Google Sign-in button not found!');
        }

        // 5. Verify user is STILL on login screen and NOT logged in (not in main app)
        const appState = await page.evaluate(() => {
            const landingScreen = document.getElementById('landingScreen');
            const mainApp = document.getElementById('mainApp');
            const landingVisible = landingScreen && landingScreen.style.display !== 'none' && !landingScreen.classList.contains('hidden');
            const mainVisible = mainApp && mainApp.style.display !== 'none' && !mainApp.classList.contains('hidden');
            return {
                landingVisible,
                mainVisible,
                modalOpened: document.getElementById('googleAuthModal') !== null,
                currentUser: localStorage.getItem('motorcare_current_user')
            };
        });
        console.log('4. App state after clicking Google Sign-in:', appState);

        if (appState.modalOpened) {
            throw new Error('FAIL: Insecure Google Auth Modal opened!');
        }

        if (appState.mainVisible || !appState.landingVisible || appState.currentUser) {
            throw new Error('FAIL: User bypassed login or entered app without authentic Google credentials!');
        }

        console.log('✅ ALL GOOGLE AUTH SECURITY TESTS PASSED: Loophole is completely eradicated!');
    } catch (err) {
        console.error('❌ Test Error:', err.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
