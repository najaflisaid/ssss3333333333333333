import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiVMO4HMLu5UorhlxxvXMmbdhrj732Izc",
  authDomain: "epages-1375c.firebaseapp.com",
  projectId: "epages-1375c",
  storageBucket: "epages-1375c.firebasestorage.app",
  messagingSenderId: "451680719018",
  appId: "1:451680719018:web:8723dd355bce561f1c40d3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAdmin(email) {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    console.log("Total users:", snapshot.docs.length);
    
    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      console.log("User:", data.email, "- Role:", data.role);
      
      if (data.email === email) {
        await updateDoc(doc(db, "users", userDoc.id), { role: "admin" });
        console.log(`SUCCESS: ${email} is now admin!`);
        process.exit(0);
      }
    }
    console.log("User not found:", email);
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

makeAdmin("admintest789@test.com");
