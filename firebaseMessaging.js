// firebaseMessaging.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

// ✅ Your Firebase configuration (same as backend or project config)
const firebaseConfig = {
   apiKey: "AIzaSyA3tUEHVe_y8BQ_3_16YsKlokc10qDox-8",
    authDomain: "mercy-s-closet-ceo-app.firebaseapp.com",
    projectId: "mercy-s-closet-ceo-app",
    storageBucket: "mercy-s-closet-ceo-app.appspot.com",
    messagingSenderId: "102114420195",
    appId: "1:102114420195:web:af33297eab51e9c0032cd6"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ✅ Replace this with the exact key you got from the Firebase console (VAPID key)
const vapidKey = "BI-it6hJ5Sr7etbuil45wN5ioUQo5AA7uzfPi0BCSpoMP42NiqHRdGVhJEcobWJgDonCc0x-cuGDQH7gnWvuwhQ";

// ✅ Request permission for notifications
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("🔔 Notification permission granted.");

      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        console.log("✅ FCM Token:", currentToken);

        // Optional: Save this token to your database for later use
        localStorage.setItem("fcm_token", currentToken);
      } else {
        console.warn("⚠️ No FCM token available. Request permission again later.");
      }
    } else {
      console.warn("🚫 Notification permission denied.");
    }
  } catch (error) {
    console.error("❌ Error getting notification permission or token:", error);
  }
}

// ✅ Handle foreground messages
onMessage(messaging, (payload) => {
  console.log("📩 Message received in foreground:", payload);

  const { title, body, icon } = payload.notification || {};
  if (Notification.permission === "granted") {
    new Notification(title || "New Message", {
      body: body || "You’ve got a new notification!",
      icon: icon || "/icon.png"
    });
  }
});