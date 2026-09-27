const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
console.log('index.html has css/style.css:', content.includes('css/style.css'));
console.log('matches:', content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/g));
