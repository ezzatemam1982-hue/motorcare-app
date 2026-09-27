const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const assert = require('assert');
const path = require('path');

(async () => {
    console.log('--- Testing Desktop Sidebar Visibility ---');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const fileUrl = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    // Simulate logged in app state and show main app layout
    await page.evaluate(() => {
        const landing = document.getElementById('landingScreen');
        if (landing) landing.style.display = 'none';
        const main = document.getElementById('mainAppContainer');
        if (main) main.style.display = 'flex';
        if (typeof window.appState !== 'undefined') {
            window.appState.user = { uid: 'test12345', email: 'test@motorcare.com', displayName: 'Test User' };
        }
    });
    await page.waitForTimeout(1000);

    const sidebarVisible = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        const rect = aside ? aside.getBoundingClientRect() : null;
        const style = aside ? window.getComputedStyle(aside) : null;
        return {
            asideExists: !!aside,
            asideDisplay: style ? style.display : null,
            rect: rect ? { width: rect.width, height: rect.height, top: rect.top, left: rect.left } : null
        };
    });

    console.log('Desktop Sidebar Evaluation Result:', sidebarVisible);
    await browser.close();

    if (sidebarVisible.display === 'none' || sidebarVisible.width === 0) {
        console.error('❌ FAIL: Sidebar is hidden!');
        process.exit(1);
    } else {
        console.log('✅ SUCCESS: Sidebar is visible on desktop!');
    }
})();
