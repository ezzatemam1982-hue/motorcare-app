        /* ==========================================================================
           [FIREBASE FIRESTORE AUTO CLOUD SYNC ENGINE] محرك المزامنة السحابية الذكية وقاعدة البيانات
           ========================================================================== */
        let firestoreDb = null;
        let isFirestoreReady = false;
        let firestoreUnsubscribeListener = null;
        let isSyncingToCloud = false;
        let pendingSyncDebounceTimer = null;

        // إعدادات Firebase الرسمية الحقيقية لمشروع MotorCare
        const DEFAULT_FIREBASE_CONFIG = {
            apiKey: "AIzaSyDf9vpYQjIPvtV5jf0EBf5BM3b6rnqfYSU",
            authDomain: "motorcare-1b6d2.firebaseapp.com",
            projectId: "motorcare-1b6d2",
            storageBucket: "motorcare-1b6d2.firebasestorage.app",
            messagingSenderId: "905426771864",
            appId: "1:905426771864:web:d01759af3c9cce5caed5ed",
            measurementId: "G-Q89RQWEB14"
        };

        window.firebaseConfig = DEFAULT_FIREBASE_CONFIG;

        function getFirebaseConfig() {
            try {
                const custom = SafeStorage.getItem('motorCare_FirebaseConfig');
                if (custom) {
                    const parsed = JSON.parse(custom);
                    // تجاهل أي إعدادات وهمية قديمة مسجلة مسبقاً
                    if (parsed && parsed.projectId && parsed.projectId !== 'motorcare-app-681024358152') {
                        return parsed;
                    }
                }
            } catch(e) {}
            if (window.MOTORCARE_FIREBASE_CONFIG) {
                return window.MOTORCARE_FIREBASE_CONFIG;
            }
            return DEFAULT_FIREBASE_CONFIG;
        }

        function initFirestoreDatabase() {
            if (window.firestoreDb) {
                firestoreDb = window.firestoreDb;
                isFirestoreReady = true;
                return true;
            }
            if (isFirestoreReady && firestoreDb) return true;
            if (typeof firebase === 'undefined') {
                console.warn('[MotorCare Cloud] Firebase SDK not loaded yet.');
                return false;
            }
            try {
                if (!firebase.apps || !firebase.apps.length) {
                    const cfg = getFirebaseConfig();
                    const app = firebase.initializeApp(cfg);
                    window.firebaseApp = app;

                    if (typeof firebase.analytics === 'function' && cfg.measurementId) {
                        try {
                            window.firebaseAnalytics = firebase.analytics();
                            window.analytics = window.firebaseAnalytics;
                            console.log('[MotorCare Cloud] Firebase Analytics initialized successfully.');
                        } catch(e) {}
                    }
                }
                firestoreDb = firebase.firestore();
                window.firestoreDb = firestoreDb;
                window.db = firestoreDb;

                if (typeof firebase.auth === 'function') {
                    try {
                        window.firebaseAuth = firebase.auth();
                    } catch(authErr) {}
                }

                // دوال الملاءمة المعيارية (Modular Helper Shortcuts) للوصول السريع
                window.doc = (collectionOrDb, colOrId, idMaybe) => {
                    if (idMaybe) return firestoreDb.collection(colOrId).doc(idMaybe);
                    if (typeof colOrId === 'string' && !idMaybe) return firestoreDb.collection(collectionOrDb).doc(colOrId);
                    return firestoreDb.collection(collectionOrDb).doc(colOrId);
                };
                window.getDoc = (docRef) => docRef.get();
                window.setDoc = (docRef, data, options) => docRef.set(data, options || {});

                // تفعيل حفظ البيانات أوفلاين محلياً عبر IndexedDB Persistence
                firestoreDb.enablePersistence({ synchronizeTabs: true })
                    .then(() => {
                        console.log('[MotorCare Cloud] Firestore Offline Persistence active (IndexedDB) for motorcare-1b6d2.');
                    })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn('[MotorCare Cloud] Multiple tabs open, persistence restricted to primary tab.');
                        } else if (err.code === 'unimplemented') {
                            console.warn('[MotorCare Cloud] Browser does not support Firestore persistence.');
                        } else {
                            console.warn('[MotorCare Cloud] Persistence note:', err.message);
                        }
                    });

                isFirestoreReady = true;
                return true;
            } catch(e) {
                console.warn('[MotorCare Cloud] Firebase init note:', e.message);
                return false;
            }
        }

        async function ensureFirestoreReady(maxWaitMs = 3500) {
            if (window.firestoreDb) {
                firestoreDb = window.firestoreDb;
                isFirestoreReady = true;
                return firestoreDb;
            }
            if (isFirestoreReady && firestoreDb) return firestoreDb;
            if (typeof initFirestoreDatabase === 'function' && initFirestoreDatabase()) return firestoreDb;
            const start = Date.now();
            while (Date.now() - start < maxWaitMs) {
                if (typeof firebase !== 'undefined') {
                    if (initFirestoreDatabase()) return firestoreDb;
                }
                await new Promise(r => setTimeout(r, 100));
            }
            return firestoreDb;
        }

        function getCloudSyncUserKey() {
            // فحص خيار المستخدم للمزامنة السحابية: إذا تم تعطيلها يدوياً تكون القيمة 'false'
            if (SafeStorage.getItem('motorCare_CloudSyncEnabled') === 'false') {
                return null;
            }

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            // زائر (Guest): البيانات محلية 100% بدون أي مزامنة سحابية حفاظاً على الخصوصية والسرعة
            if (!profile || profile.provider === 'guest' || profile.isRegistered === false) {
                return null;
            }

            // المزامنة السحابية المعتمدة عبر البريد الإلكتروني (Email-based Cloud Sync Key)
            const email = (profile.email || '').trim().toLowerCase();
            if (email && email.includes('@')) {
                return email.replace(/[^a-z0-9_]/g, '_');
            }

            if (profile.uid && String(profile.uid).length > 3) return String(profile.uid);
            if (profile.firebaseUid && String(profile.firebaseUid).length > 3) return String(profile.firebaseUid);
            if (profile.id) return String(profile.id).replace(/[^a-z0-9_]/g, '_');

            return null;
        }

        function updateCloudSyncStatusUI(status, label) {
            const badge = document.getElementById('cloudSyncStatusBadge');
            const accountModalBadge = document.getElementById('accountModalCloudSyncBadge');
            const syncToggle = document.getElementById('accountModalCloudSyncToggle');

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            const isRegisteredUser = profile && profile.isRegistered && profile.provider !== 'guest';

            if (syncToggle) {
                syncToggle.disabled = !isRegisteredUser;
                if (!isRegisteredUser) {
                    syncToggle.checked = false;
                } else {
                    syncToggle.checked = (SafeStorage.getItem('motorCare_CloudSyncEnabled') !== 'false');
                }
            }

            if (!badge && !accountModalBadge) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let text = label || '';
            let cls = '';

            if (status === 'synced') {
                cls = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
                text = text || (isEn ? '<i class="fa-solid fa-cloud-check"></i> Cloud Sync Active ☁️' : '<i class="fa-solid fa-cloud-check"></i> مزامنة سحابية نشطة ☁️');
            } else if (status === 'syncing') {
                cls = 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400 animate-pulse';
                text = text || (isEn ? '<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Syncing...' : '<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> جاري المزامنة...');
            } else if (status === 'offline') {
                cls = 'bg-slate-500/15 border-slate-500/40 text-slate-500 dark:text-slate-400';
                text = text || (isEn ? '<i class="fa-solid fa-floppy-disk"></i> Local (Offline) 🔒' : '<i class="fa-solid fa-floppy-disk"></i> حفظ محلي (أوفلاين) 🔒');
            } else if (status === 'guest') {
                cls = 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400';
                text = text || (isEn ? '<i class="fa-solid fa-compass"></i> Guest (Local Only)' : '<i class="fa-solid fa-compass"></i> زائر (محلي فقط)');
            } else if (status === 'error') {
                cls = 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400';
                text = text || (isEn ? '<i class="fa-solid fa-triangle-exclamation"></i> Disconnected' : '<i class="fa-solid fa-triangle-exclamation"></i> غير متصل - حفظ محلي');
            }

            [badge, accountModalBadge].forEach(el => {
                if (el) {
                    el.className = `inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${cls}`;
                    el.innerHTML = text;
                    el.classList.remove('hidden');
                }
            });
        }

        function toggleCloudSyncSetting(enabled) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            if (!profile || profile.provider === 'guest' || profile.isRegistered === false) {
                const toggle = document.getElementById('accountModalCloudSyncToggle');
                if (toggle) toggle.checked = false;
                SafeStorage.setItem('motorCare_CloudSyncEnabled', 'false');
                updateCloudSyncStatusUI('guest');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please register or log in to enable Cloud Sync.' : 'يرجى تسجيل الدخول أو إنشاء حساب لتفعيل المزامنة السحابية ☁️', 'info');
                }
                return;
            }

            SafeStorage.setItem('motorCare_CloudSyncEnabled', enabled ? 'true' : 'false');
            if (enabled) {
                updateCloudSyncStatusUI('syncing');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Cloud Sync enabled! Syncing data...' : 'تم تفعيل المزامنة السحابية! جاري مزامنة بياناتك...', 'success', 3000);
                }
                if (typeof initUserCloudSync === 'function') {
                    initUserCloudSync().then(() => {
                        syncUserDataToCloud('toggle_enable');
                    }).catch(() => {
                        syncUserDataToCloud('toggle_enable');
                    });
                }
            } else {
                if (typeof stopCloudSyncListener === 'function') {
                    stopCloudSyncListener();
                }
                updateCloudSyncStatusUI('offline');
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Cloud Sync paused. Changes saved locally (Offline).' : 'تم إيقاف المزامنة السحابية. يتم حفظ البيانات محلياً فقط 🔒', 'info', 3000);
                }
            }
        }
        window.toggleCloudSyncSetting = toggleCloudSyncSetting;

        function syncUserDataToCloud(reason = 'update') {
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                let profile = {};
                try {
                    const raw = SafeStorage.getItem('motorCare_UserProfile');
                    if (raw) profile = JSON.parse(raw);
                } catch(e) {}
                if (profile && profile.isRegistered && SafeStorage.getItem('motorCare_CloudSyncEnabled') === 'false') {
                    updateCloudSyncStatusUI('offline');
                } else {
                    updateCloudSyncStatusUI('guest');
                }
                return;
            }

            // منع الضغط السريع وتكرار العمليات عبر Debounce
            if (pendingSyncDebounceTimer) clearTimeout(pendingSyncDebounceTimer);

            pendingSyncDebounceTimer = setTimeout(() => {
                executeCloudSync(userKey, reason);
            }, 600);
        }

        function executeCloudSync(userKey, reason) {
            if (window.firestoreDb) {
                firestoreDb = window.firestoreDb;
                isFirestoreReady = true;
            }
            if (!isFirestoreReady && !initFirestoreDatabase()) {
                updateCloudSyncStatusUI('offline');
                return;
            }

            updateCloudSyncStatusUI('syncing');
            isSyncingToCloud = true;

            const syncBtnText = document.getElementById('accountModalSyncBtnText');
            const syncBtnIcon = document.getElementById('accountModalSyncBtnIcon');
            const isManual = (reason === 'manual_account_modal');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (isManual) {
                if (syncBtnText) syncBtnText.innerText = isEn ? 'Syncing...' : 'جاري المزامنة...';
                if (syncBtnIcon) syncBtnIcon.className = 'fa-solid fa-rotate text-[8px] fa-spin';
            }

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            let personalContacts = [];
            try {
                const rawContacts = SafeStorage.getItem('motorCare_PersonalEmergencyContacts');
                if (rawContacts) personalContacts = JSON.parse(rawContacts);
            } catch(e) {}

            const payload = {
                userKey: userKey,
                uid: profile.uid || userKey,
                email: profile.email || '',
                name: profile.name || '',
                provider: profile.provider || 'email',
                isVerified: !!profile.isVerified,
                cars: appState.cars || [],
                currentCarIndex: appState.currentCarIndex || 0,
                personalEmergencyContacts: personalContacts || [],
                lang: appState.lang || 'ar',
                darkMode: !!appState.darkMode,
                currency: appState.currency || 'EGP',
                lastSyncReason: reason,
                clientTimestamp: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                }
            };

            if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                payload.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
            }

            firestoreDb.collection('motorcare_users').doc(userKey).set(payload, { merge: true })
                .then(() => {
                    isSyncingToCloud = false;
                    SafeStorage.setItem('motorCare_LastCloudSyncTime', new Date().toISOString());
                    updateCloudSyncStatusUI('synced');
                    console.log(`[MotorCare Cloud] Auto-sync success (${reason}) for user: ${userKey}`);

                    if (isManual) {
                        if (syncBtnText) syncBtnText.innerText = isEn ? 'Synced ✓' : 'تمت المزامنة بنجاح ✓';
                        if (syncBtnIcon) syncBtnIcon.className = 'fa-solid fa-check text-[8px] text-emerald-500';
                        if (typeof showNotification === 'function') {
                            showNotification(isEn ? 'Data successfully synced with Cloud ☁️' : 'تمت المزامنة بنجاح مع السحابة ☁️', 'success', 3500);
                        }
                        setTimeout(() => {
                            if (syncBtnText) syncBtnText.innerText = isEn ? 'Sync Now' : 'مزامنة الآن';
                            if (syncBtnIcon) syncBtnIcon.className = 'fa-solid fa-rotate text-[8px]';
                        }, 2500);
                    }
                })
                .catch((err) => {
                    isSyncingToCloud = false;
                    updateCloudSyncStatusUI('error');
                    console.warn('[MotorCare Cloud] Sync note (saved in local IndexedDB):', err.message);

                    if (isManual) {
                        if (syncBtnText) syncBtnText.innerText = isEn ? 'Retry' : 'إعادة المحاولة';
                        if (syncBtnIcon) syncBtnIcon.className = 'fa-solid fa-triangle-exclamation text-[8px] text-rose-500';
                        if (typeof showNotification === 'function') {
                            showNotification(isEn ? 'Could not reach cloud. Changes saved locally.' : 'تعذر الاتصال بالسحابة. تم حفظ التغييرات محلياً 🔒', 'warning', 4000);
                        }
                        setTimeout(() => {
                            if (syncBtnText) syncBtnText.innerText = isEn ? 'Sync Now' : 'مزامنة الآن';
                            if (syncBtnIcon) syncBtnIcon.className = 'fa-solid fa-rotate text-[8px]';
                        }, 3000);
                    }
                });
        }

        async function autoRestoreFromCloud(force = false) {
            if (window.firestoreDb) {
                firestoreDb = window.firestoreDb;
                isFirestoreReady = true;
            }
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                let profile = {};
                try {
                    const raw = SafeStorage.getItem('motorCare_UserProfile');
                    if (raw) profile = JSON.parse(raw);
                } catch(e) {}
                if (profile && profile.isRegistered && SafeStorage.getItem('motorCare_CloudSyncEnabled') === 'false') {
                    updateCloudSyncStatusUI('offline');
                } else {
                    updateCloudSyncStatusUI('guest');
                }
                return false;
            }

            if (!isFirestoreReady && !initFirestoreDatabase()) {
                updateCloudSyncStatusUI('offline');
                return false;
            }

            updateCloudSyncStatusUI('syncing');

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            try {
                // 1. محاولة جلب مستند المستخدم بواسطة userKey (UID الموحد)
                let doc = await firestoreDb.collection('motorcare_users').doc(userKey).get();

                // 2. إذا لم يكن المستند موجوداً وكان لدينا بريد مسجل، فحص المستند القديم بالبريد للهجرة التلقائية
                if ((!doc || !doc.exists) && profile.email && profile.email.includes('@')) {
                    const legacyKey = profile.email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    if (legacyKey !== userKey) {
                        try {
                            const legacyDoc = await firestoreDb.collection('motorcare_users').doc(legacyKey).get();
                            if (legacyDoc && legacyDoc.exists) {
                                doc = legacyDoc;
                                const legacyData = legacyDoc.data();
                                if (legacyData) {
                                    firestoreDb.collection('motorcare_users').doc(userKey).set({
                                        ...legacyData,
                                        uid: userKey,
                                        migratedFromLegacyEmailKey: legacyKey
                                    }, { merge: true }).catch(() => {});
                                    console.log(`[MotorCare Cloud] Migrated user data from legacy key (${legacyKey}) to UID (${userKey})`);
                                }
                            }
                        } catch(legacyErr) {}
                    }
                }

                const localCarsCount = (appState.cars && Array.isArray(appState.cars)) ? appState.cars.length : 0;

                if (doc && doc.exists) {
                    const cloudData = doc.data();
                    if (cloudData && Array.isArray(cloudData.cars)) {
                        const cloudCarsCount = cloudData.cars.length;

                        // إذا كان في السحابة سيارات واللوكال فارغ، أو السحابة أكثر/محدثة: اسحب من السحابة (Pull)
                        if (localCarsCount === 0 || force || (cloudCarsCount >= localCarsCount && cloudCarsCount > 0)) {
                            appState.cars = cloudData.cars;
                            if (typeof migrateAndAuditCarsCatalog === 'function') {
                                migrateAndAuditCarsCatalog(appState.cars);
                            }
                            if (typeof cloudData.currentCarIndex === 'number') {
                                appState.currentCarIndex = Math.min(cloudData.currentCarIndex, Math.max(0, cloudData.cars.length - 1));
                            }
                            if (cloudData.currency) appState.currency = cloudData.currency;
                            
                            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                            if (typeof renderDashboard === 'function') renderDashboard();
                            updateCloudSyncStatusUI('synced');

                            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                            if (cloudCarsCount > 0 && localCarsCount === 0) {
                                showNotification(isEn 
                                    ? `Your garage data has been restored successfully (${cloudCarsCount} vehicle${cloudCarsCount > 1 ? 's' : ''})` 
                                    : `تم استرجاع بيانات سيارتك بنجاح (${cloudCarsCount} سيارة)`, 'success', 4000);
                            }

                            if (cloudCarsCount > 0) {
                                if (typeof closeAddNewCarModal === 'function') closeAddNewCarModal(true);
                                const modal = document.getElementById('addNewCarModal');
                                if (modal) {
                                    modal.classList.add('hidden');
                                    modal.style.display = 'none';
                                }
                            }
                        } else if (localCarsCount > cloudCarsCount) {
                            // المزامنة ثنائية الاتجاه (Bidirectional Sync): اللوكال لديه سيارات أكثر من السحابة -> ارفع للسحابة فوراً (Push)
                            console.log('[MotorCare Cloud] Local data has more records than cloud. Performing bidirectional push.');
                            executeCloudSync(userKey, 'bidirectional_sync_push');
                        }
                    } else if (localCarsCount > 0) {
                        // السحابة لا تحوي سيارات ولكن اللوكال به سيارات -> ارفع للسحابة فوراً
                        console.log('[MotorCare Cloud] Cloud document empty. Pushing local garage to cloud.');
                        executeCloudSync(userKey, 'initial_cloud_push');
                    }

                    // استرجاع أرقام طوارئ الصيانة الشخصية من السحابة
                    if (cloudData && Array.isArray(cloudData.personalEmergencyContacts)) {
                        try {
                            const localRaw = SafeStorage.getItem('motorCare_PersonalEmergencyContacts');
                            let localContacts = [];
                            if (localRaw) localContacts = JSON.parse(localRaw);
                            if (localContacts.length === 0 || force || cloudData.personalEmergencyContacts.length >= localContacts.length) {
                                SafeStorage.setItem('motorCare_PersonalEmergencyContacts', JSON.stringify(cloudData.personalEmergencyContacts));
                                if (typeof MotorCareEmergency !== 'undefined' && MotorCareEmergency.renderPersonalContacts) {
                                    MotorCareEmergency.renderPersonalContacts();
                                }
                            } else if (localContacts.length > cloudData.personalEmergencyContacts.length) {
                                executeCloudSync(userKey, 'emergency_contacts_push');
                            }
                        } catch(e) {}
                    }
                    updateCloudSyncStatusUI('synced');
                    return true;
                } else {
                    // المستند غير موجود أصلاً في السحابة:
                    // إذا كان لدى المستخدم بيانات محلية، نقوم برفعها فوراً إلى السحابة (Bidirectional initial push)
                    if (localCarsCount > 0) {
                        console.log('[MotorCare Cloud] New cloud document for user. Uploading local cars.');
                        executeCloudSync(userKey, 'first_time_cloud_push');
                    }
                    updateCloudSyncStatusUI('synced');
                    return false;
                }
            } catch(err) {
                console.warn('[MotorCare Cloud] Auto-restore fetch note:', err.message);
                updateCloudSyncStatusUI('offline');
                return false;
            }
        }

        function startRealtimeCloudSyncListener() {
            const userKey = getCloudSyncUserKey();
            if (!userKey || !isFirestoreReady || !firestoreDb) return;

            if (firestoreUnsubscribeListener) {
                try { firestoreUnsubscribeListener(); } catch(e) {}
                firestoreUnsubscribeListener = null;
            }

            try {
                firestoreUnsubscribeListener = firestoreDb.collection('motorcare_users').doc(userKey)
                    .onSnapshot((doc) => {
                        if (isSyncingToCloud) return;
                        if (doc && doc.exists && !doc.metadata.hasPendingWrites) {
                            const cloudData = doc.data();
                            if (cloudData && Array.isArray(cloudData.cars) && cloudData.clientTimestamp) {
                                const lastSync = SafeStorage.getItem('motorCare_LastCloudSyncTime');
                                if (!lastSync || new Date(cloudData.clientTimestamp) > new Date(lastSync)) {
                                    appState.cars = cloudData.cars;
                                    if (typeof migrateAndAuditCarsCatalog === 'function') {
                                        migrateAndAuditCarsCatalog(appState.cars);
                                    }
                                    if (typeof cloudData.currentCarIndex === 'number') {
                                        appState.currentCarIndex = cloudData.currentCarIndex;
                                    }
                                    SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                                    SafeStorage.setItem('motorCare_LastCloudSyncTime', cloudData.clientTimestamp);
                                    if (typeof renderDashboard === 'function') renderDashboard();
                                    updateCloudSyncStatusUI('synced');

                                    if (appState.cars && appState.cars.length > 0) {
                                        if (typeof closeAddNewCarModal === 'function') closeAddNewCarModal(true);
                                        const modal = document.getElementById('addNewCarModal');
                                        if (modal) {
                                            modal.classList.add('hidden');
                                            modal.style.display = 'none';
                                        }
                                    }

                                    if (cloudData && Array.isArray(cloudData.personalEmergencyContacts)) {
                                        try {
                                            SafeStorage.setItem('motorCare_PersonalEmergencyContacts', JSON.stringify(cloudData.personalEmergencyContacts));
                                            if (typeof MotorCareEmergency !== 'undefined' && MotorCareEmergency.renderPersonalContacts) {
                                                MotorCareEmergency.renderPersonalContacts();
                                            }
                                        } catch(e) {}
                                    }
                                }
                            }
                        }
                    }, (err) => {
                        console.warn('[MotorCare Cloud] Realtime listener notice:', err.message);
                    });
            } catch(e) {}
        }

        function stopCloudSyncListener() {
            if (firestoreUnsubscribeListener) {
                try { firestoreUnsubscribeListener(); } catch(e) {}
                firestoreUnsubscribeListener = null;
                console.log('[MotorCare Cloud] Realtime sync listener stopped.');
            }
        }

        function initUserCloudSync() {
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            // تفعيل المزامنة السحابية افتراضياً للمستخدمين المسجلين ما لم يقم المستخدم بتعطيلها صراحة
            if (profile && profile.isRegistered && profile.provider !== 'guest') {
                if (SafeStorage.getItem('motorCare_CloudSyncEnabled') === null) {
                    SafeStorage.setItem('motorCare_CloudSyncEnabled', 'true');
                }
            }

            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                if (profile && profile.isRegistered && SafeStorage.getItem('motorCare_CloudSyncEnabled') === 'false') {
                    updateCloudSyncStatusUI('offline');
                } else {
                    updateCloudSyncStatusUI('guest');
                }
                const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                if (!hasCar && typeof checkFirstTimeOnboarding === 'function') {
                    setTimeout(() => checkFirstTimeOnboarding(), 400);
                }
                return Promise.resolve(false);
            }
            if (initFirestoreDatabase()) {
                return autoRestoreFromCloud().then((restored) => {
                    startRealtimeCloudSyncListener();
                    const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                    // لا يتم إطلاق نافذة الإعداد الأولي إلا إذا لم يتم العثور على أي سيارة محلياً ولا في السحابة بعد انتهاء المزامنة
                    if (!hasCar) {
                        if (typeof checkFirstTimeOnboarding === 'function') {
                            try { checkFirstTimeOnboarding(); } catch(e) {}
                        }
                    } else {
                        if (typeof closeAddNewCarModal === 'function') closeAddNewCarModal(true);
                        const modal = document.getElementById('addNewCarModal');
                        if (modal) {
                            modal.classList.add('hidden');
                            modal.style.display = 'none';
                        }
                    }
                    return restored;
                }).catch((err) => {
                    const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                    if (!hasCar && typeof checkFirstTimeOnboarding === 'function') {
                        try { checkFirstTimeOnboarding(); } catch(e) {}
                    }
                    return false;
                });
            } else {
                updateCloudSyncStatusUI('offline');
                const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                if (!hasCar && typeof checkFirstTimeOnboarding === 'function') {
                    setTimeout(() => checkFirstTimeOnboarding(), 600);
                }
                return Promise.resolve(false);
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof firestoreDb !== 'undefined') window.firestoreDb = firestoreDb; } catch (e) {}
try { if (typeof isFirestoreReady !== 'undefined') window.isFirestoreReady = isFirestoreReady; } catch (e) {}
try { if (typeof initFirestoreDatabase !== 'undefined') window.initFirestoreDatabase = initFirestoreDatabase; } catch (e) {}
try { if (typeof initUserCloudSync !== 'undefined') window.initUserCloudSync = initUserCloudSync; } catch (e) {}
try { if (typeof stopCloudSyncListener !== 'undefined') window.stopCloudSyncListener = stopCloudSyncListener; } catch (e) {}
try { if (typeof syncUserDataToCloud !== 'undefined') window.syncUserDataToCloud = syncUserDataToCloud; } catch (e) {}
try { if (typeof updateCloudSyncStatusUI !== 'undefined') window.updateCloudSyncStatusUI = updateCloudSyncStatusUI; } catch (e) {}
try { if (typeof toggleCloudSyncSetting !== 'undefined') window.toggleCloudSyncSetting = toggleCloudSyncSetting; } catch (e) {}
try { if (typeof autoRestoreFromCloud !== 'undefined') window.autoRestoreFromCloud = autoRestoreFromCloud; } catch (e) {}
try { if (typeof getCloudSyncUserKey !== 'undefined') window.getCloudSyncUserKey = getCloudSyncUserKey; } catch (e) {}
try { if (typeof startLiveVerificationWatcher !== 'undefined') window.startLiveVerificationWatcher = startLiveVerificationWatcher; } catch (e) {}
try { if (typeof stopLiveVerificationWatcher !== 'undefined') window.stopLiveVerificationWatcher = stopLiveVerificationWatcher; } catch (e) {}
