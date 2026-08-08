import React from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Bell, Search, Menu } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { role, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-gray-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Qidirish..." 
            className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-blue-500 w-64 transition-all focus:w-72"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-900"></span>
        </button>
        
        <div className="h-6 w-px bg-gray-700 mx-2"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white capitalize">{role} User</div>
            <div className="text-xs text-gray-500 capitalize">{role}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold border-2 border-gray-800 cursor-pointer">
            {role?.charAt(0).toUpperCase()}
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="ml-2 text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Tizimdan chiqish"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
