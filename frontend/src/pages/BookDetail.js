import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Star, Heart, Eye, Trash2, Mail, Download } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { getBook, incrementBookView } from "../firebase/books";
import { getBookReviews, addReview, deleteReview, hasUserReviewed } from "../firebase/reviews";
import { toggleFavorite } from "../firebase/auth";
import { createNotification } from "../firebase/notifications";
import { trackPdfDownload } from "../firebase/pdfTracking";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

const BookDetail = ({ user }) => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const viewCounted = useRef(false);

  useEffect(() => {
    fetchBook();
    fetchReviews();
    if (user) {
      checkFavorite();
      checkUserReview();
    }
    
    if (!viewCounted.current) {
      viewCounted.current = true;
      incrementBookView(id).catch(() => {});
    }
  }, [id, user]);

  const fetchBook = async () => {
    try {
      const result = await getBook(id);
      if (result.success) {
        setBook(result.book);
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const result = await getBookReviews(id);
      if (result.success) {
        setReviews(result.reviews);
      }
    } catch (error) {
      console.error('Rəylər yüklənə bilmədi:', error);
    }
  };

  const checkUserReview = async () => {
    if (user) {
      const { hasReviewed } = await hasUserReviewed(id, user.id);
      setUserHasReviewed(hasReviewed);
    }
  };

  const checkFavorite = () => {
    if (user?.favorites) {
      setIsFavorite(user.favorites.includes(id));
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }

    try {
      const result = await toggleFavorite(user.id, id);
      if (result.success) {
        const newIsFavorite = result.favorites.includes(id);
        setIsFavorite(newIsFavorite);
        toast.success(newIsFavorite ? t('addedToFavorites') : t('removedFromFavorites'));
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('loginRequired'));
      return;
    }
    if (rating === 0) {
      toast.error(t('selectRating'));
      return;
    }
    if (userHasReviewed) {
      toast.error(language === 'az' ? 'Bu kitaba artıq rəy yazmısınız' : 'You have already reviewed this book');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        book_id: id,
        user_id: user.id,
        user_name: user.name,
        rating,
        comment
      };
      
      const result = await addReview(reviewData);
      if (result.success) {
        // Create notification for new review
        await createNotification('new_review', {
          book_title: book.title_az,
          user_name: user.name,
          rating: rating,
          comment: comment.substring(0, 100)
        });
        
        toast.success(t('reviewAdded'));
        setRating(0);
        setComment("");
        setUserHasReviewed(true);
        fetchReviews();
      } else {
        toast.error(result.error || t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId, reviewUserId) => {
    if (!user) return;
    
    // Only allow user to delete their own review or admin
    if (user.id !== reviewUserId && user.role !== 'admin') {
      toast.error(language === 'az' ? 'Yalnız öz rəyinizi silə bilərsiniz' : 'You can only delete your own review');
      return;
    }

    const confirmMsg = language === 'az' ? 'Bu rəyi silmək istəyirsiniz?' : 'Delete this review?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        toast.success(language === 'az' ? 'Rəy silindi' : 'Review deleted');
        if (user.id === reviewUserId) {
          setUserHasReviewed(false);
        }
        fetchReviews();
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleWhatsAppClick = () => {
    if (!book) return;
    const title = book[`title_${language}`] || book.title_az;
    const message = encodeURIComponent(
      language === 'az' ? `Salam! "${title}" kitabı haqqında məlumat almaq istəyirəm.` :
      language === 'en' ? `Hello! I would like to get information about "${title}" book.` :
      `Здравствуйте! Хочу узнать о книге "${title}".`
    );
    const whatsappNumber = (book.user_whatsapp || "994773770383").replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  // Handle email click - open email client directly with mailto
  const handleEmailClick = () => {
    if (!book) return;
    const title = book[`title_${language}`] || book.title_az;
    const emailBody = encodeURIComponent(
      language === 'az' ? `Salam!\n\nKitab: ${title}\nMüəllif: ${book.author_az}\nQiymət: ${book.price} AZN\n\nBu kitab haqqında məlumat almaq və sifariş vermək istəyirəm.\n\nHörmətlə,` :
      language === 'en' ? `Hello!\n\nBook: ${title}\nAuthor: ${book.author_az}\nPrice: ${book.price} AZN\n\nI would like to get information about this book and place an order.\n\nBest regards,` :
      `Здравствуйте!\n\nКнига: ${title}\nАвтор: ${book.author_az}\nЦена: ${book.price} AZN\n\nХочу получить информацию об этой книге и сделать заказ.\n\nС уважением,`
    );
    const emailSubject = encodeURIComponent(
      language === 'az' ? `Sifariş: ${title}` :
      language === 'en' ? `Order: ${title}` :
      `Заказ: ${title}`
    );
    const userEmail = book.user_email || 'info@epagesaz.com';
    window.location.href = `mailto:${userEmail}?subject=${emailSubject}&body=${emailBody}`;
  };

  // Check contact preference (user can choose in profile)
  // If contact_preference is 'email' OR no WhatsApp number, show email form
  const shouldShowEmail = book?.user_contact_preference === 'email' || !book?.user_whatsapp || book?.user_whatsapp.trim() === "";
  const hasWhatsApp = book?.user_whatsapp && book.user_whatsapp.trim() !== "";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  if (!book) {
    return <div className="min-h-screen flex items-center justify-center">{t('pageNotFound')}</div>;
  }

  const title = book[`title_${language}`] || book.title_az;
  const author = book[`author_${language}`] || book.author_az;
  const description = book[`description_${language}`] || book.description_az;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Book Cover */}
          <div>
            <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-secondary">
              <img src={book.cover_image} alt={title} className="w-full h-full object-cover" />
            </div>
          </div>
          
          {/* Book Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="bg-secondary px-3 py-1 rounded-full">{book.category}</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {book.views || 0}
                </span>
                {(book.pdf_file || book.demo_pdf_file) && (
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {book.pdf_downloads || 0} {language === 'az' ? 'yükləmə' : language === 'en' ? 'downloads' : 'загрузок'}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-serif font-semibold mb-2">{title}</h1>
              <p className="text-xl text-muted-foreground">{author}</p>
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-5 w-5 ${star <= avgRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-lg font-medium">{avgRating}</span>
              <span className="text-muted-foreground">({reviews.length} {t('reviews').toLowerCase()})</span>
            </div>
            
            {/* Price */}
            <div className="text-3xl font-bold">
              {book.price > 0 ? `${book.price} AZN` : <span className="text-green-600">{t('free')}</span>}
            </div>
            
            {description && (
              <div>
                <h3 className="font-semibold mb-2">{t('description')}</h3>
                <p className="text-muted-foreground leading-relaxed text-justify whitespace-pre-wrap">{description}</p>
              </div>
            )}

            {/* Additional Book Information */}
            {(book.publication_year || book.publication_place || book.publisher || book.isbn || 
              book.translator || book.scientific_editor || book.editor || book.reviewer || book.pages) && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold mb-3">
                  {language === 'az' ? 'Əlavə Məlumatlar' : language === 'en' ? 'Additional Information' : 'Дополнительная информация'}
                </h3>
                <div className="space-y-2 text-sm">
                  {book.publication_year && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Nəşr ili:' : language === 'en' ? 'Publication Year:' : 'Год издания:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.publication_year}</span>
                    </div>
                  )}
                  {book.publication_place && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Nəşr yeri:' : language === 'en' ? 'Place:' : 'Место издания:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.publication_place}</span>
                    </div>
                  )}
                  {book.publisher && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Nəşriyyat:' : language === 'en' ? 'Publisher:' : 'Издательство:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.publisher}</span>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">ISBN:</span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.isbn}</span>
                    </div>
                  )}
                  {book.translator && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Tərcüməçi:' : language === 'en' ? 'Translator:' : 'Переводчик:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.translator}</span>
                    </div>
                  )}
                  {book.scientific_editor && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Elmi redaktor:' : language === 'en' ? 'Scientific Editor:' : 'Научный редактор:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.scientific_editor}</span>
                    </div>
                  )}
                  {book.editor && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Redaktor:' : language === 'en' ? 'Editor:' : 'Редактор:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.editor}</span>
                    </div>
                  )}
                  {book.reviewer && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Rəyçi:' : language === 'en' ? 'Reviewer:' : 'Рецензент:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.reviewer}</span>
                    </div>
                  )}
                  {book.pages && (
                    <div className="flex">
                      <span className="font-medium min-w-[140px]">
                        {language === 'az' ? 'Səhifə:' : language === 'en' ? 'Pages:' : 'Страниц:'}
                      </span>
                      <span className="text-muted-foreground whitespace-pre-wrap">{book.pages}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* PDF File Size */}
            {book.pdf_size && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  📁 {book.pdf_size}
                </span>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              {book.price > 0 ? (
                shouldShowEmail ? (
                  <Button onClick={handleEmailClick} size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700">
                    <Mail className="h-5 w-5 mr-2" />
                    {language === 'az' ? 'Sifariş ver (Email)' : language === 'en' ? 'Order via Email' : 'Заказать (Email)'}
                  </Button>
                ) : (
                  <Button onClick={handleWhatsAppClick} size="lg" className="rounded-full bg-[#25D366] hover:bg-[#128C7E]">
                    <FaWhatsapp className="h-5 w-5 mr-2" />
                    {t('buyViaWhatsapp')}
                  </Button>
                )
              ) : (
                book.pdf_file && (
                  <Button 
                    size="lg" 
                    className="rounded-full"
                    onClick={async () => {
                      await trackPdfDownload(id);
                      window.open(book.pdf_file, '_blank');
                    }}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {t('downloadPDF')}
                  </Button>
                )
              )}
              
              {/* Show alternative contact method */}
              {book.price > 0 && hasWhatsApp && shouldShowEmail && (
                <Button onClick={handleWhatsAppClick} variant="outline" size="lg" className="rounded-full">
                  <FaWhatsapp className="h-5 w-5 mr-2" />
                  WhatsApp
                </Button>
              )}
              {book.price > 0 && !shouldShowEmail && book.user_email && (
                <Button onClick={handleEmailClick} variant="outline" size="lg" className="rounded-full">
                  <Mail className="h-5 w-5 mr-2" />
                  Email
                </Button>
              )}
              
              {book.demo_pdf_file && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full"
                  onClick={async () => {
                    await trackPdfDownload(id);
                    window.open(book.demo_pdf_file, '_blank');
                  }}
                >
                  <Download className="h-5 w-5 mr-2" />
                  {t('downloadDemo')}
                </Button>
              )}
              
              <Button onClick={handleFavoriteToggle} variant="outline" size="lg" className="rounded-full">
                <Heart className={`h-5 w-5 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-serif font-semibold">{t('reviews')} ({reviews.length})</h2>
          
          {/* Add Review Form - only if user hasn't reviewed */}
          {user && !userHasReviewed && (
            <form onSubmit={handleSubmitReview} className="border border-border rounded-2xl p-6 space-y-4">
              <div>
                <Label>{t('rating')}</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                      <Star className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="comment">{t('comment')}</Label>
                <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-2 rounded-xl"
                  placeholder={language === 'az' ? 'Rəyinizi yazın...' : language === 'en' ? 'Write your review...' : 'Напишите ваш отзыв...'} />
              </div>
              
              <Button type="submit" className="rounded-full" disabled={submitting}>
                {submitting ? t('wait') : t('submitReview')}
              </Button>
            </form>
          )}
          
          {user && userHasReviewed && (
            <div className="border border-border rounded-2xl p-6 bg-secondary/30 text-center">
              <p className="text-muted-foreground">
                {language === 'az' ? 'Bu kitaba artıq rəy yazmısınız' : language === 'en' ? 'You have already reviewed this book' : 'Вы уже оставили отзыв на эту книгу'}
              </p>
            </div>
          )}
          
          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('noReviews')}</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{review.user_name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    {/* Delete button for own review or admin */}
                    {user && (user.id === review.user_id || user.role === 'admin') && (
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteReview(review.id, review.user_id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
