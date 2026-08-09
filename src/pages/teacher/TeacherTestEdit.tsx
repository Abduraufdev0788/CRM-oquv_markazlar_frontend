import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface Question {
  text: string;
  type: string;
  options: string[];
  correct_answer: number | null;
}

export const TeacherTestEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    group_id: '',
    title: '',
    description: '',
    max_score: 100,
    is_active: true,
    start_time: '',
    end_time: '',
    max_attempts: 1
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toLocalISOString = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const groupsRes = await api.get('/groups/', { params: { limit: 100 } });
        setGroups(groupsRes.data.data || []);
        
        if (id) {
          const testRes = await api.get(`/tests/${id}`);
          const data = testRes.data;
          setFormData({
            group_id: data.group_id || '',
            title: data.title || '',
            description: data.description || '',
            max_score: data.max_score || 100,
            is_active: data.is_active,
            start_time: toLocalISOString(data.start_time),
            end_time: toLocalISOString(data.end_time),
            max_attempts: data.max_attempts || 1
          });
          if (data.questions && data.questions.length > 0) {
            const safeQuestions = data.questions.map((q: any) => {
              let parsedOptions = ['', '', '', ''];
              if (Array.isArray(q.options) && q.options.length > 0) {
                parsedOptions = [...q.options];
                while(parsedOptions.length < 4) parsedOptions.push('');
                if (parsedOptions.length > 4) parsedOptions = parsedOptions.slice(0, 4);
              }
              
              let parsedCorrect = null;
              if (q.correct_answer !== undefined && q.correct_answer !== null) {
                 const num = Number(q.correct_answer);
                 if (!isNaN(num)) parsedCorrect = num;
              }

              return {
                text: q.text || '',
                type: q.type || 'choice',
                options: parsedOptions,
                correct_answer: parsedCorrect
              };
            });
            setQuestions(safeQuestions);
          } else {
            setQuestions([{ text: '', type: 'choice', options: ['', '', '', ''], correct_answer: null }]);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [id]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', type: 'choice', options: ['', '', '', ''], correct_answer: null }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIndex) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleAiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAiLoading(true);
    setAiError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/tests/generate-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.questions && Array.isArray(res.data.questions)) {
        setQuestions(res.data.questions);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.response?.data?.detail || "AI yordamida savol yaratishda xatolik yuz berdi");
    } finally {
      setAiLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.group_id) {
      setError("Iltimos, guruhni tanlang!");
      window.scrollTo(0, 0);
      return;
    }
    if (!formData.title.trim()) {
      setError("Test nomini kiriting!");
      window.scrollTo(0, 0);
      return;
    }
    if (!formData.max_score || formData.max_score < 1) {
      setError("Maksimal ballni kiriting!");
      window.scrollTo(0, 0);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`${i + 1}-savol matnini kiriting!`);
        window.scrollTo(0, 0);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`${i + 1}-savolning ${j + 1}-variantini kiriting!`);
          window.scrollTo(0, 0);
          return;
        }
      }
      if (q.correct_answer === null) {
        setError(`${i + 1}-savol uchun to'g'ri javobni belgilang!`);
        window.scrollTo(0, 0);
        return;
      }
    }

    setLoading(true);
    try {
      await api.put(`/tests/${id}`, {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-800 hover:border-gray-700 bg-gray-900/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-400" /> Testni Tahrirlash
              </h2>
              <p className="text-gray-400 text-sm mt-1">Mavjud test savollari va ma'lumotlarini o'zgartiring.</p>
            </div>
          </div>
          
          <div>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleAiFileUpload} 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={aiLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {aiLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {aiLoading ? "PDF O'qilmoqda..." : "AI Yordamida (PDF)"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
          </div>
        )}
        
        {aiError && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-center gap-3 text-orange-400 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{aiError}</p>
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
                  type="number"
                  min="1"
                  value={formData.max_score}
                  onChange={e => setFormData({...formData, max_score: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Boshlanish vaqti (ixtiyoriy)</label>
                <input 
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Tugash vaqti (ixtiyoriy)</label>
                <input 
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={e => setFormData({...formData, end_time: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Urinishlar soni <span className="text-red-400">*</span></label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_attempts}
                  onChange={e => setFormData({...formData, max_attempts: parseInt(e.target.value) || 1})}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 md:col-span-2">
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
                        type="text"
                        value={opt || ''}
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
          <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-8 bg-[#111827]/80 p-4 rounded-2xl border border-gray-800 shadow-2xl">
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
