import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../firebase/auth";
import { createNotification } from "../firebase/notifications";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../styles/phone-input.css";

const Register = ({ onLogin }) => {
  const { t, language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "", // Full international phone (digits only, incl. country code)
    account_type: "author",
    store_name: ""
  });
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhoneChange = (value) => {
    // value is digits only from react-phone-input-2 (no plus sign)
    setFormData((prev) => ({ ...prev, phone: value || "" }));
  };

  const handleAccountTypeChange = (value) => {
    setFormData({ ...formData, account_type: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!copyrightAgreed) {
      toast.error(t('copyrightRequired'));
      return;
    }
    
    // Phone validation - if provided, must be at least 8 digits (international)
    if (formData.phone && formData.phone.length < 8) {
      toast.error(
        language === 'az' ? 'Telefon nömrəsi tam deyil' :
        language === 'en' ? 'Phone number is incomplete' :
        'Номер телефона неполный'
      );
      return;
    }
    
    if (formData.account_type === "business" && !formData.store_name) {
      toast.error(t('storeNameRequired'));
      return;
    }

    setLoading(true);

    try {
      // Full phone number in E.164 format with +
      const fullPhone = formData.phone ? `+${formData.phone}` : "";
      
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        formData.account_type,
        formData.store_name,
        fullPhone
      );

      if (result.success) {
        // Create notification for new user registration
        await createNotification('new_user', {
          user_name: formData.name,
          user_email: formData.email,
          account_type: formData.account_type
        });
        
        onLogin(result.user);
        toast.success(t('registerSuccess'));
        navigate('/');
      } else {
        toast.error(result.error || t('registerFailed'));
      }
    } catch (error) {
      toast.error(t('registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-semibold mb-2">{t('register')}</h1>
          <p className="text-muted-foreground">{t('createAccount')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-2xl p-8 bg-card">
          {/* Account Type */}
          <div className="space-y-3">
            <Label>{t('accountType')}</Label>
            <RadioGroup value={formData.account_type} onValueChange={handleAccountTypeChange}>
              <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="author" id="author" />
                <Label htmlFor="author" className="cursor-pointer flex-1">
                  <div className="font-semibold">{t('authorAccount')}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'az' ? 'Öz kitablarınızı paylaşın' : language === 'en' ? 'Share your own books' : 'Делитесь своими книгами'}
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border border-border rounded-lg p-4 cursor-pointer hover:bg-secondary/50">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business" className="cursor-pointer flex-1">
                  <div className="font-semibold">{t('businessAccount')}</div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'az' ? 'Mağaza hesabı' : language === 'en' ? 'Store account' : 'Магазин'}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">
              {formData.account_type === "author" ? 
                (language === 'az' ? 'Ad Soyad (Müəllif adı)' : language === 'en' ? 'Full Name (Author name)' : 'Полное имя (Имя автора)') :
                t('name')
              }
            </Label>
            <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="rounded-full" />
            {formData.account_type === "author" && (
              <p className="text-xs text-muted-foreground">
                {language === 'az' ? 'Bu ad kitablarınızda müəllif adı kimi görünəcək' :
                 language === 'en' ? 'This name will appear as author name on your books' :
                 'Это имя будет отображаться как имя автора'}
              </p>
            )}
          </div>
          
          {formData.account_type === "business" && (
            <div className="space-y-2 bg-accent/10 p-4 rounded-xl">
              <Label htmlFor="store_name">{t('storeName')} *</Label>
              <Input id="store_name" name="store_name" type="text" value={formData.store_name} onChange={handleChange}
                required={formData.account_type === "business"} className="rounded-full"
                placeholder={language === 'az' ? 'Mağazanızın adı' : 'Your store name'} />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="rounded-full" />
          </div>
          
          {/* Phone with international country picker - Optional */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              {t('whatsapp')} 
              <span className="text-muted-foreground text-xs ml-1">
                ({language === 'az' ? 'istəyə bağlı' : language === 'en' ? 'optional' : 'необязательно'})
              </span>
            </Label>
            <PhoneInput
              country={'az'}
              preferredCountries={['az', 'tr', 'ru', 'ge', 'us', 'gb', 'de']}
              value={formData.phone}
              onChange={handlePhoneChange}
              enableSearch={true}
              searchPlaceholder={
                language === 'az' ? 'Ölkə axtar' :
                language === 'en' ? 'Search country' :
                'Поиск страны'
              }
              searchNotFound={
                language === 'az' ? 'Tapılmadı' :
                language === 'en' ? 'No entries to show' :
                'Ничего не найдено'
              }
              inputProps={{
                id: 'phone',
                name: 'phone',
                'data-testid': 'register-phone-input',
              }}
              containerClass="phone-input-container"
              inputClass="phone-input-field"
              buttonClass="phone-input-button"
              dropdownClass="phone-input-dropdown"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'az' ? 'Ölkə kodunu seçib nömrəni daxil edin. Boş buraxsanız sifarişlər emailə gələcək.' :
               language === 'en' ? 'Select country code and enter your number. Leave empty to receive orders via email.' :
               'Выберите код страны и введите номер. Оставьте пустым для получения заказов по email.'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"}
                value={formData.password} 
                onChange={handleChange} 
                required 
                className="rounded-full pr-12" 
                minLength={6} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'az' ? 'Minimum 6 simvol' : 
               language === 'en' ? 'Minimum 6 characters' : 
               'Минимум 6 символов'}
            </p>
          </div>
          
          {/* Copyright Agreement */}
          <div className="space-y-2">
            <div onClick={() => setCopyrightAgreed(!copyrightAgreed)} className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                copyrightAgreed ? 'bg-primary border-primary' : 'border-muted-foreground group-hover:border-primary'
              }`}>
                {copyrightAgreed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed select-none">
                {language === 'az' ? 'Platformaya yüklənən kitabların müəllif hüquqlarına görə məsuliyyət istifadəçiyə aiddir.' :
                 language === 'en' ? 'The responsibility for copyright compliance belongs to the user.' :
                 'Ответственность за соблюдение авторских прав несет пользователь.'}
              </span>
            </div>
          </div>
          
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? t('wait') : t('register')}
          </Button>
        </form>
        
        <p className="text-center text-sm text-muted-foreground">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
