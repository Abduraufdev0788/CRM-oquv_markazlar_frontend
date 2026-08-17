import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Bell, Search, Menu, CheckCircle2, Calendar, Wallet } from 'lucide-react';
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
                } catch (err) { }
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
            className="relative text-gray-400 hover:text-white transition-all duration-300 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 group"
          >
            <Bell className="w-5 h-5 group-hover:animate-swing" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-gray-900"></span>
              </span>
            )}
          </button>

          {showNotif && (
            <div className="fixed left-4 right-4 top-[70px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[420px] bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 sm:slide-in-from-top-4 duration-300 transform sm:origin-top-right">
              {/* Header */}
              <div className="p-5 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg tracking-tight">Bildirishnomalar</h3>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors border border-blue-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> O'qilgan qilish
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                      <Bell className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">Hozircha xabarlar yo'q</p>
                    <p className="text-xs text-gray-500 mt-1">Yangi voqealar bu yerda ko'rinadi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => {
                      const isUnread = !n.is_read;

                      // Type bo'yicha ikonka va ranglarni aniqlash
                      let Icon = Bell;
                      let colorClass = "text-gray-400 bg-gray-500/10 border-gray-500/20";

                      if (n.notif_type === 'ATTENDANCE') {
                        Icon = Calendar;
                        colorClass = "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
                      } else if (n.notif_type === 'PAYMENT_DUE' || n.notif_type === 'PAYMENT') {
                        Icon = Wallet;
                        colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
                      } else if (n.notif_type === 'SYSTEM') {
                        Icon = CheckCircle2;
                        colorClass = "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]";
                      }

                      return (
                        <div key={n.id} className={`group relative p-5 transition-all duration-300 hover:bg-white/[0.03] flex gap-4 items-start ${isUnread ? 'bg-blue-500/[0.02]' : ''}`}>
                          {isUnread && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"></div>
                          )}

                          <div className={`p-2.5 rounded-2xl border ${colorClass} shrink-0 mt-0.5`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm tracking-tight mb-1 ${isUnread ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>
                              {n.title}
                            </h4>
                            <p className={`text-xs leading-relaxed line-clamp-2 ${isUnread ? 'text-gray-300' : 'text-gray-500'}`}>
                              {n.body}
                            </p>
                            <span className="text-[10px] text-gray-600 font-medium mt-2.5 block uppercase tracking-wider">
                              {new Date(n.created_at).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {isUnread && (
                            <button
                              onClick={(e) => markAsRead(n.id, e)}
                              className="shrink-0 p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20 opacity-0 group-hover:opacity-100"
                              title="O'qilgan deb belgilash"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
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
