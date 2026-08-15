import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Save, Plus, Edit2, BookOpen, Star, FileText, MessageSquare } from 'lucide-react';

export const TeacherGroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [group, setGroup] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  const [isAttendanceSaved, setIsAttendanceSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'homework' | 'matrix' | 'hw_matrix'>(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'attendance' || tab === 'homework' || tab === 'matrix' || tab === 'hw_matrix') return tab;
    return 'info';
  });
  
  // Homework states
  const [currentHomework, setCurrentHomework] = useState<any>(null);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<Record<string, any>>({});
  const [homeworkGrades, setHomeworkGrades] = useState<Record<string, any>>({});
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [newHomeworkForm, setNewHomeworkForm] = useState({ title: '', max_score: 100, due_date: '' });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttendanceLoaded, setIsAttendanceLoaded] = useState(false);
  const [attendanceMatrix, setAttendanceMatrix] = useState<any[]>([]);
  const [homeworkMatrix, setHomeworkMatrix] = useState<any[]>([]);
  const [formError, setFormError] = useState('');

  // Automation states
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  const [timeStatus, setTimeStatus] = useState<'NO_LESSON' | 'EARLY' | 'NOW' | 'PASSED'>('NO_LESSON');
  const [timeMessage, setTimeMessage] = useState('');
  const [lessonLimit, setLessonLimit] = useState<number | 'all'>(10);
  
  // Lesson Modal State (O'qituvchilar endi modal orqali emas, avtomat ochadi, lekin zaxira uchun saqlaymiz)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    topic: '',
    lesson_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupRes, studentsRes, lessonsRes, matrixRes, gradesRes] = await Promise.all([
          api.get(`/groups/${id}`),
          api.get(`/groups/${id}/students`),
          api.get('/lessons/', { params: { group_id: id, limit: lessonLimit === 'all' ? 1000 : lessonLimit } }),
          api.get(`/attendance/group/${id}`),
          api.get('/grades/', { params: { group_id: id, limit: 1000 } })
        ]);
        setGroup(groupRes.data);
        setStudents(studentsRes.data);
        setAttendanceMatrix(matrixRes.data.data || []);
        setHomeworkMatrix(gradesRes.data.data || []);
        
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

  // Har minutda vaqtni tekshiramiz
  useEffect(() => {
    if (!group || !group.schedule) return;
    
    const checkTime = () => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const now = new Date();
      const todayName = days[now.getDay()];
      const scheduleToday = group.schedule.find((s: any) => s.day === todayName);
      
      setTodaySchedule(scheduleToday);
      
      if (!scheduleToday) {
        setTimeStatus('NO_LESSON');
        setTimeMessage("Bugun ushbu guruh uchun dars belgilanmagan");
        return;
      }

      const [startH, startM] = scheduleToday.start.split(':').map(Number);
      const [endH, endM] = scheduleToday.end.split(':').map(Number);
      
      const startTime = new Date();
      startTime.setHours(startH, startM, 0, 0);
      
      const endTime = new Date();
      endTime.setHours(endH, endM, 0, 0);
      
      if (now < startTime) {
        setTimeStatus('EARLY');
        setTimeMessage(`Dars vaqti hali kelmadi (Boshlanish: ${scheduleToday.start})`);
      } else if (now >= startTime && now <= endTime) {
        setTimeStatus('NOW');
        setTimeMessage(`Dars davom etmoqda (${scheduleToday.start} - ${scheduleToday.end})`);
      } else {
        setTimeStatus('PASSED');
        setTimeMessage("Dars yakunlangan");
      }
    };
    
    checkTime();
    const interval = setInterval(checkTime, 60000); // Har 1 daqiqada yangilanadi
    return () => clearInterval(interval);
  }, [group]);

  const autoSavedRef = React.useRef<Record<string, boolean>>({});

  // Avtomatik saqlash effekti (dars o'tgan bo'lsa)
  useEffect(() => {
    if (timeStatus === 'PASSED' && selectedLesson && isAttendanceLoaded) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedLesson.lesson_date === todayStr && !isAttendanceSaved && !autoSavedRef.current[selectedLesson.id]) {
        // Faqat bugungi dars o'tib ketgan bo'lsa va hali saqlanmagan bo'lsa saqlaymiz
        autoSavedRef.current[selectedLesson.id] = true;
        handleSaveAttendance(true);
      }
    }
  }, [timeStatus, selectedLesson, isAttendanceLoaded, isAttendanceSaved]);

  const handleLessonSelect = async (lesson: any) => {
    setSelectedLesson(lesson);
    setIsAttendanceLoaded(false);
    try {
      const attRes = await api.get('/attendance/', { 
        params: { lesson_id: lesson.id, limit: 100 },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const attData = attRes.data.data || [];
      const newState: Record<string, string> = {};
      
      if (attData.length > 0) {
        attData.forEach((att: any) => {
          newState[att.student_id] = att.status.toLowerCase();
        });
        setIsAttendanceSaved(true);
      } else {
        // Agar umuman yo'qlama qilinmagan bo'lsa, barchasini "present" (Keldi) deb olamiz
        students.forEach((s: any) => {
          newState[s.student_id] = 'present';
        });
        setIsAttendanceSaved(false);
      }
      setAttendanceState(newState);
      setIsAttendanceLoaded(true);
    } catch (e) {
      console.error(e);
    }
    
    // Fetch homework info
    try {
      const hwRes = await api.get(`/lessons/${lesson.id}/homeworks`);
      const hws = hwRes.data;
      if (hws && hws.length > 0) {
        setCurrentHomework(hws[0]);
        const [subRes, gradeRes] = await Promise.all([
          api.get(`/homework/${hws[0].id}/submissions`),
          api.get(`/grades/`, { params: { lesson_id: lesson.id, limit: 100 } })
        ]);
        
        const subsObj: Record<string, any> = {};
        subRes.data.forEach((s: any) => { subsObj[s.student_id] = s; });
        setHomeworkSubmissions(subsObj);
        
        const gradesObj: Record<string, any> = {};
        gradeRes.data.data.forEach((g: any) => { 
          if (g.grade_type === 'homework') {
             gradesObj[g.student_id] = { score: g.score, comment: g.comment || '', id: g.id }; 
          }
        });
        setHomeworkGrades(gradesObj);
      } else {
        setCurrentHomework(null);
        setHomeworkSubmissions({});
        setHomeworkGrades({});
      }
    } catch(e) {
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
    if (isAttendanceSaved) return;
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async (auto = false) => {
    if (!selectedLesson) return;
    if (isSubmitting || isAttendanceSaved) return; // Prevent double submission or edits
    
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
      
      // Davomat jadvalini avtomatik yangilash
      try {
        const matrixRes = await api.get(`/attendance/group/${id}`);
        setAttendanceMatrix(matrixRes.data.data || []);
      } catch (e) {
        console.error("Matrixni yangilashda xatolik", e);
      }

      if (!auto) {
        alert("Davomat muvaffaqiyatli saqlandi!");
      }
      setIsAttendanceSaved(true);
    } catch (err: any) {
      if (!auto) {
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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;
    setIsSubmitting(true);
    try {
      const payload = {
        lesson_id: selectedLesson.id,
        title: newHomeworkForm.title,
        max_score: newHomeworkForm.max_score,
        due_date: newHomeworkForm.due_date ? new Date(newHomeworkForm.due_date).toISOString() : null,
      };
      const res = await api.post(`/lessons/${selectedLesson.id}/homework`, payload);
      setCurrentHomework(res.data);
      setIsHomeworkModalOpen(false);
    } catch (e: any) {
      alert("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHomework) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: newHomeworkForm.title,
        max_score: newHomeworkForm.max_score,
        due_date: newHomeworkForm.due_date ? new Date(newHomeworkForm.due_date).toISOString() : null,
      };
      const res = await api.put(`/homework/${currentHomework.id}`, payload);
      setCurrentHomework(res.data);
      setIsHomeworkModalOpen(false);
    } catch (e: any) {
      alert("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateHomeworkModal = () => {
    setNewHomeworkForm({ title: '', max_score: 100, due_date: '' });
    setIsHomeworkModalOpen(true);
  };

  const openEditHomeworkModal = () => {
    if (!currentHomework) return;
    let localDateStr = '';
    if (currentHomework.due_date) {
      const d = new Date(currentHomework.due_date);
      // local datetime-local format: YYYY-MM-DDTHH:mm
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      localDateStr = d.toISOString().slice(0, 16);
    }
    setNewHomeworkForm({
      title: currentHomework.title,
      max_score: currentHomework.max_score,
      due_date: localDateStr
    });
    setIsHomeworkModalOpen(true);
  };

  const handleGradeChange = (studentId: string, field: 'score' | 'comment', value: any) => {
    setHomeworkGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveGrades = async () => {
    if (!currentHomework) return;
    setIsSubmitting(true);
    try {
      for (const student of students) {
        const grade = homeworkGrades[student.student_id];
        if (grade && grade.score !== undefined && grade.score !== '') {
          if (grade.id) {
            await api.put(`/grades/${grade.id}`, { score: grade.score, comment: grade.comment });
          } else {
            await api.post(`/grades/`, {
              student_id: student.student_id,
              grade_type: 'homework',
              score: grade.score,
              max_score: currentHomework.max_score,
              lesson_id: selectedLesson.id,
              homework_id: currentHomework.id,
              comment: grade.comment
            });
          }
        }
      }
      alert("Baholar saqlandi!");
      
      // Update homework matrix
      try {
        const gradesRes = await api.get('/grades/', { params: { group_id: id, limit: 1000 } });
        setHomeworkMatrix(gradesRes.data.data || []);
      } catch (e) {
        console.error("Matrixni yangilashda xatolik", e);
      }
      
      // Qayta yuklash
      handleLessonSelect(selectedLesson);
    } catch (e) {
      alert("Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bugungi dars uchun modal ochish
  const openTodayLessonModal = () => {
    if (!todaySchedule || timeStatus === 'NO_LESSON') return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const existingLesson = lessons.find(l => l.lesson_date === todayStr);
    
    if (existingLesson) {
      handleLessonSelect(existingLesson);
      setActiveTab('attendance');
      return;
    }
    
    setLessonForm({
      topic: '',
      lesson_date: todayStr,
      start_time: todaySchedule.start,
      end_time: todaySchedule.end
    });
    setIsLessonModalOpen(true);
  };

  if (loading && !group) return <div className="text-gray-400 text-center py-10">Yuklanmoqda...</div>;
  if (!group) return <div className="text-red-400 text-center py-10">Guruh topilmadi</div>;

  const todayStr = new Date().toISOString().split('T')[0];
  const hasLessonToday = lessons.some(l => l.lesson_date === todayStr);

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
            <h2 className="text-2xl font-bold text-white tracking-tight">{group.name}</h2>
            <p className="text-gray-400 mt-1">O'quvchilar soni: {students.length} ta</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              activeTab === 'info' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Ma'lumotlar
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
              activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'
            }`}
          >
            Yo'qlama qilish
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
              activeTab === 'matrix' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'
            }`}
          >
            Davomat Jadvali
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
              activeTab === 'homework' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-gray-400 hover:text-white'
            }`}
          >
            Vazifa berish
          </button>
          <button
            onClick={() => setActiveTab('hw_matrix')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 ${
              activeTab === 'hw_matrix' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-gray-400 hover:text-white'
            }`}
          >
            Vazifalar Jadvali
          </button>
        </div>
        <div className="flex flex-col items-end gap-2">
          {timeStatus === 'NO_LESSON' && (
            <span className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm border border-gray-700">
              Bugun dars yo'q
            </span>
          )}
          {timeStatus === 'EARLY' && (
            <span className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-sm border border-amber-500/20 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {timeMessage}
            </span>
          )}
          {timeStatus === 'NOW' && (
            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {timeMessage}
            </span>
          )}
          {timeStatus === 'PASSED' && (
            <span className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {timeMessage}
            </span>
          )}
          
          {timeStatus !== 'NO_LESSON' && !hasLessonToday && (
            <button 
              onClick={openTodayLessonModal}
              disabled={isSubmitting}
              className="bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> Bugungi yo'qlamani ochish
            </button>
          )}
          {hasLessonToday && timeStatus !== 'NO_LESSON' && (
             <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500"/> Bugungi dars ochilgan</span>
          )}
        </div>
      </div>

      {activeTab === 'info' ? (
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Kurs</p>
              <p className="text-white font-bold">{group.course?.name || 'Noma\'lum'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Xona</p>
              <p className="text-white font-bold">{group.room?.name || 'Belgilanmagan'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Boshlangan</p>
              <p className="text-white font-bold">{group.start_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Holati</p>
              <p className="text-emerald-400 font-bold">{group.status}</p>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-700/50">
              <h3 className="text-lg font-bold text-white">O'quvchilar ro'yxati</h3>
            </div>
            {students.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Guruhda hali o'quvchilar yo'q.</div>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {students.map((student, i) => (
                  <div key={student.student_id} className="p-4 hover:bg-gray-700/20 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {student.student?.photo_url ? (
                        <img src={student.student.photo_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400">
                          {i + 1}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold">{student.student?.full_name}</p>
                        <p className="text-sm text-gray-400">{student.student?.phone || "Telefon kiritilmagan"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">
                        Aktiv
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'attendance' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lessons List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-2">
              <h3 className="text-white font-bold">Darslar tarixi</h3>
              <button 
                onClick={() => setIsLessonModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                title="O'tgan darsni qo'shish"
              >
                <Plus className="w-4 h-4" /> Qo'shish
              </button>
            </div>
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
              {selectedLesson && timeStatus !== 'EARLY' && !isAttendanceSaved && (
                <button 
                  onClick={() => handleSaveAttendance(false)}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" /> {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              )}
              {selectedLesson && isAttendanceSaved && (
                <button 
                  onClick={() => setIsAttendanceSaved(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-gray-600 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Tahrirlash
                </button>
              )}
            </div>
            
            <div className="p-4">
              {!selectedLesson ? (
                <div className="text-center text-gray-500 py-10">Chap tomondan darsni tanlang yoki yangisini yarating.</div>
              ) : students.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Bu guruhda o'quvchilar yo'q. Admin tomonidan qo'shilishi kutilmoqda.</div>
              ) : (
                <div className="p-4 space-y-3">
                  {students.map((student, i) => {
                    const status = attendanceState[student.student_id] || 'PRESENT'; // default
                    return (
                      <div key={student.student_id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#141419] hover:bg-[#1a1a24] rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 gap-4 shadow-sm hover:shadow-xl">
                        <div className="flex items-center gap-4">
                          {student.student?.photo_url ? (
                            <img src={student.student.photo_url} alt="Profile" className="w-10 h-10 rounded-xl object-cover border border-gray-700/50 shadow-inner" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-800/80 flex items-center justify-center text-gray-400 font-bold shadow-inner border border-gray-700/50">
                              {i + 1}
                            </div>
                          )}
                          <div>
                            <h4 className="text-white font-bold text-lg">{student.student?.full_name || student.student_id.slice(0, 8)}</h4>
                            <p className="text-sm text-gray-500 mt-0.5">O'quvchi</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2.5">
                          <button 
                            onClick={() => handleStatusChange(student.student_id, 'present')}
                            disabled={isAttendanceSaved}
                            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                              status === 'present' 
                                ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border-transparent' 
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                            } ${isAttendanceSaved ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <CheckCircle className="w-4 h-4" /> Keldi
                          </button>
                          
                          <button 
                            onClick={() => handleStatusChange(student.student_id, 'late')}
                            disabled={isAttendanceSaved}
                            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                              status === 'late' 
                                ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] border-transparent' 
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30'
                            } ${isAttendanceSaved ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Clock className="w-4 h-4" /> Kechikdi
                          </button>
                          
                          <button 
                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                            disabled={isAttendanceSaved}
                            className={`px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                              status === 'absent' 
                                ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] border-transparent' 
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                            } ${isAttendanceSaved ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      ) : activeTab === 'matrix' ? (
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 min-h-[600px] flex flex-col">
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              Davomat Jurnali (Matrix)
            </h3>
            <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50 shadow-inner">
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
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead className="bg-[#12121A] text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-bold border-b border-gray-700/80 sticky left-0 bg-[#12121A] z-10 w-16 text-center shadow-[1px_0_0_#374151]">#</th>
                  <th className="px-6 py-5 font-bold border-b border-gray-700/80 sticky left-[64px] bg-[#12121A] z-10 min-w-[220px] shadow-[1px_0_0_#374151]">O'quvchi</th>
                  {(lessonLimit === 'all' ? [...lessons].reverse() : [...lessons].slice(0, lessonLimit).reverse()).map(lesson => (
                    <th key={lesson.id} className="px-3 py-4 font-semibold border-b border-gray-700/50 text-center min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{lesson.lesson_date.substring(5)}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-5 py-4 font-semibold border-b border-gray-700/50 text-center">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50 bg-gray-800/20">
                {students.map((student, i) => {
                  let presentCount = 0;
                  let totalCount = 0;

                  return (
                    <tr key={student.student_id} className="group/row hover:bg-gray-800/60 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500 font-bold sticky left-0 bg-[#15151f] group-hover/row:bg-gray-800 z-10 text-center border-b border-gray-700/30 shadow-[1px_0_0_#374151]">{i + 1}</td>
                      <td className="px-6 py-5 font-bold text-gray-200 sticky left-[64px] bg-[#15151f] group-hover/row:bg-gray-800 z-10 whitespace-nowrap border-b border-gray-700/30 shadow-[1px_0_0_#374151]">
                        {student.student?.full_name || "Noma'lum"}
                      </td>
                      {(lessonLimit === 'all' ? [...lessons].reverse() : [...lessons].slice(0, lessonLimit).reverse()).map(lesson => {
                        const att = attendanceMatrix.find(a => a.student_id === student.student_id && a.lesson_id === lesson.id);
                        
                        if (att) totalCount++;
                        if (att?.status === 'present') presentCount++;

                        return (
                          <td key={lesson.id} className="px-3 py-5 text-center border-b border-gray-700/30">
                            {att ? (
                              att.status === 'present' ? (
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" title="Keldi">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              ) : att.status === 'absent' ? (
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]" title="Kelmadi">
                                  <XCircle className="w-4 h-4" />
                                </div>
                              ) : att.status === 'late' ? (
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" title="Kechikdi">
                                  <Clock className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400" title="Sababli">
                                  ℹ️
                                </div>
                              )
                            ) : (
                              <span className="text-gray-600 font-medium">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-5 border-b border-gray-700/30">
                        {totalCount > 0 ? (
                          <div className="flex items-center gap-3 justify-end min-w-[120px]">
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (presentCount / totalCount) >= 0.8 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                  (presentCount / totalCount) >= 0.6 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                }`}
                                style={{ width: `${Math.round((presentCount / totalCount) * 100)}%` }}
                              ></div>
                            </div>
                            <span className={`w-10 text-right font-bold ${
                              (presentCount / totalCount) >= 0.8 ? 'text-emerald-400' :
                              (presentCount / totalCount) >= 0.6 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {Math.round((presentCount / totalCount) * 100)}%
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 justify-end min-w-[120px]">
                            <div className="flex-1 h-2 bg-gray-800 rounded-full"></div>
                            <span className="w-10 text-right text-gray-600 font-bold">0%</span>
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
      ) : activeTab === 'hw_matrix' ? (
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 min-h-[600px] flex flex-col">
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              Vazifalar Jadvali (Uy vazifalari)
            </h3>
            <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700/50 shadow-inner">
              <button 
                onClick={() => setLessonLimit(10)} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lessonLimit === 10 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                Oxirgi 10
              </button>
              <button 
                onClick={() => setLessonLimit(20)} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lessonLimit === 20 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                Oxirgi 20
              </button>
              <button 
                onClick={() => setLessonLimit('all')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${lessonLimit === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                Barchasi
              </button>
            </div>
          </div>
          <div className="overflow-x-auto hide-scrollbar flex-1">
            <table className="w-full text-left text-sm text-gray-300 border-collapse">
              <thead className="bg-[#12121A] text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-5 font-bold border-b border-gray-700/80 sticky left-0 bg-[#12121A] z-10 w-16 text-center shadow-[1px_0_0_#374151]">#</th>
                  <th className="px-6 py-5 font-bold border-b border-gray-700/80 sticky left-[64px] bg-[#12121A] z-10 min-w-[220px] shadow-[1px_0_0_#374151]">O'quvchi</th>
                  {(lessonLimit === 'all' ? [...lessons].reverse() : [...lessons].slice(0, lessonLimit).reverse()).map(lesson => (
                    <th key={lesson.id} className="px-3 py-4 font-semibold border-b border-gray-700/50 text-center min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-purple-400 font-bold whitespace-nowrap">{lesson.lesson_date.substring(5)}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[80px]" title={lesson.topic}>{lesson.topic || 'Mavzusiz'}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-5 py-4 font-semibold border-b border-gray-700/50 text-center">O'rtacha ball</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50 bg-gray-800/20">
                {students.map((student, i) => {
                  let totalScore = 0;
                  let gradeCount = 0;

                  return (
                    <tr key={student.student_id} className="group/row hover:bg-gray-800/60 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500 font-bold sticky left-0 bg-[#15151f] group-hover/row:bg-gray-800 z-10 text-center border-b border-gray-700/30 shadow-[1px_0_0_#374151]">{i + 1}</td>
                      <td className="px-6 py-5 font-bold text-gray-200 sticky left-[64px] bg-[#15151f] group-hover/row:bg-gray-800 z-10 whitespace-nowrap border-b border-gray-700/30 shadow-[1px_0_0_#374151]">
                        {student.student?.full_name || "Noma'lum"}
                      </td>
                      {(lessonLimit === 'all' ? [...lessons].reverse() : [...lessons].slice(0, lessonLimit).reverse()).map(lesson => {
                        const grade = homeworkMatrix.find(g => g.student_id === student.student_id && g.lesson_id === lesson.id && g.grade_type === 'homework');
                        
                        if (grade && grade.score !== undefined) {
                          totalScore += grade.score;
                          gradeCount++;
                        }

                        return (
                          <td key={lesson.id} className="px-3 py-5 text-center border-b border-gray-700/30">
                            {grade ? (
                              <div className={`inline-flex items-center justify-center min-w-[2rem] px-2 h-8 rounded-xl font-bold text-xs ${
                                (grade.score / (grade.max_score || 100)) >= 0.8 ? 'bg-emerald-500/20 text-emerald-400' :
                                (grade.score / (grade.max_score || 100)) >= 0.5 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                              }`} title={grade.comment || 'Izoh yo\'q'}>
                                {grade.score}
                              </div>
                            ) : (
                              <span className="text-gray-700 font-medium text-xs">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-5 border-b border-gray-700/30 text-center">
                        {gradeCount > 0 ? (
                          <span className="text-purple-400 font-bold text-sm bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                            {Math.round(totalScore / gradeCount)}
                          </span>
                        ) : (
                          <span className="text-gray-600 font-medium text-xs">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* HOMEWORK TAB */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lessons Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700/50 pb-2">
                <h3 className="text-white font-bold">Darslar</h3>
              </div>
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
                          ? 'bg-purple-600/20 border-purple-500/30 text-white'
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

          {/* Homework Content Area */}
          <div className="lg:col-span-3">
            {!selectedLesson ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl flex items-center justify-center py-20">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Chap tomondan darsni tanlang</p>
                </div>
              </div>
            ) : !currentHomework ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
                <div className="text-center">
                  <BookOpen className="w-14 h-14 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-xl font-bold mb-2">{selectedLesson.lesson_date} — {selectedLesson.topic || 'Mavzusiz'}</h3>
                  <p className="text-gray-400 mb-6">Bu dars uchun hali uy vazifasi berilmagan.</p>
                  <button
                    onClick={openCreateHomeworkModal}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-purple-500/25"
                  >
                    <Plus className="w-5 h-5" /> Uy vazifasi berish
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Homework Header */}
                <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Uy Vazifasi</span>
                      <h3 className="text-xl font-bold text-white mt-1">{currentHomework.title}</h3>
                      {currentHomework.description && (
                        <p className="text-gray-400 text-sm mt-1">{currentHomework.description}</p>
                      )}
                      {currentHomework.due_date && (
                        <div className="flex items-center gap-2 mt-3 text-sm bg-gray-900/50 inline-flex px-3 py-1.5 rounded-lg border border-gray-700/50">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-gray-300">Muddat:</span>
                          <span className="text-amber-400 font-bold">
                            {new Date(currentHomework.due_date).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <span className="text-purple-400 font-bold text-lg">{currentHomework.max_score}</span>
                        <span className="text-gray-500 text-sm"> ball</span>
                      </div>
                      <button
                        onClick={openEditHomeworkModal}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 bg-gray-700/50 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors border border-gray-600/50"
                      >
                        <Edit2 className="w-3 h-3" /> O'zgartirish
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {Object.keys(homeworkSubmissions).length} ta javob kelgan
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {Object.keys(homeworkGrades).length} ta baholangan
                    </span>
                  </div>
                </div>

                {/* Students Grading List */}
                <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-gray-700/50 flex justify-between items-center bg-gray-800/80">
                    <h3 className="text-lg font-bold text-white">O'quvchilar va baholar</h3>
                    <button
                      onClick={handleSaveGrades}
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {isSubmitting ? 'Saqlanmoqda...' : 'Baholarni saqlash'}
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {students.map((student, i) => {
                      const sub = homeworkSubmissions[student.student_id];
                      const grade = homeworkGrades[student.student_id] || { score: '', comment: '' };
                      return (
                        <div key={student.student_id} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {/* Student Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {student.student?.photo_url ? (
                                <img src={student.student.photo_url} alt="Profile" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-600" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm flex-shrink-0">
                                  {i + 1}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-white font-semibold truncate">{student.student?.full_name || "Noma'lum"}</h4>
                                {sub ? (
                                  <div className="mt-1">
                                    {sub.content_text && (
                                      <p className="text-sm text-gray-400 bg-gray-800/70 rounded-lg p-2 mt-1 flex items-start gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                                        <span className="line-clamp-2">{sub.content_text}</span>
                                      </p>
                                    )}
                                    {sub.file_url && (
                                      <a href={`http://localhost:8001${sub.file_url}`} target="_blank" rel="noreferrer"
                                        className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                                        📎 Fayl ko'rish
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500 mt-0.5 block">Javob yuborilmagan</span>
                                )}
                              </div>
                            </div>

                            {/* Score + Comment */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={currentHomework.max_score}
                                  placeholder="Ball"
                                  value={grade.score}
                                  onChange={e => handleGradeChange(student.student_id, 'score', e.target.value)}
                                  disabled={!!grade.id}
                                  className="w-24 bg-gray-800 border border-gray-700 text-white text-center rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span className="text-gray-500 text-sm">/ {currentHomework.max_score}</span>
                              </div>
                              <input
                                type="text"
                                placeholder="Izoh (ixtiyoriy)"
                                value={grade.comment}
                                onChange={e => handleGradeChange(student.student_id, 'comment', e.target.value)}
                                disabled={!!grade.id}
                                className="w-48 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              {grade.score !== '' && (
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                  Number(grade.score) >= Number(currentHomework.max_score) * 0.8
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : Number(grade.score) >= Number(currentHomework.max_score) * 0.5
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {Math.round((Number(grade.score) / Number(currentHomework.max_score)) * 100)}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Homework Create Modal */}
      {isHomeworkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <h3 className="text-xl font-bold text-white">Uy vazifasi {currentHomework?.id && newHomeworkForm.title === currentHomework.title ? 'tahrirlash' : 'berish'}</h3>
              <button onClick={() => setIsHomeworkModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={currentHomework?.id && newHomeworkForm.title === currentHomework.title ? handleUpdateHomework : handleCreateHomework} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Vazifa sarlavhasi *</label>
                <input
                  type="text" required
                  value={newHomeworkForm.title}
                  onChange={e => setNewHomeworkForm({ ...newHomeworkForm, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                  placeholder="Masalan: Darslik 45-48 betlar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Maksimal ball</label>
                <input
                  type="number" min="1" max="1000"
                  value={newHomeworkForm.max_score}
                  onChange={e => setNewHomeworkForm({ ...newHomeworkForm, max_score: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Topshirish muddati</label>
                <input
                  type="datetime-local"
                  value={newHomeworkForm.due_date}
                  onChange={e => setNewHomeworkForm({ ...newHomeworkForm, due_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsHomeworkModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                  Bekor qilish
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> {isSubmitting ? 'Saqlanmoqda...' : 'Berishni tasdiqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
