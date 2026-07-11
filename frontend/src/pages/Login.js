import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { Mail, Eye, EyeOff } from "lucide-react";

const Login = ({ onLogin }) => {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        onLogin(result.user);
        toast.success(t('loginSuccess'));
        navigate('/');
      } else {
        toast.error(result.error || t('loginFailed'));
      }
    } catch (error) {
      toast.error(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error(
        language === 'az' ? 'Email adresinizi daxil edin' :
        language === 'en' ? 'Please enter your email' :
        'Введите ваш email'
      );
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success(
        language === 'az' ? 'Şifrə sıfırlama linki email adresinizə göndərildi' :
        language === 'en' ? 'Password reset link sent to your email' :
        'Ссылка для сброса пароля отправлена на вашу почту'
      );
      setShowResetForm(false);
      setResetEmail("");
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        toast.error(
          language === 'az' ? 'Bu email ilə hesab tapılmadı' :
          language === 'en' ? 'No account found with this email' :
          'Аккаунт с таким email не найден'
        );
      } else if (error.code === 'auth/invalid-email') {
        toast.error(
          language === 'az' ? 'Yanlış email formatı' :
          language === 'en' ? 'Invalid email format' :
          'Неверный формат email'
        );
      } else {
        toast.error(
          language === 'az' ? 'Xəta baş verdi. Yenidən cəhd edin.' :
          language === 'en' ? 'An error occurred. Please try again.' :
          'Произошла ошибка. Попробуйте снова.'
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-serif font-semibold mb-2">{t('login')}</h1>
          <p className="text-muted-foreground">{t('signInToAccount')}</p>
        </div>
        
        {!showResetForm ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-2xl p-8 bg-card">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(true);
                    setResetEmail(email);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  {language === 'az' ? 'Şifrəni unutdum?' :
                   language === 'en' ? 'Forgot password?' :
                   'Забыли пароль?'}
                </button>
              </div>
              
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? t('wait') : t('login')}
              </Button>
            </form>
            
            <p className="text-center text-sm text-muted-foreground">
              {t('dontHaveAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('register')}
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-6 border border-border rounded-2xl p-8 bg-card">
            <div className="text-center mb-4">
              <Mail className="h-12 w-12 mx-auto text-primary mb-3" />
              <h2 className="text-xl font-semibold">
                {language === 'az' ? 'Şifrəni Sıfırla' :
                 language === 'en' ? 'Reset Password' :
                 'Сбросить пароль'}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'az' ? 'Email adresinizi daxil edin. Sizə şifrə sıfırlama linki göndərəcəyik.' :
                 language === 'en' ? 'Enter your email address. We will send you a password reset link.' :
                 'Введите ваш email. Мы отправим вам ссылку для сброса пароля.'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={language === 'az' ? 'Email adresiniz' : 'Your email address'}
                required
                className="rounded-full"
              />
            </div>
            
            <Button type="submit" className="w-full rounded-full" disabled={resetLoading}>
              {resetLoading 
                ? (language === 'az' ? 'Göndərilir...' : 'Sending...') 
                : (language === 'az' ? 'Sıfırlama Linki Göndər' : 'Send Reset Link')}
            </Button>
            
            <button
              type="button"
              onClick={() => setShowResetForm(false)}
              className="w-full text-sm text-muted-foreground hover:text-primary"
            >
              {language === 'az' ? '← Girişə qayıt' :
               language === 'en' ? '← Back to login' :
               '← Вернуться к входу'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
