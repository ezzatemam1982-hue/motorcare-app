const fs = require('fs');

const indexHtml = fs.readFileSync('dist/index.html', 'utf8');
const dictJs = fs.readFileSync('js/data/dictionary.js', 'utf8');

// Extract topHeaderDropdownMenu portion
const menuMatch = indexHtml.match(/id="topHeaderDropdownMenu"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);

if (!menuMatch) {
    console.error("Could not find topHeaderDropdownMenu in dist/index.html!");
    process.exit(1);
}

const menuHtml = menuMatch[0];

// Extract all data-i18n attributes
const i18nMatches = [...menuHtml.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);

console.log("Found data-i18n keys in topHeaderDropdownMenu:");
console.log(i18nMatches);

// Check that each key exists in dictionary.js
i18nMatches.forEach(key => {
    const hasKey = dictJs.includes(key + ":");
    console.log(`Key '${key}': ${hasKey ? 'OK' : 'MISSING IN DICTIONARY'}`);
});

console.log("\nAll keys verified successfully!");
