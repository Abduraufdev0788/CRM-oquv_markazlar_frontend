import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Send, Loader2, DownloadCloud, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export const StudentMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get('/student-portal/materials');
        setMaterials(res.data.data || []);
      } catch (err) {
        console.error("Failed to load materials", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">Materiallar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 relative">
      {/* Background ambient effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <BookOpen className="w-48 h-48 text-white rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            <span>O'quv materiallari</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 tracking-tight">
            Bilimingizni oshirish uchun kerakli manbalar
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed font-medium">
            Ustozlaringiz tomonidan guruhlarga yuklangan barcha darsliklar, qo'llanmalar va fayllarni shu yerdan topishingiz mumkin.
          </p>
        </div>
      </div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
          <div className="w-24 h-24 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Hozircha materiallar yo'q</h3>
          <p className="text-gray-400 font-medium">Guruhlaringizga o'quv materiallari yuklanmagan. Ustozlaringiz fayl yuklaganda shu yerda paydo bo'ladi.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(
            materials.reduce((acc, m) => {
              const groupName = m.group_name || "Noma'lum guruh";
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(m);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([groupName, groupMaterials]) => (
            <div key={groupName} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                <div className="w-2 h-8 bg-pink-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-white">{groupName}</h2>
                <span className="bg-gray-800 text-gray-400 text-xs font-bold px-3 py-1 rounded-full ml-2">
                  {groupMaterials.length} ta material
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {groupMaterials.map((m: any, index: number) => (
                  <div 
                    key={m.id} 
                    className="group relative bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 hover:border-pink-500/50 p-6 flex flex-col h-full transition-all duration-500 hover:shadow-[0_0_40px_rgba(236,72,153,0.15)] hover:-translate-y-1 overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-[50px] group-hover:bg-pink-500/20 transition-colors duration-500"></div>
                    
                    <div className="relative z-10 flex items-start gap-5 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-inner rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-pink-500/25 group-hover:border-pink-500/30 transition-all duration-300">
                        <FileText className="w-7 h-7 text-pink-400 group-hover:text-pink-300 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h4 className="text-white font-bold truncate text-xl group-hover:text-pink-100 transition-colors">{m.title}</h4>
                        <p className="text-sm text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{m.description || "Tavsif berilmagan"}</p>
                      </div>
                    </div>

                    <div className="relative z-10 mt-auto bg-black/20 rounded-2xl p-4 space-y-3 mb-6 border border-white/5">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-gray-500">Yukladi</span>
                        <span className="text-gray-300 truncate ml-4">{m.uploader_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-gray-500">Sana</span>
                        <span className="text-gray-400">{new Date(m.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <a 
                      href={`http://localhost:8001${m.file_url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="relative z-10 mt-auto w-full flex items-center justify-center gap-2 bg-pink-600/10 hover:bg-pink-600 text-pink-400 hover:text-white py-3.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden group/btn border border-pink-500/20 hover:border-pink-500"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                      <DownloadCloud className="w-5 h-5 relative z-10 group-hover/btn:-translate-y-0.5 transition-transform" /> 
                      <span className="relative z-10">Faylni ko'rish / Yuklash</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
