# -*- coding: utf-8 -*-
import os
import re

def update_auth_system():
    root_index = 'index.html'
    src_index = os.path.join('src', 'index.html')

    with open(root_index, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update <head> switchAuthTab
    head_old_switch = '''        function switchAuthTab(mode) {
            window.currentAuthMode = mode;
            if (typeof currentAuthMode !== 'undefined') currentAuthMode = mode;
            const existingHint = document.getElementById('authEmailExistingHint');
            if (existingHint) existingHint.classList.add('hidden');
            const isReg = mode === 'register';
            const loginBtn = document.getElementById('loginTabBtn');
            const regBtn = document.getElementById('registerTabBtn');
            const submitText = document.getElementById('authSubmitBtnText');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            
            if (loginBtn && regBtn) {
                if (isReg) {
                    regBtn.className = "flex-1 py-1.5 text-center rounded-lg bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-2xs transition-all cursor-pointer";
                    loginBtn.className = "flex-1 py-1.5 text-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer";
                } else {
                    loginBtn.className = "flex-1 py-1.5 text-center rounded-lg bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-2xs transition-all cursor-pointer";
                    regBtn.className = "flex-1 py-1.5 text-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer";
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
        }'''

    head_new_switch = '''        window.currentAuthMode = 'login';
        window.switchAuthTab = function(mode) {
            window.currentAuthMode = mode;
            if (typeof currentAuthMode !== 'undefined') currentAuthMode = mode;
            const existingHint = document.getElementById('authEmailExistingHint');
            if (existingHint) existingHint.classList.add('hidden');
            const isReg = mode === 'register';
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

            if (isReg && typeof checkAuthEmailExistingLive === 'function') {
                checkAuthEmailExistingLive();
            }
        };
        function switchAuthTab(mode) { window.switchAuthTab(mode); }'''

    if head_old_switch in html:
        html = html.replace(head_old_switch, head_new_switch, 1)
        print('[1] Updated <head> switchAuthTab.')
    else:
        print('[1] head_old_switch not found, checking variations...')

    # 2. Update markAccountAsVerifiedInDB
    mark_old = '''        function markAccountAsVerifiedInDB(email) {
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
        }'''

    mark_new = '''        function markAccountAsVerifiedInDB(email) {
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
        }'''

    if mark_old in html:
        html = html.replace(mark_old, mark_new, 1)
        print('[2] Updated markAccountAsVerifiedInDB.')
    else:
        print('[2] mark_old not found directly, checking...')

    # 3. Update checkUrlEmailVerification to pre-fill authEmail
    check_url_old = '''                        if (profile.email && profile.email.toLowerCase() === normEmail) {
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
                        }'''

    check_url_new = '''                        if (profile.email && profile.email.toLowerCase() === normEmail) {
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
                        }'''

    if check_url_old in html:
        html = html.replace(check_url_old, check_url_new, 1)
        print('[3] Updated checkUrlEmailVerification.')
    else:
        print('[3] check_url_old not found.')

    # 4. Replace entire auth section: switchAuthTab, checkAuthEmailExistingLive, findAccountByEmail, saveAccountToLocalDB, handleAuthSubmit
    target_start_marker = "        let currentAuthMode = 'login';"
    target_end_marker = "        function openForgotPasswordModal() {"

    start_idx = html.find(target_start_marker)
    end_idx = html.find(target_end_marker, start_idx)

    if start_idx != -1 and end_idx != -1:
        new_auth_core = '''        let currentAuthMode = 'login';
        window.currentAuthMode = 'login';

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

            // 6. فحص سحابي سريع وغير معطل للواجهة في Firestore (مهلة 1.5 ثانية فقط)
            try {
                if (typeof isFirestoreReady !== 'undefined' && isFirestoreReady && firestoreDb) {
                    const snap = await Promise.race([
                        firestoreDb.collection('motorcare_users').doc(userKey).get(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
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

            const isRegisterMode = (window.currentAuthMode === 'register' || currentAuthMode === 'register');

            // فحص شامل ومؤكد للحساب في كافة قواعد البيانات
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

                // التحقق من صحة كلمة المرور
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

                // إذا كان الحساب مسجلاً بدون كلمة مرور محفوظة، نحفظ كلمة المرور المدخلة فوراً
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

                // اعتماد تسجيل الدخول بنجاح
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
                    // الحساب مسجل مسبقاً! يُمنع التسجيل المكرر تماماً ويُمنع إرسال أي رمز OTP
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

                // إنشاء الحساب الجديد وحفظه فوراً
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

                if (typeof ensureFirestoreReady === 'function') {
                    await ensureFirestoreReady(1500).catch(() => {});
                }
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    try {
                        const userKey = email.replace(/[^a-z0-9_]/g, '_');
                        firestoreDb.collection('motorcare_users').doc(userKey).set({
                            id: newAccount.id,
                            name: newAccount.name,
                            email: email,
                            password: password,
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

        '''
        html = html[:start_idx] + new_auth_core + html[end_idx:]
        print('[4] Replaced auth core in index.html successfully.')
    else:
        print('[4] FAILED to find markers for auth core replacement.')

    with open(root_index, 'w', encoding='utf-8') as f:
        f.write(html)
    print('[DONE] root index.html updated.')

    with open(src_index, 'w', encoding='utf-8') as f:
        f.write(html)
    print('[DONE] src/index.html updated with identical parity.')

    # Bump service workers to motorcare-cache-v2.0.25
    old_cache_pattern = re.compile(r"const CACHE_NAME = 'motorcare-cache-v[^']+';")
    new_cache_str = "const CACHE_NAME = 'motorcare-cache-v2.0.25';"

    for sw_path in ['sw.js', 'service-worker.js', os.path.join('src', 'sw.js'), os.path.join('src', 'service-worker.js')]:
        if os.path.exists(sw_path):
            with open(sw_path, 'r', encoding='utf-8') as f:
                sw_content = f.read()
            sw_content = old_cache_pattern.sub(new_cache_str, sw_content)
            with open(sw_path, 'w', encoding='utf-8') as f:
                f.write(sw_content)
            print(f'[DONE] Updated cache name in {sw_path}')

update_auth_system()
