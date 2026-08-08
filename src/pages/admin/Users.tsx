import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Plus, UserPlus, X, Edit2, Trash2 } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+998',
    email: '',
    password: '',
    role: 'teacher'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/', {
        params: { search, limit: 50, is_active: true }
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Xodimlar yuklanmadi', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const payload = { ...formData };
      if (!payload.email) {
        delete (payload as any).email;
      }
      
      if (editingUserId) {
        if (!payload.password) delete (payload as any).password;
        await api.put(`/users/${editingUserId}`, payload);
      } else {
        await api.post('/users/', payload);
      }
      
      setIsModalOpen(false);
      fetchUsers(); // Refresh list
      setFormData({ full_name: '', phone: '+998', email: '', password: '', role: 'teacher' });
      setEditingUserId(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Xodimlar</h2>
          <p className="text-gray-400 mt-1">O'quv markaz barcha xodimlari ro'yxati va boshqaruvi.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ full_name: '', phone: '+998', email: '', password: '', role: 'teacher' });
            setEditingUserId(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Yangi xodim
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Ism yoki telefon raqam orqali qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">F.I.O</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Ma'lumot topilmadi</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{user.full_name}</td>
                    <td className="px-6 py-4 font-mono">{user.phone}</td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        user.role === 'teacher' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktiv
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1.5 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Deaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setFormData({
                              full_name: user.full_name,
                              phone: user.phone,
                              email: '',
                              password: '',
                              role: user.role
                            });
                            setEditingUserId(user.id);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.is_active && (
                          <button 
                            onClick={async () => {
                              if (window.confirm("Rostdan ham ushbu xodimni deaktivatsiya qilmoqchimisiz?")) {
                                try {
                                  await api.delete(`/users/${user.id}`);
                                  fetchUsers();
                                } catch (err) {
                                  alert("Xatolik yuz berdi");
                                }
                              }
                            }}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                            title="Deaktiv qilish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
              <h3 className="text-xl font-bold text-white">{editingUserId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingUserId(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">F.I.O</label>
                <input 
                  type="text" required
                  value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Ali Valiyev"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Telefon raqam</label>
                <input 
                  type="text" required
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="+998901234567"
                />
              </div>
              
              {!editingUserId && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Parol</label>
                  <input 
                    type="password" required={!editingUserId}
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                    placeholder="Kamida 8 belgi va 1 ta raqam"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Roli</label>
                <select 
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="teacher">O'qituvchi (Teacher)</option>
                  <option value="manager">Menejer (Manager)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg font-medium transition-colors border border-gray-700"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
