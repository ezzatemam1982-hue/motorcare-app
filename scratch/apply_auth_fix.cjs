const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

// 1. Remove incorrect initAuthEmailLiveWatcher placed inside copyAppsScriptCode template string
const badSnippetStart = `        // مراقبة حية لحقل البريد في وضع إنشاء الحساب لمنع التكرار فوراً\n        (function initAuthEmailLiveWatcher() {`;
const badSnippetEnd = `        })();\n\n</body></html>';`;

if (content.includes(badSnippetStart)) {
    console.log('Found bad snippet inside copyAppsScriptCode, removing...');
    const startIdx = content.indexOf(badSnippetStart);
    const endMarker = `</body></html>';`;
    const endIdx = content.indexOf(endMarker, startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx) + `</body></html>';` + content.substring(endIdx + endMarker.length);
        console.log('Cleaned bad snippet from copyAppsScriptCode.');
    }
} else {
    console.log('Bad snippet not found with exact start, checking with regex...');
    // regex search
    const regex = /\n\s*\/\/ مراقبة حية لحقل البريد في وضع إنشاء الحساب[\s\S]*?\}\)\(\);\s*\n\s*<\/body><\/html>';/;
    if (regex.test(content)) {
        content = content.replace(regex, "\n</body></html>';");
        console.log('Cleaned bad snippet via regex.');
    } else {
        console.warn('Warning: Could not match bad snippet.');
    }
}

// 2. Ensure ensureFirestoreReady is added right after initFirestoreDatabase
if (!content.includes('async function ensureFirestoreReady')) {
    const target = `            } catch (e) {\n                console.warn('[MotorCare Cloud] Firebase init note:', e.message);\n                return false;\n            }\n        }`;
    const replacement = `            } catch (e) {\n                console.warn('[MotorCare Cloud] Firebase init note:', e.message);\n                return false;\n            }\n        }\n\n        async function ensureFirestoreReady(maxWaitMs = 3500) {\n            if (isFirestoreReady && firestoreDb) return firestoreDb;\n            if (typeof initFirestoreDatabase === 'function' && initFirestoreDatabase()) return firestoreDb;\n            const start = Date.now();\n            while (Date.now() - start < maxWaitMs) {\n                if (typeof firebase !== 'undefined') {\n                    if (initFirestoreDatabase()) return firestoreDb;\n                }\n                await new Promise(r => setTimeout(r, 100));\n            }\n            return firestoreDb;\n        }`;
    if (content.includes(target)) {
        content = content.replace(target, replacement);
        console.log('Added ensureFirestoreReady after initFirestoreDatabase.');
    } else {
        console.warn('Could not find target for ensureFirestoreReady.');
    }
}

// 3. Update markAccountAsVerifiedInDB to preserve password and sync to Firestore
const oldMarkAccount = `        function markAccountAsVerifiedInDB(email) {
            if (!email) return;
            const norm = email.trim().toLowerCase();
            const nowIso = new Date().toISOString();

            // 1. تحديث أو إضافة الحساب إلى قاعدة بيانات الحسابات المحلية motorCare_AccountsDB
            try {
                let accounts = [];
                const raw = SafeStorage.getItem('motorCare_AccountsDB');
                if (raw) accounts = JSON.parse(raw);
                const accIdx = accounts.findIndex(a => a.email && a.email.toLowerCase() === norm);
                if (accIdx !== -1) {
                    accounts[accIdx].isVerified = true;
                    accounts[accIdx].emailVerified = true;
                    accounts[accIdx].verified = true;
                    accounts[accIdx].verifiedAt = nowIso;
                } else {
                    accounts.push({
                        id: 'acc_' + Date.now(),
                        name: norm.split('@')[0],
                        email: norm,
                        password: '',
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
                const subIdx = subscribers.findIndex(s => s.email && s.email.toLowerCase() === norm);
                if (subIdx !== -1) {
                    subscribers[subIdx].isVerified = true;
                    subscribers[subIdx].verified = true;
                    subscribers[subIdx].emailVerified = true;
                    subscribers[subIdx].verifiedAt = nowIso;
                } else {
                    subscribers.push({
                        id: 'sub_' + Date.now(),
                        name: norm.split('@')[0],
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
        }`;

const newMarkAccount = `        function markAccountAsVerifiedInDB(email) {
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
        }`;

// Normalize line endings for replacement
const normalizeText = (t) => t.replace(/\r\n/g, '\n');
content = normalizeText(content);

if (content.includes(normalizeText(oldMarkAccount))) {
    content = content.replace(normalizeText(oldMarkAccount), normalizeText(newMarkAccount));
    console.log('Replaced markAccountAsVerifiedInDB successfully.');
} else {
    console.warn('Could not find oldMarkAccount in content.');
}

// 4. Implement checkUrlEmailVerification
if (!content.includes('function checkUrlEmailVerification()')) {
    const targetAfter = normalizeText(newMarkAccount);
    const addition = `\n\n        function checkUrlEmailVerification() {
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
        }`;

    if (content.includes(targetAfter)) {
        content = content.replace(targetAfter, targetAfter + addition);
        console.log('Added checkUrlEmailVerification.');
    } else {
        console.warn('Could not find targetAfter to insert checkUrlEmailVerification.');
    }
}

fs.writeFileSync(path.join(__dirname, 'test_output.html'), content, 'utf8');
console.log('Saved test output.');
