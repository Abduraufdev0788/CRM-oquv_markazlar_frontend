import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface Question {
  text: string;
  type: string;
  options: string[];
  correct_answer: number | null;
}

export const TeacherTestCreate: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    group_id: '',
    title: '',
    description: '',
    max_score: 100,
    is_active: true
  });
  
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', type: 'choice', options: ['', '', '', ''], correct_answer: 0 }
  ]);
  
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/groups/', { params: { limit: 100 } })
      .then(res => setGroups(res.data.data || []))
      .catch(err => console.error(err));
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', type: 'choice', options: ['', '', '', ''], correct_answer: 0 }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQs = [...questions];
    (newQs[index] as any)[field] = value;
    setQuestions(newQs);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQs = [...questions];
    newQs[qIndex].options[optIndex] = value;
    setQuestions(newQs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.group_id) {
      setError("Iltimos, guruhni tanlang!");
      window.scrollTo(0, 0);
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`${i + 1}-savol matnini kiriting!`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`${i + 1}-savolning ${j + 1}-variantini kiriting!`);
          return;
        }
      }
      if (q.correct_answer === null) {
        setError(`${i + 1}-savol uchun to'g'ri javobni belgilang!`);
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/tests/', {
        ...formData,
        questions
      });
      navigate('/teacher/tests');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Testni saqlashda xatolik yuz berdi");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-700 bg-gray-900/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" /> Yangi Test Yaratish
            </h2>
            <p className="text-gray-400 text-sm mt-1">Savollar, variantlar va to'g'ri javoblarni kiritib o'z onlayn testingizni yarating.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Test Details Card */}
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-4">Asosiy ma'lumotlar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Test nomi <span className="text-red-400">*</span></label>
                <input 
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Masalan: 1-oraliq nazorat"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Guruh <span className="text-red-400">*</span></label>
                <select 
                  required
                  value={formData.group_id}
                  onChange={e => setFormData({...formData, group_id: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Guruhni tanlang...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} - {g.course?.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Qisqacha ta'rif (ixtiyoriy)</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-20"
                  placeholder="Test haqida qisqacha ma'lumot kiriting..."
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Maksimal Ball <span className="text-red-400">*</span></label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={formData.max_score}
                  onChange={e => setFormData({...formData, max_score: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-8">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Hozirning o'zida o'quvchilarga ko'rinsin (Aktiv)
                </label>
              </div>
            </div>
          </div>

          {/* Questions Container */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center justify-between">
              Savollar ({questions.length})
            </h3>
            
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6 relative group animate-in slide-in-from-bottom-2">
                
                {/* Question Header */}
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {qIndex + 1}-savol
                  </span>
                  
                  {questions.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
                      title="Savolni o'chirish"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <div className="mb-6">
                  <input 
                    required
                    type="text"
                    value={q.text}
                    onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)}
                    className="w-full bg-transparent border-b-2 border-gray-700 focus:border-indigo-500 text-white text-lg px-2 py-2 focus:outline-none transition-colors placeholder:text-gray-600 font-medium"
                    placeholder="Savol matnini kiriting..."
                  />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => (
                    <div 
                      key={optIndex} 
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                        q.correct_answer === optIndex 
                          ? 'border-green-500/50 bg-green-500/10' 
                          : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                      }`}
                    >
                      <div 
                        className="cursor-pointer shrink-0 ml-2"
                        onClick={() => handleQuestionChange(qIndex, 'correct_answer', optIndex)}
                        title="To'g'ri javobni belgilash"
                      >
                        {q.correct_answer === optIndex ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center">
                            <span className="text-[10px] text-gray-500 font-bold">{['A', 'B', 'C', 'D'][optIndex]}</span>
                          </div>
                        )}
                      </div>
                      <input 
                        required
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="flex-1 bg-transparent border-none text-white focus:outline-none text-sm p-2 placeholder:text-gray-600"
                        placeholder={`${['A', 'B', 'C', 'D'][optIndex]} variant...`}
                      />
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 
                  Variantlardan birini "To'g'ri javob" qilib belgilash uchun doirachani bosing.
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 sticky bottom-6 z-20 bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl border border-gray-800 shadow-2xl">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5 text-indigo-400" /> Yangi Savol Qo'shish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><Save className="w-5 h-5" /> Testni Saqlash</>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};
