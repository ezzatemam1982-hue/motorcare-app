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

            // 1. Populate brands options dynamically
            populateServiceCenterBrands();

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

            // 4. Render matching cards
            renderServiceCenters();

            // 5. Display modal
            document.getElementById('serviceCentersModal')?.classList.remove('hidden');
        }

        function closeServiceCentersModal() {
            document.getElementById('serviceCentersModal')?.classList.add('hidden');
        }

        function populateServiceCenterBrands() {
            const brandSelect = document.getElementById('scBrandFilter');
            if (!brandSelect || brandSelect.options.length > 5) return;

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
            
            brandSelect.innerHTML = `<option value="all">${appState.lang === 'en' ? 'All Brands' : 'جميع الماركات (All Brands)'}</option>`;
            sortedBrands.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.innerText = b;
                brandSelect.appendChild(opt);
            });
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

        function renderServiceCenters() {
            const container = document.getElementById('scCardsContainer');
            const countEl = document.getElementById('scResultsSummary');
            if (!container) return;

            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const brandVal = (document.getElementById('scBrandFilter')?.value || 'all').toLowerCase();
            const govVal = (document.getElementById('scGovFilter')?.value || 'all').toLowerCase();
            const typeVal = (document.getElementById('scTypeFilter')?.value || 'all');
            const searchVal = (document.getElementById('scSearchInput')?.value || '').trim().toLowerCase();
            const isEn = appState.lang === 'en';

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

                const servicesHtml = (c.services || []).map(s => 
                    `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-md">${s}</span>`
                ).join(' ');

                const phoneToCall = c.hotline || c.phone;
                const phoneDisplay = c.hotline ? `الخط الساخن: ${c.hotline}` : (c.phone || '');

                // التحقق من وجود تصحيح محلي مسجل من قبل المستخدم لهذا المركز
                const userCorr = userCorrections[c.id];
                const isUserCorrected = !!userCorr;
                const activeLat = (userCorr && userCorr.newLat) ? userCorr.newLat : c.lat;
                const activeLng = (userCorr && userCorr.newLng) ? userCorr.newLng : c.lng;

                // رابط الخريطة المعتمد: الأولوية لتصحيح المستخدم، ثم الرابط المباشر للمركز
                let verifiedMapsUrl = '';
                if (userCorr && userCorr.newMapsUrl) {
                    verifiedMapsUrl = userCorr.newMapsUrl;
                } else if (c.mapsUrl && !/query=-?\d+\.\d+,-?\d+\.\d+$/.test(c.mapsUrl)) {
                    verifiedMapsUrl = c.mapsUrl;
                } else if (activeLat && activeLng) {
                    verifiedMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`;
                } else {
                    const cleanQuery = c.mapsQuery || `${c.name || ''} ${c.agency || ''} ${c.area || ''}`.trim();
                    verifiedMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;
                }

                return `
                    <div class="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border ${isUserCorrected ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/30' : 'border-slate-200 dark:border-slate-800'} hover:border-sky-300 dark:hover:border-sky-700 shadow-xs hover:shadow-md transition-all space-y-2.5">
                        <!-- الرأس واسم المركز والنوع والتقييم -->
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <h4 class="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">${c.name}</h4>
                                <div class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span class="flex items-center gap-1 text-sky-600 dark:text-sky-400"><i class="fa-solid fa-certificate text-[10px]"></i> <span class="truncate">${c.agency}</span></span>
                                    <span class="text-slate-300 dark:text-slate-600">•</span>
                                    <span class="text-amber-500 font-black flex items-center gap-1 text-[11px]"><i class="fa-solid fa-star text-[10px]"></i> <span>${c.rating || '4.8'}</span></span>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${typeBadgeClass} shrink-0">
                                ${c.typeLabel}
                            </span>
                        </div>

                        <!-- الموقع والمحافظة والعنوان -->
                        <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <i class="fa-solid fa-location-dot text-rose-500 shrink-0 text-sm"></i>
                                <span>${c.gov} - ${c.area}</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 ps-4 leading-relaxed">
                                ${c.address}
                            </div>
                            ${c.hours ? `
                            <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 ps-4 pt-0.5">
                                <i class="fa-regular fa-clock text-amber-500 shrink-0"></i>
                                <span>${c.hours}</span>
                            </div>` : ''}
                        </div>

                        <!-- شارة التصحيح المحلي للموقع (إذا تم تعديلها من قبل المستخدم) -->
                        ${isUserCorrected ? `
                        <div class="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                            <div class="flex items-center gap-1.5 truncate">
                                <i class="fa-solid fa-location-crosshairs text-amber-500 shrink-0"></i>
                                <span class="font-bold">تم تصحيح الموقع محلياً:</span>
                                <code class="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">${Number(activeLat).toFixed(5)}, ${Number(activeLng).toFixed(5)}</code>
                            </div>
                            <span class="px-1.5 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-[9px] font-black text-amber-900 dark:text-amber-100 shrink-0">Offline-First ⚡</span>
                        </div>` : ''}

                        <!-- شارات الخدمات -->
                        <div class="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            ${servicesHtml}
                        </div>

                        <!-- أزرار الإجراءات (الاتصال، GPS، واقتراح تصحيح الإحداثيات) -->
                        <div class="flex items-center gap-1.5 pt-1 flex-wrap sm:flex-nowrap">
                            ${phoneToCall ? `
                            <a href="tel:${phoneToCall}" class="flex-1 min-w-[110px] py-2 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-all active:scale-95" title="اتصال مباشر بالمركز">
                                <i class="fa-solid fa-phone text-xs"></i>
                                <span class="truncate">${phoneDisplay}</span>
                            </a>` : ''}

                            <a href="${verifiedMapsUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 min-w-[130px] py-2 px-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all" title="فتح الموقع المعتمد في خرائط جوجل GPS">
                                <i class="fa-solid fa-diamond-turn-right text-xs"></i>
                                <span>فتح في الخرائط GPS 📍</span>
                            </a>

                            <button type="button" onclick="openLocationCorrectionModal('${c.id}')" class="py-2 px-2.5 ${isUserCorrected ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700'} rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0" title="اقتراح تعديل اللوكيشن / تصحيح الإحداثيات">
                                <i class="fa-solid fa-location-crosshairs ${isUserCorrected ? 'text-white' : 'text-amber-500'}"></i>
                                <span>${isUserCorrected ? 'تعديل التصحيح' : 'تصحيح اللوكيشن'}</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            const noticeHtml = `
                <div class="p-2.5 sm:p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2 mt-2">
                    <i class="fa-solid fa-circle-info text-amber-600 dark:text-amber-400 text-xs shrink-0"></i>
                    <span>*تنبيه: يمكن للمواعيد أن تتغير أحياناً في العطلات أو حسب الفرع، وللتأكد يرجى الاتصال بالأرقام الموضحة قبل التوجه للفرع.</span>
                </div>
            `;

            container.innerHTML = cardsHtml + noticeHtml;
        }

        /* ==========================================================================
           [FEATURE] التصحيح الجماعي لمواقع التوكيلات ومراكز الخدمة (Crowdsourced Location Correction)
           Offline-First Storage, Cloud Firestore Sync, Webhook & EmailJS Alert Pipeline
           ========================================================================== */
        function openLocationCorrectionModal(centerId) {
            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) {
                console.warn('[Location Correction] Center not found for id:', centerId);
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

            if (hiddenIdEl) hiddenIdEl.value = centerId;
            if (nameEl) nameEl.textContent = center.name || '-';
            if (agencyEl) agencyEl.textContent = center.agency || (center.brands ? center.brands.join(', ') : 'توكيل رسمي');
            if (addrEl) addrEl.textContent = `${center.gov || ''} - ${center.area || ''} (${center.address || 'بدون تفاصيل إضافية'})`;
            if (coordsEl) coordsEl.textContent = `${center.lat || 'غير محدد'}, ${center.lng || 'غير محدد'}`;

            // Fill inputs with existing correction or center defaults
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const notesInput = document.getElementById('scCorrectionNotesInput');
            const emailInput = document.getElementById('scCorrectionEmailInput');
            const accuracyBadge = document.getElementById('scGpsAccuracyBadge');
            const parseNotice = document.getElementById('scMapsUrlParseNotice');
            const statusBox = document.getElementById('scCorrectionStatus');

            if (accuracyBadge) accuracyBadge.classList.add('hidden');
            if (parseNotice) parseNotice.classList.add('hidden');
            if (statusBox) {
                statusBox.classList.add('hidden');
                statusBox.innerHTML = '';
            }

            if (existing) {
                if (latInput) latInput.value = existing.newLat || '';
                if (lngInput) lngInput.value = existing.newLng || '';
                if (mapsUrlInput) mapsUrlInput.value = existing.newMapsUrl || '';
                if (notesInput) notesInput.value = existing.note || '';
                if (emailInput) emailInput.value = existing.userEmail || '';
            } else {
                if (latInput) latInput.value = center.lat || '';
                if (lngInput) lngInput.value = center.lng || '';
                if (mapsUrlInput) mapsUrlInput.value = center.mapsUrl || '';
                if (notesInput) notesInput.value = '';

                // Try pre-filling user email from profile or current app state
                if (emailInput) {
                    let userEmail = '';
                    try {
                        const profRaw = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_user_profile') : localStorage.getItem('motorCare_user_profile'));
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

        function closeLocationCorrectionModal() {
            document.getElementById('locationCorrectionModal')?.classList.add('hidden');
        }

        function captureCurrentGpsForCorrection() {
            const btn = document.getElementById('scGpsCaptureBtn');
            const btnText = document.getElementById('scGpsCaptureBtnText');
            const badge = document.getElementById('scGpsAccuracyBadge');
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');

            if (!navigator.geolocation) {
                if (badge) {
                    badge.classList.remove('hidden');
                    badge.className = 'text-[11px] font-bold text-rose-500 text-center';
                    badge.textContent = 'خاصية تحديد الموقع (GPS) غير مدعومة في جهازك أو متصفحك.';
                }
                return;
            }

            if (btnText) btnText.textContent = 'جاري تحديد موقعك الفعلي عبر الأقمار الصناعية 🛰️...';
            if (btn) btn.classList.add('opacity-75', 'pointer-events-none');

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = parseFloat(pos.coords.latitude.toFixed(6));
                    const lng = parseFloat(pos.coords.longitude.toFixed(6));
                    const acc = Math.round(pos.coords.accuracy);

                    if (latInput) latInput.value = lat;
                    if (lngInput) lngInput.value = lng;
                    if (mapsUrlInput) mapsUrlInput.value = `https://www.google.com/maps?q=${lat},${lng}`;

                    if (badge) {
                        badge.classList.remove('hidden');
                        badge.className = 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fade-in';
                        badge.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> تم التقاط إحداثياتك بنجاح: <code>${lat}, ${lng}</code> (دقة: ±${acc} متر)`;
                    }

                    if (btnText) btnText.textContent = 'التقاط موقعي الحالي بالـ GPS بدقة عالية 📍';
                    if (btn) btn.classList.remove('opacity-75', 'pointer-events-none');
                },
                (err) => {
                    console.warn('[Location Correction] Geolocation error:', err);
                    let msg = 'تعذر الحصول على الموقع الجغرافي. يرجى التأكد من تفعيل خدمة الـ GPS وإعطاء الإذن للمتصفح.';
                    if (err.code === 1) msg = 'تم رفض إذن تحديد الموقع الجغرافي. يرجى تفعيله من إعدادات المتصفح.';
                    if (err.code === 3) msg = 'انتهت مهلة البحث عن إشارة GPS. يرجى المحاولة في مكان مفتوح أو إدخال الإحداثيات يدوياً.';

                    if (badge) {
                        badge.classList.remove('hidden');
                        badge.className = 'text-[11px] font-bold text-rose-500 text-center';
                        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-1"></i> ${msg}`;
                    }

                    if (btnText) btnText.textContent = 'التقاط موقعي الحالي بالـ GPS بدقة عالية 📍';
                    if (btn) btn.classList.remove('opacity-75', 'pointer-events-none');
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
                if (notice) {
                    notice.classList.remove('hidden');
                    notice.className = 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5';
                    notice.innerHTML = `<i class="fa-solid fa-check me-1"></i> تم استخراج الإحداثيات تلقائياً: <code>${lat.toFixed(6)}, ${lng.toFixed(6)}</code>`;
                }
            } else {
                if (notice) {
                    notice.classList.remove('hidden');
                    notice.className = 'text-[10px] text-amber-600 dark:text-amber-400 pt-0.5';
                    notice.innerHTML = `<i class="fa-solid fa-info-circle me-1"></i> إذا كان الرابط مختصراً (maps.app.goo.gl)، يرجى نسخه بعد فتحه في المتصفح أو كتابة الإحداثيات في الحقول أعلاه.`;
                }
            }
        }

        function testCorrectionOnMap() {
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');

            let lat = latInput ? parseFloat(latInput.value) : NaN;
            let lng = lngInput ? parseFloat(lngInput.value) : NaN;

            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                return;
            }

            const pasted = (mapsUrlInput?.value || '').trim();
            if (pasted.startsWith('http')) {
                window.open(pasted, '_blank');
                return;
            }

            alert('يرجى التقاط موقعك أولاً أو إدخال خط العرض وخط الطول لاختبار الموقع على الخريطة.');
        }

        async function submitLocationCorrection() {
            const centerId = document.getElementById('scCorrectionCenterId')?.value;
            const latInput = document.getElementById('scCorrectionLatInput');
            const lngInput = document.getElementById('scCorrectionLngInput');
            const notesInput = document.getElementById('scCorrectionNotesInput');
            const emailInput = document.getElementById('scCorrectionEmailInput');
            const mapsUrlInput = document.getElementById('scCorrectionMapsUrlInput');
            const statusBox = document.getElementById('scCorrectionStatus');
            const submitBtn = document.getElementById('scSubmitCorrectionBtn');
            const submitBtnText = document.getElementById('scSubmitCorrectionBtnText');

            const lat = parseFloat(latInput?.value);
            const lng = parseFloat(lngInput?.value);
            const note = (notesInput?.value || '').trim();
            const userEmail = (emailInput?.value || '').trim();
            const pastedMapsUrl = (mapsUrlInput?.value || '').trim();

            // Validate Coordinates
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                if (statusBox) {
                    statusBox.classList.remove('hidden');
                    statusBox.className = 'p-2.5 rounded-xl text-[11px] font-bold text-center bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
                    statusBox.textContent = 'يرجى إدخال إحداثيات صحيحة (خط عرض بين -90 و 90، وخط طول بين -180 و 180) أو استخدام زر التقاط GPS.';
                }
                return;
            }

            const centers = window.MOTORCARE_SERVICE_CENTERS || [];
            const center = centers.find(c => String(c.id) === String(centerId));
            if (!center) {
                alert('لم يتم العثور على بيانات المركز المحدد.');
                return;
            }

            const nowIso = new Date().toISOString();
            const nowFormatted = new Date().toLocaleString('ar-EG');
            const newMapsUrl = pastedMapsUrl.startsWith('http') && !pastedMapsUrl.includes('?') 
                ? pastedMapsUrl 
                : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

            // Build Correction Object
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
                newLat: lat,
                newLng: lng,
                newMapsUrl: newMapsUrl,
                note: note,
                userEmail: userEmail || 'مستخدم تطبيق موتور كير',
                timestamp: nowIso,
                updatedAtFormatted: nowFormatted,
                status: 'pending_review'
            };

            // 1. OFFLINE-FIRST: Save locally in SafeStorage / localStorage immediately
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
                console.warn('[Location Correction] Failed to save locally:', e);
            }

            // Immediately update in-memory center object
            center.lat = lat;
            center.lng = lng;
            center.mapsUrl = newMapsUrl;
            center._userCorrected = true;

            // Re-render Service Centers UI immediately
            try {
                renderServiceCenters();
            } catch (e) {
                console.warn('[Location Correction] renderServiceCenters update error:', e);
            }

            // 2. IMMEDIATE USER FEEDBACK (Super Fast UI Response)
            if (submitBtn) submitBtn.classList.remove('opacity-75', 'pointer-events-none');
            if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-circle-check text-xs"></i> تم الحفظ بنجاح ✨';

            if (statusBox) {
                statusBox.classList.remove('hidden');
                statusBox.className = 'p-3 rounded-2xl text-xs font-bold text-center bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800 space-y-1 animate-fade-in';
                statusBox.innerHTML = `
                    <div class="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-black">
                        <i class="fa-solid fa-circle-check"></i>
                        <span>تم حفظ التعديل وتحديث بطاقة المركز فوراً!</span>
                    </div>
                    <p class="text-[11px] font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                        تم تفعيل الإحداثيات الجديدة على هاتفك بنجاح (Offline-First ⚡)، وجاري المزامنة مع خادم المطور في الخلفية. شكراً لمساهمتك! 🌟
                    </p>
                `;
            }

            if (typeof showNotification === 'function') {
                showNotification(`تم حفظ إحداثيات "${center.name}" وتحديث مسار GPS بنجاح ✨`, 'success');
            }

            // Close modal after 1.5 seconds
            setTimeout(() => {
                closeLocationCorrectionModal();
                if (submitBtnText) submitBtnText.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i> حفظ واعتماد التعديل سحابياً ومحلياً 🚀';
            }, 1500);

            // 3. BACKGROUND CLOUD SYNC & DEVELOPER NOTIFICATIONS (Non-blocking)
            setTimeout(async () => {
                // Channel A: Firestore Persistence
                if (typeof firestoreDb !== 'undefined' && firestoreDb) {
                    try {
                        const docId = `${center.id}_${Date.now()}`;
                        const firestorePayload = {
                            ...correctionData,
                            adminEmail: 'motorcare.auto@gmail.com',
                            userAgent: navigator.userAgent || '',
                            platform: 'MotorCare Web/PWA',
                        };
                        if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
                            firestorePayload.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
                        }
                        const firestorePromise = firestoreDb.collection('service_center_corrections').doc(docId).set(firestorePayload);
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('firestore timeout')), 4000));
                        await Promise.race([firestorePromise, timeoutPromise]).catch(e => console.warn('[Location Correction] Firestore note:', e));
                        console.log('[Location Correction] Background Firestore sync complete:', docId);
                    } catch (err) {
                        console.warn('[Location Correction] Firestore sync note:', err);
                    }
                }

                // Channel B: Webhook & Email Notification
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
                        <p style="color: #64748b; font-size: 13px; margin: 5px 0 0;">مساهمة جديدة من التصحيح الجماعي (Crowdsourced Location)</p>
                    </div>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #0f172a; margin-bottom: 8px;">🏢 بيانات المركز:</h3>
                        <ul style="line-height: 1.8; font-size: 14px;">
                            <li><strong>الاسم:</strong> ${center.name}</li>
                            <li><strong>الماركة / الوكالة:</strong> ${(center.brands || []).join(', ')} - ${center.agency || ''}</li>
                            <li><strong>المحافظة والمنطقة:</strong> ${center.gov} - ${center.area}</li>
                            <li><strong>العنوان الحالي:</strong> ${center.address || 'غير محدد'}</li>
                        </ul>

                        <h3 style="color: #0f172a; margin-top: 20px; margin-bottom: 8px;">📍 مقارنة الإحداثيات:</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">
                            <thead>
                                <tr style="background-color: #f1f5f9; text-align: right;">
                                    <th style="padding: 8px; border: 1px solid #cbd5e1;">البيان</th>
                                    <th style="padding: 8px; border: 1px solid #cbd5e1;">القديم</th>
                                    <th style="padding: 8px; border: 1px solid #cbd5e1; background-color: #fef08a;">الجديد المقترح ✨</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">خط العرض (Lat)</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${center.lat || '-'}</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1;">${lat}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">خط الطول (Lng)</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${center.lng || '-'}</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0369a1;">${lng}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p style="font-size: 13px;"><strong>🗺️ رابط مقارنة الموقعين على خرائط جوجل:</strong><br>
                        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="color: #0284c7; word-break: break-all;">فتح الإحداثيات المقترحة في خرائط جوجل</a></p>

                        ${note ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-right: 4px solid #f59e0b; margin: 15px 0;">
                            <strong>📝 ملاحظة وتوضيح المستخدم:</strong>
                            <p style="margin: 5px 0 0; font-size: 13px; color: #334155;">${note}</p>
                        </div>` : ''}

                        <p style="font-size: 13px;"><strong>👤 بيانات المستخدم:</strong> ${userEmail}</p>
                        <p style="font-size: 12px; color: #64748b;"><strong>⏰ التاريخ والوقت:</strong> ${nowFormatted} (${nowIso})</p>

                        <h4 style="color: #0f172a; margin-top: 20px; margin-bottom: 5px;">💻 كود JSON الجاهز للاعتماد المباشر في قاعدة البيانات:</h4>
                        <pre dir="ltr" style="background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto;">${jsonSnippet}</pre>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                        تم إرسال هذا الإشعار تلقائياً عبر نظام التصحيح الجماعي الذكي في تطبيق MotorCare.
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
                    googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
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
                        await Promise.race([fetchPromise, timeoutPromise]).catch(err => {
                            console.warn('[Location Correction] Webhook note:', err);
                        });
                    } catch (err) {
                        console.warn('[Location Correction] Webhook error:', err);
                    }
                }

                if (typeof emailjs !== 'undefined' && emailjs) {
                    try {
                        const emailjsConfig = (typeof SafeStorage !== 'undefined' ? SafeStorage.getItem('motorCare_emailjs_config') : localStorage.getItem('motorCare_emailjs_config'));
                        if (emailjsConfig) {
                            const conf = JSON.parse(emailjsConfig);
                            if (conf.serviceId && conf.templateId) {
                                await emailjs.send(conf.serviceId, conf.templateId, {
                                    to_email: adminEmail,
                                    user_name: userEmail,
                                    subject: subject,
                                    message: `تم اقتراح تعديل موقع لمركز: ${center.name} (${lat}, ${lng}). ملاحظات: ${note}`,
                                    ticket_id: `GPS_${center.id}`,
                                    category: 'Location Correction',
                                    car_details: `${center.name} - ${center.gov}`
                                }).catch(e => console.warn('[Location Correction EmailJS] Error:', e));
                            }
                        }
                    } catch (e) {
                        console.warn('[Location Correction EmailJS] Note:', e);
                    }
                }
            }, 50);
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
