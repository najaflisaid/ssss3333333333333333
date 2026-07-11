import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "./config";

const SERVICES_COLLECTION = "services";

// Get all services
export const getServices = async () => {
  try {
    const snapshot = await getDocs(collection(db, SERVICES_COLLECTION));
    let services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    services.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { success: true, services };
  } catch (error) {
    console.error("Error getting services:", error);
    return { success: false, error: error.message, services: [] };
  }
};

// Create service
export const createService = async (serviceData) => {
  try {
    const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
      ...serviceData,
      created_at: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update service
export const updateService = async (serviceId, data) => {
  try {
    await updateDoc(doc(db, SERVICES_COLLECTION, serviceId), {
      ...data,
      updated_at: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete service
export const deleteService = async (serviceId) => {
  try {
    await deleteDoc(doc(db, SERVICES_COLLECTION, serviceId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
