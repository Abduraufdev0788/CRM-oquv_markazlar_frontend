import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, ArrowLeft, Plus, X, UserMinus, UserCheck, Search, Edit2 } from 'lucide-react';
import { GroupFormModal, GroupFormData } from '../../components/admin/GroupFormModal';

export const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'matrix'>('students');
  const [lessons, setLessons] = useState<any[]>([]);
  const [attendanceMatrix, setAttendanceMatrix] = useState<any[]>([]);
  const [lessonLimit, setLessonLimit] = useState<number | 'all'>(10);

  // Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', discount_pct: 0, notes: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [studentToDrop, setStudentToDrop] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupRes, enrollRes, coursesRes, teachersRes, roomsRes, lessonsRes, matrixRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/students`),
        api.get('/courses/'),
        api.get('/users/', { params: { role: 'teacher' } }),
        api.get('/rooms/', { params: { limit: 100 } }),
        api.get('/lessons/', { params: { group_id: id, limit: 100 } }),
        api.get(`/attendance/group/${id}`)
      ]);
      setGroup(groupRes.data);
      setEnrollments(enrollRes.data);
      setCourses(coursesRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
      setRooms(roomsRes.data.data || []);
      setLessons(lessonsRes.data.data || []);
      setAttendanceMatrix(matrixRes.data.data || []);
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
      const res = await api.get('/students/', { params: { limit: 5000 } });
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

  const confirmDropStudent = async () => {
    if (!studentToDrop) return;
    try {
      await api.put(`/enrollments/${studentToDrop}`, { status: 'dropped' });
      fetchData();
    } catch (err) {
      alert("O'chirishda xatolik");
    } finally {
      setStudentToDrop(null);
    }
  };

  const handleEditGroupSubmit = async (data: GroupFormData) => {
    setEditFormError('');
    setIsEditSubmitting(true);
    
    if (data.schedule.length === 0) {
      setEditFormError("Kamida bitta kun tanlanishi kerak!");
      setIsEditSubmitting(false);
      return;
    }
    
    try {
      const payload = {
        ...data,
        course_id: data.course_id || null,
        room_id: data.room_id || null, // Optional in backend
        teacher_id: data.teacher_id || null, // Optional in backend
      };
      await api.put(`/groups/${id}`, payload);
      setIsEditModalOpen(false);
      fetchData(); // Guruh malumotlarini yangilash
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let errorMessage = "Xatolik yuz berdi";
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join(', ');
      }
      setEditFormError(errorMessage);
    } finally {
      setIsEditSubmitting(false);
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
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {group.name}
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Guruhni tahrirlash"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </h2>
          <p className="text-gray-400 mt-1">Status: {group.status} | Boshlanish: {group.start_date}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-700 w-fit mb-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
            activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'
          }`}
        >
          O'quvchilar ro'yxati
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
            activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'
          }`}
        >
          Davomat Jadvali
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${activeTab === 'matrix' ? 'hidden' : ''}`}>
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
                          onClick={() => setStudentToDrop(enr.id)}
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
                <span>O'quvchilar:</span> <span className="text-white font-medium">{enrollments.length} / {group.max_students}</span>
              </li>
              <li className="flex justify-between">
                <span>Xona:</span> <span className="text-white font-medium">{group.room?.name || rooms.find((r: any) => r.id === group.room_id)?.name || 'Biriktirilmagan'}</span>
              </li>
              <li className="flex justify-between">
                <span>Tugash:</span> <span className="text-white font-medium">{group.end_date || (group.course?.duration_months ? `Taxminan: ${new Date(new Date(group.start_date).getTime() + group.course.duration_months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}` : 'Noaniq')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {activeTab === 'matrix' && (
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 min-h-[600px] flex flex-col">
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              Davomat Jurnali (Matrix)
            </h3>
            <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50 shadow-inner flex-wrap gap-1">
              <button 
                onClick={() => setLessonLimit(10)} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lessonLimit === 10 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                Oxirgi 10
              </button>
              <button 
                onClick={() => setLessonLimit(20)} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lessonLimit === 20 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                Oxirgi 20
              </button>
              <button 
                onClick={() => setLessonLimit('all')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lessonLimit === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                Barchasi
              </button>
            </div>
          </div>
          <div className="overflow-x-auto hide-scrollbar flex-1">
            <table className="w-full text-left text-base text-gray-300 border-collapse">
              <thead className="bg-[#12121A] text-gray-400 uppercase text-sm tracking-wider">
                <tr>
                  <th className="px-8 py-6 font-bold border-b border-gray-700/80 sticky left-0 bg-[#12121A] z-10 w-20 text-center shadow-[1px_0_0_#374151]">#</th>
                  <th className="px-8 py-6 font-bold border-b border-gray-700/80 sticky left-[80px] bg-[#12121A] z-10 min-w-[250px] shadow-[1px_0_0_#374151]">O'quvchi</th>
                  {(lessonLimit === 'all' ? [...lessons].reverse() : [...lessons].slice(0, lessonLimit).reverse()).map(lesson => (
                    <th key={lesson.id} className="px-4 py-6 font-semibold border-b border-gray-700/50 text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-sm text-gray-500 whitespace-nowrap">{lesson.lesson_date.substring(5)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-8 py-6 font-semibold border-b border-gray-700/50 text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50 bg-gray-800/20">
                {enrollments.map((enr, i) => {
                  let presentCount = 0;
                  let totalCount = 0;

                  return (
                    <tr key={enr.student_id} className="group/row hover:bg-gray-800/60 transition-colors">
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 font-bold sticky left-0 bg-[#15151f] group-hover/row:bg-gray-800 z-10 text-center border-b border-gray-700/30 shadow-[1px_0_0_#374151]">{i + 1}</td>
                      <td className="px-8 py-6 font-bold text-gray-200 sticky left-[80px] bg-[#15151f] group-hover/row:bg-gray-800 z-10 whitespace-nowrap border-b border-gray-700/30 shadow-[1px_0_0_#374151]">
                        {enr.student?.full_name || "Noma'lum"}
                      </td>
                      {(lessonLimit === 'all' ? [...lessons].reverse() : [...lessons].slice(0, lessonLimit).reverse()).map(lesson => {
                        const att = attendanceMatrix.find(a => a.student_id === enr.student_id && a.lesson_id === lesson.id);
                        
                        if (att) totalCount++;
                        if (att?.status === 'present') presentCount++;

                        return (
                          <td key={lesson.id} className="px-4 py-6 text-center border-b border-gray-700/30">
                            {att ? (
                              att.status === 'present' ? (
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-110" title="Keldi">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                              ) : att.status === 'absent' ? (
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-transform hover:scale-110" title="Kelmadi">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </div>
                              ) : att.status === 'late' ? (
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform hover:scale-110" title="Kechikdi">
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 transition-transform hover:scale-110" title="Sababli">
                                  ℹ️
                                </div>
                              )
                            ) : (
                              <span className="text-gray-600 font-medium text-lg">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-8 py-6 border-b border-gray-700/30">
                        {totalCount > 0 ? (
                          <div className="flex items-center gap-4 justify-end min-w-[150px]">
                            <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (presentCount / totalCount) >= 0.8 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' :
                                  (presentCount / totalCount) >= 0.6 ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                                }`}
                                style={{ width: `${Math.round((presentCount / totalCount) * 100)}%` }}
                              ></div>
                            </div>
                            <span className={`w-14 text-right font-black text-lg ${
                              (presentCount / totalCount) >= 0.8 ? 'text-emerald-400' :
                              (presentCount / totalCount) >= 0.6 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {Math.round((presentCount / totalCount) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 justify-end min-w-[150px]">
                            <div className="flex-1 h-3 bg-gray-800 rounded-full shadow-inner"></div>
                            <span className="w-14 text-right text-gray-600 font-black text-lg">0%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Drop Confirm Modal */}
      {studentToDrop && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-red-500/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Tasdiqlash
              </h3>
              <button onClick={() => setStudentToDrop(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-center">
                Rostdan ham ushbu o'quvchini guruhdan chiqarmoqchimisiz?
              </p>
              
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setStudentToDrop(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  Yo'q
                </button>
                <button 
                  onClick={confirmDropStudent}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-red-500/25"
                >
                  Ha, chiqarish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {group && (
        <GroupFormModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditGroupSubmit}
          initialData={{
            name: group.name,
            course_id: group.course_id,
            room_id: group.room_id || '',
            teacher_id: group.teacher_id || '',
            start_date: group.start_date,
            max_students: group.max_students,
            schedule: group.schedule || []
          }}
          courses={courses}
          teachers={teachers}
          rooms={rooms}
          isSubmitting={isEditSubmitting}
          formError={editFormError}
          title="Guruhni tahrirlash"
        />
      )}
    </div>
  );
};
