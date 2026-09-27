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
                            console.warn('[MotorCare Auth] GIS TokenClient error/cancel:', err);
                            // تم إلغاء النافذة بدون إظهار رسالة مزعجة للعميل بناءً على التوجيهات
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
            if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                console.warn('[MotorCare Auth] triggerGoogleOAuthWebFlow blocked on native mobile platform.');
                return;
            }
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

        async function loginWithGoogle() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            try {
                if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                    // 1. بيئة الهواتف الأصلية (Native Sheet): منع استخدام أي توجيه خارجي للمتصفح نهائياً على الموبايل
                    const GoogleAuth = (window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) || null;
                    if (!GoogleAuth) {
                        throw new Error('Native GoogleAuth plugin unavailable');
                    }
                    try {
                        await GoogleAuth.initialize({
                            clientId: '905426771864-4s8ehiscpbjdjb64ukl9hdngnsptpkmv.apps.googleusercontent.com',
                            serverClientId: '905426771864-4s8ehiscpbjdjb64ukl9hdngnsptpkmv.apps.googleusercontent.com',
                            scopes: ['profile', 'email'],
                            grantOfflineAccess: true
                        });
                    } catch (initErr) {
                        console.warn('[MotorCare Auth] GoogleAuth.initialize note:', initErr);
                    }

                    const googleUser = await GoogleAuth.signIn();
                    console.log('[MotorCare Auth] Native GoogleAuth user response:', {
                        hasUser: !!googleUser,
                        email: googleUser?.email,
                        name: googleUser?.name,
                        hasAuth: !!googleUser?.authentication,
                        hasIdToken: !!(googleUser?.authentication?.idToken || googleUser?.idToken)
                    });

                    if (!googleUser || (!googleUser.email && !googleUser.name)) {
                        throw new Error('Google Sign-In returned no user details');
                    }

                    const idToken = (googleUser.authentication && googleUser.authentication.idToken) || googleUser.idToken || null;
                    const accessToken = (googleUser.authentication && googleUser.authentication.accessToken) || googleUser.accessToken || null;

                    let fbUser = null;
                    if (idToken && typeof firebase !== 'undefined' && firebase.auth) {
                        try {
                            let cred = null;
                            if (typeof firebase.auth.GoogleAuthProvider !== 'undefined' && typeof firebase.auth.GoogleAuthProvider.credential === 'function') {
                                cred = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken);
                            }
                            if (cred) {
                                const fbRes = await firebase.auth().signInWithCredential(cred);
                                fbUser = fbRes?.user;
                                console.log('[MotorCare Auth] Firebase signed in with Google credential successfully:', fbUser?.uid);
                            }
                        } catch(fErr) {
                            console.error('[MotorCare Auth] Firebase signInWithCredential error:', fErr);
                        }
                    }

                    const displayName = googleUser.name || googleUser.givenName || (googleUser.email ? googleUser.email.split('@')[0] : 'Google User');
                    loginAsGoogleProfile(displayName, googleUser.email, googleUser.imageUrl, fbUser?.uid);
                    return fbUser || googleUser;
                } else {
                    // 2. للويب فقط (Localhost / Browser Testing)
                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        const provider = new firebase.auth.GoogleAuthProvider();
                        provider.addScope('profile');
                        provider.addScope('email');
                        const res = await firebase.auth().signInWithPopup(provider);
                        if (res && res.user && res.user.email) {
                            loginAsGoogleProfile(res.user.displayName, res.user.email, res.user.photoURL, res.user.uid);
                        }
                        return res;
                    }
                }
            } catch (error) {
                console.error('Google Sign-In Error:', error);
                const errStr = String(error?.message || error?.code || error || '');
                const isUserCancelled = errStr.includes('12501') || errStr.toLowerCase().includes('cancel') || errStr.toLowerCase().includes('user cancelled');

                if (isUserCancelled) {
                    if (typeof showNotification === 'function') {
                        showNotification(isEn ? 'Sign in was cancelled.' : 'تم إلغاء تسجيل الدخول.', 'info');
                    }
                } else if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                    let feedbackMsg = isEn ? 'Google Sign-In failed on mobile device.' : 'تعذر تسجيل الدخول بحساب Google على الهاتف.';

                    if (errStr.includes('10') || errStr.includes('DEVELOPER_ERROR') || errStr.includes('Something went wrong')) {
                        feedbackMsg = isEn 
                            ? 'Google Auth: SHA-1 fingerprint configuration required in Firebase Console.' 
                            : 'تعذر الربط المباشر بـ Google: يرجى التأكد من إدراج بصمة SHA-1 في Firebase Console أو دخول بالبريد.';
                    } else if (errStr.includes('12500')) {
                        feedbackMsg = isEn 
                            ? 'Google Auth Error 12500: Google Play Services or OAuth configuration error.' 
                            : 'فشل الربط بحساب Google (خطأ 12500): خطأ في إعدادات Google Play Services أو OAuth.';
                    }

                    if (typeof showNotification === 'function') {
                        showNotification(feedbackMsg, 'warning');
                    }
                }
                throw error;
            }
        }

        async function handleSocialLogin(provider) {
            if (provider === 'google') {
                try {
                    await loginWithGoogle();
                } catch(err) {
                    console.warn('[MotorCare Auth] handleSocialLogin Google error handled:', err?.message || err);
                }
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
                name: isEn ? 'Guest User' : 'زائر كريم',
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
try { if (typeof loginWithGoogle !== 'undefined') window.loginWithGoogle = loginWithGoogle; } catch (e) {}
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
