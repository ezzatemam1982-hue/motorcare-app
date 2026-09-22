# -*- coding: utf-8 -*-
"""
Apply User Feedback Fixes:
1. Fix password reset OTP email:
   - Make logo larger inside white box (use tight cropped logo with 200px width)
   - Fix dark text under MotorCare: make 'استعادة وتعيين كلمة المرور' bright white (#ffffff !important)
   - Ensure OTP code arrives on first attempt: add keepalive:true, dual-pulse wake up after 1200ms, and EmailJS backup
2. In customReportPrintSection:
   - Remove redundant 'MotorCare' text next to logo since logo already has MOTOR CARE
3. In reportPrintSection (Inspection Report):
   - Remove 'MotorCare Fleet &', make it 'Inspection Report' with chic styling and certified sheet badge
"""
import sys, io, re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('scratch/logo_tight_b64.txt', 'r', encoding='utf-8') as f:
    TIGHT_B64 = f.read().strip()

print(f"Loaded tight logo b64 (length: {len(TIGHT_B64)})")

files = ['index.html', 'src/index.html']

for fn in files:
    with open(fn, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_len = len(content)

    # =========================================================================
    # FIX 1: Update sendForgotPasswordEmail function
    # =========================================================================
    old_send_forgot_re = re.compile(
        r'function sendForgotPasswordEmail\(email,\s*otp,\s*name\)\s*\{.*?showNotification\(isEn\s*\?[^;]+;\s*\}',
        re.DOTALL
    )

    new_send_forgot = f'''function sendForgotPasswordEmail(email, otp, name) {{
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const senderEmail = typeof getAppSenderEmail === 'function' ? getAppSenderEmail() : 'motorcare.auto@gmail.com';
            const clientName = name || 'عضو MotorCare';

            const plainBody = `==========================================\\n[ MOTORCARE ] | استعادة كلمة المرور\\n==========================================\\n\\nأهلاً بك يا ${{clientName}}!\\n\\nرمز التحقق لاستعادة وتعيين كلمة المرور:\\n   [ ${{otp}} ]\\n(صلاحية الرمز: 15 دقيقة فقط)\\n\\nإذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.\\n\\nفريق عمل MotorCare\\n==========================================`;

            const htmlBody = `<div dir="rtl" style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 15px 35px rgba(0,0,0,0.08);color:#1e293b;text-align:right">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,{TIGHT_B64}" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>
    <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff !important;letter-spacing:0.5px;">MotorCare</h1>
    <p style="margin:8px 0 0 0;font-size:15px;font-weight:700;color:#ffffff !important;text-shadow:0 1px 3px rgba(0,0,0,0.5);">استعادة وتعيين كلمة المرور</p>
  </div>
  <div style="padding:28px 24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f172a;margin-top:0">أهلاً بك يا ${{clientName}}!</h2>
    <p style="font-size:13px;line-height:1.7;color:#475569">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك المسجل (${{email}}). استخدم رمز التحقق السري التالي للمتابعة:</p>
    
    <div style="margin:24px 0;text-align:center">
      <div style="display:inline-block;padding:16px 36px;background:#f0f9ff;border:2px dashed #0284c7;border-radius:18px">
        <span style="display:block;font-size:12px;font-weight:700;color:#0369a1;margin-bottom:6px">رمز التحقق لاستعادة كلمة المرور (OTP)</span>
        <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:900;letter-spacing:10px;color:#0284c7;display:block">${{otp}}</span>
        <span style="display:block;font-size:11px;color:#64748b;margin-top:6px">الصلاحية: 15 دقيقة فقط</span>
      </div>
    </div>

    <p style="font-size:12px;color:#64748b;line-height:1.6">إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة ولن يتم تغيير أي شيء في حسابك.</p>
  </div>
  <div style="background:#f1f5f9;padding:18px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">
    <strong style="color:#0f172a">فريق عمل MotorCare</strong> • <span style="direction:ltr;display:inline-block">motorcare.auto@gmail.com</span>
  </div>
</div>`;

            const payload = {{
                action: 'SEND_OTP_EMAIL',
                subAction: 'PASSWORD_RESET',
                name: clientName,
                email: email,
                otp: otp,
                sender: senderEmail,
                expiresMinutes: 15,
                timestamp: new Date().toISOString(),
                subject: `[MotorCare] رمز استعادة كلمة المرور: ${{otp}}`,
                body: plainBody,
                htmlBody: htmlBody
            }};

            const webhookUrl = getAppWebhookUrl();
            console.log(`[MotorCare] Password Reset OTP for ${{email}}: ${{otp}}`);

            // القناة 1: Webhook مع إرسال فوري ونبضة تأكيد ثانية بعد 1200ms لتجاوز وضع الخمول
            if (webhookUrl && webhookUrl.startsWith('http')) {{
                const sendFetch = () => {{
                    try {{
                        fetch(webhookUrl, {{
                            method: 'POST',
                            mode: 'no-cors',
                            keepalive: true,
                            headers: {{ 'Content-Type': 'text/plain;charset=utf-8' }},
                            body: JSON.stringify(payload)
                        }}).catch(e => console.warn('[ForgotPass] webhook fetch note:', e));
                    }} catch(err) {{}}
                }};

                sendFetch();
                setTimeout(sendFetch, 1200);
            }}

            // القناة 2: EmailJS كقناة متزامنة احتياطية إذا كانت مهيأة
            if (typeof emailjs !== 'undefined' && emailjs) {{
                try {{
                    const rawEmailConf = SafeStorage.getItem('motorCare_emailjs_config');
                    if (rawEmailConf) {{
                        const conf = JSON.parse(rawEmailConf);
                        if (conf.serviceId && conf.templateId) {{
                            emailjs.send(conf.serviceId, conf.templateId, {{
                                to_email: email,
                                user_name: clientName,
                                subject: `[MotorCare] رمز استعادة كلمة المرور: ${{otp}}`,
                                message: plainBody,
                                otp_code: otp
                            }}).catch(e => console.warn('[ForgotPass EmailJS] note:', e));
                        }}
                    }}
                }} catch(e) {{}}
            }}

            showNotification(isEn
                ? `Password reset code sent to ${{email}} 📩 Check inbox & spam.`
                : `تم إرسال رمز الاسترداد إلى ${{email}} 📩 يرجى مراجعة صندوق الوارد والـ Spam`, 'info', 6000);
        }}'''

    if old_send_forgot_re.search(content):
        content = old_send_forgot_re.sub(new_send_forgot, content, count=1)
        print(f"[{fn}] Updated sendForgotPasswordEmail.")
    else:
        print(f"[{fn}] sendForgotPasswordEmail pattern not matched!")

    # =========================================================================
    # FIX 1b: Also update Registration OTP email and Feedback email templates
    # to have the larger tight logo and explicit white text!
    # =========================================================================
    # Registration OTP email header
    old_reg_otp_hdr_re = re.compile(
        r'<div style="background:\s*linear-gradient\(135deg,\s*#0f172a 0%,\s*#0284c7 100%\);\s*padding:\s*32px 24px;\s*text-align:\s*center;\s*color:\s*#ffffff;">\s*<div style="display:inline-block;margin-bottom:12px;background:#ffffff;padding:6px 12px;border-radius:14px;box-shadow:0 4px 15px rgba\(0,0,0,0\.2\);"><img src="data:image/jpeg;base64,[^"]+"[^>]*></div>\s*<h1 style="margin:\s*0;\s*font-size:\s*24px;\s*font-weight:\s*900;\s*letter-spacing:\s*-0\.5px;">MotorCare</h1>\s*<p style="margin:\s*6px 0 0 0;\s*font-size:\s*13px;\s*opacity:\s*0\.9;\s*font-weight:\s*600;">منصة العناية المتكاملة بسيارتك</p>',
        re.DOTALL
    )
    new_reg_otp_hdr = f'''<div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,{TIGHT_B64}" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>
    <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff !important;letter-spacing:0.5px;">MotorCare</h1>
    <p style="margin:8px 0 0 0;font-size:15px;font-weight:700;color:#ffffff !important;text-shadow:0 1px 3px rgba(0,0,0,0.5);">رمز تفعيل وتوثيق حسابك الجديد</p>'''

    if old_reg_otp_hdr_re.search(content):
        content = old_reg_otp_hdr_re.sub(new_reg_otp_hdr, content, count=1)
        print(f"[{fn}] Updated registration OTP email header.")
    else:
        print(f"[{fn}] registration OTP email header not matched!")

    # Feedback user confirmation email header
    old_fb_user_hdr_re = re.compile(
        r'<div style="background:\s*linear-gradient\(135deg,\s*#0f172a 0%,\s*#1e1b4b 40%,\s*#0284c7 100%\);\s*padding:\s*36px 24px;\s*text-align:\s*center;\s*color:\s*#ffffff;">\s*<div style="display:inline-block;margin-bottom:12px;background:#ffffff;padding:8px 14px;border-radius:14px;box-shadow:0 4px 15px rgba\(0,0,0,0\.2\);"><img src="data:image/jpeg;base64,[^"]+"[^>]*></div>',
        re.DOTALL
    )
    new_fb_user_hdr = f'''<div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,{TIGHT_B64}" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>'''

    if old_fb_user_hdr_re.search(content):
        content = old_fb_user_hdr_re.sub(new_fb_user_hdr, content, count=1)
        print(f"[{fn}] Updated feedback user confirmation email header.")
    else:
        print(f"[{fn}] feedback user confirmation email header not matched!")

    # =========================================================================
    # FIX 2: customReportPrintSection - Remove 'MotorCare' next to logo
    # =========================================================================
    old_custom_hdr_re = re.compile(
        r'<div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-center gap-4">\s*<div class="flex items-center gap-4">\s*<img src="Reports_And_App_Headers\.png"[^>]*>\s*<div>\s*<div class="flex items-center gap-2">\s*<h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">MotorCare</h1>\s*<span class="px-2 py-0\.5 rounded-md text-\[11px\] font-black bg-sky-100 text-sky-800 border border-sky-200 uppercase">Official Statement</span>\s*</div>\s*<p class="text-xs text-slate-500 font-bold mt-0\.5" id="customPrintSubtitle">.*?</p>\s*</div>\s*</div>',
        re.DOTALL
    )

    new_custom_hdr = '''<div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-center gap-4">
            <div class="flex items-center gap-4">
                <img src="Reports_And_App_Headers.png" alt="MotorCare" class="h-16 sm:h-20 w-auto object-contain rounded-xl drop-shadow-sm shrink-0">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wide">Official Statement</span>
                    </div>
                    <p class="text-sm font-bold text-slate-700 mt-1" id="customPrintSubtitle">تقرير وسجل فواتير الصيانة والإصلاح المعتمد</p>
                </div>
            </div>'''

    if old_custom_hdr_re.search(content):
        content = old_custom_hdr_re.sub(new_custom_hdr, content, count=1)
        print(f"[{fn}] Removed redundant MotorCare in customReportPrintSection header.")
    else:
        print(f"[{fn}] customReportPrintSection header pattern not matched!")

    # =========================================================================
    # FIX 3: reportPrintSection - Replace 'MotorCare Fleet & Inspection Report'
    # with stylish 'Inspection Report'
    # =========================================================================
    old_insp_hdr_re = re.compile(
        r'<div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-center gap-4">\s*<div class="flex items-center gap-4">\s*<img src="Reports_And_App_Headers\.png"[^>]*>\s*<div>\s*<h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">MotorCare Fleet &amp; Inspection Report</h1>\s*<p class="text-xs text-slate-500 font-bold" id="printReportSub">.*?</p>\s*</div>\s*</div>',
        re.DOTALL
    )

    new_insp_hdr = '''<div class="border-b-2 border-sky-600 pb-4 mb-6 flex justify-between items-center gap-4">
            <div class="flex items-center gap-4">
                <img src="Reports_And_App_Headers.png" alt="MotorCare" class="h-16 sm:h-20 w-auto object-contain rounded-xl drop-shadow-sm shrink-0">
                <div>
                    <div class="flex items-center gap-2.5">
                        <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            <span class="text-sky-600">Inspection</span> <span>Report</span>
                        </h1>
                        <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">Certified Sheet</span>
                    </div>
                    <p class="text-xs sm:text-sm text-slate-600 font-bold mt-1" id="printReportSub">تقرير الفحص الفني الشامل وسجل الصيانة الوقائية المعتمد (Multi-Point Inspection)</p>
                </div>
            </div>'''

    if old_insp_hdr_re.search(content):
        content = old_insp_hdr_re.sub(new_insp_hdr, content, count=1)
        print(f"[{fn}] Replaced 'MotorCare Fleet' with stylish 'Inspection Report'.")
    else:
        print(f"[{fn}] reportPrintSection header pattern not matched!")

    with open(fn, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[{fn}] Written successfully. Length: {orig_len} -> {len(content)}")

print("\nAll feedback fixes applied!")
