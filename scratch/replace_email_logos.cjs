const fs = require('fs');

const newB64 = fs.readFileSync('email_logo_base64.txt', 'utf8').trim();

const filesToUpdate = [
  'js/services/auth.js',
  'src/js/services/auth.js',
  'js/services/feedback.js',
  'src/js/services/feedback.js'
];

filesToUpdate.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let matches = content.match(/data:image\/(?:jpeg|png);base64,\/9j\/4AAQSkZJRg[^\"]+/g);
  let count = matches ? matches.length : 0;
  if (count > 0) {
    matches.forEach(m => {
      content = content.replace(m, newB64);
    });
    fs.writeFileSync(file, content, 'utf8');
  }
  console.log(`Updated ${file}: replaced ${count} old email logo(s).`);
});
