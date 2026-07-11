import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  az: {
    // Navigation
    home: "Ana Səhifə",
    about: "Haqqımızda",
    services: "Xidmətlərimiz",
    secondhand: "2-ci əl kitablar",
    contact: "Əlaqə",
    login: "Daxil Ol",
    register: "Qeydiyyat",
    logout: "Çıxış",
    profile: "Profil",
    admin: "Admin",
    uploadBook: "Kitab Yüklə",
    myBooks: "Mənim Kitablarım",
    favorites: "Favoritlər",
    
    // Common
    search: "Axtar",
    filter: "Filtr",
    clear: "Təmizlə",
    save: "Yadda Saxla",
    cancel: "Ləğv et",
    delete: "Sil",
    edit: "Redaktə",
    submit: "Göndər",
    loading: "Yüklənir...",
    categories: "Kateqoriyalar",
    price: "Qiymət",
    free: "Pulsuz",
    paid: "Pullu",
    all: "Hamısı",
    
    // Book
    bookTitle: "Kitabın Adı",
    author: "Müəllif",
    description: "Təsvir",
    category: "Kateqoriya",
    addToFavorites: "Favoritə Əlavə Et",
    removeFromFavorites: "Favoritlərdən Sil",
    downloadPDF: "PDF Yüklə",
    downloadDemo: "Demo Yüklə",
    contactSeller: "Satıcı ilə Əlaqə",
    reviews: "Rəylər",
    rating: "Reytinq",
    addReview: "Rəy Yaz",
    submitReview: "Rəyi Göndər",
    comment: "Şərh",
    noReviews: "Hələ rəy yoxdur",
    views: "baxış",
    noBooksFound: "Heç bir kitab tapılmadı",
    
    // Upload
    paidBook: "Pullu kitab",
    freeBook: "Pulsuz kitab",
    demoPdf: "Demo PDF",
    fullPdf: "Tam PDF",
    coverImage: "Üz Şəkli",
    uploadCover: "Üz şəkli yüklə",
    uploadPdf: "PDF yüklə",
    uploadDemoPdf: "Demo PDF yüklə",
    selectCategory: "Kateqoriya seçin",
    enterPrice: "Qiymət daxil edin",
    bookUploaded: "Kitab uğurla yükləndi",
    uploadingCover: "Üz şəkli yüklənir...",
    uploadingPdf: "PDF yüklənir...",
    uploadingDemoPdf: "Demo PDF yüklənir...",
    
    // Auth
    email: "Email",
    password: "Şifrə",
    name: "Ad Soyad",
    whatsapp: "WhatsApp Nömrəsi",
    accountType: "Hesab Növü",
    authorAccount: "Müəllif Hesabı",
    businessAccount: "Biznes Hesabı",
    storeName: "Mağaza Adı",
    alreadyHaveAccount: "Artıq hesabınız var?",
    dontHaveAccount: "Hesabınız yoxdur?",
    signInToAccount: "Hesabınıza daxil olun",
    createAccount: "Yeni hesab yaradın",
    wait: "Gözləyin...",
    
    // Messages
    success: "Uğurlu!",
    error: "Xəta!",
    bookAdded: "Kitab əlavə edildi",
    bookDeleted: "Kitab silindi",
    bookUpdated: "Kitab yeniləndi",
    loginSuccess: "Uğurla daxil oldunuz",
    registerSuccess: "Uğurla qeydiyyatdan keçdiniz",
    loginFailed: "Daxil olma uğursuz oldu",
    registerFailed: "Qeydiyyat uğursuz oldu",
    addedToFavorites: "Favoritlərə əlavə edildi",
    removedFromFavorites: "Favoritlərdən silindi",
    loginRequired: "Daxil olmalısınız",
    coverRequired: "Üz şəkli yükləməlisiniz",
    pdfRequired: "PDF yükləməlisiniz",
    demoPdfRequired: "Demo PDF yükləməlisiniz",
    titleRequired: "Kitab adı daxil edin",
    authorRequired: "Müəllif adı daxil edin",
    copyrightRequired: "Müəllif hüquqları şərtlərini qəbul etməlisiniz",
    storeNameRequired: "Mağaza adı tələb olunur",
    selectRating: "Reytinq seçin",
    reviewAdded: "Rəyiniz əlavə edildi",
    
    // Pages
    shareAndDiscover: "Kitablarınızı paylaşın və kəşf edin",
    platformDescription: "Azərbaycanın ən böyük elektron kitab platforması. Kitablarınızı satın və yeni kitablar kəşf edin.",
    searchPlaceholder: "Kitab, müəllif axtarın...",
    minPrice: "Minimum qiymət (AZN)",
    maxPrice: "Maksimum qiymət (AZN)",
    contactUs: "Bizimlə Əlaqə",
    contactDescription: "Suallarınız və təklifləriniz üçün bizimlə əlaqə saxlayın",
    phone: "Telefon",
    socialMedia: "Sosial Şəbəkələr",
    workingHours: "İş saatları: Bazar ertəsi - Cümə, 09:00 - 18:00",
    ourServices: "Xidmətlərimiz",
    servicesDescription: "Sizə təqdim etdiyimiz xidmətlər",
    noServices: "Hazırda heç bir xidmət yoxdur",
    buyViaWhatsapp: "WhatsApp ilə al",
    pageNotFound: "Səhifə tapılmadı",
    lastUpdated: "Son yenilənmə",
    newBook: "Yeni Kitab",
    noBooks: "Hələ kitab yükləməmisiniz",
    uploadFirstBook: "İlk kitabınızı yükləyin",
    emptyFavorites: "Favoritləriniz boşdur",
    editBook: "Kitabı Redaktə Et",
    saving: "Saxlanılır...",
    uploading: "Yüklənir...",
    
    // Whatsapp messages
    whatsappContact: "Bizimlə WhatsApp-da əlaqə saxlayın",
    instagramFollow: "Bizi Instagram-da izləyin",
    tiktokFollow: "Bizi TikTok-da izləyin",
    facebookFollow: "Bizi Facebook-da izləyin",
  },
  en: {
    // Navigation
    home: "Home",
    about: "About Us",
    services: "Services",
    secondhand: "Second-hand Books",
    contact: "Contact",
    login: "Login",
    register: "Register",
    logout: "Logout",
    profile: "Profile",
    admin: "Admin",
    uploadBook: "Upload Book",
    myBooks: "My Books",
    favorites: "Favorites",
    
    // Common
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    submit: "Submit",
    loading: "Loading...",
    categories: "Categories",
    price: "Price",
    free: "Free",
    paid: "Paid",
    all: "All",
    
    // Book
    bookTitle: "Book Title",
    author: "Author",
    description: "Description",
    category: "Category",
    addToFavorites: "Add to Favorites",
    removeFromFavorites: "Remove from Favorites",
    downloadPDF: "Download PDF",
    downloadDemo: "Download Demo",
    contactSeller: "Contact Seller",
    reviews: "Reviews",
    rating: "Rating",
    addReview: "Add Review",
    submitReview: "Submit Review",
    comment: "Comment",
    noReviews: "No reviews yet",
    views: "views",
    noBooksFound: "No books found",
    
    // Upload
    paidBook: "Paid book",
    freeBook: "Free book",
    demoPdf: "Demo PDF",
    fullPdf: "Full PDF",
    coverImage: "Cover Image",
    uploadCover: "Upload cover image",
    uploadPdf: "Upload PDF",
    uploadDemoPdf: "Upload demo PDF",
    selectCategory: "Select category",
    enterPrice: "Enter price",
    bookUploaded: "Book uploaded successfully",
    uploadingCover: "Uploading cover...",
    uploadingPdf: "Uploading PDF...",
    uploadingDemoPdf: "Uploading demo PDF...",
    
    // Auth
    email: "Email",
    password: "Password",
    name: "Full Name",
    whatsapp: "WhatsApp Number",
    accountType: "Account Type",
    authorAccount: "Author Account",
    businessAccount: "Business Account",
    storeName: "Store Name",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    signInToAccount: "Sign in to your account",
    createAccount: "Create a new account",
    wait: "Wait...",
    
    // Messages
    success: "Success!",
    error: "Error!",
    bookAdded: "Book added",
    bookDeleted: "Book deleted",
    bookUpdated: "Book updated",
    loginSuccess: "Login successful",
    registerSuccess: "Registration successful",
    loginFailed: "Login failed",
    registerFailed: "Registration failed",
    addedToFavorites: "Added to favorites",
    removedFromFavorites: "Removed from favorites",
    loginRequired: "You must be logged in",
    coverRequired: "Cover image is required",
    pdfRequired: "PDF file is required",
    demoPdfRequired: "Demo PDF is required",
    titleRequired: "Book title is required",
    authorRequired: "Author name is required",
    copyrightRequired: "You must agree to copyright terms",
    storeNameRequired: "Store name is required",
    selectRating: "Select a rating",
    reviewAdded: "Review added",
    
    // Pages
    shareAndDiscover: "Share and discover your books",
    platformDescription: "Azerbaijan's largest e-book platform. Sell your books and discover new ones.",
    searchPlaceholder: "Search book, author...",
    minPrice: "Min price (AZN)",
    maxPrice: "Max price (AZN)",
    contactUs: "Contact Us",
    contactDescription: "Contact us for your questions and suggestions",
    phone: "Phone",
    socialMedia: "Social Media",
    workingHours: "Working hours: Monday - Friday, 09:00 - 18:00",
    ourServices: "Our Services",
    servicesDescription: "Services we offer to you",
    noServices: "No services available at the moment",
    buyViaWhatsapp: "Buy via WhatsApp",
    pageNotFound: "Page not found",
    lastUpdated: "Last updated",
    newBook: "New Book",
    noBooks: "You haven't uploaded any books yet",
    uploadFirstBook: "Upload your first book",
    emptyFavorites: "Your favorites are empty",
    editBook: "Edit Book",
    saving: "Saving...",
    uploading: "Uploading...",
    
    // Whatsapp messages
    whatsappContact: "Contact us on WhatsApp",
    instagramFollow: "Follow us on Instagram",
    tiktokFollow: "Follow us on TikTok",
    facebookFollow: "Follow us on Facebook",
  },
  ru: {
    // Navigation
    home: "Главная",
    about: "О нас",
    services: "Услуги",
    secondhand: "Подержанные книги",
    contact: "Контакты",
    login: "Войти",
    register: "Регистрация",
    logout: "Выход",
    profile: "Профиль",
    admin: "Админ",
    uploadBook: "Загрузить книгу",
    myBooks: "Мои книги",
    favorites: "Избранное",
    
    // Common
    search: "Поиск",
    filter: "Фильтр",
    clear: "Очистить",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    submit: "Отправить",
    loading: "Загрузка...",
    categories: "Категории",
    price: "Цена",
    free: "Бесплатно",
    paid: "Платно",
    all: "Все",
    
    // Book
    bookTitle: "Название книги",
    author: "Автор",
    description: "Описание",
    category: "Категория",
    addToFavorites: "Добавить в избранное",
    removeFromFavorites: "Удалить из избранного",
    downloadPDF: "Скачать PDF",
    downloadDemo: "Скачать демо",
    contactSeller: "Связаться с продавцом",
    reviews: "Отзывы",
    rating: "Рейтинг",
    addReview: "Написать отзыв",
    submitReview: "Отправить отзыв",
    comment: "Комментарий",
    noReviews: "Пока нет отзывов",
    views: "просмотров",
    noBooksFound: "Книги не найдены",
    
    // Upload
    paidBook: "Платная книга",
    freeBook: "Бесплатная книга",
    demoPdf: "Демо PDF",
    fullPdf: "Полный PDF",
    coverImage: "Обложка",
    uploadCover: "Загрузить обложку",
    uploadPdf: "Загрузить PDF",
    uploadDemoPdf: "Загрузить демо PDF",
    selectCategory: "Выберите категорию",
    enterPrice: "Введите цену",
    bookUploaded: "Книга успешно загружена",
    uploadingCover: "Загрузка обложки...",
    uploadingPdf: "Загрузка PDF...",
    uploadingDemoPdf: "Загрузка демо PDF...",
    
    // Auth
    email: "Email",
    password: "Пароль",
    name: "Полное имя",
    whatsapp: "Номер WhatsApp",
    accountType: "Тип аккаунта",
    authorAccount: "Аккаунт автора",
    businessAccount: "Бизнес аккаунт",
    storeName: "Название магазина",
    alreadyHaveAccount: "Уже есть аккаунт?",
    dontHaveAccount: "Нет аккаунта?",
    signInToAccount: "Войдите в свой аккаунт",
    createAccount: "Создать новый аккаунт",
    wait: "Подождите...",
    
    // Messages
    success: "Успешно!",
    error: "Ошибка!",
    bookAdded: "Книга добавлена",
    bookDeleted: "Книга удалена",
    bookUpdated: "Книга обновлена",
    loginSuccess: "Вход выполнен",
    registerSuccess: "Регистрация успешна",
    loginFailed: "Вход не удался",
    registerFailed: "Регистрация не удалась",
    addedToFavorites: "Добавлено в избранное",
    removedFromFavorites: "Удалено из избранного",
    loginRequired: "Необходимо войти",
    coverRequired: "Требуется обложка",
    pdfRequired: "Требуется PDF файл",
    demoPdfRequired: "Требуется демо PDF",
    titleRequired: "Введите название книги",
    authorRequired: "Введите имя автора",
    copyrightRequired: "Необходимо согласиться с условиями авторских прав",
    storeNameRequired: "Требуется название магазина",
    selectRating: "Выберите рейтинг",
    reviewAdded: "Отзыв добавлен",
    
    // Pages
    shareAndDiscover: "Делитесь и открывайте свои книги",
    platformDescription: "Крупнейшая платформа электронных книг Азербайджана. Продавайте свои книги и открывайте новые.",
    searchPlaceholder: "Поиск книги, автора...",
    minPrice: "Мин. цена (AZN)",
    maxPrice: "Макс. цена (AZN)",
    contactUs: "Связаться с нами",
    contactDescription: "Свяжитесь с нами по вопросам и предложениям",
    phone: "Телефон",
    socialMedia: "Социальные сети",
    workingHours: "Рабочие часы: Понедельник - Пятница, 09:00 - 18:00",
    ourServices: "Наши Услуги",
    servicesDescription: "Услуги, которые мы предлагаем",
    noServices: "В настоящее время услуги недоступны",
    buyViaWhatsapp: "Купить через WhatsApp",
    pageNotFound: "Страница не найдена",
    lastUpdated: "Последнее обновление",
    newBook: "Новая книга",
    noBooks: "Вы еще не загрузили книги",
    uploadFirstBook: "Загрузите свою первую книгу",
    emptyFavorites: "Ваше избранное пусто",
    editBook: "Редактировать книгу",
    saving: "Сохранение...",
    uploading: "Загрузка...",
    
    // Whatsapp messages
    whatsappContact: "Свяжитесь с нами в WhatsApp",
    instagramFollow: "Подписывайтесь на нас в Instagram",
    tiktokFollow: "Подписывайтесь на нас в TikTok",
    facebookFollow: "Подписывайтесь на нас в Facebook",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'az';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['az'][key] || key;
  };

  const changeLanguage = (lang) => {
    if (['az', 'en', 'ru'].includes(lang)) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
