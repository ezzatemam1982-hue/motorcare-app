const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

// List of target modals to transform
const modalConfigs = [
    {
        id: 'recordModal',
        closeFn: 'closeRecordModal()',
        // find outer div and inner card
    },
    {
        id: 'fuelModal',
        closeFn: 'closeFuelModal()',
    },
    {
        id: 'driverToolsModal',
        closeFn: 'closeDriverToolsModal()',
    },
    {
        id: 'serviceCentersModal',
        closeFn: 'closeServiceCentersModal()',
    },
    {
        id: 'customReportExportModal',
        closeFn: 'closeExportReportsModal()',
    },
    {
        id: 'contactCommunityModal',
        closeFn: 'closeContactModal()',
    },
    {
        id: 'obdEncyclopediaModal',
        closeFn: 'closeObdEncyclopediaModal()',
    },
    {
        id: 'emergencyModal',
        closeFn: 'closeEmergencyModal()',
    },
    {
        id: 'batteryModal',
        closeFn: 'closeBatteryModal()',
    },
    {
        id: 'batteryCatalogModal',
        closeFn: 'closeBatteryCatalogModal()',
    },
    {
        id: 'tiresDetailModal',
        closeFn: 'closeTiresDetailModal()',
    },
    {
        id: 'addCustomPMModal',
        closeFn: 'closeAddCustomPMModal()',
    },
    {
        id: 'editCatalogItemModal',
        closeFn: 'closeEditCatalogItemModal()',
    },
    {
        id: 'documentsModal',
        closeFn: 'closeDocumentsModal()',
    },
    {
        id: 'odometerModal',
        closeFn: 'closeOdometerModal()',
    },
    {
        id: 'garageModal',
        closeFn: 'closeGarageModal()',
    },
    {
        id: 'addNewCarModal',
        closeFn: 'closeAddNewCarModal()',
    },
    {
        id: 'editCarModal',
        closeFn: 'closeEditCarModal()',
    },
    {
        id: 'googleSheetsModal',
        closeFn: 'closeGoogleSheetsModal()',
    },
    {
        id: 'notificationsHubModal',
        closeFn: 'closeNotificationsHubModal()',
    },
    {
        id: 'trafficFinesModal',
        closeFn: 'closeTrafficFinesModal()',
    },
    {
        id: 'maintWearExplainerModal',
        closeFn: 'closeMaintWearExplainer()',
    },
    {
        id: 'locationCorrectionModal',
        closeFn: 'closeBranchVerificationModal()',
    },
    {
        id: 'userCorrectionsHistoryModal',
        closeFn: 'closeUserCorrectionsHistoryModal()',
    }
];

let transformedCount = 0;

modalConfigs.forEach(m => {
    // Regex to match the modal opening tag and its first child div
    // e.g. <div id="m.id" ... >\s*<div class="..." ...>
    const regex = new RegExp(`(<div\\s+id="${m.id}"[^>]*>)([\\s\\S]*?)(<div\\s+class=")([^"]*)(")([^>]*>)`, 'i');
    const match = content.match(regex);
    if (!match) {
        console.warn(`[WARN] Could not match modal ${m.id}`);
        return;
    }

    let outerTag = match[1];
    const between = match[2];
    const divPrefix = match[3];
    let cardClasses = match[4];
    const quote = match[5];
    const divRest = match[6];

    // 1. Update outerTag
    // Add onclick backdrop dismissal if not present
    if (!outerTag.includes('onclick=') && m.closeFn) {
        outerTag = outerTag.replace(`id="${m.id}"`, `id="${m.id}" onclick="if(event.target === this) ${m.closeFn}"`);
    }
    // Update classes on outerTag
    outerTag = outerTag.replace(/items-center\s+justify-center\s+p-([0-9]|sm:p-[0-9])+/g, 'items-end sm:items-center justify-center p-0 sm:p-4');
    if (!outerTag.includes('modal-bottom-sheet')) {
        outerTag = outerTag.replace('class="', 'class="modal-bottom-sheet ');
    }
    if (!outerTag.includes('backdrop-blur')) {
        outerTag = outerTag.replace('class="', 'class="backdrop-blur-xs ');
    }

    // 2. Update cardClasses
    // Make rounded-t-3xl sm:rounded-3xl
    cardClasses = cardClasses.replace(/\brounded-3xl\b/g, 'rounded-t-3xl sm:rounded-3xl');
    cardClasses = cardClasses.replace(/\brounded-2xl\b/g, 'rounded-t-3xl sm:rounded-3xl');
    // Ensure max-h-[88vh]
    cardClasses = cardClasses.replace(/max-h-\[[0-9]+vh\]/g, 'max-h-[88vh]');
    if (!cardClasses.includes('max-h-[88vh]')) {
        cardClasses += ' max-h-[88vh]';
    }
    if (!cardClasses.includes('safe-area-pb')) {
        cardClasses += ' safe-area-pb';
    }
    if (!cardClasses.includes('overflow-y-auto') && !cardClasses.includes('flex flex-col')) {
        cardClasses += ' overflow-y-auto';
    }

    // 3. Insert drag handle bar right after opening inner card div if not present
    let innerCardOpen = `${divPrefix}${cardClasses}${quote}${divRest}`;
    const dragBar = '\n            <div class="drag-handle-bar sm:hidden"></div>';

    // Construct replacement
    const replacement = `${outerTag}${between}${innerCardOpen}${dragBar}`;
    
    // Check if drag handle is already there right after
    const fullMatched = match[0];
    if (!content.slice(match.index + fullMatched.length, match.index + fullMatched.length + 80).includes('drag-handle-bar')) {
        content = content.replace(fullMatched, replacement);
        transformedCount++;
        console.log(`[OK] Transformed ${m.id} to Bottom Sheet`);
    } else {
        console.log(`[SKIP] ${m.id} already has drag-handle-bar`);
    }
});

console.log(`Total modals transformed: ${transformedCount}`);
fs.writeFileSync(filePath, content, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'src', 'index.html'), content, 'utf8');
console.log('Saved index.html and src/index.html');
