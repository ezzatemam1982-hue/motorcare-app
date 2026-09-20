const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.text().includes('MotorCare') || msg.text().includes('Firebase') || msg.text().includes('Firestore')) {
            console.log('[Browser]', msg.text());
        }
    });

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    console.log('1. Navigating...');
    // Use very long timeout - this file is 1.8MB
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('2. Page loaded. Waiting for Firebase...');
    await page.waitForTimeout(5000);

    // Try to initialize Firestore
    await page.evaluate(() => {
        if (typeof initFirestoreDatabase === 'function') initFirestoreDatabase();
    });
    await page.waitForTimeout(3000);

    console.log('3. Deleting ezzat.emam1982@gmail.com...');
    const result = await page.evaluate(async () => {
        const targetEmail = 'ezzat.emam1982@gmail.com';
        const userKey = targetEmail.replace(/[^a-z0-9_]/g, '_');
        const out = { targetEmail, userKey, local: 'N/A', firestore: 'N/A' };

        // Clean local
        try {
            const raw = SafeStorage.getItem('motorCare_AccountsDB');
            if (raw) {
                const accs = JSON.parse(raw);
                const filtered = accs.filter(a => !(a.email && a.email.toLowerCase() === targetEmail));
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(filtered));
                out.local = (accs.length !== filtered.length) ? 'REMOVED' : 'NOT_FOUND';
            }
        } catch(e) { out.local = 'ERROR: ' + e.message; }

        // Clean Firestore
        if (typeof firestoreDb !== 'undefined' && firestoreDb) {
            try {
                const docRef = firestoreDb.collection('motorcare_users').doc(userKey);
                const snap = await docRef.get();
                if (snap && snap.exists) {
                    await docRef.delete();
                    out.firestore = 'DELETED';
                } else {
                    out.firestore = 'NOT_FOUND (key: ' + userKey + ')';
                }
            } catch(err) { out.firestore = 'ERROR: ' + err.message; }
        } else {
            out.firestore = 'FIRESTORE_NOT_READY';
        }
        return out;
    });

    console.log('RESULT:', JSON.stringify(result, null, 2));
    await browser.close();
})();
