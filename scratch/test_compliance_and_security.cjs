const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('--- TESTING GOOGLE PLAY COMPLIANCE & PLAY PROTECT SECURITY ---');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();

    try {
        // 1. Check privacy.html via web server
        const privacyRes = await page.goto('http://127.0.0.1:8089/privacy.html');
        console.log(`1. privacy.html HTTP status: ${privacyRes.status()}`);
        if (privacyRes.status() !== 200) {
            throw new Error(`FAIL: privacy.html returned status ${privacyRes.status()}`);
        }

        // Verify required GDPR / Google Play disclosures inside privacy.html
        const privacyContent = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                hasGoogleOAuth: text.includes('Google') || text.includes('Google OAuth'),
                hasVehicleData: text.includes('المركبة') || text.includes('Vehicle'),
                hasFirebaseSync: text.includes('Firestore') || text.includes('Cloud'),
                hasLocalStorage: text.includes('IndexedDB') || text.includes('التخزين المحلي'),
                hasAccountDeletion: (text.includes('حذف') && text.includes('الحساب')) || text.includes('Deletion'),
                hasContactEmail: text.includes('motorcare.auto@gmail.com'),
                hasArabicAndEnglish: text.includes('سياسة الخصوصية') && text.includes('Privacy Policy')
            };
        });
        console.log('2. Privacy Policy content audit:', privacyContent);
        for (const [key, val] of Object.entries(privacyContent)) {
            if (!val) throw new Error(`FAIL: privacy.html missing required compliance item: ${key}`);
        }

        // 3. Verify Links to privacy.html in index.html
        await page.goto('http://127.0.0.1:8089/index.html');
        await page.waitForLoadState('networkidle');

        const linksAudit = await page.evaluate(() => {
            const privacyLinks = Array.from(document.querySelectorAll('a[href*="privacy.html"]'));
            return {
                count: privacyLinks.length,
                inLanding: !!document.querySelector('#landingScreen a[href*="privacy.html"]'),
                inAccountModal: !!document.querySelector('#accountCenterModal a[href*="privacy.html"]'),
                inDrawer: !!document.querySelector('#mobileMoreDrawerModal a[href*="privacy.html"]')
            };
        });
        console.log('3. In-App Privacy Links audit:', linksAudit);
        if (linksAudit.count < 3 || !linksAudit.inLanding || !linksAudit.inAccountModal || !linksAudit.inDrawer) {
            throw new Error('FAIL: Missing visible Privacy Policy links in key in-app screens!');
        }

        // 4. Verify Capacitor Configuration
        const capConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../capacitor.config.json'), 'utf-8'));
        console.log('4. capacitor.config.json audit:', {
            appId: capConfig.appId,
            appName: capConfig.appName,
            cleartext: capConfig.server?.cleartext
        });
        if (capConfig.appId !== 'com.motorcare.app') {
            throw new Error(`FAIL: Invalid appId: ${capConfig.appId}`);
        }
        if (capConfig.server?.cleartext !== false) {
            throw new Error(`FAIL: Server cleartext is not false!`);
        }

        // 5. Verify AndroidManifest.xml
        const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');
        if (fs.existsSync(manifestPath)) {
            const manifestXml = fs.readFileSync(manifestPath, 'utf-8');
            const hasCleartextFalse = manifestXml.includes('android:usesCleartextTraffic="false"');
            const hasInternetPerm = manifestXml.includes('android.permission.INTERNET');
            const hasPostNotifPerm = manifestXml.includes('android.permission.POST_NOTIFICATIONS');
            const hasDisallowedStorage = manifestXml.includes('android.permission.READ_EXTERNAL_STORAGE') ||
                                         manifestXml.includes('android.permission.WRITE_EXTERNAL_STORAGE');
            const hasDisallowedLocation = manifestXml.includes('android.permission.ACCESS_FINE_LOCATION');

            console.log('5. AndroidManifest.xml audit:', {
                hasCleartextFalse,
                hasInternetPerm,
                hasPostNotifPerm,
                hasDisallowedStorage,
                hasDisallowedLocation
            });

            if (!hasCleartextFalse) throw new Error('FAIL: AndroidManifest missing android:usesCleartextTraffic="false"');
            if (!hasInternetPerm) throw new Error('FAIL: AndroidManifest missing INTERNET permission');
            if (!hasPostNotifPerm) throw new Error('FAIL: AndroidManifest missing POST_NOTIFICATIONS permission');
            if (hasDisallowedStorage) throw new Error('FAIL: Sensitive external storage permission detected!');
            if (hasDisallowedLocation) throw new Error('FAIL: Sensitive background/fine location permission detected!');
        } else {
            console.warn('AndroidManifest.xml not found at expected path.');
        }

        console.log('🎉 ALL COMPLIANCE & SECURITY AUDITS PASSED WITH 100% SUCCESS!');
    } catch (err) {
        console.error('❌ Test Error:', err.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
})();
