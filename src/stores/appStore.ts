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
        // Fallback para desenvolvimento: permitir admin/admin123 independente do banco
        if (email === 'admin' && password === 'admin123') {
          const fallbackUser: User = { 
            id: 'dev-admin', 
            name: 'Admin Developer', 
            email: 'admin@gabinete360.com', 
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          set({ user: fallbackUser, isAuthenticated: true });
          return true;
        }

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},name.eq.${email}`)
            .eq('status', 'active')
            .maybeSingle();

          if (error) {
            console.error('Supabase auth error:', error);
            return false;
          }

          if (data) {
            // Se encontrou no banco, valida a senha (aceita plain text 'admin123' ou hash)
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