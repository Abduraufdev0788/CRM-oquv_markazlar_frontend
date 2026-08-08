import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Search, UserPlus, MoreVertical, X } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  face_data_id?: string;
  created_at?: string;
}

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+998',
    birth_date: '',
    status: 'active',
    face_data_id: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/students/', {
        params: { search, limit: 50 }
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
        birth_date: formData.birth_date || null,
        face_data_id: formData.face_data_id || null 
      };
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post('/students/', payload);
      }
      setIsModalOpen(false);
      fetchStudents();
      setFormData({ full_name: '', phone: '+998', birth_date: '', status: 'active', face_data_id: '' });
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

  const handleEdit = (student: Student) => {
    setFormData({
      full_name: student.full_name,
      phone: student.phone || '',
      birth_date: (student as any).birth_date || '',
      status: student.status,
      face_data_id: student.face_data_id || ''
    });
    setEditingId(student.id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({ full_name: '', phone: '+998', birth_date: '', status: 'active', face_data_id: '' });
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
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                <th className="px-6 py-4">F.I.O</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Face ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">O'quvchilar topilmadi</td></tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{student.full_name}</td>
                    <td className="px-6 py-4 font-mono">{student.phone || 'Kiritilmagan'}</td>
                    <td className="px-6 py-4">
                      {student.face_data_id ? (
                        <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded text-xs">{student.face_data_id}</span>
                      ) : (
                        <span className="text-gray-500 text-xs">Yo'q</span>
                      )}
                    </td>
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
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleEdit(student)}
                          className="text-gray-400 hover:text-white p-2 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
                          title="Tahrirlash"
                        >
                          <Search className="w-4 h-4" /> {/* Use edit icon if available or just label it. Let's use string 'Tahrir' */}
                          <span className="text-xs ml-1 font-medium">Tahrir</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.full_name)}
                          className="text-red-400 hover:text-red-300 p-2 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                          title="O'chirish"
                        >
                          <X className="w-4 h-4" />
                        </button>
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
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Telefon raqam</label>
                <input 
                  type="text"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="+998901234567"
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Face Data ID (Yuz raqami)</label>
                <input 
                  type="text"
                  value={formData.face_data_id} onChange={e => setFormData({...formData, face_data_id: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="Apparatdagi raqami (masalan: 1024)"
                />
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
