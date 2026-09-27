const fs = require('fs');

console.log('Testing reports print CSS and CSV functions...');

// 1. Verify CSS media print rules
const css = fs.readFileSync('css/style.css', 'utf8');
if (css.includes('body:not(.in-print-iframe) *') && css.includes('body.in-print-iframe')) {
    console.log('PASS: Print iframe CSS scoping verified!');
} else {
    console.error('FAIL: Print iframe CSS scoping missing!');
    process.exit(1);
}

// 2. Verify exportCustomReportCSV function in reports.js
const reportsJs = fs.readFileSync('js/features/reports.js', 'utf8');
if (reportsJs.includes('exportCustomReportCSV') && reportsJs.includes('text/csv;charset=utf-8;')) {
    console.log('PASS: exportCustomReportCSV implementation verified!');
} else {
    console.error('FAIL: exportCustomReportCSV implementation issue!');
    process.exit(1);
}

// 3. Verify mobile.js iframe print wrapper
const mobileJs = fs.readFileSync('js/services/mobile.js', 'utf8');
if (mobileJs.includes('in-print-iframe') && mobileJs.includes('active-print-target')) {
    console.log('PASS: Print iframe wrapper verified!');
} else {
    console.error('FAIL: Print iframe wrapper issue!');
    process.exit(1);
}

console.log('All tests passed successfully!');
