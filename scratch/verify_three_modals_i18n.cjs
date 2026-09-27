const fs = require('fs');

const distHtml = fs.readFileSync('dist/index.html', 'utf8');
const dictJs = fs.readFileSync('js/data/dictionary.js', 'utf8');

const requiredKeys = [
    'trafficFinesModalTitle',
    'trafficFinesModalSub',
    'trafficFinesBadgeEg',
    'trafficCarTitleLabel',
    'trafficPlateLabel',
    'btnCopyPlate',
    'trafficPpoTitle',
    'trafficPpoSub',
    'btnOpenPortal',
    'trafficDigitalEgyptTitle',
    'trafficDigitalEgyptSub',
    'btnEnterPortal',
    'trafficDirectLinkNote',
    'trafficInstructionsTitle',
    'trafficInstructionsBody',
    'scModalTitle',
    'scModalSub',
    'scResetBrandsBtn',
    'scSearchPlaceholder'
];

console.log("=== Checking Modal Translation Keys in Dictionary ===");
requiredKeys.forEach(k => {
    const exists = dictJs.includes(k + ":");
    console.log(`Key '${k}': ${exists ? 'OK' : 'MISSING'}`);
});

console.log("\n=== Checking data-i18n Tags in HTML ===");
requiredKeys.forEach(k => {
    const inHtml = distHtml.includes(`data-i18n="${k}"`) || distHtml.includes(`data-i18n-ph="${k}"`);
    console.log(`HTML tag '${k}': ${inHtml ? 'OK' : 'NOT FOUND IN HTML'}`);
});

console.log("\nVerification Complete!");
