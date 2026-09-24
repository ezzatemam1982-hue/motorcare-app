/**
 * ============================================================================
 * MOTORCARE MODULAR ARCHITECTURE - MOBILE SERVICE (Mobile UX & Capacitor Essentials)
 * ============================================================================
 * - Safe Platform Detection (Capacitor Native vs. Web/Desktop)
 * - Android Hardware Back Button Hierarchical Handling (Modals -> Tabs -> Exit)
 * - Subtle Haptic Feedback (Light Impact, Success & Warning Notifications)
 * - Safe Area Inset Support & Responsive Viewport Adjustments
 * - 100% Safe Fallbacks for Standard Browsers & Desktop Environments
 */

(function (window, document) {
    'use strict';

    // 1. فحص المنصة وبيئة التشغيل بأمان مطلق دون إطلاق أي أخطاء وقت التشغيل
    function isNativePlatform() {
        try {
            return typeof window !== 'undefined' &&
                   !!window.Capacitor &&
                   typeof window.Capacitor.isNativePlatform === 'function' &&
                   window.Capacitor.isNativePlatform();
        } catch (e) {
            return false;
        }
    }

    // استخراج الإضافات الأصلية بأمان (Plugins Getter)
    function getCapacitorPlugin(pluginName) {
        try {
            if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins) {
                return window.Capacitor.Plugins[pluginName] || null;
            }
        } catch (e) {}
        return null;
    }

    // ============================================================================
    // 2. خدمة الاهتزازات التفاعلية اللطيفة (Subtle Haptic Feedback Service)
    // ============================================================================
    const MotorCareHaptics = {
        /**
         * اهتزاز خفيف جداً عند النقر على الأزرار الرئيسية والتنقل بين التبويبات
         */
        async triggerLight() {
            try {
                const Haptics = getCapacitorPlugin('Haptics');
                if (isNativePlatform() && Haptics && typeof Haptics.impact === 'function') {
                    await Haptics.impact({ style: 'LIGHT' });
                    return;
                }
                // بديل صامت وخفيف جداً لمتصفحات الجوال التي تدعم الاهتزاز
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(8);
                }
            } catch (e) {
                // No-op fallback
            }
        },

        /**
         * اهتزاز تأكيد النجاح عند حفظ البيانات أو إرسال النماذج أو نجاح المزامنة
         */
        async triggerSuccess() {
            try {
                const Haptics = getCapacitorPlugin('Haptics');
                if (isNativePlatform() && Haptics && typeof Haptics.notification === 'function') {
                    await Haptics.notification({ type: 'SUCCESS' });
                    return;
                }
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate([12, 40, 12]);
                }
            } catch (e) {
                // No-op fallback
            }
        },

        /**
         * اهتزاز تنبيهي خفيف عند التحذيرات أو الحذف
         */
        async triggerWarning() {
            try {
                const Haptics = getCapacitorPlugin('Haptics');
                if (isNativePlatform() && Haptics && typeof Haptics.notification === 'function') {
                    await Haptics.notification({ type: 'WARNING' });
                    return;
                }
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate([20, 50, 20]);
                }
            } catch (e) {
                // No-op fallback
            }
        }
    };

    // ============================================================================
    // 3. إدارة زر الرجوع الفيزيائي لأجهزة أندرويد (Hardware Back Button Hierarchy)
    // ============================================================================
    let lastBackPressTime = 0;
    const DOUBLE_TAP_EXIT_DELAY_MS = 2000;

    /**
     * التحقق مما إذا كان هناك أي نافذة منبثقة أو درج مفتوح وإغلاق الأحدث أولاً
     * Priority (a): Close topmost Modal / Drawer / Popup
     */
    function closeTopmostModalOrDrawer() {
        // 1. درج المزيد الخاص بالموبايل
        const mobileDrawer = document.getElementById('mobileMoreDrawerModal');
        if (mobileDrawer && !mobileDrawer.classList.contains('hidden') && mobileDrawer.style.display !== 'none') {
            if (typeof window.closeMobileMoreDrawer === 'function') {
                window.closeMobileMoreDrawer();
            } else {
                mobileDrawer.classList.add('hidden');
            }
            MotorCareHaptics.triggerLight();
            return true;
        }

        // 2. قائمة النوافذ المنبثقة الشائعة بالترتيب العكسي (الأعلى أولوية للأحدث)
        const commonModalIds = [
            'imageViewerModal',
            'customConfirmModal',
            'confirmModal',
            'recordModal',
            'fuelModal',
            'addCustomPMModal',
            'editCatalogItemModal',
            'editCarModal',
            'addNewCarModal',
            'batteryCatalogModal',
            'batteryModal',
            'tiresDetailModal',
            'trafficFinesModal',
            'documentsModal',
            'odometerModal',
            'inspectionModal',
            'obdEncyclopediaModal',
            'driverToolsModal',
            'serviceCentersModal',
            'locationCorrectionModal',
            'userCorrectionsHistoryModal',
            'maintWearExplainerModal',
            'googleSheetsModal',
            'customReportExportModal',
            'notificationsHubModal',
            'contactModal',
            'contactCommunityModal',
            'emergencyModal',
            'changePinModal',
            'adminPinModal',
            'subscribersAdminModal',
            'changeAvatarModal',
            'editProfileModal',
            'accountCenterModal',
            'emailVerificationModal',
            'forgotPasswordModal'
        ];

        for (const modalId of commonModalIds) {
            const modalEl = document.getElementById(modalId);
            if (modalEl && !modalEl.classList.contains('hidden') && modalEl.style.display !== 'none') {
                // محاولة استدعاء زر الإلغاء أو دالة الإغلاق المخصصة
                const closeBtn = modalEl.querySelector('button[onclick*="close"], button[onclick*="Close"], .close-modal-btn');
                if (closeBtn && typeof closeBtn.click === 'function') {
                    closeBtn.click();
                } else {
                    modalEl.classList.add('hidden');
                    modalEl.style.display = 'none';
                }
                MotorCareHaptics.triggerLight();
                return true;
            }
        }

        // 3. مسح عام لأي عنصر نافذة منبثقة نشطة في الـ DOM
        const genericModals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
        for (let i = genericModals.length - 1; i >= 0; i--) {
            const el = genericModals[i];
            // استثناء الشاشات الرئيسية الثابتة
            if (el.id === 'landingScreen' || el.id === 'mainAppContainer' || el.id === 'networkStatusBanner') {
                continue;
            }
            if (el.style.display !== 'none' && !el.classList.contains('hidden')) {
                const cancelBtn = el.querySelector('button[onclick*="close"], button[onclick*="Close"]');
                if (cancelBtn) {
                    cancelBtn.click();
                } else {
                    el.classList.add('hidden');
                    el.style.display = 'none';
                }
                MotorCareHaptics.triggerLight();
                return true;
            }
        }

        return false;
    }

    /**
     * التحقق مما إذا كان المستخدم في تبويب فرعي والعودة للرئيسية
     * Priority (b): Navigate from sub-tab to main dashboard
     */
    function navigateBackToDashboardTab() {
        try {
            // التحقق من التبويب الحالي
            const activeTab = (typeof window.currentActiveTab !== 'undefined') ? window.currentActiveTab : null;
            if (activeTab && activeTab !== 'dashboard') {
                if (typeof window.switchTab === 'function') {
                    window.switchTab('dashboard');
                    MotorCareHaptics.triggerLight();
                    return true;
                }
            }

            // فحص إضافي عبر التبويبات المرئية في الـ DOM
            const visibleTabs = document.querySelectorAll('.tab-view:not(.hidden-section)');
            for (const tab of visibleTabs) {
                if (tab.id && tab.id !== 'tabContent-dashboard' && tab.style.display !== 'none') {
                    if (typeof window.switchTab === 'function') {
                        window.switchTab('dashboard');
                        MotorCareHaptics.triggerLight();
                        return true;
                    }
                }
            }
        } catch (e) {
            console.warn('[MotorCare Mobile] Tab navigation notice:', e);
        }
        return false;
    }

    /**
     * خروج آمن بنقرتين متتاليتين مع إشعار فوري
     * Priority (c): Double-tap within 2 seconds to exit app
     */
    function handleAppExitDoubleTap(AppPlugin) {
        const now = Date.now();
        if (now - lastBackPressTime < DOUBLE_TAP_EXIT_DELAY_MS) {
            // الخروج من التطبيق فعلياً
            MotorCareHaptics.triggerLight();
            if (AppPlugin && typeof AppPlugin.exitApp === 'function') {
                AppPlugin.exitApp();
            } else if (typeof navigator !== 'undefined' && navigator.app && typeof navigator.app.exitApp === 'function') {
                navigator.app.exitApp();
            }
        } else {
            lastBackPressTime = now;
            MotorCareHaptics.triggerLight();
            
            // إظهار توست سريع وأنيق للمستخدم
            const isEn = (typeof window.appState !== 'undefined' && window.appState.lang === 'en');
            const exitMsg = isEn ? 'Press back again to exit the app' : 'اضغط مرة أخرى للخروج من التطبيق';
            
            if (typeof window.showNotification === 'function') {
                window.showNotification(exitMsg, 'info');
            } else {
                showQuickExitToast(exitMsg);
            }
        }
    }

    /**
     * نافذة توست مصغرة وسريعة للخروج في حال عدم توفر دالة الإشعارات
     */
    function showQuickExitToast(msg) {
        let toast = document.getElementById('motorcareExitToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'motorcareExitToast';
            toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-2xl shadow-xl border border-slate-700 pointer-events-none transition-all duration-300 opacity-0 transform translate-y-3';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.remove('opacity-0', 'translate-y-3');
        toast.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            if (toast) {
                toast.classList.remove('opacity-100', 'translate-y-0');
                toast.classList.add('opacity-0', 'translate-y-3');
            }
        }, 1800);
    }

    /**
     * منسق معالجة زر الرجوع الفيزيائي الموحد (Back Button Dispatcher)
     */
    function handleHardwareBackButton(canGoBack, AppPlugin) {
        // أ. إذا كانت هناك نافذة منبثقة أو درج مفتوح -> إغلاقه أولاً
        if (closeTopmostModalOrDrawer()) {
            return;
        }

        // ب. إذا كان المستخدم في تبويب فرعي -> العودة للوحة القيادة
        if (navigateBackToDashboardTab()) {
            return;
        }

        // ج. في لوحة القيادة بدون نوافذ -> الضغط مرتين خلال ثانيتين للخروج
        handleAppExitDoubleTap(AppPlugin);
    }

    // ============================================================================
    // 4. تهيئة البيئة والربط التلقائي (Initialization & Binding)
    // ============================================================================
    function initMobileService() {
        const AppPlugin = getCapacitorPlugin('App');

        // تسجيل مستمع زر الرجوع في بيئة Capacitor
        if (AppPlugin && typeof AppPlugin.addListener === 'function') {
            try {
                AppPlugin.addListener('backButton', ({ canGoBack }) => {
                    handleHardwareBackButton(canGoBack, AppPlugin);
                });
                console.log('[MotorCare Mobile] Capacitor hardware backButton listener registered successfully.');
            } catch (e) {
                console.warn('[MotorCare Mobile] Error attaching App.backButton listener:', e);
            }
        }

        // تسجيل مستمع زر الرجوع في بيئة Cordova / PWA / Android WebView المباشرة
        if (typeof document !== 'undefined') {
            document.addEventListener('backbutton', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                handleHardwareBackButton(false, AppPlugin);
            }, false);
        }

        // ربط الاهتزازات الخفيفة على أزرار التفاعل الرئيسية تلقائياً (Delegated Haptics)
        if (typeof document !== 'undefined') {
            document.addEventListener('click', (event) => {
                const target = event.target ? event.target.closest('button, .mobile-nav-btn, .side-tab-btn, [data-haptic="light"]') : null;
                if (target) {
                    MotorCareHaptics.triggerLight();
                }
            }, { passive: true });
        }

        // فحص وتحديث متغيرات Safe Area في حال تشغيل التطبيق في بيئة أصلية
        applySafeAreaInsets();
    }

    /**
     * تطبيق وضبط فئات Safe Area Inset لضمان عدم تداخل الهيدر أو شريط التنقل مع شريط إيماءات أندرويد
     */
    function applySafeAreaInsets() {
        try {
            if (typeof document !== 'undefined' && document.documentElement) {
                if (isNativePlatform()) {
                    document.documentElement.classList.add('capacitor-native-platform');
                } else {
                    document.documentElement.classList.add('web-platform');
                }
            }
        } catch (e) {}
    }

    // تشغيل التهيئة فور تحميل الصفحة
    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMobileService);
        } else {
            initMobileService();
        }
    }

    // ============================================================================
    // 5. التصدير للنطاق العام (Safe Global Export)
    // ============================================================================
    const MotorCareMobile = {
        isNativePlatform,
        haptics: MotorCareHaptics,
        triggerLightHaptic: MotorCareHaptics.triggerLight,
        triggerSuccessHaptic: MotorCareHaptics.triggerSuccess,
        triggerWarningHaptic: MotorCareHaptics.triggerWarning,
        handleHardwareBackButton,
        closeTopmostModalOrDrawer,
        navigateBackToDashboardTab
    };

    try {
        if (typeof window !== 'undefined') {
            window.MotorCareMobile = MotorCareMobile;
            window.MotorCareHaptics = MotorCareHaptics;
        }
    } catch (e) {}

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
