import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, DashboardStats } from '../types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentPage: string;
  dashboardStats: DashboardStats;
  sidebarOpen: boolean;
  
  setUser: (user: User | null) => void;
  setCurrentPage: (page: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      currentPage: 'dashboard',
      dashboardStats: {
        citizens: 0,
        citizensGrowth: 0,
        organizations: 0,
        organizationsGrowth: 0,
        appointments: 0,
        appointmentsGrowth: 0,
        landingPages: 0,
        landingPagesGrowth: 0,
        mobilizations: 0,
        mobilizationsGrowth: 0
      },
      sidebarOpen: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      
      login: async (email, password) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq."${email}",name.eq."${email}"`)
            .eq('status', 'active')
            .single();

          if (error || !data) {
            console.error('Auth error:', error);
            return false;
          }

          // Verificação simples para o protótipo (admin123)
          // No banco está o hash, mas para facilitar o teste inicial permitimos admin123
          if (password === 'admin123' || data.password_hash === password) {
            const user: User = { 
              id: data.id, 
              name: data.name, 
              email: data.email, 
              role: data.role,
              avatar: data.avatar,
              status: data.status,
              createdAt: data.created_at,
              updatedAt: data.updated_at
            };
            set({ user, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (err) {
          console.error('Login exception:', err);
          return false;
        }
      },
      
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'gabinete-360-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen 
      }),
    }
  )
);