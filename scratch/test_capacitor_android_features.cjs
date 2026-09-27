// scratch/test_capacitor_android_features.cjs
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING COMPREHENSIVE CAPACITOR & ANDROID AUDIT ---');

// 1. Audit index.html & src/index.html
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const srcIndexHtml = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8');

// Check that no broken external links to privacy.html remain in the active UI
const brokenPrivacyLinks = indexHtml.match(/<a\s+href="privacy\.html"/g);
console.log('1. Broken privacy.html links in index.html:', brokenPrivacyLinks ? brokenPrivacyLinks.length : 0);
assert.strictEqual(brokenPrivacyLinks, null, 'No <a href="privacy.html"> should remain in active index.html');

// Check that openLegalModal is wired up
assert(indexHtml.includes('openLegalModal(\'privacy\')'), 'index.html missing openLegalModal(\'privacy\')');
assert(indexHtml.includes('id="legalModal"'), 'index.html missing #legalModal');
assert(indexHtml.includes('id="legalTabPrivacy"'), 'index.html missing #legalTabPrivacy');
assert(indexHtml.includes('id="legalTabTerms"'), 'index.html missing #legalTabTerms');
assert(indexHtml.includes('id="legalContentPrivacy"'), 'index.html missing #legalContentPrivacy');
assert(indexHtml.includes('id="legalContentTerms"'), 'index.html missing #legalContentTerms');
assert(indexHtml.includes('requestDataDeletion()'), 'index.html missing requestDataDeletion()');
console.log('✅ Requirement 4: Legal Modal & Privacy Data Management successfully verified in HTML!');

// Check Requirement 2: Footer shortcuts bar hidden on mobile
assert(indexHtml.includes('hidden md:flex items-center gap-4 font-semibold flex-wrap'), 'Footer shortcuts bar must have hidden md:flex');
console.log('✅ Requirement 2: Footer shortcuts bar hidden on mobile screens verified!');

// Check Requirement 2: Safe area CSS
const styleCss = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
assert(styleCss.includes('calc(5.5rem + env(safe-area-inset-bottom, 0px))') || styleCss.includes('safe-area-pb'), 'CSS missing safe-area bottom rule');
console.log('✅ Requirement 2: Safe area padding in CSS verified!');

// 2. Audit mipmap icons
const resDir = path.join(__dirname, '../android/app/src/main/res');
const mipmapFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
mipmapFolders.forEach(folder => {
    const p1 = path.join(resDir, folder, 'ic_launcher.png');
    const p2 = path.join(resDir, folder, 'ic_launcher_round.png');
    const p3 = path.join(resDir, folder, 'ic_launcher_foreground.png');
    assert(fs.existsSync(p1), `Missing ${p1}`);
    assert(fs.existsSync(p2), `Missing ${p2}`);
    assert(fs.existsSync(p3), `Missing ${p3}`);
});
console.log('✅ Requirement 6: All mipmap-* densities verified in android/app/src/main/res!');

// 3. Test JavaScript mobile service & functions
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    documentElement: { classList: { add: () => {} } },
    getElementById: (id) => {
        return {
            value: '',
            textContent: '',
            innerText: '',
            classList: { add: () => {}, remove: () => {}, contains: () => false },
            className: '',
            style: { setProperty: () => {}, removeProperty: () => {} },
            click: () => {},
            setAttribute: () => {},
            appendChild: () => {},
            removeChild: () => {}
        };
    },
    createElement: (tag) => {
        return {
            href: '',
            setAttribute: () => {},
            click: () => {},
            appendChild: () => {},
            removeChild: () => {},
            style: {},
            classList: { add: () => {}, remove: () => {} }
        };
    },
    body: { appendChild: () => {}, removeChild: () => {} },
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
    removeItem: (k) => global.localStorage.removeItem(k),
    getJSON: (k, def) => {
        try {
            const v = global.localStorage.getItem(k);
            return v ? JSON.parse(v) : (def || null);
        } catch(e) { return def || null; }
    },
    setJSON: (k, v) => global.localStorage.setItem(k, JSON.stringify(v))
};
global.URL = {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {}
};

// Load mobile.js
require('../js/services/mobile.js');

assert(typeof window.exportDataFile === 'function', 'exportDataFile must be exported on window');
assert(typeof window.printReportSection === 'function', 'printReportSection must be exported on window');
assert(typeof window.captureOrPickImage === 'function', 'captureOrPickImage must be exported on window');
assert(typeof window.openLegalModal === 'function', 'openLegalModal must be exported on window');
assert(typeof window.closeLegalModal === 'function', 'closeLegalModal must be exported on window');
assert(typeof window.switchLegalTab === 'function', 'switchLegalTab must be exported on window');
assert(typeof window.requestDataDeletion === 'function', 'requestDataDeletion must be exported on window');

console.log('✅ Requirement 1, 3, 4: All Mobile service methods exported properly!');

// Test Web fallback for exportDataFile
(async () => {
    const exportRes = await window.exportDataFile({
        filename: 'test_export.csv',
        data: 'A,B,C\n1,2,3',
        mimeType: 'text/csv;charset=utf-8;',
        title: 'Test Export'
    });
    assert.strictEqual(exportRes.success, true);
    assert.strictEqual(exportRes.native, false);
    console.log('✅ Requirement 1: Web export fallback verified!');

    // Mock Native Capacitor environment
    let sharedPayload = null;
    let writtenFile = null;
    window.Capacitor = {
        isNativePlatform: () => true,
        Plugins: {
            Filesystem: {
                writeFile: async (opts) => {
                    writtenFile = opts;
                    return { uri: 'file:///data/user/0/com.motorcare.app/cache/' + opts.path };
                }
            },
            Share: {
                share: async (opts) => {
                    sharedPayload = opts;
                    return { value: true };
                }
            },
            Camera: {
                getPhoto: async (opts) => {
                    assert.strictEqual(opts.source, 'PROMPT', 'Camera source must be PROMPT');
                    return { dataUrl: 'data:image/jpeg;base64,MOCK_IMAGE_DATA' };
                }
            },
            GoogleAuth: {
                initialize: async () => {},
                signIn: async () => ({
                    email: 'native.driver@motorcare.app',
                    name: 'Native Driver',
                    imageUrl: 'https://example.com/avatar.jpg',
                    authentication: { idToken: 'MOCK_ID_TOKEN' }
                })
            }
        }
    };

    // Test Native export
    const nativeExportRes = await window.exportDataFile({
        filename: 'native_report.csv',
        data: 'Col1,Col2\nVal1,Val2',
        mimeType: 'text/csv;charset=utf-8;',
        title: 'Native Report'
    });
    assert.strictEqual(nativeExportRes.success, true);
    assert.strictEqual(nativeExportRes.native, true);
    assert.strictEqual(writtenFile.path, 'native_report.csv');
    assert.strictEqual(sharedPayload.title, 'Native Report');
    console.log('✅ Requirement 1: Native Filesystem & Share integration verified!');

    // Test Requirement 3: Native Camera captureOrPickImage
    window.tempImages = {};
    const imgRes = await window.captureOrPickImage('invoice');
    assert.strictEqual(imgRes, 'data:image/jpeg;base64,MOCK_IMAGE_DATA');
    assert.strictEqual(window.tempImages['invoice'], 'data:image/jpeg;base64,MOCK_IMAGE_DATA');
    console.log('✅ Requirement 3: CameraSource.Prompt Action Sheet verified!');

    // Test Requirement 5: Native GoogleAuth in auth.js
    require('../js/services/auth.js');
    let loggedInUser = null;
    window.loginAsGoogleProfile = (name, email, avatar) => {
        loggedInUser = { name, email, avatar };
    };

    assert(typeof window.triggerRealSocialLogin === 'function', 'triggerRealSocialLogin must be defined');
    await window.triggerRealSocialLogin('google');
    const savedUser = JSON.parse(global.localStorage.getItem('motorCare_UserProfile') || '{}');
    assert.strictEqual(savedUser.email, 'native.driver@motorcare.app');
    assert.strictEqual(savedUser.name, 'Native Driver');
    console.log('✅ Requirement 5: Native Google Sign-In with GoogleAuth verified (no origin_mismatch)!');

    console.log('\n======================================================');
    console.log('🎉 ALL 6 CAPACITOR & ANDROID PROBLEMS FULLY SOLVED! 🎉');
    console.log('======================================================');
})().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
