        /* ==========================================================================
           [NETWORK STATUS & OFFLINE BANNER] إدارة حالة الاتصال وإشعار وضع عدم الاتصال
           ========================================================================== */
        let hasShownOfflineNotice = false;
        let networkBannerTimer = null;

        function updateNetworkStatus(isOnline) {
            const banner = document.getElementById('networkStatusBanner');
            const inner = document.getElementById('networkStatusBannerInner');
            const iconBox = document.getElementById('networkStatusIconBox');
            const icon = document.getElementById('networkStatusIcon');
            const text = document.getElementById('networkStatusText');
            if (!banner || !inner || !iconBox || !icon || !text) return;

            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');

            if (networkBannerTimer) {
                clearTimeout(networkBannerTimer);
                networkBannerTimer = null;
            }

            if (!isOnline) {
                hasShownOfflineNotice = true;
                // إظهار تنبيه انقطاع الإنترنت (وضع عدم الاتصال)
                inner.className = 'pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-bold transition-all duration-300 bg-amber-500/15 dark:bg-slate-900/95 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-amber-500/10';
                iconBox.className = 'w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-inner bg-amber-500/20 text-amber-600 dark:text-amber-400';
                icon.className = 'fa-solid fa-wifi-slash text-sm';
                text.innerText = isEn 
                    ? 'You are currently working in offline mode - your data is saved and accessible'
                    : 'أنت تعمل الآن في وضع عدم الاتصال بالإنترنت - بياناتك محفوظة ومتاحة';

                banner.classList.remove('-translate-y-20', 'opacity-0');
                banner.classList.add('translate-y-0', 'opacity-100');
            } else {
                // إذا عاد الاتصال بعد أن كان مقطوعاً
                if (hasShownOfflineNotice) {
                    inner.className = 'pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-bold transition-all duration-300 bg-emerald-500/15 dark:bg-slate-900/95 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-emerald-500/10';
                    iconBox.className = 'w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-inner bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
                    icon.className = 'fa-solid fa-wifi text-sm';
                    text.innerText = isEn 
                        ? 'Internet connection restored successfully'
                        : 'تم استعادة الاتصال بالإنترنت بنجاح';

                    banner.classList.remove('-translate-y-20', 'opacity-0');
                    banner.classList.add('translate-y-0', 'opacity-100');

                    // إخفاء الشريط تلقائياً بعد 3.5 ثوانٍ
                    networkBannerTimer = setTimeout(() => {
                        dismissNetworkBanner();
                    }, 3500);
                } else {
                    dismissNetworkBanner();
                }
            }
        }

        function dismissNetworkBanner() {
            const banner = document.getElementById('networkStatusBanner');
            if (banner) {
                banner.classList.remove('translate-y-0', 'opacity-100');
                banner.classList.add('-translate-y-20', 'opacity-0');
            }
        }

        function initNetworkStatusMonitor() {
            window.addEventListener('online', () => updateNetworkStatus(true));
            window.addEventListener('offline', () => updateNetworkStatus(false));
            
            // فحص الحالة المبدئية عند إقلاع التطبيق
            if (!navigator.onLine) {
                updateNetworkStatus(false);
            }
        }

// ==========================================================================
// [EXPLICIT GLOBAL SCOPE BINDINGS]
// ==========================================================================
try { if (typeof hasShownOfflineNotice !== 'undefined') window.hasShownOfflineNotice = hasShownOfflineNotice; } catch (e) {}
try { if (typeof updateNetworkStatus !== 'undefined') window.updateNetworkStatus = updateNetworkStatus; } catch (e) {}
try { if (typeof dismissNetworkBanner !== 'undefined') window.dismissNetworkBanner = dismissNetworkBanner; } catch (e) {}
try { if (typeof initNetworkStatusMonitor !== 'undefined') window.initNetworkStatusMonitor = initNetworkStatusMonitor; } catch (e) {}
