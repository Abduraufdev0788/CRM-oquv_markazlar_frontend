import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, Plus, MoreVertical, X, Users, Copy } from 'lucide-react';

const DAYS_MAP = [
  { id: 'monday', label: 'Du' },
  { id: 'tuesday', label: 'Se' },
  { id: 'wednesday', label: 'Ch' },
  { id: 'thursday', label: 'Pa' },
  { id: 'friday', label: 'Ju' },
  { id: 'saturday', label: 'Sh' },
  { id: 'sunday', label: 'Ya' },
];

interface Group {
  id: string;
  name: string;
  status: string;
  start_date: string;
  max_students: number;
}

export const Groups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    teacher_id: '',
    start_date: new Date().toISOString().split('T')[0],
    max_students: 15,
    schedule: [
      { day: 'monday', start: '14:00', end: '16:00' }
    ]
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups/', { params: { limit: 50 } });
      setGroups(response.data.data);
    } catch (error) {
      console.error("Guruhlar yuklanmadi:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get('/courses/'),
        api.get('/users/', { params: { role: 'teacher' } })
      ]);
      setCourses(cRes.data.data || []);
      setTeachers(tRes.data.data || []);
      if (cRes.data.data.length > 0) setFormData(prev => ({ ...prev, course_id: cRes.data.data[0].id }));
    } catch (e) {
      console.error("Dependency yuklanishda xato", e);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchDependencies();
  }, []);

  const toggleDay = (dayId: string) => {
    setFormData(prev => {
      const exists = prev.schedule.find(s => s.day === dayId);
      if (exists) {
        return { ...prev, schedule: prev.schedule.filter(s => s.day !== dayId) };
      } else {
        // Osonlik uchun, birinchi tanlangan kunning vaqtidan nusxa olamiz
        const defaultTime = prev.schedule.length > 0 
          ? { start: prev.schedule[0].start, end: prev.schedule[0].end }
          : { start: '14:00', end: '16:00' };
        
        // Kunlarni to'g'ri tartiblash (Dush -> Yak)
        const newSchedule = [...prev.schedule, { day: dayId, ...defaultTime }];
        newSchedule.sort((a, b) => {
          const idxA = DAYS_MAP.findIndex(d => d.id === a.day);
          const idxB = DAYS_MAP.findIndex(d => d.id === b.day);
          return idxA - idxB;
        });
        
        return { ...prev, schedule: newSchedule };
      }
    });
  };

  const updateScheduleTime = (dayId: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => {
      const newSchedule = prev.schedule.map(s => 
        s.day === dayId ? { ...s, [field]: value } : s
      );
      return { ...prev, schedule: newSchedule };
    });
  };

  const syncAllTimes = (sourceDayId: string) => {
    setFormData(prev => {
      const source = prev.schedule.find(s => s.day === sourceDayId);
      if (!source) return prev;
      
      const newSchedule = prev.schedule.map(s => ({
        ...s,
        start: source.start,
        end: source.end
      }));
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    if (formData.schedule.length === 0) {
      setFormError("Kamida bitta kun tanlanishi kerak!");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const payload = {
        ...formData,
        teacher_id: formData.teacher_id || null, // Optional in backend
      };
      await api.post('/groups/', payload);
      setIsModalOpen(false);
      fetchGroups();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups by search manually since backend search might not be implemented for groups
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Guruhlar (Akademik)</h2>
          <p className="text-gray-400 mt-1">O'quv markazning barcha guruhlari va ularning holati.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yangi guruh
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Guruh nomini qidirish..." 
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
                <th className="px-6 py-4">Guruh nomi</th>
                <th className="px-6 py-4">Boshlanish sanasi</th>
                <th className="px-6 py-4">Sig'imi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : filteredGroups.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Guruhlar topilmadi</td></tr>
              ) : (
                filteredGroups.map(group => (
                  <tr key={group.id} onClick={() => navigate(`/admin/groups/${group.id}`)} className="hover:bg-gray-700/20 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      {group.name}
                    </td>
                    <td className="px-6 py-4 font-mono">{group.start_date}</td>
                    <td className="px-6 py-4">{group.max_students} kishi</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        group.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        group.status === 'FORMING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
              <h3 className="text-xl font-bold text-white">Yangi guruh ochish</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Guruh nomi</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Masalan: IELTS 2024-A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Kursni tanlang</label>
                  <select 
                    required
                    value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>Tanlang...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">O'qituvchi</label>
                  <select 
                    value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Biriktirilmagan</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Boshlanish sanasi</label>
                  <input 
                    type="date" required
                    value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Maksimal o'quvchilar</label>
                  <input 
                    type="number" required min="1" max="100"
                    value={formData.max_students} onChange={e => setFormData({...formData, max_students: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dars kunlari va vaqtlari (Schedule Builder) */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mt-2">
                <label className="block text-sm font-medium text-gray-400 mb-3">Dars kunlarini tanlang</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {DAYS_MAP.map(d => {
                    const isSelected = formData.schedule.some(s => s.day === d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDay(d.id)}
                        className={`w-10 h-10 rounded-full font-medium transition-all duration-200 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {formData.schedule.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-400">Tanlangan kunlar vaqti</span>
                      {formData.schedule.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => syncAllTimes(formData.schedule[0].day)}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded"
                          title="Birinchi kunning soatlarini qolgan barcha kunlarga ko'chirish"
                        >
                          <Copy className="w-3 h-3" />
                          Barchasiga qo'llash
                        </button>
                      )}
                    </div>
                    
                    {formData.schedule.map((scheduleItem) => {
                      const dayLabel = DAYS_MAP.find(d => d.id === scheduleItem.day)?.label;
                      return (
                        <div key={scheduleItem.day} className="flex items-center gap-3 bg-gray-900/50 p-2.5 rounded-lg border border-gray-700/50">
                          <div className="w-10 text-center font-bold text-gray-300">{dayLabel}</div>
                          <div className="flex-1 flex gap-2">
                            <input 
                              type="time" required
                              value={scheduleItem.start}
                              onChange={e => updateScheduleTime(scheduleItem.day, 'start', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <span className="text-gray-500 flex items-center">-</span>
                            <input 
                              type="time" required
                              value={scheduleItem.end}
                              onChange={e => updateScheduleTime(scheduleItem.day, 'end', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
