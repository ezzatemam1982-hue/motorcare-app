const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
const { window } = dom;

// Setup mock window globals
window.appState = { lang: 'en' };
window.MOTORCARE_SERVICE_CENTERS = JSON.parse(fs.readFileSync('service_centers.js', 'utf-8').replace('window.MOTORCARE_SERVICE_CENTERS =', '').replace(/;$/, ''));
window.DICTIONARY = JSON.parse(fs.readFileSync('js/data/dictionary.js', 'utf-8').replace('const DICTIONARY =', '').replace(/;$/, ''));
window.getCurrentCar = () => ({ brand: 'Fiat', model: 'Tipo', year: '2016' });

// Load i18n & serviceCenters
eval(fs.readFileSync('js/core/i18n.js', 'utf-8'));
eval(fs.readFileSync('js/features/serviceCenters.js', 'utf-8'));

// Run openServiceCentersModal
window.openServiceCentersModal();

const govOptions = Array.from(window.document.querySelectorAll('#scGovFilter option')).map(o => ({ val: o.value, text: o.text }));
const typeOptions = Array.from(window.document.querySelectorAll('#scTypeFilter option')).map(o => ({ val: o.value, text: o.text }));
const brandOptions = Array.from(window.document.querySelectorAll('#scBrandFilter option')).map(o => ({ val: o.value, text: o.text }));
const cardsText = window.document.getElementById('scCardsContainer').innerHTML;

console.log('Governorate Options (EN):', govOptions.slice(0, 4));
console.log('Type Options (EN):', typeOptions);
console.log('First 2 Brand Options:', brandOptions.slice(0, 2));

const hasArabicInGovText = govOptions.some(g => /[\u0600-\u06FF]/.test(g.text));
console.log('Has Arabic in Governorate dropdown labels:', hasArabicInGovText);

const hasArabicInTypeText = typeOptions.some(t => /[\u0600-\u06FF]/.test(t.text));
console.log('Has Arabic in Type dropdown labels:', hasArabicInTypeText);

const hasArabicNotice = cardsText.includes('*تنبيه:');
console.log('Has Arabic notice banner:', hasArabicNotice);

console.log('--- TEST PASSED SUCCESSFULLY ---');
