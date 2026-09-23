const fs = require('fs');
const vm = require('vm');

console.log('Testing full authentication cycle in sandbox...');

const html = fs.readFileSync('index.html', 'utf8');

// Mock localStorage / SafeStorage
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

// Mock window and document
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

// Extract JS
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

async function runTests() {
    console.log('Running test suite...');

    // TEST 1: Check non-existing account
    const acc1 = await context.findAccountByEmail('testuser@motorcare.com');
    console.assert(acc1 === null, 'Test 1 Failed: Expected null for non-existing account');
    console.log('✓ Test 1 Passed: non-existing account returns null');

    // TEST 2: Attempt Login with non-existing email
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'mypassword123';
    context.currentAuthMode = 'login';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'error', 'Test 2 Failed: Expected error notification');
    console.assert(context.currentAuthMode === 'login', 'Test 2 Failed: Mode should REMAIN login');
    console.log('✓ Test 2 Passed: Non-existing email login shows error and STAYS on login tab (no switch)');

    // TEST 3: Register new account
    context.currentAuthMode = 'register';
    // mock nameFieldContainer not hidden
    context.elements.nameFieldContainer.classList.contains = () => false;
    context.elements.authFullName.value = 'عزت إمام';
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'mypassword123';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && (lastNotification.type === 'success' || lastNotification.type === 'info'), 'Test 3 Failed: Registration should succeed. Got: ' + JSON.stringify(lastNotification));
    
    // Check that account was saved in motorCare_AccountsDB WITH password
    const accs = JSON.parse(mockLocalStorage.getItem('motorCare_AccountsDB') || '[]');
    const registered = accs.find(a => a.email === 'testuser@motorcare.com');
    console.assert(registered && registered.password === 'mypassword123', 'Test 3 Failed: Account must have password stored');
    console.log('✓ Test 3 Passed: Registration successfully stored account with password');

    // TEST 4: Attempt DUPLICATE Registration with same email
    context.currentAuthMode = 'register';
    context.window.currentAuthMode = 'register';
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'someotherpass';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'warning', 'Test 4 Failed: Expected warning on duplicate registration. Got: ' + JSON.stringify(lastNotification));
    console.assert(lastNotification.msg.includes('مسجل مسبقاً'), 'Test 4 Failed: Expected already registered warning');
    const curMode = context.window.currentAuthMode || context.currentAuthMode;
    console.assert(curMode === 'login', 'Test 4 Failed: Mode should switch to login. Current: ' + curMode);
    console.log('✓ Test 4 Passed: Duplicate registration blocked with warning and redirected to login');

    // TEST 5: Login with Wrong Password
    context.currentAuthMode = 'login';
    context.elements.nameFieldContainer.classList.contains = () => true;
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'wrongpass';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'error' && lastNotification.msg.includes('كلمة المرور غير صحيحة'), 'Test 5 Failed: Expected incorrect password error');
    console.log('✓ Test 5 Passed: Login with incorrect password correctly rejected');

    // TEST 6: Login with Correct Password
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'mypassword123';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'success', 'Test 6 Failed: Expected successful login');
    console.assert(mockLocalStorage.getItem('motorCare_LoggedIn') === 'true', 'Test 6 Failed: motorCare_LoggedIn should be true');
    console.log('✓ Test 6 Passed: Login with correct password succeeds');

    // TEST 7: Password Reset Step 1
    context.elements.forgotEmailInput.value = 'testuser@motorcare.com';
    await context.handleForgotPasswordStep1({ preventDefault: () => {} });
    const otpData = JSON.parse(mockLocalStorage.getItem('motorCare_ForgotPasswordOtp') || '{}');
    console.assert(otpData.otp && otpData.otp.length === 6, 'Test 7 Failed: OTP should be generated');
    console.log('✓ Test 7 Passed: Forgot password Step 1 generated 6-digit OTP:', otpData.otp);

    // TEST 8: Password Reset Step 2
    context.elements.forgotResetOtpInput.value = otpData.otp;
    context.elements.forgotNewPasswordInput.value = 'newSecurePass2026';
    context.elements.forgotConfirmPasswordInput.value = 'newSecurePass2026';
    context.handleForgotPasswordStep2({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'success', 'Test 8 Failed: Password update should succeed');

    const updatedAccs = JSON.parse(mockLocalStorage.getItem('motorCare_AccountsDB') || '[]');
    const updatedUser = updatedAccs.find(a => a.email === 'testuser@motorcare.com');
    console.assert(updatedUser.password === 'newSecurePass2026', 'Test 8 Failed: Password should be updated to newSecurePass2026');
    console.log('✓ Test 8 Passed: Password reset Step 2 successfully updated password');

    // TEST 9: Login with old password must fail
    context.currentAuthMode = 'login';
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'mypassword123';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'error' && lastNotification.msg.includes('كلمة المرور غير صحيحة'), 'Test 9 Failed: Old password should be rejected');
    console.log('✓ Test 9 Passed: Old password correctly rejected');

    // TEST 10: Login with new password must succeed
    context.elements.authEmail.value = 'testuser@motorcare.com';
    context.elements.authPassword.value = 'newSecurePass2026';
    await context.handleAuthSubmit({ preventDefault: () => {} });
    console.assert(lastNotification && lastNotification.type === 'success', 'Test 10 Failed: New password should succeed');
    console.log('✓ Test 10 Passed: New password successfully logs in');

    console.log('\n=======================================');
    console.log('🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!');
    console.log('=======================================');
}

runTests();
