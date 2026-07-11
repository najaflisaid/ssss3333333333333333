import { useState, useEffect } from "react";
import { Users, BookOpen, Eye, TrendingUp } from "lucide-react";
import { getAnalytics, getUserStats } from "../../firebase/analytics";
import { useLanguage } from "../../contexts/LanguageContext";

const StatisticsTab = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalVisits: 0,
    todayVisits: 0,
    lastVisit: null
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    userStats: []
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const [analyticsResult, statsResult] = await Promise.all([
        getAnalytics(),
        getUserStats()
      ]);

      if (analyticsResult.success) {
        setAnalytics(analyticsResult.analytics);
      }

      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Heç vaxt';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-8">Yüklənir...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {language === 'az' ? 'İstifadəçilər' : language === 'en' ? 'Users' : 'Пользователи'}
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {language === 'az' ? 'Kitablar' : language === 'en' ? 'Books' : 'Книги'}
            </span>
          </div>
          <p className="text-3xl font-bold">{stats.totalBooks}</p>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {language === 'az' ? 'Bugünkü Ziyarətlər' : language === 'en' ? "Today's Visits" : 'Визиты Сегодня'}
            </span>
          </div>
          <p className="text-3xl font-bold">{analytics.todayVisits}</p>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-muted-foreground">
              {language === 'az' ? 'Ümumi Ziyarətlər' : language === 'en' ? 'Total Visits' : 'Всего визитов'}
            </span>
          </div>
          <p className="text-3xl font-bold">{analytics.totalVisits}</p>
        </div>
      </div>

      {/* Last Visit */}
      <div className="border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-2">
          {language === 'az' ? 'Son Ziyarət' : language === 'en' ? 'Last Visit' : 'Последний визит'}
        </h3>
        <p className="text-muted-foreground">{formatDate(analytics.lastVisit)}</p>
      </div>

      {/* User Statistics Table */}
      <div className="border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'az' ? 'İstifadəçi Statistikaları (Kitab Sayı)' : 
           language === 'en' ? 'User Statistics (Book Count)' : 
           'Статистика пользователей (Количество книг)'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium">
                  {language === 'az' ? 'İstifadəçi' : language === 'en' ? 'User' : 'Пользователь'}
                </th>
                <th className="text-left py-3 px-2 font-medium">Email</th>
                <th className="text-right py-3 px-2 font-medium">
                  {language === 'az' ? 'Kitab Sayı' : language === 'en' ? 'Books' : 'Книг'}
                </th>
                <th className="text-center py-3 px-2 font-medium">
                  {language === 'az' ? 'Rol' : language === 'en' ? 'Role' : 'Роль'}
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.userStats.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-muted-foreground">
                    {language === 'az' ? 'Heç bir məlumat yoxdur' : 'No data available'}
                  </td>
                </tr>
              ) : (
                stats.userStats.map((user, index) => (
                  <tr key={user.id} className={`border-b border-border ${index < 3 ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {index < 3 && <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>}
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground text-sm">{user.email}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                        {user.bookCount}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTab;
