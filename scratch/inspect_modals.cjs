const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');
const modals = [
  'recordModal',
  'fuelModal',
  'driverToolsModal',
  'serviceCentersModal',
  'customReportExportModal',
  'contactCommunityModal',
  'obdEncyclopediaModal',
  'batteryModal',
  'batteryCatalogModal',
  'tiresDetailModal',
  'emergencyModal',
  'garageModal',
  'addNewCarModal',
  'editCarModal',
  'documentsModal',
  'trafficFinesModal',
  'notificationsHubModal',
  'addCustomPMModal',
  'editCatalogItemModal'
];
modals.forEach(m => {
  lines.forEach((l, idx) => {
    if (l.includes('id="' + m + '"') || l.includes("id='" + m + "'")) {
      console.log('--- ' + m + ' (line ' + (idx + 1) + ') ---');
      console.log(lines[idx].trim());
      console.log(lines[idx + 1].trim());
    }
  });
});
