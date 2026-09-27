const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');
let modalLine = -1;
lines.forEach((l, idx) => {
    if (l.includes('id="driverToolsModal"')) modalLine = idx;
});
console.log('driverToolsModal is at line:', modalLine + 1);

// Let's inspect 50 lines before driverToolsModal
for (let i = Math.max(0, modalLine - 30); i <= modalLine + 5; i++) {
    console.log((i + 1) + ': ' + lines[i]);
}
