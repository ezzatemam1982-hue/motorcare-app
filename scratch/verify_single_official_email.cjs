const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const interceptedRequests = [];

    // Intercept all requests to script.google.com
    await page.route('**/*', async (route) => {
        const req = route.request();
        if (req.url().includes('script.google.com')) {
            interceptedRequests.push({
                url: req.url(),
                method: req.method(),
                postData: req.postData()
            });
        }
        await route.continue();
    });

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Seed account so forgot password finds it
    await page.evaluate(() => {
        const accs = [{
            id: 'acc_test_forgot',
            name: 'مستخدم تجريبي',
            email: 'testuser@example.com',
            password: 'mypassword123',
            isRegistered: true,
            isVerified: true
        }];
        SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accs));
    });

    console.log('--- TEST: Forgot Password Request (Valid Account) ---');
    await page.evaluate(() => {
        if (typeof openForgotPasswordModal === 'function') openForgotPasswordModal();
        const emailInput = document.getElementById('forgotEmailInput');
        if (emailInput) emailInput.value = 'testuser@example.com';
    });
    await page.waitForTimeout(500);

    interceptedRequests.length = 0; // Clear requests
    await page.evaluate(() => {
        if (typeof handleForgotSendCode === 'function') handleForgotSendCode();
    });
    await page.waitForTimeout(3000);

    console.log(`Intercepted ${interceptedRequests.length} request(s) to script.google.com:`);
    let testPassed = true;

    if (interceptedRequests.length !== 1) {
        console.error(`FAILED: Expected exactly 1 request, got ${interceptedRequests.length}`);
        testPassed = false;
    } else {
        const r = interceptedRequests[0];
        console.log('Request URL:', r.url);
        const isOfficial = r.url.includes('AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc');
        const hasOld = r.url.includes('AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A');
        console.log('Is official webhook:', isOfficial);
        console.log('Has old webhook:', hasOld);
        
        let payload = {};
        try { payload = JSON.parse(r.postData || '{}'); } catch(e) {}
        console.log('Payload Sender:', payload.sender);
        console.log('Payload Subject:', payload.subject);
        console.log('Has ezzat.emam in payload:', JSON.stringify(payload).includes('ezzat.emam1982'));

        if (!isOfficial || hasOld || payload.sender !== 'motorcare.auto@gmail.com' || JSON.stringify(payload).includes('ezzat.emam1982')) {
            testPassed = false;
        }
    }

    console.log('\n=== VERIFICATION RESULT ===');
    console.log('Single Official Webhook & Exclusive motorcare.auto sender:', testPassed ? 'PASSED ✅' : 'FAILED ❌');

    await browser.close();
    process.exit(testPassed ? 0 : 1);
})();
