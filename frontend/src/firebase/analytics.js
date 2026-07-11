import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

// Track page visit
export const trackVisit = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const visitsRef = doc(db, 'analytics', 'visits');
    
    // Check if already visited today (using localStorage)
    const lastVisit = localStorage.getItem('lastVisit');
    const isNewVisit = lastVisit !== today;
    
    if (isNewVisit) {
      const visitsDoc = await getDoc(visitsRef);
      
      if (visitsDoc.exists()) {
        await updateDoc(visitsRef, {
          total: increment(1),
          today: today,
          todayCount: visitsDoc.data().today === today ? increment(1) : 1,
          lastVisit: serverTimestamp()
        });
      } else {
        await setDoc(visitsRef, {
          total: 1,
          today: today,
          todayCount: 1,
          lastVisit: serverTimestamp()
        });
      }
      
      // Update localStorage
      localStorage.setItem('lastVisit', today);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking visit:', error);
    return { success: false, error: error.message };
  }
};

// Get analytics statistics
export const getAnalytics = async () => {
  try {
    const visitsRef = doc(db, 'analytics', 'visits');
    const visitsDoc = await getDoc(visitsRef);
    
    const analyticsData = {
      totalVisits: 0,
      todayVisits: 0,
      lastVisit: null
    };
    
    if (visitsDoc.exists()) {
      const data = visitsDoc.data();
      const today = new Date().toISOString().split('T')[0];
      
      analyticsData.totalVisits = data.total || 0;
      analyticsData.todayVisits = data.today === today ? (data.todayCount || 0) : 0;
      analyticsData.lastVisit = data.lastVisit;
    }
    
    return { success: true, analytics: analyticsData };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return { success: false, error: error.message };
  }
};

// Get user statistics (books per user)
export const getUserStats = async () => {
  try {
    const usersRef = collection(db, 'users');
    const booksRef = collection(db, 'books');
    
    const usersSnapshot = await getDocs(usersRef);
    const booksSnapshot = await getDocs(booksRef);
    
    const userStats = [];
    const totalUsers = usersSnapshot.size;
    const totalBooks = booksSnapshot.size;
    
    // Count books per user
    const booksByUser = {};
    booksSnapshot.forEach(doc => {
      const book = doc.data();
      const userId = book.user_id;
      if (userId) {
        booksByUser[userId] = (booksByUser[userId] || 0) + 1;
      }
    });
    
    // Build user stats
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      userStats.push({
        id: doc.id,
        name: user.name,
        email: user.email,
        bookCount: booksByUser[doc.id] || 0,
        role: user.role || 'user'
      });
    });
    
    // Sort by book count descending
    userStats.sort((a, b) => b.bookCount - a.bookCount);
    
    return { 
      success: true, 
      stats: {
        totalUsers,
        totalBooks,
        userStats
      }
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { success: false, error: error.message };
  }
};
