import { useState, useEffect } from "react";
import axios from "axios";
import { BookOpen, Trash2, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/.netlify/functions';

const BooksTab = () => {
  const { language } = useLanguage();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/admin/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data.books || []);
    } catch (error) {
      toast.error('Kitablar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm(language === 'az' ? 'Bu kitabı silmək istədiyinizə əminsiniz?' : 'Are you sure you want to delete this book?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Kitab silindi');
      fetchBooks();
    } catch (error) {
      toast.error('Kitab silinə bilmədi');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : language === 'en' ? 'Loading...' : 'Загрузка...'}</div>;
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="bg-card p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {language === 'az' ? 'Kitablar' : language === 'en' ? 'Books' : 'Книги'} ({books.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Kitab' : language === 'en' ? 'Book' : 'Книга'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Müəllif' : language === 'en' ? 'Author' : 'Автор'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Kateqoriya' : language === 'en' ? 'Category' : 'Категория'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Qiymət' : language === 'en' ? 'Price' : 'Цена'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Satıcı' : language === 'en' ? 'Seller' : 'Продавец'}</th>
              <th className="text-left p-4 font-medium">{language === 'az' ? 'Əməliyyatlar' : language === 'en' ? 'Actions' : 'Действия'}</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={book.cover_image} alt={book.title_az} className="w-12 h-16 object-cover rounded" />
                    <span className="font-medium">{book[`title_${language}`] || book.title_az}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{book[`author_${language}`] || book.author_az}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-secondary rounded-full text-xs">{book.category}</span>
                </td>
                <td className="p-4">
                  {book.price === 0 ? (
                    <span className="text-emerald-600 font-medium">{language === 'az' ? 'Pulsuz' : 'Free'}</span>
                  ) : (
                    <span>{book.price} AZN</span>
                  )}
                </td>
                <td className="p-4 text-muted-foreground">{book.seller_name}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link to={`/books/${book.id}`}>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBook(book.id)}
                      className="rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BooksTab;
