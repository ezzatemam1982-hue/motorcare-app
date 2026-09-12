// MotorCare Service Worker v1.4.0
// يوفر الدعم الكامل للعمل دون اتصال (Offline Mode) ومتطلبات PWA Builder لتحويل التطبيق إلى APK

const CACHE_NAME = 'motorcare-cache-v1.4.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './ss-1.png',
  './ss-2.png'
];

// تثبيت السيرفيس وركر وتخزين الملفات الأساسية في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// تفعيل السيرفيس وركر وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات ودعم العمل بدون إنترنت (Offline Capability)
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير المتوافقة مع الكاش مثل chrome-extension
  if (!event.request.url.startsWith('http')) return;

  // بالنسبة لصفحات التنقل (Navigation requests): Network first ثم الرجوع للكاش
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match(event.request);
        })
    );
    return;
  }

  // لباقي الموارد (الصور والملفات الثابتة): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // في حال انقطاع النت وعدم وجود كاش
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
