// Service Worker for Background Push Notifications
// Major's requirement: "push up pop up on phones and really noticeable"

const CACHE_NAME = 'aicapital-sw-v1';
const NOTIFICATION_TITLE = 'AiCapital Alert';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated!');
  event.waitUntil(self.clients.claim());
});

// Push event - MAJOR'S CRITICAL REQUIREMENT
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received:', event);
  
  if (!event.data) {
    console.warn('⚠️ No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📊 Push data:', data);

    const options = {
      body: data.message || 'Stock alert triggered!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.notificationId || 'aicapital-alert',
      requireInteraction: data.priority === 'urgent' || data.priority === 'high',
      silent: data.priority === 'low',
      timestamp: Date.now(),
      data: {
        notificationId: data.notificationId,
        type: data.type,
        priority: data.priority,
        actionData: data.actionData,
        url: data.url || '/dashboard'
      },
      actions: [
        {
          action: 'view',
          title: 'View Portfolio',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    // Add vibration pattern based on priority - MAJOR'S VIBRATION REQUIREMENT
    if (data.priority === 'urgent') {
      options.vibrate = [200, 100, 200, 100, 200]; // URGENT: long buzzes
    } else if (data.priority === 'high') {
      options.vibrate = [200, 50, 200]; // HIGH: quick double buzz
    } else if (data.type === 'action' && data.actionData?.action === 'SELL') {
      options.vibrate = [300, 100, 300, 100, 300]; // SELL: urgent pattern
    } else if (data.type === 'watchlist') {
      options.vibrate = [100, 50, 100, 50, 100]; // WATCHLIST: triple buzz
    }

    event.waitUntil(
      self.registration.showNotification(data.title || NOTIFICATION_TITLE, options)
    );

  } catch (error) {
    console.error('❌ Error processing push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification(NOTIFICATION_TITLE, {
        body: 'Stock alert triggered!',
        icon: '/favicon.ico',
        vibrate: [200, 100, 200]
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/dashboard';

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click behavior
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const notifications = await response.json();
      console.log('📱 Synced notifications:', notifications);
    }
  } catch (error) {
    console.error('❌ Failed to sync notifications:', error);
  }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('💬 Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎯 AiCapital Service Worker loaded and ready!');
