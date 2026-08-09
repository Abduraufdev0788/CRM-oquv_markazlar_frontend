import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  max_students: number;
  schedule: any[];
  room?: {
    id: string;
    name: string;
    capacity: number;
  };
  course?: {
    id: string;
    name: string;
    color_hex?: string;
  };
}

export const TeacherGroups: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get('/groups/');
        // Sort groups by start date descending
        const sortedGroups = (response.data.data || []).sort((a: Group, b: Group) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
        setGroups(sortedGroups);
      } catch (error) {
        console.error("Guruhlarni yuklashda xatolik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">Faol</span>;
      case 'PLANNED':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">Kutilmoqda</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">{status}</span>;
    }
  };

  const DAYS_UZ: Record<string, string> = {
    monday: 'Du', tuesday: 'Se', wednesday: 'Ch',
    thursday: 'Pa', friday: 'Ju', saturday: 'Sh', sunday: 'Ya'
  };

  const formatSchedule = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return 'Belgilanmagan';
    // Kunlarni o'zbek tilida qisqartirib yozamiz
    const days = schedule.map(s => DAYS_UZ[s.day] || s.day).join(', ');
    const times = schedule[0] ? `${schedule[0].start} - ${schedule[0].end}` : '';
    return `${days} | ${times}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
            Mening Guruhlarim
          </h2>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            O'zingizga biriktirilgan barcha guruhlarni boshqaring va darslarga tayyorgarlik ko'ring.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="bg-gray-800/30 rounded-2xl h-64 animate-pulse border border-gray-700/50"></div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-300">Sizda hali guruhlar yo'q</h3>
          <p className="text-gray-500 mt-2 max-w-md">
            Hozircha sizga biriktirilgan guruhlar mavjud emas. Yangi guruh ochilishi yoki o'quvchilar yig'ilishini kuting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map(group => {
            const courseColor = group.course?.color_hex || '#3b82f6'; // default blue

            return (
              <div
                key={group.id}
                onClick={() => navigate(`/teacher/groups/${group.id}`)}
                className="group relative bg-gray-800/40 backdrop-blur-md rounded-3xl border border-gray-700/50 overflow-hidden cursor-pointer hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                style={{
                  boxShadow: `0 10px 40px -10px ${courseColor}15`,
                }}
              >
                {/* Top Colored Accent Bar */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: courseColor }}
                ></div>

                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: `${courseColor}40`, border: `1px solid ${courseColor}80` }}
                        >
                          {group.course?.name || "Noma'lum kurs"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                    </div>
                    {getStatusBadge(group.status)}
                  </div>

                  {/* Card Body - Grid Info */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 my-6">
                    <div className="flex items-center gap-2.5 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Boshlangan</span>
                        <span className="text-sm font-medium">{group.start_date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Jadval</span>
                        <span className="text-xs font-medium leading-tight">{formatSchedule(group.schedule)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Xona</span>
                        <span className="text-sm font-medium">{group.room?.name || 'Belgilanmagan'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Sig'imi</span>
                        <span className="text-sm font-medium">{group.max_students} ta</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                      Tafsilotlarni ko'rish
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
