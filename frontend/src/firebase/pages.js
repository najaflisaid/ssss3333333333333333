import { 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { db } from "./config";

const PAGES_COLLECTION = "pages";

// Get page content
export const getPageContent = async (pageId, language = "az") => {
  try {
    const docRef = doc(db, PAGES_COLLECTION, pageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        page: {
          title: data[`title_${language}`] || data.title_az || "",
          content: data[`content_${language}`] || data.content_az || "",
          image_url: data.image_url || "",
          updated_at: data.updated_at
        }
      };
    } else {
      return { success: false, error: "Səhifə tapılmadı" };
    }
  } catch (error) {
    console.error("Get page error:", error);
    return { success: false, error: error.message };
  }
};

// Update page content (admin)
export const updatePageContent = async (pageId, data) => {
  try {
    const docRef = doc(db, PAGES_COLLECTION, pageId);
    await setDoc(docRef, {
      title_az: data.title_az || "",
      title_en: data.title_en || "",
      title_ru: data.title_ru || "",
      content_az: data.content_az || "",
      content_en: data.content_en || "",
      content_ru: data.content_ru || "",
      image_url: data.image_url || "",
      updated_at: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Update page error:", error);
    return { success: false, error: error.message };
  }
};
