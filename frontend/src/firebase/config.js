import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDiVMO4HMLu5UorhlxxvXMmbdhrj732Izc",
  authDomain: "epages-1375c.firebaseapp.com",
  projectId: "epages-1375c",
  storageBucket: "epages-1375c.firebasestorage.app",
  messagingSenderId: "451680719018",
  appId: "1:451680719018:web:8723dd355bce561f1c40d3",
  measurementId: "G-XDK9KDE9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to LOCAL (survives browser close)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export default app;
