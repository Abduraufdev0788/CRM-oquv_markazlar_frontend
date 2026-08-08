import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api';

export const TeacherTestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [testRes, resultsRes] = await Promise.all([
          api.get(`/tests/${id}`),
          api.get(`/tests/${id}/results`, { params: { limit: 100 } })
        ]);
        setTest(testRes.data);
        setResults(resultsRes.data.data || []);
      } catch (error) {
        console.error("Failed to fetch test details", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!test) {
    return <div className="text-center py-20 text-red-400">Test topilmadi</div>;
  }

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-500 relative min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
          <button 
            onClick={() => navigate('/teacher/tests')}
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-800 bg-gray-900/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{test.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                test.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {test.is_active ? 'Aktiv' : 'Yopiq'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">{test.group?.name} | Maksimal ball: {test.max_score}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Results Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> Natijalar ({results.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-950 text-gray-400 font-medium border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">O'quvchi</th>
                      <th className="px-6 py-4">Ball</th>
                      <th className="px-6 py-4">Foiz</th>
                      <th className="px-6 py-4">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                          <p className="text-gray-500">Hali hech bir o'quvchi ushbu testni yechmadi</p>
                        </td>
                      </tr>
                    ) : (
                      results.map((res, idx) => {
                        const percentage = Math.round((res.score / test.max_score) * 100);
                        let colorClass = "text-red-400";
                        if (percentage >= 80) colorClass = "text-emerald-400";
                        else if (percentage >= 60) colorClass = "text-yellow-400";

                        return (
                          <tr key={res.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-4 text-white font-medium">{res.student?.full_name || "Noma'lum"}</td>
                            <td className="px-6 py-4 font-bold text-white">
                              {res.score} / {test.max_score}
                            </td>
                            <td className={`px-6 py-4 font-bold ${colorClass}`}>
                              {percentage}%
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{new Date(res.created_at).toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Test Info & Questions Preview */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2">Test tafsilotlari</h3>
              <p className="text-gray-400 text-sm mb-4">{test.description || "Ta'rif yo'q"}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-500 text-sm">Savollar soni:</span>
                  <span className="text-white font-bold">{test.questions?.length || 0} ta</span>
                </div>
                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                  <span className="text-gray-500 text-sm">Guruh:</span>
                  <span className="text-white font-bold text-right">{test.group?.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-400" /> Savollar
              </h3>
              
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {test.questions?.map((q: any, i: number) => (
                  <div key={i} className="space-y-3">
                    <p className="text-gray-200 font-medium text-sm leading-relaxed">
                      <span className="text-indigo-400 font-bold mr-2">{i + 1}.</span> 
                      {q.text}
                    </p>
                    <div className="grid grid-cols-1 gap-2 pl-6">
                      {q.options?.map((opt: string, optIdx: number) => (
                        <div 
                          key={optIdx} 
                          className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                            q.correct_answer === optIdx 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' 
                              : 'bg-gray-800/30 border-gray-700 text-gray-400'
                          }`}
                        >
                          {q.correct_answer === optIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-0" />}
                          {['A', 'B', 'C', 'D'][optIdx]}) {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
