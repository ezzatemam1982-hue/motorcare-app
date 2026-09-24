        /* ==========================================================================
           محرك تقييم حالة بند الصيانة بدقة (Maintenance Item Evaluation Engine)
           ========================================================================== */
        function evaluateMaintenanceItem(item, currentOdo = 0, car = null) {
            if (!item) return { isOverdue: false, isApproaching: false, percent: 0, statusBadgeAr: '', statusBadgeEn: '', reasonTextAr: '', reasonTextEn: '' };

            const lastKm = Number(item.lastKm) || 0;
            const kmInterval = Number(item.kmInterval) || 10000;
            const diffKm = currentOdo - lastKm;
            const remainingKm = Math.max(0, kmInterval - diffKm);
            const overdueKm = Math.max(0, diffKm - kmInterval);
            const now = Date.now();

            // نوع البند عاجل طارئ (CM)
            if (item.type === 'CM') {
                const isResolved = !!item.isResolved;
                return {
                    isOverdue: !isResolved,
                    isApproaching: false,
                    isCritical: true,
                    percent: isResolved ? 0 : 100,
                    diffKm: 0,
                    kmInterval: 0,
                    remainingKm: 0,
                    overdueKm: 0,
                    statusBadgeAr: isResolved ? 'تم الإصلاح ✓' : 'مستحق فوراً (عطل طارئ)',
                    statusBadgeEn: isResolved ? 'Resolved ✓' : 'Urgent (CM Task)',
                    reasonTextAr: isResolved ? 'تم تسجيل وإصلاح هذا العطل' : 'عطل مسجل يتطلب الصيانة الفورية',
                    reasonTextEn: isResolved ? 'Issue resolved and logged' : 'Requires immediate corrective service'
                };
            }

            // فحص المسافة (الكيلومتر)
            let isOverdue = diffKm >= kmInterval;
            let isApproaching = !isOverdue && (remainingKm <= Math.min(1000, Math.max(300, Math.round(kmInterval * 0.15))));

            // فحص التاريخ بالشهور
            let dateOverdue = false;
            let dateApproaching = false;
            let daysRemaining = null;
            if (item.lastDate && item.monthInterval) {
                try {
                    const lastD = new Date(item.lastDate);
                    if (!isNaN(lastD.getTime())) {
                        const dueD = new Date(lastD);
                        dueD.setMonth(dueD.getMonth() + parseInt(item.monthInterval, 10));
                        daysRemaining = Math.ceil((dueD.getTime() - now) / (1000 * 60 * 60 * 24));
                        if (daysRemaining <= 0) {
                            dateOverdue = true;
                            isOverdue = true;
                        } else if (daysRemaining <= 15 && !isOverdue) {
                            dateApproaching = true;
                            isApproaching = true;
                        }
                    }
                } catch(e) {}
            }

            const percent = Math.min(100, Math.max(0, Math.round((diffKm / kmInterval) * 100)));

            let statusBadgeAr = 'حالة ممتازة ✓';
            let statusBadgeEn = 'Good ✓';
            let reasonTextAr = `متبقي ${remainingKm.toLocaleString()} كم`;
            let reasonTextEn = `${remainingKm.toLocaleString()} km remaining`;

            if (isOverdue) {
                statusBadgeAr = 'مستحق الآن ⚠️';
                statusBadgeEn = 'Overdue ⚠️';
                if (dateOverdue && overdueKm > 0) {
                    reasonTextAr = `تجاوز الموعد بـ ${overdueKm.toLocaleString()} كم وتجاوز التاريخ الموصى به`;
                    reasonTextEn = `Overdue by ${overdueKm.toLocaleString()} km & past recommended date`;
                } else if (dateOverdue) {
                    reasonTextAr = `تجاوز تاريخ الصيانة الدوري الموصى به (${item.monthInterval} شهر)`;
                    reasonTextEn = `Past recommended service period (${item.monthInterval} mos)`;
                } else {
                    reasonTextAr = `تجاوز الموعد بـ ${overdueKm.toLocaleString()} كم`;
                    reasonTextEn = `Overdue by ${overdueKm.toLocaleString()} km`;
                }
            } else if (isApproaching) {
                statusBadgeAr = 'اقترب الموعد ⏳';
                statusBadgeEn = 'Due Soon ⏳';
                if (daysRemaining !== null && daysRemaining <= 15) {
                    reasonTextAr = `اقترب موعد الفحص (متبقي ${daysRemaining} يوم أو ${remainingKm.toLocaleString()} كم)`;
                    reasonTextEn = `Service approaching (${daysRemaining} days or ${remainingKm.toLocaleString()} km left)`;
                } else {
                    reasonTextAr = `اقترب موعد الفحص (متبقي ${remainingKm.toLocaleString()} كم)`;
                    reasonTextEn = `Service approaching (${remainingKm.toLocaleString()} km left)`;
                }
            }

            return {
                isOverdue,
                isApproaching,
                percent,
                diffKm,
                kmInterval,
                remainingKm,
                overdueKm,
                dateOverdue,
                dateApproaching,
                daysRemaining,
                statusBadgeAr,
                statusBadgeEn,
                reasonTextAr,
                reasonTextEn
            };
        }

        function renderUrgentAlerts() {
            const car = getCurrentCar();
            const container = document.getElementById('urgentAlertsContainer');
            const list = document.getElementById('urgentAlertsList');
            if (!container || !list || !car || !car.catalog) return;

            const isEn = appState.lang === 'en';
            const clickTxt = isEn ? 'Click here to log this service / repair' : 'اضغط هنا لتسجيل إنجاز هذا البند الآن';

            const currentOdo = Number(car.odometer) || 0;
            const overdue = car.catalog.filter(i => evaluateMaintenanceItem(i, currentOdo, car).isOverdue);

            if (overdue.length > 0) {
                list.innerHTML = '';
                overdue.forEach(item => {
                    const evalResult = evaluateMaintenanceItem(item, currentOdo, car);
                    const isCM = item.type === 'CM';
                    const overdueBadgeTxt = isEn ? evalResult.statusBadgeEn : evalResult.statusBadgeAr;
                    const overdueReasonSub = isEn ? evalResult.reasonTextEn : evalResult.reasonTextAr;

                    list.innerHTML += `
                        <div onclick="openRecordModal('${item.id}')" class="p-3 ${isCM ? 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'} border rounded-2xl flex justify-between items-center text-xs cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-xs">
                            <div class="space-y-0.5">
                                <div class="flex items-center gap-1.5">
                                    ${isCM ? '<span class="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">CM</span>' : '<span class="px-1.5 py-0.5 rounded bg-sky-600 text-white font-black text-[9px]">PM</span>'}
                                    <span class="font-bold text-rose-700 dark:text-rose-300 block">${getLocalizedItemName(item)}</span>
                                </div>
                                <span class="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">${overdueReasonSub}</span>
                                <span class="text-[9px] text-rose-400 block">${clickTxt}</span>
                            </div>
                            <span class="text-[10px] font-black px-2.5 py-1 rounded-full ${isCM ? 'bg-rose-600 text-white' : 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'} shrink-0">${overdueBadgeTxt}</span>
                        </div>
                    `;
                });
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
            if (typeof MotorCareNotifications !== 'undefined' && MotorCareNotifications.updateUI) {
                MotorCareNotifications.updateUI(overdue.length);
            }
        }

        function calculateFuelEconomy(car) {
            const rateDisplay = document.getElementById('dashFuelRateDisplay');
            const subDisplay = document.getElementById('dashFuelSubDisplay');
            if (!rateDisplay) return;

            const isEn = appState.lang === 'en';

            if (!car.fuelLogs || car.fuelLogs.length < 2) {
                rateDisplay.innerText = isEn ? "-- L/100km" : "-- لتر/100كم";
                if (subDisplay) {
                    subDisplay.innerText = isEn ? "Requires 2 fill-ups to calculate" : "يتطلب تسجيل تفويلتين";
                    subDisplay.className = "text-[11px] text-slate-400 mt-1 block";
                }
                return;
            }

            const sorted = [...car.fuelLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer));
            const latest = sorted[sorted.length - 1];
            const previous = sorted[sorted.length - 2];

            const distance = Number(latest.odometer) - Number(previous.odometer);
            const liters = Number(latest.liters);

            if (distance > 0 && liters > 0) {
                const rate = ((liters / distance) * 100).toFixed(1);
                rateDisplay.innerText = isEn ? `${rate} L/100km` : `${rate} لتر/100كم`;

                if (subDisplay) {
                    if (rate < 7.0) {
                        subDisplay.innerText = isEn ? "Excellent Economy" : "استهلاك ممتاز واقتصادي";
                        subDisplay.className = "text-[11px] text-emerald-500 mt-1 block font-bold";
                    } else if (rate <= 9.5) {
                        subDisplay.innerText = isEn ? "Normal Consumption" : "استهلاك طبيعي ومعتدل";
                        subDisplay.className = "text-[11px] text-sky-500 mt-1 block font-bold";
                    } else {
                        subDisplay.innerText = isEn ? "High Consumption (Check Sensors)" : "استهلاك مرتفع (افحص الحساسات والرشاشات)";
                        subDisplay.className = "text-[11px] text-rose-500 mt-1 block font-bold";
                    }
                }
            } else {
                rateDisplay.innerText = isEn ? "-- L/100km" : "-- لتر/100كم";
                if (subDisplay) {
                    subDisplay.innerText = isEn ? "Irregular odometer readings" : "قراءات العداد غير منتظمة";
                    subDisplay.className = "text-[11px] text-slate-400 mt-1 block";
                }
            }
        }

        function updateDocumentsSummaryCard(car) {
            const titleEl = document.getElementById('dashDocsStatusTitle');
            const subEl = document.getElementById('dashDocsStatusSub');
            if (!titleEl || !car) return;
            const isEn = appState.lang === 'en';

            const d = car.documents || {};
            const docDates = [
                { date: d.vehicleLicense },
                { date: d.drivingLicense },
                { date: d.inspection },
                { date: d.insuranceDate }
            ];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let expiredCount = 0;
            let expiringCount = 0;
            let missingCount = 0;

            docDates.forEach(doc => {
                if (!doc.date) {
                    missingCount++;
                    return;
                }
                const target = new Date(doc.date);
                target.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) expiredCount++;
                else if (diffDays <= 30) expiringCount++;
            });

            if (expiredCount > 0) {
                titleEl.innerText = isEn ? `${expiredCount} Document(s) Expired!` : `يوجد ${expiredCount} وثيقة منتهية!`;
                titleEl.className = "text-sm font-black text-rose-600 mt-1";
                if (subEl) {
                    subEl.innerText = isEn ? "Requires immediate renewal" : "تتطلب التجديد الفوري";
                    subEl.className = "text-[11px] text-rose-500 mt-1 block font-bold";
                }
            } else if (expiringCount > 0) {
                titleEl.innerText = isEn ? `${expiringCount} Document(s) Expiring Soon` : `يوجد ${expiringCount} وثيقة تقترب من الانتهاء`;
                titleEl.className = "text-sm font-black text-amber-500 mt-1";
                if (subEl) {
                    subEl.innerText = isEn ? "Expires in less than 30 days" : "تنتهي خلال أقل من 30 يوماً";
                    subEl.className = "text-[11px] text-amber-500 mt-1 block font-bold";
                }
            } else if (missingCount === 4) {
                titleEl.innerText = isEn ? "Dates Not Set" : "لم يتم تسجيل التواريخ";
                titleEl.className = "text-sm font-black text-slate-400 mt-1";
                if (subEl) {
                    subEl.innerText = isEn ? "Click to set document dates" : "اضغط لتسجيل بيانات الرخص";
                    subEl.className = "text-[11px] text-sky-500 mt-1 block";
                }
            } else {
                titleEl.innerText = isEn ? "Valid & Verified" : "سارية وموثقة";
                titleEl.className = "text-sm font-black text-emerald-600 mt-1";
                if (subEl) {
                    subEl.innerText = isEn ? "All documents are valid" : "جميع المستندات سارية";
                    subEl.className = "text-[11px] text-slate-400 mt-1 block";
                }
            }
        }



        /* ==========================================================================
           [MODULE 09] إدارة البطارية وتاريخ صنع الإطارات
           ========================================================================== */
        function getBatteryStatus(car) {
            if (!car.battery || !car.battery.purchaseDate) return { status: 'UNKNOWN', daysLeft: 0, endStr: '-' };
            const p = new Date(car.battery.purchaseDate);
            p.setMonth(p.getMonth() + (parseInt(car.battery.warrantyMonths) || 18));
            const diff = Math.ceil((p - new Date()) / (86400000));
            return {
                status: diff < 0 ? 'EXPIRED' : (diff <= 30 ? 'EXPIRING' : 'VALID'),
                daysLeft: diff,
                endStr: p.toISOString().split('T')[0]
            };
        }

        function getTireDotStatus(code) {
            if (!code || code.length !== 4 || isNaN(code)) return { valid: false };
            const week = parseInt(code.substring(0, 2));
            const year = 2000 + parseInt(code.substring(2, 4));
            const now = new Date();
            const age = ((now.getFullYear() - year) + (now.getMonth() / 12)).toFixed(1);
            return { valid: true, age: parseFloat(age), week, year, expired: age >= 4.0 };
        }

        function isBatteryConfigured(car) {
            if (!car || !car.battery) return false;
            if (car.battery.isConfigured === false) return false;
            if (!car.battery.brand) return false;
            if (car.battery.brand.includes('كلورايد (Chloride Gold / Platinum) - رائد محلي') && !car.battery.isConfigured) return false;
            return true;
        }

        function isTiresConfigured(car) {
            if (!car || !car.tiresInfo) return false;
            if (car.tiresInfo.isConfigured === false) return false;
            if (!car.tiresInfo.size) return false;
            if (car.tiresInfo.size.includes('205/55 R16 ميشلان') && !car.tiresInfo.isConfigured) return false;
            return true;
        }

        function renderHardwareCards() {
            const car = getCurrentCar();
            if (!car) return;
            const isEn = appState.lang === 'en';

            const hasBattery = isBatteryConfigured(car);
            const hasTires = isTiresConfigured(car);

            const b = hasBattery ? getBatteryStatus(car) : { status: 'UNCONFIGURED', daysLeft: 0, endStr: '-' };
            const t = hasTires ? getTireDotStatus(car.tiresInfo?.dotCode) : { valid: false, expired: false, age: 0, week: 0, year: 0 };

            const bCard = document.getElementById('batteryCardContainer');
            if (bCard) {
                if (hasBattery) {
                    const battBadgeTxt = b.status === 'VALID' ? (isEn ? `Valid (${b.daysLeft} d)` : `ساري (${b.daysLeft} يوم)`) : (b.status === 'EXPIRING' ? (isEn ? 'Expiring Soon' : 'قارب على الانتهاء') : (isEn ? 'Expired Warranty' : 'منتهي الضمان'));

                    bCard.innerHTML = `
                        <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold"><i class="fa-solid fa-car-battery"></i></div>
                                <div>
                                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">${car.battery.brand}</h4>
                                    <span class="text-xs text-slate-400">${car.battery.capacity || ''} • ${car.battery.techType || ''}</span>
                                </div>
                            </div>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${battBadgeTxt}</span>
                        </div>
                        <div class="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                            <div class="flex justify-between"><span>${isEn ? 'Purchase Date:' : 'تاريخ الشراء:'}</span><strong>${car.battery.purchaseDate}</strong></div>
                            <div class="flex justify-between"><span>${isEn ? 'Warranty Period:' : 'فترة الضمان:'}</span><strong>${car.battery.warrantyMonths} ${isEn ? 'Months' : 'شهراً'}</strong></div>
                            <div class="flex justify-between"><span>${isEn ? 'Warranty Expiry:' : 'انتهاء الضمان:'}</span><strong class="text-sky-600 dark:text-sky-400">${b.endStr}</strong></div>
                        </div>
                        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <button onclick="openBatteryModal()" class="text-xs font-bold text-sky-600 hover:underline cursor-pointer"><i class="fa-solid fa-pen ml-1"></i> ${isEn ? 'Edit' : 'تعديل'}</button>
                            ${car.battery.warrantyImage ? `<button onclick="openImageViewer('${car.battery.warrantyImage}')" class="text-xs text-amber-600 font-bold hover:underline cursor-pointer"><i class="fa-solid fa-image ml-1"></i> ${isEn ? 'View Warranty' : 'عرض الضمان'}</button>` : ''}
                        </div>
                    `;
                } else {
                    bCard.innerHTML = `
                        <div class="p-4 flex flex-col items-center text-center justify-center space-y-2.5 my-1">
                            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
                                <i class="fa-solid fa-car-battery"></i>
                            </div>
                            <div>
                                <h4 class="font-black text-sm text-slate-900 dark:text-white">${isEn ? 'Battery Not Recorded' : 'لم يتم تسجيل البطارية بعد'}</h4>
                                <p class="text-[11px] text-slate-400 mt-0.5">${isEn ? 'Enter real brand, capacity & warranty for smart tracking.' : 'أدخل ماركة بطاريتك وتاريخ الضمان لمتابعة حالتها الحقيقية.'}</p>
                            </div>
                            <button onclick="openBatteryModal()" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer mt-1">
                                <i class="fa-solid fa-plus text-[10px]"></i>
                                <span>${isEn ? 'Record Battery Details' : 'تسجيل بيانات البطارية'}</span>
                            </button>
                        </div>
                    `;
                }
            }

            const tCard = document.getElementById('tiresCardContainer');
            if (tCard) {
                if (hasTires) {
                    const tireBadgeTxt = t.valid ? (t.expired ? (isEn ? `Expired (${t.age} yrs)` : `تالف (${t.age} سنة)`) : (isEn ? `Good (${t.age} yrs)` : `سليم (${t.age} سنة)`)) : (isEn ? 'DOT Undefined' : 'DOT غير محدد');

                    tCard.innerHTML = `
                        <div class="flex justify-between items-center mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold"><i class="fa-solid fa-circle-notch"></i></div>
                                <div>
                                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">${car.tiresInfo.size}</h4>
                                    <span class="text-xs text-slate-400">DOT: ${car.tiresInfo.dotCode || '-'}</span>
                                </div>
                            </div>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${t.valid && !t.expired ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${tireBadgeTxt}</span>
                        </div>
                        <div class="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                            <div class="flex justify-between">
                                <span>${isEn ? 'Recommended Pressure:' : 'ضغط الهواء الموصى:'}</span>
                                <strong>${isEn ? `Front ${car.tiresInfo.frontPsi} / Rear ${car.tiresInfo.rearPsi} PSI` : `أمام ${car.tiresInfo.frontPsi} PSI / خلف ${car.tiresInfo.rearPsi} PSI`}</strong>
                            </div>
                            <div class="flex justify-between">
                                <span>${isEn ? 'Manufacturing Date:' : 'تاريخ التصنيع:'}</span>
                                <strong>${t.valid ? (isEn ? `Week ${t.week} of Year ${t.year}` : `الأسبوع ${t.week} من عام ${t.year}`) : '-'}</strong>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <button onclick="openTiresDetailModal()" class="text-xs font-bold text-sky-600 hover:underline cursor-pointer"><i class="fa-solid fa-pen ml-1"></i> ${isEn ? 'Edit' : 'تعديل'}</button>
                            ${car.tiresInfo.warrantyImage ? `<button onclick="openImageViewer('${car.tiresInfo.warrantyImage}')" class="text-xs text-sky-600 font-bold hover:underline cursor-pointer"><i class="fa-solid fa-image ml-1"></i> ${isEn ? 'View Invoice' : 'عرض الفاتورة'}</button>` : ''}
                        </div>
                    `;
                } else {
                    tCard.innerHTML = `
                        <div class="p-4 flex flex-col items-center text-center justify-center space-y-2.5 my-1">
                            <div class="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold">
                                <i class="fa-solid fa-circle-notch"></i>
                            </div>
                            <div>
                                <h4 class="font-black text-sm text-slate-900 dark:text-white">${isEn ? 'Tires Not Recorded' : 'لم يتم تسجيل الإطارات بعد'}</h4>
                                <p class="text-[11px] text-slate-400 mt-0.5">${isEn ? 'Enter tire size & DOT code to monitor tire age & pressure.' : 'أدخل مقاس الكاوتش وتاريخ الإنتاج لمتابعة الصلاحية والضغط.'}</p>
                            </div>
                            <button onclick="openTiresDetailModal()" class="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer mt-1">
                                <i class="fa-solid fa-plus text-[10px]"></i>
                                <span>${isEn ? 'Record Tires Details' : 'تسجيل مقاس وبيانات الكاوتش'}</span>
                            </button>
                        </div>
                    `;
                }
            }

            const summary = document.getElementById('dashHardwareSummary');
            if (summary) {
                let battClass = 'text-slate-400';
                let battTxt = isEn ? 'Battery: Not Set' : 'البطارية: غير مسجلة';
                if (hasBattery) {
                    battClass = b.status === 'VALID' ? 'text-emerald-600' : 'text-rose-600';
                    battTxt = b.status === 'VALID' ? (isEn ? 'Battery Valid' : 'بطارية سارية') : (isEn ? 'Battery Expired' : 'بطارية منتهية');
                }

                let tireClass = 'text-slate-400';
                let tireTxt = isEn ? 'Tires: Not Set' : 'الكاوتش: غير مسجل';
                if (hasTires) {
                    tireClass = t.valid ? (t.expired ? 'text-rose-600' : 'text-emerald-600') : 'text-amber-600';
                    tireTxt = t.valid ? (t.expired ? (isEn ? `Tires Expired (${t.age}y)` : `كاوتش تالف (${t.age} سنة)`) : (isEn ? `Tires Good (${t.age}y)` : `كاوتش سليم (${t.age} سنة)`)) : (isEn ? 'Tires Recorded' : 'كاوتش مسجل');
                }

                summary.className = "text-sm font-black mt-1 flex items-center gap-1.5";
                summary.innerHTML = `<span class="${battClass}">${battTxt}</span> <span class="text-slate-400 font-normal">•</span> <span class="${tireClass}">${tireTxt}</span>`;
            }
        }

        // دالة استخراج مواصفات بطارية المصنع الرسمية (OEM Battery Spec Lookup)
        function getCarOemBatterySpec(brand, model, genIdx = 0) {
            if (!brand || !CAR_BRANDS_CATALOG[brand]) {
                return {
                    capacity: '60 Ah',
                    tech: 'SMF',
                    din: 'DIN60 (L2)',
                    polarity: 'L (سالب يسار)',
                    startStop: false,
                    notes: 'المواصفة القياسية الافتراضية للفئة المتوسطة',
                    genName: 'طراز عام',
                    engine: 'قياسي'
                };
            }
            const bData = CAR_BRANDS_CATALOG[brand];
            let mData = bData.models ? bData.models[model] : null;
            if (!mData && bData.models) {
                const mKeys = Object.keys(bData.models);
                const found = mKeys.find(k => k.toLowerCase() === (model || '').toLowerCase() || (model || '').toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes((model || '').toLowerCase()));
                if (found) mData = bData.models[found];
                else if (mKeys.length > 0) mData = bData.models[mKeys[0]];
            }
            if (!mData || !mData.generations || mData.generations.length === 0) {
                return {
                    capacity: '60 Ah',
                    tech: 'SMF',
                    din: 'DIN60 (L2)',
                    polarity: 'L (سالب يسار)',
                    startStop: false,
                    notes: 'المواصفة القياسية الافتراضية',
                    genName: model || '',
                    engine: '1.6L'
                };
            }
            const gen = mData.generations[genIdx] || mData.generations[0];
            return {
                capacity: gen.batteryCapacity || '60 Ah',
                tech: gen.batteryTech || 'SMF',
                din: gen.batteryDIN || 'DIN60 (L2)',
                polarity: gen.batteryPolarity || 'L (سالب يسار)',
                startStop: !!gen.startStop,
                notes: gen.batteryNotes || 'المواصفة الرسمية الموصى بها من كتالوج المصنع',
                genName: gen.name || '',
                engine: gen.engine || '',
                startYear: gen.startYear || '',
                endYear: gen.endYear || ''
            };
        }

        // تعبئة بطاقة التوصية الذكية ببطارية المصنع لسيارة المستخدم الحالية
        function populateBatteryOemRecommendation() {
            const card = document.getElementById('batteryOemRecommendationCard');
            if (!card) return;
            const car = getCurrentCar();
            const isEn = appState.lang === 'en';

            if (!car) {
                card.innerHTML = `
                    <div class="text-[11px] text-amber-800 dark:text-amber-200">
                        ${isEn ? 'Please add a vehicle to your garage to see OEM battery recommendations.' : 'أضف سيارة إلى كراجك أولاً لعرض مواصفة بطارية المصنع الموصى بها تلقائياً.'}
                    </div>
                `;
                return;
            }

            const spec = getCarOemBatterySpec(car.brand, car.model, car.generationIndex || 0);

            card.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-xs">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                        </span>
                        <div>
                            <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">
                                ${isEn ? 'OEM Factory Recommendation for your car:' : 'مواصفة المصنع الرسمية الموصى بها لسيارتك:'}
                            </span>
                            <strong class="text-xs font-black text-slate-900 dark:text-white">
                                ${car.brand} ${car.model} (${car.year || ''})
                            </strong>
                        </div>
                    </div>
                    <button type="button" onclick="applyOemBatteryRecommendation()" class="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-[10px] font-black shrink-0 transition-all shadow-xs cursor-pointer">
                        <i class="fa-solid fa-bolt ml-1"></i> ${isEn ? 'Apply OEM Spec' : 'تطبيق المواصفة لسيارتك ⚡'}
                    </button>
                </div>

                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="px-2 py-0.5 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black">
                        <i class="fa-solid fa-gauge-high ml-1"></i> ${spec.capacity}
                    </span>
                    <span class="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold">
                        تقنية: ${spec.tech}
                    </span>
                    <span class="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold">
                        مقاس: ${spec.din}
                    </span>

                </div>

                <p class="text-[10px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    * ${spec.notes}
                </p>
            `;
        }

        // تطبيق المواصفة الموصى بها بنقرة واحدة داخل النموذج
        function applyOemBatteryRecommendation() {
            const car = getCurrentCar();
            if (!car) return;
            const spec = getCarOemBatterySpec(car.brand, car.model, car.generationIndex || 0);

            const capSel = document.getElementById('batteryCapacitySelect');
            if (capSel) {
                // Find matching option
                let matched = false;
                for (let i = 0; i < capSel.options.length; i++) {
                    if (capSel.options[i].value.includes(spec.capacity) || spec.capacity.includes(capSel.options[i].value)) {
                        capSel.selectedIndex = i;
                        matched = true;
                        break;
                    }
                }
                if (!matched) capSel.value = spec.capacity;
            }

            const typeSel = document.getElementById('batteryTypeSelect');
            if (typeSel) {
                typeSel.value = spec.tech;
            }

            // التأثير البصري للتأكيد
            [capSel, typeSel].forEach(el => {
                if (el) {
                    el.classList.add('ring-2', 'ring-amber-500', 'bg-amber-50', 'dark:bg-amber-950/40');
                    setTimeout(() => {
                        el.classList.remove('ring-2', 'ring-amber-500', 'bg-amber-50', 'dark:bg-amber-950/40');
                    }, 1200);
                }
            });

            showNotification(appState.lang === 'en' ? `Applied OEM Battery: ${spec.capacity} (${spec.tech})` : `تم تطبيق مواصفة المصنع: ${spec.capacity} (${spec.tech}) بنجاح!`, 'success');
        }



        /* ==========================================================================
           [MODULE 12] محرك لزوجة زيت المحرك الديناميكي وتحديد القطع
           ========================================================================== */
        function onRecordPartChanged() {
            const isCM = document.querySelector('input[name="maintenanceType"]:checked')?.value === 'CM';
            const oilCont = document.getElementById('oilViscosityContainer');
            const tiresCont = document.getElementById('tiresCountContainer');
            const brakesCont = document.getElementById('brakesPlacementContainer');
            const plugsCont = document.getElementById('sparkPlugsTypeContainer');

            if (isCM) {
                if (oilCont) oilCont.classList.add('hidden');
                if (tiresCont) tiresCont.classList.add('hidden');
                if (brakesCont) brakesCont.classList.add('hidden');
                if (plugsCont) plugsCont.classList.add('hidden');
                return;
            }

            const sel = document.getElementById('recordPartSelect');
            if (!sel) return;
            const val = sel.value;

            if (oilCont) {
                if (val === 'oil') oilCont.classList.remove('hidden');
                else oilCont.classList.add('hidden');
            }
            if (tiresCont) {
                if (val === 'tires') tiresCont.classList.remove('hidden');
                else tiresCont.classList.add('hidden');
            }
            if (brakesCont) {
                if (val === 'brakes') brakesCont.classList.remove('hidden');
                else brakesCont.classList.add('hidden');
            }
            if (plugsCont) {
                if (val === 'spark_plugs' || val.includes('spark_plugs')) plugsCont.classList.remove('hidden');
                else plugsCont.classList.add('hidden');
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof evaluateMaintenanceItem !== 'undefined') window.evaluateMaintenanceItem = evaluateMaintenanceItem; } catch (e) {}
try { if (typeof renderUrgentAlerts !== 'undefined') window.renderUrgentAlerts = renderUrgentAlerts; } catch (e) {}
try { if (typeof calculateFuelEconomy !== 'undefined') window.calculateFuelEconomy = calculateFuelEconomy; } catch (e) {}
try { if (typeof updateDocumentsSummaryCard !== 'undefined') window.updateDocumentsSummaryCard = updateDocumentsSummaryCard; } catch (e) {}
try { if (typeof getBatteryStatus !== 'undefined') window.getBatteryStatus = getBatteryStatus; } catch (e) {}
try { if (typeof getTireDotStatus !== 'undefined') window.getTireDotStatus = getTireDotStatus; } catch (e) {}
try { if (typeof isBatteryConfigured !== 'undefined') window.isBatteryConfigured = isBatteryConfigured; } catch (e) {}
try { if (typeof isTiresConfigured !== 'undefined') window.isTiresConfigured = isTiresConfigured; } catch (e) {}
try { if (typeof renderHardwareCards !== 'undefined') window.renderHardwareCards = renderHardwareCards; } catch (e) {}
try { if (typeof getCarOemBatterySpec !== 'undefined') window.getCarOemBatterySpec = getCarOemBatterySpec; } catch (e) {}
try { if (typeof populateBatteryOemRecommendation !== 'undefined') window.populateBatteryOemRecommendation = populateBatteryOemRecommendation; } catch (e) {}
try { if (typeof applyOemBatteryRecommendation !== 'undefined') window.applyOemBatteryRecommendation = applyOemBatteryRecommendation; } catch (e) {}
try { if (typeof onRecordPartChanged !== 'undefined') window.onRecordPartChanged = onRecordPartChanged; } catch (e) {}
