        /* ==========================================================================
           [MODULE 15] التقارير المالية والرسوم البيانية مع نظام الفلترة الزمنية والتقويم الذكي
           ========================================================================== */
        let analyticsFilterMode = 'current'; // 'current' | 'all' | 'range' | 'single' | 'customDate'

        function setAnalyticsFilterQuick(mode) {
            analyticsFilterMode = mode;
            const currentYear = new Date().getFullYear();

            const btnCurrent = document.getElementById('analyticsQuickBtnCurrent');
            const btnAll = document.getElementById('analyticsQuickBtnAll');
            const btnRange = document.getElementById('analyticsQuickBtnRange');
            const btnCustomDate = document.getElementById('analyticsQuickBtnCustomDate');

            const singleBox = document.getElementById('analyticsSingleYearBox');
            const rangeBox = document.getElementById('analyticsRangeYearBox');
            const customDateBox = document.getElementById('analyticsCustomDateBox');
            const yearInput = document.getElementById('analyticsYearInput');
            const fromDateInput = document.getElementById('analyticsFromDate');
            const toDateInput = document.getElementById('analyticsToDate');

            // Reset button active classes
            const activeClasses = ['bg-sky-500', 'text-white', 'shadow-2xs'];
            const inactiveClasses = ['text-slate-600', 'dark:text-slate-300', 'hover:bg-white', 'dark:hover:bg-slate-800'];

            [btnCurrent, btnAll, btnRange, btnCustomDate].forEach(b => {
                if (b) {
                    b.classList.remove(...activeClasses);
                    b.classList.add(...inactiveClasses);
                }
            });

            if (mode === 'current') {
                if (btnCurrent) {
                    btnCurrent.classList.remove(...inactiveClasses);
                    btnCurrent.classList.add(...activeClasses);
                }
                if (singleBox) singleBox.classList.remove('hidden');
                if (rangeBox) rangeBox.classList.add('hidden');
                if (customDateBox) customDateBox.classList.add('hidden');
                if (yearInput) yearInput.value = currentYear;
            } else if (mode === 'all') {
                if (btnAll) {
                    btnAll.classList.remove(...inactiveClasses);
                    btnAll.classList.add(...activeClasses);
                }
                if (singleBox) singleBox.classList.remove('hidden');
                if (rangeBox) rangeBox.classList.add('hidden');
                if (customDateBox) customDateBox.classList.add('hidden');
                if (yearInput) yearInput.value = '';
            } else if (mode === 'range') {
                if (btnRange) {
                    btnRange.classList.remove(...inactiveClasses);
                    btnRange.classList.add(...activeClasses);
                }
                if (singleBox) singleBox.classList.add('hidden');
                if (rangeBox) rangeBox.classList.remove('hidden');
                if (customDateBox) customDateBox.classList.add('hidden');

                const fromInput = document.getElementById('analyticsFromYearInput');
                const toInput = document.getElementById('analyticsToYearInput');
                if (yearInput) yearInput.max = currentYear;
                if (fromInput) {
                    fromInput.max = currentYear;
                    if (!fromInput.value || parseInt(fromInput.value) > currentYear) fromInput.value = currentYear - 2;
                }
                if (toInput) {
                    toInput.max = currentYear;
                    if (!toInput.value || parseInt(toInput.value) > currentYear) toInput.value = currentYear;
                }
            } else if (mode === 'customDate') {
                if (btnCustomDate) {
                    btnCustomDate.classList.remove(...inactiveClasses);
                    btnCustomDate.classList.add(...activeClasses);
                }
                if (singleBox) singleBox.classList.add('hidden');
                if (rangeBox) rangeBox.classList.add('hidden');
                if (customDateBox) customDateBox.classList.remove('hidden');

                // تعيين التواريخ الافتراضية إذا كانت فارغة: من بداية السنة الحالية إلى تاريخ اليوم
                if (fromDateInput && !fromDateInput.value) {
                    fromDateInput.value = `${currentYear}-01-01`;
                }
                if (toDateInput && !toDateInput.value) {
                    const today = new Date();
                    const y = today.getFullYear();
                    const m = String(today.getMonth() + 1).padStart(2, '0');
                    const d = String(today.getDate()).padStart(2, '0');
                    toDateInput.value = `${y}-${m}-${d}`;
                }
            }

            renderCharts();
        }

        function onAnalyticsDateInputChange() {
            analyticsFilterMode = 'customDate';
            const btnCurrent = document.getElementById('analyticsQuickBtnCurrent');
            const btnAll = document.getElementById('analyticsQuickBtnAll');
            const btnRange = document.getElementById('analyticsQuickBtnRange');
            const btnCustomDate = document.getElementById('analyticsQuickBtnCustomDate');
            const activeClasses = ['bg-sky-500', 'text-white', 'shadow-2xs'];
            const inactiveClasses = ['text-slate-600', 'dark:text-slate-300', 'hover:bg-white', 'dark:hover:bg-slate-800'];

            [btnCurrent, btnAll, btnRange].forEach(b => {
                if (b) {
                    b.classList.remove(...activeClasses);
                    b.classList.add(...inactiveClasses);
                }
            });
            if (btnCustomDate) {
                btnCustomDate.classList.remove(...inactiveClasses);
                btnCustomDate.classList.add(...activeClasses);
            }

            renderCharts();
        }

        let _analyticsDebounceTimer = null;
        function onAnalyticsYearInputChange() {
            clearTimeout(_analyticsDebounceTimer);
            _analyticsDebounceTimer = setTimeout(() => {
                const currentYear = new Date().getFullYear();
                const yearInput = document.getElementById('analyticsYearInput');
                const fromInput = document.getElementById('analyticsFromYearInput');
                const toInput = document.getElementById('analyticsToYearInput');
                const rangeBox = document.getElementById('analyticsRangeYearBox');

                if (yearInput) {
                    yearInput.max = currentYear;
                    if (parseInt(yearInput.value) > currentYear) yearInput.value = currentYear;
                }
                if (fromInput) {
                    fromInput.max = currentYear;
                    if (parseInt(fromInput.value) > currentYear) fromInput.value = currentYear;
                }
                if (toInput) {
                    toInput.max = currentYear;
                    if (parseInt(toInput.value) > currentYear) toInput.value = currentYear;
                }

                if (rangeBox && !rangeBox.classList.contains('hidden')) {
                    analyticsFilterMode = 'range';
                } else if (yearInput && yearInput.value.trim().length >= 4) {
                    analyticsFilterMode = 'single';
                    const btnCurrent = document.getElementById('analyticsQuickBtnCurrent');
                    const btnAll = document.getElementById('analyticsQuickBtnAll');
                    const btnRange = document.getElementById('analyticsQuickBtnRange');
                    const btnCustomDate = document.getElementById('analyticsQuickBtnCustomDate');
                    [btnCurrent, btnAll, btnRange, btnCustomDate].forEach(b => {
                        if (b) {
                            b.classList.remove('bg-sky-500', 'text-white', 'shadow-2xs');
                            b.classList.add('text-slate-600', 'dark:text-slate-300');
                        }
                    });
                }
                renderCharts();
            }, 300);
        }

        // Backward-compatible stub
        function populateAnalyticsYears() {}

        function renderCharts() {
            if (!window.Chart || currentActiveTab !== 'analytics') return;
            const car = getCurrentCar();
            const isDark = appState.darkMode;
            const isEn = appState.lang === 'en';
            const textColor = isDark ? '#cbd5e1' : '#475569';
            const currency = isEn ? 'EGP' : 'ج.م';
            const currentYear = new Date().getFullYear();

            const monthsNames = isEn 
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

            // 1. تحديد معيار الفلترة والتسمية
            let barLabel = isEn ? 'Total Expenses (All Years)' : 'إجمالي المصروفات (لكل السنوات)';
            let isRecordIncluded = (dStr) => true;

            // إعدادات المتغيرات للرسم البياني للأعمدة
            let chartLabels = [];
            let chartData = [];

            if (analyticsFilterMode === 'current') {
                isRecordIncluded = (dStr) => {
                    if (!dStr) return false;
                    const d = new Date(dStr);
                    return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
                };
                barLabel = isEn ? `Monthly Expenses for ${currentYear} (${currency})` : `الإنفاق الشهري لعام ${currentYear} (${currency})`;
                chartLabels = [...monthsNames];
                chartData = Array(12).fill(0);
            } else if (analyticsFilterMode === 'single') {
                const inputVal = parseInt(document.getElementById('analyticsYearInput')?.value);
                const targetY = (!isNaN(inputVal) && inputVal > 1950) ? inputVal : currentYear;
                isRecordIncluded = (dStr) => {
                    if (!dStr) return false;
                    const d = new Date(dStr);
                    return !isNaN(d.getTime()) && d.getFullYear() === targetY;
                };
                barLabel = isEn ? `Monthly Expenses for ${targetY} (${currency})` : `الإنفاق الشهري لعام ${targetY} (${currency})`;
                chartLabels = [...monthsNames];
                chartData = Array(12).fill(0);
            } else if (analyticsFilterMode === 'range') {
                const fromY = Math.min(parseInt(document.getElementById('analyticsFromYearInput')?.value) || (currentYear - 2), currentYear);
                const toY = Math.min(parseInt(document.getElementById('analyticsToYearInput')?.value) || currentYear, currentYear);
                const minY = Math.min(fromY, toY);
                const maxY = Math.min(Math.max(fromY, toY), currentYear);
                isRecordIncluded = (dStr) => {
                    if (!dStr) return false;
                    const d = new Date(dStr);
                    if (isNaN(d.getTime())) return false;
                    const y = d.getFullYear();
                    return y >= minY && y <= maxY;
                };
                barLabel = isEn ? `Expenses for Period (${minY} - ${maxY}) (${currency})` : `المصروفات للفترة (${minY} - ${maxY}) (${currency})`;

                if (minY === maxY) {
                    chartLabels = [...monthsNames];
                    chartData = Array(12).fill(0);
                } else {
                    for (let y = minY; y <= maxY; y++) {
                        chartLabels.push(String(y));
                        chartData.push(0);
                    }
                }
            } else if (analyticsFilterMode === 'customDate') {
                const fromDateVal = document.getElementById('analyticsFromDate')?.value || '';
                const toDateVal = document.getElementById('analyticsToDate')?.value || '';
                const fromTs = fromDateVal ? new Date(fromDateVal + 'T00:00:00').getTime() : null;
                const toTs = toDateVal ? new Date(toDateVal + 'T23:59:59.999').getTime() : null;

                isRecordIncluded = (dStr) => {
                    if (!dStr) return false;
                    const itemTs = new Date(dStr).getTime();
                    if (isNaN(itemTs)) return false;
                    if (fromTs !== null && itemTs < fromTs) return false;
                    if (toTs !== null && itemTs > toTs) return false;
                    return true;
                };

                if (fromDateVal && toDateVal) {
                    barLabel = isEn ? `Expenses (${fromDateVal} → ${toDateVal}) (${currency})` : `المصروفات للفترة (${fromDateVal} إلى ${toDateVal}) (${currency})`;
                } else if (fromDateVal) {
                    barLabel = isEn ? `Expenses from ${fromDateVal} (${currency})` : `المصروفات من ${fromDateVal} (${currency})`;
                } else if (toDateVal) {
                    barLabel = isEn ? `Expenses up to ${toDateVal} (${currency})` : `المصروفات حتى ${toDateVal} (${currency})`;
                } else {
                    barLabel = isEn ? `All Time Expenses (${currency})` : `المصروفات الشاملة (${currency})`;
                }

                // بناء التدرج الزمني التفاعلي حسب الفترة المحددة
                if (fromDateVal && toDateVal) {
                    const dFrom = new Date(fromDateVal);
                    const dTo = new Date(toDateVal);
                    const startY = dFrom.getFullYear();
                    const startM = dFrom.getMonth();
                    const endY = dTo.getFullYear();
                    const endM = dTo.getMonth();
                    const monthDiff = (endY - startY) * 12 + (endM - startM);

                    if (monthDiff >= 0 && monthDiff <= 24) {
                        // تجميع شهري دقيق للفترة المحددة
                        let curY = startY;
                        let curM = startM;
                        for (let i = 0; i <= monthDiff; i++) {
                            const lbl = `${monthsNames[curM]} ${monthDiff > 11 ? curY : ''}`.trim();
                            chartLabels.push(lbl);
                            chartData.push(0);
                            curM++;
                            if (curM > 11) {
                                curM = 0;
                                curY++;
                            }
                        }
                    } else if (monthDiff > 24) {
                        // تجميع سنوي إذا كانت الفترة أكبر من سنتين
                        for (let y = startY; y <= endY; y++) {
                            chartLabels.push(String(y));
                            chartData.push(0);
                        }
                    } else {
                        chartLabels = [...monthsNames];
                        chartData = Array(12).fill(0);
                    }
                } else {
                    chartLabels = [...monthsNames];
                    chartData = Array(12).fill(0);
                }
            } else { // 'all'
                isRecordIncluded = () => true;
                barLabel = isEn ? `Total Expenses Across All Years (${currency})` : `إجمالي المصروفات (لكل السنوات) (${currency})`;
                chartLabels = [...monthsNames];
                chartData = Array(12).fill(0);
            }

            // 2. تصفية وحساب مصفوفات المصروفات والصيانات والوقود
            let parts = 0, labor = 0, fuel = 0;
            let maintCount = 0, fuelCount = 0;

            const addAmountToChart = (dStr, amount) => {
                if (!dStr || !amount) return;
                const d = new Date(dStr);
                if (isNaN(d.getTime())) return;

                if (analyticsFilterMode === 'current' || analyticsFilterMode === 'single' || (analyticsFilterMode === 'range' && chartLabels.length === 12)) {
                    chartData[d.getMonth()] += amount;
                } else if (analyticsFilterMode === 'range') {
                    const yIdx = chartLabels.indexOf(String(d.getFullYear()));
                    if (yIdx !== -1) chartData[yIdx] += amount;
                } else if (analyticsFilterMode === 'customDate') {
                    const fromDateVal = document.getElementById('analyticsFromDate')?.value || '';
                    const toDateVal = document.getElementById('analyticsToDate')?.value || '';
                    if (fromDateVal && toDateVal) {
                        const dFrom = new Date(fromDateVal);
                        const dTo = new Date(toDateVal);
                        const monthDiff = (dTo.getFullYear() - dFrom.getFullYear()) * 12 + (dTo.getMonth() - dFrom.getMonth());
                        if (monthDiff >= 0 && monthDiff <= 24) {
                            const itemMonthDiff = (d.getFullYear() - dFrom.getFullYear()) * 12 + (d.getMonth() - dFrom.getMonth());
                            if (itemMonthDiff >= 0 && itemMonthDiff < chartData.length) {
                                chartData[itemMonthDiff] += amount;
                            }
                        } else if (monthDiff > 24) {
                            const yIdx = chartLabels.indexOf(String(d.getFullYear()));
                            if (yIdx !== -1) chartData[yIdx] += amount;
                        } else {
                            chartData[d.getMonth()] += amount;
                        }
                    } else {
                        chartData[d.getMonth()] += amount;
                    }
                } else { // 'all'
                    chartData[d.getMonth()] += amount;
                }
            };

            if (car && Array.isArray(car.history)) {
                car.history.forEach(h => {
                    if (h && h.date && isRecordIncluded(h.date)) {
                        const pCost = Number(h.partsCost) || 0;
                        const lCost = Number(h.laborCost) || 0;
                        const tCost = Number(h.totalCost) || (pCost + lCost) || 0;
                        parts += pCost;
                        labor += lCost;
                        maintCount++;
                        addAmountToChart(h.date, tCost);
                    }
                });
            }

            if (car && Array.isArray(car.fuelLogs)) {
                car.fuelLogs.forEach(f => {
                    if (f && f.date && isRecordIncluded(f.date)) {
                        const fCost = Number(f.cost) || 0;
                        fuel += fCost;
                        fuelCount++;
                        addAmountToChart(f.date, fCost);
                    }
                });
            }

            const totalCost = parts + labor + fuel;
            const totalCount = maintCount + fuelCount;

            // 3. تحديث ملخص الإحصائيات الفوري في الـ DOM
            const kpiTotalEl = document.getElementById('analyticsKpiTotalCost');
            if (kpiTotalEl) kpiTotalEl.innerText = `${totalCost.toLocaleString()} ${currency}`;

            const kpiMaintEl = document.getElementById('analyticsKpiMaintCost');
            if (kpiMaintEl) kpiMaintEl.innerText = `${(parts + labor).toLocaleString()} ${currency}`;

            const kpiFuelEl = document.getElementById('analyticsKpiFuelCost');
            if (kpiFuelEl) kpiFuelEl.innerText = `${fuel.toLocaleString()} ${currency}`;

            const kpiCountEl = document.getElementById('analyticsKpiCount');
            if (kpiCountEl) kpiCountEl.innerText = `${totalCount} ${isEn ? 'invoices' : 'فاتورة'}`;

            // 4. رسم توزيع التكاليف الكلية (دائري Donut Chart)
            const ctxD = document.getElementById('costBreakdownChart')?.getContext('2d');
            if (ctxD) {
                try {
                    if (typeof costChartInstance !== 'undefined' && costChartInstance) costChartInstance.destroy();
                    else if (window.costChartInstance) window.costChartInstance.destroy();
                } catch (e) {}

                const labelsD = isEn ? ['Spare Parts', 'Labor / Work', 'Fuel'] : ['قطع الغيار', 'المصنعيات', 'الوقود والبنزين'];
                const hasData = totalCost > 0;

                const newCostChart = new Chart(ctxD, {
                    type: 'doughnut',
                    data: {
                        labels: hasData ? labelsD : [isEn ? 'No Expenses' : 'لا توجد مصروفات'],
                        datasets: [{ 
                            data: hasData ? [parts, labor, fuel] : [1], 
                            backgroundColor: hasData ? ['#0284c7', '#10b981', '#f59e0b'] : [isDark ? '#334155' : '#e2e8f0'],
                            borderWidth: isDark ? 0 : 2
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                            legend: { 
                                labels: { color: textColor, font: { family: 'inherit', weight: 'bold' } } 
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        if (!hasData) return isEn ? 'No expenses recorded in this period' : 'لا توجد مصروفات مسجلة في هذه الفترة';
                                        const val = Number(context.raw) || 0;
                                        const pct = totalCost > 0 ? Math.round((val / totalCost) * 100) : 0;
                                        return ` ${context.label}: ${val.toLocaleString()} ${currency} (${pct}%)`;
                                    }
                                }
                            }
                        } 
                    }
                });
                try { costChartInstance = newCostChart; } catch (e) {}
                window.costChartInstance = newCostChart;
            }

            // 5. رسم الإنفاق الشهري أو الزمني (أعمدة Bar Chart)
            const ctxB = document.getElementById('monthlyCostChart')?.getContext('2d');
            if (ctxB) {
                try {
                    if (typeof monthlyChartInstance !== 'undefined' && monthlyChartInstance) monthlyChartInstance.destroy();
                    else if (window.monthlyChartInstance) window.monthlyChartInstance.destroy();
                } catch (e) {}

                const newMonthlyChart = new Chart(ctxB, {
                    type: 'bar',
                    data: {
                        labels: chartLabels,
                        datasets: [{ 
                            label: barLabel, 
                            data: chartData, 
                            backgroundColor: '#38bdf8', 
                            borderRadius: 6 
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        scales: { 
                            x: { 
                                ticks: { color: textColor, font: { family: 'inherit', weight: 'bold' } },
                                grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                            }, 
                            y: { 
                                ticks: { 
                                    color: textColor, 
                                    font: { family: 'inherit' },
                                    callback: function(val) { return Number(val).toLocaleString(); }
                                },
                                grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                            } 
                        },
                        plugins: { 
                            legend: { 
                                labels: { color: textColor, font: { family: 'inherit', weight: 'bold' } } 
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const val = Number(context.raw) || 0;
                                        return ` ${context.dataset.label || ''}: ${val.toLocaleString()} ${currency}`;
                                    }
                                }
                            }
                        }
                    }
                });
                try { monthlyChartInstance = newMonthlyChart; } catch (e) {}
                window.monthlyChartInstance = newMonthlyChart;
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { 
    if (typeof renderCharts !== 'undefined') window.renderCharts = renderCharts; 
    if (typeof setAnalyticsFilterQuick !== 'undefined') window.setAnalyticsFilterQuick = setAnalyticsFilterQuick;
    if (typeof onAnalyticsYearInputChange !== 'undefined') window.onAnalyticsYearInputChange = onAnalyticsYearInputChange;
    if (typeof onAnalyticsDateInputChange !== 'undefined') window.onAnalyticsDateInputChange = onAnalyticsDateInputChange;
    if (typeof populateAnalyticsYears !== 'undefined') window.populateAnalyticsYears = populateAnalyticsYears;
    if (typeof analyticsFilterMode !== 'undefined') {
        try {
            Object.defineProperty(window, 'analyticsFilterMode', {
                get: () => analyticsFilterMode,
                set: (v) => { analyticsFilterMode = v; },
                configurable: true
            });
        } catch (e) {
            window.analyticsFilterMode = analyticsFilterMode;
        }
    }
} catch (e) {}
