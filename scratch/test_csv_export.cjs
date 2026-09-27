const fs = require('fs');

const reportsJs = fs.readFileSync('js/features/reports.js', 'utf8');

// Mock browser objects
global.window = global;
global.appState = {
    lang: 'ar',
    cars: [{ id: 'car1', brand: 'Toyota', model: 'Corolla', history: [], fuelLogs: [] }],
    activeCarId: 'car1'
};
global.getCurrentCar = () => global.appState.cars[0];
global.document = {
    getElementById: (id) => {
        if (id === 'exportReportTypeSelect') return { value: 'all' };
        if (id === 'exportReportFromDate') return { value: '' };
        if (id === 'exportReportToDate') return { value: '' };
        if (id === 'exportMaintTypeFilter') return { value: 'ALL' };
        return null;
    },
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    createElement: () => ({ setAttribute: () => {}, click: () => {} })
};
global.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };
global.Blob = class {};
global.showNotification = (msg, type) => console.log(`[Notification ${type}]: ${msg}`);

eval(reportsJs);

console.log("Calling exportCustomReportCSV()...");
window.exportCustomReportCSV();
