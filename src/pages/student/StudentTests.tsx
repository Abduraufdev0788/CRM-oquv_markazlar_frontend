import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, PlayCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const StudentTests: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests/', { params: { limit: 100 } });
      setTests(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTestStatus = (test: any) => {
    if (!test.is_active) return { status: 'closed', message: 'Yopiq' };
    
    const now = new Date();
    
    if (test.start_time) {
      const startTime = new Date(test.start_time);
      if (now < startTime) {
        return { 
          status: 'upcoming', 
          message: `Boshlanadi: ${startTime.toLocaleString('uz-UZ')}` 
        };
      }
    }
    
    if (test.end_time) {
      const endTime = new Date(test.end_time);
      if (now > endTime) {
        return { 
          status: 'expired', 
          message: 'Vaqti tugagan' 
        };
      }
    }
    
    return { status: 'open', message: 'Ochiq' };
  };

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-700 relative overflow-hidden min-h-screen">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col gap-2 border-b border-gray-800 pb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-500" /> Mening Testlarim
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl">
            Sizning guruhlaringiz uchun o'qituvchilar tomonidan tayyorlangan onlayn testlar.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Hozircha testlar yo'q</h3>
            <p className="text-gray-500 max-w-md">Sizning guruhlaringiz uchun hali testlar yuklanmagan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const { status, message } = getTestStatus(test);
              const isOpen = status === 'open';
              const isExhausted = test.attempts_used !== undefined && test.attempts_used >= test.max_attempts;
              const canTake = isOpen && !isExhausted;
              
              return (
                <div 
                  key={test.id}
                  className={`bg-gray-900/60 backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 flex flex-col relative ${
                    canTake ? 'border-blue-500/30 hover:border-blue-500/60 shadow-lg shadow-blue-500/5' : 'border-gray-800 opacity-80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      canTake ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-500'
                    }`}>
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      status === 'open' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {status === 'open' ? 'Ochiq' : status === 'upcoming' ? 'Kutilmoqda' : 'Yopiq'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{test.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                    {test.description || "Ta'rif yo'q"}
                  </p>

                  <div className="mt-auto space-y-4">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2"><ClipboardList className="w-4 h-4"/> Savollar:</span>
                        <span className="text-white font-bold">{test.questions?.length || 0} ta</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-2"><Clock className="w-4 h-4"/> Maksimal ball:</span>
                        <span className="text-blue-400 font-bold">{test.max_score}</span>
                      </div>
                      
                      {test.attempts_used !== undefined && test.max_attempts > 1 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-2"><ClipboardList className="w-4 h-4"/> Urinishlar:</span>
                          <span className={`${isExhausted ? 'text-red-400' : 'text-indigo-400'} font-bold`}>
                            {test.attempts_used} / {test.max_attempts}
                          </span>
                        </div>
                      )}
                      
                      {status !== 'open' && (
                        <div className="pt-2 mt-2 border-t border-gray-700/50 text-xs text-center font-medium text-gray-400">
                          {message}
                        </div>
                      )}
                      {isOpen && isExhausted && (
                        <div className="pt-2 mt-2 border-t border-gray-700/50 text-xs text-center font-medium text-red-400">
                          Barcha urinishlar tugagan
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate(`/student/tests/${test.id}`)}
                      disabled={!canTake}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold ${
                        canTake 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isExhausted ? (
                        <>Barcha urinishlar tugagan</>
                      ) : (
                        <><PlayCircle className="w-5 h-5" /> Testni Boshlash</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
