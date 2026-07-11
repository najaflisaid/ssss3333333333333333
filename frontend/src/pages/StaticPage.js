import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageContent } from "../firebase/pages";
import { useLanguage } from "../contexts/LanguageContext";

const StaticPage = () => {
  const location = useLocation();
  const page = location.pathname.substring(1);
  const { t, language } = useLanguage();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, [page, language]);

  const fetchPageContent = async () => {
    setLoading(true);
    try {
      const result = await getPageContent(page, language);
      if (result.success) {
        setPageData(result.page);
      } else {
        setPageData(null);
      }
    } catch (error) {
      console.error('Səhifə yüklənə bilmədi');
      setPageData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t('loading')}
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t('pageNotFound')}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-8">{pageData.title}</h1>
        <div className="prose prose-lg max-w-none">
          {pageData.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-muted-foreground leading-relaxed text-justify">
              {paragraph}
            </p>
          ))}
        </div>
        {pageData.updated_at && (
          <p className="mt-12 text-sm text-muted-foreground">
            {t('lastUpdated')}: {new Date(pageData.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default StaticPage;
