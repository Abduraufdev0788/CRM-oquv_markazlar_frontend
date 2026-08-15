import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, BookOpen, Clock, MapPin, PlayCircle, 
  ChevronRight, Sparkles, Star
} from 'lucide-react';
import { api } from '../../services/api';

const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Greeting based on time
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech';

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
    
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 10000);
    const fetchInterval = setInterval(() => fetchGroups(), 60000);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(fetchInterval);
    };
  }, []);

  const totalStudents = groups.reduce((acc, g) => acc + (g.max_students || 0), 0);
  const todayStr = DAYS_MAP[currentTime.getDay()];
  
  const todayGroups = groups.filter(g => 
    g.status === 'active' && 
    g.schedule && 
    g.schedule.some((s: any) => s.day === todayStr)
  ).map(g => {
    const todaySch = g.schedule.find((s: any) => s.day === todayStr);
    return { ...g, todaySchedule: todaySch };
  }).sort((a, b) => a.todaySchedule.start.localeCompare(b.todaySchedule.start));

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
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header Section with dynamic greeting */}
      <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-4 bg-gray-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/20 mb-4">
            <Sparkles className="w-4 h-4" />
            Ustoz Paneli
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">
            {greeting}, Ustoz!
          </h2>
          <p className="text-gray-400 mt-2 text-lg">
            Bugungi darslar va o'quvchilar holati haqida qisqacha ma'lumot.
          </p>
        </div>
        <div className="relative z-10 text-right hidden md:block">
          <p className="text-5xl font-light text-white tracking-widest font-mono">
            {currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold">
            {currentTime.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="group relative bg-gray-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-gray-800/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Jami Guruhlar</p>
              <h3 className="text-4xl font-black text-white flex items-baseline gap-2">
                {loading ? <span className="animate-pulse">...</span> : groups.length}
                <span className="text-lg font-medium text-blue-400">ta</span>
              </h3>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-blue-500/10">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="group relative bg-gray-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-gray-800/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">O'quvchilar Sig'imi</p>
              <h3 className="text-4xl font-black text-white flex items-baseline gap-2">
                {loading ? <span className="animate-pulse">...</span> : totalStudents}
                <span className="text-lg font-medium text-purple-400">nafar</span>
              </h3>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl border border-purple-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/10">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="group relative bg-gray-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-gray-800/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Bugungi Darslar</p>
              <h3 className="text-4xl font-black text-white flex items-baseline gap-2">
                {loading ? <span className="animate-pulse">...</span> : todayGroups.length}
                <span className="text-lg font-medium text-emerald-400">ta</span>
              </h3>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/10">
              <Clock className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Class Action Banner */}
      {currentGroup && (
        <div className="relative bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl p-[2px] shadow-2xl shadow-red-500/30 animate-in zoom-in-95 duration-500">
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-[22px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full">
              {/* Pulsing Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-[-10px] bg-red-500/20 rounded-full animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-rose-600 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/40 border border-red-400/50">
                  <PlayCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-full border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Hozir dars vaqti
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white">{currentGroup.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <Clock className="w-4 h-4 text-rose-400" />
                    {currentGroup.todaySchedule.start} - {currentGroup.todaySchedule.end}
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <MapPin className="w-4 h-4 text-red-400" />
                    {currentGroup.room?.name || "Xona tanlanmagan"}
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <Users className="w-4 h-4 text-orange-400" />
                    {currentGroup.max_students} o'quvchi
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/teacher/groups/${currentGroup.id}?tab=attendance`)}
                className="relative z-10 w-full md:w-auto px-10 py-5 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95"
              >
                Yo'qlama qilish <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Today's Schedule Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              Bugungi Jadval
            </h3>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 font-medium">
              {todayGroups.length} ta dars
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-900/50 rounded-2xl border border-white/5 animate-pulse"></div>
              ))
            ) : todayGroups.length === 0 ? (
              <div className="bg-gray-900/30 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                  <Star className="w-10 h-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Bugun darslar yo'q</h4>
                <p className="text-gray-400">Dam oling va keyingi darslarga tayyorgarlik ko'ring!</p>
              </div>
            ) : (
              todayGroups.map(group => {
                const isCurrent = currentGroup?.id === group.id;
                
                return (
                  <div 
                    key={group.id} 
                    onClick={() => navigate(`/teacher/groups/${group.id}`)}
                    className={`group relative flex items-center p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                      isCurrent 
                        ? 'bg-blue-900/20 border-blue-500/50 shadow-lg shadow-blue-500/10 hover:bg-blue-900/30' 
                        : 'bg-gray-900/50 border-white/5 hover:border-blue-500/30 hover:bg-gray-800/80 hover:-translate-y-1'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent"></div>
                    )}
                    
                    <div className="relative z-10 flex w-full items-center gap-6">
                      {/* Time Block */}
                      <div className="flex flex-col items-center justify-center min-w-[80px]">
                        <span className={`text-2xl font-black font-mono tracking-tighter ${isCurrent ? 'text-blue-400' : 'text-gray-300'}`}>
                          {group.todaySchedule.start}
                        </span>
                        <span className="text-xs text-gray-500 font-bold uppercase">{group.todaySchedule.end}</span>
                      </div>
                      
                      <div className="h-12 w-px bg-white/10 hidden sm:block"></div>
                      
                      {/* Details Block */}
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                          {group.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" />
                            {group.room?.name || 'Xona noma\'lum'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Users className="w-3.5 h-3.5 text-gray-500" />
                            {group.max_students} o'quvchi
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500 group-hover:bg-blue-500/20 group-hover:text-blue-400'}`}>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* All Groups Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-400" />
              </div>
              Barcha Guruhlar
            </h3>
            <button 
              onClick={() => navigate('/teacher/groups')}
              className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              Barchasini ko'rish <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-2 flex-1 overflow-hidden flex flex-col h-[500px]">
            <div className="overflow-y-auto p-4 space-y-3 h-full pr-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-800/50 rounded-2xl animate-pulse"></div>
                ))
              ) : groups.length === 0 ? (
                <div className="text-gray-500 text-sm py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-gray-600" />
                  </div>
                  Sizga biriktirilgan guruhlar yo'q
                </div>
              ) : (
                groups.map((group) => (
                  <div 
                    key={group.id} 
                    onClick={() => navigate(`/teacher/groups/${group.id}`)}
                    className="group flex items-center justify-between p-4 bg-gray-800/30 rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-gray-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
                        <span className="text-lg font-bold text-gray-300 group-hover:text-purple-400">
                          {group.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold group-hover:text-purple-400 transition-colors">{group.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {group.max_students}
                          </span>
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          <span>{group.schedule?.length || 0} kun/hafta</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        group.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        group.status === 'planned' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {group.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
