import { create } from 'zustand';

interface AuthState {
  token: string | null;
  role: 'admin' | 'manager' | 'teacher' | 'student' | null;
  user: any | null;
  setAuth: (token: string, role: 'admin' | 'manager' | 'teacher' | 'student') => void;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role') as AuthState['role'],
  user: null,
  setAuth: (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    set({ token, role });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    set({ token: null, role: null, user: null });
  },
}));
