const fs = require('fs');

console.log('=== CHECKING switchTab in js/features/dashboard.js ===');
const dashContent = fs.readFileSync('js/features/dashboard.js', 'utf8');
const lines = dashContent.split('\n');
let inSwitchTab = false;
lines.forEach((l, i) => {
    if (l.includes('function switchTab(')) inSwitchTab = true;
    if (inSwitchTab) {
        console.log(`${i+1}: ${l}`);
        if (l.trim() === '}' && i > 30) inSwitchTab = false;
    }
});

console.log('\n=== CHECKING CSS for hidden-section ===');
function searchCss(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir, {withFileTypes: true}).forEach(e => {
        if (e.isDirectory()) searchCss(dir + '/' + e.name);
        else if (e.name.endsWith('.css') || e.name.endsWith('.html')) {
            const content = fs.readFileSync(dir + '/' + e.name, 'utf8');
            if (content.includes('hidden-section')) {
                console.log(`Found in ${dir}/${e.name}`);
            }
        }
    });
}
searchCss('.');
