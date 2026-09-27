const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Find all elements with id containing 'Modal' or 'Drawer'
const regex = /<div\s+[^>]*id="([^"]*)"[^>]*>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
    const fullTag = match[0];
    const id = match[1];
    if (id.toLowerCase().includes('modal') || id.toLowerCase().includes('drawer')) {
        const hasHidden = fullTag.includes('hidden');
        console.log(`ID: ${id.padEnd(35)} | Has 'hidden' class: ${hasHidden} | Tag: ${fullTag.substring(0, 100)}...`);
    }
}
