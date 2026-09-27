const fs = require('fs');

console.log('--- Applying Fixes for Login Logo & Service Modals ---');

// 1. Update index.html and src/index.html login page logo (line 81)
['index.html', 'src/index.html'].forEach(fn => {
    if (!fs.existsSync(fn)) return;
    let content = fs.readFileSync(fn, 'utf8');

    // Replace logo-wide.png with logo.png on landing screen center logo
    const oldLoginLogoTag = `<img src="logo-wide.png" alt="MotorCare" class="brand-logo-login h-24 sm:h-28 w-auto max-w-[270px] object-contain transition-all hover:scale-105 duration-300">`;
    const newLoginLogoTag = `<img src="logo.png" alt="MotorCare" class="brand-logo-login h-20 sm:h-24 w-auto max-w-[270px] object-contain transition-all hover:scale-105 duration-300">`;

    if (content.includes(oldLoginLogoTag)) {
        content = content.replace(oldLoginLogoTag, newLoginLogoTag);
        console.log(`[${fn}] Updated login screen logo from logo-wide.png to logo.png.`);
    }

    // Also check regex if formatting differed
    content = content.replace(/<img\s+src="logo-wide\.png"\s+alt="[^"]*"\s+class="brand-logo-login[^"]*">/g, newLoginLogoTag);

    fs.writeFileSync(fn, content, 'utf8');
});

// 2. Fix css/style.css and src/css/style.css modal z-index rules
['css/style.css', 'src/css/style.css'].forEach(fn => {
    if (!fs.existsSync(fn)) return;
    let content = fs.readFileSync(fn, 'utf8');

    const oldModalCss = `#driverToolsModal,
        #obdEncyclopediaModal,
        #customReportExportModal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
        }`;

    const newModalCss = `#driverToolsModal.active,
        #obdEncyclopediaModal.active,
        #customReportExportModal.active {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 99999 !important;
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        }
        #driverToolsModal.hidden,
        #obdEncyclopediaModal.hidden,
        #customReportExportModal.hidden {
            display: none !important;
            pointer-events: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }`;

    if (content.includes(oldModalCss)) {
        content = content.replace(oldModalCss, newModalCss);
        console.log(`[${fn}] Fixed modal z-index overlay CSS rules.`);
    } else {
        // Regex replacement fallback
        content = content.replace(/#driverToolsModal,\s*#obdEncyclopediaModal,\s*#customReportExportModal\s*\{[^}]*\}/g, newModalCss);
        console.log(`[${fn}] Applied modal z-index CSS rules via regex.`);
    }

    fs.writeFileSync(fn, content, 'utf8');
});

// 3. Fix openServiceCentersModal in js/features/serviceCenters.js & src/js/features/serviceCenters.js
['js/features/serviceCenters.js', 'src/js/features/serviceCenters.js'].forEach(fn => {
    if (!fs.existsSync(fn)) return;
    let content = fs.readFileSync(fn, 'utf8');

    content = content.replace(/modal\.dir = appState\.lang === 'en' \? 'ltr' : 'rtl';/g, "modal.dir = (typeof appState !== 'undefined' && appState && appState.lang === 'en') ? 'ltr' : 'rtl';");
    content = content.replace(/const isEn = appState\.lang === 'en';/g, "const isEn = (typeof appState !== 'undefined' && appState && appState.lang === 'en');");
    content = content.replace(/if \(appState\.lang !== 'en'\)/g, "if (typeof appState !== 'undefined' && appState && appState.lang !== 'en')");

    fs.writeFileSync(fn, content, 'utf8');
    console.log(`[${fn}] Fixed safe appState checks in serviceCenters.js.`);
});

// 4. Fix openExportReportsModal in js/features/reports.js & src/js/features/reports.js
['js/features/reports.js', 'src/js/features/reports.js'].forEach(fn => {
    if (!fs.existsSync(fn)) return;
    let content = fs.readFileSync(fn, 'utf8');

    content = content.replace(/const isEn = appState\.lang === 'en';/g, "const isEn = (typeof appState !== 'undefined' && appState && appState.lang === 'en');");

    fs.writeFileSync(fn, content, 'utf8');
    console.log(`[${fn}] Fixed safe appState checks in reports.js.`);
});

console.log('Fixes applied successfully!');
