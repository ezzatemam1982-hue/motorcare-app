const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const keys = [
  'fuel',
  'invoice',
  'doc_vehicle',
  'doc_driver',
  'doc_insp',
  'doc_insurance',
  'inspection',
  'battery',
  'tires',
  'car_photo',
  'edit_car_photo'
];

keys.forEach(k => {
  console.log(`=== KEY: ${k} ===`);
  const regex = new RegExp(`id=["'][^"']*${k}[^"']*["']`, 'gi');
  const matches = html.match(regex) || [];
  console.log([...new Set(matches)].join(', '));
});
