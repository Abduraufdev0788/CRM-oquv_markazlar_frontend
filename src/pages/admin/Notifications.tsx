import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Send, History, CheckCircle2, AlertCircle, Inbox, Bell } from 'lucide-react';

export const Notifications = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [inbox, setInbox] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'outbox') {
      fetchHistory();
      fetchGroups();
    } else {
      fetchInbox();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/notifications/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/');
      setGroups(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInbox = async () => {
    try {
      const res = await api.get('/notifications/');
      setInbox(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setInbox(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload: any = {
        title,
        body,
        target,
        channel: 'in_app'
      };
      if (target === 'group') {
        if (!groupId) {
          setErrorMsg("Guruhni tanlang!");
          setIsLoading(false);
          return;
        }
        payload.group_id = groupId;
      }

      const res = await api.post('/notifications/send', payload);
      setSuccessMsg(`Xabar muvaffaqiyatli ${res.data.count} kishiga yuborildi!`);
      setTitle('');
      setBody('');
      fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Xabarnomalar</h1>
        <div className="flex bg-gray-800/80 p-1 rounded-xl border border-gray-700/50 backdrop-blur-xl shadow-lg">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'inbox' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Inbox className="w-4 h-4" /> Murojaatlar
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'outbox' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Send className="w-4 h-4" /> Yuborish
          </button>
        </div>
      </div>

      {activeTab === 'inbox' && (
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-700/50 pb-4">
            <Bell className="w-6 h-6 text-blue-400" />
            Kiruvchi xabarlar va murojaatlar
          </h2>
          {inbox.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-800/80 rounded-full flex items-center justify-center mb-4 shadow-inner border border-gray-700">
                <Inbox className="w-10 h-10 text-gray-500" />
              </div>
              <h4 className="text-xl font-medium text-white mb-2">Hozircha xabarlar yo'q</h4>
              <p className="text-gray-400">Sizning kiruvchi xabarlar qutingiz bo'sh.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {inbox.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-6 rounded-2xl border ${notif.is_read ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-800/80 border-blue-500/40 shadow-lg'} flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:bg-gray-700/50 group`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      {!notif.is_read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>}
                      <h4 className={`text-lg font-bold tracking-tight ${notif.is_read ? 'text-gray-300' : 'text-white group-hover:text-blue-400 transition-colors'}`}>{notif.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-700 text-gray-300 border border-gray-600 uppercase font-semibold tracking-wider">
                        {notif.type}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap pl-5 sm:pl-0">{notif.body}</p>
                    <div className="text-xs font-medium text-gray-500 pt-2 flex items-center gap-1.5 pl-5 sm:pl-0">
                      <History className="w-3.5 h-3.5" />
                      {new Date(notif.created_at).toLocaleString('uz-UZ', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      className="px-4 py-2 mt-3 sm:mt-0 w-full sm:w-auto rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-gray-200 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      O'qildi
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'outbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Xabar Yuborish Formasi */}
          <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-6 rounded-3xl shadow-2xl h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Yangi xabar</h2>
            </div>

            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Kimgaligi (Target)</label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-[#1A1A1E] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none shadow-inner"
                >
                  <option value="all">Barchaga (O'quvchi va Ustozlar)</option>
                  <option value="students">Barcha o'quvchilarga</option>
                  <option value="teachers">Barcha ustozlarga</option>
                  <option value="group">Aynan bitta guruhga</option>
                </select>
              </div>

              {target === 'group' && (
                <div className="animate-in fade-in zoom-in-95">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Guruhni tanlang</label>
                  <select 
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                  >
                    <option value="">-- Guruh --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Mavzu (Sarlavha)</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Bayram tabrigi"
                  className="w-full bg-[#1A1A1E] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Xabar matni</label>
                <textarea 
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Xabar matnini kiriting..."
                  className="w-full bg-[#1A1A1E] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner placeholder:text-gray-600"
                />
              </div>

              {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-emerald-400">{successMsg}</p>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-400">{errorMsg}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Yuborish
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tarix */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-6 sm:p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <History className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Yuborilgan xabarlar tarixi</h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-700/50">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#1A1A1E] text-gray-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold rounded-tl-xl border-b border-gray-700/50">Vaqti</th>
                    <th className="px-5 py-4 font-semibold border-b border-gray-700/50">Sarlavha</th>
                    <th className="px-5 py-4 font-semibold border-b border-gray-700/50">Matn</th>
                    <th className="px-5 py-4 font-semibold text-center border-b border-gray-700/50">Yuborildi</th>
                    <th className="px-5 py-4 font-semibold text-center rounded-tr-xl border-b border-gray-700/50">Kanal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50 bg-gray-800/20">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-500 font-medium">
                        Hali xabar yuborilmagan.
                      </td>
                    </tr>
                  ) : (
                    history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-700/40 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400 font-medium">
                          {new Date(h.created_at).toLocaleString('uz-UZ', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-200">{h.title}</td>
                        <td className="px-5 py-4 max-w-xs truncate text-gray-400 font-medium" title={h.body}>{h.body}</td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-extrabold tracking-wider">
                            {h.count} kishi
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-[10px] uppercase text-blue-400 font-extrabold tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                            {h.channel}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
