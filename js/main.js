// ==========================================================================
// [FIREBASE SDK - ANALYTICS & CRASHLYTICS INTEGRATION]
// ==========================================================================
// استدعاء وإعداد Firebase Analytics و Crashlytics من ملحقات Capacitor و Web SDK
const FirebaseAnalytics = (typeof window !== 'undefined' && (window.Capacitor?.Plugins?.FirebaseAnalytics || window.FirebaseAnalytics)) || {
    setCurrentScreen: async (opts) => {
        try {
            if (window.firebaseAnalytics && typeof window.firebaseAnalytics.logEvent === 'function') {
                window.firebaseAnalytics.logEvent('screen_view', {
                    firebase_screen: opts?.screenName,
                    screen_name: opts?.screenName
                });
            }
            console.log('[MotorCare Analytics] Screen view:', opts?.screenName);
        } catch (e) {}
    },
    logEvent: async (opts) => {
        try {
            if (window.firebaseAnalytics && typeof window.firebaseAnalytics.logEvent === 'function') {
                window.firebaseAnalytics.logEvent(opts?.name, opts?.params || {});
            }
        } catch (e) {}
    }
};

const FirebaseCrashlytics = (typeof window !== 'undefined' && (window.Capacitor?.Plugins?.FirebaseCrashlytics || window.FirebaseCrashlytics)) || {
    recordException: async (opts) => {
        try {
            console.warn('[MotorCare Crashlytics Non-Fatal]', opts?.message);
        } catch (e) {}
    },
    setEnabled: async () => {},
    log: async () => {},
    setUserId: async () => {},
    setCustomKey: async () => {}
};

if (typeof window !== 'undefined') {
    window.FirebaseAnalytics = FirebaseAnalytics;
    window.FirebaseCrashlytics = FirebaseCrashlytics;
}

// دالة تتبع فتح الشاشات (Screen Views) عند التنقل بين أقسام التطبيق
function trackScreenView(currentScreen) {
    try {
        if (!currentScreen) return;
        const analyticsPlugin = (window.Capacitor?.Plugins?.FirebaseAnalytics) || window.FirebaseAnalytics;
        if (analyticsPlugin && typeof analyticsPlugin.setCurrentScreen === 'function') {
            analyticsPlugin.setCurrentScreen({ screenName: String(currentScreen) }).catch(() => {});
        }
        if (window.firebaseAnalytics && typeof window.firebaseAnalytics.logEvent === 'function') {
            window.firebaseAnalytics.logEvent('screen_view', {
                firebase_screen: String(currentScreen),
                screen_name: String(currentScreen)
            });
        }
    } catch (e) {
        console.warn('[MotorCare Analytics] Failed to track screen view:', e);
    }
}
window.trackScreenView = trackScreenView;

// ربط معالج الأخطاء العام (window.onerror و window.onunhandledrejection) لتسجيل أي استثناء تلقائياً عبر Crashlytics
(function setupGlobalCrashReporting() {
    if (typeof window === 'undefined') return;

    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
        try {
            const crashPlugin = (window.Capacitor?.Plugins?.FirebaseCrashlytics) || window.FirebaseCrashlytics;
            const errMsg = error && error.message ? error.message : (typeof message === 'string' ? message : JSON.stringify(message));
            const stack = error && error.stack ? `\nStack: ${error.stack}` : '';
            const fullMsg = `[Uncaught Error] ${errMsg} at ${source || 'unknown'}:${lineno || 0}:${colno || 0}${stack}`;
            
            if (crashPlugin && typeof crashPlugin.recordException === 'function') {
                crashPlugin.recordException({ message: fullMsg }).catch(() => {});
            }
        } catch (err) {
            console.warn('[MotorCare Crashlytics] Error recording window.onerror:', err);
        }

        if (typeof originalOnError === 'function') {
            return originalOnError.apply(this, arguments);
        }
        return false;
    };

    window.addEventListener('unhandledrejection', function (event) {
        try {
            const crashPlugin = (window.Capacitor?.Plugins?.FirebaseCrashlytics) || window.FirebaseCrashlytics;
            const reason = event.reason;
            let errMsg = 'Unhandled Promise Rejection';
            if (reason) {
                if (typeof reason === 'string') {
                    errMsg = reason;
                } else if (reason.message) {
                    errMsg = reason.message + (reason.stack ? `\nStack: ${reason.stack}` : '');
                } else {
                    try { errMsg = JSON.stringify(reason); } catch(e) { errMsg = String(reason); }
                }
            }
            const fullMsg = `[Unhandled Rejection] ${errMsg}`;

            if (crashPlugin && typeof crashPlugin.recordException === 'function') {
                crashPlugin.recordException({ message: fullMsg }).catch(() => {});
            }
        } catch (err) {
            console.warn('[MotorCare Crashlytics] Error recording unhandledrejection:', err);
        }
    });
})();

        // تشغيل التطبيق وإعدادات بيئة الهاتف الأصلية (Capacitor & Mobile Handlers)
        function initMobilePlatform() {
            // التهيئة التلقائية الشاملة لبيئة الموبايل تتم عبر خدمة MotorCareMobile المخصصة (js/services/mobile.js)
            // مع الحفاظ على الربط العام للدالة لضمان التوافق المطلق
            if (typeof MotorCareMobile !== 'undefined') {
                console.log('[MotorCare Main] Mobile platform verified via MotorCareMobile service.');
            }
            // تمكين تسجيل الأعطال في Crashlytics عند العمل في بيئة أندرويد الأصلية
            try {
                const crashPlugin = (window.Capacitor?.Plugins?.FirebaseCrashlytics) || window.FirebaseCrashlytics;
                if (crashPlugin && typeof crashPlugin.setEnabled === 'function') {
                    crashPlugin.setEnabled({ enabled: true }).catch(() => {});
                }
            } catch(e) {}
        }

        // تشغيل التطبيق وقراءة التخزين محلياً فور الإقلاع
        window.addEventListener('DOMContentLoaded', () => {
            initMobilePlatform();
            initNetworkStatusMonitor();
            
            // ضمان خلو الشاشة الرئيسية من أي قوالب تقارير مخصصة للطباعة فور الإقلاع
            try {
                document.querySelectorAll('.printable-report').forEach(el => {
                    el.classList.add('hidden');
                    el.classList.remove('active-print-target');
                    el.style.setProperty('display', 'none', 'important');
                });
            } catch(e) {}

            if (typeof initDrawerAndSidebarEventListeners === 'function') {
                initDrawerAndSidebarEventListeners();
            }
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

                // تتبع فتح الشاشة الرئيسية في Analytics وربط هوية المستخدم في Crashlytics
                trackScreenView(window.currentActiveTab || 'dashboard');
                try {
                    let curProf = {};
                    const raw = SafeStorage.getItem('motorCare_UserProfile');
                    if (raw) curProf = JSON.parse(raw);
                    const uid = curProf.email || curProf.id;
                    if (uid) {
                        const analyticsPlugin = (window.Capacitor?.Plugins?.FirebaseAnalytics) || window.FirebaseAnalytics;
                        const crashPlugin = (window.Capacitor?.Plugins?.FirebaseCrashlytics) || window.FirebaseCrashlytics;
                        if (analyticsPlugin && typeof analyticsPlugin.setUserId === 'function') analyticsPlugin.setUserId({ userId: String(uid) }).catch(() => {});
                        if (crashPlugin && typeof crashPlugin.setUserId === 'function') crashPlugin.setUserId({ userId: String(uid) }).catch(() => {});
                    }
                } catch(e) {}

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
                trackScreenView('landing');
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
