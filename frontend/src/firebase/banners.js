import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc
} from "firebase/firestore";
import { db } from "./config";

const BANNERS_COLLECTION = "banners";

// Get all banners
export const getBanners = async () => {
  try {
    const snapshot = await getDocs(collection(db, BANNERS_COLLECTION));
    let banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    banners.sort((a, b) => (a.order || 0) - (b.order || 0));
    return { success: true, banners };
  } catch (error) {
    console.error("Error getting banners:", error);
    return { success: false, error: error.message, banners: [] };
  }
};

// Create banner
export const createBanner = async (bannerData) => {
  try {
    const docRef = await addDoc(collection(db, BANNERS_COLLECTION), {
      ...bannerData,
      created_at: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete banner
export const deleteBanner = async (bannerId) => {
  try {
    await deleteDoc(doc(db, BANNERS_COLLECTION, bannerId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
