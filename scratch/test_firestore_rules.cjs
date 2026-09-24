// scratch/test_firestore_rules.cjs
const https = require('https');

// Test REST API for Firestore motorcare-1b6d2
const projectId = 'motorcare-1b6d2';
const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/motorcare_users/test_check`;

console.log('Testing Firestore REST endpoint:', docUrl);

https.get(docUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response body:', data);
    });
}).on('error', (err) => {
    console.error('Request error:', err.message);
});
