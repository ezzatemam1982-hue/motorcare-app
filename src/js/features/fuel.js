        /* ==========================================================================
           [MODULE 14] سجل استهلاك البنزين
           ========================================================================== */
        let editingFuelId = null;

        function openFuelModal(fuelId = null) {
            const car = getCurrentCar();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (!car) {
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Please add a car to your garage first' : 'يرجى إضافة سيارة إلى الكراج أولاً لتسجيل الوقود', 'warning');
                }
                return;
            }
            editingFuelId = fuelId;
            
            const todayStr = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('fuelDateInput');
            const badge = document.getElementById('fuelReceiptBadge');
            const previewBox = document.getElementById('fuelImagePreviewBox');
            const previewThumb = document.getElementById('fuelImagePreviewThumb');

            if (fuelId) {
                const log = car.fuelLogs.find(f => f.id === fuelId);
                if (log) {
                    document.getElementById('fuelOdometerInput').value = log.odometer || '';
                    if (dateInput) dateInput.value = log.date || todayStr;
                    document.getElementById('fuelOctaneSelect').value = log.octane || 'بنزين 92';
                    document.getElementById('fuelLitersInput').value = log.liters || '';
                    document.getElementById('fuelCostInput').value = log.cost || '';
                    if (log.receiptImage) {
                        tempImages['fuel'] = log.receiptImage;
                        if (badge) badge.classList.remove('hidden');
                        if (previewBox) previewBox.classList.remove('hidden');
                        if (previewThumb) previewThumb.src = log.receiptImage;
                    } else {
                        clearFuelImageAttached();
                    }
                }
            } else {
                document.getElementById('fuelOdometerInput').value = (car && car.odometer) ? car.odometer : '';
                if (dateInput) dateInput.value = todayStr;
                document.getElementById('fuelOctaneSelect').value = 'بنزين 92';
                document.getElementById('fuelLitersInput').value = '';
                document.getElementById('fuelCostInput').value = '';
                clearFuelImageAttached();
            }
            document.getElementById('fuelModal').classList.remove('hidden');
        }

        function closeFuelModal() { 
            editingFuelId = null;
            document.getElementById('fuelModal').classList.add('hidden'); 
        }

        function saveFuelLog() {
            const car = getCurrentCar();
            if (!car) return;
            const isEn = appState.lang === 'en';

            const odoRaw = document.getElementById('fuelOdometerInput')?.value;
            const odo = MotorCareSecurity.parsePositiveInt(odoRaw, car.odometer, 0, 5000000);

            const litersRaw = document.getElementById('fuelLitersInput')?.value;
            const liters = MotorCareSecurity.parsePositiveFloat(litersRaw, 0, 0, 1000);

            const costRaw = document.getElementById('fuelCostInput')?.value;
            const cost = MotorCareSecurity.parsePositiveFloat(costRaw, 0, 0, 500000);

            if (liters <= 0) {
                alert(isEn ? 'Please enter a valid positive fuel amount in liters.' : 'يرجى إدخال كمية بنزين موجبة وصحيحة باللتر.');
                document.getElementById('fuelLitersInput')?.focus();
                return;
            }

            if (cost < 0) {
                alert(isEn ? 'Fuel cost cannot be negative.' : 'لا يمكن أن تكون تكلفة البنزين قيمة سالبة.');
                document.getElementById('fuelCostInput')?.focus();
                return;
            }

            const octaneRaw = document.getElementById('fuelOctaneSelect')?.value || 'بنزين 92';
            const octane = MotorCareSecurity.sanitizeText(octaneRaw, 40);
            const dateVal = document.getElementById('fuelDateInput')?.value || new Date().toISOString().split('T')[0];
            const receiptImg = tempImages['fuel'] || '';

            if (editingFuelId) {
                const index = car.fuelLogs.findIndex(f => f.id === editingFuelId);
                if (index !== -1) {
                    car.fuelLogs[index].odometer = odo;
                    car.fuelLogs[index].liters = liters;
                    car.fuelLogs[index].cost = cost;
                    car.fuelLogs[index].octane = octane;
                    car.fuelLogs[index].date = dateVal;
                    if (receiptImg) car.fuelLogs[index].receiptImage = receiptImg;
                }
            } else {
                if (odo > car.odometer) car.odometer = odo;
                car.fuelLogs.unshift({ 
                    id: 'f_' + Date.now(), 
                    odometer: odo, 
                    liters, 
                    cost, 
                    octane,
                    date: dateVal,
                    receiptImage: receiptImg
                });
            }

            tempImages['fuel'] = '';
            editingFuelId = null;
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('fuel_saved');
            closeFuelModal();
            renderDashboard();
        }

        function deleteFuelLog(id) {
            const isEn = appState.lang === 'en';
            const msg = isEn ? 'Are you sure you want to permanently delete this fuel log?' : 'هل أنت متأكد من حذف تفويلة البنزين هذه نهائياً؟';
            showCustomConfirm(msg, () => {
                const car = getCurrentCar();
                car.fuelLogs = car.fuelLogs.filter(f => f.id !== id);
                SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                syncUserDataToCloud('fuel_deleted');
                renderDashboard();
                showNotification(isEn ? 'Fuel log deleted.' : 'تم حذف تفويلة البنزين بنجاح.', 'success');
            });
        }

        function renderFuelSection() {
            const car = getCurrentCar();
            const cont = document.getElementById('fuelHistoryContainer');
            if (!cont) return;
            const isEn = appState.lang === 'en';

            if (!car.fuelLogs || !car.fuelLogs.length) {
                cont.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">${isEn ? 'No fuel logs recorded.' : 'لا توجد تفويلات مسجلة'}</div>`;
                return;
            }

            let html = `<div class="overflow-x-auto"><table class="w-full text-xs text-start"><thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800"><tr><th class="p-3">${isEn ? 'Date' : 'التاريخ'}</th><th class="p-3">${isEn ? 'Type' : 'النوع'}</th><th class="p-3">${isEn ? 'Odometer' : 'العداد'}</th><th class="p-3">${isEn ? 'Liters' : 'اللترات'}</th><th class="p-3">${isEn ? 'Cost' : 'المبلغ'}</th><th class="p-3">${isEn ? 'Receipt' : 'الإيصال'}</th><th class="p-3 text-center">${isEn ? 'Actions' : 'إجراءات'}</th></tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">`;
            
            const octaneMapEn = { 'بنزين 92': 'Octane 92', 'بنزين 95': 'Octane 95', 'بنزين 80': 'Octane 80', 'سولار': 'Diesel' };
            let totalLiters = 0;
            let totalCost = 0;

            car.fuelLogs.forEach(f => {
                totalLiters += Number(f.liters) || 0;
                totalCost += Number(f.cost) || 0;
                const octDisplay = isEn ? (octaneMapEn[f.octane] || f.octane || 'Octane 92') : (f.octane || 'بنزين 92');
                html += `<tr>
                    <td class="p-3">${f.date}</td>
                    <td class="p-3 font-bold text-sky-600">${octDisplay}</td>
                    <td class="p-3">${Number(f.odometer).toLocaleString()} ${isEn ? 'km' : 'كم'}</td>
                    <td class="p-3 text-amber-600 font-bold">${f.liters} ${isEn ? 'L' : 'لتر'}</td>
                    <td class="p-3 font-black">${Number(f.cost).toLocaleString()} ${isEn ? 'EGP' : 'ج.م'}</td>
                    <td class="p-3">${f.receiptImage ? `<button onclick="openImageViewer('${f.receiptImage}')" class="text-amber-600 font-bold hover:underline cursor-pointer"><i class="fa-solid fa-receipt ml-1"></i> ${isEn ? 'View' : 'عرض'}</button>` : '-'}</td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="openFuelModal('${f.id}')" class="text-sky-500 hover:text-sky-700 cursor-pointer p-1"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteFuelLog('${f.id}')" class="text-rose-500 hover:text-rose-700 cursor-pointer p-1"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            cont.innerHTML = html;

            // تحديث كارت معدل الاستهلاك والمؤشرات الاقتصادية أسفل الجدول
            updateFuelStatsCard(car, totalLiters, totalCost);
        }

        function updateFuelStatsCard(car, totalLiters = 0, totalCost = 0) {
            const isEn = appState.lang === 'en';
            const rateValEl = document.getElementById('fuelRateVal');
            const rateAltValEl = document.getElementById('fuelRateAltVal');
            const costPerKmEl = document.getElementById('fuelCostPerKmVal');
            const totalLitersEl = document.getElementById('fuelTotalLitersVal');
            const totalCostEl = document.getElementById('fuelTotalCostVal');
            const fillCountEl = document.getElementById('fuelFillCountVal');
            const badgeEl = document.getElementById('fuelEconomyBadge');

            if (totalLitersEl) totalLitersEl.innerText = `${totalLiters.toFixed(1)} ${isEn ? 'L' : 'لتر'}`;
            if (totalCostEl) totalCostEl.innerText = `${Number(totalCost.toFixed(0)).toLocaleString()} ${isEn ? 'EGP' : 'ج.م'}`;
            if (fillCountEl) fillCountEl.innerText = `${car.fuelLogs ? car.fuelLogs.length : 0} ${isEn ? 'fill-ups' : 'تفويلات مسجلة'}`;

            if (!car.fuelLogs || car.fuelLogs.length < 2) {
                if (rateValEl) rateValEl.innerText = isEn ? '-- L/100km' : '-- لتر/100كم';
                if (rateAltValEl) rateAltValEl.innerText = isEn ? '-- km/L' : '-- كم/لتر';
                if (costPerKmEl) costPerKmEl.innerText = isEn ? '-- EGP/km' : '-- ج.م/كم';
                if (badgeEl) {
                    badgeEl.innerText = isEn ? 'Requires 2 fill-ups' : 'بانتظار تفويلتين';
                    badgeEl.className = 'text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
                }
                return;
            }

            const sorted = [...car.fuelLogs].sort((a, b) => Number(a.odometer) - Number(b.odometer));
            const latest = sorted[sorted.length - 1];
            const previous = sorted[sorted.length - 2];
            const distance = Number(latest.odometer) - Number(previous.odometer);
            const liters = Number(latest.liters);
            const cost = Number(latest.cost);

            if (distance > 0 && liters > 0) {
                const rate = ((liters / distance) * 100).toFixed(1);
                const kmPerLiter = (distance / liters).toFixed(1);
                const costPerKm = (cost > 0) ? (cost / distance).toFixed(2) : '--';

                if (rateValEl) rateValEl.innerText = isEn ? `${rate} L/100km` : `${rate} لتر/100كم`;
                if (rateAltValEl) rateAltValEl.innerText = isEn ? `${kmPerLiter} km/L` : `${kmPerLiter} كم/لتر`;
                if (costPerKmEl) costPerKmEl.innerText = isEn ? `${costPerKm} EGP/km` : `${costPerKm} ج.م/كم`;

                if (badgeEl) {
                    if (Number(rate) < 7.0) {
                        badgeEl.innerText = isEn ? 'Excellent Economy 🌿' : 'ممتاز واقتصادي 🌿';
                        badgeEl.className = 'text-[10px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
                    } else if (Number(rate) <= 9.5) {
                        badgeEl.innerText = isEn ? 'Normal Consumption ⚡' : 'طبيعي ومعتدل ⚡';
                        badgeEl.className = 'text-[10px] font-black px-3 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
                    } else {
                        badgeEl.innerText = isEn ? 'High Consumption ⚠️' : 'استهلاك مرتفع ⚠️';
                        badgeEl.className = 'text-[10px] font-black px-3 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
                    }
                }
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof openFuelModal !== 'undefined') window.openFuelModal = openFuelModal; } catch (e) {}
try { if (typeof closeFuelModal !== 'undefined') window.closeFuelModal = closeFuelModal; } catch (e) {}
try { if (typeof saveFuelLog !== 'undefined') window.saveFuelLog = saveFuelLog; } catch (e) {}
try { if (typeof deleteFuelLog !== 'undefined') window.deleteFuelLog = deleteFuelLog; } catch (e) {}
try { if (typeof renderFuelSection !== 'undefined') window.renderFuelSection = renderFuelSection; } catch (e) {}
try { if (typeof updateFuelStatsCard !== 'undefined') window.updateFuelStatsCard = updateFuelStatsCard; } catch (e) {}
