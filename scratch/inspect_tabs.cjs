const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING FOR TAB SECTIONS ===');
lines.forEach((l, i) => {
    if (l.includes('switchTab') || l.includes('tabContent') || l.includes('tab-') || l.includes('section-') || l.includes('dashboardSection')) {
        if (i < 2000) console.log(`${i+1}: ${l.trim().slice(0, 100)}`);
    }
});
