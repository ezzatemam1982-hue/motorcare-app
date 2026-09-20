
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match, count = 0;
let errors = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    const code = match[1].trim();
    if (code) {
        count++;
        try {
            new Function(code);
            console.log('Script #' + count + ' syntax: OK (' + code.length + ' chars)');
        } catch(e) {
            errors++;
            console.error('Script #' + count + ' syntax error:', e.message);
        }
    }
}
process.exit(errors > 0 ? 1 : 0);
