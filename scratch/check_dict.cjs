const fs = require('fs');

const dictContent = fs.readFileSync('js/data/dictionary.js', 'utf8');

const keysToCheck = [
    'obdCodesBtn',
    'googleSheetsBtn',
    'shortReport',
    'navContactCommunity',
    'btnLogout',
    'clickManageGarage',
    'tabHardware',
    'tabDocs',
    'tabInspection',
    'tabHistory'
];

keysToCheck.forEach(k => {
    const arMatch = dictContent.match(new RegExp(`${k}:\\s*["'\`]([^"'\`]+)["'\`]`));
    console.log(`Key ${k}:`);
    console.log(`  matches:`, dictContent.includes(`${k}:`));
});
