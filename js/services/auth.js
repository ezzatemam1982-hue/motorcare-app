        // ==========================================
        // [USER SESSION ISOLATION]
        // كشف تغيير المستخدم وعزل بيانات الجلسة بالكامل لضمان الخصوصية والنظافة
        // ==========================================
        function detectAndIsolateUserSession(newUserEmail, newProvider, isNewRegistration = false) {
            try {
                // إيقاف أي مستمع سحابي نشط فوراً
                if (typeof stopCloudSyncListener === 'function') {
                    stopCloudSyncListener();
                }

                const prevRaw = SafeStorage.getItem('motorCare_UserProfile');
                let prevProfile = null;
                if (prevRaw) {
                    try { prevProfile = JSON.parse(prevRaw); } catch(e) {}
                }

                const prevEmail = (prevProfile && prevProfile.email || '').trim().toLowerCase();
                const newEmail = (newUserEmail || '').trim().toLowerCase();

                // 1. إذا كان إنشاء حساب جديد بالكامل (Registration Mode):
                // يجب تصفير الحالة والبيانات حتماً وبشكل قطعي 100%
                if (isNewRegistration) {
                    console.log('[MotorCare Auth] New user registration. Resetting all garage state to clean slate for:', newEmail);
                    
                    // حفظ حساب المستخدم السابق إن وُجد في مساحته الخاصة
                    if (prevEmail && typeof appState !== 'undefined' && appState.cars && appState.cars.length > 0) {
                        try {
                            const uKey = prevEmail.replace(/[^a-z0-9_]/g, '_');
                            SafeStorage.setJSON('motorCare_AppState_' + uKey, appState);
                        } catch(e) {}
                    }

                    // تصفير حالة التطبيق في الذاكرة
                    if (typeof appState !== 'undefined') {
                        appState.cars = [];
                        appState.currentCarIndex = 0;
                    }

                    // مسح المفاتيح النشطة
                    SafeStorage.removeItem('motorCare_AppState_v140');
                    SafeStorage.removeItem('motorCare_PersonalEmergencyContacts');
                    SafeStorage.removeItem('motorCare_LastCloudSyncTime');
                    SafeStorage.removeItem('motorCare_OdometerVerificationLogs');
                    SafeStorage.removeItem('motorCare_InspectionDraft');
                    SafeStorage.removeItem('motorCare_DriverExpenses');
                    SafeStorage.removeItem('motorCare_CustomReportSettings');
                    SafeStorage.setItem('motorCare_CurrentActiveUser', newEmail || 'new_account');

                    if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.removeItem) {
                        try { MotorCareIndexedDB.removeItem('motorCare_AppState_v140'); } catch(e) {}
                    }
                    return;
                }

                // 2. إذا كان نفس المستخدم المسجل حالياً، لا داعي لتصفير البيانات
                if (prevEmail && newEmail && prevEmail === newEmail) {
                    SafeStorage.setItem('motorCare_CurrentActiveUser', newEmail);
                    return;
                }

                // 3. إذا كان زائر يدخل كزائر مجدداً بدون بريد
                if (!prevEmail && !newEmail && prevProfile && prevProfile.provider === 'guest' && newProvider === 'guest') {
                    return;
                }

                // 4. مستخدم مختلف تماماً (User Switch):
                console.log('[MotorCare Auth] User switch detected. Isolating session data.');
                console.log(`  Previous: "${prevEmail}" (${prevProfile ? prevProfile.provider : 'none'})`);
                console.log(`  New:      "${newEmail}" (${newProvider})`);

                // حفظ بيانات المستخدم السابق في مساحته الخاصة
                if (prevEmail && typeof appState !== 'undefined' && appState.cars && appState.cars.length > 0) {
                    try {
                        const uKey = prevEmail.replace(/[^a-z0-9_]/g, '_');
                        SafeStorage.setJSON('motorCare_AppState_' + uKey, appState);
                    } catch(e) {}
                }

                // تصفير الذاكرة أولاً
                if (typeof appState !== 'undefined') {
                    appState.cars = [];
                    appState.currentCarIndex = 0;
                }

                // محاولة استرجاع البيانات المحفوظة محلياً لهذا المستخدم الجديد إذا كان قد استخدم التطبيق مسبقاً
                let restoredLocal = false;
                if (newEmail) {
                    const newKey = newEmail.replace(/[^a-z0-9_]/g, '_');
                    const cached = SafeStorage.getJSON('motorCare_AppState_' + newKey, null);
                    if (cached && cached.cars && Array.isArray(cached.cars) && cached.cars.length > 0) {
                        const sanitized = (typeof validateAndSanitizeAppState === 'function')
                            ? validateAndSanitizeAppState(cached)
                            : cached;
                        if (typeof appState !== 'undefined') {
                            appState.cars = sanitized.cars || [];
                            appState.currentCarIndex = sanitized.currentCarIndex || 0;
                            if (sanitized.currency) appState.currency = sanitized.currency;
                            if (typeof window !== 'undefined') window.appState = appState;
                        }
                        SafeStorage.setJSON('motorCare_AppState_v140', appState);
                        restoredLocal = true;
                    }
                }

                if (!restoredLocal) {
                    SafeStorage.removeItem('motorCare_AppState_v140');
                    SafeStorage.removeItem('motorCare_PersonalEmergencyContacts');
                    SafeStorage.removeItem('motorCare_LastCloudSyncTime');
                    if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.removeItem) {
                        try { MotorCareIndexedDB.removeItem('motorCare_AppState_v140'); } catch(e) {}
                    }
                }

                SafeStorage.setItem('motorCare_CurrentActiveUser', newEmail || newProvider || 'guest');
            } catch(e) {
                console.warn('[MotorCare Auth] Session isolation warning:', e);
            }
        }

        function enterMainApp() {
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
            } catch(err) {
                console.error('enterMainApp error:', err);
                const l = document.getElementById('landingScreen');
                const m = document.getElementById('mainAppContainer');
                if (l) l.style.display = 'none';
                if (m) m.style.display = 'flex';
            }
        }


        // ==========================================
        // [REAL EMAIL OTP VERIFICATION SYSTEM]
        // ==========================================
        let isSendingOtpEmail = false;
        let otpCooldownTimer = null;
        let otpCooldownSeconds = 0;

        function startOtpCooldown(seconds = 60) {
            if (otpCooldownTimer) clearInterval(otpCooldownTimer);
            otpCooldownSeconds = seconds;
            const resendBtn = document.getElementById('resendOtpBtn');
            const resendText = document.getElementById('resendOtpBtnText');
            const resendIcon = document.getElementById('resendOtpBtnIcon');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (resendBtn) {
                resendBtn.disabled = true;
                resendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            }

            const updateBtnUi = () => {
                if (resendIcon) resendIcon.className = 'fa-solid fa-rotate-right ml-1';
                if (resendText) {
                    resendText.innerText = isEn 
                        ? `Resend in (${otpCooldownSeconds}s)` 
                        : `إعادة الإرسال بعد (${otpCooldownSeconds}ث)`;
                }
            };

            updateBtnUi();

            otpCooldownTimer = setInterval(() => {
                otpCooldownSeconds--;
                if (otpCooldownSeconds <= 0) {
                    clearInterval(otpCooldownTimer);
                    otpCooldownTimer = null;
                    otpCooldownSeconds = 0;
                    if (resendBtn) {
                        resendBtn.disabled = false;
                        resendBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
                    }
                    if (resendIcon) resendIcon.className = 'fa-solid fa-rotate-right ml-1';
                    if (resendText) resendText.innerText = isEn ? 'Resend Code' : 'إعادة إرسال الرمز';
                } else {
                    updateBtnUi();
                }
            }, 1000);
        }

        function generateVerificationOtp(email, forceNew = false) {
            // التحقق من وجود رمز فعال غير منتهي الصلاحية لنفس البريد لتجنب تكرار وتوليد أكثر من رمز في نفس الجلسة
            if (!forceNew) {
                try {
                    const raw = SafeStorage.getItem('motorCare_ActiveEmailOtp');
                    if (raw) {
                        const existing = JSON.parse(raw);
                        if (existing && existing.email && existing.email.toLowerCase() === email.toLowerCase() && Date.now() < existing.expiresAt) {
                            return existing;
                        }
                    }
                } catch(e) {}
            }

            // كود تفعيل حقيقي وآمن مكون من 6 أرقام
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            // صلاحية الرمز 15 دقيقة
            const expiresAt = Date.now() + (15 * 60 * 1000);
            const token = btoa(encodeURIComponent(`${email}:${otp}:${expiresAt}`));
            const data = { email, otp, expiresAt, token };
            SafeStorage.setItem('motorCare_ActiveEmailOtp', JSON.stringify(data));
            return data;
        }

        let liveVerificationWatcherTimer = null;
        let liveFirestoreUnsubscribe = null;

        function markAccountAsVerifiedInDB(email) {
            if (!email) return;
            const norm = email.trim().toLowerCase();
            const nowIso = new Date().toISOString();

            let existingPass = '';
            let existingName = norm.split('@')[0];
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const p = JSON.parse(rawProf);
                    if (p && p.email && p.email.toLowerCase() === norm) {
                        if (p.password) existingPass = p.password;
                        if (p.name) existingName = p.name;
                    }
                }
            } catch (e) { }

            if (typeof saveAccountToLocalDB === 'function') {
                saveAccountToLocalDB({
                    name: existingName,
                    email: norm,
                    password: existingPass,
                    isVerified: true,
                    emailVerified: true,
                    verified: true,
                    verifiedAt: nowIso
                });
            } else {
                try {
                    let accounts = [];
                    const raw = SafeStorage.getItem('motorCare_AccountsDB');
                    if (raw) accounts = JSON.parse(raw);
                    if (!Array.isArray(accounts)) accounts = [];
                    const accIdx = accounts.findIndex(a => a && a.email && a.email.toLowerCase() === norm);
                    if (accIdx !== -1) {
                        accounts[accIdx].isVerified = true;
                        accounts[accIdx].emailVerified = true;
                        accounts[accIdx].verified = true;
                        accounts[accIdx].verifiedAt = nowIso;
                        if (!accounts[accIdx].password && existingPass) accounts[accIdx].password = existingPass;
                    } else {
                        accounts.push({
                            id: 'acc_' + Date.now(),
                            name: existingName,
                            email: norm,
                            password: existingPass,
                            provider: 'email',
                            isVerified: true,
                            emailVerified: true,
                            verified: true,
                            verifiedAt: nowIso,
                            registeredAt: nowIso
                        });
                    }
                    SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                } catch(e) {}
            }

            try {
                let subscribers = [];
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) subscribers = JSON.parse(rawSubs);
                if (!Array.isArray(subscribers)) subscribers = [];
                const subIdx = subscribers.findIndex(s => s && s.email && s.email.toLowerCase() === norm);
                if (subIdx !== -1) {
                    subscribers[subIdx].isVerified = true;
                    subscribers[subIdx].verified = true;
                    subscribers[subIdx].emailVerified = true;
                    subscribers[subIdx].verifiedAt = nowIso;
                } else {
                    subscribers.push({
                        id: 'sub_' + Date.now(),
                        name: existingName,
                        email: norm,
                        provider: 'email',
                        date: nowIso,
                        lang: (typeof appState !== 'undefined' && appState.lang) || 'ar',
                        isVerified: true,
                        verified: true,
                        emailVerified: true,
                        verifiedAt: nowIso
                    });
                }
                SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subscribers));
            } catch (e) { }

            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const userKey = norm.replace(/[^a-z0-9_]/g, '_');
                    firestoreDb.collection('motorcare_users').doc(userKey).set({
                        isVerified: true,
                        emailVerified: true,
                        verified: true,
                        verifiedAt: nowIso
                    }, { merge: true }).catch(() => { });
                } catch (e) { }
            }
        }

        function checkUrlEmailVerification() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const action = urlParams.get('action');
                const isVerifiedParam = urlParams.get('verified');
                const email = urlParams.get('email');
                const token = urlParams.get('token');

                if ((action === 'verify' || isVerifiedParam === 'true') && email) {
                    const normEmail = email.trim().toLowerCase();
                    let isValid = true;

                    if (token) {
                        try {
                            const decoded = decodeURIComponent(atob(token));
                            const parts = decoded.split(':');
                            if (parts.length >= 3) {
                                const tokenEmail = parts[0];
                                const expiresAt = Number(parts[2]);
                                if (tokenEmail.toLowerCase() !== normEmail) isValid = false;
                                if (Date.now() > expiresAt) isValid = false;
                            }
                        } catch(e) {
                            console.warn('[MotorCare Auth] Token decode note:', e);
                        }
                    }

                    if (isValid) {
                        markAccountAsVerifiedInDB(normEmail);

                        let profile = {};
                        try {
                            const raw = SafeStorage.getItem('motorCare_UserProfile');
                            if (raw) profile = JSON.parse(raw);
                        } catch(e) {}

                        if (profile.email && profile.email.toLowerCase() === normEmail) {
                            profile.isVerified = true;
                            profile.emailVerified = true;
                            profile.verified = true;
                            profile.verifiedViaUrl = true;
                            profile.verifiedAt = new Date().toISOString();
                            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                        }

                        // تجهيز حقل البريد والتحويل التلقائي لتبويب تسجيل الدخول
                        const authEmailInp = document.getElementById('authEmail');
                        if (authEmailInp) authEmailInp.value = normEmail;
                        if (typeof switchAuthTab === 'function') switchAuthTab('login');

                        if (typeof window.history !== 'undefined' && window.history.replaceState) {
                            const cleanUrl = window.location.pathname;
                            window.history.replaceState({}, document.title, cleanUrl);
                        }

                        const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                        if (typeof showNotification === 'function') {
                            showNotification(
                                isEn ? 'Email verified successfully! Your account is active. 🛡️✨' : 'تم تفعيل وتوثيق بريدك الإلكتروني بنجاح! حسابك معتمد وموثق الآن. 🛡️✨',
                                'success', 6000
                            );
                        }
                    }
                }
            } catch(err) {
                console.warn('[MotorCare Auth] checkUrlEmailVerification error:', err);
            }
        }

        function notifyCrossTabVerification(email) {
            if (!email) return;
            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('motorcare_auth_broadcast');
                    bc.postMessage({ type: 'ACCOUNT_VERIFIED', email: email, timestamp: Date.now() });
                    bc.close();
                }
                SafeStorage.setItem('motorCare_CrossTabSync', JSON.stringify({ action: 'VERIFY', email: email, t: Date.now() }));
            } catch(e) {}
        }

        let _lastVerificationNoticeTime = 0;
        function applyRemoteVerification(email) {
            // إيقاف المراقبة الحية فوراً لمنع أي استدعاء متزامن إضافي
            stopLiveVerificationWatcher();

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            const now = Date.now();
            const alreadyVerified = (profile.isVerified || profile.verified || profile.emailVerified);
            // إذا كان الحساب موثقاً بالفعل والإشعار قد تم إظهاره خلال آخر 30 ثانية، نخرج فوراً لمنع التكرار
            if (alreadyVerified && (now - _lastVerificationNoticeTime < 30000)) {
                return;
            }

            profile.isVerified = true;
            profile.verified = true;
            profile.emailVerified = true;
            profile.verifiedViaUrl = true;
            if (email && (!profile.email || profile.email.toLowerCase() === email.toLowerCase())) {
                profile.email = email;
            }
            profile.verifiedAt = profile.verifiedAt || new Date().toISOString();
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            SafeStorage.setItem('motorCare_LoggedIn', 'true');
            SafeStorage.removeItem('motorCare_ActiveEmailOtp');

            // تحديث السجلات
            markAccountAsVerifiedInDB(profile.email || email);

            // إغلاق نافذة إدخال رمز التحقق إن كانت معروضة
            const verifyModal = document.getElementById('emailVerificationModal');
            if (verifyModal) verifyModal.classList.add('hidden');

            // ملاحظة هامة: لا نقوم باستدعاء notifyCrossTabVerification هنا إطلاقاً لتفادي حلقة البث المتبادل بين النوافذ

            // تحديث واجهة المستخدم والشارات
            if (typeof updateAccountCenterUI === 'function') updateAccountCenterUI();
            if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
            if (typeof renderDashboard === 'function') renderDashboard();

            // مزامنة فورية للسحابة لتثبيت التوثيق في Firestore
            if (typeof syncUserDataToCloud === 'function') syncUserDataToCloud('remote_verified');

            // إظهار إشعار واحد فقط ومحدد تماماً
            if (now - _lastVerificationNoticeTime >= 30000) {
                _lastVerificationNoticeTime = now;
                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                showNotification(isEn ? 'Account successfully verified! 🛡️' : 'تم تأكيد وتوثيق حسابك بنجاح! 🛡️✨', 'success', 5000);
            }
        }

        let crossTabAuthSyncInitialized = false;
        function initCrossTabAuthSync() {
            if (crossTabAuthSyncInitialized) return;
            crossTabAuthSyncInitialized = true;

            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('motorcare_auth_broadcast');
                    bc.onmessage = (event) => {
                        if (event && event.data && event.data.type === 'ACCOUNT_VERIFIED' && event.data.email) {
                            let cur = {};
                            try {
                                const raw = SafeStorage.getItem('motorCare_UserProfile');
                                if (raw) cur = JSON.parse(raw);
                            } catch(e) {}
                            if (cur.email && cur.email.toLowerCase() === event.data.email.toLowerCase()) {
                                applyRemoteVerification(event.data.email);
                            }
                        }
                    };
                }

                window.addEventListener('storage', (e) => {
                    if (e.key === 'motorCare_CrossTabSync' && e.newValue) {
                        try {
                            const data = JSON.parse(e.newValue);
                            if (data && data.action === 'VERIFY' && data.email) {
                                let cur = {};
                                try {
                                    const raw = SafeStorage.getItem('motorCare_UserProfile');
                                    if (raw) cur = JSON.parse(raw);
                                } catch(err) {}
                                if (cur.email && cur.email.toLowerCase() === data.email.toLowerCase()) {
                                    applyRemoteVerification(data.email);
                                }
                            }
                        } catch(err) {}
                    }
                });
            } catch(e) {}
        }

        function startLiveVerificationWatcher(email) {
            stopLiveVerificationWatcher();
            if (!email) return;

            const normEmail = email.trim().toLowerCase();
            const userKey = normEmail.replace(/[^a-z0-9_]/g, '_');

            // 1. مراقبة حية لحظية عبر Firestore onSnapshot لو فتح العميل الرابط من الموبايل أو أي متصفح
            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    liveFirestoreUnsubscribe = firestoreDb.collection('motorcare_users').doc(userKey)
                        .onSnapshot((docSnapshot) => {
                            if (docSnapshot && docSnapshot.exists) {
                                const d = docSnapshot.data();
                                if (d && (d.isVerified || d.emailVerified || d.verified)) {
                                    stopLiveVerificationWatcher();
                                    applyRemoteVerification(normEmail);
                                }
                            }
                        }, (err) => {
                            console.warn('[MotorCare] Live Firestore watcher snapshot note:', err.message);
                        });
                } catch(err) {}
            }

            // 2. فحص دوري متوازي (Polling) كل ثانيتين للتأكد التام
            liveVerificationWatcherTimer = setInterval(() => {
                // فحص محلي
                let profile = {};
                try {
                    const raw = SafeStorage.getItem('motorCare_UserProfile');
                    if (raw) profile = JSON.parse(raw);
                } catch(e) {}

                if (profile && (profile.isVerified || profile.emailVerified || profile.verified)) {
                    stopLiveVerificationWatcher();
                    applyRemoteVerification(normEmail);
                    return;
                }

                // فحص Firestore get()
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    firestoreDb.collection('motorcare_users').doc(userKey).get().then(doc => {
                        if (doc && doc.exists) {
                            const d = doc.data();
                            if (d && (d.isVerified || d.emailVerified || d.verified)) {
                                stopLiveVerificationWatcher();
                                applyRemoteVerification(normEmail);
                            }
                        }
                    }).catch(() => {});
                }
            }, 2000);
        }

        function stopLiveVerificationWatcher() {
            if (liveVerificationWatcherTimer) {
                clearInterval(liveVerificationWatcherTimer);
                liveVerificationWatcherTimer = null;
            }
            if (typeof liveFirestoreUnsubscribe === 'function') {
                try { liveFirestoreUnsubscribe(); } catch(e) {}
                liveFirestoreUnsubscribe = null;
            }
        }

        window.openEmailVerificationModal = function(forceSend = false) { return openVerificationCodeModal(forceSend); };
        function openVerificationCodeModal(forceSend = false) {
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}
            
            const pinInput = document.getElementById('emailVerifyPinInput');
            if (pinInput) pinInput.value = '';

            const textEl = document.getElementById('verifyModalEmailText');
            if (textEl && profile.email) {
                textEl.innerHTML = `تم إرسال رمز تفعيل حقيقي (OTP) إلى بريدك (<span class="font-bold text-sky-600 dark:text-sky-400">${profile.email}</span>). أدخل الرمز المكون من 6 أرقام للتحقق:`;
            }

            // إرسال رمز التحقق فقط إذا طلب صراحة forceSend = true ولم يكن هناك رمز فعال تم توليده
            if (forceSend && profile.email && profile.email.includes('@')) {
                let hasActiveOtp = false;
                try {
                    const rawOtp = SafeStorage.getItem('motorCare_ActiveEmailOtp');
                    if (rawOtp) {
                        const o = JSON.parse(rawOtp);
                        if (o && o.email && o.email.toLowerCase() === profile.email.toLowerCase() && Date.now() < o.expiresAt) {
                            hasActiveOtp = true;
                        }
                    }
                } catch(e) {}
                if (!hasActiveOtp) {
                    sendRealVerificationOtpEmail(false);
                }
            }

            // تشغيل المراقبة الحية للتوثيق التلقائي فور النقر على الرابط من أي جهاز
            if (profile.email) {
                startLiveVerificationWatcher(profile.email);
            }

            document.getElementById('emailVerificationModal')?.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('emailVerifyPinInput')?.focus();
            }, 150);
        }

        function closeEmailVerificationModal() {
            stopLiveVerificationWatcher();
            document.getElementById('emailVerificationModal')?.classList.add('hidden');
        }

        /* ==========================================================================
           [OFFICIAL CLOUD WEBHOOK] رابط الويب هوك السحابي الرسمي المعتمد للتطبيق
           ========================================================================== */
        const MOTORCARE_OFFICIAL_WEBHOOK = 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec';
        function getAppWebhookUrl() {
            return MOTORCARE_OFFICIAL_WEBHOOK;
        }

        function sendRealVerificationOtpEmail(isResend = false, customEmail = null, customName = null) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            // 1. منع الإرسال المتكرر السريع (Debounce & Throttle Lock)
            if (isSendingOtpEmail) {
                console.warn('[MotorCare] OTP sending already in progress. Ignoring duplicate trigger.');
                return;
            }

            // 2. التحقق من فترة الانتظار (Cooldown) عند طلب إعادة الإرسال
            if (isResend && otpCooldownSeconds > 0) {
                showNotification(isEn 
                    ? `Please wait ${otpCooldownSeconds}s before requesting a new code.` 
                    : `يرجى الانتظار ${otpCooldownSeconds} ثانية قبل إعادة إرسال الرمز.`, 'warning');
                return;
            }

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            const email = (customEmail || profile.email || '').trim().toLowerCase();
            const name = customName || profile.name || (isEn ? 'Member' : 'عضو MotorCare');

            if (!email || !email.includes('@')) {
                showNotification(isEn ? 'No valid email found to send verification code to.' : 'لا يوجد بريد إلكتروني مسجل لإرسال رمز التفعيل إليه.', 'error');
                return;
            }

            // قفل عملية الإرسال وإظهار مؤشر التحميل فوراً على زر الإرسال
            isSendingOtpEmail = true;
            const resendBtn = document.getElementById('resendOtpBtn');
            const resendText = document.getElementById('resendOtpBtnText');
            const resendIcon = document.getElementById('resendOtpBtnIcon');
            if (resendBtn) {
                resendBtn.disabled = true;
                resendBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            }
            if (resendIcon) {
                resendIcon.className = 'fa-solid fa-spinner fa-spin ml-1';
            }
            if (resendText) {
                resendText.innerText = isEn ? 'Sending...' : 'جاري الإرسال...';
            }

            // توليد رمز OTP واحد فقط أو استرجاع الرمز النشط الحالي بالجلسة
            const { otp, expiresAt, token } = generateVerificationOtp(email, isResend);
            
            // رابط التفعيل المباشر الذكي: استخدام النطاق الفعلي النظيف للتطبيق أو المخطط المحلي لـ Capacitor
            let appBaseUrl = (window.MOTORCARE_ENV && window.MOTORCARE_ENV.APP_URL) || '';
            if (!appBaseUrl && typeof window !== 'undefined' && window.location && window.location.origin && window.location.protocol.startsWith('http')) {
                const path = window.location.pathname.replace(/index\.html$/, '');
                appBaseUrl = window.location.origin + path;
            }
            if (!appBaseUrl) appBaseUrl = 'https://localhost/';
            if (!appBaseUrl.endsWith('/')) appBaseUrl += '/';
            const verifyUrl = `${appBaseUrl}?verified=true&email=${encodeURIComponent(email)}&action=verify&token=${encodeURIComponent(token)}`;
            
            const textEl = document.getElementById('verifyModalEmailText');
            if (textEl) {
                textEl.innerHTML = isEn
                    ? `A real verification code (OTP) was sent to your email (<span class="font-bold text-sky-600 dark:text-sky-400">${email}</span>). Code expires in 15 minutes.`
                    : `تم إرسال رمز تفعيل حقيقي (OTP) إلى بريدك الإلكتروني (<span class="font-bold text-sky-600 dark:text-sky-400">${email}</span>). صلاحية الرمز 15 دقيقة.`;
            }

            const expiryEl = document.getElementById('otpExpiryNotice');
            if (expiryEl) {
                expiryEl.innerText = isEn ? 'Code valid for: 15 minutes' : 'صلاحية الرمز: 15 دقيقة';
            }

            const plainBody = `==========================================
[ MOTORCARE ] | رمز التحقق وتفعيل الحساب
==========================================

أهلاً بك يا ${name}!

يسعدنا انضمامك إلى تطبيق MotorCare لإدارة ومتابعة صيانة سيارتك بكل دقة واحترافية.
لتأكيد وتوثيق بريدك الإلكتروني، يمكنك استخدام أحد الخيارين:

1. إدخال رمز التحقق السريع في التطبيق:
   [  ${otp}  ]
(صلاحية الرمز: 15 دقيقة فقط)

2. أو التفعيل المباشر بنقرة واحدة عبر الرابط التالي:
${verifyUrl}

بمجرد الضغط على الرابط أعلاه، سيتم تأكيد وتوثيق حسابك فوراً وتلقائياً.

نتمنى لك تجربة مميزة وقيادة آمنة دائماً.
فريق عمل تطبيق MotorCare
==========================================`;

            const htmlBody = `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); color: #1e293b; text-align: right;">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,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" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>
    <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff !important;letter-spacing:0.5px;">MotorCare</h1>
    <p style="margin:8px 0 0 0;font-size:15px;font-weight:700;color:#ffffff !important;text-shadow:0 1px 3px rgba(0,0,0,0.5);">رمز تفعيل وتوثيق حسابك الجديد</p>
  </div>
  <div style="padding: 28px 24px;">
    <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">أهلاً بك يا ${name}!</h2>
    <p style="font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px;">
      يسعدنا انضمامك إلى مجتمع <strong>MotorCare</strong>. لتأكيد ملكية بريدك وتوثيق حسابك، اختر الطريقة الأنسب لك:
    </p>
    
    <div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 16px; padding: 20px; text-align: center; margin: 22px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">رمز التحقق السريع (OTP)</div>
      <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0284c7; font-family: monospace;">${otp}</div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">الصلاحية: 15 دقيقة فقط</div>
    </div>

    <div style="text-align: center; margin: 26px 0 10px 0;">
      <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">أو يمكنك التفعيل المباشر بنقرة واحدة عبر الرابط المعتمد:</p>
      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #0284c7; background: linear-gradient(135deg, #0284c7 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none !important; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(2,132,199,0.3); border: 1px solid #0284c7;">
        تأكيد وتوثيق الحساب بنقرة واحدة &check;
      </a>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 10px; line-height: 1.6;">
        (يمكنك أيضاً كتابة رمز التحقق المكون من 6 أرقام أعلاه في التطبيق مباشرة)
      </p>
    </div>
  </div>
  <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
    نتمنى لك دائماً رحلات ممتعة وقيادة آمنة<br>
    <strong>فريق عمل MotorCare</strong> • <span style="direction: ltr; display: inline-block;">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            // إرسال البريد الحقيقي عبر خوادم Webhook المعتمدة للتطبيق
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';

            const finishSend = () => {
                isSendingOtpEmail = false;
                startOtpCooldown(60);
            };

            const webhookUrl = getAppWebhookUrl();
            console.log(`[MotorCare] Verification OTP for ${email}: ${otp}`);

            const otpPayload = {
                action: 'SEND_OTP_EMAIL',
                name: name,
                email: email,
                otp: otp,
                verifyUrl: verifyUrl,
                sender: 'motorcare.auto@gmail.com',
                expiresMinutes: 15,
                timestamp: new Date().toISOString(),
                subject: `[MotorCare] رمز تفعيل وتوثيق حسابك: ${otp}`,
                body: plainBody,
                htmlBody: htmlBody
            };

            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        keepalive: true,
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(otpPayload)
                    }).catch(err => console.warn('OTP webhook send note:', err));
                } catch(err) {}
            }

            finishSend();

            showNotification(isEn 
                ? `Verification code (OTP) sent to ${email} 📩 Check inbox & spam.` 
                : `تم إرسال رمز التحقق ورابط التفعيل إلى بريدك ${email} 📩 يرجى التحقق من الوارد والـ Spam`, 'info', 6000);

            if (false) {
                finishSend();
                console.log(`[MotorCare Dev Mode] Active Verification OTP for ${email}: ${otp}`);
                showNotification(isEn
                    ? `[Preview Mode] Webhook not connected yet. Your instant OTP code is: ${otp}`
                    : `[وضع المعاينة] لم يتم ربط الويب هوك بعد. رمز التفعيل الخاص بك هو: [ ${otp} ] 🔑`, 'warning', 10000);
                
                const testHint = document.getElementById('otpDevHint');
                if (testHint) {
                    testHint.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 font-bold text-[11px]"><i class="fa-solid fa-flask"></i> رمز المعاينة السريعة: <span class="font-mono text-sm tracking-wider text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-amber-500/40">${otp}</span></span>`;
                    testHint.classList.remove('hidden');
                }
            }
        }

        function sendAccountActivatedSuccessEmail(name, email) {
            if (!email || !email.includes('@')) return;

            // ====== حارس مانع التكرار: ترسل مرة واحدة فقط لكل بريد ======
            const normEmail = email.trim().toLowerCase();
            try {
                let sentList = [];
                const rawSent = SafeStorage.getItem('motorCare_WelcomeEmailsSent');
                if (rawSent) sentList = JSON.parse(rawSent);
                if (sentList.includes(normEmail)) {
                    console.log('[MotorCare Auth] Welcome email already sent to', normEmail, '- skipping duplicate.');
                    return;
                }
                // تسجيل الإرسال قبل الطلب الفعلي لمنع أي تكرار
                sentList.push(normEmail);
                SafeStorage.setItem('motorCare_WelcomeEmailsSent', JSON.stringify(sentList));

                // تحديث علامة welcomeEmailSent في ملف الحساب
                try {
                    const rawProfile = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProfile) {
                        const prof = JSON.parse(rawProfile);
                        if (prof && prof.email && prof.email.toLowerCase() === normEmail) {
                            prof.welcomeEmailSent = true;
                            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(prof));
                        }
                    }
                } catch(ep) {}

                // تحديث علامة welcomeEmailSent في قاعدة الحسابات
                try {
                    const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                    if (rawAccs) {
                        const accs = JSON.parse(rawAccs);
                        const idx = accs.findIndex(a => a.email && a.email.toLowerCase() === normEmail);
                        if (idx !== -1) {
                            accs[idx].welcomeEmailSent = true;
                            SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accs));
                        }
                    }
                } catch(ea) {}
            } catch(eg) {}
            // ================================================================

            const webhookUrl = getAppWebhookUrl();
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';
            const clientName = name || 'عضو MotorCare';

            const plainBody = `==========================================
[ MOTORCARE ] | تهانينا! تم تفعيل وتوثيق حسابك بنجاح
==========================================

أهلاً بك يا ${clientName}!

تهانينا! تم تفعيل وتوثيق حسابك بنجاح وأصبح كراجك الرقمي جاهزاً بالكامل.

يسعدنا وجودك معنا في MotorCare - تطبيقك الذكي لمتابعة صيانة ومصاريف سيارتك بأعلى دقة واحترافية.

أهم الميزات المتوفرة لك الآن:

1. جدول الصيانة الذكي:
   تنبيهات استباقية لمواعيد تغيير الزيت، الفلاتر، وتيل الفرامل للحفاظ على محرك سيارتك.

2. حاسبة استهلاك ومصاريف الوقود:
   متابعة دقيقة لمعدل استهلاك البنزين لكل كيلومتر مع إحصائيات مالية واضحة لتقليل تكاليفك.

3. تقارير النفقات الشاملة:
   رسوم بيانية تحليلية توضح لك أين تُصرف أموالك مع إمكانية تصدير تقارير إكسيل بضغطة زر.

4. حفظ وتصدير آمن للبيانات:
   سجلاتك مشفرة ومحفوظة وتتنقل معك على أي جهاز دون أن تفقد أي بيان.

ابدأ الآن:
توجه إلى كراجك وأضف سيارتك الأولى وسجل قراءة العداد الحالية لتبدأ المتابعة الذكية فوراً.

نتمنى لك دائماً رحلات ممتعة وقيادة آمنة على الطريق.
فريق عمل تطبيق MotorCare
==========================================`;

            const htmlBody = `<div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.06); color: #1e293b; text-align: right;">
  <div style="background: linear-gradient(135deg, #070a13 0%, #0f172a 50%, #0284c7 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
    <div style="display:inline-block;margin-bottom:12px;background:#ffffff;padding:8px 14px;border-radius:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);"><img src="data:image/jpeg;base64,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" alt="MotorCare" style="max-width:130px;height:auto;display:block;border:0;" /></div>
    <h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff !important; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">مرحباً بك في MotorCare</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; color: #38bdf8 !important; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.4);">تم تفعيل وتوثيق حسابك بنجاح ✓</p>
  </div>
  
  <div style="padding: 32px 28px;">
    <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 0;">أهلاً بك يا ${clientName}!</h2>
    <p style="font-size: 14px; line-height: 1.8; color: #475569; margin-bottom: 24px;">
      يسعدنا انضمامك إلى مجتمع ملاك السيارات الأذكى. أصبح كراجك الرقمي جاهزاً الآن لتنظيم وإدارة كل ما يخص صيانة ومصاريف سيارتك بكل سهولة وراحة بال:
    </p>

    <!-- بطاقات الميزات -->
    <div style="margin-bottom: 24px;">
      <div style="margin-bottom: 14px; padding: 14px 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
        <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 4px;">
          <span style="display:inline-block;width:8px;height:8px;background:#0284c7;border-radius:50%;margin-left:6px;"></span> جدول الصيانة الذكي
        </strong>
        <span style="font-size: 12px; color: #64748b; line-height: 1.6;">تنبيهات دورية لمواعيد تغيير الزيت، الفلاتر، وتيل الفرامل قبل فوات الأوان.</span>
      </div>

      <div style="margin-bottom: 14px; padding: 14px 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
        <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 4px;">
          <span style="display:inline-block;width:8px;height:8px;background:#f59e0b;border-radius:50%;margin-left:6px;"></span> حاسبة استهلاك ومصاريف الوقود
        </strong>
        <span style="font-size: 12px; color: #64748b; line-height: 1.6;">تتبع دقيق لمعدل استهلاك البنزين وتكلفة الكيلومتر لتوفير نفقاتك.</span>
      </div>

      <div style="margin-bottom: 14px; padding: 14px 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
        <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 4px;">
          <span style="display:inline-block;width:8px;height:8px;background:#10b981;border-radius:50%;margin-left:6px;"></span> تقارير النفقات الشاملة
        </strong>
        <span style="font-size: 12px; color: #64748b; line-height: 1.6;">رسوم بيانية وإحصائيات تكشف بدقة أين تذهب مصاريفك مع تصدير تقارير إكسيل فورية.</span>
      </div>

      <div style="padding: 14px 16px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
        <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 4px;">
          <span style="display:inline-block;width:8px;height:8px;background:#6366f1;border-radius:50%;margin-left:6px;"></span> حفظ وتصدير آمن للبيانات
        </strong>
        <span style="font-size: 12px; color: #64748b; line-height: 1.6;">سجلاتك مشفرة ومحفوظة وتتنقل معك على أي جهاز دون أن تفقد أي بيان.</span>
      </div>
    </div>
  </div>

  <div style="background: #f1f5f9; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.8;">
    نتمنى لك دائماً قيادة آمنة وتجربة استثنائية مع سيارتك<br>
    <strong>فريق عمل MotorCare</strong> • <span style="direction: ltr; display: inline-block;">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            const welcomePayload = {
                action: 'SEND_WELCOME_VERIFICATION_EMAIL',
                name: clientName,
                email: email,
                sender: 'motorcare.auto@gmail.com',
                timestamp: new Date().toISOString(),
                subject: '[MotorCare] تهانينا! تم تفعيل وتوثيق حسابك بنجاح',
                body: plainBody,
                htmlBody: htmlBody
            };

            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(welcomePayload)
                    }).catch(() => {});
                } catch(e) {}
            }
        }

        function submitEmailVerificationCode() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const pinInput = document.getElementById('emailVerifyPinInput');
            const pin = pinInput ? pinInput.value.trim() : '';

            if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
                showNotification(isEn ? 'Please enter the 6-digit OTP verification code!' : 'يرجى إدخال رمز التحقق المكون من 6 أرقام بشكل صحيح!', 'error');
                pinInput?.focus();
                return;
            }

            let storedOtp = null;
            try {
                const rawOtp = SafeStorage.getItem('motorCare_ActiveEmailOtp');
                if (rawOtp) storedOtp = JSON.parse(rawOtp);
            } catch(e) {}

            if (!storedOtp || !storedOtp.otp) {
                showNotification(isEn ? 'No active verification code found. Please click "Resend Code".' : 'لا يوجد رمز تفعيل نشط. يرجى الضغط على "إعادة إرسال الرمز".', 'error');
                return;
            }

            if (Date.now() > storedOtp.expiresAt) {
                showNotification(isEn ? 'Verification code expired (15 minutes limit). Please request a new code.' : 'انتهت صلاحية رمز التحقق (صلاحيته 15 دقيقة). يرجى طلب رمز جديد.', 'error');
                return;
            }

            if (pin !== storedOtp.otp.toString().trim()) {
                showNotification(isEn ? 'Incorrect verification code. Please check the code sent to your inbox.' : 'رمز التحقق غير صحيح! يرجى التأكد من الرمز المرسل إلى بريدك الإلكتروني.', 'error');
                pinInput?.focus();
                return;
            }

            // التحقق نجح بنسبة 100% - إيقاف أي مراقبة حية فوراً
            stopLiveVerificationWatcher();
            _lastVerificationNoticeTime = Date.now();
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.emailVerified = true;
            profile.isVerified = true;
            profile.verified = true;
            profile.verifiedViaOtp = true;
            profile.verifiedAt = new Date().toISOString();
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            SafeStorage.setItem('motorCare_LoggedIn', 'true');
            SafeStorage.removeItem('motorCare_ActiveEmailOtp');

            // تحديث حالة التحقق في سجل المشتركين
            try {
                let subscribers = [];
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) subscribers = JSON.parse(rawSubs);
                const subIdx = subscribers.findIndex(s => s.email && s.email.toLowerCase() === (profile.email || '').toLowerCase());
                if (subIdx !== -1) {
                    subscribers[subIdx].isVerified = true;
                    subscribers[subIdx].verified = true;
                    subscribers[subIdx].emailVerified = true;
                    subscribers[subIdx].verifiedAt = profile.verifiedAt;
                    SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subscribers));
                }
            } catch(e) {}

            // تحديث قاعدة بيانات الحسابات وبث التوثيق عبر النوافذ والسحابة
            markAccountAsVerifiedInDB(profile.email);
            notifyCrossTabVerification(profile.email);

            if (typeof firestoreDb !== 'undefined' && firestoreDb && profile.email) {
                try {
                    const userKey = profile.email.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    firestoreDb.collection('motorcare_users').doc(userKey).set({
                        isVerified: true,
                        emailVerified: true,
                        verified: true,
                        verifiedAt: profile.verifiedAt
                    }, { merge: true }).catch(() => {});
                } catch(e) {}
            }

            closeEmailVerificationModal();

            // إرسال رسالة التهنئة بتفعيل الحساب الآن فقط بعد إتمام التحقق من الرمز
            sendAccountActivatedSuccessEmail(profile.name, profile.email);

            // تفعيل المزامنة السحابية الذكية ورفع حالة التوثيق إلى Firestore
            initUserCloudSync();
            syncUserDataToCloud('account_verified');

            if (typeof openAccountCenter === 'function') openAccountCenter();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();

            showNotification(isEn ? 'Your account has been successfully verified! 🛡️' : 'تم توثيق حسابك بنجاح 🛡️✨', 'success', 5000);
        }



        function switchAuthTab(mode) {
            currentAuthMode = mode;
            window.currentAuthMode = mode;
            const existingHint = document.getElementById('authEmailExistingHint');
            if (existingHint) existingHint.classList.add('hidden');
            const isReg = (mode === 'register');
            const loginBtn = document.getElementById('loginTabBtn');
            const regBtn = document.getElementById('registerTabBtn');
            const submitText = document.getElementById('authSubmitBtnText');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (loginBtn && regBtn) {
                if (isReg) {
                    regBtn.className = "flex-1 py-1.5 text-center rounded-lg bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-2xs transition-all cursor-pointer font-black";
                    loginBtn.className = "flex-1 py-1.5 text-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer font-bold";
                } else {
                    loginBtn.className = "flex-1 py-1.5 text-center rounded-lg bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-2xs transition-all cursor-pointer font-black";
                    regBtn.className = "flex-1 py-1.5 text-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer font-bold";
                }
            }
            if (submitText) {
                submitText.innerText = isReg
                    ? (isEn ? 'Create Account & Start' : 'إنشاء حساب والبدء')
                    : (isEn ? 'Instant Sign In' : 'دخول فوري');
            }
            const nameContainer = document.getElementById('nameFieldContainer');
            if (nameContainer) nameContainer.classList.toggle('hidden', !isReg);

            const confirmContainer = document.getElementById('authConfirmPasswordContainer');
            if (confirmContainer) {
                confirmContainer.classList.toggle('hidden', !isReg);
                const confirmInput = document.getElementById('authConfirmPassword');
                if (confirmInput && !isReg) confirmInput.value = '';
            }

            if (isReg && typeof checkAuthEmailExistingLive === 'function') {
                checkAuthEmailExistingLive();
            }
        }
        window.switchAuthTab = switchAuthTab;

        function togglePasswordVisibility(inputId, iconId) {
            const input = document.getElementById(inputId);
            const icon = document.getElementById(iconId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            } else {
                input.type = 'password';
                if (icon) {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        }

        let _emailLiveDebounceTimer = null;
        async function checkAuthEmailExistingLive() {
            const emailInp = document.getElementById('authEmail');
            const hint = document.getElementById('authEmailExistingHint');
            if (!emailInp) return;

            const isReg = (window.currentAuthMode === 'register' || currentAuthMode === 'register');
            if (!isReg) {
                if (hint) hint.classList.add('hidden');
                return;
            }

            const val = (emailInp.value || '').trim().toLowerCase();
            if (!val || !val.includes('@') || !val.includes('.')) {
                if (hint) hint.classList.add('hidden');
                return;
            }

            if (typeof findAccountByEmail === 'function') {
                const acc = await findAccountByEmail(val);
                if (hint) {
                    if (acc) hint.classList.remove('hidden');
                    else hint.classList.add('hidden');
                }
            }
        }

        function initAuthEmailLiveWatcher() {
            const emailInp = document.getElementById('authEmail');
            const hint = document.getElementById('authEmailExistingHint');
            if (!emailInp) return;

            const trigger = () => {
                if (_emailLiveDebounceTimer) clearTimeout(_emailLiveDebounceTimer);
                _emailLiveDebounceTimer = setTimeout(() => {
                    checkAuthEmailExistingLive();
                }, 350);
            };

            emailInp.addEventListener('blur', trigger);
            emailInp.addEventListener('change', trigger);
            emailInp.addEventListener('input', () => {
                if (hint && !hint.classList.contains('hidden')) {
                    hint.classList.add('hidden');
                }
                trigger();
            });
        }

        // ==========================================================================
        // [MOTORCARE AUTH REPOSITORY] محرك الحسابات الموحد والشامل
        // ==========================================================================

        async function findAccountByEmail(email) {
            if (!email) return null;
            const norm = email.trim().toLowerCase();
            const userKey = norm.replace(/[^a-z0-9_]/g, '_');

            // 1. فحص قاعدة الحسابات المحلية motorCare_AccountsDB
            try {
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) {
                    let accounts = [];
                    try { accounts = JSON.parse(raw); } catch(e) {}
                    if (Array.isArray(accounts)) {
                        const found = accounts.find(a => a && a.email && a.email.trim().toLowerCase() === norm);
                        if (found) {
                            if (!found.password) {
                                try {
                                    const profRaw = SafeStorage.getItem('motorCare_UserProfile');
                                    if (profRaw) {
                                        const p = JSON.parse(profRaw);
                                        if (p && p.email && p.email.trim().toLowerCase() === norm && p.password) {
                                            found.password = p.password;
                                        }
                                    }
                                } catch (e) { }
                            }
                            return found;
                        }
                    }
                }
            } catch (e) { }

            // 2. استرجاع فوري من IndexedDB mirror في حال تلف أو فراغ التخزين المحلي
            if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.getItem) {
                try {
                    const dbAccs = await MotorCareIndexedDB.getItem('motorCare_AccountsDB');
                    if (dbAccs && Array.isArray(dbAccs)) {
                        const found = dbAccs.find(a => a && a.email && a.email.trim().toLowerCase() === norm);
                        if (found) {
                            saveAccountToLocalDB(found);
                            return found;
                        }
                    }
                } catch(e) {}
            }

            // 3. فحص ملف الحساب النشط motorCare_UserProfile
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const prof = JSON.parse(rawProf);
                    if (prof && prof.email && prof.email.trim().toLowerCase() === norm && (prof.isRegistered || prof.password)) {
                        const accObj = {
                            id: prof.id || ('acc_' + Date.now()),
                            name: prof.name || norm.split('@')[0],
                            email: norm,
                            password: prof.password || '',
                            provider: prof.provider || 'email',
                            isVerified: !!(prof.isVerified || prof.emailVerified || prof.verified),
                            emailVerified: !!(prof.emailVerified || prof.isVerified || prof.verified),
                            isRegistered: true,
                            registeredAt: prof.registeredAt || new Date().toISOString()
                        };
                        saveAccountToLocalDB(accObj);
                        return accObj;
                    }
                }
            } catch (e) { }

            // 4. فحص سجل المشتركين المعتمدين motorCare_RegisteredSubscribers
            try {
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) {
                    let subs = [];
                    try { subs = JSON.parse(rawSubs); } catch(e) {}
                    if (Array.isArray(subs)) {
                        const s = subs.find(sub => sub && sub.email && sub.email.trim().toLowerCase() === norm);
                        if (s) {
                            const accObj = {
                                id: s.id || ('acc_' + Date.now()),
                                name: s.name || norm.split('@')[0],
                                email: norm,
                                password: s.password || '',
                                provider: s.provider || 'email',
                                isVerified: !!(s.isVerified || s.emailVerified || s.verified),
                                emailVerified: !!(s.emailVerified || s.isVerified || s.verified),
                                isRegistered: true,
                                registeredAt: s.registeredAt || s.date || new Date().toISOString()
                            };
                            saveAccountToLocalDB(accObj);
                            return accObj;
                        }
                    }
                }
            } catch (e) { }

            // 5. فحص سجل إرسال إيميلات الترحيب motorCare_WelcomeEmailsSent
            try {
                const rawSent = SafeStorage.getItem('motorCare_WelcomeEmailsSent');
                if (rawSent) {
                    let sentList = [];
                    try { sentList = JSON.parse(rawSent); } catch(e) {}
                    if (Array.isArray(sentList) && sentList.includes(norm)) {
                        const accObj = {
                            id: 'acc_' + Date.now(),
                            name: norm.split('@')[0],
                            email: norm,
                            password: '',
                            provider: 'email',
                            isVerified: true,
                            emailVerified: true,
                            isRegistered: true,
                            registeredAt: new Date().toISOString()
                        };
                        saveAccountToLocalDB(accObj);
                        return accObj;
                    }
                }
            } catch (e) { }

            // 6. فحص سحابي سريع وغير معطل للواجهة في Firestore (مهلة 2 ثانية فقط)
            try {
                let db = (typeof firestoreDb !== 'undefined' && firestoreDb) ? firestoreDb : null;
                if (!db && typeof initFirestoreDatabase === 'function') {
                    initFirestoreDatabase();
                    db = (typeof firestoreDb !== 'undefined' && firestoreDb) ? firestoreDb : null;
                }
                if (db) {
                    const snap = await Promise.race([
                        db.collection('motorcare_users').doc(userKey).get(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
                    ]);
                    if (snap && (typeof snap.exists === 'function' ? snap.exists() : snap.exists)) {
                        const d = snap.data() || {};
                        const accObj = {
                            id: d.id || ('acc_' + Date.now()),
                            name: d.name || norm.split('@')[0],
                            email: norm,
                            password: d.password || '',
                            provider: d.provider || 'email',
                            isVerified: !!(d.isVerified || d.emailVerified || d.verified),
                            emailVerified: !!(d.emailVerified || d.isVerified || d.verified),
                            isRegistered: true,
                            registeredAt: d.registeredAt || new Date().toISOString()
                        };
                        saveAccountToLocalDB(accObj);
                        return accObj;
                    }
                }
            } catch (e) {
                // هادئ تماماً عند قيود الصلاحيات أو وضع الأوفلاين
            }

            return null;
        }

        function saveAccountToLocalDB(accObj) {
            if (!accObj || !accObj.email) return;
            const norm = accObj.email.trim().toLowerCase();

            // 1. تحديث motorCare_AccountsDB
            try {
                let accounts = [];
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) {
                    try { accounts = JSON.parse(raw); } catch(e) {}
                }
                if (!Array.isArray(accounts)) accounts = [];
                const idx = accounts.findIndex(a => a && a.email && a.email.trim().toLowerCase() === norm);
                if (idx !== -1) {
                    const existingPass = accounts[idx].password;
                    accounts[idx] = { ...accounts[idx], ...accObj, email: norm };
                    if (!accObj.password && existingPass) {
                        accounts[idx].password = existingPass;
                    }
                } else {
                    accounts.push({
                        id: accObj.id || ('acc_' + Date.now()),
                        name: accObj.name || norm.split('@')[0],
                        email: norm,
                        password: accObj.password || '',
                        provider: accObj.provider || 'email',
                        isRegistered: true,
                        isVerified: !!(accObj.isVerified || accObj.emailVerified || accObj.verified),
                        emailVerified: !!(accObj.emailVerified || accObj.isVerified || accObj.verified),
                        registeredAt: accObj.registeredAt || new Date().toISOString()
                    });
                }
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.setItem) {
                    MotorCareIndexedDB.setItem('motorCare_AccountsDB', accounts).catch(() => {});
                }
            } catch (e) {
                console.warn('[MotorCare Auth] saveAccountToLocalDB error:', e);
            }

            // 2. تحديث سجل المشتركين المعتمدين motorCare_RegisteredSubscribers
            try {
                let subs = [];
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) {
                    try { subs = JSON.parse(rawSubs); } catch(e) {}
                }
                if (!Array.isArray(subs)) subs = [];
                const subIdx = subs.findIndex(s => s && s.email && s.email.trim().toLowerCase() === norm);
                if (subIdx !== -1) {
                    const existingPass = subs[subIdx].password;
                    subs[subIdx] = { ...subs[subIdx], ...accObj, email: norm };
                    if (!accObj.password && existingPass) {
                        subs[subIdx].password = existingPass;
                    }
                } else {
                    subs.push({ ...accObj, email: norm });
                }
                SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subs));
                if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.setItem) {
                    MotorCareIndexedDB.setItem('motorCare_RegisteredSubscribers', subs).catch(() => {});
                }
            } catch (e) { }

            // 3. تحديث motorCare_UserProfile إذا كان نفس الحساب النشط
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const prof = JSON.parse(rawProf);
                    if (prof && prof.email && prof.email.trim().toLowerCase() === norm) {
                        const updatedProf = { ...prof, ...accObj, email: norm };
                        if (!accObj.password && prof.password) updatedProf.password = prof.password;
                        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(updatedProf));
                    }
                }
            } catch(e) {}
        }

        function openGoogleAuthModal(defaultEmail = '', defaultName = '') {
            const modal = document.getElementById('googleAuthModal');
            if (!modal) return;
            const nameInput = document.getElementById('googleModalNameInput');
            const emailInput = document.getElementById('googleModalEmailInput');
            if (nameInput) nameInput.value = defaultName || '';
            if (emailInput) {
                if (defaultEmail) {
                    emailInput.value = defaultEmail;
                } else {
                    try {
                        const raw = SafeStorage.getItem('motorCare_UserProfile');
                        if (raw) {
                            const prof = JSON.parse(raw);
                            if (prof && prof.email) emailInput.value = prof.email;
                            if (prof && prof.name && nameInput && !nameInput.value) nameInput.value = prof.name;
                        }
                    } catch(e) {}
                }
            }
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        function closeGoogleAuthModal() {
            const modal = document.getElementById('googleAuthModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function handleGoogleAuthModalSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const emailInput = document.getElementById('googleModalEmailInput');
            const nameInput = document.getElementById('googleModalNameInput');
            const email = emailInput ? emailInput.value.trim() : '';
            let name = nameInput ? nameInput.value.trim() : '';
            if (!email || !email.includes('@')) {
                if (typeof showNotification === 'function') {
                    showNotification('يرجى إدخال بريد Google إلكتروني صحيح ⚠️', 'warning');
                }
                return;
            }
            if (!name) {
                name = email.split('@')[0];
            }
            closeGoogleAuthModal();
            const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
            loginAsGoogleProfile(name, email, avatar);
        }

        function initGoogleIdentityServices() {
            try {
                const clientId = (window.MOTORCARE_ENV && window.MOTORCARE_ENV.GOOGLE_CLIENT_ID) || GOOGLE_OAUTH_CLIENT_ID;
                if (!clientId) return;

                if (window.google && window.google.accounts) {
                    if (window.google.accounts.id) {
                        window.google.accounts.id.initialize({
                            client_id: clientId,
                            callback: handleGoogleCredentialResponse,
                            auto_select: false,
                            cancel_on_tap_outside: true
                        });
                    }

                    if (window.google.accounts.oauth2) {
                        initGoogleOAuthClient();
                    }
                }
            } catch(e) {
                console.warn('[MotorCare Auth] Google Identity Services notice:', e);
            }
        }

        function initGoogleOAuthClient() {
            try {
                const clientId = (window.MOTORCARE_ENV && window.MOTORCARE_ENV.GOOGLE_CLIENT_ID) || GOOGLE_OAUTH_CLIENT_ID;
                if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: clientId,
                        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid',
                        prompt: 'select_account',
                        callback: async (tokenResponse) => {
                            if (tokenResponse && tokenResponse.access_token) {
                                await fetchGoogleUserProfile(tokenResponse.access_token);
                            }
                        },
                        error_callback: (err) => {
                            console.warn('[MotorCare Auth] GIS TokenClient error:', err);
                            openGoogleAuthModal();
                        }
                    });
                }
            } catch(e) {
                console.warn('[MotorCare Auth] initGoogleOAuthClient error:', e);
            }
        }

        async function fetchGoogleUserProfile(accessToken) {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!res.ok) throw new Error(`Google API status ${res.status}`);
                const userInfo = await res.json();
                if (userInfo && userInfo.email && userInfo.email.includes('@')) {
                    const realName = userInfo.name || userInfo.given_name || userInfo.email.split('@')[0];
                    const realEmail = userInfo.email.trim();
                    const avatar = userInfo.picture || '';
                    return loginAsGoogleProfile(realName, realEmail, avatar);
                }
            } catch(err) {
                console.warn('[MotorCare Auth] Fetch Google userinfo notice:', err);
            }
            return false;
        }

        function triggerGoogleOAuthWebFlow() {
            const clientId = (window.MOTORCARE_ENV && window.MOTORCARE_ENV.GOOGLE_CLIENT_ID) || GOOGLE_OAUTH_CLIENT_ID;
            let redirectUri = 'https://localhost/';
            if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.protocol.startsWith('http')) {
                redirectUri = window.location.origin + window.location.pathname;
            }
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20profile%20email&prompt=select_account&nonce=${Date.now()}`;
            
            if (window.location.protocol.startsWith('http')) {
                const popup = window.open(authUrl, 'google_oauth_popup', 'width=520,height=640,left=150,top=100');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    window.location.href = authUrl;
                }
            }
        }

        function checkOAuthRedirectResponse() {
            const hash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash.substring(1) : '';
            if (!hash) return;

            // في حال كانت النافذة منبثقة منبثقة من نافذة رئيسية
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.postMessage({ type: 'MOTORCARE_GOOGLE_AUTH', hash: hash }, '*');
                    window.close();
                    return;
                } catch(e) {
                    console.warn('[MotorCare Auth] Opener postMessage notice:', e);
                }
            }

            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const idToken = params.get('id_token');

            if (idToken) {
                try {
                    const base64Url = idToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                    const userData = JSON.parse(jsonPayload);
                    if (userData && (userData.email || userData.name)) {
                        const name = userData.name || userData.given_name || (userData.email ? userData.email.split('@')[0] : 'Google User');
                        loginAsGoogleProfile(name, userData.email, userData.picture || '');
                        try { window.history.replaceState({}, document.title, window.location.pathname + window.location.search); } catch(e) {}
                        return;
                    }
                } catch(e) {
                    console.warn('[MotorCare Auth] ID Token decode notice:', e);
                }
            }

            if (accessToken) {
                fetchGoogleUserProfile(accessToken).then((success) => {
                    if (success) {
                        try { window.history.replaceState({}, document.title, window.location.pathname + window.location.search); } catch(e) {}
                    }
                });
            }
        }

        // الاستماع لأي رد توكن قادم من نافذة منبثقة
        if (typeof window !== 'undefined') {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'MOTORCARE_GOOGLE_AUTH' && event.data.hash) {
                    const params = new URLSearchParams(event.data.hash);
                    const accessToken = params.get('access_token');
                    const idToken = params.get('id_token');

                    if (idToken) {
                        try {
                            const base64Url = idToken.split('.')[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                            const userData = JSON.parse(jsonPayload);
                            if (userData && (userData.email || userData.name)) {
                                const name = userData.name || userData.given_name || (userData.email ? userData.email.split('@')[0] : 'Google User');
                                loginAsGoogleProfile(name, userData.email, userData.picture || '');
                                return;
                            }
                        } catch(e) {}
                    }

                    if (accessToken) {
                        fetchGoogleUserProfile(accessToken);
                    }
                }
            });
        }

        function handleGoogleCredentialResponse(response) {
            try {
                if (response && response.credential) {
                    const base64Url = response.credential.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const payload = JSON.parse(jsonPayload);
                    if (payload && payload.email && payload.email.includes('@')) {
                        loginAsGoogleProfile(payload.name || payload.given_name || payload.email.split('@')[0], payload.email, payload.picture || '');
                        return;
                    }
                }
            } catch(e) {
                console.warn('[MotorCare Auth] Credential decode error:', e);
            }
        }

        async function handleSocialLogin(provider) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (provider === 'google') {
                // 1. بيئة الهواتف الأصلية (Android Studio / Capacitor Native Schemes)
                if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                    try {
                        if (window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) {
                            const user = await window.Capacitor.Plugins.GoogleAuth.signIn();
                            if (user && (user.email || user.name)) {
                                loginAsGoogleProfile(user.name || user.givenName || user.displayName, user.email, user.imageUrl);
                                return;
                            }
                        }
                    } catch(nativeErr) {
                        console.warn('[MotorCare Auth] Capacitor native GoogleAuth notice:', nativeErr);
                    }
                }

                // 2. التحقق مما إذا كان التطبيق يعمل محلياً من ملف (file:///)
                // Google تمنع origin=null قطعياً في بروتوكول file:/// وتعطي Authorization Error
                const isLocalFile = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
                if (isLocalFile) {
                    openGoogleAuthModal();
                    return;
                }

                // 3. بيئة الويب الرسمية (HTTP / HTTPS): تشغيل Google Identity Services
                if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                    if (!googleTokenClient) {
                        initGoogleOAuthClient();
                    }
                    if (googleTokenClient) {
                        try {
                            googleTokenClient.requestAccessToken({ prompt: 'select_account' });
                            return;
                        } catch(e) {
                            console.warn('[MotorCare Auth] GIS requestAccessToken notice:', e);
                        }
                    }
                }

                // 4. مسار Google One Tap كإجراء فوري
                if (window.google && window.google.accounts && window.google.accounts.id) {
                    try {
                        window.google.accounts.id.prompt((notification) => {
                            if (notification && (notification.isNotDisplayed() || notification.isSkippedMoment())) {
                                openGoogleAuthModal();
                            }
                        });
                        return;
                    } catch(e) {
                        console.warn('[MotorCare Auth] GIS prompt notice:', e);
                    }
                }

                // 5. إجراء أمان فوري لضمان عدم تعطل المستخدم نهائياً
                openGoogleAuthModal();
            }
        }
        window.triggerRealSocialLogin = handleSocialLogin;

        function loginAsGoogleProfile(customName, customEmail, customAvatar, customUid) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            // حظر أي حساب وهمي منعاً باتاً
            if (!customEmail || typeof customEmail !== 'string' || !customEmail.includes('@') || 
                customEmail.toLowerCase() === 'user.google@gmail.com' || 
                customEmail.toLowerCase().startsWith('dummy') ||
                customEmail.toLowerCase() === 'user@motorcare.app') {
                console.warn('[MotorCare Auth] Blocked fake Google login:', customEmail);
                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn 
                            ? 'Please select your actual Google account to sign in ⚠️' 
                            : 'يرجى اختيار وتأكيد حساب Google الحقيقي الخاص بك لتسجيل الدخول ⚠️', 
                        'warning'
                    );
                }
                return false;
            }

            const name = (customName && customName.trim()) ? customName.trim() : customEmail.split('@')[0];
            const email = customEmail.trim();
            const avatar = customAvatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(name));

            // عزل الجلسة: مسح بيانات المستخدم السابق إذا تغيّر المستخدم
            detectAndIsolateUserSession(email, 'google');

            // تحديد المعرف الموحد UID لخدمة المزامنة السحابية
            const uniformUid = customUid || 
                (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid) || 
                ('google_' + email.replace(/[^a-z0-9_]/g, '_'));

            let profile = {
                uid: uniformUid,
                firebaseUid: uniformUid,
                name: name,
                email: email,
                provider: 'google',
                avatar: avatar,
                isRegistered: true,
                isVerified: true,
                emailVerified: true,
                verifiedAt: new Date().toISOString()
            };

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            SafeStorage.setItem('motorCare_LoggedIn', 'true');
            SafeStorage.setItem('motorCare_CloudSyncEnabled', 'true');

            enterMainApp();
            if (typeof initUserCloudSync === 'function') {
                initUserCloudSync().then((restored) => {
                    const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                    if (hasCar) {
                        if (typeof closeAddNewCarModal === 'function') closeAddNewCarModal(true);
                        const addModal = document.getElementById('addNewCarModal');
                        if (addModal) {
                            addModal.classList.add('hidden');
                            addModal.style.display = 'none';
                        }
                        if (typeof renderDashboard === 'function') renderDashboard();
                    }
                }).catch(() => {});
            }
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${name}! Signed in via Google ✨` : `أهلاً بك يا ${name}! تم الدخول بنجاح عبر حساب Google ✨`, 'success');
            }
            return true;
        }

        function handleGuestEntry() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let profile = {
                name: isEn ? 'Guest Visitor' : 'زائر كريم',
                email: '',
                provider: 'guest',
                isRegistered: false,
                isVerified: true
            };

            // عزل الجلسة: مسح بيانات المستخدم السابق إذا تغيّر المستخدم
            detectAndIsolateUserSession('', 'guest', false);

            SafeStorage.setItem('motorCare_LoggedIn', 'true');
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));

            enterMainApp();
            if (typeof updateCloudSyncStatusUI === 'function') updateCloudSyncStatusUI('guest');

            setTimeout(() => {
                const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                if (!hasCar && typeof checkFirstTimeOnboarding === 'function') {
                    checkFirstTimeOnboarding();
                }
            }, 500);
        }

                let _isSubmittingAuth = false;
        async function handleAuthSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (_isSubmittingAuth) return;
            _isSubmittingAuth = true;
            setTimeout(() => { _isSubmittingAuth = false; }, 1200);

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const email = (document.getElementById('authEmail')?.value || '').trim().toLowerCase();
            const password = document.getElementById('authPassword')?.value || '';
            const fullName = (document.getElementById('authFullName')?.value || '').trim();

            if (!email || !password) {
                _isSubmittingAuth = false;
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter your email and password, or tap "Guest Explorer" below!' : 'يرجى إدخال البريد وكلمة المرور، أو اضغط "الدخول كزائر" بالأسفل!', 'info');
                }
                document.getElementById('authEmail')?.focus();
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                _isSubmittingAuth = false;
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.', 'error');
                }
                document.getElementById('authEmail')?.focus();
                return;
            }

            if (password.length < 6) {
                _isSubmittingAuth = false;
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Password must be at least 6 characters.' : 'يجب أن تكون كلمة المرور 6 خانات على الأقل لضمان أمان حسابك.', 'error');
                }
                document.getElementById('authPassword')?.focus();
                return;
            }

            const isRegisterMode = (window.currentAuthMode === 'register' || currentAuthMode === 'register');

            if (isRegisterMode) {
                const confirmPassword = (document.getElementById('authConfirmPassword')?.value || '');
                if (password !== confirmPassword) {
                    _isSubmittingAuth = false;
                    if (typeof showNotification === 'function') {
                        showNotification(isEn ? 'Passwords do not match. Please verify your password.' : 'كلمتا المرور غير متطابقتين. يرجى التأكد من تطابق كلمة المرور.', 'error');
                    }
                    document.getElementById('authConfirmPassword')?.focus();
                    return;
                }
            }

            const submitBtnText = document.getElementById('authSubmitBtnText');
            const originalText = submitBtnText ? submitBtnText.innerText : '';
            if (submitBtnText) submitBtnText.innerText = isEn ? 'Verifying...' : 'جاري التحقق...';

            // فحص الحساب في قاعدة البيانات المحلية
            const existingAccount = await findAccountByEmail(email);

            if (submitBtnText) submitBtnText.innerText = originalText;

            if (!isRegisterMode) {
                // ==========================================
                // وضع تسجيل الدخول (Sign In Mode)
                // ==========================================
                let firebaseUser = null;
                let fbAuthError = null;

                // 1. محاولة تسجيل الدخول عبر Firebase Auth أولاً
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    try {
                        const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
                        firebaseUser = userCred.user;
                        console.log('[MotorCare Auth] Firebase Email/Password Sign-In success! UID:', firebaseUser.uid);
                    } catch(authErr) {
                        fbAuthError = authErr;
                        console.warn('[MotorCare Auth] Firebase signIn note:', authErr.code, authErr.message);
                    }
                }

                // التحقق الموحد من كلمة المرور (يدعم تسجيل الدخول عبر Firebase Auth أو كلمة المرور المعتمدة محلياً وسحابياً بعد استعادة OTP)
                const isPasswordValidLocally = existingAccount && existingAccount.password && (existingAccount.password === password);

                if (!firebaseUser && !isPasswordValidLocally) {
                    _isSubmittingAuth = false;
                    // إذا كان الحساب غير مسجل إطلاقاً
                    if (!existingAccount) {
                        if (typeof showNotification === 'function') {
                            showNotification(
                                isEn
                                    ? 'No account found with this email. Please check your email or click "New Account" tab above to register.'
                                    : 'البريد الإلكتروني غير مسجل. يرجى التأكد من كتابة البريد بشكل صحيح أو النقر على تبويب "حساب جديد" بالأعلى لإنشاء حساب.',
                                'error', 6000
                            );
                        }
                        document.getElementById('authEmail')?.focus();
                        return;
                    }

                    // كلمة المرور غير صحيحة
                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn ? 'Incorrect password. Please try again or click "Forgot password?".' : 'كلمة المرور غير صحيحة. يرجى المحاولة مجدداً أو النقر على "نسيت كلمة المرور؟".',
                            'error', 5000
                        );
                    }
                    document.getElementById('authPassword')?.focus();
                    return;
                }

                _isSubmittingAuth = false;

                // تحديد المعرف الموحد UID لربط المزامنة السحابية
                const uniformUid = (firebaseUser && firebaseUser.uid) || existingAccount?.uid || existingAccount?.firebaseUid || ('mc_' + Date.now());

                // عزل الجلسة: مسح بيانات المستخدم السابق إذا تغيّر المستخدم
                detectAndIsolateUserSession(email, 'email', false);

                const profile = {
                    ...(existingAccount || {}),
                    uid: uniformUid,
                    firebaseUid: uniformUid,
                    name: (firebaseUser && firebaseUser.displayName) || existingAccount?.name || fullName || email.split('@')[0],
                    email: email,
                    password: password,
                    provider: 'email',
                    isRegistered: true,
                    lastLoginAt: new Date().toISOString()
                };

                saveAccountToLocalDB(profile);
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');
                SafeStorage.setItem('motorCare_CloudSyncEnabled', 'true');

                enterMainApp();
                if (typeof initUserCloudSync === 'function') {
                    initUserCloudSync().then((restored) => {
                        const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                        if (hasCar) {
                            if (typeof closeAddNewCarModal === 'function') closeAddNewCarModal(true);
                            const addModal = document.getElementById('addNewCarModal');
                            if (addModal) {
                                addModal.classList.add('hidden');
                                addModal.style.display = 'none';
                            }
                            if (typeof renderDashboard === 'function') renderDashboard();
                        }
                    }).catch(() => {});
                }
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? `Welcome back, ${profile.name}! 👋` : `أهلاً بعودتك يا ${profile.name}! 👋`, 'success');
                }

                // إذا كان الحساب غير موثق بعد، فتح نافذة التحقق تلقائياً للمساعدة
                if (!profile.isVerified && !profile.emailVerified) {
                    setTimeout(() => {
                        if (typeof openVerificationCodeModal === 'function') {
                            openVerificationCodeModal(true);
                        }
                    }, 600);
                }

            } else {
                // ==========================================
                // وضع إنشاء حساب جديد (Registration Mode)
                // ==========================================
                if (existingAccount) {
                    _isSubmittingAuth = false;
                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn
                                ? '⚠️ This email is already registered! Switched to "Sign In" tab. Please enter your password.'
                                : '⚠️ هذا البريد الإلكتروني مسجل مسبقاً بالفعل! لا يمكن إنشاء حساب مكرر. تم تحويلك لتبويب "تسجيل الدخول" لإدخال كلمة المرور.',
                            'warning', 7000
                        );
                    }
                    if (typeof switchAuthTab === 'function') switchAuthTab('login');
                    const authEmailInp = document.getElementById('authEmail');
                    if (authEmailInp) authEmailInp.value = email;
                    const pwdInp = document.getElementById('authPassword');
                    if (pwdInp) {
                        pwdInp.value = '';
                        pwdInp.focus();
                    }
                    return;
                }

                let firebaseUser = null;
                // محاولة تسجيل الحساب عبر Firebase Auth
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    try {
                        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
                        firebaseUser = userCred.user;
                        if (fullName && firebaseUser.updateProfile) {
                            await firebaseUser.updateProfile({ displayName: fullName }).catch(() => {});
                        }
                        console.log('[MotorCare Auth] Firebase Email/Password Registration success! UID:', firebaseUser.uid);
                    } catch(authErr) {
                        console.warn('[MotorCare Auth] Firebase createUser note:', authErr.code, authErr.message);
                        if (authErr.code === 'auth/email-already-in-use') {
                            _isSubmittingAuth = false;
                            if (typeof showNotification === 'function') {
                                showNotification(
                                    isEn
                                        ? '⚠️ This email is already registered! Switched to "Sign In" tab.'
                                        : '⚠️ هذا البريد الإلكتروني مسجل مسبقاً! تم تحويلك لتبويب "تسجيل الدخول".',
                                    'warning', 7000
                                );
                            }
                            if (typeof switchAuthTab === 'function') switchAuthTab('login');
                            const authEmailInp = document.getElementById('authEmail');
                            if (authEmailInp) authEmailInp.value = email;
                            const pwdInp = document.getElementById('authPassword');
                            if (pwdInp) { pwdInp.value = ''; pwdInp.focus(); }
                            return;
                        } else if (authErr.code === 'auth/weak-password') {
                            _isSubmittingAuth = false;
                            if (typeof showNotification === 'function') {
                                showNotification(isEn ? 'Password must be at least 6 characters.' : 'يجب أن تكون كلمة المرور 6 خانات على الأقل.', 'error');
                            }
                            return;
                        }
                    }
                }

                // عزل الجلسة: مسح بيانات المستخدم السابق وتصفير الجلسة تماماً لحساب جديد نظيف
                detectAndIsolateUserSession(email, 'email', true);

                const nowIso = new Date().toISOString();
                const uniformUid = (firebaseUser && firebaseUser.uid) || ('mc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7));

                const newAccount = {
                    id: 'acc_' + Date.now(),
                    uid: uniformUid,
                    firebaseUid: uniformUid,
                    name: fullName || email.split('@')[0],
                    email: email,
                    password: password,
                    provider: 'email',
                    isRegistered: true,
                    isVerified: false,
                    emailVerified: false,
                    welcomeEmailSent: false,
                    registeredAt: nowIso
                };

                saveAccountToLocalDB(newAccount);

                if (typeof ensureFirestoreReady === 'function') {
                    await ensureFirestoreReady(1500).catch(() => {});
                }
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    try {
                        firestoreDb.collection('motorcare_users').doc(uniformUid).set({
                            uid: uniformUid,
                            id: newAccount.id,
                            name: newAccount.name,
                            email: email,
                            provider: 'email',
                            isRegistered: true,
                            isVerified: false,
                            emailVerified: false,
                            registeredAt: nowIso
                        }, { merge: true }).catch(() => {});
                    } catch (e) { }
                }

                const profile = { ...newAccount };
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');
                SafeStorage.setItem('motorCare_CloudSyncEnabled', 'true');

                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn
                            ? `Account created! 🎉 Welcome to MotorCare, ${profile.name}!`
                            : `تم إنشاء حسابك بنجاح! 🎉 أهلاً بك في MotorCare يا ${profile.name}!`,
                        'success', 5000
                    );
                }

                enterMainApp();
                if (typeof initUserCloudSync === 'function') initUserCloudSync();

                // إرسال كود التفعيل وفتح نافذة إدخال الرمز
                setTimeout(() => {
                    if (typeof sendRealVerificationOtpEmail === 'function') {
                        sendRealVerificationOtpEmail(false, email, newAccount.name);
                    }
                    if (typeof openVerificationCodeModal === 'function') {
                        openVerificationCodeModal(false);
                    }
                }, 400);
            }
        }

                function openForgotPasswordModal() {
            const modal = document.getElementById('forgotPasswordModal');
            const step1 = document.getElementById('forgotStep1Container');
            const step2 = document.getElementById('forgotStep2Container');
            const emailInput = document.getElementById('forgotEmailInput');
            if (modal) {
                if (step1) step1.classList.remove('hidden');
                if (step2) step2.classList.add('hidden');
                if (emailInput) emailInput.value = '';
                modal.classList.remove('hidden');
            }
        }

        function closeForgotPasswordModal() {
            const modal = document.getElementById('forgotPasswordModal');
            if (modal) modal.classList.add('hidden');
            const emailInput = document.getElementById('forgotEmailInput');
            const otpInput = document.getElementById('forgotResetOtpInput');
            const newPass = document.getElementById('forgotNewPasswordInput');
            const confirmPass = document.getElementById('forgotConfirmPasswordInput');
            if (emailInput) emailInput.value = '';
            if (otpInput) otpInput.value = '';
            if (newPass) newPass.value = '';
            if (confirmPass) confirmPass.value = '';
        }

        function backToForgotStep1() {
            const step1 = document.getElementById('forgotStep1Container');
            const step2 = document.getElementById('forgotStep2Container');
            if (step1) step1.classList.remove('hidden');
            if (step2) step2.classList.add('hidden');
            SafeStorage.removeItem('motorCare_ForgotPasswordOtp');
        }

        let isSendingForgotOtp = false;
        let forgotOtpCooldownSeconds = 0;
        let forgotOtpCooldownTimer = null;

        function startForgotOtpCooldown(seconds = 60) {
            forgotOtpCooldownSeconds = seconds;
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const btn = document.getElementById('forgotResendOtpBtn');
            const text = document.getElementById('forgotResendText');
            const icon = document.getElementById('forgotResendIcon');

            if (btn) btn.classList.add('opacity-50', 'pointer-events-none');
            if (icon) icon.classList.add('fa-spin');

            if (forgotOtpCooldownTimer) clearInterval(forgotOtpCooldownTimer);
            forgotOtpCooldownTimer = setInterval(() => {
                forgotOtpCooldownSeconds--;
                if (text) {
                    text.innerText = isEn 
                        ? `Resend in ${forgotOtpCooldownSeconds}s` 
                        : `إعادة الإرسال (${forgotOtpCooldownSeconds}ث)`;
                }
                if (forgotOtpCooldownSeconds <= 0) {
                    clearInterval(forgotOtpCooldownTimer);
                    forgotOtpCooldownTimer = null;
                    if (btn) btn.classList.remove('opacity-50', 'pointer-events-none');
                    if (icon) icon.classList.remove('fa-spin');
                    if (text) text.innerText = isEn ? 'Resend Code' : 'إعادة إرسال الرمز';
                }
            }, 1000);
        }

        function sendForgotPasswordEmail(email, otp, name) {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';
            const clientName = name || 'عضو MotorCare';

            const plainBody = `==========================================
[ MOTORCARE ] | استعادة كلمة المرور
==========================================

أهلاً بك يا ${clientName}!

رمز التحقق لاستعادة وتعيين كلمة المرور:
   [ ${otp} ]
(صلاحية الرمز: 15 دقيقة فقط)

إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.

فريق عمل MotorCare
==========================================`;

            const htmlBody = `<div dir="rtl" style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 15px 35px rgba(0,0,0,0.08);color:#1e293b;text-align:right">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,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" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>
    <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff !important;letter-spacing:0.5px;">MotorCare</h1>
    <p style="margin:8px 0 0 0;font-size:15px;font-weight:700;color:#ffffff !important;text-shadow:0 1px 3px rgba(0,0,0,0.5);">استعادة وتعيين كلمة المرور</p>
  </div>
  <div style="padding:28px 24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f172a;margin-top:0">أهلاً بك يا ${clientName}!</h2>
    <p style="font-size:13px;line-height:1.7;color:#475569">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك المسجل (${email}). استخدم رمز التحقق السري التالي للمتابعة:</p>
    
    <div style="margin:24px 0;text-align:center">
      <div style="display:inline-block;padding:16px 36px;background:#f0f9ff;border:2px dashed #0284c7;border-radius:18px">
        <span style="display:block;font-size:12px;font-weight:700;color:#0369a1;margin-bottom:6px">رمز التحقق لاستعادة كلمة المرور (OTP)</span>
        <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:900;letter-spacing:10px;color:#0284c7;display:block">${otp}</span>
        <span style="display:block;font-size:11px;color:#64748b;margin-top:6px">الصلاحية: 15 دقيقة فقط</span>
      </div>
    </div>

    <p style="font-size:12px;color:#64748b;line-height:1.6">إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة ولن يتم تغيير أي شيء في حسابك.</p>
  </div>
  <div style="background:#f1f5f9;padding:18px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">
    <strong style="color:#0f172a">فريق عمل MotorCare</strong> • <span style="direction:ltr;display:inline-block">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            const payload = {
                action: 'SEND_OTP_EMAIL',
                subAction: 'PASSWORD_RESET',
                name: clientName,
                email: email,
                otp: otp,
                sender: senderEmail,
                expiresMinutes: 15,
                timestamp: new Date().toISOString(),
                subject: `[MotorCare] رمز استعادة كلمة المرور: ${otp}`,
                body: plainBody,
                htmlBody: htmlBody
            };

            const webhookUrl = getAppWebhookUrl();
            console.log(`[MotorCare] Password Reset OTP for ${email}: ${otp}`);

            // القناة 1: Webhook مع إرسال فوري ونبضة تأكيد ثانية بعد 1200ms لتجاوز وضع الخمول
            if (webhookUrl && webhookUrl.startsWith('http')) {
                const sendFetch = () => {
                    try {
                        fetch(webhookUrl, {
                            method: 'POST',
                            mode: 'no-cors',
                            keepalive: true,
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify(payload)
                        }).catch(e => console.warn('[ForgotPass] webhook fetch note:', e));
                    } catch(err) {}
                };

                sendFetch();
            }

            // القناة 2: EmailJS كقناة متزامنة احتياطية إذا كانت مهيأة
            if (typeof emailjs !== 'undefined' && emailjs) {
                try {
                    const rawEmailConf = SafeStorage.getItem('motorCare_emailjs_config');
                    if (rawEmailConf) {
                        const conf = JSON.parse(rawEmailConf);
                        if (conf.serviceId && conf.templateId) {
                            emailjs.send(conf.serviceId, conf.templateId, {
                                to_email: email,
                                user_name: clientName,
                                subject: `[MotorCare] رمز استعادة كلمة المرور: ${otp}`,
                                message: plainBody,
                                otp_code: otp
                            }).catch(e => console.warn('[ForgotPass EmailJS] note:', e));
                        }
                    }
                } catch(e) {}
            }

            showNotification(isEn
                ? `Password reset code sent to ${email} 📩 Check inbox & spam.`
                : `تم إرسال رمز الاسترداد إلى ${email} 📩 يرجى مراجعة صندوق الوارد والـ Spam`, 'info', 6000);
        }

        function handleResendForgotOtp() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (forgotOtpCooldownSeconds > 0) {
                showNotification(isEn 
                    ? `Please wait ${forgotOtpCooldownSeconds}s before requesting a new code.` 
                    : `يرجى الانتظار ${forgotOtpCooldownSeconds} ثانية قبل إعادة إرسال الرمز.`, 'warning');
                return;
            }

            let stored = null;
            try {
                const raw = SafeStorage.getItem('motorCare_ForgotPasswordOtp');
                if (raw) stored = JSON.parse(raw);
            } catch(e) {}

            const emailInput = document.getElementById('forgotEmailInput');
            const email = stored?.email || (emailInput ? emailInput.value : '').trim().toLowerCase();
            if (!email) {
                showNotification(isEn ? 'No email found. Please go back.' : 'لم يتم العثور على البريد. يرجى الرجوع للخطوة الأولى.', 'error');
                backToForgotStep1();
                return;
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 15 * 60 * 1000;
            SafeStorage.setItem('motorCare_ForgotPasswordOtp', JSON.stringify({ email, otp, expiresAt, name: stored?.name || '' }));

            startForgotOtpCooldown(60);
            sendForgotPasswordEmail(email, otp, stored?.name || '');
        }

        async function handleForgotPasswordStep1(event) {
            if (event && event.preventDefault) event.preventDefault();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (isSendingForgotOtp) return;

            const emailInput = document.getElementById('forgotEmailInput');
            const email = (emailInput ? emailInput.value : '').trim().toLowerCase();

            if (!email || !email.includes('@') || !email.includes('.')) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.', 'error');
                }
                emailInput?.focus();
                return;
            }

            const btn = document.getElementById('forgotStep1SubmitBtn');
            const btnText = document.getElementById('forgotStep1BtnText');
            const btnIcon = document.getElementById('forgotStep1BtnIcon');
            if (btn) btn.disabled = true;
            if (btnText) btnText.innerText = isEn ? 'Checking...' : 'جاري التحقق...';
            if (btnIcon) btnIcon.className = 'fa-solid fa-spinner fa-spin text-xs';

            // فحص اسم الحساب المسجل إن وجد لرسالة التفعيل الشخصية
            let accountUserName = 'عضو MotorCare';
            try {
                let accounts = [];
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) accounts = JSON.parse(rawAccs);
                const matched = Array.isArray(accounts) && accounts.find(a => a && a.email && a.email.toLowerCase() === email);
                if (matched && matched.name) accountUserName = matched.name;
            } catch(e) {}

            try {
                let subs = [];
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) subs = JSON.parse(rawSubs);
                const matched = Array.isArray(subs) && subs.find(s => s && s.email && s.email.toLowerCase() === email);
                if (matched && matched.name) accountUserName = matched.name;
            } catch(e) {}

            // توليد رمز التحقق (OTP) المكون من 6 أرقام
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 15 * 60 * 1000;
            SafeStorage.setItem('motorCare_ForgotPasswordOtp', JSON.stringify({ email, otp, expiresAt, name: accountUserName }));

            if (btnText) btnText.innerText = isEn ? 'Sending...' : 'جاري الإرسال...';
            isSendingForgotOtp = true;

            // إرسال كود التفعيل إلى بريد العميل
            sendForgotPasswordEmail(email, otp, accountUserName);
            startForgotOtpCooldown(60);

            isSendingForgotOtp = false;
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = isEn ? 'Send Recovery Code' : 'إرسال رمز التحقق';
            if (btnIcon) btnIcon.className = 'fa-solid fa-arrow-left rtl:rotate-0 ltr:rotate-180 text-xs';

            // الانتقال للخطوة الثانية
            const step2Desc = document.getElementById('forgotStep2Desc');
            if (step2Desc) {
                step2Desc.innerHTML = isEn
                    ? `A 6-digit OTP was sent to <strong class="text-sky-600">${email}</strong>. Enter it below to set a new password.`
                    : `تم إرسال رمز OTP مكون من 6 أرقام إلى <strong class="text-sky-600">${email}</strong>. أدخله أدناه لتعيين كلمة مرور جديدة.`;
            }
            const step1 = document.getElementById('forgotStep1Container');
            const step2 = document.getElementById('forgotStep2Container');
            if (step1) step1.classList.add('hidden');
            if (step2) step2.classList.remove('hidden');
            const otpInput = document.getElementById('forgotResetOtpInput');
            if (otpInput) otpInput.focus();
        }

        function handleForgotPasswordStep2(event) {
            if (event && event.preventDefault) event.preventDefault();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const otpInput = document.getElementById('forgotResetOtpInput');
            const newPassInput = document.getElementById('forgotNewPasswordInput');
            const confirmPassInput = document.getElementById('forgotConfirmPasswordInput');

            const enteredOtp = (otpInput ? otpInput.value.trim() : '');
            const newPass = (newPassInput ? newPassInput.value : '');
            const confirmPass = (confirmPassInput ? confirmPassInput.value : '');

            // التحقق من رمز OTP
            if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Enter the 6-digit OTP code.' : 'أدخل رمز التحقق المكون من 6 أرقام.', 'error');
                }
                otpInput?.focus();
                return;
            }

            // التحقق من كلمة المرور
            if (!newPass || newPass.length < 4) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Password must be at least 4 characters.' : 'كلمة المرور يجب أن تكون 4 خانات على الأقل.', 'error');
                }
                newPassInput?.focus();
                return;
            }

            if (newPass !== confirmPass) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Passwords do not match.' : 'كلمتا المرور غير متطابقتين.', 'error');
                }
                confirmPassInput?.focus();
                return;
            }

            // التحقق من OTP المخزن
            let storedReset = null;
            try {
                const raw = SafeStorage.getItem('motorCare_ForgotPasswordOtp');
                if (raw) storedReset = JSON.parse(raw);
            } catch (e) { }

            if (!storedReset || !storedReset.otp) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'No reset code found. Please start over.' : 'لم يتم إيجاد رمز الاسترداد. يرجى البدء من جديد.', 'error');
                }
                backToForgotStep1();
                return;
            }

            if (Date.now() > storedReset.expiresAt) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Reset code expired. Request a new one.' : 'انتهت صلاحية رمز الاسترداد. اطلب رمزاً جديداً.', 'error');
                }
                SafeStorage.removeItem('motorCare_ForgotPasswordOtp');
                backToForgotStep1();
                return;
            }

            if (enteredOtp !== storedReset.otp) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Incorrect OTP code. Please try again.' : 'رمز التحقق غير صحيح. حاول مرة أخرى.', 'error');
                }
                otpInput?.focus();
                return;
            }

            // تحديث كلمة المرور في قاعدة الحسابات المحلية والسحابية
            const targetEmail = storedReset.email.toLowerCase().trim();

            // 1. استخراج الحساب المسجل إن وجد
            let existingAccount = null;
            try {
                let accounts = [];
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) accounts = JSON.parse(raw);
                if (Array.isArray(accounts)) {
                    existingAccount = accounts.find(a => a && a.email && a.email.toLowerCase() === targetEmail);
                }
            } catch(e) {}

            const uniformUid = existingAccount?.uid || existingAccount?.firebaseUid || ('mc_' + Date.now());
            const clientName = storedReset.name || existingAccount?.name || targetEmail.split('@')[0];

            const profile = {
                ...(existingAccount || {}),
                id: existingAccount?.id || ('acc_' + Date.now()),
                uid: uniformUid,
                firebaseUid: uniformUid,
                name: clientName,
                email: targetEmail,
                password: newPass,
                provider: 'email',
                isRegistered: true,
                isVerified: true,
                emailVerified: true,
                lastLoginAt: new Date().toISOString()
            };

            // 2. تحديث الحساب محلياً في motorCare_AccountsDB و motorCare_RegisteredSubscribers
            saveAccountToLocalDB(profile);

            // 3. تحديث كلمة المرور في Firestore
            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const userKey = targetEmail.replace(/[^a-z0-9_]/g, '_');
                    firestoreDb.collection('motorcare_users').doc(userKey).set({
                        name: clientName,
                        email: targetEmail,
                        password: newPass,
                        isRegistered: true,
                        isVerified: true,
                        emailVerified: true,
                        passwordUpdatedAt: new Date().toISOString()
                    }, { merge: true }).catch(() => { });
                } catch (e) { }
            }

            // 4. عزل الجلسة وضبط الجلسة النشطة
            detectAndIsolateUserSession(targetEmail, 'email', false);
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            SafeStorage.setItem('motorCare_LoggedIn', 'true');
            SafeStorage.setItem('motorCare_CloudSyncEnabled', 'true');
            SafeStorage.removeItem('motorCare_ForgotPasswordOtp');

            // 5. إغلاق النافذة وتعبئة حقول الدخول كإجراء وقائي
            closeForgotPasswordModal();
            const authEmail = document.getElementById('authEmail');
            const authPassword = document.getElementById('authPassword');
            if (authEmail) authEmail.value = targetEmail;
            if (authPassword) authPassword.value = newPass;

            // 6. الدخول التلقائي المباشر للواجهة الرئيسية للتطبيق وتشغيل المزامنة
            enterMainApp();
            if (typeof initUserCloudSync === 'function') {
                initUserCloudSync().then(() => {
                    const hasCar = (typeof getCurrentCar === 'function' && !!getCurrentCar()) || (typeof appState !== 'undefined' && Array.isArray(appState.cars) && appState.cars.length > 0);
                    if (hasCar) {
                        if (typeof closeAddNewCarModal === 'function') closeAddNewCarModal(true);
                        const addModal = document.getElementById('addNewCarModal');
                        if (addModal) {
                            addModal.classList.add('hidden');
                            addModal.style.display = 'none';
                        }
                        if (typeof renderDashboard === 'function') renderDashboard();
                    }
                }).catch(() => {});
            }

            if (typeof showNotification === 'function') {
                showNotification(isEn
                    ? `Password reset successful! Welcome back, ${clientName}! 🎉`
                    : `تم تعيين كلمة المرور الجديدة وتأكيد دخولك بنجاح يا ${clientName}! 🎉`, 'success', 5000);
            }
        }

        function resendWelcomeAndVerificationEmail() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            if (!profile.email || !profile.email.includes('@')) {
                showNotification(isEn ? 'No email found for your account.' : 'لا يوجد بريد إلكتروني مرتبط بحسابك.', 'error');
                return;
            }
            if (typeof sendRealVerificationOtpEmail === 'function') {
                sendRealVerificationOtpEmail(true);
            }
            showNotification(isEn
                ? `Verification email resent to ${profile.email} 📩`
                : `تم إعادة إرسال رمز التحقق إلى ${profile.email} 📩`, 'info');
        }

        /* ==========================================================================
           [LOGOUT & UPGRADE ACCOUNT] تسجيل الخروج وترقية الحساب
           ========================================================================== */
        function handleLogout() {
            try {
                if (typeof closeAccountCenter === 'function') closeAccountCenter();
                if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();
                if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();

                // 1. حفظ بيانات المستخدم الحالي في مساحته الخاصة قبل الخروج لضمان عدم ضياعها
                const profRaw = SafeStorage.getItem('motorCare_UserProfile');
                if (profRaw) {
                    try {
                        const prof = JSON.parse(profRaw);
                        if (prof && prof.email && typeof appState !== 'undefined' && appState.cars && appState.cars.length > 0) {
                            const uKey = prof.email.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                            SafeStorage.setJSON('motorCare_AppState_' + uKey, appState);
                        }
                    } catch(e) {}
                }

                // 2. إيقاف أي مزامنة سحابية نشطة وتسجيل الخروج من Firebase Auth
                if (typeof stopCloudSyncListener === 'function') {
                    stopCloudSyncListener();
                }
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    try { firebase.auth().signOut().catch(() => {}); } catch(e) {}
                }

                // 3. تصفير حالة التطبيق في الذاكرة ومسح التخزين المؤقت النشط
                if (typeof appState !== 'undefined') {
                    appState.cars = [];
                    appState.currentCarIndex = 0;
                }

                SafeStorage.removeItem('motorCare_AppState_v140');
                SafeStorage.removeItem('motorCare_UserProfile');
                SafeStorage.removeItem('motorCare_PersonalEmergencyContacts');
                SafeStorage.removeItem('motorCare_LastCloudSyncTime');
                SafeStorage.removeItem('motorCare_CurrentActiveUser');
                if (typeof MotorCareIndexedDB !== 'undefined' && MotorCareIndexedDB.removeItem) {
                    try { MotorCareIndexedDB.removeItem('motorCare_AppState_v140'); } catch(e) {}
                }

                SafeStorage.setItem('motorCare_LoggedIn', 'false');

                // 4. إظهار شاشة الدخول وإخفاء التطبيق الرئيسي
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

                // 5. إعادة رسم لوحة القيادة لتكون نظيفة تماماً بدون أي بيانات سيارة سابقة
                if (typeof renderDashboard === 'function') {
                    try { renderDashboard(); } catch(e) {}
                }

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
        }
        window.handleLogout = handleLogout;

        function handleUpgradeAccount() {
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
                    switchAuthTab('register');
                }

                if (typeof initGoogleIdentityServices === 'function') {
                    try { initGoogleIdentityServices(); } catch(e) {}
                }

                setTimeout(() => {
                    const nameInput = document.getElementById('authFullName') || document.getElementById('authEmail');
                    if (nameInput) nameInput.focus();
                }, 150);

                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn 
                            ? 'Create your registered account or sign in with Google to backup and sync your cars! 🚀' 
                            : 'أنشئ حسابك الجديد أو سجل عبر Google لحفظ بيانات سياراتك ومزامنتها سحابياً 🚀', 
                        'info'
                    );
                }
            } catch (err) {
                console.error('Upgrade account error:', err);
                handleLogout();
            }
        }
        window.handleUpgradeAccount = handleUpgradeAccount;




        async function handleImageInput(inputElement, targetKey) {
            if (inputElement.files && inputElement.files[0]) {
                const file = inputElement.files[0];
                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                try {
                    // ضغط وتصغير الصورة تلقائياً لحماية الذاكرة وسعة التخزين المحلي
                    const compressedDataUrl = await compressAndResizeImage(file, 1200, 0.75);
                    tempImages[targetKey] = compressedDataUrl;
                    alert(isEn 
                        ? 'Image optimized and attached successfully!' 
                        : 'تم ضغط وإرفاق المستند/الفاتورة بنجاح!');
                } catch(err) {
                    console.warn('Compression fallback:', err);
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        tempImages[targetKey] = e.target.result;
                        alert(isEn ? 'Image uploaded and attached successfully!' : 'تم تصوير وإرفاق المستند/الفاتورة بنجاح!');
                    };
                    reader.readAsDataURL(file);
                }
            }
        }

        function openImageViewer(imgSrc, titleText = '') {
            const modal = document.getElementById('imageViewerModal');
            const targetImg = document.getElementById('imageViewerTarget');
            const titleEl = document.getElementById('imageViewerTitle');
            if (!modal || !targetImg || !imgSrc) return;

            targetImg.src = imgSrc;
            if (titleEl) {
                const isEn = appState.lang === 'en';
                titleEl.innerText = titleText || (isEn ? 'Document / Invoice Preview' : 'معاينة المستند / الفاتورة');
            }

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        function closeImageViewer() {
            const modal = document.getElementById('imageViewerModal');
            const targetImg = document.getElementById('imageViewerTarget');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
            if (targetImg) targetImg.src = '';
        }

        async function shareCurrentDocumentImage() {
            const img = document.getElementById('imageViewerTarget');
            const titleEl = document.getElementById('imageViewerTitle');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const docTitle = titleEl ? titleEl.innerText : (isEn ? 'Maintenance Document / Invoice' : 'مستند وفاتورة الصيانة');

            if (!img || !img.src) {
                showNotification(isEn ? 'No document image found to share' : 'لا توجد صورة مستند للمشاركة', 'error');
                return;
            }

            try {
                let blob = null;
                let mimeType = 'image/png';

                if (img.src.startsWith('data:')) {
                    const parts = img.src.split(';base64,');
                    mimeType = parts[0].split(':')[1] || 'image/png';
                    const raw = window.atob(parts[1]);
                    const rawLength = raw.length;
                    const uInt8Array = new Uint8Array(rawLength);
                    for (let i = 0; i < rawLength; ++i) {
                        uInt8Array[i] = raw.charCodeAt(i);
                    }
                    blob = new Blob([uInt8Array], { type: mimeType });
                } else {
                    const res = await fetch(img.src);
                    blob = await res.blob();
                    mimeType = blob.type || 'image/png';
                }

                const ext = (mimeType.includes('jpeg') || mimeType.includes('jpg')) ? 'jpg' : (mimeType.includes('webp') ? 'webp' : 'png');
                const safeName = (docTitle || 'document').replace(/[^\w\u0600-\u06FF\s-]/gi, '').trim().replace(/\s+/g, '_') + '.' + ext;
                const file = new File([blob], safeName, { type: mimeType });

                // فحص دعم مشاركة الملفات عبر Web Share API
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    // مشاركة نقية لملف الصورة فقط دون إرفاق أي رابط أو URL للمشروع نهائياً
                    await navigator.share({
                        title: docTitle,
                        files: [file]
                    });
                    showNotification(isEn ? 'Document image shared successfully!' : 'تمت مشاركة صورة المستند بنجاح!', 'success');
                } else {
                    // في حال عدم دعم مشاركة الملفات بالمتصفح، يتم تنزيل الصورة نقية بدون روابط
                    downloadCurrentDocumentImage();
                }
            } catch(err) {
                if (err && err.name !== 'AbortError') {
                    console.warn('Share document failed:', err);
                    downloadCurrentDocumentImage();
                }
            }
        }

        function downloadCurrentDocumentImage() {
            const img = document.getElementById('imageViewerTarget');
            const titleEl = document.getElementById('imageViewerTitle');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const docTitle = titleEl ? titleEl.innerText : (isEn ? 'Maintenance Document / Invoice' : 'مستند وفاتورة الصيانة');
            if (!img || !img.src) return;

            const safeName = (docTitle || 'document').replace(/[^\w\u0600-\u06FF\s-]/gi, '').trim().replace(/\s+/g, '_') + '.png';
            const a = document.createElement('a');
            a.href = img.src;
            a.download = safeName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showNotification(isEn ? 'Document image saved to your device!' : 'تم حفظ صورة المستند على جهازك بنجاح!', 'success');
        }

        // ملاحظة: تم نقل تعريف كائن SafeStorage إلى قمة ملف السكربت لضمان الجاهزية الفورية من أول سطر


        /* ==========================================================================
           تعديل بيانات الحساب والبريد المعتمد (Edit Profile & Email Module)
           ========================================================================== */
        function openEditProfileModal() {
            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}
            const nameIn = document.getElementById('editProfileNameInput');
            const emailIn = document.getElementById('editProfileEmailInput');
            if (nameIn) nameIn.value = profile.name || '';
            if (emailIn) emailIn.value = profile.email || 'user@motorcare.app';
            const modal = document.getElementById('editProfileModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
                setTimeout(() => nameIn?.focus(), 150);
            }
        }

        function closeEditProfileModal() {
            const modal = document.getElementById('editProfileModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function registerSubscriberProfile(profile) {
            if (!profile) return;
            try {
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                const email = (profile.email || (typeof appState !== 'undefined' && appState.user && appState.user.email) || '').trim().toLowerCase();
                if (email) {
                    let subscribers = [];
                    const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                    if (rawSubs) subscribers = JSON.parse(rawSubs);
                    const idx = subscribers.findIndex(s => (s.email || '').toLowerCase() === email);
                    if (idx !== -1) {
                        subscribers[idx] = { ...subscribers[idx], ...profile };
                    } else {
                        subscribers.push({ ...profile, registeredAt: new Date().toISOString() });
                    }
                    SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subscribers));
                }
            } catch(e) {
                console.warn('[MotorCare Profile] registerSubscriberProfile notice:', e);
            }
        }

        function handleSaveProfileEdit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const nameIn = document.getElementById('editProfileNameInput');
            const newName = nameIn ? nameIn.value.trim() : '';
            if (!newName) return;

            let profile = { isRegistered: true, provider: 'google' };
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.name = newName;
            profile.isRegistered = true;

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            registerSubscriberProfile(profile);
            
            if (typeof syncUserDataToCloud === 'function') {
                try { syncUserDataToCloud('profile_updated'); } catch(e) {}
            }
            closeEditProfileModal();
            openAccountCenter();
            updateHeaderUserProfile();

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Name updated successfully!' : 'تم تحديث الاسم بنجاح! ✅', 'success');
            }
        }

        function updateHeaderUserProfile() {
            let profile = { name: 'زائر', email: '', avatar: '' };
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}
            
            const seed = profile.email || profile.name || 'motorcare';
            const avatarSrc = profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
            
            document.querySelectorAll('#headerUserAvatarImg').forEach(headerAvatar => {
                headerAvatar.src = avatarSrc;
            });
            const accountAvatar = document.getElementById('accountModalAvatarImg');
            if (accountAvatar) {
                accountAvatar.src = avatarSrc;
            }
        }



        /* ==========================================================================
           منظومة تخصيص واختيار الأفاتار للمستخدم (User Avatar Customization System)
           ========================================================================== */
        let tempSelectedAvatarUrl = '';

        const PRESET_AVATARS = [
            // روبوتات الكراج الذكية ومساعد الصيانة (Smart Bots)
            'https://api.dicebear.com/7.x/bottts/svg?seed=motorcare',
            'https://api.dicebear.com/7.x/bottts/svg?seed=speedster',
            'https://api.dicebear.com/7.x/bottts/svg?seed=gearhead',
            'https://api.dicebear.com/7.x/bottts/svg?seed=autobot',
            // كباتن القيادة والمغامرون (Adventurers & Drivers)
            'https://api.dicebear.com/7.x/adventurer/svg?seed=CaptainDrive',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=RoadMaster',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=DriftKing',
            'https://api.dicebear.com/7.x/adventurer/svg?seed=SpeedQueen',
            // شخصيات عصرية أنيقة (Modern Personas)
            'https://api.dicebear.com/7.x/personas/svg?seed=Alex',
            'https://api.dicebear.com/7.x/personas/svg?seed=Sarah',
            'https://api.dicebear.com/7.x/personas/svg?seed=Omar',
            'https://api.dicebear.com/7.x/personas/svg?seed=Nour',
            // ستايل عصري راقي (Lorelei VIPs)
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix',
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Milo',
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe',
            'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo'
        ];

        function openChangeAvatarModal() {
            let currentAvatar = '';
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) {
                    const profile = JSON.parse(raw);
                    currentAvatar = profile.avatar;
                }
            } catch(e) {}

            if (!currentAvatar) {
                const avatarEl = document.getElementById('accountModalAvatarImg');
                currentAvatar = avatarEl ? avatarEl.src : PRESET_AVATARS[0];
            }

            tempSelectedAvatarUrl = currentAvatar;
            updateAvatarModalPreview(tempSelectedAvatarUrl);
            renderAvatarPresets();

            const modal = document.getElementById('changeAvatarModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }

        function closeChangeAvatarModal() {
            const modal = document.getElementById('changeAvatarModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function updateAvatarModalPreview(url) {
            const previewImg = document.getElementById('avatarModalPreviewImg');
            if (previewImg) previewImg.src = url;
        }

        function renderAvatarPresets() {
            const grid = document.getElementById('avatarPresetsGrid');
            if (!grid) return;
            grid.innerHTML = '';

            PRESET_AVATARS.forEach((url) => {
                const isSelected = tempSelectedAvatarUrl === url;
                const item = document.createElement('div');
                item.className = `cursor-pointer p-1.5 rounded-2xl border-2 transition-all flex items-center justify-center relative ${
                    isSelected 
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 ring-2 ring-sky-400/40 shadow-md scale-105' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-sky-300'
                }`;
                item.onclick = () => {
                    tempSelectedAvatarUrl = url;
                    updateAvatarModalPreview(url);
                    renderAvatarPresets();
                };
                item.innerHTML = `
                    <img src="${url}" class="w-11 h-11 rounded-xl object-cover">
                    ${isSelected ? '<span class="absolute -top-1 -right-1 bg-sky-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow"><i class="fa-solid fa-check"></i></span>' : ''}
                `;
                grid.appendChild(item);
            });
        }

        function generateRandomAvatar() {
            const styles = ['bottts', 'adventurer', 'personas', 'lorelei'];
            const style = styles[Math.floor(Math.random() * styles.length)];
            const randomSeed = 'mc_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            const randomUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}`;
            tempSelectedAvatarUrl = randomUrl;
            updateAvatarModalPreview(randomUrl);
            renderAvatarPresets();
        }

        function handleCustomAvatarFile(event) {
            const file = event.target?.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const maxDim = 160; // ضغط الصورة لـ 160x160 لتبقى خفيفة جداً (< 15KB) وتحفظ في localStorage دون أي مشاكل
                    canvas.width = maxDim;
                    canvas.height = maxDim;
                    const ctx = canvas.getContext('2d');
                    
                    let sx = 0, sy = 0, sw = img.width, sh = img.height;
                    if (sw > sh) {
                        sx = (sw - sh) / 2;
                        sw = sh;
                    } else if (sh > sw) {
                        sy = (sh - sw) / 2;
                        sh = sw;
                    }
                    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxDim, maxDim);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    tempSelectedAvatarUrl = compressedBase64;
                    updateAvatarModalPreview(compressedBase64);
                    renderAvatarPresets();
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        }

        function applySelectedAvatar() {
            if (!tempSelectedAvatarUrl) {
                const previewImg = document.getElementById('avatarModalPreviewImg');
                if (previewImg && previewImg.src) {
                    tempSelectedAvatarUrl = previewImg.src;
                }
            }
            if (!tempSelectedAvatarUrl && typeof PRESET_AVATARS !== 'undefined' && PRESET_AVATARS.length > 0) {
                tempSelectedAvatarUrl = PRESET_AVATARS[0];
            }
            if (!tempSelectedAvatarUrl) return;

            let profile = {};
            try {
                const raw = SafeStorage.getItem('motorCare_UserProfile');
                if (raw) profile = JSON.parse(raw);
            } catch(e) {}

            profile.avatar = tempSelectedAvatarUrl;
            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            registerSubscriberProfile(profile);

            if (typeof syncUserDataToCloud === 'function') {
                try { syncUserDataToCloud('avatar_updated'); } catch(e) {}
            }

            if (typeof appState !== 'undefined' && appState.user) {
                appState.user.avatar = tempSelectedAvatarUrl;
            }

            // تحديث كافة عناصر الأفاتار في التطبيق
            document.querySelectorAll('#headerUserAvatarImg').forEach(img => {
                img.src = tempSelectedAvatarUrl;
            });

            const accountAvatar = document.getElementById('accountModalAvatarImg');
            if (accountAvatar) accountAvatar.src = tempSelectedAvatarUrl;

            updateHeaderUserProfile();
            closeChangeAvatarModal();

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof showNotification === 'function') {
                showNotification(isEn ? 'Profile avatar updated successfully! 📸' : 'تم حفظ وتعيين الصورة الشخصية بنجاح! 📸', 'success');
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof enterMainApp !== 'undefined') window.enterMainApp = enterMainApp; } catch (e) {}
try { if (typeof handleGuestEntry !== 'undefined') window.handleGuestEntry = handleGuestEntry; } catch (e) {}
try { if (typeof handleSocialLogin !== 'undefined') window.handleSocialLogin = handleSocialLogin; } catch (e) {}
try { if (typeof loginAsGoogleProfile !== 'undefined') window.loginAsGoogleProfile = loginAsGoogleProfile; } catch (e) {}
try { if (typeof switchAuthTab !== 'undefined') window.switchAuthTab = switchAuthTab; } catch (e) {}
try { if (typeof togglePasswordVisibility !== 'undefined') window.togglePasswordVisibility = togglePasswordVisibility; } catch (e) {}
try { if (typeof handleAuthSubmit !== 'undefined') window.handleAuthSubmit = handleAuthSubmit; } catch (e) {}
try { if (typeof checkAuthEmailExistingLive !== 'undefined') window.checkAuthEmailExistingLive = checkAuthEmailExistingLive; } catch (e) {}
try { if (typeof initAuthEmailLiveWatcher !== 'undefined') window.initAuthEmailLiveWatcher = initAuthEmailLiveWatcher; } catch (e) {}
try { if (typeof findAccountByEmail !== 'undefined') window.findAccountByEmail = findAccountByEmail; } catch (e) {}
try { if (typeof saveAccountToLocalDB !== 'undefined') window.saveAccountToLocalDB = saveAccountToLocalDB; } catch (e) {}
try { if (typeof openGoogleAuthModal !== 'undefined') window.openGoogleAuthModal = openGoogleAuthModal; } catch (e) {}
try { if (typeof closeGoogleAuthModal !== 'undefined') window.closeGoogleAuthModal = closeGoogleAuthModal; } catch (e) {}
try { if (typeof handleGoogleAuthModalSubmit !== 'undefined') window.handleGoogleAuthModalSubmit = handleGoogleAuthModalSubmit; } catch (e) {}
try { if (typeof initGoogleIdentityServices !== 'undefined') window.initGoogleIdentityServices = initGoogleIdentityServices; } catch (e) {}
try { if (typeof initGoogleOAuthClient !== 'undefined') window.initGoogleOAuthClient = initGoogleOAuthClient; } catch (e) {}
try { if (typeof fetchGoogleUserProfile !== 'undefined') window.fetchGoogleUserProfile = fetchGoogleUserProfile; } catch (e) {}
try { if (typeof triggerGoogleOAuthWebFlow !== 'undefined') window.triggerGoogleOAuthWebFlow = triggerGoogleOAuthWebFlow; } catch (e) {}
try { if (typeof checkOAuthRedirectResponse !== 'undefined') window.checkOAuthRedirectResponse = checkOAuthRedirectResponse; } catch (e) {}
try { if (typeof generateVerificationOtp !== 'undefined') window.generateVerificationOtp = generateVerificationOtp; } catch (e) {}
try { if (typeof sendRealVerificationOtpEmail !== 'undefined') window.sendRealVerificationOtpEmail = sendRealVerificationOtpEmail; } catch (e) {}
try { if (typeof submitEmailVerificationCode !== 'undefined') window.submitEmailVerificationCode = submitEmailVerificationCode; } catch (e) {}
try { if (typeof openVerificationCodeModal !== 'undefined') window.openVerificationCodeModal = openVerificationCodeModal; } catch (e) {}
try { if (typeof closeEmailVerificationModal !== 'undefined') window.closeEmailVerificationModal = closeEmailVerificationModal; } catch (e) {}
try { if (typeof checkUrlEmailVerification !== 'undefined') window.checkUrlEmailVerification = checkUrlEmailVerification; } catch (e) {}
try { if (typeof initCrossTabAuthSync !== 'undefined') window.initCrossTabAuthSync = initCrossTabAuthSync; } catch (e) {}
try { if (typeof notifyCrossTabVerification !== 'undefined') window.notifyCrossTabVerification = notifyCrossTabVerification; } catch (e) {}
try { if (typeof openForgotPasswordModal !== 'undefined') window.openForgotPasswordModal = openForgotPasswordModal; } catch (e) {}
try { if (typeof closeForgotPasswordModal !== 'undefined') window.closeForgotPasswordModal = closeForgotPasswordModal; } catch (e) {}
try { if (typeof handleForgotPasswordStep1 !== 'undefined') window.handleForgotPasswordStep1 = handleForgotPasswordStep1; } catch (e) {}
try { if (typeof handleForgotPasswordStep2 !== 'undefined') window.handleForgotPasswordStep2 = handleForgotPasswordStep2; } catch (e) {}
try { if (typeof handleResendForgotOtp !== 'undefined') window.handleResendForgotOtp = handleResendForgotOtp; } catch (e) {}
try { if (typeof backToForgotStep1 !== 'undefined') window.backToForgotStep1 = backToForgotStep1; } catch (e) {}
try { if (typeof handleLogout !== 'undefined') window.handleLogout = handleLogout; } catch (e) {}
try { if (typeof handleUpgradeAccount !== 'undefined') window.handleUpgradeAccount = handleUpgradeAccount; } catch (e) {}
try { if (typeof openEditProfileModal !== 'undefined') window.openEditProfileModal = openEditProfileModal; } catch (e) {}
try { if (typeof closeEditProfileModal !== 'undefined') window.closeEditProfileModal = closeEditProfileModal; } catch (e) {}
try { if (typeof handleSaveProfileEdit !== 'undefined') window.handleSaveProfileEdit = handleSaveProfileEdit; } catch (e) {}
try { if (typeof openChangeAvatarModal !== 'undefined') window.openChangeAvatarModal = openChangeAvatarModal; } catch (e) {}
try { if (typeof closeChangeAvatarModal !== 'undefined') window.closeChangeAvatarModal = closeChangeAvatarModal; } catch (e) {}
try { if (typeof applySelectedAvatar !== 'undefined') window.applySelectedAvatar = applySelectedAvatar; } catch (e) {}
try { if (typeof generateRandomAvatar !== 'undefined') window.generateRandomAvatar = generateRandomAvatar; } catch (e) {}
try { if (typeof handleCustomAvatarFile !== 'undefined') window.handleCustomAvatarFile = handleCustomAvatarFile; } catch (e) {}
try { if (typeof PRESET_AVATARS !== 'undefined') window.PRESET_AVATARS = PRESET_AVATARS; } catch (e) {}
try { if (typeof MOTORCARE_OFFICIAL_WEBHOOK !== 'undefined') window.MOTORCARE_OFFICIAL_WEBHOOK = MOTORCARE_OFFICIAL_WEBHOOK; } catch (e) {}
try { if (typeof updateHeaderUserProfile !== 'undefined') window.updateHeaderUserProfile = updateHeaderUserProfile; } catch (e) {}
