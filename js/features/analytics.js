        /* ==========================================================================
           [MODULE 15] التقارير المالية والرسوم البيانية مع دعم اللغات (Analytics & Charts)
           ========================================================================== */
        function renderCharts() {
            if (!window.Chart || currentActiveTab !== 'analytics') return;
            const car = getCurrentCar();
            const isDark = appState.darkMode;
            const isEn = appState.lang === 'en';
            const textColor = isDark ? '#cbd5e1' : '#475569';

            const yearSelect = document.getElementById('analyticsYearSelect');
            const selectedYear = yearSelect ? yearSelect.value : 'all';

            let parts = 0, labor = 0, fuel = 0;
            let monthlyTotals = Array(12).fill(0);

            if (car && car.history) {
                car.history.forEach(h => {
                    if (h.date) {
                        const d = new Date(h.date);
                        const hYear = d.getFullYear().toString();
                        if (selectedYear === 'all' || hYear === selectedYear) {
                            parts += (h.partsCost || 0);
                            labor += (h.laborCost || 0);
                            monthlyTotals[d.getMonth()] += (h.totalCost || 0);
                        }
                    }
                });
            }

            if (car && car.fuelLogs) {
                car.fuelLogs.forEach(f => {
                    if (f.date) {
                        const d = new Date(f.date);
                        const fYear = d.getFullYear().toString();
                        if (selectedYear === 'all' || fYear === selectedYear) {
                            fuel += (f.cost || 0);
                            monthlyTotals[d.getMonth()] += (f.cost || 0);
                        }
                    }
                });
            }

            // 1. رسم توزيع التكاليف الكلية (دائري)
            const ctxD = document.getElementById('costBreakdownChart')?.getContext('2d');
            if (ctxD) {
                if (costChartInstance) costChartInstance.destroy();
                const labelsD = isEn ? ['Spare Parts', 'Labor / Work', 'Fuel'] : ['قطع الغيار', 'المصنعيات', 'الوقود والبنزين'];
                costChartInstance = new Chart(ctxD, {
                    type: 'doughnut',
                    data: {
                        labels: labelsD,
                        datasets: [{ 
                            data: [parts || 1, labor || 1, fuel || 1], 
                            backgroundColor: ['#0284c7', '#10b981', '#f59e0b'],
                            borderWidth: isDark ? 0 : 2
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } } }
                });
            }

            // 2. رسم الإنفاق الشهري (أعمدة)
            const ctxB = document.getElementById('monthlyCostChart')?.getContext('2d');
            if (ctxB) {
                if (monthlyChartInstance) monthlyChartInstance.destroy();
                const monthsLabels = isEn 
                    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                
                const barLabel = isEn 
                    ? (selectedYear === 'all' ? 'Total Expenses (All Years)' : `Total Expenses for ${selectedYear} (EGP)`)
                    : (selectedYear === 'all' ? 'إجمالي المصروفات الشهرية (لكل السنوات)' : `إجمالي المصروفات لعام ${selectedYear} (ج.م)`);

                monthlyChartInstance = new Chart(ctxB, {
                    type: 'bar',
                    data: {
                        labels: monthsLabels,
                        datasets: [{ 
                            label: barLabel, 
                            data: monthlyTotals, 
                            backgroundColor: '#38bdf8', 
                            borderRadius: 6 
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        scales: { 
                            x: { ticks: { color: textColor } }, 
                            y: { ticks: { color: textColor } } 
                        },
                        plugins: { legend: { labels: { color: textColor } } }
                    }
                });
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof renderCharts !== 'undefined') window.renderCharts = renderCharts; } catch (e) {}
