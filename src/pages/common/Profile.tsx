import React, { useState, useEffect, useRef } from 'react';
import { Camera, Lock, User, Save, Loader2, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export const Profile: React.FC = () => {
  const { role, user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  const getBaseUrl = () => role === 'student' ? '/student-portal/me' : '/auth/me';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(getBaseUrl());
        setProfile(res.data);
        setFullName(res.data.full_name || '');
        setPhotoUrl(res.data.photo_url || null);
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [role, setUser]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data.file_url;
      setPhotoUrl(uploadedUrl);
      
      // Auto-save photo
      await api.put(`${getBaseUrl()}/profile`, { photo_url: uploadedUrl });
      
      // Update global user
      if (user) {
        setUser({ ...user, photo_url: uploadedUrl });
      }
    } catch (err) {
      alert("Rasm yuklashda xatolik yuz berdi");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Endi barcha foydalanuvchilar (studentlar ham) ma'lumotlarini saqlay oladi
    setIsSavingProfile(true);
    try {
      await api.put(`${getBaseUrl()}/profile`, { full_name: fullName, photo_url: photoUrl });
      
      // Update global user
      if (user) {
        setUser({ ...user, full_name: fullName, photo_url: photoUrl });
      }
      
      // Dashboardga qaytish
      navigate(`/${role}`);
    } catch (err) {
      alert("Xatolik yuz berdi");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: "Yangi parollar mos tushmadi" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" });
      return;
    }

    setIsSavingPassword(true);
    try {
      await api.put(`${getBaseUrl()}/password`, {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPasswordMessage({ type: 'success', text: "Parol muvaffaqiyatli o'zgartirildi" });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || "Eski parol noto'g'ri yoki xatolik yuz berdi" 
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <User className="w-6 h-6 text-blue-400" />
          Shaxsiy Profil
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full border-4 border-gray-700/50 bg-gray-900 overflow-hidden shadow-xl group-hover:border-blue-500/50 transition-colors flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                ) : photoUrl ? (
                  <img src={`http://localhost:8001${photoUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gray-600">{fullName?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload}
            />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
              <p className="text-blue-400 font-medium capitalize text-sm">{role}</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2 border-b border-gray-700/50 pb-2">
                <User className="w-5 h-5 text-gray-400" /> Asosiy ma'lumotlar
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">F.I.O</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={role === 'student'}
                    className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {role === 'student' && <p className="text-xs text-gray-500 mt-1">O'quvchilar ismini o'zgartira olmaydi.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Telefon raqam</label>
                  <input 
                    type="text" 
                    value={profile?.phone || ''}
                    disabled
                    className="w-full bg-gray-900/50 border border-gray-700 text-gray-500 rounded-xl px-4 py-2.5 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Saqlash
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2 border-b border-gray-700/50 pb-2">
                <Lock className="w-5 h-5 text-gray-400" /> Xavfsizlik
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordMessage && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {passwordMessage.text}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Eski parol (Hozirgi)</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {role === 'student' && <p className="text-xs text-gray-500 mt-1">Yangi o'quvchilar uchun eski parol ularning tug'ilgan sanasi bo'lishi mumkin (Masalan: 2005-10-15 yoli 123456).</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Yangi parol</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Yangi parolni tasdiqlang</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    type="submit"
                    disabled={isSavingPassword}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-medium border border-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    Parolni o'zgartirish
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
