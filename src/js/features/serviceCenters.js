        /* ==========================================================================
           [FEATURE] دليل مراكز الخدمة والتوكيلات المعتمدة في مصر (Service Centers Directory)
           Smart Dynamic Filtering by Current Car, Brand, Governorate, and Live GPS
           ========================================================================== */
        function openServiceCentersModal() {
            const car = getCurrentCar();
            const brand = car ? (car.brand || '').trim() : '';
            const carBadgeEl = document.getElementById('scCurrentCarBadge');
            const brandSelect = document.getElementById('scBrandFilter');
            const govSelect = document.getElementById('scGovFilter');
            const searchInput = document.getElementById('scSearchInput');

            const modal = document.getElementById('serviceCentersModal');
            if (modal) modal.dir = (typeof appState !== 'undefined' && appState && appState.lang === 'en') ? 'ltr' : 'rtl';

            // 1. Populate filters options dynamically based on current language
            populateServiceCenterFilters();

            // 2. Update smart car header badge
            if (carBadgeEl) {
                if (car && car.brand) {
                    carBadgeEl.innerText = `${car.brand} ${car.model || ''} (${car.year || ''})`;
                } else {
                    carBadgeEl.innerText = (appState.lang === 'en' ? 'All Brands' : 'جميع الماركات');
                }
            }

            // 3. Auto-filter by current car's brand
            if (brandSelect) {
                let matchFound = false;
                if (brand) {
                    for (let opt of brandSelect.options) {
                        if (opt.value.toLowerCase() === brand.toLowerCase()) {
                            brandSelect.value = opt.value;
                            matchFound = true;
                            break;
                        }
                    }
                }
                if (!matchFound) {
                    brandSelect.value = 'all';
                }
            }

            if (govSelect) govSelect.value = 'all';
            if (searchInput) searchInput.value = '';

            // Apply data-i18n translation to static elements inside modal
            if (typeof applyLanguageSettings === 'function') {
                applyLanguageSettings();
            }

            // 4. Render matching cards
            renderServiceCenters();

            // 5. Display modal
            document.getElementById('serviceCentersModal')?.classList.remove('hidden');
        }

        function closeServiceCentersModal() {
            document.getElementById('serviceCentersModal')?.classList.add('hidden');
        }

        function populateServiceCenterFilters() {
            const isEn = (typeof appState !== 'undefined' && appState && appState.lang === 'en');
            
            // 1. Populate Brands
            populateServiceCenterBrands();

            // 2. Populate Governorates
            const govSelect = document.getElementById('scGovFilter');
            if (govSelect) {
                const currentGovVal = govSelect.value || 'all';
                const govs = [
                    { val: 'all', label: isEn ? 'All Governorates' : 'كل المحافظات' },
                    { val: 'القاهرة', label: isEn ? 'Cairo' : 'القاهرة' },
                    { val: 'الجيزة', label: isEn ? 'Giza' : 'الجيزة' },
                    { val: 'الإسكندرية', label: isEn ? 'Alexandria' : 'الإسكندرية' },
                    { val: 'القليوبية', label: isEn ? 'Qalyubia' : 'القليوبية' },
                    { val: 'الغربية', label: isEn ? 'Gharbia (Tanta)' : 'الغربية (طنطا)' },
                    { val: 'الدقهلية', label: isEn ? 'Dakahlia (Mansoura)' : 'الدقهلية (المنصورة)' },
                    { val: 'الشرقية', label: isEn ? 'Sharqia' : 'الشرقية' },
                    { val: 'أسيوط', label: isEn ? 'Asyut & Upper Egypt' : 'أسيوط والصعيد' },
                    { val: 'البحر الأحمر', label: isEn ? 'Red Sea' : 'البحر الأحمر' }
                ];
                govSelect.innerHTML = govs.map(g => `<option value="${g.val}">${g.label}</option>`).join('');
                govSelect.value = currentGovVal;
            }

            // 3. Populate Types
            const typeSelect = document.getElementById('scTypeFilter');
            if (typeSelect) {
                const currentTypeVal = typeSelect.value || 'all';
                const types = [
                    { val: 'all', label: isEn ? 'All Types' : 'كل الأنواع' },
                    { val: 'official_dealership', label: isEn ? 'Authorized Dealerships & Distributors 🏢' : 'توكيلات وموزعون معتمدون 🏢' },
                    { val: 'authorized_center', label: isEn ? 'Authorized Service Centers 🛡️' : 'مراكز خدمة وضمان معتمدة 🛡️' },
                    { val: 'quick_service', label: isEn ? 'Quick Service & Lube ⚡' : 'صيانة سريعة وزيوت ⚡' }
                ];
                typeSelect.innerHTML = types.map(t => `<option value="${t.val}">${t.label}</option>`).join('');
                typeSelect.value = currentTypeVal;
            }
        }

        function populateServiceCenterBrands() {
            const brandSelect = document.getElementById('scBrandFilter');
            if (!brandSelect) return;
            const currentVal = brandSelect.value || 'all';

            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const brandSet = new Set();
            centers.forEach(c => {
                (c.brands || []).forEach(b => {
                    if (b && !b.includes('Custom')) brandSet.add(b);
                });
            });

            if (typeof CAR_BRANDS_CATALOG !== 'undefined') {
                Object.keys(CAR_BRANDS_CATALOG).forEach(b => {
                    if (b && !b.includes('Custom')) brandSet.add(b);
                });
            }

            const sortedBrands = Array.from(brandSet).sort((a, b) => a.localeCompare(b));
            const isEn = (typeof appState !== 'undefined' && appState && appState.lang === 'en');
            
            brandSelect.innerHTML = `<option value="all">${isEn ? 'All Brands' : 'جميع الماركات'}</option>`;
            sortedBrands.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.innerText = b;
                brandSelect.appendChild(opt);
            });
            brandSelect.value = currentVal;
        }

        function getLocalizedGov(gov, govEn) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return gov || '';
            if (govEn) return govEn;
            const g = (gov || '').trim();
            const map = {
                'القاهرة': 'Cairo',
                'الجيزة': 'Giza',
                'الإسكندرية': 'Alexandria',
                'القليوبية': 'Qalyubia',
                'الغربية': 'Gharbia',
                'الدقهلية': 'Dakahlia',
                'الشرقية': 'Sharqia',
                'أسيوط': 'Asyut',
                'البحر الأحمر': 'Red Sea',
                'أسوان': 'Aswan',
                'الأقصر': 'Luxor',
                'سوهاج': 'Sohag',
                'المنيا': 'Minya',
                'بني سويف': 'Beni Suef',
                'الفيوم': 'Fayoum',
                'الإسماعيلية': 'Ismailia',
                'السويس': 'Suez',
                'بورسعيد': 'Port Said',
                'دمياط': 'Damietta',
                'البحيرة': 'Beheira',
                'المنوفية': 'Monufia',
                'كفر الشيخ': 'Kafr El Sheikh',
                'مطروح': 'Matrouh',
                'قنا': 'Qena'
            };
            for (let key in map) {
                if (g.includes(key)) return map[key];
            }
            return g;
        }

        function getLocalizedAgency(agency) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return agency || '';
            let str = (agency || '').trim();
            if (!str) return 'Official Agency';

            if (str.includes('EIT') || str.includes('كيا مصر')) return 'Kia Egypt (EIT Official Dealership)';
            if (str.includes('البافارية') || str.includes('BMW')) return 'Bavarian Auto Group (BMW Egypt)';
            if (str.includes('أبو غالي') || str.includes('Abou Ghaly')) return 'Abou Ghaly Motors';
            if (str.includes('غبور') || str.includes('GB Auto')) return 'GB Auto (Ghabbour Automotive)';
            if (str.includes('المنصور') || str.includes('Mansour')) return 'Al Mansour Automotive';
            if (str.includes('ألكان') || str.includes('Alkan')) return 'Egyptian & Alkan Automotive';
            if (str.includes('القصراوي') || str.includes('Kasrawy')) return 'Kasrawy Group';
            if (str.includes('الكرنك') || str.includes('Karnak')) return 'El Karnak Co.';
            if (str.includes('دايموند') || str.includes('Diamond')) return 'Diamond Motors (Mitsubishi)';
            if (str.includes('نيسان مصر') || str.includes('Nissan')) return 'Nissan Motor Egypt';
            if (str.includes('تويوتا مصر') || str.includes('Toyota')) return 'Toyota Egypt';
            if (str.includes('أوتو جميل') || str.includes('Auto Jameel')) return 'Auto Jameel (Ford Egypt)';
            if (str.includes('السبع') || str.includes('El Sebaey')) return 'El Sebaey Automotive';
            if (str.includes('عربيات') || str.includes('Arabiat')) return 'Arabiat Motors';

            return str
                .replace(/الشركة/g, 'Co.')
                .replace(/موزع معتمد/g, 'Authorized Dealer')
                .replace(/توكيل رسمي/g, 'Official Dealership')
                .replace(/الوكيل الرسمي/g, 'Official Agency')
                .replace(/مركز معتمد/g, 'Authorized Center')
                .replace(/مبيعات وخدمات/g, 'Sales & Services')
                .replace(/قطع غيار/g, 'Spare Parts');
        }

        function getLocalizedCenterName(name, nameEn) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return name || '';
            if (nameEn && !/[\u0600-\u06FF]/.test(nameEn)) return nameEn;
            
            let str = (name || '').trim();
            return str
                .replace(/مركز كيا المعتمد/g, 'Authorized Kia Service Center')
                .replace(/مركز خدمة وضمان معتمد/g, 'Authorized Service & Warranty Center')
                .replace(/مركز خدمة معتمد/g, 'Authorized Service Center')
                .replace(/مركز صيانة معتمد/g, 'Authorized Maintenance Center')
                .replace(/مركز صيانة/g, 'Service Center')
                .replace(/مركز خدمة/g, 'Service Center')
                .replace(/مركز/g, 'Service Center')
                .replace(/توكيل/g, 'Dealership')
                .replace(/معرض مبيعات/g, 'Sales Showroom')
                .replace(/موزع معتمد/g, 'Authorized Dealer')
                .replace(/موزع/g, 'Dealer')
                .replace(/فرع/g, 'Branch')
                .replace(/شركة/g, 'Co.')
                .replace(/قطع غيار/g, 'Spare Parts')
                .replace(/المنطقة الصناعية/g, 'Industrial Zone')
                .replace(/الرئيسي/g, 'Main');
        }

        function getLocalizedArea(area) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return area || '';
            let str = (area || '').trim();
            return str
                .replace(/أبو رواش|أبورواش/g, 'Abu Rawash')
                .replace(/المنطقة الصناعية/g, 'Industrial Zone')
                .replace(/التجمع الخامس/g, '5th Settlement')
                .replace(/التجمع/g, 'New Cairo')
                .replace(/العبور/g, 'El Obour')
                .replace(/مدينة نصر/g, 'Nasr City')
                .replace(/مصر الجديدة/g, 'Heliopolis')
                .replace(/المعادي/g, 'Maadi')
                .replace(/6 أكتوبر|أكتوبر/g, '6th of October')
                .replace(/الشيخ زايد/g, 'Sheikh Zayed')
                .replace(/طنطا/g, 'Tanta')
                .replace(/المنصورة/g, 'Mansoura')
                .replace(/الزقازيق/g, 'Zagazig')
                .replace(/سموحة/g, 'Smouha')
                .replace(/محرم بك/g, 'Moharam Bek')
                .replace(/العامريات|العامرية/g, 'Amriya');
        }

        function getLocalizedAddress(address) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return address || '';
            let str = (address || '').trim();
            return str
                .replace(/الكيلو/g, 'KM')
                .replace(/طريق مصر إسكندرية الصحراوي/g, 'Cairo-Alexandria Desert Road')
                .replace(/طريق مصر اسكندرية الصحراوي/g, 'Cairo-Alexandria Desert Road')
                .replace(/المنطقة الصناعية الجديدة/g, 'New Industrial Zone')
                .replace(/المنطقة الصناعية/g, 'Industrial Zone')
                .replace(/الصحراوي/g, 'Desert Road')
                .replace(/طريق الخزان/g, 'El Khazan Road')
                .replace(/طريق/g, 'Road')
                .replace(/شارع/g, 'St.')
                .replace(/قطعة/g, 'Plot')
                .replace(/خلف/g, 'Behind')
                .replace(/بجوار/g, 'Next to')
                .replace(/أمام/g, 'In front of')
                .replace(/مقابل/g, 'Opposite')
                .replace(/القرية الذكية/g, 'Smart Village')
                .replace(/أبو رواش|أبورواش/g, 'Abu Rawash')
                .replace(/العبور/g, 'El Obour')
                .replace(/مدينة نصر/g, 'Nasr City')
                .replace(/مصر الجديدة/g, 'Heliopolis')
                .replace(/المعادي/g, 'Maadi')
                .replace(/6 أكتوبر|أكتوبر/g, '6th of October')
                .replace(/الشيخ زايد/g, 'Sheikh Zayed')
                .replace(/القاهرة/g, 'Cairo')
                .replace(/الجيزة/g, 'Giza')
                .replace(/الإسكندرية|اسكندرية/g, 'Alexandria')
                .replace(/أسوان/g, 'Aswan');
        }

        function getLocalizedHours(hours) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return hours || '';
            let str = (hours || '').trim();
            return str
                .replace(/السبت/g, 'Sat')
                .replace(/الأحد/g, 'Sun')
                .replace(/الإثنين|الاثنين/g, 'Mon')
                .replace(/الثلاثاء/g, 'Tue')
                .replace(/الأربعاء/g, 'Wed')
                .replace(/الخميس/g, 'Thu')
                .replace(/الجمعة/g, 'Fri')
                .replace(/طوال الأسبوع/g, 'All Week')
                .replace(/24 ساعة/g, '24 Hours')
                .replace(/من/g, 'From ')
                .replace(/حتى|إلى/g, ' to ')
                .replace(/صباحًا|صباحا/g, ' AM')
                .replace(/مساءً|مساء/g, ' PM')
                .replace(/(\d+(?:\.\d+)?)\s*ص/g, '$1 AM')
                .replace(/(\d+(?:\.\d+)?)\s*م/g, '$1 PM')
                .replace(/عطلة|إجازة/g, 'Closed');
        }

        function getLocalizedServiceTag(service) {
            if (typeof appState !== 'undefined' && appState && appState.lang !== 'en') return service || '';
            let str = (service || '').trim();

            const exactMap = {
                'صيانة دورية وضمان معتمد من كيا': 'Kia Routine Maintenance & Warranty',
                'قطع غيار كيا أصلية': 'Genuine Kia Spare Parts',
                'ميكانيكا وعفشة وكهرباء': 'Mechanics, Suspension & Electrical',
                'فحص كمبيوتر معتمد': 'Certified Computer Diagnostics',
                'سمكرة ودهان وفرن معتمد': 'Body Work, Paint & Oven Chamber',
                'ميكانيكا وكهرباء وتكييف': 'Mechanics, Electrical & AC',
                'قطع غيار كيا أصلية بالضمان': 'Genuine Kia Parts with Warranty',
                'صيانة دورية وضمان كيا الرسمي': 'Kia Official Routine Service & Warranty',
                'فحص وتشخيص أعطال بالكمبيوتر': 'Computer Diagnostics & Troubleshooting',
                'تعديل واختبار كمبيوتر وتحديث برمجيات الوكيل الرسمي': 'Computer Testing & Official ECU Software Update',
                'أصلية بضمان سنتين BMW قطع غيار': 'Genuine BMW Parts with 2-Year Warranty',
                'قطع غيار BMW أصلية بضمان سنتين': 'Genuine BMW Parts with 2-Year Warranty',
                'صيانة دورية وسريعة لكافة فئات BMW': 'Routine & Quick Maintenance for All BMW Series',
                'صيانة دورية وسريعة لكافة فئات': 'Routine & Quick Maintenance for All Models',
                'مبيعات سيارات ميتسوبيشي': 'Mitsubishi New Car Sales',
                'قطع غيار ميتسوبيشي أصلية': 'Genuine Mitsubishi Spare Parts',
                'تسليم فوري': 'Immediate Delivery',
                'برامج تقسيط': 'Installment Plans',
                'سمكرة ودهان': 'Bodywork & Painting',
                'زيوت وفلاتر': 'Oil & Filters',
                'شحن تكييف': 'AC Gas Refill',
                'بطاريات وإطارات': 'Batteries & Tires',
                'غسيل وتلميع': 'Car Wash & Detailing'
            };

            if (exactMap[str]) return exactMap[str];

            return str
                .replace(/صيانة دورية وسريعة/g, 'Routine & Quick Service')
                .replace(/صيانة دورية/g, 'Routine Maintenance')
                .replace(/صيانة/g, 'Service')
                .replace(/قطع غيار أصلية/g, 'Genuine Parts')
                .replace(/قطع غيار/g, 'Spare Parts')
                .replace(/بالضمان/g, 'with Warranty')
                .replace(/ضمان/g, 'Warranty')
                .replace(/فحص كمبيوتر/g, 'Computer Diagnostics')
                .replace(/فحص وتشخيص أعطال/g, 'Diagnostics & Troubleshooting')
                .replace(/ميكانيكا/g, 'Mechanics')
                .replace(/كهرباء/g, 'Electrical')
                .replace(/تكييف/g, 'AC Service')
                .replace(/عفشة/g, 'Suspension')
                .replace(/سمكرة/g, 'Body Repair')
                .replace(/دهان/g, 'Paint')
                .replace(/وفرن معتمد/g, '& Oven')
                .replace(/تحديث برمجيات الوكيل الرسمي/g, 'Official Software Update')
                .replace(/تعديل واختبار كمبيوتر/g, 'Computer Tuning & Testing')
                .replace(/تغير زيت|تغيير زيت/g, 'Oil Change');
        }

        function resetServiceCenterFilters() {
            const brandSelect = document.getElementById('scBrandFilter');
            const govSelect = document.getElementById('scGovFilter');
            const typeSelect = document.getElementById('scTypeFilter');
            const searchInput = document.getElementById('scSearchInput');
            if (brandSelect) brandSelect.value = 'all';
            if (govSelect) govSelect.value = 'all';
            if (typeSelect) typeSelect.value = 'all';
            if (searchInput) searchInput.value = '';
            renderServiceCenters();
        }

        function applyServiceCenterFilters() {
            renderServiceCenters();
        }

        /**
         * توليد رابط خرائط جوجل المعتمد لملف النشاط التجاري (Verified Google Business Profile)
         * Always uses official Google Maps query scheme or verified Place ID/Share URL (never a silent raw pin)
         * Format: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brand + ' ' + officialAgencyName + ' ' + branchName + ' ' + city)}
         */
        function getServiceCenterMapsUrl(center, userCorr) {
            if (!center) return 'https://www.google.com/maps';

            // 1. User/Community verified correction URL if provided
            if (userCorr && userCorr.newMapsUrl && typeof userCorr.newMapsUrl === 'string' && userCorr.newMapsUrl.startsWith('http') && !userCorr.newMapsUrl.includes('query=undefined')) {
                return userCorr.newMapsUrl;
            }

            const brand = (center.brand || (center.brands && center.brands[0]) || (Array.isArray(center.brands) ? center.brands.join(' ') : '') || '').trim();
            const officialAgencyName = (center.agency || '').trim();
            const branchName = (center.name || '').trim();
            const city = (center.city || center.gov || center.area || 'مصر').trim();

            const queryParts = [brand, officialAgencyName, branchName, city].filter(Boolean);
            const officialSearchQuery = queryParts.join(' ').replace(/\s+/g, ' ').trim();

            // 2. Verified Place ID if known
            if (center.placeId) {
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officialSearchQuery)}&query_place_id=${encodeURIComponent(center.placeId)}`;
            }

            // 3. Known verified share URL or verified place URL
            if (center.verifiedMapsUrl && typeof center.verifiedMapsUrl === 'string' && center.verifiedMapsUrl.startsWith('http')) {
                return center.verifiedMapsUrl;
            }
            if (center.googleMapsUrl && typeof center.googleMapsUrl === 'string' && center.googleMapsUrl.startsWith('http')) {
                return center.googleMapsUrl;
            }
            if (center.mapsUrl && typeof center.mapsUrl === 'string' && (center.mapsUrl.includes('maps.app.goo.gl') || center.mapsUrl.includes('/place/'))) {
                return center.mapsUrl;
            }

            // 4. Official Google Business Profile Query Scheme (never drop a bare silent coordinate pin)
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brand + ' ' + officialAgencyName + ' ' + branchName + ' ' + city)}`;
        }

        /**
         * فتح موقع المركز بالبحث الدلالي الجغرافي المباشر (الاسم + المحافظة + العنوان الفعلي) لمنع توجيه فروع المحافظات إلى القاهرة
         */
        function openServiceCenterMap(centerId) {
            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) return;

            let userCorr = null;
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorr = JSON.parse(raw)[center.id];
            } catch(e) {}

            let targetUrl = '';
            if (userCorr && userCorr.newMapsUrl && typeof userCorr.newMapsUrl === 'string' && userCorr.newMapsUrl.startsWith('http')) {
                targetUrl = userCorr.newMapsUrl;
            } else {
                // البحث الدلالي الجغرافي بالاسم والمحافظة والعنوان الفعلي عبر رابط بحث Google Maps الرسمي
                const brand = (center.brand || (center.brands && center.brands[0]) || '').trim();
                const branchName = (center.name || '').trim();
                const gov = (center.gov || '').trim();
                const address = (center.address || center.area || '').trim();
                const queryParts = [branchName, gov, address].filter(Boolean);
                const queryStr = queryParts.join(' ').replace(/\s+/g, ' ').trim();
                targetUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`;
            }

            // الفتح السلس عبر إضافة المتصفح الأصلي لـ Capacitor أو متصفح النظام الخارجي
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                window.Capacitor.Plugins.Browser.open({ url: targetUrl }).catch(() => {
                    window.open(targetUrl, '_system');
                });
            } else {
                window.open(targetUrl, '_system');
            }
        }

        function renderServiceCenters() {
            const container = document.getElementById('scCardsContainer');
            const countEl = document.getElementById('scResultsSummary');
            if (!container) return;

            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const brandVal = (document.getElementById('scBrandFilter')?.value || 'all').toLowerCase();
            const govVal = (document.getElementById('scGovFilter')?.value || 'all').toLowerCase();
            const typeVal = (document.getElementById('scTypeFilter')?.value || 'all');
            const searchVal = (document.getElementById('scSearchInput')?.value || '').trim().toLowerCase();
            const isEn = (typeof appState !== 'undefined' && appState && appState.lang === 'en');

            // تحميل تعديلات المستخدمين المحفوظة محلياً (Offline-First User Corrections)
            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }
            const corrCount = Object.keys(userCorrections).length;
            const badgeEl = document.getElementById('scHeaderCorrectionsBadge');
            if (badgeEl) {
                if (corrCount > 0) {
                    badgeEl.textContent = corrCount;
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            }
            const totalCountEl = document.getElementById('scTotalCentersHeaderCount');
            if (totalCountEl && centers.length) {
                totalCountEl.textContent = centers.length;
            }

            let filtered = centers.filter(c => {
                // 1. Brand Filter
                if (brandVal !== 'all') {
                    const brands = (c.brands || []).map(b => b.toLowerCase());
                    const matchesBrand = brands.some(b => b === brandVal || b.includes(brandVal) || brandVal.includes(b));
                    if (!matchesBrand) return false;
                }

                // 2. Governorate Filter
                if (govVal !== 'all') {
                    const cGov = (c.gov || '').toLowerCase();
                    const cGovEn = (c.govEn || '').toLowerCase();
                    if (!cGov.includes(govVal) && !cGovEn.includes(govVal) && !govVal.includes(cGov)) return false;
                }

                // 3. Type Filter
                if (typeVal !== 'all') {
                    if (typeVal === 'authorized_center' || typeVal === 'trusted_center') {
                        if (c.type !== 'authorized_center' && c.type !== 'trusted_center') return false;
                    } else if (c.type !== typeVal) {
                        return false;
                    }
                }

                // 4. Text Search
                if (searchVal) {
                    const haystack = [
                        c.name || '',
                        c.nameEn || '',
                        c.agency || '',
                        c.area || '',
                        c.address || '',
                        c.hotline || '',
                        c.phone || '',
                        c.typeLabel || '',
                        (c.brands || []).join(' ')
                    ].join(' ').toLowerCase();

                    if (!haystack.includes(searchVal)) return false;
                }

                return true;
            });

            // Smart Sort: Official Dealerships first, then Authorized/Trusted Centers, then Quick Service, then by Rating
            filtered.sort((a, b) => {
                const score = (t) => t === 'official_dealership' ? 1 : ((t === 'authorized_center' || t === 'trusted_center') ? 2 : 3);
                const diff = score(a.type) - score(b.type);
                if (diff !== 0) return diff;
                return (b.rating || 4.5) - (a.rating || 4.5);
            });

            // Update count summary
            if (countEl) {
                const brandLabel = brandVal !== 'all' 
                    ? (document.getElementById('scBrandFilter')?.options[document.getElementById('scBrandFilter').selectedIndex]?.text || brandVal)
                    : (isEn ? 'All Brands' : 'جميع الماركات');
                
                countEl.innerHTML = `
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>${isEn ? `Found ${filtered.length} authorized center(s)` : `متاح ${filtered.length} مركز خدمة وتوكيل معتمد`}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">${brandLabel}</span>
                `;
            }

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="py-10 px-4 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-map-location-dot"></i>
                        </div>
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                            ${isEn ? 'No service centers found matching your filters' : 'لم يتم العثور على مراكز خدمة مطابقة لمعايير البحث'}
                        </h4>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            ${isEn ? 'Try selecting another governorate or reset filters to see all authorized centers across Egypt.' : 'جرّب اختيار محافظة أخرى أو إعادة ضبط الفلتر لعرض شبكة التوكيلات على مستوى الجمهورية.'}
                        </p>
                        <button type="button" onclick="resetServiceCenterFilters()" class="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all">
                            <i class="fa-solid fa-rotate-left me-1"></i>
                            ${isEn ? 'Show All Centers' : 'عرض كافة المراكز'}
                        </button>
                    </div>
                `;
                return;
            }

            container.scrollTop = 0;
            const cardsHtml = filtered.map(c => {
                const isOfficial = c.type === 'official_dealership';
                const typeBadgeClass = isOfficial 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : (c.type === 'quick_service' 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800');

                const badgeText = isEn 
                    ? (isOfficial ? 'Certified Main Dealer' : (c.type === 'quick_service' ? 'Quick Service & Lube' : 'Authorized Service Center'))
                    : c.typeLabel;

                const cardName = getLocalizedCenterName(c.name, c.nameEn);
                const cardAgency = getLocalizedAgency(c.agency);
                const cardGov = getLocalizedGov(c.gov, c.govEn);
                const cardArea = getLocalizedArea(c.area);
                const cardAddress = getLocalizedAddress(c.address);
                const cardHours = getLocalizedHours(c.hours);

                const servicesHtml = (c.services || []).map(s => 
                    `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">${getLocalizedServiceTag(s)}</span>`
                ).join(' ');

                const phoneToCall = c.hotline || c.phone;
                const phoneDisplay = c.hotline ? (isEn ? `Hotline: ${c.hotline}` : `الخط الساخن: ${c.hotline}`) : (c.phone ? (isEn ? `Call: ${c.phone}` : `اتصال: ${c.phone}`) : '');

                // التحقق من وجود تصحيح محلي مسجل من قبل المستخدم لهذا المركز
                const userCorr = userCorrections[c.id];
                const isUserCorrected = !!userCorr;
                const activeLat = (userCorr && userCorr.newLat) ? userCorr.newLat : c.lat;
                const activeLng = (userCorr && userCorr.newLng) ? userCorr.newLng : c.lng;

                // شارة الفرع الموثق والرسمي (Verified Official Branch Badge)
                const isVerifiedBranch = c.type === 'official_dealership' || c.type === 'authorized_center' || c.isVerified !== false;

                // رابط الخريطة المعتمد: توليد الرابط القياسي المعياري لملف النشاط التجاري
                const verifiedMapsUrl = getServiceCenterMapsUrl(c, userCorr);

                return `
                    <div class="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border ${isUserCorrected ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/30' : 'border-slate-200 dark:border-slate-800'} hover:border-sky-300 dark:hover:border-sky-700 shadow-xs hover:shadow-md transition-all space-y-2.5">
                        <!-- الرأس واسم المركز والنوع والتقييم -->
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                                    <h4 class="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">${cardName}</h4>
                                </div>
                                <div class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span class="flex items-center gap-1 text-sky-600 dark:text-sky-400"><i class="fa-solid fa-certificate text-[10px]"></i> <span class="truncate">${cardAgency}</span></span>
                                    <span class="text-slate-300 dark:text-slate-600">•</span>
                                    <span class="text-amber-500 font-black flex items-center gap-1 text-[11px]"><i class="fa-solid fa-star text-[10px]"></i> <span>${c.rating || '4.8'}</span></span>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${typeBadgeClass} shrink-0">
                                ${badgeText}
                            </span>
                        </div>

                        <!-- الموقع والمحافظة والعنوان -->
                        <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <i class="fa-solid fa-location-dot text-rose-500 shrink-0 text-sm"></i>
                                <span>${cardGov} - ${cardArea}</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 ps-4 leading-relaxed">
                                ${cardAddress}
                            </div>
                            ${cardHours ? `
                            <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 ps-4 pt-0.5">
                                <i class="fa-regular fa-clock text-amber-500 shrink-0"></i>
                                <span>${cardHours}</span>
                            </div>` : ''}
                        </div>

                        <!-- شارة التصحيح المحلي للموقع (إذا تم تعديلها من قبل المستخدم) -->
                        ${isUserCorrected ? `
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                            <div class="flex items-center gap-1.5 truncate">
                                <i class="fa-solid fa-location-crosshairs text-amber-500 shrink-0"></i>
                                <span class="font-bold">${isEn ? 'Locally Corrected:' : 'تم تصحيح الموقع محلياً:'}</span>
                                <code class="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">${activeLat ? Number(activeLat).toFixed(5) : '-'}, ${activeLng ? Number(activeLng).toFixed(5) : '-'}</code>
                            </div>
                            <span class="px-1.5 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-[9px] font-black text-amber-900 dark:text-amber-100 shrink-0">Offline-First ⚡</span>
                        </div>` : ''}

                        <!-- شارات الخدمات -->
                        <div class="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            ${servicesHtml}
                        </div>

                        <!-- أزرار الإجراءات (الاتصال، GPS، ونظام التحقق والتصحيح المجتمعي) -->
                        <div class="flex items-center gap-1.5 pt-1 flex-wrap sm:flex-nowrap">
                            ${phoneToCall ? `
                            <a href="tel:${phoneToCall}" class="flex-1 min-w-[110px] py-2 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-all active:scale-95" title="${isEn ? 'Direct Call' : 'اتصال مباشر بالمركز'}">
                                <i class="fa-solid fa-phone text-xs"></i>
                                <span class="truncate">${phoneDisplay}</span>
                            </a>` : ''}

                            <a href="${verifiedMapsUrl}" onclick="event.preventDefault(); openServiceCenterMap('${c.id}');" target="_blank" rel="noopener noreferrer" class="flex-1 min-w-[130px] py-2 px-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer" title="${isEn ? 'Open in Google Maps GPS' : 'فتح ملف الفرع المعتمد في خرائط جوجل GPS'}">
                                <i class="fa-solid fa-diamond-turn-right text-xs"></i>
                                <span>${isEn ? 'Open in GPS Maps 📍' : 'فتح في الخرائط GPS 📍'}</span>
                            </a>

                            <button type="button" onclick="openBranchVerificationModal('${c.id}')" class="py-2 px-2.5 ${isUserCorrected ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700'} rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0" title="${isEn ? 'Report Error or Verify Branch Location' : '🚩 الإبلاغ عن خطأ / تحديث اللوكيشن أو تأكيد دقة الفرع'}">
                                <i class="fa-solid fa-flag ${isUserCorrected ? 'text-white' : 'text-amber-500'}"></i>
                                <span>${isUserCorrected ? (isEn ? 'Edit Correction' : 'تعديل التصحيح') : (isEn ? '🚩 Report / Verify' : '🚩 الإبلاغ عن خطأ / تحديث اللوكيشن')}</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            const noticeHtml = `
                <div class="p-2.5 sm:p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2 mt-2">
                    <i class="fa-solid fa-circle-info text-amber-600 dark:text-amber-400 text-xs shrink-0"></i>
                    <span>${isEn ? '*Note: Working hours may vary on holidays or by branch. Please call the numbers listed before visiting.' : '*تنبيه: يمكن للمواعيد أن تتغير أحياناً في العطلات أو حسب الفرع، وللتأكد يرجى الاتصال بالأرقام الموضحة قبل التوجه للفرع.'}</span>
                </div>
            `;

            container.innerHTML = cardsHtml + noticeHtml;
        }

        /* ==========================================================================
           [FEATURE] نظام التحقق وتصحيح الفروع والمراكز المعتمدة (Branch Verification & Feedback)
           Crowdsourced Community Verification, Official Google Business Places, and Firestore Sync
           ========================================================================== */
        function openBranchVerificationModal(centerId) {
            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) {
                console.warn('[Branch Verification] Center not found for id:', centerId);
                return;
            }

            // Read existing user corrections
            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }
            const existing = userCorrections[centerId] || null;

            // Fill Center Info
            const hiddenIdEl = document.getElementById('scCorrectionCenterId');
            const nameEl = document.getElementById('scCorrectionCenterName');
            const agencyEl = document.getElementById('scCorrectionAgencyBadge');
            const addrEl = document.getElementById('scCorrectionCurrentAddress');
            const coordsEl = document.getElementById('scCorrectionCurrentCoords');
            const previewLinkEl = document.getElementById('scCorrectionMapsPreviewLink');

            if (hiddenIdEl) hiddenIdEl.value = centerId;
            if (nameEl) nameEl.textContent = center.name || '-';
            if (agencyEl) agencyEl.textContent = center.agency || (center.brands ? center.brands.join(', ') : 'توكيل رسمي');
            if (addrEl) addrEl.textContent = `${center.gov || ''} - ${center.area || ''} (${center.address || 'بدون تفاصيل إضافية'})`;
            if (coordsEl) coordsEl.textContent = `${center.lat || 'غير محدد'}, ${center.lng || 'غير محدد'}`;
            if (previewLinkEl) {
                previewLinkEl.href = getServiceCenterMapsUrl(center, existing);
            }

            // Reset Quick Confirmation UI
            const quickBtn = document.getElementById('scQuickConfirmBtn');
            const quickBtnText = document.getElementById('scQuickConfirmBtnText');
            const quickFeedback = document.getElementById('scQuickConfirmFeedback');
            if (quickBtn) {
                quickBtn.disabled = false;
                quickBtn.classList.remove('opacity-75', 'pointer-events-none');
            }
            if (quickBtnText) quickBtnText.innerHTML = 'نعم، دقيق ومطابق ✓';
            if (quickFeedback) {
                quickFeedback.classList.add('hidden');
                quickFeedback.textContent = '';
            }

            // Fill inputs with existing correction or center defaults
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const notesInput = document.getElementById('scCorrectionNotesInput');
            const emailInput = document.getElementById('scCorrectionEmailInput');
            const accuracyBadge = document.getElementById('scGpsAccuracyBadge');
            const parseNotice = document.getElementById('scMapsUrlParseNotice');
            const statusBox = document.getElementById('scCorrectionStatus');
            const coordsPreviewBox = document.getElementById('scManualCoordsPreview');
            const coordsSummary = document.getElementById('scCorrectionCoordsSummary');
            const submitBtn = document.getElementById('scSubmitCorrectionBtn');
            const submitBtnText = document.getElementById('scSubmitCorrectionBtnText');

            if (accuracyBadge) accuracyBadge.classList.add('hidden');
            if (parseNotice) parseNotice.classList.add('hidden');
            if (coordsPreviewBox) coordsPreviewBox.classList.add('hidden');
            if (statusBox) {
                statusBox.classList.add('hidden');
                statusBox.innerHTML = '';
            }
            if (submitBtn) submitBtn.classList.remove('opacity-75', 'pointer-events-none');
            if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i> إرسال التصحيح للمراجعة';

            if (existing) {
                if (latInput) latInput.value = existing.newLat || '';
                if (lngInput) lngInput.value = existing.newLng || '';
                if (mapsUrlInput) mapsUrlInput.value = existing.newMapsUrl || '';
                if (notesInput) notesInput.value = existing.note || '';
                if (emailInput) emailInput.value = existing.userEmail || '';
                if (coordsSummary && existing.newLat && existing.newLng) {
                    coordsSummary.textContent = `${existing.newLat}, ${existing.newLng}`;
                    if (coordsPreviewBox) coordsPreviewBox.classList.remove('hidden');
                }
            } else {
                if (latInput) latInput.value = center.lat || '';
                if (lngInput) lngInput.value = center.lng || '';
                if (mapsUrlInput) mapsUrlInput.value = (center.mapsUrl && (center.mapsUrl.includes('maps.app.goo.gl') || center.mapsUrl.includes('/place/'))) ? center.mapsUrl : '';
                if (notesInput) notesInput.value = '';

                // Try pre-filling user email from profile or current app state
                if (emailInput) {
                    let userEmail = '';
                    try {
                        const profRaw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_UserProfile') : localStorage.getItem('motorCare_UserProfile')) ||
                                        (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_user_profile') : localStorage.getItem('motorCare_user_profile'));
                        if (profRaw) {
                            const p = JSON.parse(profRaw);
                            userEmail = p.email || '';
                        }
                        if (!userEmail && typeof appState !== 'undefined' && appState.user && appState.user.email) {
                            userEmail = appState.user.email;
                        }
                    } catch (_) {}
                    emailInput.value = userEmail;
                }
            }

            // Show modal
            document.getElementById('locationCorrectionModal')?.classList.remove('hidden');
        }

        function closeBranchVerificationModal() {
            document.getElementById('locationCorrectionModal')?.classList.add('hidden');
        }

        // Backward-compatible aliases
        function openLocationCorrectionModal(centerId) {
            return openBranchVerificationModal(centerId);
        }
        function closeLocationCorrectionModal() {
            return closeBranchVerificationModal();
        }

        /**
         * تأكيد سريع لدقة الفرع وإرسال تصويت مجتمعي (Community Upvote)
         * Sends upvote to Firestore collection: `dealership_reports` with voteType: 'confirm'
         */
        async function submitQuickBranchConfirmation() {
            const centerId = document.getElementById('scCorrectionCenterId')?.value;
            const centers = window.MOTORCARE_SERVICE_CENTERS || window.serviceCenters || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) {
                if (typeof showNotification === 'function') {
                    showNotification('لم يتم العثور على بيانات المركز المحدد.', 'warning');
                } else if (typeof alert !== 'undefined') {
                    alert('لم يتم العثور على بيانات المركز المحدد.');
                }
                return;
            }

            const btn = document.getElementById('scQuickConfirmBtn');
            const btnText = document.getElementById('scQuickConfirmBtnText');
            const feedback = document.getElementById('scQuickConfirmFeedback');

            if (btn) {
                btn.disabled = true;
                btn.classList.add('opacity-80', 'pointer-events-none');
            }
            if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i> جاري التأكيد...';

            const userIdentifier = (typeof getCurrentUserIdentifier === 'function') 
                ? getCurrentUserIdentifier() 
                : ((typeof window.getCurrentUserIdentifier === 'function') ? window.getCurrentUserIdentifier() : 'guest_user');
            const brandStr = (center.brands || []).join(', ') || center.brand || '';

            const payload = {
                branchId: center.id,
                brand: brandStr,
                agencyName: center.agency || '',
                branchName: center.name || '',
                reportedBy: userIdentifier,
                suggestedUrl: '',
                userLat: null,
                userLng: null,
                voteType: 'confirm'
            };

            // Save to Firestore collection dealership_reports
            try {
                if (typeof submitDealershipReport === 'function') {
                    await submitDealershipReport(payload);
                } else if (typeof window.submitDealershipReport === 'function') {
                    await window.submitDealershipReport(payload);
                }
            } catch(e) {
                console.warn('[Quick Confirmation] Error submitting vote:', e);
            }

            // Arabic Toast Notification
            if (typeof showNotification === 'function') {
                showNotification('شكراً لمساهمتك! سيتم مراجعة وتحديث اللوكيشن لدعم باقي المستخدمين.', 'success', 4500);
            }

            if (btnText) btnText.innerHTML = '<i class="fa-solid fa-circle-check"></i> تم تأكيد الدقة ✓';
            if (feedback) {
                feedback.classList.remove('hidden');
                feedback.textContent = 'تم تسجيل تأكيدك بنجاح لدعم وتوثيق المركز لباقي السائقين ✨';
            }

            setTimeout(() => {
                closeBranchVerificationModal();
                if (btn) {
                    btn.disabled = false;
                    btn.classList.remove('opacity-80', 'pointer-events-none');
                }
                if (btnText) btnText.innerHTML = 'نعم، دقيق ومطابق ✓';
                if (feedback) feedback.classList.add('hidden');
            }, 1200);
        }

        async function captureCurrentGpsForCorrection() {
            const btn = document.getElementById('scGpsCaptureBtn');
            const btnText = document.getElementById('scGpsCaptureBtnText');
            const badge = document.getElementById('scGpsAccuracyBadge');
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const coordsPreviewBox = document.getElementById('scManualCoordsPreview');
            const coordsSummary = document.getElementById('scCorrectionCoordsSummary');

            if (btnText) btnText.textContent = 'جاري تحديد موقعك الفعلي عبر الأقمار الصناعية 🛰️...';
            if (btn) btn.classList.add('opacity-75', 'pointer-events-none');

            const onLocationSuccess = (lat, lng, acc) => {
                if (latInput) latInput.value = lat;
                if (lngInput) lngInput.value = lng;
                const centerId = document.getElementById('scCorrectionCenterId')?.value;
                const curCenter = (window.MOTORCARE_SERVICE_CENTERS || []).find(c => String(c.id) === String(centerId));
                if (mapsUrlInput) {
                    mapsUrlInput.value = getServiceCenterMapsUrl({ ...(curCenter || {}), lat, lng });
                }
                if (coordsSummary) coordsSummary.textContent = `${lat}, ${lng}`;
                if (coordsPreviewBox) coordsPreviewBox.classList.remove('hidden');

                if (badge) {
                    badge.classList.remove('hidden');
                    badge.className = 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fade-in';
                    badge.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> تم التقاط إحداثياتك بنجاح: <code>${lat}, ${lng}</code> (دقة: ±${acc} متر)`;
                }

                if (btnText) btnText.textContent = 'استخدام موقعي الحالي إذا كنت تقف أمام الفرع الآن (GPS)';
                if (btn) btn.classList.remove('opacity-75', 'pointer-events-none');
            };

            const onLocationError = (errMsg) => {
                if (badge) {
                    badge.classList.remove('hidden');
                    badge.className = 'text-[11px] font-bold text-rose-500 text-center';
                    badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-1"></i> ${errMsg}`;
                }
                if (btnText) btnText.textContent = 'استخدام موقعي الحالي إذا كنت تقف أمام الفرع الآن (GPS)';
                if (btn) btn.classList.remove('opacity-75', 'pointer-events-none');
            };

            // 1. فحص دعم Capacitor Geolocation الأصلي للأندرويد
            const Geolocation = window.Capacitor?.Plugins?.Geolocation;
            if (Geolocation && typeof Geolocation.getCurrentPosition === 'function') {
                try {
                    const perm = await Geolocation.checkPermissions();
                    if (perm.location !== 'granted') {
                        const req = await Geolocation.requestPermissions();
                        if (req.location !== 'granted') {
                            onLocationError('تم رفض إذن تحديد الموقع من نظام أندرويد. يرجى تفعيله من إعدادات الهاتف.');
                            return;
                        }
                    }
                    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
                    const lat = parseFloat(pos.coords.latitude.toFixed(6));
                    const lng = parseFloat(pos.coords.longitude.toFixed(6));
                    const acc = Math.round(pos.coords.accuracy || 10);
                    onLocationSuccess(lat, lng, acc);
                    return;
                } catch(e) {
                    console.warn('[MotorCare GPS] Native Geolocation error, falling back:', e);
                }
            }

            // 2. بديل متصفح الويب القياسي (Web Fallback)
            if (!navigator.geolocation) {
                onLocationError('خاصية تحديد الموقع (GPS) غير مدعومة في جهازك.');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = parseFloat(pos.coords.latitude.toFixed(6));
                    const lng = parseFloat(pos.coords.longitude.toFixed(6));
                    const acc = Math.round(pos.coords.accuracy);
                    onLocationSuccess(lat, lng, acc);
                },
                (err) => {
                    console.warn('[Branch Verification] Geolocation error:', err);
                    let msg = 'تعذر الحصول على الموقع الجغرافي. يرجى التأكد من تفعيل خدمة الـ GPS وإعطاء الإذن.';
                    if (err.code === 1) msg = 'تم رفض إذن تحديد الموقع الجغرافي.';
                    if (err.code === 3) msg = 'انتهت مهلة البحث عن إشارة GPS. يرجى المحاولة في مكان مفتوح.';
                    onLocationError(msg);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }

        function handlePasteMapsUrl(inputEl) {
            if (!inputEl) return;
            const val = (inputEl.value || '').trim();
            const notice = document.getElementById('scMapsUrlParseNotice');
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const coordsPreviewBox = document.getElementById('scManualCoordsPreview');
            const coordsSummary = document.getElementById('scCorrectionCoordsSummary');

            if (!val) {
                if (notice) notice.classList.add('hidden');
                return;
            }

            let lat = null, lng = null;
            const mAt = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            const mQuery = val.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
            const mPlace = val.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
            const mCoords = val.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);

            if (mAt) {
                lat = parseFloat(mAt[1]);
                lng = parseFloat(mAt[2]);
            } else if (mQuery) {
                lat = parseFloat(mQuery[1]);
                lng = parseFloat(mQuery[2]);
            } else if (mPlace) {
                lat = parseFloat(mPlace[1]);
                lng = parseFloat(mPlace[2]);
            } else if (mCoords) {
                lat = parseFloat(mCoords[1]);
                lng = parseFloat(mCoords[2]);
            }

            if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
                if (latInput) latInput.value = lat.toFixed(6);
                if (lngInput) lngInput.value = lng.toFixed(6);
                if (coordsSummary) coordsSummary.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                if (coordsPreviewBox) coordsPreviewBox.classList.remove('hidden');

                if (notice) {
                    notice.classList.remove('hidden');
                    notice.className = 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5';
                    notice.innerHTML = `<i class="fa-solid fa-check me-1"></i> تم استخراج الإحداثيات تلقائياً: <code>${lat.toFixed(6)}, ${lng.toFixed(6)}</code>`;
                }
            } else {
                if (notice) {
                    notice.classList.remove('hidden');
                    notice.className = 'text-[10px] text-amber-600 dark:text-amber-400 pt-0.5';
                    notice.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> سيتم اعتماد واستخراج موقع الرابط المباشر أثناء المراجعة.`;
                }
            }
        }

        function testCorrectionOnMap() {
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');

            let lat = latInput ? parseFloat(latInput.value) : NaN;
            let lng = lngInput ? parseFloat(lngInput.value) : NaN;

            const pasted = (mapsUrlInput?.value || '').trim();
            if (pasted.startsWith('http')) {
                window.open(pasted, '_blank');
                return;
            }

            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                return;
            }

            alert('يرجى لصق رابط خرائط Google أو التقاط موقعك أولاً لاختبار الرابط على الخريطة.');
        }

        /**
         * إرسال التصحيح للمراجعة السحابية وتطبيقه محلياً (Offline-First)
         * Sends payload to Firestore collection: `dealership_reports` with voteType: 'correction'
         */
        async function submitBranchCorrectionReport() {
            const centerId = document.getElementById('scCorrectionCenterId')?.value;
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const notesInput = document.getElementById('scCorrectionNotesInput');
            const emailInput = document.getElementById('scCorrectionEmailInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const statusBox = document.getElementById('scCorrectionStatus');
            const submitBtn = document.getElementById('scSubmitCorrectionBtn');
            const submitBtnText = document.getElementById('scSubmitCorrectionBtnText');

            const centers = window.MOTORCARE_SERVICE_CENTERS || window.serviceCenters || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) {
                if (typeof showNotification === 'function') {
                    showNotification('لم يتم العثور على بيانات المركز المحدد.', 'warning');
                } else if (typeof alert !== 'undefined') {
                    alert('لم يتم العثور على بيانات المركز المحدد.');
                }
                return;
            }

            let lat = latInput ? parseFloat(latInput.value) : NaN;
            let lng = lngInput ? parseFloat(lngInput.value) : NaN;
            const note = (notesInput?.value || '').trim();
            const userEmail = (emailInput?.value || '').trim();
            const pastedMapsUrl = (mapsUrlInput?.value || '').trim();

            const hasValidCoords = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180);
            const hasValidUrl = (pastedMapsUrl.startsWith('http') && !pastedMapsUrl.includes('query=undefined'));

            if (!hasValidCoords && !hasValidUrl && !note) {
                if (statusBox) {
                    statusBox.classList.remove('hidden');
                    statusBox.className = 'p-2.5 rounded-xl text-[11px] font-bold text-center bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
                    statusBox.textContent = 'يرجى لصق رابط خرائط Google الصحيح أو استخدام موقعك الفعلي (GPS) أو كتابة ملاحظة توضيحية.';
                }
                return;
            }

            const nowIso = new Date().toISOString();
            const nowFormatted = new Date().toLocaleString('ar-EG');
            
            let finalMapsUrl = '';
            if (hasValidUrl) {
                finalMapsUrl = pastedMapsUrl;
            } else if (hasValidCoords) {
                finalMapsUrl = getServiceCenterMapsUrl({ ...center, lat, lng });
            } else {
                finalMapsUrl = getServiceCenterMapsUrl(center);
            }

            const activeLat = hasValidCoords ? lat : (center.lat || null);
            const activeLng = hasValidCoords ? lng : (center.lng || null);

            // 1. OFFLINE-FIRST: Save locally in SafeStorage / localStorage immediately
            const correctionData = {
                centerId: center.id,
                centerName: center.name,
                brand: (center.brands || []).join(', '),
                agency: center.agency || '',
                gov: center.gov || '',
                area: center.area || '',
                address: center.address || '',
                oldLat: center.lat || null,
                oldLng: center.lng || null,
                oldMapsUrl: center.mapsUrl || '',
                newLat: activeLat,
                newLng: activeLng,
                newMapsUrl: finalMapsUrl,
                note: note,
                userEmail: userEmail || ((typeof getCurrentUserIdentifier === 'function') ? getCurrentUserIdentifier() : 'guest_user'),
                timestamp: nowIso,
                updatedAtFormatted: nowFormatted,
                status: 'pending_review'
            };

            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }
            userCorrections[center.id] = correctionData;

            try {
                const serialized = JSON.stringify(userCorrections);
                if (typeof SafeStorage !== 'undefined') {
                    SafeStorage.setItem('motorCare_scUserCorrections', serialized);
                } else {
                    localStorage.setItem('motorCare_scUserCorrections', serialized);
                }
            } catch (e) {
                console.warn('[Branch Verification] Failed to save locally:', e);
            }

            // Immediately update in-memory center object
            if (activeLat !== null && activeLng !== null) {
                center.lat = activeLat;
                center.lng = activeLng;
            }
            center.mapsUrl = finalMapsUrl;
            center._userCorrected = true;

            // Re-render Service Centers UI immediately
            try {
                renderServiceCenters();
            } catch (e) {
                console.warn('[Branch Verification] renderServiceCenters update error:', e);
            }

            // 2. IMMEDIATE USER FEEDBACK
            if (submitBtn) submitBtn.classList.add('opacity-80', 'pointer-events-none');
            if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-circle-check text-xs"></i> تم الإرسال والحفظ بنجاح ✨';

            if (statusBox) {
                statusBox.classList.remove('hidden');
                statusBox.className = 'p-3 rounded-2xl text-xs font-bold text-center bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 space-y-1 animate-fade-in';
                statusBox.innerHTML = `
                    <div class="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-black">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>تم إرسال التصحيح وتحديث بيانات المركز محلياً!</span>
                    </div>
                    <p class="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                        تم تفعيل اللوكيشن الجديد على جهازك فوراً (Offline-First ⚡)، وجاري اعتماده سحابياً لدعم كافة السائقين.
                    </p>
                `;
            }

            // 3. SHOW ARABIC TOAST REQUIRED BY OBJECTIVE 3:
            if (typeof showNotification === 'function') {
                showNotification('شكراً لمساهمتك! سيتم مراجعة وتحديث اللوكيشن لدعم باقي المستخدمين.', 'success', 4500);
            }

            // Close modal after 1.5 seconds
            setTimeout(() => {
                closeBranchVerificationModal();
                if (submitBtn) submitBtn.classList.remove('opacity-80', 'pointer-events-none');
                if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i> إرسال التصحيح للمراجعة';
            }, 1500);

            // 4. SUBMIT TO FIRESTORE COLLECTION: dealership_reports
            const firestorePayload = {
                branchId: center.id,
                brand: (center.brands || []).join(', ') || center.brand || '',
                agencyName: center.agency || '',
                branchName: center.name || '',
                reportedBy: userEmail || ((typeof getCurrentUserIdentifier === 'function') ? getCurrentUserIdentifier() : 'guest_user'),
                suggestedUrl: finalMapsUrl,
                userLat: activeLat,
                userLng: activeLng,
                voteType: 'correction',
                note: note
            };

            setTimeout(async () => {
                try {
                    if (typeof submitDealershipReport === 'function') {
                        await submitDealershipReport(firestorePayload);
                    } else if (typeof window.submitDealershipReport === 'function') {
                        await window.submitDealershipReport(firestorePayload);
                    }
                } catch(err) {
                    console.warn('[Branch Verification] Firestore submission note:', err);
                }

                // Background notification pipeline
                sendCorrectionAdminNotification(center, activeLat, activeLng, finalMapsUrl, note, userEmail, nowIso, nowFormatted);
            }, 50);
        }

        // Backward-compatible alias
        function submitLocationCorrection() {
            return submitBranchCorrectionReport();
        }

        /**
         * خط إشعار المطورين عبر Webhook و EmailJS
         */
        function sendCorrectionAdminNotification(center, lat, lng, newMapsUrl, note, userEmail, nowIso, nowFormatted) {
            const webhookUrl = typeof getAppWebhookUrl === 'function' ? getAppWebhookUrl() : null;
            const adminEmail = 'motorcare.auto@gmail.com';
            const subject = `[MotorCare GPS Correction] تصحيح موقع: ${center.name} (${(center.brands || []).join(', ')})`;
            
            const jsonSnippet = JSON.stringify({
                id: center.id,
                name: center.name,
                gov: center.gov,
                area: center.area,
                lat: lat,
                lng: lng,
                mapsUrl: newMapsUrl
            }, null, 2);

            const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #38bdf8;">
                    <h2 style="color: #0284c7; margin: 0;">🛰️ طلب تصحيح إحداثيات مركز خدمة في تطبيق MotorCare</h2>
                    <p style="color: #64748b; font-size: 13px; margin: 5px 0 0;">مساهمة جديدة من نظام التحقق المجتمعي (Dealership Verification)</p>
                </div>
                <div style="margin: 20px 0;">
                    <h3 style="color: #0f172a; margin-bottom: 8px;">🏢 بيانات المركز:</h3>
                    <ul style="line-height: 1.8; font-size: 14px;">
                        <li><strong>الاسم:</strong> ${center.name}</li>
                        <li><strong>الماركة / الوكالة:</strong> ${(center.brands || []).join(', ')} - ${center.agency || ''}</li>
                        <li><strong>المحافظة والمنطقة:</strong> ${center.gov} - ${center.area}</li>
                        <li><strong>العنوان الحالي:</strong> ${center.address || 'غير محدد'}</li>
                    </ul>

                    <h3 style="color: #0f172a; margin-top: 20px; margin-bottom: 8px;">📍 الإحداثيات المقترحة:</h3>
                    <p style="font-size: 13px;">Lat: ${lat || '-'} | Lng: ${lng || '-'}</p>
                    <p style="font-size: 13px;"><strong>الرابط:</strong> <a href="${newMapsUrl}" target="_blank">${newMapsUrl}</a></p>

                    ${note ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 15px 0;">
                        <strong>📝 ملاحظة وتوضيح المستخدم:</strong>
                        <p style="margin: 5px 0 0; font-size: 13px; color: #334155;">${note}</p>
                    </div>` : ''}

                    <p style="font-size: 13px;"><strong>👤 بيانات المستخدم:</strong> ${userEmail}</p>
                    <p style="font-size: 12px; color: #64748b;"><strong>⏰ التاريخ والوقت:</strong> ${nowFormatted} (${nowIso})</p>
                </div>
            </div>`;

            const notificationPayload = {
                action: 'LOCATION_CORRECTION',
                centerId: center.id,
                centerName: center.name,
                brand: (center.brands || []).join(', '),
                agency: center.agency || '',
                oldCoords: { lat: center.lat, lng: center.lng, mapsUrl: center.mapsUrl },
                newCoords: { lat: lat, lng: lng, mapsUrl: newMapsUrl },
                googleMapsLink: newMapsUrl,
                note: note,
                userEmail: userEmail,
                timestamp: nowIso,
                adminEmail: adminEmail,
                adminSubject: subject,
                adminHtmlBody: emailHtml,
                suggestedJsonSnippet: jsonSnippet
            };

            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000));
                    const fetchPromise = fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify(notificationPayload)
                    });
                    Promise.race([fetchPromise, timeoutPromise]).catch(() => {});
                } catch (err) {}
            }

            if (typeof emailjs !== 'undefined' && emailjs) {
                try {
                    const emailjsConfig = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_emailjs_config') : localStorage.getItem('motorCare_emailjs_config'));
                    if (emailjsConfig) {
                        const conf = JSON.parse(emailjsConfig);
                        if (conf.serviceId && conf.templateId) {
                            emailjs.send(conf.serviceId, conf.templateId, {
                                to_email: adminEmail,
                                user_name: userEmail,
                                subject: subject,
                                message: `تم اقتراح تعديل موقع لمركز: ${center.name} (${lat}, ${lng}). ملاحظات: ${note}`,
                                ticket_id: `GPS_${center.id}`,
                                category: 'Location Correction',
                                car_details: `${center.name} - ${center.gov}`
                            }).catch(() => {});
                        }
                    }
                } catch (e) {}
            }
        }

        /* ==========================================================================
           [FEATURE] سجل تعديلاتي على مواقع التوكيلات (Corrections History & Export)
           ========================================================================== */
        function viewUserCorrectionsModal() {
            const container = document.getElementById('userCorrectionsListContainer');
            if (!container) return;

            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }

            const keys = Object.keys(userCorrections);
            if (keys.length === 0) {
                container.innerHTML = `
                    <div class="py-12 px-4 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center text-xl">
                            <i class="fa-solid fa-location-crosshairs"></i>
                        </div>
                        <h4 class="text-sm font-black text-slate-800 dark:text-slate-200">لا توجد تعديلات محفوظة حتى الآن</h4>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            يمكنك في أي وقت الضغط على زر "اقتراح تعديل اللوكيشن" بجوار أي مركز خدمة لتصحيح إحداثياته وحفظها على هاتفك.
                        </p>
                    </div>
                `;
            } else {
                container.innerHTML = keys.map(k => {
                    const item = userCorrections[k];
                    return `
                        <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                            <div class="flex items-start justify-between gap-2">
                                <div class="min-w-0 flex-1">
                                    <h5 class="font-black text-slate-900 dark:text-white text-xs truncate">${item.centerName || item.centerId}</h5>
                                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        <span>${item.brand || ''}</span>
                                        <span>•</span>
                                        <span>${item.gov || ''} - ${item.area || ''}</span>
                                    </div>
                                </div>
                                <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 shrink-0">
                                    مفعل محلياً ✓
                                </span>
                            </div>

                            <div class="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                                <div>
                                    <span class="text-slate-400 block">الإحداثيات المصححة:</span>
                                    <code class="font-bold text-sky-600 dark:text-sky-400 font-mono">${item.newLat}, ${item.newLng}</code>
                                </div>
                                <div>
                                    <span class="text-slate-400 block">تاريخ التعديل:</span>
                                    <span class="text-slate-600 dark:text-slate-300 font-semibold">${item.updatedAtFormatted || (item.timestamp ? item.timestamp.substring(0,10) : '-')}</span>
                                </div>
                            </div>

                            ${item.note ? `
                            <div class="text-[10px] text-slate-600 dark:text-slate-300 bg-amber-50/70 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                                <span class="font-bold text-amber-700 dark:text-amber-300">ملاحظتك:</span> ${item.note}
                            </div>` : ''}

                            <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <a href="https://www.google.com/maps/search/?api=1&query=${item.newLat},${item.newLng}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                                    <i class="fa-solid fa-diamond-turn-right text-[9px]"></i>
                                    <span>فتح في الخرائط</span>
                                </a>
                                <div class="flex items-center gap-1.5">
                                    <button type="button" onclick="openLocationCorrectionModal('${item.centerId}')" class="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors">
                                        تعديل
                                    </button>
                                    <button type="button" onclick="deleteUserCorrection('${item.centerId}')" class="px-2 py-1 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors" title="إلغاء التعديل واسترجاع الإحداثيات الأصلية">
                                        حذف
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            document.getElementById('userCorrectionsHistoryModal')?.classList.remove('hidden');
        }

        function closeUserCorrectionsHistoryModal() {
            document.getElementById('userCorrectionsHistoryModal')?.classList.add('hidden');
        }

        function exportUserCorrectionsJSON() {
            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }

            const keys = Object.keys(userCorrections);
            if (keys.length === 0) {
                alert('لا توجد تعديلات محفوظة لتصديرها.');
                return;
            }

            const exportData = {
                app: 'MotorCare',
                version: '2.0.13',
                exportDate: new Date().toISOString(),
                totalCorrections: keys.length,
                corrections: Object.values(userCorrections)
            };

            const jsonStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `motorcare_service_centers_corrections_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (typeof showNotification === 'function') {
                showNotification('تم تنزيل ملف تصدير التعديلات (JSON) بنجاح ✨', 'success');
            } else {
                alert('تم تنزيل ملف تصدير التعديلات (JSON) بنجاح.');
            }
        }

        function deleteUserCorrection(centerId) {
            if (!confirm('هل أنت متأكد من رغبتك في حذف هذا التعديل واسترجاع الإحداثيات الافتراضية للمركز؟')) return;

            let userCorrections = {};
            try {
                const raw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_scUserCorrections') : localStorage.getItem('motorCare_scUserCorrections'));
                if (raw) userCorrections = JSON.parse(raw);
            } catch (e) {
                userCorrections = {};
            }

            delete userCorrections[centerId];

            try {
                const serialized = JSON.stringify(userCorrections);
                if (typeof SafeStorage !== 'undefined') {
                    SafeStorage.setItem('motorCare_scUserCorrections', serialized);
                } else {
                    localStorage.setItem('motorCare_scUserCorrections', serialized);
                }
            } catch (e) {
                console.warn(e);
            }

            renderServiceCenters();
            viewUserCorrectionsModal();

            if (typeof showNotification === 'function') {
                showNotification('تم استرجاع الإحداثيات الأصلية بنجاح.', 'info');
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof openServiceCentersModal !== 'undefined') window.openServiceCentersModal = openServiceCentersModal; } catch (e) {}
try { if (typeof closeServiceCentersModal !== 'undefined') window.closeServiceCentersModal = closeServiceCentersModal; } catch (e) {}
try { if (typeof populateServiceCenterBrands !== 'undefined') window.populateServiceCenterBrands = populateServiceCenterBrands; } catch (e) {}
try { if (typeof resetServiceCenterFilters !== 'undefined') window.resetServiceCenterFilters = resetServiceCenterFilters; } catch (e) {}
try { if (typeof applyServiceCenterFilters !== 'undefined') window.applyServiceCenterFilters = applyServiceCenterFilters; } catch (e) {}
try { if (typeof renderServiceCenters !== 'undefined') window.renderServiceCenters = renderServiceCenters; } catch (e) {}
try { if (typeof openLocationCorrectionModal !== 'undefined') window.openLocationCorrectionModal = openLocationCorrectionModal; } catch (e) {}
try { if (typeof closeLocationCorrectionModal !== 'undefined') window.closeLocationCorrectionModal = closeLocationCorrectionModal; } catch (e) {}
try { if (typeof captureCurrentGpsForCorrection !== 'undefined') window.captureCurrentGpsForCorrection = captureCurrentGpsForCorrection; } catch (e) {}
try { if (typeof handlePasteMapsUrl !== 'undefined') window.handlePasteMapsUrl = handlePasteMapsUrl; } catch (e) {}
try { if (typeof testCorrectionOnMap !== 'undefined') window.testCorrectionOnMap = testCorrectionOnMap; } catch (e) {}
try { if (typeof submitLocationCorrection !== 'undefined') window.submitLocationCorrection = submitLocationCorrection; } catch (e) {}
try { if (typeof viewUserCorrectionsModal !== 'undefined') window.viewUserCorrectionsModal = viewUserCorrectionsModal; } catch (e) {}
try { if (typeof closeUserCorrectionsHistoryModal !== 'undefined') window.closeUserCorrectionsHistoryModal = closeUserCorrectionsHistoryModal; } catch (e) {}
try { if (typeof exportUserCorrectionsJSON !== 'undefined') window.exportUserCorrectionsJSON = exportUserCorrectionsJSON; } catch (e) {}
try { if (typeof deleteUserCorrection !== 'undefined') window.deleteUserCorrection = deleteUserCorrection; } catch (e) {}
try { if (typeof getServiceCenterMapsUrl !== 'undefined') window.getServiceCenterMapsUrl = getServiceCenterMapsUrl; } catch (e) {}
try { if (typeof openServiceCenterMap !== 'undefined') window.openServiceCenterMap = openServiceCenterMap; } catch (e) {}
try { if (typeof openBranchVerificationModal !== 'undefined') window.openBranchVerificationModal = openBranchVerificationModal; } catch (e) {}
try { if (typeof closeBranchVerificationModal !== 'undefined') window.closeBranchVerificationModal = closeBranchVerificationModal; } catch (e) {}
try { if (typeof submitQuickBranchConfirmation !== 'undefined') window.submitQuickBranchConfirmation = submitQuickBranchConfirmation; } catch (e) {}
try { if (typeof submitBranchCorrectionReport !== 'undefined') window.submitBranchCorrectionReport = submitBranchCorrectionReport; } catch (e) {}
