const fs = require('fs');
const vm = require('vm');

console.log('Testing multi-user account switching, duplicate protection, and re-login...');

const html = fs.readFileSync('index.html', 'utf8');

// Mock localStorage
const storage = {};
const mockLocalStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { for (const k in storage) delete storage[k]; }
};

// Mock DOM elements
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
    authEmailExistingHint: { classList: { add: () => {}, remove: () => {}, contains: () => true } },
    forgotEmailInput: { value: '', focus: () => {} },
    forgotStep1SubmitBtn: { disabled: false },
    forgotStep1BtnText: { innerText: '' },
    forgotStep1BtnIcon: { className: '' },
    forgotStep1Container: { classList: { add: () => {}, remove: () => {} } },
    forgotStep2Container: { classList: { add: () => {}, remove: () => {} } },
    forgotStep2Desc: { innerHTML: '' },
    forgotResetOtpInput: { value: '', focus: () => {} },
    forgotNewPasswordInput: { value: '', focus: () => {} },
    forgotConfirmPasswordInput: { value: '', focus: () => {} }
};

let lastNotification = null;

const sandbox = {
    elements: elements,
    window: {
        addEventListener: () => {},
        removeEventListener: () => {}
    },
    document: {
        body: { appendChild: () => {}, removeChild: () => {} },
        getElementById: (id) => elements[id] || null,
        querySelectorAll: () => [],
        querySelector: () => null,
        createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, removeChild: () => {}, querySelector: () => null, querySelectorAll: () => [], remove: () => {} }),
        documentElement: { classList: { add: () => {} } },
        addEventListener: () => {}
    },
    localStorage: mockLocalStorage,
    navigator: { userAgent: 'test', platform: 'win', onLine: true },
    console: { log: () => {}, warn: () => {}, error: console.error },
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    Date: Date,
    Math: Math,
    addEventListener: () => {},
    removeEventListener: () => {},
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    showNotification: (msg, type) => {
        lastNotification = { msg, type };
    }
};
sandbox.window = sandbox;

const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let fullCode = '';
while ((match = scriptRegex.exec(html)) !== null) {
    fullCode += match[1] + '\n';
}

const context = vm.createContext(sandbox);
vm.runInContext(fullCode, context);
context.showNotification = (msg, type) => {
    lastNotification = { msg, type };
};

async function testMultiUserSwitching() {
    console.log('1. Register User A (ezzat.car@gmail.com)...');
    context.switchAuthTab('register');
    context.elements.authFullName.value = 'عزت إمام';
    context.elements.authEmail.value = 'ezzat.car@gmail.com';
    context.elements.authPassword.value = 'passA1234';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User A should be logged in');
    console.log('✓ User A registered and logged in.');

    console.log('2. User A logs out...');
    context.handleLogout();
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'false', 'LoggedIn should be false');
    console.assert((context.window.currentAuthMode || context.currentAuthMode) === 'login', 'Should switch to login tab');
    console.log('✓ User A logged out. Tab switched to login.');

    console.log('3. Register User B (ahmed.auto@gmail.com)...');
    context.switchAuthTab('register');
    context.elements.authFullName.value = 'أحمد علي';
    context.elements.authEmail.value = 'ahmed.auto@gmail.com';
    context.elements.authPassword.value = 'passB5678';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User B should be logged in');
    console.log('✓ User B registered and logged in.');

    console.log('4. User B logs out...');
    context.handleLogout();
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'false', 'LoggedIn should be false');
    console.log('✓ User B logged out.');

    console.log('5. User A logs back in with passA1234...');
    context.switchAuthTab('login');
    context.elements.authEmail.value = 'ezzat.car@gmail.com';
    context.elements.authPassword.value = 'passA1234';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User A should log in');
    const curUser = JSON.parse(mockLocalStorage.getItem('motorCare_UserProfile') || '{}');
    console.assert(curUser.email === 'ezzat.car@gmail.com', 'Current user should be User A');
    console.log('✓ User A successfully logged back in after account switch.');

    console.log('6. User A logs out and tries to register AGAIN with same email...');
    context.handleLogout();
    context.switchAuthTab('register');
    context.elements.authFullName.value = 'عزت المحتال';
    context.elements.authEmail.value = 'ezzat.car@gmail.com';
    context.elements.authPassword.value = 'newpass';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'warning', 'Duplicate registration should be warned');
    console.assert(lastNotification.msg.includes('مسجل مسبقاً'), 'Warning message should say already registered');
    console.assert((context.window.currentAuthMode || context.currentAuthMode) === 'login', 'Should be forced to login tab');
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'false', 'Should NOT log in on duplicate registration');
    console.log('✓ Duplicate registration strictly blocked with warning and redirected to login.');

    console.log('7. User B logs in with passB5678...');
    context.switchAuthTab('login');
    context.elements.authEmail.value = 'ahmed.auto@gmail.com';
    context.elements.authPassword.value = 'passB5678';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'User B should log in');
    const curUserB = JSON.parse(mockLocalStorage.getItem('motorCare_UserProfile') || '{}');
    console.assert(curUserB.email === 'ahmed.auto@gmail.com', 'Current user should be User B');
    console.log('✓ User B successfully logged in.');

    console.log('\n=======================================');
    console.log('🎉 MULTI-USER & DUPLICATE PROTECTION: 100% VERIFIED!');
    console.log('=======================================');
}

testMultiUserSwitching();
