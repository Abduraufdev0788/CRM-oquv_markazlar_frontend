import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Wallet, 
  Calendar, 
  BookOpen, 
  Settings,
  Camera
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Xodimlar', icon: Users },
  { path: '/admin/students', label: 'O\'quvchilar', icon: GraduationCap },
  { path: '/admin/groups', label: 'Guruhlar', icon: BookOpen },
  { path: '/admin/finance', label: 'Moliya', icon: Wallet },
  { path: '/admin/face-id', label: 'Face ID & IoT', icon: Camera },
  { path: '/admin/settings', label: 'Sozlamalar', icon: Settings },
];

const teacherLinks = [
  { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/teacher/groups', label: 'Guruhlarim', icon: Users },
  { path: '/teacher/schedule', label: 'Dars jadvali', icon: Calendar },
  { path: '/teacher/materials', label: 'Materiallar', icon: BookOpen },
];

const studentLinks = [
  { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/schedule', label: 'Dars jadvali', icon: Calendar },
  { path: '/student/finance', label: 'To\'lovlarim', icon: Wallet },
  { path: '/student/materials', label: 'Materiallar', icon: BookOpen },
];

export const Sidebar: React.FC = () => {
  const { role } = useAuthStore();
  
  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
          <GraduationCap className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">EduCRM</h1>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === `/${role}`} // exact match for root dashboard
              className={({ isActive }) => twMerge(
                clsx(
                  "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent"
                )
              )}
            >
              <Icon className="w-5 h-5 mr-3 opacity-80" />
              {link.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
