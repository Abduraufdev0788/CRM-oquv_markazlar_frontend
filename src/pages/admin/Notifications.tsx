import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Send, History, CheckCircle2, AlertCircle } from 'lucide-react';

export const Notifications = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchHistory();
    fetchGroups();
  }, []);

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
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Xabarnomalar (Bildirishnoma yuborish)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Xabar Yuborish Formasi */}
        <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Yangi xabar</h2>
          </div>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kimgaligi (Target)</label>
              <select 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="all">Barchaga (O'quvchi va Ustozlar)</option>
                <option value="students">Barcha o'quvchilarga</option>
                <option value="teachers">Barcha ustozlarga</option>
                <option value="group">Aynan bitta guruhga</option>
              </select>
            </div>

            {target === 'group' && (
              <div className="animate-in fade-in zoom-in-95">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Guruhni tanlang</label>
                <select 
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">-- Guruh --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mavzu (Sarlavha)</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Bayram tabrigi"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Xabar matni</label>
              <textarea 
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Xabar matnini kiriting..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-400">{successMsg}</p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{errorMsg}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? 'Yuborilmoqda...' : (
                <>
                  <Send className="w-4 h-4" /> Yuborish
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tarix */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Yuborilgan xabarlar tarixi</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/50 text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Vaqti</th>
                  <th className="px-4 py-3 font-medium">Sarlavha</th>
                  <th className="px-4 py-3 font-medium">Matn</th>
                  <th className="px-4 py-3 font-medium text-center">Yuborildi</th>
                  <th className="px-4 py-3 font-medium text-center rounded-tr-lg">Kanal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Hali xabar yuborilmagan.
                    </td>
                  </tr>
                ) : (
                  history.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleString('uz-UZ')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-200">{h.title}</td>
                      <td className="px-4 py-3 max-w-xs truncate" title={h.body}>{h.body}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-bold">
                          {h.count} kishiga
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs uppercase text-blue-400 font-semibold bg-blue-500/10 px-2 py-1 rounded">
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
    </div>
  );
};
