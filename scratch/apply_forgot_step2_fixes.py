import re

def update_files():
    for file_path in ['index.html', 'src/index.html']:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Update forgotStep2Container HTML to:
        #    - Add password visibility toggle (eye icon + lock) to forgotConfirmPasswordInput
        #    - Add resend code button (إعادة إرسال الرمز)
        old_step2_html = '''                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">رمز التحقق (OTP)</label>
                        <input type="text" id="forgotResetOtpInput" maxlength="6" required placeholder="000000" class="w-full text-center tracking-[0.25em] font-mono text-base font-black bg-slate-50 dark:bg-slate-800 border border-sky-500 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" inputmode="numeric">
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">كلمة المرور الجديدة (4 خانات على الأقل)</label>
                        <div class="relative">
                            <input type="password" id="forgotNewPasswordInput" minlength="4" required placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 pe-8 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                            <i class="fa-solid fa-lock absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-xs"></i>
                            <button type="button" onclick="togglePasswordVisibility('forgotNewPasswordInput', 'forgotNewPassEye')" class="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-sky-500 cursor-pointer">
                                <i class="fa-solid fa-eye" id="forgotNewPassEye"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                        <input type="password" id="forgotConfirmPasswordInput" minlength="4" required placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                    </div>'''

        new_step2_html = '''                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">رمز التحقق (OTP)</label>
                        <input type="text" id="forgotResetOtpInput" maxlength="6" required placeholder="000000" class="w-full text-center tracking-[0.25em] font-mono text-base font-black bg-slate-50 dark:bg-slate-800 border border-sky-500 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" inputmode="numeric">
                        <div class="flex items-center justify-between text-xs px-1 pt-1.5">
                            <span class="text-[10px] text-slate-400 font-medium">صلاحية الرمز: 15 دقيقة</span>
                            <button type="button" id="forgotResendOtpBtn" onclick="handleResendForgotOtp()" class="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer transition-all flex items-center gap-1">
                                <i class="fa-solid fa-rotate-right ml-1 text-[11px]" id="forgotResendIcon"></i>
                                <span id="forgotResendText">إعادة إرسال الرمز</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">كلمة المرور الجديدة (4 خانات على الأقل)</label>
                        <div class="relative">
                            <input type="password" id="forgotNewPasswordInput" minlength="4" required placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 pe-8 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                            <i class="fa-solid fa-lock absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-xs"></i>
                            <button type="button" onclick="togglePasswordVisibility('forgotNewPasswordInput', 'forgotNewPassEye')" class="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-sky-500 cursor-pointer" title="إظهار / إخفاء كلمة المرور">
                                <i class="fa-solid fa-eye" id="forgotNewPassEye"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                        <div class="relative">
                            <input type="password" id="forgotConfirmPasswordInput" minlength="4" required placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 ps-8 pe-8 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500">
                            <i class="fa-solid fa-lock absolute inset-y-0 start-0 flex items-center ps-2.5 text-slate-400 text-xs"></i>
                            <button type="button" onclick="togglePasswordVisibility('forgotConfirmPasswordInput', 'forgotConfirmPassEye')" class="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-sky-500 cursor-pointer" title="إظهار / إخفاء كلمة المرور">
                                <i class="fa-solid fa-eye" id="forgotConfirmPassEye"></i>
                            </button>
                        </div>
                    </div>'''

        if old_step2_html in content:
            content = content.replace(old_step2_html, new_step2_html, 1)
            print(f'[{file_path}] Step 2 HTML updated with confirmation eye toggle and resend button.')
        else:
            print(f'[{file_path}] Step 2 HTML target not matched!')

        # 2. Add sendForgotPasswordEmail, handleResendForgotOtp, startForgotOtpCooldown and update handleForgotPasswordStep1
        old_step1_end_pattern = re.compile(
            r'let isSendingForgotOtp = false;\s*'
            r'async function handleForgotPasswordStep1\(event\) \{.*?'
            r'const otpInput = document\.getElementById\(\'forgotResetOtpInput\'\);\s*'
            r'if \(otpInput\) otpInput\.focus\(\);\s*\}',
            re.DOTALL
        )

        new_step1_and_resend = '''let isSendingForgotOtp = false;
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

            const plainBody = `==========================================\\n[ MOTORCARE ] | استعادة كلمة المرور\\n==========================================\\n\\nأهلاً بك يا ${clientName}!\\n\\nرمز التحقق لاستعادة وتعيين كلمة المرور:\\n   [ ${otp} ]\\n(صلاحية الرمز: 15 دقيقة فقط)\\n\\nإذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.\\n\\nفريق عمل MotorCare\\n==========================================`;

            const htmlBody = `<div dir="rtl" style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.05);color:#1e293b;text-align:right">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:32px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;width:44px;height:44px;line-height:44px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:14px;font-size:20px;font-weight:900;color:#ffffff;margin-bottom:8px">MC</div>
    <h1 style="margin:0;font-size:22px;font-weight:900">MotorCare</h1>
    <p style="margin:6px 0 0 0;font-size:13px;opacity:0.9">استعادة وتعيين كلمة المرور</p>
  </div>
  <div style="padding:28px 24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f172a;margin-top:0">أهلاً بك يا ${clientName}!</h2>
    <p style="font-size:13px;line-height:1.7;color:#475569">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك المسجل (${email}):</p>
    <div style="background:#f8fafc;border:2px dashed #0284c7;border-radius:16px;padding:20px;text-align:center;margin:22px 0">
      <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px">رمز التحقق لاستعادة كلمة المرور (OTP)</div>
      <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:#0284c7;font-family:monospace">${otp}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:6px">الصلاحية: 15 دقيقة فقط</div>
    </div>
    <p style="font-size:12px;color:#94a3b8;line-height:1.6">إذا لم تطلب هذا، يمكنك تجاهل هذا البريد بأمان — كلمة مرورك الحالية لن تتغير.</p>
  </div>
  <div style="background:#f1f5f9;padding:18px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">
    <strong>فريق عمل MotorCare</strong> • <span style="direction:ltr;display:inline-block">motorcare.auto@gmail.com</span>
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

            const webhookUrls = [];
            if (typeof window !== 'undefined' && window.MOTORCARE_ENV && window.MOTORCARE_ENV.WEBHOOK_URL) {
                webhookUrls.push(window.MOTORCARE_ENV.WEBHOOK_URL);
            }
            const defaultUrl = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec';
            if (!webhookUrls.includes(defaultUrl)) {
                webhookUrls.push(defaultUrl);
            }

            console.log(`[MotorCare] Password Reset OTP for ${email}: ${otp}`);

            webhookUrls.forEach(url => {
                try {
                    fetch(url, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload)
                    }).catch(e => console.warn('[ForgotPass] webhook fetch note:', e));
                } catch(err) {}
            });

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
            event.preventDefault();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (isSendingForgotOtp) return;

            const emailInput = document.getElementById('forgotEmailInput');
            const email = (emailInput ? emailInput.value : '').trim().toLowerCase();

            if (!email || !email.includes('@')) {
                showNotification(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.', 'error');
                return;
            }

            // التحقق الشامل من وجود الحساب
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

            const hasLocalRecords = SafeStorage.getItem('motorCare_AccountsDB') || SafeStorage.getItem('motorCare_RegisteredSubscribers');
            if (hasLocalRecords && !accountFound) {
                showNotification(isEn
                    ? 'No account found with this email address.'
                    : 'لا يوجد حساب مسجل بهذا البريد الإلكتروني.', 'error');
                return;
            }

            // توليد OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 15 * 60 * 1000;
            SafeStorage.setItem('motorCare_ForgotPasswordOtp', JSON.stringify({ email, otp, expiresAt, name: accountUserName }));

            // تغيير حالة الزر
            const btn = document.getElementById('forgotStep1SubmitBtn');
            const btnText = document.getElementById('forgotStep1BtnText');
            const btnIcon = document.getElementById('forgotStep1BtnIcon');
            if (btn) btn.disabled = true;
            if (btnText) btnText.innerText = isEn ? 'Sending...' : 'جاري الإرسال...';
            if (btnIcon) btnIcon.className = 'fa-solid fa-spinner fa-spin text-xs';

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
                    ? `A 6-digit OTP was sent to <strong class="text-sky-600">${email}</strong>. Enter it below to set a new password.`
                    : `تم إرسال رمز OTP مكون من 6 أرقام إلى <strong class="text-sky-600">${email}</strong>. أدخله أدناه لتعيين كلمة مرور جديدة.`;
            }
            const step1 = document.getElementById('forgotStep1Container');
            const step2 = document.getElementById('forgotStep2Container');
            if (step1) step1.classList.add('hidden');
            if (step2) step2.classList.remove('hidden');
            const otpInput = document.getElementById('forgotResetOtpInput');
            if (otpInput) otpInput.focus();
        }'''

        m = old_step1_end_pattern.search(content)
        if m:
            content = content[:m.start()] + new_step1_and_resend + content[m.end():]
            print(f'[{file_path}] Step 1 & Resend functions updated.')
        else:
            print(f'[{file_path}] Step 1 pattern not matched!')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

update_files()
