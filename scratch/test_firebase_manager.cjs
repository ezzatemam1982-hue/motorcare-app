// scratch/test_firebase_manager.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== TESTING FIREBASE MANAGER AND ACCOUNT CLOUD SYNC ===');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8089/index.html');

    // Simulate logged-in user matching screenshot: ezzat emam
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify({
            name: 'ezzat emam',
            email: 'ezzat.emam1982@gmail.com',
            provider: 'google',
            isRegistered: true,
            isVerified: true
        }));
        SafeStorage.setItem('motorCare_LoggedIn', 'true');
        openAccountCenter();
    });

    await page.waitForTimeout(600);

    // 1. Verify Account Center modal state
    const accountState = await page.evaluate(() => {
        const toggle = document.getElementById('accountModalCloudSyncToggle');
        const projLabel = document.getElementById('accountModalFirebaseProjectLabel');
        return {
            toggleChecked: toggle?.checked,
            toggleDisabled: toggle?.disabled,
            projLabelText: projLabel?.innerText
        };
    });
    console.log('1. Account Center State:', accountState);
    if (!accountState.toggleChecked) throw new Error('Toggle should be checked by default for registered users!');

    // 2. Open Firebase Config Modal
    await page.evaluate(() => {
        openFirebaseConfigModal();
    });
    await page.waitForTimeout(300);

    const isModalVisible = await page.evaluate(() => {
        const modal = document.getElementById('firebaseConfigModal');
        return !modal?.classList.contains('hidden');
    });
    console.log('2. Firebase Config Modal Open:', isModalVisible);
    if (!isModalVisible) throw new Error('Firebase Config Modal should be visible!');

    // 3. Test Test Connection Button
    console.log('3. Clicking Test Firebase Connection button...');
    await page.evaluate(async () => {
        await testCurrentFirebaseConnection();
    });
    await page.waitForTimeout(1000);

    const testResult = await page.evaluate(() => {
        const badge = document.getElementById('firebaseConnStatusBadge');
        const details = document.getElementById('firebaseConnDetails');
        return {
            badgeText: badge?.innerText,
            hasDetails: !details?.classList.contains('hidden'),
            detailsHtml: details?.innerHTML
        };
    });
    console.log('3. Connection Test Diagnostics Result:', testResult);

    // 4. Test Saving a Custom Firebase Config
    console.log('4. Testing saving custom Firebase Config...');
    await page.evaluate(() => {
        const textarea = document.getElementById('customFirebaseConfigTextarea');
        textarea.value = JSON.stringify({
            apiKey: 'AIzaSyDemoCustomApiKeyForTest123456789',
            authDomain: 'my-custom-project.firebaseapp.com',
            projectId: 'my-custom-project',
            storageBucket: 'my-custom-project.firebasestorage.app',
            messagingSenderId: '1234567890',
            appId: '1:1234567890:web:abcdef123456'
        });
        handleSaveCustomFirebaseConfig();
    });
    await page.waitForTimeout(1500);

    const customSavedState = await page.evaluate(() => {
        const cfg = getFirebaseConfig();
        const activeLabel = document.getElementById('currentActiveFirebaseProjectId');
        const modalLabel = document.getElementById('accountModalFirebaseProjectLabel');
        return {
            savedProjectId: cfg?.projectId,
            activeLabelText: activeLabel?.innerText,
            modalLabelText: modalLabel?.innerText
        };
    });
    console.log('4. Custom Config Applied State:', customSavedState);
    if (customSavedState.savedProjectId !== 'my-custom-project') {
        throw new Error('Custom projectId was not applied correctly!');
    }

    // 5. Test Resetting to Default
    console.log('5. Testing reset to default config...');
    await page.evaluate(() => {
        handleResetDefaultFirebaseConfig();
    });
    await page.waitForTimeout(500);

    const resetState = await page.evaluate(() => {
        const cfg = getFirebaseConfig();
        return {
            projectId: cfg?.projectId
        };
    });
    console.log('5. Reset State:', resetState);
    if (resetState.projectId !== 'motorcare-1b6d2') {
        throw new Error('Reset failed to restore default motorcare-1b6d2 config!');
    }

    console.log('\n=== ALL TESTS PASSED 100% PERFECTLY! ===');
    await browser.close();
})();
