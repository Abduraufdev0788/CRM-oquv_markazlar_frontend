import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, Plus, MoreVertical, Users, Edit2, Trash2 } from 'lucide-react';
import { GroupFormModal, GroupFormData } from '../../components/admin/GroupFormModal';

interface Group {
  id: string;
  name: string;
  status: string;
  start_date: string;
  max_students: number;
}

export const Groups: React.FC = () => {
  const navigate = useNavigate();
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

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups/', { params: { limit: 50 } });
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
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter groups by search manually since backend search might not be implemented for groups
  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Rostdan ham '${name}' guruhini o'chirishni xohlaysizmi?`)) return;
    try {
      await api.delete(`/groups/${id}`);
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
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Guruh nomi</th>
                <th className="px-6 py-4">Boshlanish sanasi</th>
                <th className="px-6 py-4">Sig'imi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
              ) : filteredGroups.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Guruhlar topilmadi</td></tr>
              ) : (
                filteredGroups.map(group => (
                  <tr key={group.id} onClick={() => navigate(`/admin/groups/${group.id}`)} className="hover:bg-gray-700/20 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-white font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      {group.name}
                    </td>
                    <td className="px-6 py-4 font-mono">{group.start_date}</td>
                    <td className="px-6 py-4">{group.max_students} kishi</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        group.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        group.status === 'FORMING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {group.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => handleOpenEdit(e, group)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, group.id, group.name)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-gray-700 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};
