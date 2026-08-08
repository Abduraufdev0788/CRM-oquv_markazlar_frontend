import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Wallet, TrendingUp, Activity, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, trend, isCurrency = false }: { title: string, value: string | number, icon: any, trend?: string, isCurrency?: boolean }) => {
  const formattedValue = isCurrency && typeof value === 'number' 
    ? new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(value)
    : value;

  return (
    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">{formattedValue}</h3>
        </div>
        <div className="p-3 bg-gray-700/50 rounded-xl">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
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
    return <div className="text-white">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Xush kelibsiz, Admin!</h2>
        <p className="text-gray-400 mt-1">Bugungi statistika va muhim ko'rsatkichlar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Aktiv o'quvchilar" value={stats?.active_students || 0} icon={GraduationCap} />
        <StatCard title="Bu oy tushumi" value={stats?.monthly_income || 0} icon={Wallet} isCurrency={true} />
        <StatCard title="Bu oy xarajati" value={stats?.monthly_expense || 0} icon={Wallet} isCurrency={true} />
        <StatCard title="Davomat (Bugun)" value={`${stats?.today_attendance_rate || 0}%`} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4">Moliyaviy ko'rsatkichlar</h3>
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl text-gray-500 p-6">
             <div className="flex justify-between w-full max-w-md bg-gray-900/50 p-4 rounded-lg mb-4">
               <span className="text-gray-400">Sof foyda (oylik):</span>
               <span className="font-bold text-emerald-400">
                 {new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(stats?.net_profit || 0)}
               </span>
             </div>
             <p className="text-sm">Tez orada bu yerda grafik paydo bo'ladi.</p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Bugungi darslar</h3>
            <div className="flex items-center gap-4 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                 <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Jami o'tiladigan darslar</p>
                <p className="text-3xl font-bold text-white">{stats?.today_lessons_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
