// public/sw.js - Service Worker désactivé (ne fait rien)

// ===== INSTALLATION =====
self.addEventListener('install', function(e) {
  console.log('✅ Service Worker installé');
  self.skipWaiting();
});

// ===== ACTIVATION =====
self.addEventListener('activate', function(e) {
  console.log('✅ Service Worker activé');
  // Supprime tous les caches
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        console.log('🗑️ Cache supprimé:', key);
        return caches.delete(key);
      }));
    })
  );
});

// ===== RÉCUPÉRATION DES REQUÊTES =====
// On n'intercepte aucune requête - on laisse le navigateur gérer
self.addEventListener('fetch', function(e) {
  // Ne rien faire - laisser le navigateur gérer normalement
  return;
});

// ===== NOTIFICATIONS PUSH =====
self.addEventListener('push', function(event) {
  let data = {};
  
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'PERSEE',
      body: event.data.text() || 'Nouvelle notification'
    };
  }

  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/logo.png',
    badge: '/logo.png',
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
    tag: data.tag || 'persee-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PERSEE', options)
  );
});

// ===== CLIC SUR NOTIFICATION =====
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});