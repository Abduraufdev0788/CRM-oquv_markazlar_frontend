import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Wallet, TrendingDown, Plus, Search, CheckCircle, XCircle, FileText, Banknote, Clock } from 'lucide-react';
import { SearchableSelect } from '../../components/SearchableSelect';

export const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses' | 'salaries'>('payments');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filters
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Dropdown data
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    enrollment_id: '',
    amount: '',
    period_month: month,
    period_year: year,
    method: 'cash',
    comment: ''
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'other',
    description: ''
  });

  // Salary Form
  const [salaryForm, setSalaryForm] = useState({
    user_id: '',
    period_month: month,
    period_year: year,
    base_amount: '',
    bonus_amount: '0',
    penalty_amount: '0',
    comment: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setData([]); // Oldingi ma'lumotlarni tozalash (Crashes oldini oladi)
      let endpoint = '';
      if (activeTab === 'payments') endpoint = '/finance/payments/';
      else if (activeTab === 'expenses') endpoint = '/finance/expenses/';
      else if (activeTab === 'salaries') endpoint = '/finance/salaries/';

      const response = await api.get(endpoint, {
        params: { 
          limit: 50, 
          period_month: month, 
          period_year: year 
        }
      });
      setData(response.data.data);
    } catch (error) {
      console.error("Moliya datasi yuklanmadi", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students/', { params: { limit: 100 } });
      setStudents(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/users/', { params: { limit: 100, role: 'teacher' } });
      setTeachers(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!paymentForm.student_id) {
        setStudentEnrollments([]);
        setPaymentForm(prev => ({ ...prev, enrollment_id: '' }));
        return;
      }
      try {
        const res = await api.get(`/students/${paymentForm.student_id}/enrollments`);
        setStudentEnrollments(res.data || []);
        // Reset enrollment_id when student changes
        setPaymentForm(prev => ({ ...prev, enrollment_id: '' }));
      } catch (error) {
        console.error(error);
      }
    };
    fetchEnrollments();
  }, [paymentForm.student_id]);

  useEffect(() => {
    fetchData();
  }, [activeTab, month, year]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!paymentForm.student_id) return setFormError("O'quvchini tanlang!");
    setIsSubmitting(true);
    
    try {
      await api.post('/finance/payments/', {
        ...paymentForm,
        enrollment_id: paymentForm.enrollment_id || null,
        amount: parseFloat(paymentForm.amount),
        period_month: parseInt(paymentForm.period_month as any),
        period_year: parseInt(paymentForm.period_year as any)
      });
      setIsPaymentModalOpen(false);
      fetchData();
      setPaymentForm(prev => ({ ...prev, amount: '', comment: '', enrollment_id: '' }));
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/finance/expenses/', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      setIsExpenseModalOpen(false);
      fetchData();
      setExpenseForm(prev => ({ ...prev, amount: '', description: '' }));
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!salaryForm.user_id) return setFormError("O'qituvchini tanlang!");
    setIsSubmitting(true);
    
    try {
      await api.post('/finance/salaries/', {
        ...salaryForm,
        period_month: parseInt(salaryForm.period_month as any),
        period_year: parseInt(salaryForm.period_year as any),
        base_amount: parseFloat(salaryForm.base_amount),
        bonus_amount: parseFloat(salaryForm.bonus_amount || '0'),
        penalty_amount: parseFloat(salaryForm.penalty_amount || '0')
      });
      setIsSalaryModalOpen(false);
      fetchData();
      setSalaryForm(prev => ({ ...prev, base_amount: '', bonus_amount: '0', penalty_amount: '0', comment: '' }));
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paySalary = async (salaryId: string) => {
    if (!confirm("Maosh to'langanini tasdiqlaysizmi?")) return;
    try {
      await api.post(`/finance/salaries/${salaryId}/pay`, { comment: "To'landi" });
      fetchData();
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(val);
  };

  // Convert for Select components
  const studentOptions = students.map(s => ({ value: s.id, label: `${s.full_name} (${s.phone})` }));
  const teacherOptions = teachers.map(t => ({ value: t.id, label: `${t.full_name} (${t.phone})` }));
  const enrollmentOptions = studentEnrollments.map(e => ({ value: e.id, label: `${e.group?.name || 'Noma\'lum guruh'}` }));

  const downloadExcel = () => {
    const url = `http://localhost:8001/api/v1/finance/export/excel?tab=${activeTab}&month=${month}&year=${year}`;
    
    // Auth tokenni header orqali jo'nata olmaganimiz uchun
    // Yoki a link orqali yuklash, yoki fetch bilan blob qilib yuklash kerak.
    // Xavfsizlik uchun fetch + blob eng zo'ri:
    api.get(`/finance/export/excel`, {
      params: { tab: activeTab, month, year },
      responseType: 'blob'
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `moliya_${activeTab}_${year}_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    }).catch(err => {
      console.error(err);
      alert("Excel yuklashda xatolik! openpyxl o'rnatilganligiga ishonch hosil qiling.");
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header section remains the same */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Moliya</h2>
          <p className="text-gray-400 mt-1">To'lovlar, xarajatlar va maoshlar hisoboti.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={downloadExcel}
            className="bg-gray-700 hover:bg-gray-600 text-emerald-400 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg border border-gray-600"
          >
            <FileText className="w-5 h-5" />
            Excelga tushirish
          </button>
          <button 
            onClick={() => { setIsSalaryModalOpen(true); fetchTeachers(); }}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            <Banknote className="w-5 h-5" />
            Maosh hisoblash
          </button>
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
          >
            <TrendingDown className="w-5 h-5" />
            Xarajat
          </button>
          <button 
            onClick={() => { setIsPaymentModalOpen(true); fetchStudents(); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
          >
            <Wallet className="w-5 h-5" />
            To'lov qabul qilish
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-gray-700/50 flex flex-wrap gap-4 items-center justify-between bg-gray-800/80">
          <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'payments' ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              To'lovlar
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Xarajatlar
            </button>
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === 'salaries' ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Maoshlar
            </button>
          </div>
          
          <div className="flex gap-3">
            <select 
              value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-inner"
            >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}-oy</option>
                ))}
              </select>
              <select 
                value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 shadow-inner"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {activeTab === 'payments' && (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">O'quvchi</th>
                  <th className="px-6 py-4">Summa</th>
                  <th className="px-6 py-4">Usul</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">To'lovlar topilmadi</td></tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{item.student?.full_name || item.student_id?.slice(0, 8) || 'Noma\'lum'}</div>
                        {item.group_name && (
                          <div className="text-xs text-gray-400 mt-0.5">{item.group_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4 uppercase text-xs">{item.method}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${item.status === 'confirmed' ? 'text-emerald-400' : 'text-gray-400'}`}>
                          <CheckCircle className="w-4 h-4" /> {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'expenses' && (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">Kategoriya</th>
                  <th className="px-6 py-4">Izoh</th>
                  <th className="px-6 py-4">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Xarajatlar topilmadi</td></tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">{item.expense_date}</td>
                      <td className="px-6 py-4 text-white font-medium text-xs">
                        {
                          {
                            rent: "Ijara to'lovi",
                            salary: "Maosh",
                            utility: "Kommunal xizmatlar",
                            equipment: "Jihozlar",
                            marketing: "Marketing va Reklama",
                            other: "Boshqa xarajatlar"
                          }[item.category as string] || item.category
                        }
                      </td>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-red-400 font-bold">{formatCurrency(-item.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'salaries' && (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">O'qituvchi</th>
                  <th className="px-6 py-4">Davr</th>
                  <th className="px-6 py-4">Tarkibi (Asosiy + Bonus - Jarima)</th>
                  <th className="px-6 py-4">Jami To'lanadi</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Maoshlar topilmadi</td></tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors group">
                      <td className="px-6 py-4 text-white font-medium">{item.user?.full_name || item.user_id?.slice(0, 8) || 'Noma\'lum'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-800 px-2.5 py-1 rounded-md text-xs font-bold text-gray-300 border border-gray-700">
                          {item.period_month}-{item.period_year}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {formatCurrency(Number(item.base_amount))} <span className="text-emerald-400 ml-1">+{formatCurrency(Number(item.bonus_amount))}</span> <span className="text-red-400 ml-1">-{formatCurrency(Number(item.penalty_amount))}</span>
                      </td>
                      <td className="px-6 py-4 text-purple-400 font-bold text-base">
                        {formatCurrency(Number(item.base_amount) + Number(item.bonus_amount) - Number(item.penalty_amount))}
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'paid' ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 text-xs font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-max">
                            <CheckCircle className="w-4 h-4" /> To'langan
                          </span>
                        ) : (
                          <button 
                            onClick={() => paySalary(item.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover:shadow-lg hover:shadow-emerald-500/20"
                          >
                            <Clock className="w-4 h-4" /> To'lash
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal PRO Design */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-gray-800/80 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                To'lov qabul qilish
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center animate-in shake">
                  {formError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">O'quvchini qidiring</label>
                <SearchableSelect 
                  options={studentOptions}
                  value={paymentForm.student_id}
                  onChange={(val) => setPaymentForm({...paymentForm, student_id: val})}
                  placeholder="Ism yoki raqam..."
                  className="w-full"
                />
              </div>

              {paymentForm.student_id && studentEnrollments.length > 0 && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-blue-400">Guruhni tanlang (Ixtiyoriy)</label>
                  <SearchableSelect 
                    options={[{ value: '', label: 'Umumiy balansga' }, ...enrollmentOptions]}
                    value={paymentForm.enrollment_id}
                    onChange={(val) => setPaymentForm({...paymentForm, enrollment_id: val})}
                    placeholder="Umumiy balansga..."
                    className="w-full border-blue-500/30"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">Summa (UZS)</label>
                <div className="relative">
                  <input 
                    type="number" required min="1000"
                    value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-lg font-bold transition-all shadow-inner"
                    placeholder="400000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">UZS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">To'lov davri (Oy)</label>
                  <select 
                    value={paymentForm.period_month} onChange={e => setPaymentForm({...paymentForm, period_month: parseInt(e.target.value)})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                  >
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}-oy</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">To'lov usuli</label>
                  <select 
                    value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="card">Plastik karta</option>
                    <option value="bank_transfer">Hisob raqam</option>
                    <option value="click">Click</option>
                    <option value="payme">Payme</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash va Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal PRO Design */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-gray-800/80 flex justify-between items-center bg-gradient-to-r from-red-500/10 to-transparent">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-red-400" />
                Xarajat kiritish
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">Summa (UZS)</label>
                <div className="relative">
                  <input 
                    type="number" required min="1000"
                    value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-lg font-bold shadow-inner transition-all"
                    placeholder="150000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">UZS</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">Kategoriya</label>
                <select 
                  value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 shadow-inner"
                >
                  <option value="other">Boshqa xarajatlar</option>
                  <option value="rent">Ijara to'lovi</option>
                  <option value="marketing">Marketing va Reklama</option>
                  <option value="utility">Kommunal xizmatlar</option>
                  <option value="equipment">Jihozlar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">Izoh (Nima uchun?)</label>
                <textarea 
                  required
                  minLength={3}
                  value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[100px] shadow-inner resize-none transition-all"
                  placeholder="Batafsil ma'lumot kiriting..."
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal PRO Design */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-300">
            <div className="p-5 border-b border-gray-800/80 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-transparent">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Banknote className="w-6 h-6 text-purple-400" />
                Maosh hisoblash
              </h3>
              <button onClick={() => setIsSalaryModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSalarySubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">O'qituvchini qidiring</label>
                <SearchableSelect 
                  options={teacherOptions}
                  value={salaryForm.user_id}
                  onChange={(val) => setSalaryForm({...salaryForm, user_id: val})}
                  placeholder="Ism yoki raqam..."
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-400">Asosiy maosh (UZS)</label>
                <div className="relative">
                  <input 
                    type="number" required min="0"
                    value={salaryForm.base_amount} onChange={e => setSalaryForm({...salaryForm, base_amount: e.target.value})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xl font-bold shadow-inner transition-all"
                    placeholder="3 000 000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">UZS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-800/30 p-4 rounded-xl border border-gray-800/80">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-emerald-400">Bonus ustama (+)</label>
                  <input 
                    type="number" min="0"
                    value={salaryForm.bonus_amount} onChange={e => setSalaryForm({...salaryForm, bonus_amount: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-emerald-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-red-400">Jarima ushlanma (-)</label>
                  <input 
                    type="number" min="0"
                    value={salaryForm.penalty_amount} onChange={e => setSalaryForm({...salaryForm, penalty_amount: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-red-400 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-red-500/50 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Qaysi oy uchun</label>
                  <select 
                    value={salaryForm.period_month} onChange={e => setSalaryForm({...salaryForm, period_month: parseInt(e.target.value)})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-inner"
                  >
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}-oy</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-400">Yil</label>
                  <select 
                    value={salaryForm.period_year} onChange={e => setSalaryForm({...salaryForm, period_year: parseInt(e.target.value)})}
                    className="w-full bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-inner"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? 'Hisoblanmoqda...' : 'Hisoblash va Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
