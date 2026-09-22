const fs = require('fs');

['index.html', 'src/index.html'].forEach(filename => {
    const html = fs.readFileSync(filename, 'utf8');
    const matches = [...html.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
    let errCount = 0;
    matches.forEach((m, idx) => {
        const code = m[1].trim();
        if (code.length > 0 && !m[0].includes('src=')) {
            try {
                new Function(code);
            } catch (e) {
                console.error(`[SYNTAX ERROR] in ${filename} script #${idx+1}:`, e.message);
                errCount++;
            }
        }
    });
    if (errCount === 0) {
        console.log(`[PASS] ${filename}: All inline scripts validated cleanly with 0 syntax errors.`);
    }
});
