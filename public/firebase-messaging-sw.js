// Import and configure Firebase
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js');

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config will be injected here during build
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have new updates',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
