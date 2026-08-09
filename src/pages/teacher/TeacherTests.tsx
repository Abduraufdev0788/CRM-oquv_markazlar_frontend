import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Search, Trash2, Edit2, PlayCircle, Users, Power } from 'lucide-react';
import { api } from '../../services/api';

export const TeacherTests: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tests/', { params: { limit: 100 } });
      setTests(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Rostdan ham ushbu testni o'chirib tashlamoqchimisiz? Undagi barcha o'quvchi natijalari ham o'chib ketadi!")) return;
    try {
      await api.delete(`/tests/${id}`);
      fetchTests();
    } catch (error) {
      console.error("Failed to delete test", error);
      alert("Xatolik yuz berdi");
    }
  };

  const handleToggleActive = async (test: any) => {
    try {
      await api.put(`/tests/${test.id}`, { is_active: !test.is_active });
      fetchTests();
    } catch (error) {
      console.error("Failed to toggle test status", error);
      alert("Xatolik yuz berdi");
    }
  };

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.group?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-700 relative overflow-hidden min-h-screen">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-800 pb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 tracking-tight">
              Testlar (Quizzes)
            </h2>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">
              O'z guruhlaringiz uchun onlayn testlar tuzing, bilimlarni sinang va natijalarni avtomatik tarzda tahlil qiling.
            </p>
          </div>
          <button
            onClick={() => navigate('/teacher/tests/create')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
          >
            <Plus className="w-5 h-5" /> Yangi Test Yaratish
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text"
            placeholder="Test nomi yoki guruh bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-800 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tests List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Hali testlar yo'q</h3>
            <p className="text-gray-500 max-w-md">Birinchi onlayn testingizni yarating va o'quvchilaringizning bilimini darhol sinab ko'ring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <div 
                key={test.id}
                className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300 group flex flex-col relative"
              >
                {!test.is_active && (
                  <div className="absolute -top-3 -right-3 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-500/10">
                    Yopiq
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => navigate(`/teacher/tests/${test.id}`)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Natijalarni ko'rish"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(test)}
                      className={`p-2 rounded-lg transition-colors ${test.is_active ? 'text-orange-400 hover:bg-orange-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                      title={test.is_active ? "Testni Yopish" : "Testni Ochish"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/teacher/tests/${test.id}/edit`)}
                      className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(test.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1" title={test.title}>
                  {test.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
                  {test.description || "Ta'rif yo'q"}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">Guruh</span>
                      <span className="text-gray-300 font-medium">{test.group?.name || "Noma'lum"}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">Savollar</span>
                      <span className="text-indigo-400 font-bold">{test.questions?.length || 0} ta</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/teacher/tests/${test.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-purple-600 text-gray-300 hover:text-white rounded-xl transition-colors text-sm font-bold border border-gray-700 hover:border-purple-500"
                  >
                    Tafsilotlar & Natijalar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
