const fs = require('fs');

function findLine(filename) {
    const lines = fs.readFileSync(filename, 'utf8').split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('closeImageAttachmentActionSheet') || (line.includes('fixed inset-0') && !line.includes('hidden'))) {
            if (!line.includes('landingScreen') && !line.includes('networkStatusBanner') && !line.includes('appToastContainer')) {
                console.log(`${filename}:${idx + 1}: ${line}`);
            }
        }
    });
}

findLine('index.html');
findLine('src/index.html');
