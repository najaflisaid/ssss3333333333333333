import { useState, useEffect } from "react";
import { getUserBooks, deleteBook } from "../firebase/books";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Plus, Clock, CheckCircle } from "lucide-react";
import BookCard from "../components/BookCard";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

const MyBooks = ({ user }) => {
  const { t, language } = useLanguage();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyBooks();
    }
  }, [user]);

  const fetchMyBooks = async () => {
    try {
      // Get all user's books including unapproved ones
      const { getBooks } = await import("../firebase/books");
      const result = await getBooks({ user_id: user.id, includeUnapproved: true });
      if (result.success) {
        setBooks(result.books);
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId) => {
    const confirmMsg = language === 'az' ? 'Bu kitabı silmək istədiyinizə əminsiniz?' : 
                       language === 'en' ? 'Are you sure you want to delete this book?' :
                       'Вы уверены, что хотите удалить эту книгу?';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const result = await deleteBook(bookId);
      if (result.success) {
        toast.success(t('bookDeleted'));
        setBooks(books.filter(b => b.id !== bookId));
      } else {
        toast.error(t('error'));
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  // Separate approved and pending books
  const approvedBooks = books.filter(b => b.approved === true);
  const pendingBooks = books.filter(b => b.approved !== true);

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-semibold">
            {t('myBooks')}
          </h1>
          <Link to="/upload">
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('newBook')}
            </Button>
          </Link>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">
              {t('noBooks')}
            </p>
            <Link to="/upload">
              <Button className="rounded-full">
                {t('uploadFirstBook')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Books */}
            {pendingBooks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-semibold text-amber-600">
                    {language === 'az' ? 'Təsdiq gözləyir' : language === 'en' ? 'Pending Approval' : 'Ожидает подтверждения'} ({pendingBooks.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingBooks.map(book => (
                    <div key={book.id} className="relative">
                      <div className="absolute inset-0 bg-amber-100/50 dark:bg-amber-900/20 rounded-2xl z-10 flex items-center justify-center pointer-events-none">
                        <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {language === 'az' ? 'Təsdiq gözləyir' : 'Pending'}
                        </span>
                      </div>
                      <BookCard book={book} />
                      <div className="mt-3 flex gap-2 justify-center z-20 relative">
                        <Link to={`/edit-book/${book.id}`} className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full rounded-full">
                            <Pencil className="h-4 w-4 mr-2" />
                            {language === 'az' ? 'Düzəliş' : language === 'en' ? 'Edit' : 'Редактировать'}
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1 rounded-full"
                          onClick={() => handleDelete(book.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === 'az' ? 'Sil' : language === 'en' ? 'Delete' : 'Удалить'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Books */}
            {approvedBooks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-green-600">
                    {language === 'az' ? 'Təsdiqlənmiş kitablar' : language === 'en' ? 'Approved Books' : 'Подтвержденные книги'} ({approvedBooks.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedBooks.map(book => (
                    <div key={book.id} className="relative">
                      <BookCard book={book} />
                      <div className="mt-3 flex gap-2 justify-center">
                        <Link to={`/edit-book/${book.id}`} className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full rounded-full">
                            <Pencil className="h-4 w-4 mr-2" />
                            {language === 'az' ? 'Düzəliş' : language === 'en' ? 'Edit' : 'Редактировать'}
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1 rounded-full"
                          onClick={() => handleDelete(book.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {language === 'az' ? 'Sil' : language === 'en' ? 'Delete' : 'Удалить'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
