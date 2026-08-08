import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, MapPin, User, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export const StudentSchedule: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await api.get('/student-portal/enrollments');
        setEnrollments(res.data.data || []);
      } catch (error) {
        console.error("Failed to load enrollments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen bg-gray-900">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <Calendar className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-indigo-200 font-medium tracking-wide">Jadval yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames: any = {
    monday: 'Dushanba',
    tuesday: 'Seshanba',
    wednesday: 'Chorshanba',
    thursday: 'Payshanba',
    friday: 'Juma',
    saturday: 'Shanba',
    sunday: 'Yakshanba'
  };

  const currentDayStr = daysOfWeek[currentTime.getDay() === 0 ? 6 : currentTime.getDay() - 1];
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 md:p-8 animate-in fade-in duration-1000 relative overflow-hidden pb-24">
      {/* Abstract Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-16 h-16 bg-gray-900 border border-white/10 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold tracking-widest uppercase text-xs mb-1">
                EduCRM Pro
              </p>
              <h1 className="text-4xl font-black text-white tracking-tight">Haftalik Jadval</h1>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl px-5 py-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Hozirgi vaqt</p>
              <p className="text-lg font-bold text-white">
                {currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {daysOfWeek.map((day, dayIndex) => {
            const dayClasses = enrollments.flatMap(enr => {
              const schedule = enr.schedule || [];
              const classesToday = schedule.filter((s: any) => s.day === day);
              return classesToday.map((c: any) => ({ 
                ...c, 
                group_name: enr.group_name,
                teacher_name: enr.teacher_name,
                room_name: enr.room_name,
                start_date: enr.start_date,
              }));
            }).sort((a, b) => a.start.localeCompare(b.start));

            if (dayClasses.length === 0) return null;

            const isToday = day === currentDayStr;

            return (
              <div 
                key={day} 
                className={`relative rounded-[2rem] p-[1px] overflow-hidden transition-all duration-500 animate-in slide-in-from-bottom-4`}
                style={{ animationDelay: `${dayIndex * 100}ms` }}
              >
                {/* Gradient Border Wrap */}
                <div className={`absolute inset-0 ${isToday ? 'bg-gradient-to-b from-indigo-500 to-purple-600' : 'bg-gradient-to-b from-white/10 to-transparent'} opacity-50`}></div>
                
                <div className="relative h-full bg-[#151c2c] backdrop-blur-xl rounded-[2rem] p-6 flex flex-col">
                  {isToday && (
                    <div className="absolute top-6 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-indigo-500/25 z-20">
                      <Sparkles className="w-3 h-3" /> Bugun
                    </div>
                  )}

                  <h4 className={`text-2xl font-black mb-6 ${isToday ? 'text-white' : 'text-gray-300'}`}>
                    {dayNames[day]}
                  </h4>
                  
                  <div className="space-y-4 flex-1">
                    {dayClasses.map((cls, idx) => {
                      const [startH, startM] = cls.start.split(':').map(Number);
                      const [endH, endM] = cls.end.split(':').map(Number);
                      const startTimeMins = startH * 60 + startM;
                      const endTimeMins = endH * 60 + endM;
                      const currentMins = currentHour * 60 + currentMinute;
                      
                      const isHappeningNow = isToday && currentMins >= startTimeMins && currentMins <= endTimeMins;
                      const isPassed = isToday && currentMins > endTimeMins;

                      return (
                        <div 
                          key={idx} 
                          className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                            isHappeningNow 
                              ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                              : isPassed
                                ? 'bg-gray-900/40 border-white/5 opacity-60'
                                : 'bg-gray-800/40 border-white/5 hover:border-white/10 hover:bg-gray-800/60'
                          }`}
                        >
                          {/* Top row: Times */}
                          <div className="flex items-center justify-between mb-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-sm ${
                              isHappeningNow ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-900 text-gray-300'
                            }`}>
                              <Clock className="w-4 h-4" />
                              {cls.start} - {cls.end}
                            </div>
                            {isHappeningNow && (
                              <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                            )}
                          </div>

                          {/* Middle row: Subject */}
                          <div className="mb-4">
                            <h5 className="text-xl font-bold text-white leading-tight flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                              <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                              {cls.group_name}
                            </h5>
                          </div>

                          {/* Bottom row: Info tags */}
                          <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-900/50 px-2.5 py-1.5 rounded-md">
                              <User className="w-3.5 h-3.5 text-blue-400" />
                              <span className="truncate max-w-[120px]">{cls.teacher_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-900/50 px-2.5 py-1.5 rounded-md">
                              <MapPin className="w-3.5 h-3.5 text-pink-400" />
                              <span>{cls.room_name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {enrollments.length > 0 && !enrollments.some(e => e.schedule && e.schedule.length > 0) && (
          <div className="relative rounded-[2rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent">
             <div className="bg-[#151c2c] backdrop-blur-xl rounded-[2rem] p-16 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12">
                <Calendar className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3">Jadval hali tuzilmagan</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto">Sizning guruhlaringiz uchun admin tomonidan hozircha dars jadvali kiritilmagan.</p>
            </div>
          </div>
        )}

        {enrollments.length === 0 && (
           <div className="relative rounded-[2rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent">
            <div className="bg-[#151c2c] backdrop-blur-xl rounded-[2rem] p-16 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-12">
                <BookOpen className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-3xl font-black text-white mb-3">Guruhlar mavjud emas</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto">Siz hozircha hech qanday guruhga qo'shilmagansiz. Darslar boshlanishi bilan bu yerda jadval paydo bo'ladi.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
