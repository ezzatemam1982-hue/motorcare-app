const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*?)>/g;
let match;
let stack = [];

['customReportExportModal', 'obdEncyclopediaModal', 'driverToolsModal'].forEach(targetId => {
    let stackLocal = [];
    tagRegex.lastIndex = 0;
    while ((match = tagRegex.exec(content)) !== null) {
        if (match[0].startsWith('<!--')) continue;
        const isClose = match[1] === '/';
        const tag = match[2].toLowerCase();
        const attrs = match[3] || '';
        
        if (attrs.includes(`id="${targetId}"`)) {
            console.log(`\nParent stack for ${targetId}:`);
            stackLocal.forEach(s => console.log(`  <${s.tag}${s.id ? ' id="' + s.id + '"' : ''}>`));
            break;
        }
        
        if (['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag)) {
            continue;
        }
        
        if (isClose) {
            for (let i = stackLocal.length - 1; i >= 0; i--) {
                if (stackLocal[i].tag === tag) {
                    stackLocal.splice(i, 1);
                    break;
                }
            }
        } else {
            const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
            const selfClose = attrs.trim().endsWith('/');
            if (!selfClose) {
                stackLocal.push({
                    tag,
                    id: idMatch ? idMatch[1] : ''
                });
            }
        }
    }
});
