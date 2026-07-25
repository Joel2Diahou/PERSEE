// public/sw.js
// Service Worker pour les notifications push

const CACHE_NAME = 'school-plus-ci-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/static/css/main.css',
          '/static/js/main.js'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestion des requêtes (cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// ============================================
// NOTIFICATIONS PUSH
// ============================================

self.addEventListener('push', function(event) {
  let data = {};
  
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'SCHOOL+ CI',
      body: event.data.text() || 'Nouvelle notification'
    };
  }

  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
      additionalData: data.data || {}
    },
    actions: [
      { action: 'open', title: '📖 Voir' },
      { action: 'close', title: '❌ Fermer' }
    ],
    requireInteraction: true,
    tag: data.tag || 'school-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SCHOOL+ CI', options)
  );
});

// ============================================
// CLIC SUR UNE NOTIFICATION
// ============================================

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Si une fenêtre est déjà ouverte, la focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});