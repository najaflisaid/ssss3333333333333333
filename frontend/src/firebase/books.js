import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  increment
} from "firebase/firestore";
import { db } from "./config";

const BOOKS_COLLECTION = "books";

// Get all books with filters
export const getBooks = async (filters = {}) => {
  try {
    // Simple query - get all books and filter client-side to avoid index issues
    const snapshot = await getDocs(collection(db, BOOKS_COLLECTION));
    let books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by created_at descending
    books.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Filter only approved books for public view (unless includeUnapproved is true)
    if (!filters.includeUnapproved) {
      books = books.filter(book => book.approved === true);
    }
    
    // Category filter
    if (filters.category && filters.category.trim() !== '') {
      books = books.filter(book => book.category === filters.category);
    }
    
    // User filter
    if (filters.user_id) {
      books = books.filter(book => book.user_id === filters.user_id);
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      books = books.filter(book => 
        (book.title_az?.toLowerCase().includes(searchLower)) ||
        (book.title_en?.toLowerCase().includes(searchLower)) ||
        (book.title_ru?.toLowerCase().includes(searchLower)) ||
        (book.author_az?.toLowerCase().includes(searchLower)) ||
        (book.author_en?.toLowerCase().includes(searchLower)) ||
        (book.author_ru?.toLowerCase().includes(searchLower))
      );
    }
    
    // Price filters
    if (filters.minPrice) {
      books = books.filter(b => b.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      books = books.filter(b => b.price <= parseFloat(filters.maxPrice));
    }
    
    return { success: true, books };
  } catch (error) {
    console.error("Error getting books:", error);
    return { success: false, error: error.message, books: [] };
  }
};

// Get single book
export const getBook = async (bookId) => {
  try {
    const docRef = doc(db, BOOKS_COLLECTION, bookId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, book: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: "Kitab tapılmadı" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create book - starts as unapproved, admin must approve
export const createBook = async (bookData) => {
  try {
    const docRef = await addDoc(collection(db, BOOKS_COLLECTION), {
      ...bookData,
      views: 0,
      approved: false, // Admin təsdiqi gözləyir
      created_at: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Approve book (admin only)
export const approveBook = async (bookId, approved = true) => {
  try {
    await updateDoc(doc(db, BOOKS_COLLECTION, bookId), { approved });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update book
export const updateBook = async (bookId, data) => {
  try {
    await updateDoc(doc(db, BOOKS_COLLECTION, bookId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete book
export const deleteBook = async (bookId) => {
  try {
    await deleteDoc(doc(db, BOOKS_COLLECTION, bookId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Increment view count (works for both registered & guest users)
// Uses localStorage to avoid duplicate counts on page refresh within the same day
export const incrementBookView = async (bookId) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const storageKey = `book_view_${bookId}`;
    const lastViewedDate = localStorage.getItem(storageKey);

    // If already counted today for this book, skip
    if (lastViewedDate === today) {
      return { success: true, skipped: true };
    }

    await updateDoc(doc(db, BOOKS_COLLECTION, bookId), {
      views: increment(2)
    });

    // Mark as viewed today
    localStorage.setItem(storageKey, today);

    return { success: true };
  } catch (error) {
    console.error('Error incrementing book view:', error);
    return { success: false, error: error.message };
  }
};

// Get user's books
export const getUserBooks = async (userId) => {
  try {
    const snapshot = await getDocs(collection(db, BOOKS_COLLECTION));
    let books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    books = books.filter(book => book.user_id === userId);
    books.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, books };
  } catch (error) {
    return { success: false, error: error.message, books: [] };
  }
};

// Update all user's books contact information
export const updateUserBooksContact = async (userId, contactData) => {
  try {
    const snapshot = await getDocs(collection(db, BOOKS_COLLECTION));
    const userBooks = snapshot.docs.filter(doc => doc.data().user_id === userId);
    
    // Update each book
    const updatePromises = userBooks.map(bookDoc => 
      updateDoc(doc(db, BOOKS_COLLECTION, bookDoc.id), contactData)
    );
    
    await Promise.all(updatePromises);
    
    return { success: true, updatedCount: userBooks.length };
  } catch (error) {
    console.error("Error updating user books contact:", error);
    return { success: false, error: error.message };
  }
};
