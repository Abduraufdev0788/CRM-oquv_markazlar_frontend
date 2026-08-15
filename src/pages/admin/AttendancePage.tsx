import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [group, setGroup] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [attendanceMatrix, setAttendanceMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lessonLimit, setLessonLimit] = useState<number | 'all'>(10);

  useEffect(() => {
    // Fetch all groups
    api.get('/groups/')
      .then(res => {
        const groupsData = res.data.data || [];
        setGroups(groupsData);
        if (groupsData.length > 0) {
          setSelectedGroupId(groupsData[0].id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    
    const fetchMatrixData = async () => {
      setLoading(true);
      try {
        const [groupRes, enrollRes, lessonsRes, matrixRes] = await Promise.all([
          api.get(`/groups/${selectedGroupId}`),
          api.get(`/groups/${selectedGroupId}/students`),
          api.get('/lessons/', { params: { group_id: selectedGroupId, limit: 100 } }),
          api.get(`/attendance/group/${selectedGroupId}`)
        ]);
        
        setGroup(groupRes.data);
        setEnrollments(enrollRes.data);
        setLessons(lessonsRes.data.data || []);
        setAttendanceMatrix(matrixRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch matrix", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatrixData();
  }, [selectedGroupId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            Davomat Jurnali
          </h2>
          <p className="text-gray-400 mt-1">Barcha guruhlarning umumiy davomatini monitoring qiling</p>
        </div>
        
        <div className="min-w-[250px]">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
          >
            <option value="" disabled>Guruhni tanlang...</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.course?.name})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
      ) : !group ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl flex items-center justify-center py-20">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Tepadan guruhni tanlang</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/60 backdrop-blur-2xl border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 min-h-[600px] flex flex-col">
          <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 to-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              {group.name} - Davomat Jurnali
            </h3>
            <div className="flex items-center gap-6">
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
              <div className="text-sm text-gray-400 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700">
                O'quvchilar: <span className="font-bold text-white">{enrollments.length}</span>
              </div>
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
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={lessons.length + 3} className="py-10 text-center text-gray-500">
                      Bu guruhda hali o'quvchilar yo'q.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr, i) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
