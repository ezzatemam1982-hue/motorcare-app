        // تشغيل التطبيق وإعدادات بيئة الهاتف الأصلية (Capacitor & Mobile Handlers)
        function initMobilePlatform() {
            if (typeof window.Capacitor !== 'undefined') {
                const { App } = window.Capacitor.Plugins || {};
                // دعم زر الرجوع الخاص بهواتف أندرويد (Hardware Back Button)
                if (App && typeof App.addListener === 'function') {
                    App.addListener('backButton', ({ canGoBack }) => {
                        const openModals = [
                            'maintWearExplainerModal', 'driverToolsModal', 'obdCodesModal',
                            'accountCenterModal', 'editProfileModal', 'adminPinModal', 'changePinModal',
                            'subscribersAdminModal', 'googleSheetsModal', 'forgotPasswordModal',
                            'contactModal', 'notificationsHubModal', 'emergencyModal', 'maintenanceModal'
                        ];
                        for (const modalId of openModals) {
                            const el = document.getElementById(modalId);
                            if (el && !el.classList.contains('hidden') && el.style.display !== 'none') {
                                el.classList.add('hidden');
                                el.style.display = 'none';
                                return;
                            }
                        }
                        if (canGoBack) {
                            window.history.back();
                        } else {
                            App.exitApp();
                        }
                    });
                }
            }
        }

        // تشغيل التطبيق وقراءة التخزين محلياً فور الإقلاع
        window.addEventListener('DOMContentLoaded', () => {
            initMobilePlatform();
            initNetworkStatusMonitor();
            if (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.initInputGuards) {
                MotorCareSecurity.initInputGuards();
            }
            const isLoggedIn = SafeStorage.getItem('motorCare_LoggedIn') === 'true';
            if (isLoggedIn) {
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
                // المستخدم ليس مسجلاً دخوله — ضمان خلو الذاكرة من أي بيانات سيارات سابقة
                if (typeof appState !== 'undefined') {
                    appState.cars = [];
                    appState.currentCarIndex = 0;
                }
            }
            if (appState.darkMode) document.documentElement.classList.add('dark');
            
            // تطبيق إعدادات اللغة والاتجاه فوراً
            applyLanguageSettings();

            // تفعيل حراس وحماية الإدخال المباشرة للسيارات (VIN & Plates)
            if (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.initSecurityInputGuards) {
                MotorCareSecurity.initSecurityInputGuards();
            }

            // تفعيل مزامنة التوثيق والمصادقة اللحظية عبر التبويبات والأجهزة
            initCrossTabAuthSync();

            // فحص ردود المصادقة الحقيقية عبر OAuth (Google / Facebook) من الـ Hash Fragment
            if (typeof checkOAuthRedirectResponse === 'function') checkOAuthRedirectResponse();

            // تنظيف أي بروفايل وهمي قديم تلقائياً (user.google@gmail.com / مستخدم حساب Google)
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const p = JSON.parse(rawProf);
                    if (p && (p.email === 'user.google@gmail.com' || p.name === 'مستخدم حساب Google' || p.name === 'Google User' || (p.email && p.email.startsWith('dummy')))) {
                        console.log('[MotorCare Auth] Purging legacy dummy Google profile');
                        SafeStorage.removeItem('motorCare_UserProfile');
                        SafeStorage.setItem('motorCare_LoggedIn', 'false');
                    }
                }
            } catch(e) {}

            // فحص رابط تأكيد البريد الإلكتروني ورمز الـ OTP الفعلي
            if (typeof checkUrlEmailVerification === 'function') checkUrlEmailVerification();

            // تشغيل تهيئة Firestore وقاعدة البيانات فوراً للجميع (مسجلين وزوار وواجهة الدخول)
            if (typeof initFirestoreDatabase === 'function') {
                try { initFirestoreDatabase(); } catch(e) {}
            }
            if (typeof initAuthEmailLiveWatcher === 'function') {
                try { initAuthEmailLiveWatcher(); } catch(e) {}
            }

            if (isLoggedIn) {
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
                try { updateHeaderUserProfile(); } catch(e) { console.warn(e); }
                try { renderDashboard(); } catch(e) { console.warn(e); }
                try { initUserCloudSync(); } catch(e) { console.warn(e); }

                // حارس أمان احتياطي: فحص الإعداد الأولي فقط بعد إتاحة مهلة كافية للمزامنة السحابية إذا لم توجد أي سيارات
                setTimeout(() => {
                    const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                    if (!hasCar && typeof checkFirstTimeOnboarding === 'function') {
                        checkFirstTimeOnboarding();
                    }
                }, 2500);

                if (typeof checkUrlNotificationActions === 'function') {
                    try { checkUrlNotificationActions(); } catch(e) {}
                }
                if (typeof MotorCareNotifications !== 'undefined' && MotorCareNotifications.init) {
                    try { MotorCareNotifications.init(); } catch(e) {}
                }

                // إذا كان الحساب مسجلاً وغير موثق بعد، تشغيل المراقبة الحية لتوثيقه فوراً عند النقر على الرابط من أي جهاز
                let curProf = {};
                try {
                    const raw = SafeStorage.getItem('motorCare_UserProfile');
                    if (raw) curProf = JSON.parse(raw);
                } catch(e) {}
                if (curProf.email && curProf.isRegistered && !curProf.isVerified && !curProf.emailVerified) {
                    startLiveVerificationWatcher(curProf.email);
                }
            } else {
                // تفعيل Google Identity Services تلقائياً ورسم زر الدخول الرسمي
                if (typeof initGoogleIdentityServices === 'function') {
                    initGoogleIdentityServices();
                }
                setTimeout(() => {
                    if (typeof initGoogleIdentityServices === 'function') {
                        initGoogleIdentityServices();
                    }
                }, 800);
            }
        });

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof initMobilePlatform !== 'undefined') window.initMobilePlatform = initMobilePlatform; } catch (e) {}
try { if (typeof checkFirstTimeOnboarding !== 'undefined') window.checkFirstTimeOnboarding = checkFirstTimeOnboarding; } catch (e) {}
