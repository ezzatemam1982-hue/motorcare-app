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
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            // زائر (Guest): البيانات محلية 100% بدون أي مزامنة سحابية حفاظاً على الخصوصية والسرعة
            if (!profile || profile.provider === 'guest' || !profile.isRegistered) {
                return null;
            }

            const email = (profile.email || '').trim().toLowerCase();
            if (email && email.includes('@')) {
                // مفتاح فريد آمن ومقبول كمستند في Firestore
                return email.replace(/[^a-z0-9_]/g, '_');
            }
            if (profile.uid) return String(profile.uid).replace(/[^a-z0-9_]/g, '_');
            if (profile.id) return String(profile.id).replace(/[^a-z0-9_]/g, '_');

            return null;
        }

        function updateCloudSyncStatusUI(status, label) {
            const badge = document.getElementById('cloudSyncStatusBadge');
            const accountModalBadge = document.getElementById('accountModalCloudSyncBadge');
            if (!badge && !accountModalBadge) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let text = label || '';
            let cls = '';

            if (status === 'synced') {
                cls = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
                text = text || (isEn ? '<i class="fa-solid fa-cloud-check"></i> Synced' : '<i class="fa-solid fa-cloud-check"></i> متزامن سحابياً');
            } else if (status === 'syncing') {
                cls = 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400 animate-pulse';
                text = text || (isEn ? '<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Syncing...' : '<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> جاري المزامنة...');
            } else if (status === 'offline') {
                cls = 'bg-slate-500/15 border-slate-500/40 text-slate-500 dark:text-slate-400';
                text = text || (isEn ? '<i class="fa-solid fa-floppy-disk"></i> Local (Offline)' : '<i class="fa-solid fa-floppy-disk"></i> حفظ محلي (أوفلاين)');
            } else if (status === 'guest') {
                cls = 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400';
                text = text || (isEn ? '<i class="fa-solid fa-compass"></i> Guest (Local Only)' : '<i class="fa-solid fa-compass"></i> زائر (محلي فقط)');
            }

            [badge, accountModalBadge].forEach(el => {
                if (el) {
                    el.className = `inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${cls}`;
                    el.innerHTML = text;
                    el.classList.remove('hidden');
                }
            });
        }

        function syncUserDataToCloud(reason = 'update') {
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                updateCloudSyncStatusUI('guest');
                return;
            }

            // منع الضغط السريع وتكرار العمليات عبر Debounce
            if (pendingSyncDebounceTimer) clearTimeout(pendingSyncDebounceTimer);

            pendingSyncDebounceTimer = setTimeout(() => {
                executeCloudSync(userKey, reason);
            }, 600);
        }

        function executeCloudSync(userKey, reason) {
            if (!isFirestoreReady && !initFirestoreDatabase()) {
                updateCloudSyncStatusUI('offline');
                return;
            }

            updateCloudSyncStatusUI('syncing');
            isSyncingToCloud = true;

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
                })
                .catch((err) => {
                    isSyncingToCloud = false;
                    updateCloudSyncStatusUI('offline');
                    console.warn('[MotorCare Cloud] Sync note (saved in local IndexedDB):', err.message);
                });
        }

        function autoRestoreFromCloud(force = false) {
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                updateCloudSyncStatusUI('guest');
                return Promise.resolve(false);
            }

            if (!isFirestoreReady && !initFirestoreDatabase()) {
                updateCloudSyncStatusUI('offline');
                return Promise.resolve(false);
            }

            updateCloudSyncStatusUI('syncing');

            return firestoreDb.collection('motorcare_users').doc(userKey).get()
                .then((doc) => {
                    if (doc && doc.exists) {
                        const cloudData = doc.data();
                        if (cloudData && Array.isArray(cloudData.cars)) {
                            const localCarsCount = (appState.cars && Array.isArray(appState.cars)) ? appState.cars.length : 0;
                            const cloudCarsCount = cloudData.cars.length;

                            // اعتماد السحابة إذا كان الكراج المحلي فارغاً أو عند طلب التحديث المباشر
                            if (localCarsCount === 0 || force || cloudCarsCount >= localCarsCount) {
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
                            }
                        }

                        // استرجاع أرقام طوارئ الصيانة الشخصية من السحابة فوراً
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
                                }
                            } catch(e) {}
                        }
                        return true;
                    }
                    updateCloudSyncStatusUI('synced');
                    return false;
                })
                .catch((err) => {
                    console.warn('[MotorCare Cloud] Auto-restore fetch note:', err.message);
                    updateCloudSyncStatusUI('offline');
                    return false;
                });
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
            const userKey = getCloudSyncUserKey();
            if (!userKey) {
                updateCloudSyncStatusUI('guest');
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
try { if (typeof startLiveVerificationWatcher !== 'undefined') window.startLiveVerificationWatcher = startLiveVerificationWatcher; } catch (e) {}
try { if (typeof stopLiveVerificationWatcher !== 'undefined') window.stopLiveVerificationWatcher = stopLiveVerificationWatcher; } catch (e) {}
