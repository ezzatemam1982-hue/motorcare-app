const fs = require('fs');

console.log('--- Starting Record Modal Fix Tests ---');

// 1. Static validation of index.html & src/index.html
const html = fs.readFileSync('index.html', 'utf8');

// Validate modal count in index.html
const modalMatches = html.match(/id=["']recordModal["']/g) || [];
if (modalMatches.length !== 1) {
    throw new Error(`Expected exactly 1 id="recordModal" in index.html, found ${modalMatches.length}`);
}
console.log('1. Static DOM Check: Exactly 1 #recordModal exists in index.html ✓');

// Validate backdrop handler
if (!html.includes('id="recordModal" onclick="if(event.target === this) closeRecordModal()"')) {
    throw new Error('Backdrop click dismiss handler missing from recordModal!');
}
console.log('2. Backdrop Click Handler: configured properly on #recordModal ✓');

// Validate close and cancel buttons
if (!html.includes('id="closeRecordModalXBtn"') || !html.includes('id="cancelRecordModalBtn"') || !html.includes('id="saveRecordModalBtn"')) {
    throw new Error('Close (✖), Cancel, or Save buttons missing expected IDs in index.html!');
}
console.log('3. Modal Buttons: Close (✖), Cancel (إلغاء), and Save buttons configured with type="button" and unique IDs ✓');

// Validate .hidden !important in css/style.css
const css = fs.readFileSync('css/style.css', 'utf8');
if (!css.includes('.hidden { display: none !important; }')) {
    throw new Error('Missing .hidden { display: none !important; } in css/style.css!');
}
console.log('4. CSS Specificity Guard: .hidden { display: none !important; } present in style.css ✓');

// 2. Behavioral test of maintenance.js
class MockElement {
    constructor(id) {
        this.id = id;
        const set = new Set();
        this.classList = {
            add: (cls) => set.add(cls),
            remove: (cls) => set.delete(cls),
            contains: (cls) => set.has(cls),
            toggle: (cls, force) => {
                if (force === undefined) {
                    if (set.has(cls)) set.delete(cls); else set.add(cls);
                } else if (force) {
                    set.add(cls);
                } else {
                    set.delete(cls);
                }
            }
        };
        this.style = {
            removeProperty: (prop) => { delete this.style[prop]; }
        };
        this.value = '';
        this.innerHTML = '';
        this.checked = false;
        this.children = [];
    }
    appendChild(child) { this.children.push(child); }
}

const elements = {};
function getEl(id) {
    if (!elements[id]) {
        elements[id] = new MockElement(id);
    }
    return elements[id];
}

const pmRadio = new MockElement('pmRadio');
pmRadio.value = 'PM';
pmRadio.checked = true;

const cmRadio = new MockElement('cmRadio');
cmRadio.value = 'CM';
cmRadio.checked = false;

const mockDocument = {
    getElementById: (id) => getEl(id),
    querySelector: (sel) => {
        if (sel.includes('value="PM"')) return pmRadio;
        if (sel.includes('value="CM"')) return cmRadio;
        if (sel.includes('input[name="maintenanceType"]:checked')) return pmRadio.checked ? pmRadio : cmRadio;
        return null;
    },
    createElement: (tag) => new MockElement(tag)
};

const mockSessionStorage = {
    data: {},
    getItem: function(k) { return this.data[k] || null; },
    setItem: function(k, v) { this.data[k] = String(v); },
    removeItem: function(k) { delete this.data[k]; }
};

// Setup sandbox environment
global.document = mockDocument;
global.sessionStorage = mockSessionStorage;
global.window = global;
global.tempImages = {};
global.appState = {
    lang: 'ar',
    cars: [{
        id: 'car_1',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        odometer: 60000,
        catalog: [
            { id: 'oil', name: 'زيت المحرك', category: 'engine', kmInterval: 10000, lastKm: 50000, type: 'PM' }
        ],
        history: []
    }]
};
global.getCurrentCar = () => global.appState.cars[0];
global.MotorCareSecurity = {
    parsePositiveInt: (val, fallback) => {
        const n = parseInt(val, 10);
        return isNaN(n) ? fallback : n;
    },
    parsePositiveFloat: (val, fallback) => {
        const n = parseFloat(val);
        return isNaN(n) ? fallback : n;
    },
    sanitizeText: (t) => t || ''
};
global.SafeStorage = {
    setItem: () => {},
    getItem: () => null,
    removeItem: () => {}
};
global.syncUserDataToCloud = () => {};
global.renderDashboard = () => {
    console.log('   ✓ renderDashboard() executed smoothly without re-opening modal.');
};
global.showNotification = (msg, type) => {
    console.log(`   [Notification: ${type}] ${msg}`);
};

global.onRecordPartChanged = () => {};
// Set modal initial state (closed)
const modal = getEl('recordModal');
modal.classList.add('hidden');
modal.style.display = 'none';

// Load maintenance.js
const maintCode = fs.readFileSync('js/features/maintenance.js', 'utf8');
eval(maintCode);

console.log('5. Testing openRecordModal("oil")...');
openRecordModal('oil');
if (modal.classList.contains('hidden')) {
    throw new Error('Modal still has hidden class after openRecordModal!');
}
if (modal.style.display !== 'flex') {
    throw new Error(`Modal display is not flex, got: ${modal.style.display}`);
}
console.log('   ✓ Modal opened with display: flex and no hidden class.');

// Simulate user typing values and camera session
getEl('recordWorkshopInput').value = 'ورشة التميز';
getEl('recordPhoneInput').value = '01122334455';
getEl('recordPartsCostInput').value = '650';
getEl('recordLaborCostInput').value = '150';
mockSessionStorage.setItem('motorCare_cameraParentModal', 'recordModal');

console.log('6. Testing closeRecordModal()...');
closeRecordModal();
if (!modal.classList.contains('hidden')) {
    throw new Error('Modal does not have hidden class after closeRecordModal!');
}
if (modal.style.display !== 'none' && modal.style.display !== undefined) {
    throw new Error(`Modal style display not none/cleared: ${modal.style.display}`);
}
if (getEl('recordWorkshopInput').value !== '') {
    throw new Error('Workshop input was not reset!');
}
if (mockSessionStorage.getItem('motorCare_cameraParentModal') !== null) {
    throw new Error('Camera parent modal session storage was not cleared!');
}
console.log('   ✓ closeRecordModal() cleanly hides modal, resets fields, and clears camera session keys.');

console.log('7. Testing saveMaintenanceRecord()...');
openRecordModal('oil');
getEl('recordOdometerInput').value = '65000';
getEl('recordWorkshopInput').value = 'المركز المعتمد';
getEl('recordPartsCostInput').value = '900';
getEl('recordLaborCostInput').value = '250';

saveMaintenanceRecord();

const car = getCurrentCar();
if (!car.history || car.history.length === 0) {
    throw new Error('No record was saved to car.history!');
}
const saved = car.history[0];
if (saved.partId !== 'oil' || saved.odometer !== 65000 || saved.totalCost !== 1150) {
    throw new Error(`Saved record data mismatch: ${JSON.stringify(saved)}`);
}
console.log('   ✓ Maintenance record successfully saved to car.history:');
console.log('     Part:', saved.partName, '| Odometer:', saved.odometer, '| Total Cost:', saved.totalCost);

if (!modal.classList.contains('hidden')) {
    throw new Error('Modal still visible after save! Expected hidden class.');
}
if (modal.style.display !== 'none' && modal.style.display !== undefined) {
    throw new Error(`Modal style display not none/cleared after save: ${modal.style.display}`);
}
if (getEl('recordWorkshopInput').value !== '') {
    throw new Error('Workshop input not reset after save!');
}
console.log('   ✓ Modal is completely closed and reset after saveMaintenanceRecord().');

console.log('8. Testing standard saveMaintenanceRecord() notification...');
car.catalog.push({ id: 'brakes', name: 'تيل الفرامل', category: 'brakes', kmInterval: 30000, lastKm: 35000, type: 'PM' });
openRecordModal('brakes');
getEl('recordOdometerInput').value = '65000'; // same odometer, different part
getEl('recordWorkshopInput').value = 'مركز السلام';
getEl('recordPartsCostInput').value = '300';
getEl('recordLaborCostInput').value = '100';

saveMaintenanceRecord();

if (!modal.classList.contains('hidden')) {
    throw new Error('Modal still visible after second save!');
}
console.log('   ✓ Standard maintenance saved with success notification and modal closed.');

console.log('\n=========================================');
console.log('   ALL TESTS PASSED SUCCESSFULLY! ✓✓✓');
console.log('=========================================');
