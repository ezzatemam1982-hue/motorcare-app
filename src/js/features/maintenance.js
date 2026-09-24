        /* ==========================================================================
           [MODULE 11] جدول الصيانة الوقائية، وضع التعديل الحر، والفلترة الذكية
           ========================================================================== */
        let isFreeEditModeActive = false;
        let currentEditingCatalogItemId = null;

        // فلترة بنود جدول الصيانة وتحديث الواجهة
        function filterCatalog(filterType) {
            appState.activeFilter = filterType;
            
            // تحديث تصميم أزرار الفئات الرئيسية (Macro level)
            const isMacroAll = filterType === 'all';
            const isMacroPM = filterType === 'pm' || ['engine', 'filters', 'brakes', 'belts'].includes(filterType);
            const isMacroCM = filterType === 'cm';

            const btnAll = document.getElementById('filterBtn-all');
            const btnPM = document.getElementById('filterBtn-pm');
            const btnCM = document.getElementById('filterBtn-cm');

            if (btnAll) {
                btnAll.className = isMacroAll 
                    ? "px-3.5 py-1.5 bg-sky-600 dark:bg-sky-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                    : "px-3.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95";
            }
            if (btnPM) {
                btnPM.className = isMacroPM
                    ? "px-3.5 py-1.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                    : "px-3.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95";
            }
            if (btnCM) {
                btnCM.className = isMacroCM
                    ? "px-3.5 py-1.5 bg-rose-600 dark:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                    : "px-3.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95";
            }

            // تحديث فلاتر الأقسام الفرعية التابعة للـ PM مع إبقاء زر الإضافة نشطاً ومناسباً لنوع الصيانة المختار
            const subChips = document.getElementById('pmSubFilterChips');
            const subContainer = document.getElementById('pmSubCategoriesContainer');
            const addBtn = document.getElementById('mainScheduleAddCustomBtn');
            const isEn = appState.lang === 'en';

            if (subChips) {
                if (isMacroCM) {
                    subChips.classList.add('opacity-40', 'pointer-events-none');
                } else {
                    subChips.classList.remove('opacity-40', 'pointer-events-none');
                }
            } else if (subContainer) {
                // توافق تراجعي
                subContainer.classList.remove('pointer-events-none');
            }

            if (addBtn) {
                if (isMacroCM) {
                    addBtn.className = "px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95";
                    addBtn.onclick = () => openAddCustomPMModal('CM');
                    addBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-[11px]"></i> <span>${isEn ? '+ Add Urgent CM' : '+ إضافة صيانة عاجلة (CM)'}</span>`;
                } else {
                    addBtn.className = "px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95";
                    addBtn.onclick = () => openAddCustomPMModal('PM');
                    addBtn.innerHTML = `<i class="fa-solid fa-circle-plus text-[11px]"></i> <span data-i18n="btnAddCustomPM">${isEn ? 'Add Custom Item' : 'إضافة بند مخصص'}</span>`;
                }
            }

            const subFilters = ['pm-sub', 'engine', 'filters', 'brakes', 'belts'];
            subFilters.forEach(id => {
                const b = document.getElementById(`filterBtn-${id}`);
                if (!b) return;
                const match = (id === 'pm-sub' && (filterType === 'pm' || filterType === 'all')) || (id === filterType);
                if (match) {
                    b.classList.add('bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-slate-900');
                    b.classList.remove('bg-white', 'text-slate-700', 'dark:bg-slate-800', 'dark:text-slate-300');
                } else {
                    b.classList.remove('bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-slate-900');
                    b.classList.add('bg-white', 'text-slate-700', 'dark:bg-slate-800', 'dark:text-slate-300');
                }
            });

            renderCatalogItems();
        }

        function getCategoryIconHtml(item) {
            const id = String(item.id || '').toLowerCase();
            const cat = String(item.category || '').toLowerCase();
            const name = String(item.name || '').toLowerCase();

            if (id === 'oil' || cat === 'oil' || name.includes('زيت') || name.includes('oil')) {
                return '<i class="fa-solid fa-oil-can text-amber-500"></i>';
            }
            if (id.includes('filter') || cat === 'filters' || name.includes('فلتر') || name.includes('filter')) {
                return '<i class="fa-solid fa-filter text-sky-500"></i>';
            }
            if (id.includes('brake') || cat === 'brakes' || name.includes('فرامل') || name.includes('brake')) {
                return '<i class="fa-solid fa-compact-disc text-rose-500"></i>';
            }
            if (id.includes('belt') || id.includes('timing') || cat === 'belts' || name.includes('سير') || name.includes('كاتينة') || name.includes('belt')) {
                return '<i class="fa-solid fa-gears text-purple-500"></i>';
            }
            if (id.includes('plug') || name.includes('بوجيه') || name.includes('spark')) {
                return '<i class="fa-solid fa-bolt text-yellow-500"></i>';
            }
            if (id.includes('tire') || name.includes('إطار') || name.includes('تريلر') || name.includes('tire')) {
                return '<i class="fa-solid fa-circle-dot text-indigo-500"></i>';
            }
            if (item.type === 'CM') {
                return '<i class="fa-solid fa-triangle-exclamation text-rose-500"></i>';
            }
            return '<i class="fa-solid fa-wrench text-emerald-500"></i>';
        }

        // محرك رسم وعرض بطاقات جدول الصيانة الدوري والعاجل (PM / CM Grid)
        function renderCatalogItems() {
            const grid = document.getElementById('catalogGrid');
            if (!grid) return;

            const car = getCurrentCar();
            const isEn = appState.lang === 'en';

            if (!car) {
                grid.innerHTML = `
                    <div class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <div class="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-500 flex items-center justify-center text-2xl mx-auto">
                            <i class="fa-solid fa-car-side"></i>
                        </div>
                        <h4 class="text-sm font-black text-slate-800 dark:text-white">${isEn ? 'No Vehicle Selected' : 'لا توجد سيارة محددة'}</h4>
                        <p class="text-xs text-slate-400 max-w-sm mx-auto">${isEn ? 'Please add a vehicle to view its tailored factory maintenance schedule.' : 'يرجى إضافة سيارة إلى الكراج لمشاهدة جدول صيانتها المعتمد.'}</p>
                    </div>
                `;
                return;
            }

            if (!car.catalog || !Array.isArray(car.catalog) || car.catalog.length === 0) {
                if (typeof buildDefaultCatalogForCar === 'function') {
                    car.catalog = buildDefaultCatalogForCar(car.brand, car.model, car.generation, car.year, car.odometer);
                } else if (typeof buildSpecificCatalog === 'function') {
                    car.catalog = buildSpecificCatalog(car.brand, car.model, car.generationIndex || 0, car.odometer || 0);
                }
            }

            if (!car.catalog || car.catalog.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <div class="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-500 flex items-center justify-center text-2xl mx-auto">
                            <i class="fa-solid fa-screwdriver-wrench"></i>
                        </div>
                        <h4 class="text-sm font-black text-slate-800 dark:text-white">${isEn ? 'No maintenance items found' : 'جدول الصيانة فارغ حالياً'}</h4>
                        <p class="text-xs text-slate-400 max-w-sm mx-auto">${isEn ? 'Add custom maintenance tasks or reset to standard catalog.' : 'يمكنك إضافة بنود مخصصة للصيانة أو إعادة تعيين الكتالوج.'}</p>
                        <button onclick="openAddCustomPMModal('PM')" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center gap-2">
                            <i class="fa-solid fa-circle-plus"></i>
                            <span>${isEn ? 'Add Custom Item' : 'إضافة بند مخصص'}</span>
                        </button>
                    </div>
                `;
                return;
            }

            const currentOdo = Number(car.odometer) || 0;
            const activeFilter = appState.activeFilter || 'all';

            // تحديث بادج عداد الـ CM
            const cmItems = car.catalog.filter(i => i.type === 'CM' && !i.isResolved);
            const cmBadge = document.getElementById('cmFilterBadgeCount');
            if (cmBadge) {
                if (cmItems.length > 0) {
                    cmBadge.innerText = cmItems.length;
                    cmBadge.classList.remove('hidden');
                } else {
                    cmBadge.classList.add('hidden');
                }
            }

            // تصفية البنود طبقاً للفلتر المختار
            const filteredItems = car.catalog.filter(item => {
                const idLower = String(item.id || '').toLowerCase();
                const nameLower = String(item.name || '').toLowerCase();
                const catLower = String(item.category || '').toLowerCase();
                const isCM = item.type === 'CM';

                if (activeFilter === 'cm') return isCM;
                if (activeFilter === 'pm') return !isCM;
                if (activeFilter === 'engine') {
                    return !isCM && (catLower === 'engine' || catLower === 'oil' || idLower === 'oil' || idLower.includes('oil') || nameLower.includes('زيت') || idLower.includes('coolant') || nameLower.includes('تبريد') || idLower.includes('trans') || nameLower.includes('فتيس') || idLower.includes('plug') || nameLower.includes('بوجيه'));
                }
                if (activeFilter === 'filters') {
                    return !isCM && (catLower === 'filters' || idLower.includes('filter') || nameLower.includes('فلتر'));
                }
                if (activeFilter === 'brakes') {
                    return !isCM && (catLower === 'brakes' || idLower.includes('brake') || nameLower.includes('فرامل'));
                }
                if (activeFilter === 'belts') {
                    return !isCM && (catLower === 'belts' || idLower.includes('belt') || idLower.includes('timing') || nameLower.includes('سير') || nameLower.includes('كاتينة'));
                }
                return true; // 'all'
            });

            if (filteredItems.length === 0) {
                if (activeFilter === 'cm') {
                    grid.innerHTML = `
                        <div class="col-span-full p-8 text-center rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-dashed border-rose-300 dark:border-rose-800 space-y-4 shadow-sm">
                            <div class="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                                <i class="fa-solid fa-wrench"></i>
                            </div>
                            <div class="space-y-1">
                                <h4 class="text-sm font-black text-slate-800 dark:text-slate-100">
                                    ${isEn ? 'No Urgent Corrective Maintenance (CM) Tasks' : 'لا توجد بلاغات أو مهام صيانة عاجلة (CM) مسجلة'}
                                </h4>
                                <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                    ${isEn 
                                        ? 'All vehicle systems are currently operating normally. If you encountered any sudden breakdown or urgent repair, add it here to track and alert.' 
                                        : 'كافة المنظومات تعمل بحالة طبيعية. إذا ظهر أي عطل طارئ أو كسر أو تلف مفاجئ بالمركبة، يمكنك إضافته هنا فوراً للمتابعة والتنبيه.'}
                                </p>
                            </div>
                            <div>
                                <button type="button" onclick="openAddCustomPMModal('CM')" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-rose-600/25 inline-flex items-center gap-2 active:scale-95">
                                    <i class="fa-solid fa-circle-plus text-sm"></i>
                                    <span>${isEn ? '+ Add Urgent CM Task' : '+ إضافة بند صيانة عاجلة / عطل طارئ (CM)'}</span>
                                </button>
                            </div>
                        </div>
                    `;
                    return;
                }
                grid.innerHTML = `
                    <div class="col-span-full py-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto">
                            <i class="fa-solid fa-filter"></i>
                        </div>
                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">${isEn ? 'No items in this category' : 'لا توجد بنود مطابقة لهذا التصنيف'}</h4>
                        <p class="text-xs text-slate-400">${isEn ? 'Try selecting another category or add a custom task.' : 'جرّب اختيار تصنيف آخر أو إضافة بند مخصص.'}</p>
                        <div>
                            <button type="button" onclick="openAddCustomPMModal('PM')" class="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center gap-2 active:scale-95">
                                <i class="fa-solid fa-circle-plus"></i>
                                <span>${isEn ? 'Add Custom Item' : 'إضافة بند مخصص'}</span>
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            let cardsHtml = '';
            if (activeFilter === 'cm') {
                cardsHtml += `
                    <div class="col-span-full flex flex-wrap items-center justify-between gap-3 p-3.5 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl mb-2">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <div>
                                <h5 class="text-xs font-bold text-slate-900 dark:text-white">${isEn ? 'Urgent Corrective Maintenance (CM)' : 'مهام الصيانة العاجلة والأعطال الطارئة (CM)'}</h5>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400">${isEn ? 'Active repairs requiring immediate attention' : 'أعطال وإصلاحات فورية مسجلة تتطلب التدخل والمتابعة'}</p>
                            </div>
                        </div>
                        <button type="button" onclick="openAddCustomPMModal('CM')" class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
                            <i class="fa-solid fa-circle-plus"></i>
                            <span>${isEn ? '+ Add Another CM Task' : '+ إضافة صيانة عاجلة جديدة (CM)'}</span>
                        </button>
                    </div>
                `;
            }

            filteredItems.forEach(item => {
                const evalResult = evaluateMaintenanceItem(item, currentOdo, car);
                const isCM = item.type === 'CM';
                const itemName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(item) : item.name;
                const iconHtml = getCategoryIconHtml(item);

                const lastKm = Number(item.lastKm) || 0;
                const kmInterval = Number(item.kmInterval) || 10000;
                const unitStr = item.unit === 'hours' ? (isEn ? 'hrs' : 'ساعة') : (isEn ? 'km' : 'كم');
                const lastDateStr = item.lastDate ? item.lastDate.split('T')[0] : '--';

                // ألوان شريط التقدم والبادج
                let barColor = '#10b981';
                let badgeClass = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80';
                if (evalResult.isOverdue) {
                    barColor = '#f43f5e';
                    badgeClass = 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 animate-pulse';
                } else if (evalResult.isApproaching) {
                    barColor = '#f59e0b';
                    badgeClass = 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80';
                }

                const statusBadgeTxt = isEn ? evalResult.statusBadgeEn : evalResult.statusBadgeAr;
                const reasonTxt = isEn ? evalResult.reasonTextEn : evalResult.reasonTextAr;
                const isCustomItem = item.category === 'other' || String(item.id).startsWith('c_') || String(item.id).startsWith('cm_');

                cardsHtml += `
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
                        <!-- هيدر البطاقة: الأيقونة، الاسم، والنوع والبادج -->
                        <div class="space-y-2.5">
                            <div class="flex items-start justify-between gap-2">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                                        ${iconHtml}
                                    </div>
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-1.5">
                                            <span class="px-1.5 py-0.2 rounded text-[9px] font-black ${isCM ? 'bg-rose-600 text-white' : 'bg-sky-600 text-white'}">${isCM ? 'CM' : 'PM'}</span>
                                            <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate" title="${itemName}">${itemName}</h4>
                                        </div>
                                        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate mt-0.5">${reasonTxt}</span>
                                    </div>
                                </div>
                                <span class="px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${badgeClass}">
                                    ${statusBadgeTxt}
                                </span>
                            </div>

                            ${!isCM ? `
                            <!-- شريط التقدم ومؤشر الاستهلاك -->
                            <div class="space-y-1 pt-1">
                                <div class="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    <span>${isEn ? 'Consumption:' : 'نسبة الاستهلاك:'} ${evalResult.percent}%</span>
                                    <span>${evalResult.isOverdue ? (isEn ? 'Service Overdue' : 'مستحق الآن') : (isEn ? `${evalResult.remainingKm.toLocaleString()} ${unitStr} left` : `متبقي ${evalResult.remainingKm.toLocaleString()} ${unitStr}`)}</span>
                                </div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-500" style="width: ${evalResult.percent}%; background-color: ${barColor};"></div>
                                </div>
                            </div>
                            ` : ''}

                            <!-- تفاصيل الفواصل وآخر صيانة -->
                            <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-[11px] border border-slate-100 dark:border-slate-800/80">
                                <div>
                                    <span class="text-slate-400 block text-[10px] font-medium">${isEn ? 'Last Service:' : 'آخر صيانة:'}</span>
                                    <strong class="text-slate-700 dark:text-slate-200 font-bold block truncate font-mono">${lastKm.toLocaleString()} ${unitStr}</strong>
                                    <span class="text-slate-400 text-[9px] block">${lastDateStr}</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block text-[10px] font-medium">${isEn ? 'Service Interval:' : 'فاصل التغيير:'}</span>
                                    ${isCM ? `
                                        <strong class="text-rose-600 dark:text-rose-400 font-bold block">${isEn ? 'Urgent / Corrective' : 'عطل طارئ عاجل'}</strong>
                                    ` : `
                                        <strong class="text-slate-700 dark:text-slate-200 font-bold block truncate font-mono">${kmInterval.toLocaleString()} ${unitStr}</strong>
                                        <span class="text-slate-400 text-[9px] block">${item.monthInterval || 12} ${isEn ? 'months' : 'شهر'}</span>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- أزرار الإجراءات السريعة في أسفل البطاقة -->
                        <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <button type="button" onclick="openRecordModal('${item.id}')" class="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                <i class="fa-solid fa-circle-check text-[11px]"></i>
                                <span>${isEn ? 'Log Service' : 'تسجيل صيانة'}</span>
                            </button>

                            ${!isCM ? `
                            <button type="button" onclick="openEditCatalogItemModal('${item.id}')" class="p-2 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0" title="${isEn ? 'Edit Interval' : 'تعديل الفاصل'}">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                            ` : ''}

                            ${(item.isCustomized && !isCustomItem) ? `
                            <button type="button" onclick="resetPMItemToDefaultDirect('${item.id}')" class="p-2 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer shrink-0" title="${isEn ? 'Restore Factory Default' : 'استعادة الأصل'}">
                                <i class="fa-solid fa-arrow-rotate-left text-xs"></i>
                            </button>
                            ` : ''}

                            ${isCustomItem ? `
                            <button type="button" onclick="deleteCustomPMItem('${item.id}')" class="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0" title="${isEn ? 'Delete Custom Item' : 'حذف البند'}">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = cardsHtml;
        }

        function toggleFreeEditMode() {
            isFreeEditModeActive = !isFreeEditModeActive;
            const btn = document.getElementById('toggleFreeEditModeBtn');
            const btnText = document.getElementById('freeEditModeBtnText');
            const notice = document.getElementById('freeEditModeNotice');
            const isEn = appState.lang === 'en';

            if (btn) {
                if (isFreeEditModeActive) {
                    btn.className = "px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ring-2 ring-amber-400/40";
                    if (btnText) btnText.innerText = isEn ? 'Exit Free Edit Mode ✓' : 'إنهاء التعديل الحر ✓';
                    if (notice) notice.classList.remove('hidden');
                    showNotification(isEn 
                        ? '✏️ Free Edit Mode active: You can now adjust km/month intervals for any item.' 
                        : '✏️ وضع التعديل الحر مفعّل: يمكنك الآن تعديل فترات الكيلومتر والشهور لأي بند في الكتالوج.', 'info', 4500);
                } else {
                    btn.className = "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700";
                    if (btnText) btnText.innerText = isEn ? 'Free Edit Mode' : 'وضع التعديل الحر';
                    if (notice) notice.classList.add('hidden');
                }
            }
            renderCatalogItems();
        }

        function onCustomPMUnitTypeChange() {
            const unitType = document.getElementById('customPMUnitType')?.value || 'km';
            const unitBadge = document.getElementById('customPMUnitBadge');
            const unitLabel = document.getElementById('customPMUnitLabel');
            const kmInput = document.getElementById('customPMKmInput');
            const isEn = appState.lang === 'en';

            if (unitType === 'hours') {
                if (unitBadge) unitBadge.innerText = isEn ? 'Hrs' : 'ساعة';
                if (unitLabel) unitLabel.innerText = isEn ? 'Operating Hours:' : 'ساعات التشغيل:';
                if (kmInput && (!kmInput.value || kmInput.value === '40000')) kmInput.value = '250';
            } else {
                if (unitBadge) unitBadge.innerText = isEn ? 'km' : 'كم';
                if (unitLabel) unitLabel.innerText = isEn ? 'Distance Interval:' : 'فاصل المسافة:';
                if (kmInput && (!kmInput.value || kmInput.value === '250')) kmInput.value = '40000';
            }
        }

        function onCustomItemTypeChange() {
            const isCM = document.querySelector('input[name="customItemType"]:checked')?.value === 'CM';
            const isEn = appState.lang === 'en';
            const intervalsCont = document.getElementById('customPMIntervalsContainer');
            const titleEl = document.getElementById('addCustomPMModalTitle');
            const iconCont = document.getElementById('addCustomPMModalIcon');
            const nameInput = document.getElementById('customPMNameInput');

            if (intervalsCont) {
                intervalsCont.style.display = isCM ? 'none' : 'grid';
            }
            if (titleEl) {
                titleEl.innerText = isCM 
                    ? (isEn ? 'Add Urgent Corrective Maintenance (CM)' : 'إضافة صيانة عاجلة / عطل طارئ (CM)')
                    : (isEn ? 'Add Custom Preventive Item (PM)' : 'إضافة بند صيانة مخصص');
            }
            if (iconCont) {
                iconCont.className = isCM 
                    ? 'w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center text-sm'
                    : 'w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-sm';
                iconCont.innerHTML = isCM 
                    ? '<i class="fa-solid fa-triangle-exclamation"></i>'
                    : '<i class="fa-solid fa-circle-plus"></i>';
            }
            if (nameInput && !nameInput.value) {
                nameInput.placeholder = isCM 
                    ? (isEn ? 'e.g. Broken Alternator, Coolant Leak, A/C Gas Refill' : 'مثال: تغيير دينامو، شحن تكييف، إصلاح تسريب مياه')
                    : (isEn ? 'e.g. Organic Coolant, Gas Filter, Wheel Alignment' : 'مثال: مياه ردياتير عضوية، فلتر غاز، ضبط زوايا');
            }
        }

        function openAddCustomPMModal(initialType = null) {
            const isEn = appState.lang === 'en';
            const kmInput = document.getElementById('customPMKmInput');
            const monthsInput = document.getElementById('customPMMonthsInput');
            const nameInput = document.getElementById('customPMNameInput');
            const unitType = document.getElementById('customPMUnitType');
            const modal = document.getElementById('addCustomPMModal');
            const catSelect = document.getElementById('customPMCategorySelect');
            
            const targetType = initialType || (appState.activeFilter === 'cm' ? 'CM' : 'PM');
            const isCM = targetType === 'CM';

            const radio = document.querySelector(`input[name="customItemType"][value="${isCM ? 'CM' : 'PM'}"]`);
            if (radio) radio.checked = true;

            if (catSelect) catSelect.value = 'engine';
            if (kmInput) kmInput.value = 40000;
            if (monthsInput) monthsInput.value = 24;
            if (nameInput) {
                nameInput.value = '';
                nameInput.placeholder = isCM 
                    ? (isEn ? 'e.g. Broken Alternator, Coolant Leak, A/C Gas Refill' : 'مثال: تغيير دينامو، شحن تكييف، إصلاح تسريب مياه')
                    : (isEn ? 'e.g. Organic Coolant, Gas Filter, Wheel Alignment' : 'مثال: مياه ردياتير عضوية، فلتر غاز، ضبط زوايا');
            }
            if (unitType) unitType.value = 'km';

            onCustomPMUnitTypeChange();
            onCustomItemTypeChange();

            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }

        function closeAddCustomPMModal() { 
            const modal = document.getElementById('addCustomPMModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function saveCustomPMItem() {
            const nameInput = document.getElementById('customPMNameInput');
            const kmInput = document.getElementById('customPMKmInput');
            const monthsInput = document.getElementById('customPMMonthsInput');
            const unitSelect = document.getElementById('customPMUnitType');
            const catSelect = document.getElementById('customPMCategorySelect');
            const itemType = document.querySelector('input[name="customItemType"]:checked')?.value || 'PM';
            const isCM = itemType === 'CM';
            const isEn = appState.lang === 'en';
            if (!nameInput) return;

            const name = nameInput.value.trim();
            const km = parseInt(kmInput ? kmInput.value : 40000) || 40000;
            const months = parseInt(monthsInput ? monthsInput.value : 24) || 24;
            const unit = unitSelect ? unitSelect.value : 'km';
            const category = catSelect ? catSelect.value : 'other';

            if (!name) {
                showNotification(isEn ? 'Please enter custom item name!' : 'يرجى إدخال اسم البند المخصص!', 'warning');
                nameInput.focus();
                return;
            }

            const car = getCurrentCar();
            if (!car.catalog) car.catalog = [];

            const todayIso = new Date().toISOString().split('T')[0];

            if (isCM) {
                car.catalog.push({ 
                    id: 'cm_' + Date.now(), 
                    name: name, 
                    category: category, 
                    type: 'CM',
                    isResolved: false,
                    kmInterval: 0, 
                    monthInterval: 0, 
                    unit: 'km',
                    isCustomized: true,
                    lastKm: car.odometer || 0, 
                    lastDate: todayIso 
                });
            } else {
                car.catalog.push({ 
                    id: 'c_' + Date.now(), 
                    name: name, 
                    category: category, 
                    type: 'PM',
                    kmInterval: km, 
                    monthInterval: months, 
                    unit: unit,
                    isCustomized: true,
                    originalKmInterval: km,
                    originalMonthInterval: months,
                    lastKm: car.odometer || 0, 
                    lastDate: todayIso 
                });
            }

            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud(isCM ? 'custom_cm_added' : 'custom_pm_added');
            closeAddCustomPMModal();
            renderCatalogItems();
            if (typeof renderDashboard === 'function') renderDashboard();

            showNotification(isEn 
                ? (isCM ? '🚨 Urgent corrective maintenance task added!' : 'Custom maintenance item added and synced! ☁️')
                : (isCM ? '🚨 تمت إضافة مهمة الصيانة العاجلة لجدول المتابعة والتنبيهات!' : 'تمت إضافة البند المخصص ومزامنته سحابياً بنجاح! ☁️'), 
                'success');
        }

        function openEditCatalogItemModal(itemId) {
            const car = getCurrentCar();
            if (!car || !car.catalog) return;

            const item = car.catalog.find(i => i.id === itemId);
            if (!item) return;

            currentEditingCatalogItemId = itemId;
            const modal = document.getElementById('editCatalogItemModal');
            const titleEl = document.getElementById('editItemModalTitle');
            const noticeEl = document.getElementById('editItemOriginalNotice');
            const kmInput = document.getElementById('editItemKmInput');
            const monthsInput = document.getElementById('editItemMonthsInput');
            const unitBadge = document.getElementById('editItemUnitBadge');
            const unitLabel = document.getElementById('editItemUnitLabel');
            const resetBtn = document.getElementById('editItemResetBtn');
            const isEn = appState.lang === 'en';

            const itemName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(item) : item.name;
            if (titleEl) titleEl.innerText = isEn ? `Edit Interval: ${itemName}` : `تعديل فاصل: ${itemName}`;

            const unit = item.unit || 'km';
            if (unitBadge) unitBadge.innerText = unit === 'hours' ? (isEn ? 'Hrs' : 'ساعة') : (isEn ? 'km' : 'كم');
            if (unitLabel) unitLabel.innerText = unit === 'hours' ? (isEn ? 'Operating Hours:' : 'ساعات التشغيل:') : (isEn ? 'Distance Interval:' : 'فاصل المسافة:');

            if (kmInput) kmInput.value = item.kmInterval || 10000;
            if (monthsInput) monthsInput.value = item.monthInterval || 12;

            const dateInput = document.getElementById('editItemLastDateInput');
            if (dateInput) {
                dateInput.value = item.lastDate ? item.lastDate.split('T')[0] : (car.createdAt ? car.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
            }

            const origKm = (typeof item.originalKmInterval !== 'undefined') ? item.originalKmInterval : item.kmInterval;
            const origMonths = (typeof item.originalMonthInterval !== 'undefined') ? item.originalMonthInterval : item.monthInterval;
            const isCustomItem = item.category === 'other' || String(item.id).startsWith('c_');

            if (noticeEl) {
                if (isCustomItem) {
                    noticeEl.innerHTML = `<span class="font-bold text-emerald-600 dark:text-emerald-400"><i class="fa-solid fa-circle-info ml-1"></i> هذا بند صيانة مخصص أضفته بنفسك.</span> يمكنك تعديل فترات الاستحقاق في أي وقت.`;
                    if (resetBtn) resetBtn.classList.add('hidden');
                } else {
                    const unitStr = unit === 'hours' ? (isEn ? 'hrs' : 'ساعة') : (isEn ? 'km' : 'كم');
                    noticeEl.innerHTML = `
                        <div class="font-bold text-slate-800 dark:text-slate-200 mb-1"><i class="fa-solid fa-circle-info ml-1 text-sky-500"></i> ${isEn ? 'Original Car Catalog Defaults:' : 'القيم الأصلية لكتالوج السيارة:'}</div>
                        <div class="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                            <span>${isEn ? 'Default Distance:' : 'المسافة الأصلية:'} <strong class="text-slate-700 dark:text-slate-300">${Number(origKm).toLocaleString()} ${unitStr}</strong></span>
                            <span>•</span>
                            <span>${isEn ? 'Default Period:' : 'المدة الأصلية:'} <strong class="text-slate-700 dark:text-slate-300">${origMonths} ${isEn ? 'months' : 'شهر'}</strong></span>
                        </div>
                    `;
                    if (resetBtn) resetBtn.classList.remove('hidden');
                }
            }

            // إظهار أو إخفاء محدد نوع البوجيهات في نافذة تعديل الفاصل
            const plugsCont = document.getElementById('editItemSparkPlugsContainer');
            const plugsSel = document.getElementById('editItemSparkPlugsSelect');
            if (plugsCont) {
                if (itemId === 'spark_plugs' || itemId.includes('spark_plugs')) {
                    plugsCont.classList.remove('hidden');
                    if (plugsSel) {
                        if (item.plugType) {
                            plugsSel.value = item.plugType;
                        } else if (item.kmInterval >= 110000) {
                            plugsSel.value = 'iridium_long_120000_60';
                        } else if (item.kmInterval >= 90000 || (item.name && item.name.toLowerCase().includes('iridium'))) {
                            plugsSel.value = 'iridium_100000_60';
                        } else if (item.kmInterval >= 70000 || (item.name && (item.name.includes('مزدوج') || item.name.toLowerCase().includes('double')))) {
                            plugsSel.value = 'double_platinum_80000_48';
                        } else if (item.kmInterval >= 45000 || (item.name && item.name.toLowerCase().includes('platinum'))) {
                            plugsSel.value = 'platinum_60000_36';
                        } else {
                            plugsSel.value = 'copper_25000_24';
                        }
                    }
                } else {
                    plugsCont.classList.add('hidden');
                }
            }

            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }

        function onEditSparkPlugsTypeChanged() {
            const sel = document.getElementById('editItemSparkPlugsSelect');
            const kmInput = document.getElementById('editItemKmInput');
            const moInput = document.getElementById('editItemMonthsInput');
            if (!sel || !kmInput || !moInput) return;

            const val = sel.value;
            if (val === 'copper_25000_24') {
                kmInput.value = 30000;
                moInput.value = 24;
            } else if (val === 'platinum_60000_36') {
                kmInput.value = 60000;
                moInput.value = 36;
            } else if (val === 'double_platinum_80000_48') {
                kmInput.value = 80000;
                moInput.value = 48;
            } else if (val === 'iridium_100000_60') {
                kmInput.value = 100000;
                moInput.value = 60;
            } else if (val === 'iridium_long_120000_60') {
                kmInput.value = 120000;
                moInput.value = 60;
            }
        }

        function closeEditCatalogItemModal() {
            const modal = document.getElementById('editCatalogItemModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
            currentEditingCatalogItemId = null;
        }

        function saveCatalogItemInterval() {
            const car = getCurrentCar();
            if (!car || !car.catalog || !currentEditingCatalogItemId) return;

            const item = car.catalog.find(i => i.id === currentEditingCatalogItemId);
            if (!item) return;

            const kmInput = document.getElementById('editItemKmInput');
            const monthsInput = document.getElementById('editItemMonthsInput');
            const isEn = appState.lang === 'en';

            const newKm = parseInt(kmInput ? kmInput.value : item.kmInterval) || item.kmInterval;
            const newMonths = parseInt(monthsInput ? monthsInput.value : item.monthInterval) || item.monthInterval;

            // حفظ القيم الأصلية للمقارنة ولإمكانية الاستعادة في أي وقت
            if (typeof item.originalKmInterval === 'undefined') {
                item.originalKmInterval = item.kmInterval;
            }
            if (typeof item.originalMonthInterval === 'undefined') {
                item.originalMonthInterval = item.monthInterval;
            }

            item.kmInterval = newKm;
            item.monthInterval = newMonths;

            if (item.id === 'spark_plugs' || item.id.includes('spark_plugs')) {
                const plugSel = document.getElementById('editItemSparkPlugsSelect');
                if (plugSel) {
                    item.plugType = plugSel.value;
                    if (plugSel.value === 'copper_25000_24') {
                        item.name = isEn ? 'Standard Copper/Nickel Spark Plugs' : 'بوجيهات نحاسية / نيكل قياسية (Copper/Nickel Plugs)';
                    } else if (plugSel.value === 'platinum_60000_36') {
                        item.name = isEn ? 'Single Platinum Spark Plugs' : 'بوجيهات بلاتنيوم قياسية (Single Platinum Plugs)';
                    } else if (plugSel.value === 'double_platinum_80000_48') {
                        item.name = isEn ? 'Double Platinum Spark Plugs' : 'بوجيهات بلاتنيوم مزدوجة (Double Platinum Plugs)';
                    } else if (plugSel.value === 'iridium_100000_60') {
                        item.name = isEn ? 'Laser Iridium Spark Plugs' : 'بوجيهات إيريديوم ليزر (Laser Iridium Plugs)';
                    } else if (plugSel.value === 'iridium_long_120000_60') {
                        item.name = isEn ? 'Long-Life Iridium Spark Plugs' : 'بوجيهات إيريديوم طويلة المدى (Long-Life Iridium Plugs)';
                    }
                }
            }

            const dateInput = document.getElementById('editItemLastDateInput');
            if (dateInput && dateInput.value) {
                item.lastDate = dateInput.value;
            }

            // وسم البند كمخصص إذا اختلف عن الأصل
            if (item.kmInterval !== item.originalKmInterval || item.monthInterval !== item.originalMonthInterval) {
                item.isCustomized = true;
            } else {
                item.isCustomized = false;
            }

            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('pm_intervals_updated');

            closeEditCatalogItemModal();
            renderCatalogItems();
            if (typeof renderDashboard === 'function') renderDashboard();

            showNotification(isEn 
                ? '✅ Maintenance interval updated and synced to cloud! ☁️' 
                : '✅ تم تحديث فاصل الصيانة وحفظه ومزامنته سحابياً بنجاح! ☁️', 'success');
        }

        function resetCatalogItemToDefault() {
            const car = getCurrentCar();
            if (!car || !car.catalog || !currentEditingCatalogItemId) return;

            const item = car.catalog.find(i => i.id === currentEditingCatalogItemId);
            if (!item) return;

            const isEn = appState.lang === 'en';

            if (typeof item.originalKmInterval === 'undefined' || typeof item.originalMonthInterval === 'undefined') {
                const brand = car.brand || '';
                const model = car.model || '';
                const genIdx = car.generationIndex || 0;
                const oemCatalog = buildSpecificCatalog(brand, model, genIdx, 0);
                const oemItem = oemCatalog.find(i => i.id === item.id);
                if (oemItem) {
                    item.originalKmInterval = oemItem.kmInterval;
                    item.originalMonthInterval = oemItem.monthInterval;
                }
            }

            if (typeof item.originalKmInterval !== 'undefined') {
                item.kmInterval = item.originalKmInterval;
            }
            if (typeof item.originalMonthInterval !== 'undefined') {
                item.monthInterval = item.originalMonthInterval;
            }
            item.isCustomized = false;

            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('pm_intervals_reset');

            closeEditCatalogItemModal();
            renderCatalogItems();
            if (typeof renderDashboard === 'function') renderDashboard();

            showNotification(isEn 
                ? '↩️ Restored original catalog defaults!' 
                : '↩️ تمت استعادة القيم الأصلية لكتالوج السيارة بنجاح!', 'info');
        }

        function resetPMItemToDefaultDirect(itemId) {
            const car = getCurrentCar();
            if (!car || !car.catalog) return;

            const item = car.catalog.find(i => i.id === itemId);
            if (!item) return;

            const isEn = appState.lang === 'en';

            // استرجاع القيم الأصلية من الكتالوج المعياري للسيارة إذا لم تكن مسجلة مسبقاً
            if (typeof item.originalKmInterval === 'undefined' || typeof item.originalMonthInterval === 'undefined') {
                const brand = car.brand || '';
                const model = car.model || '';
                const genIdx = car.generationIndex || 0;
                const oemCatalog = buildSpecificCatalog(brand, model, genIdx, 0);
                const oemItem = oemCatalog.find(i => i.id === item.id);
                if (oemItem) {
                    item.originalKmInterval = oemItem.kmInterval;
                    item.originalMonthInterval = oemItem.monthInterval;
                }
            }

            if (typeof item.originalKmInterval !== 'undefined') {
                item.kmInterval = item.originalKmInterval;
            }
            if (typeof item.originalMonthInterval !== 'undefined') {
                item.monthInterval = item.originalMonthInterval;
            }
            item.isCustomized = false;

            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('pm_intervals_reset_direct');

            renderCatalogItems();
            if (typeof renderDashboard === 'function') renderDashboard();

            const itemName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(item) : item.name;
            showNotification(isEn 
                ? `↩️ "${itemName}" restored to original catalog defaults!` 
                : `↩️ تمت استعادة الكتالوج الأصلي لبند "${itemName}" بنجاح!`, 'info');
        }

        function deleteCustomPMItem(itemId) {
            const car = getCurrentCar();
            if (!car || !car.catalog) return;

            const isEn = appState.lang === 'en';
            if (!confirm(isEn ? 'Are you sure you want to delete this custom maintenance item?' : 'هل أنت متأكد من حذف هذا البند المخصص نهائياً؟')) return;

            car.catalog = car.catalog.filter(i => i.id !== itemId);
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('custom_pm_deleted');

            renderCatalogItems();
            if (typeof renderDashboard === 'function') renderDashboard();
            showNotification(isEn ? 'Custom item deleted' : 'تم حذف البند المخصص بنجاح', 'info');
        }



        /* ==========================================================================
           [MODULE 13] تسجيل وتعديل وحذف الصيانات والفواتير
           ========================================================================== */
        let editingRecordId = null;
        let currentRecordingCatalogPartId = null;

        function openRecordModal(partIdOrRecordId = '') {
            const car = getCurrentCar();
            const modal = document.getElementById('recordModal');
            const sel = document.getElementById('recordPartSelect');
            if (!modal || !sel || !car) return;

            currentRecordingCatalogPartId = null;
            const existingRecord = car.history ? car.history.find(h => h.id === partIdOrRecordId) : null;
            const targetCatalogItem = car.catalog ? car.catalog.find(i => i.id === partIdOrRecordId) : null;
            if (targetCatalogItem) {
                currentRecordingCatalogPartId = targetCatalogItem.id;
            }
            const isEn = appState.lang === 'en';

            sel.innerHTML = '';
            if (car.catalog) {
                car.catalog.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item.id;
                    const baseName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(item) : item.name;
                    opt.innerText = item.type === 'CM' ? `[${isEn ? 'Urgent CM' : 'عاجل CM'}] ${baseName}` : baseName;
                    sel.appendChild(opt);
                });
            }

            const pmRadio = document.querySelector('input[name="maintenanceType"][value="PM"]');
            const cmRadio = document.querySelector('input[name="maintenanceType"][value="CM"]');

            if (existingRecord) {
                editingRecordId = existingRecord.id;
                if (existingRecord.type === 'CM') {
                    if (cmRadio) cmRadio.checked = true;
                    const customInput = document.getElementById('recordCustomPartInput');
                    if (customInput) customInput.value = existingRecord.partName || '';
                    const catSelect = document.getElementById('recordCmCategorySelect');
                    if (catSelect && existingRecord.category) catSelect.value = existingRecord.category;
                } else {
                    if (pmRadio) pmRadio.checked = true;
                    sel.value = existingRecord.partId || '';
                }
                
                const odoInput = document.getElementById('recordOdometerInput');
                if (odoInput) odoInput.value = existingRecord.odometer || '';

                const dateInput = document.getElementById('recordDateInput');
                if (dateInput) dateInput.value = existingRecord.date || '';

                const wInput = document.getElementById('recordWorkshopInput');
                if (wInput) wInput.value = existingRecord.workshop || '';

                const pInput = document.getElementById('recordPhoneInput');
                if (pInput) pInput.value = existingRecord.phone || '';

                const partsInput = document.getElementById('recordPartsCostInput');
                if (partsInput) partsInput.value = existingRecord.partsCost || '';

                const laborInput = document.getElementById('recordLaborCostInput');
                if (laborInput) laborInput.value = existingRecord.laborCost || '';

                if (existingRecord.plugType) {
                    const plugSel = document.getElementById('sparkPlugsTypeSelect');
                    if (plugSel) plugSel.value = existingRecord.plugType;
                }
            } else {
                editingRecordId = null;
                if (targetCatalogItem && targetCatalogItem.type === 'CM') {
                    if (cmRadio) cmRadio.checked = true;
                    const customInput = document.getElementById('recordCustomPartInput');
                    if (customInput) customInput.value = targetCatalogItem.name || '';
                    const catSelect = document.getElementById('recordCmCategorySelect');
                    if (catSelect && targetCatalogItem.category) catSelect.value = targetCatalogItem.category;
                } else {
                    if (pmRadio) pmRadio.checked = true;
                    if (partIdOrRecordId) sel.value = partIdOrRecordId;
                }

                if (targetCatalogItem) {
                    if (targetCatalogItem.id === 'spark_plugs' || targetCatalogItem.id.includes('spark_plugs')) {
                        const plugSel = document.getElementById('sparkPlugsTypeSelect');
                        if (plugSel) {
                            if (targetCatalogItem.plugType) {
                                plugSel.value = targetCatalogItem.plugType;
                            } else if (targetCatalogItem.kmInterval >= 110000) {
                                plugSel.value = 'iridium_long_120000_60';
                            } else if (targetCatalogItem.kmInterval >= 90000 || (targetCatalogItem.name && targetCatalogItem.name.toLowerCase().includes('iridium'))) {
                                plugSel.value = 'iridium_100000_60';
                            } else if (targetCatalogItem.kmInterval >= 70000 || (targetCatalogItem.name && (targetCatalogItem.name.includes('مزدوج') || targetCatalogItem.name.toLowerCase().includes('double')))) {
                                plugSel.value = 'double_platinum_80000_48';
                            } else if (targetCatalogItem.kmInterval >= 45000 || (targetCatalogItem.name && targetCatalogItem.name.toLowerCase().includes('platinum'))) {
                                plugSel.value = 'platinum_60000_36';
                            } else {
                                plugSel.value = 'copper_25000_24';
                            }
                        }
                    }
                    if (targetCatalogItem.id === 'oil' && targetCatalogItem.oilType) {
                        const oilSel = document.getElementById('oilViscositySelect');
                        if (oilSel) oilSel.value = targetCatalogItem.oilType;
                    }
                }

                const odoInput = document.getElementById('recordOdometerInput');
                if (odoInput) odoInput.value = car.odometer || 0;

                const dateInput = document.getElementById('recordDateInput');
                if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

                const wInput = document.getElementById('recordWorkshopInput');
                if (wInput) wInput.value = '';

                const pInput = document.getElementById('recordPhoneInput');
                if (pInput) pInput.value = '';

                const partsInput = document.getElementById('recordPartsCostInput');
                if (partsInput) partsInput.value = '';

                const laborInput = document.getElementById('recordLaborCostInput');
                if (laborInput) laborInput.value = '';
            }

            toggleMaintenanceType();
            modal.classList.remove('hidden');
        }

        function closeRecordModal() { 
            editingRecordId = null;
            currentRecordingCatalogPartId = null;
            const modal = document.getElementById('recordModal');
            if (modal) modal.classList.add('hidden'); 
        }

        function toggleMaintenanceType() {
            const isCM = document.querySelector('input[name="maintenanceType"]:checked')?.value === 'CM';
            document.getElementById('pmPartContainer')?.classList.toggle('hidden', isCM);
            document.getElementById('cmPartContainer')?.classList.toggle('hidden', !isCM);
            if (isCM) {
                document.getElementById('oilViscosityContainer')?.classList.add('hidden');
                document.getElementById('tiresCountContainer')?.classList.add('hidden');
                document.getElementById('brakesPlacementContainer')?.classList.add('hidden');
                document.getElementById('sparkPlugsTypeContainer')?.classList.add('hidden');
            } else {
                onRecordPartChanged();
            }
        }

        function saveMaintenanceRecord() {
            const car = getCurrentCar();
            if (!car) return;

            const isCM = document.querySelector('input[name="maintenanceType"]:checked')?.value === 'CM';
            let partId, pName, category = 'other';

            const odoInput = document.getElementById('recordOdometerInput');
            const odo = MotorCareSecurity.parsePositiveInt(odoInput?.value, car.odometer, 0, 5000000);

            const dateInput = document.getElementById('recordDateInput');
            const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

            if (isCM) {
                const customInput = document.getElementById('recordCustomPartInput');
                if (!customInput || !customInput.value.trim()) {
                    alert(appState.lang === 'en' ? 'Please enter a description for the corrective maintenance/repair.' : 'يرجى كتابة وصف العطل / الإصلاح الطارئ');
                    return;
                }
                pName = MotorCareSecurity.sanitizeText(customInput.value.trim(), 150);
                const catSel = document.getElementById('recordCmCategorySelect');
                category = catSel ? catSel.value : 'other';

                // تحديد بند CM في الكتالوج لحله وإزالته من جدول الصيانة فور توثيقه في سجل الفواتير
                let catalogItem = null;
                if (currentRecordingCatalogPartId) {
                    catalogItem = car.catalog ? car.catalog.find(i => i.id === currentRecordingCatalogPartId) : null;
                }
                if (!catalogItem && car.catalog) {
                    catalogItem = car.catalog.find(i => i.type === 'CM' && (i.name.trim().toLowerCase() === pName.toLowerCase() || (editingRecordId && i.id === editingRecordId)));
                }
                if (!catalogItem && car.catalog) {
                    catalogItem = car.catalog.find(i => i.type === 'CM' && !i.isResolved && i.name.includes(pName));
                }

                if (catalogItem) {
                    partId = catalogItem.id;
                    catalogItem.isResolved = true;
                    catalogItem.lastKm = odo;
                    catalogItem.lastDate = date;
                    // إزالة البند العاجل من جدول الصيانات بعد تسجيله في الفواتير حتى لا يظل معلقاً
                    car.catalog = car.catalog.filter(i => i.id !== catalogItem.id);
                } else {
                    partId = 'CM_' + Date.now();
                }
            } else {
                const partSel = document.getElementById('recordPartSelect');
                if (!partSel) return;
                partId = partSel.value;
                const catalogItem = car.catalog ? car.catalog.find(i => i.id === partId) : null;
                pName = catalogItem ? catalogItem.name : partId;
                category = catalogItem ? catalogItem.category : 'engine';
                if (catalogItem) {
                    catalogItem.lastKm = odo;
                    catalogItem.lastDate = date;

                    // تحديث نوع وفترة البوجيهات إذا كان البند بوجيهات
                    if (partId === 'spark_plugs' || partId.includes('spark_plugs')) {
                        const plugSel = document.getElementById('sparkPlugsTypeSelect');
                        if (plugSel) {
                            const val = plugSel.value;
                            const isEn = appState.lang === 'en';
                            let pKm = 30000, pMo = 24;
                            let pTitle = isEn ? 'Standard Copper/Nickel Spark Plugs' : 'بوجيهات نحاسية / نيكل قياسية (Copper/Nickel Plugs)';

                            if (val === 'copper_25000_24') {
                                pKm = 30000; pMo = 24;
                                pTitle = isEn ? 'Standard Copper/Nickel Spark Plugs' : 'بوجيهات نحاسية / نيكل قياسية (Copper/Nickel Plugs)';
                            } else if (val === 'platinum_60000_36') {
                                pKm = 60000; pMo = 36;
                                pTitle = isEn ? 'Single Platinum Spark Plugs' : 'بوجيهات بلاتنيوم قياسية (Single Platinum Plugs)';
                            } else if (val === 'double_platinum_80000_48') {
                                pKm = 80000; pMo = 48;
                                pTitle = isEn ? 'Double Platinum Spark Plugs' : 'بوجيهات بلاتنيوم مزدوجة (Double Platinum Plugs)';
                            } else if (val === 'iridium_100000_60') {
                                pKm = 100000; pMo = 60;
                                pTitle = isEn ? 'Laser Iridium Spark Plugs' : 'بوجيهات إيريديوم ليزر (Laser Iridium Plugs)';
                            } else if (val === 'iridium_long_120000_60') {
                                pKm = 120000; pMo = 60;
                                pTitle = isEn ? 'Long-Life Iridium Spark Plugs' : 'بوجيهات إيريديوم طويلة المدى (Long-Life Iridium Plugs)';
                            }

                            catalogItem.plugType = val;
                            catalogItem.kmInterval = pKm;
                            catalogItem.monthInterval = pMo;
                            catalogItem.name = pTitle;
                            pName = pTitle;
                        }
                    }

                    // تحديث نوع وفترة الزيت إذا كان البند زيت المحرك
                    if (partId === 'oil') {
                        const oilSel = document.getElementById('oilViscositySelect');
                        if (oilSel && oilSel.value) {
                            const [oilKm, oilMo] = oilSel.value.split('_').map(Number);
                            if (oilKm && oilMo) {
                                catalogItem.kmInterval = oilKm;
                                catalogItem.monthInterval = oilMo;
                                catalogItem.oilType = oilSel.value;
                            }
                        }
                    }

                    if (catalogItem.type === 'CM') {
                        catalogItem.isResolved = true;
                        car.catalog = car.catalog.filter(i => i.id !== catalogItem.id);
                    }
                }
            }

            const partsInput = document.getElementById('recordPartsCostInput');
            const parts = MotorCareSecurity.parsePositiveFloat(partsInput?.value, 0, 0, 1000000);

            const laborInput = document.getElementById('recordLaborCostInput');
            const labor = MotorCareSecurity.parsePositiveFloat(laborInput?.value, 0, 0, 1000000);

            const wInput = document.getElementById('recordWorkshopInput');
            const workshop = MotorCareSecurity.sanitizeText(wInput?.value || '', 100);

            const pInput = document.getElementById('recordPhoneInput');
            const phone = MotorCareSecurity.sanitizeText(pInput?.value || '', 30);

            if (odo > car.odometer) car.odometer = odo;
            if (!car.history) car.history = [];
            const attachedInvoice = tempImages['invoice'] || '';

            const plugSel = document.getElementById('sparkPlugsTypeSelect');
            const plugVal = (partId === 'spark_plugs' || partId.includes('spark_plugs')) && plugSel ? plugSel.value : '';

            if (editingRecordId) {
                const idx = car.history.findIndex(h => h.id === editingRecordId);
                if (idx !== -1) {
                    car.history[idx].type = isCM ? 'CM' : 'PM';
                    car.history[idx].partId = partId;
                    car.history[idx].partName = pName;
                    car.history[idx].category = category;
                    car.history[idx].workshop = workshop;
                    car.history[idx].phone = phone;
                    car.history[idx].odometer = odo;
                    car.history[idx].partsCost = parts;
                    car.history[idx].laborCost = labor;
                    car.history[idx].totalCost = parts + labor;
                    car.history[idx].date = date;
                    if (plugVal) car.history[idx].plugType = plugVal;
                    if (attachedInvoice) car.history[idx].invoiceImage = attachedInvoice;
                }
            } else {
                car.history.unshift({
                    id: 'h_' + Date.now(),
                    type: isCM ? 'CM' : 'PM',
                    partId,
                    partName: pName,
                    category: category,
                    workshop,
                    phone,
                    odometer: odo,
                    partsCost: parts,
                    laborCost: labor,
                    totalCost: parts + labor,
                    date,
                    plugType: plugVal,
                    invoiceImage: attachedInvoice
                });
            }

            tempImages['invoice'] = '';
            editingRecordId = null;
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('maintenance_saved');
            if (partId && typeof MotorCareNotifications !== 'undefined' && MotorCareNotifications.clearItemNotification) {
                MotorCareNotifications.clearItemNotification(partId);
            }
            closeRecordModal();
            renderDashboard();
            renderCatalogItems();
            if (typeof renderHistoryList === 'function') renderHistoryList();
        }

        function deleteHistoryRecord(id) {
            const isEn = appState.lang === 'en';
            const confirmMsg = isEn ? 'Are you sure you want to permanently delete this maintenance log?' : 'هل أنت متأكد من حذف هذا السجل نهائياً؟';
            showCustomConfirm(confirmMsg, () => {
                const car = getCurrentCar();
                car.history = car.history.filter(h => h.id !== id);
                SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                syncUserDataToCloud('maintenance_deleted');
                renderDashboard();
                showNotification(isEn ? 'Maintenance record deleted.' : 'تم حذف سجل الصيانة بنجاح.', 'success');
            });
        }

        function renderHistoryList() {
            const car = getCurrentCar();
            const cont = document.getElementById('historyListContainer');
            if (!cont) return;
            const isEn = appState.lang === 'en';

            if (!car.history || !car.history.length) {
                cont.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">${isEn ? 'No maintenance logs found yet.' : 'لا توجد سجلات صيانة حتى الآن'}</div>`;
                return;
            }

            const thDate = isEn ? 'Date' : 'التاريخ';
            const thItem = isEn ? 'Service Item' : 'البند';
            const thOdo = isEn ? 'Odometer' : 'العداد';
            const thWorkshop = isEn ? 'Workshop / Contact' : 'المركز / التليفون';
            const thInvoice = isEn ? 'Receipt' : 'الفاتورة';
            const thCost = isEn ? 'Cost' : 'التكلفة';
            const thActions = isEn ? 'Actions' : 'إجراءات';
            const viewTxt = isEn ? 'View' : 'عرض';

            let html = `<div class="overflow-x-auto"><table class="w-full text-xs text-start"><thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr><th class="p-3">${thDate}</th><th class="p-3">${thItem}</th><th class="p-3">${thOdo}</th><th class="p-3">${thWorkshop}</th><th class="p-3">${thInvoice}</th><th class="p-3">${thCost}</th><th class="p-3 text-center">${thActions}</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">`;

            car.history.forEach(h => {
                const rawWorkshop = h.workshop ? h.workshop.trim() : '';
                const rawPhone = h.phone ? h.phone.trim() : '';
                const workshopName = MotorCareSecurity.escapeHtml(rawWorkshop);
                const phoneNum = MotorCareSecurity.escapeHtml(rawPhone);

                let workshopHtml = '-';
                if (workshopName || phoneNum) {
                    workshopHtml = `<div>`;
                    if (workshopName) workshopHtml += `<strong class="text-slate-800 dark:text-slate-100 block">${workshopName}</strong>`;
                    if (phoneNum) workshopHtml += `<a href="tel:${phoneNum}" class="text-sky-500 hover:underline text-[11px] font-bold block"><i class="fa-solid fa-phone text-[10px] ml-0.5"></i> ${phoneNum}</a>`;
                    workshopHtml += `</div>`;
                }

                const localizedPart = getLocalizedItemName(h.partName || '');
                const typeBadge = (!h.type || h.type === 'PM') 
                    ? `<span class="inline-block bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-[10px] px-1.5 py-0.5 rounded ml-1 font-bold">PM</span>`
                    : `<span class="inline-block bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded ml-1 font-bold">CM</span>`;

                html += `<tr>
                    <td class="p-3">${MotorCareSecurity.escapeHtml(h.date || '-')}</td>
                    <td class="p-3 font-bold text-slate-900 dark:text-white">${typeBadge} ${MotorCareSecurity.escapeHtml(localizedPart)}</td>
                    <td class="p-3">${h.odometer ? Number(h.odometer).toLocaleString() + (isEn ? ' km' : ' كم') : '-'}</td>
                    <td class="p-3">${workshopHtml}</td>
                    <td class="p-3">${h.invoiceImage ? `<button onclick="openImageViewer('${h.invoiceImage}')" class="text-sky-500 font-bold underline cursor-pointer"><i class="fa-solid fa-file-invoice ml-1"></i> ${viewTxt}</button>` : '-'}</td>
                    <td class="p-3 font-black text-emerald-600">${h.totalCost !== undefined ? Number(h.totalCost).toLocaleString() + (isEn ? ' EGP' : ' ج.م') : (isEn ? '0 EGP' : '0 ج.م')}</td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="openRecordModal('${h.id}')" class="text-sky-500 hover:text-sky-700 cursor-pointer p-1" title="${isEn ? 'Edit' : 'تعديل'}"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteHistoryRecord('${h.id}')" class="text-rose-500 hover:text-rose-700 cursor-pointer p-1" title="${isEn ? 'Delete' : 'حذف'}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            cont.innerHTML = html;
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof filterCatalog !== 'undefined') window.filterCatalog = filterCatalog; } catch (e) {}
try { if (typeof getCategoryIconHtml !== 'undefined') window.getCategoryIconHtml = getCategoryIconHtml; } catch (e) {}
try { if (typeof renderCatalogItems !== 'undefined') window.renderCatalogItems = renderCatalogItems; } catch (e) {}
try { if (typeof toggleFreeEditMode !== 'undefined') window.toggleFreeEditMode = toggleFreeEditMode; } catch (e) {}
try { if (typeof onCustomPMUnitTypeChange !== 'undefined') window.onCustomPMUnitTypeChange = onCustomPMUnitTypeChange; } catch (e) {}
try { if (typeof onCustomItemTypeChange !== 'undefined') window.onCustomItemTypeChange = onCustomItemTypeChange; } catch (e) {}
try { if (typeof openAddCustomPMModal !== 'undefined') window.openAddCustomPMModal = openAddCustomPMModal; } catch (e) {}
try { if (typeof closeAddCustomPMModal !== 'undefined') window.closeAddCustomPMModal = closeAddCustomPMModal; } catch (e) {}
try { if (typeof saveCustomPMItem !== 'undefined') window.saveCustomPMItem = saveCustomPMItem; } catch (e) {}
try { if (typeof openEditCatalogItemModal !== 'undefined') window.openEditCatalogItemModal = openEditCatalogItemModal; } catch (e) {}
try { if (typeof onEditSparkPlugsTypeChanged !== 'undefined') window.onEditSparkPlugsTypeChanged = onEditSparkPlugsTypeChanged; } catch (e) {}
try { if (typeof closeEditCatalogItemModal !== 'undefined') window.closeEditCatalogItemModal = closeEditCatalogItemModal; } catch (e) {}
try { if (typeof saveCatalogItemInterval !== 'undefined') window.saveCatalogItemInterval = saveCatalogItemInterval; } catch (e) {}
try { if (typeof resetCatalogItemToDefault !== 'undefined') window.resetCatalogItemToDefault = resetCatalogItemToDefault; } catch (e) {}
try { if (typeof resetPMItemToDefaultDirect !== 'undefined') window.resetPMItemToDefaultDirect = resetPMItemToDefaultDirect; } catch (e) {}
try { if (typeof deleteCustomPMItem !== 'undefined') window.deleteCustomPMItem = deleteCustomPMItem; } catch (e) {}
try { if (typeof openRecordModal !== 'undefined') window.openRecordModal = openRecordModal; } catch (e) {}
try { if (typeof closeRecordModal !== 'undefined') window.closeRecordModal = closeRecordModal; } catch (e) {}
try { if (typeof toggleMaintenanceType !== 'undefined') window.toggleMaintenanceType = toggleMaintenanceType; } catch (e) {}
try { if (typeof saveMaintenanceRecord !== 'undefined') window.saveMaintenanceRecord = saveMaintenanceRecord; } catch (e) {}
try { if (typeof deleteHistoryRecord !== 'undefined') window.deleteHistoryRecord = deleteHistoryRecord; } catch (e) {}
try { if (typeof renderHistoryList !== 'undefined') window.renderHistoryList = renderHistoryList; } catch (e) {}
