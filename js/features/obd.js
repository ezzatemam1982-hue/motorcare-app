        /* ==========================================================================
           [MODULE 20] موسوعة وفاحص أكواد الأعطال (OBD-II Diagnostic Trouble Codes Encyclopedia)
           ========================================================================== */
        let obdCodesDatabase = null;
        let activeObdCategory = 'all';
        let obdExpandedCodes = new Set();
        let obdSearchDebounceTimer = null;

        function getCoreObdFallbackList() {
            return [
                {
                    "code": "P0101",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "المحرك ومنظومة الهواء",
                    "systemEn": "Engine & Air Intake",
                    "titleAr": "أداء غير متطابق لحساس تدفق الهواء (MAF)",
                    "titleEn": "Mass Air Flow Sensor Circuit Range/Performance",
                    "severity": "medium",
                    "severityLabelAr": "متوسط",
                    "severityLabelEn": "Medium ⚡",
                    "symptomsAr": "ضعف عزم السيارة، استجابة متأخرة لدواسة البنزين، إضاءة لمبة Check Engine.",
                    "symptomsEn": "Loss of engine power, sluggish throttle response, Check Engine Light on.",
                    "causesAr": ["انسداد شديد في فلتر هواء المحرك", "اتساخ مستشعر الهواء MAF", "تسريب هواء خلف الحساس (Vacuum leak)"],
                    "causesEn": ["Severely clogged engine air filter", "Dirty or contaminated MAF sensor element", "Unmetered air leaks after the sensor (vacuum leak)"],
                    "solutionsAr": ["فحص وتغيير فلتر هواء المحرك", "تنظيف حساس MAF بمنظف الكترونيات خالي من الزيوت", "اختبار خراطيم الفاكيوم بمولد الدخان"],
                    "solutionsEn": ["Inspect and replace the engine air filter if dirty", "Clean the MAF sensor with residue-free electronics cleaner", "Perform smoke test to detect intake vacuum leaks"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0128",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "منظومة التبريد والثرموستات",
                    "systemEn": "Cooling System & Thermostat",
                    "titleAr": "حرارة مياه التبريد أقل من درجة حرارة التشغيل الطبيعية (ثرموستات معلق مفتوح)",
                    "titleEn": "Coolant Thermostat (Coolant Temp Below Regulating Temperature)",
                    "severity": "medium",
                    "severityLabelAr": "متوسط",
                    "severityLabelEn": "Medium ⚡",
                    "symptomsAr": "تأخر وصول المحرك لدرجة حرارته الطبيعية، تدفئة المقصورة ضعيفة، استهلاك وقود مرتفع.",
                    "symptomsEn": "Engine takes excessively long to reach operating temperature on highways, weak cabin heater, higher fuel consumption.",
                    "causesAr": ["ثرموستات الكوعة معلق في وضع الفتح", "إلغاء ثرموستات الحرارة من قبل فني غير متخصص"],
                    "causesEn": ["Coolant thermostat stuck in the open position", "Thermostat removed by unqualified mechanic"],
                    "solutionsAr": ["استبدال ثرموستات الكوعة بآخر أصلي معتمد", "التأكد من عدم إلغاء الثرموستات لما له من ضرر على تزييت المحرك"],
                    "solutionsEn": ["Replace coolant thermostat with OEM temperature-rated unit", "Never remove thermostat as cold engine impairs lubrication and increases wear"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0171",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "منظومة الوقود وخليط الهواء",
                    "systemEn": "Fuel Trim & Air/Fuel Ratio",
                    "titleAr": "خليط الوقود فقير جداً (زيادة هواء أو نقص بنزين - Bank 1)",
                    "titleEn": "System Too Lean (Bank 1)",
                    "severity": "high",
                    "severityLabelAr": "مرتفع",
                    "severityLabelEn": "High ⚠️",
                    "symptomsAr": "تردد وتنتيش مع الدعس، سخونة في المحرك، اهتزاز في السلانسيه، ضعف عزم وسحب السيارة.",
                    "symptomsEn": "Hesitation and stumbling on sudden acceleration, engine running hot, rough idle, loss of pulling power.",
                    "causesAr": ["تسريب هواء فاكيوم (خرطوم سرفو، بلف PCV، جوان مانيفولد)", "اتساخ حساس تدفق الهواء MAF", "ضعف ضغط طلمبة البنزين"],
                    "causesEn": ["Vacuum leaks (brake booster hose, PCV valve, intake manifold gasket)", "Dirty Mass Airflow (MAF) sensor", "Weak fuel pump pressure or clogged fuel filter"],
                    "solutionsAr": ["اختبار تسريب الفاكيوم بمولد الدخان", "تنظيف حساس MAF", "قياس ضغط طلمبة البنزين واستبدال فلتر البنزين"],
                    "solutionsEn": ["Perform smoke machine test to seal intake leaks and inspect PCV valve", "Clean MAF sensor with approved spray", "Test fuel rail pressure and replace fuel filter"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0172",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "منظومة الوقود وخليط الهواء",
                    "systemEn": "Fuel Trim & Air/Fuel Ratio",
                    "titleAr": "خليط الوقود غني جداً (زيادة بنزين غير محترق - Bank 1)",
                    "titleEn": "System Too Rich (Bank 1)",
                    "severity": "high",
                    "severityLabelAr": "مرتفع",
                    "severityLabelEn": "High ⚠️",
                    "symptomsAr": "خروج دخان أسود من الشكمان، رائحة بنزين نفاذة، اسوداد شمعات الإشعال، استهلاك مرتفع للوقود.",
                    "symptomsEn": "Black exhaust smoke, strong raw gasoline odor, black sooty spark plugs, excessively high fuel consumption.",
                    "causesAr": ["تسريب رشاش بنزين معلق مفتوحاً", "انسداد تام في فلتر الهواء", "عطل في حساس الأكسجين الأمامي"],
                    "causesEn": ["Leaking fuel injector stuck in open position", "Excessive fuel pressure due to bad pressure regulator", "Severely restricted or blocked air filter"],
                    "solutionsAr": ["اختبار رشاشات الوقود على جهاز الألتراسونيك", "فحص فلتر الهواء وضغط دورة الوقود"],
                    "solutionsEn": ["Test fuel injectors for dripping / leaking", "Inspect engine air filter and test fuel rail pressure"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0300",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "نظام الإشعال والمحرك",
                    "systemEn": "Ignition System & Engine",
                    "titleAr": "رصد اختلال وتقطيع عشوائي في إشعال الأسطوانات (Random Misfire)",
                    "titleEn": "Random/Multiple Cylinder Misfire Detected",
                    "severity": "critical",
                    "severityLabelAr": "حرج / عاجل",
                    "severityLabelEn": "Critical 🚨",
                    "symptomsAr": "وميض لمبة Check Engine، رجفة شديدة في المحرك، تقطيع وفقدان ملحوظ في العزم.",
                    "symptomsEn": "Flashing Check Engine Light (danger of melting catalytic converter!), violent engine shudder, heavy jerking, major loss of power.",
                    "causesAr": ["تلف أو انتهاء عمر البوجيهات (شمعات الإشعال)", "ضعف أو تلف كويلات الإشعال", "ضعف ضغط طلمبة البنزين"],
                    "causesEn": ["Worn out or fouled spark plugs past service life", "Failing or cracked ignition coils", "Low fuel pressure or failing fuel pump"],
                    "solutionsAr": ["استبدال طقم البوجيهات فوراً بنوع أصلي مطابق للمصنع", "فحص واختبار كويلات الإشعال", "قياس ضغط طلمبة البنزين"],
                    "solutionsEn": ["Replace complete set of spark plugs with factory-specified type", "Test ignition coils for arc breakdown", "Test fuel pump pressure and inspect injectors"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0335",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "حساسات التوقيت والكرنك",
                    "systemEn": "Engine Timing & Crankshaft",
                    "titleAr": "عطل في دائرة حساس موضع عمود الكرنك (Crankshaft Position CKP)",
                    "titleEn": "Crankshaft Position Sensor A Circuit Malfunction",
                    "severity": "critical",
                    "severityLabelAr": "حرج / عاجل",
                    "severityLabelEn": "Critical 🚨",
                    "symptomsAr": "المحرك يدور مارش ولا يعمل نهائياً (Crank No Start)، انطفاء المحرك فجأة أثناء السير.",
                    "symptomsEn": "Engine cranks but will not start (Crank No Start), or engine shuts off abruptly while driving and restarts once cooled.",
                    "causesAr": ["تلف حساس الكرنك المغناطيسي أو حساس هول", "تلف فيشة الحساس أو تآكل الأسلاك بالقرب من السير"],
                    "causesEn": ["Failed Crankshaft Position (CKP) sensor", "Damaged reluctor wheel teeth on flywheel/crank", "Chafed wiring harness near drive belt"],
                    "solutionsAr": ["فحص فيشة وسلك حساس الكرنك", "استبدال حساس الكرنك بآخر أصلي معتمد فوراً"],
                    "solutionsEn": ["Check CKP sensor connector and wiring continuity", "Replace CKP sensor with a genuine OEM replacement immediately to prevent vehicle breakdown"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0420",
                    "category": "powertrain",
                    "system": "engine",
                    "systemAr": "العادم وعلبة البيئة (الكاتاليزر)",
                    "systemEn": "Exhaust & Catalytic Converter",
                    "titleAr": "كفاءة علبة البيئة أقل من الحد المسموح (Catalyst Efficiency Below Threshold)",
                    "titleEn": "Catalyst System Efficiency Below Threshold (Bank 1)",
                    "severity": "medium",
                    "severityLabelAr": "متوسط",
                    "severityLabelEn": "Medium ⚡",
                    "symptomsAr": "إضاءة لمبة فحص المحرك، خروج رائحة كبريت من العادم، ضعف العزم في السرعات العالية إذا كانت العلبة مسدودة.",
                    "symptomsEn": "Check Engine Light on, rotten egg / sulfur exhaust odor, sluggish high-speed acceleration if catalytic converter is restricted.",
                    "causesAr": ["تلف أو تآكل المواد الفعالة داخل علبة البيئة", "تلف حساس الأكسجين الخلفي", "تنفيس في مواسير الشكمان"],
                    "causesEn": ["Degraded catalytic precious metals inside converter substrate", "Faulty downstream O2 sensor mimicking upstream sensor wave", "Exhaust leak before the catalytic converter"],
                    "solutionsAr": ["فحص تسريبات الشكمان ولحام أي تنفيس قبل الكاتاليزر", "مقارنة إشارة حساس الشكمان الأمامي والخلفي", "تنظيف أو استبدال علبة البيئة"],
                    "solutionsEn": ["Check for and seal exhaust leaks ahead of the converter", "Compare upstream vs downstream O2 sensor waveforms with scan tool", "Clean or replace catalytic converter with OEM certified assembly"],
                    "quickCmCategory": "engine"
                },
                {
                    "code": "P0700",
                    "category": "powertrain",
                    "system": "transmission",
                    "systemAr": "ناقل الحركة الأوتوماتيكي (الفتيس)",
                    "systemEn": "Automatic Transmission Control",
                    "titleAr": "طلب إضاءة لمبة الأعطال من كمبيوتر ناقل الحركة (TCM)",
                    "titleEn": "Transmission Control System (MIL Request)",
                    "severity": "high",
                    "severityLabelAr": "مرتفع",
                    "severityLabelEn": "High ⚠️",
                    "symptomsAr": "تثبيت الفتيس على الغيار الثالث (Limp Mode وضع الأمان)، ثقل في سحب السيارة.",
                    "symptomsEn": "Transmission locked in 3rd gear (Limp Mode fail-safe), sluggish off-the-line acceleration.",
                    "causesAr": ["عطل مسجل داخل وحدة TCM", "نقص أو احتراق زيت الفتيس", "عطل في أحد بلوف نقل السرعات"],
                    "causesEn": ["DTC stored inside Transmission Control Module (requires TCM code scanning)", "Low or burnt transmission fluid", "Shift solenoid electrical failure"],
                    "solutionsAr": ["فحص كمبيوتر الفتيس بجهاز كشف أعطال متخصص لقراءة الكود الداخلي", "فحص مستوى ولون زيت الفتيس وتغييره"],
                    "solutionsEn": ["Scan TCM with diagnostic tool to read underlying sub-codes", "Check transmission fluid level, color, and condition; replace fluid and filter"],
                    "quickCmCategory": "transmission"
                },
                {
                    "code": "C0035",
                    "category": "chassis",
                    "system": "brakes",
                    "systemAr": "منظومة الفرامل والـ ABS",
                    "systemEn": "Braking System & ABS",
                    "titleAr": "عطل في حساس سرعة العجلة الأمامية اليسرى (ABS Sensor)",
                    "titleEn": "Left Front Wheel Speed Sensor Circuit",
                    "severity": "high",
                    "severityLabelAr": "مرتفع",
                    "severityLabelEn": "High ⚠️",
                    "symptomsAr": "إضاءة لمبة ABS ولمبة مانع الانزلاق ESP، توقف خاصية منع انغلاق الفرامل.",
                    "symptomsEn": "ABS warning light and ESP/Traction light illuminated, ABS disabled falling back to standard brakes.",
                    "causesAr": ["تلف حساس سرعة العجلة", "قطع في سلك الحساس بسبب حركة العفشة أو المطبات", "اتساخ الترس المغناطيسي في رمان البلي"],
                    "causesEn": ["Defective left front wheel speed sensor", "Damaged sensor wire due to suspension travel or road debris", "Debris or metallic dust on magnetic reluctor tone ring in wheel bearing hub"],
                    "solutionsAr": ["فحص سلك وفيشة حساس العجلة", "تنظيف الحساس والترس المسنن", "استبدال الحساس"],
                    "solutionsEn": ["Inspect left front wheel speed sensor wiring and connector", "Clean sensor tip and magnetic tone ring", "Replace sensor or bearing hub with integrated magnetic encoder"],
                    "quickCmCategory": "brakes"
                },
                {
                    "code": "U0100",
                    "category": "network",
                    "system": "network",
                    "systemAr": "شبكة الاتصال وكمبيوتر المحرك (CAN Bus)",
                    "systemEn": "CAN Bus & ECM Communication",
                    "titleAr": "انقطاع الاتصال بين كمبيوترات السيارة وكمبيوتر المحرك (Lost Comm with ECM)",
                    "titleEn": "Lost Communication With ECM/PCM 'A'",
                    "severity": "critical",
                    "severityLabelAr": "حرج / عاجل",
                    "severityLabelEn": "Critical 🚨",
                    "symptomsAr": "السيارة لا تعمل، لوحة العدادات تومض بعلامات خطأ أو خطوط، لمبات الفتيس والفرامل مضاءة بالكامل.",
                    "symptomsEn": "No-start condition, cluster blinking dashes (---) or full array of warnings, transmission and brake lights on.",
                    "causesAr": ["انقطاع التغذية أو الأرضي عن كمبيوتر المحرك", "تلف فيوز أو ريليه رئيسي", "قطع أو قصر في ضفيرة شبكة CAN Bus"],
                    "causesEn": ["Lost 12V power feed or ground to engine ECM", "Blown main PCM relay or fuse", "Open or shorted CAN Bus high-speed wires (CAN-H and CAN-L)"],
                    "solutionsAr": ["فحص الفيوزات والريليهات الرئيسية للمحرك والتأكد من وصول 12V", "قياس مقاومة خطوط CAN Bus في فيشة OBD (60 أوم تقريباً)"],
                    "solutionsEn": ["Check main engine relays and fuses to ensure 12V reaches computer", "Measure CAN Bus terminating resistance across pins 6 and 14 on OBD-II port (should measure approx 60 ohms)"],
                    "quickCmCategory": "engine"
                }
            ];
        }

        function preIndexObdDatabase() {
            if (!obdCodesDatabase || !Array.isArray(obdCodesDatabase)) return;
            obdCodesDatabase.forEach(item => {
                if (!item._searchIndex) {
                    const parts = [
                        item.code || '',
                        item.titleAr || '',
                        item.titleEn || '',
                        item.systemAr || '',
                        item.systemEn || '',
                        item.symptomsAr || '',
                        item.symptomsEn || '',
                        ...(item.causesAr || []),
                        ...(item.causesEn || []),
                        ...(item.solutionsAr || []),
                        ...(item.solutionsEn || [])
                    ];
                    item._searchIndex = parts.join(' ').toLowerCase();
                }
            });
        }

        async function loadObdDatabase() {
            if (obdCodesDatabase && obdCodesDatabase.length > 0 && obdCodesDatabase[0].causesEn) {
                preIndexObdDatabase();
                return obdCodesDatabase;
            }

            // 1. Direct memory check from offline obd_codes.js
            if (typeof window !== 'undefined' && window.MOTORCARE_FULL_OBD_CODES && Array.isArray(window.MOTORCARE_FULL_OBD_CODES) && window.MOTORCARE_FULL_OBD_CODES.length > 0) {
                obdCodesDatabase = window.MOTORCARE_FULL_OBD_CODES;
                preIndexObdDatabase();
                try { SafeStorage.setItem('motorCare_obd_cache', JSON.stringify(obdCodesDatabase)); } catch (e) {}
                return obdCodesDatabase;
            }

            // 2. Fetch from obd_codes.json (network / http server)
            try {
                const response = await fetch('./obd_codes.json');
                if (response && response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        obdCodesDatabase = data;
                        preIndexObdDatabase();
                        try { SafeStorage.setItem('motorCare_obd_cache', JSON.stringify(data)); } catch (e) {}
                        return obdCodesDatabase;
                    }
                }
            } catch (err) {
                console.warn('[MotorCare OBD] fetch failed (possible offline or file:// origin):', err);
            }

            // 3. Fallback to local storage cache
            try {
                const cached = SafeStorage.getItem('motorCare_obd_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].causesEn) {
                        obdCodesDatabase = parsed;
                        preIndexObdDatabase();
                        return obdCodesDatabase;
                    }
                }
            } catch (e) {}

            // 4. Core embedded fallback
            obdCodesDatabase = getCoreObdFallbackList();
            preIndexObdDatabase();
            return obdCodesDatabase;
        }

        function updateObdModalLanguage() {
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const searchInput = document.getElementById('obdSearchInput');
            if (searchInput) {
                searchInput.placeholder = isEn 
                    ? "Search by code (e.g. P0300) or keyword (misfire, oxygen, transmission, heat)..."
                    : "ابحث برمز الكود (مثل P0300) أو بالعربي (أكسجين، فتيس، بوجيهات، حرارة)...";
            }

            const catLabels = {
                all: isEn ? "All" : "الكل",
                engine: isEn ? "Engine (P)" : "محرك وإشعال (P)",
                transmission: isEn ? "Transmission (P/T)" : "ناقل حركة (P/T)",
                brakes: isEn ? "Brakes & ABS (C)" : "فرامل وABS (C)",
                body: isEn ? "Body & Electric (B)" : "كهرباء وهيكل (B)",
                network: isEn ? "CAN Network (U)" : "شبكة CAN (U)"
            };
            Object.keys(catLabels).forEach(cat => {
                const btn = document.getElementById(`obdCatBtn-${cat}`);
                if (btn) {
                    const labelEl = btn.querySelector('.obd-cat-label') || btn;
                    labelEl.innerText = catLabels[cat];
                }
            });

            const sevSelect = document.getElementById('obdSeverityFilter');
            if (sevSelect) {
                const currentVal = sevSelect.value;
                sevSelect.innerHTML = isEn ? `
                    <option value="all">All Levels</option>
                    <option value="critical">Critical 🚨</option>
                    <option value="high">High ⚠️</option>
                    <option value="medium">Medium ⚡</option>
                    <option value="low">Notice ℹ️</option>
                ` : `
                    <option value="all">كافة المستويات</option>
                    <option value="critical">حرج / عاجل 🚨</option>
                    <option value="high">مرتفع ⚠️</option>
                    <option value="medium">متوسط ⚡</option>
                    <option value="low">تنبيه ℹ️</option>
                `;
                sevSelect.value = currentVal;
            }

            const sevLabel = document.getElementById('obdSeverityLabel');
            if (sevLabel) sevLabel.innerText = isEn ? "Severity:" : "الخطورة:";

            const tipText = document.getElementById('obdTipText');
            if (tipText) tipText.innerText = isEn 
                ? "Click any code card to expand root causes and repair steps"
                : "انقر على أي كود لعرض الأسباب والحلول وخطوات الإصلاح";

            const footerNote = document.getElementById('obdFooterNoteText');
            if (footerNote) footerNote.innerText = isEn
                ? "Flashing Check Engine light indicates a critical misfire requiring immediate inspection"
                : "وميض لمبة Check Engine يعني عطلاً حرجاً يتطلب الفحص الفوري";

            const closeBtn = document.getElementById('obdCloseBtnText');
            if (closeBtn) closeBtn.innerText = isEn ? "Close" : "إغلاق";
        }

        async function openObdEncyclopediaModal(initialSearch = '') {
            const modal = document.getElementById('obdEncyclopediaModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }

            updateObdModalLanguage();

            const input = document.getElementById('obdSearchInput');
            if (input) {
                input.value = initialSearch;
                const clearBtn = document.getElementById('obdClearSearchBtn');
                if (clearBtn) clearBtn.classList.toggle('hidden', !initialSearch);
            }

            await loadObdDatabase();
            renderObdCodesList();
        }

        function closeObdEncyclopediaModal() {
            const modal = document.getElementById('obdEncyclopediaModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function setObdCategoryFilter(cat) {
            activeObdCategory = cat;
            const categories = ['all', 'engine', 'transmission', 'brakes', 'body', 'network'];
            categories.forEach(c => {
                const btn = document.getElementById(`obdCatBtn-${c}`);
                if (!btn) return;
                if (c === cat) {
                    btn.className = 'px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white cursor-pointer transition-all shadow-2xs';
                } else {
                    btn.className = 'px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all';
                }
            });

            renderObdCodesList();
        }

        function onObdSearchInput() {
            const input = document.getElementById('obdSearchInput');
            const clearBtn = document.getElementById('obdClearSearchBtn');
            if (input && clearBtn) {
                clearBtn.classList.toggle('hidden', !input.value);
            }

            if (obdSearchDebounceTimer) clearTimeout(obdSearchDebounceTimer);
            obdSearchDebounceTimer = setTimeout(() => {
                renderObdCodesList();
            }, 25);
        }

        function clearObdSearch() {
            const input = document.getElementById('obdSearchInput');
            const clearBtn = document.getElementById('obdClearSearchBtn');
            if (input) {
                input.value = '';
                input.focus();
            }
            if (clearBtn) clearBtn.classList.add('hidden');
            renderObdCodesList();
        }

        function toggleObdDetails(code) {
            if (obdExpandedCodes.has(code)) {
                obdExpandedCodes.delete(code);
            } else {
                obdExpandedCodes.add(code);
            }
            renderObdCodesList();
        }

        function copyObdCode(code, e) {
            if (e) e.stopPropagation();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    showNotification(isEn ? `Trouble code (${code}) copied to clipboard` : `تم نسخ رمز الكود (${code}) بنجاح`, 'success', 2500);
                }).catch(() => {
                    showNotification(`Code: ${code}`, 'info', 2500);
                });
            } else {
                showNotification(`Code: ${code}`, 'info', 2500);
            }
        }

        function convertObdToUrgentCM(code, titleAr, titleEn, e) {
            if (e) e.stopPropagation();
            closeObdEncyclopediaModal();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            if (typeof openAddCustomPMModal === 'function') {
                openAddCustomPMModal('CM');
                const nameInput = document.getElementById('customPMNameInput');
                if (nameInput) {
                    nameInput.value = isEn ? `Fault ${code}: ${titleEn || titleAr}` : `عطل ${code}: ${titleAr}`;
                }
                showNotification(isEn ? `Transferred trouble code (${code}) to Urgent Maintenance (CM)` : `تم نقل بيانات العطل (${code}) إلى استمارة الصيانة العاجلة CM`, 'info', 3500);
            }
        }

        function renderObdCodesList() {
            const listEl = document.getElementById('obdResultsList');
            const countEl = document.getElementById('obdResultsCountText');
            if (!listEl) return;

            if (!obdCodesDatabase || obdCodesDatabase.length === 0) {
                listEl.innerHTML = `
                    <div class="p-8 text-center text-slate-400 dark:text-slate-500">
                        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-amber-500"></i>
                        <p class="text-xs font-bold">${typeof appState !== 'undefined' && appState.lang === 'en' ? 'Loading trouble codes library...' : 'جاري تحميل مكتبة الأكواد...'}</p>
                    </div>
                `;
                return;
            }

            const rawQuery = (document.getElementById('obdSearchInput')?.value || '').trim().toLowerCase();
            const severityFilter = document.getElementById('obdSeverityFilter')?.value || 'all';
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            const filtered = obdCodesDatabase.filter(item => {
                // 1. Category Filter
                if (activeObdCategory !== 'all') {
                    if (item.system !== activeObdCategory) return false;
                }

                // 2. Severity Filter
                if (severityFilter !== 'all') {
                    if (item.severity !== severityFilter) return false;
                }

                // 3. Search Query Filter
                if (!rawQuery) return true;

                if (item.code && item.code.toLowerCase().includes(rawQuery)) return true;
                return item._searchIndex ? item._searchIndex.includes(rawQuery) : true;
            });

            if (countEl) {
                countEl.innerText = isEn
                    ? `Found ${filtered.length} matching codes out of ${obdCodesDatabase.length}`
                    : `تم العثور على ${filtered.length} كود مطابق من أصل ${obdCodesDatabase.length} مسجل`;
            }

            if (filtered.length === 0) {
                listEl.innerHTML = `
                    <div class="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                        <i class="fa-solid fa-circle-question text-3xl text-amber-500/70 mb-1"></i>
                        <h4 class="text-xs font-black text-slate-700 dark:text-slate-300">${isEn ? 'No Matching Codes Found' : 'لم يتم العثور على أكواد مطابقة'}</h4>
                        <p class="text-[11px] text-slate-400 max-w-sm mx-auto">${isEn ? 'Try searching by code like P0300 or keywords like oxygen, misfire, transmission.' : 'جرب البحث برمز الكود مثل P0300 أو بكلمات مثل (حساس، أكسجين، فتيس، بوجيهات، حرارة).'}</p>
                    </div>
                `;
                return;
            }

            // Virtual limit to top 60 items for blazing fast DOM rendering
            const displayList = filtered.slice(0, 60);

            let html = '';
            displayList.forEach(item => {
                const isExpanded = obdExpandedCodes.has(item.code);

                // Severity Badges
                const severityLabel = isEn ? (item.severityLabelEn || item.severityLabelAr || 'Notice') : (item.severityLabelAr || 'تنبيه');
                let sevBadge = '';
                if (item.severity === 'critical') {
                    sevBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> ${severityLabel}</span>`;
                } else if (item.severity === 'high') {
                    sevBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 flex items-center gap-1 shadow-2xs">${severityLabel}</span>`;
                } else if (item.severity === 'medium') {
                    sevBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">${severityLabel}</span>`;
                } else {
                    sevBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1 shadow-2xs">${severityLabel}</span>`;
                }

                // System Icon
                let sysIcon = 'fa-solid fa-microchip';
                if (item.system === 'transmission') sysIcon = 'fa-solid fa-gears text-purple-500';
                else if (item.system === 'brakes') sysIcon = 'fa-solid fa-circle-stop text-rose-500';
                else if (item.system === 'body') sysIcon = 'fa-solid fa-car text-blue-500';
                else if (item.system === 'network') sysIcon = 'fa-solid fa-network-wired text-indigo-500';
                else sysIcon = 'fa-solid fa-fire text-amber-500';

                // Localized Text Selection
                const displaySymptoms = isEn ? (item.symptomsEn || item.symptomsAr) : (item.symptomsAr || item.symptomsEn);
                const displayCauses = isEn ? (item.causesEn || item.causesAr || []) : (item.causesAr || item.causesEn || []);
                const displaySolutions = isEn ? (item.solutionsEn || item.solutionsAr || []) : (item.solutionsAr || item.solutionsEn || []);

                html += `
                    <div class="bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 space-y-2.5 transition-all shadow-xs hover:border-amber-500/50">
                        <!-- Top Bar: Code, System, Severity -->
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="copyObdCode('${item.code}', event)" class="px-2.5 py-1 bg-slate-900 text-amber-400 font-mono font-black text-xs sm:text-sm rounded-xl tracking-wider hover:bg-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95" title="${isEn ? 'Copy trouble code' : 'نسخ رمز الكود'}">
                                    <span>${item.code}</span>
                                    <i class="fa-regular fa-copy text-[10px] text-slate-400 hover:text-white"></i>
                                </button>
                                <span class="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                    <i class="${sysIcon} text-[10px]"></i>
                                    <span>${isEn ? (item.systemEn || item.systemAr) : item.systemAr}</span>
                                </span>
                            </div>
                            <div class="shrink-0">${sevBadge}</div>
                        </div>

                        <!-- Title & Description -->
                        <div>
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-snug">
                                ${isEn ? item.titleEn : item.titleAr}
                            </h4>
                            <p class="text-[11px] text-slate-400 font-mono mt-0.5">
                                ${isEn ? item.titleAr : item.titleEn}
                            </p>
                        </div>

                        <!-- Symptoms Box -->
                        ${displaySymptoms ? `
                            <div class="text-[11px] bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                <i class="fa-solid fa-stethoscope text-amber-500 text-xs mt-0.5 shrink-0"></i>
                                <div><strong class="font-bold text-slate-700 dark:text-slate-200">${isEn ? 'Symptoms: ' : 'الأعراض الملموسة: '}</strong>${displaySymptoms}</div>
                            </div>
                        ` : ''}

                        <!-- Expand / Collapse Toggle Button -->
                        <div class="pt-1 flex items-center justify-between">
                            <button type="button" onclick="toggleObdDetails('${item.code}')" class="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1.5 transition-colors">
                                <i class="fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]"></i>
                                <span>${isExpanded ? (isEn ? 'Hide Causes & Repair Steps' : 'إخفاء الأسباب وخطوات الإصلاح') : (isEn ? 'View Causes & Repair Solutions' : 'عرض الأسباب الشائعة وطرق الإصلاح')}</span>
                            </button>

                            <button type="button" onclick="convertObdToUrgentCM('${item.code}', '${(item.titleAr || '').replace(/'/g, "\\'")}', '${(item.titleEn || '').replace(/'/g, "\\'")}', event)" class="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-xl text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-2xs">
                                <i class="fa-solid fa-triangle-exclamation text-[10px] text-rose-500"></i>
                                <span>${isEn ? 'Log as Urgent CM' : 'تحويل لعطل عاجل CM'}</span>
                            </button>
                        </div>

                        <!-- Accordion Detail Area -->
                        ${isExpanded ? `
                            <div class="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-150">
                                <!-- Common Causes -->
                                <div class="bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40 space-y-1.5">
                                    <div class="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                        <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
                                        <span>${isEn ? 'Most Common Root Causes:' : 'أهم الأسباب المحتملة للعطل:'}</span>
                                    </div>
                                    <ul class="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ps-1">
                                        ${displayCauses.map(cause => `<li>${cause}</li>`).join('')}
                                    </ul>
                                </div>

                                <!-- Recommended Solutions -->
                                <div class="bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5">
                                    <div class="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                        <i class="fa-solid fa-wrench text-emerald-500"></i>
                                        <span>${isEn ? 'Recommended Fixes & Diagnostic Steps:' : 'الإجراء السليم وخطوات الإصلاح المقترحة:'}</span>
                                    </div>
                                    <ul class="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside ps-1">
                                        ${displaySolutions.map(sol => `<li>${sol}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            if (filtered.length > 60) {
                html += `
                    <div class="p-3 text-center text-xs font-bold text-slate-400">
                        <span>${isEn ? `Showing first 60 matching codes out of ${filtered.length}. Search by code for exact match.` : `يتم عرض أول 60 كود مطابق من أصل ${filtered.length}. حدد البحث بالرمز أو النظام لرؤية نتائج أدق.`}</span>
                    </div>
                `;
            }

            listEl.innerHTML = html;
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof updateObdModalLanguage !== 'undefined') window.updateObdModalLanguage = updateObdModalLanguage; } catch (e) {}
try { if (typeof convertObdToUrgentCM !== 'undefined') window.convertObdToUrgentCM = convertObdToUrgentCM; } catch (e) {}
try { if (typeof renderObdCodesList !== 'undefined') window.renderObdCodesList = renderObdCodesList; } catch (e) {}
try { if (typeof loadObdDatabase !== 'undefined') window.loadObdDatabase = loadObdDatabase; } catch (e) {}
try { if (typeof getCoreObdFallbackList !== 'undefined') window.getCoreObdFallbackList = getCoreObdFallbackList; } catch (e) {}
try { if (typeof toggleObdDetails !== 'undefined') window.toggleObdDetails = toggleObdDetails; } catch (e) {}
try { if (typeof preIndexObdDatabase !== 'undefined') window.preIndexObdDatabase = preIndexObdDatabase; } catch (e) {}
try { if (typeof closeObdEncyclopediaModal !== 'undefined') window.closeObdEncyclopediaModal = closeObdEncyclopediaModal; } catch (e) {}
try { if (typeof setObdCategoryFilter !== 'undefined') window.setObdCategoryFilter = setObdCategoryFilter; } catch (e) {}
try { if (typeof openObdEncyclopediaModal !== 'undefined') window.openObdEncyclopediaModal = openObdEncyclopediaModal; } catch (e) {}
try { if (typeof onObdSearchInput !== 'undefined') window.onObdSearchInput = onObdSearchInput; } catch (e) {}
try { if (typeof clearObdSearch !== 'undefined') window.clearObdSearch = clearObdSearch; } catch (e) {}
try { if (typeof copyObdCode !== 'undefined') window.copyObdCode = copyObdCode; } catch (e) {}
