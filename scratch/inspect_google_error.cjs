const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('popup', async (popup) => {
        console.log('Popup URL:', popup.url());
        await popup.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000);
        console.log('Popup URL after load:', popup.url());
        const bodyText = await popup.innerText('body').catch(() => 'err');
        console.log('--- POPUP BODY TEXT ---');
        console.log(bodyText);
        await popup.screenshot({ path: 'scratch/screenshot_google_error.png' }).catch(() => {});
    });

    await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'));
    await page.waitForTimeout(2000);

    console.log('Clicking Google sign in button on file:/// ...');
    await page.evaluate(() => {
        handleSocialLogin('google');
    });

    await page.waitForTimeout(8000);
    await browser.close();
})();
