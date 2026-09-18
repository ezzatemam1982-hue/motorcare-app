// MotorCare Service Worker v2.0.7
// توفير الدعم الكامل للعمل دون اتصال بالإنترنت (Offline Mode) وتجربة PWA متكاملة
// نظام إشعارات الموبايل لمواعيد الصيانة الدورية والطارئة (Mobile Push & Local Notifications)
// استراتيجية التخزين: Cache First, then Network لملفات الواجهة الثابتة لضمان الفتح الفوري بدون إنترنت

const CACHE_NAME = 'motorcare-cache-v2.0.7';

// 1. قائمة الأصول الثابتة الأساسية للتطبيق (Core Static Assets)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './obd_codes.json',
  './obd_codes.js',
  './car_database.json',
  './carData.js',
  './service_centers.json',
  './service_centers.js',
  './manifest.json',
  './icon.png',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './ss-1.png',
  './ss-2.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js'
];

// 2. حدث التثبيت (install): تخزين جميع الأصول استباقياً (Pre-cache) في Cache Storage
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[MotorCare SW] Pre-caching core application assets...');
      const cachePromises = PRECACHE_ASSETS.map(async (asset) => {
        try {
          const response = await fetch(asset, { mode: asset.startsWith('http') ? 'cors' : 'same-origin' });
          if (response && (response.ok || response.type === 'opaque')) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn('[MotorCare SW] Pre-cache item skipped/offline:', asset, err.message);
        }
      });
      await Promise.allSettled(cachePromises);
    }).then(() => {
      console.log('[MotorCare SW] Pre-caching complete. Activating immediately.');
      return self.skipWaiting();
    })
  );
});

// 3. حدث التنشيط (activate): تنظيف وحذف أي كاش قديم لتحديث التطبيق تلقائياً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[MotorCare SW] Deleting obsolete cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[MotorCare SW] Claiming clients for instant offline control.');
      return self.clients.claim();
    })
  );
});

// 4. حدث الجلب (fetch): استراتيجية "Cache First, then Network" لملفات الواجهة الثابتة
self.addEventListener('fetch', (event) => {
  // تجاهل أي طلبات ليست GET (مثل إرسال نماذج POST للـ Webhook)
  if (event.request.method !== 'GET') return;

  // تجاهل بروتوكولات المتصفح مثل chrome-extension
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // استثناء الطلبات الديناميكية الخاصة بـ Webhook أو المصادقة أو Firestore لتمريرها مباشرة للشبكة
  const isDynamicApi = url.hostname.includes('script.google.com') ||
                       url.hostname.includes('googleapis.com') ||
                       url.hostname.includes('firebaseio.com') ||
                       url.hostname.includes('facebook.com') ||
                       url.pathname.includes('/exec');

  if (isDynamicApi) {
    // شبكة فقط للطلبات الديناميكية والـ Webhooks وقاعدة بيانات Firestore
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // استراتيجية Cache First, then Network لكافة الأصول الثابتة وصفحات الواجهة
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // إذا كان الملف مخزناً بالفعل في الكاش: إرجاعه فوراً وبشكل لحظي (0ms)
      if (cachedResponse) {
        // تحديث الكاش في الخلفية عند توفر اتصال (Background Revalidation)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {
          // جهاز العميل في وضع عدم الاتصال - لا مشكلة الكاش يخدم الطلب
        });
        return cachedResponse;
      }

      // إذا لم يكن في الكاش: جلبه من الشبكة وحفظ نسخة منه في الكاش
      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          // في حال انقطاع النت تماماً وعدم توفر الملف:
          // إذا كان الطلب تنقلياً (Navigation HTML)، يتم إرجاع صفحة التطبيق الرئيسية المخزنة محلياً
          if (event.request.mode === 'navigate' || event.request.destination === 'document') {
            return caches.match('./index.html') || caches.match('./');
          }
          return new Response('Offline resource unavailable', {
            status: 503,
            statusText: 'Service Unavailable (Offline)'
          });
        });
    })
  );
});

// 5. حدث استقبال الإشعارات الفورية للموبايل (Push Notifications)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'MotorCare', body: event.data ? event.data.text() : 'تنبيه صيانة من MotorCare' };
  }
  const title = data.title || '⚠️ تنبيه صيانة من MotorCare';
  const options = {
    body: data.body || 'لديك موعد صيانة مستحق لسيارتك. تفقد جدول الصيانة الآن وسجل الإنجاز!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'motorcare-maintenance-alert',
    renotify: true,
    data: {
      url: data.url || './?tab=maintenance',
      tab: 'maintenance',
      partId: data.partId || ''
    },
    actions: [
      { action: 'open_maintenance', title: 'سجل الصيانة الآن 🛠️' },
      { action: 'snooze', title: 'تأجيل 24 ساعة ⏰' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. حدث النقر على إشعار الموبايل (Notification Click Handling & Direct Deep-Linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const action = event.action;
  const partId = notifData.partId || '';

  if (action === 'snooze') {
    // إرسال أمر تأجيل الإشعار إلى صفحات التطبيق المفتوحة
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((c) => {
          c.postMessage({ type: 'MOTORCARE_SNOOZE_NOTIFICATION', partId: partId });
        });
      })
    );
    return;
  }

  // فتح التطبيق وتوجيهه مباشرة لتبويب الصيانة وبند الصيانة المحدد
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'MOTORCARE_NAVIGATE',
            tab: 'maintenance',
            partId: partId
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        const targetUrl = './?tab=maintenance' + (partId ? '&partId=' + encodeURIComponent(partId) : '');
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 7. استقبال رسائل العميل (Message Event for Local Notifications Trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_MAINTENANCE_NOTIFICATION') {
    const payload = event.data.payload || {};
    const title = payload.title || '⚠️ تنبيه صيانة من MotorCare';
    const options = {
      body: payload.body || 'لديك موعد صيانة مستحق لسيارتك.',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      tag: payload.tag || ('pm_' + (payload.partId || 'alert')),
      renotify: true,
      data: payload.data || { tab: 'maintenance', partId: payload.partId || '' },
      actions: [
        { action: 'open_maintenance', title: 'سجل الصيانة الآن 🛠️' },
        { action: 'snooze', title: 'تأجيل 24 ساعة ⏰' }
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
