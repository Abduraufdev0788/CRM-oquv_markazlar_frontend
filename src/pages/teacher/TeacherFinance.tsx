import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  Wallet, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  Receipt,
  Download,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface Salary {
  id: string;
  user_id: string;
  period_month: number;
  period_year: number;
  base_amount: number;
  bonus_amount: number;
  penalty_amount: number;
  status: string;
  comment?: string;
  created_at: string;
  paid_at?: string;
}

export const TeacherFinance: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatedSalary, setCalculatedSalary] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get Teacher Profile for user_id
      const profileRes = await api.get('/auth/me');
      setProfile(profileRes.data);

      // 2. Get Salaries History
      const salariesRes = await api.get('/finance/salaries/');
      setSalaries(salariesRes.data.data || []);

      // 3. Get Calculated Salary for Current Month
      if (profileRes.data?.id) {
        setCalculating(true);
        const calcRes = await api.get('/finance/salaries/calculate', {
          params: {
            user_id: profileRes.data.id,
            period_month: currentMonth,
            period_year: currentYear
          }
        });
        setCalculatedSalary(calcRes.data.calculated_salary || 0);
      }
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setLoading(false);
      setCalculating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <div className="flex items-center px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase">
            <CheckCircle2 className="w-3 h-3 mr-1" /> To'langan
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-bold tracking-wider uppercase">
            <Clock className="w-3 h-3 mr-1" /> Kutilmoqda
          </div>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const getMonthName = (month: number) => {
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    return months[month - 1] || '';
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="relative w-20 h-20">
           <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-4 bg-gray-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-500/20 mb-4">
            <Wallet className="w-4 h-4" />
            Moliya va Maosh
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">
            Mening maoshlarim
          </h2>
          <p className="text-gray-400 mt-2 text-lg">
            Sizga to'langan maoshlar tarixi va joriy oydagi hisoblangan daromadingiz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculated Salary Card */}
        <div className="relative group lg:col-span-1">
          <div className="w-full h-[220px] rounded-3xl p-7 relative overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-gray-900 to-black transition-all duration-500 hover:border-white/20">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <TrendingUp className="w-7 h-7 text-emerald-400/80" />
                <span className="text-emerald-400/80 font-black tracking-[0.1em] text-[10px] uppercase border border-emerald-500/20 px-2 py-1 rounded-md bg-emerald-500/10">
                  {getMonthName(currentMonth)}, {currentYear}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-bold">Joriy oydagi taxminiy maosh</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                  {calculating ? (
                    <span className="text-gray-500 text-2xl">Hisoblanmoqda...</span>
                  ) : (
                    formatCurrency(calculatedSalary)
                  )}
                </h2>
              </div>

              <div className="flex justify-between items-end">
                <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-400 font-medium w-full mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Bu summa o'quvchilar tomonidan tasdiqlangan to'lovlar asosida shakllanadi.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <Receipt className="w-5 h-5 text-blue-400" /> To'lovlar tarixi
             </h3>
             <span className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full border border-white/10">
               Jami: {salaries.length} ta
             </span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-3">
            {salaries.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                  <Receipt className="w-6 h-6 text-gray-600" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Hozircha maoshlar yo'q</h4>
                <p className="text-gray-500 text-sm max-w-xs">Sizga to'langan barcha maoshlar tarixi shu yerda aks etadi.</p>
              </div>
            ) : (
              salaries.map((salary) => {
                const total = Number(salary.base_amount) + Number(salary.bonus_amount) - Number(salary.penalty_amount);
                return (
                  <div 
                    key={salary.id} 
                    className="group relative bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-black text-lg tracking-tight">
                            {formatCurrency(total)}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                            <CalendarDays className="w-3 h-3 opacity-60" />
                            {getMonthName(salary.period_month)} {salary.period_year}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="flex flex-col items-start sm:items-end gap-1.5">
                        {getStatusBadge(salary.status)}
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider">
                          {new Date(salary.created_at).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    </div>
                    
                    {salary.comment && (
                      <div className="w-full mt-2 sm:mt-0 sm:absolute sm:-bottom-2 sm:left-20 text-[10px] text-gray-400 italic px-2 py-0.5 rounded bg-black border border-white/10 max-w-sm truncate">
                        Izoh: {salary.comment}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
