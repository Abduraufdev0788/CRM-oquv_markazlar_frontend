import React, { useState, useEffect } from 'react';
import { Calendar, Wallet, Award, BookOpen, CheckCircle, Clock, Send, FileText, MessageSquare, ChevronDown, ChevronUp, Paperclip, X, XCircle } from 'lucide-react';
import { api } from '../../services/api';

export const StudentDashboard: React.FC = () => {
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'homework' | 'attendance'>('overview');

  // Homework submission state
  const [expandedHw, setExpandedHw] = useState<string | null>(null);
  const [submissionTexts, setSubmissionTexts] = useState<Record<string, string>>({});
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const getTimeLeft = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    if (days > 0) return `${days} kun, ${hours} soat qoldi`;
    if (hours > 0) return `${hours} soat, ${minutes} daq qoldi`;
    return `${minutes} daq qoldi`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, enrollRes, attRes, hwRes] = await Promise.all([
          api.get('/student-portal/me'),
          api.get('/student-portal/enrollments'),
          api.get('/student-portal/attendance'),
          api.get('/student-portal/homeworks').catch(() => ({ data: { data: [] } }))
        ]);
        setStudent(meRes.data);
        setEnrollments(enrollRes.data.data || []);
        setAttendance(attRes.data.data || []);
        setHomeworks(hwRes.data.data || []);
      } catch (error) {
        console.error("Failed to load student data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'homework' && !loading) {
      const doneHws = homeworks.filter(h => h.submitted);
      const hasPerfectScore = doneHws.some(hw => hw.grade_score !== null && hw.grade_score >= hw.max_score);
      if (hasPerfectScore && !sessionStorage.getItem('confettiShown')) {
        setShowConfetti(true);
        sessionStorage.setItem('confettiShown', 'true');
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [activeTab, homeworks, loading]);

  const handleSubmitHomework = async (hwId: string) => {
    const text = submissionTexts[hwId] || '';
    const file = submissionFiles[hwId];
    if (!text.trim() && !file) return;
    
    setSubmitting(hwId);
    let fileUrl = null;
    
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = uploadRes.data.file_url;
      }

      await api.post(`/student-portal/homeworks/${hwId}/submit`, { 
        content_text: text || null,
        file_url: fileUrl || null
      });
      // Refresh homeworks
      const hwRes = await api.get('/student-portal/homeworks').catch(() => ({ data: { data: [] } }));
      setHomeworks(hwRes.data.data || []);
      setExpandedHw(null);
      setSubmissionTexts(prev => ({ ...prev, [hwId]: '' }));
      setSubmissionFiles(prev => ({ ...prev, [hwId]: null }));
    } catch (e) {
      alert("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleFileChange = (hwId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSubmissionFiles(prev => ({ ...prev, [hwId]: file }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return <div className="text-red-400 text-center py-10">Ma'lumot topilmadi. Tizimga qayta kiring.</div>;
  }

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendancePercent = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const pendingHomeworks = homeworks.filter(h => !h.submitted);
  const doneHomeworks = homeworks.filter(h => h.submitted);

  return (
    <div className="relative min-h-screen space-y-8 animate-in fade-in duration-700 pb-24 p-4 sm:p-6 lg:p-10 overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 70 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] left-[60%] w-64 h-64 bg-pink-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold tracking-wide uppercase text-sm">
            O'quvchi Paneli
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Salom, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">{student.full_name.split(' ')[0]}</span>! 👋
          </h2>
          <p className="text-gray-400 text-lg mt-2 max-w-xl">
            Bugungi darslaringiz va vazifalaringiz bilan tanishing. Har bir qadamda muvaffaqiyat sari olg'a!
          </p>
        </div>
        
        {pendingHomeworks.length > 0 && (
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative flex items-center gap-3 px-6 py-3 bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <BookOpen className="w-5 h-5 text-amber-400 animate-bounce" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Bajarilmagan</p>
                <p className="text-amber-400 font-bold">{pendingHomeworks.length} ta vazifa kutmoqda</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Balance Card */}
        <div className="group relative p-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden animate-spring" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full bg-gray-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                student.balance < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {student.balance < 0 ? 'Qarzdorlik' : 'To\'langan'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Mening Hisobim</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {new Intl.NumberFormat('uz-UZ').format(student.balance)} <span className="text-lg text-gray-500 font-normal">so'm</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="group relative p-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden animate-spring" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full bg-gray-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    attendancePercent >= 80 ? 'bg-emerald-500' : attendancePercent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${attendancePercent}%` }}></div>
                </div>
                <span className="text-sm font-bold text-white">{attendancePercent}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Davomat Holati</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {presentCount} <span className="text-lg text-gray-500 font-normal">/ {attendance.length}</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Homeworks Card */}
        <div className="group relative p-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden animate-spring" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative h-full bg-gray-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-xs font-bold bg-white/5 text-gray-300 px-3 py-1.5 rounded-xl border border-white/10">
                {doneHomeworks.length} / {homeworks.length}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">Bajarilgan Vazifalar</p>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {doneHomeworks.length} <span className="text-lg text-gray-500 font-normal">ta</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Modern Tabs */}
      <div className="flex justify-center relative z-20 sticky top-4">
        <div className="flex items-center p-1.5 bg-gray-900/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-x-auto no-scrollbar max-w-full w-full sm:w-auto">
          {(['overview', 'homework', 'attendance'] as const).map(tab => {
            const isActive = activeTab === tab;
            const labels = { overview: "Guruhlarim", homework: "Vazifalar", attendance: "Davomat" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 whitespace-nowrap px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {labels[tab]}
                  {tab === 'homework' && pendingHomeworks.length > 0 && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-white/20' : 'bg-purple-500/20 text-purple-400'}`}>
                      {pendingHomeworks.length}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="relative z-10 animate-spring duration-500">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-white/5">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg"><BookOpen className="w-5 h-5 text-blue-400" /></div>
                Mening Guruhlarim
              </h3>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-lg">Hozircha guruhlaringiz yo'q</p>
                </div>
              ) : (
                enrollments.map((enr, i) => (
                  <div key={i} className="group relative p-6 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 rounded-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-5 pl-2">
                      <div className="text-center px-4 py-3 bg-gray-900 rounded-xl border border-white/5 shadow-inner">
                        <span className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Boshlangan</span>
                        <span className="block text-sm font-extrabold text-white">{enr.start_date || "Noma'lum"}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xl tracking-tight">{enr.group_name}</h4>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> {enr.status}
                        </p>
                      </div>
                    </div>
                    <button className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors border border-white/5">
                      Guruhga o'tish
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* HOMEWORK TAB */}
        {activeTab === 'homework' && (
          <div className="space-y-8">
            {/* Pending Homeworks */}
            {pendingHomeworks.length > 0 && (
              <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg relative">
                      <span className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    Kutilayotgan Vazifalar
                  </h3>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-bold">
                    {pendingHomeworks.length} ta
                  </span>
                </div>
                
                <div className="p-6 md:p-8 space-y-4">
                  {pendingHomeworks.map(hw => {
                    const isLate = hw.due_date && new Date() > new Date(hw.due_date);
                    const isExpanded = expandedHw === hw.id;
                    return (
                      <div key={hw.id} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-white/[0.04] border-white/10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'} ${isLate ? 'opacity-80' : ''}`}>
                        <div 
                          className="p-5 md:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                          onClick={() => setExpandedHw(isExpanded ? null : hw.id)}
                        >
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                {hw.group_name}
                              </span>
                              <span className="text-xs text-gray-400 font-medium bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                {hw.lesson_date}
                              </span>
                              {hw.due_date && (
                                <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${isLate ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-blue-400 border-blue-500/20 bg-blue-500/10'}`}>
                                  {isLate ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {isLate ? 'Muddat tugagan:' : 'Muddat:'} {new Date(hw.due_date).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                                  {!isLate && <span className="ml-1 opacity-80">({getTimeLeft(hw.due_date) || 'vaqt tugadi'})</span>}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xl font-bold text-white mb-1">{hw.title}</h4>
                            {hw.lesson_topic && (
                              <p className="text-sm text-gray-400 line-clamp-1">{hw.lesson_topic}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                            <div className="text-right">
                              <span className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Maksimal</span>
                              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{hw.max_score} <span className="text-sm text-gray-500 font-medium">ball</span></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </div>
                          </div>
                        </div>

                        {/* Submission Area */}
                        {isExpanded && (
                          <div className="border-t border-white/5 bg-black/20 p-5 md:p-6 animate-in slide-in-from-top-2 duration-300">
                            {isLate ? (
                              <div className="text-center py-8 bg-red-500/5 border border-red-500/10 rounded-2xl">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Clock className="w-6 h-6 text-red-400" />
                                </div>
                                <p className="text-red-400 font-bold text-lg">Vazifa topshirish muddati tugagan</p>
                                <p className="text-gray-500 mt-1">Bu vazifani endi topshira olmaysiz.</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                                    <MessageSquare className="w-4 h-4 text-purple-400" /> Javobingiz
                                  </label>
                                  <textarea
                                    rows={4}
                                    className="w-full bg-gray-900/80 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none placeholder-gray-600 shadow-inner"
                                    placeholder="Ustozingiz uchun javob yoki xabar yozing..."
                                    value={submissionTexts[hw.id] || ''}
                                    onChange={e => setSubmissionTexts(prev => ({ ...prev, [hw.id]: e.target.value }))}
                                  />
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="w-full sm:w-auto">
                                    {submissionFiles[hw.id] ? (
                                      <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 rounded-xl">
                                        <div className="p-1.5 bg-blue-500/20 rounded-lg"><FileText className="w-4 h-4 text-blue-400" /></div>
                                        <span className="text-blue-100 text-sm font-medium truncate max-w-[150px] md:max-w-[200px]">
                                          {submissionFiles[hw.id]?.name}
                                        </span>
                                        <button onClick={() => setSubmissionFiles(prev => ({ ...prev, [hw.id]: null }))} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
                                          <X className="w-4 h-4 text-blue-400" />
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <input
                                          type="file"
                                          id={`file-${hw.id}`}
                                          className="hidden"
                                          onChange={(e) => handleFileChange(hw.id, e)}
                                        />
                                        <label
                                          htmlFor={`file-${hw.id}`}
                                          className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-xl transition-all shadow-sm"
                                        >
                                          <Paperclip className="w-4 h-4" /> Fayl biriktirish
                                        </label>
                                      </>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleSubmitHomework(hw.id)}
                                    disabled={submitting === hw.id || (!(submissionTexts[hw.id] || '').trim() && !submissionFiles[hw.id])}
                                    className="w-full sm:w-auto relative group disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300 disabled:hidden"></div>
                                    <div className="relative bg-gray-900 border border-white/10 px-6 py-3 rounded-xl flex items-center justify-center gap-2">
                                      <Send className={`w-4 h-4 ${submitting === hw.id ? 'animate-pulse text-purple-400' : 'text-purple-400'}`} />
                                      <span className="font-bold text-white">{submitting === hw.id ? "Yuborilmoqda..." : "Yuborish"}</span>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Done Homeworks */}
            {doneHomeworks.length > 0 && (
              <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    Bajarilgan Vazifalar
                  </h3>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold">
                    {doneHomeworks.length} ta
                  </span>
                </div>
                
                <div className="p-6 md:p-8 space-y-5">
                  {doneHomeworks.map(hw => (
                    <div key={hw.id} className="relative p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col md:flex-row gap-6 hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              <CheckCircle className="w-3 h-3" /> Yuborilgan
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{hw.group_name}</span>
                          </div>
                          <h4 className="text-xl font-bold text-white">{hw.title}</h4>
                        </div>

                        {/* Submission Details */}
                        <div className="space-y-2">
                          {hw.submission_content && (
                            <div className="flex gap-3 p-3 bg-gray-900/50 rounded-xl border border-white/5">
                              <FileText className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-gray-300">{hw.submission_content}</p>
                            </div>
                          )}
                          {hw.submission_file && (
                            <a href={`http://localhost:8001${hw.submission_file}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-sm font-bold border border-blue-500/20 transition-colors">
                              <Paperclip className="w-4 h-4" /> Biriktirilgan faylni yuklab olish
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Grade Display Area */}
                      <div className="md:w-72 shrink-0">
                        {hw.grade_score !== null && hw.grade_score !== undefined ? (
                          <div className="h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-5 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)] flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
                            <p className="text-xs text-purple-300 uppercase tracking-widest font-bold mb-2">Natija</p>
                            
                            <div className="flex items-baseline gap-2 mb-3">
                              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{hw.grade_score}</span>
                              <span className="text-gray-400 font-medium">/ {hw.max_score}</span>
                              
                              <div className="ml-auto">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-lg ${
                                  (hw.grade_score / hw.max_score) >= 0.8 ? 'bg-emerald-500 text-white' :
                                  (hw.grade_score / hw.max_score) >= 0.5 ? 'bg-amber-500 text-white' :
                                  'bg-red-500 text-white'
                                }`}>
                                  {Math.round((hw.grade_score / hw.max_score) * 100)}%
                                </span>
                              </div>
                            </div>
                            
                            {hw.grade_comment && (
                              <div className="mt-auto pt-3 border-t border-purple-500/20">
                                <p className="text-sm text-purple-200/80 italic flex gap-2">
                                  <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                  "{hw.grade_comment}"
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white/[0.01]">
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3">
                              <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-400">Tekshirilmoqda</p>
                            <p className="text-xs text-gray-500 mt-1">Ustozingiz tez orada baholaydi</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {homeworks.length === 0 && (
              <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/10">
                  <Award className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Vazifalar yo'q</h3>
                <p className="text-gray-400 text-lg">Hozircha ustozlaringiz tomonidan uy vazifalari biriktirilmagan.</p>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg"><Calendar className="w-5 h-5 text-blue-400" /></div>
                Davomat Tarixi
              </h3>
              <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-xl border border-white/5">
                <span className="text-sm text-gray-400 px-2">Jami: <span className="font-bold text-white">{attendance.length}</span> dars</span>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-black shadow-lg ${
                  attendancePercent >= 80 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>{attendancePercent}% ko'rsatkich</span>
              </div>
            </div>
            
            <div className="p-6 md:p-8">
              {attendance.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Davomat ma'lumotlari hozircha yo'q.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attendance.map((att, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold mb-1">{att.lesson_date}</p>
                        {att.topic && <p className="text-xs text-gray-400 line-clamp-1">{att.topic}</p>}
                      </div>
                      <div className="shrink-0">
                        {att.status === 'present' ? (
                          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400" title="Keldi">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        ) : att.status === 'late' ? (
                          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400" title="Kechikdi">
                            <Clock className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400" title="Kelmadi">
                            <X className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
