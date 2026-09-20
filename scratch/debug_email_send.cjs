const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('[Browser]', msg.text()));
    page.on('pageerror', err => console.log('[Browser Error]', err));

    const interceptedRequests = [];
    page.on('request', req => {
        if (req.url().includes('script.google.com')) {
            interceptedRequests.push({
                url: req.url(),
                method: req.method(),
                postData: req.postData()
            });
            console.log('[Intercepted]', req.method(), req.url());
        }
    });

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Test sendRealVerificationOtpEmail directly
    console.log('--- TEST 1: sendRealVerificationOtpEmail ---');
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify({
            name: 'تجربة',
            email: 'user@example.com'
        }));
        if (typeof sendRealVerificationOtpEmail === 'function') {
            sendRealVerificationOtpEmail();
        }
    });
    await page.waitForTimeout(2000);

    console.log('Intercepted count (Test 1):', interceptedRequests.length);

    // Test sendForgotPasswordEmail directly
    console.log('--- TEST 2: sendForgotPasswordEmail ---');
    interceptedRequests.length = 0;
    await page.evaluate(() => {
        if (typeof sendForgotPasswordEmail === 'function') {
            sendForgotPasswordEmail('user@example.com', '123456', 'تجربة');
        }
    });
    await page.waitForTimeout(2000);

    console.log('Intercepted count (Test 2):', interceptedRequests.length);
    if (interceptedRequests.length > 0) {
        const req = interceptedRequests[0];
        console.log('URL called:', req.url);
        console.log('Post Data:', req.postData);
    }

    await browser.close();
})();
