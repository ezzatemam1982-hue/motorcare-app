const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('🧪 MotorCare Mandatory Fixes & Enhancements Suite');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. AndroidManifest.xml verification
console.log('--- 1. Android Camera & Activity Recreation Config ---');
const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
assert(manifest.includes('android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"'), 'AndroidManifest has full configChanges to prevent activity destruction');
assert(manifest.includes('android:alwaysRetainTaskState="true"'), 'AndroidManifest has alwaysRetainTaskState="true"');
assert(manifest.includes('android:windowSoftInputMode="adjustResize"'), 'AndroidManifest has windowSoftInputMode="adjustResize"');

// 2. Camera restoration & session caching in mobile.js
console.log('\n--- 2. Camera Session Caching & AppRestoredResult Handling ---');
const mobileJs = fs.readFileSync('js/services/mobile.js', 'utf8');
assert(mobileJs.includes("AppPlugin.addListener('appRestoredResult'"), 'mobile.js listens to Capacitor appRestoredResult');
assert(mobileJs.includes("sessionStorage.setItem('motorCare_cameraActiveTarget'"), 'mobile.js caches active attachment key before opening camera');
assert(mobileJs.includes("sessionStorage.setItem('motorCare_cameraParentModal'"), 'mobile.js tracks active parent modal before opening camera');
assert(mobileJs.includes("function handleRestoredCameraResult"), 'mobile.js defines handleRestoredCameraResult');
assert(mobileJs.includes("sessionStorage.setItem('motorCare_tempImage_'"), 'mobile.js caches captured image in sessionStorage');

// 3. Google Sign-In verification
console.log('\n--- 3. Google Sign-In & Firebase Credential Verification ---');
const authJs = fs.readFileSync('js/services/auth.js', 'utf8');
const stringsXml = fs.readFileSync('android/app/src/main/res/values/strings.xml', 'utf8');
const capConfig = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));

const webClientId = '681024358152-hg4p231ebqr7572ckq3apf73prv3e2s5.apps.googleusercontent.com';
assert(stringsXml.includes(webClientId), 'strings.xml has valid server_client_id matching Web Client ID');
assert(capConfig.plugins.GoogleAuth.serverClientId === webClientId, 'capacitor.config.json matches serverClientId');
assert(authJs.includes("serverClientId: '681024358152-hg4p231ebqr7572ckq3apf73prv3e2s5.apps.googleusercontent.com'"), 'auth.js initializes GoogleAuth with serverClientId');
assert(authJs.includes("firebase.auth.GoogleAuthProvider.credential(idToken"), 'auth.js properly creates Firebase credential with extracted idToken');
assert(authJs.includes("console.error('[MotorCare Auth] Capacitor native GoogleAuth CRITICAL ERROR:'"), 'auth.js logs native GoogleAuth error with console.error');
assert(authJs.includes("DEVELOPER_ERROR") && authJs.includes("12500"), 'auth.js diagnoses Error 10 (DEVELOPER_ERROR) and Error 12500');

// 4. Report & Print Templates (Fleetio & CARFAX Style)
console.log('\n--- 4. Fleetio & CARFAX Style Reports Verification ---');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const cssStyle = fs.readFileSync('css/style.css', 'utf8');

assert(indexHtml.includes("font-family: 'Cairo'"), 'index.html applies Cairo font to report sections');
assert(cssStyle.includes("@page {") && cssStyle.includes("margin: 12mm 15mm;"), 'css/style.css configures @page size A4 with 12mm 15mm margins');
assert(cssStyle.includes(".fleet-table-header") && cssStyle.includes("background-color: #0f172a"), 'css/style.css configures #0f172a navy table headers');
assert(cssStyle.includes(".fleet-zebra-row:nth-child(even)"), 'css/style.css defines zebra striping for fleet reports');
assert(indexHtml.includes('id="reportPrintSection"') && indexHtml.includes('fleet-report-container'), 'reportPrintSection upgraded to fleet-report-container');
assert(indexHtml.includes('id="customReportPrintSection"') && indexHtml.includes('fleet-report-container'), 'customReportPrintSection upgraded to fleet-report-container');
assert(mobileJs.includes("font-family: 'Cairo'"), 'mobile.js printReportSection embeds Cairo font and Fleetio styling');
assert(mobileJs.includes("margin: 12mm 15mm;"), 'mobile.js printReportSection configures A4 portrait with 12mm 15mm margins');

const reportsJs = fs.readFileSync('js/features/reports.js', 'utf8');
assert(reportsJs.includes("dir=\"ltr\" class=\"font-mono\""), 'reports.js isolates numbers and odometers in dir="ltr"');
assert(reportsJs.includes("style=\"${zebraBg}\""), 'reports.js generates alternating zebra backgrounds for report rows');

// 5. JavaScript Syntax Checking
console.log('\n--- 5. Full JS Syntax Checking ---');
const filesToCheck = [
  'js/services/auth.js',
  'js/services/mobile.js',
  'js/features/reports.js',
  'src/js/services/auth.js',
  'src/js/services/mobile.js',
  'src/js/features/reports.js'
];
filesToCheck.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    new vm.Script(code);
    assert(true, `Syntax valid: ${f}`);
  } catch (e) {
    assert(false, `Syntax error in ${f}: ${e.message}`);
  }
});

console.log('\n====================================================');
console.log(`📊 Test Results: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
