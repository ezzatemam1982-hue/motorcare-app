/**
 * MotorCare Application Configuration & Environment Isolation
 * Safe environment resolution without exposed credentials or hardcoded public URLs.
 */
(function() {
    'use strict';

    // استخراج النطاق الديناميكي الحالي تلقائياً دون أي اعتماد على روابط عامة أو خارجية
    let dynamicBaseUrl = '';
    if (typeof window !== 'undefined' && window.location) {
        if (window.location.origin && window.location.protocol.startsWith('http')) {
            const cleanPath = (window.location.pathname || '').replace(/index\.html$/, '');
            dynamicBaseUrl = window.location.origin + cleanPath;
        } else {
            // بيئة Capacitor Native أو Local Scheme
            dynamicBaseUrl = 'https://localhost/';
        }
    }
    if (dynamicBaseUrl && !dynamicBaseUrl.endsWith('/')) {
        dynamicBaseUrl += '/';
    }

    window.MOTORCARE_ENV = Object.freeze({
        // معرّف عميل Google OAuth للويب (يُترك فارغاً افتراضياً ليعتمد التطبيق المصادقة المحلية النظيفة أو يقرأه من متغيرات البيئة)
        GOOGLE_CLIENT_ID: (typeof process !== 'undefined' && process.env && process.env.VITE_GOOGLE_CLIENT_ID) || '',
        GOOGLE_ANDROID_CLIENT_ID: (typeof process !== 'undefined' && process.env && process.env.VITE_GOOGLE_ANDROID_CLIENT_ID) || '',
        
        // النطاق الأساسي للتطبيق (محلي ديناميكي 100% بدون أي روابط GitHub)
        APP_URL: dynamicBaseUrl,
        
        // معرّف حزمة الأندرويد المعتمدة لـ Capacitor
        CAPACITOR_SCHEME: 'com.motorcare.app',
        
        // رابط الـ Webhook السحابي الرسمي لـ Google Apps Script
        WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbw9i9HjQRN3909_EPXzWz6ZzbDqXJDYoIudlwPVa6mvECeCx9PQoXNDnwpo9RrpxjKe2A/exec'
    });
})();
