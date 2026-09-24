        /* ==========================================================================
           [MODULE 18] تقرير الصيانة الشامل للطباعة (Official PDF Report)
           ========================================================================== */
        function printVehicleReport() {
            const car = getCurrentCar();
            const isEn = appState.lang === 'en';

            const printSection = document.getElementById('reportPrintSection');
            if (printSection) {
                printSection.dir = isEn ? 'ltr' : 'rtl';
                printSection.classList.add('active-print-target');
            }
            const customPrint = document.getElementById('customReportPrintSection');
            if (customPrint) customPrint.classList.remove('active-print-target');

            const printTitle = document.getElementById('printCarTitle');
            const printOdo = document.getElementById('printCarOdo');
            const printBatt = document.getElementById('printBattery');
            const printTire = document.getElementById('printTires');
            const printDate = document.getElementById('printDateSpan');

            const sub = document.getElementById('printReportSub');
            if (sub) sub.innerText = isEn ? 'Comprehensive Multi-Point Technical Inspection & Certified Maintenance History' : 'تقرير الفحص الفني الشامل وسجل الصيانة الوقائية المعتمد (Multi-Point Inspection)';
            
            const lVeh = document.getElementById('printLblVehicle');
            if (lVeh) lVeh.innerText = isEn ? 'Vehicle:' : 'المركبة (Vehicle):';

            const lOdo = document.getElementById('printLblOdo');
            if (lOdo) lOdo.innerText = isEn ? 'Odometer:' : 'قراءة العداد (Odometer):';

            const lBatt = document.getElementById('printLblBattery');
            if (lBatt) lBatt.innerText = isEn ? 'Battery:' : 'البطارية (Battery):';

            const lTire = document.getElementById('printLblTires');
            if (lTire) lTire.innerText = isEn ? 'Tires (DOT):' : 'الإطارات (Tires DOT):';

            const tSys = document.getElementById('printTitleSysCheck');
            if (tSys) tSys.innerText = isEn ? '1. Vital Systems Inspection & Recorded Faults' : 'أولاً: قائمة فحص الأنظمة الحيوية والعيوب المرصودة (Comprehensive System Check)';

            const tHist = document.getElementById('printTitleHistoryLog');
            if (tHist) tHist.innerText = isEn ? '2. Completed Services & Invoices Log' : 'ثانياً: سجل الصيانات المنجزة والفواتير (Service History Log)';

            const thD = document.getElementById('printThDate');
            if (thD) thD.innerText = isEn ? 'Date' : 'التاريخ (Date)';

            const thI = document.getElementById('printThItem');
            if (thI) thI.innerText = isEn ? 'Service Item' : 'بند الصيانة (Service Item)';

            const thO = document.getElementById('printThOdo');
            if (thO) thO.innerText = isEn ? 'Odometer' : 'العداد (Odometer)';

            const thW = document.getElementById('printThWorkshop');
            if (thW) thW.innerText = isEn ? 'Workshop / Tech' : 'المركز / الفني (Workshop)';

            const thC = document.getElementById('printThCost');
            if (thC) thC.innerText = isEn ? 'Cost' : 'التكلفة (Cost)';

            const sOff = document.getElementById('printSignOff');
            if (sOff) sOff.innerText = isEn ? 'Certified Technical Inspector Signature: ...................................' : 'توقيع الفاحص الفني / المعتمد: ...................................';

            if (printTitle) printTitle.innerText = `${car.brand} ${car.model} (${car.year})`;
            if (printOdo) printOdo.innerText = `${Number(car.odometer).toLocaleString()} ${isEn ? 'km' : 'كم'}`;
            if (printBatt) printBatt.innerText = `${car.battery.brand} (${car.battery.capacity})`;
            if (printTire) printTire.innerText = `${car.tiresInfo.size} (DOT ${car.tiresInfo.dotCode})`;
            if (printDate) printDate.innerText = new Date().toISOString().split('T')[0];

            // تعبئة قائمة الفحص الديناميكية في التقرير
            const inspContainer = document.getElementById('printInspectionList');
            if (inspContainer) {
                inspContainer.innerHTML = '';
                const checklist = car.inspectionChecklist || {};
                INSPECTION_SYSTEMS.forEach(sys => {
                    const item = checklist[sys.id] || { status: 'Good', notes: '' };
                    const label = isEn ? sys.labelEn : sys.labelAr;
                    
                    let badgeClass = 'bg-emerald-100 text-emerald-800';
                    let statusText = isEn ? 'Good' : 'سليم / ممتاز';
                    if (item.status === 'Fair') {
                        badgeClass = 'bg-sky-100 text-sky-800';
                        statusText = isEn ? 'Needs Attention' : 'يحتاج متابعة';
                    } else if (item.status === 'Bad') {
                        badgeClass = 'bg-rose-100 text-rose-800';
                        statusText = isEn ? 'Urgent Repair' : 'صيانة عاجلة';
                    } else if (item.status === 'Original') {
                        if (sys.id === 'body') {
                            badgeClass = 'bg-emerald-100 text-emerald-800';
                            statusText = isEn ? 'Factory Original' : 'فابريكة أصلي';
                        } else {
                            badgeClass = 'bg-emerald-100 text-emerald-800';
                            statusText = isEn ? 'Good / Excellent' : 'سليم / ممتاز';
                        }
                    }

                    inspContainer.innerHTML += `
                        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-1">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-slate-800">${label}</span>
                                <strong class="px-2.5 py-0.5 ${badgeClass} rounded-full text-[10px] font-bold">${statusText}</strong>
                            </div>
                            ${item.notes ? `<p class="text-[11px] text-rose-600 font-semibold mt-1">⚠️ ${isEn ? 'Note/Fault:' : 'ملاحظة/عطل:'} ${item.notes}</p>` : ''}
                        </div>
                    `;
                });
            }

            const thType = document.getElementById('printThType');
            if (thType) thType.innerText = isEn ? 'Type (PM/CM)' : 'نوع الصيانة (PM/CM)';

            const tb = document.getElementById('printHistoryTableBody');
            if (tb) {
                tb.innerHTML = '';
                if (!car.history || car.history.length === 0) {
                    tb.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">${isEn ? 'No service history records found.' : 'لا توجد سجلات صيانة مسجلة.'}</td></tr>`;
                } else {
                    car.history.forEach(h => {
                        const localizedPart = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(h.partName || '') : h.partName;
                        const isPM = (!h.type || h.type === 'PM');
                        const typeBadge = isPM 
                            ? `<span style="display:inline-block; padding:2px 7px; border-radius:6px; font-weight:900; font-size:10px; background-color:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">PM</span>`
                            : `<span style="display:inline-block; padding:2px 7px; border-radius:6px; font-weight:900; font-size:10px; background-color:#ffe4e6; color:#be123c; border:1px solid #fecdd3;">CM</span>`;
                        const typeDesc = isPM 
                            ? (isEn ? 'Preventive' : 'وقائية') 
                            : (isEn ? 'Corrective' : 'علاجية');

                        tb.innerHTML += `
                            <tr>
                                <td class="p-2.5">${h.date || '-'}</td>
                                <td class="p-2.5 font-bold text-slate-800">${localizedPart}</td>
                                <td class="p-2.5 whitespace-nowrap">
                                    <div class="flex items-center gap-1.5">
                                        ${typeBadge}
                                        <span class="text-[10px] text-slate-500 font-bold">(${typeDesc})</span>
                                    </div>
                                </td>
                                <td class="p-2.5">${h.odometer ? Number(h.odometer).toLocaleString() + (isEn ? ' km' : ' كم') : '-'}</td>
                                <td class="p-2.5">${h.workshop || '-'}</td>
                                <td class="p-2.5 font-bold text-emerald-700 text-end">${Number(h.totalCost || 0).toLocaleString()} ${isEn ? 'EGP' : 'ج.م'}</td>
                            </tr>
                        `;
                    });
                }
            }
            window.print();
        }

        /* ==========================================================================
           [MODULE 19] محرك تصدير وطباعة الفواتير والتقارير المخصصة (Custom Reports & Invoices Engine)
           ========================================================================== */
        function openExportReportsModal(initialType = 'all') {
            const car = getCurrentCar();
            if (!car) {
                if (typeof openAddNewCarModal === 'function') openAddNewCarModal();
                return;
            }

            const modal = document.getElementById('customReportExportModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }

            selectExportReportType(initialType);
            applyReportDatePreset('all');
            updateCustomReportPreview();
        }

        function closeExportReportsModal() {
            const modal = document.getElementById('customReportExportModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function selectExportReportType(type) {
            const hiddenInput = document.getElementById('exportReportTypeSelect');
            if (hiddenInput) hiddenInput.value = type;

            const types = ['all', 'maintenance', 'fuel'];
            types.forEach(t => {
                const btn = document.getElementById(`repTypeBtn-${t}`);
                const radio = document.getElementById(`repRadio-${t}`);
                if (!btn) return;

                if (t === type) {
                    btn.classList.remove('border-slate-200', 'dark:border-slate-800', 'bg-slate-50', 'dark:bg-slate-800/60', 'text-slate-700', 'dark:text-slate-300');
                    if (t === 'all') {
                        btn.classList.add('border-emerald-500', 'bg-emerald-50/50', 'dark:bg-emerald-950/30', 'text-emerald-900', 'dark:text-emerald-200');
                        if (radio) { radio.className = 'w-3 h-3 rounded-full bg-emerald-500 inline-block'; }
                    } else if (t === 'maintenance') {
                        btn.classList.add('border-sky-500', 'bg-sky-50/50', 'dark:bg-sky-950/30', 'text-sky-900', 'dark:text-sky-200');
                        if (radio) { radio.className = 'w-3 h-3 rounded-full bg-sky-500 inline-block'; }
                    } else if (t === 'fuel') {
                        btn.classList.add('border-amber-500', 'bg-amber-50/50', 'dark:bg-amber-950/30', 'text-amber-900', 'dark:text-amber-200');
                        if (radio) { radio.className = 'w-3 h-3 rounded-full bg-amber-500 inline-block'; }
                    }
                } else {
                    btn.classList.remove(
                        'border-emerald-500', 'bg-emerald-50/50', 'dark:bg-emerald-950/30', 'text-emerald-900', 'dark:text-emerald-200',
                        'border-sky-500', 'bg-sky-50/50', 'dark:bg-sky-950/30', 'text-sky-900', 'dark:text-sky-200',
                        'border-amber-500', 'bg-amber-50/50', 'dark:bg-amber-950/30', 'text-amber-900', 'dark:text-amber-200'
                    );
                    btn.classList.add('border-slate-200', 'dark:border-slate-800', 'bg-slate-50', 'dark:bg-slate-800/60', 'text-slate-700', 'dark:text-slate-300');
                    if (radio) { radio.className = 'w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block'; }
                }
            });

            // إظهار أو إخفاء فلتر الصيانة الإضافي (PM/CM)
            const maintFilterCont = document.getElementById('exportMaintFilterContainer');
            if (maintFilterCont) {
                if (type === 'fuel') {
                    maintFilterCont.classList.add('hidden');
                } else {
                    maintFilterCont.classList.remove('hidden');
                }
            }

            updateCustomReportPreview();
        }

        function applyReportDatePreset(preset) {
            const fromInput = document.getElementById('exportReportFromDate');
            const toInput = document.getElementById('exportReportToDate');
            if (!fromInput || !toInput) return;

            const now = new Date();
            let fromVal = '';
            let toVal = '';

            if (preset === 'thisMonth') {
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                fromVal = `${y}-${m}-01`;
                toVal = now.toISOString().split('T')[0];
            } else if (preset === 'last3Months') {
                const past = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                fromVal = past.toISOString().split('T')[0];
                toVal = now.toISOString().split('T')[0];
            } else if (preset === 'thisYear') {
                fromVal = `${now.getFullYear()}-01-01`;
                toVal = now.toISOString().split('T')[0];
            } else if (preset === 'lastYear') {
                fromVal = `${now.getFullYear() - 1}-01-01`;
                toVal = `${now.getFullYear() - 1}-12-31`;
            } else {
                fromVal = '';
                toVal = '';
            }

            fromInput.value = fromVal;
            toInput.value = toVal;

            const presets = ['all', 'thisMonth', 'last3Months', 'thisYear', 'lastYear'];
            presets.forEach(p => {
                const btn = document.getElementById(`presetBtn-${p}`);
                if (!btn) return;
                if (p === preset) {
                    btn.className = 'px-3 py-1 rounded-xl text-xs font-bold bg-sky-600 text-white cursor-pointer transition-all shadow-2xs';
                } else {
                    btn.className = 'px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all';
                }
            });

            updateCustomReportPreview();
        }

        function onCustomReportDateChanged() {
            const presets = ['all', 'thisMonth', 'last3Months', 'thisYear', 'lastYear'];
            presets.forEach(p => {
                const btn = document.getElementById(`presetBtn-${p}`);
                if (btn) btn.className = 'px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all';
            });

            updateCustomReportPreview();
        }

        function getFilteredReportData() {
            const car = getCurrentCar();
            if (!car) {
                return { items: [], summary: { totalCost: 0, maintCost: 0, fuelCost: 0, maintCount: 0, fuelCount: 0, totalCount: 0, totalLiters: 0 } };
            }

            const type = document.getElementById('exportReportTypeSelect')?.value || 'all';
            const fromDate = document.getElementById('exportReportFromDate')?.value || '';
            const toDate = document.getElementById('exportReportToDate')?.value || '';
            const maintFilter = document.getElementById('exportMaintTypeFilter')?.value || 'ALL';
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            let combinedItems = [];
            let maintCost = 0;
            let fuelCost = 0;
            let totalLiters = 0;
            let maintCount = 0;
            let fuelCount = 0;

            // 1. جلب وتصفية سجلات الصيانة (PM & CM)
            if (type === 'all' || type === 'maintenance') {
                const history = car.history || [];
                history.forEach(h => {
                    const hDate = h.date || '';
                    if (fromDate && hDate < fromDate) return;
                    if (toDate && hDate > toDate) return;

                    const itemType = (h.type || 'PM').toUpperCase();
                    if (maintFilter !== 'ALL' && itemType !== maintFilter) return;

                    const cost = Number(h.totalCost) || (Number(h.partsCost || 0) + Number(h.laborCost || 0)) || 0;
                    maintCost += cost;
                    maintCount++;

                    const localizedPart = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(h.partName || '') : h.partName;

                    combinedItems.push({
                        category: 'maintenance',
                        type: itemType,
                        date: hDate,
                        title: localizedPart || (isEn ? 'Maintenance Service' : 'صيانة عامة'),
                        odometer: h.odometer || '',
                        location: h.workshop || '-',
                        phone: h.phone || '',
                        cost: cost,
                        details: h.notes || '',
                        laborCost: Number(h.laborCost) || 0,
                        partsCost: Number(h.partsCost) || 0
                    });
                });
            }

            // 2. جلب وتصفية سجلات الوقود (Fuel Logs)
            if (type === 'all' || type === 'fuel') {
                const fuelLogs = car.fuelLogs || [];
                fuelLogs.forEach(f => {
                    const fDate = f.date || '';
                    if (fromDate && fDate < fromDate) return;
                    if (toDate && fDate > toDate) return;

                    const cost = Number(f.cost) || 0;
                    const liters = Number(f.liters) || 0;
                    fuelCost += cost;
                    totalLiters += liters;
                    fuelCount++;

                    const octaneText = f.octane ? (isEn ? `Gasoline ${f.octane}` : `بنزين ${f.octane}`) : (isEn ? 'Fuel Fill-up' : 'تفويلة وقود');

                    combinedItems.push({
                        category: 'fuel',
                        type: 'FUEL',
                        date: fDate,
                        title: octaneText,
                        odometer: f.odometer || '',
                        location: f.station || (isEn ? 'Gas Station' : 'محطة وقود'),
                        cost: cost,
                        details: `${liters} ${isEn ? 'Liters' : 'لتر'}`,
                        liters: liters
                    });
                });
            }

            // ترتيب العمليات تنازلياً حسب التاريخ (الأحدث أولاً)
            combinedItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            const totalCost = maintCost + fuelCost;
            const totalCount = maintCount + fuelCount;

            return {
                items: combinedItems,
                summary: {
                    totalCost,
                    maintCost,
                    fuelCost,
                    maintCount,
                    fuelCount,
                    totalCount,
                    totalLiters
                }
            };
        }

        function updateCustomReportPreview() {
            const { items, summary } = getFilteredReportData();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const currency = isEn ? 'EGP' : 'ج.م';

            const kpiTotal = document.getElementById('modalKpiTotalCost');
            if (kpiTotal) kpiTotal.innerText = `${summary.totalCost.toLocaleString()} ${currency}`;

            const kpiMaint = document.getElementById('modalKpiMaintCost');
            if (kpiMaint) kpiMaint.innerText = `${summary.maintCost.toLocaleString()} ${currency}`;

            const kpiFuel = document.getElementById('modalKpiFuelCost');
            if (kpiFuel) kpiFuel.innerText = `${summary.fuelCost.toLocaleString()} ${currency}`;

            const kpiCount = document.getElementById('modalKpiCount');
            if (kpiCount) kpiCount.innerText = `${summary.totalCount} ${isEn ? 'records' : 'فاتورة'}`;

            const rowCountEl = document.getElementById('modalPreviewRowsCount');
            if (rowCountEl) rowCountEl.innerText = `${summary.totalCount} ${isEn ? 'records' : 'سجل'}`;

            const tbody = document.getElementById('modalPreviewTableBody');
            if (!tbody) return;

            if (items.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-4 text-center text-slate-400 dark:text-slate-500 font-semibold">
                            ${isEn ? 'No records match the selected date range and filter.' : 'لا توجد سجلات مطابقة للفترة الزمنية ونوع التقرير المحدد.'}
                        </td>
                    </tr>
                `;
                return;
            }

            let rowsHtml = '';
            items.forEach(it => {
                let typeBadge = '';
                if (it.type === 'PM') {
                    typeBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">PM</span>`;
                } else if (it.type === 'CM') {
                    typeBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">CM</span>`;
                } else {
                    typeBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">FUEL</span>`;
                }

                const odoFormatted = it.odometer ? `${Number(it.odometer).toLocaleString()} ${isEn ? 'km' : 'كم'}` : '-';

                rowsHtml += `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td class="p-2 whitespace-nowrap text-slate-600 dark:text-slate-300">${it.date || '-'}</td>
                        <td class="p-2 whitespace-nowrap">${typeBadge}</td>
                        <td class="p-2 font-bold text-slate-800 dark:text-slate-200">
                            <div>${it.title}</div>
                            ${it.details ? `<div class="text-[10px] text-slate-400 font-normal">${it.details}</div>` : ''}
                        </td>
                        <td class="p-2 whitespace-nowrap text-slate-500 dark:text-slate-400">${odoFormatted}</td>
                        <td class="p-2 text-end font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">${it.cost.toLocaleString()} ${currency}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = rowsHtml;
        }

        function executePrintCustomReport() {
            const car = getCurrentCar();
            if (!car) return;

            const { items, summary } = getFilteredReportData();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const currency = isEn ? 'EGP' : 'ج.م';
            const type = document.getElementById('exportReportTypeSelect')?.value || 'all';
            const fromDate = document.getElementById('exportReportFromDate')?.value || '';
            const toDate = document.getElementById('exportReportToDate')?.value || '';

            const printSection = document.getElementById('customReportPrintSection');
            if (!printSection) return;

            printSection.dir = isEn ? 'ltr' : 'rtl';

            const subTitleEl = document.getElementById('customPrintSubtitle');
            if (subTitleEl) {
                if (type === 'maintenance') {
                    subTitleEl.innerText = isEn ? 'Certified Maintenance & Parts Invoices Statement' : 'تقرير وسجل فواتير الصيانة والإصلاح المعتمد (Maintenance & Parts Invoices)';
                } else if (type === 'fuel') {
                    subTitleEl.innerText = isEn ? 'Certified Fuel Consumption & Fill-ups Statement' : 'تقرير وسجل استهلاك الوقود والتفويلات المعتمد (Fuel Consumption Statement)';
                } else {
                    subTitleEl.innerText = isEn ? 'Official Certified Expense & Maintenance Statement' : 'تقرير فواتير ومصروفات الصيانة والوقود المعتمد (Comprehensive Expense Statement)';
                }
            }

            const refEl = document.getElementById('customPrintRefCode');
            if (refEl) refEl.innerText = `MC-REP-${Date.now().toString().slice(-6)}`;

            const dateSpan = document.getElementById('customPrintDateSpan');
            if (dateSpan) {
                const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
                dateSpan.innerText = `${isEn ? 'Issued on: ' : 'تاريخ الإصدار: '} ${nowStr}`;
            }

            const rangeSpan = document.getElementById('customPrintRangeSpan');
            if (rangeSpan) {
                if (fromDate && toDate) {
                    rangeSpan.innerText = `${isEn ? 'Period: ' : 'الفترة: '} ${fromDate}  →  ${toDate}`;
                } else if (fromDate) {
                    rangeSpan.innerText = `${isEn ? 'From: ' : 'من تاريخ: '} ${fromDate}`;
                } else if (toDate) {
                    rangeSpan.innerText = `${isEn ? 'Up to: ' : 'حتى تاريخ: '} ${toDate}`;
                } else {
                    rangeSpan.innerText = isEn ? 'Period: All Time Records' : 'الفترة: كافة السجلات المسجلة';
                }
            }

            const lVeh = document.getElementById('cpLblVehicle');
            if (lVeh) lVeh.innerText = isEn ? 'Vehicle:' : 'المركبة (Vehicle):';

            const lOdo = document.getElementById('cpLblOdo');
            if (lOdo) lOdo.innerText = isEn ? 'Current Odometer:' : 'العداد الحالي (Odometer):';

            const lPlate = document.getElementById('cpLblPlate');
            if (lPlate) lPlate.innerText = isEn ? 'Plate / VIN:' : 'اللوحة / الشاسيه (Plate/VIN):';

            const lFuelOil = document.getElementById('cpLblFuelOil');
            if (lFuelOil) lFuelOil.innerText = isEn ? 'Engine / Oil:' : 'المحرك / الزيت (Engine/Oil):';

            const carTitle = document.getElementById('cpCarTitle');
            if (carTitle) carTitle.innerText = `${car.brand} ${car.model} (${car.year})`;

            const carOdo = document.getElementById('cpCarOdo');
            if (carOdo) carOdo.innerText = `${Number(car.odometer).toLocaleString()} ${isEn ? 'km' : 'كم'}`;

            const carPlate = document.getElementById('cpCarPlate');
            if (carPlate) carPlate.innerText = `${car.plateNumber || car.chassisNumber || (isEn ? 'Not specified' : 'غير مسجل')}`;

            const carEngineOil = document.getElementById('cpCarEngineOil');
            if (carEngineOil) carEngineOil.innerText = `${car.engine || '-'} | ${car.oilViscosity || '-'}`;

            const kpiTotal = document.getElementById('cpKpiTotalSpend');
            if (kpiTotal) kpiTotal.innerText = `${summary.totalCost.toLocaleString()} ${currency}`;

            const kpiMaint = document.getElementById('cpKpiMaintSpend');
            if (kpiMaint) kpiMaint.innerText = `${summary.maintCost.toLocaleString()} ${currency}`;

            const kpiMaintCnt = document.getElementById('cpKpiMaintCount');
            if (kpiMaintCnt) kpiMaintCnt.innerText = `(${summary.maintCount} ${isEn ? 'invoices' : 'فواتير'})`;

            const kpiFuel = document.getElementById('cpKpiFuelSpend');
            if (kpiFuel) kpiFuel.innerText = `${summary.fuelCost.toLocaleString()} ${currency}`;

            const kpiFuelCnt = document.getElementById('cpKpiFuelCount');
            if (kpiFuelCnt) kpiFuelCnt.innerText = `(${summary.fuelCount} ${isEn ? 'fill-ups' : 'تفويلات'} / ${summary.totalLiters} ${isEn ? 'L' : 'لتر'})`;

            const kpiOps = document.getElementById('cpKpiTotalOps');
            if (kpiOps) kpiOps.innerText = `${summary.totalCount} ${isEn ? 'records' : 'عملية'}`;

            const periodSpan = document.getElementById('cpKpiPeriodSpan');
            if (periodSpan) periodSpan.innerText = fromDate || toDate ? (isEn ? 'Filtered Period' : 'فترة محددة') : (isEn ? 'All Time' : 'شامل كل السجلات');

            const lTotal = document.getElementById('cpLblKpiTotalSpend');
            if (lTotal) lTotal.innerText = isEn ? 'Total Spending' : 'إجمالي المصروفات';

            const lMaint = document.getElementById('cpLblKpiMaintSpend');
            if (lMaint) lMaint.innerText = isEn ? 'Maintenance Spending' : 'مصروفات الصيانة';

            const lFuel = document.getElementById('cpLblKpiFuelSpend');
            if (lFuel) lFuel.innerText = isEn ? 'Fuel Spending' : 'مصروفات الوقود';

            const lOps = document.getElementById('cpLblKpiTotalOps');
            if (lOps) lOps.innerText = isEn ? 'Included Operations' : 'العمليات المشمولة';

            const thD = document.getElementById('cpThDate');
            if (thD) thD.innerText = isEn ? 'Date' : 'التاريخ (Date)';

            const thT = document.getElementById('cpThType');
            if (thT) thT.innerText = isEn ? 'Type' : 'النوع (Type)';

            const thDesc = document.getElementById('cpThDescription');
            if (thDesc) thDesc.innerText = isEn ? 'Description / Service' : 'البيان / الخدمة (Description)';

            const thOdo = document.getElementById('cpThOdo');
            if (thOdo) thOdo.innerText = isEn ? 'Odometer' : 'العداد (Odometer)';

            const thLoc = document.getElementById('cpThLocation');
            if (thLoc) thLoc.innerText = isEn ? 'Workshop / Station' : 'المركز / المحطة (Location)';

            const thAmt = document.getElementById('cpThAmount');
            if (thAmt) thAmt.innerText = isEn ? 'Amount' : 'التكلفة (Amount)';

            const tfootLbl = document.getElementById('cpTfootTotalLabel');
            if (tfootLbl) tfootLbl.innerText = isEn ? 'Grand Total Spending for the Selected Period:' : 'الإجمالي النهائي للمصروفات خلال الفترة:';

            const tfootAmt = document.getElementById('cpTfootTotalAmount');
            if (tfootAmt) tfootAmt.innerText = `${summary.totalCost.toLocaleString()} ${currency}`;

            const signOff = document.getElementById('cpSignOff');
            if (signOff) signOff.innerText = isEn ? 'Authorized Owner / Fleet Manager Signature: ...................................' : 'توقيع المالك / المعتمد: ...................................';

            const printTb = document.getElementById('customPrintTableBody');
            if (printTb) {
                printTb.innerHTML = '';
                if (items.length === 0) {
                    printTb.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400 font-semibold">${isEn ? 'No records found for the selected criteria.' : 'لا توجد سجلات مسجلة ضمن النطاق المحدد.'}</td></tr>`;
                } else {
                    items.forEach((it, idx) => {
                        let typeBadge = '';
                        if (it.type === 'PM') {
                            typeBadge = `<span style="display:inline-block; padding:2px 7px; border-radius:6px; font-weight:900; font-size:10px; background-color:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">PM (${isEn ? 'Prev' : 'وقائية'})</span>`;
                        } else if (it.type === 'CM') {
                            typeBadge = `<span style="display:inline-block; padding:2px 7px; border-radius:6px; font-weight:900; font-size:10px; background-color:#ffe4e6; color:#be123c; border:1px solid #fecdd3;">CM (${isEn ? 'Corr' : 'عاجلة'})</span>`;
                        } else {
                            typeBadge = `<span style="display:inline-block; padding:2px 7px; border-radius:6px; font-weight:900; font-size:10px; background-color:#fef3c7; color:#b45309; border:1px solid #fde68a;">FUEL (${isEn ? 'Gas' : 'وقود'})</span>`;
                        }

                        const odoFormatted = it.odometer ? `${Number(it.odometer).toLocaleString()} ${isEn ? 'km' : 'كم'}` : '-';

                        printTb.innerHTML += `
                            <tr>
                                <td class="p-2.5 text-center text-slate-400 font-bold">${idx + 1}</td>
                                <td class="p-2.5 whitespace-nowrap text-slate-700 font-semibold">${it.date || '-'}</td>
                                <td class="p-2.5 whitespace-nowrap">${typeBadge}</td>
                                <td class="p-2.5 font-bold text-slate-800">
                                    <div>${it.title}</div>
                                    ${it.details ? `<div class="text-[10px] text-slate-500 font-normal mt-0.5">${it.details}</div>` : ''}
                                </td>
                                <td class="p-2.5 whitespace-nowrap text-slate-600">${odoFormatted}</td>
                                <td class="p-2.5 text-slate-700">${it.location || '-'}</td>
                                <td class="p-2.5 text-end font-bold text-emerald-800 whitespace-nowrap">${it.cost.toLocaleString()} ${currency}</td>
                            </tr>
                        `;
                    });
                }
            }

            const techPrint = document.getElementById('reportPrintSection');
            if (techPrint) techPrint.classList.remove('active-print-target');
            printSection.classList.add('active-print-target');

            window.print();
        }

        function exportCustomReportCSV() {
            const { items } = getFilteredReportData();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (!items || items.length === 0) {
                alert(isEn ? 'No records to export in the selected range.' : 'لا توجد سجلات لتصديرها في النطاق المحدد.');
                return;
            }

            const headers = isEn
                ? ['#', 'Date', 'Type', 'Description', 'Odometer', 'Workshop/Station', 'Cost (EGP)', 'Notes']
                : ['م', 'التاريخ', 'النوع', 'البيان والخدمة', 'قراءة العداد', 'المركز أو المحطة', 'التكلفة (ج.م)', 'ملاحظات وتفاصيل'];

            const rows = items.map((it, idx) => [
                idx + 1,
                `"${it.date || ''}"`,
                `"${it.type || ''}"`,
                `"${(it.title || '').replace(/"/g, '""')}"`,
                `"${it.odometer || ''}"`,
                `"${(it.location || '').replace(/"/g, '""')}"`,
                it.cost || 0,
                `"${(it.details || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `MotorCare_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof selectExportReportType !== 'undefined') window.selectExportReportType = selectExportReportType; } catch (e) {}
try { if (typeof executePrintCustomReport !== 'undefined') window.executePrintCustomReport = executePrintCustomReport; } catch (e) {}
try { if (typeof openExportReportsModal !== 'undefined') window.openExportReportsModal = openExportReportsModal; } catch (e) {}
try { if (typeof exportCustomReportCSV !== 'undefined') window.exportCustomReportCSV = exportCustomReportCSV; } catch (e) {}
try { if (typeof applyReportDatePreset !== 'undefined') window.applyReportDatePreset = applyReportDatePreset; } catch (e) {}
try { if (typeof onCustomReportDateChanged !== 'undefined') window.onCustomReportDateChanged = onCustomReportDateChanged; } catch (e) {}
try { if (typeof closeExportReportsModal !== 'undefined') window.closeExportReportsModal = closeExportReportsModal; } catch (e) {}
try { if (typeof getFilteredReportData !== 'undefined') window.getFilteredReportData = getFilteredReportData; } catch (e) {}
try { if (typeof updateCustomReportPreview !== 'undefined') window.updateCustomReportPreview = updateCustomReportPreview; } catch (e) {}
try { if (typeof printVehicleReport !== 'undefined') window.printVehicleReport = printVehicleReport; } catch (e) {}
