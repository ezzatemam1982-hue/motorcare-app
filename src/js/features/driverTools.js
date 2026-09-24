        
        /* [TRAFFIC FINES] خدمات الاستعلام عن المخالفات المرورية في مصر */
        function openTrafficFinesModal() {
            const car = getCurrentCar();
            const titleEl = document.getElementById('trafficCarTitle');
            const plateEl = document.getElementById('trafficCarPlate');
            if (titleEl) {
                titleEl.innerText = car ? `${car.brand} ${car.model} (${car.year || ''})` : (appState.lang === 'en' ? 'No vehicle selected' : 'لا توجد سيارة محددة');
            }
            if (plateEl) {
                plateEl.innerText = (car && car.license && car.license.trim()) ? car.license : (appState.lang === 'en' ? 'No plate number registered' : 'لم يسجل رقم لوحة');
            }
            document.getElementById('trafficFinesModal')?.classList.remove('hidden');
        }

        function closeTrafficFinesModal() {
            document.getElementById('trafficFinesModal')?.classList.add('hidden');
        }

        function copyTrafficPlateNumber() {
            const car = getCurrentCar();
            const plate = car ? (car.license || '') : '';
            const isEn = appState.lang === 'en';
            if (!plate) {
                showNotification(isEn ? 'No plate number found to copy' : 'لا يوجد رقم لوحة مسجل للسيارة الحالية', 'warning');
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(plate).then(() => {
                    showNotification(isEn ? `Plate number copied: ${plate}` : `تم نسخ رقم اللوحة: ${plate}`, 'success');
                }).catch(() => {
                    showNotification(plate, 'info');
                });
            } else {
                showNotification(`رقم اللوحة: ${plate}`, 'info');
            }
        }

        function openExternalTrafficPortal(url, event) {
            let targetUrl = url || 'https://ppo.gov.eg/ppo/r/ppoportal/ppoportal/traffic';
            
            // تنظيف أي session ID قديم من الرابط لتفادي حلقة إعادة التوجيه اللانهائية (302 Redirect Loop) على الهواتف
            try {
                if (targetUrl.includes('ppo.gov.eg') && targetUrl.includes('session=')) {
                    targetUrl = targetUrl.replace(/[\?&]session=[^&#]*/g, '').replace(/\?$/, '');
                }
            } catch(e) {}

            // دعم بيئة تطبيقات الهواتف الأصلية Capacitor
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
                if (event && event.preventDefault) event.preventDefault();
                window.Capacitor.Plugins.Browser.open({ url: targetUrl });
                return false;
            }

            // في المتصفح العادي أو الـ PWA، السماح للرابط بفتح تبويب خارجي مستقل
            if (!event) {
                const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
                if (!win || win.closed || typeof win.closed === 'undefined') {
                    window.location.href = targetUrl;
                }
            }
            return true;
        }

        function copyTrafficPortalUrl() {
            const url = 'https://ppo.gov.eg/ppo/r/ppoportal/ppoportal/traffic';
            const isEn = appState.lang === 'en';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    showNotification(isEn ? 'Official traffic portal link copied to clipboard!' : 'تم نسخ رابط بوابة نيابات المرور المباشر! يمكنك الآن لصقه في متصفح هاتفك مباشرة', 'success');
                }).catch(() => {
                    showNotification(url, 'info');
                });
            } else {
                showNotification(url, 'info');
            }
        }



        /* ==========================================================================
           [MODULE 21] محرك أدوات السائق المتقدمة (Advanced Driver Tools Engine)
           (سجل المصروفات والرحلات، حاسبة تكلفة الكيلومتر، مفكرة السائق السريعة)
           ========================================================================== */
        let activeDriverToolsTab = 'expenses';
        let activeExpenseFilter = 'all';
        let isAddExpenseFormOpen = false;
        let editingExpenseId = null;
        let editingNoteId = null;

        function openDriverToolsModal(initialTab = 'expenses') {
            const car = getCurrentCar();
            if (!car) {
                if (typeof openAddNewCarModal === 'function') openAddNewCarModal();
                return;
            }

            if (!car.otherExpenses || !Array.isArray(car.otherExpenses)) car.otherExpenses = [];
            if (!car.driverNotes || !Array.isArray(car.driverNotes)) car.driverNotes = [];

            const modal = document.getElementById('driverToolsModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }

            const catSelect = document.getElementById('dtExpenseCategorySelect');
            if (catSelect && !catSelect._hasChangeAttached) {
                catSelect._hasChangeAttached = true;
                catSelect.addEventListener('change', updateExpenseFormDynamicContext);
            }

            updateDriverToolsLanguage();
            switchDriverToolsTab(initialTab);
        }

        function closeDriverToolsModal() {
            closeMaintWearExplainer();
            if (typeof cancelEditDriverNote === 'function') cancelEditDriverNote();
            const modal = document.getElementById('driverToolsModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function switchDriverToolsTab(tab) {
            activeDriverToolsTab = tab;
            if (tab !== 'notes' && editingNoteId && typeof cancelEditDriverNote === 'function') {
                cancelEditDriverNote();
            }
            const tabs = ['expenses', 'costKm', 'notes'];
            tabs.forEach(t => {
                const btn = document.getElementById(`dtTabBtn-${t}`);
                const content = document.getElementById(`dtTabContent-${t}`);
                if (t === tab) {
                    if (btn) btn.className = 'py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs';
                    if (content) content.classList.remove('hidden');
                } else {
                    if (btn) btn.className = 'py-2 px-2 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';
                    if (content) content.classList.add('hidden');
                }
            });

            if (tab === 'expenses') renderDriverExpenses();
            else if (tab === 'costKm') renderCostPerKm();
            else if (tab === 'notes') renderDriverNotes();
        }

        function renderDriverToolsData() {
            if (activeDriverToolsTab === 'expenses') renderDriverExpenses();
            else if (activeDriverToolsTab === 'costKm') renderCostPerKm();
            else if (activeDriverToolsTab === 'notes') renderDriverNotes();
        }

        function updateDriverToolsLanguage() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            
            // Modal Title & Sub
            const modalTitle = document.getElementById('dtModalTitle');
            if (modalTitle) modalTitle.innerText = isEn ? "Advanced Driver Tools" : "أدوات السائق المتقدمة";
            const modalSub = document.getElementById('dtModalSub');
            if (modalSub) modalSub.innerText = isEn ? "Petty Expenses & Trips • Cost Per KM • Quick Notes" : "المصروفات النثرية والرحلات • حاسبة تكلفة الكيلومتر • المفكرة السريعة";

            // Tab Buttons
            const tabExp = document.getElementById('dtTabLabel-expenses');
            if (tabExp) tabExp.innerText = isEn ? "Expenses & Trips" : "سجل المصروفات";
            const tabCost = document.getElementById('dtTabLabel-costKm');
            if (tabCost) tabCost.innerText = isEn ? "Cost Per KM" : "تكلفة الكيلومتر";
            const tabNotes = document.getElementById('dtTabLabel-notes');
            if (tabNotes) tabNotes.innerText = isEn ? "Driver Notes" : "مفكرة السائق";

            // Tab 1: Expenses Strings
            const expTotalLbl = document.getElementById('dtExpLblTotal');
            if (expTotalLbl) expTotalLbl.innerText = isEn ? "Total Expenses" : "إجمالي النثريات";
            const expCountLbl = document.getElementById('dtExpLblCount');
            if (expCountLbl) expCountLbl.innerText = isEn ? "Transactions" : "عدد العمليات";
            const expTopCatLbl = document.getElementById('dtExpLblTopCat');
            if (expTopCatLbl) expTopCatLbl.innerText = isEn ? "Top Category" : "أعلى تصنيف";

            const addExpBtnText = document.getElementById('dtAddExpBtnText');
            if (addExpBtnText) addExpBtnText.innerText = isEn ? "+ Record New Expense / Trip" : "+ إضافة مصروف / رحلة جديدة";
            const formTitle = document.getElementById('dtFormTitleText');
            if (formTitle) {
                if (editingExpenseId) {
                    formTitle.innerText = isEn ? "Edit Expense / Trip Record" : "تعديل المصروف أو رحلة السفر";
                } else {
                    formTitle.innerText = isEn ? "Record New Vehicle Expense or Trip" : "تسجيل مصروف أو رحلة سيارة جديدة";
                }
            }

            const lblAmt = document.getElementById('dtLblAmount');
            if (lblAmt) lblAmt.innerText = isEn ? "Amount (EGP) *" : "المبلغ (بالجنيه EGP) *";
            const lblCat = document.getElementById('dtLblCategory');
            if (lblCat) lblCat.innerText = isEn ? "Expense Category *" : "فئة المصروف *";
            const lblDate = document.getElementById('dtLblDate');
            if (lblDate) lblDate.innerText = isEn ? "Date *" : "التاريخ *";
            const lblOdo = document.getElementById('dtLblOdo');
            if (lblOdo) lblOdo.innerText = isEn ? "Odometer Reading (Optional)" : "قراءة العداد (اختياري)";

            const btnCancelExp = document.getElementById('dtBtnCancelExp');
            if (btnCancelExp) btnCancelExp.innerText = isEn ? "Cancel" : "إلغاء";
            const btnSaveExp = document.getElementById('dtBtnSaveExp');
            if (btnSaveExp) {
                if (editingExpenseId) {
                    btnSaveExp.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>${isEn ? 'Save Changes' : 'حفظ التعديلات'}</span>`;
                } else {
                    btnSaveExp.innerHTML = isEn ? "Save Expense" : "حفظ المعاملة";
                }
            }
            // Category options translation
            const catSelect = document.getElementById('dtExpenseCategorySelect');
            if (catSelect) {
                const currentVal = catSelect.value || 'wash';
                catSelect.innerHTML = isEn ? `
                    <option value="wash">Car Wash & Detailing 🧼</option>
                    <option value="parking">Parking & Valet 🅿️</option>
                    <option value="tolls">Highway Tolls & Gates 🛣️</option>
                    <option value="fines">Traffic Fines & Licenses 📋</option>
                    <option value="accessories">Accessories & Electronics 🔌</option>
                    <option value="trip">Road Trip / Travel 🚗💨</option>
                    <option value="other">Other Petty Expenses 🏷️</option>
                ` : `
                    <option value="wash">غسيل وتنظيف 🧼</option>
                    <option value="parking">باركينج ورسوم انتظار 🅿️</option>
                    <option value="tolls">كارتات وبوابات طرق 🛣️</option>
                    <option value="fines">مخالفات ورخص 📋</option>
                    <option value="accessories">إكسسوارات وكماليات 🔌</option>
                    <option value="trip">رحلة وسفر خاص 🚗💨</option>
                    <option value="other">نثريات وطوارئ أخرى 🏷️</option>
                `;
                catSelect.value = currentVal;
            }
            updateExpenseFormDynamicContext();

            // Category chips
            const chipLabels = {
                all: isEn ? "All" : "الكل",
                wash: isEn ? "Wash 🧼" : "غسيل 🧼",
                parking: isEn ? "Parking 🅿️" : "باركينج 🅿️",
                tolls: isEn ? "Tolls 🛣️" : "كارتات 🛣️",
                fines: isEn ? "Fines 📋" : "مخالفات 📋",
                accessories: isEn ? "Accessories 🔌" : "إكسسوارات 🔌",
                trip: isEn ? "Trips 🚗" : "رحلات سفر 🚗",
                other: isEn ? "Other 🏷️" : "أخرى 🏷️"
            };
            Object.keys(chipLabels).forEach(c => {
                const chip = document.getElementById(`dtChip-${c}`);
                if (chip) chip.innerText = chipLabels[c];
            });

            // Tab 2: Cost Per KM Strings
            const costHead = document.getElementById('dtCostKmLblHeading');
            if (costHead) costHead.innerText = isEn ? "Actual Vehicle Operating Cost Per KM" : "مؤشر تكلفة الكيلومتر الفعلي لسيارتك";
            const costUnit = document.getElementById('dtCostKmUnit');
            if (costUnit) costUnit.innerText = isEn ? "EGP / KM" : "ج.م / كم";
            const costSub = document.getElementById('dtCostKmSubtext');
            if (costSub) costSub.innerText = isEn
                ? "Calculated by dividing total spend (fuel + maintenance + petty expenses & trips) over total recorded kilometers driven."
                : "يتم احتساب هذا المؤشر بتقسيم إجمالي ما تم إنفاقه على (البنزين + فواتير الصيانة + النثريات والرحلات) على إجمالي الكيلومترات المقطوعة.";

            const pillFuel = document.getElementById('dtPillFuelLbl');
            if (pillFuel) pillFuel.innerText = isEn ? "Fuel Cost" : "تكلفة الوقود";
            const pillMaint = document.getElementById('dtPillMaintLbl');
            if (pillMaint) pillMaint.innerText = isEn ? "Maintenance" : "تكلفة الصيانة";
            const pillOther = document.getElementById('dtPillOtherLbl');
            if (pillOther) pillOther.innerText = isEn ? "Petty & Trips" : "نثريات ورحلات";
            const pillDist = document.getElementById('dtPillDistLbl');
            if (pillDist) pillDist.innerText = isEn ? "Calculated Distance" : "إجمالي المسافة";

            const tripTitle = document.getElementById('dtTripCardTitle');
            if (tripTitle) tripTitle.innerText = isEn ? "Trip & Travel Cost Estimator" : "حاسبة تقدير تكلفة السفر والرحلات القادمة";
            const tripTag = document.getElementById('dtTripCardTag');
            if (tripTag) tripTag.innerText = isEn ? "Smart Trip Estimator" : "حاسبة الرحلات الذكية";

            // Odometer section labels
            const odoSectionLbl = document.getElementById('dtOdoSectionLbl');
            if (odoSectionLbl) odoSectionLbl.innerHTML = `<i class="fa-solid fa-gauge-high text-violet-500 text-[10px]"></i> ${isEn ? 'Calculate Distance by Odometer (More Accurate):' : 'حساب المسافة بالعداد (أدق):'}`;
            const lblOdoStart = document.getElementById('dtLblOdoStart');
            if (lblOdoStart) lblOdoStart.innerText = isEn ? "Odometer Start (KM)" : "عداد البداية (كم)";
            const lblOdoEnd = document.getElementById('dtLblOdoEnd');
            if (lblOdoEnd) lblOdoEnd.innerText = isEn ? "Odometer End (KM)" : "عداد النهاية (كم)";
            const odoStartInput = document.getElementById('dtTripOdoStartInput');
            if (odoStartInput) odoStartInput.placeholder = isEn ? "e.g. 85000" : "مثال: 85000";
            const odoEndInput = document.getElementById('dtTripOdoEndInput');
            if (odoEndInput) odoEndInput.placeholder = isEn ? "e.g. 85220" : "مثال: 85220";
            const orSeparator = document.getElementById('dtOrSeparator');
            if (orSeparator) orSeparator.innerText = isEn ? "OR ENTER DISTANCE MANUALLY" : "أو أدخل المسافة يدوياً";
            const distAutoTag = document.getElementById('dtDistAutoTag');
            if (distAutoTag) distAutoTag.innerText = "AUTO";

            const lblTripDist = document.getElementById('dtLblTripDist');
            if (lblTripDist) lblTripDist.innerText = isEn ? "One-Way Distance (KM)" : "المسافة ذهاباً (كم)";
            const lblTripCons = document.getElementById('dtLblTripCons');
            if (lblTripCons) lblTripCons.innerText = isEn ? "Consumption (L/100km)" : "الاستهلاك (لتر/100كم)";
            const lblTripPrice = document.getElementById('dtLblTripPrice');
            if (lblTripPrice) lblTripPrice.innerText = isEn ? "Fuel Price / L (EGP)" : "سعر اللتر (ج.م)";
            const lblTripTolls = document.getElementById('dtLblTripTolls');
            if (lblTripTolls) lblTripTolls.innerText = isEn ? "Tolls & Highway (EGP)" : "كارتات وبوابات (ج.م)";

            const resLiters = document.getElementById('dtResLblLiters');
            if (resLiters) resLiters.innerText = isEn ? "Estimated Fuel Liters" : "لترات الوقود المقدرة";
            const resFuelCost = document.getElementById('dtResLblFuelCost');
            if (resFuelCost) resFuelCost.innerText = isEn ? "Trip Fuel Cost" : "تكلفة الوقود للرحلة";
            const resMaint = document.getElementById('dtResLblMaintWear');
            if (resMaint) resMaint.innerText = isEn ? "Wear & Tear Share" : "إهلاك الصيانة والزيوت";
            const resOneWay = document.getElementById('dtResLblOneWay');
            if (resOneWay) resOneWay.innerText = isEn ? "Estimated Cost (One-Way):" : "إجمالي التكلفة التقديرية (ذهاب فقط):";
            const resRound = document.getElementById('dtResLblRound');
            if (resRound) resRound.innerText = isEn ? "Comprehensive Total (Round-Trip):" : "الإجمالي الشامل (ذهاب وعودة):";

            const btnLogOneWay = document.getElementById('dtBtnLogTripOneWay');
            if (btnLogOneWay) btnLogOneWay.innerHTML = `<i class="fa-solid fa-arrow-right-long text-[10px]"></i> <span>${isEn ? 'Record One-Way' : 'تسجيل ذهاب فقط'}</span>`;

            const btnLogRound = document.getElementById('dtBtnLogTripRound');
            if (btnLogRound) btnLogRound.innerHTML = `<i class="fa-solid fa-arrows-left-right text-[10px]"></i> <span>${isEn ? 'Record Round-Trip' : 'تسجيل ذهاب وعودة'}</span>`;

            const btnMaintInfo = document.getElementById('dtBtnMaintWearInfo');
            if (btnMaintInfo) btnMaintInfo.title = isEn ? "How wear & tear is calculated" : "طريقة حساب إهلاك الصيانة والزيوت";

            // Tab 3: Notes Strings
            const notesHeading = document.getElementById('dtNotesHeading');
            const notesHeadingIcon = document.getElementById('dtNotesHeadingIcon');
            if (notesHeading) {
                if (editingNoteId) {
                    notesHeading.innerText = isEn ? "Edit Selected Note" : "تعديل الملاحظة المحددة";
                    if (notesHeadingIcon) notesHeadingIcon.className = "fa-solid fa-pen-to-square text-amber-500";
                } else {
                    notesHeading.innerText = isEn ? "Quick Vehicle Notes & Reminders" : "تدوين ملاحظة سريعة للسيارة";
                    if (notesHeadingIcon) notesHeadingIcon.className = "fa-solid fa-pen-clip text-violet-500";
                }
            }
            const noteInput = document.getElementById('dtNoteTextInput');
            if (noteInput) noteInput.placeholder = isEn ? "Write your quick note (e.g. check tire nitrogen, buy T10 bulb, faint squeak over bumps)..." : "اكتب ملاحظتك هنا (مثل: شراء لمبة صالون، صوت تزييق خفيف عند المطبات، ميعاد ترصيص الإطارات)...";
            const btnAddNote = document.getElementById('dtBtnAddNote');
            if (btnAddNote) {
                if (editingNoteId) {
                    btnAddNote.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>${isEn ? 'Save Changes' : 'حفظ التعديل'}</span>`;
                } else {
                    btnAddNote.innerHTML = `<i class="fa-solid fa-plus text-xs"></i> <span>${isEn ? 'Add' : 'إضافة'}</span>`;
                }
            }
            const btnCancelNote = document.getElementById('dtBtnCancelNote');
            if (btnCancelNote) {
                btnCancelNote.innerHTML = `<i class="fa-solid fa-xmark text-xs"></i> <span>${isEn ? 'Cancel' : 'إلغاء'}</span>`;
                btnCancelNote.title = isEn ? "Cancel edit" : "إلغاء التعديل";
            }

            const noteTagSelect = document.getElementById('dtNoteTagSelect');
            if (noteTagSelect) {
                const currentTag = noteTagSelect.value || 'general';
                noteTagSelect.innerHTML = isEn ? `
                    <option value="issue">⚠️ Noise / Issue</option>
                    <option value="part">🛒 Parts to Buy</option>
                    <option value="reminder">⏰ Date & Reminder</option>
                    <option value="upgrade">💡 Idea / Upgrade</option>
                    <option value="general">📝 General</option>
                ` : `
                    <option value="issue">⚠️ صوت / عطل ملحوظ</option>
                    <option value="part">🛒 شراء قطع غيار</option>
                    <option value="reminder">⏰ موعد وتذكير</option>
                    <option value="upgrade">💡 فكرة وتعديل</option>
                    <option value="general">📝 عام</option>
                `;
                noteTagSelect.value = currentTag;
            }

            const footerNote = document.getElementById('dtFooterNote');
            if (footerNote) {
                footerNote.innerHTML = `<i class="fa-solid fa-shield-halved text-violet-500"></i> <span>${isEn ? 'All expenses, notes and analytics are saved locally and synced with the cloud' : 'يتم حفظ وتحديث كافة السجلات والملاحظات محلياً مع المزامنة السحابية التلقائية'}</span>`;
            }
        }

        function updateExpenseFormDynamicContext() {
            const catSelect = document.getElementById('dtExpenseCategorySelect');
            const notesInput = document.getElementById('dtExpenseNotesInput');
            const lblNotesText = document.getElementById('dtLblNotesText');
            const lblNotes = document.getElementById('dtLblNotes');
            const iconNotes = document.getElementById('dtIconNotes');
            const amountInput = document.getElementById('dtExpenseAmountInput');
            if (!catSelect || !notesInput) return;

            const cat = catSelect.value || 'wash';
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const contextMap = {
                wash: {
                    arLabel: 'تفاصيل الغسيل والمكان',
                    enLabel: 'Wash Details & Location',
                    arPlaceholder: 'مثال: غسيل كيماوي كامل، تلميع صالون، غسيل موتور، مغسلة الرحاب...',
                    enPlaceholder: 'e.g. Full chemical interior wash, polish & wax, engine bay cleaning...',
                    arAmtPlaceholder: 'مثال: 120',
                    enAmtPlaceholder: 'e.g. 120',
                    icon: 'fa-solid fa-soap text-sky-500'
                },
                parking: {
                    arLabel: 'مكان وتفاصيل الانتظار والباركينج',
                    enLabel: 'Parking Spot & Details',
                    arPlaceholder: 'مثال: باركينج مول سيتي ستارز، جراج المطار، سايس وسط البلد...',
                    enPlaceholder: 'e.g. Mall underground parking, airport terminal valet, street parking...',
                    arAmtPlaceholder: 'مثال: 50',
                    enAmtPlaceholder: 'e.g. 50',
                    icon: 'fa-solid fa-square-parking text-indigo-500'
                },
                tolls: {
                    arLabel: 'اسم البوابة أو كارتة الطريق',
                    enLabel: 'Toll Gate or Highway Name',
                    arPlaceholder: 'مثال: كارتة طريق السخنة، بوابات الضبعة، محور روض الفرج، كارتة السويس...',
                    enPlaceholder: 'e.g. Sokhna highway toll, Dabaa toll gate, Rod El-Farag corridor...',
                    arAmtPlaceholder: 'مثال: 30',
                    enAmtPlaceholder: 'e.g. 30',
                    icon: 'fa-solid fa-road text-amber-500'
                },
                fines: {
                    arLabel: 'تفاصيل المخالفة أو الترخيص والمكان',
                    enLabel: 'Fine / License Details & Location',
                    arPlaceholder: 'مثال: رادار سرعة (طريق السويس)، تجديد رخصة وتأمين، ملصق إلكتروني، حزام...',
                    enPlaceholder: 'e.g. Speed camera fine, annual license renewal & inspection, RFID tag...',
                    arAmtPlaceholder: 'مثال: 350',
                    enAmtPlaceholder: 'e.g. 350',
                    icon: 'fa-solid fa-receipt text-rose-500'
                },
                accessories: {
                    arLabel: 'نوع القطعة أو الإكسسوار والمكان',
                    enLabel: 'Accessory Item & Description',
                    arPlaceholder: 'مثال: شاحن سريع Anker، حامل موبايل مغناطيسي، دواسات جلد 5D، فرش كراسي...',
                    enPlaceholder: 'e.g. Fast USB-C car charger, magnetic phone mount, 5D leather floor mats...',
                    arAmtPlaceholder: 'مثال: 450',
                    enAmtPlaceholder: 'e.g. 450',
                    icon: 'fa-solid fa-plug text-emerald-500'
                },
                trip: {
                    arLabel: 'خط سير الرحلة وملاحظات السفر',
                    enLabel: 'Trip Route / Travel Details',
                    arPlaceholder: 'مثال: رحلة الإسكندرية، سفر الساحل الشمالي، مشوار الشروق والمعادي...',
                    enPlaceholder: 'e.g. Alexandria road trip, North Coast weekend, Maadi to Shorouk one-way...',
                    arAmtPlaceholder: 'مثال: 800',
                    enAmtPlaceholder: 'e.g. 800',
                    icon: 'fa-solid fa-car-side text-violet-500'
                },
                other: {
                    arLabel: 'بيان وتفاصيل المصروف أو الطوارئ',
                    enLabel: 'Expense Purpose & Details',
                    arPlaceholder: 'مثال: إكرامية بنزينة، تزويد هواء نيتروجين، لحام مسمار كاوتش، تلميع فوانيس...',
                    enPlaceholder: 'e.g. Gas station attendant tip, tire puncture repair, nitrogen refill...',
                    arAmtPlaceholder: 'مثال: 100',
                    enAmtPlaceholder: 'e.g. 100',
                    icon: 'fa-solid fa-tags text-slate-500'
                }
            };

            const info = contextMap[cat] || contextMap.other;

            if (lblNotesText) {
                lblNotesText.innerText = isEn ? info.enLabel : info.arLabel;
            } else if (lblNotes) {
                lblNotes.innerText = isEn ? info.enLabel : info.arLabel;
            }

            if (iconNotes && info.icon) {
                iconNotes.className = info.icon;
            }

            notesInput.placeholder = isEn ? info.enPlaceholder : info.arPlaceholder;
            if (amountInput && !amountInput.value) {
                amountInput.placeholder = isEn ? info.enAmtPlaceholder : info.arAmtPlaceholder;
            }
        }

        function toggleAddExpenseForm(force) {
            const panel = document.getElementById('dtAddExpensePanel');
            if (!panel) return;
            if (typeof force === 'boolean') isAddExpenseFormOpen = force;
            else isAddExpenseFormOpen = !isAddExpenseFormOpen;

            if (!isAddExpenseFormOpen) {
                resetDriverExpenseForm();
            }

            panel.classList.toggle('hidden', !isAddExpenseFormOpen);
            const icon = document.getElementById('dtAddExpIcon');
            if (icon) {
                icon.className = isAddExpenseFormOpen ? 'fa-solid fa-minus text-xs' : 'fa-solid fa-plus text-xs';
            }
            if (isAddExpenseFormOpen) {
                const dateInput = document.getElementById('dtExpenseDateInput');
                if (dateInput && !dateInput.value) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
                updateExpenseFormDynamicContext();
                const amountInput = document.getElementById('dtExpenseAmountInput');
                if (amountInput) amountInput.focus();
            }
        }

        function resetDriverExpenseForm() {
            editingExpenseId = null;
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const amountInput = document.getElementById('dtExpenseAmountInput');
            const notesInput = document.getElementById('dtExpenseNotesInput');
            const odometerInput = document.getElementById('dtExpenseOdometerInput');
            const categorySelect = document.getElementById('dtExpenseCategorySelect');
            const formTitle = document.getElementById('dtFormTitleText');
            const formTitleIcon = document.getElementById('dtFormTitleIcon');
            const saveBtn = document.getElementById('dtBtnSaveExp');

            if (amountInput) amountInput.value = '';
            if (notesInput) notesInput.value = '';
            if (odometerInput) odometerInput.value = '';
            
            const defaultCat = (typeof activeExpenseFilter !== 'undefined' && activeExpenseFilter && activeExpenseFilter !== 'all') ? activeExpenseFilter : 'wash';
            if (categorySelect) categorySelect.value = defaultCat;

            if (formTitleIcon) formTitleIcon.className = 'fa-solid fa-file-circle-plus text-violet-500';
            if (formTitle) formTitle.innerText = isEn ? 'Record New Vehicle Expense or Trip' : 'تسجيل مصروف أو رحلة سيارة جديدة';
            if (saveBtn) {
                saveBtn.innerHTML = isEn ? 'Save Expense' : 'حفظ المعاملة';
                saveBtn.className = 'px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs active:scale-95';
            }
            updateExpenseFormDynamicContext();
        }

        function editDriverExpense(id) {
            const car = getCurrentCar();
            if (!car || !Array.isArray(car.otherExpenses)) return;
            const item = car.otherExpenses.find(x => x.id === id);
            if (!item) return;

            editingExpenseId = id;
            toggleAddExpenseForm(true);

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const amountInput = document.getElementById('dtExpenseAmountInput');
            const categorySelect = document.getElementById('dtExpenseCategorySelect');
            const dateInput = document.getElementById('dtExpenseDateInput');
            const odometerInput = document.getElementById('dtExpenseOdometerInput');
            const notesInput = document.getElementById('dtExpenseNotesInput');
            const formTitle = document.getElementById('dtFormTitleText');
            const formTitleIcon = document.getElementById('dtFormTitleIcon');
            const saveBtn = document.getElementById('dtBtnSaveExp');

            if (categorySelect) categorySelect.value = item.category || 'other';
            updateExpenseFormDynamicContext();

            if (amountInput) amountInput.value = item.amount || '';
            if (dateInput) dateInput.value = item.date || '';
            if (odometerInput) odometerInput.value = item.odometer || '';
            if (notesInput) notesInput.value = item.notes || '';

            if (formTitleIcon) formTitleIcon.className = 'fa-solid fa-pen-to-square text-violet-500';
            if (formTitle) formTitle.innerText = isEn ? 'Edit Expense / Trip Record' : 'تعديل المصروف أو رحلة السفر';
            if (saveBtn) {
                saveBtn.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>${isEn ? 'Save Changes' : 'حفظ التعديلات'}</span>`;
                saveBtn.className = 'px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5';
            }

            const panel = document.getElementById('dtAddExpensePanel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (amountInput) amountInput.focus();
        }

        function setDriverExpenseFilter(cat) {
            activeExpenseFilter = cat;
            const categories = ['all', 'wash', 'parking', 'tolls', 'fines', 'accessories', 'trip', 'other'];
            categories.forEach(c => {
                const btn = document.getElementById(`dtChip-${c}`);
                if (!btn) return;
                if (c === cat) {
                    btn.className = 'px-2.5 py-1 rounded-xl text-xs font-bold bg-violet-600 text-white cursor-pointer shadow-2xs';
                } else {
                    btn.className = 'px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer';
                }
            });
            renderDriverExpenses();
        }

        function saveDriverExpense(e) {
            if (e) e.preventDefault();
            const car = getCurrentCar();
            if (!car) return;
            if (!car.otherExpenses) car.otherExpenses = [];

            const amountInput = document.getElementById('dtExpenseAmountInput');
            const categorySelect = document.getElementById('dtExpenseCategorySelect');
            const dateInput = document.getElementById('dtExpenseDateInput');
            const odometerInput = document.getElementById('dtExpenseOdometerInput');
            const notesInput = document.getElementById('dtExpenseNotesInput');

            const amount = MotorCareSecurity.parsePositiveFloat(amountInput?.value, 0, 0, 1000000);
            const category = MotorCareSecurity.sanitizeText(categorySelect?.value || 'other', 30);
            const date = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];
            const odometer = odometerInput && odometerInput.value ? MotorCareSecurity.parsePositiveInt(odometerInput.value, null, 0, 5000000) : null;
            const notes = MotorCareSecurity.sanitizeText(notesInput?.value || '', 300);

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (amount <= 0) {
                showNotification(isEn ? 'Please enter a valid expense amount' : 'يرجى إدخال مبلغ صحيح', 'error');
                return;
            }

            if (editingExpenseId) {
                const existing = car.otherExpenses.find(x => x.id === editingExpenseId);
                if (existing) {
                    existing.amount = amount;
                    existing.category = category;
                    existing.date = date;
                    existing.odometer = odometer;
                    existing.notes = notes;
                    existing.updatedAt = new Date().toISOString();
                }
                showNotification(isEn ? `Updated expense (${amount} EGP) successfully` : `تم تعديل المصروف بمبلغ ${amount} ج.م بنجاح`, 'success');
                editingExpenseId = null;
            } else {
                const newExpense = {
                    id: 'exp_' + Date.now(),
                    amount: amount,
                    category: category,
                    date: date,
                    odometer: odometer,
                    notes: notes,
                    createdAt: new Date().toISOString()
                };
                car.otherExpenses.unshift(newExpense);
                showNotification(isEn ? `Recorded ${amount} EGP expense successfully` : `تم تسجيل المصروف بمبلغ ${amount} ج.م بنجاح`, 'success');
            }

            try {
                SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                if (typeof syncUserDataToCloud === 'function') syncUserDataToCloud('expense_updated');
            } catch (err) {
                console.error('Error saving expense:', err);
            }

            resetDriverExpenseForm();
            toggleAddExpenseForm(false);

            renderDriverExpenses();
            if (typeof renderCharts === 'function' && currentActiveTab === 'analytics') renderCharts();
        }

        function deleteDriverExpense(id) {
            const car = getCurrentCar();
            if (!car || !car.otherExpenses) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            car.otherExpenses = car.otherExpenses.filter(item => item.id !== id);

            if (editingExpenseId === id) {
                resetDriverExpenseForm();
                toggleAddExpenseForm(false);
            }

            try {
                SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                if (typeof syncUserDataToCloud === 'function') syncUserDataToCloud('expense_deleted');
            } catch (err) {}

            showNotification(isEn ? 'Expense deleted' : 'تم حذف المعاملة', 'info');
            renderDriverExpenses();
        }

        function renderDriverExpenses() {
            const car = getCurrentCar();
            const listEl = document.getElementById('dtExpensesListContainer');
            const totalEl = document.getElementById('dtExpTotalAmount');
            const countEl = document.getElementById('dtExpCount');
            const topCatEl = document.getElementById('dtExpTopCategory');
            if (!listEl) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const expenses = (car && Array.isArray(car.otherExpenses)) ? car.otherExpenses : [];

            // Calculate KPIs
            let totalAmount = 0;
            const catCounts = {};

            expenses.forEach(exp => {
                totalAmount += (exp.amount || 0);
                catCounts[exp.category] = (catCounts[exp.category] || 0) + (exp.amount || 0);
            });

            if (totalEl) totalEl.innerText = `${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isEn ? 'EGP' : 'ج.م'}`;
            if (countEl) countEl.innerText = isEn ? `${expenses.length} record${expenses.length === 1 ? '' : 's'}` : `${expenses.length} عملية`;

            let topCategoryName = '-';
            let maxSpend = 0;
            const categoryMeta = {
                wash: { ar: 'غسيل وتنظيف', en: 'Wash', icon: 'fa-soap', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60' },
                parking: { ar: 'باركينج', en: 'Parking', icon: 'fa-square-parking', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60' },
                tolls: { ar: 'كارتات وطرق', en: 'Tolls', icon: 'fa-road', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
                fines: { ar: 'مخالفات ورخص', en: 'Fines', icon: 'fa-file-invoice', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
                accessories: { ar: 'إكسسوارات', en: 'Accessories', icon: 'fa-plug', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/60' },
                trip: { ar: 'رحلة سفر', en: 'Road Trip', icon: 'fa-car-side', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800/60' },
                other: { ar: 'نثريات أخرى', en: 'Other', icon: 'fa-tag', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
            };

            Object.keys(catCounts).forEach(c => {
                if (catCounts[c] > maxSpend) {
                    maxSpend = catCounts[c];
                    topCategoryName = isEn ? (categoryMeta[c]?.en || c) : (categoryMeta[c]?.ar || c);
                }
            });
            if (topCatEl) topCatEl.innerText = topCategoryName;

            // Filter List
            const filtered = expenses.filter(exp => {
                if (activeExpenseFilter === 'all') return true;
                return exp.category === activeExpenseFilter;
            });

            if (filtered.length === 0) {
                listEl.innerHTML = `
                    <div class="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                        <i class="fa-solid fa-receipt text-3xl text-violet-400/70 mb-1"></i>
                        <h4 class="text-xs font-black text-slate-700 dark:text-slate-300">${isEn ? 'No Expenses Logged Yet' : 'لا توجد مصروفات مسجلة بعد'}</h4>
                        <p class="text-[11px] text-slate-400 max-w-sm mx-auto">${isEn ? 'Use the "+ Record New Expense" button above to log car wash, parking, tolls, or trip costs.' : 'اضغط على زر "+ إضافة مصروف / رحلة جديدة" لتسجيل مصاريف الغسيل، الباركينج، رسوم الطرق، والمخالفات بسهولة.'}</p>
                    </div>
                `;
                return;
            }

            let html = '';
            filtered.forEach(item => {
                const meta = categoryMeta[item.category] || categoryMeta.other;
                const catLabel = isEn ? meta.en : meta.ar;
                const dateStr = item.date || '';

                html += `
                    <div class="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 hover:border-violet-300 dark:hover:border-violet-700 transition-all shadow-2xs">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 border ${meta.color}">
                                <i class="fa-solid ${meta.icon}"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">${catLabel}</span>
                                    <span class="text-[10px] text-slate-400 font-mono">${dateStr}</span>
                                    ${item.odometer ? `<span class="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${item.odometer.toLocaleString()} ${isEn ? 'km' : 'كم'}</span>` : ''}
                                </div>
                                ${item.notes ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">${MotorCareSecurity.escapeHtml(item.notes)}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <div class="text-end me-1">
                                <div class="text-xs sm:text-sm font-black text-violet-700 dark:text-violet-300 font-mono">${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <span class="text-[10px] text-slate-400 font-bold">${isEn ? 'EGP' : 'ج.م'}</span>
                            </div>
                            <button type="button" onclick="editDriverExpense('${item.id}')" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 flex items-center justify-center cursor-pointer transition-colors" title="${isEn ? 'Edit' : 'تعديل'}">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button type="button" onclick="deleteDriverExpense('${item.id}')" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer transition-colors" title="${isEn ? 'Delete' : 'حذف'}">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            listEl.innerHTML = html;
        }

        function renderCostPerKm() {
            const car = getCurrentCar();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const totalEl = document.getElementById('dtCostPerKmTotal');
            const fuelEl = document.getElementById('dtCostKmFuel');
            const maintEl = document.getElementById('dtCostKmMaint');
            const otherEl = document.getElementById('dtCostKmOther');
            const distEl = document.getElementById('dtCostKmDistance');

            if (!car) return;

            let totalFuel = 0;
            if (Array.isArray(car.fuelLogs)) {
                car.fuelLogs.forEach(f => { totalFuel += (f.cost || 0); });
            }

            let totalMaint = 0;
            if (Array.isArray(car.history)) {
                car.history.forEach(h => { totalMaint += (h.totalCost || 0); });
            }

            let totalOther = 0;
            if (Array.isArray(car.otherExpenses)) {
                car.otherExpenses.forEach(e => { totalOther += (e.amount || 0); });
            }

            const totalSpend = totalFuel + totalMaint + totalOther;

            // Distance calculation
            let calculatedDistance = 0;
            const currentOdo = parseInt(car.odometer) || 0;
            const initOdo = parseInt(car.initialOdometer || car.purchaseOdometer) || 0;

            if (currentOdo > initOdo && initOdo > 0) {
                calculatedDistance = currentOdo - initOdo;
            } else if (currentOdo > 0) {
                // Check minimum odometer recorded in fuel or history
                let minLogged = currentOdo;
                if (Array.isArray(car.fuelLogs)) {
                    car.fuelLogs.forEach(f => {
                        if (f.odometer && f.odometer < minLogged && f.odometer > 0) minLogged = f.odometer;
                    });
                }
                if (Array.isArray(car.history)) {
                    car.history.forEach(h => {
                        if (h.odometer && h.odometer < minLogged && h.odometer > 0) minLogged = h.odometer;
                    });
                }
                if (currentOdo - minLogged >= 50) {
                    calculatedDistance = currentOdo - minLogged;
                } else {
                    calculatedDistance = currentOdo; // Lifecycle distance
                }
            }

            if (calculatedDistance <= 0) calculatedDistance = 1; // prevent division by zero

            const costPerKmTotal = (totalSpend / calculatedDistance);
            const costPerKmFuel = (totalFuel / calculatedDistance);
            const costPerKmMaint = (totalMaint / calculatedDistance);
            const costPerKmOther = (totalOther / calculatedDistance);

            if (totalEl) totalEl.innerText = costPerKmTotal.toFixed(2);
            if (fuelEl) fuelEl.innerText = `${costPerKmFuel.toFixed(2)} ${isEn ? 'EGP/km' : 'ج/كم'}`;
            if (maintEl) maintEl.innerText = `${costPerKmMaint.toFixed(2)} ${isEn ? 'EGP/km' : 'ج/كم'}`;
            if (otherEl) otherEl.innerText = `${costPerKmOther.toFixed(2)} ${isEn ? 'EGP/km' : 'ج/كم'}`;
            if (distEl) distEl.innerText = `${calculatedDistance.toLocaleString()} ${isEn ? 'km' : 'كم'}`;

            calculateTripCostEstimate();
        }

        function syncOdometerFields() {
            const odoStartInput = document.getElementById('dtTripOdoStartInput');
            const odoEndInput = document.getElementById('dtTripOdoEndInput');
            const distInput = document.getElementById('dtTripDistanceInput');
            const odoBadge = document.getElementById('dtOdoBadge');
            const distAutoTag = document.getElementById('dtDistAutoTag');

            const odoStart = parseFloat(odoStartInput ? odoStartInput.value : '') || 0;
            const odoEnd = parseFloat(odoEndInput ? odoEndInput.value : '') || 0;

            const hasOdoStart = odoStartInput && odoStartInput.value.trim() !== '';
            const hasOdoEnd = odoEndInput && odoEndInput.value.trim() !== '';

            if (hasOdoStart && hasOdoEnd && odoEnd > odoStart) {
                // Smart Priority: Odometer-based auto-calculation takes over
                const calculatedDist = odoEnd - odoStart;
                if (distInput) {
                    distInput.value = calculatedDist;
                    distInput.disabled = true;
                }
                if (odoBadge) { odoBadge.classList.remove('hidden'); }
                if (distAutoTag) { distAutoTag.classList.remove('hidden'); }
            } else {
                // No valid odometer pair — manual distance entry remains active
                if (distInput) { distInput.disabled = false; }
                if (odoBadge) { odoBadge.classList.add('hidden'); }
                if (distAutoTag) { distAutoTag.classList.add('hidden'); }
            }

            calculateTripCostEstimate();
        }

        function calculateTripCostEstimate() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const distInput = document.getElementById('dtTripDistanceInput');
            const consInput = document.getElementById('dtTripConsumptionInput');
            const priceInput = document.getElementById('dtTripFuelPriceInput');
            const tollsInput = document.getElementById('dtTripTollsInput');

            const dist = parseFloat(distInput ? distInput.value : 0) || 0;
            const cons = parseFloat(consInput ? consInput.value : 8.0) || 8.0;
            const price = parseFloat(priceInput ? priceInput.value : 15.0) || 15.0;
            const tolls = parseFloat(tollsInput ? tollsInput.value : 0) || 0;

            const car = getCurrentCar();
            let maintRatePerKm = 0.45; // Default benchmark maintenance wear per km in EGP
            let isBenchmark = true;
            if (car && Array.isArray(car.history) && car.history.length > 0) {
                let totalMaint = 0;
                car.history.forEach(h => { totalMaint += (h.totalCost || 0); });
                const odo = parseInt(car.odometer) || 1;
                if (odo > 1000 && totalMaint > 0) {
                    maintRatePerKm = Math.min(2.5, Math.max(0.2, totalMaint / odo));
                    isBenchmark = false;
                }
            }

            const litersOneWay = (dist / 100) * cons;
            const fuelCostOneWay = litersOneWay * price;
            const maintWearOneWay = dist * maintRatePerKm;
            const totalOneWay = fuelCostOneWay + maintWearOneWay + tolls;
            const totalRoundTrip = (fuelCostOneWay + maintWearOneWay) * 2 + (tolls * 2);

            const litersEl = document.getElementById('dtTripLitersResult');
            const fuelCostEl = document.getElementById('dtTripFuelCostResult');
            const maintWearEl = document.getElementById('dtTripMaintCostResult');
            const maintRateTag = document.getElementById('dtTripMaintRateTag');
            const oneWayEl = document.getElementById('dtTripTotalOneWay');
            const roundTripEl = document.getElementById('dtTripTotalRoundTrip');

            if (litersEl) litersEl.innerText = `${litersOneWay.toFixed(1)} ${isEn ? 'Liters' : 'لتر'}`;
            if (fuelCostEl) fuelCostEl.innerText = `${fuelCostOneWay.toFixed(0)} ${isEn ? 'EGP' : 'ج.م'}`;
            if (maintWearEl) maintWearEl.innerText = `${maintWearOneWay.toFixed(0)} ${isEn ? 'EGP' : 'ج.م'}`;
            if (maintRateTag) {
                maintRateTag.innerText = `(${maintRatePerKm.toFixed(2)} ${isEn ? 'EGP/km' : 'ج.م/كم'})`;
                maintRateTag.title = isBenchmark 
                    ? (isEn ? 'Standard engineering benchmark (0.45 EGP/km)' : 'المعدل الهندسي القياسي (0.45 ج.م/كم)')
                    : (isEn ? 'Calculated dynamically from your car maintenance history' : 'محسوب تلقائياً من فواتير صيانة سيارتك');
            }
            if (oneWayEl) oneWayEl.innerText = `${totalOneWay.toFixed(0)} ${isEn ? 'EGP' : 'ج.م'}`;
            if (roundTripEl) roundTripEl.innerText = `${totalRoundTrip.toFixed(0)} ${isEn ? 'EGP' : 'ج.م'}`;
        }

        // Legacy alias — kept for backward compatibility (no-op now, presets removed)
        function applyTripPreset(dist, tolls, nameAr, nameEn) { /* Removed — odometer-based now */ }

        function logTripAsExpense(direction = 'round') {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const dist = parseFloat(document.getElementById('dtTripDistanceInput')?.value) || 0;
            const isOneWay = (direction === 'one_way');

            const oneWayEl = document.getElementById('dtTripTotalOneWay');
            const roundTripEl = document.getElementById('dtTripTotalRoundTrip');
            const rawCost = isOneWay
                ? (oneWayEl ? parseFloat(oneWayEl.innerText) || 0 : 0)
                : (roundTripEl ? parseFloat(roundTripEl.innerText) || 0 : 0);

            // Capture odometer readings for the expense note
            const odoStart = document.getElementById('dtTripOdoStartInput')?.value || '';
            const odoEnd = document.getElementById('dtTripOdoEndInput')?.value || '';
            const hasOdo = Boolean(odoStart && odoEnd);

            resetDriverExpenseForm();
            switchDriverToolsTab('expenses');
            toggleAddExpenseForm(true);

            const amtInput = document.getElementById('dtExpenseAmountInput');
            const catSelect = document.getElementById('dtExpenseCategorySelect');
            const notesInput = document.getElementById('dtExpenseNotesInput');

            if (amtInput) amtInput.value = rawCost > 0 ? rawCost : (isOneWay ? 250 : 500);
            if (catSelect) {
                catSelect.value = 'trip';
                updateExpenseFormDynamicContext();
            }

            let noteText;
            if (isOneWay) {
                if (hasOdo) {
                    noteText = isEn
                        ? `Road Trip (One-Way ~${dist} km) | Odo: ${odoStart} → ${odoEnd}`
                        : `رحلة وسفر (ذهاب فقط ~${dist} كم) | العداد: ${odoStart} ← ${odoEnd}`;
                } else {
                    noteText = isEn
                        ? `Road Trip (One-Way ~${dist} km)`
                        : `رحلة وسفر (ذهاب فقط ~${dist} كم)`;
                }
            } else {
                if (hasOdo) {
                    noteText = isEn
                        ? `Road Trip (Round-Trip ~${dist * 2} km) | Initial Odo: ${odoStart} → ${odoEnd}`
                        : `رحلة وسفر (ذهاب وعودة ~${dist * 2} كم) | العداد المبدئي: ${odoStart} ← ${odoEnd}`;
                } else {
                    noteText = isEn
                        ? `Road Trip (~${dist * 2} km round-trip)`
                        : `رحلة وسفر (حوالي ${dist * 2} كم ذهاب وعودة)`;
                }
            }
            if (notesInput) notesInput.value = noteText;

            const notifMsg = isOneWay
                ? (isEn ? 'One-way trip details pre-filled in expense form' : 'تم تجهيز بيانات وتكلفة الذهاب فقط في استمارة المصروفات')
                : (isEn ? 'Round-trip details pre-filled in expense form' : 'تم تجهيز بيانات وتكلفة الذهاب والعودة في استمارة المصروفات');
            showNotification(notifMsg, 'info', 3000);
        }

        function showMaintWearExplainer() {
            const modal = document.getElementById('maintWearExplainerModal');
            if (!modal) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const car = getCurrentCar();
            let maintRate = 0.45;
            let isBenchmark = true;
            let totalMaint = 0;
            let odo = 1;

            if (car && Array.isArray(car.history) && car.history.length > 0) {
                car.history.forEach(h => { totalMaint += (h.totalCost || 0); });
                odo = parseInt(car.odometer) || 1;
                if (odo > 1000 && totalMaint > 0) {
                    maintRate = Math.min(2.5, Math.max(0.2, totalMaint / odo));
                    isBenchmark = false;
                }
            }

            const valEl = document.getElementById('mweCurrentCarRateVal');
            const srcEl = document.getElementById('mweCurrentCarRateSource');
            if (valEl) {
                valEl.innerText = `${maintRate.toFixed(2)} ${isEn ? 'EGP/km' : 'ج.م/كم'}`;
            }
            if (srcEl) {
                if (isBenchmark) {
                    srcEl.innerText = isEn ? 'Standard benchmark (0.45 EGP/km)' : 'المعدل الهندسي القياسي (0.45 ج.م/كم)';
                } else {
                    srcEl.innerText = isEn 
                        ? `Actual history: ${totalMaint.toLocaleString()} EGP ÷ ${odo.toLocaleString()} km`
                        : `من سجلك الفعلي: ${totalMaint.toLocaleString()} ج.م ÷ ${odo.toLocaleString()} كم`;
                }
            }

            // Localize modal texts
            const titleEl = document.getElementById('mweTitle');
            const subEl = document.getElementById('mweSub');
            const sec1Title = document.getElementById('mweSec1Title');
            const sec1Text = document.getElementById('mweSec1Text');
            const sec2Title = document.getElementById('mweSec2Title');
            const m1Title = document.getElementById('mweMethod1Title');
            const m1Desc = document.getElementById('mweMethod1Desc');
            const m2Title = document.getElementById('mweMethod2Title');
            const m2Desc = document.getElementById('mweMethod2Desc');
            const rateTitle = document.getElementById('mweCurrentCarRateTitle');
            const btnClose = document.getElementById('mweBtnClose');

            if (isEn) {
                if (titleEl) titleEl.innerText = 'How is Maintenance & Oil Wear Calculated?';
                if (subEl) subEl.innerText = 'Mechanical depreciation formula per kilometer';
                if (sec1Title) sec1Title.innerHTML = '<i class="fa-solid fa-oil-can text-amber-500"></i> <span>What does this cover?</span>';
                if (sec1Text) sec1Text.innerHTML = 'Every kilometer driven consumes a fractional lifespan of: <strong>engine oil, oil/air/cabin filters, brake pads, tires, spark plugs, and suspension bushings</strong>. This amount represents the fair monetary reserve needed for vehicle upkeep per this trip.';
                if (sec2Title) sec2Title.innerHTML = '<i class="fa-solid fa-chart-line text-sky-500"></i> <span>How is your vehicle rate determined?</span>';
                if (m1Title) m1Title.innerText = '1. Actual Calculation (from logged invoices):';
                if (m1Desc) m1Desc.innerText = 'The app sums all maintenance invoices logged for your car and divides them by the current odometer reading to calculate your exact historical rate per km.';
                if (m2Title) m2Title.innerText = '2. Standard Benchmark (new cars or no logged history):';
                if (m2Desc) m2Desc.innerText = 'If there is insufficient maintenance history, the app applies the standard passenger car engineering benchmark: 0.45 EGP per kilometer.';
                if (rateTitle) rateTitle.innerText = 'Current rate applied to your trip:';
                if (btnClose) btnClose.innerText = 'Got It (Close)';
            } else {
                if (titleEl) titleEl.innerText = 'كيف يُحسب إهلاك الصيانة والزيوت؟';
                if (subEl) subEl.innerText = 'معادلة نصيب الكيلومتر من الاستهلاك الميكانيكي';
                if (sec1Title) sec1Title.innerHTML = '<i class="fa-solid fa-oil-can text-amber-500"></i> <span>ماذا يشمل هذا البند؟</span>';
                if (sec1Text) sec1Text.innerHTML = 'كل كيلومتر تقطعه سيارتك في السفر يستهلك جزءاً دقيقاً من عمر: <strong>زيت المحرك، فلتر الزيت والهواء والتكييف، تيل الفرامل، الإطارات، شمعات الاحتراق (البوجيهات)، ومنظومة العفشة</strong>. هذا المبلغ يمثل الحصة المالية العادلة التي ينبغي تجنيبها للصيانة مقابل هذه الرحلة.';
                if (sec2Title) sec2Title.innerHTML = '<i class="fa-solid fa-chart-line text-sky-500"></i> <span>كيف يتم حساب المعدل لسيارتك؟</span>';
                if (m1Title) m1Title.innerText = '1. الحساب الفعلي (إذا كان لديك فواتير مسجلة):';
                if (m1Desc) m1Desc.innerText = 'يقوم التطبيق بجمع كافة فواتير الصيانة التي سجلتها لسيارتك وقسمتها على عداد السيارة الحالي للوصول لتكلفتك الواقعية لكل كيلومتر.';
                if (m2Title) m2Title.innerText = '2. المعدل الهندسي القياسي (للسيارات الجديدة أو بدون سجل فواتير):';
                if (m2Desc) m2Desc.innerText = 'إذا لم يتوفر سجل فواتير كافٍ، يعتمد التطبيق المعدل الهندسي القياسي المعمول به للسيارات الملاكي: 0.45 ج.م لكل كيلومتر.';
                if (rateTitle) rateTitle.innerText = 'المعدل المطبق حالياً على رحلتك:';
                if (btnClose) btnClose.innerText = 'فهمت ذلك (إغلاق)';
            }

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        function closeMaintWearExplainer() {
            const modal = document.getElementById('maintWearExplainerModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function renderDriverNotes() {
            const car = getCurrentCar();
            const listEl = document.getElementById('dtNotesListContainer');
            const badgeEl = document.getElementById('dtNotesBadge');
            const countStatEl = document.getElementById('dtNotesCountStat');
            if (!listEl) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const notes = (car && Array.isArray(car.driverNotes)) ? car.driverNotes : [];

            // Uncompleted count
            const pendingNotes = notes.filter(n => !n.completed);
            if (badgeEl) {
                if (pendingNotes.length > 0) {
                    badgeEl.innerText = pendingNotes.length;
                    badgeEl.classList.remove('hidden');
                } else {
                    badgeEl.classList.add('hidden');
                }
            }
            if (countStatEl) {
                countStatEl.innerText = isEn
                    ? `${pendingNotes.length} active • ${notes.length - pendingNotes.length} completed`
                    : `${pendingNotes.length} نشطة • ${notes.length - pendingNotes.length} مكتملة`;
            }

            if (notes.length === 0) {
                listEl.innerHTML = `
                    <div class="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                        <i class="fa-solid fa-note-sticky text-3xl text-violet-400/70 mb-1"></i>
                        <h4 class="text-xs font-black text-slate-700 dark:text-slate-300">${isEn ? 'No Notes Recorded' : 'المفكرة فارغة حالياً'}</h4>
                        <p class="text-[11px] text-slate-400 max-w-sm mx-auto">${isEn ? 'Add quick reminders, observed issues, or parts to purchase using the input box above.' : 'دوّن أي ملاحظة سريعة أثناء القيادة أو قطع الغيار التي تنوي شراءها أو مواعيد الترصيص والصيانة القادمة.'}</p>
                    </div>
                `;
                return;
            }

            const tagMeta = {
                issue: { ar: 'عطل / صوت ملحوظ', en: 'Issue', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
                part: { ar: 'قطع غيار', en: 'Parts', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
                reminder: { ar: 'موعد وتذكير', en: 'Reminder', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60' },
                upgrade: { ar: 'فكرة وتعديل', en: 'Upgrade', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/60' },
                general: { ar: 'عامة', en: 'General', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
            };

            // Sort: pending first, then completed
            const sorted = [...notes].sort((a, b) => {
                if (a.completed === b.completed) return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
                return a.completed ? 1 : -1;
            });

            let html = '';
            sorted.forEach(note => {
                const meta = tagMeta[note.tag] || tagMeta.general;
                const tagLabel = isEn ? meta.en : meta.ar;
                const isDone = !!note.completed;
                const isBeingEdited = (editingNoteId === note.id);
                const dateStr = note.createdAt ? new Date(note.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-EG') : '';

                let cardClasses = 'p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all shadow-2xs ';
                if (isBeingEdited) {
                    cardClasses += 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30';
                } else if (isDone) {
                    cardClasses += 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-800 opacity-65';
                } else {
                    cardClasses += 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 hover:border-violet-300 dark:hover:border-violet-700';
                }

                html += `
                    <div class="${cardClasses}">
                        <div class="flex items-start gap-2.5 min-w-0">
                            <button type="button" onclick="toggleDriverNoteComplete('${note.id}')" class="mt-0.5 w-5 h-5 rounded-lg border cursor-pointer flex items-center justify-center transition-all shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-violet-500'}" title="${isDone ? (isEn ? 'Mark as incomplete' : 'تحديد كغير مكتملة') : (isEn ? 'Mark as complete' : 'تحديد كمكتملة')}">
                                ${isDone ? '<i class="fa-solid fa-check text-[10px]"></i>' : ''}
                            </button>
                            <div class="min-w-0 cursor-pointer" onclick="editDriverNote('${note.id}')" title="${isEn ? 'Click to edit note' : 'اضغط لتعديل الملاحظة'}">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2 py-0.2 rounded-md text-[10px] font-bold border ${meta.color}">${tagLabel}</span>
                                    <span class="text-[10px] text-slate-400 font-mono">${dateStr}</span>
                                    ${isBeingEdited ? `<span class="px-2 py-0.2 rounded-md text-[9px] font-black bg-amber-500 text-white animate-pulse flex items-center gap-1"><i class="fa-solid fa-pen text-[8px]"></i> ${isEn ? 'Editing now...' : 'جاري التعديل...'}</span>` : ''}
                                    ${note.updatedAt ? `<span class="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-medium"><i class="fa-solid fa-rotate-left text-[8px]"></i> ${isEn ? 'Edited' : 'مُعدلة'}</span>` : ''}
                                </div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-1 leading-relaxed break-words ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}">${MotorCareSecurity.escapeHtml(note.text || '')}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" onclick="editDriverNote('${note.id}')" class="w-8 h-8 rounded-xl ${isBeingEdited ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'} flex items-center justify-center cursor-pointer transition-all shadow-2xs hover:scale-105" title="${isEn ? 'Edit note' : 'تعديل الملاحظة'}">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button type="button" onclick="deleteDriverNote('${note.id}')" class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-500 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center cursor-pointer transition-all shadow-2xs hover:scale-105 shrink-0" title="${isEn ? 'Delete note' : 'حذف الملاحظة'}">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            listEl.innerHTML = html;
        }

        function editDriverNote(id) {
            const car = getCurrentCar();
            if (!car || !Array.isArray(car.driverNotes)) return;
            const note = car.driverNotes.find(n => n.id === id);
            if (!note) return;

            editingNoteId = id;
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const input = document.getElementById('dtNoteTextInput');
            const tagSelect = document.getElementById('dtNoteTagSelect');
            const btn = document.getElementById('dtBtnAddNote');
            const btnCancel = document.getElementById('dtBtnCancelNote');
            const heading = document.getElementById('dtNotesHeading');
            const headingIcon = document.getElementById('dtNotesHeadingIcon');
            const inputCard = document.getElementById('dtNoteInputCard');

            if (input) {
                input.value = note.text || '';
                input.focus();
                input.select();
            }
            if (tagSelect) tagSelect.value = note.tag || 'general';

            if (heading) {
                heading.innerText = isEn ? 'Edit Selected Note' : 'تعديل الملاحظة المحددة';
            }
            if (headingIcon) {
                headingIcon.className = 'fa-solid fa-pen-to-square text-amber-500';
            }

            if (inputCard) {
                inputCard.classList.add('border-amber-400', 'dark:border-amber-500', 'ring-2', 'ring-amber-400/20');
                inputCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            if (btn) {
                btn.innerHTML = `<i class="fa-solid fa-check text-xs"></i> <span>${isEn ? 'Save Changes' : 'حفظ التعديل'}</span>`;
                btn.className = 'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs active:scale-95 shrink-0';
            }

            if (btnCancel) {
                btnCancel.innerHTML = `<i class="fa-solid fa-xmark text-xs"></i> <span>${isEn ? 'Cancel' : 'إلغاء'}</span>`;
                btnCancel.classList.remove('hidden');
            }

            // Re-render notes so the card being edited gets active state styling
            renderDriverNotes();
        }

        function cancelEditDriverNote() {
            editingNoteId = null;
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const input = document.getElementById('dtNoteTextInput');
            const tagSelect = document.getElementById('dtNoteTagSelect');
            const btn = document.getElementById('dtBtnAddNote');
            const btnCancel = document.getElementById('dtBtnCancelNote');
            const heading = document.getElementById('dtNotesHeading');
            const headingIcon = document.getElementById('dtNotesHeadingIcon');
            const inputCard = document.getElementById('dtNoteInputCard');

            if (input) input.value = '';
            if (tagSelect) tagSelect.value = 'general';

            if (heading) {
                heading.innerText = isEn ? 'Quick Vehicle Notes & Reminders' : 'تدوين ملاحظة سريعة للسيارة';
            }
            if (headingIcon) {
                headingIcon.className = 'fa-solid fa-pen-clip text-violet-500';
            }

            if (inputCard) {
                inputCard.classList.remove('border-amber-400', 'dark:border-amber-500', 'ring-2', 'ring-amber-400/20');
            }

            if (btn) {
                btn.innerHTML = `<i class="fa-solid fa-plus text-xs"></i> <span>${isEn ? 'Add' : 'إضافة'}</span>`;
                btn.className = 'px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs active:scale-95 shrink-0';
            }

            if (btnCancel) {
                btnCancel.classList.add('hidden');
            }

            renderDriverNotes();
        }

        function addDriverNote() {
            const car = getCurrentCar();
            if (!car) return;
            if (!car.driverNotes) car.driverNotes = [];

            const input = document.getElementById('dtNoteTextInput');
            const tagSelect = document.getElementById('dtNoteTagSelect');
            const rawText = input ? input.value : '';
            const text = MotorCareSecurity.sanitizeText(rawText, 500);
            const tag = MotorCareSecurity.sanitizeText(tagSelect ? tagSelect.value : 'general', 30);
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (!text) {
                showNotification(isEn ? 'Please enter note text' : 'يرجى كتابة نص الملاحظة', 'error');
                return;
            }

            if (editingNoteId) {
                const note = car.driverNotes.find(n => n.id === editingNoteId);
                if (note) {
                    note.text = text;
                    note.tag = tag;
                    note.updatedAt = new Date().toISOString();
                }
                showNotification(isEn ? 'Note updated successfully' : 'تم تعديل الملاحظة بنجاح', 'success');
            } else {
                const newNote = {
                    id: 'note_' + Date.now(),
                    text: text,
                    tag: tag,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                car.driverNotes.unshift(newNote);
                showNotification(isEn ? 'Note added successfully' : 'تمت إضافة الملاحظة بنجاح', 'success');
            }

            try {
                SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                if (typeof syncUserDataToCloud === 'function') syncUserDataToCloud('note_updated');
            } catch (err) {}

            cancelEditDriverNote();
        }

        function toggleDriverNoteComplete(id) {
            const car = getCurrentCar();
            if (!car || !car.driverNotes) return;

            const note = car.driverNotes.find(n => n.id === id);
            if (note) {
                note.completed = !note.completed;
                note.completedAt = note.completed ? new Date().toISOString() : null;

                try {
                    SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                    if (typeof syncUserDataToCloud === 'function') syncUserDataToCloud('note_updated');
                } catch (err) {}

                renderDriverNotes();
            }
        }

        function deleteDriverNote(id) {
            const car = getCurrentCar();
            if (!car || !car.driverNotes) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            car.driverNotes = car.driverNotes.filter(n => n.id !== id);

            if (editingNoteId === id) {
                cancelEditDriverNote();
            }

            try {
                SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
                if (typeof syncUserDataToCloud === 'function') syncUserDataToCloud('note_deleted');
            } catch (err) {}

            showNotification(isEn ? 'Note deleted' : 'تم حذف الملاحظة', 'info');
            renderDriverNotes();
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof renderDriverNotes !== 'undefined') window.renderDriverNotes = renderDriverNotes; } catch (e) {}
try { if (typeof openTrafficFinesModal !== 'undefined') window.openTrafficFinesModal = openTrafficFinesModal; } catch (e) {}
try { if (typeof openExternalTrafficPortal !== 'undefined') window.openExternalTrafficPortal = openExternalTrafficPortal; } catch (e) {}
try { if (typeof logTripAsExpense !== 'undefined') window.logTripAsExpense = logTripAsExpense; } catch (e) {}
try { if (typeof closeTrafficFinesModal !== 'undefined') window.closeTrafficFinesModal = closeTrafficFinesModal; } catch (e) {}
try { if (typeof renderDriverToolsData !== 'undefined') window.renderDriverToolsData = renderDriverToolsData; } catch (e) {}
try { if (typeof updateExpenseFormDynamicContext !== 'undefined') window.updateExpenseFormDynamicContext = updateExpenseFormDynamicContext; } catch (e) {}
try { if (typeof renderDriverExpenses !== 'undefined') window.renderDriverExpenses = renderDriverExpenses; } catch (e) {}
try { if (typeof switchDriverToolsTab !== 'undefined') window.switchDriverToolsTab = switchDriverToolsTab; } catch (e) {}
try { if (typeof renderCostPerKm !== 'undefined') window.renderCostPerKm = renderCostPerKm; } catch (e) {}
try { if (typeof toggleAddExpenseForm !== 'undefined') window.toggleAddExpenseForm = toggleAddExpenseForm; } catch (e) {}
try { if (typeof saveDriverExpense !== 'undefined') window.saveDriverExpense = saveDriverExpense; } catch (e) {}
try { if (typeof closeMaintWearExplainer !== 'undefined') window.closeMaintWearExplainer = closeMaintWearExplainer; } catch (e) {}
try { if (typeof setDriverExpenseFilter !== 'undefined') window.setDriverExpenseFilter = setDriverExpenseFilter; } catch (e) {}
try { if (typeof updateDriverToolsLanguage !== 'undefined') window.updateDriverToolsLanguage = updateDriverToolsLanguage; } catch (e) {}
try { if (typeof editDriverExpense !== 'undefined') window.editDriverExpense = editDriverExpense; } catch (e) {}
try { if (typeof cancelEditDriverNote !== 'undefined') window.cancelEditDriverNote = cancelEditDriverNote; } catch (e) {}
try { if (typeof toggleDriverNoteComplete !== 'undefined') window.toggleDriverNoteComplete = toggleDriverNoteComplete; } catch (e) {}
try { if (typeof applyTripPreset !== 'undefined') window.applyTripPreset = applyTripPreset; } catch (e) {}
try { if (typeof calculateTripCostEstimate !== 'undefined') window.calculateTripCostEstimate = calculateTripCostEstimate; } catch (e) {}
try { if (typeof closeDriverToolsModal !== 'undefined') window.closeDriverToolsModal = closeDriverToolsModal; } catch (e) {}
try { if (typeof deleteDriverNote !== 'undefined') window.deleteDriverNote = deleteDriverNote; } catch (e) {}
try { if (typeof addDriverNote !== 'undefined') window.addDriverNote = addDriverNote; } catch (e) {}
try { if (typeof deleteDriverExpense !== 'undefined') window.deleteDriverExpense = deleteDriverExpense; } catch (e) {}
try { if (typeof editDriverNote !== 'undefined') window.editDriverNote = editDriverNote; } catch (e) {}
try { if (typeof showMaintWearExplainer !== 'undefined') window.showMaintWearExplainer = showMaintWearExplainer; } catch (e) {}
try { if (typeof syncOdometerFields !== 'undefined') window.syncOdometerFields = syncOdometerFields; } catch (e) {}
try { if (typeof resetDriverExpenseForm !== 'undefined') window.resetDriverExpenseForm = resetDriverExpenseForm; } catch (e) {}
try { if (typeof copyTrafficPortalUrl !== 'undefined') window.copyTrafficPortalUrl = copyTrafficPortalUrl; } catch (e) {}
try { if (typeof openDriverToolsModal !== 'undefined') window.openDriverToolsModal = openDriverToolsModal; } catch (e) {}
try { if (typeof copyTrafficPlateNumber !== 'undefined') window.copyTrafficPlateNumber = copyTrafficPlateNumber; } catch (e) {}
