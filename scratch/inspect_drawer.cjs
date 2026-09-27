const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const start = content.indexOf('id="mobileMoreDrawerModal"');
const end = content.indexOf('<!-- نافذة استعراض ومشاركة المستندات والفواتير (Lightbox) -->', start);
const drawerHtml = content.slice(start, end);

console.log('=== DRAWER HTML SNIPPET ===');
const lines = drawerHtml.split('\n');
lines.forEach((l, i) => {
    console.log(`${i+1}: ${l}`);
});
