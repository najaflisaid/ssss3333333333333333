import { useState, useEffect } from "react";
import { FileText, Save, Home } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import { getPageContent, updatePageContent } from "../../firebase/pages";

const PAGES = [
  { id: "hero", name_az: "Ana Səhifə (Hero)", name_en: "Homepage (Hero)", name_ru: "Главная (Hero)", icon: Home },
  { id: "haqqimizda", name_az: "Haqqımızda", name_en: "About Us", name_ru: "О нас", icon: FileText },
];

const PagesTab = () => {
  const { language } = useLanguage();
  const [selectedPage, setSelectedPage] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState({
    title_az: "",
    title_en: "",
    title_ru: "",
    content_az: "",
    content_en: "",
    content_ru: "",
  });

  // Default values for hero section
  const defaultHeroData = {
    title_az: "Kitablarınızı paylaşın və kəşf edin",
    title_en: "Share and discover your books",
    title_ru: "Делитесь и открывайте свои книги",
    content_az: "Azərbaycanın ən böyük elektron kitab platforması. Kitablarınızı satın və yeni kitablar kəşf edin.",
    content_en: "Azerbaijan's largest e-book platform. Sell your books and discover new ones.",
    content_ru: "Крупнейшая платформа электронных книг Азербайджана. Продавайте свои книги и открывайте новые."
  };

  useEffect(() => {
    fetchPageContent(selectedPage);
  }, [selectedPage]);

  const fetchPageContent = async (pageId) => {
    setLoading(true);
    try {
      // Fetch all 3 languages
      const [resAz, resEn, resRu] = await Promise.all([
        getPageContent(pageId, 'az'),
        getPageContent(pageId, 'en'),
        getPageContent(pageId, 'ru')
      ]);

      // Use defaults for hero if not found
      const defaults = pageId === 'hero' ? defaultHeroData : {
        title_az: PAGES.find(p => p.id === pageId)?.name_az || "",
        title_en: PAGES.find(p => p.id === pageId)?.name_en || "",
        title_ru: PAGES.find(p => p.id === pageId)?.name_ru || "",
        content_az: "", content_en: "", content_ru: ""
      };

      setPageData({
        title_az: resAz.success ? resAz.page.title : defaults.title_az,
        title_en: resEn.success ? resEn.page.title : defaults.title_en,
        title_ru: resRu.success ? resRu.page.title : defaults.title_ru,
        content_az: resAz.success ? resAz.page.content : defaults.content_az,
        content_en: resEn.success ? resEn.page.content : defaults.content_en,
        content_ru: resRu.success ? resRu.page.content : defaults.content_ru,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      // Set defaults on error
      if (selectedPage === 'hero') {
        setPageData(defaultHeroData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updatePageContent(selectedPage, {
        title_az: pageData.title_az,
        title_en: pageData.title_en,
        title_ru: pageData.title_ru,
        content_az: pageData.content_az,
        content_en: pageData.content_en,
        content_ru: pageData.content_ru,
      });

      if (result.success) {
        toast.success(language === 'az' ? 'Səhifə yadda saxlanıldı' : 'Page saved successfully');
      } else {
        toast.error(result.error || 'Səhifə yadda saxlanıla bilmədi');
      }
    } catch (error) {
      toast.error('Səhifə yadda saxlanıla bilmədi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold">
        {language === 'az' ? 'Səhifə Məzmunu' : language === 'en' ? 'Page Content' : 'Содержание страницы'}
      </h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {PAGES.map((page) => {
          const Icon = page.icon || FileText;
          return (
            <Button
              key={page.id}
              variant={selectedPage === page.id ? "default" : "outline"}
              onClick={() => setSelectedPage(page.id)}
              className="rounded-full"
            >
              <Icon className="h-4 w-4 mr-2" />
              {page[`name_${language}`]}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-8">
          {language === 'az' ? 'Yüklənir...' : 'Loading...'}
        </div>
      ) : (
        <Tabs defaultValue="az" className="space-y-4">
          <TabsList>
            <TabsTrigger value="az">Azərbaycan</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="ru">Русский</TabsTrigger>
          </TabsList>

          {['az', 'en', 'ru'].map((lang) => (
            <TabsContent key={lang} value={lang} className="space-y-4">
              <div>
                <Label htmlFor={`title-${lang}`}>
                  {selectedPage === 'hero' 
                    ? (lang === 'az' ? 'Başlıq (Hero)' : lang === 'en' ? 'Title (Hero)' : 'Заголовок (Hero)')
                    : (lang === 'az' ? 'Başlıq' : lang === 'en' ? 'Title' : 'Заголовок')
                  }
                </Label>
                <Input
                  id={`title-${lang}`}
                  value={pageData[`title_${lang}`]}
                  onChange={(e) => setPageData({ ...pageData, [`title_${lang}`]: e.target.value })}
                  className="mt-2 rounded-full"
                  placeholder={selectedPage === 'hero' 
                    ? (lang === 'az' ? 'Kitablarınızı paylaşın və kəşf edin' : '')
                    : ''
                  }
                />
              </div>
              <div>
                <Label htmlFor={`content-${lang}`}>
                  {selectedPage === 'hero'
                    ? (lang === 'az' ? 'Təsvir (Alt yazı)' : lang === 'en' ? 'Description (Subtitle)' : 'Описание (Подзаголовок)')
                    : (lang === 'az' ? 'Məzmun' : lang === 'en' ? 'Content' : 'Содержание')
                  }
                </Label>
                <Textarea
                  id={`content-${lang}`}
                  value={pageData[`content_${lang}`]}
                  onChange={(e) => setPageData({ ...pageData, [`content_${lang}`]: e.target.value })}
                  className="mt-2 rounded-2xl min-h-[200px]"
                  rows={selectedPage === 'hero' ? 3 : 8}
                  placeholder={selectedPage === 'hero'
                    ? (lang === 'az' ? 'Azərbaycanın ən böyük elektron kitab platforması...' : '')
                    : ''
                  }
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Button onClick={handleSave} disabled={saving || loading} className="rounded-full">
        <Save className="h-4 w-4 mr-2" />
        {saving 
          ? (language === 'az' ? 'Saxlanılır...' : 'Saving...') 
          : (language === 'az' ? 'Yadda Saxla' : 'Save Changes')
        }
      </Button>
    </div>
  );
};

export default PagesTab;
