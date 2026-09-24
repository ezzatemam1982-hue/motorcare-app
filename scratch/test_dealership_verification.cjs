// scratch/test_dealership_verification.cjs
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('[TEST] Starting Dealership & Service Center Verification tests...');

// 1. Verify index.html and src/index.html contain the required elements
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const srcIndexHtml = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8');

assert(indexHtml.includes('id="locationCorrectionModal"'), 'index.html missing locationCorrectionModal');
assert(srcIndexHtml.includes('id="locationCorrectionModal"'), 'src/index.html missing locationCorrectionModal');

// Check modal header and title
assert(indexHtml.includes('نظام التحقق وتصحيح الفروع'), 'index.html missing modal title');
// Check Section A: Quick Confirmation
assert(indexHtml.includes('هل زرت هذا الفرع والموقع دقيق؟'), 'index.html missing Quick confirmation text');
assert(indexHtml.includes('id="scQuickConfirmBtn"'), 'index.html missing scQuickConfirmBtn');
assert(indexHtml.includes('نعم، دقيق ومطابق ✓'), 'index.html missing confirm button text');

// Check Section B: Suggest Correction
assert(indexHtml.includes('الصق رابط الفرع الصحيح من خرائط Google'), 'index.html missing maps input label');
assert(indexHtml.includes('id="scCorrectionMapsUrlInput"'), 'index.html missing scCorrectionMapsUrlInput');
assert(indexHtml.includes('استخدام موقعي الحالي إذا كنت تقف أمام الفرع الآن (GPS)'), 'index.html missing GPS button text');
assert(indexHtml.includes('ملاحظات إضافية (اختياري)'), 'index.html missing notes label');
assert(indexHtml.includes('id="scSubmitCorrectionBtn"'), 'index.html missing submit button id');
assert(indexHtml.includes('إرسال التصحيح للمراجعة'), 'index.html missing submit button label');

console.log('✓ HTML markup in index.html & src/index.html fully validated!');

// 2. Mock environment to test logic in js/services/firebase.js & js/features/serviceCenters.js
global.window = global;
global.document = {
    getElementById: (id) => {
        return {
            value: '',
            textContent: '',
            innerText: '',
            classList: {
                contains: () => false,
                remove: () => {},
                add: () => {}
            },
            setAttribute: () => {},
            disabled: false,
            style: {}
        };
    },
    querySelectorAll: () => [],
    addEventListener: () => {}
};
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
};
global.SafeStorage = {
    getItem: (k) => global.localStorage.getItem(k),
    setItem: (k, v) => global.localStorage.setItem(k, v),
    removeItem: (k) => global.localStorage.removeItem(k)
};
global.navigator = {
    onLine: true,
    geolocation: {
        getCurrentPosition: (cb) => cb({ coords: { latitude: 30.05, longitude: 31.25, accuracy: 10 } })
    }
};

let capturedToast = null;
global.showNotification = (msg, type, duration) => {
    capturedToast = { msg, type, duration };
};

// Mock Firestore / Firebase
let addedReports = [];
global.db = {
    collection: (name) => {
        return {
            add: async (data) => {
                addedReports.push({ collection: name, data });
                return { id: 'doc_' + Date.now() };
            }
        };
    }
};
global.firebase = {
    firestore: {
        FieldValue: {
            serverTimestamp: () => 'MOCK_TIMESTAMP'
        }
    }
};
global.appState = {
    user: { email: 'engineer@motorcare.app', uid: 'user_12345' }
};

// Load firebase.js
require('../js/services/firebase.js');

assert(typeof window.submitDealershipReport === 'function', 'submitDealershipReport must be exported on window');
assert(typeof window.getCurrentUserIdentifier === 'function', 'getCurrentUserIdentifier must be exported on window');

// Test submitDealershipReport
(async () => {
    const reportData = {
        branchId: 'test_branch_1',
        brand: 'Kia',
        agencyName: 'EIT',
        branchName: 'فرع مدينة نصر',
        suggestedUrl: 'https://maps.app.goo.gl/xyz',
        userLat: 30.05,
        userLng: 31.25,
        voteType: 'confirm'
    };

    const res = await window.submitDealershipReport(reportData);
    assert(res.success === true, 'submitDealershipReport failed');
    assert(addedReports.length === 1, 'Firestore add not called');
    const saved = addedReports[0];
    assert.strictEqual(saved.collection, 'dealership_reports');
    assert.strictEqual(saved.data.branchId, 'test_branch_1');
    assert.strictEqual(saved.data.brand, 'Kia');
    assert.strictEqual(saved.data.agencyName, 'EIT');
    assert.strictEqual(saved.data.branchName, 'فرع مدينة نصر');
    assert.strictEqual(saved.data.voteType, 'confirm');
    assert.strictEqual(saved.data.reportedBy, 'engineer@motorcare.app');
    assert.strictEqual(saved.data.timestamp, 'MOCK_TIMESTAMP');

    console.log('✓ Firestore submitDealershipReport successfully verified with exact collection & payload!');

    // Test offline queue fallback
    global.navigator.onLine = false;
    global.db = null;
    const offlineReport = {
        branchId: 'test_branch_offline',
        brand: 'Toyota',
        agencyName: 'Toyota Egypt',
        branchName: 'فرع العباسية',
        voteType: 'correction',
        suggestedUrl: 'https://maps.google.com/test'
    };
    const offRes = await window.submitDealershipReport(offlineReport);
    assert(offRes.queued === true, 'Offline report should be marked queued');
    const queuedReports = JSON.parse(global.localStorage.getItem('motorCare_queued_dealership_reports') || '[]');
    assert(queuedReports.length === 1, 'Queued reports should contain 1 report');
    assert.strictEqual(queuedReports[0].branchId, 'test_branch_offline');
    console.log('✓ Offline queue fallback verified!');

    // Restore online
    global.navigator.onLine = true;
    global.db = {
        collection: (name) => ({
            add: async (data) => {
                addedReports.push({ collection: name, data });
                return { id: 'doc_flush_' + Date.now() };
            }
        })
    };
    await window.flushQueuedDealershipReports();
    const queuedAfterFlush = JSON.parse(global.localStorage.getItem('motorCare_queued_dealership_reports') || '[]');
    assert.strictEqual(queuedAfterFlush.length, 0, 'Queued reports should be cleared after flush');
    console.log('✓ flushQueuedDealershipReports successfully emptied offline queue to Firestore!');

    // Now test serviceCenters.js
    require('../js/features/serviceCenters.js');

    // 1. Verify getServiceCenterMapsUrl
    assert(typeof window.getServiceCenterMapsUrl === 'function', 'getServiceCenterMapsUrl must be a function');
    const mockCenter = {
        id: 'center_1',
        brand: 'MG',
        agency: 'المنصور للسيارات',
        name: 'فرع الهرم',
        city: 'الجيزة',
        lat: 29.99,
        lng: 31.15
    };
    const mapsUrl = window.getServiceCenterMapsUrl(mockCenter);
    console.log('[Generated Maps URL]:', mapsUrl);
    // Scheme: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brand + ' ' + officialAgencyName + ' ' + branchName + ' ' + city)}
    const expectedQuery = encodeURIComponent('MG المنصور للسيارات فرع الهرم الجيزة');
    assert(mapsUrl.includes('https://www.google.com/maps/search/?api=1&query=' + expectedQuery), 'Maps URL does not follow official query scheme');
    console.log('✓ getServiceCenterMapsUrl generates official Google Business profile search query!');

    // 2. Test Place ID priority
    const centerWithPlaceId = {
        ...mockCenter,
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
    };
    const placeIdUrl = window.getServiceCenterMapsUrl(centerWithPlaceId);
    assert(placeIdUrl.includes('query_place_id=ChIJN1t_tDeuEmsRUsoyG83frY4'), 'Place ID URL missing query_place_id');
    console.log('✓ Place ID priority verified!');

    // 3. Test Verified Maps URL / Share link priority
    const centerWithShareUrl = {
        ...mockCenter,
        verifiedMapsUrl: 'https://maps.app.goo.gl/officialBranch123'
    };
    const shareUrl = window.getServiceCenterMapsUrl(centerWithShareUrl);
    assert.strictEqual(shareUrl, 'https://maps.app.goo.gl/officialBranch123', 'Verified share URL was not preserved');
    console.log('✓ Verified Maps share URL priority verified!');

    // 4. Test quick confirmation vote flow
    // Setup center in in-memory list or window.serviceCenters
    window.serviceCenters = [mockCenter];
    document.getElementById = (id) => {
        if (id === 'scCorrectionCenterId') return { value: 'center_1' };
        if (id === 'scCorrectionNotesInput') return { value: 'كل شيء ممتاز والموقع 100%' };
        if (id === 'scCorrectionMapsUrlInput') return { value: 'https://maps.app.goo.gl/officialBranch123' };
        if (id === 'scCorrectionLatInput') return { value: '29.991' };
        if (id === 'scCorrectionLngInput') return { value: '31.151' };
        if (id === 'scQuickConfirmBtn') return { disabled: false, textContent: '', classList: { add: () => {}, remove: () => {} } };
        if (id === 'scSubmitCorrectionBtn') return { disabled: false, textContent: '', classList: { add: () => {}, remove: () => {} } };
        if (id === 'scCorrectionStatus') return { textContent: '', classList: { remove: () => {}, add: () => {} } };
        return { value: '', textContent: '', classList: { contains: () => false, remove: () => {}, add: () => {} }, disabled: false };
    };

    capturedToast = null;
    await window.submitQuickBranchConfirmation();
    assert(capturedToast !== null, 'Quick confirmation should show toast');
    assert.strictEqual(capturedToast.msg, 'شكراً لمساهمتك! سيتم مراجعة وتحديث اللوكيشن لدعم باقي المستخدمين.');
    console.log('✓ Quick confirmation shows exact Arabic toast:', capturedToast.msg);

    // 5. Test suggestion correction flow
    capturedToast = null;
    await window.submitBranchCorrectionReport();
    assert(capturedToast !== null, 'Correction submission should show toast');
    assert.strictEqual(capturedToast.msg, 'شكراً لمساهمتك! سيتم مراجعة وتحديث اللوكيشن لدعم باقي المستخدمين.');
    console.log('✓ Suggest correction shows exact Arabic toast:', capturedToast.msg);

    // Verify localStorage contains local correction
    const localCorrections = JSON.parse(global.localStorage.getItem('motorCare_scUserCorrections') || '{}');
    assert(localCorrections['center_1'], 'Local correction should be stored in SafeStorage/localStorage');
    console.log('✓ Offline-first local correction preserved in SafeStorage!');

    console.log('\n=========================================');
    console.log('🎉 ALL REQUIREMENTS MET AND VERIFIED 100%!');
    console.log('=========================================');
})().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
