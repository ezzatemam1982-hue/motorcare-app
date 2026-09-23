const fs = require('fs');

['index.html', 'src/index.html'].forEach(file => {
    console.log('--- Checking', file, '---');
    const content = fs.readFileSync(file, 'utf8');

    console.log('has ensureFirestoreReady:', content.includes('async function ensureFirestoreReady'));
    console.log('has findAccountByEmail:', content.includes('async function findAccountByEmail'));
    console.log('has saveAccountToLocalDB:', content.includes('function saveAccountToLocalDB'));
    console.log('has checkUrlEmailVerification:', content.includes('function checkUrlEmailVerification'));
    console.log('has checkAuthEmailExistingLive:', content.includes('async function checkAuthEmailExistingLive'));
    console.log('has initAuthEmailLiveWatcher:', content.includes('function initAuthEmailLiveWatcher'));
    console.log('has bad snippet in copyAppsScriptCode:', content.includes('initAuthEmailLiveWatcher() {') && content.indexOf('initAuthEmailLiveWatcher() {') < content.indexOf('copyAppsScriptCode'));
    console.log('does login force switch to register:', content.includes('Switched to "New Account" to create one'));
    console.log('DOMContentLoaded has initFirestoreDatabase:', content.includes('initFirestoreDatabase();') && content.includes('initAuthEmailLiveWatcher();'));
});
