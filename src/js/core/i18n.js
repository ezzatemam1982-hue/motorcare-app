
        function getLocalizedItemName(item) {
            const raw = typeof item === 'string' ? item : (item.name || '');
            if (appState.lang !== 'en') return raw;
            
            if (raw.includes('زيت المحرك')) return raw.replace('زيت المحرك', 'Engine Oil').replace('كم', 'km');
            if (raw.includes('فلتر هواء المحرك')) return 'Engine Air Filter';
            if (raw.includes('بوجيهات إيريديوم طويلة المدى') || raw.includes('Long-Life Iridium')) return 'Long-Life Iridium Spark Plugs';
            if (raw.includes('بوجيهات إيريديوم') || raw.includes('Laser Iridium') || raw.includes('Iridium')) return 'Laser Iridium Spark Plugs';
            if (raw.includes('بوجيهات بلاتنيوم مزدوجة') || raw.includes('Double Platinum')) return 'Double Platinum Spark Plugs';
            if (raw.includes('بوجيهات بلاتنيوم') || raw.includes('Single Platinum') || raw.includes('Platinum')) return 'Single Platinum Spark Plugs';
            if (raw.includes('بوجيهات نحاسية') || raw.includes('Copper') || raw.includes('Nickel')) return 'Standard Copper/Nickel Spark Plugs';
            if (raw.includes('بوجيهات')) return 'Spark Plugs';
            if (raw.includes('سير الكاتينة')) return 'Timing Belt Kit';
            if (raw.includes('سير الدينامو') || raw.includes('سير المجموعة')) return 'Serpentine Belt';
            if (raw.includes('زيت الفتيس')) return raw.replace('زيت الفتيس', 'Transmission Fluid');
            if (raw.includes('زيت الفرامل')) return 'Brake Fluid (DOT 4)';
            if (raw.includes('تيل الفرامل') || raw.includes('تيل فرامل')) return raw.replace('تيل فرامل', 'Brake Pads').replace('تيل الفرامل', 'Brake Pads');
            if (raw.includes('زيت طلمبة الباور')) return 'Power Steering Fluid';
            if (raw.includes('سائل تبريد المحرك')) return 'Coolant Radiator LLC';
            if (raw.includes('إطارات')) return raw.replace('إطارات', 'Tires');

            return raw;
        }

        function toggleLanguage() {
            appState.lang = appState.lang === 'en' ? 'ar' : 'en';
            applyLanguageSettings();
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            renderDashboard();
        }

        function applyLanguageSettings() {
            const isEn = appState.lang === 'en';
            document.documentElement.lang = appState.lang;
            document.documentElement.dir = isEn ? 'ltr' : 'rtl';

            const langBtn = document.getElementById('langBtnText');
            if (langBtn) langBtn.innerText = isEn ? 'العربية' : 'EN';
            const landingLangBtn = document.getElementById('landingLangBtnText');
            if (landingLangBtn) landingLangBtn.innerText = isEn ? 'العربية' : 'EN';
            const sText = document.getElementById('authSubmitBtnText');
            if (sText) {
                sText.innerText = isEn 
                    ? (currentAuthMode === 'register' ? 'Create Account & Start' : 'Instant Sign In')
                    : (currentAuthMode === 'register' ? 'إنشاء حساب والبدء' : 'دخول فوري');
            }

            const oUnit = document.getElementById('odoUnitSpan');
            if (oUnit) oUnit.innerText = isEn ? 'km' : 'كم';

            document.querySelectorAll('.modal-unit-km').forEach(el => {
                el.innerText = isEn ? 'km' : 'كم';
            });

            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (DICTIONARY[appState.lang] && DICTIONARY[appState.lang][key]) {
                    el.innerText = DICTIONARY[appState.lang][key];
                }
            });

            document.querySelectorAll('[data-i18n-ph]').forEach(el => {
                const key = el.getAttribute('data-i18n-ph');
                if (DICTIONARY[appState.lang] && DICTIONARY[appState.lang][key]) {
                    el.setAttribute('placeholder', DICTIONARY[appState.lang][key]);
                }
            });

            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                if (DICTIONARY[appState.lang] && DICTIONARY[appState.lang][key]) {
                    el.setAttribute('title', DICTIONARY[appState.lang][key]);
                }
            });

            // تحديث نص شريط حالة الاتصال حسب اللغة إذا كان معروضاً حالياً
            const netStatusText = document.getElementById('networkStatusText');
            if (netStatusText && !navigator.onLine) {
                netStatusText.innerText = isEn 
                    ? 'You are currently working in offline mode - your data is saved and accessible' 
                    : 'أنت تعمل الآن في وضع عدم الاتصال بالإنترنت - بياناتك محفوظة ومتاحة';
            }

            // إعادة رسم زر Google باللغة والمظهر المحدث
            if (typeof initGoogleIdentityServices === 'function') {
                initGoogleIdentityServices();
            }

            if (currentActiveTab === 'maintenance') renderCatalogItems();
            if (currentActiveTab === 'documents') renderDocumentsGrid();
            if (currentActiveTab === 'hardware') renderHardwareCards();
            if (currentActiveTab === 'history') renderHistoryList();
            if (currentActiveTab === 'analytics') renderCharts();
            if (currentActiveTab === 'inspection') renderInspectionTab();
            if (currentActiveTab === 'fuel') renderFuelSection();

            const gModal = document.getElementById('garageModal');
            if (gModal && !gModal.classList.contains('hidden')) {
                openGarageModal();
            }

            const obdModal = document.getElementById('obdEncyclopediaModal');
            if (obdModal && !obdModal.classList.contains('hidden')) {
                if (typeof updateObdModalLanguage === 'function') updateObdModalLanguage();
                if (typeof renderObdCodesList === 'function') renderObdCodesList();
            }

            const dtModal = document.getElementById('driverToolsModal');
            if (dtModal && !dtModal.classList.contains('hidden')) {
                if (typeof updateDriverToolsLanguage === 'function') updateDriverToolsLanguage();
                if (typeof renderDriverToolsData === 'function') renderDriverToolsData();
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof getLocalizedItemName !== 'undefined') window.getLocalizedItemName = getLocalizedItemName; } catch (e) {}
try { if (typeof toggleLanguage !== 'undefined') window.toggleLanguage = toggleLanguage; } catch (e) {}
try { if (typeof applyLanguageSettings !== 'undefined') window.applyLanguageSettings = applyLanguageSettings; } catch (e) {}
