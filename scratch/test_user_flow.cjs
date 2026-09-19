// scratch/test_user_flow.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log('[Browser Console]', msg.type(), msg.text());
        }
    });
    page.on('pageerror', err => console.log('[Browser PageError]', err.message));

    console.log('Navigating to http://localhost:8089/index.html...');
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 1. Click Top Header Menu button
    console.log('Clicking #topHeaderMenuBtn...');
    const menuBtn = await page.$('#topHeaderMenuBtn');
    console.log('Menu button found:', !!menuBtn);
    if (menuBtn) {
        await menuBtn.click();
        await page.waitForTimeout(500);
    }

    // 2. Check if dropdown opened
    const isDropdownVisible = await page.evaluate(() => {
        const d = document.getElementById('topHeaderDropdownMenu');
        return d && !d.classList.contains('hidden');
    });
    console.log('Dropdown menu visible:', isDropdownVisible);

    // 3. Look for button that opens service centers
    console.log('Clicking Service Centers item in dropdown...');
    const clicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#topHeaderDropdownMenu button'));
        const scBtn = btns.find(b => b.innerText.includes('مراكز الخدمة') || b.getAttribute('onclick')?.includes('openServiceCentersModal'));
        if (scBtn) {
            scBtn.click();
            return true;
        }
        return false;
    });
    console.log('Clicked service centers button in menu:', clicked);
    await page.waitForTimeout(1000);

    // 4. Check if serviceCentersModal is visible
    const isScModalOpen = await page.evaluate(() => {
        const m = document.getElementById('serviceCentersModal');
        return m && !m.classList.contains('hidden');
    });
    console.log('serviceCentersModal visible:', isScModalOpen);

    // 5. Find the 'تصحيح اللوكيشن' button on the first card
    const firstCardCorrectBtn = await page.$('#scCardsContainer button[onclick*="openLocationCorrectionModal"]');
    console.log('Found correct button on first card:', !!firstCardCorrectBtn);
    if (firstCardCorrectBtn) {
        console.log('Clicking correct button on first card...');
        await firstCardCorrectBtn.click();
        await page.waitForTimeout(1000);

        // Check if locationCorrectionModal opened
        const isCorrectionModalOpen = await page.evaluate(() => {
            const m = document.getElementById('locationCorrectionModal');
            return {
                exists: !!m,
                visible: m && !m.classList.contains('hidden'),
                classes: m ? m.className : null,
                centerName: document.getElementById('scCorrectionCenterName')?.innerText,
                lat: document.getElementById('scCorrectionLatInput')?.value,
                lng: document.getElementById('scCorrectionLngInput')?.value
            };
        });
        console.log('locationCorrectionModal status after click:', isCorrectionModalOpen);

        // 6. Test manual input and test submit
        console.log('Entering test coordinates in modal...');
        await page.evaluate(() => {
            document.getElementById('scCorrectionLatInput').value = '30.112233';
            document.getElementById('scCorrectionLngInput').value = '31.334455';
            document.getElementById('scCorrectionNotesInput').value = 'ملاحظة تجريبية لاختبار الحفظ';
        });

        console.log('Clicking submitLocationCorrection button in modal...');
        const submitBtn = await page.$('#scSubmitCorrectionBtn');
        console.log('Found submit button:', !!submitBtn);
        if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(1500);

            const statusFeedback = await page.evaluate(() => {
                const s = document.getElementById('scCorrectionStatus');
                return {
                    visible: s && !s.classList.contains('hidden'),
                    text: s ? s.innerText : null
                };
            });
            console.log('Status feedback after submit:', statusFeedback);
        }
    }

    await browser.close();
})();
