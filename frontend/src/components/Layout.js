import { Link } from "react-router-dom";
import { Heart, Upload, BookOpen, User, LogOut, Menu, X, Settings, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect, useRef } from "react";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";
import FloatingWhatsApp from "./FloatingWhatsApp";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

// Sabit kateqoriyalar
const MENU_CATEGORIES = [
  { id: "kitab", name_az: "Kitab", name_en: "Book", name_ru: "Книга", filter: "Kitab" },
  { id: "pdf_pullu", name_az: "PDF Kitab (Pullu)", name_en: "PDF Book (Paid)", name_ru: "PDF Книга (Платная)", filter: "PDF Kitab (Pullu)" },
  { id: "pdf_pulsuz", name_az: "PDF Kitab (Pulsuz)", name_en: "PDF Book (Free)", name_ru: "PDF Книга (Бесплатная)", filter: "PDF Kitab (Pulsuz)" },
  { id: "ikinci_el", name_az: "2-ci əl kitab", name_en: "Second Hand Book", name_ru: "Б/У книга", filter: "2-ci əl kitab" },
];

const Layout = ({ children, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [footerPages, setFooterPages] = useState([]);
  const { t, language } = useLanguage();
  const dropdownRef = useRef(null);

  // Fetch active pages from Firebase for footer
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const pagesSnapshot = await getDocs(collection(db, 'pages'));
        const pagesData = [];
        
        pagesSnapshot.forEach(doc => {
          const data = doc.data();
          // Only add pages that have content in Azerbaijani
          if (data.title_az || data.title) {
            pagesData.push({
              id: doc.id,
              title_az: data.title_az || data.title,
              title_en: data.title_en,
              title_ru: data.title_ru,
            });
          }
        });
        
        setFooterPages(pagesData);
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    };
    
    fetchPages();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to get category name by language
  const getCategoryName = (cat) => {
    if (language === 'en' && cat.name_en) return cat.name_en;
    if (language === 'ru' && cat.name_ru) return cat.name_ru;
    return cat.name_az;
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50">
      <nav className="border-b border-blue-950 bg-blue-950 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-24 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="https://i.hizliresim.com/jfkqp4z.png" alt="Epagesaz.com" className="h-8 lg:h-10 w-auto" />
              <span className="text-xl lg:text-2xl font-serif font-semibold text-white">epagesaz.com</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden xl:flex items-center gap-2 2xl:gap-4">
              <LanguageSelector />
              <Link to="/haqqimizda">
                <Button variant="ghost" size="sm" className="text-sm 2xl:text-base px-2 2xl:px-4 text-white hover:text-white hover:bg-blue-900">
                  {t('about')}
                </Button>
              </Link>
              
              {/* Categories Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm 2xl:text-base px-2 2xl:px-4 text-white hover:text-white hover:bg-blue-900"
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                >
                  {language === 'az' ? 'Kateqoriyalar' : language === 'en' ? 'Categories' : 'Категории'}
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg py-2 min-w-[180px] z-50">
                    {MENU_CATEGORIES.map(cat => (
                      <Link 
                        key={cat.id} 
                        to={`/?category=${encodeURIComponent(cat.filter)}`}
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                      >
                        {getCategoryName(cat)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              <Link to="/xidmetler">
                <Button variant="ghost" size="sm" className="text-sm 2xl:text-base px-2 2xl:px-4 text-white hover:text-white hover:bg-blue-900">{t('services')}</Button>
              </Link>
              <Link to="/elaqe">
                <Button variant="ghost" size="sm" className="text-sm 2xl:text-base px-2 2xl:px-4 text-white hover:text-white hover:bg-blue-900">{t('contact')}</Button>
              </Link>
              
              {user ? (
                <>
                  <Link to="/upload">
                    <Button data-testid="upload-book-btn" variant="ghost" size="sm" className="rounded-full text-sm text-white hover:text-white hover:bg-blue-800 border border-white/30">
                      <Upload className="h-4 w-4 mr-1" />
                      {t('uploadBook')}
                    </Button>
                  </Link>
                  <Link to="/my-books">
                    <Button data-testid="my-books-btn" variant="ghost" size="sm" className="rounded-full text-sm text-white hover:text-white hover:bg-blue-800 border border-white/30">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {t('myBooks')}
                    </Button>
                  </Link>
                  <Link to="/favorites">
                    <Button data-testid="favorites-btn" variant="ghost" size="sm" className="rounded-full text-white hover:text-white hover:bg-blue-800 border border-white/30">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin">
                      <Button data-testid="admin-btn" variant="ghost" size="sm" className="rounded-full text-white hover:text-white hover:bg-blue-800 border border-white/30">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button data-testid="profile-btn" variant="ghost" size="sm" className="rounded-full text-white hover:text-white hover:bg-blue-950 border border-white/30">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button data-testid="logout-btn" onClick={onLogout} variant="ghost" size="sm" className="rounded-full text-white hover:text-white hover:bg-blue-950">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button data-testid="login-btn" variant="ghost" size="sm" className="rounded-full text-sm text-white hover:text-white hover:bg-blue-950 border border-white/30">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button data-testid="register-btn" size="sm" className="rounded-full text-sm bg-white text-blue-950 hover:bg-blue-100">
                      {t('register')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              data-testid="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg hover:bg-blue-900 transition-colors text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Sidebar Menu */}
        <div
          data-testid="mobile-menu"
          className={`fixed top-0 left-0 h-screen w-80 bg-blue-950 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 xl:hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-900 bg-blue-950 flex-shrink-0">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <img src="https://i.hizliresim.com/jfkqp4z.png" alt="Epagesaz.com" className="h-8 w-auto" />
                <span className="text-xl font-serif font-semibold text-white">epagesaz.com</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-blue-900 rounded-lg transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Mobile Menu Items */}
            <div className="flex-1 p-6 space-y-2 flex flex-col justify-between bg-blue-950">
              <div className="space-y-1">
                {/* Language Selector Mobile */}
                <div className="pb-3">
                  <LanguageSelector />
                </div>
                
                {/* Main Pages */}
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                    <BookOpen className="h-5 w-5 mr-3" />
                    {t('home')}
                  </Button>
                </Link>
                <Link to="/haqqimizda" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                    {t('about')}
                  </Button>
                </Link>
                
                {/* Categories Dropdown for Mobile */}
                <div>
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    className="w-full justify-between text-base text-white hover:text-white hover:bg-blue-900"
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  >
                    <span>{language === 'az' ? 'Kateqoriyalar' : language === 'en' ? 'Categories' : 'Категории'}</span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {mobileCategoriesOpen && (
                    <div className="pl-4 space-y-1 mt-1">
                      {MENU_CATEGORIES.map(cat => (
                        <Link key={cat.id} to={`/?category=${encodeURIComponent(cat.filter)}`} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-sm text-blue-100 hover:text-white hover:bg-blue-800">
                            {getCategoryName(cat)}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                
                <Link to="/xidmetler" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                    {t('services')}
                  </Button>
                </Link>
                <Link to="/elaqe" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                    {t('contact')}
                  </Button>
                </Link>

                {/* Login/Register for non-logged users - after Elaqe */}
                {!user && (
                  <div className="space-y-5 pt-6 mt-4 border-t border-blue-900">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="lg" className="w-full rounded-full text-white hover:text-white hover:bg-blue-900 border border-white/30">
                        {t('login')}
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block mt-4">
                      <Button size="lg" className="w-full rounded-full bg-white text-blue-950 hover:bg-blue-100">
                        {t('register')}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              {user && (
                <div className="space-y-1">
                  <div className="border-t border-blue-900 mb-4"></div>
                  <div className="px-4 py-2 text-sm text-blue-100 font-medium">
                    {user.name}
                  </div>
                  <Link to="/upload" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                      <Upload className="h-5 w-5 mr-3" />
                      {t('uploadBook')}
                    </Button>
                  </Link>
                  <Link to="/my-books" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                      <BookOpen className="h-5 w-5 mr-3" />
                      {t('myBooks')}
                    </Button>
                  </Link>
                  <Link to="/favorites" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                      <Heart className="h-5 w-5 mr-3" />
                      {t('favorites')}
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900 border border-white/30">
                        <Settings className="h-5 w-5 mr-3" />
                        {t('admin')} Panel
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="lg" className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900">
                      <User className="h-5 w-5 mr-3" />
                      {t('profile')}
                    </Button>
                  </Link>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => { onLogout(); setMobileMenuOpen(false); }} 
                      variant="ghost" 
                      size="lg" 
                      className="w-full justify-start text-base text-white hover:text-white hover:bg-blue-900 border border-white/30"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      {t('logout')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 xl:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}
      </nav>
      
      <main className="flex-1">{children}</main>
      
      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp />
      
      <footer className="border-t border-blue-950 bg-blue-950 py-12">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Column 1 - Logo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="https://i.hizliresim.com/jfkqp4z.png" alt="Epagesaz.com" className="h-10 w-auto" />
                <span className="text-xl font-serif font-semibold text-white">epagesaz.com</span>
              </div>
            </div>
            
            {/* Column 2 - Pages */}
            <div>
              <h3 className="font-semibold mb-4 text-white">
                {language === 'az' && 'Səhifələr'}
                {language === 'en' && 'Pages'}
                {language === 'ru' && 'Страницы'}
              </h3>
              <div className="space-y-2">
                <Link 
                  to="/haqqimizda"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {language === 'az' && 'Haqqımızda'}
                  {language === 'en' && 'About Us'}
                  {language === 'ru' && 'О нас'}
                </Link>
                <Link 
                  to="/xidmetler"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {language === 'az' && 'Xidmətlərimiz'}
                  {language === 'en' && 'Our Services'}
                  {language === 'ru' && 'Наши услуги'}
                </Link>
                <Link 
                  to="/elaqe"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {t('contact')}
                </Link>
              </div>
            </div>
            
            {/* Column 3 - Categories */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('categories')}</h3>
              <div className="space-y-2">
                <Link 
                  to="/?category=Kitab" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {language === 'az' && 'Kitab'}
                  {language === 'en' && 'Book'}
                  {language === 'ru' && 'Книга'}
                </Link>
                <Link 
                  to="/?category=PDF Kitab" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {language === 'az' && 'PDF Kitab'}
                  {language === 'en' && 'PDF Book'}
                  {language === 'ru' && 'PDF книга'}
                </Link>
                <Link 
                  to="/?category=2-ci əl kitab" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="block text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {language === 'az' && '2-ci əl kitab'}
                  {language === 'en' && 'Second-hand book'}
                  {language === 'ru' && 'Подержанная книга'}
                </Link>
              </div>
            </div>
            
            {/* Column 4 - Contact */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('contact')}</h3>
              <div className="space-y-2 text-sm text-blue-100">
                <p>Email: epagesaz@gmail.com</p>
                <p>Tel: 0773770383</p>
              </div>
              {/* Social Media Links */}
              <div className="flex gap-3 mt-4">
                <a 
                  href="https://www.instagram.com/elektron__kitab?igsh=bnN3aDZ4N2JtMzA1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-100 hover:text-pink-400 transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.tiktok.com/@epagesaz.com?_r=1&_t=ZS-92Y6N5cJvLl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-100 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.facebook.com/share/1Af4vDWJvR/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-100 hover:text-blue-400 transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-blue-100">
              © {new Date().getFullYear()} Epagesaz.com 
              {language === 'az' && ' Bütün hüquqlar qorunur.'}
              {language === 'en' && ' All rights reserved.'}
              {language === 'ru' && ' Все права защищены.'}
            </p>
            <div className="flex gap-4 text-sm text-blue-100">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                {language === 'az' && 'Məxfilik Siyasəti'}
                {language === 'en' && 'Privacy Policy'}
                {language === 'ru' && 'Политика конфиденциальности'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;