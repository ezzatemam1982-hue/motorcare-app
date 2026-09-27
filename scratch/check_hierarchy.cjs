const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

// Use a regex to find all opening tags and closing tags in order
const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*?)>/g;
let match;
let stack = [];
let targetLine = 0;

let lines = content.split('\n');
lines.forEach((l, idx) => {
    if (l.includes('id="driverToolsModal"')) targetLine = idx;
});

let pos = 0;
while ((match = tagRegex.exec(content)) !== null) {
    if (match[0].startsWith('<!--')) continue;
    const isClose = match[1] === '/';
    const tag = match[2].toLowerCase();
    const attrs = match[3] || '';
    
    // Calculate line number
    const index = match.index;
    const lineNum = content.slice(0, index).split('\n').length;
    
    if (attrs.includes('id="driverToolsModal"')) {
        console.log(`Found driverToolsModal at line ${lineNum}! Current open tags stack:`);
        stack.forEach(s => console.log(`  <${s.tag} id="${s.id}" class="${s.class}"> (opened at line ${s.line})`));
        break;
    }
    
    if (['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag)) {
        continue;
    }
    
    if (isClose) {
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tag === tag) {
                stack.splice(i, 1);
                break;
            }
        }
    } else {
        const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
        const classMatch = attrs.match(/class\s*=\s*["']([^"']+)["']/i);
        const selfClose = attrs.trim().endsWith('/');
        if (!selfClose) {
            stack.push({
                tag,
                id: idMatch ? idMatch[1] : '',
                class: classMatch ? classMatch[1].slice(0, 30) : '',
                line: lineNum
            });
        }
    }
}
