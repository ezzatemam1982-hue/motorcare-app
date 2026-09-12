// بيانات سيارات السوق المصري والعربي - الماركات والكتالوج الشامل
// تم التصنيف وتحديد الأجيال بدقة بناءً على مواصفات المصنع الأصلية (OEM Specs)

export const BRAND_GROUPS = {
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
        "Lada", "Proton", "Daewoo", "Nasr", "Speranza"
    ]
};

export const CAR_BRANDS_CATALOG = {
    "Hyundai": {
        models: {
            "Elantra": {
                generations: [
                    {
                        name: "Elantra CN7 (2021-Present)",
                        engine: "1.6L MPI (Gamma II)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Automatic / زيت كل 60,000 كم",
                        sparkPlugs: "Iridium (تغيير كل 80,000 - 100,000 كم)",
                        oilCapacity: "3.6L - 3.8L (مع الفلتر)"
                    },
                    {
                        name: "Elantra AD (2016-2020)",
                        engine: "1.6L MPI (Gamma)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Automatic / زيت كل 60,000 كم",
                        sparkPlugs: "Iridium (تغيير كل 80,000 كم)",
                        oilCapacity: "3.6L"
                    },
                    {
                        name: "Elantra HD (2007-2024 locally assembled)",
                        engine: "1.6L MPI (Alpha II / Gamma)",
                        timing: "Belt (سير كاوتش - تغيير كل 60,000 كم)",
                        steering: "EPS (كهرباء)",
                        transmission: "4-Speed Automatic / زيت كل 40,000 كم",
                        sparkPlugs: "Nickel (تغيير كل 40,000 كم)",
                        oilCapacity: "3.3L"
                    }
                ]
            },
            "Tucson": {
                generations: [
                    {
                        name: "Tucson NX4 (2021-Present)",
                        engine: "1.6L T-GDI (Turbo)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "7-Speed DCT (Dry) / مراجعة الزيت كل 40,000 كم",
                        sparkPlugs: "Iridium (تغيير كل 60,000 كم)",
                        oilCapacity: "4.5L"
                    },
                    {
                        name: "Tucson TL (2016-2020) Turbo",
                        engine: "1.6L T-GDI (Turbo)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "7-Speed DCT (Dry)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.5L"
                    },
                    {
                        name: "Tucson TL (2016-2020) N/A",
                        engine: "1.6L GDI / MPI",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Automatic / زيت كل 60,000 كم",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    }
                ]
            },
            "Verna": {
                generations: [
                    {
                        name: "Verna (2004-2019 locally assembled)",
                        engine: "1.6L DOHC (Alpha II)",
                        timing: "Belt (سير كاوتش - تغيير كل 60,000 كم)",
                        steering: "Hydraulic (هيدروليك - تغيير زيت الباور كل 40,000 كم)",
                        transmission: "5-Speed Manual / 4-Speed Automatic",
                        sparkPlugs: "Nickel (تغيير كل 40,000 كم)",
                        oilCapacity: "3.3L"
                    }
                ]
            }
        }
    },
    "Kia": {
        models: {
            "Cerato": {
                generations: [
                    {
                        name: "Cerato K3/BD (2019-Present)",
                        engine: "1.6L MPI (Gamma)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Automatic / زيت كل 60,000 كم",
                        sparkPlugs: "Iridium (تغيير كل 80,000 كم)",
                        oilCapacity: "3.6L"
                    },
                    {
                        name: "Cerato YD (2014-2018)",
                        engine: "1.6L MPI (Gamma)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Automatic",
                        sparkPlugs: "Iridium",
                        oilCapacity: "3.6L"
                    },
                    {
                        name: "Cerato LD (2004-2009)",
                        engine: "1.6L Alpha II",
                        timing: "Belt (سير كاوتش)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "4-Speed Automatic",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.3L"
                    }
                ]
            },
            "Sportage": {
                generations: [
                    {
                        name: "Sportage NQ5 (2022-Present)",
                        engine: "1.6L T-GDI (Turbo)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "7-Speed DCT",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.5L"
                    },
                    {
                        name: "Sportage QL (2016-2021)",
                        engine: "1.6L GDI",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Automatic",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    }
                ]
            }
        }
    },
    "Toyota": {
        models: {
            "Corolla": {
                generations: [
                    {
                        name: "Corolla E210 (2019-Present)",
                        engine: "1.6L 1ZR-FE",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "CVT / تغيير الزيت كل 80,000 كم",
                        sparkPlugs: "Iridium (تغيير كل 100,000 كم)",
                        oilCapacity: "4.2L (مع الفلتر)"
                    },
                    {
                        name: "Corolla E170 (2014-2018)",
                        engine: "1.6L 1ZR-FE",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "CVT (بعد 2016) / 4-Speed Auto (قبل 2016)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.2L"
                    }
                ]
            }
        }
    },
    "Nissan": {
        models: {
            "Sunny": {
                generations: [
                    {
                        name: "Sunny N17 (2013-Present)",
                        engine: "1.5L HR15DE",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "4-Speed Automatic / زيت كل 60,000 كم",
                        sparkPlugs: "Nickel / Iridium",
                        oilCapacity: "3.2L"
                    },
                    {
                        name: "Sunny N16 (2000-2013) EX Saloon",
                        engine: "1.6L QG16DE",
                        timing: "Chain (جنزير)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "4-Speed Automatic / 5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "2.7L"
                    }
                ]
            },
            "Qashqai": {
                generations: [
                    {
                        name: "Qashqai J12 (2022-Present)",
                        engine: "1.3L Turbo (HR13DDT)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "X-Tronic CVT",
                        sparkPlugs: "Iridium",
                        oilCapacity: "5.4L"
                    },
                    {
                        name: "Qashqai J11 (2014-2021)",
                        engine: "1.2L Turbo (HRA2DDT)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "X-Tronic CVT",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.6L"
                    }
                ]
            }
        }
    },
    "Mitsubishi": {
        models: {
            "Lancer": {
                generations: [
                    {
                        name: "Lancer EX (Puma/Shark) (2008-2018)",
                        engine: "1.6L (4A92) / 1.5L (4A91)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء) / Hydraulic في بعض الموديلات",
                        transmission: "4-Speed Auto / 5-Speed Manual",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    },
                    {
                        name: "Lancer (Bawaba/Boma) (2004-2014)",
                        engine: "1.6L (4G18)",
                        timing: "Belt (سير كاوتش)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "CVT / 4-Speed Auto",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.3L"
                    }
                ]
            }
        }
    },
    "MG": {
        models: {
            "MG5": {
                generations: [
                    {
                        name: "MG5 (2020-Present)",
                        engine: "1.5L NSE Major",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "CVT / تغيير الزيت كل 60,000 كم",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    }
                ]
            },
            "MG ZS": {
                generations: [
                    {
                        name: "MG ZS (2019-Present)",
                        engine: "1.5L NSE Major",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "4-Speed Automatic",
                        sparkPlugs: "Nickel / Iridium",
                        oilCapacity: "4.0L"
                    }
                ]
            },
            "MG RX5": {
                generations: [
                    {
                        name: "MG RX5 (2019-Present)",
                        engine: "1.5L Turbo",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "7-Speed DCT (Dry)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.5L"
                    }
                ]
            }
        }
    },
    "Chery": {
        models: {
            "Tiggo 3": {
                generations: [
                    {
                        name: "Tiggo 3 (2016-Present)",
                        engine: "1.6L Acteco",
                        timing: "Belt (سير كاوتش - تغيير كل 40,000 كم)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "CVT",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    }
                ]
            },
            "Tiggo 7": {
                generations: [
                    {
                        name: "Tiggo 7 (2019-Present) Locally Assembled",
                        engine: "1.5L Turbo",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed DCT (Dry)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.7L"
                    }
                ]
            },
            "Arrizo 5": {
                generations: [
                    {
                        name: "Arrizo 5 (2019-Present)",
                        engine: "1.5L Acteco",
                        timing: "Belt (سير كاوتش)",
                        steering: "EPS (كهرباء) / Hydraulic in some trims",
                        transmission: "CVT / 5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.0L"
                    }
                ]
            }
        }
    },
    "BYD": {
        models: {
            "F3": {
                generations: [
                    {
                        name: "F3 (2010-Present) Locally Assembled",
                        engine: "1.5L (Mitsubishi 4G15S / BYD473QE)",
                        timing: "Chain (جنزير للمحركات الحديثة) / Belt (للمحركات القديمة)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "5-Speed Manual / 6-Speed DCT (in auto)",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.5L"
                    }
                ]
            }
        }
    },
    "Skoda": {
        models: {
            "Octavia": {
                generations: [
                    {
                        name: "Octavia A8 (2021-Present)",
                        engine: "1.4L TSI (Turbo)",
                        timing: "Belt (سير كاوتش طويل العمر 120,000 كم)",
                        steering: "EPS (كهرباء)",
                        transmission: "8-Speed Automatic (Aisin)",
                        sparkPlugs: "Iridium (تغيير كل 60,000 كم)",
                        oilCapacity: "4.0L"
                    },
                    {
                        name: "Octavia A7 (2014-2020)",
                        engine: "1.6L MPI / 1.4L TSI",
                        timing: "Belt (سير كاوتش)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Auto (MPI) / 7-Speed DSG (TSI)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    },
                    {
                        name: "Octavia A5 / Fantasia (2005-2013)",
                        engine: "1.6L MPI",
                        timing: "Belt (سير كاوتش)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed Tiptronic",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    },
                    {
                        name: "Octavia A4 (1998-2009)",
                        engine: "1.6L SR",
                        timing: "Belt (سير كاوتش)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "4-Speed Automatic / 5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    }
                ]
            }
        }
    },
    "Volkswagen": {
        models: {
            "Passat": {
                generations: [
                    {
                        name: "Passat B8 (2015-2023)",
                        engine: "1.4L TSI",
                        timing: "Belt (سير كاوتش)",
                        steering: "EPS (كهرباء)",
                        transmission: "7-Speed DSG (Dry - DQ200)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    }
                ]
            },
            "Golf": {
                generations: [
                    {
                        name: "Golf MK8 (2021-Present)",
                        engine: "1.4L TSI",
                        timing: "Belt (سير كاوتش)",
                        steering: "EPS (كهرباء)",
                        transmission: "8-Speed Automatic",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.0L"
                    }
                ]
            }
        }
    },
    "Peugeot": {
        models: {
            "3008": {
                generations: [
                    {
                        name: "3008 MK2 (2017-Present)",
                        engine: "1.6L THP (Turbo)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed / 8-Speed EAT (Aisin)",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.25L"
                    }
                ]
            },
            "508": {
                generations: [
                    {
                        name: "508 MK2 (2019-Present)",
                        engine: "1.6L THP (Turbo)",
                        timing: "Chain (جنزير)",
                        steering: "EPS (كهرباء)",
                        transmission: "6-Speed / 8-Speed EAT",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.25L"
                    }
                ]
            }
        }
    },
    "Renault": {
        models: {
            "Logan": {
                generations: [
                    {
                        name: "Logan MK2 (2014-2023)",
                        engine: "1.6L 16V (K4M) / 8V (K7M)",
                        timing: "Belt (سير كاوتش - 60,000 كم)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "4-Speed Automatic / 5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    }
                ]
            },
            "Megane": {
                generations: [
                    {
                        name: "Megane MK4 (2017-Present)",
                        engine: "1.6L N/A / 1.2L Turbo / 1.3L Turbo",
                        timing: "Chain (جنزير للتربو) / Belt (للتنفس الطبيعي)",
                        steering: "EPS (كهرباء)",
                        transmission: "CVT / 7-Speed EDC",
                        sparkPlugs: "Iridium",
                        oilCapacity: "4.5L"
                    }
                ]
            }
        }
    },
    "Chevrolet": {
        models: {
            "Optra": {
                generations: [
                    {
                        name: "Optra (Baojun 630) (2014-Present)",
                        engine: "1.5L S-TEC III",
                        timing: "Chain (جنزير)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "6-Speed Automatic",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.75L"
                    },
                    {
                        name: "Optra J200 (2004-2013) Daewoo based",
                        engine: "1.6L E-TEC II",
                        timing: "Belt (سير كاوتش - 40,000 كم)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "4-Speed Auto / 5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.75L"
                    }
                ]
            },
            "Cruze": {
                generations: [
                    {
                        name: "Cruze J300 (2010-2017)",
                        engine: "1.6L Ecotec",
                        timing: "Belt (سير كاوتش)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "6-Speed Automatic",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    }
                ]
            },
            "Lanos": {
                generations: [
                    {
                        name: "Lanos (1998-2020) Daewoo/Chevrolet",
                        engine: "1.5L SOHC",
                        timing: "Belt (سير كاوتش - 40,000 كم)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "5-Speed Manual",
                        sparkPlugs: "Nickel (تغيير 20,000 كم)",
                        oilCapacity: "3.5L"
                    }
                ]
            }
        }
    },
    "Lada": {
        models: {
            "Granta": {
                generations: [
                    {
                        name: "Granta (2015-Present)",
                        engine: "1.6L (8-Valve / 16-Valve)",
                        timing: "Belt (سير كاوتش)",
                        steering: "EPS (كهرباء)",
                        transmission: "5-Speed Manual / 4-Speed Auto (Jatco)",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.5L"
                    }
                ]
            }
        }
    },
    "Daewoo": {
        models: {
            "Nubira": {
                generations: [
                    {
                        name: "Nubira J100/J150 (1998-2009)",
                        engine: "1.6L E-TEC",
                        timing: "Belt (سير كاوتش)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "5-Speed Manual / 4-Speed Auto",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.75L"
                    }
                ]
            },
            "Lanos": {
                generations: [
                    {
                        name: "Lanos T100 (1997-2008)",
                        engine: "1.5L 8V SOHC",
                        timing: "Belt (سير كاوتش - 40,000 كم)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.5L"
                    }
                ]
            }
        }
    },
    "Speranza": {
        models: {
            "A516": {
                generations: [
                    {
                        name: "A516 (2006-2013)",
                        engine: "1.6L Acteco",
                        timing: "Belt (سير كاوتش - 40,000 كم)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    }
                ]
            },
            "Tiggo": {
                generations: [
                    {
                        name: "Tiggo (2008-2014)",
                        engine: "1.6L / 2.0L",
                        timing: "Belt (سير كاوتش)",
                        steering: "Hydraulic (هيدروليك)",
                        transmission: "5-Speed Manual / 4-Speed Auto",
                        sparkPlugs: "Nickel",
                        oilCapacity: "4.5L"
                    }
                ]
            }
        }
    },
    "Nasr": {
        models: {
            "128": {
                generations: [
                    {
                        name: "Nasr 128 (1971-2006)",
                        engine: "1.1L / 1.3L SOHC",
                        timing: "Belt (سير كاوتش - يفضل 30,000 كم)",
                        steering: "Manual (عادة بدون باور)",
                        transmission: "4-Speed Manual / 5-Speed Manual",
                        sparkPlugs: "Nickel (تغيير كل 15,000 كم)",
                        oilCapacity: "3.5L"
                    }
                ]
            },
            "131": {
                generations: [
                    {
                        name: "Nasr 131 (1979-2001)",
                        engine: "1.4L / 1.6L DOHC (Sahin)",
                        timing: "Belt (سير كاوتش)",
                        steering: "Manual / Hydraulic in late models",
                        transmission: "5-Speed Manual",
                        sparkPlugs: "Nickel",
                        oilCapacity: "3.8L"
                    }
                ]
            }
        }
    }
};

// وظيفة مساعدة لاستخراج الكتالوج الديناميكي بناءً على الجيل المختار
export function buildSpecificCatalog(brand, model, generationIndex, currentOdo) {
    if (!CAR_BRANDS_CATALOG[brand] || !CAR_BRANDS_CATALOG[brand].models[model]) {
        return null; // Fallback
    }
    
    const gen = CAR_BRANDS_CATALOG[brand].models[model].generations[generationIndex];
    if (!gen) return null;

    // توليد كتالوج صيانة وقائية (PM) مخصص بناءً على مواصفات الجيل
    const pmSchedule = [];
    
    // زيت المحرك
    pmSchedule.push({ part: "زيت المحرك والفلتر", interval: 10000, lastDone: currentOdo, spec: gen.oilCapacity });
    
    // البوجيهات
    const sparkInterval = gen.sparkPlugs.toLowerCase().includes("iridium") ? 80000 : 40000;
    pmSchedule.push({ part: "بوجيهات الاشتعال", interval: sparkInterval, lastDone: currentOdo, spec: gen.sparkPlugs });
    
    // الكاتينة
    if (gen.timing.toLowerCase().includes("belt") || gen.timing.includes("كاوتش")) {
        pmSchedule.push({ part: "سير الكاتينة ومجموعة الشدادات", interval: 60000, lastDone: currentOdo, spec: gen.timing });
    }
    
    // ناقل الحركة
    if (gen.transmission.toLowerCase().includes("manual")) {
         pmSchedule.push({ part: "زيت الفتيس (المانيوال)", interval: 80000, lastDone: currentOdo, spec: gen.transmission });
    } else if (gen.transmission.toLowerCase().includes("dsg") && gen.transmission.toLowerCase().includes("dry")) {
         pmSchedule.push({ part: "زيت الفتيس (DSG Dry - مراجعة)", interval: 60000, lastDone: currentOdo, spec: gen.transmission });
    } else {
         pmSchedule.push({ part: "زيت الفتيس الأوتوماتيك / CVT", interval: 60000, lastDone: currentOdo, spec: gen.transmission });
    }
    
    // التوجيه (الباور)
    if (gen.steering.toLowerCase().includes("hydraulic") || gen.steering.includes("هيدروليك")) {
        pmSchedule.push({ part: "زيت الباور (هيدروليك)", interval: 40000, lastDone: currentOdo, spec: gen.steering });
    }
    
    return pmSchedule;
}
