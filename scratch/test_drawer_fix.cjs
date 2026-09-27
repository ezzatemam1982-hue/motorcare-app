const fs = require('fs');
const assert = require('assert');

const htmlContent = fs.readFileSync('index.html', 'utf8');
const dashboardJs = fs.readFileSync('js/features/dashboard.js', 'utf8');
const dictionaryJs = fs.readFileSync('js/data/dictionary.js', 'utf8');

console.log('--- Testing Side Drawer Menu Fix ---');

// 1. Verify #mobileMoreDrawerModal exists in index.html
assert(htmlContent.includes('id="mobileMoreDrawerModal"'), 'mobileMoreDrawerModal must exist in index.html');

// 2. Verify topHeaderMenuBtn triggers openMobileMoreDrawer()
assert(htmlContent.includes('onclick="openMobileMoreDrawer()" id="topHeaderMenuBtn"'), 'topHeaderMenuBtn must trigger openMobileMoreDrawer()');

// 3. Verify openMobileMoreDrawer function in dashboard.js
assert(dashboardJs.includes('function openMobileMoreDrawer()'), 'openMobileMoreDrawer function must exist in dashboard.js');

// 4. Verify drawer keys in dictionary.js
assert(dictionaryJs.includes('drawerTitle: "أقسام وخدمات التطبيق"'), 'drawerTitle Arabic key must exist');
assert(dictionaryJs.includes('drawerTitle: "App Sections & Services"'), 'drawerTitle English key must exist');

console.log('✅ ALL DRAWER MENU CHECKS PASSED SUCCESSFULLY!');
