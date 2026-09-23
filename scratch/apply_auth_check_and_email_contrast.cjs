const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. إصلاح تباين ولون خط "مرحباً بك في MotorCare" في قالب إيميل الترحيب
    const oldEmailTitle = '<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">مرحباً بك في MotorCare</h1>';
    const newEmailTitle = '<h1 style="margin: 8px 0 0 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff !important; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">مرحباً بك في MotorCare</h1>';
    
    if (content.includes(oldEmailTitle)) {
        content = content.replace(oldEmailTitle, newEmailTitle);
        console.log(`[SUCCESS] Updated welcome email h1 title color in ${filePath}`);
    } else {
        console.log(`[NOTE] Welcome email h1 title already updated or pattern differs in ${filePath}`);
    }

    // كما نتأكد من لون السطر الفرعي "تم تفعيل وتوثيق حسابك بنجاح ✓"
    const oldSubtext = 'color: #38bdf8; font-weight: 700;">تم تفعيل وتوثيق حسابك بنجاح ✓</p>';
    const newSubtext = 'color: #38bdf8 !important; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.4);">تم تفعيل وتوثيق حسابك بنجاح ✓</p>';
    if (content.includes(oldSubtext)) {
        content = content.replace(oldSubtext, newSubtext);
        console.log(`[SUCCESS] Updated welcome email subtext color in ${filePath}`);
    }

    // 2. تحديث دالة handleAuthSubmit لمنع التسجيل المكرر وفحص الحسابات محلياً وسحابياً في كلا الوضعين
    const targetSearch = `            // قراءة قاعدة الحسابات المسجلة
            let accounts = [];
            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) accounts = JSON.parse(rawAccs);
            } catch (err) { }

            const normEmail = email;
            let existingAccount = accounts.find(a => a.email && a.email.toLowerCase() === normEmail);

            // فحص إضافي في سجل المشتركين إن لم يكن في قاعدة الحسابات المحلية
            if (!existingAccount) {
                try {
                    const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                    if (rawSubs) {
                        const subs = JSON.parse(rawSubs);
                        const s = subs.find(sub => sub.email && sub.email.toLowerCase() === normEmail);
                        if (s) {
                            existingAccount = {
                                id: 'acc_' + Date.now(),
                                name: s.name || normEmail.split('@')[0],
                                email: normEmail,
                                password: s.password || password,
                                provider: s.provider || 'email',
                                isVerified: !!(s.isVerified || s.emailVerified),
                                isRegistered: true
                            };
                            accounts.push(existingAccount);
                            SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                        }
                    }
                } catch (err) { }
            }`;

    const newAuthSearch = `            // 1. قراءة وفحص قاعدة الحسابات المحلية
            let accounts = [];
            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) accounts = JSON.parse(rawAccs);
            } catch (err) { }

            const normEmail = email;
            let existingAccount = accounts.find(a => a.email && a.email.toLowerCase() === normEmail);

            // 2. فحص إضافي في سجل المشتركين المعتمدين
            if (!existingAccount) {
                try {
                    const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                    if (rawSubs) {
                        const subs = JSON.parse(rawSubs);
                        const s = subs.find(sub => sub.email && sub.email.toLowerCase() === normEmail);
                        if (s) {
                            existingAccount = {
                                id: s.id || ('acc_' + Date.now()),
                                name: s.name || normEmail.split('@')[0],
                                email: normEmail,
                                password: s.password || password,
                                provider: s.provider || 'email',
                                isVerified: !!(s.isVerified || s.emailVerified),
                                isRegistered: true
                            };
                            accounts.push(existingAccount);
                            SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                        }
                    }
                } catch (err) { }
            }

            // 3. فحص إضافي في ملف الحساب النشط motorCare_UserProfile
            if (!existingAccount) {
                try {
                    const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProf) {
                        const prof = JSON.parse(rawProf);
                        if (prof && prof.email && prof.email.toLowerCase() === normEmail && prof.isRegistered) {
                            existingAccount = {
                                id: prof.id || ('acc_' + Date.now()),
                                name: prof.name || normEmail.split('@')[0],
                                email: normEmail,
                                password: prof.password || password,
                                provider: prof.provider || 'email',
                                isVerified: !!(prof.isVerified || prof.emailVerified),
                                isRegistered: true
                            };
                            accounts.push(existingAccount);
                            SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                        }
                    }
                } catch (err) { }
            }

            // 4. فحص إضافي في سجل إرسال إيميلات الترحيب motorCare_WelcomeEmailsSent
            if (!existingAccount) {
                try {
                    const rawSent = SafeStorage.getItem('motorCare_WelcomeEmailsSent');
                    if (rawSent) {
                        const sentList = JSON.parse(rawSent);
                        if (Array.isArray(sentList) && sentList.includes(normEmail)) {
                            existingAccount = {
                                id: 'acc_' + Date.now(),
                                name: normEmail.split('@')[0],
                                email: normEmail,
                                password: '',
                                provider: 'email',
                                isVerified: true,
                                isRegistered: true
                            };
                            accounts.push(existingAccount);
                            SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                        }
                    }
                } catch (err) { }
            }

            // 5. فحص سحابي سريع في Firestore (لمنع تكرار التسجيل من أي متصفح خفي أو جهاز جديد)
            if (!existingAccount && typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const userKey = normEmail.replace(/[^a-z0-9_]/g, '_');
                    const snap = await Promise.race([
                        firestoreDb.collection('motorcare_users').doc(userKey).get(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                    ]);
                    if (snap && snap.exists) {
                        const d = snap.data() || {};
                        existingAccount = {
                            id: d.id || ('acc_' + Date.now()),
                            name: d.name || normEmail.split('@')[0],
                            email: normEmail,
                            password: d.password || '',
                            provider: d.provider || 'email',
                            isVerified: !!(d.isVerified || d.emailVerified),
                            isRegistered: true
                        };
                        accounts.push(existingAccount);
                        SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                    }
                } catch (err) {
                    console.warn('[MotorCare Auth] Firestore user check notice:', err);
                }
            }`;

    // Normalize CRLF to LF for matching
    const contentNormalized = content.replace(/\r\n/g, '\n');
    const targetNormalized = targetSearch.replace(/\r\n/g, '\n');
    const newAuthNormalized = newAuthSearch.replace(/\r\n/g, '\n');

    if (contentNormalized.includes(targetNormalized)) {
        content = contentNormalized.replace(targetNormalized, newAuthNormalized);
        console.log(`[SUCCESS] Upgraded account existence check in ${filePath}`);
    } else {
        // Try matching with slightly flexible spaces
        console.log(`[WARN] Could not find exact targetSearch block in ${filePath}`);
    }

    // 3. تحديث رسالة منع التسجيل المكرر والتأكد من إيقاف المؤشر فوراً
    const oldRegBlocked = `                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn
                                ? 'This email is already registered! Please switch to the "Sign In" tab to log in with your password.'
                                : 'هذا البريد الإلكتروني مسجل مسبقاً! يرجى التحويل لتبويب "تسجيل الدخول" وإدخال كلمة المرور.',
                            'warning', 5000
                        );
                    }
                    if (typeof switchAuthTab === 'function') switchAuthTab('login');
                    document.getElementById('authPassword')?.focus();
                    return;`;

    const newRegBlocked = `                    _isSubmittingAuth = false;
                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn
                                ? '⚠️ This email is already registered! Switched to "Sign In" tab to log in with your password.'
                                : '⚠️ هذا البريد الإلكتروني مسجل مسبقاً بالفعل! تم تحويلك لتبويب "تسجيل الدخول" لإدخال كلمة المرور.',
                            'warning', 6000
                        );
                    }
                    if (typeof switchAuthTab === 'function') switchAuthTab('login');
                    const authEmailInp = document.getElementById('authEmail');
                    if (authEmailInp) authEmailInp.value = normEmail;
                    const pwdInp = document.getElementById('authPassword');
                    if (pwdInp) {
                        pwdInp.value = '';
                        pwdInp.focus();
                    }
                    return;`;

    const oldRegNorm = oldRegBlocked.replace(/\r\n/g, '\n');
    const newRegNorm = newRegBlocked.replace(/\r\n/g, '\n');
    const currentNorm = content.replace(/\r\n/g, '\n');

    if (currentNorm.includes(oldRegNorm)) {
        content = currentNorm.replace(oldRegNorm, newRegNorm);
        console.log(`[SUCCESS] Upgraded duplicate registration blocker in ${filePath}`);
    }

    // 4. عند إنشاء حساب جديد لأول مرة: رفعه فوراً إلى Firestore وسجل المشتركين
    const oldNewAccCode = `                accounts.push(newAccount);
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));`;

    const newNewAccCode = `                accounts.push(newAccount);
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));

                // تسجيل الحساب سحابياً في Firestore لمنع تكراره من أي متصفح أو جهاز آخر
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    try {
                        const userKey = normEmail.replace(/[^a-z0-9_]/g, '_');
                        firestoreDb.collection('motorcare_users').doc(userKey).set({
                            id: newAccount.id,
                            name: newAccount.name,
                            email: normEmail,
                            isRegistered: true,
                            isVerified: false,
                            registeredAt: nowIso
                        }, { merge: true }).catch(() => { });
                    } catch(e) {}
                }

                // تسجيل الحساب في سجل المشتركين المعتمدين
                try {
                    let subs = [];
                    const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                    if (rawSubs) subs = JSON.parse(rawSubs);
                    if (!subs.some(s => s.email && s.email.toLowerCase() === normEmail)) {
                        subs.push({ ...newAccount });
                        SafeStorage.setItem('motorCare_RegisteredSubscribers', JSON.stringify(subs));
                    }
                } catch (e) { }`;

    const oldNewAccNorm = oldNewAccCode.replace(/\r\n/g, '\n');
    const newNewAccNorm = newNewAccCode.replace(/\r\n/g, '\n');
    const curNorm2 = content.replace(/\r\n/g, '\n');

    if (curNorm2.includes(oldNewAccNorm)) {
        content = curNorm2.replace(oldNewAccNorm, newNewAccNorm);
        console.log(`[SUCCESS] Added instant Firestore & Subscriber sync on register in ${filePath}`);
    }

    // Revert to CRLF if file was CRLF originally
    const hasCRLF = fs.readFileSync(filePath, 'utf8').includes('\r\n');
    if (hasCRLF) {
        content = content.replace(/\r?\n/g, '\r\n');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[DONE] Finished updating ${filePath}`);
}

updateFile(path.join(__dirname, '..', 'index.html'));
updateFile(path.join(__dirname, '..', 'src', 'index.html'));
