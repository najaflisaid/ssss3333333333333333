import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "./config";

const REVIEWS_COLLECTION = "reviews";

// Get reviews for a book
export const getBookReviews = async (bookId) => {
  try {
    const snapshot = await getDocs(collection(db, REVIEWS_COLLECTION));
    let reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reviews = reviews.filter(review => review.book_id === bookId);
    reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, reviews };
  } catch (error) {
    console.error("Error getting reviews:", error);
    return { success: false, error: error.message, reviews: [] };
  }
};

// Check if user already reviewed this book
export const hasUserReviewed = async (bookId, userId) => {
  try {
    const snapshot = await getDocs(collection(db, REVIEWS_COLLECTION));
    const reviews = snapshot.docs.map(doc => doc.data());
    const existingReview = reviews.find(r => r.book_id === bookId && r.user_id === userId);
    return { hasReviewed: !!existingReview };
  } catch (error) {
    return { hasReviewed: false };
  }
};

// Add review (only if user hasn't reviewed this book)
export const addReview = async (reviewData) => {
  try {
    // Check if user already reviewed
    const { hasReviewed } = await hasUserReviewed(reviewData.book_id, reviewData.user_id);
    if (hasReviewed) {
      return { success: false, error: "Bu kitaba artıq rəy yazmısınız" };
    }
    
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      created_at: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete review (user can delete their own review)
export const deleteReview = async (reviewId, userId = null) => {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all reviews (admin)
export const getAllReviews = async () => {
  try {
    const snapshot = await getDocs(collection(db, REVIEWS_COLLECTION));
    let reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, reviews };
  } catch (error) {
    return { success: false, error: error.message, reviews: [] };
  }
};
