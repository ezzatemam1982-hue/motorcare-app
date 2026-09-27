const fs = require('fs');
const vm = require('vm');

console.log('====================================================');
console.log('🧪 MotorCare Feature Integration & Persistence Test');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// Check syntax of all modified JS files
const filesToCheck = [
  'js/services/mobile.js',
  'js/features/documents.js',
  'js/features/fuel.js',
  'js/features/maintenance.js',
  'js/features/inspection.js',
  'js/data/brandLogos.js',
  'js/features/garage.js',
  'js/data/batteryMarket.js',
  'js/features/battery.js',
  'src/js/services/mobile.js',
  'src/js/features/documents.js',
  'src/js/features/fuel.js',
  'src/js/features/maintenance.js',
  'src/js/features/inspection.js',
  'src/js/data/brandLogos.js',
  'src/js/features/garage.js',
  'src/js/data/batteryMarket.js',
  'src/js/features/battery.js'
];

console.log('--- 1. JavaScript Syntax Verification ---');
filesToCheck.forEach(f => {
  try {
    const code = fs.readFileSync(f, 'utf8');
    new vm.Script(code);
    assert(true, `Syntax valid: ${f}`);
  } catch (err) {
    assert(false, `Syntax error in ${f}: ${err.message}`);
  }
});

// 2. Test documents persistence
console.log('\n--- 2. Testing Documents Persistence Logic ---');
const docCode = fs.readFileSync('js/features/documents.js', 'utf8');
assert(docCode.includes("tempImages['doc_vehicle']"), 'documents.js binds tempImages["doc_vehicle"]');
assert(docCode.includes("tempImages['doc_driver']"), 'documents.js binds tempImages["doc_driver"]');
assert(docCode.includes("tempImages['doc_insp']"), 'documents.js binds tempImages["doc_insp"]');
assert(docCode.includes("tempImages['doc_insurance']"), 'documents.js binds tempImages["doc_insurance"]');
assert(docCode.includes("updateAttachmentUI('doc_vehicle'"), 'documents.js calls updateAttachmentUI for doc_vehicle');
assert(docCode.includes("updateAttachmentUI('doc_driver'"), 'documents.js calls updateAttachmentUI for doc_driver');
assert(docCode.includes("updateAttachmentUI('doc_insp'"), 'documents.js calls updateAttachmentUI for doc_insp');
assert(docCode.includes("updateAttachmentUI('doc_insurance'"), 'documents.js calls updateAttachmentUI for doc_insurance');

// 3. Test fuel persistence
console.log('\n--- 3. Testing Fuel Persistence Logic ---');
const fuelCode = fs.readFileSync('js/features/fuel.js', 'utf8');
assert(fuelCode.includes("updateAttachmentUI('fuel'"), 'fuel.js calls updateAttachmentUI for fuel');
assert(fuelCode.includes("receiptImage"), 'fuel.js persists receiptImage');

// 4. Test maintenance persistence
console.log('\n--- 4. Testing Maintenance Persistence Logic ---');
const maintCode = fs.readFileSync('js/features/maintenance.js', 'utf8');
assert(maintCode.includes("updateAttachmentUI('invoice'"), 'maintenance.js calls updateAttachmentUI for invoice');
assert(maintCode.includes("invoiceImage"), 'maintenance.js persists invoiceImage');

// 5. Test inspection persistence
console.log('\n--- 5. Testing Inspection Persistence Logic ---');
const inspCode = fs.readFileSync('js/features/inspection.js', 'utf8');
assert(inspCode.includes("updateAttachmentUI('inspection'"), 'inspection.js calls updateAttachmentUI for inspection');
assert(inspCode.includes("car.inspectionChecklist.image = tempImages['inspection']"), 'inspection.js persists checklist image');

// 6. Test garage persistence
console.log('\n--- 6. Testing Garage / Car Photo Persistence Logic ---');
const garageCode = fs.readFileSync('js/features/garage.js', 'utf8');
const brandLogosCode = fs.readFileSync('js/data/brandLogos.js', 'utf8');
assert(garageCode.includes("updateAttachmentUI('car_photo'"), 'garage.js calls updateAttachmentUI for car_photo');
assert(brandLogosCode.includes("updateAttachmentUI('edit_car_photo'"), 'brandLogos.js calls updateAttachmentUI for edit_car_photo');
assert(garageCode.includes("tempImages['car_photo']"), 'garage.js persists new car photo');
assert(brandLogosCode.includes("tempImages['edit_car_photo']"), 'brandLogos.js persists edited car photo');

// 7. Test battery & tires persistence
console.log('\n--- 7. Testing Battery & Tires Persistence Logic ---');
const battCode = fs.readFileSync('js/data/batteryMarket.js', 'utf8');
const tiresCode = fs.readFileSync('js/features/battery.js', 'utf8');
assert(battCode.includes("updateAttachmentUI('battery'"), 'batteryMarket.js calls updateAttachmentUI for battery');
assert(battCode.includes("warrantyImage: tempImages['battery']"), 'batteryMarket.js persists warrantyImage');
assert(tiresCode.includes("updateAttachmentUI('tires'"), 'battery.js calls updateAttachmentUI for tires');
assert(tiresCode.includes("warrantyImage: tempImages['tires']"), 'battery.js persists warrantyImage');

console.log('\n====================================================');
console.log(`📊 Test Results: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
