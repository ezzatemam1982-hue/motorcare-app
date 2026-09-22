const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'));

    await page.waitForTimeout(2000);

    // Unhide the customReportPrintSection for preview
    await page.evaluate(() => {
        const sec = document.getElementById('customReportPrintSection');
        if (sec) {
            sec.classList.remove('hidden');
            sec.style.display = 'block';
            sec.style.position = 'relative';
            sec.style.zIndex = '9999';
            sec.style.background = '#ffffff';
        }
    });

    await page.waitForTimeout(1000);
    const secEl = await page.$('#customReportPrintSection');
    if (secEl) {
        await secEl.screenshot({ path: 'scratch/screenshot_custom_report_header.png' });
        console.log('Custom report header element screenshot captured!');
    }

    await browser.close();
})();
