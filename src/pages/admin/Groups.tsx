import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, Plus, MoreVertical, Users, Edit2, Trash2, MapPin, Calendar, LayoutGrid } from 'lucide-react';
import { GroupFormModal, GroupFormData } from '../../components/admin/GroupFormModal';
import { useAuthStore } from '../../store/authStore';

interface Group {
  id: string;
  name: string;
  status: string;
  start_date: string;
  max_students: number;
  course?: { name: string; color_hex?: string };
  room?: { name: string };
  schedule?: any[];
}

export const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupToEdit, setSelectedGroupToEdit] = useState<GroupFormData | undefined>(undefined);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{id: string, name: string} | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups/', { params: { limit: 500 } });
      setGroups(response.data.data);
    } catch (error) {
      console.error("Guruhlar yuklanmadi:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, tRes, rRes] = await Promise.all([
        api.get('/courses/'),
        api.get('/users/', { params: { role: 'teacher' } }),
        api.get('/rooms/', { params: { limit: 100 } })
      ]);
      setCourses(cRes.data.data || []);
      setTeachers(tRes.data.data || []);
      setRooms(rRes.data.data || []);
      if (cRes.data.data.length > 0) {
        // Form ma'lumotlari endi modalning o'zida boshqariladi
      }
    } catch (e) {
      console.error("Dependency yuklanishda xato", e);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchDependencies();
  }, []);

  const handleOpenCreate = () => {
    setSelectedGroupToEdit(undefined);
    setSelectedGroupId(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (e: React.MouseEvent, group: any) => {
    e.stopPropagation();
    try {
      // Fetch full group details including schedule
      const res = await api.get(`/groups/${group.id}`);
      const g = res.data;
      setSelectedGroupToEdit({
        name: g.name,
        course_id: g.course_id,
        room_id: g.room_id || '',
        teacher_id: g.teacher_id || '',
        start_date: g.start_date,
        max_students: g.max_students,
        schedule: g.schedule || []
      });
      setSelectedGroupId(g.id);
      setFormError('');
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (data: GroupFormData) => {
    setFormError('');
    setIsSubmitting(true);
    
    if (data.schedule.length === 0) {
      setFormError("Kamida bitta kun tanlanishi kerak!");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const payload = {
        ...data,
        course_id: data.course_id || null,
        room_id: data.room_id || null, // Optional in backend
        teacher_id: data.teacher_id || null, // Optional in backend
      };
      
      if (selectedGroupId) {
        await api.put(`/groups/${selectedGroupId}`, payload);
      } else {
        await api.post('/groups/', payload);
      }
      
      setIsModalOpen(false);
      fetchGroups();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let errorMessage = "Xatolik yuz berdi";
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join(', ');
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups by search manually since backend search might not be implemented for groups
  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setGroupToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await api.delete(`/groups/${groupToDelete.id}`);
      setGroupToDelete(null);
      fetchGroups();
    } catch (err) {
      alert("Guruhni o'chirishda xatolik yuz berdi");
    }
  };

  const filteredGroups = groups.filter(g => 
    (g.status !== 'archived' && g.status !== 'ARCHIVED') && 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Guruhlar (Akademik)</h2>
          <p className="text-gray-400 mt-1">O'quv markazning barcha guruhlari va ularning holati.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" />
          Yangi guruh
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Guruh nomini qidirish..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-500">Yuklanmoqda...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Guruhlar topilmadi</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
              <div key={group.id} 
                className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 hover:border-blue-500/30 rounded-3xl flex flex-col transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Card Body */}
                <div className="p-6 flex-1 cursor-pointer relative z-10" onClick={() => navigate(`/${role}/groups/${group.id}`)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                         <Users className="w-6 h-6" />
                       </div>
                       <div>
                         <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">{group.name}</h3>
                         <p className="text-xs text-gray-400 mt-0.5">{group.course?.name || "Kurs tanlanmagan"}</p>
                       </div>
                    </div>
                    
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm border ${
                      group.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      group.status === 'FORMING' || group.status === 'PLANNED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : group.status === 'FORMING' || group.status === 'PLANNED' ? 'bg-amber-500' : 'bg-gray-500'}`}></span>
                      {group.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                      <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Xona</p>
                        <p className="text-sm font-semibold text-gray-200">{group.room?.name || "Birlashtirilmagan"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                      <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Boshlanish</p>
                        <p className="text-sm font-semibold text-gray-200">{group.start_date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                      <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sig'im</p>
                        <p className="text-sm font-semibold text-gray-200">{group.max_students} o'quvchi</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Card Footer for Actions */}
                <div className="p-4 border-t border-gray-700/50 bg-gray-900/30 flex justify-between items-center relative z-10">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit({ stopPropagation: () => {} } as React.MouseEvent, group)}
                      className="p-2 bg-gray-800 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 rounded-xl transition-colors border border-gray-700 hover:border-blue-500/30"
                      title="Tahrirlash"
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(e, group.id, group.name)}
                      className="p-2 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-colors border border-gray-700 hover:border-red-500/30"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/${role}/groups/${group.id}`)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Ichiga kirish
                  </button>
                </div>
                
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <GroupFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedGroupToEdit}
        courses={courses}
        teachers={teachers}
        rooms={rooms}
        isSubmitting={isSubmitting}
        formError={formError}
        title={selectedGroupId ? "Guruhni tahrirlash" : "Yangi guruh ochish"}
      />

      {/* Delete Confirm Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-inner">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Guruhni o'chirish</h3>
              <p className="text-gray-400 text-sm mb-6">
                Rostdan ham <span className="font-bold text-white">"{groupToDelete.name}"</span> guruhini o'chirib tashlamoqchimisiz?
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setGroupToDelete(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-colors border border-gray-700"
                >
                  Yo'q
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/25 active:scale-95"
                >
                  Ha, o'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
