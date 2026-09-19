// scratch/debug_live_interaction.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const fs = require('fs');

(async () => {
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, locale: 'ar-EG' });
    const page = await context.newPage();

    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({ type: msg.type(), text: msg.text(), loc: msg.location() });
        console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
        console.log('[Browser PageError]:', err.message, err.stack);
    });

    console.log('1. Navigating to http://localhost:8089/index.html ...');
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Enter as Guest or ensure logged in
    console.log('2. Ensuring user is in main app (handleGuestEntry)...');
    await page.evaluate(() => {
        if (typeof handleGuestEntry === 'function') {
            handleGuestEntry();
        } else {
            document.getElementById('landingScreen')?.style.setProperty('display', 'none');
            document.getElementById('mainAppContainer')?.style.setProperty('display', 'flex');
        }
    });
    await page.waitForTimeout(1000);

    // Open Service Centers Modal
    console.log('3. Opening Service Centers Modal via openServiceCentersModal()...');
    await page.evaluate(() => {
        openServiceCentersModal();
    });
    await page.waitForTimeout(1000);

    // Check visibility of Service Centers Modal
    const scModalVisible = await page.evaluate(() => {
        const m = document.getElementById('serviceCentersModal');
        return m && !m.classList.contains('hidden');
    });
    console.log('Service Centers Modal is visible:', scModalVisible);

    // Inspect the cards inside #scCardsContainer
    const cardDetails = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('#scCardsContainer > div'));
        return cards.slice(0, 3).map((c, i) => {
            const h4 = c.querySelector('h4');
            const btns = Array.from(c.querySelectorAll('button, a')).map(b => ({
                tag: b.tagName,
                text: b.innerText.trim(),
                onclick: b.getAttribute('onclick'),
                href: b.getAttribute('href')
            }));
            return {
                index: i,
                title: h4 ? h4.innerText : 'Unknown',
                actions: btns
            };
        });
    });
    console.log('Rendered cards sample:', JSON.stringify(cardDetails, null, 2));

    // Now let's try clicking the "تصحيح اللوكيشن" button on the first card
    console.log('4. Finding and clicking "تصحيح اللوكيشن" on the first card...');
    const firstCardBtn = await page.$('#scCardsContainer button[onclick*="openLocationCorrectionModal"]');
    if (!firstCardBtn) {
        console.error('ERROR: Could not find button[onclick*="openLocationCorrectionModal"] on any card!');
    } else {
        const btnText = await firstCardBtn.innerText();
        const onclickAttr = await firstCardBtn.getAttribute('onclick');
        console.log(`Found button with text: "${btnText}", onclick: "${onclickAttr}"`);

        console.log('Clicking button via Playwright click()...');
        await firstCardBtn.click();
        await page.waitForTimeout(1000);

        // Check if locationCorrectionModal is visible
        const modalStatus = await page.evaluate(() => {
            const m = document.getElementById('locationCorrectionModal');
            if (!m) return { exists: false };
            const style = window.getComputedStyle(m);
            const rect = m.getBoundingClientRect();
            return {
                exists: true,
                hasHiddenClass: m.classList.contains('hidden'),
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                zIndex: style.zIndex,
                width: rect.width,
                height: rect.height,
                centerName: document.getElementById('scCorrectionCenterName')?.innerText,
                centerCoords: document.getElementById('scCorrectionCurrentCoords')?.innerText,
                latVal: document.getElementById('scCorrectionLatInput')?.value,
                lngVal: document.getElementById('scCorrectionLngInput')?.value
            };
        });
        console.log('locationCorrectionModal inspection after click:', modalStatus);

        // Take a screenshot of the entire viewport
        await page.screenshot({ path: 'scratch/screenshot_after_click.png' });
        console.log('Saved screenshot to scratch/screenshot_after_click.png');

        // Check if there is another modal on top of it or z-index clash!
        const zIndexCheck = await page.evaluate(() => {
            const scM = document.getElementById('serviceCentersModal');
            const locM = document.getElementById('locationCorrectionModal');
            return {
                serviceCentersZIndex: scM ? window.getComputedStyle(scM).zIndex : null,
                locationCorrectionZIndex: locM ? window.getComputedStyle(locM).zIndex : null
            };
        });
        console.log('Z-Index Comparison:', zIndexCheck);

        // 5. Test GPS capture button click inside modal
        console.log('5. Testing GPS capture button...');
        await page.evaluate(() => {
            captureCurrentGpsForCorrection();
        });
        await page.waitForTimeout(500);

        const gpsBadge = await page.evaluate(() => {
            const b = document.getElementById('scGpsAccuracyBadge');
            return {
                hidden: b?.classList.contains('hidden'),
                text: b?.innerText
            };
        });
        console.log('GPS capture badge result:', gpsBadge);

        // 6. Test submitting a correction
        console.log('6. Testing manual input and submission...');
        await page.evaluate(() => {
            const lat = document.getElementById('scCorrectionLatInput');
            const lng = document.getElementById('scCorrectionLngInput');
            const note = document.getElementById('scCorrectionNotesInput');
            if (lat) lat.value = '30.012345';
            if (lng) lng.value = '31.234567';
            if (note) note.value = 'تجربة فحص الأخطاء';
        });

        const submitBtn = await page.$('#scSubmitCorrectionBtn');
        if (submitBtn) {
            console.log('Clicking submit button...');
            await submitBtn.click();
            await page.waitForTimeout(1500);

            const statusBanner = await page.evaluate(() => {
                const s = document.getElementById('scCorrectionStatus');
                return {
                    hidden: s?.classList.contains('hidden'),
                    text: s?.innerText,
                    classes: s?.className
                };
            });
            console.log('Submit status banner:', statusBanner);
        }
    }

    await browser.close();
    console.log('Test finished.');
})();
