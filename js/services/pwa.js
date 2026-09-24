        /* ==========================================================================
           [PWA SERVICE WORKER REGISTRATION] تسجيل السيرفيس وركر فورياً عند بداية إقلاع التطبيق
           ========================================================================== */
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then((registration) => {
                    console.log('MotorCare Service Worker active with scope:', registration.scope);
                    // مراقبة توفر تحديث جديد وتفعيله تلقائياً
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('New MotorCare PWA version ready in cache.');
                                }
                            };
                        }
                    };
                })
                .catch((error) => {
                    console.warn('Service Worker registration issue:', error);
                });

            // إعادة تحميل تلقائية عند تفعيل إصدار جديد من الكاش لتحديث جميع الخصائص فوراً
            let isRefreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!isRefreshing) {
                    isRefreshing = true;
                    console.log('Controller changed! Reloading to activate latest version...');
                    window.location.reload();
                }
            });
        }
