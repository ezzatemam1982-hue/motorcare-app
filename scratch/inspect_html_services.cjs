const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const modalMatches = html.match(/id="[^"]*modal[^"]*"/gi);
console.log('Modals found:', modalMatches);

const serviceMatches = html.match(/onclick="[^"]*"/gi);
console.log('Total onclick handlers found:', serviceMatches ? serviceMatches.length : 0);

// Print unique onclick functions
const functions = new Set();
if (serviceMatches) {
    serviceMatches.forEach(m => {
        const fnName = m.replace('onclick="', '').split('(')[0].replace(/.*if\s*\(\s*typeof\s+/, '').replace(/\s*===.*/, '');
        functions.add(fnName.trim());
    });
}
console.log('\nUnique onclick functions used in HTML:\n', Array.from(functions).join('\n'));
