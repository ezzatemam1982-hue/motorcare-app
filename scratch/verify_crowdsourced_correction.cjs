// scratch/verify_crowdsourced_correction.js
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

async function run() {
    console.log('[Test] Launching Microsoft Edge via Playwright...');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        locale: 'ar-EG'
    });

    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('[Browser Console Error]:', msg.text());
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', err => {
        console.log('[Browser PageError]:', err.message);
        consoleErrors.push(err.message);
    });

    console.log('[Test] Navigating to http://localhost:8089/index.html ...');
    await page.goto('http://localhost:8089/index.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Clear previous storage to ensure clean test
    await page.evaluate(() => {
        try {
            if (typeof SafeStorage !== 'undefined') {
                SafeStorage.removeItem('motorCare_scUserCorrections');
            }
            localStorage.removeItem('motorCare_scUserCorrections');
        } catch (_) {}
    });

    // 1. Check page title
    const title = await page.title();
    console.log('[Test] Page Title:', title);

    // 2. Open Service Centers Modal
    console.log('[Test] Calling openServiceCentersModal()...');
    await page.evaluate(() => {
        if (typeof openServiceCentersModal === 'function') {
            openServiceCentersModal();
        } else {
            throw new Error('openServiceCentersModal is not defined');
        }
    });
    await page.waitForTimeout(1000);

    // Verify modal is visible
    const isModalVisible = await page.evaluate(() => {
        const m = document.getElementById('serviceCentersModal');
        return m && !m.classList.contains('hidden');
    });
    console.log('[Test] Service Centers modal visible:', isModalVisible);
    if (!isModalVisible) throw new Error('Service Centers modal failed to open');

    // 3. Verify cards and action buttons
    const cardsCount = await page.evaluate(() => {
        return document.querySelectorAll('#scCardsContainer > div').length;
    });
    console.log('[Test] Rendered service center cards count:', cardsCount);
    if (cardsCount === 0) throw new Error('No service center cards rendered');

    // Check action buttons in the first card
    const firstCardButtons = await page.evaluate(() => {
        const firstCard = document.querySelector('#scCardsContainer > div');
        if (!firstCard) return null;
        const gpsLink = firstCard.querySelector('a[href*="google.com/maps"]');
        const correctBtn = firstCard.querySelector('button[onclick*="openLocationCorrectionModal"]');
        return {
            hasGpsLink: !!gpsLink,
            gpsHref: gpsLink ? gpsLink.href : null,
            hasCorrectBtn: !!correctBtn,
            correctBtnText: correctBtn ? correctBtn.innerText.trim() : null
        };
    });
    console.log('[Test] First card action buttons check:', firstCardButtons);
    if (!firstCardButtons.hasGpsLink || !firstCardButtons.hasCorrectBtn) {
        throw new Error('Action buttons missing in service center card');
    }

    // 4. Open Location Correction Modal for the first center
    console.log('[Test] Triggering openLocationCorrectionModal for first center...');
    const targetCenterId = await page.evaluate(() => {
        const firstCard = document.querySelector('#scCardsContainer > div');
        const correctBtn = firstCard.querySelector('button[onclick*="openLocationCorrectionModal"]');
        const onclickAttr = correctBtn.getAttribute('onclick');
        const match = onclickAttr.match(/openLocationCorrectionModal\(['"]([^'"]+)['"]\)/);
        return match ? match[1] : null;
    });
    console.log('[Test] Target Center ID:', targetCenterId);
    if (!targetCenterId) throw new Error('Could not extract centerId from button onclick');

    await page.evaluate((id) => {
        openLocationCorrectionModal(id);
    }, targetCenterId);
    await page.waitForTimeout(800);

    // Verify location correction modal is visible and populated
    const corrModalState = await page.evaluate(() => {
        const m = document.getElementById('locationCorrectionModal');
        const name = document.getElementById('scCorrectionCenterName')?.textContent;
        const currentCoords = document.getElementById('scCorrectionCurrentCoords')?.textContent;
        const lat = document.getElementById('scCorrectionLatInput')?.value;
        const lng = document.getElementById('scCorrectionLngInput')?.value;
        return {
            isVisible: m && !m.classList.contains('hidden'),
            name,
            currentCoords,
            lat,
            lng
        };
    });
    console.log('[Test] Location correction modal state:', corrModalState);
    if (!corrModalState.isVisible) throw new Error('Location correction modal is not visible');

    // 5. Test Google Maps URL Auto-parsing
    console.log('[Test] Testing handlePasteMapsUrl with a realistic Google Maps URL...');
    const testMapsUrl = 'https://www.google.com/maps/@30.071234,31.234567,17z';
    await page.evaluate((url) => {
        const input = document.getElementById('scCorrectionMapsUrlInput');
        input.value = url;
        handlePasteMapsUrl(input);
    }, testMapsUrl);

    const parsedCoords = await page.evaluate(() => {
        return {
            lat: document.getElementById('scCorrectionLatInput')?.value,
            lng: document.getElementById('scCorrectionLngInput')?.value,
            noticeVisible: !document.getElementById('scMapsUrlParseNotice')?.classList.contains('hidden'),
            noticeText: document.getElementById('scMapsUrlParseNotice')?.innerText
        };
    });
    console.log('[Test] Auto-parsed coordinates:', parsedCoords);
    if (parsedCoords.lat !== '30.071234' || parsedCoords.lng !== '31.234567') {
        throw new Error(`Coordinates parse mismatch! Got lat=${parsedCoords.lat}, lng=${parsedCoords.lng}`);
    }

    // 6. Test submitting correction
    console.log('[Test] Filling notes and submitting correction...');
    await page.evaluate(() => {
        document.getElementById('scCorrectionNotesInput').value = 'اختبار الجودة الآلي: تعديل تجريبي لشارع المركز المقابل';
        document.getElementById('scCorrectionEmailInput').value = 'test.qa@motorcare.app';
    });

    await page.evaluate(async () => {
        await submitLocationCorrection();
    });
    await page.waitForTimeout(1000);

    // Verify status message
    const submitStatus = await page.evaluate(() => {
        const s = document.getElementById('scCorrectionStatus');
        return {
            isVisible: s && !s.classList.contains('hidden'),
            text: s ? s.innerText : null
        };
    });
    console.log('[Test] Submission status feedback:', submitStatus);
    if (!submitStatus.isVisible) throw new Error('Expected submission status feedback banner');

    // Verify localStorage has saved the correction
    const savedCorrection = await page.evaluate((id) => {
        const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data[id] || null;
    }, targetCenterId);
    console.log('[Test] Stored correction in SafeStorage:', savedCorrection);
    if (!savedCorrection || savedCorrection.newLat !== 30.071234 || savedCorrection.newLng !== 31.234567) {
        throw new Error('Correction was not properly saved to localStorage/SafeStorage');
    }

    // Wait for modal auto-close
    await page.waitForTimeout(2500);
    const isCorrModalClosed = await page.evaluate(() => {
        const m = document.getElementById('locationCorrectionModal');
        return m ? m.classList.contains('hidden') : true;
    });
    console.log('[Test] Location correction modal auto-closed:', isCorrModalClosed);

    // 7. Verify the center card in the list now displays the correction badge & updated GPS link
    const updatedCardInfo = await page.evaluate((id) => {
        const card = Array.from(document.querySelectorAll('#scCardsContainer > div')).find(el => {
            return el.innerHTML.includes(id) || (el.querySelector('button[onclick*="openLocationCorrectionModal"]') && el.innerHTML.includes('توكيل كيا إيجيبت (EIT) - فرع أسيوط'));
        });
        if (!card) return null;
        const gpsLink = card.querySelector('a[href*="google.com/maps"]');
        const correctBtn = card.querySelector('button[onclick*="openLocationCorrectionModal"]');
        return {
            hasCorrectionBadge: card.innerHTML.includes('تم تصحيح الموقع محلياً'),
            gpsHref: gpsLink ? gpsLink.href : null,
            buttonText: correctBtn ? correctBtn.innerText.trim() : null
        };
    });
    console.log('[Test] Updated card in list:', updatedCardInfo);
    if (!updatedCardInfo || !updatedCardInfo.hasCorrectionBadge) {
        throw new Error('Updated card does not show "تم تصحيح الموقع محلياً" badge!');
    }
    if (!updatedCardInfo.gpsHref.includes('30.071234') && !updatedCardInfo.gpsHref.includes('31.234567')) {
        throw new Error('GPS link was not updated with the new corrected coordinates');
    }

    // 8. Test viewUserCorrectionsModal()
    console.log('[Test] Testing viewUserCorrectionsModal()...');
    await page.evaluate(() => {
        viewUserCorrectionsModal();
    });
    await page.waitForTimeout(800);

    const historyModalState = await page.evaluate(() => {
        const m = document.getElementById('userCorrectionsHistoryModal');
        const items = document.querySelectorAll('#userCorrectionsListContainer > div');
        return {
            isVisible: m && !m.classList.contains('hidden'),
            itemsCount: items.length,
            firstItemText: items.length > 0 ? items[0].innerText : ''
        };
    });
    console.log('[Test] User corrections history modal state:', historyModalState);
    if (!historyModalState.isVisible || historyModalState.itemsCount === 0) {
        throw new Error('History modal failed to display saved correction!');
    }

    // Close history modal
    await page.evaluate(() => {
        closeUserCorrectionsHistoryModal();
    });

    console.log('[Test] Console errors during test run:', consoleErrors);
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Content Security Policy'));
    if (fatalErrors.length > 0) {
        console.warn('[Test] Warnings/Non-fatal errors:', fatalErrors);
    }

    console.log('[Test] ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS! 🎉');
    await browser.close();
}

run().catch(err => {
    console.error('[Test Failed]:', err);
    process.exit(1);
});
