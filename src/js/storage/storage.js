        /* ==========================================================================
           [LOCAL STORAGE & OFFLINE ENGINE] محرك التخزين المحلي الآمن وقراءة البيانات فوراً
           ========================================================================== */
        const SafeStorage = {
            _memory: {},
            _isAvailable: null,

            // اختبار سلامة التخزين المحلي للكشف عن وضع التصفح المتخفي أو الصلاحيات المقيدة
            checkAvailability() {
                if (this._isAvailable !== null) return this._isAvailable;
                try {
                    const testKey = '__mc_probe__';
                    localStorage.setItem(testKey, testKey);
                    localStorage.removeItem(testKey);
                    this._isAvailable = true;
                } catch(e) {
                    this._isAvailable = false;
                    console.warn('[MotorCare SafeStorage] LocalStorage is unavailable or restricted. Memory fallback active.');
                }
                return this._isAvailable;
            },

            getItem(key) {
                try {
                    if (this.checkAvailability()) {
                        const val = localStorage.getItem(key);
                        if (val !== null) return val;
                    }
                } catch(e) {
                    console.warn(`[MotorCare SafeStorage] getItem error for "${key}":`, e);
                }
                return this._memory[key] !== undefined ? this._memory[key] : null;
            },

            setItem(key, val) {
                let strVal;
                if (typeof val === 'object' && val !== null) {
                    try {
                        strVal = JSON.stringify(val);
                    } catch(jsonErr) {
                        strVal = String(val);
                    }
                } else {
                    strVal = String(val !== undefined && val !== null ? val : '');
                }
                this._memory[key] = strVal;
                let writtenToLocal = false;
                try {
                    if (this.checkAvailability()) {
                        localStorage.setItem(key, strVal);
                        writtenToLocal = true;
                    }
                } catch(e) {
                    console.error(`[MotorCare SafeStorage] setItem failed for "${key}":`, e);
                    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
                        const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
                        if (typeof showNotification === 'function') {
                            showNotification(isEn 
                                ? 'Local storage full! Cloud & IndexedDB backups active.' 
                                : 'تنبيه: اقتربت مساحة التخزين من الامتلاء! تم تفعيل الحفظ الاحتياطي في قاعدة IndexedDB والسحاب.', 'warning');
                        }
                    }
                }

                // النسخ الاحتياطي التلقائي المتزامن في IndexedDB لبيانات التطبيق والكراج
                if (key === 'motorCare_AppState_v140' && typeof MotorCareIndexedDB !== 'undefined') {
                    try {
                        const parsedObj = (typeof val === 'object' && val !== null) ? val : JSON.parse(strVal);
                        MotorCareIndexedDB.setItem(key, parsedObj).catch(() => {});
                    } catch(jsonErr) {}
                }

                return writtenToLocal;
            },

            removeItem(key) {
                delete this._memory[key];
                try {
                    if (this.checkAvailability()) {
                        localStorage.removeItem(key);
                    }
                } catch(e) {
                    console.warn(`[MotorCare SafeStorage] removeItem error for "${key}":`, e);
                }
                if (typeof MotorCareIndexedDB !== 'undefined') {
                    MotorCareIndexedDB.removeItem(key).catch(() => {});
                }
            },

            // استرجاع آمن ومباشر لكائنات JSON مع معالجة الأخطاء والقيم البديلة
            getJSON(key, fallback = null) {
                const raw = this.getItem(key);
                if (!raw || typeof raw !== 'string' || raw.trim() === '' || raw === '[object Object]') return fallback;
                try {
                    const parsed = JSON.parse(raw);
                    return (parsed !== null && parsed !== undefined) ? parsed : fallback;
                } catch(e) {
                    console.warn(`[MotorCare SafeStorage] Corrupted JSON in key "${key}":`, e);
                    return fallback;
                }
            },

            // حفظ آمن ومباشر لكائنات JSON مع معالجة التسلسل والمراجع الدائرية
            setJSON(key, obj) {
                try {
                    const str = JSON.stringify(obj);
                    return this.setItem(key, str);
                } catch(e) {
                    console.error(`[MotorCare SafeStorage] setJSON serialization error for "${key}":`, e);
                    return false;
                }
            }
        };



        /* ==========================================================================
           [INDEXED-DB OFFLINE PERSISTENCE] محرك التخزين المستقل عالي السعة (IndexedDB)
           ========================================================================== */
        const MotorCareIndexedDB = {
            dbName: 'MotorCareAppDB',
            dbVersion: 1,
            storeName: 'app_backup_store',
            _dbInstance: null,

            async getDB() {
                if (this._dbInstance) return this._dbInstance;
                if (typeof window === 'undefined' || !window.indexedDB) return null;

                return new Promise((resolve) => {
                    try {
                        const request = window.indexedDB.open(this.dbName, this.dbVersion);
                        request.onupgradeneeded = (e) => {
                            try {
                                const db = e.target.result;
                                if (!db.objectStoreNames.contains(this.storeName)) {
                                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                                }
                            } catch(upgErr) {
                                console.warn('[MotorCare IndexedDB] Upgrade error:', upgErr);
                            }
                        };
                        request.onsuccess = (e) => {
                            this._dbInstance = e.target.result;
                            resolve(this._dbInstance);
                        };
                        request.onerror = (e) => {
                            console.warn('[MotorCare IndexedDB] Open failed:', e);
                            resolve(null);
                        };
                        request.onblocked = () => {
                            console.warn('[MotorCare IndexedDB] Open blocked');
                            resolve(null);
                        };
                    } catch (err) {
                        console.warn('[MotorCare IndexedDB] Exception during open:', err);
                        resolve(null);
                    }
                });
            },

            async setItem(key, value) {
                try {
                    const db = await this.getDB();
                    if (!db) return false;
                    return new Promise((resolve) => {
                        try {
                            const tx = db.transaction([this.storeName], 'readwrite');
                            const store = tx.objectStore(this.storeName);
                            const putReq = store.put({ key, value, timestamp: Date.now() });
                            putReq.onsuccess = () => resolve(true);
                            putReq.onerror = () => resolve(false);
                            tx.onerror = () => resolve(false);
                            tx.onabort = () => resolve(false);
                        } catch(txErr) {
                            console.warn('[MotorCare IndexedDB] setItem tx error:', txErr);
                            resolve(false);
                        }
                    });
                } catch(e) {
                    return false;
                }
            },

            async getItem(key) {
                try {
                    const db = await this.getDB();
                    if (!db) return null;
                    return new Promise((resolve) => {
                        try {
                            const tx = db.transaction([this.storeName], 'readonly');
                            const store = tx.objectStore(this.storeName);
                            const getReq = store.get(key);
                            getReq.onsuccess = (e) => {
                                const record = e.target.result;
                                resolve(record ? record.value : null);
                            };
                            getReq.onerror = () => resolve(null);
                            tx.onerror = () => resolve(null);
                            tx.onabort = () => resolve(null);
                        } catch(txErr) {
                            console.warn('[MotorCare IndexedDB] getItem tx error:', txErr);
                            resolve(null);
                        }
                    });
                } catch(e) {
                    return null;
                }
            },

            async removeItem(key) {
                try {
                    const db = await this.getDB();
                    if (!db) return false;
                    return new Promise((resolve) => {
                        try {
                            const tx = db.transaction([this.storeName], 'readwrite');
                            const store = tx.objectStore(this.storeName);
                            const delReq = store.delete(key);
                            delReq.onsuccess = () => resolve(true);
                            delReq.onerror = () => resolve(false);
                            tx.onerror = () => resolve(false);
                            tx.onabort = () => resolve(false);
                        } catch(txErr) {
                            console.warn('[MotorCare IndexedDB] removeItem tx error:', txErr);
                            resolve(false);
                        }
                    });
                } catch(e) {
                    return false;
                }
            }
        };



        /* ==========================================================================
           [DATA INTEGRITY & STATE SANITIZATION] طبقة تدقيق وحماية بيانات السيارة والتخزين
           ========================================================================== */
        function validateAndSanitizeAppState(state) {
            if (!state || typeof state !== 'object' || Array.isArray(state)) {
                state = {};
            }
            if (typeof state.darkMode !== 'boolean') state.darkMode = false;
            if (state.lang !== 'en' && state.lang !== 'ar') state.lang = 'ar';
            if (!Array.isArray(state.cars)) state.cars = [];

            // فحص وتدقيق كل سيارة داخل الكراج لمنع أي انهيار في شاشات العرض
            state.cars = state.cars.filter(car => car && typeof car === 'object' && !Array.isArray(car)).map((car, idx) => {
                // تدقيق قراءة العداد كعدد صحيح موجب
                car.odometer = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.parsePositiveInt)
                    ? MotorCareSecurity.parsePositiveInt(car.odometer, 0, 0, 5000000)
                    : Math.max(0, Math.min(5000000, parseInt(car.odometer, 10) || 0));

                car.year = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.parsePositiveInt)
                    ? MotorCareSecurity.parsePositiveInt(car.year, new Date().getFullYear(), 1950, 2030)
                    : (parseInt(car.year, 10) || new Date().getFullYear());

                car.dailyKm = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.parsePositiveInt)
                    ? MotorCareSecurity.parsePositiveInt(car.dailyKm, 40, 1, 2000)
                    : (parseInt(car.dailyKm, 10) || 40);

                // تنقية النصوص الأساسية
                car.id = car.id || ('car_' + Date.now() + '_' + idx);
                car.brand = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.sanitizeText)
                    ? MotorCareSecurity.sanitizeText(car.brand || 'Unknown', 60)
                    : String(car.brand || 'Unknown').slice(0, 60);

                car.model = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.sanitizeText)
                    ? MotorCareSecurity.sanitizeText(car.model || 'Model', 60)
                    : String(car.model || 'Model').slice(0, 60);

                car.generation = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.sanitizeText)
                    ? MotorCareSecurity.sanitizeText(car.generation || '', 80)
                    : String(car.generation || '').slice(0, 80);

                car.license = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.sanitizeText)
                    ? MotorCareSecurity.sanitizeText(car.license || '', 30)
                    : String(car.license || '').slice(0, 30);

                car.color = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.sanitizeText)
                    ? MotorCareSecurity.sanitizeText(car.color || '', 40)
                    : String(car.color || '').slice(0, 40);

                car.vin = (typeof MotorCareSecurity !== 'undefined' && MotorCareSecurity.sanitizeText)
                    ? MotorCareSecurity.sanitizeText(car.vin || '', 30)
                    : String(car.vin || '').slice(0, 30);

                // ضمان سلامة جدول الصيانة (catalog)
                if (!Array.isArray(car.catalog)) {
                    car.catalog = (typeof buildDefaultCatalogForCar === 'function')
                        ? buildDefaultCatalogForCar(car.brand, car.model, car.generation, car.year, car.odometer)
                        : [];
                } else {
                    car.catalog = car.catalog.filter(item => item && typeof item === 'object').map(item => {
                        item.id = String(item.id || ('item_' + Math.random().toString(36).slice(2, 7)));
                        item.name = String(item.name || 'عنصر صيانة');
                        item.kmInterval = Math.max(1000, parseInt(item.kmInterval, 10) || 10000);
                        item.monthInterval = Math.max(1, parseInt(item.monthInterval, 10) || 12);
                        item.lastKm = Math.max(0, parseInt(item.lastKm, 10) || 0);
                        item.lastDate = item.lastDate || new Date().toISOString().split('T')[0];
                        return item;
                    });
                }

                // ضمان سلامة المصفوفات التابعة لمنع أخطاء TypeError (reading 'filter' or 'length')
                if (Array.isArray(car.history)) {
                    car.history = car.history.filter(h => h && typeof h === 'object').map(h => {
                        h.id = h.id || ('hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
                        h.km = Math.max(0, parseInt(h.km, 10) || 0);
                        h.cost = Math.max(0, parseFloat(h.cost) || 0);
                        h.date = h.date || new Date().toISOString().split('T')[0];
                        return h;
                    });
                } else {
                    car.history = [];
                }

                if (Array.isArray(car.fuelLogs)) {
                    car.fuelLogs = car.fuelLogs.filter(f => f && typeof f === 'object').map(f => {
                        f.id = f.id || ('fuel_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
                        f.km = Math.max(0, parseInt(f.km, 10) || 0);
                        f.liters = Math.max(0, parseFloat(f.liters) || 0);
                        f.cost = Math.max(0, parseFloat(f.cost) || 0);
                        f.date = f.date || new Date().toISOString().split('T')[0];
                        return f;
                    });
                } else {
                    car.fuelLogs = [];
                }

                if (Array.isArray(car.expenses)) {
                    car.expenses = car.expenses.filter(x => x && typeof x === 'object').map(x => {
                        x.id = x.id || ('exp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
                        x.amount = Math.max(0, parseFloat(x.amount) || 0);
                        x.date = x.date || new Date().toISOString().split('T')[0];
                        return x;
                    });
                } else {
                    car.expenses = [];
                }

                if (!Array.isArray(car.driverNotes)) car.driverNotes = [];
                if (!Array.isArray(car.trips)) car.trips = [];
                if (!Array.isArray(car.customPMItems)) car.customPMItems = [];
                if (!car.wearOverrides || typeof car.wearOverrides !== 'object') car.wearOverrides = {};
                if (!car.battery || typeof car.battery !== 'object') {
                    car.battery = { brand: '', capacity: '', techType: '', purchaseDate: '', warrantyMonths: 0, isConfigured: false };
                }
                if (!car.tiresInfo || typeof car.tiresInfo !== 'object') {
                    car.tiresInfo = { size: '', dotCode: '', frontPsi: 32, rearPsi: 30, isConfigured: false };
                }
                if (!car.documents || typeof car.documents !== 'object') car.documents = {};

                return car;
            });

            // ضبط مؤشر السيارة النشطة
            if (typeof state.currentCarIndex !== 'number' || isNaN(state.currentCarIndex) || state.currentCarIndex < 0 || (state.cars.length > 0 && state.currentCarIndex >= state.cars.length)) {
                state.currentCarIndex = 0;
            }

            if (typeof state.activeFilter !== 'string') state.activeFilter = 'all';

            return state;
        }

        // المحرك المركزي الموحد لحفظ حالة التطبيق محلياً وسحابياً بأمان تام
        function saveAppState(triggerReason = 'general_update') {
            try {
                if (typeof validateAndSanitizeAppState === 'function') {
                    appState = validateAndSanitizeAppState(appState);
                }
                SafeStorage.setJSON('motorCare_AppState_v140', appState);
                if (typeof syncUserDataToCloud === 'function') {
                    try {
                        syncUserDataToCloud(triggerReason);
                    } catch (cloudErr) {
                        console.warn('[MotorCare Cloud] Non-blocking sync notice:', cloudErr);
                    }
                }
                return true;
            } catch (err) {
                console.error('[MotorCare Storage] Critical saveAppState error:', err);
                return false;
            }
        }



        function debounce(fn, delay = 180) {
            let timer = null;
            return function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }

        function compressAndResizeImage(file, maxDimension = 1200, quality = 0.75) {
            return new Promise((resolve, reject) => {
                if (!file || !file.type.startsWith('image/')) {
                    return reject(new Error('Selected file is not an image'));
                }
                const reader = new FileReader();
                reader.onerror = reject;
                reader.onload = function(e) {
                    const img = new Image();
                    img.onerror = reject;
                    img.onload = function() {
                        let width = img.naturalWidth || img.width;
                        let height = img.naturalHeight || img.height;

                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round((height * maxDimension) / width);
                                width = maxDimension;
                            } else {
                                width = Math.round((width * maxDimension) / height);
                                height = maxDimension;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            return resolve(e.target.result);
                        }

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressedDataUrl);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof SafeStorage !== 'undefined') window.SafeStorage = SafeStorage; } catch (e) {}
try { if (typeof MotorCareIndexedDB !== 'undefined') window.MotorCareIndexedDB = MotorCareIndexedDB; } catch (e) {}
try { if (typeof validateAndSanitizeAppState !== 'undefined') window.validateAndSanitizeAppState = validateAndSanitizeAppState; } catch (e) {}
try { if (typeof saveAppState !== 'undefined') window.saveAppState = saveAppState; } catch (e) {}
try { if (typeof debounce !== 'undefined') window.debounce = debounce; } catch (e) {}
try { if (typeof compressAndResizeImage !== 'undefined') window.compressAndResizeImage = compressAndResizeImage; } catch (e) {}
