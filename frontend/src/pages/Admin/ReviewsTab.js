import { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Trash2, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/.netlify/functions';

const ReviewsTab = () => {
  const { language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data.reviews || []);
    } catch (error) {
      toast.error('Rəylər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm(language === 'az' ? 'Bu rəyi silmək istədiyinizə əminsiniz?' : 'Are you sure you want to delete this review?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Rəy silindi');
      fetchReviews();
    } catch (error) {
      toast.error('Rəy silinə bilmədi');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : language === 'en' ? 'Loading...' : 'Загрузка...'}</div>;
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="bg-card p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {language === 'az' ? 'Rəylər' : language === 'en' ? 'Reviews' : 'Отзывы'} ({reviews.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'İstifadəçi' : language === 'en' ? 'User' : 'Пользователь'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Reytinq' : language === 'en' ? 'Rating' : 'Рейтинг'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Rəy' : language === 'en' ? 'Comment' : 'Комментарий'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Tarix' : language === 'en' ? 'Date' : 'Дата'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Əməliyyatlar' : language === 'en' ? 'Actions' : 'Действия'}</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-4 font-medium">{review.user_name}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="p-4 max-w-md">
                  <p className="truncate text-muted-foreground">{review.comment}</p>
                </td>
                <td className="p-4 text-muted-foreground text-sm">
                  {new Date(review.created_at).toLocaleDateString(language === 'az' ? 'az-AZ' : language === 'en' ? 'en-US' : 'ru-RU')}
                </td>
                <td className="p-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteReview(review.id)}
                    className="rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewsTab;
