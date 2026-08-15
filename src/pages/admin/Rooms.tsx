import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, X, CheckCircle, MapPin, Users, Settings as SettingsIcon, LayoutGrid, Clock } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  current_occupancy?: {
    group_name: string;
    teacher_name: string;
    start_time: string;
    end_time: string;
  };
}

export const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'available'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', capacity: 20 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (activeTab === 'available') {
        params.available_now = true;
      }
      const response = await api.get('/rooms/', { params });
      setRooms(response.data.data || []);
    } catch (error) {
      console.error('Xonalar yuklanmadi', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await api.put(`/rooms/${editingId}`, formData);
      } else {
        await api.post('/rooms/', formData);
      }
      setIsModalOpen(false);
      fetchRooms();
      setFormData({ name: '', capacity: 20 });
      setEditingId(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-indigo-400" /> Xonalar
          </h2>
          <p className="text-gray-400 mt-1 text-sm">O'quv markaz xonalari va ularning bandlik holati.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', capacity: 20 });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Yangi xona
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-900/80 p-1.5 rounded-xl w-fit border border-gray-800 shadow-inner">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'all' ? 'bg-gray-800 text-white shadow-md border border-gray-700/50' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          Barcha xonalar
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'available' ? 'bg-emerald-500/10 text-emerald-400 shadow-md border border-emerald-500/20' : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5'
          }`}
        >
          <CheckCircle className="w-4.5 h-4.5" />
          Ayni vaqtda bo'sh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <MapPin className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-lg font-medium">Xonalar topilmadi</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div 
              key={room.id} 
              className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 hover:border-indigo-500/30 rounded-3xl p-6 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 hover:bg-gray-800/60 relative overflow-hidden"
            >
              {/* Top Accent Gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!room.is_active ? (
                    <span className="text-red-400 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Faol emas
                    </span>
                  ) : room.current_occupancy ? (
                    <span className="text-orange-400 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Dars ketmoqda
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Bo'sh
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setFormData({ name: room.name, capacity: room.capacity });
                      setEditingId(room.id);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 -mr-1"
                    title="Sozlamalar"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white tracking-tight mb-4 group-hover:text-indigo-300 transition-colors">{room.name}</h3>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                    <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Sig'imi</p>
                      <p className="text-sm font-semibold text-gray-200">{room.capacity} ta o'rin</p>
                    </div>
                  </div>

                  {room.current_occupancy && (
                    <div className="flex flex-col gap-2 bg-orange-500/5 p-3 rounded-xl border border-orange-500/10 mt-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 text-xs">Guruh:</span>
                        <span className="font-bold text-orange-400 truncate max-w-[120px] text-right" title={room.current_occupancy.group_name}>{room.current_occupancy.group_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 text-xs">O'qituvchi:</span>
                        <span className="font-medium text-gray-300 truncate max-w-[120px] text-right" title={room.current_occupancy.teacher_name}>{room.current_occupancy.teacher_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1 pt-2 border-t border-orange-500/10">
                        <span className="text-gray-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> Vaqt:</span>
                        <span className="font-mono text-gray-300 text-xs">{room.current_occupancy.start_time} - {room.current_occupancy.end_time}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Background Glow */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
              <h3 className="text-xl font-bold text-white">{editingId ? "Xonani tahrirlash" : "Yangi xona qo'shish"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Xona nomi</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Masalan: 1-xona"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sig'imi (o'rin)</label>
                <input 
                  type="number" required min="1"
                  value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="20"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg font-medium transition-colors border border-gray-700"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
