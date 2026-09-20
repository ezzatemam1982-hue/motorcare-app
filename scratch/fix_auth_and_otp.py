import re

def apply_auth_and_otp_fixes():
    for file_path in ['index.html', 'src/index.html']:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Remove duplicate dummy handleAuthSubmit from <head> (around line 262)
        old_head_auth = '''        function handleAuthSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const email = (document.getElementById('authEmail')?.value || '').trim();
            const password = document.getElementById('authPassword')?.value || '';
            const fullName = (document.getElementById('authFullName')?.value || '').trim();

            if (!email || !password) {
                handleGuestEntry();
                return;
            }

            let profile = {
                name: fullName || email.split('@')[0],
                email: email,
                provider: 'email',
                isRegistered: true,
                isVerified: true
            };

            SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
            enterMainApp();
            if (typeof showNotification === 'function') {
                showNotification(isEn ? `Welcome, ${profile.name}!` : `أهلاً بك، ${profile.name}!`, 'success');
            }
        }'''

        new_head_auth = '''        // handleAuthSubmit is fully implemented and handled in the main application script below'''

        if old_head_auth in content:
            content = content.replace(old_head_auth, new_head_auth, 1)
            print(f'[{file_path}] Duplicate head handleAuthSubmit removed.')
        else:
            print(f'[{file_path}] Duplicate head handleAuthSubmit not found (already clean).')

        # 2. Fix the authSubmitBtn inline onclick to avoid double-triggering
        old_btn_submit = 'onclick="if(typeof handleAuthSubmit===\'function\'){handleAuthSubmit(event);}else{enterMainApp();}"'
        new_btn_submit = ''
        if old_btn_submit in content:
            content = content.replace(old_btn_submit, new_btn_submit, 1)
            print(f'[{file_path}] authSubmitBtn redundant double-trigger onclick removed.')

        # 3. Fix sendRealVerificationOtpEmail to use dual webhooks and text/plain
        old_send_real_otp_pattern = re.compile(
            r'function sendRealVerificationOtpEmail\(isResend = false\) \{.*?'
            r'const webhookUrl = getAppWebhookUrl\(\);\s*'
            r'const senderEmail = typeof getAppSenderEmail === [^\n]+;\s*'
            r'const finishSend = \(\) => \{.*?'
            r'if \(webhookUrl && webhookUrl\.startsWith\(\x27http\x27\)\) \{.*?'
            r'showNotification\(isEn \? `Verification code \(OTP\) sent to \$\{email\}[^\n]+ : [^\n]+, \x27info\x27\);\s*'
            r'\} else \{.*?'
            r'const testHint = document\.getElementById\(\x27otpDevHint\x27\);',
            re.DOTALL
        )

        new_send_real_otp_block = '''function sendRealVerificationOtpEmail(isResend = false) {
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

            const email = profile.email || '';
            const name = profile.name || (isEn ? 'Member' : 'عضو MotorCare');

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
  <div style="background: linear-gradient(135deg, #0f172a 0%, #0284c7 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.25); border-radius: 14px; font-size: 20px; font-weight: 900; color: #ffffff; margin-bottom: 8px;">MC</div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">MotorCare</h1>
    <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 600;">منصة العناية المتكاملة بسيارتك</p>
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

            // إرسال البريد الحقيقي عبر خوادم الـ Webhook المعتمدة
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';
            const finishSend = () => {
                isSendingOtpEmail = false;
                startOtpCooldown(60);
            };

            const payload = {
                action: 'SEND_OTP_EMAIL',
                name: name,
                email: email,
                otp: otp,
                verifyUrl: verifyUrl,
                sender: senderEmail,
                expiresMinutes: 15,
                timestamp: new Date().toISOString(),
                subject: `[MotorCare] رمز تفعيل وتوثيق حسابك: ${otp}`,
                body: plainBody,
                htmlBody: htmlBody
            };

            const webhookUrls = [];
            if (typeof window !== 'undefined' && window.MOTORCARE_ENV && window.MOTORCARE_ENV.WEBHOOK_URL) {
                webhookUrls.push(window.MOTORCARE_ENV.WEBHOOK_URL);
            }
            const defaultUrl = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec';
            if (!webhookUrls.includes(defaultUrl)) {
                webhookUrls.push(defaultUrl);
            }

            console.log(`[MotorCare] Active Verification OTP for ${email}: ${otp}`);

            webhookUrls.forEach(url => {
                try {
                    fetch(url, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload)
                    }).catch(err => console.warn('OTP webhook send note:', err));
                } catch(err) {}
            });

            finishSend();

            showNotification(isEn 
                ? `Verification code (OTP) sent to ${email} 📩 Check inbox & spam.` 
                : `تم إرسال رمز التحقق ورابط التفعيل إلى بريدك ${email} 📩 يرجى التحقق من الوارد والـ Spam`, 'info', 6000);

            const testHint = document.getElementById('otpDevHint');'''

        m_otp = old_send_real_otp_pattern.search(content)
        if m_otp:
            content = content[:m_otp.start()] + new_send_real_otp_block + content[m_otp.end():]
            print(f'[{file_path}] sendRealVerificationOtpEmail upgraded with dual webhooks.')
        else:
            print(f'[{file_path}] sendRealVerificationOtpEmail pattern not matched!')

        # 4. Make openEmailVerificationModal alias and openVerificationCodeModal accessible
        if 'window.openEmailVerificationModal = openVerificationCodeModal;' not in content:
            content = content.replace(
                'function openVerificationCodeModal(forceSend = false) {',
                'window.openEmailVerificationModal = function(forceSend = false) { return openVerificationCodeModal(forceSend); };\n        function openVerificationCodeModal(forceSend = false) {',
                1
            )
            print(f'[{file_path}] openEmailVerificationModal alias registered.')

        # 5. Overhaul handleAuthSubmit (around line 7177)
        old_handle_auth_pattern = re.compile(
            r'function handleAuthSubmit\(e\) \{.*?'
            r'// إرسال رمز التحقق OTP للحساب الجديد\s*'
            r'setTimeout\(\(\) => \{.*?'
            r'\}\, 800\);\s*\}\s*\}',
            re.DOTALL
        )

        new_handle_auth = '''let _isSubmittingAuth = false;
        async function handleAuthSubmit(e) {
            if (e && e.preventDefault) e.preventDefault();
            if (_isSubmittingAuth) return;
            _isSubmittingAuth = true;
            setTimeout(() => { _isSubmittingAuth = false; }, 1000);

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const email = (document.getElementById('authEmail')?.value || '').trim().toLowerCase();
            const password = document.getElementById('authPassword')?.value || '';
            const fullName = (document.getElementById('authFullName')?.value || '').trim();

            if (!email || !password) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter your email and password, or tap "Guest Explorer" below!' : 'يرجى إدخال البريد وكلمة المرور، أو اضغط "الدخول كزائر" بالأسفل!', 'info');
                }
                const emailInput = document.getElementById('authEmail');
                if (emailInput) emailInput.focus();
                return;
            }

            if (!email.includes('@') || !email.includes('.')) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.', 'error');
                }
                return;
            }

            if (password.length < 4) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Password must be at least 4 characters.' : 'يجب أن تكون كلمة المرور 4 أحرف على الأقل.', 'error');
                }
                return;
            }

            // تحديد وضع العملية: تسجيل دخول أم إنشاء حساب جديد
            const nameContainer = document.getElementById('nameFieldContainer');
            const isRegisterMode = nameContainer && !nameContainer.classList.contains('hidden');

            // قراءة قاعدة الحسابات المسجلة
            let accounts = [];
            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) accounts = JSON.parse(rawAccs);
            } catch(err) {}

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
                } catch(err) {}
            }

            if (!isRegisterMode) {
                // ===== وضع تسجيل الدخول =====
                if (!existingAccount) {
                    // فحص سحابي سريع في Firestore قبل رفض الدخول
                    let firestoreFound = false;
                    if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                        try {
                            const userKey = normEmail.replace(/[^a-z0-9_]/g, '_');
                            const snap = await firestoreDb.collection('motorcare_users').doc(userKey).get();
                            if (snap && snap.exists) {
                                const d = snap.data();
                                existingAccount = {
                                    id: 'acc_' + Date.now(),
                                    name: d.name || normEmail.split('@')[0],
                                    email: normEmail,
                                    password: d.password || password,
                                    provider: d.provider || 'email',
                                    isVerified: !!(d.isVerified || d.emailVerified),
                                    isRegistered: true
                                };
                                accounts.push(existingAccount);
                                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));
                                firestoreFound = true;
                            }
                        } catch(err) {}
                    }

                    if (!existingAccount) {
                        // الحساب غير مسجل إطلاقاً
                        if (typeof showNotification === 'function') {
                            showNotification(
                                isEn
                                    ? 'No account found with this email. Switched to "New Account" to create one! 📝'
                                    : 'لا يوجد حساب مسجل بهذا البريد. تم تحويلك لتبويب "حساب جديد" لإنشائه فوراً! 📝',
                                'warning', 5000
                            );
                        }
                        if (typeof switchAuthTab === 'function') switchAuthTab('register');
                        const nameInp = document.getElementById('authFullName');
                        if (nameInp) nameInp.focus();
                        return;
                    }
                }

                // التحقق من كلمة المرور
                if (existingAccount.password && existingAccount.password.length > 0 && existingAccount.password !== password) {
                    if (typeof showNotification === 'function') {
                        showNotification(
                            isEn ? 'Incorrect password. Please try again or click "Forgot password?".' : 'كلمة المرور غير صحيحة. يرجى المحاولة مجدداً أو النقر على "نسيت كلمة المرور؟".',
                            'error', 5000
                        );
                    }
                    document.getElementById('authPassword')?.focus();
                    return;
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
                if (landing) landing.style.display = 'none';
                if (mainApp) mainApp.style.display = 'flex';

                if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
                if (typeof renderDashboard === 'function') renderDashboard();
                if (typeof initUserCloudSync === 'function') initUserCloudSync();
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? `Welcome back, ${profile.name}! 👋` : `أهلاً بعودتك يا ${profile.name}! 👋`, 'success');
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
                // ===== وضع إنشاء حساب جديد =====
                if (existingAccount) {
                    // الحساب موجود مسبقاً
                    if (existingAccount.password === password) {
                        // كلمة المرور مطابقة، سجله دخول فوراً دون إرباك
                        const profile = { ...existingAccount, lastLoginAt: new Date().toISOString() };
                        SafeStorage.setItem('motorCare_UserProfile', JSON.stringify(profile));
                        SafeStorage.setItem('motorCare_LoggedIn', 'true');
                        const landing = document.getElementById('landingScreen');
                        const mainApp = document.getElementById('mainAppContainer');
                        if (landing) landing.style.display = 'none';
                        if (mainApp) mainApp.style.display = 'flex';
                        if (typeof updateHeaderUserProfile === 'function') updateHeaderUserProfile();
                        if (typeof renderDashboard === 'function') renderDashboard();
                        if (typeof initUserCloudSync === 'function') initUserCloudSync();
                        if (typeof showNotification === 'function') {
                            showNotification(isEn ? `Welcome back, ${profile.name}! 👋` : `أهلاً بعودتك يا ${profile.name}! تم تسجيل الدخول بنجاح 👋`, 'success');
                        }
                        return;
                    } else {
                        if (typeof showNotification === 'function') {
                            showNotification(
                                isEn
                                    ? 'This email is already registered! Please sign in with your password.'
                                    : 'هذا البريد الإلكتروني مسجل مسبقاً! يرجى إدخال كلمة المرور لتسجيل الدخول.',
                                'warning', 5000
                            );
                        }
                        if (typeof switchAuthTab === 'function') switchAuthTab('login');
                        document.getElementById('authPassword')?.focus();
                        return;
                    }
                }

                // إنشاء الحساب الجديد
                const nowIso = new Date().toISOString();
                const newAccount = {
                    id: 'acc_' + Date.now(),
                    name: fullName || email.split('@')[0],
                    email: normEmail,
                    password: password,
                    provider: 'email',
                    isRegistered: true,
                    isVerified: false,
                    emailVerified: false,
                    welcomeEmailSent: false,
                    registeredAt: nowIso
                };

                accounts.push(newAccount);
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accounts));

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
                if (landing) landing.style.display = 'none';
                if (mainApp) mainApp.style.display = 'flex';

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
                }, 500);
            }
        }'''

        m_auth = old_handle_auth_pattern.search(content)
        if m_auth:
            content = content[:m_auth.start()] + new_handle_auth + content[m_auth.end():]
            print(f'[{file_path}] handleAuthSubmit completely overhauled with auto-discovery and proper OTP popup.')
        else:
            print(f'[{file_path}] handleAuthSubmit pattern not matched!')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

apply_auth_and_otp_fixes()
