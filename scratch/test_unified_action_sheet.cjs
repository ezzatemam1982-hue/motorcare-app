const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('🧪 MotorCare Unified Document & Attachment Test Suite');
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

// 1. Check index.html and src/index.html
console.log('--- 1. Testing HTML Markup & Unified Elements ---');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const srcIndexHtml = fs.readFileSync('src/index.html', 'utf8');

assert(indexHtml === srcIndexHtml, 'index.html and src/index.html are in sync');

// Action Sheet Modal
assert(indexHtml.includes('id="imageActionSheetModal"'), '#imageActionSheetModal exists in index.html');
assert(indexHtml.includes('id="actionSheetTitle"'), '#actionSheetTitle exists');
assert(indexHtml.includes('id="actionSheetSubtitle"'), '#actionSheetSubtitle exists');
assert(indexHtml.includes("triggerActionSheetOption('camera')"), 'Camera action button exists');
assert(indexHtml.includes("triggerActionSheetOption('gallery')"), 'Gallery action button exists');
assert(indexHtml.includes('closeImageAttachmentActionSheet()'), 'Cancel / Close button exists');

// Target keys to check
const targetKeys = [
  { key: 'fuel', name: 'Fuel Receipt' },
  { key: 'invoice', name: 'Maintenance Invoice' },
  { key: 'doc_vehicle', name: 'Vehicle License' },
  { key: 'doc_driver', name: 'Driver License' },
  { key: 'doc_insp', name: 'Technical Inspection License' },
  { key: 'doc_insurance', name: 'Insurance Policy' },
  { key: 'inspection', name: 'Comprehensive Inspection' },
  { key: 'battery', name: 'Battery Warranty' },
  { key: 'tires', name: 'Tires Warranty' },
  { key: 'car_photo', name: 'New Car Photo' },
  { key: 'edit_car_photo', name: 'Edit Car Photo' }
];

console.log('\n--- 2. Checking Unified Action Sheet Buttons & Previews ---');
targetKeys.forEach(({ key, name }) => {
  const hasButton = indexHtml.includes(`openImageAttachmentActionSheet('${key}')`);
  const hasPreview = indexHtml.includes(`id="${key}ImagePreviewBox"`);
  const hasThumb = indexHtml.includes(`id="${key}ImagePreviewThumb"`);
  const hasClear = indexHtml.includes(`clearAttachedImage('${key}')`);

  assert(hasButton, `[${name}] Unified Action Sheet button exists for key: ${key}`);
  assert(hasPreview, `[${name}] Thumbnail Preview Box (${key}ImagePreviewBox) exists`);
  assert(hasThumb, `[${name}] Thumbnail Image element (${key}ImagePreviewThumb) exists`);
  assert(hasClear, `[${name}] Delete button clearAttachedImage('${key}') exists`);
});

console.log('\n--- 3. Testing Logic & Lifecycle in mobile.js with Mock DOM ---');

// Setup Mock DOM
const mockElements = {};
function createMockElement(id) {
  return {
    id: id,
    classList: {
      classes: new Set(['hidden']),
      add(cls) { this.classes.add(cls); },
      remove(cls) { this.classes.delete(cls); },
      contains(cls) { return this.classes.has(cls); }
    },
    src: '',
    value: '',
    innerText: '',
    innerHTML: '',
    style: {}
  };
}

// Populate mock elements for each key
targetKeys.forEach(({ key }) => {
  mockElements[`${key}ImagePreviewBox`] = createMockElement(`${key}ImagePreviewBox`);
  mockElements[`${key}ImagePreviewThumb`] = createMockElement(`${key}ImagePreviewThumb`);
  mockElements[`${key}ImageBadge`] = createMockElement(`${key}ImageBadge`);
  mockElements[`${key}PreviewModal`] = createMockElement(`${key}PreviewModal`);
});
mockElements['imageActionSheetModal'] = createMockElement('imageActionSheetModal');
mockElements['actionSheetTitle'] = createMockElement('actionSheetTitle');
mockElements['actionSheetSubtitle'] = createMockElement('actionSheetSubtitle');
mockElements['actionSheetFileInput'] = createMockElement('actionSheetFileInput');
mockElements['actionSheetCameraInput'] = createMockElement('actionSheetCameraInput');
mockElements['fuelPreviewModal'] = createMockElement('fuelPreviewModal');
mockElements['fuelFullImage'] = createMockElement('fuelFullImage');
mockElements['invoicePreviewModal'] = createMockElement('invoicePreviewModal');
mockElements['invoiceFullImage'] = createMockElement('invoiceFullImage');

const sandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById(id) {
      if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
      }
      return mockElements[id];
    }
  },
  console: console,
  tempImages: {},
  appState: { lang: 'ar' },
  showNotification: (msg, type) => { console.log(`    [Notification: ${type}] ${msg}`); },
  Capacitor: {
    isNativePlatform: () => false
  }
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.window.removeEventListener = () => {};

const mobileJsCode = fs.readFileSync('js/services/mobile.js', 'utf8');
vm.createContext(sandbox);
vm.runInContext(mobileJsCode, sandbox);

assert(typeof sandbox.openImageAttachmentActionSheet === 'function', 'openImageAttachmentActionSheet is defined');
assert(typeof sandbox.closeImageAttachmentActionSheet === 'function', 'closeImageAttachmentActionSheet is defined');
assert(typeof sandbox.updateAttachmentUI === 'function', 'updateAttachmentUI is defined');
assert(typeof sandbox.clearAttachedImage === 'function', 'clearAttachedImage is defined');

// Test opening action sheet for 'fuel'
sandbox.openImageAttachmentActionSheet('fuel');
assert(
  !mockElements['imageActionSheetModal'].classList.contains('hidden'),
  'Action sheet modal opens (hidden removed)'
);
assert(
  mockElements['actionSheetTitle'].innerText.includes('الوقود') || mockElements['actionSheetTitle'].innerText.includes('إيصال'),
  `Action sheet dynamic title set correctly for fuel: "${mockElements['actionSheetTitle'].innerText}"`
);

// Test closing action sheet
sandbox.closeImageAttachmentActionSheet();
assert(
  mockElements['imageActionSheetModal'].classList.contains('hidden'),
  'Action sheet modal closes (hidden added)'
);

// Test setting attachment image via updateAttachmentUI
const sampleDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';
sandbox.updateAttachmentUI('fuel', sampleDataUrl);
assert(
  !mockElements['fuelImagePreviewBox'].classList.contains('hidden'),
  'fuelImagePreviewBox becomes visible on updateAttachmentUI'
);
assert(
  mockElements['fuelImagePreviewThumb'].src === sampleDataUrl,
  'fuelImagePreviewThumb src updated to attached image'
);

// Test clearing attached image
sandbox.tempImages['fuel'] = sampleDataUrl;
sandbox.clearAttachedImage('fuel');
assert(
  mockElements['fuelImagePreviewBox'].classList.contains('hidden'),
  'fuelImagePreviewBox is hidden on clearAttachedImage'
);
assert(
  mockElements['fuelImagePreviewThumb'].src === '',
  'fuelImagePreviewThumb src cleared'
);
assert(
  !sandbox.tempImages['fuel'],
  'sandbox.tempImages["fuel"] cleared'
);

// Test all keys with updateAttachmentUI
let allKeysPassed = true;
targetKeys.forEach(({ key }) => {
  sandbox.updateAttachmentUI(key, sampleDataUrl);
  if (mockElements[`${key}ImagePreviewBox`].classList.contains('hidden')) {
    allKeysPassed = false;
  }
  sandbox.clearAttachedImage(key);
  if (!mockElements[`${key}ImagePreviewBox`].classList.contains('hidden')) {
    allKeysPassed = false;
  }
});
assert(allKeysPassed, 'All 11 target keys successfully updated and cleared via updateAttachmentUI');

console.log('\n====================================================');
console.log(`📊 Test Results: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
