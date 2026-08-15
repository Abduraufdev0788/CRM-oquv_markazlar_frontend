import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  Calendar,
  BookOpen,
  Settings,
  ClipboardList,
  Bell,
  CalendarDays,
  MapPin
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/leads', label: 'Lidlar', icon: ClipboardList },
  { path: '/admin/users', label: 'Xodimlar', icon: Users },
  { path: '/admin/students', label: 'O\'quvchilar', icon: GraduationCap },
  { path: '/admin/groups', label: 'Guruhlar', icon: BookOpen },
  { path: '/admin/rooms', label: 'Xonalar', icon: MapPin },
  { path: '/admin/attendance', label: 'Davomat', icon: CalendarDays },
  { path: '/admin/finance', label: 'Moliya', icon: Wallet },
  { path: '/admin/notifications', label: 'Xabarnomalar', icon: Bell },
  { path: '/admin/settings', label: 'Sozlamalar', icon: Settings },
];

const managerLinks = [
  { path: '/manager', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/manager/leads', label: 'Lidlar', icon: ClipboardList },
  { path: '/manager/users', label: 'Xodimlar', icon: Users },
  { path: '/manager/students', label: 'O\'quvchilar', icon: GraduationCap },
  { path: '/manager/groups', label: 'Guruhlar', icon: BookOpen },
  { path: '/manager/rooms', label: 'Xonalar', icon: MapPin },
  { path: '/manager/attendance', label: 'Davomat', icon: CalendarDays },
  { path: '/manager/finance', label: 'Moliya', icon: Wallet },
  { path: '/manager/notifications', label: 'Xabarnomalar', icon: Bell },
];

const teacherLinks = [
  { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/teacher/groups', label: 'Guruhlarim', icon: Users },
  { path: '/teacher/schedule', label: 'Dars jadvali', icon: Calendar },
  { path: '/teacher/materials', label: 'Materiallar', icon: BookOpen },
  { path: '/teacher/tests', label: 'Testlar', icon: ClipboardList },
];

const studentLinks = [
  { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/schedule', label: 'Dars jadvali', icon: Calendar },
  { path: '/student/finance', label: 'To\'lovlarim', icon: Wallet },
  { path: '/student/materials', label: 'Materiallar', icon: BookOpen },
  { path: '/student/tests', label: 'Testlar', icon: ClipboardList },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { role } = useAuthStore();
  const [emptyRooms, setEmptyRooms] = useState<number | null>(null);

  useEffect(() => {
    if (role === 'admin' || role === 'manager') {
      api.get('/rooms/', { params: { available_now: true, limit: 1 } })
        .then(res => setEmptyRooms(res.data.total))
        .catch(console.error);
    }
  }, [role]);

  const links = role === 'admin' ? adminLinks : role === 'manager' ? managerLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
                <span className="flex-1">{link.label}</span>
                {link.label === 'Xonalar' && emptyRooms !== null && (
                  <span className="ml-auto bg-green-500/20 text-green-400 py-0.5 px-2 rounded-full text-xs font-bold border border-green-500/30" title="Ayni vaqtda bo'sh xonalar">
                    {emptyRooms} ta bo'sh
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </aside>
    </>
  );
};
