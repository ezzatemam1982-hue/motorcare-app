const fs = require('fs');

function checkPNGHeader(filename) {
    if (!fs.existsSync(filename)) return;
    const buf = fs.readFileSync(filename);
    console.log(filename, 'Length:', buf.length);
}

checkPNGHeader('logo.png');
checkPNGHeader('logo-transparent.png');
checkPNGHeader('logo-wide.png');
checkPNGHeader('logo-tight.png');
