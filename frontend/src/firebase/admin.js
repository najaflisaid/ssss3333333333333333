import { 
  collection, 
  getDocs, 
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "./config";

// Make a user admin by email (for initial setup)
export const makeUserAdmin = async (email) => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const user = snapshot.docs.find(d => d.data().email === email);
    if (user) {
      await updateDoc(doc(db, "users", user.id), { role: "admin" });
      return { success: true, message: `${email} artıq admin-dir` };
    }
    return { success: false, error: "İstifadəçi tapılmadı" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all users (admin)
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { success: true, users };
  } catch (error) {
    return { success: false, error: error.message, users: [] };
  }
};

// Update user role (admin)
export const updateUserRole = async (userId, role) => {
  try {
    await updateDoc(doc(db, "users", userId), { role });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user data (admin) - including password note
export const updateUserData = async (userId, data) => {
  try {
    await updateDoc(doc(db, "users", userId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete user (admin)
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all books (admin)
export const getAllBooks = async () => {
  try {
    const snapshot = await getDocs(collection(db, "books"));
    let books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    books.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return { success: true, books };
  } catch (error) {
    return { success: false, error: error.message, books: [] };
  }
};

// Delete book (admin)
export const adminDeleteBook = async (bookId) => {
  try {
    await deleteDoc(doc(db, "books", bookId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Approve/Reject book (admin)
export const approveBookAdmin = async (bookId, approved) => {
  try {
    await updateDoc(doc(db, "books", bookId), { approved });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
