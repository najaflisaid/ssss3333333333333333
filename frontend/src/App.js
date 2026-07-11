import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import { getCurrentUser } from "./firebase/auth";
import { trackVisit } from "./firebase/analytics";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import UploadBook from "./pages/UploadBook";
import EditBook from "./pages/EditBook";
import BookDetail from "./pages/BookDetail";
import Favorites from "./pages/Favorites";
import MyBooks from "./pages/MyBooks";
import AdminPanel from "./pages/Admin";
import StaticPage from "./pages/StaticPage";
import Services from "./pages/Services";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./contexts/LanguageContext";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getCurrentUser(firebaseUser.uid);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
      }
    });

    // Fallback timeout in case Firebase never responds
    timeoutId = setTimeout(() => {
      console.warn("Firebase auth timeout - proceeding without auth");
      setLoading(false);
    }, 10000);

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Track visit on app load
  useEffect(() => {
    trackVisit().catch(err => console.error('Visit tracking failed:', err));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    const { logoutUser } = await import("./firebase/auth");
    await logoutUser();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yüklənir...</div>
        <div className="ml-4">
          <button 
            onClick={() => setLoading(false)} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Skip Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
            <Route path="/profile" element={user ? <Profile user={user} onUserUpdate={setUser} /> : <Navigate to="/login" />} />
            <Route path="/upload" element={user ? <UploadBook user={user} /> : <Navigate to="/login" />} />
            <Route path="/edit-book/:id" element={user ? <EditBook user={user} /> : <Navigate to="/login" />} />
            <Route path="/books/:id" element={<BookDetail user={user} />} />
            <Route path="/favorites" element={user ? <Favorites user={user} /> : <Navigate to="/login" />} />
            <Route path="/my-books" element={user ? <MyBooks user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/" />} />
            <Route path="/xidmetler" element={<Services />} />
            <Route path="/haqqimizda" element={<StaticPage />} />
            <Route path="/elaqe" element={<ContactPage />} />
            <Route path="/xidmetlerimiz" element={<StaticPage />} />
            <Route path="/ikinciel" element={<StaticPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
