import os, sys, re

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html.original', 'r', encoding='utf-8', errors='ignore') as f:
    raw_lines = f.readlines()

def get_slice(start, end):
    return ''.join(raw_lines[start - 1 : end])

def create_module(path, content, global_exports=[]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    export_lines = []
    if global_exports:
        export_lines.append("\n// ==========================================================================")
        export_lines.append("// [EXPLICIT GLOBAL SCOPE BINDINGS]")
        export_lines.append("// ==========================================================================")
        for item in global_exports:
            export_lines.append(f"try {{ if (typeof {item} !== 'undefined') window.{item} = {item}; }} catch (e) {{}}")
        export_lines.append("")
        
    full_content = content.rstrip() + ("\n" + "\n".join(export_lines) if export_lines else "\n")
    
    with open(path, 'w', encoding='utf-8') as out:
        out.write(full_content)
    print(f"Created: {path} ({len(full_content.splitlines())} lines)")

print("=== 1. EXTRACTING CSS ===")
css_content = get_slice(2658, 2704)
create_module('css/style.css', css_content)

print("\n=== 2. EXTRACTING CONFIG ===")
tailwind_config = get_slice(2639, 2650)
create_module('js/config/tailwind.config.js', tailwind_config)

print("\n=== 3. EXTRACTING STORAGE & EARLY UTILITIES ===")
# Include early utilities (debounce & compressAndResizeImage from 8416-8480) so brandLogos.js has debounce available
storage_code = (
    get_slice(41, 154) + "\n\n" +
    get_slice(432, 549) + "\n\n" +
    get_slice(550, 701) + "\n\n" +
    get_slice(8416, 8467)
)
create_module('js/storage/storage.js', storage_code, [
    'SafeStorage', 'MotorCareIndexedDB', 'validateAndSanitizeAppState', 'saveAppState',
    'debounce', 'compressAndResizeImage'
])

print("\n=== 4. EXTRACTING SECURITY ===")
security_code = get_slice(702, 1090)
create_module('js/security/security.js', security_code, [
    'MotorCareSecurity'
])

print("\n=== 5. EXTRACTING PWA ===")
pwa_code = get_slice(1091, 1124)
create_module('js/services/pwa.js', pwa_code)

print("\n=== 6. EXTRACTING NETWORK ===")
network_code = get_slice(1125, 1198)
create_module('js/services/network.js', network_code, [
    'hasShownOfflineNotice', 'updateNetworkStatus', 'dismissNetworkBanner', 'initNetworkStatusMonitor'
])

print("\n=== 7. EXTRACTING FIREBASE ===")
firebase_code = get_slice(1199, 1571)
create_module('js/services/firebase.js', firebase_code, [
    'firestoreDb', 'isFirestoreReady', 'initFirestoreDatabase', 'initUserCloudSync',
    'syncUserDataToCloud', 'updateCloudSyncStatusUI',
    'startLiveVerificationWatcher', 'stopLiveVerificationWatcher'
])

print("\n=== 8. EXTRACTING NOTIFICATIONS ===")
notifications_code = (
    get_slice(1572, 1725) + "\n\n" +
    get_slice(26467, 27145)
)
create_module('js/services/notifications.js', notifications_code, [
    'showNotification', 'showCustomConfirm', 'MotorCareNotifications'
])

print("\n=== 9. EXTRACTING DATA ===")
# DICTIONARY (8591-9222)
dictionary_code = get_slice(8591, 9222)
create_module('js/data/dictionary.js', dictionary_code, [
    'DICTIONARY'
])

# CAR_BRAND_LOGOS & BRAND MANAGEMENT (21648-22102)
brand_logos_code = get_slice(21648, 22102)
create_module('js/data/brandLogos.js', brand_logos_code, [
    'CAR_BRAND_LOGOS', 'BRAND_GROUPS', 'BRAND_GROUPS_EN', 'getCarBrandLogoHtml',
    'getCleanCarDisplayName', 'populateBrandSelect', 'renderQuickBrandChips',
    'quickSelectCarBrand', 'filterBrandsList', 'switchCar', 'deleteCarFromGarage',
    'openEditCarModal', 'closeEditCarModal', 'saveEditedCar', 'openAddNewCarModal',
    'closeAddNewCarModal', 'openGarageModal', 'closeGarageModal', 'onNewCarBrandChanged',
    'onNewCarModelChanged', 'onNewCarGenerationChanged'
])

# BATTERY_MARKET_DATA (19464-19619)
battery_market_code = get_slice(19464, 19619)
create_module('js/data/batteryMarket.js', battery_market_code, [
    'BATTERY_MARKET_DATA', 'closeBatteryModal', 'onBatteryBrandSelectChanged', 'openBatteryModal', 'saveBatteryDetails'
])

print("\n=== 10. EXTRACTING CORE STATE & I18N ===")
# appState and top-level vars (6951-6957, 17562-17605)
app_state_code = (
    get_slice(6951, 6957) + "\n\n" +
    get_slice(17562, 17605) + "\n\n" +
    "var CAR_BRANDS_CATALOG = (typeof window !== 'undefined' && window.CAR_BRANDS_CATALOG) ? window.CAR_BRANDS_CATALOG : {};\n"
)
create_module('js/core/appState.js', app_state_code, [
    'appState', 'currentActiveTab', 'tempImages', 'costChartInstance', 'monthlyChartInstance',
    'currentAuthMode', 'CAR_BRANDS_CATALOG', 'getCurrentCar'
])

# i18n helpers (9223-9337)
i18n_code = get_slice(9223, 9337)
create_module('js/core/i18n.js', i18n_code, [
    'getLocalizedItemName', 'toggleLanguage', 'applyLanguageSettings'
])

# Catalog Builder (9338-9491)
catalog_builder_code = get_slice(9338, 9491)
create_module('js/core/catalogBuilder.js', catalog_builder_code, [
    'buildSpecificCatalog', 'getChainEngineCatalog'
])

# Maintenance Engine (18746-19009 + 19153-19463 + 20883-20922)
maintenance_engine_code = (
    get_slice(18746, 19009) + "\n\n" +
    get_slice(19153, 19463) + "\n\n" +
    get_slice(20883, 20922)
)
create_module('js/core/maintenanceEngine.js', maintenance_engine_code, [
    'evaluateMaintenanceItem', 'renderUrgentAlerts', 'calculateFuelEconomy',
    'updateDocumentsSummaryCard', 'getBatteryStatus', 'getTireDotStatus',
    'isBatteryConfigured', 'isTiresConfigured', 'renderHardwareCards',
    'getCarOemBatterySpec', 'populateBatteryOemRecommendation',
    'applyOemBatteryRecommendation', 'onRecordPartChanged'
])

print("\n=== 11. EXTRACTING AUTH & USER MANAGEMENT ===")
auth_code = (
    get_slice(158, 187) + "\n\n" +
    get_slice(1726, 2638) + "\n\n" +
    get_slice(6958, 8415) + "\n\n" +
    get_slice(8468, 8590) + "\n\n" +
    get_slice(22628, 22728) + "\n\n" +
    get_slice(22729, 22912)
)
create_module('js/services/auth.js', auth_code, [
    'enterMainApp', 'handleGuestEntry', 'handleSocialLogin', 'loginAsGoogleProfile',
    'switchAuthTab', 'togglePasswordVisibility', 'handleAuthSubmit',
    'checkAuthEmailExistingLive', 'initAuthEmailLiveWatcher', 'findAccountByEmail',
    'saveAccountToLocalDB', 'openGoogleAuthModal', 'closeGoogleAuthModal',
    'handleGoogleAuthModalSubmit', 'initGoogleIdentityServices', 'initGoogleOAuthClient',
    'fetchGoogleUserProfile', 'triggerGoogleOAuthWebFlow', 'checkOAuthRedirectResponse',
    'generateVerificationOtp', 'sendRealVerificationOtpEmail', 'submitEmailVerificationCode',
    'openVerificationCodeModal', 'closeEmailVerificationModal', 'checkUrlEmailVerification',
    'initCrossTabAuthSync', 'notifyCrossTabVerification', 'openForgotPasswordModal',
    'closeForgotPasswordModal', 'handleForgotPasswordStep1', 'handleForgotPasswordStep2',
    'handleResendForgotOtp', 'backToForgotStep1', 'handleLogout', 'handleUpgradeAccount',
    'openEditProfileModal', 'closeEditProfileModal', 'handleSaveProfileEdit',
    'openChangeAvatarModal', 'closeChangeAvatarModal', 'applySelectedAvatar',
    'generateRandomAvatar', 'handleCustomAvatarFile', 'PRESET_AVATARS',
    'MOTORCARE_OFFICIAL_WEBHOOK', 'updateHeaderUserProfile'
])

print("\n=== 12. EXTRACTING FEATURES ===")
# Dashboard (17606-17614 + 18690-18745 + 19010-19152 + toggleDarkMode)
dark_mode_func = """
        function toggleDarkMode() {
            appState.darkMode = !appState.darkMode;
            if (appState.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            if (typeof SafeStorage !== 'undefined') {
                SafeStorage.setJSON('motorCare_AppState_v140', appState);
            }
            if (typeof renderCharts === 'function') {
                renderCharts();
            }
            if (typeof syncUserDataToCloud === 'function') {
                syncUserDataToCloud('theme_toggle');
            }
        }
"""
dashboard_code = (
    get_slice(17606, 17614) + "\n\n" +
    get_slice(18690, 18745) + "\n\n" +
    get_slice(19010, 19152) + "\n\n" +
    dark_mode_func
)
create_module('js/features/dashboard.js', dashboard_code, [
    'renderDashboard', 'switchTab', 'toggleTopHeaderMenu',
    'closeTopHeaderMenu', 'openMobileMoreDrawer', 'closeMobileMoreDrawer',
    'updateVehicleHealthStatus', 'toggleDarkMode'
])

# Maintenance (20036-20882 + 20923-21324)
maintenance_code = (
    get_slice(20036, 20882) + "\n\n" +
    get_slice(20923, 21324)
)
create_module('js/features/maintenance.js', maintenance_code, [
    'filterCatalog', 'getCategoryIconHtml', 'renderCatalogItems', 'toggleFreeEditMode',
    'onCustomPMUnitTypeChange', 'onCustomItemTypeChange', 'openAddCustomPMModal',
    'closeAddCustomPMModal', 'saveCustomPMItem', 'openEditCatalogItemModal',
    'onEditSparkPlugsTypeChanged', 'closeEditCatalogItemModal', 'saveCatalogItemInterval',
    'resetCatalogItemToDefault', 'resetPMItemToDefaultDirect', 'deleteCustomPMItem',
    'openRecordModal', 'closeRecordModal', 'toggleMaintenanceType', 'saveMaintenanceRecord',
    'deleteHistoryRecord', 'renderHistoryList'
])

# Fuel (21325-21546)
fuel_code = get_slice(21325, 21546)
# Safely handle null car in fuel odometer input:
fuel_code = fuel_code.replace("document.getElementById('fuelOdometerInput').value = car.odometer;", "document.getElementById('fuelOdometerInput').value = (car && car.odometer) ? car.odometer : '';")
create_module('js/features/fuel.js', fuel_code, [
    'openFuelModal', 'closeFuelModal', 'saveFuelLog', 'deleteFuelLog',
    'renderFuelSection', 'updateFuelStatsCard'
])

# Analytics (21547-21644)
analytics_code = get_slice(21547, 21644)
create_module('js/features/analytics.js', analytics_code, [
    'renderCharts'
])

# Garage (22103-22627)
garage_code = get_slice(22103, 22627)
create_module('js/features/garage.js', garage_code, [
    'saveNewCar', 'closeGoogleSheetsModal', 'exportJsonBackup', 'exportCsvReport',
    'saveWebhookUrl', 'copyAppsScriptCode', 'closeAccountCenter', 'getAppSenderEmail',
    'openAccountCenter', 'migrateAndAuditCarsCatalog', 'doPost', 'doGet',
    'importJsonBackup', 'saveAppSenderEmail', 'sendDirectMail', 'openGoogleSheetsModal',
    'APP_DEFAULT_SENDER_EMAIL'
])

# Documents (19944-20035)
documents_code = get_slice(19944, 20035)
create_module('js/features/documents.js', documents_code, [
    'saveDocumentsSettings', 'openDocumentsModal', 'closeDocumentsModal',
    'renderDocumentsGrid', 'downloadCurrentDocumentImage', 'shareCurrentDocumentImage',
    'openImageViewer', 'closeImageViewer'
])

# Battery & Tires (19620-19943)
battery_code = get_slice(19620, 19943)
create_module('js/features/battery.js', battery_code, [
    'applyCatalogSpecToCurrentCar', 'openTiresDetailModal', 'renderCatalogBatteryResult',
    'syncSelectorsFromDotCode', 'closeTiresDetailModal', 'onCatalogGenChanged',
    'onCatalogModelChanged', 'onCatalogBrandChanged', 'saveTiresDetails',
    'openBatteryCatalogModal', 'syncDotCodeFromSelectors', 'closeBatteryCatalogModal'
])

# Service Centers (17694-18689)
service_centers_feature_code = get_slice(17694, 18689)
create_module('js/features/serviceCenters.js', service_centers_feature_code, [
    'openServiceCentersModal', 'closeServiceCentersModal', 'populateServiceCenterBrands',
    'resetServiceCenterFilters', 'applyServiceCenterFilters', 'renderServiceCenters',
    'openLocationCorrectionModal', 'closeLocationCorrectionModal', 'captureCurrentGpsForCorrection',
    'handlePasteMapsUrl', 'testCorrectionOnMap', 'submitLocationCorrection',
    'viewUserCorrectionsModal', 'closeUserCorrectionsHistoryModal', 'exportUserCorrectionsJSON',
    'deleteUserCorrection'
])

# Odometer (25832-25889)
odometer_code = get_slice(25832, 25889)
create_module('js/features/odometer.js', odometer_code, [
    'closeOdometerModal', 'openOdometerModal', 'submitNewOdometer'
])

# Inspection UI (25890-26017)
inspection_code = get_slice(25890, 26017)
create_module('js/features/inspection.js', inspection_code, [
    'INSPECTION_SYSTEMS', 'renderInspectionTab', 'saveInspectionChecklist'
])

# OBD (23958-24573)
obd_code = get_slice(23958, 24573)
create_module('js/features/obd.js', obd_code, [
    'updateObdModalLanguage', 'convertObdToUrgentCM', 'renderObdCodesList',
    'loadObdDatabase', 'getCoreObdFallbackList', 'toggleObdDetails',
    'preIndexObdDatabase', 'closeObdEncyclopediaModal', 'setObdCategoryFilter',
    'openObdEncyclopediaModal', 'onObdSearchInput', 'clearObdSearch', 'copyObdCode'
])

# Driver Tools (17615-17693 + 24574-25831)
driver_tools_code = (
    get_slice(17615, 17693) + "\n\n" +
    get_slice(24574, 25831)
)
create_module('js/features/driverTools.js', driver_tools_code, [
    'renderDriverNotes', 'openTrafficFinesModal', 'openExternalTrafficPortal',
    'logTripAsExpense', 'closeTrafficFinesModal', 'renderDriverToolsData',
    'updateExpenseFormDynamicContext', 'renderDriverExpenses', 'switchDriverToolsTab',
    'renderCostPerKm', 'toggleAddExpenseForm', 'saveDriverExpense',
    'closeMaintWearExplainer', 'setDriverExpenseFilter', 'updateDriverToolsLanguage',
    'editDriverExpense', 'cancelEditDriverNote', 'toggleDriverNoteComplete',
    'applyTripPreset', 'calculateTripCostEstimate', 'closeDriverToolsModal',
    'deleteDriverNote', 'addDriverNote', 'deleteDriverExpense', 'editDriverNote',
    'showMaintWearExplainer', 'syncOdometerFields', 'resetDriverExpenseForm',
    'copyTrafficPortalUrl', 'openDriverToolsModal', 'copyTrafficPlateNumber'
])

# Reports (23304-23957)
reports_code = get_slice(23304, 23957)
create_module('js/features/reports.js', reports_code, [
    'selectExportReportType', 'executePrintCustomReport', 'openExportReportsModal',
    'exportCustomReportCSV', 'applyReportDatePreset', 'onCustomReportDateChanged',
    'closeExportReportsModal', 'getFilteredReportData', 'updateCustomReportPreview',
    'printVehicleReport'
])

# Admin (22913-23303)
admin_code = get_slice(22913, 23303)
create_module('js/features/admin.js', admin_code, [
    'changeAdminPinPrompt', 'openSubscribersAdminModal', 'isAdminUnlocked',
    'resetAdminPinToDefault', 'copySubscribersEmails', 'handleChangeAdminPinSubmit',
    'openChangePinModal', 'getStoredAdminPin', 'filterSubscribersTable',
    'normalizeDigits', 'renderSubscribersTable', 'closeSubscribersAdminModal',
    'updateCloudSyncStatusInModal', 'getRegisteredSubscribersList',
    'closeAdminPinModal', 'exportSubscribersToCSV', 'ensureAdminAccess',
    'closeChangePinModal', 'escapeHtml', 'handleAdminPinSubmit',
    'lockAdminAccess', 'openAdminPinModal'
])

# Emergency (27146-27697)
emergency_code = get_slice(27146, 27697)
create_module('js/services/emergency.js', emergency_code, [
    'MotorCareEmergency', 'openEmergencyModal', 'closeEmergencyModal'
])

# Feedback (26018-26466)
feedback_code = get_slice(26018, 26466)
create_module('js/services/feedback.js', feedback_code, [
    'submitFeedbackForm', 'openContactModal', 'openSupportMailComposer',
    'selectFeedbackCategory', 'testFeedbackEmailDispatch', 'focusFeedbackForm', 'closeContactModal'
])

# Main Bootstrap (27698-27845)
main_code = get_slice(27698, 27845)
create_module('js/main.js', main_code, [
    'initMobilePlatform'
])

print("\n=== All modules generated successfully! ===")
