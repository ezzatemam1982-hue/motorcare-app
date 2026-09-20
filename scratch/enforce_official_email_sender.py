# -*- coding: utf-8 -*-
"""
Removes ezzat.emam1982@gmail.com and old webhook AKfycbw9 entirely.
Enforces single official webhook AKfycbwv and sender motorcare.auto@gmail.com exclusively.
"""

def update_app_config():
    old_wh = 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec'
    new_wh = 'https://script.google.com/macros/s/AKfycbwvSY5bjKSPoC59wi-fYg-pqFq8KrAjZMoRyujKx7NEmYsWMxCx1oZ6c_R3LaoHiDNc/exec'
    
    files = ['app_config.js', 'src/app_config.js', '.env', '.env.example']
    for fpath in files:
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            if old_wh in content:
                content = content.replace(old_wh, new_wh)
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'[{fpath}] Updated WEBHOOK_URL to official motorcare.auto webhook.')
            else:
                print(f'[{fpath}] Old webhook not found or already updated.')
        except Exception as e:
            print(f'[{fpath}] Error: {e}')

def update_index_html():
    files = ['index.html', 'src/index.html']
    
    # 1. Update sendRealVerificationOtpEmail webhook sending
    old_otp_send = """            const webhookUrls = [];
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
            });"""

    new_otp_send = """            const webhookUrl = getAppWebhookUrl();
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
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(otpPayload)
                    }).catch(err => console.warn('OTP webhook send note:', err));
                } catch(err) {}
            }"""

    # 2. Update sendAccountActivatedSuccessEmail webhook sending
    old_welcome_send = """            const webhookUrls = [];
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

    new_welcome_send = """            const webhookUrl = getAppWebhookUrl();
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
            }"""

    # 3. Update handleForgotSendCode webhook sending
    old_forgot_send = """            const webhookUrls = [];
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
            });"""

    new_forgot_send = """            const webhookUrl = getAppWebhookUrl();
            console.log(`[MotorCare] Password Reset OTP for ${email}: ${otp}`);

            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(payload)
                    }).catch(e => console.warn('[ForgotPass] webhook fetch note:', e));
                } catch(err) {}
            }"""

    # 4. Strict getAppSenderEmail
    old_sender_func = """        const APP_DEFAULT_SENDER_EMAIL = 'motorcare.auto@gmail.com';
        function getAppSenderEmail() {
            return SafeStorage.getItem('motorCare_AppSenderEmail') || APP_DEFAULT_SENDER_EMAIL;
        }"""

    new_sender_func = """        const APP_DEFAULT_SENDER_EMAIL = 'motorcare.auto@gmail.com';
        function getAppSenderEmail() {
            // Strictly enforce official program email exclusively
            return APP_DEFAULT_SENDER_EMAIL;
        }"""

    for fpath in files:
        with open(fpath, 'r', encoding='utf-8') as f:
            c = f.read()
            
        count = 0
        if old_otp_send in c:
            c = c.replace(old_otp_send, new_otp_send, 1)
            count += 1
            print(f'[{fpath}] Replaced OTP send loop.')
        else:
            print(f'[{fpath}] Warning: old_otp_send not matched.')

        if old_welcome_send in c:
            c = c.replace(old_welcome_send, new_welcome_send, 1)
            count += 1
            print(f'[{fpath}] Replaced welcome send loop.')
        else:
            print(f'[{fpath}] Warning: old_welcome_send not matched.')

        if old_forgot_send in c:
            c = c.replace(old_forgot_send, new_forgot_send, 1)
            count += 1
            print(f'[{fpath}] Replaced forgot pass send loop.')
        else:
            print(f'[{fpath}] Warning: old_forgot_send not matched.')

        if old_sender_func in c:
            c = c.replace(old_sender_func, new_sender_func, 1)
            count += 1
            print(f'[{fpath}] Replaced getAppSenderEmail.')
        else:
            print(f'[{fpath}] Warning: old_sender_func not matched.')

        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f'[{fpath}] Completed {count} updates.')

if __name__ == '__main__':
    update_app_config()
    update_index_html()
