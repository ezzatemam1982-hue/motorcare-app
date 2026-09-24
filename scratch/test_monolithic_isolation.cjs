// scratch/test_monolithic_isolation.cjs
const playwright = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');

(async () => {
    console.log('Testing User Session Isolation on d:/car/MotorCare-App/index.html...');
    const browser = await playwright.chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('file:///d:/car/MotorCare-App/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Step 1: Clear storage to start clean
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Step 2: Register User A
    console.log('--- Registering User A (user_a@test.com) ---');
    await page.evaluate(async () => {
        if (typeof switchAuthTab === 'function') switchAuthTab('register');
        const emailInp = document.getElementById('authEmail');
        const pwdInp = document.getElementById('authPassword');
        const nameInp = document.getElementById('authFullName');
        if (emailInp) emailInp.value = 'user_a@test.com';
        if (pwdInp) pwdInp.value = '123456';
        if (nameInp) nameInp.value = 'User A';
        await handleAuthSubmit({ preventDefault: () => {} });
    });
    await page.waitForTimeout(1000);

    let stateA = await page.evaluate(() => ({
        loggedIn: localStorage.getItem('motorCare_LoggedIn'),
        carsCount: appState.cars ? appState.cars.length : 0,
        modalVisible: !document.getElementById('addNewCarModal')?.classList.contains('hidden')
    }));
    console.log('User A registration state:', stateA);
    if (stateA.carsCount !== 0 || !stateA.modalVisible) {
        throw new Error(`Failed User A initial state! cars: ${stateA.carsCount}, modal: ${stateA.modalVisible}`);
    }

    // Add a car for User A
    console.log('Adding Toyota Camry for User A...');
    await page.evaluate(() => {
        const brandSel = document.getElementById('newCarBrandSelect');
        if (brandSel) brandSel.value = 'Toyota';
        const modelSel = document.getElementById('newCarModelSelect');
        if (modelSel) modelSel.innerHTML = '<option value="Camry" selected>Camry</option>';
        const yearInp = document.getElementById('newCarYearSelect') || document.getElementById('newCarYearInput');
        if (yearInp) yearInp.value = '2023';
        const odoInp = document.getElementById('newCarOdoInput');
        if (odoInp) odoInp.value = '35000';

        if (typeof saveNewCar === 'function') saveNewCar();
        else if (typeof handleSaveNewCarModal === 'function') handleSaveNewCarModal();
        else {
            appState.cars.push({ brand: 'Toyota', model: 'Camry', year: 2023, odometer: 35000 });
            saveAppState();
            closeAddNewCarModal(true);
        }
    });
    await page.waitForTimeout(1000);

    stateA = await page.evaluate(() => ({
        carsCount: appState.cars ? appState.cars.length : 0,
        carBrand: appState.cars[0]?.brand
    }));
    console.log('User A after adding car:', stateA);

    // Step 3: Logout User A
    console.log('--- Logging out User A ---');
    await page.evaluate(() => {
        handleLogout();
    });
    await page.waitForTimeout(1000);

    let loggedOutState = await page.evaluate(() => ({
        loggedIn: localStorage.getItem('motorCare_LoggedIn'),
        carsCount: appState.cars ? appState.cars.length : 0,
        activeKeyExists: !!localStorage.getItem('motorCare_AppState_v140')
    }));
    console.log('Logged out state:', loggedOutState);
    if (loggedOutState.carsCount !== 0 || loggedOutState.activeKeyExists) {
        throw new Error('Data leaked during logout!');
    }

    // Step 4: Register User B (Brand New Account)
    console.log('--- Registering User B (user_b@test.com) ---');
    await page.evaluate(async () => {
        if (typeof switchAuthTab === 'function') switchAuthTab('register');
        const emailInp = document.getElementById('authEmail');
        const pwdInp = document.getElementById('authPassword');
        const nameInp = document.getElementById('authFullName');
        if (emailInp) emailInp.value = 'user_b@test.com';
        if (pwdInp) pwdInp.value = '654321';
        if (nameInp) nameInp.value = 'User B';
        await handleAuthSubmit({ preventDefault: () => {} });
    });
    await page.waitForTimeout(1000);

    let stateB = await page.evaluate(() => ({
        loggedIn: localStorage.getItem('motorCare_LoggedIn'),
        carsCount: appState.cars ? appState.cars.length : 0,
        modalVisible: !document.getElementById('addNewCarModal')?.classList.contains('hidden')
    }));
    console.log('User B registration state (MUST BE CLEAN):', stateB);
    if (stateB.carsCount !== 0) {
        throw new Error(`CRITICAL: Previous car leaked into User B! Cars found: ${stateB.carsCount}`);
    }
    if (!stateB.modalVisible) {
        throw new Error('Onboarding modal did not open for new User B!');
    }

    // Step 5: User B adds their own car (Nissan Sunny)
    console.log('Adding Nissan Sunny for User B...');
    await page.evaluate(() => {
        appState.cars.push({ brand: 'Nissan', model: 'Sunny', year: 2021, odometer: 45000 });
        saveAppState();
        closeAddNewCarModal(true);
    });
    await page.waitForTimeout(1000);

    // Step 6: Logout User B
    console.log('--- Logging out User B ---');
    await page.evaluate(() => {
        handleLogout();
    });
    await page.waitForTimeout(1000);

    // Step 7: User A logs back in
    console.log('--- Logging back in as User A (user_a@test.com) ---');
    await page.evaluate(async () => {
        if (typeof switchAuthTab === 'function') switchAuthTab('login');
        const emailInp = document.getElementById('authEmail');
        const pwdInp = document.getElementById('authPassword');
        if (emailInp) emailInp.value = 'user_a@test.com';
        if (pwdInp) pwdInp.value = '123456';
        await handleAuthSubmit({ preventDefault: () => {} });
    });
    await page.waitForTimeout(1000);

    let userARestored = await page.evaluate(() => ({
        carsCount: appState.cars ? appState.cars.length : 0,
        carBrand: appState.cars[0]?.brand,
        carModel: appState.cars[0]?.model
    }));
    console.log('User A restored state:', userARestored);
    if (userARestored.carsCount !== 1 || userARestored.carBrand !== 'Toyota') {
        throw new Error(`User A data restoration failed! Expected Toyota, got: ${JSON.stringify(userARestored)}`);
    }

    console.log('Browser Page Errors Count:', errors.length);
    if (errors.length > 0) {
        console.error('Errors encountered:', errors);
        process.exit(1);
    }

    console.log('\n============================================================');
    console.log('🎉 MONOLITHIC INDEX.HTML ISOLATION TEST PASSED 100%! 🎉');
    console.log('============================================================');
    await browser.close();
    process.exit(0);
})().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
