// scratch/test_live_webhook.cjs
const https = require('https');

const webhookUrl = 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec';

const payload = {
    action: 'SEND_OTP_EMAIL',
    subAction: 'PASSWORD_RESET',
    name: 'عضو MotorCare',
    email: 'ezzat.emam1982@gmail.com',
    otp: '987654',
    sender: 'motorcare.auto@gmail.com',
    expiresMinutes: 15,
    timestamp: new Date().toISOString(),
    subject: '[MotorCare Test] رمز استعادة كلمة المرور: 987654',
    body: 'رمز التحقق: 987654',
    htmlBody: '<div style="font-family:sans-serif;direction:rtl"><h2>رمز التحقق: 987654</h2></div>'
};

function postToWebhook(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            console.log('HTTP Status:', res.statusCode, res.statusMessage);
            console.log('Headers:', res.headers);
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log('Following redirect to:', res.headers.location);
                // Google Apps script redirects POST requests (302)
                https.get(res.headers.location, (redRes) => {
                    let body = '';
                    redRes.on('data', d => body += d);
                    redRes.on('end', () => resolve({ status: redRes.statusCode, body }));
                }).on('error', reject);
                return;
            }
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

(async () => {
    console.log('Sending test OTP email to webhook...');
    try {
        const res = await postToWebhook(webhookUrl, payload);
        console.log('Final Result:', res);
    } catch(e) {
        console.error('Error:', e.message);
    }
})();
