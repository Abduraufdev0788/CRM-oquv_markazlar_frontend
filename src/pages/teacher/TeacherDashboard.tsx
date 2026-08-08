import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, BookOpen } from 'lucide-react';
import { api } from '../../services/api';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups/');
        setGroups(response.data.data || []);
      } catch (error) {
        console.error("Guruhlarni yuklashda xatolik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const totalStudents = groups.reduce((acc, g) => acc + (g.max_students || 0), 0); // Ideal would be enrolled_count, but fallback to max_students for brief

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Xush kelibsiz, Ustoz!</h2>
        <p className="text-gray-400 mt-1">Bugungi darslaringiz va guruhlaringiz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-blue-500/20 rounded-xl text-blue-400"><Calendar className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-400">Guruhlaringiz</p>
            <h3 className="text-2xl font-bold text-white">{loading ? '...' : groups.length} ta</h3>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-gray-700/50 rounded-xl text-gray-300"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-400">Sig'im bo'yicha jami</p>
            <h3 className="text-2xl font-bold text-white">{loading ? '...' : totalStudents} ta</h3>
          </div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-gray-700/50 rounded-xl text-gray-300"><BookOpen className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-400">Dars jadvali</p>
            <h3 className="text-xl font-bold text-white">Faol</h3>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Guruhlaringiz</h3>
        <div className="space-y-3">
          {loading ? (
            <div className="text-gray-500">Yuklanmoqda...</div>
          ) : groups.length === 0 ? (
            <div className="text-gray-500">Sizga biriktirilgan guruhlar yo'q</div>
          ) : (
            groups.map((group, i) => (
              <div 
                key={i} 
                onClick={() => navigate(`/teacher/groups/${group.id}`)}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-blue-400 font-mono font-medium">{group.start_date} dan</div>
                  <div className="h-8 w-px bg-gray-700"></div>
                  <div>
                    <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">{group.name}</h4>
                    <p className="text-sm text-gray-400">Status: {group.status}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-sm font-medium rounded-lg transition-colors">
                  Yo'qlama qilish
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
