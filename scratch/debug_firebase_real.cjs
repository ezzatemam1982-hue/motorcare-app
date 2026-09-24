// scratch/debug_firebase_real.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== INSPECTING REAL FIREBASE CONNECTION IN BROWSER ===');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    page.on('console', msg => {
        console.log(`[Browser ${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', err => {
        console.error('[Browser PageError]:', err.message);
    });

    page.on('requestfailed', request => {
        console.warn(`[Request Failed]: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Emulate the exact user in the screenshot:
    // Email: ezzat.emam1982@gmail.com, Name: ezzat emam, provider: google, isRegistered: true
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        const userProf = {
            name: 'ezzat emam',
            email: 'ezzat.emam1982@gmail.com',
            provider: 'google',
            isRegistered: true,
            isVerified: true
        };
        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(userProf));
        SafeStorage.setItem('motorCare_LoggedIn', 'true');
    });

    // Reload with user logged in
    console.log('\n--- Reloading with logged-in user profile ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const diagnostics = await page.evaluate(async () => {
        const hasFirebase = typeof firebase !== 'undefined';
        const hasFirestore = typeof firebase?.firestore === 'function';
        const hasAuth = typeof firebase?.auth === 'function';
        const cfg = typeof getFirebaseConfig === 'function' ? getFirebaseConfig() : null;
        const dbReady = typeof initFirestoreDatabase === 'function' ? initFirestoreDatabase() : false;
        const userKey = typeof getCloudSyncUserKey === 'function' ? getCloudSyncUserKey() : null;
        const syncEnabled = SafeStorage.getItem('motorCare_CloudSyncEnabled');

        let firestoreError = null;
        let readSuccess = false;
        if (dbReady && window.firestoreDb) {
            try {
                const snap = await window.firestoreDb.collection('motorcare_users').doc(userKey || 'test').get();
                readSuccess = true;
            } catch(e) {
                firestoreError = e.message + ' (code: ' + e.code + ')';
            }
        }

        return {
            hasFirebase,
            hasFirestore,
            hasAuth,
            cfg,
            dbReady,
            userKey,
            syncEnabled,
            firestoreError,
            readSuccess,
            badgeHtml: document.getElementById('accountModalCloudSyncBadge')?.innerHTML,
            badgeText: document.getElementById('accountModalCloudSyncBadge')?.innerText,
            toggleChecked: document.getElementById('accountModalCloudSyncToggle')?.checked
        };
    });

    console.log('\n--- DIAGNOSTICS RESULT ---');
    console.dir(diagnostics, { depth: null });

    await browser.close();
})().catch(e => {
    console.error('Fatal error:', e);
});
