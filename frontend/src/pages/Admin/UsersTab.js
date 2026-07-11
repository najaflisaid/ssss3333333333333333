import { useState, useEffect } from "react";
import { User, Shield, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import { getAllUsers, updateUserRole, deleteUser } from "../../firebase/admin";

const UsersTab = () => {
  const { language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        toast.error('İstifadəçilər yüklənə bilmədi');
      }
    } catch (error) {
      toast.error('İstifadəçilər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        toast.success('Rol yeniləndi');
        fetchUsers();
      } else {
        toast.error('Rol yenilənə bilmədi');
      }
    } catch (error) {
      toast.error('Rol yenilənə bilmədi');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (deleteConfirm !== userId) {
      setDeleteConfirm(userId);
      toast.info(`"${userName}" istifadəçisini silmək üçün yenidən klikləyin`);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success(`"${userName}" silindi`);
        setUsers(users.filter(u => u.id !== userId));
        setDeleteConfirm(null);
      } else {
        toast.error('Silmə uğursuz oldu');
      }
    } catch (error) {
      toast.error('Silmə uğursuz oldu');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(filterText.toLowerCase()) ||
    user.email?.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">{language === 'az' ? 'Yüklənir...' : language === 'en' ? 'Loading...' : 'Загрузка...'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center border border-border rounded-xl bg-background px-3">
          <svg className="h-4 w-4 text-muted-foreground mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setFilterText(e.currentTarget.textContent || "")}
            data-placeholder={language === 'az' ? 'Ad və ya email ilə axtar...' : 'Search by name or email...'}
            className="flex-1 py-2 bg-transparent focus:outline-none min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
          />
          {filterText && (
            <button onClick={() => {
              setFilterText("");
              const el = document.querySelector('[contenteditable]');
              if (el) el.textContent = "";
            }} className="p-1 hover:bg-muted rounded">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="bg-card p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {language === 'az' ? 'İstifadəçilər' : language === 'en' ? 'Users' : 'Пользователи'} ({filteredUsers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">{language === 'az' ? 'Ad' : language === 'en' ? 'Name' : 'Имя'}</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">{language === 'az' ? 'Rol' : language === 'en' ? 'Role' : 'Роль'}</th>
                <th className="text-left p-4 font-medium">{language === 'az' ? 'Əməliyyatlar' : language === 'en' ? 'Actions' : 'Действия'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{user.name}</div>
                        {user.whatsapp && (
                          <div className="text-xs text-muted-foreground">{user.whatsapp}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminRole(user.id, user.role)}
                        className="rounded-full"
                      >
                        {user.role === 'admin' ? (
                          <><ShieldOff className="h-4 w-4 mr-1" /> {language === 'az' ? 'Admini Sil' : 'Remove Admin'}</>
                        ) : (
                          <><Shield className="h-4 w-4 mr-1" /> {language === 'az' ? 'Admin Et' : 'Make Admin'}</>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant={deleteConfirm === user.id ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="rounded-full"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleteConfirm === user.id ? (language === 'az' ? 'Təsdiqlə' : 'Confirm') : (language === 'az' ? 'Sil' : 'Delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-muted-foreground">
                    {language === 'az' ? 'İstifadəçi tapılmadı' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersTab;
