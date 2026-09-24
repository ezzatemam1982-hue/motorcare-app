// scratch/test_toggle_render.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8089/index.html');

    // Simulate logged-in user and open account modal
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify({
            name: 'ezzat emam',
            email: 'ezzat.emam1982@gmail.com',
            provider: 'google',
            isRegistered: true
        }));
        SafeStorage.setItem('motorCare_CloudSyncEnabled', 'true');
        openAccountCenter();
    });

    await page.waitForTimeout(1000);

    const toggleState = await page.evaluate(() => {
        const toggle = document.getElementById('accountModalCloudSyncToggle');
        const badge = document.getElementById('accountModalCloudSyncBadge');
        return {
            checked: toggle?.checked,
            disabled: toggle?.disabled,
            badgeHtml: badge?.innerHTML,
            badgeClass: badge?.className
        };
    });

    console.log('Toggle State:', toggleState);

    await page.screenshot({ path: 'scratch/account_modal_check.png' });
    await browser.close();
})();
