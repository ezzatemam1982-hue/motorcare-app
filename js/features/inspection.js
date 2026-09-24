		/* ==========================================================================
           [MODULE - Inspection Checklist Engine] محرك الفحص الفني والأنظمة الـ 8
           ========================================================================== */
        const INSPECTION_SYSTEMS = [
            { 
                id: 'engine', 
                labelAr: '1. المحرك ومنظومة التبريد (Engine & Cooling)', 
                labelEn: '1. Engine & Cooling System',
                phAr: 'مثال: تسريب مياه، صوت تكهين، ارتفاع حرارة...',
                phEn: 'e.g. Water leak, engine ticking, overheating...'
            },
            { 
                id: 'transmission', 
                labelAr: '2. ناقل الحركة / الفتيس (Transmission)', 
                labelEn: '2. Transmission System',
                phAr: 'مثال: تأخير في النقلات، نتشة، تسريب زيت فتيس...',
                phEn: 'e.g. Shift delay, transmission jerk, ATF leak...'
            },
            { 
                id: 'suspension', 
                labelAr: '3. العفشة ونظام التوجيه (Suspension & Steering)', 
                labelEn: '3. Suspension & Steering',
                phAr: 'مثال: بوش في الجانبين، طقطقة مع الملفات، رجه في الطارة...',
                phEn: 'e.g. Bushing play, clicking on turns, steering vibration...'
            },
            { 
                id: 'brakes', 
                labelAr: '4. منظومة الفرامل والتيل (Brake System)', 
                labelEn: '4. Braking System & Pads',
                phAr: 'مثال: صفير عند الفرامل، تحجر الدواسة، ضعف الاستجابة...',
                phEn: 'e.g. Brake squeal, stiff pedal, weak braking response...'
            },
            { 
                id: 'electrical', 
                labelAr: '5. المنظومة الكهربائية والبطارية (Electrical & Battery)', 
                labelEn: '5. Electrical System & Battery',
                phAr: 'مثال: ضعف الشحن، تآكل كابلات، عطل في الدينامو...',
                phEn: 'e.g. Low charging, corroded cables, alternator failure...'
            },
            { 
                id: 'lighting', 
                labelAr: '6. أنظمة الإضاءة والمصابيح (Lighting & Lamps)', 
                labelEn: '6. Lighting & Lamps (Head/Rear/Signals)',
                phAr: 'مثال: مصباح مكسور، ضعف إضاءة، عطل في العالي...',
                phEn: 'e.g. Broken lamp, dim headlights, high beam failure...'
            },
            { 
                id: 'body', 
                labelAr: '7. الهيكل الخارجي والصاج (Body & Chassis)', 
                labelEn: '7. Body & Chassis',
                phAr: 'مثال: خدوش بالرفرف، بارومة، تجريح بالباب...',
                phEn: 'e.g. Fender scratches, rust/corrosion, door scratches...'
            },
            { 
                id: 'tires', 
                labelAr: '8. الإطارات ومعدل الاستهلاك (Tires Tread)', 
                labelEn: '8. Tires Tread & Condition',
                phAr: 'مثال: مسح الإطارات، تآكل غير منتظم، تشقق بالكاوتش...',
                phEn: 'e.g. Tread wear, uneven wear, sidewall cracking...'
            }
        ];

        function renderInspectionTab() {
            const car = getCurrentCar();
            const container = document.getElementById('inspectionFormContainer');
            if (!container || !car) return;

            if (!car.inspectionChecklist) {
                car.inspectionChecklist = {
                    engine: { status: 'Good', notes: '' },
                    transmission: { status: 'Good', notes: '' },
                    suspension: { status: 'Fair', notes: '' },
                    brakes: { status: 'Good', notes: '' },
                    electrical: { status: 'Good', notes: '' },
                    lighting: { status: 'Good', notes: '' },
                    body: { status: 'Original', notes: '' },
                    tires: { status: 'Fair', notes: '' }
                };
            }

            const isEn = appState.lang === 'en';
            container.innerHTML = '';

            INSPECTION_SYSTEMS.forEach(sys => {
                const data = car.inspectionChecklist[sys.id] || { status: 'Good', notes: '' };
                const label = isEn ? sys.labelEn : sys.labelAr;
                const phText = isEn ? (sys.phEn || 'Type notes, faults...') : (sys.phAr || 'اكتب ملاحظات، عيوب...');
                const isBody = sys.id === 'body';

                // تصحيح أي حالة قديمة Original إلى Good لبنود غير الصاج
                const currentStatus = (!isBody && data.status === 'Original') ? 'Good' : data.status;

                container.innerHTML += `
                    <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-xs text-slate-800 dark:text-slate-100">${label}</span>
                            <select id="insp_status_${sys.id}" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold text-sky-600 focus:outline-none">
                                <option value="Good" ${currentStatus === 'Good' ? 'selected' : ''}>${isEn ? 'Good / Excellent' : 'ممتاز / سليم'}</option>
                                <option value="Fair" ${currentStatus === 'Fair' ? 'selected' : ''}>${isEn ? 'Needs Attention' : 'يحتاج متابعة'}</option>
                                <option value="Bad" ${currentStatus === 'Bad' ? 'selected' : ''}>${isEn ? 'Urgent Repair' : 'تالف / صيانة عاجلة'}</option>
                                ${isBody ? `<option value="Original" ${currentStatus === 'Original' ? 'selected' : ''}>${isEn ? 'Factory Original (No Paint)' : 'فابريكة أصلي (بدون دهان)'}</option>` : ''}
                            </select>
                        </div>
                        <input type="text" id="insp_notes_${sys.id}" value="${data.notes || ''}" placeholder="${phText}" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
                    </div>
                `;
            });
        }

        function saveInspectionChecklist() {
            const car = getCurrentCar();
            if (!car.inspectionChecklist) car.inspectionChecklist = {};

            INSPECTION_SYSTEMS.forEach(sys => {
                const statusSel = document.getElementById(`insp_status_${sys.id}`);
                const notesInput = document.getElementById(`insp_notes_${sys.id}`);
                car.inspectionChecklist[sys.id] = {
                    status: statusSel ? statusSel.value : 'Good',
                    notes: notesInput ? notesInput.value.trim() : ''
                };
            });

            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('inspection_updated');
            alert(appState.lang === 'en' ? 'Inspection results saved successfully!' : 'تم حفظ نتائج الفحص الفني بنجاح!');
            renderDashboard();
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof INSPECTION_SYSTEMS !== 'undefined') window.INSPECTION_SYSTEMS = INSPECTION_SYSTEMS; } catch (e) {}
try { if (typeof renderInspectionTab !== 'undefined') window.renderInspectionTab = renderInspectionTab; } catch (e) {}
try { if (typeof saveInspectionChecklist !== 'undefined') window.saveInspectionChecklist = saveInspectionChecklist; } catch (e) {}
