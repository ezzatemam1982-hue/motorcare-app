const { chromium } = require('C:/Users/Ezzat Emam/AppData/Local/ms-playwright-go/1.50.1/package');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1100, height: 900 });

    // 1. Capture Inspection Report Header
    await page.goto('file:///' + path.resolve('index.html').replace(/\\/g, '/'));
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
        const sec = document.getElementById('reportPrintSection');
        if (sec) {
            sec.classList.remove('hidden');
            sec.style.display = 'block';
            sec.style.position = 'relative';
            sec.style.zIndex = '9999';
            sec.style.background = '#ffffff';
        }
    });
    await page.waitForTimeout(1000);
    const repEl = await page.$('#reportPrintSection');
    if (repEl) {
        await repEl.screenshot({ path: 'scratch/screenshot_inspection_report_v2.png' });
        console.log('1. Inspection Report screenshot captured!');
    }

    // 2. Capture Custom Statement Report Header
    await page.evaluate(() => {
        const sec1 = document.getElementById('reportPrintSection');
        if (sec1) sec1.classList.add('hidden');

        const sec2 = document.getElementById('customReportPrintSection');
        if (sec2) {
            sec2.classList.remove('hidden');
            sec2.style.display = 'block';
            sec2.style.position = 'relative';
            sec2.style.zIndex = '9999';
            sec2.style.background = '#ffffff';
        }
    });
    await page.waitForTimeout(1000);
    const custEl = await page.$('#customReportPrintSection');
    if (custEl) {
        await custEl.screenshot({ path: 'scratch/screenshot_custom_report_v2.png' });
        console.log('2. Custom Statement Report screenshot captured!');
    }

    // 3. Capture Email Template Preview
    // Extract htmlBody from sendForgotPasswordEmail definition
    const htmlFile = fs.readFileSync('index.html', 'utf8');
    const b64Tight = fs.readFileSync('scratch/logo_tight_b64.txt', 'utf8').trim();

    // Create a standalone HTML page to render the password reset email exactly
    const emailHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>معاينة إيميل استعادة كلمة المرور</title>
</head>
<body style="background:#f1f5f9;padding:40px 10px;font-family:sans-serif;">
<div dir="rtl" style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:540px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 15px 35px rgba(0,0,0,0.08);color:#1e293b;text-align:right">
  <div style="background:linear-gradient(135deg,#0f172a 0%,#0284c7 100%);padding:36px 24px;text-align:center;color:#ffffff">
    <div style="display:inline-block;margin-bottom:14px;background:#ffffff;padding:10px 18px;border-radius:18px;box-shadow:0 6px 20px rgba(0,0,0,0.25);"><img src="data:image/jpeg;base64,${b64Tight}" alt="MotorCare" style="width:200px;max-width:100%;height:auto;display:block;border:0;" /></div>
    <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff !important;letter-spacing:0.5px;">MotorCare</h1>
    <p style="margin:8px 0 0 0;font-size:15px;font-weight:700;color:#ffffff !important;text-shadow:0 1px 3px rgba(0,0,0,0.5);">استعادة وتعيين كلمة المرور</p>
  </div>
  <div style="padding:28px 24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f172a;margin-top:0">أهلاً بك يا sajar54740!</h2>
    <p style="font-size:13px;line-height:1.7;color:#475569">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك المسجل (sajar54740@hideam.com). استخدم رمز التحقق السري التالي للمتابعة:</p>
    
    <div style="margin:24px 0;text-align:center">
      <div style="display:inline-block;padding:16px 36px;background:#f0f9ff;border:2px dashed #0284c7;border-radius:18px">
        <span style="display:block;font-size:12px;font-weight:700;color:#0369a1;margin-bottom:6px">رمز التحقق لاستعادة كلمة المرور (OTP)</span>
        <span style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:900;letter-spacing:10px;color:#0284c7;display:block">9 1 8 2 1 1</span>
        <span style="display:block;font-size:11px;color:#64748b;margin-top:6px">الصلاحية: 15 دقيقة فقط</span>
      </div>
    </div>

    <p style="font-size:12px;color:#64748b;line-height:1.6">إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة ولن يتم تغيير أي شيء في حسابك.</p>
  </div>
  <div style="background:#f1f5f9;padding:18px 24px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0">
    <strong style="color:#0f172a">فريق عمل MotorCare</strong> • <span style="direction:ltr;display:inline-block">motorcare.auto@gmail.com</span>
  </div>
</div>
</body>
</html>`;

    fs.writeFileSync('scratch/email_preview.html', emailHtml, 'utf8');
    await page.goto('file:///' + path.resolve('scratch/email_preview.html').replace(/\\/g, '/'));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/screenshot_email_preview.png', fullPage: true });
    console.log('3. Email template preview screenshot captured!');

    await browser.close();
    console.log('All previews captured successfully!');
})();
