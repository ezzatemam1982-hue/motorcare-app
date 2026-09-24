        // تصنيف الماركات إلى مجموعات جغرافية واضحة (عربي وإنجليزي)
        /* ==========================================================================
           منظومة شعارات ماركات السيارات الرسمية (Official Car Brand Logos System)
           ========================================================================== */
        const CAR_BRAND_LOGOS = {
        "Toyota": `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="35" rx="46" ry="32" fill="none" stroke="#eb0a1e" stroke-width="5"/> <ellipse cx="50" cy="27" rx="23" ry="11" fill="none" stroke="#eb0a1e" stroke-width="4.5"/> <ellipse cx="50" cy="38" rx="10" ry="25" fill="none" stroke="#eb0a1e" stroke-width="4.5"/> </svg>`,
        "Mercedes-Benz": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="50" r="45" fill="none" stroke="#94a3b8" stroke-width="5"/> <polygon points="50,9 44,50 50,46" fill="#94a3b8"/> <polygon points="50,9 56,50 50,46" fill="#64748b"/> <polygon points="14,71 50,50 48,55" fill="#94a3b8"/> <polygon points="14,71 50,50 45,47" fill="#64748b"/> <polygon points="86,71 50,50 52,55" fill="#64748b"/> <polygon points="86,71 50,50 55,47" fill="#94a3b8"/> <circle cx="50" cy="50" r="4" fill="#64748b"/> </svg>`,
        "BMW": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#cbd5e1" stroke-width="3"/> <circle cx="50" cy="50" r="33" fill="#cbd5e1"/> <path d="M50,17 A33,33 0 0,1 83,50 L50,50 Z" fill="#0066b1"/> <path d="M50,50 L83,50 A33,33 0 0,1 50,83 Z" fill="#ffffff"/> <path d="M50,50 L50,83 A33,33 0 0,1 17,50 Z" fill="#0066b1"/> <path d="M17,50 A33,33 0 0,1 50,17 L50,50 Z" fill="#ffffff"/> <text x="50" y="14" font-family="Arial, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">B</text> <text x="76" y="36" font-family="Arial, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">M</text> <text x="79" y="69" font-family="Arial, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">W</text> </svg>`,
        "Audi": `<svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="35" cy="30" r="22" fill="none" stroke="#94a3b8" stroke-width="4.5"/> <circle cx="65" cy="30" r="22" fill="none" stroke="#94a3b8" stroke-width="4.5"/> <circle cx="95" cy="30" r="22" fill="none" stroke="#94a3b8" stroke-width="4.5"/> <circle cx="125" cy="30" r="22" fill="none" stroke="#94a3b8" stroke-width="4.5"/> </svg>`,
        "Volkswagen": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="50" r="46" fill="#001e50" stroke="#38bdf8" stroke-width="3"/> <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="2.5"/> <path d="M28,26 L42,66 L47,66 L36,36 L46,36 L50,48 L54,36 L64,36 L53,66 L58,66 L72,26 L64,26 L54,54 L50,42 L50,40 L46,54 L36,26 Z" fill="#ffffff"/> <path d="M42,68 L50,88 L58,68 L52,68 L50,73 L48,68 Z" fill="#ffffff"/> <path d="M26,45 L32,60 L35,53 L31,43 Z" fill="#ffffff"/> <path d="M74,45 L68,60 L65,53 L69,43 Z" fill="#ffffff"/> </svg>`,
        "Hyundai": `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="35" rx="46" ry="29" fill="none" stroke="#002c6c" stroke-width="5" transform="rotate(-6 50 35)"/> <path d="M33,52 L42,18 C43,18 47,18 47,24 L42,52 Z" fill="#002c6c"/> <path d="M57,52 L66,18 C67,18 71,18 71,24 L66,52 Z" fill="#002c6c"/> <path d="M37,34 C44,30 57,28 67,37 C64,39 53,35 43,40 Z" fill="#002c6c"/> </svg>`,
        "Kia": `<svg viewBox="0 0 100 55" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <rect width="100" height="55" rx="14" fill="#05141f"/> <path d="M22,38 L22,17 L30,28 L38,17 L30,38" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/> <path d="M45,17 L45,38 M55,38 L65,17 L75,38 M58,31 L72,31" fill="none" stroke="#ea0029" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/> </svg>`,
        "Nissan": `<svg viewBox="0 0 100 75" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="37" r="32" fill="none" stroke="#c0c0c0" stroke-width="5"/> <rect x="12" y="27" width="76" height="20" rx="3" fill="#c00" stroke="#c0c0c0" stroke-width="2"/> <text x="50" y="41" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">NISSAN</text> </svg>`,
        "Mitsubishi": `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <polygon points="50,10 63,33 50,55 37,33" fill="#e60012"/> <polygon points="50,55 63,77 37,77 24,55" fill="#e60012"/> <polygon points="50,55 76,55 89,77 63,77" fill="#e60012"/> </svg>`,
        "Honda": `<svg viewBox="0 0 100 85" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <path d="M18,12 L82,12 C88,12 92,16 90,26 L80,72 C78,78 72,82 64,82 L36,82 C28,82 22,78 20,72 L10,26 C8,16 12,12 18,12 Z" fill="none" stroke="#dc2626" stroke-width="5"/> <path d="M28,24 L34,70 C34,70 38,72 41,68 L43,44 L57,44 L59,68 C62,72 66,70 66,70 L72,24 C72,24 67,23 64,28 L62,38 L38,38 L36,28 C33,23 28,24 28,24 Z" fill="#dc2626"/> </svg>`,
        "Peugeot": `<svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <path d="M45,6 L80,18 L72,78 L45,96 L18,78 L10,18 Z" fill="#0f172a" stroke="#0284c7" stroke-width="3"/> <path d="M45,22 C48,22 55,25 55,30 C55,33 52,36 50,38 C54,39 58,43 57,48 C55,54 48,54 48,58 C50,62 56,66 52,72 C48,76 43,76 39,72 C36,68 39,64 41,62 C38,60 35,55 36,49 C37,42 42,39 42,34 C42,28 38,28 38,24 Z" fill="#38bdf8"/> </svg>`,
        "Renault": `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <polygon points="40,8 72,50 40,92 8,50" fill="none" stroke="#eab308" stroke-width="8" stroke-linejoin="round"/> <polygon points="40,28 56,50 40,72 24,50" fill="none" stroke="#eab308" stroke-width="6" stroke-linejoin="round"/> </svg>`,
        "MG": `<svg viewBox="0 0 100 85" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <polygon points="28,10 72,10 94,32 94,54 72,76 28,76 6,54 6,32" fill="#991b1b" stroke="#e2e8f0" stroke-width="4"/> <text x="37" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">M</text> <text x="65" y="52" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">G</text> </svg>`,
        "Chery": `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="35" rx="45" ry="28" fill="none" stroke="#b91c1c" stroke-width="5"/> <path d="M26,48 C32,24 68,24 74,48" fill="none" stroke="#b91c1c" stroke-width="5"/> <path d="M50,22 L36,48 L44,48 L50,35 L56,48 L64,48 Z" fill="#b91c1c"/> </svg>`,
        "BYD": `<svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="32" rx="46" ry="28" fill="#e11d48" stroke="#ffffff" stroke-width="2"/> <text x="50" y="40" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">BYD</text> </svg>`,
        "Chevrolet": `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <polygon points="10,22 90,22 90,38 10,38" fill="#eab308" stroke="#ca8a04" stroke-width="2"/> <polygon points="38,10 62,10 62,50 38,50" fill="#eab308" stroke="#ca8a04" stroke-width="2"/> <polygon points="40,24 60,24 60,36 40,36" fill="#fde047"/> </svg>`,
        "Ford": `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="30" rx="46" ry="26" fill="#002c6c" stroke="#e2e8f0" stroke-width="3"/> <text x="50" y="38" font-family="'Brush Script MT', cursive, sans-serif" font-size="24" font-weight="bold" font-style="italic" fill="#ffffff" text-anchor="middle">Ford</text> </svg>`,
        "Jeep": `<svg viewBox="0 0 100 55" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <rect width="100" height="55" rx="10" fill="#1e293b"/> <text x="50" y="38" font-family="Impact, Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">Jeep</text> </svg>`,
        "Fiat": `<svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <rect x="8" y="10" width="84" height="45" rx="12" fill="#991b1b" stroke="#e2e8f0" stroke-width="3"/> <text x="50" y="42" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">FIAT</text> </svg>`,
        "Skoda": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="50" r="45" fill="#047857" stroke="#ffffff" stroke-width="3"/> <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="2"/> <circle cx="62" cy="40" r="4" fill="#ffffff"/> <path d="M38,30 C45,35 60,38 72,40 C65,48 55,54 38,58 C44,52 46,44 42,38 Z" fill="#ffffff"/> <path d="M26,46 L36,46 L38,54 L28,54 Z" fill="#ffffff"/> </svg>`,
        "Mazda": `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="40" rx="45" ry="34" fill="none" stroke="#0284c7" stroke-width="4.5"/> <path d="M22,28 C34,44 44,54 50,38 C56,54 66,44 78,28 C64,48 54,64 50,48 C46,64 36,48 22,28 Z" fill="#0284c7"/> </svg>`,
        "Suzuki": `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <path d="M68,14 L24,40 L44,40 L22,76 L66,50 L46,50 Z" fill="#e11d48"/> </svg>`,
        "Geely": `<svg viewBox="0 0 100 85" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <path d="M15,18 L85,18 L85,45 C85,68 50,80 50,80 C50,80 15,68 15,45 Z" fill="#0284c7" stroke="#ffffff" stroke-width="3"/> <line x1="50" y1="18" x2="50" y2="78" stroke="#ffffff" stroke-width="2.5"/> <line x1="15" y1="38" x2="85" y2="38" stroke="#ffffff" stroke-width="2.5"/> <line x1="15" y1="58" x2="85" y2="58" stroke="#ffffff" stroke-width="2.5"/> </svg>`,
        "Haval": `<svg viewBox="0 0 100 55" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <rect width="100" height="55" rx="10" fill="#b91c1c"/> <text x="50" y="36" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">HAVAL</text> </svg>`,
        "Jetour": `<svg viewBox="0 0 100 55" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <rect width="100" height="55" rx="10" fill="#0f172a" stroke="#0284c7" stroke-width="2"/> <text x="50" y="36" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#38bdf8" text-anchor="middle" letter-spacing="1">JETOUR</text> </svg>`,
        "Changan": `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="45" r="40" fill="#0284c7" stroke="#ffffff" stroke-width="3"/> <path d="M28,30 L45,62 C48,68 52,68 55,62 L72,30 C66,38 58,45 50,45 C42,45 34,38 28,30 Z" fill="#ffffff"/> </svg>`,
        "Subaru": `<svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <ellipse cx="50" cy="32" rx="46" ry="28" fill="#002c6c" stroke="#cbd5e1" stroke-width="3"/> <circle cx="62" cy="24" r="7" fill="#fbbf24"/> <circle cx="44" cy="22" r="4.5" fill="#ffffff"/> <circle cx="36" cy="32" r="4" fill="#ffffff"/> <circle cx="48" cy="34" r="4.5" fill="#ffffff"/> <circle cx="58" cy="40" r="4" fill="#ffffff"/> <circle cx="40" cy="42" r="3.5" fill="#ffffff"/> </svg>`,
        "Opel": `<svg viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="50" cy="45" r="40" fill="none" stroke="#eab308" stroke-width="5"/> <polygon points="76,28 40,48 55,48 24,62 60,42 45,42" fill="#eab308"/> </svg>`,
        "Seat": `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <path d="M22,25 L68,25 L68,36 L38,36 L58,52 L22,52 L22,41 L52,41 Z" fill="#dc2626"/> <path d="M32,54 L68,54 L68,65 L22,65 L42,49 L68,49 L68,60 L38,60 Z" fill="#991b1b"/> </svg>`,
        "Volvo": `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"> <circle cx="46" cy="54" r="36" fill="none" stroke="#002c6c" stroke-width="5"/> <line x1="72" y1="28" x2="88" y2="12" stroke="#002c6c" stroke-width="5"/> <polygon points="74,12 88,12 88,26" fill="#002c6c"/> <rect x="12" y="47" width="68" height="15" rx="3" fill="#002c6c"/> <text x="46" y="59" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">VOLVO</text> </svg>`
        };

        function getCarBrandLogoHtml(brand, sizeClass = 'w-7 h-7', extraClasses = '') {
            if (!brand) {
                return `<div class="${sizeClass} rounded-xl bg-slate-100 dark:bg-slate-800 text-sky-500 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0 ${extraClasses}"><i class="fa-solid fa-car text-xs"></i></div>`;
            }
            const cleanBrand = String(brand).trim();
            const svg = CAR_BRAND_LOGOS[cleanBrand];
            if (svg) {
                return `<div class="${sizeClass} rounded-xl p-1 bg-white dark:bg-slate-800/95 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 ${extraClasses}" title="${cleanBrand}">${svg}</div>`;
            }
            // Fallback monogram or custom vehicle icon
            const isCustom = cleanBrand.includes('أخرى') || cleanBrand.toLowerCase().includes('custom');
            if (isCustom) {
                return `<div class="${sizeClass} rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-sky-400 flex items-center justify-center border border-slate-600/60 shadow-2xs shrink-0 ${extraClasses}" title="${cleanBrand}"><i class="fa-solid fa-car-side text-xs"></i></div>`;
            }
            const initials = cleanBrand.slice(0, 2).toUpperCase();
            return `<div class="${sizeClass} rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-800 dark:text-sky-300 font-black text-[10px] flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-2xs shrink-0 tracking-tighter ${extraClasses}" title="${cleanBrand}">${initials}</div>`;
        }

        function quickSelectCarBrand(brandName) {
            const brandSel = document.getElementById('newCarBrandSelect');
            if (!brandSel) return;
            brandSel.value = brandName;
            onNewCarBrandChanged();
        }

        function renderQuickBrandChips() {
            const container = document.getElementById('quickBrandChipsContainer');
            if (!container) return;
            const topBrands = ['Toyota', 'Mitsubishi', 'Hyundai', 'Kia', 'Nissan', 'Renault', 'Chery', 'MG', 'Jetour', 'BYD', 'Geely', 'Haval', 'Suzuki', 'Mercedes-Benz', 'BMW', 'Honda', 'Peugeot', 'Chevrolet', 'Fiat', 'Skoda'];
            container.innerHTML = topBrands.map(b => `
                <button type="button" onclick="quickSelectCarBrand('${b}')" class="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold shrink-0 cursor-pointer transition shadow-2xs" title="${b}">
                    ${getCarBrandLogoHtml(b, 'w-4 h-4')}
                    <span>${b}</span>
                </button>
            `).join('');
        }

        const BRAND_GROUPS = {
            "السيارات اليابانية والكورية الأكثر انتشاراً": [
                "Hyundai", "Kia", "Toyota", "Nissan", "Mitsubishi", "Honda", "Mazda", "Subaru", "Suzuki"
            ],
            "السيارات الصينية (الجيل الحديث الأكثر مبيعاً)": [
                "MG", "Chery", "BYD", "Geely", "Changan", "Haval", "Jetour", "Baic", "DFSK"
            ],
            "السيارات الأوروبية (الفاخرة والاقتصادية)": [
                "Skoda", "Volkswagen", "Peugeot", "Renault", "Seat", "Opel", "Fiat", "Mercedes-Benz", "BMW", "Audi", "Volvo"
            ],
            "السيارات الأمريكية": [
                "Chevrolet", "Ford", "Jeep", "Dodge"
            ],
            "السيارات الاقتصادية والمحلية الكلاسيكية": [
                "Lada", "Proton", "Daewoo", "Nasr", "Speranza", "ماركة أخرى (Custom Car)"
            ]
        };

        const BRAND_GROUPS_EN = {
            "Japanese & Korean Vehicles (Popular)": [
                "Hyundai", "Kia", "Toyota", "Nissan", "Mitsubishi", "Honda", "Mazda", "Subaru", "Suzuki"
            ],
            "Chinese Vehicles (Modern & Best Sellers)": [
                "MG", "Chery", "BYD", "Geely", "Changan", "Haval", "Jetour", "Baic", "DFSK"
            ],
            "European Vehicles (Luxury & Economy)": [
                "Skoda", "Volkswagen", "Peugeot", "Renault", "Seat", "Opel", "Fiat", "Mercedes-Benz", "BMW", "Audi", "Volvo"
            ],
            "American Vehicles": [
                "Chevrolet", "Ford", "Jeep", "Dodge"
            ],
            "Economy & Classic Vehicles": [
                "Lada", "Proton", "Daewoo", "Nasr", "Speranza", "Other Brand (Custom Car)"
            ]
        };

        function openGarageModal() {
            const list = document.getElementById('garageCarsList');
            if (!list) return;
            list.innerHTML = '';
            const isEn = appState.lang === 'en';
            
            appState.cars.forEach((c, idx) => {
                const isCurrent = idx === appState.currentCarIndex;
                const activeBadgeTxt = isEn ? 'Active' : 'الحالية';
                const selectBtnTxt = isEn ? 'Select' : 'تفعيل';
                const deleteTitleTxt = isEn ? 'Delete Vehicle' : 'حذف السيارة';

                list.innerHTML += `
                    <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                        <div class="flex items-center gap-2.5 min-w-0">
                            ${getCarBrandLogoHtml(c.brand, 'w-9 h-9')}
                            <div class="min-w-0 truncate">
                                <strong class="text-slate-900 dark:text-white">${c.brand} ${getCleanCarDisplayName(c.model)}</strong> (${c.year})
                                ${isCurrent ? `<span class="mx-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">${activeBadgeTxt}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            ${!isCurrent ? `<button onclick="switchCar(${idx})" class="px-2.5 py-1 bg-sky-500 text-white rounded-lg font-bold cursor-pointer">${selectBtnTxt}</button>` : ''}
                            ${appState.cars.length > 1 ? `<button onclick="deleteCarFromGarage(${idx})" class="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold cursor-pointer" title="${deleteTitleTxt}"><i class="fa-solid fa-trash"></i></button>` : ''}
                        </div>
                    </div>`;
            });
            document.getElementById('garageModal')?.classList.remove('hidden');
        }
        function closeGarageModal() { document.getElementById('garageModal')?.classList.add('hidden'); }

        function switchCar(idx) {
            appState.currentCarIndex = idx;
            saveAppState('car_switched');
            closeGarageModal();
            renderDashboard();
        }

        function deleteCarFromGarage(idx) {
            const isEn = appState.lang === 'en';
            if (appState.cars.length <= 1) {
                showNotification(isEn ? 'Cannot delete the only car in the garage!' : 'لا يمكن حذف السيارة الوحيدة في الكراج!', 'warning');
                return;
            }
            const confirmMsg = isEn ? 'Are you sure you want to permanently delete this vehicle from your garage?' : 'هل أنت متأكد من حذف هذه السيارة من الكراج نهائياً؟';
            showCustomConfirm(confirmMsg, () => {
                appState.cars.splice(idx, 1);
                if (appState.currentCarIndex >= appState.cars.length) {
                    appState.currentCarIndex = appState.cars.length - 1;
                }
                saveAppState('car_deleted');
                openGarageModal();
                renderDashboard();
                showNotification(isEn ? 'Vehicle deleted from garage.' : 'تم حذف السيارة من الكراج بنجاح.', 'success');
            });
        }
        function openEditCarModal() {
            const car = getCurrentCar();
            if (!car) return;

            // تحديد القيود بناء على الكتالوج
            let minYear = 1950;
            let maxYear = new Date().getFullYear() + 1;
            if (CAR_BRANDS_CATALOG[car.brand] && CAR_BRANDS_CATALOG[car.brand].models[car.model] && car.generationIndex !== undefined) {
                const spec = CAR_BRANDS_CATALOG[car.brand].models[car.model].generations[car.generationIndex];
                if (spec) {
                    minYear = spec.startYear || 1950;
                    maxYear = spec.endYear || maxYear;
                }
            }

            const yInput = document.getElementById('editCarYearInput');
            if (yInput) {
                yInput.min = minYear;
                yInput.max = maxYear;
                yInput.value = car.year || minYear;
            }

            const odoInput = document.getElementById('editCarOdoInput');
            if (odoInput) odoInput.value = car.odometer || 0;

            const licenseInput = document.getElementById('editCarLicenseInput');
            if (licenseInput) licenseInput.value = car.license || '';

            const colorInput = document.getElementById('editCarColorInput');
            if (colorInput) colorInput.value = car.color || '';

            const vinInput = document.getElementById('editCarVinInput');
            if (vinInput) vinInput.value = car.vin || '';

            const notesInput = document.getElementById('editCarNotesInput');
            if (notesInput) notesInput.value = car.notes || '';

            ['editCarOdoInput', 'editCarLicenseInput', 'editCarVinInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.dispatchEvent(new Event('input'));
            });

            document.getElementById('editCarModal')?.classList.remove('hidden');
        }

        function closeEditCarModal() {
            document.getElementById('editCarModal')?.classList.add('hidden');
        }

        function saveEditedCar() {
            const car = getCurrentCar();
            if (!car) return;

            const isEn = appState.lang === 'en';
            const yInput = document.getElementById('editCarYearInput');
            const minYear = parseInt(yInput?.min) || 1950;
            const maxYear = parseInt(yInput?.max) || new Date().getFullYear() + 1;
            const year = MotorCareSecurity.parsePositiveInt(yInput?.value, car.year, minYear, maxYear);

            if (year < minYear || year > maxYear) {
                alert(isEn ? `Production year must be between ${minYear} and ${maxYear}` : `سنة الصنع غير صحيحة لهذا الجيل. يجب أن تكون بين ${minYear} و ${maxYear}`);
                if (yInput) {
                    MotorCareSecurity.shakeElement(yInput);
                    yInput.focus();
                }
                return;
            }

            const odoInput = document.getElementById('editCarOdoInput');
            const odoRaw = odoInput ? odoInput.value.trim() : '';
            const odoVal = MotorCareSecurity.parsePositiveInt(odoRaw, -1, 0, 2000000);
            if (odoVal < 0 || odoVal > 2000000) {
                alert(isEn ? 'Please enter a valid positive odometer reading (0 - 2,000,000 km)!' : 'يرجى إدخال قراءة عداد صحيحة وموجبة (بين 0 و 2,000,000 كم)!');
                if (odoInput) {
                    MotorCareSecurity.shakeElement(odoInput);
                    odoInput.focus();
                }
                return;
            }

            const licenseInput = document.getElementById('editCarLicenseInput');
            const licenseRaw = licenseInput ? licenseInput.value.trim() : '';
            if (licenseRaw) {
                const licenseRes = MotorCareSecurity.validateLicensePlate(licenseRaw);
                if (!licenseRes.isValid) {
                    alert(isEn ? `License plate error: ${licenseRes.error}` : `خطأ في رقم اللوحة: ${licenseRes.error}`);
                    if (licenseInput) {
                        MotorCareSecurity.shakeElement(licenseInput);
                        licenseInput.focus();
                    }
                    return;
                }
            }

            const vinInput = document.getElementById('editCarVinInput');
            const vinRaw = vinInput ? vinInput.value.trim().toUpperCase() : '';
            if (vinRaw) {
                const vinRes = MotorCareSecurity.validateVin(vinRaw);
                if (!vinRes.isValid) {
                    alert(isEn ? `VIN error: ${vinRes.error}` : `خطأ في رقم الشاسيه (VIN): ${vinRes.error}`);
                    if (vinInput) {
                        MotorCareSecurity.shakeElement(vinInput);
                        vinInput.focus();
                    }
                    return;
                }
            }

            car.year = year;
            car.odometer = odoVal;
            car.license = MotorCareSecurity.sanitizeText(licenseRaw, 30);
            car.color = MotorCareSecurity.sanitizeText(document.getElementById('editCarColorInput')?.value || car.color, 40);
            car.vin = vinRaw;
            car.notes = MotorCareSecurity.sanitizeText(document.getElementById('editCarNotesInput')?.value || car.notes, 500);

            saveAppState('car_edited');
            closeEditCarModal();
            renderDashboard();
        }


        function openAddNewCarModal() {
            closeGarageModal();
            const searchInput = document.getElementById('brandSearchInput');
            if (searchInput) searchInput.value = '';
            
            ['newCarOdoInput', 'newCarLicenseInput', 'newCarVinInput', 'newCarColorInput', 'newCarNotesInput'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = '';
                    el.dispatchEvent(new Event('input'));
                }
            });

            renderQuickBrandChips();
            populateBrandSelect();
            document.getElementById('addNewCarModal')?.classList.remove('hidden');
        }
        function closeAddNewCarModal() { document.getElementById('addNewCarModal')?.classList.add('hidden'); }

        // تعبئة القائمة مصنفة ومقسمة إلى فئات مع دعم الفلترة والبحث
        function populateBrandSelect(filterKeyword = '') {
            const brandSel = document.getElementById('newCarBrandSelect');
            if (!brandSel) return;
            brandSel.innerHTML = '';

            const kw = filterKeyword.trim().toLowerCase();
            let totalAdded = 0;
            const groups = appState.lang === 'en' ? BRAND_GROUPS_EN : BRAND_GROUPS;

            Object.entries(groups).forEach(([groupName, brands]) => {
                const matchedBrands = brands.filter(b => b.toLowerCase().includes(kw));
                if (matchedBrands.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = groupName;

                    matchedBrands.forEach(b => {
                        const opt = document.createElement('option');
                        opt.value = b;
                        opt.innerText = b;
                        optGroup.appendChild(opt);
                        totalAdded++;
                    });
                    brandSel.appendChild(optGroup);
                }
            });

            if (totalAdded > 0) {
                onNewCarBrandChanged();
            }
        }

        // دالة الفلترة السريعة للماركات عند الكتابة مع تأخير ذكي (Debouncing) لمنع التهنيج
        const debouncedPopulateBrands = debounce((kw) => {
            populateBrandSelect(kw);
        }, 180);

        function filterBrandsList() {
            const input = document.getElementById('brandSearchInput');
            const kw = input ? input.value : '';
            debouncedPopulateBrands(kw);
        }

        function onNewCarBrandChanged() {
            const brandSel = document.getElementById('newCarBrandSelect');
            if (!brandSel) return;
            const b = brandSel.value;

            // تحديث معاينة شعار الماركة المحددة فوراً
            const previewEl = document.getElementById('newCarBrandLogoPreview');
            if (previewEl) {
                previewEl.innerHTML = `
                    <div class="flex items-center gap-1.5">
                        ${getCarBrandLogoHtml(b, 'w-5 h-5')}
                        <span class="text-[11px] font-black text-sky-700 dark:text-sky-300">${b}</span>
                    </div>
                `;
            }

            const modelSel = document.getElementById('newCarModelSelect');
            if (!modelSel) return;
            modelSel.innerHTML = '';

            if (CAR_BRANDS_CATALOG[b] && CAR_BRANDS_CATALOG[b].models && Object.keys(CAR_BRANDS_CATALOG[b].models).length > 0) {
                Object.keys(CAR_BRANDS_CATALOG[b].models).forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.innerText = m;
                    modelSel.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = 'طراز قياسي (Standard Model)';
                opt.innerText = 'طراز قياسي (Standard Model)';
                modelSel.appendChild(opt);
            }
            onNewCarModelChanged();
        }

        function onNewCarModelChanged() {
            const b = document.getElementById('newCarBrandSelect')?.value;
            const m = document.getElementById('newCarModelSelect')?.value;
            const genSel = document.getElementById('newCarGenerationSelect');
            if (!genSel) return;
            genSel.innerHTML = '';

            if (b && m && CAR_BRANDS_CATALOG[b] && CAR_BRANDS_CATALOG[b].models && CAR_BRANDS_CATALOG[b].models[m] && CAR_BRANDS_CATALOG[b].models[m].generations && CAR_BRANDS_CATALOG[b].models[m].generations.length > 0) {
                CAR_BRANDS_CATALOG[b].models[m].generations.forEach((gen, idx) => {
                    const opt = document.createElement('option');
                    opt.value = idx;
                    opt.innerText = gen.name;
                    genSel.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = 0;
                opt.innerText = 'الجيل الافتراضي (جميع الصيانات القياسية)';
                genSel.appendChild(opt);
            }
            onNewCarGenerationChanged();
        }
        function onNewCarGenerationChanged() {
            const b = document.getElementById('newCarBrandSelect')?.value;
            const m = document.getElementById('newCarModelSelect')?.value;
            const genIdx = document.getElementById('newCarGenerationSelect')?.value;
            const engineInput = document.getElementById('newCarEngineInput');
            const yearInput = document.getElementById('newCarYearInput');

            if (b && m && genIdx !== undefined && CAR_BRANDS_CATALOG[b] && CAR_BRANDS_CATALOG[b].models[m] && CAR_BRANDS_CATALOG[b].models[m].generations[genIdx]) {
                const spec = CAR_BRANDS_CATALOG[b].models[m].generations[genIdx];
                if (engineInput && spec.engine) {
                    engineInput.value = spec.engine;
                }
                if (yearInput) {
                    const min = spec.startYear || 1950;
                    const max = spec.endYear || new Date().getFullYear() + 1;
                    yearInput.min = min;
                    yearInput.max = max;
                    
                    let currentYear = parseInt(yearInput.value);
                    if (!currentYear || currentYear < min) yearInput.value = min;
                    if (currentYear > max) yearInput.value = max;
                }

                // تحديث بطاقة المعاينة الفنية المعتمدة
                const previewBox = document.getElementById('newCarSpecPreviewBox');
                const timingEl = document.getElementById('newCarTimingPreview');
                const batteryEl = document.getElementById('newCarBatteryPreview');
                if (previewBox && timingEl && batteryEl) {
                    previewBox.classList.remove('hidden');
                    timingEl.innerText = spec.timing || 'قياسي';
                    batteryEl.innerText = spec.batteryCapacity ? `${spec.batteryCapacity} (${spec.batteryDIN || 'Standard'})` : '12V خالية من الصيانة';
                }
            } else {
                document.getElementById('newCarSpecPreviewBox')?.classList.add('hidden');
            }
        }

        // دالة تنقية أسماء الموديلات والأجيال لعرض عصري وأنيق على الموبايل بدون نصوص فنية طويلة
        function getCleanCarDisplayName(text) {
            if (!text) return '';
            return String(text)
                .replace(/\s*-\s*(?:جنزير\s*حديد|سير\s*كاتينة\s*كاوتش|سير\s*كاتينة\s*رطب\s*بالزيت|سير\s*كاوتش|محرك\s*كهربائي)[^)]*(?:\]|\)|$)/g, '')
                .replace(/\s*-\s*(?:Timing\s*Chain|Timing\s*Belt|Wet\s*Belt|EV\s*\/\s*Electric)[\s\S]*$/gi, '')
                .replace(/\s*-\s*$/g, '')
                .trim();
        }

        // دالة فحص وتدقيق كراج المستخدم تلقائياً وتنظيف الأسماء القديمة مع الاحتفاظ التام بمواصفات الصيانة

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof CAR_BRAND_LOGOS !== 'undefined') window.CAR_BRAND_LOGOS = CAR_BRAND_LOGOS; } catch (e) {}
try { if (typeof BRAND_GROUPS !== 'undefined') window.BRAND_GROUPS = BRAND_GROUPS; } catch (e) {}
try { if (typeof BRAND_GROUPS_EN !== 'undefined') window.BRAND_GROUPS_EN = BRAND_GROUPS_EN; } catch (e) {}
try { if (typeof getCarBrandLogoHtml !== 'undefined') window.getCarBrandLogoHtml = getCarBrandLogoHtml; } catch (e) {}
try { if (typeof getCleanCarDisplayName !== 'undefined') window.getCleanCarDisplayName = getCleanCarDisplayName; } catch (e) {}
try { if (typeof populateBrandSelect !== 'undefined') window.populateBrandSelect = populateBrandSelect; } catch (e) {}
try { if (typeof renderQuickBrandChips !== 'undefined') window.renderQuickBrandChips = renderQuickBrandChips; } catch (e) {}
try { if (typeof quickSelectCarBrand !== 'undefined') window.quickSelectCarBrand = quickSelectCarBrand; } catch (e) {}
try { if (typeof filterBrandsList !== 'undefined') window.filterBrandsList = filterBrandsList; } catch (e) {}
try { if (typeof switchCar !== 'undefined') window.switchCar = switchCar; } catch (e) {}
try { if (typeof deleteCarFromGarage !== 'undefined') window.deleteCarFromGarage = deleteCarFromGarage; } catch (e) {}
try { if (typeof openEditCarModal !== 'undefined') window.openEditCarModal = openEditCarModal; } catch (e) {}
try { if (typeof closeEditCarModal !== 'undefined') window.closeEditCarModal = closeEditCarModal; } catch (e) {}
try { if (typeof saveEditedCar !== 'undefined') window.saveEditedCar = saveEditedCar; } catch (e) {}
try { if (typeof openAddNewCarModal !== 'undefined') window.openAddNewCarModal = openAddNewCarModal; } catch (e) {}
try { if (typeof closeAddNewCarModal !== 'undefined') window.closeAddNewCarModal = closeAddNewCarModal; } catch (e) {}
try { if (typeof openGarageModal !== 'undefined') window.openGarageModal = openGarageModal; } catch (e) {}
try { if (typeof closeGarageModal !== 'undefined') window.closeGarageModal = closeGarageModal; } catch (e) {}
try { if (typeof onNewCarBrandChanged !== 'undefined') window.onNewCarBrandChanged = onNewCarBrandChanged; } catch (e) {}
try { if (typeof onNewCarModelChanged !== 'undefined') window.onNewCarModelChanged = onNewCarModelChanged; } catch (e) {}
try { if (typeof onNewCarGenerationChanged !== 'undefined') window.onNewCarGenerationChanged = onNewCarGenerationChanged; } catch (e) {}
