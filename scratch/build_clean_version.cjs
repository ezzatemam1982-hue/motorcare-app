const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseSourcePath = 'd:/car/MotorCare-App - V3 - Copy/index.html';
let content = fs.readFileSync(baseSourcePath, 'utf8').replace(/\r\n/g, '\n');

console.log('Original Base file length:', content.length);

// 1. Email Logo & Contrast Fixes
// Remove duplicate logo before h1 in welcome email templates
const lines = content.split('\n');
let foundLogo = false;
let foundCheck = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('alt="MotorCare"') && lines[i].includes('مرحباً بك في MotorCare</h1>')) {
        const h1Idx = lines[i].indexOf('<h1');
        if (h1Idx !== -1) {
            lines[i] = '    ' + lines[i].substring(h1Idx);
            foundLogo = true;
        }
    }
    if (lines[i].includes('تم تفعيل وتوثيق حسابك بنجاح &check;')) {
        lines[i] = lines[i].replace('&check;', '✓');
        foundCheck = true;
    }
}
content = lines.join('\n');
console.log(`[1] Email logo duplicates cleaned: foundLogo=${foundLogo}, foundCheck=${foundCheck}`);

// Apply white contrast color to welcome email h1
content = content.replace(
    /<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">مرحباً بك في MotorCare<\/h1>/g,
    '<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff !important; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">مرحباً بك في MotorCare</h1>'
);
content = content.replace(
    /color: #38bdf8; font-weight: 700;">تم تفعيل وتوثيق حسابك بنجاح ✓<\/p>/g,
    'color: #38bdf8 !important; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.4);">تم تفعيل وتوثيق حسابك بنجاح ✓</p>'
);

// 2. Add authEmailExistingHint below #authEmail input
const targetAuthInput = `<input type="email" id="authEmail" name="email" autocomplete="email username" placeholder="name@example.com" data-i18n-ph="phFeedbackEmail" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 transition-colors">
                                <i class="fa-solid fa-envelope absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-[11px]"></i>
                            </div>`;

const replacementAuthInput = `<input type="email" id="authEmail" name="email" autocomplete="email username" placeholder="name@example.com" data-i18n-ph="phFeedbackEmail" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-sky-500 transition-colors">
                                <i class="fa-solid fa-envelope absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-[11px]"></i>
                            </div>
                            <div id="authEmailExistingHint" class="hidden mt-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between">
                                <span><i class="fa-solid fa-triangle-exclamation me-1"></i> هذا البريد مسجل مسبقاً!</span>
                                <button type="button" onclick="switchAuthTab('login')" class="underline hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer">تسجيل الدخول الآن</button>
                            </div>`;

if (content.includes(targetAuthInput)) {
    content = content.replace(targetAuthInput, replacementAuthInput);
    console.log('[2] Added authEmailExistingHint below #authEmail');
} else {
    console.warn('[2] Could not find targetAuthInput');
}

// 3. Add ensureFirestoreReady right after initFirestoreDatabase
const initFirestoreEnd = `                isFirestoreReady = true;
                return true;
            } catch(e) {
                console.warn('[MotorCare Cloud] Firebase init note:', e.message);
                return false;
            }
        }`;

const ensureFirestoreSnippet = `                isFirestoreReady = true;
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
        }`;

if (content.includes(initFirestoreEnd)) {
    content = content.replace(initFirestoreEnd, ensureFirestoreSnippet);
    console.log('[3] Added ensureFirestoreReady after initFirestoreDatabase');
} else {
    console.warn('[3] Could not find initFirestoreEnd');
}

// 4. Update markAccountAsVerifiedInDB and add checkUrlEmailVerification
const markAccountStart = '        function markAccountAsVerifiedInDB(email) {';
const markAccountEnd = '        function notifyCrossTabVerification(email) {';

const mStartIdx = content.indexOf(markAccountStart);
const mEndIdx = content.indexOf(markAccountEnd);

if (mStartIdx !== -1 && mEndIdx !== -1 && mStartIdx < mEndIdx) {
    const newMarkAccountCode = `        function markAccountAsVerifiedInDB(email) {
            if (!email) return;
            const norm = email.trim().toLowerCase();
            const nowIso = new Date().toISOString();

            // استرجاع كلمة المرور واسم الحساب من أي مكان محفوظ محلياً
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

            // 1. تحديث أو إضافة الحساب إلى قاعدة بيانات الحسابات المحلية motorCare_AccountsDB
            try {
                let accounts = [];
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) accounts = JSON.parse(raw);
                if (!Array.isArray(accounts)) accounts = [];
                const accIdx = accounts.findIndex(a => a.email && a.email.toLowerCase() === norm);
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
            } catch (e) { }

            // 2. تحديث سجل المشتركين المعتمدين motorCare_RegisteredSubscribers
            try {
                let subscribers = [];
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) subscribers = JSON.parse(rawSubs);
                if (!Array.isArray(subscribers)) subscribers = [];
                const subIdx = subscribers.findIndex(s => s.email && s.email.toLowerCase() === norm);
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

            // 3. تحديث سحابي مباشر وفوري في Firestore إن كانت جاهزة
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

`;
    content = content.substring(0, mStartIdx) + newMarkAccountCode + content.substring(mEndIdx);
    console.log('[4] Updated markAccountAsVerifiedInDB & added checkUrlEmailVerification');
} else {
    console.warn('[4] Could not find markAccountAsVerifiedInDB boundaries');
}

// 5. Update Module 01 switchAuthTab and add live watcher
const mod01SwitchStart = '        function switchAuthTab(mode) {\n            currentAuthMode = mode;';
const mod01GoogleClient = '        const GOOGLE_OAUTH_CLIENT_ID =';

const sStartIdx = content.indexOf(mod01SwitchStart);
const gStartIdx = content.indexOf(mod01GoogleClient, sStartIdx);

if (sStartIdx !== -1 && gStartIdx !== -1 && sStartIdx < gStartIdx) {
    const newSwitchAndWatcher = `        function switchAuthTab(mode) {
            currentAuthMode = mode;
            const existingHint = document.getElementById('authEmailExistingHint');
            if (existingHint) existingHint.classList.add('hidden');
            const isReg = mode === 'register';
            const loginBtn = document.getElementById('loginTabBtn');
            const regBtn = document.getElementById('registerTabBtn');
            const submitText = document.getElementById('authSubmitBtnText');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (loginBtn && regBtn) {
                if (isReg) {
                    regBtn.className = "flex-1 py-2 text-center rounded-xl bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs transition-all cursor-pointer";
                    loginBtn.className = "flex-1 py-2 text-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer";
                } else {
                    loginBtn.className = "flex-1 py-2 text-center rounded-xl bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-xs transition-all cursor-pointer";
                    regBtn.className = "flex-1 py-2 text-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer";
                }
            }
            if (submitText) {
                submitText.innerText = isReg
                    ? (isEn ? 'Create Account & Start' : 'إنشاء حساب والبدء')
                    : (isEn ? 'Instant Sign In' : 'دخول فوري');
            }
            const nameContainer = document.getElementById('nameFieldContainer');
            if (nameContainer) nameContainer.classList.toggle('hidden', !isReg);

            if (isReg && typeof checkAuthEmailExistingLive === 'function') {
                checkAuthEmailExistingLive();
            }
        }

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

            const nameContainer = document.getElementById('nameFieldContainer');
            const isReg = currentAuthMode === 'register' || (nameContainer && !nameContainer.classList.contains('hidden'));
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

`;
    content = content.substring(0, sStartIdx) + newSwitchAndWatcher + content.substring(gStartIdx);
    console.log('[5] Updated Module 01 switchAuthTab and added live watcher');
} else {
    console.warn('[5] Could not find Module 01 switchAuthTab / GoogleClient boundaries');
}

// 6. Replace handleAuthSubmit with findAccountByEmail, saveAccountToLocalDB, and updated handleAuthSubmit
const authSubmitStart = '        let _isSubmittingAuth = false;\n        async function handleAuthSubmit(e) {';
const authSubmitEnd = '        function openForgotPasswordModal() {';

const aStartIdx = content.indexOf(authSubmitStart);
const aEndIdx = content.indexOf(authSubmitEnd, aStartIdx);

if (aStartIdx !== -1 && aEndIdx !== -1 && aStartIdx < aEndIdx) {
    const newAuthSubmitCode = `        async function findAccountByEmail(email) {
            if (!email) return null;
            const norm = email.trim().toLowerCase();
            const userKey = norm.replace(/[^a-z0-9_]/g, '_');

            // 1. فحص قاعدة الحسابات المحلية motorCare_AccountsDB
            try {
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) {
                    const accounts = JSON.parse(raw);
                    if (Array.isArray(accounts)) {
                        const found = accounts.find(a => a.email && a.email.toLowerCase() === norm);
                        if (found) {
                            if (!found.password) {
                                try {
                                    const profRaw = SafeStorage.getItem('motorCare_UserProfile');
                                    if (profRaw) {
                                        const p = JSON.parse(profRaw);
                                        if (p && p.email && p.email.toLowerCase() === norm && p.password) {
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

            // 2. فحص ملف الحساب النشط motorCare_UserProfile
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const prof = JSON.parse(rawProf);
                    if (prof && prof.email && prof.email.toLowerCase() === norm && (prof.isRegistered || prof.password)) {
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

            // 3. فحص سجل المشتركين المعتمدين motorCare_RegisteredSubscribers
            try {
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) {
                    const subs = JSON.parse(rawSubs);
                    if (Array.isArray(subs)) {
                        const s = subs.find(sub => sub.email && sub.email.toLowerCase() === norm);
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

            // 4. فحص سجل إرسال إيميلات الترحيب motorCare_WelcomeEmailsSent
            try {
                const rawSent = SafeStorage.getItem('motorCare_WelcomeEmailsSent');
                if (rawSent) {
                    const sentList = JSON.parse(rawSent);
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

            // 5. فحص سحابي فوري ومباشر في Firestore (يمنع التكرار حتى عبر الأجهزة والمتصفحات الخفية)
            try {
                if (typeof ensureFirestoreReady === 'function') {
                    await ensureFirestoreReady();
                }
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    const snap = await Promise.race([
                        firestoreDb.collection('motorcare_users').doc(userKey).get(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
                    ]);
                    if (snap && snap.exists) {
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
                console.warn('[MotorCare Auth] Firestore findAccount notice:', e.message);
            }

            return null;
        }

        function saveAccountToLocalDB(accObj) {
            if (!accObj || !accObj.email) return;
            const norm = accObj.email.trim().toLowerCase();
            try {
                let accounts = [];
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) accounts = JSON.parse(raw);
                if (!Array.isArray(accounts)) accounts = [];
                const idx = accounts.findIndex(a => a.email && a.email.toLowerCase() === norm);
                if (idx !== -1) {
                    const existingPass = accounts[idx].password;
                    accounts[idx] = { ...accounts[idx], ...accObj };
                    if (!accObj.password && existingPass) accounts[idx].password = existingPass;
                } else {
                    accounts.push(accObj);
                }
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
            } catch (e) { }

            try {
                let subs = [];
                const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                if (rawSubs) subs = JSON.parse(rawSubs);
                if (!Array.isArray(subs)) subs = [];
                const subIdx = subs.findIndex(s => s.email && s.email.toLowerCase() === norm);
                if (subIdx !== -1) {
                    subs[subIdx] = { ...subs[subIdx], ...accObj };
                } else {
                    subs.push({ ...accObj });
                }
                SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subs));
            } catch (e) { }
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
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter your email and password, or tap "Guest Explorer" below!' : 'يرجى إدخال البريد وكلمة المرور، أو اضغط "الدخول كزائر" بالأسفل!', 'info');
                }
                document.getElementById('authEmail')?.focus();
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.', 'error');
                }
                document.getElementById('authEmail')?.focus();
                return;
            }

            if (password.length < 4) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Password must be at least 4 characters.' : 'يجب أن تكون كلمة المرور 4 أحرف على الأقل.', 'error');
                }
                document.getElementById('authPassword')?.focus();
                return;
            }

            const submitBtnText = document.getElementById('authSubmitBtnText');
            const originalText = submitBtnText ? submitBtnText.innerText : '';
            if (submitBtnText) submitBtnText.innerText = isEn ? 'Verifying...' : 'جاري التحقق...';

            const nameContainer = document.getElementById('nameFieldContainer');
            const isRegisterMode = currentAuthMode === 'register' || (nameContainer && !nameContainer.classList.contains('hidden'));

            // فحص شامل للحساب عبر القاعدة المحلية والسحابية في Firestore
            const existingAccount = await findAccountByEmail(email);

            if (submitBtnText) submitBtnText.innerText = originalText;

            if (!isRegisterMode) {
                // ==========================================
                // وضع تسجيل الدخول (Sign In Mode)
                // ==========================================
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

                // التحقق من كلمة المرور
                if (existingAccount.password && existingAccount.password !== password) {
                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn ? 'Incorrect password. Please try again or click "Forgot password?".' : 'كلمة المرور غير صحيحة. يرجى المحاولة مجدداً أو النقر على "نسيت كلمة المرور؟".',
                            'error', 5000
                        );
                    }
                    document.getElementById('authPassword')?.focus();
                    return;
                }

                // إذا كان الحساب موجوداً بدون كلمة مرور محفوظة، نحفظ كلمة المرور المدخلة فوراً
                if (!existingAccount.password) {
                    existingAccount.password = password;
                    saveAccountToLocalDB(existingAccount);
                    if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                        try {
                            const userKey = email.replace(/[^a-z0-9_]/g, '_');
                            firestoreDb.collection('motorcare_users').doc(userKey).set({ password: password }, { merge: true }).catch(() => { });
                        } catch (e) { }
                    }
                }

                // تسجيل الدخول بالحساب الموجود
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
                    showNotification(isEn ? \`Welcome back, \${profile.name}! 👋\` : \`أهلاً بعودتك يا \${profile.name}! 👋\`, 'success');
                }

                // إذا كان الحساب غير موثق بعد، فتح نافذة إدخال رمز التحقق تلقائياً
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
                    // الحساب مسجل مسبقاً! يُمنع التسجيل المكرر ويُمنع إرسال أي رمز OTP
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

                // إنشاء الحساب الجديد
                const nowIso = new Date().toISOString();
                const newAccount = {
                    id: 'acc_' + Date.now(),
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

                // حفظ سحابي في Firestore فوراً متضمناً كلمة المرور
                if (typeof ensureFirestoreReady === 'function') {
                    await ensureFirestoreReady();
                }
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    try {
                        const userKey = email.replace(/[^a-z0-9_]/g, '_');
                        await firestoreDb.collection('motorcare_users').doc(userKey).set({
                            id: newAccount.id,
                            name: newAccount.name,
                            email: email,
                            password: password,
                            provider: 'email',
                            isRegistered: true,
                            isVerified: false,
                            emailVerified: false,
                            registeredAt: nowIso
                        }, { merge: true });
                        console.log('[MotorCare Cloud] New user persisted to Firestore:', userKey);
                    } catch (e) {
                        console.warn('[MotorCare Cloud] Firestore register write notice:', e.message);
                    }
                }

                const profile = { ...newAccount };
                SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                SafeStorage.setItem('motorCare_LoggedIn', 'true');

                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn
                            ? \`Account created! 🎉 Sending verification code to \${email}...\`
                            : \`تم إنشاء حسابك بنجاح! 🎉 جاري إرسال رمز التحقق إلى \${email}...\`,
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
                if (typeof initUserCloudSync === 'function') initUserCloudSync();

                // إرسال كود التفعيل وفتح نافذة إدخال الرمز مباشرة
                setTimeout(() => {
                    if (typeof sendRealVerificationOtpEmail === 'function') {
                        sendRealVerificationOtpEmail(false);
                    }
                    if (typeof openVerificationCodeModal === 'function') {
                        openVerificationCodeModal(false);
                    }
                }, 400);
            }
        }

`;
    content = content.substring(0, aStartIdx) + newAuthSubmitCode + content.substring(aEndIdx);
    console.log('[6] Updated handleAuthSubmit with findAccountByEmail and saveAccountToLocalDB');
} else {
    console.warn('[6] Could not find handleAuthSubmit boundaries');
}

// 7. Update handleForgotPasswordStep1 and Step2
const fStep1Start = '        async function handleForgotPasswordStep1(event) {';
const fStep2End = '        function resendWelcomeAndVerificationEmail() {';

const fStartIdx = content.indexOf(fStep1Start);
const fEndIdx = content.indexOf(fStep2End, fStartIdx);

if (fStartIdx !== -1 && fEndIdx !== -1 && fStartIdx < fEndIdx) {
    const newForgotSnippet = `        async function handleForgotPasswordStep1(event) {
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

            // التحقق الشامل من وجود الحساب محلياً وسحابياً
            const account = await findAccountByEmail(email);
            if (!account) {
                if (btn) btn.disabled = false;
                if (btnText) btnText.innerText = isEn ? 'Send Recovery Code' : 'إرسال رمز التحقق';
                if (btnIcon) btnIcon.className = 'fa-solid fa-arrow-left rtl:rotate-0 ltr:rotate-180 text-xs';
                if (typeof showNotification === 'function') {
                    showNotification(
                        isEn ? 'No account found with this email address.' : 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.',
                        'error', 5000
                    );
                }
                emailInput?.focus();
                return;
            }

            const accountUserName = account.name || 'عضو MotorCare';

            // توليد OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 15 * 60 * 1000;
            SafeStorage.setItem('motorCare_ForgotPasswordOtp', JSON.stringify({ email, otp, expiresAt, name: accountUserName }));

            if (btnText) btnText.innerText = isEn ? 'Sending...' : 'جاري الإرسال...';
            isSendingForgotOtp = true;

            // إرسال البريد وبدء التهدئة
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
                    ? \`A 6-digit OTP was sent to <strong class="text-sky-600">\${email}</strong>. Enter it below to set a new password.\`
                    : \`تم إرسال رمز OTP مكون من 6 أرقام إلى <strong class="text-sky-600">\${email}</strong>. أدخله أدناه لتعيين كلمة مرور جديدة.\`;
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
            if (!enteredOtp || enteredOtp.length !== 6 || !/^\\d{6}$/.test(enteredOtp)) {
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

            // 1. تحديث motorCare_AccountsDB و motorCare_RegisteredSubscribers
            saveAccountToLocalDB({
                name: storedReset.name || 'عضو MotorCare',
                email: targetEmail,
                password: newPass,
                isVerified: true
            });

            // 2. تحديث البروفايل motorCare_UserProfile إذا كان نفس الحساب
            try {
                const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                if (rawProf) {
                    const prof = JSON.parse(rawProf);
                    if (prof.email && prof.email.toLowerCase() === targetEmail) {
                        prof.password = newPass;
                        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(prof));
                    }
                }
            } catch (e) { }

            // 3. تحديث في Firestore
            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const userKey = targetEmail.replace(/[^a-z0-9_]/g, '_');
                    firestoreDb.collection('motorcare_users').doc(userKey).set({
                        password: newPass,
                        passwordUpdatedAt: new Date().toISOString()
                    }, { merge: true }).catch(() => { });
                } catch (e) { }
            }

            SafeStorage.removeItem('motorCare_ForgotPasswordOtp');

            // إغلاق النافذة وتعبئة بيانات الدخول والانتقال لتبويب تسجيل الدخول
            closeForgotPasswordModal();
            if (typeof switchAuthTab === 'function') {
                switchAuthTab('login');
            }
            const authEmail = document.getElementById('authEmail');
            const authPassword = document.getElementById('authPassword');
            if (authEmail) authEmail.value = targetEmail;
            if (authPassword) {
                authPassword.value = newPass;
                authPassword.focus();
            }

            if (typeof showNotification === 'function') {
                showNotification(isEn
                    ? 'Password updated successfully! You can now sign in. ✅'
                    : 'تم تحديث كلمة المرور بنجاح! تم تجهيز بياناتك للدخول الآن. ✅', 'success', 5000);
            }
        }

`;
    content = content.substring(0, fStartIdx) + newForgotSnippet + content.substring(fEndIdx);
    console.log('[7] Updated handleForgotPasswordStep1 and Step2');
} else {
    console.warn('[7] Could not find handleForgotPassword boundaries');
}

// 8. Update DOMContentLoaded
const domTarget = `            // فحص رابط تأكيد البريد الإلكتروني ورمز الـ OTP الفعلي
            if (typeof checkUrlEmailVerification === 'function') checkUrlEmailVerification();`;

const domReplacement = `            // فحص رابط تأكيد البريد الإلكتروني ورمز الـ OTP الفعلي
            if (typeof checkUrlEmailVerification === 'function') checkUrlEmailVerification();

            // تشغيل تهيئة Firestore وقاعدة البيانات فوراً للجميع (مسجلين وزوار وواجهة الدخول)
            if (typeof initFirestoreDatabase === 'function') {
                try { initFirestoreDatabase(); } catch(e) {}
            }
            if (typeof initAuthEmailLiveWatcher === 'function') {
                try { initAuthEmailLiveWatcher(); } catch(e) {}
            }`;

if (content.includes(domTarget)) {
    content = content.replace(domTarget, domReplacement);
    console.log('[8] Updated DOMContentLoaded with initFirestoreDatabase and initAuthEmailLiveWatcher');
} else {
    console.warn('[8] Could not find domTarget');
}

// 9. Validate JavaScript syntax
const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let sIdx = 0;
let hasSyntaxError = false;
while ((match = scriptRegex.exec(content)) !== null) {
    sIdx++;
    try {
        new vm.Script(match[1]);
        console.log(`Script #${sIdx} syntax is 100% VALID`);
    } catch(err) {
        console.error(`Script #${sIdx} syntax ERROR:`, err.message);
        hasSyntaxError = true;
    }
}

if (!hasSyntaxError) {
    // Write cleanly to index.html and src/index.html
    const targetMain = path.join(__dirname, '..', 'index.html');
    const targetSrc = path.join(__dirname, '..', 'src', 'index.html');

    fs.writeFileSync(targetMain, content, 'utf8');
    fs.writeFileSync(targetSrc, content, 'utf8');

    console.log('[SUCCESS] Both index.html and src/index.html updated successfully!');
    console.log('Final length:', content.length, 'lines:', content.split('\n').length);
} else {
    console.error('[ABORT] Did NOT write files due to syntax error.');
}
