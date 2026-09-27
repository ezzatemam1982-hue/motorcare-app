const fs = require('fs');
const vm = require('vm');

const context = {
    console: console,
    document: {
        getElementById: (id) => {
            return {
                id,
                classList: {
                    add: () => {},
                    remove: () => {},
                    contains: () => false
                },
                style: {
                    setProperty: () => {}
                },
                setAttribute: () => {},
                removeAttribute: () => {},
                addEventListener: () => {},
                children: [],
                parentElement: { appendChild: () => {} }
            };
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        body: { appendChild: () => {} }
    },
    window: {},
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: () => {} },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {}
};
context.window = context;
vm.createContext(context);

// Load all JS files
const scriptFiles = [
    'js/config/tailwind.config.js',
    'js/storage/storage.js',
    'js/security/security.js',
    'js/services/pwa.js',
    'js/services/mobile.js',
    'js/services/network.js',
    'js/services/notifications.js',
    'js/services/firebase.js',
    'js/data/dictionary.js',
    'js/data/brandLogos.js',
    'js/data/batteryMarket.js',
    'js/core/appState.js',
    'js/core/i18n.js',
    'js/core/catalogBuilder.js',
    'js/core/maintenanceEngine.js',
    'js/services/auth.js',
    'js/services/emergency.js',
    'js/services/feedback.js',
    'js/features/dashboard.js',
    'js/features/maintenance.js',
    'js/features/fuel.js',
    'js/features/analytics.js',
    'js/features/garage.js',
    'js/features/documents.js',
    'js/features/battery.js',
    'js/features/serviceCenters.js',
    'js/features/odometer.js',
    'js/features/inspection.js',
    'js/features/obd.js',
    'js/features/driverTools.js',
    'js/features/reports.js',
    'js/features/admin.js',
    'js/features/settings.js',
    'js/main.js'
];

scriptFiles.forEach(sf => {
    try {
        const code = fs.readFileSync(sf, 'utf8');
        vm.runInContext(code, context);
    } catch(e) {
        // ignore window.addEventListener error in test environment
    }
});

console.log('--- Testing Execution of Service Open Functions ---');
const serviceFns = [
    'openDriverToolsModal',
    'openObdEncyclopediaModal',
    'openExportReportsModal',
    'openEmergencyModal',
    'openServiceCentersModal',
    'openTrafficFinesModal',
    'openBatteryCatalogModal',
    'openBatteryModal',
    'openTiresDetailModal',
    'openDocumentsModal',
    'openFuelModal',
    'openOdometerModal',
    'openGarageModal',
    'openAddNewCarModal',
    'openEditCarModal',
    'openSettingsModal',
    'openNotificationsHubModal',
    'openMobileMoreDrawer',
    'closeMobileMoreDrawer',
    'switchTab'
];

serviceFns.forEach(fn => {
    try {
        if (typeof context[fn] === 'function') {
            context[fn]('expenses'); // pass dummy arg if needed
            console.log(`[PASS] ${fn} executed cleanly.`);
        } else {
            console.error(`[FAIL] ${fn} is NOT a function!`);
        }
    } catch (err) {
        console.error(`[ERROR] ${fn} failed with error:`, err.message);
    }
});
