import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { getServices } from "../firebase/services";
import { Button } from "../components/ui/button";
import { useLanguage } from "../contexts/LanguageContext";

const Services = () => {
  const { t, language } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const result = await getServices();
      if (result.success) {
        setServices(result.services);
      }
    } catch (error) {
      console.error('Xidmətlər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (service) => {
    const title = service[`title_${language}`] || service.title_az || service.title_en;
    const message = encodeURIComponent(
      language === 'az' ? `Salam! "${title}" xidməti haqqında məlumat almaq istəyirəm.` :
      language === 'en' ? `Hello! I would like to get information about "${title}" service.` :
      `Здравствуйте! Хочу узнать о услуге "${title}".`
    );
    const whatsappNumber = (service.whatsapp || "994773770383").replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-24 py-12 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold mb-3 md:mb-4">
            {t('ourServices')}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            {t('servicesDescription')}
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            <p className="text-base md:text-lg text-muted-foreground">
              {t('noServices')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="border border-border rounded-2xl overflow-hidden bg-card hover:shadow-lg transition-shadow h-fit"
              >
                {service.image_url && (
                  <div className="w-full">
                    <img 
                      src={service.image_url} 
                      alt={service[`title_${language}`] || service.title_az} 
                      className="w-full h-auto object-contain max-h-64"
                    />
                  </div>
                )}
                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold line-clamp-2">
                    {service[`title_${language}`] || service.title_az || service.title_en}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground text-justify whitespace-pre-wrap">
                    {service[`description_${language}`] || service.description_az || service.description_en}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border gap-2">
                    <div className="text-xl sm:text-2xl font-bold shrink-0">
                      {service.price > 0 ? (
                        <span>{service.price} AZN</span>
                      ) : (
                        <span className="text-green-600">{t('free')}</span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleWhatsAppClick(service)}
                      size="sm"
                      className="rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white text-sm sm:text-base px-3 sm:px-4"
                    >
                      <FaWhatsapp className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      {t('contact')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
