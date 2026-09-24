// scratch/test_firebase_auth_rest.cjs
const https = require('https');

const apiKey = "AIzaSyDf9vpYQjIPvtV5jf0EBf5BM3b6rnqfYSU";

function postJson(url, payload) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const data = JSON.stringify(payload);
        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(body) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

(async () => {
    console.log('Testing Firebase Auth endpoints for motorcare-1b6d2...');
    // 1. Try signUp (create anonymous user or email/pass)
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const resSignUp = await postJson(signUpUrl, { returnSecureToken: true });
    console.log('Anonymous / basic signUp status:', resSignUp.status, resSignUp.body);

    if (resSignUp.body && resSignUp.body.idToken) {
        const idToken = resSignUp.body.idToken;
        console.log('Obtained idToken, testing authenticated Firestore access with this idToken...');
        const docUrl = `https://firestore.googleapis.com/v1/projects/motorcare-1b6d2/databases/(default)/documents/motorcare_users/test_auth_check`;
        const testAuthRes = await new Promise((resolve) => {
            const urlObj = new URL(docUrl);
            const req = https.request({
                hostname: urlObj.hostname,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }, (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => resolve({ status: res.statusCode, body }));
            });
            req.end();
        });
        console.log('Authenticated Firestore status:', testAuthRes.status, testAuthRes.body);
    }
})();
