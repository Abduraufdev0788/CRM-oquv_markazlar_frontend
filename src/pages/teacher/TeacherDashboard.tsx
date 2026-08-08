import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BookOpen, Clock, MapPin, PlayCircle } from 'lucide-react';
import { api } from '../../services/api';

const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups/');
        setGroups(response.data.data || []);
      } catch (error) {
        console.error("Guruhlarni yuklashda xatolik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
    
    // Har 1 daqiqada vaqtni yangilash, shunda "Hozirgi dars" o'zgaradi
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalStudents = groups.reduce((acc, g) => acc + (g.max_students || 0), 0);
  const todayStr = DAYS_MAP[currentTime.getDay()];
  
  // Bugungi darslar
  const todayGroups = groups.filter(g => 
    g.status === 'active' && 
    g.schedule && 
    g.schedule.some((s: any) => s.day === todayStr)
  ).map(g => {
    const todaySch = g.schedule.find((s: any) => s.day === todayStr);
    return { ...g, todaySchedule: todaySch };
  }).sort((a, b) => {
    return a.todaySchedule.start.localeCompare(b.todaySchedule.start);
  });

  // Hozirgi dars (kompyuter vaqtiga mos kelsa)
  const currentGroup = todayGroups.find(g => {
    const [sh, sm] = g.todaySchedule.start.split(':').map(Number);
    const [eh, em] = g.todaySchedule.end.split(':').map(Number);
    
    const start = new Date(currentTime);
    start.setHours(sh, sm, 0, 0);
    
    const end = new Date(currentTime);
    end.setHours(eh, em, 0, 0);
    
    return currentTime >= start && currentTime <= end;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Xush kelibsiz, Ustoz!</h2>
        <p className="text-gray-400 mt-1">Bugungi darslaringiz va guruhlaringiz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400"><Calendar className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-400">Jami Guruhlar</p>
            <h3 className="text-2xl font-bold text-white">{loading ? '...' : groups.length} ta</h3>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-gray-700/50 rounded-xl text-gray-300"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-400">O'quvchilar sig'imi</p>
            <h3 className="text-2xl font-bold text-white">{loading ? '...' : totalStudents} ta</h3>
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-emerald-500/20 rounded-xl text-emerald-400"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-400">Bugungi darslar</p>
            <h3 className="text-xl font-bold text-white">{todayGroups.length} ta</h3>
          </div>
        </div>
      </div>

      {currentGroup && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-1 shadow-2xl shadow-blue-500/20 animate-in zoom-in-95 duration-500">
          <div className="bg-gray-900 rounded-[1.4rem] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-full border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Hozir dars vaqti
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{currentGroup.name}</h2>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  {currentGroup.todaySchedule.start} - {currentGroup.todaySchedule.end}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  {currentGroup.room?.name || "Xona tanlanmagan"}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  {currentGroup.max_students} o'quvchi
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/teacher/groups/${currentGroup.id}`)}
              className="relative z-10 w-full sm:w-auto px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-lg shadow-xl"
            >
              <PlayCircle className="w-6 h-6" /> Yo'qlama qilish
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Bugungi jadval
          </h3>
          <div className="space-y-3 flex-1">
            {loading ? (
              <div className="text-gray-500 text-sm">Yuklanmoqda...</div>
            ) : todayGroups.length === 0 ? (
              <div className="text-gray-500 text-sm py-10 text-center flex flex-col items-center gap-2">
                <Clock className="w-10 h-10 text-gray-600" />
                Bugun darslar yo'q, dam oling!
              </div>
            ) : (
              todayGroups.map(group => {
                const isCurrent = currentGroup?.id === group.id;
                return (
                  <div 
                    key={group.id} 
                    onClick={() => navigate(`/teacher/groups/${group.id}`)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-blue-600/10 border-blue-500/50 hover:bg-blue-600/20' 
                        : 'bg-gray-900/50 border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`font-mono font-bold text-lg ${isCurrent ? 'text-blue-400' : 'text-gray-300'}`}>
                        {group.todaySchedule.start}
                      </div>
                      <div className="h-10 w-px bg-gray-700"></div>
                      <div>
                        <h4 className="text-white font-medium">{group.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">{group.room?.name || 'Xona noma\'lum'}</span>
                        </div>
                      </div>
                    </div>
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse hidden sm:block"></span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" /> Barcha guruhlar
          </h3>
          <div className="space-y-3 flex-1 max-h-[400px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-gray-500 text-sm">Yuklanmoqda...</div>
            ) : groups.length === 0 ? (
              <div className="text-gray-500 text-sm py-10 text-center">Sizga biriktirilgan guruhlar yo'q</div>
            ) : (
              groups.map((group, i) => (
                <div 
                  key={group.id} 
                  onClick={() => navigate(`/teacher/groups/${group.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-gray-500 hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <div>
                    <h4 className="text-white font-medium text-sm">{group.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {group.max_students} o'quvchi
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${
                    group.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    group.status === 'planned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {group.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
