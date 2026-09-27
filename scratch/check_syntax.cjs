const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Checking JS files for syntax errors ---');
function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                checkDirectory(fullPath);
            }
        } else if (file.endsWith('.js')) {
            try {
                const code = fs.readFileSync(fullPath, 'utf8');
                new vm.Script(code, { filename: fullPath });
                console.log('OK:', fullPath);
            } catch (e) {
                console.error('SYNTAX ERROR in', fullPath, ':\n', e.message);
            }
        }
    }
}

checkDirectory('./js');
checkDirectory('./src/js');
