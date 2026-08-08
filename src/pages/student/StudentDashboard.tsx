import React, { useState, useEffect } from 'react';
import { Calendar, Wallet, Award, BookOpen, CheckCircle, Clock, Send, FileText, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState<string | null>(null);

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

  const handleSubmitHomework = async (hwId: string) => {
    const text = submissionTexts[hwId] || '';
    if (!text.trim()) return;
    setSubmitting(hwId);
    try {
      await api.post(`/student-portal/homework/${hwId}/submit`, null, {
        params: { content_text: text }
      });
      // Refresh homeworks
      const hwRes = await api.get('/student-portal/homeworks');
      setHomeworks(hwRes.data.data || []);
      setExpandedHw(null);
      setSubmissionTexts(prev => ({ ...prev, [hwId]: '' }));
    } catch (e) {
      alert("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(null);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Xush kelibsiz, {student.full_name}! 👋
          </h2>
          <p className="text-gray-400 mt-1">Darslaringiz va vazifalar holati</p>
        </div>
        {pendingHomeworks.length > 0 && (
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-semibold flex items-center gap-2 animate-pulse">
            <BookOpen className="w-4 h-4" />
            {pendingHomeworks.length} ta kutilayotgan vazifa
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Wallet className="w-6 h-6" /></div>
            {student.balance < 0 ? (
              <span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/20">Qarzdorlik</span>
            ) : (
              <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">To'langan</span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400">Hisobingiz</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {new Intl.NumberFormat('uz-UZ').format(student.balance)} <span className="text-lg text-gray-500 font-normal">so'm</span>
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Calendar className="w-6 h-6" /></div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
              attendancePercent >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
              : attendancePercent >= 60 ? 'bg-amber-500/20 text-amber-400 border-amber-500/20'
              : 'bg-red-500/20 text-red-400 border-red-500/20'
            }`}>{attendancePercent}%</span>
          </div>
          <div>
            <p className="text-sm text-gray-400">Davomat</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {presentCount} <span className="text-lg text-gray-500 font-normal">/ {attendance.length} dars</span>
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><Award className="w-6 h-6" /></div>
            <span className="text-xs font-medium bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">
              {doneHomeworks.length}/{homeworks.length}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-400">Bajarilgan vazifalar</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {doneHomeworks.length} <span className="text-lg text-gray-500 font-normal">ta bajarildi</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-xl border border-gray-700 w-fit">
        {(['overview', 'homework', 'attendance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              activeTab === tab
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'overview' ? "Guruhlarim" : tab === 'homework' ? `Vazifalar ${pendingHomeworks.length > 0 ? `(${pendingHomeworks.length})` : ''}` : "Davomat"}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700/50">
            <h3 className="text-lg font-bold text-white">Mening guruhlarim</h3>
          </div>
          <div className="p-4 space-y-3">
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-6">Hozircha guruhlaringiz yo'q</p>
            ) : (
              enrollments.map((enr, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-800 text-center px-4 py-2 rounded-lg border border-gray-700">
                      <span className="block text-xs text-gray-400">Boshlangan</span>
                      <span className="block text-sm font-bold text-white">{enr.start_date || "Noma'lum"}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">{enr.group_name}</h4>
                      <p className="text-sm text-gray-400">Holat: {enr.status}</p>
                    </div>
                  </div>
                  <span className="text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-sm font-medium border border-blue-400/20">Aktiv</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Homework */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          {/* Pending */}
          {pendingHomeworks.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-700/50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <h3 className="text-lg font-bold text-white">Kutilayotgan vazifalar</h3>
                <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                  {pendingHomeworks.length} ta
                </span>
              </div>
              <div className="p-4 space-y-3">
                {pendingHomeworks.map(hw => (
                  <div key={hw.id} className="bg-gray-900/60 border border-amber-500/20 rounded-xl overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => setExpandedHw(expandedHw === hw.id ? null : hw.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              {hw.group_name}
                            </span>
                            <span className="text-xs text-gray-500">{hw.lesson_date}</span>
                          </div>
                          <h4 className="text-white font-semibold">{hw.title}</h4>
                          {hw.lesson_topic && (
                            <p className="text-xs text-gray-500 mt-0.5">Dars mavzusi: {hw.lesson_topic}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-purple-400 font-bold">{hw.max_score}</span>
                            <span className="text-gray-500 text-xs"> ball</span>
                          </div>
                          {expandedHw === hw.id
                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Submit Form */}
                    {expandedHw === hw.id && (
                      <div className="border-t border-gray-700/50 p-4 bg-gray-800/30">
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-purple-400" /> Javobingizni yozing
                        </label>
                        <textarea
                          rows={4}
                          className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none text-sm"
                          placeholder="Vazifa javobini shu yerga yozing..."
                          value={submissionTexts[hw.id] || ''}
                          onChange={e => setSubmissionTexts(prev => ({ ...prev, [hw.id]: e.target.value }))}
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={() => handleSubmitHomework(hw.id)}
                            disabled={submitting === hw.id || !(submissionTexts[hw.id] || '').trim()}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20"
                          >
                            <Send className="w-4 h-4" />
                            {submitting === hw.id ? "Yuborilmoqda..." : "Yuborish"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {doneHomeworks.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-gray-700/50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Bajarilgan vazifalar</h3>
                <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                  {doneHomeworks.length} ta
                </span>
              </div>
              <div className="p-4 space-y-3">
                {doneHomeworks.map(hw => (
                  <div key={hw.id} className="bg-gray-900/60 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Yuborildi
                          </span>
                          <span className="text-xs text-gray-500">{hw.group_name}</span>
                        </div>
                        <h4 className="text-white font-semibold">{hw.title}</h4>
                        {hw.submission_content && (
                          <p className="text-xs text-gray-400 mt-1 flex items-start gap-1.5 bg-gray-800/60 rounded-lg p-2">
                            <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400" />
                            <span className="line-clamp-2">{hw.submission_content}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-gray-400 text-xs">Maks. ball</span>
                        <p className="text-purple-400 font-bold">{hw.max_score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {homeworks.length === 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl flex flex-col items-center justify-center py-16">
              <BookOpen className="w-14 h-14 text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">Hozircha uy vazifalari berilmagan</p>
              <p className="text-gray-500 text-sm mt-1">O'qituvchi vazifa berganda bu yerda ko'rinadi</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Davomat tarixi</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Jami:</span>
              <span className="text-white font-bold">{attendance.length} dars</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                attendancePercent >= 80 ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
              }`}>{attendancePercent}%</span>
            </div>
          </div>
          <div className="divide-y divide-gray-700/50">
            {attendance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Davomat ma'lumotlari yo'q</p>
            ) : (
              attendance.slice(0, 30).map((att, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6 text-right">{i + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{att.lesson_date}</p>
                      {att.topic && <p className="text-gray-500 text-xs">{att.topic}</p>}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    att.status === 'present'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      : att.status === 'late'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/15 text-red-400 border-red-500/20'
                  }`}>
                    {att.status === 'present'
                      ? <><CheckCircle className="w-3 h-3" /> Keldi</>
                      : att.status === 'late'
                      ? <><Clock className="w-3 h-3" /> Kechikdi</>
                      : <>❌ Kelmadi</>
                    }
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
