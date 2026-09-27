const fs = require('fs');
const vm = require('vm');

const context = {
    console: console,
    document: {
        getElementById: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, style: {} }),
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    window: {},
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: () => {} },
    setTimeout: () => {},
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {}
};
context.window = context;

vm.createContext(context);

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
    } catch (e) {
        console.error('ERROR evaluating', sf, ':', e.message);
    }
});

const fnNames = [
    'switchTab',
    'openRecordModal',
    'openFuelModal',
    'openExportReportsModal',
    'openDriverToolsModal',
    'openObdEncyclopediaModal',
    'openAddNewCarModal',
    'openGarageModal',
    'openEditCarModal',
    'openOdometerModal',
    'openBatteryModal',
    'openTiresDetailModal',
    'openDocumentsModal',
    'openServiceCentersModal',
    'openEmergencyModal',
    'openTrafficFinesModal',
    'openBatteryCatalogModal',
    'openSettingsModal',
    'openNotificationsHubModal',
    'openMobileMoreDrawer',
    'closeMobileMoreDrawer'
];

console.log('\n--- Binding status of key UI functions ---');
fnNames.forEach(fn => {
    const fnType = typeof context[fn];
    console.log(`${fn}: ${fnType}`);
});
