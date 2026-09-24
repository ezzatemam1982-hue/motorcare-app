        /* ==========================================================================
           [MODULE 05-B] دليل وموسوعة بطاريات السيارات (Battery Catalog & Finder)
           ========================================================================== */
        function openBatteryCatalogModal(prefBrand = '', prefModel = '') {
            const car = getCurrentCar();
            const modal = document.getElementById('batteryCatalogModal');
            if (!modal) return;

            const brandSel = document.getElementById('catalogBrandSelect');
            if (brandSel) {
                brandSel.innerHTML = '';
                const allBrands = Object.keys(CAR_BRANDS_CATALOG).sort();
                allBrands.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b;
                    opt.innerText = b;
                    brandSel.appendChild(opt);
                });

                if (prefBrand && CAR_BRANDS_CATALOG[prefBrand]) {
                    brandSel.value = prefBrand;
                } else if (car && car.brand && CAR_BRANDS_CATALOG[car.brand]) {
                    brandSel.value = car.brand;
                }
            }

            onCatalogBrandChanged(prefModel);
            modal.classList.remove('hidden');
        }

        function closeBatteryCatalogModal() {
            document.getElementById('batteryCatalogModal')?.classList.add('hidden');
        }

        function onCatalogBrandChanged(targetModel = '') {
            const brand = document.getElementById('catalogBrandSelect')?.value;
            const modelSel = document.getElementById('catalogModelSelect');
            if (!modelSel) return;
            modelSel.innerHTML = '';

            if (brand && CAR_BRANDS_CATALOG[brand] && CAR_BRANDS_CATALOG[brand].models) {
                const models = Object.keys(CAR_BRANDS_CATALOG[brand].models);
                models.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.innerText = m;
                    modelSel.appendChild(opt);
                });

                const car = getCurrentCar();
                if (targetModel && models.includes(targetModel)) {
                    modelSel.value = targetModel;
                } else if (car && car.brand === brand && models.includes(car.model)) {
                    modelSel.value = car.model;
                }
            }

            onCatalogModelChanged();
        }

        function onCatalogModelChanged() {
            const brand = document.getElementById('catalogBrandSelect')?.value;
            const model = document.getElementById('catalogModelSelect')?.value;
            const genSel = document.getElementById('catalogGenSelect');
            if (!genSel) return;
            genSel.innerHTML = '';

            if (brand && model && CAR_BRANDS_CATALOG[brand] && CAR_BRANDS_CATALOG[brand].models && CAR_BRANDS_CATALOG[brand].models[model]) {
                const gens = CAR_BRANDS_CATALOG[brand].models[model].generations || [];
                gens.forEach((g, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx;
                    opt.innerText = g.name || `جيل ${idx + 1}`;
                    genSel.appendChild(opt);
                });

                const car = getCurrentCar();
                if (car && car.brand === brand && car.model === model && gens[car.generationIndex]) {
                    genSel.value = car.generationIndex;
                }
            }

            onCatalogGenChanged();
        }

        function onCatalogGenChanged() {
            renderCatalogBatteryResult();
        }

        function renderCatalogBatteryResult() {
            const card = document.getElementById('catalogBatteryResultCard');
            if (!card) return;

            const brand = document.getElementById('catalogBrandSelect')?.value;
            const model = document.getElementById('catalogModelSelect')?.value;
            const genIdx = parseInt(document.getElementById('catalogGenSelect')?.value) || 0;

            if (!brand || !model || !CAR_BRANDS_CATALOG[brand] || !CAR_BRANDS_CATALOG[brand].models[model]) {
                card.innerHTML = `
                    <div class="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500">
                        اختر الموديل لعرض تفاصيل ومواصفات البطارية المعتمدة.
                    </div>
                `;
                return;
            }

            const gens = CAR_BRANDS_CATALOG[brand].models[model].generations || [];
            const gen = gens[genIdx] || gens[0];
            if (!gen) return;

            const cap = gen.batteryCapacity || '60 Ah';
            const tech = gen.batteryTech || 'SMF';
            const din = gen.batteryDIN || 'DIN60 (L2)';
            const polarity = gen.batteryPolarity || 'L (سالب يسار / موجب يمين)';
            const startStop = !!gen.startStop;
            const notes = gen.batteryNotes || 'المواصفة القياسية الموصى بها من المصنع';

            card.innerHTML = `
                <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-slate-800/60 border border-amber-200/80 dark:border-amber-800/60 space-y-3 shadow-sm">
                    <!-- اسم الطراز وشعار الماركة -->
                    <div class="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
                        <div class="flex items-center gap-2">
                            ${typeof getCarBrandLogoHtml === 'function' ? getCarBrandLogoHtml(brand, 'w-6 h-6') : '<i class="fa-solid fa-car text-amber-500"></i>'}
                            <div>
                                <h5 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white">${brand} ${model}</h5>
                                <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">${gen.name || ''}</p>
                            </div>
                        </div>
                        <button type="button" onclick="applyCatalogSpecToCurrentCar('${brand}', '${model}', ${genIdx})" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5">
                            <i class="fa-solid fa-bolt"></i>
                            <span>تطبيق لسيارتي ⚡</span>
                        </button>
                    </div>

                    <!-- شبكة المواصفات الأساسية -->
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-100 dark:border-amber-900/40 shadow-2xs">
                            <span class="block text-[10px] text-slate-400 font-bold mb-0.5">السعة الموصى بها</span>
                            <span class="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">${cap}</span>
                        </div>
                        <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-100 dark:border-amber-900/40 shadow-2xs">
                            <span class="block text-[10px] text-slate-400 font-bold mb-0.5">التقنية المطلوبة</span>
                            <span class="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400">${tech}</span>
                        </div>
                        <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-100 dark:border-amber-900/40 shadow-2xs">
                            <span class="block text-[10px] text-slate-400 font-bold mb-0.5">المقاس القياسي</span>
                            <span class="text-[11px] font-black text-slate-800 dark:text-slate-200">${din}</span>
                        </div>

                    </div>

                    <!-- تفاصيل الأقطاب والملاحظات الفنية -->
                    <div class="p-3 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[11px]">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-arrows-left-right text-amber-500"></i>
                            <span class="font-bold text-slate-600 dark:text-slate-300">اتجاه الأقطاب:</span>
                            <strong class="text-slate-800 dark:text-slate-100 font-black">${polarity}</strong>
                        </div>
                        <div class="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <i class="fa-solid fa-circle-info text-sky-500 mt-0.5 shrink-0"></i>
                            <span>${notes}</span>
                        </div>
                    </div>

                    <!-- أشهر الماركات المتوافقة في مصر -->
                    <div class="p-2.5 bg-amber-100/50 dark:bg-amber-950/30 rounded-xl flex items-center justify-between text-[11px]">
                        <span class="font-bold text-amber-900 dark:text-amber-200">الماركات الموصى بها في السوق:</span>
                        <div class="flex items-center gap-1.5 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                            <span class="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded">كلورايد</span>
                            <span class="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded">فارتا</span>
                            <span class="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded">إيه سي ديلكو</span>
                            <span class="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded">سولايت</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // تطبيق مواصفة من الكتالوج لسيارة المستخدم الحالية
        function applyCatalogSpecToCurrentCar(brand, model, genIdx) {
            const car = getCurrentCar();
            if (!car) {
                openAddNewCarModal();
                closeBatteryCatalogModal();
                return;
            }
            const spec = getCarOemBatterySpec(brand, model, genIdx);
            
            // Open battery modal with these values
            closeBatteryCatalogModal();
            openBatteryModal();

            const capSel = document.getElementById('batteryCapacitySelect');
            if (capSel) {
                for (let i = 0; i < capSel.options.length; i++) {
                    if (capSel.options[i].value.includes(spec.capacity) || spec.capacity.includes(capSel.options[i].value)) {
                        capSel.selectedIndex = i;
                        break;
                    }
                }
            }
            const typeSel = document.getElementById('batteryTypeSelect');
            if (typeSel) typeSel.value = spec.tech;

            showNotification(appState.lang === 'en' ? `Applied: ${brand} ${model} Battery Spec` : `تم نقل مواصفة بطارية (${brand} ${model}) إلى نافذة بطاريتك ⚡`, 'success');
        }

        function openTiresDetailModal() {
            const car = getCurrentCar();
            if (!car) { openAddNewCarModal(); return; }
            const t = car.tiresInfo || {};
            const isConfigured = isTiresConfigured(car);
            const sizeInput = document.getElementById('tiresSizeInput');
            const dotInput = document.getElementById('tiresDotCodeInput');
            const frontInput = document.getElementById('tiresFrontPsiInput');
            const rearInput = document.getElementById('tiresRearPsiInput');
            const weekSel = document.getElementById('tiresDotWeekSelect');
            const yearSel = document.getElementById('tiresDotYearSelect');

            // تعبئة قائمة الأسابيع (01 إلى 52)
            if (weekSel) {
                weekSel.innerHTML = '';
                for (let w = 1; w <= 52; w++) {
                    const wStr = String(w).padStart(2, '0');
                    const opt = document.createElement('option');
                    opt.value = wStr;
                    opt.innerText = `الأسبوع ${wStr}`;
                    weekSel.appendChild(opt);
                }
            }

            // تعبئة قائمة سنوات الصنع بدقة حتى السنة الحالية لمنع الإدخال الخاطئ
            const curYear = new Date().getFullYear();
            if (yearSel) {
                yearSel.innerHTML = '';
                for (let y = curYear; y >= curYear - 10; y--) {
                    const opt = document.createElement('option');
                    opt.value = String(y).slice(-2);
                    opt.innerText = `سنة ${y}`;
                    yearSel.appendChild(opt);
                }
            }

            if (sizeInput) sizeInput.value = isConfigured ? (t.size || '') : '';
            if (frontInput) frontInput.value = t.frontPsi || 32;
            if (rearInput) rearInput.value = t.rearPsi || 30;

            const dot = isConfigured ? (t.dotCode || '') : '';
            if (dotInput) dotInput.value = dot;

            if (dot && dot.length === 4) {
                const wPart = dot.substring(0, 2);
                const yPart = dot.substring(2, 4);
                if (weekSel) weekSel.value = wPart;
                if (yearSel) yearSel.value = yPart;
            } else {
                if (weekSel) weekSel.value = '25';
                if (yearSel) yearSel.value = String(curYear - 1).slice(-2);
                syncDotCodeFromSelectors();
            }

            document.getElementById('tiresDetailModal')?.classList.remove('hidden');
        }

        function syncDotCodeFromSelectors() {
            const weekSel = document.getElementById('tiresDotWeekSelect');
            const yearSel = document.getElementById('tiresDotYearSelect');
            const dotInput = document.getElementById('tiresDotCodeInput');
            if (weekSel && yearSel && dotInput) {
                dotInput.value = `${weekSel.value}${yearSel.value}`;
            }
        }

        function syncSelectorsFromDotCode() {
            const dotInput = document.getElementById('tiresDotCodeInput');
            const weekSel = document.getElementById('tiresDotWeekSelect');
            const yearSel = document.getElementById('tiresDotYearSelect');
            if (!dotInput || !weekSel || !yearSel) return;
            const val = dotInput.value.replace(/\D/g, '').slice(0, 4);
            dotInput.value = val;
            if (val.length === 4) {
                const w = val.substring(0, 2);
                const y = val.substring(2, 4);
                if (parseInt(w) >= 1 && parseInt(w) <= 52 && weekSel) weekSel.value = w;
                if (yearSel) yearSel.value = y;
            }
        }

        function closeTiresDetailModal() { document.getElementById('tiresDetailModal')?.classList.add('hidden'); }

        function saveTiresDetails() {
            const car = getCurrentCar();
            if (!car) return;
            const sizeInput = document.getElementById('tiresSizeInput');
            const dotInput = document.getElementById('tiresDotCodeInput');
            const frontInput = document.getElementById('tiresFrontPsiInput');
            const rearInput = document.getElementById('tiresRearPsiInput');
            const isEn = appState.lang === 'en';

            const sizeVal = sizeInput ? sizeInput.value.trim() : '';
            if (!sizeVal) {
                alert(isEn ? 'Please enter your actual tire size (e.g. 205/55 R16)!' : 'يرجى إدخال مقاس الكاوتش الفعلي (مثال: 205/55 R16)!');
                if (sizeInput) sizeInput.focus();
                return;
            }

            car.tiresInfo = {
                size: sizeVal,
                dotCode: dotInput ? dotInput.value.trim() : '',
                frontPsi: frontInput ? parseInt(frontInput.value) || 32 : 32,
                rearPsi: rearInput ? parseInt(rearInput.value) || 30 : 30,
                warrantyImage: tempImages['tires'] || (car.tiresInfo ? car.tiresInfo.warrantyImage : ''),
                isConfigured: true
            };

            tempImages['tires'] = '';
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('tires_updated');
            closeTiresDetailModal();
            renderDashboard();
            if (typeof renderHardwareCards === 'function') renderHardwareCards();
            showNotification(isEn ? 'Tires data saved successfully!' : 'تم حفظ بيانات الإطارات بنجاح!', 'success');
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof applyCatalogSpecToCurrentCar !== 'undefined') window.applyCatalogSpecToCurrentCar = applyCatalogSpecToCurrentCar; } catch (e) {}
try { if (typeof openTiresDetailModal !== 'undefined') window.openTiresDetailModal = openTiresDetailModal; } catch (e) {}
try { if (typeof renderCatalogBatteryResult !== 'undefined') window.renderCatalogBatteryResult = renderCatalogBatteryResult; } catch (e) {}
try { if (typeof syncSelectorsFromDotCode !== 'undefined') window.syncSelectorsFromDotCode = syncSelectorsFromDotCode; } catch (e) {}
try { if (typeof closeTiresDetailModal !== 'undefined') window.closeTiresDetailModal = closeTiresDetailModal; } catch (e) {}
try { if (typeof onCatalogGenChanged !== 'undefined') window.onCatalogGenChanged = onCatalogGenChanged; } catch (e) {}
try { if (typeof onCatalogModelChanged !== 'undefined') window.onCatalogModelChanged = onCatalogModelChanged; } catch (e) {}
try { if (typeof onCatalogBrandChanged !== 'undefined') window.onCatalogBrandChanged = onCatalogBrandChanged; } catch (e) {}
try { if (typeof saveTiresDetails !== 'undefined') window.saveTiresDetails = saveTiresDetails; } catch (e) {}
try { if (typeof openBatteryCatalogModal !== 'undefined') window.openBatteryCatalogModal = openBatteryCatalogModal; } catch (e) {}
try { if (typeof syncDotCodeFromSelectors !== 'undefined') window.syncDotCodeFromSelectors = syncDotCodeFromSelectors; } catch (e) {}
try { if (typeof closeBatteryCatalogModal !== 'undefined') window.closeBatteryCatalogModal = closeBatteryCatalogModal; } catch (e) {}
