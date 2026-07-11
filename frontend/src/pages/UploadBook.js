import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createBook, getBooks } from "../firebase/books";
import { uploadFile } from "../firebase/storage";
import { getUserBookLimit } from "../firebase/settings";
import { createNotification } from "../firebase/notifications";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { AlertCircle } from "lucide-react";

// Sabit kateqoriyalar
const CATEGORIES = [
  { id: "kitab", name_az: "Kitab", name_en: "Book", name_ru: "Книга" },
  { id: "pdf_pullu", name_az: "PDF Kitab (Pullu)", name_en: "PDF Book (Paid)", name_ru: "PDF Книга (Платная)" },
  { id: "pdf_pulsuz", name_az: "PDF Kitab (Pulsuz)", name_en: "PDF Book (Free)", name_ru: "PDF Книга (Бесплатная)" },
  { id: "ikinci_el", name_az: "2-ci əl kitab", name_en: "Second Hand Book", name_ru: "Б/У книга" },
];

const UploadBook = ({ user }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title_az: "",
    title_en: "",
    title_ru: "",
    author_az: user?.account_type === "author" ? user?.name || "" : "",
    author_en: "",
    author_ru: "",
    description_az: "",
    description_en: "",
    description_ru: "",
    category: "",
    price: "",
    // Additional fields for paid books
    publication_year: "",
    publication_place: "",
    publisher: "",
    isbn: "",
    translator: "",
    scientific_editor: "",
    editor: "",
    reviewer: "",
    pages: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [demoPdfFile, setDemoPdfFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("az");
  
  // Book limit state
  const [bookLimit, setBookLimit] = useState(20);
  const [currentBookCount, setCurrentBookCount] = useState(0);
  const [limitLoading, setLimitLoading] = useState(true);

  // Check user's book limit on mount
  useEffect(() => {
    const checkLimit = async () => {
      if (!user) return;
      
      try {
        // Get user's limit
        const limitResult = await getUserBookLimit(user.id);
        if (limitResult.success) {
          setBookLimit(limitResult.limit);
        }
        
        // Get user's current book count (including unapproved)
        const booksResult = await getBooks({ user_id: user.id, includeUnapproved: true });
        if (booksResult.success) {
          setCurrentBookCount(booksResult.books.length);
        }
      } catch (error) {
        console.error("Error checking limit:", error);
      } finally {
        setLimitLoading(false);
      }
    };
    
    checkLimit();
  }, [user]);

  const canUpload = currentBookCount < bookLimit;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Kateqoriyaya görə hansı sahələr lazımdır
  const needsPrice = () => {
    return ["kitab", "pdf_pullu", "ikinci_el"].includes(formData.category);
  };

  const needsFullPdf = () => {
    return formData.category === "pdf_pulsuz";
  };

  const needsDemoPdf = () => {
    // Pullu PDF artıq demo istəmir, yalnız üz qabığı
    return false;
  };

  const needsCoverOnly = () => {
    return ["kitab", "ikinci_el", "pdf_pullu"].includes(formData.category);
  };

  const isPaid = () => {
    return ["kitab", "pdf_pullu", "ikinci_el"].includes(formData.category);
  };

  // Check if additional book info fields should be shown (only for Kitab and PDF Pullu)
  const needsAdditionalInfo = () => {
    return ["kitab", "pdf_pullu"].includes(formData.category);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check book limit first
    if (!canUpload) {
      toast.error(
        language === 'az' ? `Kitab limitiniz (${bookLimit}) dolub. Yeni kitab yükləmək üçün mövcud kitablardan birini silin.` :
        language === 'en' ? `Your book limit (${bookLimit}) is reached. Delete an existing book to upload a new one.` :
        `Ваш лимит книг (${bookLimit}) исчерпан. Удалите существующую книгу, чтобы загрузить новую.`
      );
      return;
    }
    
    // Validation
    if (!formData.title_az) {
      toast.error(t('titleRequired'));
      return;
    }
    
    if (!formData.author_az) {
      toast.error(t('authorRequired'));
      return;
    }

    if (!formData.category) {
      toast.error(language === 'az' ? 'Kateqoriya seçin' : 'Select category');
      return;
    }
    
    if (!coverImage) {
      toast.error(t('coverRequired'));
      return;
    }

    // Qiymət yoxlaması
    if (needsPrice() && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast.error(language === 'az' ? 'Qiymət daxil edin' : 'Enter price');
      return;
    }
    
    // PDF yoxlaması
    if (needsFullPdf() && !pdfFile) {
      toast.error(language === 'az' ? 'Tam PDF fayl yükləyin' : 'Upload full PDF file');
      return;
    }

    setLoading(true);

    try {
      let pdfUrl = null;
      let demoPdfUrl = null;
      let coverUrl = null;

      // Upload cover image
      toast.info('Üz şəkli yüklənir...');
      const coverResult = await uploadFile(coverImage, 'covers');
      if (!coverResult.success) {
        throw new Error('Üz şəkli yüklənə bilmədi');
      }
      coverUrl = coverResult.url;

      // Upload full PDF for free PDF
      if (needsFullPdf() && pdfFile) {
        toast.info('PDF yüklənir...');
        const pdfResult = await uploadFile(pdfFile, 'pdfs');
        if (!pdfResult.success) {
          throw new Error('PDF yüklənə bilmədi');
        }
        pdfUrl = pdfResult.url;
      }

      // Calculate PDF size
      let pdfSize = null;
      if (pdfFile) {
        pdfSize = `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB`;
      }

      // Kateqoriya adını tap
      const categoryObj = CATEGORIES.find(c => c.id === formData.category);
      const categoryName = categoryObj ? categoryObj.name_az : formData.category;

      // Create book in Firestore
      const bookData = {
        title_az: formData.title_az,
        title_en: formData.title_en,
        title_ru: formData.title_ru,
        author_az: formData.author_az,
        author_en: formData.author_en,
        author_ru: formData.author_ru,
        description_az: formData.description_az,
        description_en: formData.description_en,
        description_ru: formData.description_ru,
        category: categoryName,
        category_id: formData.category,
        price: needsPrice() ? parseFloat(formData.price) : 0,
        is_paid: isPaid(),
        pdf_file: pdfUrl,
        demo_pdf_file: demoPdfUrl,
        cover_image: coverUrl,
        pdf_size: pdfSize,
        user_id: user.id,
        user_name: user.name,
        user_whatsapp: user.whatsapp || "",
        user_email: user.email || "",
        user_contact_preference: user.contact_preference || "whatsapp",
        // Additional book info fields (optional)
        publication_year: formData.publication_year || "",
        publication_place: formData.publication_place || "",
        publisher: formData.publisher || "",
        isbn: formData.isbn || "",
        translator: formData.translator || "",
        scientific_editor: formData.scientific_editor || "",
        editor: formData.editor || "",
        reviewer: formData.reviewer || "",
        pages: formData.pages || "",
      };

      const result = await createBook(bookData);
      
      if (result.success) {
        // Create notification for new book upload
        await createNotification('new_book', {
          book_title: formData.title_az,
          book_author: formData.author_az,
          book_category: categoryName,
          user_name: user.name,
          user_email: user.email
        });
        
        // Send notification to admin via Web3Forms (silently, user won't see any notification)
        fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: process.env.REACT_APP_WEB3FORMS_KEY || "3556b4ee-8b17-4ad6-b0ab-ecdad73e0d07",
            subject: `Yeni kitab yuklendi - ${formData.title_az}`,
            from_name: "Epagesaz Platform",
            replyto: user.email || "noreply@epagesaz.com",
            message: `
Yeni kitab platformaya yuklendi ve admin tesdiqi gozleyir.

KITAB MELUMATLARI:
------------------
Kitabin adi: ${formData.title_az}
Muellif: ${formData.author_az}
Kateqoriya: ${categoryName}
Qiymet: ${needsPrice() ? formData.price + ' AZN' : 'Pulsuz'}
${formData.description_az ? 'Tesvir: ' + formData.description_az.substring(0, 150) : ''}

YUKLEYEN ISTIFADECI:
--------------------
Ad: ${user.name}
Email: ${user.email || 'Qeyd edilmeyib'}
WhatsApp: ${user.whatsapp ? '+994' + user.whatsapp : 'Qeyd edilmeyib'}

ELAVE MELUMATLAR:
-----------------
${formData.publication_year ? 'Nesr ili: ' + formData.publication_year + '\n' : ''}${formData.publisher ? 'Nesriyyat: ' + formData.publisher + '\n' : ''}${formData.isbn ? 'ISBN: ' + formData.isbn + '\n' : ''}${pdfSize ? 'PDF olcusu: ' + pdfSize + '\n' : ''}
Bu kitab admin tesdiqi gozleyir.

Admin panel linki: ${window.location.origin}/admin
            `
          })
        }).catch(err => {
          // Silent fail - don't show error to user
          console.log("Admin notification failed (silent):", err);
        });

        toast.success(language === 'az' ? 'Kitab yükləndi! Admin təsdiqi gözlənilir.' : 'Book uploaded! Waiting for admin approval.');
        navigate('/my-books');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error.message || 'Kitab yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-serif font-semibold mb-2">{t('uploadBook')}</h1>
          <p className="text-muted-foreground">
            {language === 'az' && 'Kitabınızı paylaşın və satışa çıxarın'}
            {language === 'en' && 'Share your book and put it up for sale'}
            {language === 'ru' && 'Поделитесь своей книгой и выставьте ее на продажу'}
          </p>
        </div>
        
        {/* Book Limit Info */}
        {!limitLoading && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${canUpload ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <AlertCircle className={`h-5 w-5 ${canUpload ? 'text-blue-500' : 'text-red-500'}`} />
            <div>
              <p className={`font-medium ${canUpload ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                {language === 'az' ? `Kitab limiti: ${currentBookCount}/${bookLimit}` :
                 language === 'en' ? `Book limit: ${currentBookCount}/${bookLimit}` :
                 `Лимит книг: ${currentBookCount}/${bookLimit}`}
              </p>
              {!canUpload && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {language === 'az' ? 'Limitiniz dolub. Yeni kitab yükləmək üçün "Kitablarım" bölməsindən bir kitab silin.' :
                   language === 'en' ? 'Limit reached. Delete a book from "My Books" to upload a new one.' :
                   'Лимит исчерпан. Удалите книгу из "Мои книги", чтобы загрузить новую.'}
                </p>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-2xl p-8 bg-card">
          {/* Kateqoriya seçimi - ən üstdə */}
          <div className="space-y-2 p-4 bg-primary/5 rounded-xl">
            <Label htmlFor="category" className="text-lg font-medium">{t('category')} *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger className="rounded-full text-base">
                <SelectValue placeholder={language === 'az' ? 'Kateqoriya seçin' : 'Select category'} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'az' ? cat.name_az : language === 'en' ? cat.name_en : cat.name_ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Kateqoriya izahı */}
            {formData.category && (
              <p className="text-sm text-muted-foreground mt-2">
                {formData.category === 'kitab' && (language === 'az' ? '📚 Fiziki kitab - Yalnız üz şəkli və qiymət tələb olunur' : '📚 Physical book - Only cover image and price required')}
                {formData.category === 'pdf_pullu' && (language === 'az' ? '💰 Pullu PDF - Yalnız üz şəkli və qiymət tələb olunur' : '💰 Paid PDF - Only cover image and price required')}
                {formData.category === 'pdf_pulsuz' && (language === 'az' ? '🆓 Pulsuz PDF - Tam PDF tələb olunur, qiymət yoxdur' : '🆓 Free PDF - Full PDF required, no price')}
                {formData.category === 'ikinci_el' && (language === 'az' ? '♻️ 2-ci əl kitab - Yalnız üz şəkli və qiymət tələb olunur' : '♻️ Second hand - Only cover image and price required')}
              </p>
            )}
          </div>

          {/* Language Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="az">🇦🇿 Azərbaycan</TabsTrigger>
              <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
              <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
            </TabsList>
            
            {/* Azerbaijani Tab */}
            <TabsContent value="az" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="title_az">Kitabın Adı (Azərbaycan) *</Label>
                <Input id="title_az" name="title_az" type="text" value={formData.title_az} onChange={handleChange} required className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author_az">Müəllif (Azərbaycan) *</Label>
                <Input id="author_az" name="author_az" type="text" value={formData.author_az} onChange={handleChange} required className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_az">Təsvir (Azərbaycan)</Label>
                <Textarea id="description_az" name="description_az" value={formData.description_az} onChange={handleChange} rows={4} className="rounded-2xl" />
              </div>
            </TabsContent>
            
            {/* English Tab */}
            <TabsContent value="en" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="title_en">Book Title (English) - optional</Label>
                <Input id="title_en" name="title_en" type="text" value={formData.title_en} onChange={handleChange} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author_en">Author (English) - optional</Label>
                <Input id="author_en" name="author_en" type="text" value={formData.author_en} onChange={handleChange} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">Description (English) - optional</Label>
                <Textarea id="description_en" name="description_en" value={formData.description_en} onChange={handleChange} rows={4} className="rounded-2xl" />
              </div>
            </TabsContent>
            
            {/* Russian Tab */}
            <TabsContent value="ru" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="title_ru">Название книги (Русский) - необязательно</Label>
                <Input id="title_ru" name="title_ru" type="text" value={formData.title_ru} onChange={handleChange} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author_ru">Автор (Русский) - необязательно</Label>
                <Input id="author_ru" name="author_ru" type="text" value={formData.author_ru} onChange={handleChange} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ru">Описание (Русский) - необязательно</Label>
                <Textarea id="description_ru" name="description_ru" value={formData.description_ru} onChange={handleChange} rows={4} className="rounded-2xl" />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Dynamic Fields based on category */}
          <div className="space-y-4 pt-4 border-t border-border">
            
            {/* Qiymət - Kitab, Pullu PDF, 2-ci əl üçün */}
            {needsPrice() && (
              <div className="space-y-2">
                <Label htmlFor="price">{t('price')} (AZN) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="rounded-full"
                  placeholder={language === 'az' ? 'Qiymət daxil edin' : 'Enter price'}
                />
              </div>
            )}
            
            {/* Tam PDF - Yalnız Pulsuz PDF üçün */}
            {needsFullPdf() && (
              <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Label htmlFor="pdf">
                  {language === 'az' ? '📄 Tam PDF Fayl *' : '📄 Full PDF File *'}
                </Label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  required
                  className="rounded-full"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'az' ? 'Pulsuz PDF üçün tam fayl yükləyin. İstifadəçilər pulsuz yükləyə biləcək.' : 'Upload full file for free PDF. Users can download for free.'}
                </p>
              </div>
            )}
            
            {/* Üz şəkli - Hamı üçün */}
            <div className="space-y-2">
              <Label htmlFor="cover">
                {language === 'az' ? '🖼️ Üz Şəkli *' : '🖼️ Cover Image *'}
              </Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files[0])}
                required
                className="rounded-full"
              />
            </div>

            {/* Additional Book Information - Only for Kitab and PDF Pullu */}
            {needsAdditionalInfo() && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-base font-semibold">
                    {language === 'az' ? 'Əlavə Məlumatlar (İstəyə bağlı)' : 
                     language === 'en' ? 'Additional Information (Optional)' : 
                     'Дополнительная информация (необязательно)'}
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publication_year">
                      {language === 'az' ? 'Nəşr ili' : language === 'en' ? 'Publication Year' : 'Год издания'}
                    </Label>
                    <Textarea
                      id="publication_year"
                      name="publication_year"
                      value={formData.publication_year}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                      placeholder={language === 'az' ? 'Məsələn: 2024' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publication_place">
                      {language === 'az' ? 'Nəşr olunduğu yer' : language === 'en' ? 'Place of Publication' : 'Место издания'}
                    </Label>
                    <Textarea
                      id="publication_place"
                      name="publication_place"
                      value={formData.publication_place}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                      placeholder={language === 'az' ? 'Məsələn: Bakı' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publisher">
                      {language === 'az' ? 'Nəşriyyat' : language === 'en' ? 'Publisher' : 'Издательство'}
                    </Label>
                    <Textarea
                      id="publisher"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                      placeholder={language === 'az' ? 'Nəşriyyatın adı' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Textarea
                      id="isbn"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                      placeholder="978-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="translator">
                      {language === 'az' ? 'Tərcüməçi' : language === 'en' ? 'Translator' : 'Переводчик'}
                    </Label>
                    <Textarea
                      id="translator"
                      name="translator"
                      value={formData.translator}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scientific_editor">
                      {language === 'az' ? 'Elmi redaktor' : language === 'en' ? 'Scientific Editor' : 'Научный редактор'}
                    </Label>
                    <Textarea
                      id="scientific_editor"
                      name="scientific_editor"
                      value={formData.scientific_editor}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editor">
                      {language === 'az' ? 'Redaktor' : language === 'en' ? 'Editor' : 'Редактор'}
                    </Label>
                    <Textarea
                      id="editor"
                      name="editor"
                      value={formData.editor}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewer">
                      {language === 'az' ? 'Rəyçi' : language === 'en' ? 'Reviewer' : 'Рецензент'}
                    </Label>
                    <Textarea
                      id="reviewer"
                      name="reviewer"
                      value={formData.reviewer}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pages">
                      {language === 'az' ? 'Səhifə sayı' : language === 'en' ? 'Number of Pages' : 'Количество страниц'}
                    </Label>
                    <Textarea
                      id="pages"
                      name="pages"
                      value={formData.pages}
                      onChange={handleChange}
                      rows={2}
                      className="rounded-xl resize-none"
                      placeholder={language === 'az' ? 'Məsələn: 256' : ''}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full rounded-full"
            disabled={loading || !formData.category}
          >
            {loading ? (language === 'az' ? 'Yüklənir...' : 'Uploading...') : t('uploadBook')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default UploadBook;
