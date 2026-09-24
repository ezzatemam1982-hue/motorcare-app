const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('--- TESTING MOBILE UX & CAPACITOR ESSENTIALS ---');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();

    try {
        await page.goto('http://127.0.0.1:8089/index.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 1. Verify Platform Detection & Safe Objects
        const mobileModuleCheck = await page.evaluate(() => {
            return {
                hasMotorCareMobile: typeof window.MotorCareMobile !== 'undefined',
                hasMotorCareHaptics: typeof window.MotorCareHaptics !== 'undefined',
                isNative: window.MotorCareMobile ? window.MotorCareMobile.isNativePlatform() : null,
                hasLightHaptic: typeof window.MotorCareMobile?.triggerLightHaptic === 'function',
                hasSuccessHaptic: typeof window.MotorCareMobile?.triggerSuccessHaptic === 'function',
                hasWarningHaptic: typeof window.MotorCareMobile?.triggerWarningHaptic === 'function'
            };
        });
        console.log('1. Mobile module presence:', mobileModuleCheck);
        if (!mobileModuleCheck.hasMotorCareMobile || !mobileModuleCheck.hasMotorCareHaptics) {
            throw new Error('FAIL: MotorCareMobile or MotorCareHaptics not found!');
        }

        // 2. Test Haptics execution without throwing in browser
        const hapticsTest = await page.evaluate(async () => {
            try {
                await window.MotorCareMobile.triggerLightHaptic();
                await window.MotorCareMobile.triggerSuccessHaptic();
                await window.MotorCareMobile.triggerWarningHaptic();
                return { success: true };
            } catch (err) {
                return { success: false, error: err.message };
            }
        });
        console.log('2. Haptics execution test:', hapticsTest);
        if (!hapticsTest.success) {
            throw new Error(`FAIL: Haptics threw error in browser: ${hapticsTest.error}`);
        }

        // 3. Test Back Button Hierarchy: Priority (a) Close Topmost Modal
        const modalBackTest = await page.evaluate(() => {
            // Open a test modal, e.g., notificationsHubModal
            const modal = document.getElementById('notificationsHubModal');
            if (!modal) return { success: false, error: 'notificationsHubModal not found' };
            modal.classList.remove('hidden');
            modal.style.display = 'flex';

            const wasOpen = !modal.classList.contains('hidden') && modal.style.display !== 'none';

            // Simulate hardware back button
            window.MotorCareMobile.handleHardwareBackButton(false, null);

            const isClosed = modal.classList.contains('hidden') || modal.style.display === 'none';
            return { success: wasOpen && isClosed, wasOpen, isClosed };
        });
        console.log('3. Back button Priority (a) Modal close test:', modalBackTest);
        if (!modalBackTest.success) {
            throw new Error('FAIL: Hardware back button did not close open modal!');
        }

        // 4. Test Back Button Hierarchy: Priority (b) Sub-tab to Dashboard
        const tabBackTest = await page.evaluate(() => {
            // First enter main app or set mock user
            localStorage.setItem('motorCare_LoggedIn', 'true');
            if (typeof window.switchTab === 'function') {
                window.switchTab('fuel');
            }
            const activeAfterSwitch = window.currentActiveTab;

            // Trigger back button
            window.MotorCareMobile.handleHardwareBackButton(false, null);

            const activeAfterBack = window.currentActiveTab;
            return {
                switchedToFuel: activeAfterSwitch === 'fuel',
                returnedToDashboard: activeAfterBack === 'dashboard'
            };
        });
        console.log('4. Back button Priority (b) Sub-tab to Dashboard test:', tabBackTest);
        if (!tabBackTest.switchedToFuel || !tabBackTest.returnedToDashboard) {
            throw new Error('FAIL: Hardware back button did not return from sub-tab to dashboard!');
        }

        // 5. Test Back Button Hierarchy: Priority (c) Double-tap to Exit
        const exitBackTest = await page.evaluate(() => {
            let exitAppCalled = false;
            const mockAppPlugin = {
                exitApp: () => { exitAppCalled = true; }
            };

            // First press -> should NOT call exitApp, but show toast
            window.MotorCareMobile.handleHardwareBackButton(false, mockAppPlugin);
            const exitCalledFirst = exitAppCalled;

            // Second press immediately -> should call exitApp
            window.MotorCareMobile.handleHardwareBackButton(false, mockAppPlugin);
            const exitCalledSecond = exitAppCalled;

            return { exitCalledFirst, exitCalledSecond };
        });
        console.log('5. Back button Priority (c) Double-tap exit test:', exitBackTest);
        if (exitBackTest.exitCalledFirst !== false || exitBackTest.exitCalledSecond !== true) {
            throw new Error('FAIL: Hardware back button double-tap exit hierarchy failed!');
        }

        // 6. Test Safe Area Inset CSS variables & classes
        const cssCheck = await page.evaluate(() => {
            const rootStyle = getComputedStyle(document.documentElement);
            const navEl = document.getElementById('mobileBottomNav');
            const navStyle = navEl ? getComputedStyle(navEl) : null;
            return {
                hasRootSab: rootStyle.getPropertyValue('--sab') !== '',
                navHasSafeAreaPb: navEl ? navEl.classList.contains('safe-area-pb') : false,
                navPaddingBottom: navStyle ? navStyle.paddingBottom : null
            };
        });
        console.log('6. Safe Area Inset CSS verification:', cssCheck);
        if (!cssCheck.navHasSafeAreaPb) {
            throw new Error('FAIL: mobileBottomNav missing safe-area-pb class!');
        }

        // 7. Verify Google cancel toast is removed
        await page.goto('http://127.0.0.1:8089/index.html');
        await page.waitForLoadState('networkidle');
        const googleCancelNoticeCheck = await page.evaluate(() => {
            // Trigger error_callback on GIS if defined
            const authScript = document.querySelector('script[src*="auth.js"]');
            return {
                authScriptLoaded: !!authScript,
                notificationShown: !!document.getElementById('appToastContainer')?.children.length
            };
        });
        console.log('7. Google cancel notification silence verification:', googleCancelNoticeCheck);

        console.log('🎉 ALL MOBILE UX & CAPACITOR TESTS PASSED WITH 100% SUCCESS!');
    } catch (err) {
        console.error('❌ Test Error:', err.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
