import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen, MessageSquare, Briefcase, Images, FileText, Settings, Search, Pencil, Trash2, Check, X, Eye, Sliders, BarChart3, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

import { getAllUsers, updateUserRole, deleteUser, getAllBooks, adminDeleteBook, approveBookAdmin } from "../../firebase/admin";
import { getAllReviews, deleteReview } from "../../firebase/reviews";
import { getServices, createService, updateService, deleteService } from "../../firebase/services";
import { getBanners, createBanner, deleteBanner } from "../../firebase/banners";
import { updatePageContent, getPageContent } from "../../firebase/pages";
import { uploadFile } from "../../firebase/storage";
import { updateBook } from "../../firebase/books";
import { getAppSettings, updateAppSettings, setUserBookLimit, removeUserBookLimit } from "../../firebase/settings";
import { getAllUnreadCounts, markAsRead } from "../../firebase/notifications";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import StatisticsTab from "./StatisticsTab";
import VideosTab from "./VideosTab";

const AdminPanel = ({ user }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("statistics");
  const [notificationCounts, setNotificationCounts] = useState({
    new_user: 0,
    new_book: 0,
    new_review: 0
  });

  useEffect(() => {
    if (!user || user.role !== "admin") {
      toast.error("Admin icazəsi tələb olunur");
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch notification counts
  useEffect(() => {
    const fetchNotifications = async () => {
      const result = await getAllUnreadCounts();
      if (result.success) {
        setNotificationCounts(result.counts);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle tab change and mark notifications as read
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    
    // Mark notifications as read based on tab
    if (tabId === 'users' && notificationCounts.new_user > 0) {
      await markAsRead('new_user');
      setNotificationCounts(prev => ({ ...prev, new_user: 0 }));
    } else if (tabId === 'books' && notificationCounts.new_book > 0) {
      await markAsRead('new_book');
      setNotificationCounts(prev => ({ ...prev, new_book: 0 }));
    } else if (tabId === 'reviews' && notificationCounts.new_review > 0) {
      await markAsRead('new_review');
      setNotificationCounts(prev => ({ ...prev, new_review: 0 }));
    }
  };

  if (!user || user.role !== "admin") return null;

  const tabs = [
    { id: "statistics", label: "Statistika", icon: BarChart3 },
    { id: "users", label: "İstifadəçilər", icon: Users },
    { id: "books", label: "Kitablar", icon: BookOpen },
    { id: "reviews", label: "Rəylər", icon: MessageSquare },
    { id: "services", label: "Xidmətlər", icon: Briefcase },
    { id: "banners", label: "Bannerlər", icon: Images },
    { id: "videos", label: "Videolar", icon: Video },
    { id: "pages", label: "Səhifələr", icon: FileText },
    { id: "settings", label: "Limitlər", icon: Sliders },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-serif font-semibold">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-1 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 py-2 text-xs md:text-sm relative">
                <tab.icon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Notification Badge */}
                {tab.id === 'users' && notificationCounts.new_user > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {notificationCounts.new_user > 9 ? '9+' : notificationCounts.new_user}
                  </span>
                )}
                {tab.id === 'books' && notificationCounts.new_book > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {notificationCounts.new_book > 9 ? '9+' : notificationCounts.new_book}
                  </span>
                )}
                {tab.id === 'reviews' && notificationCounts.new_review > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {notificationCounts.new_review > 9 ? '9+' : notificationCounts.new_review}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="statistics"><StatisticsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="books"><BooksTab /></TabsContent>
          <TabsContent value="reviews"><ReviewsTab /></TabsContent>
          <TabsContent value="services"><ServicesTab /></TabsContent>
          <TabsContent value="banners"><BannersTab /></TabsContent>
          <TabsContent value="videos"><VideosTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Users Tab
const UsersTab = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingLimit, setEditingLimit] = useState(null);
  const [newLimit, setNewLimit] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const result = await getAllUsers();
    if (result.success) setUsers(result.users);
    setLoading(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast.success("Rol yeniləndi");
      fetchUsers();
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Bu istifadəçini silmək istəyirsiniz?")) return;
    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("Silindi");
      fetchUsers();
    } else {
      toast.error(result.error || "Silmə uğursuz oldu");
    }
  };

  const handleSetLimit = async (userId) => {
    if (!newLimit || parseInt(newLimit) < 0) {
      toast.error("Düzgün limit daxil edin");
      return;
    }
    const result = await setUserBookLimit(userId, parseInt(newLimit));
    if (result.success) {
      toast.success("Limit yeniləndi");
      setEditingLimit(null);
      setNewLimit("");
      fetchUsers();
    } else {
      toast.error("Xəta baş verdi");
    }
  };

  const handleRemoveLimit = async (userId) => {
    const result = await removeUserBookLimit(userId);
    if (result.success) {
      toast.success("Şəxsi limit silindi (ümumi limit tətbiq olunacaq)");
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">İstifadəçilər ({filteredUsers.length})</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" autoComplete="off" />
        </div>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredUsers.map(u => (
          <div key={u.id} className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">
                  {u.account_type === 'business' ? `Biznes: ${u.store_name}` : 'Müəllif'} | 📱 {u.whatsapp || 'Yoxdur'}
                </p>
                <p className="text-xs mt-1">
                  📚 Limit: {u.book_limit !== undefined && u.book_limit !== null ? (
                    <span className="text-blue-600 font-medium">{u.book_limit} (şəxsi)</span>
                  ) : (
                    <span className="text-muted-foreground">Ümumi</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {editingLimit === u.id ? (
                  <div className="flex gap-1 items-center">
                    <Input 
                      type="number" 
                      value={newLimit} 
                      onChange={(e) => setNewLimit(e.target.value)} 
                      className="w-20 h-8 text-sm"
                      placeholder="Limit"
                      min="0"
                    />
                    <Button size="sm" onClick={() => handleSetLimit(u.id)}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingLimit(null); setNewLimit(""); }}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setEditingLimit(u.id); setNewLimit(u.book_limit || ""); }} title="Limit dəyiş">
                    <Sliders className="h-3 w-3 mr-1" /> Limit
                  </Button>
                )}
                {u.book_limit !== undefined && u.book_limit !== null && (
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveLimit(u.id)} title="Şəxsi limiti sil">
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="rounded-lg px-2 py-1 text-sm bg-background border">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Books Tab
const BooksTab = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewingBook, setViewingBook] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, approved

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    const result = await getAllBooks();
    if (result.success) setBooks(result.books);
    setLoading(false);
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Bu kitabı silmək istəyirsiniz?")) return;
    const result = await adminDeleteBook(bookId);
    if (result.success) {
      toast.success("Silindi");
      fetchBooks();
    }
  };

  const handleApprove = async (bookId, approved) => {
    const result = await approveBookAdmin(bookId, approved);
    if (result.success) {
      toast.success(approved ? "Kitab təsdiqləndi" : "Kitab rədd edildi");
      fetchBooks();
    } else {
      toast.error("Xəta baş verdi");
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book.id);
    setEditForm({ title_az: book.title_az || '', author_az: book.author_az || '', price: book.price || 0, category: book.category || '' });
  };

  const handleSaveEdit = async () => {
    const result = await updateBook(editingBook, editForm);
    if (result.success) {
      toast.success("Yeniləndi");
      setEditingBook(null);
      fetchBooks();
    }
  };

  // Filter books
  let filteredBooks = books.filter(b => 
    b.title_az?.toLowerCase().includes(search.toLowerCase()) ||
    b.author_az?.toLowerCase().includes(search.toLowerCase()) ||
    b.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Status filter
  if (filterStatus === "pending") {
    filteredBooks = filteredBooks.filter(b => b.approved !== true);
  } else if (filterStatus === "approved") {
    filteredBooks = filteredBooks.filter(b => b.approved === true);
  }

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Kitablar ({filteredBooks.length})</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm bg-background border"
          >
            <option value="all">Hamısı</option>
            <option value="pending">Təsdiq gözləyir</option>
            <option value="approved">Təsdiqlənib</option>
          </select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Kitab, müəllif, paylaşan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Book viewer modal */}
      {viewingBook && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingBook(null)}>
          <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{viewingBook.title_az}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingBook(null)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {viewingBook.cover_image && (
                  <img src={viewingBook.cover_image} alt={viewingBook.title_az} className="w-full max-h-[400px] object-contain rounded-lg" />
                )}
              </div>
              <div className="space-y-3">
                <p><strong>Müəllif:</strong> {viewingBook.author_az}</p>
                <p><strong>Kateqoriya:</strong> {viewingBook.category}</p>
                <p><strong>Qiymət:</strong> {viewingBook.price > 0 ? `${viewingBook.price} AZN` : 'Pulsuz'}</p>
                <p><strong>Yükləyən:</strong> {viewingBook.user_name || 'Naməlum'}</p>
                <p><strong>WhatsApp:</strong> {viewingBook.user_whatsapp || 'Yoxdur'}</p>
                <p><strong>Baxış:</strong> {viewingBook.views || 0}</p>
                <p><strong>Status:</strong> {viewingBook.approved ? '✅ Təsdiqlənib' : '⏳ Təsdiq gözləyir'}</p>
                {viewingBook.description_az && (
                  <div>
                    <strong>Təsvir:</strong>
                    <p className="text-muted-foreground whitespace-pre-wrap">{viewingBook.description_az}</p>
                  </div>
                )}
                {/* PDF links */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {viewingBook.pdf_file && (
                    <a href={viewingBook.pdf_file} target="_blank" rel="noopener noreferrer">
                      <Button size="sm">📄 Tam PDF</Button>
                    </a>
                  )}
                  {viewingBook.demo_pdf_file && (
                    <a href={viewingBook.demo_pdf_file} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">📄 Demo PDF</Button>
                    </a>
                  )}
                </div>
                {/* Approve/Reject buttons */}
                {!viewingBook.approved && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => { handleApprove(viewingBook.id, true); setViewingBook(null); }} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-2" /> Təsdiqlə
                    </Button>
                    <Button variant="destructive" onClick={() => { handleDelete(viewingBook.id); setViewingBook(null); }}>
                      <Trash2 className="h-4 w-4 mr-2" /> Sil
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredBooks.map(b => (
          <div key={b.id} className={`p-3 rounded-lg ${b.approved ? 'bg-secondary/50' : 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500'}`}>
            {editingBook === b.id ? (
              <div className="space-y-3">
                <Input placeholder="Başlıq" value={editForm.title_az} onChange={(e) => setEditForm({...editForm, title_az: e.target.value})} />
                <Input placeholder="Müəllif" value={editForm.author_az} onChange={(e) => setEditForm({...editForm, author_az: e.target.value})} />
                <Input type="number" placeholder="Qiymət" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Saxla</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingBook(null)}>Ləğv et</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{b.title_az}</p>
                    {b.approved ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✅</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">⏳ Təsdiq gözləyir</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{b.author_az} • {b.price} AZN</p>
                  <p className="text-xs text-green-600">📤 {b.user_name || 'Naməlum'} {b.user_whatsapp && `| 📱 ${b.user_whatsapp}`}</p>
                  <p className="text-xs text-muted-foreground">👁 {b.views || 0} | 📁 {b.category}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setViewingBook(b)} title="Bax">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!b.approved && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(b.id, true)} title="Təsdiqlə">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {b.approved && (
                    <Button size="sm" variant="outline" className="text-amber-600" onClick={() => handleApprove(b.id, false)} title="Təsdiqi ləğv et">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Categories Tab
const CategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    name_az: "", name_en: "", name_ru: "", 
    show_in_menu: true, 
    show_in_filter: true,
    order: 0 
  });
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const result = await getCategories();
    if (result.success) setCategories(result.categories);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name_az) { toast.error("Kateqoriya adı daxil edin"); return; }
    
    const result = await createCategory({ 
      ...form, 
      order: categories.length 
    });
    if (result.success) {
      toast.success("Kateqoriya əlavə edildi");
      setForm({ name_az: "", name_en: "", name_ru: "", show_in_menu: true, show_in_filter: true, order: 0 });
      fetchCategories();
    } else {
      console.error("Category creation failed:", result.error);
      toast.error(result.error || "Xəta baş verdi");
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat.id);
    setForm({
      name_az: cat.name_az || '',
      name_en: cat.name_en || '',
      name_ru: cat.name_ru || '',
      show_in_menu: cat.show_in_menu !== false,
      show_in_filter: cat.show_in_filter !== false,
      order: cat.order || 0
    });
  };

  const handleSaveEdit = async () => {
    const result = await updateCategory(editingCategory, form);
    if (result.success) {
      toast.success("Yeniləndi");
      setEditingCategory(null);
      setForm({ name_az: "", name_en: "", name_ru: "", show_in_menu: true, show_in_filter: true, order: 0 });
      fetchCategories();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu kateqoriyanı silmək istəyirsiniz?")) return;
    const result = await deleteCategory(id);
    if (result.success) {
      toast.success("Silindi");
      fetchCategories();
    }
  };

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6 space-y-6">
      <h2 className="text-lg font-semibold">Kateqoriyalar ({categories.length})</h2>
      
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
        💡 Burada menyuda və filterlərdə görünən kateqoriyaları idarə edə bilərsiniz (PDF kitab, 2-ci əl kitab, Dəftər və s.)
      </div>
      
      {/* Add/Edit Form */}
      <form onSubmit={editingCategory ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleCreate} className="space-y-4 p-4 bg-secondary/30 rounded-xl">
        <h3 className="font-medium">{editingCategory ? 'Redaktə Et' : 'Yeni Kateqoriya'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Ad (AZ) *" value={form.name_az} onChange={(e) => setForm({...form, name_az: e.target.value})} />
          <Input placeholder="Name (EN)" value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value})} />
          <Input placeholder="Название (RU)" value={form.name_ru} onChange={(e) => setForm({...form, name_ru: e.target.value})} />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.show_in_menu} 
              onChange={(e) => setForm({...form, show_in_menu: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm">Menyuda göstər</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.show_in_filter} 
              onChange={(e) => setForm({...form, show_in_filter: e.target.checked})}
              className="w-4 h-4"
            />
            <span className="text-sm">Filterdə göstər</span>
          </label>
          <Input 
            type="number" 
            placeholder="Sıra" 
            value={form.order} 
            onChange={(e) => setForm({...form, order: parseInt(e.target.value) || 0})}
            className="w-24"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{editingCategory ? 'Saxla' : 'Əlavə Et'}</Button>
          {editingCategory && (
            <Button type="button" variant="outline" onClick={() => {
              setEditingCategory(null);
              setForm({ name_az: "", name_en: "", name_ru: "", show_in_menu: true, show_in_filter: true, order: 0 });
            }}>Ləğv</Button>
          )}
        </div>
      </form>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Heç bir kateqoriya yoxdur. Yeni əlavə edin.</p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{cat.name_az}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {cat.name_en && <span>EN: {cat.name_en}</span>}
                  {cat.name_ru && <span>RU: {cat.name_ru}</span>}
                </div>
                <div className="flex gap-2 mt-1">
                  {cat.show_in_menu && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Menyu</span>}
                  {cat.show_in_filter && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Filter</span>}
                  <span className="text-xs text-muted-foreground">Sıra: {cat.order || 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Reviews Tab
const ReviewsTab = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    const result = await getAllReviews();
    if (result.success) setReviews(result.reviews);
    setLoading(false);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Bu rəyi silmək istəyirsiniz?")) return;
    const result = await deleteReview(reviewId);
    if (result.success) {
      toast.success("Silindi");
      fetchReviews();
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">Rəylər ({filteredReviews.length})</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" autoComplete="off" />
        </div>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredReviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Heç bir rəy yoxdur</p>
        ) : (
          filteredReviews.map(r => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-secondary/50 rounded-lg gap-2">
              <div className="flex-1">
                <p className="font-medium">{r.user_name} - ⭐ {r.rating}/5</p>
                <p className="text-sm text-muted-foreground">{r.comment}</p>
                <p className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Services Tab
const ServicesTab = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title_az: "", title_en: "", title_ru: "", description_az: "", description_en: "", description_ru: "", price: 0, whatsapp: "" });
  const [imageFile, setImageFile] = useState(null);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    const result = await getServices();
    if (result.success) setServices(result.services);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title_az) { toast.error("Başlıq daxil edin"); return; }
    
    let imageUrl = "";
    if (imageFile) {
      toast.info("Şəkil yüklənir...");
      const uploadResult = await uploadFile(imageFile, "services");
      if (uploadResult.success) imageUrl = uploadResult.url;
      else { toast.error("Şəkil yüklənə bilmədi"); return; }
    }
    
    const result = await createService({ ...form, image_url: imageUrl });
    if (result.success) {
      toast.success("Əlavə edildi");
      setForm({ title_az: "", title_en: "", title_ru: "", description_az: "", description_en: "", description_ru: "", price: 0, whatsapp: "" });
      setImageFile(null);
      fetchServices();
    }
  };

  const handleEdit = (service) => {
    setEditingService(service.id);
    setForm({
      title_az: service.title_az || '', title_en: service.title_en || '', title_ru: service.title_ru || '',
      description_az: service.description_az || '', description_en: service.description_en || '', description_ru: service.description_ru || '',
      price: service.price || 0, whatsapp: service.whatsapp || ''
    });
  };

  const handleSaveEdit = async () => {
    let updateData = { ...form };
    if (imageFile) {
      const uploadResult = await uploadFile(imageFile, "services");
      if (uploadResult.success) updateData.image_url = uploadResult.url;
    }
    const result = await updateService(editingService, updateData);
    if (result.success) {
      toast.success("Yeniləndi");
      setEditingService(null);
      setForm({ title_az: "", title_en: "", title_ru: "", description_az: "", description_en: "", description_ru: "", price: 0, whatsapp: "" });
      fetchServices();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmək istəyirsiniz?")) return;
    const result = await deleteService(id);
    if (result.success) { toast.success("Silindi"); fetchServices(); }
  };

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6 space-y-6">
      <h2 className="text-lg font-semibold">Xidmətlər ({services.length})</h2>
      
      <form onSubmit={editingService ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleCreate} className="space-y-4 p-4 bg-secondary/30 rounded-xl">
        <h3 className="font-medium">{editingService ? 'Redaktə Et' : 'Yeni Xidmət'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Başlıq (AZ) *" value={form.title_az} onChange={(e) => setForm({...form, title_az: e.target.value})} />
          <Input placeholder="Title (EN)" value={form.title_en} onChange={(e) => setForm({...form, title_en: e.target.value})} />
          <Input placeholder="Название (RU)" value={form.title_ru} onChange={(e) => setForm({...form, title_ru: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Textarea placeholder="Təsvir (AZ)" value={form.description_az} onChange={(e) => setForm({...form, description_az: e.target.value})} rows={2} />
          <Textarea placeholder="Description (EN)" value={form.description_en} onChange={(e) => setForm({...form, description_en: e.target.value})} rows={2} />
          <Textarea placeholder="Описание (RU)" value={form.description_ru} onChange={(e) => setForm({...form, description_ru: e.target.value})} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input type="number" placeholder="Qiymət (AZN)" value={form.price} onChange={(e) => setForm({...form, price: parseFloat(e.target.value) || 0})} />
          <Input placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp: e.target.value})} />
        </div>
        <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
        <div className="flex gap-2">
          <Button type="submit">{editingService ? 'Saxla' : 'Əlavə Et'}</Button>
          {editingService && <Button type="button" variant="outline" onClick={() => { setEditingService(null); setForm({ title_az: "", title_en: "", title_ru: "", description_az: "", description_en: "", description_ru: "", price: 0, whatsapp: "" }); }}>Ləğv</Button>}
        </div>
      </form>

      <div className="space-y-2">
        {services.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-3">
              {s.image_url && <img src={s.image_url} alt="" className="w-12 h-12 object-cover rounded" />}
              <div>
                <p className="font-medium">{s.title_az}</p>
                <p className="text-sm text-muted-foreground">{s.price} AZN</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(s)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Banners Tab
const BannersTab = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    const result = await getBanners();
    if (result.success) setBanners(result.banners);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imageFile) { toast.error("Şəkil seçin"); return; }
    setUploading(true);
    const uploadResult = await uploadFile(imageFile, "banners");
    if (uploadResult.success) {
      const result = await createBanner({ image_url: uploadResult.url, order: banners.length });
      if (result.success) { toast.success("Əlavə edildi"); setImageFile(null); fetchBanners(); }
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Silmək istəyirsiniz?")) return;
    const result = await deleteBanner(id);
    if (result.success) { toast.success("Silindi"); fetchBanners(); }
  };

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6 space-y-6">
      <h2 className="text-lg font-semibold">Bannerlər ({banners.length})</h2>
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
        <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="flex-1" />
        <Button type="submit" disabled={uploading}>{uploading ? 'Yüklənir...' : 'Əlavə Et'}</Button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {banners.map(b => (
          <div key={b.id} className="relative group">
            <img src={b.image_url} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
            <Button size="sm" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => handleDelete(b.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pages Tab - 3 Languages with Hero Section and Image Upload
const PagesTab = () => {
  const [selectedPage, setSelectedPage] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [pageData, setPageData] = useState({
    title_az: "", title_en: "", title_ru: "",
    content_az: "", content_en: "", content_ru: "",
    image_url: ""
  });

  // Default values for hero section
  const defaultHeroData = {
    title_az: "Kitablarınızı paylaşın və kəşf edin",
    title_en: "Share and discover your books",
    title_ru: "Делитесь и открывайте свои книги",
    content_az: "Azərbaycanın ən böyük elektron kitab platforması. Kitablarınızı satın və yeni kitablar kəşf edin.",
    content_en: "Azerbaijan's largest e-book platform. Sell your books and discover new ones.",
    content_ru: "Крупнейшая платформа электронных книг Азербайджана. Продавайте свои книги и открывайте новые.",
    image_url: ""
  };

  useEffect(() => { fetchPage(); }, [selectedPage]);

  const fetchPage = async () => {
    setLoading(true);
    setImageFile(null);
    setImagePreview("");
    try {
      const [az, en, ru] = await Promise.all([
        getPageContent(selectedPage, "az"),
        getPageContent(selectedPage, "en"),
        getPageContent(selectedPage, "ru")
      ]);
      
      // Use defaults for hero if not found
      const defaults = selectedPage === 'hero' ? defaultHeroData : {
        title_az: "", title_en: "", title_ru: "",
        content_az: "", content_en: "", content_ru: "",
        image_url: ""
      };
      
      const imgUrl = az.page?.image_url || "";
      setPageData({
        title_az: az.page?.title || defaults.title_az,
        title_en: en.page?.title || defaults.title_en,
        title_ru: ru.page?.title || defaults.title_ru,
        content_az: az.page?.content || defaults.content_az,
        content_en: en.page?.content || defaults.content_en,
        content_ru: ru.page?.content || defaults.content_ru,
        image_url: imgUrl
      });
      setImagePreview(imgUrl);
    } catch (error) {
      console.error(error);
      if (selectedPage === 'hero') {
        setPageData(defaultHeroData);
      }
    }
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = pageData.image_url;
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        const uploadResult = await uploadFile(imageFile, "pages");
        if (uploadResult.success) {
          finalImageUrl = uploadResult.url;
        } else {
          toast.error("Şəkil yüklənə bilmədi");
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }
      
      const result = await updatePageContent(selectedPage, {
        ...pageData,
        image_url: finalImageUrl
      });
      
      if (result.success) {
        toast.success("Saxlanıldı");
        setPageData(prev => ({ ...prev, image_url: finalImageUrl }));
        setImageFile(null);
      } else {
        toast.error("Xəta");
      }
    } catch (error) {
      toast.error("Xəta baş verdi");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6 space-y-6">
      <h2 className="text-lg font-semibold">Səhifə Məzmunu (3 dil)</h2>
      
      <div className="flex gap-2 flex-wrap">
        <Button variant={selectedPage === "hero" ? "default" : "outline"} onClick={() => setSelectedPage("hero")} size="sm">
          🏠 Ana Səhifə (Hero)
        </Button>
        <Button variant={selectedPage === "haqqimizda" ? "default" : "outline"} onClick={() => setSelectedPage("haqqimizda")} size="sm">
          📄 Haqqımızda
        </Button>
      </div>

      {selectedPage === "hero" && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          💡 Ana səhifənin başlığı, alt yazısı və sağ tərəfdəki şəklini buradan dəyişə bilərsiniz.
        </div>
      )}

      {/* Hero Image Upload - Only for hero page */}
      {selectedPage === "hero" && (
        <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
          <h3 className="font-medium">🖼️ Hero Şəkli (Sağ tərəf)</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
              <Label>Şəkil Yüklə</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tövsiyə olunan ölçü: 600x400 piksel
              </p>
            </div>
            {imagePreview && (
              <div className="w-40 h-28 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Azerbaijani */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
          <h3 className="font-medium">🇦🇿 Azərbaycan</h3>
          <div>
            <Label>{selectedPage === "hero" ? "Başlıq (Hero)" : "Başlıq"}</Label>
            <Input 
              value={pageData.title_az} 
              onChange={(e) => setPageData({...pageData, title_az: e.target.value})}
              placeholder={selectedPage === "hero" ? "Kitablarınızı paylaşın və kəşf edin" : ""}
            />
          </div>
          <div>
            <Label>{selectedPage === "hero" ? "Təsvir (Alt yazı)" : "Məzmun"}</Label>
            <Textarea 
              rows={selectedPage === "hero" ? 3 : 8} 
              value={pageData.content_az} 
              onChange={(e) => setPageData({...pageData, content_az: e.target.value})}
              placeholder={selectedPage === "hero" ? "Azərbaycanın ən böyük elektron kitab platforması..." : ""}
            />
          </div>
        </div>

        {/* English */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
          <h3 className="font-medium">🇬🇧 English</h3>
          <div>
            <Label>{selectedPage === "hero" ? "Title (Hero)" : "Title"}</Label>
            <Input 
              value={pageData.title_en} 
              onChange={(e) => setPageData({...pageData, title_en: e.target.value})}
              placeholder={selectedPage === "hero" ? "Share and discover your books" : ""}
            />
          </div>
          <div>
            <Label>{selectedPage === "hero" ? "Description (Subtitle)" : "Content"}</Label>
            <Textarea 
              rows={selectedPage === "hero" ? 3 : 8} 
              value={pageData.content_en} 
              onChange={(e) => setPageData({...pageData, content_en: e.target.value})}
              placeholder={selectedPage === "hero" ? "Azerbaijan's largest e-book platform..." : ""}
            />
          </div>
        </div>

        {/* Russian */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
          <h3 className="font-medium">🇷🇺 Русский</h3>
          <div>
            <Label>{selectedPage === "hero" ? "Заголовок (Hero)" : "Название"}</Label>
            <Input 
              value={pageData.title_ru} 
              onChange={(e) => setPageData({...pageData, title_ru: e.target.value})}
              placeholder={selectedPage === "hero" ? "Делитесь и открывайте свои книги" : ""}
            />
          </div>
          <div>
            <Label>{selectedPage === "hero" ? "Описание (Подзаголовок)" : "Содержание"}</Label>
            <Textarea 
              rows={selectedPage === "hero" ? 3 : 8} 
              value={pageData.content_ru} 
              onChange={(e) => setPageData({...pageData, content_ru: e.target.value})}
              placeholder={selectedPage === "hero" ? "Крупнейшая платформа электронных книг..." : ""}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || uploading}>
        {uploading ? "Şəkil yüklənir..." : saving ? "Saxlanılır..." : "Yadda Saxla"}
      </Button>
    </div>
  );
};

// Settings Tab - Book Limits
const SettingsTab = () => {
  const [settings, setSettings] = useState({ default_book_limit: 20 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLimit, setNewLimit] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const result = await getAppSettings();
    if (result.success) {
      setSettings(result.settings);
      setNewLimit(result.settings.default_book_limit?.toString() || "20");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newLimit || parseInt(newLimit) < 1) {
      toast.error("Düzgün limit daxil edin (minimum 1)");
      return;
    }
    
    setSaving(true);
    const result = await updateAppSettings({ default_book_limit: parseInt(newLimit) });
    if (result.success) {
      toast.success("Ümumi limit yeniləndi");
      setSettings({ ...settings, default_book_limit: parseInt(newLimit) });
    } else {
      toast.error("Xəta baş verdi");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8">Yüklənir...</div>;

  return (
    <div className="border border-border rounded-2xl p-4 md:p-6 space-y-6">
      <h2 className="text-lg font-semibold">Kitab Limitləri</h2>
      
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 Burada bütün istifadəçilər üçün ümumi kitab limitini təyin edə bilərsiniz. 
          Şəxsi limit təyin etmək üçün "İstifadəçilər" bölməsindən istifadə edin.
        </p>
      </div>

      <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
        <div className="space-y-2">
          <Label className="text-base font-medium">Ümumi Kitab Limiti</Label>
          <p className="text-sm text-muted-foreground">
            Şəxsi limiti olmayan bütün istifadəçilərə tətbiq olunur
          </p>
          <div className="flex gap-3 items-center">
            <Input 
              type="number" 
              value={newLimit} 
              onChange={(e) => setNewLimit(e.target.value)} 
              className="w-32"
              min="1"
              max="1000"
            />
            <span className="text-muted-foreground">kitab</span>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saxlanılır..." : "Yadda Saxla"}
        </Button>
      </div>

      <div className="p-4 bg-secondary/30 rounded-xl">
        <h3 className="font-medium mb-2">Limit Sistemi Necə İşləyir?</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Hər istifadəçi maksimum {settings.default_book_limit} kitab yükləyə bilər</li>
          <li>Limit dolduqda istifadəçi köhnə kitabı silib yenisini yükləyə bilər</li>
          <li>"İstifadəçilər" bölməsindən şəxsi limit təyin edə bilərsiniz</li>
          <li>Şəxsi limit ümumi limitdən üstün tutulur</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPanel;
