const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    const popupPromise = context.waitForEvent('page');

    await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'));
    await page.waitForTimeout(2000);

    console.log('Clicking Google login button...');
    await page.evaluate(() => {
        handleSocialLogin('google');
    });

    const popup = await popupPromise;
    console.log('Popup detected!');
    await popup.waitForLoadState('domcontentloaded');
    console.log('Popup URL:', popup.url());

    await popup.waitForTimeout(4000);
    console.log('Popup URL after 4s:', popup.url());

    const title = await popup.title();
    console.log('Popup title:', title);

    const text = await popup.innerText('body');
    console.log('Popup body:', text.substring(0, 800));

    await popup.screenshot({ path: 'scratch/screenshot_google_error.png' });
    console.log('Screenshot saved to scratch/screenshot_google_error.png');

    await browser.close();
})();
