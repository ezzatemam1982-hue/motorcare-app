/* ==========================================================================
   [MODULE] إدارة الإعدادات والمظهر والميزات (Settings & Feature Toggles)
   MotorCare v2.0 - Material 3 & iOS Standard
   ========================================================================== */

(function(window, document) {
    'use strict';

    const STORAGE_KEY = 'motorCare_featureToggles_v1';
    const DEFAULT_TOGGLES = {
        serviceCenters: true,      // دليل مراكز الخدمة والتوكيلات (GPS)
        batteryCatalog: true,      // دليل ومستكشف البطاريات (OEM)
        driverTools: true,         // أدوات السائق المتقدمة (PRO)
        obdEncyclopedia: true,     // موسوعة أكواد الأعطال OBD-II (PRO)
        roadsideEmergency: true,   // طوارئ وخدمات الطريق (SOS)
        multiCarGarage: true       // كراج وتعدد المركبات (PRO)
    };

    function getFeatureToggles() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                return Object.assign({}, DEFAULT_TOGGLES, JSON.parse(raw));
            }
        } catch (e) {
            console.warn('[MotorCare Settings] Failed reading feature toggles:', e);
        }
        return Object.assign({}, DEFAULT_TOGGLES);
    }

    function saveFeatureToggles(toggles) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
        } catch (e) {
            console.warn('[MotorCare Settings] Failed saving feature toggles:', e);
        }
    }

    function applyFeatureToggles() {
        const toggles = getFeatureToggles();
        
        // 1. تحديث كافة العناصر الموسومة بـ data-feature في الصفحة
        const elements = document.querySelectorAll('[data-feature]');
        elements.forEach(el => {
            const feat = el.getAttribute('data-feature');
            if (feat && toggles[feat] === false) {
                el.classList.add('hidden');
                el.style.setProperty('display', 'none', 'important');
            } else if (feat) {
                el.classList.remove('hidden');
                el.style.removeProperty('display');
            }
        });

        // 2. مزامنة صريحة ومباشرة لأزرار الوصول السريع والـ Sidebars بحسب الـ ID للحماية الكاملة
        const featureIdMap = [
            { ids: ['sidebarBtn-driverTools', 'drawerBtn-driverTools', 'drawerShortcutBtn-driverTools', 'topMenuBtn-driverTools'], key: 'driverTools' },
            { ids: ['sidebarBtn-obd', 'drawerBtn-obd', 'drawerShortcutBtn-obd', 'topMenuBtn-obd'], key: 'obdEncyclopedia' },
            { ids: ['sidebarBtn-serviceCenters', 'drawerBtn-serviceCenters', 'topMenuBtn-serviceCenters'], key: 'serviceCenters' },
            { ids: ['sidebarBtn-batteryCatalog', 'drawerBtn-batteryCatalog', 'topMenuBtn-batteryCatalog'], key: 'batteryCatalog' },
            { ids: ['sidebarBtn-sos', 'drawerBtn-sos'], key: 'roadsideEmergency' }
        ];

        featureIdMap.forEach(item => {
            const isEnabled = toggles[item.key] !== false;
            item.ids.forEach(id => {
                const nodes = document.querySelectorAll(`#${id}`);
                nodes.forEach(btn => {
                    if (isEnabled) {
                        btn.classList.remove('hidden');
                        btn.style.removeProperty('display');
                    } else {
                        btn.classList.add('hidden');
                        btn.style.setProperty('display', 'none', 'important');
                    }
                });
            });
        });

        // 3. مزامنة مفاتيح التشغيل في نافذة الإعدادات
        Object.keys(toggles).forEach(key => {
            const inp = document.getElementById(`ft_${key}`);
            if (inp) {
                inp.checked = toggles[key] !== false;
            }
        });
    }

    function handleToggle(featureKey, isEnabled) {
        const toggles = getFeatureToggles();
        toggles[featureKey] = isEnabled;
        saveFeatureToggles(toggles);
        applyFeatureToggles();

        if (typeof showNotification === 'function') {
            const isEn = typeof appState !== 'undefined' && appState.lang === 'en';
            const msg = isEnabled 
                ? (isEn ? 'Service enabled successfully' : 'تم تفعيل الخدمة وإظهارها بنجاح')
                : (isEn ? 'Service hidden to declutter view' : 'تم إخفاء الخدمة لتقليل الزحام وتوفير المساحة');
            showNotification(msg, 'info', 2200);
        }
    }

    function openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (!modal) return;

        // إغلاق أي قوائم مفتوحة
        if (typeof closeMobileMoreDrawer === 'function') closeMobileMoreDrawer();
        if (typeof closeTopHeaderMenu === 'function') closeTopHeaderMenu();

        // 1. مزامنة اتجاه ولغة النافذة بالكامل
        const isEn = typeof appState !== 'undefined' && appState.lang === 'en';
        modal.dir = isEn ? 'ltr' : 'rtl';
        if (typeof applyLanguageSettings === 'function') {
            applyLanguageSettings();
        }

        const arBtn = document.getElementById('settingsLangArBtn');
        const enBtn = document.getElementById('settingsLangEnBtn');
        if (arBtn && enBtn) {
            if (isEn) {
                enBtn.className = 'px-3 py-1.5 text-xs font-black rounded-lg bg-sky-600 text-white shadow-xs';
                arBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-600';
            } else {
                arBtn.className = 'px-3 py-1.5 text-xs font-black rounded-lg bg-sky-600 text-white shadow-xs';
                enBtn.className = 'px-3 py-1.5 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-600';
            }
        }

        // 2. مزامنة مفتاح الوضع الليلي
        const darkToggle = document.getElementById('settingsDarkModeToggle');
        if (darkToggle) {
            const isDark = typeof appState !== 'undefined' ? !!appState.darkMode : document.documentElement.classList.contains('dark');
            darkToggle.checked = isDark;
        }

        // 3. مزامنة مفاتيح الخدمات
        applyFeatureToggles();

        modal.classList.remove('hidden');
        if (typeof MotorCareHaptics !== 'undefined' && MotorCareHaptics.triggerLight) {
            MotorCareHaptics.triggerLight();
        }
    }

    function closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function setLanguage(lang) {
        if (typeof appState !== 'undefined' && appState.lang !== lang) {
            appState.lang = lang;
            if (typeof SafeStorage !== 'undefined') {
                SafeStorage.setJSON('motorCare_AppState_v140', appState);
            }
            if (typeof applyLanguageSettings === 'function') {
                applyLanguageSettings();
            }
            if (typeof renderDashboard === 'function') {
                renderDashboard();
            }
            openSettingsModal();
        }
    }

    function toggleDarkMode(isDark) {
        if (typeof appState !== 'undefined') {
            appState.darkMode = !!isDark;
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
        }
    }

    // ربط الأحداث عند جاهزية الصفحة
    function initSettings() {
        applyFeatureToggles();

        // ربط صريح ومباشر لزر "سجل العمليات والفواتير" في القائمة
        const drawerHistBtn = document.getElementById('drawerBtn-history');
        if (drawerHistBtn) {
            drawerHistBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.switchTab === 'function') {
                    window.switchTab('history');
                }
                if (typeof window.closeMobileMoreDrawer === 'function') {
                    window.closeMobileMoreDrawer();
                }
            });
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSettings);
        } else {
            setTimeout(initSettings, 100);
        }
    }

    const MotorCareSettings = {
        getFeatureToggles,
        saveFeatureToggles,
        applyFeatureToggles,
        handleToggle,
        openSettingsModal,
        closeSettingsModal,
        setLanguage,
        toggleDarkMode,
        initSettings
    };

    if (typeof window !== 'undefined') {
        window.MotorCareSettings = MotorCareSettings;
        window.openSettingsModal = openSettingsModal;
        window.closeSettingsModal = closeSettingsModal;
    }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
