import { FaWhatsapp, FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { useLanguage } from "../contexts/LanguageContext";

const ContactPage = () => {
  const { t, language } = useLanguage();

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: "https://wa.me/994773770383",
      color: "bg-[#25D366] hover:bg-[#128C7E]",
      description: t('whatsappContact')
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      url: "https://www.instagram.com/elektron__kitab?igsh=bnN3aDZ4N2JtMzA1",
      color: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600",
      description: t('instagramFollow')
    },
    {
      name: "TikTok",
      icon: FaTiktok,
      url: "https://www.tiktok.com/@epagesaz.com?_r=1&_t=ZS-92Y6N5cJvLl",
      color: "bg-black hover:bg-gray-800",
      description: t('tiktokFollow')
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      url: "https://www.facebook.com/share/1Af4vDWJvR/",
      color: "bg-[#1877F2] hover:bg-[#166FE5]",
      description: t('facebookFollow')
    }
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-24 py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold mb-3 md:mb-4">
            {t('contactUs')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('contactDescription')}
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('email')}</h3>
              <a href="mailto:epagesaz@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
                epagesaz@gmail.com
              </a>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('phone')}</h3>
              <a href="tel:+994773770383" className="text-muted-foreground hover:text-foreground transition-colors">
                +994 77 377 03 83
              </a>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center">
          {t('socialMedia')}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link.color} text-white rounded-2xl p-6 flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            >
              <link.icon className="h-10 w-10 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">{link.name}</h3>
                <p className="text-sm text-white/80">{link.description}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            {t('workingHours')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
