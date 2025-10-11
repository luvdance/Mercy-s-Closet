// firebaseMessaging.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyA3tUEHVe_y8BQ_3_16YsKlokc10qDox-8",
  authDomain: "mercy-s-closet-ceo-app.firebaseapp.com",
  projectId: "mercy-s-closet-ceo-app",
  messagingSenderId: "102114420195",
  appId: "1:102114420195:web:af33297eab51e9c0032cd6"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BI-it6hJ5Sr7etbuil45wN5ioUQo5AA7uzfPi0BCSpoMP42NiqHRdGVhJEcobWJgDonCc0x-cuGDQH7gnWvuwhQ",
      });
      console.log("📱 Token generated:", token);
    } else {
      console.warn("🚫 Notification permission denied.");
    }
    return permission;
  } catch (err) {
    console.error("❌ Error getting permission or token:", err);
  }
}

// Listen for messages
onMessage(messaging, (payload) => {
  console.log("📩 Message received:", payload);
  alert(`${payload.notification.title}\n${payload.notification.body}`);
});
