const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const htmlContent = fs.readFileSync('dist/index.html', 'utf8');
const dom = new JSDOM(htmlContent, { runScripts: "dangerously", resources: "usable" });
const { window } = dom;

console.log("=== Testing Top Header Menu & Mobile Drawer i18n ===");

// 1. Simulate EN language switch
window.appState = { lang: 'en' };
window.applyLanguageSettings();

const topMenu = window.document.getElementById('topHeaderDropdownMenu');
console.log("Top Menu Dir (EN):", topMenu.dir);

const enItems = Array.from(topMenu.querySelectorAll('[data-i18n]')).map(el => ({
    key: el.getAttribute('data-i18n'),
    text: el.textContent.trim()
}));

console.log("Top Menu EN Items:", JSON.stringify(enItems, null, 2));

// 2. Simulate AR language switch
window.appState = { lang: 'ar' };
window.applyLanguageSettings();
console.log("Top Menu Dir (AR):", topMenu.dir);

const arItems = Array.from(topMenu.querySelectorAll('[data-i18n]')).map(el => ({
    key: el.getAttribute('data-i18n'),
    text: el.textContent.trim()
}));

console.log("Top Menu AR Items:", JSON.stringify(arItems, null, 2));

console.log("Test Completed Successfully!");
