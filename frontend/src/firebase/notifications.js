import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

// Create a notification
export const createNotification = async (type, data) => {
  try {
    const notificationData = {
      type, // 'new_user', 'new_book', 'new_review'
      data,
      read: false,
      created_at: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

// Get unread notification count by type
export const getUnreadCount = async (type) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('type', '==', type),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, count: 0 };
  }
};

// Get all unread notification counts
export const getAllUnreadCounts = async () => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const counts = {
      new_user: 0,
      new_book: 0,
      new_review: 0
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (counts.hasOwnProperty(data.type)) {
        counts[data.type]++;
      }
    });
    
    return { success: true, counts };
  } catch (error) {
    console.error('Error getting all unread counts:', error);
    return { success: false, counts: { new_user: 0, new_book: 0, new_review: 0 } };
  }
};

// Mark notifications as read by type
export const markAsRead = async (type) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('type', '==', type),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = [];
    
    snapshot.forEach(docSnapshot => {
      const docRef = doc(db, 'notifications', docSnapshot.id);
      updatePromises.push(updateDoc(docRef, { read: true }));
    });
    
    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return { success: false, error: error.message };
  }
};

// Clear old read notifications (optional cleanup)
export const clearOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const q = query(
      collection(db, 'notifications'),
      where('read', '==', true),
      where('created_at', '<', cutoffDate)
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = [];
    
    snapshot.forEach(docSnapshot => {
      deletePromises.push(deleteDoc(doc(db, 'notifications', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    return { success: true, deleted: deletePromises.length };
  } catch (error) {
    console.error('Error clearing old notifications:', error);
    return { success: false, error: error.message };
  }
};
