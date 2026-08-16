import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  CalendarDays,
  ArrowUpRight,
  Landmark,
  ChevronDown,
  Nfc,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Receipt,
  MessageSquare,
  Send,
  Loader2,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  period_month: number;
  period_year: number;
  transaction_id?: string;
  receipt_url?: string;
  created_at: string;
  comment?: string;
}

interface Enrollment {
  group_id: string;
  group_name: string;
  course_name: string;
  monthly_fee: number;
  discount_pct: number;
  teacher_name: string;
  status: string;
}

export const StudentFinance: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState<number>(10);
  const [isFetchingPayments, setIsFetchingPayments] = useState(false);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: 'To\'lov haqida', message: '' });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchEnrollments()]).then(() => {
      // Intentionally separated from payments to avoid blocking
    });
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [limit]);

  const fetchProfile = async () => {
    try {
      const profileRes = await api.get('/student-portal/me');
      setBalance(profileRes.data.balance || 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await api.get('/student-portal/enrollments');
      setEnrollments(res.data.data || []);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      if (payments.length === 0) setLoading(true);
      else setIsFetchingPayments(true);
      
      const paymentsRes = await api.get('/student-portal/payments', { params: { limit } });
      const data = paymentsRes.data.data || [];
      setPayments(data);
      
      // Generate chart data from payments (Group by month)
      const monthlyData: Record<string, number> = {};
      const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      
      data.forEach((p: Payment) => {
        if (p.status === 'confirmed') {
          const m = months[p.period_month - 1];
          monthlyData[m] = (monthlyData[m] || 0) + p.amount;
        }
      });
      
      // Get last 6 months dynamically (for a better chart, we usually query backend for this, but doing it on frontend for now)
      const formattedChartData = Object.keys(monthlyData).map(k => ({
        name: k,
        amount: monthlyData[k]
      })).reverse(); // simple reverse to look chronological if data was descending
      
      setChartData(formattedChartData.length > 0 ? formattedChartData : [
        { name: 'Yan', amount: 0 }, { name: 'Fev', amount: 0 }, { name: 'Mar', amount: 0 }
      ]);
      
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
      setIsFetchingPayments(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.message.trim()) return;
    
    try {
      setIsSubmittingSupport(true);
      await api.post('/student-portal/support', supportForm);
      setIsSupportOpen(false);
      setSupportForm({ subject: 'To\'lov haqida', message: '' });
      alert("Murojaatingiz muvaffaqiyatli yuborildi!");
    } catch (error) {
      console.error("Support error", error);
      alert("Xatolik yuz berdi");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'cash': return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'card': return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'bank_transfer': return <Landmark className="w-5 h-5 text-indigo-400" />;
      default: return <Receipt className="w-5 h-5 text-purple-400" />;
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Naqd pul',
      card: 'Plastik karta',
      bank_transfer: 'Bank o\'tkazmasi',
      click: 'Click',
      payme: 'Payme'
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <div className="flex items-center px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Tasdiqlangan
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-bold tracking-wider uppercase">
            <Clock className="w-3 h-3 mr-1" /> Kutilmoqda
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center px-2 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-bold tracking-wider uppercase">
            <XCircle className="w-3 h-3 mr-1" /> Bekor qilingan
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
  
  const handleDownloadReceipt = async (id: string) => {
    try {
      const response = await api.get(`/student-portal/payments/${id}/receipt`, {
        responseType: 'blob', // Muhim: blob sifatida olish
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chek_${id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Chekni yuklab olishda xatolik yuz berdi");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="relative w-20 h-20">
           <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Hisob-kitoblar
  const totalMonthlyExpected = enrollments.reduce((sum, enr) => {
    const discounted = enr.monthly_fee - (enr.monthly_fee * (enr.discount_pct / 100));
    return sum + discounted;
  }, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      
      <div className="max-w-7xl mx-auto relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Pro Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Mening <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">To'lovlarim</span></h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xl font-medium">
              Sizning barcha ta'lim xarajatlaringiz, to'lovlar tarixingiz va oylik budjetingiz bir joyda.
            </p>
          </div>
          <button onClick={() => setIsSupportOpen(true)} className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95">
            <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-bold tracking-wide">Yordam so'rash</span>
          </button>
        </header>
  
        {/* Top Grid: Card, Stats, Expected */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Futuristic Credit Card */}
          <div className="relative group lg:col-span-1">
            <div className="w-full h-[220px] rounded-3xl p-7 relative overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-gray-900 to-black transition-all duration-500 hover:border-white/20">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <Nfc className="w-7 h-7 text-white/70" />
                  <span className="text-white/40 font-black tracking-[0.2em] text-xs uppercase">EduCard</span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-bold">Joriy Balans</p>
                  <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                    {formatCurrency(balance)}
                  </h2>
                </div>
  
                <div className="flex justify-between items-end">
                  {balance < 0 ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <TrendingDown className="w-3.5 h-3.5" /> Qarzdorlik
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <TrendingUp className="w-3.5 h-3.5" /> Ijobiy holat
                    </span>
                  )}
                  <div className="flex gap-1.5 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-[#eb001b] mix-blend-screen"></div>
                    <div className="w-6 h-6 rounded-full bg-[#f79e1b] mix-blend-screen -ml-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <div>
                 <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                   <Activity className="w-4 h-4 text-blue-400" /> To'lovlar dinamikasi
                 </h3>
                 <p className="text-xs text-gray-500 font-medium">Oxirgi oylardagi tasdiqlangan to'lovlar</p>
               </div>
            </div>
            
            <div className="flex-1 w-full min-h-[160px] overflow-hidden -ml-2 sm:-ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    formatter={(value: number) => [formatCurrency(value), "To'lov"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Section: Expected Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-400" /> Kutilayotgan Oylik To'lovlar
                </h3>
                <p className="text-sm text-gray-400 font-medium mt-1">Siz o'qiyotgan guruhlar uchun joriy oydagi majburiyatlar</p>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Jami Oylik:</span>
                <span className="text-xl font-black text-white">{formatCurrency(totalMonthlyExpected)}</span>
              </div>
            </div>

            {enrollments.length === 0 ? (
               <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                 <p className="text-gray-500 font-medium">Faol guruhlar topilmadi</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((enr, idx) => {
                  const finalPrice = enr.monthly_fee - (enr.monthly_fee * (enr.discount_pct / 100));
                  return (
                    <div key={idx} className="bg-black/30 border border-white/5 p-5 rounded-2xl flex flex-col gap-3 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-bold text-white truncate max-w-[150px]" title={enr.group_name}>{enr.group_name}</h4>
                          <p className="text-xs text-gray-500 font-medium">{enr.course_name}</p>
                        </div>
                        {enr.discount_pct > 0 && (
                          <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold rounded">
                            -{enr.discount_pct}% chegirma
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 pt-3 border-t border-white/5 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">To'lov miqdori</p>
                          <p className="text-lg font-black text-white">{formatCurrency(finalPrice)}</p>
                        </div>
                        {enr.discount_pct > 0 && (
                          <p className="text-xs text-gray-500 line-through font-medium">{formatCurrency(enr.monthly_fee)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
  
        {/* History Section */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-blue-500"></span>
              Barcha To'lovlar Tarixi
            </h3>
            
            <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
               <div className="text-xs font-semibold text-gray-400 pl-3 hidden sm:block">
                 {isFetchingPayments ? 'Yuklanmoqda...' : `Jami: ${payments.length}`}
               </div>
               <div className="w-px h-5 bg-white/10 hidden sm:block"></div>
               <div className="relative group w-full sm:w-auto">
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="appearance-none bg-transparent text-white text-xs font-bold rounded-lg focus:ring-0 focus:outline-none block py-1.5 pl-3 pr-8 cursor-pointer"
                  >
                    <option value={10} className="bg-gray-900 text-white">Oxirgi 10 ta</option>
                    <option value={50} className="bg-gray-900 text-white">Oxirgi 50 ta</option>
                    <option value={100} className="bg-gray-900 text-white">Oxirgi 100 ta</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white" />
               </div>
            </div>
          </div>
  
          {payments.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-inner border border-white/5">
                <Receipt className="w-8 h-8 text-gray-600" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Hozircha to'lovlar yo'q</h4>
              <p className="text-gray-500 text-sm max-w-xs font-medium">Sizning to'lovlar tarixingiz bo'sh. Qilingan barcha tranzaksiyalar shu yerda aks etadi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="group relative bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 p-4 lg:p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {getMethodIcon(payment.method)}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-black text-lg tracking-tight">
                          {formatCurrency(payment.amount)}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                          <CalendarDays className="w-3 h-3 opacity-60" />
                          {getMonthName(payment.period_month)} {payment.period_year}
                        </span>
                        <span>•</span>
                        <span>{getMethodLabel(payment.method)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-4">
                    <div className="flex flex-col items-start lg:items-end gap-1.5">
                      {getStatusBadge(payment.status)}
                      <span className="text-[10px] font-bold text-gray-500 tracking-wider">
                        {new Date(payment.created_at).toLocaleDateString('uz-UZ', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    {payment.status === 'confirmed' && (
                      <button 
                        onClick={() => handleDownloadReceipt(payment.id)}
                        className="ml-2 w-10 h-10 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 flex items-center justify-center text-gray-400 hover:text-blue-400 transition-all active:scale-95"
                        title="Chekni yuklab olish"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {payment.comment && (
                    <div className="w-full mt-2 lg:mt-0 lg:absolute lg:-bottom-2 lg:left-20 text-[10px] text-gray-400 italic px-2 py-0.5 rounded bg-black border border-white/10 max-w-sm truncate">
                      Izoh: {payment.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
  
      </div>

      {/* Support Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmittingSupport && setIsSupportOpen(false)}></div>
          <div className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-blue-900/20 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Qo'llab-quvvatlash markazi
              </h3>
              <button 
                onClick={() => setIsSupportOpen(false)}
                disabled={isSubmittingSupport}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSupportSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Mavzu</label>
                <select 
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                  className="w-full bg-[#1A1A1E] border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-3 outline-none transition-colors"
                >
                  <option value="To'lov haqida">To'lov haqida</option>
                  <option value="Dars jadvali bo'yicha">Dars jadvali bo'yicha</option>
                  <option value="Tizim xatoligi">Tizim xatoligi</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Xabar matni</label>
                <textarea 
                  required
                  rows={4}
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                  placeholder="Muammoingizni batafsil tushuntiring..."
                  className="w-full bg-[#1A1A1E] border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-3 outline-none transition-colors resize-none placeholder:text-gray-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsSupportOpen(false)}
                  disabled={isSubmittingSupport}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingSupport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Yuborish
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
