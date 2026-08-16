import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, Plus, UserPlus, X, Edit2, Trash2, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Student {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  created_at?: string;
}

export const Students: React.FC = () => {
  const { role } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const location = window.location;
  const urlParams = new URLSearchParams(location.search);
  const initialSearch = urlParams.get('q') || '';
  const [search, setSearch] = useState(initialSearch);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+998',
    birth_date: '',
    status: 'active',
    parent_name: '',
    parent_phone: '+998'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students/', {
        params: { search, limit: 1000 }
      });
      setStudents(response.data.data);
    } catch (error) {
      console.error('O\'quvchilar yuklanmadi', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const payload = { 
        ...formData, 
        phone: formData.phone && formData.phone !== '+998' ? formData.phone : null,
        parent_phone: formData.parent_phone && formData.parent_phone !== '+998' ? formData.parent_phone : null,
        birth_date: formData.birth_date || null
      };
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post('/students/', payload);
      }
      setIsModalOpen(false);
      fetchStudents();
      setFormData({ full_name: '', phone: '+998', birth_date: '', status: 'active', parent_name: '', parent_phone: '+998' });
      setEditingId(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let errorMessage = "Xatolik yuz berdi";
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail[0]?.msg || JSON.stringify(detail[0]);
      } else if (typeof detail === 'object' && detail !== null) {
        errorMessage = JSON.stringify(detail);
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (student: Student) => {
    try {
      // Fetch full student details to ensure we have birth_date and latest data
      const response = await api.get(`/students/${student.id}`);
      const fullStudent = response.data;
      
      setFormData({
        full_name: fullStudent.full_name,
        phone: fullStudent.phone || '',
        birth_date: fullStudent.birth_date || '',
        status: fullStudent.status,
        parent_name: fullStudent.parent?.full_name || '',
        parent_phone: fullStudent.parent?.phone || '+998'
      });
      setEditingId(fullStudent.id);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch student details for editing", error);
      // Fallback to table data if fetch fails
      setFormData({
        full_name: student.full_name,
        phone: student.phone || '',
        birth_date: (student as any).birth_date || '',
        status: student.status,
        parent_name: '',
        parent_phone: '+998'
      });
      setEditingId(student.id);
      setIsModalOpen(true);
    }
  };

  const handleCreate = () => {
    setFormData({ full_name: '', phone: '+998', birth_date: '', status: 'active', parent_name: '', parent_phone: '+998' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Rostdan ham '${name}'ni o'chirishni xohlaysizmi?`)) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err: any) {
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">O'quvchilar</h2>
          <p className="text-gray-400 mt-1">O'quv markazidagi barcha talabalar ro'yxati.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Yangi o'quvchi
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Ism yoki telefon orqali qidirish..." 
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
                <th className="px-6 py-4 w-16">#</th>
                <th className="px-6 py-4">F.I.O</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">O'quvchilar topilmadi</td></tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-bold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <img 
                            src={`https://ui-avatars.com/api/?name=${student.full_name}&background=random`} 
                            alt={student.full_name} 
                            className="w-8 h-8 rounded-full border border-gray-600"
                         />
                         <span className="text-white font-medium">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{student.phone || 'Kiritilmagan'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        student.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        student.status === 'inactive' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {student.status === 'active' ? 'Aktiv' : 
                         student.status === 'inactive' ? 'Kutmoqda' : 
                         student.status === 'graduated' ? 'Bitirgan' : 'Ketgan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {['admin', 'manager'].includes(role) && student.status !== 'expelled' ? (
                          <button 
                            onClick={() => handleDelete(student.id, student.full_name)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                        {student.status === 'expelled' && (
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Rostdan ham '${student.full_name}'ni qayta tiklashni xohlaysizmi?`)) {
                                try {
                                  await api.put(`/students/${student.id}`, { status: 'active' });
                                  fetchStudents();
                                } catch (err) {
                                  alert("Tiklashda xatolik yuz berdi");
                                }
                              }
                            }}
                            className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                            title="Qayta tiklash"
                          >
                            <RefreshCcw className="w-4 h-4" />
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
              <h3 className="text-xl font-bold text-white">{editingId ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
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
                  placeholder="Azizov Alisher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">O'quvchi telefon raqami</label>
                <input 
                  type="text"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="+998901234567"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Ota-ona ismi</label>
                  <input 
                    type="text"
                    value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                    placeholder="Masalan: Nodira Karimova"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Ota-ona raqami (Bot uchun)</label>
                  <input 
                    type="text"
                    value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tug'ilgan sana (Parol)</label>
                <input 
                  type="date"
                  value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
                <select 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Aktiv (O'qiydi)</option>
                  <option value="inactive">Kutmoqda / Faol emas</option>
                  <option value="graduated">Bitirgan</option>
                  <option value="expelled">Ketgan / Haydalgan</option>
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
