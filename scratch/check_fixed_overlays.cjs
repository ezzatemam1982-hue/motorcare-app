const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const regex = /<div\s+[^>]*class="[^"]*fixed[^"]*"[^>]*>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
    const fullTag = match[0];
    const idMatch = fullTag.match(/id="([^"]*)"/);
    const id = idMatch ? idMatch[1] : 'NO_ID';
    const hasHidden = fullTag.includes('hidden');
    console.log(`ID: ${id.padEnd(35)} | Hidden: ${hasHidden ? 'YES' : 'NO (!)'} | Tag: ${fullTag.substring(0, 100)}`);
}
