import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Wallet, TrendingDown, Plus, Search, CheckCircle, XCircle, FileText } from 'lucide-react';

export const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filters
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Students for payment dropdown
  const [students, setStudents] = useState<any[]>([]);

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    amount: '',
    period_month: month,
    period_year: year,
    payment_method: 'CASH',
    comment: ''
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'OFFICE',
    description: ''
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'payments' ? '/finance/payments/' : '/finance/expenses/';
      const response = await api.get(endpoint, {
        params: { limit: 50, period_month: activeTab === 'payments' ? month : undefined, period_year: activeTab === 'payments' ? year : undefined }
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
      if (res.data.data.length > 0) setPaymentForm(prev => ({ ...prev, student_id: res.data.data[0].id }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'payments') {
      fetchStudents();
    }
  }, [activeTab, month, year]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/finance/payments/', {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount),
        period_month: parseInt(paymentForm.period_month as any),
        period_year: parseInt(paymentForm.period_year as any)
      });
      setIsPaymentModalOpen(false);
      fetchData();
      setPaymentForm(prev => ({ ...prev, amount: '', comment: '' }));
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Moliya</h2>
          <p className="text-gray-400 mt-1">To'lovlar, xarajatlar va oylik hisobotlar.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
          >
            <TrendingDown className="w-5 h-5" />
            Xarajat qo'shish
          </button>
          <button 
            onClick={() => { setIsPaymentModalOpen(true); fetchStudents(); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Wallet className="w-5 h-5" />
            To'lov qabul qilish
          </button>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex flex-wrap gap-4 items-center justify-between bg-gray-800/80">
          <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-xl">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'payments' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              To'lovlar
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Xarajatlar
            </button>
          </div>
          
          {activeTab === 'payments' && (
            <div className="flex gap-3">
              <select 
                value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}-oy</option>
                ))}
              </select>
              <select 
                value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {activeTab === 'payments' ? (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">O'quvchi / Chek No.</th>
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
                    <tr key={item.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-white font-medium">{item.student_id?.slice(0, 8) || 'O\'quvchi'}...</td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4">{item.payment_method}</td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 flex items-center gap-1.5 text-xs font-medium">
                          <CheckCircle className="w-4 h-4" /> To'langan
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
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
                    <tr key={item.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">{item.expense_date}</td>
                      <td className="px-6 py-4 text-white font-medium">{item.category}</td>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-red-400 font-bold">-{formatCurrency(item.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-emerald-500/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                To'lov qabul qilish
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">O'quvchi</label>
                <select 
                  required
                  value={paymentForm.student_id} onChange={e => setPaymentForm({...paymentForm, student_id: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.phone})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">To'lov summasi (UZS)</label>
                <input 
                  type="number" required min="1000"
                  value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-lg font-bold"
                  placeholder="Masalan: 400000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Qaysi oy uchun</label>
                  <select 
                    value={paymentForm.period_month} onChange={e => setPaymentForm({...paymentForm, period_month: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}-oy</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Usul</label>
                  <select 
                    value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CASH">Naqd pul</option>
                    <option value="CARD">Plastik karta</option>
                    <option value="BANK_TRANSFER">Hisob raqam</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 text-lg shadow-lg shadow-emerald-500/25"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash va Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-red-500/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-red-400" />
                Xarajat kiritish
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Summa (UZS)</label>
                <input 
                  type="number" required min="1000"
                  value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 text-lg font-bold"
                  placeholder="Masalan: 100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Kategoriya</label>
                <select 
                  value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500"
                >
                  <option value="OFFICE">Ofis xarajatlari</option>
                  <option value="RENT">Ijara to'lovi</option>
                  <option value="MARKETING">Marketing va Reklama</option>
                  <option value="TAXES">Soliqlar</option>
                  <option value="OTHER">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Izoh</label>
                <textarea 
                  required
                  value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 min-h-[80px]"
                  placeholder="Xarajat nima uchun qilindi?"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 text-lg shadow-lg shadow-red-500/25"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Tasdiqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
