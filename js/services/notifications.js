        /* ==========================================================================
           [SYSTEM UTILITIES] نظام التنبيهات العصرية والتأكيد المدمج
           ========================================================================== */
        const _recentNotificationsMap = new Map();
        function showNotification(message, type = 'info', duration = 3800) {
            if (!message) return;
            const msgKey = String(message).trim();
            const now = Date.now();

            // منع تكرار نفس الرسالة تماماً إذا عُرضت خلال آخر 3.5 ثوانٍ
            if (_recentNotificationsMap.has(msgKey) && (now - _recentNotificationsMap.get(msgKey) < 3500)) {
                return;
            }
            _recentNotificationsMap.set(msgKey, now);

            // تنظيف الذاكرة دورياً
            if (_recentNotificationsMap.size > 40) {
                for (const [k, t] of _recentNotificationsMap.entries()) {
                    if (now - t > 10000) _recentNotificationsMap.delete(k);
                }
            }

            let container = document.getElementById('appToastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'appToastContainer';
                container.className = 'fixed top-4 inset-x-0 z-[100] flex flex-col items-center pointer-events-none px-4 space-y-2';
                document.body.appendChild(container);
            }

            // حد أقصى 3 إشعارات فقط على الشاشة في أي وقت لمنع تهنيج وتجميد المتصفح
            while (container.children.length >= 3) {
                container.firstElementChild.remove();
            }

            const toast = document.createElement('div');
            toast.className = 'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-bold max-w-md w-full sm:w-auto transition-all duration-300 transform translate-y-[-20px] opacity-0';
            
            let iconClass = 'fa-solid fa-circle-info';
            let colorClasses = 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-white border-slate-200 dark:border-slate-800 shadow-sky-500/5';
            let iconColor = 'text-sky-500';

            const lowerMsg = String(message || '').toLowerCase();
            if (type === 'success' || lowerMsg.includes('نجاح') || lowerMsg.includes('success') || lowerMsg.includes('✅') || lowerMsg.includes('🎉')) {
                iconClass = 'fa-solid fa-circle-check';
                iconColor = 'text-emerald-500';
                colorClasses = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-emerald-500/40 shadow-emerald-500/10';
            } else if (type === 'warning' || lowerMsg.includes('يرجى') || lowerMsg.includes('تنبيه') || lowerMsg.includes('must') || lowerMsg.includes('warning')) {
                iconClass = 'fa-solid fa-triangle-exclamation';
                iconColor = 'text-amber-500';
                colorClasses = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-amber-500/40 shadow-amber-500/10';
            } else if (type === 'error' || lowerMsg.includes('خطأ') || lowerMsg.includes('غير صحيح') || lowerMsg.includes('error') || lowerMsg.includes('fail')) {
                iconClass = 'fa-solid fa-circle-xmark';
                iconColor = 'text-rose-500';
                colorClasses = 'bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-rose-500/40 shadow-rose-500/10';
            }

            toast.className += ' ' + colorClasses;
            toast.innerHTML = `
                <i class="${iconClass} ${iconColor} text-base shrink-0"></i>
                <span class="flex-1 leading-snug">${message}</span>
                <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1 cursor-pointer" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
            `;

            container.appendChild(toast);
            requestAnimationFrame(() => {
                toast.classList.remove('translate-y-[-20px]', 'opacity-0');
                toast.classList.add('translate-y-0', 'opacity-100');
            });

            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.add('opacity-0', 'translate-y-[-10px]');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }

        // استبدال window.alert لضمان عدم ظهور أي رابط للمشروع في أي نافذة منبثقة إطلاقاً
        window.alert = function(msg) {
            showNotification(msg, 'info', 4000);
        };

        function showCustomConfirm(message, onConfirm, onCancel, options = {}) {
            const modal = document.getElementById('customConfirmModal');
            const msgEl = document.getElementById('confirmModalMessage');
            const titleEl = document.getElementById('confirmModalTitle');
            const okBtn = document.getElementById('confirmModalOkBtn');
            const cancelBtn = document.getElementById('confirmModalCancelBtn');
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (!modal) {
                if (window.confirm(message)) {
                    if (onConfirm) onConfirm();
                } else {
                    if (onCancel) onCancel();
                }
                return;
            }

            if (msgEl) msgEl.innerText = message;
            if (titleEl) titleEl.innerText = options.title || (isEn ? 'Confirm Action' : 'تأكيد الإجراء');
            if (okBtn) okBtn.innerText = options.confirmText || (isEn ? 'Confirm' : 'تأكيد الحذف');
            if (cancelBtn) cancelBtn.innerText = options.cancelText || (isEn ? 'Cancel' : 'إلغاء');

            const cleanup = () => {
                modal.classList.add('hidden');
                okBtn.onclick = null;
                cancelBtn.onclick = null;
            };

            okBtn.onclick = () => {
                cleanup();
                if (typeof onConfirm === 'function') onConfirm();
            };
            cancelBtn.onclick = () => {
                cleanup();
                if (typeof onCancel === 'function') onCancel();
            };

            modal.classList.remove('hidden');
        }

        function stepCarYear(inputId, delta) {
            const el = document.getElementById(inputId);
            if (!el) return;
            const current = parseInt(el.value) || new Date().getFullYear();
            el.value = Math.max(1950, Math.min(new Date().getFullYear() + 1, current + delta));
        }

        function onFuelImageAttached(input) {
            setTimeout(() => {
                const badge = document.getElementById('fuelReceiptBadge');
                const previewBox = document.getElementById('fuelImagePreviewBox');
                const previewThumb = document.getElementById('fuelImagePreviewThumb');
                const attached = tempImages['fuel'];
                if (attached) {
                    if (badge) badge.classList.remove('hidden');
                    if (previewBox) previewBox.classList.remove('hidden');
                    if (previewThumb) previewThumb.src = attached;
                }
            }, 300);
        }

        function clearFuelImageAttached() {
            tempImages['fuel'] = '';
            const badge = document.getElementById('fuelReceiptBadge');
            const previewBox = document.getElementById('fuelImagePreviewBox');
            const fileInput = document.getElementById('fuelReceiptFileInput');
            if (badge) badge.classList.add('hidden');
            if (previewBox) previewBox.classList.add('hidden');
            if (fileInput) fileInput.value = '';
        }



        /* ==========================================================================
           [MODULE 20] نظام إشعارات الموبايل وتنبيهات الصيانة الذكية (Mobile Push & Smart Local Notifications)
           ========================================================================== */
        const MotorCareNotifications = {
            // 1. فحص دعم المتصفح ونظام التشغيل للإشعارات
            isSupported() {
                return ('Notification' in window) || 
                       ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) ||
                       (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins?.LocalNotifications);
            },

            // 2. قراءة حالة الإذن الحالية
            getPermissionStatus() {
                if ('Notification' in window) {
                    return Notification.permission;
                }
                return 'default';
            },

            // 3. طلب إذن الإشعارات من المستخدم
            async requestPermission() {
                if (!this.isSupported()) {
                    showNotification(appState.lang === 'en' ? 'Notifications are not supported on this browser.' : 'الإشعارات غير مدعومة في هذا المتصفح/الجهاز.', 'warning');
                    return false;
                }

                try {
                    // كاباسيتور (Native Android)
                    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins?.LocalNotifications) {
                        const perm = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
                        if (perm.display === 'granted') {
                            this.updateUI();
                            showNotification(appState.lang === 'en' ? 'Notifications enabled successfully! 🔔' : 'تم تفعيل إشعارات الصيانة بنجاح! 🔔', 'success');
                            this.checkMaintenanceSchedules({ force: true });
                            return true;
                        }
                    }

                    // متصفحات الويب و PWA / TWA
                    if ('Notification' in window) {
                        const permission = await Notification.requestPermission();
                        this.updateUI();
                        if (permission === 'granted') {
                            showNotification(appState.lang === 'en' ? 'Mobile maintenance notifications enabled! 🔔' : 'تم تفعيل إشعارات الصيانة للموبايل بنجاح! 🔔', 'success');
                            this.checkMaintenanceSchedules({ force: true });
                            return true;
                        } else if (permission === 'denied') {
                            showNotification(appState.lang === 'en' ? 'Notifications blocked in browser settings.' : 'تم حظر الإشعارات في إعدادات المتصفح.', 'warning');
                            return false;
                        }
                    }
                } catch (err) {
                    console.warn('[MotorCare Notifications] Permission request error:', err);
                }
                return false;
            },

            // 4. قراءة وحفظ سجل الإشعارات لمنع التكرار المزعج
            getHistory() {
                try {
                    const raw = SafeStorage.getItem('motorCare_NotificationHistory');
                    return raw ? JSON.parse(raw) : {};
                } catch(e) {
                    return {};
                }
            },

            saveHistory(history) {
                try {
                    SafeStorage.setItem('motorCare_NotificationHistory', JSON.stringify(history));
                } catch(e) {}
            },

            // تأجيل إشعار بند معين (Snooze)
            snoozeItem(partId, durationMs = 24 * 60 * 60 * 1000) {
                const history = this.getHistory();
                if (!history[partId]) history[partId] = {};
                history[partId].snoozedUntil = Date.now() + durationMs;
                history[partId].snoozeCount = (history[partId].snoozeCount || 0) + 1;
                this.saveHistory(history);
                this.updateUI();
                if (typeof renderUrgentAlerts === 'function') renderUrgentAlerts();
            },

            // إلغاء تتبع وإشعار البند عند تسجيل إنجاز الصيانة
            clearItemNotification(partId) {
                const history = this.getHistory();
                if (history[partId]) {
                    delete history[partId];
                    this.saveHistory(history);
                }
                this.updateUI();
            },

            // نغمة رنين ناعمة باستخدام Web Audio API بدون ملفات خارجية
            playNotificationChime() {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContext) return;
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') ctx.resume();
                    const now = ctx.currentTime;
                    
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, now); // D5
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.35);
                } catch(e) {}
            },

            // 5. فحص مواعيد الصيانة ومقارنة العداد والتواريخ (Scheduled / Background Check)
            checkMaintenanceSchedules(options = {}) {
                const car = getCurrentCar();
                if (!car || !car.catalog) return { overdue: [], approaching: [], totalChecked: 0 };

                const isEn = appState.lang === 'en';
                const currentOdo = Number(car.odometer) || 0;
                const history = this.getHistory();
                const now = Date.now();
                const carName = `${car.brand || ''} ${car.model || ''}`.trim() || (isEn ? 'Your car' : 'سيارتك');

                const overdueItems = [];
                const approachingItems = [];

                car.catalog.forEach(item => {
                    const lastKm = Number(item.lastKm) || 0;
                    const kmInterval = Number(item.kmInterval) || 10000;
                    const diffKm = currentOdo - lastKm;
                    const remainingKm = kmInterval - diffKm;

                    const idLower = String(item.id || '').toLowerCase();
                    const nameLower = String(item.name || '').toLowerCase();
                    const isCritical = idLower.includes('oil') || nameLower.includes('زيت') ||
                                       idLower.includes('timing') || nameLower.includes('كاتينة') ||
                                       idLower.includes('brake') || nameLower.includes('فرامل') ||
                                       idLower.includes('coolant') || nameLower.includes('تبريد') ||
                                       idLower.includes('trans') || nameLower.includes('فتيس');

                    let isOverdue = diffKm >= kmInterval;
                    let isApproaching = !isOverdue && (remainingKm > 0 && remainingKm <= Math.min(1000, Math.max(300, Math.round(kmInterval * 0.15))));

                    let dateOverdue = false;
                    let dateApproaching = false;
                    let daysRemaining = null;
                    if (item.lastDate && item.monthInterval) {
                        try {
                            const lastD = new Date(item.lastDate);
                            if (!isNaN(lastD.getTime())) {
                                const dueD = new Date(lastD);
                                dueD.setMonth(dueD.getMonth() + parseInt(item.monthInterval));
                                daysRemaining = Math.ceil((dueD.getTime() - now) / (1000 * 60 * 60 * 24));
                                if (daysRemaining <= 0) {
                                    dateOverdue = true;
                                    isOverdue = true;
                                } else if (daysRemaining <= 14 && !isOverdue) {
                                    dateApproaching = true;
                                    isApproaching = true;
                                }
                            }
                        } catch(e) {}
                    }

                    const itemEvaluation = {
                        item,
                        isCritical,
                        diffKm,
                        kmInterval,
                        remainingKm,
                        overdueKm: diffKm - kmInterval,
                        dateOverdue,
                        dateApproaching,
                        daysRemaining,
                        status: isOverdue ? 'overdue' : (isApproaching ? 'approaching' : 'healthy')
                    };

                    if (isOverdue) overdueItems.push(itemEvaluation);
                    else if (isApproaching) approachingItems.push(itemEvaluation);
                });

                this.updateUI(overdueItems.length, approachingItems.length);

                if (overdueItems.length === 0 && approachingItems.length === 0) {
                    return { overdue: [], approaching: [], totalChecked: car.catalog.length };
                }

                // التكرار والجدولة الذكية (Smart Daily / Bi-daily Scheduling)
                const itemsToNotify = [];

                overdueItems.forEach(evalItem => {
                    const itemId = evalItem.item.id;
                    const itemHist = history[itemId] || {};

                    if (itemHist.snoozedUntil && now < itemHist.snoozedUntil && !options.force) {
                        return;
                    }

                    // البنود الحيوية المتأخرة: تكرار يومي (كل 24 ساعة). البنود العادية: تكرار كل يومين (48 ساعة)
                    const repeatCooldownMs = evalItem.isCritical ? (24 * 60 * 60 * 1000) : (48 * 60 * 60 * 1000);
                    const lastNotified = itemHist.lastNotifiedTimestamp || 0;

                    if (options.force || (now - lastNotified) >= repeatCooldownMs) {
                        itemsToNotify.push(evalItem);
                    }
                });

                if (itemsToNotify.length === 0) {
                    approachingItems.forEach(evalItem => {
                        const itemId = evalItem.item.id;
                        const itemHist = history[itemId] || {};

                        if (itemHist.snoozedUntil && now < itemHist.snoozedUntil && !options.force) return;

                        const biDailyCooldownMs = 48 * 60 * 60 * 1000;
                        const lastNotified = itemHist.lastNotifiedTimestamp || 0;

                        if (options.force || (now - lastNotified) >= biDailyCooldownMs) {
                            itemsToNotify.push(evalItem);
                        }
                    });
                }

                if (itemsToNotify.length > 0) {
                    this.dispatchSmartNotification(itemsToNotify, carName, car);

                    itemsToNotify.forEach(evalItem => {
                        const id = evalItem.item.id;
                        if (!history[id]) history[id] = {};
                        history[id].lastNotifiedTimestamp = now;
                        history[id].lastNotifiedOdometer = currentOdo;
                        history[id].lastStatus = evalItem.status;
                        history[id].notifyCount = (history[id].notifyCount || 0) + 1;
                    });
                    this.saveHistory(history);
                }

                return { overdue: overdueItems, approaching: approachingItems, totalChecked: car.catalog.length };
            },

            // 6. نصوص الإشعارات الجذابة والعملية (Engaging Notification Text)
            dispatchSmartNotification(itemsToNotify, carName, car) {
                const isEn = appState.lang === 'en';
                const primary = itemsToNotify[0];
                const primaryName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(primary.item) : primary.item.name;

                let title = '';
                let body = '';
                let targetPartId = primary.item.id;

                if (itemsToNotify.length === 1) {
                    if (primary.status === 'overdue') {
                        const isOil = primary.item.id === 'oil' || primaryName.toLowerCase().includes('زيت') || primaryName.toLowerCase().includes('oil');
                        const isTiming = primary.item.id === 'timing_belt' || primaryName.toLowerCase().includes('كاتينة');
                        const isBrakes = primary.item.id === 'brakes' || primary.item.id === 'brake_fluid' || primaryName.toLowerCase().includes('فرامل');

                        if (isOil) {
                            title = isEn ? '⚠️ MotorCare Maintenance Alert: Engine Oil' : '⚠️ تنبيه صيانة من MotorCare: زيت المحرك';
                            body = isEn
                                ? `Engine oil service for ${carName} is overdue (${primary.overdueKm > 0 ? primary.overdueKm.toLocaleString() + ' km overdue' : 'due now'}). Protect your engine and log it now!`
                                : `لقد اقترب موعد تغيير زيت المحرك لسيارتك (${carName}) أو تم تجاوزه${primary.overdueKm > 0 ? ' بـ ' + primary.overdueKm.toLocaleString() + ' كم' : ''}. حافظ على عمر محركك وسجل الصيانة الآن! 🛠️`;
                        } else if (isTiming) {
                            title = isEn ? '🚨 Critical MotorCare Alert: Timing Belt' : '🚨 تنبيه عاجل من MotorCare: سير الكاتينة';
                            body = isEn
                                ? `Timing belt service for ${carName} is overdue! Prevent severe engine damage by inspecting and replacing it now.`
                                : `تم تخطي موعد تغيير طقم سير الكاتينة لسيارتك (${carName})! لتفادي أضرار جسيمة بالمحرك، افحص السير وسجل الصيانة فوراً. ⚠️`;
                        } else if (isBrakes) {
                            title = isEn ? '⚠️ Safety Alert: Brake System' : '⚠️ تنبيه أمان من MotorCare: منظومة الفرامل';
                            body = isEn
                                ? `Brake pads & fluid inspection is overdue for ${carName}. Your safety comes first, log the service now!`
                                : `حان موعد فحص وتغيير تيل الفرامل لسيارتك (${carName}). سلامتك أولاً على الطريق، سجل إنجاز الصيانة الآن! 🛑`;
                        } else {
                            title = isEn ? `⚠️ Maintenance Due: ${primaryName}` : `⚠️ تنبيه صيانة: ${primaryName}`;
                            body = isEn
                                ? `Service for ${primaryName} on ${carName} is overdue. Tap here to view details and log completion!`
                                : `لقد حان موعد صيانة (${primaryName}) لسيارتك ${carName}. حافظ على سيارتك في أفضل حالة وسجل الصيانة الآن! 🚗`;
                        }
                    } else {
                        title = isEn ? `🔔 Maintenance Reminder: ${primaryName}` : `🔔 تذكير صيانة من MotorCare: ${primaryName}`;
                        const remText = primary.remainingKm > 0 ? (isEn ? `${primary.remainingKm.toLocaleString()} km left` : `متبقي ${primary.remainingKm.toLocaleString()} كم`) : '';
                        body = isEn
                            ? `Service for ${primaryName} on ${carName} is approaching (${remText}). Plan ahead and stay safe!`
                            : `اقترب موعد صيانة (${primaryName}) لسيارتك ${carName}${remText ? ' (' + remText + ')' : ''}. احرص على كفاءة سيارتك وسجل الصيانة بسهولة! ✨`;
                    }
                } else {
                    const count = itemsToNotify.length;
                    const otherCount = count - 1;
                    title = isEn ? `⚠️ ${count} Maintenance Items Due on ${carName}` : `⚠️ تنبيه صيانة من MotorCare: ${count} بنود مستحقة`;
                    body = isEn
                        ? `Maintenance is due for ${primaryName} and ${otherCount} other items on ${carName}. Tap to review and log them now!`
                        : `لقد حان موعد (${primaryName}) بالإضافة إلى ${otherCount} بنود صيانة أخرى لسيارتك (${carName}). حافظ على سيارتك وسجل الإنجاز الآن! 🛠️`;
                }

                this.sendDeviceNotification({
                    title,
                    body,
                    partId: targetPartId,
                    url: `./?tab=maintenance&partId=${encodeURIComponent(targetPartId)}`,
                    tag: 'motorcare-pm-' + targetPartId
                });
            },

            // 7. إرسال الإشعار لجهاز الموبايل ودعم الـ Deep Linking
            async sendDeviceNotification({ title, body, partId = '', url = './?tab=maintenance', tag = 'motorcare-alert' }) {
                this.playNotificationChime();
                if ('vibrate' in navigator) {
                    try { navigator.vibrate([200, 100, 200]); } catch(e) {}
                }

                // كاباسيتور
                if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins?.LocalNotifications) {
                    try {
                        await window.Capacitor.Plugins.LocalNotifications.schedule({
                            notifications: [
                                {
                                    title,
                                    body,
                                    id: Math.floor(Math.random() * 100000),
                                    schedule: { at: new Date(Date.now() + 100) },
                                    sound: 'beep.wav',
                                    smallIcon: 'ic_stat_icon_config_sample',
                                    extra: { tab: 'maintenance', partId }
                                }
                            ]
                        });
                        return;
                    } catch(e) {
                        console.warn('[MotorCare] Capacitor notification failed:', e);
                    }
                }

                // Service Worker Registration (PWA / TWA / Android)
                if ('serviceWorker' in navigator) {
                    try {
                        const reg = await navigator.serviceWorker.ready;
                        if (reg && typeof reg.showNotification === 'function') {
                            await reg.showNotification(title, {
                                body,
                                icon: './icon-192.png',
                                badge: './icon-192.png',
                                vibrate: [200, 100, 200, 100, 200],
                                tag,
                                renotify: true,
                                data: { url, tab: 'maintenance', partId },
                                actions: [
                                    { action: 'open_maintenance', title: appState.lang === 'en' ? 'Log Service Now 🛠️' : 'سجل الصيانة الآن 🛠️' }
                                ]
                            });
                            return;
                        }
                    } catch(e) {
                        console.warn('[MotorCare] SW showNotification error:', e);
                    }
                }

                // Notification API مباشر
                if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                        const n = new Notification(title, {
                            body,
                            icon: './icon-192.png',
                            badge: './icon-192.png',
                            tag
                        });
                        n.onclick = () => {
                            window.focus();
                            if (typeof switchTab === 'function') switchTab('maintenance');
                            if (partId && typeof openRecordModal === 'function') {
                                setTimeout(() => openRecordModal(partId), 250);
                            }
                            n.close();
                        };
                        return;
                    } catch(e) {
                        console.warn('[MotorCare] Direct Notification error:', e);
                    }
                }

                // Toast fallback
                if (typeof showNotification === 'function') {
                    showNotification(body, 'warning', 6500);
                }
            },

            // 8. تجربة إشعار فوري
            async testNotification() {
                const isEn = appState.lang === 'en';
                const status = this.getPermissionStatus();
                if (status !== 'granted') {
                    const granted = await this.requestPermission();
                    if (!granted) return;
                }

                const car = getCurrentCar();
                const carName = car ? `${car.brand || ''} ${car.model || ''}`.trim() : (isEn ? 'Your Car' : 'سيارتك');

                this.sendDeviceNotification({
                    title: isEn ? '⚠️ MotorCare Maintenance Alert (Test)' : '⚠️ تنبيه صيانة من MotorCare (تجربة حية)',
                    body: isEn
                        ? `Test Alert: Engine oil service for ${carName} is approaching! Tap to open maintenance tracker.`
                        : `⚠️ تنبيه صيانة من MotorCare: لقد اقترب موعد تغيير زيت المحرك لسيارتك (${carName}) أو تم تجاوزه. حافظ على عمر محركك وسجل الصيانة الآن! 🛠️`,
                    partId: 'oil',
                    url: './?tab=maintenance&partId=oil',
                    tag: 'test-pm-oil'
                });

                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Test notification sent to device! 🔔' : 'تم إرسال إشعار التجربة لجهازك بنجاح! 🔔', 'success');
                }
            },

            // 9. تحديث شارات التنبيه
            updateUI(overdueCount = null, approachingCount = null) {
                if (overdueCount === null) {
                    const car = getCurrentCar();
                    if (car && car.catalog) {
                        const currentOdo = Number(car.odometer) || 0;
                        overdueCount = car.catalog.filter(i => (currentOdo - (Number(i.lastKm) || 0)) >= (Number(i.kmInterval) || 1)).length;
                    } else {
                        overdueCount = 0;
                    }
                }

                const headerBadge = document.getElementById('headerNotificationBadge');
                if (headerBadge) {
                    if (overdueCount > 0) {
                        headerBadge.innerText = overdueCount > 9 ? '9+' : overdueCount;
                        headerBadge.classList.remove('hidden');
                    } else {
                        headerBadge.classList.add('hidden');
                    }
                }

                const drawerBadge = document.getElementById('drawerNotificationBadge');
                if (drawerBadge) {
                    if (overdueCount > 0) {
                        drawerBadge.innerText = overdueCount;
                        drawerBadge.classList.remove('hidden');
                    } else {
                        drawerBadge.classList.add('hidden');
                    }
                }

                const mobileNavPM = document.getElementById('mobileNav-maintenance');
                if (mobileNavPM) {
                    let dot = document.getElementById('mobileNavPMDot');
                    if (!dot) {
                        dot = document.createElement('span');
                        dot.id = 'mobileNavPMDot';
                        dot.className = 'absolute top-1 right-3 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900';
                        mobileNavPM.classList.add('relative');
                        mobileNavPM.appendChild(dot);
                    }
                    dot.style.display = overdueCount > 0 ? 'block' : 'none';
                }

                const bannerStatus = document.getElementById('maintenanceNotificationStatusBadge');
                if (bannerStatus) {
                    const perm = this.getPermissionStatus();
                    const isEn = appState.lang === 'en';
                    if (perm === 'granted') {
                        bannerStatus.className = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300';
                        bannerStatus.innerText = isEn ? 'Active & Watching ✓' : 'مفعلة وتراقب الصيانة ✓';
                    } else if (perm === 'denied') {
                        bannerStatus.className = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300';
                        bannerStatus.innerText = isEn ? 'Blocked in Settings' : 'محظورة بالمتصفح';
                    } else {
                        bannerStatus.className = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300';
                        bannerStatus.innerText = isEn ? 'Needs Permission' : 'في انتظار الإذن 🔔';
                    }
                }
            },

            // 10. تشغيل المحرك عند بدء التطبيق
            init() {
                this.updateUI();

                setTimeout(() => {
                    this.checkMaintenanceSchedules();
                }, 2000);

                if (!window.__motorCareNotifInterval) {
                    window.__motorCareNotifInterval = setInterval(() => {
                        this.checkMaintenanceSchedules();
                    }, 30 * 60 * 1000);
                }

                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.addEventListener('message', (event) => {
                        if (!event.data) return;
                        if (event.data.type === 'MOTORCARE_NAVIGATE' || event.data.type === 'MOTORCARE_SNOOZE_NOTIFICATION') {
                            const isEn = appState.lang === 'en';
                            if (typeof showNotification === 'function') {
                                showNotification(isEn ? 'Opening maintenance record... 🛠️' : 'جاري فتح شاشة تسجيل الصيانة... 🛠️', 'success', 4000);
                            }
                            if (typeof switchTab === 'function') {
                                switchTab('maintenance');
                            }
                            const partId = event.data.partId || 'oil';
                            if (typeof openRecordModal === 'function') {
                                setTimeout(() => openRecordModal(partId), 300);
                            }
                        }
                    });
                }
            }
        };

        function openNotificationsHubModal() {
            const modal = document.getElementById('notificationsHubModal');
            if (!modal) return;

            modal.classList.remove('hidden');
            modal.style.display = 'flex';

            const pill = document.getElementById('notifPermissionPill');
            const hint = document.getElementById('notifPermissionHint');
            const reqBtn = document.getElementById('btnRequestNotifPermission');
            const status = MotorCareNotifications.getPermissionStatus();
            const isEn = appState.lang === 'en';

            if (pill) {
                if (status === 'granted') {
                    pill.className = 'px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';
                    pill.innerText = isEn ? 'Enabled & Active ✓' : 'مفعلة وتعمل بنجاح ✓';
                    if (hint) hint.innerText = isEn 
                        ? 'Push & Local notifications are authorized on this device. MotorCare checks maintenance and sends smart alerts.' 
                        : 'الإشعارات مفعلة ومصرح بها على جهازك. يقوم التطبيق بفحص العداد ومواعيد الصيانة دورياً وإرسال تنبيهات ذكية مباشرة لشاشتك.';
                    if (reqBtn) reqBtn.style.display = 'none';
                } else if (status === 'denied') {
                    pill.className = 'px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
                    pill.innerText = isEn ? 'Blocked in Settings ✕' : 'محظورة في إعدادات المتصفح ✕';
                    if (hint) hint.innerText = isEn 
                        ? 'Notifications are blocked. Please click the padlock or site settings icon in your browser address bar to allow notifications.' 
                        : 'تم رفض إذن الإشعارات مسبقاً. لتفعيلها، يرجى الضغط على علامة القفل بجوار شريط العنوان في المتصفح واختيار "السماح بالإشعارات".';
                    if (reqBtn) reqBtn.style.display = 'none';
                } else {
                    pill.className = 'px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300';
                    pill.innerText = isEn ? 'Permission Required 🔔' : 'في انتظار التفعيل 🔔';
                    if (hint) hint.innerText = isEn 
                        ? 'Allow notifications so MotorCare can remind you when your engine oil, belts, or brake pads are due for service.' 
                        : 'اضغط على زر التفعيل أدناه لمنح MotorCare إذن إرسال تنبيهات الصيانة لسيارتك عند اقتراب أو تجاوز مواعيد تغيير الزيت والقطع.';
                    if (reqBtn) reqBtn.style.display = 'inline-flex';
                }
            }

            renderNotificationsHubList();
        }

        function closeNotificationsHubModal() {
            const modal = document.getElementById('notificationsHubModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        function renderNotificationsHubList() {
            const container = document.getElementById('notifHubAlertsContainer');
            const totalBadge = document.getElementById('notifHubTotalBadge');
            if (!container) return;

            const evalData = MotorCareNotifications.checkMaintenanceSchedules();
            const overdue = evalData.overdue || [];
            const approaching = evalData.approaching || [];
            const allAlerts = [...overdue, ...approaching];
            const isEn = appState.lang === 'en';
            const history = MotorCareNotifications.getHistory();

            if (totalBadge) {
                if (overdue.length > 0) {
                    totalBadge.innerText = overdue.length;
                    totalBadge.classList.remove('hidden');
                } else {
                    totalBadge.classList.add('hidden');
                }
            }

            if (allAlerts.length === 0) {
                container.innerHTML = `
                    <div class="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                        <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 text-xl">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <h5 class="text-xs font-black text-slate-800 dark:text-white">${isEn ? 'All Maintenance Items Up-to-Date!' : 'كافة بنود الصيانة في حالة ممتازة!'}</h5>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">${isEn ? 'No overdue or approaching items for this vehicle.' : 'لا توجد أي بنود صيانة متأخرة أو مقتربة لسيارتك الحالية حالياً.'}</p>
                    </div>
                `;
                return;
            }

            let html = '';
            allAlerts.forEach(evalItem => {
                const item = evalItem.item;
                const pName = (typeof getLocalizedItemName === 'function') ? getLocalizedItemName(item) : item.name;
                const isOverdue = evalItem.status === 'overdue';
                const itemHist = history[item.id] || {};
                const isSnoozed = itemHist.snoozedUntil && Date.now() < itemHist.snoozedUntil;

                let statusText = '';
                let badgeColor = '';

                if (isOverdue) {
                    badgeColor = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60';
                    if (evalItem.overdueKm > 0) {
                        statusText = isEn ? `Overdue by ${evalItem.overdueKm.toLocaleString()} km` : `متأخر بـ ${evalItem.overdueKm.toLocaleString()} كم`;
                    } else if (evalItem.daysRemaining !== null && evalItem.daysRemaining <= 0) {
                        statusText = isEn ? `Overdue by ${Math.abs(evalItem.daysRemaining)} days` : `متأخر بـ ${Math.abs(evalItem.daysRemaining)} يوم`;
                    } else {
                        statusText = isEn ? 'Overdue Now' : 'مستحق الآن';
                    }
                } else {
                    badgeColor = 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60';
                    if (evalItem.remainingKm > 0) {
                        statusText = isEn ? `Remaining: ${evalItem.remainingKm.toLocaleString()} km` : `متبقي ${evalItem.remainingKm.toLocaleString()} كم`;
                    } else if (evalItem.daysRemaining !== null) {
                        statusText = isEn ? `Remaining: ${evalItem.daysRemaining} days` : `متبقي ${evalItem.daysRemaining} يوم`;
                    } else {
                        statusText = isEn ? 'Due Soon' : 'يقترب موعده';
                    }
                }

                html += `
                    <div class="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs hover:border-sky-500/50 transition-all">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl ${isOverdue ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'} flex items-center justify-center shrink-0 text-sm">
                                <i class="fa-solid ${isOverdue ? 'fa-triangle-exclamation' : 'fa-clock'}"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-black text-slate-800 dark:text-slate-200">${pName}</span>
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${badgeColor}">${statusText}</span>
                                    ${isSnoozed ? `<span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"><i class="fa-solid fa-clock-rotate-left"></i> ${isEn ? 'Snoozed' : 'مؤجل'}</span>` : ''}
                                </div>
                                <div class="text-[10px] text-slate-400 mt-0.5">
                                    ${isEn ? 'Interval:' : 'فترة الصيانة:'} ${Number(item.kmInterval).toLocaleString()} كم ${item.monthInterval ? `• ${item.monthInterval} ${isEn ? 'months' : 'شهر'}` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="MotorCareNotifications.snoozeItem('${item.id}', 24*60*60*1000); renderNotificationsHubList(); showNotification('${isEn ? 'Reminder snoozed for 24h ⏰' : 'تم تأجيل التنبيه 24 ساعة ⏰'}', 'info');" class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold cursor-pointer transition-colors" title="${isEn ? 'Snooze reminder for 24 hours' : 'تأجيل التنبيه لمدة 24 ساعة'}">
                                <i class="fa-solid fa-bell-slash text-slate-400"></i>
                                <span class="hidden sm:inline">${isEn ? 'Snooze 24h' : 'تأجيل 24س'}</span>
                            </button>
                            <button type="button" onclick="closeNotificationsHubModal(); openRecordModal('${item.id}');" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                                <i class="fa-solid fa-wrench text-[10px]"></i>
                                <span>${isEn ? 'Log Now 🛠️' : 'سجل الصيانة 🛠️'}</span>
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }

        function checkUrlNotificationActions() {
            const urlParams = new URLSearchParams(window.location.search);
            const targetTab = urlParams.get('tab');
            const targetPartId = urlParams.get('partId');
            if (targetTab) {
                const isEn = appState.lang === 'en';
                if (typeof showNotification === 'function') {
                    showNotification(isEn ? 'Opening maintenance record... 🛠️' : 'جاري فتح شاشة تسجيل الصيانة... 🛠️', 'success', 4000);
                }
                setTimeout(() => {
                    if (typeof switchTab === 'function') switchTab(targetTab);
                    if (targetPartId && typeof openRecordModal === 'function') {
                        setTimeout(() => openRecordModal(targetPartId), 400);
                    }
                }, 600);
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof showNotification !== 'undefined') window.showNotification = showNotification; } catch (e) {}
try { if (typeof showCustomConfirm !== 'undefined') window.showCustomConfirm = showCustomConfirm; } catch (e) {}
try { if (typeof MotorCareNotifications !== 'undefined') window.MotorCareNotifications = MotorCareNotifications; } catch (e) {}
