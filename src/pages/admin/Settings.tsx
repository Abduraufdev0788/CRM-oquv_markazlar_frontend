import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BookOpen, MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState({ name: '', monthly_fee: '', color_hex: '#4F46E5' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/', { params: { limit: 50 } });
      setData(response.data.data || []);
    } catch (error) {
      console.error("Sozlamalar yuklanmadi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const payload = {
        ...courseForm,
        monthly_fee: parseFloat(courseForm.monthly_fee)
      };
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
      } else {
        await api.post('/courses/', payload);
      }
      setIsCourseModalOpen(false);
      fetchData();
      setCourseForm({ name: '', monthly_fee: '', color_hex: '#4F46E5' });
      setEditingId(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Rostdan ham '${name}'ni o'chirishni xohlaysizmi?`)) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchData();
    } catch (err: any) {
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setCourseForm({ name: item.name, monthly_fee: item.monthly_fee.toString(), color_hex: item.color_hex });
    setIsCourseModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setCourseForm({ name: '', monthly_fee: '', color_hex: '#4F46E5' });
    setIsCourseModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sozlamalar</h2>
          <p className="text-gray-400 mt-1">O'quv markaz kursi va xonalarini boshqarish.</p>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex flex-wrap gap-4 items-center justify-between bg-gray-800/80">
          <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-xl">
            <div className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 bg-blue-600 text-white shadow-md">
              <BookOpen className="w-4 h-4" /> Kurslar
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={handleCreate}
              className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-blue-500/30"
            >
              <Plus className="w-4 h-4" />
              Yangi Kurs
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center text-gray-500 py-8">Yuklanmoqda...</div>
            ) : data.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">Ma'lumot topilmadi</div>
            ) : (
              data.map((item: any) => (
                <div key={item.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color_hex}20`, color: item.color_hex }}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{formatCurrency(item.monthly_fee)} / oy</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Tahrirlash
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> O'chirish
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
              <h3 className="text-xl font-bold text-white">Yangi Kurs Qo'shish</h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCourseSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg text-center">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Kurs nomi</label>
                <input type="text" required value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:border-blue-500" placeholder="IELTS Preparation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Oylik to'lov (UZS)</label>
                <input type="number" required value={courseForm.monthly_fee} onChange={e => setCourseForm({ ...courseForm, monthly_fee: e.target.value })} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:border-blue-500" placeholder="Masalan: 400000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Kurs rangi (Hex)</label>
                <div className="flex gap-2">
                  <input type="color" value={courseForm.color_hex} onChange={e => setCourseForm({ ...courseForm, color_hex: e.target.value })} className="w-12 h-11 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer" />
                  <input type="text" required value={courseForm.color_hex} onChange={e => setCourseForm({ ...courseForm, color_hex: e.target.value })} className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:border-blue-500 font-mono" placeholder="#4F46E5" />
                </div>
              </div>
              <div className="pt-4"><button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50">Saqlash</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
