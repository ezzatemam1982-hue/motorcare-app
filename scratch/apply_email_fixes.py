# Patcher for MotorCare email verification and forgot password fixes
import re

def apply_fixes(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update showNotification with deduplication and throttle
    old_show_notif_target = '''        function showNotification(message, type = 'info', duration = 3800) {
            let container = document.getElementById('appToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'appToastContainer';
                container.className = 'fixed top-4 inset-x-0 z-[100] flex flex-col items-center pointer-events-none px-4 space-y-2';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');'''

    new_show_notif = '''        const _recentNotificationsMap = new Map();
        function showNotification(message, type = 'info', duration = 3800) {
            if (!message) return;
            const msgKey = String(message).trim();
            const now = Date.now();

            // منع تكرار نفس الرسالة تماماً إذا عُرضت خلال آخر 3.5 ثوانٍ
            if (_recentNotificationsMap.has(msgKey) && (now - _recentNotificationsMap.get(msgKey) < 3500)) {
                return;
            }
            _recentNotificationsMap.set(msgKey, now);

            // تنظيف الذاكرة دورياً
            if (_recentNotificationsMap.size > 40) {
                for (const [k, t] of _recentNotificationsMap.entries()) {
                    if (now - t > 10000) _recentNotificationsMap.delete(k);
                }
            }

            let container = document.getElementById('appToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'appToastContainer';
                container.className = 'fixed top-4 inset-x-0 z-[100] flex flex-col items-center pointer-events-none px-4 space-y-2';
                document.body.appendChild(container);
            }

            // حد أقصى 3 إشعارات فقط على الشاشة في أي وقت لمنع تهنيج وتجميد المتصفح
            while (container.children.length >= 3) {
                container.firstElementChild.remove();
            }

            const toast = document.createElement('div');'''

    if old_show_notif_target in content:
        content = content.replace(old_show_notif_target, new_show_notif, 1)
        print(f'[{file_path}] showNotification updated.')
    else:
        print(f'[{file_path}] showNotification target not found!')

    # 2. Update applyRemoteVerification
    apply_remote_pattern = re.compile(
        r'function applyRemoteVerification\(email\) \{.*?'
        r'const isEn = \(typeof appState !== [^\n]+;\s*'
        r'showNotification\(isEn \? [^\n]+ : [^\n]+, \d+\);\s*\}',
        re.DOTALL
    )

    new_apply_remote = '''let _lastVerificationNoticeTime = 0;
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
        }'''

    m = apply_remote_pattern.search(content)
    if m:
        content = content[:m.start()] + new_apply_remote + content[m.end():]
        print(f'[{file_path}] applyRemoteVerification updated.')
    else:
        print(f'[{file_path}] applyRemoteVerification regex failed!')

    # 3. Update startLiveVerificationWatcher to stop before calling applyRemoteVerification in onSnapshot
    old_snap = '''                        .onSnapshot((docSnapshot) => {
                            if (docSnapshot && docSnapshot.exists) {
                                const d = docSnapshot.data();
                                if (d && (d.isVerified || d.emailVerified || d.verified)) {
                                    applyRemoteVerification(normEmail);
                                }
                            }
                        }'''
    new_snap = '''                        .onSnapshot((docSnapshot) => {
                            if (docSnapshot && docSnapshot.exists) {
                                const d = docSnapshot.data();
                                if (d && (d.isVerified || d.emailVerified || d.verified)) {
                                    stopLiveVerificationWatcher();
                                    applyRemoteVerification(normEmail);
                                }
                            }
                        }'''
    if old_snap in content:
        content = content.replace(old_snap, new_snap, 1)
        print(f'[{file_path}] startLiveVerificationWatcher onSnapshot updated.')

    # 4. Update submitEmailVerificationCode to stop watcher and update _lastVerificationNoticeTime
    old_submit_code = '''            // التحقق نجح بنسبة 100%
            let profile = {};'''
    new_submit_code = '''            // التحقق نجح بنسبة 100% - إيقاف أي مراقبة حية فوراً
            stopLiveVerificationWatcher();
            _lastVerificationNoticeTime = Date.now();
            let profile = {};'''
    if old_submit_code in content:
        content = content.replace(old_submit_code, new_submit_code, 1)
        print(f'[{file_path}] submitEmailVerificationCode updated.')
    else:
        print(f'[{file_path}] submitEmailVerificationCode target not found!')

    # 5. Update handleForgotPasswordStep1 and Step2
    forgot_pattern = re.compile(
        r'let isSendingForgotOtp = false;\s*'
        r'async function handleForgotPasswordStep1\(event\) \{.*?'
        r'function handleForgotPasswordStep2\(event\) \{.*?'
        r'showNotification\(isEn \? [^\n]+ : [^\n]+, \x27error\x27\);\s*\}\s*\}',
        re.DOTALL
    )

    new_forgot_funcs = '''let isSendingForgotOtp = false;
        async function handleForgotPasswordStep1(event) {
            event.preventDefault();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (isSendingForgotOtp) return;

            const emailInput = document.getElementById('forgotEmailInput');
            const email = (emailInput ? emailInput.value : '').trim().toLowerCase();

            if (!email || !email.includes('@')) {
                showNotification(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.', 'error');
                return;
            }

            // التحقق الشامل من وجود الحساب (قاعدة الحسابات، البروفايل، سجل المشتركين، أو فايرستور)
            let accountFound = false;
            let accountUserName = '';

            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                if (rawAccs) {
                    const accs = JSON.parse(rawAccs);
                    const found = accs.find(a => a.email && a.email.toLowerCase() === email);
                    if (found) {
                        accountFound = true;
                        accountUserName = found.name || '';
                    }
                }
            } catch(e) {}

            if (!accountFound) {
                try {
                    const rawProf = SafeStorage.getItem('motorCare_UserProfile');
                    if (rawProf) {
                        const prof = JSON.parse(rawProf);
                        if (prof.email && prof.email.toLowerCase() === email) {
                            accountFound = true;
                            accountUserName = prof.name || '';
                        }
                    }
                } catch(e) {}
            }

            if (!accountFound) {
                try {
                    const rawSubs = SafeStorage.getItem('motorCare_RegisteredSubscribers');
                    if (rawSubs) {
                        const subs = JSON.parse(rawSubs);
                        const found = subs.find(s => s.email && s.email.toLowerCase() === email);
                        if (found) {
                            accountFound = true;
                            accountUserName = found.name || '';
                        }
                    }
                } catch(e) {}
            }

            if (!accountFound && typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const userKey = email.replace(/[^a-z0-9_]/g, '_');
                    const snap = await firestoreDb.collection('motorcare_users').doc(userKey).get();
                    if (snap && snap.exists) {
                        accountFound = true;
                        accountUserName = snap.data().name || '';
                    }
                } catch(e) {}
            }

            // فحص إضافي: إذا كانت هناك سجلات محلية ولم نجد الحساب إطلاقاً
            const hasLocalRecords = SafeStorage.getItem('motorCare_AccountsDB') || SafeStorage.getItem('motorCare_RegisteredSubscribers');
            if (hasLocalRecords && !accountFound) {
                showNotification(isEn
                    ? 'No account found with this email address.'
                    : 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.', 'error');
                return;
            }

            // توليد OTP مؤقت لاستعادة كلمة المرور
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 15 * 60 * 1000; // 15 دقيقة
            SafeStorage.setItem('motorCare_ForgotPasswordOtp', JSON.stringify({ email, otp, expiresAt, name: accountUserName }));

            // تغيير حالة الزر
            const btn = document.getElementById('forgotStep1SubmitBtn');
            const btnText = document.getElementById('forgotStep1BtnText');
            const btnIcon = document.getElementById('forgotStep1BtnIcon');
            if (btn) btn.disabled = true;
            if (btnText) btnText.innerText = isEn ? 'Sending...' : 'جاري الإرسال...';
            if (btnIcon) btnIcon.className = 'fa-solid fa-spinner fa-spin text-xs';

            isSendingForgotOtp = true;

            // بناء محتوى الإيميل
            const plainBody = `==========================================\\n[ MOTORCARE ] | استعادة كلمة المرور\\n==========================================\\n\\nأهلاً بك يا ${accountUserName || 'عضو MotorCare'}!\\n\\nطلبنا منا إعادة تعيين كلمة المرور الخاصة بحسابك في MotorCare.\\n\\nرمز التحقق لاستعادة كلمة المرور:\\n   [ ${otp} ]\\n(صلاحية الرمز: 15 دقيقة فقط)\\n\\nإذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان.\\n\\nفريق عمل MotorCare\\n==========================================`;

            const htmlBody = `<div dir="rtl" style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);color:#1e293b;text-align:right">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:32px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;width:44px;height:44px;line-height:44px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:14px;font-size:20px;font-weight:900;color:#ffffff;margin-bottom:8px">MC</div>
    <h1 style="margin:0;font-size:22px;font-weight:900">MotorCare</h1>
    <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9">استعادة كلمة المرور</p>
  </div>
  <div style="padding:28px 24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f172a;margin-top:0">رمز إعادة تعيين كلمة المرور</h2>
    <p style="font-size:13px;line-height:1.7;color:#475569">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك المرتبط بالبريد: <strong>${email}</strong></p>
    <div style="background:#f8fafc;border:2px dashed #0284c7;border-radius:16px;padding:20px;text-align:center;margin:22px 0">
      <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px">رمز التحقق (OTP)</div>
      <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:#0284c7;font-family:monospace">${otp}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:6px">الصلاحية: 15 دقيقة فقط</div>
    </div>
    <p style="font-size:12px;color:#94a3b8;line-height:1.6">إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان — كلمة مرورك لن تتغير.</p>
  </div>
  <div style="background:#f1f5f9;padding:18px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">
    <strong>فريق عمل MotorCare</strong> • <span style="direction:ltr;display:inline-block">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            // إرسال عبر Webhook المعتمد مع action: 'SEND_OTP_EMAIL' المتوافق 100% مع سكربت جوجل المنشور حالياً
            const webhookUrl = typeof getAppWebhookUrl === 'function' ? getAppWebhookUrl() : '';
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';

            try {
                if (webhookUrl && webhookUrl.startsWith('http')) {
                    fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'SEND_OTP_EMAIL',
                            subAction: 'PASSWORD_RESET',
                            name: accountUserName || 'عضو MotorCare',
                            email: email,
                            otp: otp,
                            sender: senderEmail,
                            expiresMinutes: 15,
                            timestamp: new Date().toISOString(),
                            subject: `[MotorCare] رمز استعادة كلمة المرور: ${otp}`,
                            body: plainBody,
                            htmlBody: htmlBody
                        })
                    }).catch(err => console.warn('[ForgotPass] webhook error:', err));

                    showNotification(isEn
                        ? `Password reset OTP sent to ${email} 📩 Check inbox & spam.`
                        : `تم إرسال رمز الاسترداد إلى ${email} 📩 تحقق من البريد الوارد والـ Spam`, 'info');
                } else {
                    // وضع المعاينة: إظهار OTP مباشرة
                    showNotification(isEn
                        ? `[Preview] Reset OTP: ${otp} (15 min)`
                        : `[معاينة] رمز الاسترداد: ${otp} (15 دقيقة)`, 'warning', 15000);
                }
            } catch(e) {}

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
            event.preventDefault();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const otpInput = document.getElementById('forgotResetOtpInput');
            const newPassInput = document.getElementById('forgotNewPasswordInput');
            const confirmPassInput = document.getElementById('forgotConfirmPasswordInput');

            const enteredOtp = (otpInput ? otpInput.value.trim() : '');
            const newPass = (newPassInput ? newPassInput.value : '');
            const confirmPass = (confirmPassInput ? confirmPassInput.value : '');

            // التحقق من رمز OTP
            if (!enteredOtp || enteredOtp.length !== 6 || !/^\\d{6}$/.test(enteredOtp)) {
                showNotification(isEn ? 'Enter the 6-digit OTP code.' : 'أدخل رمز التحقق المكون من 6 أرقام.', 'error');
                otpInput?.focus();
                return;
            }

            // التحقق من كلمة المرور
            if (!newPass || newPass.length < 4) {
                showNotification(isEn ? 'Password must be at least 4 characters.' : 'كلمة المرور يجب أن تكون 4 خانات على الأقل.', 'error');
                newPassInput?.focus();
                return;
            }

            if (newPass !== confirmPass) {
                showNotification(isEn ? 'Passwords do not match.' : 'كلمتا المرور غير متطابقتين.', 'error');
                confirmPassInput?.focus();
                return;
            }

            // التحقق من OTP المخزن
            let storedReset = null;
            try {
                const raw = SafeStorage.getItem('motorCare_ForgotPasswordOtp');
                if (raw) storedReset = JSON.parse(raw);
            } catch(e) {}

            if (!storedReset || !storedReset.otp) {
                showNotification(isEn ? 'No reset code found. Please start over.' : 'لم يتم إيجاد رمز الاسترداد. يرجى البدء من جديد.', 'error');
                backToForgotStep1();
                return;
            }

            if (Date.now() > storedReset.expiresAt) {
                showNotification(isEn ? 'Reset code expired. Request a new one.' : 'انتهت صلاحية رمز الاسترداد. اطلب رمزاً جديداً.', 'error');
                SafeStorage.removeItem('motorCare_ForgotPasswordOtp');
                backToForgotStep1();
                return;
            }

            if (enteredOtp !== storedReset.otp) {
                showNotification(isEn ? 'Incorrect OTP code. Please try again.' : 'رمز التحقق غير صحيح. حاول مرة أخرى.', 'error');
                otpInput?.focus();
                return;
            }

            // تحديث كلمة المرور في قاعدة الحسابات المحلية والسحابية
            const targetEmail = storedReset.email;

            // 1. تحديث motorCare_AccountsDB
            try {
                const rawAccs = SafeStorage.getItem('motorCare_AccountsDB');
                let accs = [];
                if (rawAccs) accs = JSON.parse(rawAccs);
                const idx = accs.findIndex(a => a.email && a.email.toLowerCase() === targetEmail);
                if (idx !== -1) {
                    accs[idx].password = newPass;
                } else {
                    accs.push({
                        name: storedReset.name || 'عضو MotorCare',
                        email: targetEmail,
                        password: newPass,
                        isVerified: true
                    });
                }
                SafeStorage.setItem('motorCare_AccountsDB', JSON.stringify(accs));
            } catch(e) {}

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
            } catch(e) {}

            // 3. تحديث في Firestore إن وجد
            if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                try {
                    const userKey = targetEmail.replace(/[^a-z0-9_]/g, '_');
                    firestoreDb.collection('motorcare_users').doc(userKey).set({
                        password: newPass,
                        passwordUpdatedAt: new Date().toISOString()
                    }, { merge: true }).catch(() => {});
                } catch(e) {}
            }

            // حذف OTP بعد الاستخدام الناجح
            SafeStorage.removeItem('motorCare_ForgotPasswordOtp');

            // إغلاق النافذة وتعبئة بيانات الدخول والانتقال لتبويب تسجيل الدخول
            closeForgotPasswordModal();
            if (typeof switchAuthTab === 'function') {
                switchAuthTab('login');
            }
            const authEmail = document.getElementById('authEmail');
            const authPassword = document.getElementById('authPassword');
            if (authEmail) authEmail.value = targetEmail;
            if (authPassword) authPassword.value = newPass;

            showNotification(isEn
                ? 'Password updated successfully! You can now sign in. ✅'
                : 'تم تحديث كلمة المرور بنجاح! تم تجهيز بياناتك للدخول الآن. ✅', 'success', 5000);
        }'''

    m_forgot = forgot_pattern.search(content)
    if m_forgot:
        content = content[:m_forgot.start()] + new_forgot_funcs + content[m_forgot.end():]
        print(f'[{file_path}] forgot password functions updated.')
    else:
        print(f'[{file_path}] forgot password regex failed!')

    # 6. Update reference Google Apps Script
    old_script_action = "if (data.action === 'SEND_OTP_EMAIL') {"
    new_script_action = "if (data.action === 'SEND_OTP_EMAIL' || data.action === 'SEND_PASSWORD_RESET_EMAIL') {"
    if old_script_action in content:
        content = content.replace(old_script_action, new_script_action, 1)
        print(f'[{file_path}] Google Apps Script reference updated.')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

apply_fixes('index.html')
