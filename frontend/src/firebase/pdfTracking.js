import { db } from './config';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

// Track PDF download/view
export const trackPdfDownload = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    await updateDoc(bookRef, {
      pdf_downloads: increment(1)
    });
    return { success: true };
  } catch (error) {
    console.error('Error tracking PDF download:', error);
    return { success: false, error: error.message };
  }
};

// Get PDF download count
export const getPdfDownloadCount = async (bookId) => {
  try {
    const bookRef = doc(db, 'books', bookId);
    const bookSnap = await getDoc(bookRef);
    
    if (bookSnap.exists()) {
      const data = bookSnap.data();
      return { success: true, count: data.pdf_downloads || 0 };
    }
    
    return { success: false, count: 0 };
  } catch (error) {
    console.error('Error getting PDF download count:', error);
    return { success: false, count: 0 };
  }
};
