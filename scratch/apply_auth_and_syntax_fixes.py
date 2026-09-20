import re

def apply_fixes():
    files = ['index.html', 'src/index.html']
    
    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix 1: The broken string literal in sendAccountActivatedSuccessEmail (around line 2300)
        old_broken_plain = """            const webhookUrl = getAppWebhookUrl();
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';
            const clientName = name || 'عضو MotorCare';

أهلاً بك يا ${clientName}!"""

        new_fixed_plain = """            const webhookUrl = getAppWebhookUrl();
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';
            const clientName = name || 'عضو MotorCare';

            const plainBody = `==========================================
[ MOTORCARE ] | تهانينا! تم تفعيل وتوثيق حسابك بنجاح
==========================================

أهلاً بك يا ${clientName}!"""

        if old_broken_plain in content:
            content = content.replace(old_broken_plain, new_fixed_plain, 1)
            print(f'[{file_path}] Fix 1: Fixed missing const plainBody in sendAccountActivatedSuccessEmail.')
        else:
            print(f'[{file_path}] Fix 1: Pattern not matched!')

        # Fix 1b: Upgrade sendAccountActivatedSuccessEmail to use dual webhooks and text/plain
        old_activated_send = """            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'SEND_WELCOME_VERIFICATION_EMAIL',
                            name: clientName,
                            email: email,
                            sender: senderEmail,
                            timestamp: new Date().toISOString(),
                            subject: '[MotorCare] تهانينا! تم تفعيل وتوثيق حسابك بنجاح',
                            body: plainBody,
                            htmlBody: htmlBody
                        })
                    }).catch(() => {});
                } catch(e) {}
            }"""

        new_activated_send = """            const webhookUrls = [];
            if (typeof window !== 'undefined' && window.MOTORCARE_ENV && window.MOTORCARE_ENV.WEBHOOK_URL) {
                webhookUrls.push(window.MOTORCARE_ENV.WEBHOOK_URL);
            }
            const defaultUrl = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec';
            if (!webhookUrls.includes(defaultUrl)) {
                webhookUrls.push(defaultUrl);
            }

            const welcomePayload = {
                action: 'SEND_WELCOME_VERIFICATION_EMAIL',
                name: clientName,
                email: email,
                sender: senderEmail,
                timestamp: new Date().toISOString(),
                subject: '[MotorCare] تهانينا! تم تفعيل وتوثيق حسابك بنجاح',
                body: plainBody,
                htmlBody: htmlBody
            };

            webhookUrls.forEach(url => {
                try {
                    fetch(url, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(welcomePayload)
                    }).catch(() => {});
                } catch(e) {}
            });"""

        if old_activated_send in content:
            content = content.replace(old_activated_send, new_activated_send, 1)
            print(f'[{file_path}] Fix 1b: Upgraded sendAccountActivatedSuccessEmail webhooks.')
        else:
            print(f'[{file_path}] Fix 1b: Pattern not matched!')

        # Fix 2: Clean duplicate openEmailVerificationModal alias lines (around line 2016)
        old_duplicate_aliases = """        window.openEmailVerificationModal = function(forceSend = false) { return openVerificationCodeModal(forceSend); };
        window.openEmailVerificationModal = function(forceSend = false) { return openVerificationCodeModal(forceSend); };
        function openVerificationCodeModal(forceSend = false) {"""

        new_single_alias = """        window.openEmailVerificationModal = function(forceSend = false) { return openVerificationCodeModal(forceSend); };
        function openVerificationCodeModal(forceSend = false) {"""

        if old_duplicate_aliases in content:
            content = content.replace(old_duplicate_aliases, new_single_alias, 1)
            print(f'[{file_path}] Fix 2: Cleaned duplicate openEmailVerificationModal alias.')

        # Fix 3: Upgrade sendRealVerificationOtpEmail to dual webhooks and text/plain
        old_otp_send = """            // إرسال البريد الحقيقي عبر خادم Webhook الرسمي المعتمد للتطبيق
            const webhookUrl = getAppWebhookUrl();
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';

            const finishSend = () => {
                isSendingOtpEmail = false;
                startOtpCooldown(60);
            };

            if (webhookUrl && webhookUrl.startsWith('http')) {
                fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
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
                    })
                }).catch(err => console.warn('OTP webhook send error:', err))
                  .finally(() => {
                      finishSend();
                  });

                showNotification(isEn 
                    ? `Verification code (OTP) sent to ${email} 📩 Check inbox & spam.` 
                    : `تم إرسال رمز التحقق ورابط التفعيل إلى بريدك ${email} 📩 يرجى التحقق من الوارد والـ Spam`, 'info');
            } else {"""

        new_otp_send = """            // إرسال البريد الحقيقي عبر خوادم Webhook المعتمدة للتطبيق
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';

            const finishSend = () => {
                isSendingOtpEmail = false;
                startOtpCooldown(60);
            };

            const webhookUrls = [];
            if (typeof window !== 'undefined' && window.MOTORCARE_ENV && window.MOTORCARE_ENV.WEBHOOK_URL) {
                webhookUrls.push(window.MOTORCARE_ENV.WEBHOOK_URL);
            }
            const defaultUrl = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec';
            if (!webhookUrls.includes(defaultUrl)) {
                webhookUrls.push(defaultUrl);
            }

            console.log(`[MotorCare] Verification OTP for ${email}: ${otp}`);

            const otpPayload = {
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

            webhookUrls.forEach(url => {
                try {
                    fetch(url, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(otpPayload)
                    }).catch(err => console.warn('OTP webhook send note:', err));
                } catch(err) {}
            });

            finishSend();

            showNotification(isEn 
                ? `Verification code (OTP) sent to ${email} 📩 Check inbox & spam.` 
                : `تم إرسال رمز التحقق ورابط التفعيل إلى بريدك ${email} 📩 يرجى التحقق من الوارد والـ Spam`, 'info', 6000);

            if (false) {"""

        if old_otp_send in content:
            content = content.replace(old_otp_send, new_otp_send, 1)
            print(f'[{file_path}] Fix 3: Upgraded sendRealVerificationOtpEmail with dual webhooks and text/plain.')
        else:
            print(f'[{file_path}] Fix 3: Pattern not matched!')

        # Fix 4: Ensure landing and mainApp toggles in handleAuthSubmit are 100% resilient
        old_landing_hide = """                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) landing.style.display = 'none';
                if (mainApp) mainApp.style.display = 'flex';"""

        new_landing_hide = """                const landing = document.getElementById('landingScreen');
                const mainApp = document.getElementById('mainAppContainer');
                if (landing) {
                    landing.style.setProperty('display', 'none', 'important');
                    landing.classList.add('hidden');
                }
                if (mainApp) {
                    mainApp.style.setProperty('display', 'flex', 'important');
                    mainApp.classList.remove('hidden');
                }"""

        if old_landing_hide in content:
            content = content.replace(old_landing_hide, new_landing_hide)
            print(f'[{file_path}] Fix 4: Upgraded landing and mainApp visibility toggles.')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

apply_fixes()
