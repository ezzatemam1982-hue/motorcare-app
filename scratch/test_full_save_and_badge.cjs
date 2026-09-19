// scratch/test_full_save_and_badge.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, locale: 'ar-EG' });
    const page = await context.newPage();
    console.log('Navigating to http://localhost:8089/index.html...');
    await page.goto('http://localhost:8089/index.html');
    // Wait for any service worker controllerchange reload to settle
    await page.waitForTimeout(3000);

    // Enter as guest
    await page.evaluate(() => {
        if (typeof handleGuestEntry === 'function') handleGuestEntry();
    });
    await page.waitForTimeout(800);

    // Open Service Centers
    await page.evaluate(() => openServiceCentersModal());
    await page.waitForTimeout(800);

    // Click 'تصحيح اللوكيشن'
    const btn = await page.$('#scCardsContainer button[onclick*="openLocationCorrectionModal"]');
    await btn.click();
    await page.waitForTimeout(600);

    // Fill new coordinates
    await page.evaluate(() => {
        document.getElementById('scCorrectionLatInput').value = '30.088888';
        document.getElementById('scCorrectionLngInput').value = '31.288888';
        document.getElementById('scCorrectionNotesInput').value = 'تحديث مدخل البوابة الشرقية';
    });

    // Click Submit
    const submitBtn = await page.$('#scSubmitCorrectionBtn');
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Verify modal is closed
    const isModalClosed = await page.evaluate(() => {
        const m = document.getElementById('locationCorrectionModal');
        return m ? m.classList.contains('hidden') : true;
    });
    console.log('Location Correction Modal closed after save:', isModalClosed);

    // Verify card shows correction badge
    const cardBadge = await page.evaluate(() => {
        const firstCard = document.querySelector('#scCardsContainer > div');
        return {
            hasBadge: firstCard ? firstCard.innerHTML.includes('تم تصحيح الموقع محلياً') : false,
            badgeText: firstCard ? firstCard.innerText.includes('تم تصحيح الموقع محلياً') : false,
            buttonText: firstCard ? firstCard.querySelector('button[onclick*="openLocationCorrectionModal"]')?.innerText.trim() : null
        };
    });
    console.log('Card state after correction:', cardBadge);

    // Take screenshot of the updated card in the list
    await page.screenshot({ path: 'scratch/screenshot_after_save.png' });
    console.log('Screenshot saved to scratch/screenshot_after_save.png');

    await browser.close();
})();
