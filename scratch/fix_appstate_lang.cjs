const fs = require('fs');
const path = require('path');

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist') scanDir(full);
        } else if (f.endsWith('.js')) {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                // Match appState.lang without typeof appState check on that line
                if (line.includes('appState.lang') && !line.includes('typeof appState')) {
                    console.log(`${full}:${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
}

console.log('Unsafe appState.lang usage found:');
scanDir('./js');
scanDir('./src/js');
