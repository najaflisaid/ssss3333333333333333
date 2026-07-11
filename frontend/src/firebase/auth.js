import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Admin emails list - these users get admin role on registration
const ADMIN_EMAILS = ["admin@epagesaz.com", "epagesaz@gmail.com", "admintest789@test.com"];

// Register new user
export const registerUser = async (email, password, name, accountType = "normal", storeName = "", whatsapp = "") => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });
    
    // Auto-assign admin role for predefined admin emails
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    
    // If no WhatsApp, default contact preference is email
    const contactPreference = whatsapp && whatsapp.trim() !== "" ? "whatsapp" : "email";
    
    const userData = {
      id: user.uid,
      email: email,
      password: password, // Admin paneldə görmək üçün saxlanılır
      name: name,
      role: isAdmin ? "admin" : "user",
      account_type: accountType,
      store_name: accountType === "business" ? storeName : "",
      whatsapp: whatsapp,
      contact_preference: contactPreference,
      favorites: [],
      created_at: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), userData);
    
    return { success: true, user: userData };
  } catch (error) {
    let errorMsg = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'Bu email artıq istifadə olunur';
    } else if (error.code === 'auth/weak-password') {
      errorMsg = 'Şifrə ən azı 6 simvol olmalıdır';
    }
    return { success: false, error: errorMsg };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      return { success: true, user: userDoc.data() };
    } else {
      return { success: false, error: "İstifadəçi tapılmadı" };
    }
  } catch (error) {
    let errorMsg = error.message;
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMsg = 'Email və ya şifrə yanlışdır';
    }
    return { success: false, error: errorMsg };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current user data
export const getCurrentUser = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (uid, data) => {
  try {
    await updateDoc(doc(db, "users", uid), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Toggle favorite
export const toggleFavorite = async (uid, bookId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const favorites = userData.favorites || [];
      const newFavorites = favorites.includes(bookId)
        ? favorites.filter(id => id !== bookId)
        : [...favorites, bookId];
      
      await updateDoc(doc(db, "users", uid), { favorites: newFavorites });
      return { success: true, favorites: newFavorites };
    }
    return { success: false, error: "İstifadəçi tapılmadı" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
