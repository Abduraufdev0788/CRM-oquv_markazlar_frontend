import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, ArrowLeft, Plus, X, UserMinus, UserCheck, Search } from 'lucide-react';

export const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', discount_pct: 0, notes: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupRes, enrollRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/students`)
      ]);
      setGroup(groupRes.data);
      setEnrollments(enrollRes.data);
    } catch (error) {
      console.error("Guruh tafsilotlari yuklanmadi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchAllStudents = async () => {
    try {
      const res = await api.get('/students/', { params: { limit: 100 } });
      const currentEnrolledIds = enrollments.map(e => e.student_id);
      const available = res.data.data.filter((s: any) => !currentEnrolledIds.includes(s.id));
      setAllStudents(available);
      if (available.length > 0) setEnrollForm(prev => ({ ...prev, student_id: available[0].id }));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredStudents = allStudents.filter(s => 
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    (s.phone && s.phone.includes(studentSearch))
  );

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...enrollForm,
        group_id: id,
        discount_pct: Number(enrollForm.discount_pct)
      };
      await api.post(`/groups/${id}/enroll`, payload);
      setIsEnrollModalOpen(false);
      fetchData();
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

  const handleDropStudent = async (enrollmentId: string) => {
    if (!window.confirm("Rostdan ham ushbu o'quvchini guruhdan chiqarmoqchimisiz?")) return;
    try {
      await api.put(`/enrollments/${enrollmentId}`, { status: 'dropped' });
      fetchData();
    } catch (err) {
      alert("O'chirishda xatolik");
    }
  };

  if (loading && !group) {
    return <div className="text-gray-400 text-center py-10">Yuklanmoqda...</div>;
  }

  if (!group) return <div className="text-red-400 text-center py-10">Guruh topilmadi</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/groups')}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{group.name}</h2>
          <p className="text-gray-400 mt-1">Status: {group.status} | Boshlanish: {group.start_date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-3 bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Guruh o'quvchilari ({enrollments.length} / {group.max_students})
            </h3>
            <button 
              onClick={() => { fetchAllStudents(); setIsEnrollModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-lg shadow-blue-500/20"
              disabled={enrollments.length >= group.max_students}
            >
              <Plus className="w-4 h-4" /> O'quvchi qo'shish
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">O'quvchi ID / Ismi</th>
                  <th className="px-6 py-4">Qo'shilgan sana</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {enrollments.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Bu guruhda o'quvchilar yo'q</td></tr>
                ) : (
                  enrollments.map((enr: any) => (
                    <tr key={enr.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4 text-white font-medium flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        {enr.student?.full_name || enr.student_id?.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 font-mono">{enr.enrolled_at}</td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          {enr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDropStudent(enr.id)}
                          className="text-red-400 hover:text-white hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                          title="Guruhdan chiqarish"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Group Info Sidebar */}
        <div className="col-span-1 space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 p-5 rounded-2xl">
            <h3 className="text-gray-300 font-bold mb-4 border-b border-gray-700 pb-2">Guruh ma'lumotlari</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex justify-between">
                <span>Kurs:</span> <span className="text-white font-medium">{group.course?.name || group.course_id}</span>
              </li>
              <li className="flex justify-between">
                <span>Ustoz:</span> <span className="text-white font-medium">{group.teacher?.full_name || 'Biriktirilmagan'}</span>
              </li>
              <li className="flex justify-between">
                <span>Xona:</span> <span className="text-white font-medium">{group.room_id || '-'}</span>
              </li>
              <li className="flex justify-between">
                <span>Tugash:</span> <span className="text-white font-medium">{group.end_date || 'Noaniq'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-blue-500/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                O'quvchi qo'shish
              </h3>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Bo'sh o'quvchilar ({filteredStudents.length} / {allStudents.length})</label>
                {allStudents.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 text-amber-400 text-sm rounded-lg border border-amber-500/20">
                    Barcha mavjud o'quvchilar bu guruhga qo'shilgan yoki o'quvchilar yo'q.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ism yoki telefon orqali qidirish..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                    {filteredStudents.length === 0 ? (
                      <div className="p-2 text-center text-gray-500 text-sm">O'quvchi topilmadi</div>
                    ) : (
                      <select 
                        required
                        size={5}
                        value={enrollForm.student_id} onChange={e => setEnrollForm({...enrollForm, student_id: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm overflow-y-auto"
                      >
                        {filteredStudents.map(s => <option key={s.id} value={s.id} className="py-1 px-2">{s.full_name} ({s.phone})</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Chegirma (%)</label>
                <input 
                  type="number" min="0" max="100"
                  value={enrollForm.discount_pct} onChange={e => setEnrollForm({...enrollForm, discount_pct: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" disabled={isSubmitting || allStudents.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 text-lg shadow-lg shadow-blue-500/25"
                >
                  {isSubmitting ? "Qo'shilmoqda..." : "Guruhga qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
