const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('--- TESTING SERVICE CENTERS MODAL & GPS LINKS ---');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    await page.goto('http://127.0.0.1:8089/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // Open Service Centers Modal
    console.log('1. Opening Service Centers Modal...');
    await page.evaluate(() => {
        if (typeof window.openServiceCentersModal === 'function') {
            window.openServiceCentersModal();
        }
    });
    await page.waitForTimeout(1000);

    // Filter by Geely
    console.log('2. Filtering by Geely...');
    await page.evaluate(() => {
        const brandSelect = document.getElementById('scBrandFilter');
        if (brandSelect) {
            brandSelect.value = 'Geely';
        }
        if (typeof window.applyServiceCenterFilters === 'function') {
            window.applyServiceCenterFilters();
        }
    });
    await page.waitForTimeout(500);

    // Check rendered card links
    const cardData = await page.evaluate(() => {
        const cards = document.querySelectorAll('#scCardsContainer > div');
        const results = [];
        cards.forEach(card => {
            const title = card.querySelector('h4')?.innerText || '';
            const mapLink = card.querySelector('a[href*="google.com/maps"]')?.getAttribute('href') || '';
            results.push({ title, mapLink });
        });
        return results;
    });

    console.log(`Found ${cardData.length} Geely centers:`);
    cardData.forEach((c, idx) => {
        console.log(`  [${idx+1}] ${c.title}`);
        console.log(`      Map Link: ${c.mapLink}`);
    });

    // Capture screenshot
    await page.screenshot({ path: 'scratch/screenshot_geely_centers_verified.png' });
    console.log('Screenshot saved to scratch/screenshot_geely_centers_verified.png');

    await browser.close();
    console.log('Test completed successfully!');
})();
