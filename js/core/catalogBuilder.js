        /* ==========================================================================
           [MODULE 03] المحرك الهندسي لتوليد جدول الصيانة الوقائية (PM Catalog Builder)
           ========================================================================== */
        function buildSpecificCatalog(brand, model, generationIndex = 0, initKm = 0) {
            let spec = { timing: "chain", steering: "EPS", transmission: "Automatic Transmission", sparkPlugs: "nickel" };
            
            if (typeof CAR_BRANDS_CATALOG !== 'undefined' && CAR_BRANDS_CATALOG[brand] && CAR_BRANDS_CATALOG[brand].models && CAR_BRANDS_CATALOG[brand].models[model] && CAR_BRANDS_CATALOG[brand].models[model].generations) {
                spec = CAR_BRANDS_CATALOG[brand].models[model].generations[generationIndex] || spec;
            }

            const catalog = [];
            const isRenault = brand && (brand.toLowerCase().includes('renault') || brand.includes('رينو'));
            const isEv = spec.timing && spec.timing.toLowerCase().includes("ev");
            const isBelt = spec.timing && (spec.timing.toLowerCase().includes("belt") || spec.timing.includes("سير"));
            const isHydraulic = spec.steering && (spec.steering.toLowerCase().includes("hydraulic") || spec.steering.includes("هيدروليك"));
            const isIridium = spec.sparkPlugs && (spec.sparkPlugs.toLowerCase().includes("iridium") || spec.sparkPlugs.includes("إيريديوم") || spec.sparkPlugs.includes("Iridium"));
            const isPlatinum = spec.sparkPlugs && (spec.sparkPlugs.toLowerCase().includes("platinum") || spec.sparkPlugs.includes("بلاتنيوم"));
            const todayIso = new Date().toISOString().split('T')[0];

            if (isEv) {
                catalog.push({ id: 'ev_check', name: 'فحص منظومة المحرك الكهربائي والبطارية العالية', category: 'engine', type: 'PM', kmInterval: 20000, monthInterval: 12, lastKm: initKm, lastDate: todayIso });
            } else {
                const oilName = isRenault 
                    ? 'زيت المحرك وفلتر الزيت (Elf Evolution 5W-40 / RN0710)' 
                    : (spec.oilCapacity ? `زيت المحرك وفلتر الزيت (${spec.oilCapacity})` : 'زيت المحرك وفلتر الزيت (Engine Oil & Filter)');
                catalog.push({ id: 'oil', name: oilName, category: 'engine', type: 'PM', kmInterval: 10000, monthInterval: 12, lastKm: initKm, lastDate: todayIso, oilType: '10000_12' });
                catalog.push({ id: 'air_filter', name: 'فلتر هواء المحرك (Air Filter)', category: 'filters', type: 'PM', kmInterval: 20000, monthInterval: 12, lastKm: initKm, lastDate: todayIso });
            }

            catalog.push({ id: 'ac_filter', name: 'فلتر التكييف ومقصورة الركاب (Cabin Filter)', category: 'filters', type: 'PM', kmInterval: 15000, monthInterval: 12, lastKm: initKm, lastDate: todayIso });

            // فلتر البنزين والوقود (Fuel Filter) - معتمد من كتالوجات المصنع الأصلية
            if (!isEv) {
                const brandLower = (brand || '').toLowerCase();
                const isVAG = brandLower.includes('volkswagen') || brandLower.includes('skoda') || brandLower.includes('seat') || brandLower.includes('audi');
                const isGermanLuxury = isVAG || brandLower.includes('bmw') || brandLower.includes('mercedes');
                let ffKm = 40000;
                let ffMo = 24;

                if (spec.fuelFilterKm) {
                    ffKm = spec.fuelFilterKm;
                    ffMo = spec.fuelFilterMonths || 24;
                } else if (isGermanLuxury) {
                    ffKm = 60000;
                    ffMo = 36;
                } else if (isRenault) {
                    const isModern = model && (model.toLowerCase().includes('megane') || model.toLowerCase().includes('kadjar') || model.toLowerCase().includes('duster'));
                    ffKm = isModern ? 40000 : 30000;
                    ffMo = 24;
                } else {
                    ffKm = 40000;
                    ffMo = 24;
                }

                let ffName = isRenault ? 'فلتر البنزين والوقود الأصلي (Renault Genuine Fuel Filter)' : 'فلتر البنزين / الوقود (Fuel Filter)';
                if (spec.fuelFilterLocation && spec.fuelFilterLocation.includes('In-Tank')) {
                    ffName += ' [داخل التانك / In-Tank]';
                } else if (spec.fuelFilterLocation && spec.fuelFilterLocation.includes('External')) {
                    ffName += ' [خارجي / External]';
                }

                catalog.push({
                    id: 'fuel_filter',
                    name: ffName,
                    category: 'filters',
                    type: 'PM',
                    kmInterval: ffKm,
                    monthInterval: ffMo,
                    lastKm: initKm,
                    lastDate: todayIso
                });
            }

            // البوجيهات (Spark Plugs) - حسب مواصفات المصنع الدقيقة
            let spKm = 30000;
            let spMo = 24;
            let spName = 'بوجيهات نحاسية قياسية (Copper/Nickel Plugs)';
            let spType = 'copper_25000_24';

            if (spec.sparkPlugsKm) {
                spKm = spec.sparkPlugsKm;
                spMo = spec.sparkPlugsMonths || 36;
                if (isIridium) {
                    spName = `بوجيهات إيريديوم ليزر (${spKm.toLocaleString()} كم)`;
                    spType = 'iridium_100000_60';
                } else if (isPlatinum) {
                    spName = `بوجيهات بلاتنيوم (${spKm.toLocaleString()} كم)`;
                    spType = 'platinum_60000_36';
                } else {
                    spName = `بوجيهات شمعة نيكل/نحاس (${spKm.toLocaleString()} كم)`;
                    spType = 'copper_25000_24';
                }
            } else if (isIridium) {
                spKm = isRenault ? 60000 : 100000;
                spMo = isRenault ? 48 : 60;
                spName = 'بوجيهات إيريديوم ليزر (Laser Iridium Plugs)';
                spType = 'iridium_100000_60';
            } else if (isPlatinum) {
                spKm = 60000;
                spMo = 36;
                spName = 'بوجيهات بلاتنيوم قياسية (Single Platinum Plugs)';
                spType = 'platinum_60000_36';
            } else {
                spKm = 30000;
                spMo = 24;
                spName = isRenault ? 'بوجيهات أصلية معتمدة (Renault Genuine Spark Plugs)' : 'بوجيهات نحاسية قياسية (Copper/Nickel Plugs)';
                spType = 'copper_25000_24';
            }

            if (!isEv) {
                catalog.push({ id: 'spark_plugs', name: spName, category: 'engine_parts', type: 'PM', kmInterval: spKm, monthInterval: spMo, lastKm: initKm, lastDate: todayIso, plugType: spType });
            }

            // سيور المحرك (Timing & Accessory Belts)
            if (isBelt) {
                const tbKm = spec.timingBeltKm || (isRenault ? 60000 : 50000);
                const tbMo = spec.timingBeltMonths || (isRenault ? 48 : 36);
                catalog.push({ id: 'timing_belt', name: isRenault ? 'طقم سير الكاتينة والبلي وطلمبة المياه (Renault Timing Kit)' : 'طقم سير الكاتينة والبلي والشدادات (Timing Belt Kit)', category: 'belts', type: 'PM', kmInterval: tbKm, monthInterval: tbMo, lastKm: initKm, lastDate: todayIso });
                catalog.push({ id: 'acc_belt', name: 'سير الدينامو والتكييف والمجموعة (Accessory Belts)', category: 'belts', type: 'PM', kmInterval: isRenault ? 60000 : 40000, monthInterval: isRenault ? 48 : 24, lastKm: initKm, lastDate: todayIso });
            } else if (!isEv) {
                catalog.push({ id: 'acc_belt', name: 'سير المجموعة والدينامو الخارجي (Accessory Serpentine Belt)', category: 'belts', type: 'PM', kmInterval: 60000, monthInterval: 36, lastKm: initKm, lastDate: todayIso });
            }

            // زيت الفتيس (Transmission Fluid)
            const transKm = spec.transmissionKm || 60000;
            const transMo = spec.transmissionMonths || 36;
            catalog.push({ id: 'transmission', name: `زيت الفتيس (${spec.transmission || 'Automatic'})`, category: 'engine', type: 'PM', kmInterval: transKm, monthInterval: transMo, lastKm: initKm, lastDate: todayIso });

            catalog.push({ id: 'brake_fluid', name: 'زيت الفرامل (Brake Fluid DOT 4)', category: 'engine', type: 'PM', kmInterval: 40000, monthInterval: 24, lastKm: initKm, lastDate: todayIso });
            catalog.push({ id: 'brakes', name: 'تيل الفرامل (Brake Pads Inspection/Replace)', category: 'brakes', type: 'PM', kmInterval: 35000, monthInterval: 24, lastKm: initKm, lastDate: todayIso });

            if (isHydraulic) {
                catalog.push({ id: 'power_fluid', name: 'زيت طلمبة الباور الهيدروليكي (Power Steering Fluid)', category: 'engine', type: 'PM', kmInterval: 40000, monthInterval: 36, lastKm: initKm, lastDate: todayIso });
            }

            if (!isEv) {
                const coolKm = spec.coolantKm || (isRenault ? 60000 : 45000);
                catalog.push({ id: 'coolant', name: isRenault ? 'سائل تبريد المحرك (Renault Glaceol RX Type D)' : 'سائل تبريد المحرك ومياه الردياتير (Coolant LLC)', category: 'engine', type: 'PM', kmInterval: coolKm, monthInterval: isRenault ? 48 : 24, lastKm: initKm, lastDate: todayIso });
            }

            // ختم القيم الأصلية المعيارية للكتالوج على كل بند لضمان استعادتها بدقة في أي وقت
            catalog.forEach(item => {
                item.originalKmInterval = item.kmInterval;
                item.originalMonthInterval = item.monthInterval;
                item.type = item.type || 'PM';
                item.lastDate = item.lastDate || todayIso;
            });

            return catalog;
        }

        function getChainEngineCatalog(initKm = 0) {
            return buildSpecificCatalog("كيا (Kia)", "سيراتو (Cerato / K3)", initKm);
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof buildSpecificCatalog !== 'undefined') window.buildSpecificCatalog = buildSpecificCatalog; } catch (e) {}
try { if (typeof getChainEngineCatalog !== 'undefined') window.getChainEngineCatalog = getChainEngineCatalog; } catch (e) {}
