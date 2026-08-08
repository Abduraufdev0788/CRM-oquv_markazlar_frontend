import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

export const TeacherSchedule: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchTeacherGroups = async () => {
      try {
        const res = await api.get('/groups/', {
          params: { limit: 100 }
        });
        setGroups(res.data.data || []);
      } catch (error) {
        console.error("Failed to load groups", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherGroups();
    
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[80vh]">
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
    <div className="p-4 md:p-6 animate-in fade-in duration-1000 relative overflow-hidden pb-24">
      {/* Abstract Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-800 pb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-16 h-16 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-bold tracking-widest uppercase text-xs mb-1">
                EduCRM Pro
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">O'qituvchi Jadvali</h1>
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
            const dayClasses = groups.flatMap(group => {
              const schedule = group.schedule || [];
              const classesToday = schedule.filter((s: any) => s.day === day);
              return classesToday.map((c: any) => ({ 
                ...c, 
                group_id: group.id,
                group_name: group.name,
                room_name: group.room?.name || 'Xona belgilanmagan',
                course_name: group.course?.name || 'Kurs belgilanmagan',
                color: group.course?.color_hex || '#6366f1' // Default indigo
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
                <div className={`absolute inset-0 ${isToday ? 'bg-gradient-to-b from-indigo-500 to-purple-600' : 'bg-gradient-to-b from-gray-700 to-gray-800'} opacity-50`}></div>
                
                <div className="relative h-full bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-6 flex flex-col">
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
                                ? 'bg-gray-800/40 border-gray-700/50 opacity-60'
                                : 'bg-gray-800/80 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-xl ${isHappeningNow ? 'bg-indigo-500/20' : 'bg-gray-700'}`}>
                                <Clock className={`w-4 h-4 ${isHappeningNow ? 'text-indigo-400' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <div className={`text-sm font-bold tracking-wide ${isHappeningNow ? 'text-white' : 'text-gray-300'}`}>
                                  {cls.start.slice(0,5)} - {cls.end.slice(0,5)}
                                </div>
                                {isHappeningNow && (
                                  <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">
                                    Hozir bo'lmoqda
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Color Indicator */}
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cls.color }}></div>
                          </div>

                          <div className="space-y-2 mt-2">
                            <h5 className={`font-bold text-lg leading-tight group-hover:text-white transition-colors ${
                              isHappeningNow ? 'text-white' : 'text-gray-200'
                            }`}>
                              {cls.group_name}
                            </h5>
                            
                            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-700/50">
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <BookOpen className="w-4 h-4 text-gray-500 shrink-0" />
                                <span className="truncate">{cls.course_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                                <span className="truncate">{cls.room_name}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Go to Group Button (Only active if not passed) */}
                          <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end">
                            <a 
                              href={`/teacher/groups/${cls.group_id}`}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                                isPassed 
                                  ? 'bg-gray-800 text-gray-500 hover:text-gray-400 cursor-pointer'
                                  : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                              }`}
                            >
                              Guruhga o'tish <ChevronRight className="w-3 h-3" />
                            </a>
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
      </div>
    </div>
  );
};
