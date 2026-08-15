import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, Phone, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  TRIAL = 'trial',
  ENROLLED = 'enrolled',
  REJECTED = 'rejected',
}

export interface Lead {
  id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
  created_at: string;
}

const COLUMNS = [
  { id: LeadStatus.NEW, title: 'Yangi Lidlar', color: 'blue' },
  { id: LeadStatus.CONTACTED, title: 'Aloqaga chiqildi', color: 'purple' },
  { id: LeadStatus.TRIAL, title: 'Sinov darsida', color: 'yellow' },
  { id: LeadStatus.ENROLLED, title: "Sotib oldi", color: 'emerald' },
  { id: LeadStatus.REJECTED, title: 'Rad etdi', color: 'red' },
];

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ first_name: '', last_name: '', phone: '', source: '', notes: '' });

  const fetchLeads = async () => {
    try {
      const { data } = await api.get('/leads/');
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      await api.put(`/leads/${leadId}`, { status: newStatus });
    } catch (error) {
      console.error('Error updating lead status:', error);
      fetchLeads(); // revert on error
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leads/', newLead);
      setIsModalOpen(false);
      setNewLead({ first_name: '', last_name: '', phone: '', source: '', notes: '' });
      fetchLeads();
    } catch (error) {
      console.error('Error adding lead:', error);
      alert('Xatolik yuz berdi!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Savdo Voronkasi</h2>
          <p className="text-gray-400 mt-1 text-sm">Yangi mijozlar oqimini zamonaviy usulda boshqaring.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Yangi Lid
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
           <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex gap-5 pb-2 h-full overflow-hidden">
          {COLUMNS.map(col => (
            <div 
              key={col.id} 
              className="flex-1 flex flex-col min-w-0 bg-gray-800/30 rounded-2xl border border-gray-800 overflow-hidden"
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              {/* Header */}
              <div className="p-4 flex justify-between items-center bg-gray-800/40 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full bg-${col.color}-500 shadow-[0_0_8px_rgba(var(--color-${col.color}-500),0.5)]`}></div>
                  <h3 className="font-semibold text-gray-200 text-sm">{col.title}</h3>
                </div>
                <span className="bg-gray-900 text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-700">
                  {leads.filter(l => l.status === col.id).length}
                </span>
              </div>
              
              {/* Cards Container */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {leads.filter(l => l.status === col.id).map((lead, index) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-gray-800 border border-gray-700 hover:border-gray-500 p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 group shadow-sm hover:shadow-md relative"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${lead.first_name}+${lead.last_name || ''}&background=random&bold=true&size=128`} 
                        alt="avatar" 
                        className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-gray-100 text-sm break-words leading-tight">
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <GripVertical className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2 font-medium">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="font-mono">{lead.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    {lead.source && (
                       <div className="mt-3 flex justify-end">
                         <span className="text-[10px] font-bold text-gray-300 bg-gray-700/50 px-2 py-1 rounded-md uppercase tracking-wide border border-gray-600/50">
                           {lead.source}
                         </span>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Yangi Lid qo'shish</h3>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Ism *</label>
                <input required type="text" value={newLead.first_name} onChange={e => setNewLead({...newLead, first_name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Ali" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Familiya</label>
                <input type="text" value={newLead.last_name} onChange={e => setNewLead({...newLead, last_name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Valiyev" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telefon raqam *</label>
                <input required type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="+998901234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Manba</label>
                <input type="text" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Instagram, Telegram..." />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                  Bekor qilish
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium transition-colors">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
