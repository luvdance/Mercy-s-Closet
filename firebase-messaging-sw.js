importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA3tUEHVe_y8BQ_3_16YsKlokc10qDox-8",
    authDomain: "mercy-s-closet-ceo-app.firebaseapp.com",
    projectId: "mercy-s-closet-ceo-app",
    storageBucket: "mercy-s-closet-ceo-app.appspot.com",
    messagingSenderId: "102114420195",
    appId: "1:102114420195:web:af33297eab51e9c0032cd6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📨 Background message received:", payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Message", {
    body: body || "You’ve got a new message!",
    icon: icon || "/icon.png"
  });
});

