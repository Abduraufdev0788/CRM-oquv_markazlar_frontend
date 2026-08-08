import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogIn, User, Lock } from 'lucide-react';
import { api } from '../../services/api';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const endpoint = isStudent ? '/auth/student-login' : '/auth/login';
      const response = await api.post(endpoint, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token, role } = response.data;
      setAuth(access_token, role);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-8 rounded-2xl shadow-2xl w-full">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
          <LogIn className="text-blue-400 w-8 h-8" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-white mb-2">Tizimga kirish</h2>
      <p className="text-gray-400 text-center mb-8 text-sm">O'quv markazlari boshqaruv tizimi</p>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex bg-gray-900/50 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setIsStudent(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isStudent ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          Xodim
        </button>
        <button
          type="button"
          onClick={() => setIsStudent(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isStudent ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          O'quvchi
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1">
          <label className="text-gray-300 text-sm font-medium">Foydalanuvchi nomi</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder={isStudent ? "+998901234567" : "admin, teacher..."}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-300 text-sm font-medium">Parol</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder={isStudent ? "Masalan: 2005-10-15" : "••••••••"}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg py-3 px-4 shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Tizimga kirish'
          )}
        </button>
      </form>
    </div>
  );
};
