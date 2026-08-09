import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import { api } from '../../services/api';

export const StudentTestTake: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const allAnswered = test ? Object.keys(answers).length === test.questions.length : false;

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/tests/${id}`);
        
        if (res.data.attempts_used >= res.data.max_attempts) {
          setError("Siz bu test uchun berilgan barcha urinishlardan foydalanib bo'ldingiz!");
          setLoading(false);
          return;
        }

        setTest(res.data);
        
        // Calculate remaining time if end_time exists
        if (res.data.end_time) {
          const end = new Date(res.data.end_time).getTime();
          const now = new Date().getTime();
          if (end > now) {
            setTimeLeft(Math.floor((end - now) / 1000));
          } else {
            setError("Test vaqti tugagan!");
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || "Testni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result || submitting) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timerId);
          handleSubmit(true); // Auto submit when time is up
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, result, submitting]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (result) return; // Disallow changes after submission
    setAnswers(prev => ({
      ...prev,
      [questionIndex.toString()]: optionIndex
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!test || result || submitting) return;
    
    // Custom confirmation modal
    if (!isAutoSubmit && !allAnswered) {
      setShowConfirmModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/tests/${id}/submit`, { answers });
      setResult(res.data);
      
      // Fetch full test again to get correct_answer fields which are now visible
      try {
        const testRes = await api.get(`/tests/${id}`);
        setTest(testRes.data);
      } catch(e) {
        console.error("Failed to fetch full test details", e);
      }
      
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Testni yuborishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Xatolik</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/student/tests')} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-xl transition-colors">
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-10 rounded-3xl max-w-lg w-full text-center relative z-10 shadow-2xl">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Test Yakunlandi!</h1>
          <p className="text-gray-400 mb-8">Sizning natijangiz muvaffaqiyatli saqlandi.</p>
          
          <div className="bg-gray-950 rounded-2xl p-6 mb-8 border border-gray-800">
            <div className="text-gray-500 font-medium text-sm mb-1">To'plagan balingiz:</div>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              {result.score} <span className="text-xl text-gray-500 font-bold">/ {test?.max_score}</span>
            </div>
          </div>
          
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => navigate('/student/tests')} 
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-bold transition-all border border-gray-700"
            >
              Ro'yxatga qaytish
            </button>
            {test?.attempts_used < test?.max_attempts && (
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
              >
                Yana urinish ({test.max_attempts - test.attempts_used} ta qoldi)
              </button>
            )}
          </div>

          {/* Answer Breakdown */}
          {test?.attempts_used >= test?.max_attempts ? (
            <div className="text-left space-y-6 mt-8 border-t border-gray-800 pt-8 w-full">
              <h3 className="text-xl font-bold text-white mb-6">Javoblar tahlili:</h3>
              
              {test?.questions?.map((q: any, i: number) => {
              const studentAnswer = result.answers[i.toString()];
              const isCorrect = studentAnswer === q.correct_answer;
              const hasAnswered = studentAnswer !== undefined;

              return (
                <div key={i} className={`p-5 rounded-2xl border ${isCorrect ? 'bg-green-950/20 border-green-900/50' : 'bg-red-950/20 border-red-900/50'}`}>
                  <p className="text-gray-200 font-medium mb-4">
                    <span className="font-bold mr-2 text-gray-400">{i + 1}.</span> {q.text}
                  </p>
                  
                  <div className="space-y-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isStudentChoice = studentAnswer === optIdx;
                      const isActualCorrect = q.correct_answer === optIdx;
                      
                      let optionClass = "bg-gray-900/50 border-gray-800 text-gray-500";
                      
                      if (isActualCorrect) {
                        optionClass = "bg-green-500/20 border-green-500/50 text-green-400 font-medium";
                      } else if (isStudentChoice && !isCorrect) {
                        optionClass = "bg-red-500/20 border-red-500/50 text-red-400 font-medium";
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border text-sm flex items-center justify-between ${optionClass}`}>
                          <span>{['A', 'B', 'C', 'D'][optIdx]}) {opt}</span>
                          {isActualCorrect && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {(isStudentChoice && !isCorrect) && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                  
                  {!hasAnswered && (
                    <div className="mt-3 text-xs text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Siz bu savolga javob bermagansiz
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          ) : (
            <div className="mt-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700 text-gray-400">
              <p>Javoblar tahlili barcha urinishlardan foydalanib bo'lingandan so'ng ko'rsatiladi.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (Object.keys(answers).length > 0) {
                  setShowConfirmModal(true);
                } else {
                  navigate('/student/tests');
                }
              }}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white line-clamp-1">{test?.title}</h1>
          </div>
          
          {test?.max_attempts > 1 && test?.attempts_used !== undefined && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Urinishlar: {test.attempts_used} / {test.max_attempts}
            </div>
          )}
          
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold font-mono tracking-wider ${
              timeLeft < 300 ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-gray-800 text-blue-400'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* Questions Container */}
      <div className="max-w-3xl mx-auto p-4 md:p-6 mt-6 space-y-8">
        
        {test?.description && (
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl text-gray-300">
            {test.description}
          </div>
        )}

        {test?.questions.map((q: any, qIndex: number) => (
          <div key={qIndex} id={`q-${qIndex}`} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-xl relative">
            <div className="absolute -top-4 -left-2 md:-left-4 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-4 border-gray-950 shadow-lg">
              {qIndex + 1}
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-white mb-8 mt-2 leading-relaxed">
              {q.text}
            </h3>
            
            <div className="space-y-3">
              {q.options.map((opt: string, optIndex: number) => {
                const isSelected = answers[qIndex.toString()] === optIndex;
                
                return (
                  <label 
                    key={optIndex} 
                    className={`flex items-start p-4 md:p-5 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                        : 'bg-gray-950/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center h-6">
                      <input 
                        type="radio"
                        name={`question-${qIndex}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(qIndex, optIndex)}
                        className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-700 focus:ring-blue-600 focus:ring-offset-gray-900"
                      />
                    </div>
                    <div className="ml-4 text-base md:text-lg text-gray-200 font-medium">
                      {opt}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 font-medium text-center">
            {error}
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-gray-400 font-medium hidden md:block">
            Javob berildi: <span className="text-white">{Object.keys(answers).length}</span> / {test?.questions.length}
          </div>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting || (timeLeft !== null && timeLeft <= 0)}
            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>Yakunlash va Saqlab Chiqish</>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${!allAnswered ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
              <AlertCircle className={`w-8 h-8 ${!allAnswered ? 'text-orange-500' : 'text-blue-500'}`} />
            </div>
            
            <h3 className="text-2xl font-bold text-white text-center mb-2">Testni Yakunlash</h3>
            
            <p className="text-gray-400 text-center mb-8">
              {!allAnswered 
                ? "Barcha savollarga javob bermadingiz! Hozir yakunlasangiz, belgilanmagan savollar xato deb hisoblanadi. Yakunlamoqchimisiz?"
                : "Barcha savollarga javob berdingiz. Testni yakunlab natijalarni saqlamoqchimisiz?"
              }
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3.5 rounded-xl font-bold transition-colors"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit(true);
                }}
                className={`flex-1 text-white py-3.5 rounded-xl font-bold shadow-lg transition-colors ${
                  !allAnswered 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/25' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                }`}
              >
                Ha, Yakunlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
