        function openMobileMoreDrawer() {
            document.getElementById('mobileMoreDrawerModal')?.classList.remove('hidden');
        }

        function closeMobileMoreDrawer() {
            document.getElementById('mobileMoreDrawerModal')?.classList.add('hidden');
        }

        



        /* [UI ENHANCEMENT] وظائف القائمة المنسدلة العلوية (Top Header Hamburger Menu) */
        function toggleTopHeaderMenu(e) {
            if (e && e.stopPropagation) e.stopPropagation();
            const menu = document.getElementById('topHeaderDropdownMenu');
            if (menu) menu.classList.toggle('hidden');
        }
        function closeTopHeaderMenu() {
            const menu = document.getElementById('topHeaderDropdownMenu');
            if (menu) menu.classList.add('hidden');
        }
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('topHeaderDropdownMenu');
            const btn = document.getElementById('topHeaderMenuBtn');
            if (menu && !menu.classList.contains('hidden')) {
                if (!menu.contains(e.target) && !btn?.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            }
        });

        function switchTab(tabId) {
            currentActiveTab = tabId;
            document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden-section'));
            document.getElementById(`tabContent-${tabId}`)?.classList.remove('hidden-section');
            
            // تحديث أزرار القائمة الجانبية للشاشات الكبيرة
            document.querySelectorAll('.side-tab-btn').forEach(b => {
                b.className = "side-tab-btn w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-start cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
            });
            const sideBtn = document.getElementById(`sideTab-${tabId}`);
            if (sideBtn) sideBtn.className = "side-tab-btn w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold text-start cursor-pointer bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400";
            
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
            if (tabId === 'hardware') renderHardwareCards();
            if (tabId === 'analytics') setTimeout(renderCharts, 100);
            if (tabId === 'inspection') renderInspectionTab();
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
            if (!car || !car.catalog || !car.catalog.length) return;
            const isEn = appState.lang === 'en';

            const currentOdo = Number(car.odometer) || 0;
            const total = car.catalog.length;

            const overdueItems = car.catalog.filter(i => evaluateMaintenanceItem(i, currentOdo, car).isOverdue);
            const overdueCount = overdueItems.length;

            const percent = Math.max(0, Math.round(((total - overdueCount) / total) * 100));

            const pBar = document.getElementById('carHealthProgressBar');
            const sText = document.getElementById('carHealthStatusText');
            const pSpan = document.getElementById('carHealthPercentageSpan');

            if (pSpan) pSpan.innerText = `${percent}%`;

            if (pBar) {
                pBar.style.width = `${percent}%`;
                pBar.style.backgroundColor = overdueCount > 0 ? '#ef4444' : (percent < 80 ? '#f59e0b' : '#10b981');
            }

            if (sText) {
                sText.removeAttribute('data-i18n');
                if (overdueCount > 0) {
                    sText.innerText = isEn ? `Urgent: ${overdueCount} maintenance item(s) overdue!` : `تنبيه عاجل: يوجد ${overdueCount} بند صيانة مستحق فوراً!`;
                    sText.className = "text-sm font-bold text-rose-500";
                } else {
                    sText.innerText = isEn ? "Excellent - All services are up to date" : "ممتازة - جميع الصيانات منتظمة";
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
