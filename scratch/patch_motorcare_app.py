import os
import re

def patch_app_file(file_path):
    print(f"Processing {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_length = len(content)

    # 1. Update saveAppState to support scoped user persistence
    old_save_app_state = '''        // المحرك المركزي الموحد لحفظ حالة التطبيق محلياً وسحابياً بأمان تام
        function saveAppState(triggerReason = 'general_update') {
            try {
                if (typeof validateAndSanitizeAppState === 'function') {
                    appState = validateAndSanitizeAppState(appState);
                }
                SafeStorage.setJSON('motorCare_AppState_v140', appState);
                if (typeof syncUserDataToCloud === 'function') {
                    try {
                        syncUserDataToCloud(triggerReason);
                    } catch (cloudErr) {
                        console.warn('[MotorCare Cloud] Non-blocking sync notice:', cloudErr);
                    }
                }
                return true;
            } catch (err) {
                console.error('[MotorCare Storage] Critical saveAppState error:', err);
                return false;
            }
        }'''

    new_save_app_state = '''        // المحرك المركزي الموحد لحفظ حالة التطبيق محلياً وسحابياً بأمان تام
        function saveAppState(triggerReason = 'general_update') {
            try {
                if (typeof validateAndSanitizeAppState === 'function') {
                    appState = validateAndSanitizeAppState(appState);
                }
                SafeStorage.setJSON('motorCare_AppState_v140', appState);
                try {
                    const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProf) {
                        const prof = JSON.parse(rawProf);
                        const uEmail = (prof.email || '').trim().toLowerCase();
                        if (uEmail && prof.provider !== 'guest') {
                            const uKey = uEmail.replace(/[^a-z0-9_]/g, '_');
                            SafeStorage.setJSON('motorCare_AppState_' + uKey, appState);
                        }
                    }
                } catch(scopedErr) {
                    console.warn('[MotorCare Storage] Scoped backup notice:', scopedErr);
                }
                if (typeof syncUserDataToCloud === 'function') {
                    try {
                        syncUserDataToCloud(triggerReason);
                    } catch (cloudErr) {
                        console.warn('[MotorCare Cloud] Non-blocking sync notice:', cloudErr);
                    }
                }
                return true;
            } catch (err) {
                console.error('[MotorCare Storage] Critical saveAppState error:', err);
                return false;
            }
        }'''

    if old_save_app_state in content:
        content = content.replace(old_save_app_state, new_save_app_state, 1)
        print("  [1] saveAppState updated with scoped backup.")
    else:
        print("  [1] Warning: old saveAppState pattern not found.")

    # 2. Add detectAndIsolateUserSession and stopCloudSyncListener right before enterMainApp
    detect_and_isolate_code = '''        /* ==========================================================================
           [SESSION ISOLATION ENGINE] محرك عزل جلسات المستخدمين ومنع تسريب بيانات السيارات
           ========================================================================== */
        function stopCloudSyncListener() {
            if (typeof firestoreUnsubscribeListener === 'function') {
                try { firestoreUnsubscribeListener(); } catch (e) {}
                firestoreUnsubscribeListener = null;
            }
        }
        window.stopCloudSyncListener = stopCloudSyncListener;

        function detectAndIsolateUserSession(newUserEmail, newProvider, isNewRegistration = false) {
            try {
                const normalizedNewEmail = (newUserEmail || '').trim().toLowerCase();
                let currentEmail = '';
                let currentProvider = '';

                try {
                    const rawProfile = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProfile) {
                        const parsed = JSON.parse(rawProfile);
                        if (parsed && parsed.email) currentEmail = parsed.email.trim().toLowerCase();
                        if (parsed && parsed.provider) currentProvider = parsed.provider;
                    }
                } catch (e) { }

                stopCloudSyncListener();

                const isUserSwitching = currentEmail && normalizedNewEmail && (currentEmail !== normalizedNewEmail);
                const isProviderSwitching = currentProvider && newProvider && (currentProvider !== newProvider);

                if (currentEmail && currentProvider !== 'guest' && (isUserSwitching || isProviderSwitching || isNewRegistration)) {
                    try {
                        const oldUserKey = currentEmail.replace(/[^a-z0-9_]/g, '_');
                        if (typeof appState !== 'undefined') {
                            SafeStorage.setJSON('motorCare_AppState_' + oldUserKey, appState);
                        }
                    } catch (e) { }
                }

                if (isNewRegistration || isUserSwitching || isProviderSwitching || !currentEmail) {
                    console.log(`[MotorCare Auth] Isolating session for: ${normalizedNewEmail || 'guest'} (isNewReg: ${isNewRegistration})`);

                    if (typeof appState !== 'undefined' && appState.cars) {
                        appState.cars.length = 0;
                        appState.currentCarIndex = 0;
                    }

                    SafeStorage.removeItem('motorCare_AppState_v140');
                    SafeStorage.removeItem('motorCare_PersonalEmergencyContacts');
                    SafeStorage.removeItem('motorCare_LastCloudSyncTime');

                    if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.removeItem) {
                        MotorCareIndexedDB.removeItem('motorCare_AppState_v140').catch(() => {});
                    }

                    if (!isNewRegistration && normalizedNewEmail && newProvider !== 'guest') {
                        const newUserKey = normalizedNewEmail.replace(/[^a-z0-9_]/g, '_');
                        const cachedState = SafeStorage.getJSON('motorCare_AppState_' + newUserKey, null);
                        if (cachedState && Array.isArray(cachedState.cars) && cachedState.cars.length > 0) {
                            console.log(`[MotorCare Auth] Restored ${cachedState.cars.length} cars from user-scoped storage for: ${normalizedNewEmail}`);
                            if (typeof validateAndSanitizeAppState === 'function') {
                                const sanitized = validateAndSanitizeAppState(cachedState);
                                if (typeof appState !== 'undefined') {
                                    Object.assign(appState, sanitized);
                                }
                            }
                            SafeStorage.setJSON('motorCare_AppState_v140', appState);
                        }
                    }

                    if (typeof renderDashboard === 'function') {
                        try { renderDashboard(); } catch (e) { }
                    }
                }
            } catch (err) {
                console.warn('[MotorCare Auth] Session isolation notice:', err);
            }
        }
        window.detectAndIsolateUserSession = detectAndIsolateUserSession;

'''

    enter_main_app_header = '''        /* ==========================================================================
           [INSTANT AUTH & APP TRANSITION ENGINE] محرك المصادقة الفورية والدخول إلى التطبيق
           ========================================================================== */'''

    if enter_main_app_header in content and 'detectAndIsolateUserSession' not in content:
        content = content.replace(enter_main_app_header, detect_and_isolate_code + enter_main_app_header, 1)
        print("  [2] detectAndIsolateUserSession & stopCloudSyncListener injected.")
    elif 'detectAndIsolateUserSession' in content:
        print("  [2] detectAndIsolateUserSession already present.")
    else:
        print("  [2] Warning: enterMainApp header not found.")

    # 3. Update enterMainApp to trigger checkFirstTimeOnboarding
    old_enter_main_app = '''        function enterMainApp() {
            try {
                SafeStorage.setItem('motorCare_LoggedIn', 'true');
                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) {
                    landing.style.setProperty('display', 'none', 'important');
                    landing.classList.add('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'flex', 'important');
                    mainApp.classList.remove('hidden');
                }
                if (typeof updateHeaderUserProfile === 'function') {
                    try { updateHeaderUserProfile(); } catch(e) { console.warn(e); }
                }
                if (typeof renderDashboard === 'function') {
                    try { renderDashboard(); } catch(e) { console.warn(e); }
                }
                if (typeof updateCloudSyncStatusUI === 'function') {
                    try { updateCloudSyncStatusUI('guest'); } catch(e) { console.warn(e); }
                }
            } catch(err) {
                console.error('enterMainApp error:', err);
                const l = document.getElementById('landingScreen');
                const m = document.getElementById('mainAppContainer');
                if (l) l.style.display = 'none';
                if (m) m.style.display = 'flex';
            }
        }'''

    new_enter_main_app = '''        function enterMainApp() {
            try {
                SafeStorage.setItem('motorCare_LoggedIn', 'true');
                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) {
                    landing.style.setProperty('display', 'none', 'important');
                    landing.classList.add('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'flex', 'important');
                    mainApp.classList.remove('hidden');
                }
                if (typeof updateHeaderUserProfile === 'function') {
                    try { updateHeaderUserProfile(); } catch(e) { console.warn(e); }
                }
                if (typeof renderDashboard === 'function') {
                    try { renderDashboard(); } catch(e) { console.warn(e); }
                }
                if (typeof updateCloudSyncStatusUI === 'function') {
                    try { updateCloudSyncStatusUI('guest'); } catch(e) { console.warn(e); }
                }
                if (typeof checkFirstTimeOnboarding === 'function') {
                    setTimeout(() => {
                        try { checkFirstTimeOnboarding(); } catch(e) { console.warn(e); }
                    }, 120);
                }
            } catch(err) {
                console.error('enterMainApp error:', err);
                const l = document.getElementById('landingScreen');
                const m = document.getElementById('mainAppContainer');
                if (l) l.style.display = 'none';
                if (m) m.style.display = 'flex';
            }
        }'''

    if old_enter_main_app in content:
        content = content.replace(old_enter_main_app, new_enter_main_app, 1)
        print("  [3] enterMainApp updated with checkFirstTimeOnboarding.")
    else:
        print("  [3] Warning: old enterMainApp not found.")

    # 4. Update handleGuestEntry & loginAsGoogleProfile
    old_guest_entry = '''        function handleGuestEntry() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let profile = {
                name: isEn ? 'Guest Visitor' : 'زائر كريم',
                email: '',
                provider: 'guest',
                isRegistered: false,
                isVerified: true
            };
            try {
                const existing = SafeStorage.getItem('motorCare_UserProfile');
                if (existing) {
                    const parsed = JSON.parse(existing);
                    if (parsed && parsed.email) profile = parsed;
                }
            } catch(e) {}
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Welcome! Browsing as Guest Explorer 🚗' : 'أهلاً بك! تصفح سريع بصلاحية زائر 🚗✨', 'info');
            }
        }'''

    new_guest_entry = '''        function handleGuestEntry() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            detectAndIsolateUserSession('guest', 'guest', false);
            let profile = {
                name: isEn ? 'Guest Visitor' : 'زائر كريم',
                email: '',
                provider: 'guest',
                isRegistered: false,
                isVerified: true
            };
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Welcome! Browsing as Guest Explorer 🚗' : 'أهلاً بك! تصفح سريع بصلاحية زائر 🚗✨', 'info');
            }
        }'''

    if old_guest_entry in content:
        content = content.replace(old_guest_entry, new_guest_entry, 1)
        print("  [4] handleGuestEntry updated with session isolation.")
    else:
        print("  [4] Warning: old handleGuestEntry not found.")

    old_google_profile = '''            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
            return true;
        }'''

    new_google_profile = '''            detectAndIsolateUserSession(email, 'google', false);
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
            return true;
        }'''

    if old_google_profile in content:
        content = content.replace(old_google_profile, new_google_profile, 1)
        print("  [5] loginAsGoogleProfile updated with session isolation.")
    else:
        print("  [5] Warning: old loginAsGoogleProfile pattern not found.")

    # 5. Update initUserCloudSync to call checkFirstTimeOnboarding when empty
    old_init_sync = '''        function initUserCloudSync() {
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                updateCloudSyncStatusUI('guest');
                return Promise.resolve(false);
            }
            if (initFirestoreDatabase()) {
                return autoRestoreFromCloud().then((restored) => {
                    startRealtimeCloudSyncListener();
                    return restored;
                });
            } else {
                updateCloudSyncStatusUI('offline');
                return Promise.resolve(false);
            }
        }'''

    new_init_sync = '''        function initUserCloudSync() {
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                updateCloudSyncStatusUI('guest');
                if (typeof checkFirstTimeOnboarding === 'function') {
                    checkFirstTimeOnboarding();
                }
                return Promise.resolve(false);
            }
            if (initFirestoreDatabase()) {
                return autoRestoreFromCloud().then((restored) => {
                    startRealtimeCloudSyncListener();
                    if (!restored && typeof appState !== 'undefined' && (!appState.cars || appState.cars.length === 0)) {
                        if (typeof checkFirstTimeOnboarding === 'function') {
                            checkFirstTimeOnboarding();
                        }
                    }
                    return restored;
                });
            } else {
                updateCloudSyncStatusUI('offline');
                if (typeof checkFirstTimeOnboarding === 'function') {
                    checkFirstTimeOnboarding();
                }
                return Promise.resolve(false);
            }
        }'''

    if old_init_sync in content:
        content = content.replace(old_init_sync, new_init_sync, 1)
        print("  [6] initUserCloudSync updated with onboarding check.")
    else:
        print("  [6] Warning: old initUserCloudSync pattern not found.")

    # 6. Update handleAuthSubmit (both Sign In and Register Mode)
    # Search for the sign in block
    old_signin_block = '''                // اعتماد تسجيل الدخول بنجاح
                const profile = {
                    ...existingAccount,
                    lastLoginAt: new Date().toISOString()
                };
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');

                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) {
                    landing.style.setProperty('display', 'none', 'important');
                    landing.classList.add('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'flex', 'important');
                    mainApp.classList.remove('hidden');
                }

                if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof initUserCloudSync === 'function') initUserCloudSync();
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? `Welcome back, ${profile.name}! 👋` : `أهلاً بعودتك يا ${profile.name}! 👋`, 'success');
                }'''

    new_signin_block = '''                // اعتماد تسجيل الدخول بنجاح مع عزل الجلسة واسترجاع كراج المستخدم
                detectAndIsolateUserSession(email, 'email', false);

                const profile = {
                    ...existingAccount,
                    lastLoginAt: new Date().toISOString()
                };
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');

                enterMainApp();

                if (typeof initUserCloudSync === 'function') initUserCloudSync();
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? `Welcome back, ${profile.name}! 👋` : `أهلاً بعودتك يا ${profile.name}! 👋`, 'success');
                }'''

    if old_signin_block in content:
        content = content.replace(old_signin_block, new_signin_block, 1)
        print("  [7] handleAuthSubmit (Sign In Mode) updated.")
    else:
        print("  [7] Warning: old sign in block not found.")

    # Search for register block
    old_register_block = '''                const profile = { ...newAccount };
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');

                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn
                            ? `Account created! 🎉 Sending verification code to ${email}...`
                            : `تم إنشاء حسابك بنجاح! 🎉 جاري إرسال رمز التحقق إلى ${email}...`,
                        'success', 5000
                    );
                }

                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) {
                    landing.style.setProperty('display', 'none', 'important');
                    landing.classList.add('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'flex', 'important');
                    mainApp.classList.remove('hidden');
                }

                if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof initUserCloudSync === 'function') initUserCloudSync();'''

    new_register_block = '''                // عزل الجلسة تماماً وتفريغ الكراج للحساب الجديد (Clean Slate)
                detectAndIsolateUserSession(email, 'email', true);

                const profile = { ...newAccount };
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');

                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn
                            ? `Account created! 🎉 Sending verification code to ${email}...`
                            : `تم إنشاء حسابك بنجاح! 🎉 جاري إرسال رمز التحقق إلى ${email}...`,
                        'success', 5000
                    );
                }

                enterMainApp();
                if (typeof initUserCloudSync === 'function') initUserCloudSync();'''

    if old_register_block in content:
        content = content.replace(old_register_block, new_register_block, 1)
        print("  [8] handleAuthSubmit (Register Mode) updated.")
    else:
        print("  [8] Warning: old register block not found.")

    # 7. Update handleLogout
    old_logout = '''        function handleLogout() {
            try {
                if (typeof closeAccountCenter === 'function') closeAccountCenter();
                if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();
                if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();

                SafeStorage.removeItem('motorCare_LoggedIn');
                SafeStorage.setItem('motorCare_LoggedIn', 'false');

                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');

                if (landing) {
                    landing.style.removeProperty('display');
                    landing.style.setProperty('display', 'flex', 'important');
                    landing.classList.remove('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'none', 'important');
                    mainApp.classList.add('hidden');
                }

                if (typeof switchAuthTab === 'function') {
                    switchAuthTab('login');
                }

                const pwdInput = document.getElementById('authPassword');
                if (pwdInput) pwdInput.value = '';

                if (typeof initGoogleIdentityServices === 'function') {
                    try { initGoogleIdentityServices(); } catch(e) {}
                }

                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Signed out successfully 👋' : 'تم تسجيل الخروج بنجاح 👋', 'info');
                }
            } catch (err) {
                console.error('Logout error:', err);
                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) landing.style.display = 'flex';
                if (mainApp) mainApp.style.display = 'none';
            }
        }'''

    new_logout = '''        function handleLogout() {
            try {
                if (typeof closeAccountCenter === 'function') closeAccountCenter();
                if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();
                if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();

                // 1. حفظ بيانات المستخدم الحالي في مفتاح خاص باسمه قبل مسح الجلسة
                try {
                    const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProf) {
                        const prof = JSON.parse(rawProf);
                        const uEmail = (prof.email || '').trim().toLowerCase();
                        if (uEmail && prof.provider !== 'guest') {
                            const uKey = uEmail.replace(/[^a-z0-9_]/g, '_');
                            if (typeof appState !== 'undefined') {
                                SafeStorage.setJSON('motorCare_AppState_' + uKey, appState);
                            }
                        }
                    }
                } catch (e) { }

                // 2. إيقاف مزامنة السحابة اللحظية تماماً
                stopCloudSyncListener();

                // 3. تفريغ سيارات الكراج والذاكرة الحية بالكامل
                if (typeof appState !== 'undefined' && appState.cars) {
                    appState.cars.length = 0;
                    appState.currentCarIndex = 0;
                }

                // 4. مسح مفاتيح الجلسة النشطة
                SafeStorage.removeItem('motorCare_AppState_v140');
                SafeStorage.removeItem('motorCare_UserProfile');
                SafeStorage.removeItem('motorCare_PersonalEmergencyContacts');
                SafeStorage.removeItem('motorCare_LastCloudSyncTime');
                SafeStorage.setItem('motorCare_LoggedIn', 'false');

                // 5. مسح المرآة من IndexedDB
                if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.removeItem) {
                    MotorCareIndexedDB.removeItem('motorCare_AppState_v140').catch(() => {});
                }

                // 6. تحديث واجهة الكراج لعرض الواجهة الفارغة
                if (typeof renderDashboard === 'function') {
                    try { renderDashboard(); } catch (e) { }
                }

                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');

                if (landing) {
                    landing.style.removeProperty('display');
                    landing.style.setProperty('display', 'flex', 'important');
                    landing.classList.remove('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'none', 'important');
                    mainApp.classList.add('hidden');
                }

                if (typeof switchAuthTab === 'function') {
                    switchAuthTab('login');
                }

                const pwdInput = document.getElementById('authPassword');
                if (pwdInput) pwdInput.value = '';

                if (typeof initGoogleIdentityServices === 'function') {
                    try { initGoogleIdentityServices(); } catch(e) {}
                }

                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Signed out successfully 👋' : 'تم تسجيل الخروج بنجاح 👋', 'info');
                }
            } catch (err) {
                console.error('Logout error:', err);
                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) landing.style.display = 'flex';
                if (mainApp) mainApp.style.display = 'none';
            }
        }'''

    if old_logout in content:
        content = content.replace(old_logout, new_logout, 1)
        print("  [9] handleLogout updated with complete state wipe.")
    else:
        print("  [9] Warning: old handleLogout pattern not found.")

    # 8. Update openAddNewCarModal and add checkFirstTimeOnboarding
    old_add_car_modal = '''        function openAddNewCarModal() {
            closeGarageModal();
            const searchInput = document.getElementById('brandSearchInput');
            if (searchInput) searchInput.value = '';
            
            ['newCarOdoInput', 'newCarLicenseInput', 'newCarVinInput', 'newCarColorInput', 'newCarNotesInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = '';
                    el.dispatchEvent(new Event('input'));
                }
            });

            renderQuickBrandChips();
            populateBrandSelect();
            document.getElementById('addNewCarModal')?.classList.remove('hidden');
        }
        function closeAddNewCarModal() { document.getElementById('addNewCarModal')?.classList.add('hidden'); }'''

    new_add_car_modal = '''        function checkFirstTimeOnboarding() {
            const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
            if (!hasCar) {
                if (typeof openAddNewCarModal === 'function') {
                    openAddNewCarModal({ isMandatoryOnboarding: true });
                }
            }
        }
        window.checkFirstTimeOnboarding = checkFirstTimeOnboarding;

        function openAddNewCarModal(options = {}) {
            closeGarageModal();
            const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            
            const searchInput = document.getElementById('brandSearchInput');
            if (searchInput) searchInput.value = '';
            
            ['newCarOdoInput', 'newCarLicenseInput', 'newCarVinInput', 'newCarColorInput', 'newCarNotesInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = '';
                    el.dispatchEvent(new Event('input'));
                }
            });

            const modal = document.getElementById('addNewCarModal');
            if (modal) {
                const closeButtons = modal.querySelectorAll('button[onclick*="closeAddNewCarModal"]');
                closeButtons.forEach(btn => {
                    btn.style.display = (!hasCar) ? 'none' : '';
                });

                const titleEl = modal.querySelector('[data-i18n="modalAddCarTitle"]');
                if (titleEl) {
                    titleEl.innerText = (!hasCar) 
                        ? (isEn ? 'Welcome! Add Your First Vehicle' : 'مرحباً بك! أضف سيارتك الأولى')
                        : (isEn ? 'Add New Vehicle' : 'إضافة سيارة جديدة');
                }
            }

            renderQuickBrandChips();
            populateBrandSelect();
            modal?.classList.remove('hidden');
        }
        function closeAddNewCarModal(force = false) { 
            const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
            if (!hasCar && !force) {
                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please add your first car to proceed and access MotorCare services.' : 'يرجى إضافة سيارتك الأولى للمتابعة والبدء في استخدام كافة خدمات التطبيق.', 'warning');
                }
                return false;
            }
            document.getElementById('addNewCarModal')?.classList.add('hidden'); 
            return true;
        }'''

    if old_add_car_modal in content:
        content = content.replace(old_add_car_modal, new_add_car_modal, 1)
        print("  [10] openAddNewCarModal & checkFirstTimeOnboarding injected.")
    else:
        print("  [10] Warning: old openAddNewCarModal not found.")

    # 9. Update DOMContentLoaded to prevent unauthenticated data preload
    old_dom_load = '''            let loaded = SafeStorage.getJSON('motorCare_AppState_v140', null);
            if (loaded) { 
                try { 
                    appState = validateAndSanitizeAppState(loaded); 
                    if (typeof migrateAndAuditCarsCatalog === 'function') {
                        migrateAndAuditCarsCatalog(appState.cars);
                    }
                } catch(e) {
                    console.warn('[MotorCare] Error validating loaded state:', e);
                    appState = validateAndSanitizeAppState(appState);
                } 
            } else {
                appState = validateAndSanitizeAppState(appState);
            }

            // استرداد فوري وتلقائي من نسخة IndexedDB الاحتياطية إذا كان التخزين المحلي فارغاً أو تالفاً أو فُقدت سيارات الكراج
            if ((!appState.cars || appState.cars.length === 0) && typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.getItem) {
                MotorCareIndexedDB.getItem('motorCare_AppState_v140').then(dbState => {
                    if (dbState && dbState.cars && Array.isArray(dbState.cars) && dbState.cars.length > 0 && (!appState.cars || appState.cars.length === 0)) {
                        console.log('[MotorCare Storage] Recovered garage records from IndexedDB mirror!');
                        appState = validateAndSanitizeAppState(dbState);
                        SafeStorage.setJSON('motorCare_AppState_v140', appState);
                        if (typeof renderDashboard === 'function') renderDashboard();
                    }
                }).catch(() => {});
            }'''

    new_dom_load = '''            const isLoggedInEarly = SafeStorage.getItem('motorCare_LoggedIn');
            if (isLoggedInEarly === 'true') {
                let loaded = SafeStorage.getJSON('motorCare_AppState_v140', null);
                if (loaded) { 
                    try { 
                        appState = validateAndSanitizeAppState(loaded); 
                        if (typeof migrateAndAuditCarsCatalog === 'function') {
                            migrateAndAuditCarsCatalog(appState.cars);
                        }
                    } catch(e) {
                        console.warn('[MotorCare] Error validating loaded state:', e);
                        appState = validateAndSanitizeAppState(appState);
                    } 
                } else {
                    appState = validateAndSanitizeAppState(appState);
                }

                // استرداد فوري وتلقائي من نسخة IndexedDB الاحتياطية إذا كان التخزين المحلي فارغاً أو تالفاً أو فُقدت سيارات الكراج
                if ((!appState.cars || appState.cars.length === 0) && typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.getItem) {
                    MotorCareIndexedDB.getItem('motorCare_AppState_v140').then(dbState => {
                        if (dbState && dbState.cars && Array.isArray(dbState.cars) && dbState.cars.length > 0 && (!appState.cars || appState.cars.length === 0)) {
                            console.log('[MotorCare Storage] Recovered garage records from IndexedDB mirror!');
                            appState = validateAndSanitizeAppState(dbState);
                            SafeStorage.setJSON('motorCare_AppState_v140', appState);
                            if (typeof renderDashboard === 'function') renderDashboard();
                        }
                    }).catch(() => {});
                }
            } else {
                appState = validateAndSanitizeAppState(appState);
                if (appState && appState.cars) {
                    appState.cars = [];
                }
            }'''

    if old_dom_load in content:
        content = content.replace(old_dom_load, new_dom_load, 1)
        print("  [11] DOMContentLoaded updated to protect unauthenticated sessions.")
    else:
        print("  [11] Warning: old DOMContentLoaded pattern not found.")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Done patching {file_path}. New size: {len(content)} bytes.")

if __name__ == '__main__':
    patch_app_file('d:/car/MotorCare-App/index.html')
    patch_app_file('d:/car/MotorCare-App/src/index.html')
