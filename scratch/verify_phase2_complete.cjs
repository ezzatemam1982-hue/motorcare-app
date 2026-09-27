const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING PHASE 2 REQUIREMENTS ===\n');

let allPassed = true;
function assert(desc, condition) {
    if (condition) {
        console.log(`[PASS] ${desc}`);
    } else {
        console.error(`[FAIL] ${desc}`);
        allPassed = false;
    }
}

const files = ['index.html', 'src/index.html'];

files.forEach(filePath => {
    console.log(`\n--- Checking ${filePath} ---`);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. History button ID in drawer
    assert(`${filePath}: Contains #drawerBtn-history`, content.includes('id="drawerBtn-history"'));
    
    // 2. Settings button ID in drawer
    assert(`${filePath}: Contains #drawerBtn-settings`, content.includes('id="drawerBtn-settings"'));

    // 3. Urgent alerts collapsed by default
    assert(`${filePath}: #urgentAlertsListWrapper has 'hidden' class`, 
        /id=["']urgentAlertsListWrapper["'][^>]*class=["'][^"']*hidden/.test(content));
    assert(`${filePath}: #urgentAlertsChevron is rotated -90deg by default`, 
        content.includes('id="urgentAlertsChevron"') && content.includes('rotate(-90deg)'));

    // 4. Drawer height adjusted to 90vh
    assert(`${filePath}: #mobileMoreDrawerModal has h-[90vh]`, content.includes('h-[90vh]'));

    // 5. Settings modal exists
    assert(`${filePath}: Contains #settingsModal`, content.includes('id="settingsModal"'));
    assert(`${filePath}: Settings modal has PRO badge`, content.includes('PRO'));
    assert(`${filePath}: Settings modal has language and dark mode controls`, 
        content.includes('setLanguage') && content.includes('toggleDarkMode'));

    // 6. Data-feature attributes for toggles
    const features = [
        'serviceCenters',
        'batteryCatalog',
        'driverTools',
        'obdEncyclopedia',
        'roadsideEmergency',
        'multiCarGarage'
    ];
    features.forEach(f => {
        assert(`${filePath}: Has element with data-feature="${f}"`, content.includes(`data-feature="${f}"`));
    });

    // 7. Script include for settings.js
    assert(`${filePath}: Includes js/features/settings.js`, content.includes('js/features/settings.js'));
});

// Check parity between index.html and src/index.html
console.log('\n--- Checking File Parity ---');
const rootIndex = fs.readFileSync('index.html', 'utf8');
const srcIndex = fs.readFileSync('src/index.html', 'utf8');
assert('index.html and src/index.html are identical in size', rootIndex.length === srcIndex.length);
assert('index.html and src/index.html are identical in content', rootIndex === srcIndex);

// Check js/features/settings.js and src/js/features/settings.js
console.log('\n--- Checking settings.js ---');
['js/features/settings.js', 'src/js/features/settings.js'].forEach(p => {
    assert(`${p} exists`, fs.existsSync(p));
    const jsContent = fs.readFileSync(p, 'utf8');
    assert(`${p} defines MotorCareSettings`, jsContent.includes('window.MotorCareSettings'));
    assert(`${p} handles drawerBtn-history click`, jsContent.includes('drawerBtn-history'));
    assert(`${p} manages feature toggles in localStorage`, jsContent.includes('motorCare_featureToggles_v1'));
});

// Check js/services/mobile.js and src/js/services/mobile.js
console.log('\n--- Checking mobile.js ---');
['js/services/mobile.js', 'src/js/services/mobile.js'].forEach(p => {
    assert(`${p} exists`, fs.existsSync(p));
    const mobileContent = fs.readFileSync(p, 'utf8');
    assert(`${p} ignores clicks inside mobileMoreDrawerModal in capture click handler`, 
        mobileContent.includes("trigger.closest('#mobileMoreDrawerModal')"));
});

// Check js/features/dashboard.js and src/js/features/dashboard.js
console.log('\n--- Checking dashboard.js ---');
['js/features/dashboard.js', 'src/js/features/dashboard.js'].forEach(p => {
    assert(`${p} exists`, fs.existsSync(p));
    const dashContent = fs.readFileSync(p, 'utf8');
    assert(`${p} calls renderHistoryList on tabId === 'history'`, 
        dashContent.includes("if (tabId === 'history')") && dashContent.includes('renderHistoryList()'));
});

console.log(`\nVerification Result: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
process.exit(allPassed ? 0 : 1);
