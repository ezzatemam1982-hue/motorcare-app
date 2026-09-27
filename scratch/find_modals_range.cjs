const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 3300; i < 3685; i++) {
    const l = lines[i];
    if (l.includes('id="') && l.includes('Modal')) {
        console.log(`Line ${i + 1}: ${l.trim()}`);
    }
}
