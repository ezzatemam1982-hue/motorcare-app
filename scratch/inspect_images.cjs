const fs = require('fs');
const path = require('path');

const files = ['logo.png', 'logo-wide.png', 'logo-transparent.png', 'logo-tight.png', 'Reports_And_App_Headers.png', 'icon.png'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        const stat = fs.statSync(file);
        console.log(file, '-> Size:', stat.sizeBytes || stat.size, 'bytes');
    } else {
        console.log(file, '-> NOT FOUND');
    }
});
