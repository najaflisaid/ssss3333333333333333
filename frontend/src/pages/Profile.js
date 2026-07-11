import { useState, useEffect } from "react";
import { updateUserProfile } from "../firebase/auth";
import { getBooks } from "../firebase/books";
import { getUserBookLimit } from "../firebase/settings";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { FaWhatsapp } from "react-icons/fa";
import { Mail, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = ({ user, onUserUpdate }) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    whatsapp: user?.whatsapp || "",
    store_name: user?.store_name || "",
    contact_preference: user?.contact_preference || "whatsapp" // whatsapp or email
  });
  const [saving, setSaving] = useState(false);
  
  // Book limit state
  const [bookLimit, setBookLimit] = useState(20);
  const [bookCount, setBookCount] = useState(0);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      if (!user) return;
      try {
        const limitResult = await getUserBookLimit(user.id);
        if (limitResult.success) setBookLimit(limitResult.limit);
        
        const booksResult = await getBooks({ user_id: user.id, includeUnapproved: true });
        if (booksResult.success) setBookCount(booksResult.books.length);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLimitInfo();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateUserProfile(user.id, formData);
      if (result.success) {
        // Update user's books with new contact preference
        const { updateUserBooksContact } = await import("../firebase/books");
        await updateUserBooksContact(user.id, {
          user_whatsapp: formData.whatsapp,
          user_email: user.email,
          user_contact_preference: formData.contact_preference
        });
        
        onUserUpdate({ ...user, ...formData });
        toast.success(language === 'az' ? 'Profil və bütün kitablarınız yeniləndi' : 'Profile and all your books updated');
      } else {
        toast.error(language === 'az' ? 'Profil yenilənə bilmədi' : 'Failed to update profile');
      }
    } catch (error) {
      toast.error(language === 'az' ? 'Xəta baş verdi' : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif font-semibold mb-8">
          {language === 'az' ? 'Profil' : language === 'en' ? 'Profile' : 'Профиль'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-2xl p-8 bg-card">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="rounded-full bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'az' ? 'Ad' : language === 'en' ? 'Name' : 'Имя'}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="rounded-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="+994XXXXXXXXX"
              className="rounded-full"
            />
          </div>

          {/* Contact Preference */}
          <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
            <Label className="text-base font-medium">
              {language === 'az' ? 'Sifarişləri necə almaq istəyirsiniz?' : 
               language === 'en' ? 'How do you want to receive orders?' : 
               'Как вы хотите получать заказы?'}
            </Label>
            <RadioGroup 
              value={formData.contact_preference} 
              onValueChange={(value) => setFormData({...formData, contact_preference: value})}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="whatsapp" id="pref_whatsapp" />
                <Label htmlFor="pref_whatsapp" className="cursor-pointer flex items-center gap-2 flex-1">
                  <FaWhatsapp className="h-5 w-5 text-green-500" />
                  <span>WhatsApp</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="email" id="pref_email" />
                <Label htmlFor="pref_email" className="cursor-pointer flex items-center gap-2 flex-1">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <span>Email</span>
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {language === 'az' ? 'Müştərilər kitablarınızı sifariş edərkən seçdiyiniz üsulla sizinlə əlaqə saxlayacaq' :
               language === 'en' ? 'Customers will contact you via your preferred method when ordering your books' :
               'Клиенты будут связываться с вами выбранным способом при заказе книг'}
            </p>
          </div>

          {user?.account_type === "business" && (
            <div className="space-y-2">
              <Label htmlFor="store_name">
                {language === 'az' ? 'Mağaza Adı' : language === 'en' ? 'Store Name' : 'Название магазина'}
              </Label>
              <Input
                id="store_name"
                name="store_name"
                value={formData.store_name}
                onChange={handleChange}
                className="rounded-full"
              />
            </div>
          )}

          {/* Book Limit Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="font-medium">
                {language === 'az' ? 'Kitab Limiti' : language === 'en' ? 'Book Limit' : 'Лимит книг'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{bookCount} / {bookLimit}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'az' ? 'kitab yüklənib' : language === 'en' ? 'books uploaded' : 'книг загружено'}
                </p>
              </div>
              <Link to="/my-books">
                <Button variant="outline" size="sm" className="rounded-full">
                  {language === 'az' ? 'Kitablarım' : language === 'en' ? 'My Books' : 'Мои книги'}
                </Button>
              </Link>
            </div>
            {bookCount >= bookLimit && (
              <p className="text-sm text-red-600 mt-2">
                {language === 'az' ? '⚠️ Limitiniz dolub. Yeni kitab yükləmək üçün mövcud kitabdan birini silin.' :
                 language === 'en' ? '⚠️ Limit reached. Delete an existing book to upload a new one.' :
                 '⚠️ Лимит исчерпан. Удалите существующую книгу, чтобы загрузить новую.'}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              {language === 'az' ? 'Hesab növü' : language === 'en' ? 'Account type' : 'Тип аккаунта'}:
              <span className="font-medium ml-2">
                {user?.account_type === "business" 
                  ? (language === 'az' ? 'Biznes' : 'Business')
                  : (language === 'az' ? 'Müəllif' : 'Author')}
              </span>
            </p>
            {user?.role === "admin" && (
              <p className="text-sm text-green-600 font-medium">
                {language === 'az' ? 'Admin hesabı' : 'Admin account'}
              </p>
            )}
          </div>

          <Button type="submit" className="rounded-full" disabled={saving}>
            {saving 
              ? (language === 'az' ? 'Saxlanılır...' : 'Saving...')
              : (language === 'az' ? 'Yadda Saxla' : 'Save Changes')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
