const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const assert = require('assert');

(async () => {
    console.log('--- COMPREHENSIVE GOOGLE MAPS LABELED INTEGRATION TEST ---');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    await page.goto('http://127.0.0.1:8089/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // 1. Verify getServiceCenterMapsUrl and openServiceCenterMap exist on window
    const functionsExist = await page.evaluate(() => {
        return {
            hasGetUrl: typeof window.getServiceCenterMapsUrl === 'function',
            hasOpenMap: typeof window.openServiceCenterMap === 'function'
        };
    });
    console.log('1. Helper functions exported on window:', functionsExist);
    assert(functionsExist.hasGetUrl, 'getServiceCenterMapsUrl must be a function on window');
    assert(functionsExist.hasOpenMap, 'openServiceCenterMap must be a function on window');

    // 2. Unit-test getServiceCenterMapsUrl with various payloads
    const urlTests = await page.evaluate(() => {
        const test1 = window.getServiceCenterMapsUrl({
            id: 'test1',
            name: 'توكيل نيسان - أوتو إيجيبت العبور',
            agency: 'أوتو إيجيبت',
            gov: 'القليوبية',
            area: 'العبور',
            lat: 30.22,
            lng: 31.45
        });

        const testNoCoords = window.getServiceCenterMapsUrl({
            id: 'test2',
            name: 'مركز صيانة كيا الهرم',
            agency: 'كيا موتورز',
            gov: 'الجيزة',
            area: 'الهرم'
        });

        const testWithUserCorr = window.getServiceCenterMapsUrl(
            { id: 'test3', name: 'مركز رينو المهندسين', gov: 'الجيزة', lat: 30.01, lng: 31.02 },
            { newLat: 30.05, newLng: 31.21 }
        );

        return { test1, testNoCoords, testWithUserCorr };
    });

    console.log('2. URL generation tests:');
    console.log('   - Labeled Coords URL:', urlTests.test1);
    console.log('   - Named Query Search URL:', urlTests.testNoCoords);
    console.log('   - Corrected Coords URL:', urlTests.testWithUserCorr);

    assert(urlTests.test1.includes('https://www.google.com/maps?q=30.22,31.45+('), 'URL must contain labeled coordinates');
    assert(decodeURIComponent(urlTests.test1).includes('توكيل نيسان - أوتو إيجيبت العبور'), 'URL label must contain business name');
    assert(urlTests.testNoCoords.startsWith('https://www.google.com/maps/search/?api=1&query='), 'No-coords URL must use search query format');
    assert(urlTests.testWithUserCorr.includes('30.05,31.21+('), 'User correction coordinates must be used in URL');

    // 3. Open modal and inspect rendered cards
    console.log('3. Opening Service Centers modal and checking UI cards...');
    await page.evaluate(() => {
        window.openServiceCentersModal();
        const brandSelect = document.getElementById('scBrandFilter');
        if (brandSelect) brandSelect.value = 'Hyundai';
        window.applyServiceCenterFilters();
    });
    await page.waitForTimeout(600);

    const cardsValidation = await page.evaluate(() => {
        const cardEls = document.querySelectorAll('#scCardsContainer > div');
        let checkedCount = 0;
        let allHaveLabels = true;
        let allHaveOpenAction = true;
        const samples = [];

        cardEls.forEach(card => {
            const h4 = card.querySelector('h4');
            if (!h4) return; // skip notice disclaimer
            checkedCount++;
            const mapAnchor = card.querySelector('a[href*="google.com/maps"]');
            if (mapAnchor) {
                const href = mapAnchor.getAttribute('href');
                const onclick = mapAnchor.getAttribute('onclick') || '';
                const hasLabel = href.includes('+(') || href.includes('search/?api=1&query=');
                const hasOpen = onclick.includes('openServiceCenterMap');
                if (!hasLabel) allHaveLabels = false;
                if (!hasOpen) allHaveOpenAction = false;
                if (samples.length < 3) {
                    samples.push({ title: h4.innerText.trim(), href, onclick });
                }
            }
        });

        return { checkedCount, allHaveLabels, allHaveOpenAction, samples };
    });

    console.log(`   Checked ${cardsValidation.checkedCount} Hyundai service centers.`);
    console.log('   All cards have labeled Google Maps links:', cardsValidation.allHaveLabels);
    console.log('   All cards have openServiceCenterMap action handler:', cardsValidation.allHaveOpenAction);
    cardsValidation.samples.forEach((s, idx) => {
        console.log(`   Sample [${idx+1}]: ${s.title}`);
        console.log(`     href: ${s.href}`);
        console.log(`     onclick: ${s.onclick}`);
    });

    assert(cardsValidation.checkedCount > 0, 'Must have found Hyundai centers');
    assert(cardsValidation.allHaveLabels, 'All cards must have labeled Google Maps URLs');
    assert(cardsValidation.allHaveOpenAction, 'All cards must have openServiceCenterMap click action');

    // 4. Test Native intent simulation
    console.log('4. Testing Mobile / Capacitor intent trigger...');
    const nativeIntentTest = await page.evaluate(() => {
        window.Capacitor = {
            isNativePlatform: () => true
        };
        // Mock window.open
        let openedUrl = null;
        let openedTarget = null;
        window.open = (url, target) => {
            openedUrl = url;
            openedTarget = target;
        };

        const centers = window.MOTORCARE_SERVICE_CENTERS || [];
        const testCenter = centers[0];
        window.openServiceCenterMap(testCenter.id);

        return { centerName: testCenter.name, openedUrl, openedTarget };
    });
    console.log('   Native openServiceCenterMap result:', nativeIntentTest);

    await browser.close();
    console.log('--- ALL MAPS LABELED INTEGRATION TESTS PASSED! ---');
})();
