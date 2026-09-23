const fs = require('fs');

function fixFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\r\n');
    let foundLogo = false;
    let foundCheck = false;

    for (let i = 0; i < lines.length; i++) {
        // Line has duplicate logo followed by h1
        if (lines[i].includes('alt="MotorCare"') && lines[i].includes('مرحباً بك في MotorCare</h1>')) {
            const h1Idx = lines[i].indexOf('<h1');
            if (h1Idx !== -1) {
                console.log(`[${filePath}] Found duplicate logo on line ${i + 1}`);
                lines[i] = '    ' + lines[i].substring(h1Idx);
                foundLogo = true;
            }
        }
        if (lines[i].includes('تم تفعيل وتوثيق حسابك بنجاح &check;')) {
            console.log(`[${filePath}] Found &check; on line ${i + 1}`);
            lines[i] = lines[i].replace('&check;', '✓');
            foundCheck = true;
        }
    }

    if (foundLogo || foundCheck) {
        fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
        console.log(`[${filePath}] Successfully saved.`);
    } else {
        console.log(`[${filePath}] Warning: No patterns matched.`);
    }
}

fixFile('index.html');
fixFile('src/index.html');
