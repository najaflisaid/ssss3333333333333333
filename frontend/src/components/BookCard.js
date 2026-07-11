import { Heart, Star, Eye, Mail, Download } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";

const BookCard = ({ book, onFavoriteToggle, isFavorite = false }) => {
  const { language } = useLanguage();
  
  // Get book data based on current language
  const getBookData = () => {
    return {
      title: book[`title_${language}`] || book.title_az || book.title,
      author: book[`author_${language}`] || book.author_az || book.author,
      description: book[`description_${language}`] || book.description_az || book.description
    };
  };
  
  const bookData = getBookData();
  
  // Check contact preference - email if preference is email OR no whatsapp
  const isEmailContact = book.user_contact_preference === 'email' || !book.user_whatsapp || book.user_whatsapp.trim() === "";
  
  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    const message = encodeURIComponent(`Salam! "${bookData.title}" kitabı haqqında məlumat almaq istəyirəm.`);
    const whatsappNumber = (book.user_whatsapp || book.seller_whatsapp || "994773770383").replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (onFavoriteToggle) {
      await onFavoriteToggle(book.id);
    }
  };

  return (
    <Link to={`/books/${book.id}`} data-testid={`book-card-${book.id}`}>
      <div className="bg-transparent border-none shadow-none group cursor-pointer book-card-hover">
        <div className="relative aspect-[2/3] mb-4 rounded-lg overflow-hidden bg-secondary">
          <img
            src={book.cover_image}
            alt={bookData.title}
            className="w-full h-full object-cover"
          />
          {onFavoriteToggle && (
            <button
              data-testid={`favorite-btn-${book.id}`}
              onClick={handleFavorite}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all z-10"
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
              />
            </button>
          )}
          {book.price === 0 && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
              {language === 'az' && 'PULSUZ'}
              {language === 'en' && 'FREE'}
              {language === 'ru' && 'БЕСПЛАТНО'}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {bookData.title}
          </h3>
          <p className="text-sm text-muted-foreground">{bookData.author}</p>
          
          {book.reviews_count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{book.avg_rating}</span>
              <span className="text-xs text-muted-foreground">({book.reviews_count})</span>
            </div>
          )}
          
          {/* View Count */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{book.views || 0}</span>
            </div>
            {(book.pdf_file || book.demo_pdf_file) && (
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span className="text-sm">{book.pdf_downloads || 0}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-emerald-700 font-bold text-lg">
              {book.price === 0 ? 
                (language === 'az' ? 'Pulsuz' :
                 language === 'en' ? 'Free' :
                 'Бесплатно') : 
                `${book.price} AZN`
              }
            </div>
            {isEmailContact ? (
              <Button
                data-testid={`email-btn-${book.id}`}
                size="sm"
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {language === 'az' && 'Əlaqə'}
                {language === 'en' && 'Contact'}
                {language === 'ru' && 'Связаться'}
              </Button>
            ) : (
              <Button
                data-testid={`whatsapp-btn-${book.id}`}
                onClick={handleWhatsAppClick}
                size="sm"
                className="rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2"
              >
                <FaWhatsapp className="h-4 w-4" />
                {language === 'az' && 'Əlaqə'}
                {language === 'en' && 'Contact'}
                {language === 'ru' && 'Связаться'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;