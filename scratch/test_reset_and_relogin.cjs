// scratch/test_reset_and_relogin.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('=== TESTING AUTO-LOGIN ON OTP RESET & RE-LOGIN WITH NEW PASSWORD ===');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8089/index.html');
    await page.waitForTimeout(2000);
    await page.waitForFunction(() => typeof SafeStorage !== 'undefined' && !!document.getElementById('forgotEmailInput'));

    const testEmail = 'auto_login_test@motorcare.com';
    const initialPass = 'initialPass123';
    const updatedPass = 'newSecretPass789';

    // 0. Setup an existing account in local DB
    await page.evaluate(({ email, pass }) => {
        saveAccountToLocalDB({
            name: 'سائق MotorCare',
            email: email,
            password: pass,
            isVerified: true
        });
    }, { email: testEmail, pass: initialPass });

    console.log('1. Account created in DB with pass:', initialPass);

    // 1. Open Forgot Password Modal
    await page.evaluate(() => {
        openForgotPasswordModal();
    });
    await page.waitForTimeout(300);

    // 2. Submit Email for Password Reset
    console.log('2. Requesting reset OTP for:', testEmail);
    await page.evaluate(async (email) => {
        const emailInput = document.getElementById('forgotEmailInput');
        emailInput.value = email;
        await handleForgotPasswordStep1();
    }, testEmail);
    await page.waitForTimeout(400);

    // 3. Extract the generated OTP
    const otp = await page.evaluate(() => {
        const raw = SafeStorage.getItem('motorCare_ForgotPasswordOtp');
        return raw ? JSON.parse(raw).otp : null;
    });
    console.log('3. Generated OTP:', otp);
    if (!otp) throw new Error('OTP was not generated!');

    // 4. Enter OTP and updated password
    console.log('4. Submitting Step 2 with new password:', updatedPass);
    await page.evaluate(({ code, pass }) => {
        document.getElementById('forgotResetOtpInput').value = code;
        document.getElementById('forgotNewPasswordInput').value = pass;
        document.getElementById('forgotConfirmPasswordInput').value = pass;
        handleForgotPasswordStep2();
    }, { code: otp, pass: updatedPass });
    await page.waitForTimeout(600);

    // 5. CHECK AUTO-LOGIN IMMEDIATELY AFTER STEP 2!
    const loginStateAfterReset = await page.evaluate(() => {
        const modal = document.getElementById('forgotPasswordModal');
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');
        const loggedIn = SafeStorage.getItem('motorCare_LoggedIn');
        const rawProf = SafeStorage.getItem('motorCare_UserProfile');
        const prof = rawProf ? JSON.parse(rawProf) : null;
        return {
            modalClosed: modal?.classList.contains('hidden'),
            authScreenHidden: authScreen?.classList.contains('hidden'),
            mainAppVisible: !mainApp?.classList.contains('hidden'),
            loggedIn: loggedIn === 'true',
            userEmail: prof?.email,
            userPassword: prof?.password
        };
    });
    console.log('5. Immediate Auto-Login Result:', loginStateAfterReset);
    if (!loginStateAfterReset.modalClosed) throw new Error('Forgot Password modal should be closed!');
    if (!loginStateAfterReset.loggedIn) throw new Error('User MUST be logged in automatically after OTP reset!');
    if (loginStateAfterReset.userPassword !== updatedPass) throw new Error('User password in profile must be updated!');
    console.log('   ✅ AUTO-LOGIN SUCCEEDED 100%!');

    // 6. Test Logging Out
    console.log('6. Logging out...');
    await page.evaluate(() => {
        handleLogout();
    });
    await page.waitForTimeout(400);

    const loggedOutState = await page.evaluate(() => {
        return {
            loggedIn: SafeStorage.getItem('motorCare_LoggedIn'),
            authScreenVisible: !document.getElementById('authScreen')?.classList.contains('hidden')
        };
    });
    console.log('   Logged out state:', loggedOutState);
    if (loggedOutState.loggedIn === 'true') throw new Error('Logout failed!');

    // 7. Test Logging In with INCORRECT password (should fail)
    console.log('7. Testing login with WRONG password...');
    await page.evaluate(async (email) => {
        document.getElementById('authEmail').value = email;
        document.getElementById('authPassword').value = 'wrongPassword999';
        await handleAuthSubmit();
    }, testEmail);
    await page.waitForTimeout(600);

    const wrongPassState = await page.evaluate(() => {
        return SafeStorage.getItem('motorCare_LoggedIn');
    });
    console.log('   Wrong pass state (should not be true):', wrongPassState);
    if (wrongPassState === 'true') throw new Error('Login should NOT succeed with wrong password!');
    console.log('   ✅ Wrong password correctly rejected!');

    await page.waitForTimeout(1000);

    // 8. Test Logging In with the NEW PASSWORD (should succeed smoothly!)
    console.log('8. Testing login with the NEW PASSWORD:', updatedPass);
    await page.evaluate(async ({ email, pass }) => {
        document.getElementById('authEmail').value = email;
        document.getElementById('authPassword').value = pass;
        await handleAuthSubmit();
    }, { email: testEmail, pass: updatedPass });
    await page.waitForTimeout(800);

    const reLoginState = await page.evaluate(() => {
        const loggedIn = SafeStorage.getItem('motorCare_LoggedIn');
        const rawProf = SafeStorage.getItem('motorCare_UserProfile');
        const prof = rawProf ? JSON.parse(rawProf) : null;
        return {
            loggedIn: loggedIn === 'true',
            userEmail: prof?.email,
            userPassword: prof?.password
        };
    });
    console.log('8. Re-Login Result with New Password:', reLoginState);
    if (!reLoginState.loggedIn) throw new Error('Login with new password MUST succeed!');
    if (reLoginState.userPassword !== updatedPass) throw new Error('Profile password must match new password!');
    console.log('   ✅ RE-LOGIN WITH NEW PASSWORD SUCCEEDED 100%!');

    console.log('\n=== ALL TESTS PASSED WITH 100% SUCCESS! ===');
    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
