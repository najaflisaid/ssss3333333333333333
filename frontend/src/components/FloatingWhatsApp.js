import { useState } from "react";
import { FaWhatsapp, FaInstagram, FaFacebookF, FaTiktok } from "react-icons/fa";
import { ChevronUp, ChevronDown } from "lucide-react";

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = "994773770383";
  const message = encodeURIComponent("Salam! Epagesaz.com haqqında məlumat almaq istəyirəm.");

  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/elektron__kitab?igsh=bnN3aDZ4N2JtMzA1",
      icon: FaInstagram,
      color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"
    },
    {
      name: "Facebook",
      url: "https://www.facebook.com/share/1Af4vDWJvR/",
      icon: FaFacebookF,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      name: "TikTok",
      url: "https://www.tiktok.com/@epagesaz.com?_r=1&_t=ZS-92Y6N5cJvLl",
      icon: FaTiktok,
      color: "bg-black hover:bg-gray-800"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      {/* Social Media Icons - Animated */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        {socialLinks.map((social, index) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${social.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
            style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
            aria-label={social.name}
          >
            <social.icon className="h-6 w-6" />
          </a>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label={isOpen ? "Bağla" : "Sosial şəbəkələr"}
      >
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>

      {/* WhatsApp Button - Always Visible */}
      <a
        href={`https://wa.me/${phoneNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        aria-label="WhatsApp ilə əlaqə"
      >
        <FaWhatsapp className="h-7 w-7" />
      </a>
    </div>
  );
};

export default FloatingWhatsApp;
