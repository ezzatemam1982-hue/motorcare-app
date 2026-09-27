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
            'legalModal',
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

            // معالجة استعادة نتائج الكاميرا عند إعادة بناء الـ Activity في أندرويد تحت ضغط الذاكرة
            try {
                AppPlugin.addListener('appRestoredResult', (result) => {
                    console.log('[MotorCare Mobile] Received appRestoredResult event:', result?.pluginId);
                    if (result && result.pluginId === 'Camera' && result.data) {
                        handleRestoredCameraResult(result.data);
                    }
                });
                console.log('[MotorCare Mobile] Capacitor appRestoredResult listener registered successfully.');
            } catch (e) {
                console.warn('[MotorCare Mobile] Error attaching App.appRestoredResult listener:', e);
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
    // 5. خدمات التصدير والطباعة المتوافقة مع الموبايل والويب (Mobile File Export & Print)
    // ============================================================================
    // 5. تصدير التقارير وسجلات الكراج وحفظها في التنزيلات أو مشاركتها (Export & Save Files)
    // ============================================================================
    async function exportDataFile({ filename, data, mimeType = 'text/csv;charset=utf-8;', title = 'تصدير MotorCare', forceShare = false }) {
        const isNative = isNativePlatform();
        let dataToWrite = data;
        if (data instanceof Blob) {
            dataToWrite = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsText(data);
            });
        }

        if (isNative) {
            // حفظ مباشر في مجلد التنزيلات العام للهاتف (Downloads/MotorCare) في حال لم يُطلب فرض قائمة المشاركة
            if (!forceShare) {
                const NativeSettings = getCapacitorPlugin('NativeSettings');
                if (NativeSettings && typeof NativeSettings.saveToDownloads === 'function') {
                    try {
                        const res = await NativeSettings.saveToDownloads({
                            filename: filename,
                            content: dataToWrite,
                            mimeType: mimeType
                        });
                        const savedPath = res && res.path ? res.path : `Downloads/MotorCare/${filename}`;
                        MotorCareHaptics.triggerSuccess();
                        const isEn = (typeof window.appState !== 'undefined' && window.appState.lang === 'en');
                        const msg = isEn
                            ? `File saved successfully to Downloads:\n${savedPath}`
                            : `تم حفظ الملف بنجاح في مجلد التنزيلات:\n${savedPath}`;
                        if (typeof window.showNotification === 'function') {
                            window.showNotification(msg, 'success');
                        } else {
                            alert(msg);
                        }
                        return { success: true, native: true, path: savedPath };
                    } catch (err) {
                        console.warn('[MotorCare Mobile] Native saveToDownloads error, falling back to Filesystem:', err);
                    }
                }

                // بديل حفظ المستندات عبر Capacitor Filesystem (DOCUMENTS)
                try {
                    const Filesystem = getCapacitorPlugin('Filesystem');
                    if (Filesystem && typeof Filesystem.writeFile === 'function') {
                        const writeRes = await Filesystem.writeFile({
                            path: filename,
                            data: dataToWrite,
                            directory: 'DOCUMENTS',
                            encoding: 'utf8'
                        });
                        MotorCareHaptics.triggerSuccess();
                        const isEn = (typeof window.appState !== 'undefined' && window.appState.lang === 'en');
                        const msg = isEn
                            ? `Backup saved to Documents folder:\n${filename}`
                            : `تم حفظ ملف النسخة الاحتياطية في مجلد المستندات:\n${filename}`;
                        if (typeof window.showNotification === 'function') {
                            window.showNotification(msg, 'success');
                        } else {
                            alert(msg);
                        }
                        return { success: true, native: true, uri: writeRes.uri };
                    }
                } catch (fsErr) {
                    console.warn('[MotorCare Mobile] Filesystem Documents write error:', fsErr);
                }
            }

            // مشاركة الملف عبر قائمة المشاركة الرسمية (عند طلب المشاركة المباشرة أو للتقارير)
            try {
                const Filesystem = getCapacitorPlugin('Filesystem');
                const Share = getCapacitorPlugin('Share');
                if (Filesystem && typeof Filesystem.writeFile === 'function') {
                    const writeRes = await Filesystem.writeFile({
                        path: filename,
                        data: dataToWrite,
                        directory: 'CACHE',
                        encoding: 'utf8'
                    });

                    if (Share && typeof Share.share === 'function') {
                        await Share.share({
                            title: title,
                            text: `ملف ${filename} من تطبيق MotorCare`,
                            url: writeRes.uri,
                            dialogTitle: title
                        });
                        MotorCareHaptics.triggerSuccess();
                        return { success: true, native: true, uri: writeRes.uri };
                    }
                }
            } catch (err) {
                console.warn('[MotorCare Mobile] Native share error, falling back to web download:', err);
            }
        }

        // Web / Fallback browser download
        try {
            const blob = (data instanceof Blob) ? data : new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                try {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch(e) {}
            }, 600);
            MotorCareHaptics.triggerSuccess();
            return { success: true, native: false };
        } catch (e) {
            console.error('[MotorCare Mobile] Export file error:', e);
            if (typeof window.showNotification === 'function') {
                window.showNotification('تعذر تصدير الملف: ' + e.message, 'error');
            }
            return { success: false, error: e.message };
        }
    }

    async function printReportSection(sectionId, title = 'تقرير الصيانة') {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const isEn = (typeof window.appState !== 'undefined' && window.appState.lang === 'en');
        const processedInnerHtml = section.innerHTML
            .replace(/src=["'](\.?\/)?(logo[^"']*|Reports_And_App_Headers\.png)["']/gi, 'src="https://i.ibb.co/Rp9WSwxY/ic-launcher-background.png" crossorigin="anonymous" style="width: 140px; height: auto; max-height: 60px; object-fit: contain;"')
            .replace(/(<img\s+[^>]*class=["'][^"']*brand-logo-report[^"']*["'][^>]*)(>)/gi, (match, p1, p2) => {
                if (!p1.includes('crossorigin')) {
                    p1 += ' crossorigin="anonymous"';
                }
                return p1 + p2;
            });

        // Ensure the source section on the page is immediately hidden and deactivated
        try {
            section.classList.add('hidden');
            section.classList.remove('active-print-target');
            section.style.setProperty('display', 'none', 'important');
        } catch (e) {}

        const html = `<!DOCTYPE html>
<html dir="${isEn ? 'ltr' : 'rtl'}" lang="${isEn ? 'en' : 'ar'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', system-ui, -apple-system, sans-serif; padding: 20px; color: #0f172a; background: #ffffff; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1, h2, h3 { color: #0f172a; margin-bottom: 6px; font-weight: 800; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 14px; font-size: 11px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: ${isEn ? 'left' : 'right'}; }
  th { background: #0f172a !important; color: #ffffff !important; font-weight: 700; }
  tbody tr:nth-child(even) { background-color: #f8fafc; }
  tbody tr:nth-child(odd) { background-color: #ffffff; }
  .grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  .grid > div { flex: 1; min-width: 130px; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; }
  img { max-height: 60px; width: auto; object-fit: contain; }
  .brand-logo-report, img.brand-logo-report { width: 140px !important; height: auto !important; max-height: 60px !important; object-fit: contain !important; display: block; }
  @media print {
    body { padding: 0; }
    @page { size: A4 portrait; margin: 12mm 15mm; }
  }
</style>
</head>
<body>
  ${processedInnerHtml}
</body>
</html>`;

        const isNative = isNativePlatform();
        if (isNative) {
            // 1. استدعاء Android PrintManager الأصلي مباشرة (طباعة حقيقية + خيار الحفظ كـ PDF رسمي)
            const NativeSettings = getCapacitorPlugin('NativeSettings');
            if (NativeSettings && typeof NativeSettings.printHtml === 'function') {
                try {
                    await NativeSettings.printHtml({
                        html: html,
                        jobName: title
                    });
                    MotorCareHaptics.triggerSuccess();
                    return;
                } catch (e) {
                    console.warn('[MotorCare Mobile] Native printHtml failed, fallback to save & share:', e);
                }
            }

            // 2. بديل آمن: حفظ التقرير كملف HTML مستقل ومشاركته عبر قائمة مشاركة أندرويد
            try {
                await exportDataFile({
                    filename: `MotorCare_Report_${Date.now()}.html`,
                    data: html,
                    mimeType: 'text/html;charset=utf-8;',
                    title: title,
                    forceShare: true
                });
                MotorCareHaptics.triggerSuccess();
                return;
            } catch(err) {
                console.warn('[MotorCare Mobile] Native print fallback export notice:', err);
            }
            return;
        }

        // على المتصفحات المكتبية العادية: استخدام Iframe مخصص معزول مع نسخ ملفات الـ CSS والتصميم لضمان عدم ظهور صفحة بيضاء
        try {
            let printIframe = document.getElementById('motorcare-print-frame');
            if (printIframe) {
                try { printIframe.remove(); } catch (e) {}
            }
            printIframe = document.createElement('iframe');
            printIframe.id = 'motorcare-print-frame';
            printIframe.style.position = 'fixed';
            printIframe.style.right = '0';
            printIframe.style.bottom = '0';
            printIframe.style.width = '1px';
            printIframe.style.height = '1px';
            printIframe.style.border = 'none';
            printIframe.style.opacity = '0.01';
            printIframe.style.pointerEvents = 'none';
            printIframe.style.zIndex = '-9999';
            document.body.appendChild(printIframe);

            const frameDoc = printIframe.contentDocument || printIframe.contentWindow.document;
            frameDoc.open();

            // نسخ كامل وسوم الـ Stylesheet والـ Style والخطوط من الصفحة الرئيسية
            let headStyles = '';
            document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
                headStyles += node.outerHTML + '\n';
            });

            frameDoc.write(`<!DOCTYPE html>
<html dir="${isEn ? 'ltr' : 'rtl'}" lang="${isEn ? 'en' : 'ar'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${headStyles}
<style>
  body {
    background: #ffffff !important;
    color: #0f172a !important;
    padding: 16px !important;
    margin: 0 !important;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
  }
  .hidden { display: block !important; visibility: visible !important; }
  img { max-height: 60px; width: auto; object-fit: contain; }
  .brand-logo-report, img.brand-logo-report { width: 140px !important; height: auto !important; max-height: 60px !important; object-fit: contain !important; display: block; }
  @page { size: A4 portrait; margin: 10mm; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  .print-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body class="bg-white text-slate-900 in-print-iframe">
  <div class="printable-report active-print-target" style="display: block !important; visibility: visible !important; width: 100%;">
    ${processedInnerHtml}
  </div>
</body>
</html>`);
            frameDoc.close();

            const triggerPrint = () => {
                try {
                    printIframe.contentWindow.focus();
                    printIframe.contentWindow.print();
                } catch (iframeErr) {
                    console.warn('[MotorCare Mobile] Iframe print error, falling back to window.print():', iframeErr);
                    window.print();
                } finally {
                    try {
                        section.classList.add('hidden');
                        section.classList.remove('active-print-target');
                        section.style.setProperty('display', 'none', 'important');
                    } catch (e) {}
                }
            };

            const images = frameDoc.images;
            if (images && images.length > 0) {
                let loadedCount = 0;
                let done = false;
                const onImgDone = () => {
                    loadedCount++;
                    if (!done && loadedCount >= images.length) {
                        done = true;
                        setTimeout(triggerPrint, 100);
                    }
                };
                for (let i = 0; i < images.length; i++) {
                    if (images[i].complete) {
                        onImgDone();
                    } else {
                        images[i].onload = onImgDone;
                        images[i].onerror = onImgDone;
                    }
                }
                setTimeout(() => {
                    if (!done) {
                        done = true;
                        triggerPrint();
                    }
                }, 600);
            } else {
                setTimeout(triggerPrint, 250);
            }
            return;
        } catch (err) {
            console.warn('[MotorCare Mobile] Print iframe creation error, falling back to window.print():', err);
            setTimeout(() => {
                window.print();
            }, 250);
        }
    }

    // ============================================================================
    // 6. التقاط وإرفاق المستندات والفواتير عبر الكاميرا والمعرض (Action Sheet Camera/Gallery)
    // ============================================================================
    async function captureOrPickImage(targetKey) {
        MotorCareHaptics.triggerLight();
        const isNative = isNativePlatform();
        const Camera = getCapacitorPlugin('Camera');

        if (isNative && Camera && typeof Camera.getPhoto === 'function') {
            try {
                const photo = await Camera.getPhoto({
                    quality: 75,
                    allowEditing: false,
                    resultType: 'dataUrl',
                    source: 'PROMPT', // Shows Android native Action Sheet: Camera vs Photos
                    width: 1200,
                    correctOrientation: true,
                    promptLabelHeader: 'إرفاق المستند / الفاتورة',
                    promptLabelCancel: 'إلغاء',
                    promptLabelPhoto: 'من ألبوم الصور / المعرض',
                    promptLabelPicture: 'التقاط صورة بالكاميرا الآن'
                });

                const dataUrl = photo.dataUrl || (photo.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null);
                if (dataUrl) {
                    if (typeof window.tempImages === 'undefined') window.tempImages = {};
                    window.tempImages[targetKey] = dataUrl;
                    MotorCareHaptics.triggerSuccess();
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('تم التقاط وضغط المستند/الفاتورة بنجاح! 📸', 'success');
                    }
                    updateAttachmentBadge(targetKey, true);
                    return dataUrl;
                }
            } catch (err) {
                if (err && (String(err.message || '').includes('User cancelled') || String(err.message || '').includes('cancelled'))) {
                    return null;
                }
                console.warn('[MotorCare Mobile] Camera.getPhoto notice, using web fallback:', err);
            }
        }

        // Web fallback
        triggerWebImageFallback(targetKey);
    }

    function triggerWebImageFallback(targetKey) {
        let input = document.getElementById(`dynamicFileInput_${targetKey}`);
        if (!input) {
            input = document.createElement('input');
            input.id = `dynamicFileInput_${targetKey}`;
            input.type = 'file';
            input.accept = 'image/*';
            input.className = 'hidden';
            input.onchange = async function() {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    try {
                        let compressed;
                        if (typeof window.compressAndResizeImage === 'function') {
                            compressed = await window.compressAndResizeImage(file, 1200, 0.75);
                        } else {
                            compressed = await new Promise((res, rej) => {
                                const r = new FileReader();
                                r.onload = () => res(r.result);
                                r.onerror = rej;
                                r.readAsDataURL(file);
                            });
                        }
                        if (typeof window.tempImages === 'undefined') window.tempImages = {};
                        window.tempImages[targetKey] = compressed;
                        MotorCareHaptics.triggerSuccess();
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('تم ضغط وإرفاق الفاتورة/المستند بنجاح! 📸', 'success');
                        }
                        updateAttachmentBadge(targetKey, true);
                    } catch(e) {
                        console.error('Image compression error:', e);
                    }
                }
            };
            document.body.appendChild(input);
        }
        input.click();
    }

    const ACTION_SHEET_CONTEXTS = {
        fuel: {
            titleAr: 'إرفاق إيصال / فاتورة الوقود',
            titleEn: 'Attach Fuel Receipt',
            subAr: 'التقط صورة لإيصال المحطة أو اخترها من المعرض',
            subEn: 'Snap station receipt or select from gallery',
            successAr: 'تم إرفاق إيصال الوقود بنجاح! 📸',
            successEn: 'Fuel receipt attached successfully! 📸'
        },
        invoice: {
            titleAr: 'إرفاق فاتورة الصيانة الورقية',
            titleEn: 'Attach Maintenance Invoice',
            subAr: 'التقط صورة لفاتورة الورشة وقطع الغيار',
            subEn: 'Snap workshop invoice or parts bill',
            successAr: 'تم إرفاق فاتورة الصيانة بنجاح! 📸',
            successEn: 'Maintenance invoice attached successfully! 📸'
        },
        doc_vehicle: {
            titleAr: 'إرفاق صورة رخصة السيارة',
            titleEn: 'Attach Vehicle License',
            subAr: 'التقط صورة رخصة تسيير المركبة بوضوح',
            subEn: 'Snap clear photo of vehicle registration card',
            successAr: 'تم إرفاق رخصة السيارة بنجاح! 📸',
            successEn: 'Vehicle license attached successfully! 📸'
        },
        doc_driver: {
            titleAr: 'إرفاق صورة رخصة القيادة',
            titleEn: 'Attach Driver License',
            subAr: 'التقط صورة بطاقة رخصة القيادة الشخصية',
            subEn: 'Snap clear photo of driver license',
            successAr: 'تم إرفاق رخصة القيادة بنجاح! 📸',
            successEn: 'Driver license attached successfully! 📸'
        },
        doc_insp: {
            titleAr: 'إرفاق شهادة الفحص الفني',
            titleEn: 'Attach Technical Inspection Certificate',
            subAr: 'التقط صورة شهادة الفحص الفني من المرور',
            subEn: 'Snap technical inspection certificate',
            successAr: 'تم إرفاق شهادة الفحص الفني بنجاح! 📸',
            successEn: 'Inspection certificate attached successfully! 📸'
        },
        doc_insurance: {
            titleAr: 'إرفاق وثيقة / كارت التأمين',
            titleEn: 'Attach Insurance Policy / Card',
            subAr: 'التقط صورة كارت التأمين الإجباري أو الشامل',
            subEn: 'Snap insurance policy or card',
            successAr: 'تم إرفاق وثيقة التأمين بنجاح! 📸',
            successEn: 'Insurance card attached successfully! 📸'
        },
        car_photo: {
            titleAr: 'إرفاق صورة المركبة / المستندات',
            titleEn: 'Attach Vehicle Photo / Docs',
            subAr: 'التقط صورة لسيارتك لإظهارها في الكراج',
            subEn: 'Snap car photo to display in garage',
            successAr: 'تم إرفاق صورة السيارة بنجاح! 📸',
            successEn: 'Vehicle photo attached successfully! 📸'
        },
        edit_car_photo: {
            titleAr: 'إرفاق / تغيير صورة السيارة أو مستنداتها',
            titleEn: 'Attach / Change Vehicle Photo',
            subAr: 'التقط صورة لسيارتك لتحديثها في الكراج',
            subEn: 'Snap car photo to update in garage',
            successAr: 'تم تحديث صورة السيارة بنجاح! 📸',
            successEn: 'Vehicle photo updated successfully! 📸'
        },
        inspection: {
            titleAr: 'إرفاق تقرير الفحص الفني الشامل',
            titleEn: 'Attach Inspection Checklist Report',
            subAr: 'التقط صورة لتقرير أو فحص الأنظمة الحيوية',
            subEn: 'Snap inspection test report or findings',
            successAr: 'تم إرفاق تقرير الفحص الفني بنجاح! 📸',
            successEn: 'Inspection report attached successfully! 📸'
        },
        battery: {
            titleAr: 'إرفاق شهادة ضمان البطارية',
            titleEn: 'Attach Battery Warranty Certificate',
            subAr: 'التقط صورة لشهادة الضمان أو فاتورة البطارية',
            subEn: 'Snap battery warranty certificate or invoice',
            successAr: 'تم إرفاق شهادة ضمان البطارية بنجاح! 📸',
            successEn: 'Battery warranty attached successfully! 📸'
        },
        tires: {
            titleAr: 'إرفاق فاتورة / ضمان الإطارات',
            titleEn: 'Attach Tire Invoice / Warranty',
            subAr: 'التقط صورة لفاتورة شراء الكاوتش وتاريخ الصنع',
            subEn: 'Snap tire purchase invoice or warranty',
            successAr: 'تم إرفاق فاتورة الإطارات بنجاح! 📸',
            successEn: 'Tire invoice attached successfully! 📸'
        }
    };

    function updateAttachmentBadge(targetKey, isAttached) {
        const badgeIds = [
            `${targetKey}BadgeAttached`,
            `${targetKey}AttachmentIndicator`,
            `${targetKey}ReceiptBadge`,
            'invoiceAttachmentIndicator',
            'fuelReceiptBadge',
            'inspectionAttachmentIndicator'
        ];
        badgeIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (isAttached) el.classList.remove('hidden');
                else el.classList.add('hidden');
            }
        });
    }

    function updateAttachmentUI(targetKey, imageSrc) {
        if (!targetKey) return;
        const isAttached = Boolean(imageSrc);

        const thumbEl = document.getElementById(`${targetKey}ImagePreviewThumb`);
        if (thumbEl) {
            thumbEl.src = isAttached ? imageSrc : '';
        }

        const boxEl = document.getElementById(`${targetKey}ImagePreviewBox`);
        if (boxEl) {
            if (isAttached) {
                boxEl.classList.remove('hidden');
                boxEl.style.display = 'flex';
            } else {
                boxEl.classList.add('hidden');
                boxEl.style.display = 'none';
            }
        }

        updateAttachmentBadge(targetKey, isAttached);
    }

    function clearAttachedImage(targetKey) {
        if (!targetKey) return;
        if (typeof window.tempImages === 'undefined') window.tempImages = {};
        window.tempImages[targetKey] = '';
        if (typeof tempImages !== 'undefined') tempImages[targetKey] = '';

        if (targetKey === 'fuel' && typeof window.clearFuelImageAttached === 'function') {
            window.clearFuelImageAttached();
        }

        updateAttachmentUI(targetKey, null);
        MotorCareHaptics.triggerLight();

        const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
        if (typeof window.showNotification === 'function') {
            window.showNotification(isEn ? 'Attachment removed' : 'تم حذف المستند المرفق', 'info');
        }
    }

    let currentActionSheetTargetKey = 'invoice';

    function openImageAttachmentActionSheet(targetKey = 'invoice') {
        currentActionSheetTargetKey = targetKey;
        MotorCareHaptics.triggerLight();

        const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
        const ctx = ACTION_SHEET_CONTEXTS[targetKey] || {
            titleAr: 'إرفاق المستند / الفاتورة',
            titleEn: 'Attach Document / Invoice',
            subAr: 'اختر طريقة التقاط الصورة أو رفع المستند',
            subEn: 'Choose method to capture or upload document'
        };

        const titleEl = document.getElementById('actionSheetTitle');
        const subEl = document.getElementById('actionSheetSubtitle');
        if (titleEl) titleEl.innerText = isEn ? ctx.titleEn : ctx.titleAr;
        if (subEl) subEl.innerText = isEn ? ctx.subEn : ctx.subAr;

        const modal = document.getElementById('imageActionSheetModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        } else {
            captureOrPickImage(targetKey);
        }
    }

    function closeImageAttachmentActionSheet() {
        const modal = document.getElementById('imageActionSheetModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.removeProperty('display');
        }
    }

    function handleRestoredCameraResult(photo) {
        if (!photo) return;
        const base64Data = photo.dataUrl || (photo.base64String ? `data:image/${photo.format || 'jpeg'};base64,${photo.base64String}` : null);
        if (!base64Data) return;

        let targetKey = currentActionSheetTargetKey || 'invoice';
        try {
            const savedKey = sessionStorage.getItem('motorCare_cameraActiveTarget');
            if (savedKey) targetKey = savedKey;
        } catch (e) {}

        if (typeof window.tempImages === 'undefined') window.tempImages = {};
        window.tempImages[targetKey] = base64Data;
        if (typeof tempImages !== 'undefined') tempImages[targetKey] = base64Data;
        try { sessionStorage.setItem('motorCare_tempImage_' + targetKey, base64Data); } catch (e) {}

        try {
            const parentModalId = sessionStorage.getItem('motorCare_cameraParentModal');
            if (parentModalId) {
                const parentModal = document.getElementById(parentModalId);
                if (parentModal) {
                    parentModal.classList.remove('hidden');
                    parentModal.style.display = 'flex';
                }
            }
        } catch (e) {}

        updateAttachmentUI(targetKey, base64Data);
        MotorCareHaptics.triggerSuccess();
        const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
        const ctx = ACTION_SHEET_CONTEXTS[targetKey] || {};
        const successMsg = isEn ? (ctx.successEn || 'Attachment added successfully! 📸') : (ctx.successAr || 'تم إرفاق المستند بنجاح! 📸');
        if (typeof window.showNotification === 'function') {
            window.showNotification(successMsg, 'success');
        }
    }

    async function triggerActionSheetOption(option) {
        closeImageAttachmentActionSheet();
        if (option === 'cancel') return;

        // حفظ الحالة في sessionStorage قبل فتح الكاميرا الخارجية لحمايتها من الـ Activity Recreation
        try {
            sessionStorage.setItem('motorCare_cameraActiveTarget', currentActionSheetTargetKey);
            const openModals = Array.from(document.querySelectorAll('[id$="Modal"], [id$="ModalContainer"], .modal'))
                .filter(m => m.id !== 'imageActionSheetModal' && !m.classList.contains('hidden') && m.style.display !== 'none');
            if (openModals.length > 0) {
                sessionStorage.setItem('motorCare_cameraParentModal', openModals[openModals.length - 1].id);
            }
        } catch (e) {}

        const isNative = isNativePlatform();
        const Camera = getCapacitorPlugin('Camera');
        const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
        const ctx = ACTION_SHEET_CONTEXTS[currentActionSheetTargetKey] || {};
        const successMsg = isEn ? (ctx.successEn || 'Attachment added successfully! 📸') : (ctx.successAr || 'تم إرفاق المستند بنجاح! 📸');

        if (isNative && Camera && typeof Camera.getPhoto === 'function') {
            try {
                const source = (option === 'camera') ? 'CAMERA' : 'PHOTOS';
                const photo = await Camera.getPhoto({
                    quality: 80,
                    allowEditing: false,
                    resultType: 'base64',
                    source: source,
                    width: 1400,
                    correctOrientation: true
                });

                if (photo && (photo.base64String || photo.dataUrl)) {
                    const base64Data = photo.dataUrl || `data:image/${photo.format || 'jpeg'};base64,${photo.base64String}`;
                    if (typeof window.tempImages === 'undefined') window.tempImages = {};
                    window.tempImages[currentActionSheetTargetKey] = base64Data;
                    if (typeof tempImages !== 'undefined') tempImages[currentActionSheetTargetKey] = base64Data;

                    try {
                        sessionStorage.setItem('motorCare_tempImage_' + currentActionSheetTargetKey, base64Data);
                    } catch (e) {}

                    // إعادة تأكيد إظهار النافذة المنبثقة الحالية فوراً
                    try {
                        const parentModalId = sessionStorage.getItem('motorCare_cameraParentModal');
                        if (parentModalId) {
                            const parentEl = document.getElementById(parentModalId);
                            if (parentEl) {
                                parentEl.classList.remove('hidden');
                                parentEl.style.display = 'flex';
                            }
                        }
                    } catch (e) {}

                    MotorCareHaptics.triggerSuccess();
                    if (typeof window.showNotification === 'function') {
                        window.showNotification(successMsg, 'success');
                    }
                    updateAttachmentUI(currentActionSheetTargetKey, base64Data);
                }
            } catch (err) {
                console.warn('[MotorCare] Camera action cancelled or failed:', err);
            }
            return;
        }

        // Web fallback
        if (option === 'camera') {
            const camInput = document.getElementById('actionSheetCameraInput');
            if (camInput) camInput.click();
            else triggerWebImageFallback(currentActionSheetTargetKey);
        } else if (option === 'gallery') {
            const galInput = document.getElementById('actionSheetGalleryInput');
            if (galInput) galInput.click();
            else triggerWebImageFallback(currentActionSheetTargetKey);
        }
    }

    async function handleActionSheetFileInput(inputEl) {
        if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
        const file = inputEl.files[0];
        try {
            let compressed;
            if (typeof window.compressAndResizeImage === 'function') {
                compressed = await window.compressAndResizeImage(file, 1200, 0.75);
            } else {
                compressed = await new Promise((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
            }
            if (typeof window.tempImages === 'undefined') window.tempImages = {};
            window.tempImages[currentActionSheetTargetKey] = compressed;
            if (typeof tempImages !== 'undefined') tempImages[currentActionSheetTargetKey] = compressed;

            MotorCareHaptics.triggerSuccess();
            const isEn = (typeof appState !== 'undefined' && appState.lang === 'en');
            const ctx = ACTION_SHEET_CONTEXTS[currentActionSheetTargetKey] || {};
            const successMsg = isEn ? (ctx.successEn || 'Attachment added successfully! 📸') : (ctx.successAr || 'تم إرفاق المستند بنجاح! 📸');

            if (typeof window.showNotification === 'function') {
                window.showNotification(successMsg, 'success');
            }
            updateAttachmentUI(currentActionSheetTargetKey, compressed);
        } catch (e) {
            console.error('[MotorCare] Action sheet file input error:', e);
        }
        inputEl.value = '';
    }

    // ============================================================================
    // 7. إدارة سياسة الخصوصية والشروط وحذف البيانات (Legal Modal & Data Management)
    // ============================================================================
    function openLegalModal(activeTab = 'privacy') {
        const modal = document.getElementById('legalModal');
        if (!modal) return;
        const isEn = (typeof window.appState !== 'undefined' && window.appState.lang === 'en');
        modal.dir = isEn ? 'ltr' : 'rtl';
        if (typeof applyLanguageSettings === 'function') {
            applyLanguageSettings();
        }
        switchLegalTab(activeTab);
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        MotorCareHaptics.triggerLight();
    }

    function closeLegalModal() {
        const modal = document.getElementById('legalModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        MotorCareHaptics.triggerLight();
    }

    function switchLegalTab(tab) {
        const termsTab = document.getElementById('legalTabTerms');
        const privacyTab = document.getElementById('legalTabPrivacy');
        const termsContent = document.getElementById('legalContentTerms');
        const privacyContent = document.getElementById('legalContentPrivacy');

        if (tab === 'terms') {
            if (termsTab) {
                termsTab.className = 'flex-1 py-2 px-3 text-center text-xs font-bold rounded-xl bg-sky-500 text-white shadow-xs transition-all';
            }
            if (privacyTab) {
                privacyTab.className = 'flex-1 py-2 px-3 text-center text-xs font-bold rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all';
            }
            if (termsContent) termsContent.classList.remove('hidden');
            if (privacyContent) privacyContent.classList.add('hidden');
        } else {
            if (privacyTab) {
                privacyTab.className = 'flex-1 py-2 px-3 text-center text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs transition-all';
            }
            if (termsTab) {
                termsTab.className = 'flex-1 py-2 px-3 text-center text-xs font-bold rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all';
            }
            if (privacyContent) privacyContent.classList.remove('hidden');
            if (termsContent) termsContent.classList.add('hidden');
        }
    }

    async function requestDataDeletion() {
        const isEn = (typeof window.appState !== 'undefined' && window.appState.lang === 'en');
        const confirmMsg = isEn 
            ? 'Are you sure you want to permanently delete all your vehicles and service records from this device and the cloud? This action cannot be undone.'
            : 'هل أنت متأكد من رغبتك في حذف كافة بيانات سياراتك وسجلاتك نهائياً من هذا الجهاز والسحابة؟ هذا الإجراء لا يمكن التراجع عنه.';

        if (!confirm(confirmMsg)) return;

        MotorCareHaptics.triggerWarning();

        try {
            if (typeof window.db !== 'undefined' && window.db && typeof window.getCurrentUserIdentifier === 'function') {
                const uid = window.getCurrentUserIdentifier();
                if (uid && uid !== 'guest_user') {
                    try {
                        await window.db.collection('users').doc(uid).delete();
                    } catch(e) {}
                }
            }

            const keysToClear = [
                'motorCare_AppState_v140',
                'motorCare_cars',
                'motorCare_currentCarId',
                'motorCare_UserProfile',
                'motorCare_scUserCorrections',
                'motorCare_queued_dealership_reports',
                'motorCare_AuthUser'
            ];
            keysToClear.forEach(k => {
                try {
                    if (typeof window.SafeStorage !== 'undefined') window.SafeStorage.removeItem(k);
                    localStorage.removeItem(k);
                } catch(e) {}
            });

            closeLegalModal();

            if (typeof window.showNotification === 'function') {
                window.showNotification(
                    isEn ? 'All personal records and vehicle data have been wiped successfully.' : 'تم مسح كافة سجلاتك وبيانات سياراتك بنجاح وفقاً لمعايير الخصوصية.',
                    'success',
                    4500
                );
            }

            setTimeout(() => {
                window.location.reload();
            }, 1200);
        } catch (err) {
            console.error('[MotorCare Mobile] Data deletion error:', err);
            alert(isEn ? 'Failed to complete data deletion: ' + err.message : 'تعذر إتمام عملية مسح البيانات: ' + err.message);
        }
    }

    // ============================================================================
    // 8. التصدير للنطاق العام (Safe Global Export)
    // ============================================================================
    const MotorCareMobile = {
        isNativePlatform,
        haptics: MotorCareHaptics,
        triggerLightHaptic: MotorCareHaptics.triggerLight,
        triggerSuccessHaptic: MotorCareHaptics.triggerSuccess,
        triggerWarningHaptic: MotorCareHaptics.triggerWarning,
        handleHardwareBackButton,
        closeTopmostModalOrDrawer,
        navigateBackToDashboardTab,
        exportDataFile,
        printReportSection,
        captureOrPickImage,
        openLegalModal,
        closeLegalModal,
        switchLegalTab,
        requestDataDeletion,
        openImageAttachmentActionSheet,
        closeImageAttachmentActionSheet,
        triggerActionSheetOption,
        handleActionSheetFileInput,
        updateAttachmentUI,
        clearAttachedImage
    };

    // Automatically dismiss mobile drawer and top header dropdown menu whenever any modal is triggered or tab switched
    if (typeof document !== 'undefined') {
        document.addEventListener('click', function(e) {
            const trigger = e.target && e.target.closest ? e.target.closest('[onclick*="Modal"], [onclick*="open"], [onclick*="switchTab"], button, a') : null;
            if (trigger) {
                // If clicked from INSIDE the drawer or top menu, allow its own buttons and click listeners to execute normally
                if (trigger.closest('#mobileMoreDrawerModal') || trigger.closest('#topHeaderDropdownMenu')) {
                    return;
                }
                const oc = trigger.getAttribute('onclick') || '';
                if ((oc.includes('Modal(') && !oc.includes('MobileMoreDrawer') && !oc.includes('close')) || oc.includes('switchTab(')) {
                    if (typeof window.closeMobileMoreDrawer === 'function') {
                        try { window.closeMobileMoreDrawer(); } catch (err) {}
                    }
                    if (typeof window.closeTopHeaderMenu === 'function') {
                        try { window.closeTopHeaderMenu(); } catch (err) {}
                    }
                }
            }
        });
    }

    try {
        if (typeof window !== 'undefined') {
            window.MotorCareMobile = MotorCareMobile;
            window.MotorCareHaptics = MotorCareHaptics;
            window.exportDataFile = exportDataFile;
            window.printReportSection = printReportSection;
            window.captureOrPickImage = captureOrPickImage;
            window.openImageAttachmentActionSheet = openImageAttachmentActionSheet;
            window.closeImageAttachmentActionSheet = closeImageAttachmentActionSheet;
            window.triggerActionSheetOption = triggerActionSheetOption;
            window.handleActionSheetFileInput = handleActionSheetFileInput;
            window.updateAttachmentUI = updateAttachmentUI;
            window.clearAttachedImage = clearAttachedImage;
            window.openLegalModal = openLegalModal;
            window.closeLegalModal = closeLegalModal;
            window.switchLegalTab = switchLegalTab;
            window.requestDataDeletion = requestDataDeletion;
        }
    } catch (e) {}

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : null);
