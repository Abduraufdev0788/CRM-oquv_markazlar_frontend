import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Upload, File, FileText, Image, Trash2, Plus, X, Loader2, Download, Search } from 'lucide-react';
import { api } from '../../services/api';

export const TeacherMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Barcha guruhlarni olib kelish (qaysi guruhga material qo'shishni tanlash uchun)
      const groupsRes = await api.get('/groups/', { params: { limit: 100 } });
      setGroups(groupsRes.data.data || []);
      
      // Materiallarni olib kelish
      const materialsRes = await api.get('/materials/', { params: { limit: 100 } });
      setMaterials(materialsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedGroupId || !uploadTitle) return;
    
    setIsUploading(true);
    try {
      // 1. Faylni yuklash
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fileUrl = uploadRes.data.file_url;
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown';

      // 2. Material yozuvini bazada yaratish
      await api.post('/materials/', {
        group_id: selectedGroupId,
        title: uploadTitle,
        description: uploadDesc,
        file_url: fileUrl,
        file_type: fileExt
      });
      
      // Tozalash va yangilash
      setIsModalOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setSelectedGroupId('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchData();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Fayl yuklashda xatolik yuz berdi!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Rostdan ham bu materialni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/materials/${id}`);
      fetchData();
    } catch (error) {
      console.error("Failed to delete", error);
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const getFileIcon = (type: string) => {
    if (['pdf'].includes(type)) return <FileText className="w-8 h-8 text-red-400" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return <Image className="w-8 h-8 text-blue-400" />;
    if (['doc', 'docx'].includes(type)) return <FileText className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-400" />;
  };

  const getFileBgColor = (type: string) => {
    if (['pdf'].includes(type)) return 'bg-red-500/10 border-red-500/20';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'bg-blue-500/10 border-blue-500/20';
    if (['doc', 'docx'].includes(type)) return 'bg-blue-500/10 border-blue-500/20';
    return 'bg-gray-500/10 border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-indigo-200 font-medium tracking-wide">Materiallar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const filteredMaterials = filterGroupId === 'all' 
    ? materials 
    : materials.filter(m => m.group_id === filterGroupId);

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-700 relative overflow-hidden min-h-screen">
      {/* Background Orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-800 pb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
              O'quv Materiallari
            </h2>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">
              Darslaringiz uchun kitoblar, taqdimotlar va turli xil fayllarni yuklang. 
              Ular avtomatik tarzda tegishli guruh o'quvchilariga ko'rinadi.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
          >
            <Upload className="w-5 h-5" /> Yangi Material Yuklash
          </button>
        </div>

        {/* Group Filters */}
        {groups.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setFilterGroupId('all')}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                filterGroupId === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-transparent'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700/50'
              }`}
            >
              Barcha guruhlar
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setFilterGroupId(g.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  filterGroupId === g.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-transparent'
                    : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700/50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${filterGroupId === g.id ? 'bg-white' : 'bg-indigo-500'}`}></div>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Hali materiallar yo'q</h3>
            <p className="text-gray-500 max-w-md">Siz hali birorta ham material yuklamagansiz. Guruhlaringiz uchun birinchi faylni hozir yuklang.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map((mat) => (
              <div 
                key={mat.id}
                className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-5 hover:border-gray-600 transition-all duration-300 group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${getFileBgColor(mat.file_type || '')}`}>
                    {getFileIcon(mat.file_type || '')}
                  </div>
                  <button 
                    onClick={() => handleDelete(mat.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h4 className="text-lg font-bold text-white mb-1 line-clamp-1" title={mat.title}>{mat.title}</h4>
                {mat.description ? (
                  <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px] mb-4">{mat.description}</p>
                ) : (
                  <div className="min-h-[40px] mb-4"></div>
                )}
                
                <div className="mt-auto space-y-4">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300 line-clamp-1">
                    Guruh: {mat.group?.name || 'Noma\'lum'}
                  </div>
                  
                  <a 
                    href={`http://localhost:8001${mat.file_url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 group-hover:bg-indigo-600 text-gray-300 group-hover:text-white rounded-xl transition-colors text-sm font-semibold border border-gray-700 group-hover:border-indigo-500"
                  >
                    <Download className="w-4 h-4" /> Ochish / Yuklash
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#111827] border border-gray-700 rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" /> Material Yuklash
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Material nomi</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Masalan: 1-mavzu Taqdimot"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Qisqacha ta'rif (ixtiyoriy)</label>
                <textarea
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none h-24"
                  placeholder="O'quvchilar uchun qisqacha ma'lumot..."
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Qaysi guruh uchun?</label>
                <select
                  required
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Guruhni tanlang...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} - {g.course?.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Fayl tanlash</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    selectedFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="file"
                    required
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    {selectedFile ? (
                      <>
                        <File className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="text-indigo-400 font-medium">{selectedFile.name}</span>
                        <span className="text-gray-500 text-xs mt-1">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-gray-300 font-medium">Bu yerni bosing va fayl tanlang</span>
                        <span className="text-gray-500 text-xs mt-1">PDF, Word, Rasm fayllari qo'llab quvvatlanadi</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile || !uploadTitle || !selectedGroupId}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isUploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Yuklanmoqda...</>
                  ) : (
                    'Saqlash'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
