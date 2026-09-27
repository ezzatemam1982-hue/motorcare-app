const fs = require('fs');

const dict = fs.readFileSync('js/data/dictionary.js', 'utf8');

// evaluate DICTIONARY object
let DICTIONARY;
eval(dict + '; DICTIONARY = DICTIONARY;');

console.log('--- EN KEYS ---');
const keys = [
    'obdCodesBtn',
    'googleSheetsBtn',
    'shortReport',
    'navContactCommunity',
    'btnLogout',
    'clickManageGarage',
    'drawerTitle'
];
keys.forEach(k => {
    console.log(`${k} -> AR: "${DICTIONARY.ar[k]}", EN: "${DICTIONARY.en[k]}"`);
});
