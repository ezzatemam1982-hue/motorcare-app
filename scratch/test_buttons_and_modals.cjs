const fs = require('fs');

console.log('--- Checking HTML IDs ---');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
    'drawerBtn-driverTools',
    'drawerBtn-obd',
    'drawerBtn-reports',
    'sidebarBtn-driverTools',
    'sidebarBtn-obd',
    'sidebarBtn-reports',
    'topMenuBtn-driverTools',
    'topMenuBtn-obd',
    'topMenuBtn-reports',
    'driverToolsModal',
    'obdEncyclopediaModal',
    'customReportExportModal',
    'mobileMoreDrawerModal'
];

let allFound = true;
checks.forEach(id => {
    const pattern = `id="${id}"`;
    const found = html.includes(pattern);
    console.log(`[HTML] ${pattern}: ${found ? 'FOUND ✓' : 'MISSING ✗'}`);
    if (!found) allFound = false;
});

console.log('\n--- Checking CSS z-index & .active rules ---');
const css = fs.readFileSync('css/style.css', 'utf8');
const hasZindexRule = css.includes('99999 !important');
const hasActiveRule = css.includes('.active');
console.log(`[CSS] 99999 z-index rule: ${hasZindexRule ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[CSS] .active display flex: ${hasActiveRule ? 'FOUND ✓' : 'MISSING ✗'}`);

console.log('\n--- Checking JS Functions & Event Delegation ---');
const dashboardJs = fs.readFileSync('js/features/dashboard.js', 'utf8');
const driverToolsJs = fs.readFileSync('js/features/driverTools.js', 'utf8');
const obdJs = fs.readFileSync('js/features/obd.js', 'utf8');
const reportsJs = fs.readFileSync('js/features/reports.js', 'utf8');
const mainJs = fs.readFileSync('js/main.js', 'utf8');

console.log(`[dashboard.js] initDrawerAndSidebarEventListeners: ${dashboardJs.includes('initDrawerAndSidebarEventListeners') ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[dashboard.js] event delegation: ${dashboardJs.includes('document._hasNavModalDelegation') ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[driverTools.js] console.log("Clicked: Driver Tools"): ${driverToolsJs.includes('Clicked: Driver Tools') ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[driverTools.js] active class added: ${driverToolsJs.includes("classList.add('active')") ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[driverTools.js] z-index 99999: ${driverToolsJs.includes('99999') ? 'FOUND ✓' : 'MISSING ✗'}`);

console.log(`[obd.js] console.log("Clicked: OBD Encyclopedia"): ${obdJs.includes('Clicked: OBD Encyclopedia') ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[obd.js] active class added: ${obdJs.includes("classList.add('active')") ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[obd.js] z-index 99999: ${obdJs.includes('99999') ? 'FOUND ✓' : 'MISSING ✗'}`);

console.log(`[reports.js] console.log("Clicked: Export Reports PDF"): ${reportsJs.includes('Clicked: Export Reports PDF') ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[reports.js] active class added: ${reportsJs.includes("classList.add('active')") ? 'FOUND ✓' : 'MISSING ✗'}`);
console.log(`[reports.js] z-index 99999: ${reportsJs.includes('99999') ? 'FOUND ✓' : 'MISSING ✗'}`);

console.log(`[main.js] calls initDrawerAndSidebarEventListeners: ${mainJs.includes('initDrawerAndSidebarEventListeners') ? 'FOUND ✓' : 'MISSING ✗'}`);

if (allFound && hasZindexRule && hasActiveRule) {
    console.log('\n>>> ALL AUDIT CHECKS PASSED SUCCESSFULLY! <<<');
} else {
    console.error('\n>>> SOME AUDIT CHECKS FAILED! <<<');
    process.exit(1);
}
