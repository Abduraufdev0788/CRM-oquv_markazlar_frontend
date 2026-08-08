import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Camera, Server, Plus, RefreshCw, Trash2, X, Key, Activity, Clock } from 'lucide-react';

export const FaceID: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'devices' | 'logs'>('devices');
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ name: '', ip_address: '', serial_number: '', location: '', status: 'ONLINE' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // New secret state
  const [newSecret, setNewSecret] = useState<{ deviceName: string, secret: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'devices') {
        const res = await api.get('/face/devices', { params: { limit: 50 } });
        setDevices(res.data.data || []);
      } else {
        const res = await api.get('/face/logs', { params: { limit: 50 } });
        setLogs(res.data.data || []);
      }
    } catch (error) {
      console.error("Ma'lumotlar yuklanmadi", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/face/devices', deviceForm);
      setIsDeviceModalOpen(false);
      setDeviceForm({ name: '', ip_address: '', serial_number: '', location: '', status: 'ONLINE' });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateSecret = async (id: string, name: string) => {
    if (!window.confirm(`Rostdan ham '${name}' qurilmasining API kalitini yangilamoqchimisiz? Eski kalit darhol ishdan chiqadi.`)) return;
    try {
      const res = await api.post(`/face/devices/${id}/regenerate-secret`);
      setNewSecret({ deviceName: name, secret: res.data.new_secret });
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!window.confirm(`'${name}' qurilmasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/face/devices/${id}`);
      fetchData();
    } catch (err) {
      alert("O'chirishda xatolik");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Camera className="w-8 h-8 text-blue-400" />
            Face ID & IoT
          </h2>
          <p className="text-gray-400 mt-1">O'quv markazidagi avtomat yo'qlama qurilmalari.</p>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex flex-wrap gap-4 items-center justify-between bg-gray-800/80">
          <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-xl">
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'devices' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Server className="w-4 h-4" /> Qurilmalar
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'logs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Activity className="w-4 h-4" /> Jonli Loglar
            </button>
          </div>
          
          {activeTab === 'devices' && (
            <button 
              onClick={() => setIsDeviceModalOpen(true)}
              className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border border-blue-500/30"
            >
              <Plus className="w-4 h-4" /> Yangi Qurilma
            </button>
          )}
          {activeTab === 'logs' && (
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="p-0 sm:p-4">
          {activeTab === 'devices' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center text-gray-500 py-8">Yuklanmoqda...</div>
              ) : devices.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-8">Qurilmalar topilmadi</div>
              ) : (
                devices.map((device: any) => (
                  <div key={device.id} className="bg-gray-900/50 border border-gray-700 rounded-xl p-5 relative group transition-all hover:border-gray-500">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Server className="w-5 h-5 text-gray-400" />
                          {device.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 font-mono">IP: {device.ip_address}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {device.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-400 mb-6">
                      <div className="flex justify-between"><span>Serial:</span> <span className="text-white font-mono">{device.serial_number}</span></div>
                      <div className="flex justify-between"><span>Lokatsiya:</span> <span className="text-white">{device.location || '-'}</span></div>
                      <div className="flex justify-between">
                        <span>Oxirgi ping:</span> 
                        <span className="text-white flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 
                          {device.last_ping ? new Date(device.last_ping).toLocaleTimeString() : 'Hech qachon'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRegenerateSecret(device.id, device.name)}
                        className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Key className="w-4 h-4" /> Kalitni yangilash
                      </button>
                      <button 
                        onClick={() => handleDeleteDevice(device.id, device.name)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-900/50 text-gray-300 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4">Vaqt</th>
                    <th className="px-6 py-4">Qurilma ID</th>
                    <th className="px-6 py-4">Yuz (Face Data ID)</th>
                    <th className="px-6 py-4">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loglar yo'q</td></tr>
                  ) : (
                    logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4 font-mono">{new Date(log.received_at).toLocaleString()}</td>
                        <td className="px-6 py-4">{log.device_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 font-bold text-white">{log.face_data_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            log.is_processed ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {log.is_processed ? 'Qayta ishlangan' : 'Kutmoqda'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Secret Result Modal */}
      {newSecret && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{newSecret.deviceName} API Kaliti</h3>
              <p className="text-gray-400 text-sm mb-6">
                Quyidagi maxfiy kalitni faqat bir marta ko'ra olasiz. Uni nusxalab oling va apparat sozlamalariga kiriting.
              </p>
              
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 mb-6 relative group">
                <code className="text-amber-400 text-sm break-all font-mono">
                  {newSecret.secret}
                </code>
              </div>

              <button 
                onClick={() => setNewSecret(null)}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Tushundim, yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Create Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
              <h3 className="text-xl font-bold text-white">Yangi Apparat Qo'shish</h3>
              <button onClick={() => setIsDeviceModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleDeviceSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Apparat nomi (Model)</label>
                <input 
                  type="text" required
                  value={deviceForm.name} onChange={e => setDeviceForm({...deviceForm, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Masalan: ZKTeco SpeedFace"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">IP Manzil</label>
                <input 
                  type="text" required
                  value={deviceForm.ip_address} onChange={e => setDeviceForm({...deviceForm, ip_address: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="192.168.1.100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Serial Raqami (SN)</label>
                <input 
                  type="text" required
                  value={deviceForm.serial_number} onChange={e => setDeviceForm({...deviceForm, serial_number: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  placeholder="ZK123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Lokatsiya (Qayerda o'rnatilgan)</label>
                <input 
                  type="text"
                  value={deviceForm.location} onChange={e => setDeviceForm({...deviceForm, location: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  placeholder="Masalan: Asosiy kirish eshigi"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setIsDeviceModalOpen(false)}
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
