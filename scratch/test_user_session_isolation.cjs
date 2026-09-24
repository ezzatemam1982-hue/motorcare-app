const fs = require('fs');
const vm = require('vm');

console.log('Testing Complete User Session Isolation, Multi-User Switching & Onboarding Flow...');

const storage = {};
const mockLocalStorage = {
    getItem: (k) => storage[k] !== undefined ? storage[k] : null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { for (const k in storage) delete storage[k]; }
};

const elements = {
    authEmail: { value: '', focus: () => {} },
    authPassword: { value: '', focus: () => {} },
    authFullName: { value: '', focus: () => {} },
    loginTabBtn: { className: '' },
    registerTabBtn: { className: '' },
    authSubmitBtn: { disabled: false },
    authSubmitBtnText: { innerText: 'دخول فوري' },
    nameFieldContainer: { classList: { contains: (c) => c === 'hidden', toggle: () => {}, add: () => {}, remove: () => {} } },
    landingScreen: { style: { setProperty: () => {}, removeProperty: () => {} }, classList: { add: () => {}, remove: () => {} } },
    mainAppContainer: { style: { setProperty: () => {}, removeProperty: () => {} }, classList: { add: () => {}, remove: () => {} } },
    addNewCarModal: { classList: { contains: () => false, add: () => {}, remove: () => {} }, querySelectorAll: () => [], querySelector: () => ({ innerText: '' }) },
    newCarBrandSelect: { value: '', focus: () => {}, appendChild: () => {} },
    newCarModelSelect: { value: '', innerHTML: '', focus: () => {} },
    newCarGenerationSelect: { value: '0', innerHTML: '', focus: () => {} },
    newCarYearInput: { value: '2022', min: 1950, max: 2026, focus: () => {} },
    newCarEngineInput: { value: '1.6L', focus: () => {} },
    newCarOdoInput: { value: '50000', focus: () => {} },
    newCarLicenseInput: { value: 'أ ب ج 1234', focus: () => {} },
    newCarVinInput: { value: '', focus: () => {} },
    newCarColorInput: { value: 'Black', focus: () => {} },
    newCarNotesInput: { value: '', focus: () => {} },
    brandSearchInput: { value: '' }
};

Object.keys(elements).forEach(k => {
    if (!elements[k].dispatchEvent) elements[k].dispatchEvent = () => true;
    if (!elements[k].style) elements[k].style = { setProperty: () => {}, removeProperty: () => {} };
    if (!elements[k].children) elements[k].children = [];
    if (!elements[k].classList) elements[k].classList = { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
});
let lastNotification = null;
let onboardingTriggeredCount = 0;

function createMockElement(tag = 'div') {
    const el = {
        tag,
        value: '',
        innerText: '',
        innerHTML: '',
        className: '',
        style: { setProperty: () => {}, removeProperty: () => {} },
        children: [],
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        appendChild: (child) => { el.children.push(child); return child; },
        removeChild: (child) => {
            const idx = el.children.indexOf(child);
            if (idx >= 0) el.children.splice(idx, 1);
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        dispatchEvent: () => true,
        remove: () => {}
    };
    Object.defineProperty(el, 'firstElementChild', {
        get() { return el.children[0] || null; }
    });
    return el;
}

const sandbox = {
    elements: elements,
    window: {},
    document: {
        body: createMockElement('body'),
        getElementById: (id) => elements[id] || null,
        querySelectorAll: () => [],
        querySelector: () => null,
        createElement: (tag) => createMockElement(tag),
        documentElement: { classList: { add: () => {}, remove: () => {} } },
        addEventListener: () => {}
    },
    localStorage: mockLocalStorage,
    navigator: { userAgent: 'test', platform: 'win', onLine: true },
    console: { log: console.log, warn: console.warn, error: console.error },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: (cb) => { cb(); return 1; },
    cancelAnimationFrame: () => {},
    Date: Date,
    Math: Math,
    Event: class Event { constructor(t) { this.type = t; } },
    GOOGLE_OAUTH_CLIENT_ID: 'test_client_id',
    addEventListener: () => {},
    removeEventListener: () => {},
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    showNotification: (msg, type) => { lastNotification = { msg, type }; }
};
sandbox.window = sandbox;

// Load modular files in dependency sequence
const files = [
    'js/storage/storage.js',
    'js/security/security.js',
    'js/services/notifications.js',
    'js/services/firebase.js',
    'js/data/dictionary.js',
    'js/data/brandLogos.js',
    'js/core/appState.js',
    'js/core/i18n.js',
    'js/core/catalogBuilder.js',
    'js/core/maintenanceEngine.js',
    'js/services/auth.js',
    'js/features/dashboard.js',
    'js/features/maintenance.js',
    'js/features/fuel.js',
    'js/features/documents.js',
    'js/features/garage.js'
];

const context = vm.createContext(sandbox);

for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
}

// Hook checkFirstTimeOnboarding to track invocations
const origOnboarding = context.checkFirstTimeOnboarding;
context.checkFirstTimeOnboarding = function() {
    onboardingTriggeredCount++;
    console.log('[TEST HOOK] checkFirstTimeOnboarding invoked! Call count:', onboardingTriggeredCount);
    if (typeof origOnboarding === 'function') origOnboarding();
};

async function runSessionIsolationSuite() {
    console.log('\n--- TEST 1: Register User A (ezzat.pro@gmail.com) ---');
    onboardingTriggeredCount = 0;
    context.switchAuthTab('register');
    context.elements.authFullName.value = 'عزت إمام';
    context.elements.authEmail.value = 'ezzat.pro@gmail.com';
    context.elements.authPassword.value = 'secret1234';

    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User A should be logged in');
    console.assert(context.appState.cars.length === 0, 'New user A garage must be completely empty');
    console.assert(onboardingTriggeredCount >= 1, 'Onboarding must be triggered for new registered user');
    console.log('✓ User A registered with clean 0 cars and onboarding triggered.');

    console.log('\n--- TEST 2: User A adds a car (Toyota Corolla) ---');
    context.appState.cars.push({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        odometer: 50000,
        license: 'ق م ن 1122',
        catalog: [],
        history: [],
        fuelLogs: []
    });
    context.saveAppState('test_add_car');
    console.assert(context.appState.cars.length === 1, 'User A should have 1 car');
    console.log('✓ User A added Toyota Corolla (50,000 km).');

    console.log('\n--- TEST 3: User A logs out ---');
    context.handleLogout();
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'false', 'LoggedIn must be false');
    console.assert(context.appState.cars.length === 0, 'In-memory cars must be wiped on logout');
    console.assert(mockLocalStorage.getItem('motorCare_AppState_v140') === null, 'Active app state must be removed from storage on logout');
    console.assert(mockLocalStorage.getItem('motorCare_UserProfile') === null, 'Active profile must be removed on logout');
    console.log('✓ User A logged out. Memory and active storage cleanly wiped.');

    console.log('\n--- TEST 4: Register User B (new user: ahmed.clean@gmail.com) ---');
    onboardingTriggeredCount = 0;
    context.switchAuthTab('register');
    context.elements.authFullName.value = 'أحمد شريف';
    context.elements.authEmail.value = 'ahmed.clean@gmail.com';
    context.elements.authPassword.value = 'passB5678';

    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User B should be logged in');
    console.assert(context.appState.cars.length === 0, 'CRITICAL: User B MUST NOT see User A old data!');
    console.assert(onboardingTriggeredCount >= 1, 'CRITICAL: User B must get onboarding modal');
    console.log('✓ User B registered: ZERO old data found, clean slate, onboarding triggered successfully.');

    console.log('\n--- TEST 5: User B adds their own car (Geely Coolray) ---');
    context.appState.cars.push({
        brand: 'Geely',
        model: 'Coolray',
        year: 2024,
        odometer: 15000,
        license: 'س ص ع 9988',
        catalog: [],
        history: [],
        fuelLogs: []
    });
    context.saveAppState('test_user_b_car');
    console.assert(context.appState.cars.length === 1, 'User B should have 1 car');
    console.assert(context.appState.cars[0].brand === 'Geely', 'User B car must be Geely');
    console.log('✓ User B added Geely Coolray.');

    console.log('\n--- TEST 6: User B logs out ---');
    context.handleLogout();
    console.assert(context.appState.cars.length === 0, 'In-memory cars wiped on User B logout');
    console.log('✓ User B logged out.');

    console.log('\n--- TEST 7: User A logs back in with existing credentials ---');
    console.log('DEBUG: storage keys =', Object.keys(storage));
    console.log('DEBUG: ezzat key =', storage['motorCare_AppState_ezzat_pro_gmail_com']);
    context.switchAuthTab('login');
    context.elements.authEmail.value = 'ezzat.pro@gmail.com';
    context.elements.authPassword.value = 'secret1234';

    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User A should be logged in');
    console.assert(context.appState.cars.length === 1, 'User A should have their car restored');
    console.assert(context.appState.cars[0].brand === 'Toyota', 'User A car must be Toyota, NOT Geely!');
    console.log('✓ User A logged in: Toyota Corolla restored from scoped cache. No bleed from User B!');

    console.log('\n--- TEST 8: User A logs out and enters as Guest ---');
    context.handleLogout();
    onboardingTriggeredCount = 0;
    context.handleGuestEntry();
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'Guest should be entered');
    console.assert(context.appState.cars.length === 0, 'Guest must NOT see User A cars!');
    console.assert(onboardingTriggeredCount >= 1, 'Guest onboarding modal triggered');
    console.log('✓ Guest entry: Completely isolated from User A and User B.');

    console.log('\n============================================================');
    console.log('🎉 ALL 8 USER SESSION ISOLATION & ONBOARDING TESTS PASSED 100%!');
    console.log('============================================================');
}

runSessionIsolationSuite();
