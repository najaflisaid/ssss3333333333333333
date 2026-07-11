import { useState, useEffect } from "react";
import { getBooks } from "../firebase/books";
import { toggleFavorite } from "../firebase/auth";
import BookCard from "../components/BookCard";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

const Favorites = ({ user }) => {
  const { t, language } = useLanguage();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavoriteBooks();
    }
  }, [user]);

  const fetchFavoriteBooks = async () => {
    try {
      if (!user?.favorites || user.favorites.length === 0) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const result = await getBooks();
      if (result.success) {
        const favoriteBooks = result.books.filter(book => 
          user.favorites.includes(book.id)
        );
        setBooks(favoriteBooks);
      }
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (bookId) => {
    try {
      const result = await toggleFavorite(user.id, bookId);
      if (result.success) {
        setBooks(books.filter(b => b.id !== bookId));
        toast.success(t('removedFromFavorites'));
      }
    } catch (error) {
      toast.error(t('error'));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-semibold mb-8">
          {t('favorites')}
        </h1>

        {books.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">
              {t('emptyFavorites')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {books.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
