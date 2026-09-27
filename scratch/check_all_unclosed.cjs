const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9\-]+)([^>]*?)>/g;
let match;
let stack = [];

while ((match = tagRegex.exec(content)) !== null) {
    if (match[0].startsWith('<!--')) continue;
    const isClose = match[1] === '/';
    const tag = match[2].toLowerCase();
    const attrs = match[3] || '';
    
    const index = match.index;
    const lineNum = content.slice(0, index).split('\n').length;
    
    if (['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(tag)) {
        continue;
    }
    
    if (isClose) {
        let foundIndex = -1;
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].tag === tag) {
                foundIndex = i;
                break;
            }
        }
        if (foundIndex !== -1) {
            stack.splice(foundIndex, 1);
        }
    } else {
        const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
        const selfClose = attrs.trim().endsWith('/');
        if (!selfClose) {
            stack.push({
                tag,
                id: idMatch ? idMatch[1] : '',
                line: lineNum
            });
        }
    }
}

console.log('Unclosed tags at the end of index.html:');
stack.forEach(s => console.log(`  <${s.tag}${s.id ? ' id="' + s.id + '"' : ''}> opened at line ${s.line}`));
