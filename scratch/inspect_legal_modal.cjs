const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 3530; i < 3570; i++) {
    console.log((i + 1) + ': ' + lines[i]);
}
