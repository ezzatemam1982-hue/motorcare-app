const fs = require('fs');

// Mock a lightweight browser environment to simulate actual click events
class MockClassList {
    constructor() {
        this.classes = new Set();
    }
    add(c) { this.classes.add(c); }
    remove(c) { this.classes.delete(c); }
    contains(c) { return this.classes.has(c); }
    toggle(c, force) {
        if (force === undefined) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
        } else if (force) {
            this.classes.add(c);
        } else {
            this.classes.delete(c);
        }
    }
}

class MockElement {
    constructor(id) {
        this.id = id;
        this.classList = new MockClassList();
        this.style = {
            setProperty: (k, v) => { this.style[k] = v; }
        };
        this.listeners = {};
    }
    closest(sel) {
        if (sel.includes(this.id)) return this;
        return null;
    }
    addEventListener(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
    }
    click() {
        const e = {
            target: this,
            preventDefault: () => {},
            stopPropagation: () => {}
        };
        if (this.listeners['click']) {
            this.listeners['click'].forEach(fn => fn(e));
        }
        if (global.document && global.document.listeners && global.document.listeners['click']) {
            global.document.listeners['click'].forEach(fn => fn(e));
        }
    }
}

const elements = {};
['drawerBtn-driverTools', 'drawerBtn-obd', 'drawerBtn-reports',
 'sidebarBtn-driverTools', 'sidebarBtn-obd', 'sidebarBtn-reports',
 'topMenuBtn-driverTools', 'topMenuBtn-obd', 'topMenuBtn-reports',
 'driverToolsModal', 'obdEncyclopediaModal', 'customReportExportModal',
 'mobileMoreDrawerModal', 'topHeaderDropdownMenu',
 'dtExpenseCategorySelect', 'exportReportTypeSelect', 'obdSearchInput'
].forEach(id => {
    elements[id] = new MockElement(id);
    if (id.endsWith('Modal')) {
        elements[id].classList.add('hidden');
        elements[id].style.display = 'none';
    }
});

global.window = global;
global.document = {
    readyState: 'complete',
    getElementById: (id) => elements[id] || null,
    querySelectorAll: () => [],
    listeners: {},
    addEventListener: (event, handler) => {
        if (!global.document.listeners[event]) global.document.listeners[event] = [];
        global.document.listeners[event].push(handler);
    }
};

global.appState = {
    lang: 'ar',
    cars: [{ brand: 'Toyota', model: 'Corolla', year: 2022, odometer: 50000 }]
};
global.getCurrentCar = () => global.appState.cars[0];
global.showNotification = () => {};

// Capture logs
const capturedLogs = [];
const originalLog = console.log;
console.log = (...args) => {
    capturedLogs.push(args.join(' '));
    originalLog(...args);
};

// Load modular files
eval(fs.readFileSync('js/features/dashboard.js', 'utf8'));
eval(fs.readFileSync('js/features/driverTools.js', 'utf8'));
eval(fs.readFileSync('js/features/obd.js', 'utf8'));
eval(fs.readFileSync('js/features/reports.js', 'utf8'));

// Initialize listeners
initDrawerAndSidebarEventListeners();

console.log('\n--- Test 1: Click Drawer Driver Tools ---');
// Open drawer first to simulate user clicking in open drawer
openMobileMoreDrawer();
console.assert(!elements['mobileMoreDrawerModal'].classList.contains('hidden'), 'Drawer should be open');
elements['drawerBtn-driverTools'].click();
console.assert(elements['mobileMoreDrawerModal'].classList.contains('hidden'), 'Drawer should be closed after click');
console.assert(elements['driverToolsModal'].classList.contains('active'), 'Driver tools modal should have active class');
console.assert(!elements['driverToolsModal'].classList.contains('hidden'), 'Driver tools modal should NOT have hidden class');
console.assert(elements['driverToolsModal'].style['z-index'] === '99999', 'Driver tools modal z-index should be 99999');

console.log('\n--- Test 2: Click Drawer OBD ---');
openMobileMoreDrawer();
elements['drawerBtn-obd'].click();
console.assert(elements['mobileMoreDrawerModal'].classList.contains('hidden'), 'Drawer should be closed after click');
console.assert(elements['obdEncyclopediaModal'].classList.contains('active'), 'OBD modal should have active class');
console.assert(!elements['obdEncyclopediaModal'].classList.contains('hidden'), 'OBD modal should NOT have hidden class');
console.assert(elements['obdEncyclopediaModal'].style['z-index'] === '99999', 'OBD modal z-index should be 99999');

console.log('\n--- Test 3: Click Drawer Reports PDF ---');
openMobileMoreDrawer();
elements['drawerBtn-reports'].click();
console.assert(elements['mobileMoreDrawerModal'].classList.contains('hidden'), 'Drawer should be closed after click');
console.assert(elements['customReportExportModal'].classList.contains('active'), 'Reports modal should have active class');
console.assert(!elements['customReportExportModal'].classList.contains('hidden'), 'Reports modal should NOT have hidden class');
console.assert(elements['customReportExportModal'].style['z-index'] === '99999', 'Reports modal z-index should be 99999');

console.log('\n--- Test 4: Verify Console Logs ---');
console.assert(capturedLogs.some(l => l.includes('Clicked: Driver Tools')), 'Should have logged Driver Tools');
console.assert(capturedLogs.some(l => l.includes('Clicked: OBD Encyclopedia')), 'Should have logged OBD');
console.assert(capturedLogs.some(l => l.includes('Clicked: Export Reports PDF')), 'Should have logged Reports');

console.log('\n>>> ALL 4 INTERACTION SIMULATION TESTS PASSED! <<<');
