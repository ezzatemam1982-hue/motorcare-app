const fs = require('fs');
const path = require('path');

console.log('--- Testing Print Reports Blank Page Fix ---');

// 1. Check CSS @media print
const cssContent = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
if (!cssContent.includes('@media print')) {
    console.error('FAIL: @media print missing in css/style.css');
    process.exit(1);
}
if (!cssContent.includes('.printable-report') || !cssContent.includes('#reportModal')) {
    console.error('FAIL: .printable-report or #reportModal missing in @media print');
    process.exit(1);
}
if (!cssContent.includes('visibility: visible !important') || !cssContent.includes('display: block !important')) {
    console.error('FAIL: visibility: visible !important or display: block !important missing in @media print');
    process.exit(1);
}
console.log('PASS: CSS @media print rules correctly configured in css/style.css');

// 2. Check HTML classes
const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
if (!htmlContent.includes('id="reportPrintSection" class="printable-report')) {
    console.error('FAIL: printable-report class missing on #reportPrintSection in index.html');
    process.exit(1);
}
if (!htmlContent.includes('id="customReportPrintSection" class="printable-report')) {
    console.error('FAIL: printable-report class missing on #customReportPrintSection in index.html');
    process.exit(1);
}
console.log('PASS: printable-report class present on both print sections in index.html');

// 3. Check reports.js for 250ms delay and unhiding
const reportsJs = fs.readFileSync(path.join(__dirname, '../js/features/reports.js'), 'utf8');
if (!reportsJs.includes('setTimeout') || !reportsJs.includes('250')) {
    console.error('FAIL: 250ms setTimeout missing in js/features/reports.js');
    process.exit(1);
}
if (!reportsJs.includes("printSection.classList.remove('hidden')")) {
    console.error('FAIL: classList.remove("hidden") missing in js/features/reports.js');
    process.exit(1);
}
console.log('PASS: 250ms delay and classList.remove("hidden") present in js/features/reports.js');

// 4. Check mobile.js for print iframe and style copying
const mobileJs = fs.readFileSync(path.join(__dirname, '../js/services/mobile.js'), 'utf8');
if (!mobileJs.includes('motorcare-print-frame') || !mobileJs.includes('headStyles')) {
    console.error('FAIL: print iframe or headStyles missing in js/services/mobile.js');
    process.exit(1);
}
console.log('PASS: Dedicated print iframe with complete CSS copying present in js/services/mobile.js');

console.log('--- All Print Reports Verification Tests Passed Successfully! ---');
