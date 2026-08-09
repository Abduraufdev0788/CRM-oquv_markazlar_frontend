import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Wallet, TrendingUp, Activity, BookOpen, AlertCircle, Star, Award } from 'lucide-react';
import { api } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, trend, isCurrency = false, colorClass = "text-blue-400", bgClass = "bg-blue-500/20" }: { title: string, value: string | number, icon: any, trend?: string, isCurrency?: boolean, colorClass?: string, bgClass?: string }) => {
  const formattedValue = isCurrency && typeof value === 'number' 
    ? new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(value)
    : value;

  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2 tracking-tight">{formattedValue}</h3>
        </div>
        <div className={`p-3 ${bgClass} rounded-xl shadow-inner`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm relative z-10">
          <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
          <span className="text-emerald-400 font-medium">{trend}</span>
        </div>
      )}
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/');
        setStats(response.data);
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Bar Chart calculations
  const trendData = stats?.income_trend || [];
  const maxIncome = Math.max(...trendData.map((d: any) => d.income), 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Xush kelibsiz, Admin! 👋</h2>
        <p className="text-gray-400 mt-1">Bugungi statistika va muhim ko'rsatkichlar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Aktiv o'quvchilar" value={stats?.active_students || 0} icon={GraduationCap} colorClass="text-blue-400" bgClass="bg-blue-500/20" />
        <StatCard title="Bu oy tushumi" value={stats?.monthly_income || 0} icon={Wallet} isCurrency={true} colorClass="text-emerald-400" bgClass="bg-emerald-500/20" />
        <StatCard title="Bu oy xarajati" value={stats?.monthly_expense || 0} icon={Wallet} isCurrency={true} colorClass="text-red-400" bgClass="bg-red-500/20" />
        <StatCard title="To'lamaganlar (shu oy)" value={stats?.debtors_count || 0} icon={AlertCircle} colorClass="text-orange-400" bgClass="bg-orange-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daromad Dinamikasi (Bar Chart) */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Daromad Dinamikasi (Oxirgi 6 oy)</h3>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Sof foyda: {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(stats?.net_profit || 0)}
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-2 sm:gap-4 mt-4 h-64">
            {trendData.map((item: any, i: number) => {
              const heightPercent = Math.max((item.income / maxIncome) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-gray-900 text-white text-xs py-1 px-2 rounded border border-gray-700 whitespace-nowrap pointer-events-none z-10">
                    {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(item.income)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-1000 ease-out group-hover:from-blue-500 group-hover:to-blue-300"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <span className="text-gray-400 text-xs mt-3 font-medium uppercase tracking-wider">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bugungi darslar va Davomat */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Bugungi darslar</h3>
            <div className="flex items-center gap-4 bg-purple-500/10 p-5 rounded-xl border border-purple-500/20">
              <div className="p-4 bg-purple-500/20 rounded-xl shadow-inner">
                 <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Jami o'tiladigan darslar</p>
                <p className="text-3xl font-bold text-white tracking-tight mt-1">{stats?.today_lessons_count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-gray-900/40 rounded-xl p-5 border border-gray-700/50 flex flex-col justify-center items-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full blur-2xl"></div>
             <Activity className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
             <p className="text-gray-400 text-sm font-medium mb-1">Davomat (Bugun)</p>
             <div className="flex items-baseline gap-1">
               <span className="text-4xl font-bold text-emerald-400">{stats?.today_attendance_rate || 0}</span>
               <span className="text-emerald-500 font-medium">%</span>
             </div>
             
             {/* Mini progress bar */}
             <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4 overflow-hidden">
               <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${stats?.today_attendance_rate || 0}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* TOP Reytinglar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Top Guruhlar */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Top Guruhlar</h3>
          </div>
          <div className="space-y-5">
            {stats?.top_groups?.map((group: any, idx: number) => {
               // Taxminiy maksimallik - eng katta guruh qatoriga nisbatan
               const maxCount = stats.top_groups[0]?.count || 1;
               const percent = Math.max((group.count / maxCount) * 100, 5);
               return (
                 <div key={idx} className="relative">
                   <div className="flex justify-between text-sm mb-1.5">
                     <span className="text-gray-200 font-medium">{idx + 1}. {group.name}</span>
                     <span className="text-gray-400">{group.count} o'quvchi</span>
                   </div>
                   <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden border border-gray-600/30">
                     <div 
                       className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-2 rounded-full transition-all duration-1000" 
                       style={{ width: `${percent}%` }}
                     ></div>
                   </div>
                 </div>
               )
            })}
            {(!stats?.top_groups || stats.top_groups.length === 0) && (
               <p className="text-gray-500 text-sm text-center py-4">Guruhlar topilmadi.</p>
            )}
          </div>
        </div>

        {/* Top O'qituvchilar */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Top Ustozlar</h3>
          </div>
          <div className="space-y-4">
            {stats?.top_teachers?.map((teacher: any, idx: number) => (
               <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                 <div className="flex items-center gap-3">
                   {teacher.photo ? (
                     <img src={teacher.photo.startsWith('http') ? teacher.photo : `http://localhost:8001${teacher.photo}`} alt={teacher.name} className="w-8 h-8 rounded-full object-cover border border-purple-500/30" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
                       {idx + 1}
                     </div>
                   )}
                   <span className="text-gray-200 font-medium">{teacher.name}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Users className="w-4 h-4 text-gray-400" />
                   <span className="text-gray-300 font-medium">{teacher.count}</span>
                 </div>
               </div>
            ))}
            {(!stats?.top_teachers || stats.top_teachers.length === 0) && (
               <p className="text-gray-500 text-sm text-center py-4">O'qituvchilar topilmadi.</p>
            )}
          </div>
        </div>

        {/* Top O'quvchilar (Uyga vazifa) */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">A'lochi O'quvchilar</h3>
          </div>
          <div className="space-y-4">
            {stats?.top_students_hw?.map((student: any, idx: number) => (
               <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                 <div className="flex items-center gap-3">
                   {student.photo ? (
                     <img src={student.photo.startsWith('http') ? student.photo : `http://localhost:8001${student.photo}`} alt={student.name} className="w-8 h-8 rounded-full object-cover border border-blue-500/30" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                       {idx + 1}
                     </div>
                   )}
                   <span className="text-gray-200 font-medium">{student.name}</span>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className="text-blue-400 font-bold">{student.score}</span>
                   <span className="text-gray-500 text-[10px] uppercase">Ball</span>
                 </div>
               </div>
            ))}
            {(!stats?.top_students_hw || stats.top_students_hw.length === 0) && (
               <p className="text-gray-500 text-sm text-center py-4">Uyga vazifalar baholanmagan.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
