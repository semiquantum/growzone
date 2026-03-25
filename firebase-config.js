import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyADJFBojy-ct0k9LMUEMpG3cHVdQeu74Bg",
  authDomain: "semiquantum-grow.firebaseapp.com",
  projectId: "semiquantum-grow",
  storageBucket: "semiquantum-grow.firebasestorage.app",
  messagingSenderId: "939210912143",
  appId: "1:939210912143:web:3e75b26be401d3aa57dbfa",
  measurementId: "G-ZVTQX6PT0L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

auth.useDeviceLanguage();

export { app, auth, googleProvider };
