        /* ==========================================================================
           [SECURITY & INPUT SANITIZATION] طبقة الأمان والتحقق وتنقية المدخلات ومنع ثغرات XSS
           ========================================================================== */
        const MotorCareSecurity = {
            // تنظيف وترميز النصوص لمنع هجمات الحقن Cross-Site Scripting (XSS)
            escapeHtml(str) {
                if (str === null || str === undefined) return '';
                return String(str).replace(/[&<>"'/]/g, function (s) {
                    return {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;',
                        '/': '&#x2F;'
                    }[s];
                });
            },

            // تنقية النصوص وإزالة محارف التحكم الخفية والحد من الطول الأقصى
            sanitizeText(str, maxLength = 300) {
                if (str === null || str === undefined) return '';
                return String(str)
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // إزالة محارف التحكم غير المرئية
                    .trim()
                    .slice(0, maxLength);
            },

            // التحقق الصارم من الأعداد الصحيحة الموجبة فقط (عداد الكيلومترات، سنة الصنع، الأرقام)
            parsePositiveInt(val, fallback = 0, min = 0, max = 99999999) {
                if (val === null || val === undefined) return fallback;
                const clean = String(val).replace(/[^\d]/g, '');
                if (!clean) return fallback;
                const num = parseInt(clean, 10);
                if (isNaN(num) || !isFinite(num)) return fallback;
                return Math.min(Math.max(num, min), max);
            },

            // التحقق الصارم من الأعداد العشرية الموجبة فقط (المسافات، اللترات، التكاليف، الرسوم)
            parsePositiveFloat(val, fallback = 0, min = 0, max = 99999999) {
                if (val === null || val === undefined) return fallback;
                const clean = String(val).replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
                if (!clean) return fallback;
                const num = parseFloat(clean);
                if (isNaN(num) || !isFinite(num)) return fallback;
                return Math.min(Math.max(num, min), max);
            },

            // التحقق الصارم لرقم الشاسيه (VIN) وفقاً للمواصفات القياسية الدولية (ISO 3779)
            // يقبل حصرياً 17 خانة من الحروف الإنجليزية والأرقام، مع استبعاد الحروف (I, O, Q) والحروف العربية والرموز
            validateVIN(vin, isRequired = false) {
                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (!vin || !String(vin).trim()) {
                    return {
                        isValid: !isRequired,
                        error: isRequired 
                            ? (isEn ? 'VIN is required.' : 'رقم الشاسيه مطلوب.') 
                            : null,
                        sanitized: ''
                    };
                }
                const raw = String(vin).trim();
                const sanitized = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');

                // فحص وجود حروف عربية
                if (/[\u0600-\u06FF]/.test(raw)) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Arabic characters are strictly prohibited in the VIN field. Use standard alphanumeric characters only.' 
                            : 'ممنوع إدخال حروف عربية في خانة رقم الشاسيه (VIN). يُسمح بالرموز الإنجليزية القياسية والأرقام فقط.',
                        sanitized
                    };
                }

                // فحص الحروف المحظورة دولياً لمنع الالتباس مع الأرقام (I, O, Q)
                if (/[IOQioq]/.test(raw)) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Letters (I, O, Q) are invalid in ISO 3779 VINs to prevent confusion with numerals 1 and 0.' 
                            : 'وفقاً لمواصفات ISO 3779 القياسية، الحروف (I, O, Q) مستبعدة تماماً لمنع الالتباس مع الأرقام (1 و 0).',
                        sanitized
                    };
                }

                // فحص وجود رموز خاصة أو مسافات
                if (/[^A-Za-z0-9]/.test(raw)) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'VIN cannot contain spaces or special symbols.' 
                            : 'رقم الشاسيه لا يمكن أن يحتوي على مسافات أو رموز خاصة.',
                        sanitized
                    };
                }

                // التحقق من الطول الدقيق (17 خانة)
                if (sanitized.length !== 17) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? `Incomplete VIN (${sanitized.length}/17). Standard VIN must be exactly 17 characters.` 
                            : `رقم الشاسيه غير مكتمل (${sanitized.length}/17 رمزاً). يجب أن يتكون من 17 خانة قياسية بالضبط.`,
                        sanitized
                    };
                }

                return {
                    isValid: true,
                    error: null,
                    sanitized
                };
            },

            // التحقق الصارم من قراءة عداد الكيلومترات (Odometer)
            // يقبل أرقاماً موجبة فقط ويمنع الحروف والرموز والقيم غير المنطقية
            validateOdometer(odo, maxKm = 2000000) {
                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (odo === null || odo === undefined || String(odo).trim() === '') {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Odometer reading is required to track maintenance accurately.' 
                            : 'قراءة العداد مطلوبة لحساب جداول الصيانة بدقة.',
                        value: 0
                    };
                }
                const raw = String(odo).trim();
                // منع الحروف أو الرموز الخاصة أو السالب
                if (/[^\d]/.test(raw)) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Odometer must be positive whole numbers only. No letters or symbols allowed.' 
                            : 'قراءة العداد يجب أن تقبل أرقاماً موجبة فقط، وتمنع الحروف أو الرموز الخاصة.',
                        value: 0
                    };
                }
                const val = parseInt(raw, 10);
                if (isNaN(val) || val < 0) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Please enter a valid positive odometer value.' 
                            : 'يرجى إدخال قراءة عداد موجبة وصحيحة.',
                        value: 0
                    };
                }
                if (val > maxKm) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? `Unrealistic odometer reading! Maximum limit is ${maxKm.toLocaleString()} km.` 
                            : `قراءة العداد غير واقعية! الحد الأقصى المسموح به هو ${maxKm.toLocaleString()} كم.`,
                        value: val
                    };
                }
                return {
                    isValid: true,
                    error: null,
                    value: val
                };
            },

            // التحقق الصارم من رقم وتنسيق اللوحة المعدنية (License Plate)
            // الالتزام بالتنسيق المعتاد للوحات المعدنية ومنع الإدخالات العشوائية الضارة
            validateLicensePlate(plate, isRequired = false) {
                const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                if (!plate || !String(plate).trim()) {
                    return {
                        isValid: !isRequired,
                        error: isRequired 
                            ? (isEn ? 'License plate is required.' : 'رقم اللوحة مطلوب.') 
                            : null,
                        sanitized: ''
                    };
                }
                const raw = String(plate).trim();
                // منع الرموز البرمجية والمدخلات الضارة (XSS / Scripts / Punctuation)
                if (/[<>{}\[\]=;()&$%*+~^`"'\\]/.test(raw)) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Special symbols and scripts are forbidden in the license plate field.' 
                            : 'يُمنع إدخال الرموز الخاصة أو الأكواد في خانة اللوحة لحماية البيانات.',
                        sanitized: ''
                    };
                }
                // اللوحات الرسمية المعتمدة: حروف عربية أو إنجليزية + أرقام + مسافات أو شرطات
                const plateRegex = /^[\u0621-\u064AA-Za-z0-9\u0660-\u0669\s\-]{2,15}$/;
                if (!plateRegex.test(raw)) {
                    return {
                        isValid: false,
                        error: isEn 
                            ? 'Invalid plate format! Enter standard letters and digits (e.g. ABC 1234 or أ ب ج 1234).' 
                            : 'تنسيق اللوحة غير مطابق! يرجى إدخال حروف وأرقام اللوحة المعتادة (مثال: أ ب ج 1234 أو ABC 1234).',
                        sanitized: raw
                    };
                }
                return {
                    isValid: true,
                    error: null,
                    sanitized: raw
                };
            },

            // تأثير الاهتزاز البصري الفوري للحقول غير الصحيحة (Visual Shake Animation)
            shakeElement(elementOrId) {
                const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
                if (!el) return;
                el.classList.add('input-shake-error', 'border-rose-500', 'ring-2', 'ring-rose-500/40');
                setTimeout(() => {
                    el.classList.remove('input-shake-error');
                }, 400);
            },

            // حماية حقول الإدخال في الواجهة لحظياً ضد الأرقام السالبة والرموز غير المسموحة
            initInputGuards() {
                // 1. حقول الأعداد الصحيحة (عدادات، سنوات صنع، أيام، ضغط الإطارات)
                const integerInputIds = [
                    'newOdometerValueInput', 'newCarOdoInput', 'newCarYearInput',
                    'editCarOdoInput', 'editCarYearInput', 'fuelOdometerInput',
                    'recordOdometerInput', 'dtExpenseOdometerInput', 'dtTripOdoStartInput',
                    'dtTripOdoEndInput', 'customPMKmInput', 'customPMMonthsInput',
                    'editItemKmInput', 'editItemMonthsInput', 'tiresFrontPsiInput', 'tiresRearPsiInput'
                ];

                integerInputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('min', '0');
                        el.setAttribute('inputmode', 'numeric');
                        el.addEventListener('keydown', function(e) {
                            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                e.preventDefault();
                            }
                        });
                        el.addEventListener('input', function() {
                            this.value = this.value.replace(/[^\d]/g, '');
                        });
                    }
                });

                // 2. حقول الأعداد العشرية الموجبة (تكاليف، لترات، استهلاك، أسعار، مسافات)
                const decimalInputIds = [
                    'recordPartsCostInput', 'recordLaborCostInput', 'fuelLitersInput',
                    'fuelCostInput', 'dtExpenseAmountInput', 'dtTripDistanceInput',
                    'dtTripTollsInput', 'dtTripConsumptionInput', 'dtTripFuelPriceInput'
                ];

                decimalInputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('min', '0');
                        el.setAttribute('inputmode', 'decimal');
                        el.addEventListener('keydown', function(e) {
                            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                                e.preventDefault();
                            }
                        });
                        el.addEventListener('input', function() {
                            this.value = this.value.replace(/[^\d.]/g, '').replace(/(\..*?)\..*/g, '$1');
                        });
                    }
                });

                // 3. التحقق اللحظي التفاعلي لرقم الشاسيه (VIN Validation Guards)
                ['newCarVinInput', 'editCarVinInput'].forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    const prefix = id === 'newCarVinInput' ? 'newCarVin' : 'editCarVin';
                    
                    el.setAttribute('maxlength', '17');
                    el.setAttribute('autocomplete', 'off');
                    el.setAttribute('spellcheck', 'false');

                    el.addEventListener('input', function() {
                        const raw = this.value;
                        const hasArabic = /[\u0600-\u06FF]/.test(raw);
                        const hasForbidden = /[IOQioq]/.test(raw);
                        
                        // إزالة أي رموز غير مسموحة والتحويل لأحرف كبيرة فوراً
                        let clean = raw.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);
                        if (clean !== raw) {
                            this.value = clean;
                        }

                        const msgEl = document.getElementById(prefix + 'Msg');
                        const badgeEl = document.getElementById(prefix + 'Badge');

                        if (badgeEl) badgeEl.innerText = `${clean.length}/17`;

                        if (hasArabic) {
                            if (msgEl) msgEl.innerHTML = '<span class="text-rose-500 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> ممنوع الحروف العربية في رقم الشاسيه</span>';
                            MotorCareSecurity.shakeElement(this);
                        } else if (hasForbidden) {
                            if (msgEl) msgEl.innerHTML = '<span class="text-amber-500 font-bold"><i class="fa-solid fa-circle-info"></i> تم استبعاد الحروف (I, O, Q) طبقاً لمواصفات ISO 3779</span>';
                        } else if (clean.length === 17) {
                            this.classList.remove('border-rose-500', 'border-amber-500', 'ring-rose-500/40', 'ring-amber-500/40');
                            this.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500/30');
                            if (msgEl) msgEl.innerHTML = '<span class="text-emerald-500 font-bold"><i class="fa-solid fa-circle-check"></i> رقم شاسيه قياسي مطابق 100% (ISO 3779)</span>';
                            if (badgeEl) {
                                badgeEl.className = 'font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400';
                            }
                        } else if (clean.length > 0) {
                            this.classList.remove('border-rose-500', 'border-emerald-500', 'ring-emerald-500/30');
                            this.classList.add('border-amber-500', 'ring-1', 'ring-amber-500/30');
                            if (msgEl) msgEl.innerHTML = `<span class="text-amber-500 font-bold"><i class="fa-solid fa-circle-notch fa-spin text-[9px]"></i> يتبقى ${17 - clean.length} رمزاً لاكتمال الشاسيه</span>`;
                            if (badgeEl) {
                                badgeEl.className = 'font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400';
                            }
                        } else {
                            this.classList.remove('border-rose-500', 'border-amber-500', 'border-emerald-500', 'ring-2', 'ring-1', 'ring-emerald-500/30', 'ring-amber-500/30', 'ring-rose-500/40');
                            if (msgEl) msgEl.innerHTML = '<span class="text-slate-400 font-medium">17 خانة قياسية دولية (ISO 3779) - استبعاد I, O, Q</span>';
                            if (badgeEl) {
                                badgeEl.className = 'font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500';
                            }
                        }
                    });
                });

                // 4. التحقق اللحظي التفاعلي لعداد الكيلومترات (Odometer Real-time Validation)
                ['newCarOdoInput', 'editCarOdoInput', 'newOdometerValueInput'].forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    const prefix = id === 'newCarOdoInput' ? 'newCarOdo' : (id === 'editCarOdoInput' ? 'editCarOdo' : 'quickOdo');
                    el.addEventListener('input', function() {
                        const val = this.value.trim();
                        const msgEl = document.getElementById(prefix + 'Msg');
                        if (!msgEl) return;
                        if (!val) {
                            msgEl.innerHTML = '<span class="text-slate-400 font-medium">أرقام موجبة فقط (مثال: 45000 كم)</span>';
                            el.classList.remove('border-rose-500', 'border-emerald-500', 'ring-2', 'ring-rose-500/40', 'ring-emerald-500/30');
                            return;
                        }
                        const num = parseInt(val, 10);
                        if (isNaN(num) || num < 0) {
                            msgEl.innerHTML = '<span class="text-rose-500 font-bold"><i class="fa-solid fa-circle-exclamation"></i> قراءة عداد غير صحيحة</span>';
                            el.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/40');
                        } else if (num > 2000000) {
                            msgEl.innerHTML = '<span class="text-rose-500 font-bold"><i class="fa-solid fa-circle-exclamation"></i> قراءة غير واقعية (> 2,000,000 كم)</span>';
                            el.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/40');
                        } else {
                            msgEl.innerHTML = `<span class="text-emerald-500 font-bold"><i class="fa-solid fa-check"></i> ${num.toLocaleString()} كم</span>`;
                            el.classList.remove('border-rose-500', 'ring-rose-500/40');
                            el.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500/30');
                        }
                    });
                });

                // 5. التحقق اللحظي التفاعلي لرقم اللوحة (License Plate Real-time Validation)
                ['newCarLicenseInput', 'editCarLicenseInput'].forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    const prefix = id === 'newCarLicenseInput' ? 'newCarLicense' : 'editCarLicense';
                    el.addEventListener('input', function() {
                        const raw = this.value;
                        // منع الرموز الضارة والخاصة
                        const clean = raw.replace(/[<>{}\[\]=;()&$%*+~^`"'\\]/g, '').slice(0, 15);
                        if (clean !== raw) {
                            this.value = clean;
                        }
                        const msgEl = document.getElementById(prefix + 'Msg');
                        if (!msgEl) return;
                        if (!clean) {
                            msgEl.innerHTML = '<span class="text-slate-400 font-medium">أرقام وحروف اللوحة فقط (مثال: س ق د 1234)</span>';
                            el.classList.remove('border-rose-500', 'border-emerald-500', 'ring-2', 'ring-rose-500/40', 'ring-emerald-500/30');
                            return;
                        }
                        const res = MotorCareSecurity.validateLicensePlate(clean);
                        if (res.isValid) {
                            msgEl.innerHTML = '<span class="text-emerald-500 font-bold"><i class="fa-solid fa-check"></i> تنسيق لوحة سليم</span>';
                            el.classList.remove('border-rose-500', 'ring-rose-500/40');
                            el.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500/30');
                        } else {
                            msgEl.innerHTML = `<span class="text-rose-500 font-bold"><i class="fa-solid fa-circle-exclamation"></i> ${res.error}</span>`;
                            el.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/40');
                        }
                    });
                });
            }
        };

        // تصدير دوال الأمان عالمياً لتسهيل الاستخدام
        window.MotorCareSecurity = MotorCareSecurity;
        window.escapeHtml = MotorCareSecurity.escapeHtml;
        window.sanitizeText = MotorCareSecurity.sanitizeText;

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof MotorCareSecurity !== 'undefined') window.MotorCareSecurity = MotorCareSecurity; } catch (e) {}
