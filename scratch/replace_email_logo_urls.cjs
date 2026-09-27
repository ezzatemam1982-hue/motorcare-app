const fs = require('fs');

const logoUrl = 'https://raw.githubusercontent.com/ezzatemam1982-hue/motorcare-app/main/logo-email.png';

const files = [
  'js/services/auth.js',
  'src/js/services/auth.js',
  'js/services/feedback.js',
  'src/js/services/feedback.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let matches = content.match(/data:image\/png;base64,iVBORw0KGgo[^\"]+/g);
  let count = matches ? matches.length : 0;
  if (count > 0) {
    matches.forEach(m => {
      content = content.replace(m, logoUrl);
    });
    fs.writeFileSync(file, content, 'utf8');
  }
  console.log(`Updated ${file}: replaced ${count} base64 logo(s) with hosted URL.`);
});
