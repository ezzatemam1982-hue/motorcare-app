        function openMobileMoreDrawer() {
            const drawer = document.getElementById('mobileMoreDrawerModal');
            if (drawer) {
                const isEn = typeof appState !== 'undefined' && appState.lang === 'en';
                drawer.dir = isEn ? 'ltr' : 'rtl';
                drawer.classList.remove('hidden');
                drawer.style.display = 'flex';
            }
            if (typeof applyLanguageSettings === 'function') {
                applyLanguageSettings();
            }
            if (typeof initDrawerAndSidebarEventListeners === 'function') {
                initDrawerAndSidebarEventListeners();
            }
        }

        function closeMobileMoreDrawer() {
            const drawer = document.getElementById('mobileMoreDrawerModal');
            if (drawer) {
                drawer.classList.add('hidden');
                drawer.style.setProperty('display', 'none', 'important');
            }
        }

        function initDrawerAndSidebarEventListeners() {
            const attachButton = (id, logText, actionCallback) => {
                const btn = document.getElementById(id);
                if (btn && !btn._hasMotorCareListener) {
                    btn._hasMotorCareListener = true;
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log(logText);
                        actionCallback();
                    });
                }
            };

            // 1. أزرار أدوات السائق المتقدمة
            attachButton('drawerBtn-driverTools', 'Clicked: Driver Tools', () => {
                closeMobileMoreDrawer();
                openDriverToolsModal();
            });
            attachButton('sidebarBtn-driverTools', 'Clicked: Driver Tools', () => {
                openDriverToolsModal();
            });
            attachButton('topMenuBtn-driverTools', 'Clicked: Driver Tools', () => {
                closeTopHeaderMenu();
                openDriverToolsModal();
            });

            // 2. أزرار موسوعة أكواد الأعطال OBD-II
            attachButton('drawerBtn-obd', 'Clicked: OBD Encyclopedia', () => {
                closeMobileMoreDrawer();
                openObdEncyclopediaModal();
            });
            attachButton('sidebarBtn-obd', 'Clicked: OBD Encyclopedia', () => {
                openObdEncyclopediaModal();
            });
            attachButton('topMenuBtn-obd', 'Clicked: OBD Encyclopedia', () => {
                closeTopHeaderMenu();
                openObdEncyclopediaModal();
            });

            // 3. أزرار طباعة وتصدير تقارير PDF
            attachButton('drawerBtn-reports', 'Clicked: Export Reports PDF', () => {
                closeMobileMoreDrawer();
                openExportReportsModal();
            });
            attachButton('sidebarBtn-reports', 'Clicked: Export Reports PDF', () => {
                openExportReportsModal();
            });
            attachButton('topMenuBtn-reports', 'Clicked: Export Reports PDF', () => {
                closeTopHeaderMenu();
                openExportReportsModal();
            });

            // 4. تفويض الأحداث على مستوى الوثيقة بالكامل (Event Delegation)
            if (typeof document !== 'undefined' && !document._hasNavModalDelegation) {
                document._hasNavModalDelegation = true;
                document.addEventListener('click', function(e) {
                    if (!e || !e.target || typeof e.target.closest !== 'function') return;

                    const driverTarget = e.target.closest('#drawerBtn-driverTools, #sidebarBtn-driverTools, #topMenuBtn-driverTools');
                    if (driverTarget) {
                        e.preventDefault();
                        console.log("Clicked: Driver Tools");
                        closeMobileMoreDrawer();
                        closeTopHeaderMenu();
                        openDriverToolsModal();
                        return;
                    }

                    const obdTarget = e.target.closest('#drawerBtn-obd, #sidebarBtn-obd, #topMenuBtn-obd');
                    if (obdTarget) {
                        e.preventDefault();
                        console.log("Clicked: OBD Encyclopedia");
                        closeMobileMoreDrawer();
                        closeTopHeaderMenu();
                        openObdEncyclopediaModal();
                        return;
                    }

                    const reportsTarget = e.target.closest('#drawerBtn-reports, #sidebarBtn-reports, #topMenuBtn-reports');
                    if (reportsTarget) {
                        e.preventDefault();
                        console.log("Clicked: Export Reports PDF");
                        closeMobileMoreDrawer();
                        closeTopHeaderMenu();
                        openExportReportsModal();
                        return;
                    }
                });
            }
        }


        



        function toggleTopHeaderMenu(e) {
            if (e && e.stopPropagation) e.stopPropagation();
            if (typeof openMobileMoreDrawer === 'function') {
                openMobileMoreDrawer();
                return;
            }
            const menu = document.getElementById('topHeaderDropdownMenu');
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden') || menu.style.display === 'none';
            if (isHidden) {
                menu.classList.remove('hidden');
                menu.style.display = 'block';
            } else {
                menu.classList.add('hidden');
                menu.style.display = 'none';
            }
        }
        function closeTopHeaderMenu() {
            const menu = document.getElementById('topHeaderDropdownMenu');
            if (menu) {
                menu.classList.add('hidden');
                menu.style.setProperty('display', 'none', 'important');
            }
        }
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('topHeaderDropdownMenu');
            const btn = document.getElementById('topHeaderMenuBtn');
            if (menu && (!menu.classList.contains('hidden') && menu.style.display !== 'none')) {
                if (!menu.contains(e.target) && !btn?.contains(e.target)) {
                    closeTopHeaderMenu();
                }
            }
        });

        function switchTab(tabId) {
            try {
                if (typeof MotorCareHaptics !== 'undefined' && MotorCareHaptics.triggerLight) {
                    MotorCareHaptics.triggerLight();
                }
            } catch(e) {}
            currentActiveTab = tabId;
            try { window.currentActiveTab = tabId; } catch(e) {}

            // تتبع فتح الشاشات عبر Firebase Analytics
            try {
                if (typeof trackScreenView === 'function') {
                    trackScreenView(tabId);
                } else if (typeof FirebaseAnalytics !== 'undefined' && FirebaseAnalytics && FirebaseAnalytics.setCurrentScreen) {
                    FirebaseAnalytics.setCurrentScreen({ screenName: tabId }).catch(() => {});
                }
            } catch(e) {}

            document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden-section'));
            document.getElementById(`tabContent-${tabId}`)?.classList.remove('hidden-section');
            
            // ضمان عدم ظهور أي تقارير طباعة على الشاشة أثناء التصفح
            document.querySelectorAll('.printable-report').forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('active-print-target');
                el.style.setProperty('display', 'none', 'important');
            });
            
            // تحديث أزرار القائمة الجانبية للشاشات الكبيرة والدراج
            document.querySelectorAll('.side-tab-btn').forEach(b => {
                b.className = "side-tab-btn w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-start cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
            });
            const sideBtn = document.getElementById(`sideTab-${tabId}`);
            if (sideBtn) sideBtn.className = "side-tab-btn w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-start cursor-pointer bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400";

            document.querySelectorAll('.drawer-tab-btn').forEach(b => {
                b.className = "drawer-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-start cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all";
            });
            const drawerBtn = document.getElementById(`drawerTab-${tabId}`);
            if (drawerBtn) drawerBtn.className = "drawer-tab-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-start cursor-pointer transition-all bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400";
            
            // تحديث أزرار شريط التنقل السفلي للموبايل
            document.querySelectorAll('.mobile-nav-btn').forEach(b => {
                b.classList.remove('text-sky-600', 'dark:text-sky-400', 'font-bold');
                b.classList.add('text-slate-500', 'dark:text-slate-400', 'font-semibold');
            });
            const mobileBtn = document.getElementById(`mobileNav-${tabId}`);
            if (mobileBtn) {
                mobileBtn.classList.remove('text-slate-500', 'dark:text-slate-400', 'font-semibold');
                mobileBtn.classList.add('text-sky-600', 'dark:text-sky-400', 'font-bold');
            }

            // إغلاق درج المزيد للموبايل إذا كان مفتوحاً
            closeMobileMoreDrawer();

            // تمرير الشاشة تلقائياً للأعلى حتى لا يضطر المستخدم للتمرير لأسفل الشاشة
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (tabId === 'maintenance') renderCatalogItems();
            if (tabId === 'fuel') renderFuelSection();
            if (tabId === 'hardware') renderHardwareCards();
            if (tabId === 'analytics') setTimeout(renderCharts, 100);
            if (tabId === 'inspection') renderInspectionTab();
            if (tabId === 'history') {
                if (typeof renderHistoryList === 'function') renderHistoryList();
            }
        }



        function renderDashboard() {
            const car = getCurrentCar();
            const emptyState = document.getElementById('noCarEmptyState');
            const activeContent = document.getElementById('dashboardActiveContent');
            const isEn = appState.lang === 'en';

            if (!car) {
                const carTitle = document.getElementById('headerCarTitle');
                if (carTitle) carTitle.innerText = isEn ? 'Add Your Vehicle' : 'أضف سيارتك الأولى';
                const carMeta = document.getElementById('headerCarMeta');
                if (carMeta) carMeta.innerText = isEn ? 'Garage is empty' : 'الكراج فارغ';
                const headerBadge = document.getElementById('headerCarBadgeContainer');
                if (headerBadge) headerBadge.innerHTML = `<i class="fa-solid fa-car text-base sm:text-lg"></i>`;
                const heroLogo = document.getElementById('dashHeroCarLogoContainer');
                if (heroLogo) heroLogo.innerHTML = '';
                if (emptyState) emptyState.classList.remove('hidden');
                if (activeContent) activeContent.classList.add('hidden');

                // تحديث كافة التبويبات والجداول لتعرض الحالة الفارغة النظيفة (Empty States)
                if (typeof renderCatalogItems === 'function') renderCatalogItems();
                if (typeof renderFuelSection === 'function') renderFuelSection();
                if (typeof renderHistoryList === 'function') renderHistoryList();
                if (typeof renderUrgentAlerts === 'function') renderUrgentAlerts();
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');
            if (activeContent) activeContent.classList.remove('hidden');

            const odoDisplay = document.getElementById('currentOdometerDisplay');
            if (odoDisplay) odoDisplay.innerText = Number(car.odometer).toLocaleString();
            
            const engineInfo = document.getElementById('currentCarEngineInfo');
            if (engineInfo) engineInfo.innerText = isEn ? `Engine: ${car.engine} • Year: ${car.year}` : `المحرك: ${car.engine} • سنة الصنع: ${car.year}`;
            
            const carTitle = document.getElementById('headerCarTitle');
            if (carTitle) carTitle.innerText = `${car.brand} ${getCleanCarDisplayName(car.model)}`;
            
            const carMeta = document.getElementById('headerCarMeta');
            if (carMeta) carMeta.innerText = isEn ? `${Number(car.odometer).toLocaleString()} km` : `${Number(car.odometer).toLocaleString()} كم`;

            // 1. تحديث اسم الموديل وشارة السنة بدون اقتطاع وبمظهر عصري أنيق للموبايل
            const heroCarName = document.getElementById('dashHeroCarName');
            if (heroCarName) {
                heroCarName.innerText = `${car.brand} ${getCleanCarDisplayName(car.model)}`;
            }
            const heroYearBadge = document.getElementById('dashHeroCarYearBadge');
            if (heroYearBadge) {
                heroYearBadge.innerText = car.year || '';
                heroYearBadge.style.display = car.year ? 'inline-block' : 'none';
            }
            const heroSubtitle = document.getElementById('dashHeroCarSubtitle');
            if (heroSubtitle) {
                heroSubtitle.innerText = isEn 
                    ? `Catalog: ${car.catalog?.length || 0} maintenance items active` 
                    : `جدول الصيانة: يتضمن ${car.catalog?.length || 0} فحص وبند معتمد`;
            }

            // 2. تحديث عداد السيارات في شارة الكراج
            const garageCountBadge = document.getElementById('dashGarageCountBadge');
            if (garageCountBadge) {
                garageCountBadge.innerText = (appState.cars && appState.cars.length) ? appState.cars.length : 1;
            }

            // 3. تحديث شارات المواصفات التفصيلية (المحرك، سنة الصنع، اللوحة، اللون)
            const specEngineText = document.getElementById('dashSpecEngineText');
            if (specEngineText) {
                specEngineText.innerText = isEn ? `Engine: ${car.engine || '--'}` : `المحرك: ${car.engine || '--'}`;
            }

            const specYearText = document.getElementById('dashSpecYearText');
            if (specYearText) {
                specYearText.innerText = isEn ? `Year: ${car.year || '--'}` : `سنة الصنع: ${car.year || '--'}`;
            }

            const specPlateBadge = document.getElementById('dashSpecPlateBadge');
            const specPlateText = document.getElementById('dashSpecPlateText');
            if (specPlateBadge && specPlateText) {
                if (car.license && car.license.trim()) {
                    specPlateText.innerText = isEn ? `Plate: ${car.license}` : `اللوحة: ${car.license}`;
                    specPlateBadge.classList.remove('hidden');
                } else {
                    specPlateBadge.classList.add('hidden');
                }
            }

            const specColorBadge = document.getElementById('dashSpecColorBadge');
            const specColorText = document.getElementById('dashSpecColorText');
            if (specColorBadge && specColorText) {
                if (car.color && car.color.trim()) {
                    specColorText.innerText = isEn ? `Color: ${car.color}` : `اللون: ${car.color}`;
                    specColorBadge.classList.remove('hidden');
                } else {
                    specColorBadge.classList.add('hidden');
                }
            }

            // 4. تحديث شعار ماركة السيارة في اللوحة الرئيسية
            const heroLogo = document.getElementById('dashHeroCarLogoContainer');
            if (heroLogo) {
                heroLogo.innerHTML = getCarBrandLogoHtml(car.brand, 'w-9 h-9 sm:w-10 sm:h-10', 'bg-transparent');
            }

            renderCatalogItems();
            renderUrgentAlerts();
            renderHistoryList();
            renderFuelSection();
            renderDocumentsGrid();
            renderHardwareCards();
            updateVehicleHealthStatus(car);
            calculateFuelEconomy(car);
            updateDocumentsSummaryCard(car);
        }

        function updateVehicleHealthStatus(car) {
            if (!car) return;
            const isEn = typeof appState !== 'undefined' && appState.lang === 'en';
            
            let catalog = (car && Array.isArray(car.catalog) && car.catalog.length > 0)
                ? car.catalog
                : (typeof appState !== 'undefined' && Array.isArray(appState.catalog) && appState.catalog.length > 0
                    ? appState.catalog
                    : []);

            if ((!catalog || !catalog.length) && car.brand && car.model) {
                if (typeof buildSpecificCatalog === 'function') {
                    catalog = buildSpecificCatalog(car.brand, car.model, car.generationIndex || 0, parseSafeNumber(car.odometer));
                }
            }

            if (car && (!car.catalog || !car.catalog.length) && catalog && catalog.length) {
                car.catalog = catalog;
            }

            const pBar = document.getElementById('carHealthProgressBar');
            const sText = document.getElementById('carHealthStatusText');
            const pSpan = document.getElementById('carHealthPercentageSpan');

            const currentOdo = (typeof parseSafeNumber === 'function') 
                ? parseSafeNumber(car.odometer) 
                : (Number(String(car.odometer || 0).replace(/,/g, '')) || 0);

            let overdueCount = 0;
            let approachingCount = 0;
            let totalDeduction = 0;

            if (Array.isArray(catalog) && catalog.length > 0) {
                catalog.forEach(item => {
                    const res = evaluateMaintenanceItem(item, currentOdo, car);
                    if (res && res.isOverdue) {
                        overdueCount++;
                        const overdueRatio = res.kmInterval > 0 ? (res.overdueKm / res.kmInterval) : 1;
                        totalDeduction += Math.min(35, 20 + Math.round(overdueRatio * 15));
                    } else if (res && res.isApproaching) {
                        approachingCount++;
                        totalDeduction += 5;
                    }
                });
            }

            let healthPercent = 100;
            if (overdueCount > 0) {
                healthPercent = Math.max(15, 100 - totalDeduction);
            } else if (approachingCount > 0) {
                healthPercent = Math.max(75, 100 - totalDeduction);
            }

            if (pSpan) pSpan.innerText = `${healthPercent}%`;

            if (pBar) {
                pBar.style.width = `${healthPercent}%`;
                if (overdueCount > 0) {
                    pBar.style.backgroundColor = '#ef4444';
                } else if (approachingCount > 0) {
                    pBar.style.backgroundColor = '#f59e0b';
                } else {
                    pBar.style.backgroundColor = '#10b981';
                }
            }

            if (sText) {
                sText.removeAttribute('data-i18n');
                if (overdueCount > 0) {
                    sText.innerText = isEn 
                        ? `⚠️ Requires Attention - ${overdueCount} Service${overdueCount > 1 ? 's' : ''} Overdue` 
                        : `⚠️ تتطلب انتباهك - يوجد (${overdueCount}) صيانات مستحقة`;
                    sText.className = "text-sm font-bold text-rose-500 animate-pulse";
                } else if (approachingCount > 0) {
                    sText.innerText = isEn 
                        ? `⏳ Services Approaching (${approachingCount})` 
                        : `⏳ صيانات اقترب موعدها (${approachingCount})`;
                    sText.className = "text-sm font-bold text-amber-500";
                } else {
                    sText.innerText = isEn ? "Excellent - All services up to date" : "ممتازة - جميع الصيانات منتظمة";
                    sText.className = "text-sm font-bold text-emerald-400";
                }
            }
        }




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

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof renderDashboard !== 'undefined') window.renderDashboard = renderDashboard; } catch (e) {}
try { if (typeof switchTab !== 'undefined') window.switchTab = switchTab; } catch (e) {}
try { if (typeof toggleTopHeaderMenu !== 'undefined') window.toggleTopHeaderMenu = toggleTopHeaderMenu; } catch (e) {}
try { if (typeof closeTopHeaderMenu !== 'undefined') window.closeTopHeaderMenu = closeTopHeaderMenu; } catch (e) {}
try { if (typeof openMobileMoreDrawer !== 'undefined') window.openMobileMoreDrawer = openMobileMoreDrawer; } catch (e) {}
try { if (typeof closeMobileMoreDrawer !== 'undefined') window.closeMobileMoreDrawer = closeMobileMoreDrawer; } catch (e) {}
try { if (typeof updateVehicleHealthStatus !== 'undefined') window.updateVehicleHealthStatus = updateVehicleHealthStatus; } catch (e) {}
try { if (typeof toggleDarkMode !== 'undefined') window.toggleDarkMode = toggleDarkMode; } catch (e) {}
try { if (typeof currentActiveTab !== 'undefined') window.currentActiveTab = currentActiveTab; } catch (e) {}
try { if (typeof initDrawerAndSidebarEventListeners !== 'undefined') window.initDrawerAndSidebarEventListeners = initDrawerAndSidebarEventListeners; } catch (e) {}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDrawerAndSidebarEventListeners);
    } else {
        initDrawerAndSidebarEventListeners();
    }
}

