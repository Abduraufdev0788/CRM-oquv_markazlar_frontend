import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Save, Plus } from 'lucide-react';

export const TeacherGroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    topic: '',
    lesson_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupRes, studentsRes, lessonsRes] = await Promise.all([
          api.get(`/groups/${id}`),
          api.get(`/groups/${id}/students`),
          api.get('/lessons/', { params: { group_id: id, limit: 50 } })
        ]);
        setGroup(groupRes.data);
        setStudents(studentsRes.data);
        
        const lessonsData = lessonsRes.data.data || [];
        setLessons(lessonsData);
        if (lessonsData.length > 0) {
          handleLessonSelect(lessonsData[0]);
        }
      } catch (error) {
        console.error("Ma'lumotlar yuklanmadi", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleLessonSelect = async (lesson: any) => {
    setSelectedLesson(lesson);
    try {
      const attRes = await api.get('/attendance/', { params: { lesson_id: lesson.id, limit: 100 } });
      const attData = attRes.data.data || [];
      const newState: Record<string, string> = {};
      attData.forEach((att: any) => {
        newState[att.student_id] = att.status;
      });
      setAttendanceState(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const payload = {
        group_id: id,
        title: lessonForm.topic || "Yangi dars",
        lesson_date: lessonForm.lesson_date,
        start_time: lessonForm.start_time,
        end_time: lessonForm.end_time,
        topic: lessonForm.topic
      };
      const res = await api.post('/lessons/', payload);
      const newLesson = res.data;
      setLessons([newLesson, ...lessons]);
      handleLessonSelect(newLesson);
      setIsLessonModalOpen(false);
      setLessonForm({
        topic: '',
        lesson_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '11:00'
      });
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

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedLesson) return;
    setIsSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        lesson_id: selectedLesson.id,
        status: attendanceState[s.student_id] || 'present'
      }));
      
      await api.post('/attendance/bulk', {
        lesson_id: selectedLesson.id,
        records
      });
      alert("Davomat muvaffaqiyatli saqlandi!");
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
      alert(`Xatolik: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !group) return <div className="text-gray-400 text-center py-10">Yuklanmoqda...</div>;
  if (!group) return <div className="text-red-400 text-center py-10">Guruh topilmadi</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/teacher')}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{group.name} - Yo'qlama</h2>
            <p className="text-gray-400 mt-1">O'quvchilar soni: {students.length} ta</p>
          </div>
        </div>
        <button 
          onClick={() => setIsLessonModalOpen(true)}
          className="bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Yangi dars
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lessons List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
            <h3 className="text-white font-bold mb-4 border-b border-gray-700/50 pb-2">Darslar tarixi</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {lessons.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Hali darslar yo'q</p>
              ) : (
                lessons.map(lesson => (
                  <div 
                    key={lesson.id} 
                    onClick={() => handleLessonSelect(lesson)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                      selectedLesson?.id === lesson.id 
                        ? 'bg-blue-600/20 border-blue-500/30 text-white' 
                        : 'bg-gray-900/50 border-gray-700 hover:border-gray-500 text-gray-400'
                    }`}
                  >
                    <div className="font-medium text-sm">{lesson.lesson_date}</div>
                    <div className="text-xs mt-1 truncate">{lesson.topic || 'Mavzusiz'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Attendance Area */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
              <h3 className="text-lg font-bold text-white">
                {selectedLesson ? `Davomat: ${selectedLesson.lesson_date}` : 'Dars tanlang'}
              </h3>
              {selectedLesson && (
                <button 
                  onClick={handleSaveAttendance}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" /> {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              )}
            </div>
            
            <div className="p-4">
              {!selectedLesson ? (
                <div className="text-center text-gray-500 py-10">Chap tomondan darsni tanlang yoki yangisini yarating.</div>
              ) : students.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Bu guruhda o'quvchilar yo'q. Admin tomonidan qo'shilishi kutilmoqda.</div>
              ) : (
                <div className="space-y-3">
                  {students.map((student, i) => {
                    const status = attendanceState[student.student_id] || 'PRESENT'; // default
                    return (
                      <div key={student.student_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm">
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{student.student?.full_name || student.student_id.slice(0, 8)}</h4>
                            <p className="text-xs text-gray-400">O'quvchi</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleStatusChange(student.student_id, 'present')}
                            className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border ${
                              status === 'present' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" /> Keldi
                          </button>
                          
                          <button 
                            onClick={() => handleStatusChange(student.student_id, 'late')}
                            className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border ${
                              status === 'late' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            <Clock className="w-4 h-4" /> Kechikdi
                          </button>
                          
                          <button 
                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                            className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border ${
                              status === 'absent' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            <XCircle className="w-4 h-4" /> Kelmadi
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Create Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <h3 className="text-xl font-bold text-white">Yangi dars qo'shish</h3>
              <button onClick={() => setIsLessonModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {formError && (
              <div className="mx-5 mt-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleCreateLessonSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Mavzu nomi</label>
                <input 
                  type="text" required
                  value={lessonForm.topic} onChange={e => setLessonForm({...lessonForm, topic: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                  placeholder="Masalan: Unit 1: Introduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sana</label>
                <input 
                  type="date" required
                  value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Boshlanish vaqti</label>
                  <input 
                    type="time" required
                    value={lessonForm.start_time} onChange={e => setLessonForm({...lessonForm, start_time: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Tugash vaqti</label>
                  <input 
                    type="time" required
                    value={lessonForm.end_time} onChange={e => setLessonForm({...lessonForm, end_time: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsLessonModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Bekor qilish
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
