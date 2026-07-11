import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

const SETTINGS_DOC = "app_settings";
const DEFAULT_BOOK_LIMIT = 20;

// Get app settings (including default book limit)
export const getAppSettings = async () => {
  try {
    const docRef = doc(db, "settings", SETTINGS_DOC);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, settings: docSnap.data() };
    } else {
      // Create default settings if not exists
      const defaultSettings = {
        default_book_limit: DEFAULT_BOOK_LIMIT,
        created_at: new Date().toISOString()
      };
      await setDoc(docRef, defaultSettings);
      return { success: true, settings: defaultSettings };
    }
  } catch (error) {
    return { success: false, error: error.message, settings: { default_book_limit: DEFAULT_BOOK_LIMIT } };
  }
};

// Update app settings (admin only)
export const updateAppSettings = async (newSettings) => {
  try {
    const docRef = doc(db, "settings", SETTINGS_DOC);
    await updateDoc(docRef, {
      ...newSettings,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    // If doc doesn't exist, create it
    try {
      const docRef = doc(db, "settings", SETTINGS_DOC);
      await setDoc(docRef, {
        ...newSettings,
        created_at: new Date().toISOString()
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// Get user's book limit (custom or default)
export const getUserBookLimit = async (userId) => {
  try {
    // First get user's custom limit
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.book_limit !== undefined && userData.book_limit !== null) {
        return { success: true, limit: userData.book_limit, isCustom: true };
      }
    }
    
    // If no custom limit, get default from settings
    const settings = await getAppSettings();
    return { 
      success: true, 
      limit: settings.settings?.default_book_limit || DEFAULT_BOOK_LIMIT,
      isCustom: false 
    };
  } catch (error) {
    return { success: false, limit: DEFAULT_BOOK_LIMIT, error: error.message };
  }
};

// Set user's custom book limit (admin only)
export const setUserBookLimit = async (userId, limit) => {
  try {
    await updateDoc(doc(db, "users", userId), { book_limit: limit });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Remove user's custom limit (use default)
export const removeUserBookLimit = async (userId) => {
  try {
    await updateDoc(doc(db, "users", userId), { book_limit: null });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
