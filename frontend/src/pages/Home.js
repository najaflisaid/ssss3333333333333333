import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import { getBooks } from "../firebase/books";
import { getBanners } from "../firebase/banners";
import { getPageContent } from "../firebase/pages";
import { toggleFavorite } from "../firebase/auth";
import BookCard from "../components/BookCard";
import BannerSlider from "../components/BannerSlider";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

// Sabit kateqoriyalar
const FILTER_CATEGORIES = [
  { id: "kitab", name_az: "Kitab", name_en: "Book", name_ru: "Книга" },
  { id: "pdf_pullu", name_az: "PDF Kitab (Pullu)", name_en: "PDF Book (Paid)", name_ru: "PDF Книга (Платная)" },
  { id: "pdf_pulsuz", name_az: "PDF Kitab (Pulsuz)", name_en: "PDF Book (Free)", name_ru: "PDF Книга (Бесплатная)" },
  { id: "ikinci_el", name_az: "2-ci əl kitab", name_en: "Second Hand Book", name_ru: "Б/У книга" },
];

const Home = ({ user }) => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [banners, setBanners] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Hero content from Firebase
  const [heroContent, setHeroContent] = useState({
    title: t('shareAndDiscover'),
    description: t('platformDescription'),
    image_url: ''
  });

  const urlCategory = searchParams.get('category');

  useEffect(() => {
    const category = urlCategory || "";
    setSelectedCategory(category);
    fetchBooks({ category });
    fetchBanners();
    fetchHeroContent();
    if (user) {
      loadFavorites();
    }
  }, [user, urlCategory]);

  // Re-fetch hero content when language changes
  useEffect(() => {
    fetchHeroContent();
  }, [language]);

  const fetchHeroContent = async () => {
    try {
      const result = await getPageContent('hero', language);
      if (result.success && result.page) {
        setHeroContent({
          title: result.page.title || t('shareAndDiscover'),
          description: result.page.content || t('platformDescription'),
          image_url: result.page.image_url || ''
        });
      } else {
        // Fallback to translations
        setHeroContent({
          title: t('shareAndDiscover'),
          description: t('platformDescription'),
          image_url: ''
        });
      }
    } catch (error) {
      console.error('Hero content yüklənə bilmədi:', error);
      // Fallback to translations
      setHeroContent({
        title: t('shareAndDiscover'),
        description: t('platformDescription'),
        image_url: ''
      });
    }
  };

  const fetchBanners = async () => {
    try {
      const result = await getBanners();
      if (result.success) {
        setBanners(result.banners);
      }
    } catch (error) {
      console.error('Bannerlər yüklənə bilmədi');
    }
  };

  const fetchBooks = async (filters = {}) => {
    setLoading(true);
    try {
      const result = await getBooks(filters);
      let filteredBooks = result.books || [];
      
      // Ana səhifədə (filter olmadan) yalnız pullu kitabları göstər
      // 2-ci əl kitabları və pulsuz PDF-ləri gizlət
      if (!filters.category && !filters.search) {
        filteredBooks = filteredBooks.filter(book => {
          // 2-ci əl kitabları gizlət
          if (book.category === "2-ci əl kitab") return false;
          // Pulsuz kitabları gizlət (is_paid false olanlar)
          if (book.is_paid === false) return false;
          return true;
        });
      }
      
      setBooks(filteredBooks);
    } catch (error) {
      console.error('Kitablar yüklənə bilmədi:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    if (user?.favorites) {
      setFavorites(new Set(user.favorites));
    }
  };

  const handleSearch = () => {
    fetchBooks({
      search,
      category: selectedCategory,
      minPrice,
      maxPrice
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    fetchBooks();
  };

  const handleFavoriteToggle = async (bookId) => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    try {
      const result = await toggleFavorite(user.id, bookId);
      if (result.success) {
        setFavorites(new Set(result.favorites));
        if (result.favorites.includes(bookId)) {
          toast.success(t('addedToFavorites'));
        } else {
          toast.success(t('removedFromFavorites'));
        }
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Banner Slider - Full Width */}
      {banners.length > 0 && (
        <section className="w-full">
          <BannerSlider banners={banners} />
        </section>
      )}

      {/* Hero Section - Split Layout */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium tracking-tight leading-tight mb-4">
                {heroContent.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 text-justify lg:text-left">
                {heroContent.description}
              </p>
              
              {/* Search Bar */}
              <div className="flex gap-2 max-w-xl mx-auto lg:mx-0">
                <div className="relative flex-1">
                  <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    data-testid="search-input"
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-12 sm:h-14 rounded-full pl-12 sm:pl-14 text-base sm:text-lg"
                  />
                </div>
                <Button data-testid="search-btn" onClick={handleSearch} size="lg" className="rounded-full px-4 sm:px-8">
                  {t('search')}
                </Button>
                <Button
                  data-testid="filter-toggle-btn"
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Right Side - Hero Image */}
            {heroContent.image_url && (
              <div className="flex-1 max-w-md lg:max-w-lg">
                <div className="relative">
                  <div className="bg-secondary/30 rounded-3xl p-4 shadow-lg">
                    <img 
                      src={heroContent.image_url} 
                      alt="Hero" 
                      className="w-full h-auto rounded-2xl object-cover max-h-[400px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div data-testid="filters-panel" className="mt-8 p-6 border border-border rounded-2xl bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{t('filter')}</h3>
              <Button data-testid="clear-filters-btn" onClick={handleClearFilters} variant="ghost" size="sm">
                <X className="h-4 w-4 mr-2" />
                {t('clear')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="category-filter">
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">{t('all')}</SelectItem>
                  {FILTER_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.name_az}>
                      {language === 'az' ? cat.name_az : language === 'en' ? cat.name_en : cat.name_ru}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                data-testid="min-price-input"
                type="number"
                placeholder={t('minPrice')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="rounded-full"
              />
              
              <Input
                data-testid="max-price-input"
                type="number"
                placeholder={t('maxPrice')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </section>
      
      {/* Books Grid */}
      <section className="px-6 md:px-12 lg:px-24 pb-20">
        {books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              {t('noBooksFound')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {books.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onFavoriteToggle={user ? handleFavoriteToggle : null}
                isFavorite={favorites.has(book.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
