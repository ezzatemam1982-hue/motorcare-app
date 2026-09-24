        let currentActiveTab = 'dashboard';
        let tempImages = {};
        let costChartInstance = null;
        let monthlyChartInstance = null;
        let currentAuthMode = 'login';
        window.currentAuthMode = 'login';



        /* ==========================================================================
           [MODULE 08] بيانات التطبيق ومحرك لوحة القيادة وحالة المركبة الذكية
           ========================================================================== */
        let appState = {
            darkMode: false,
            lang: 'ar',
            currentCarIndex: 0,
            cars: [], // تبدأ فارغة تماماً للعملاء الجدد حتى لا تظهر سيارة وهمية قبل إضافة سيارته
            activeFilter: 'all'
        };

        function getCurrentCar() {
            if (!appState || !appState.cars || !Array.isArray(appState.cars) || appState.cars.length === 0) return null;
            if (typeof appState.currentCarIndex !== 'number' || isNaN(appState.currentCarIndex) || appState.currentCarIndex < 0 || appState.currentCarIndex >= appState.cars.length) {
                appState.currentCarIndex = 0;
            }
            const car = appState.cars[appState.currentCarIndex];
            if (!car || typeof car !== 'object') return null;

            // حماية سلامة البيانات الأساسية في الذاكرة لتفادي أخطاء العرض
            if (typeof car.odometer !== 'number' || isNaN(car.odometer) || car.odometer < 0) {
                car.odometer = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.parsePositiveInt)
                    ? MotorCareSecurity.parsePositiveInt(car.odometer, 0, 0, 5000000)
                    : (Math.max(0, parseInt(car.odometer, 10) || 0));
            }
            if (!Array.isArray(car.history)) car.history = [];
            if (!Array.isArray(car.fuelLogs)) car.fuelLogs = [];
            if (!Array.isArray(car.driverNotes)) car.driverNotes = [];
            if (!Array.isArray(car.trips)) car.trips = [];
            if (!Array.isArray(car.expenses)) car.expenses = [];
            if (!Array.isArray(car.customPMItems)) car.customPMItems = [];
            if (!car.wearOverrides || typeof car.wearOverrides !== 'object') car.wearOverrides = {};

            if (car && typeof migrateAndAuditCarsCatalog === 'function' && !car._audited_v143) {
                try {
                    migrateAndAuditCarsCatalog([car]);
                    car._audited_v143 = true;
                } catch(e) {
                    console.warn('[MotorCare] Catalog migration error:', e);
                }
            }
            return car;
        }



var CAR_BRANDS_CATALOG = (typeof window !== 'undefined' && window.CAR_BRANDS_CATALOG) ? window.CAR_BRANDS_CATALOG : {};

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof appState !== 'undefined') window.appState = appState; } catch (e) {}
try { if (typeof currentActiveTab !== 'undefined') window.currentActiveTab = currentActiveTab; } catch (e) {}
try { if (typeof tempImages !== 'undefined') window.tempImages = tempImages; } catch (e) {}
try { if (typeof costChartInstance !== 'undefined') window.costChartInstance = costChartInstance; } catch (e) {}
try { if (typeof monthlyChartInstance !== 'undefined') window.monthlyChartInstance = monthlyChartInstance; } catch (e) {}
try { if (typeof currentAuthMode !== 'undefined') window.currentAuthMode = currentAuthMode; } catch (e) {}
try { if (typeof CAR_BRANDS_CATALOG !== 'undefined') window.CAR_BRANDS_CATALOG = CAR_BRANDS_CATALOG; } catch (e) {}
try { if (typeof getCurrentCar !== 'undefined') window.getCurrentCar = getCurrentCar; } catch (e) {}
