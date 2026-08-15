import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Bell, Search, Menu, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { role, user, setUser, logout } = useAuthStore();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user && role) {
      const getBaseUrl = () => role === 'student' ? '/student-portal/me' : '/auth/me';
      api.get(getBaseUrl())
        .then(res => setUser(res.data))
        .catch(err => console.error("Error fetching user in topbar", err));
    }
  }, [user, role, setUser]);

  useEffect(() => {
    if (user) {
      const getNotifUrl = () => role === 'student' ? '/student-portal/notifications' : '/notifications/';
      api.get(getNotifUrl())
        .then(res => setNotifications(res.data))
        .catch(err => console.error("Error fetching notifications", err));
    }
  }, [user, role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getNotifBaseUrl = () => role === 'student' ? '/student-portal/notifications' : '/notifications';

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`${getNotifBaseUrl()}/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`${getNotifBaseUrl()}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white p-1">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Qidirish (Talaba / Xodim)..." 
            onChange={async (e) => {
              const val = e.target.value.trim();
              if (val.length >= 2) {
                try {
                  const [stuRes, userRes] = await Promise.all([
                    api.get('/students/', { params: { search: val, limit: 3 } }),
                    api.get('/users/', { params: { search: val, limit: 3, is_active: true } })
                  ]);
                  // Store results in window object temporarily to avoid adding too much state logic to Topbar
                  (window as any)._searchResults = {
                    students: stuRes.data.data || [],
                    users: userRes.data.data || [],
                    show: true
                  };
                  document.dispatchEvent(new Event('search-results-updated'));
                } catch (err) {}
              } else {
                (window as any)._searchResults = { show: false, students: [], users: [] };
                document.dispatchEvent(new Event('search-results-updated'));
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                (window as any)._searchResults = { show: false, students: [], users: [] };
                document.dispatchEvent(new Event('search-results-updated'));
              }, 200);
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                const val = e.currentTarget.value.trim();
                try {
                  const [stuRes, userRes] = await Promise.all([
                    api.get('/students/', { params: { search: val, limit: 1 } }),
                    api.get('/users/', { params: { search: val, limit: 1, is_active: true } })
                  ]);
                  const stuCount = stuRes.data.data?.length || 0;
                  const userCount = userRes.data.data?.length || 0;
                  
                  if (userCount > 0 && stuCount === 0) {
                    window.location.href = `/${role}/users?q=${encodeURIComponent(val)}`;
                  } else {
                    window.location.href = `/${role}/students?q=${encodeURIComponent(val)}`;
                  }
                } catch (err) {
                  window.location.href = `/${role}/students?q=${encodeURIComponent(val)}`;
                }
              }
            }}
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-blue-500 w-64 transition-all focus:w-72"
          />
          <SearchResultsDropdown role={role} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="relative text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-900 animate-pulse"></span>
            )}
          </button>
          
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/80 backdrop-blur-sm">
                <h3 className="font-semibold text-white">Bildirishnomalar</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Barchasini o'qish
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    Yangi xabarlar yo'q
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700/50">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 transition-colors hover:bg-gray-700/30 ${!n.is_read ? 'bg-blue-900/10' : ''}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className={`text-sm font-medium ${!n.is_read ? 'text-white' : 'text-gray-300'}`}>{n.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.body}</p>
                            <span className="text-[10px] text-gray-500 mt-2 block">
                              {new Date(n.created_at).toLocaleString('uz-UZ')}
                            </span>
                          </div>
                          {!n.is_read && (
                            <button onClick={(e) => markAsRead(n.id, e)} className="text-gray-500 hover:text-emerald-400 p-1 rounded-full hover:bg-gray-700 transition-colors" title="O'qilgan deb belgilash">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-gray-700 mx-1"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white capitalize">{user?.full_name || `${role} User`}</div>
            <div className="text-xs text-gray-500 capitalize">{role}</div>
          </div>
          <Link to={`/${role}/profile`} className="block">
            <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold border-2 border-gray-800 hover:border-blue-400 transition-colors shadow-lg cursor-pointer overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url.startsWith('http') ? user.photo_url : `http://localhost:8001${user.photo_url}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                  {(user?.full_name?.charAt(0) || role?.charAt(0))?.toUpperCase()}
                </div>
              )}
            </div>
          </Link>
        </div>

        <button 
          onClick={handleLogout}
          className="ml-2 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Tizimdan chiqish"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

const SearchResultsDropdown = ({ role }: { role: string | null }) => {
  const [results, setResults] = useState<{ show: boolean, students: any[], users: any[] }>({ show: false, students: [], users: [] });

  useEffect(() => {
    const handleUpdate = () => {
      setResults((window as any)._searchResults || { show: false, students: [], users: [] });
    };
    document.addEventListener('search-results-updated', handleUpdate);
    return () => document.removeEventListener('search-results-updated', handleUpdate);
  }, []);

  if (!results.show || (results.students.length === 0 && results.users.length === 0)) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
      <div className="max-h-[400px] overflow-y-auto py-2">
        {results.users.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Xodimlar</div>
            {results.users.map((u: any) => (
              <a 
                key={u.id} 
                href={`/${role}/users?q=${encodeURIComponent(u.full_name)}`}
                className="block px-4 py-2 hover:bg-gray-700/50 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="text-sm text-white font-medium">{u.full_name}</div>
                <div className="text-xs text-gray-400">{u.phone} • {u.role}</div>
              </a>
            ))}
          </div>
        )}
        
        {results.students.length > 0 && (
          <div>
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Talabalar</div>
            {results.students.map((s: any) => (
              <a 
                key={s.id} 
                href={`/${role}/students?q=${encodeURIComponent(s.full_name)}`}
                className="block px-4 py-2 hover:bg-gray-700/50 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="text-sm text-white font-medium">{s.full_name}</div>
                <div className="text-xs text-gray-400">{s.phone}</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
