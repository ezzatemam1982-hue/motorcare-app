// scratch/test_forgot_password_otp.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== TESTING FORGOT PASSWORD OTP CODE FLOW & NO FIREBASE MENTIONS ===');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8089/index.html');
    await page.waitForFunction(() => typeof SafeStorage !== 'undefined');

    // 1. Open Forgot Password Modal
    await page.evaluate(() => {
        openForgotPasswordModal();
    });
    await page.waitForTimeout(400);

    const isStep1Visible = await page.evaluate(() => {
        const modal = document.getElementById('forgotPasswordModal');
        const s1 = document.getElementById('forgotStep1Container');
        return !modal.classList.contains('hidden') && !s1.classList.contains('hidden');
    });
    console.log('1. Forgot Password Modal Step 1 Open:', isStep1Visible);
    if (!isStep1Visible) throw new Error('Step 1 should be visible!');

    // 2. Submit Email for Password Reset
    console.log('2. Submitting email in Step 1: nijaw95023@shopdevo.com');
    await page.evaluate(async () => {
        const emailInput = document.getElementById('forgotEmailInput');
        emailInput.value = 'nijaw95023@shopdevo.com';
        await handleForgotPasswordStep1();
    });
    await page.waitForTimeout(600);

    // 3. Verify Step 2 is visible (Activation code input)
    const step2State = await page.evaluate(() => {
        const s1 = document.getElementById('forgotStep1Container');
        const s2 = document.getElementById('forgotStep2Container');
        const otpInput = document.getElementById('forgotResetOtpInput');
        const stored = SafeStorage.getItem('motorCare_ForgotPasswordOtp');
        return {
            step1Hidden: s1?.classList.contains('hidden'),
            step2Visible: !s2?.classList.contains('hidden'),
            hasOtpInput: !!otpInput,
            storedOtpObj: stored ? JSON.parse(stored) : null
        };
    });
    console.log('3. Step 2 Activation Code State:', step2State);
    if (!step2State.step2Visible) {
        throw new Error('Step 2 (OTP code input) MUST be visible after submitting email!');
    }
    if (!step2State.storedOtpObj || !step2State.storedOtpObj.otp) {
        throw new Error('A 6-digit OTP code must be generated!');
    }
    console.log('   Generated OTP Code:', step2State.storedOtpObj.otp);

    // 4. Enter the generated OTP code and set a new password
    console.log('4. Entering OTP and new password...');
    await page.evaluate((otp) => {
        const otpInput = document.getElementById('forgotResetOtpInput');
        const newPass = document.getElementById('forgotNewPasswordInput');
        const confPass = document.getElementById('forgotConfirmPasswordInput');
        otpInput.value = otp;
        newPass.value = 'newPass123';
        confPass.value = 'newPass123';
        handleForgotPasswordStep2();
    }, step2State.storedOtpObj.otp);
    await page.waitForTimeout(800);

    // 5. Verify modal closed and login inputs filled
    const loginFilledState = await page.evaluate(() => {
        const modal = document.getElementById('forgotPasswordModal');
        const authEmail = document.getElementById('authEmail');
        const authPass = document.getElementById('authPassword');
        return {
            modalClosed: modal?.classList.contains('hidden'),
            emailVal: authEmail?.value,
            passVal: authPass?.value
        };
    });
    console.log('5. Password Reset Completed & Ready for Login:', loginFilledState);
    if (!loginFilledState.modalClosed || loginFilledState.passVal !== 'newPass123') {
        throw new Error('Password reset failed to update and close modal!');
    }

    // 6. Verify Account Center modal has NO Firebase mention or settings button
    console.log('6. Checking Account Modal for any Firebase elements...');
    await page.evaluate(() => {
        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify({
            name: 'ezzat emam',
            email: 'ezzat.emam1982@gmail.com',
            provider: 'google',
            isRegistered: true
        }));
        openAccountCenter();
    });
    await page.waitForTimeout(500);

    const accountModalCheck = await page.evaluate(() => {
        const modalHtml = document.getElementById('accountCenterModal')?.innerHTML || '';
        const hasFirebaseText = /firebase/i.test(modalHtml);
        const hasFbBtn = !!document.getElementById('firebaseConfigModal');
        const toggle = document.getElementById('accountModalCloudSyncToggle');
        const badge = document.getElementById('accountModalCloudSyncBadge');
        return {
            hasFirebaseText,
            hasFbBtn,
            toggleChecked: toggle?.checked,
            badgeHtml: badge?.innerHTML
        };
    });
    console.log('6. Account Center White-label Check:', accountModalCheck);
    if (accountModalCheck.hasFirebaseText) {
        throw new Error('Account modal must NOT contain any Firebase text visible to client!');
    }

    console.log('\n=== ALL TESTS PASSED 100% PERFECTLY! ===');
    await browser.close();
})();
