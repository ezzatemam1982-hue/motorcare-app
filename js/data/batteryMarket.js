        /* ==========================================================================
           [BATTERY MARKET DATA] قاعدة بيانات بطاريات السوق ومواصفاتها
           ========================================================================== */
        const BATTERY_MARKET_DATA = {
            brands: [
                { id: 'chloride', name: 'كلورايد (Chloride Gold / Platinum) - رائد محلي', nameEn: 'Chloride (Gold / Platinum)' },
                { id: 'varta', name: 'فارتا (Varta: Black / Blue / Silver / AGM) - ألماني', nameEn: 'Varta (Black / Blue / Silver / AGM)' },
                { id: 'acdelco', name: 'إيه سي ديلكو (ACDelco Advantage / Professional)', nameEn: 'ACDelco (Advantage / Professional)' },
                { id: 'solite', name: 'سولايت (Solite) - كوري أصلي (هيونداي وكيا)', nameEn: 'Solite - Korean OEM (Hyundai / Kia)' },
                { id: 'energizer', name: 'إنرجايزر (Energizer Premium / AGM) - أمريكي ألماني', nameEn: 'Energizer (Premium / AGM)' },
                { id: 'mutlu', name: 'موتلو (Mutlu Calcium / EFB / AGM) - تركي ممتاز', nameEn: 'Mutlu (Calcium / EFB / AGM)' },
                { id: 'hankook', name: 'هانكوك / أتلس (Hankook / AtlasBX) - كوري ممتاز', nameEn: 'Hankook / AtlasBX' },
                { id: 'bosch', name: 'بوش (Bosch S4 / S5 / S6 AGM) - ألماني رائد', nameEn: 'Bosch (S4 / S5 / S6 AGM)' },
                { id: 'exide', name: 'إكسايد (Exide Start-Stop / AGM) - أوروبي رائد', nameEn: 'Exide (Start-Stop / AGM)' },
                { id: 'other', name: 'ماركة أخرى غير مدرجة...', nameEn: 'Other Brand...' }
            ],
            capacities: [
                { value: '35 Ah', label: '35 أمبير (Ah) - سيارات مدمجة شديدة الصغر (سوزوكي ماروتي / ألتو 800cc)', labelEn: '35 Ah - Subcompact Mini (Maruti, Alto)' },
                { value: '45 Ah', label: '45 أمبير (Ah) - هاتشباك وسيارة مدينة (بيكانتو، i10، ألتو K10، ياريس)', labelEn: '45 Ah - City Hatchback (Picanto, i10, Yaris)' },
                { value: '50 Ah', label: '50 أمبير (Ah) - مدمج خفيف (سويفت، ديزاير، بونتو، فييستا)', labelEn: '50 Ah - Compact (Swift, Dzire, Punto)' },
                { value: '55 Ah', label: '55 أمبير (Ah) - الأكثر شيوعاً (فيرنا، أكسنت، صني، لانوس، أفيو، لادا)', labelEn: '55 Ah - Popular Egyptian Market (Sunny, Verna, Lanos)' },
                { value: '60 Ah', label: '60 أمبير (Ah) - سيدان قياسي (كورولا، سيراتو، إلنترا، لانسر، إم جي 5، تيبو)', labelEn: '60 Ah - Standard Compact Sedan (Corolla, Cerato, Elantra)' },
                { value: '65 Ah', label: '65 أمبير (Ah) - سيدان متوسط وسيارات آسيوية متطورة (سيفيك، مازدا 3، سنترا، سوبارو XV)', labelEn: '65 Ah - Midsize (Civic, Mazda 3, Sentra, XV)' },
                { value: '70 Ah', label: '70 أمبير (Ah) - كروس أوفر وSUV (توسان، سبورتاج، قشقاي، داستر، بيجو 3008، تيجو)', labelEn: '70 Ah - Crossover & SUV (Tucson, Sportage, Qashqai)' },
                { value: '74 Ah', label: '74 - 75 أمبير (Ah) - سيارات أوروبية وفولكس فاجن (أوكتافيا، باسات، جولف، ميجان، أسترا)', labelEn: '74-75 Ah - European Standard (Octavia, Passat, Megane)' },
                { value: '80 Ah', label: '80 أمبير (Ah) - صالون ألماني فاخر ودفع رباعي (مرسيدس C/E، بي إم دبليو 3/5، جيب)', labelEn: '80 Ah - German Luxury (Mercedes, BMW, Jeep)' },
                { value: '90 Ah', label: '90 - 100 أمبير (Ah) - محركات V6/V8 ودفع رباعي كبير (لاندكروزر، باجيرو، جراند شيروكي)', labelEn: '90-100 Ah - Full-size SUV & V6/V8 (Land Cruiser, Pajero)' }
            ],
            types: [
                { value: 'SMF', label: 'جافة خالية من الصيانة (SMF / Calcium) - للسيارات العادية القياسية', labelEn: 'Sealed Maintenance Free (SMF / Calcium)' },
                { value: 'EFB', label: 'سائلة محسنة (EFB) - لأنظمة إطفاء المحرك الذاتي (Start/Stop) وسيارات مازدا وفيات', labelEn: 'Enhanced Flooded Battery (EFB) - Entry Start/Stop' },
                { value: 'AGM', label: 'فايبر جلاس ماص (AGM) - لأنظمة Start/Stop المتقدمة واسترجاع طاقة الفرامل والسيارات الفاخرة', labelEn: 'Absorbent Glass Mat (AGM) - Advanced Start/Stop & Luxury' }
            ]
        };

        function openBatteryModal() {
            const car = getCurrentCar();
            const b = car ? (car.battery || {}) : {};
            const isEn = appState.lang === 'en';

            const brandSel = document.getElementById('batteryBrandSelect');
            if (brandSel) {
                brandSel.innerHTML = '';
                const promptOpt = document.createElement('option');
                promptOpt.value = '';
                promptOpt.innerText = isEn ? '-- Select Battery Brand --' : '-- اختر ماركة البطارية الفعلية --';
                brandSel.appendChild(promptOpt);

                BATTERY_MARKET_DATA.brands.forEach(br => {
                    const opt = document.createElement('option');
                    opt.value = br.name;
                    opt.innerText = isEn ? (br.nameEn || br.name) : br.name;
                    if (b.isConfigured && b.brand && b.brand.includes(br.name.split(' ')[0])) opt.selected = true;
                    brandSel.appendChild(opt);
                });
            }

            // Get OEM spec for default selection if not yet configured
            const oemSpec = car ? getCarOemBatterySpec(car.brand, car.model, car.generationIndex || 0) : { capacity: '60 Ah', tech: 'SMF' };

            const capSel = document.getElementById('batteryCapacitySelect');
            if (capSel) {
                capSel.innerHTML = '';
                BATTERY_MARKET_DATA.capacities.forEach(cp => {
                    const opt = document.createElement('option');
                    opt.value = cp.value;
                    opt.innerText = isEn ? (cp.labelEn || cp.label) : cp.label;
                    if (b.isConfigured) {
                        if (b.capacity === cp.value || (b.capacity && b.capacity.includes(cp.value))) opt.selected = true;
                    } else {
                        if (cp.value === oemSpec.capacity || (oemSpec.capacity && oemSpec.capacity.includes(cp.value))) opt.selected = true;
                    }
                    capSel.appendChild(opt);
                });
            }

            const typeSel = document.getElementById('batteryTypeSelect');
            if (typeSel) {
                typeSel.innerHTML = '';
                BATTERY_MARKET_DATA.types.forEach(tp => {
                    const opt = document.createElement('option');
                    opt.value = tp.value;
                    opt.innerText = isEn ? (tp.labelEn || tp.label) : tp.label;
                    if (b.isConfigured) {
                        if (b.techType === tp.value) opt.selected = true;
                    } else {
                        if (tp.value === oemSpec.tech) opt.selected = true;
                    }
                    typeSel.appendChild(opt);
                });
            }

            const purchaseInput = document.getElementById('batteryPurchaseDateInput');
            if (purchaseInput) purchaseInput.value = (b.isConfigured && b.purchaseDate) ? b.purchaseDate : new Date().toISOString().split('T')[0];

            const warrantyInput = document.getElementById('batteryWarrantyMonthsSelect');
            if (warrantyInput) warrantyInput.value = (b.isConfigured && b.warrantyMonths) ? b.warrantyMonths : 18;

            populateBatteryOemRecommendation();
            onBatteryBrandSelectChanged();
            document.getElementById('batteryModal')?.classList.remove('hidden');
        }

        function closeBatteryModal() { document.getElementById('batteryModal')?.classList.add('hidden'); }

        function onBatteryBrandSelectChanged() {
            const brandSel = document.getElementById('batteryBrandSelect');
            const custom = document.getElementById('customBatteryBrandInput');
            if (!brandSel || !custom) return;

            if (brandSel.value.includes('أخرى') || brandSel.value.includes('Other')) custom.classList.remove('hidden');
            else custom.classList.add('hidden');
        }

        function saveBatteryDetails() {
            const car = getCurrentCar();
            if (!car) return;
            const brandSel = document.getElementById('batteryBrandSelect');
            let brand = brandSel ? brandSel.value : '';
            const isEn = appState.lang === 'en';

            if (!brand) {
                alert(isEn ? 'Please select your car battery brand!' : 'يرجى اختيار ماركة بطارية سيارتك الفعلية!');
                if (brandSel) brandSel.focus();
                return;
            }

            if (brand.includes('أخرى') || brand.includes('Other')) {
                const customInput = document.getElementById('customBatteryBrandInput');
                brand = customInput && customInput.value.trim() ? customInput.value.trim() : (isEn ? 'Custom Battery' : 'بطارية مخصصة');
            }

            const capSel = document.getElementById('batteryCapacitySelect');
            const typeSel = document.getElementById('batteryTypeSelect');
            const dateInput = document.getElementById('batteryPurchaseDateInput');
            const monthsSel = document.getElementById('batteryWarrantyMonthsSelect');

            car.battery = {
                brand: brand,
                capacity: capSel ? capSel.value : '60 Ah',
                techType: typeSel ? typeSel.value : 'SMF',
                purchaseDate: dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0],
                warrantyMonths: monthsSel ? parseInt(monthsSel.value) || 18 : 18,
                warrantyImage: tempImages['battery'] || (car.battery ? car.battery.warrantyImage : ''),
                isConfigured: true
            };

            tempImages['battery'] = '';
            SafeStorage.setItem('motorCare_AppState_v140', JSON.stringify(appState));
            syncUserDataToCloud('battery_updated');
            closeBatteryModal();
            renderDashboard();
            if (typeof renderHardwareCards === 'function') renderHardwareCards();
            showNotification(isEn ? 'Battery details saved successfully!' : 'تم حفظ بيانات البطارية بنجاح!', 'success');
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof BATTERY_MARKET_DATA !== 'undefined') window.BATTERY_MARKET_DATA = BATTERY_MARKET_DATA; } catch (e) {}
try { if (typeof closeBatteryModal !== 'undefined') window.closeBatteryModal = closeBatteryModal; } catch (e) {}
try { if (typeof onBatteryBrandSelectChanged !== 'undefined') window.onBatteryBrandSelectChanged = onBatteryBrandSelectChanged; } catch (e) {}
try { if (typeof openBatteryModal !== 'undefined') window.openBatteryModal = openBatteryModal; } catch (e) {}
try { if (typeof saveBatteryDetails !== 'undefined') window.saveBatteryDetails = saveBatteryDetails; } catch (e) {}
