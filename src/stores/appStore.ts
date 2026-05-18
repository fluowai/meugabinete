import { create } from 'zustand';
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const createDevUser = (email: string): User => ({
  id: 'dev-admin',
  name: 'Admin Gabinete',
  email,
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const canUseDevLogin = (email: string, password: string) => {
  const devLoginEmail = import.meta.env.VITE_DEV_LOGIN_EMAIL;
  const devLoginPassword = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return (
    import.meta.env.DEV &&
    isLocalhost &&
    devLoginEmail &&
    devLoginPassword &&
    email.trim().toLowerCase() === devLoginEmail.trim().toLowerCase() &&
    password === devLoginPassword
  );
};

export const useStore = create<AppState>()((set) => ({
  user: null,
  isAuthenticated: false,
  currentPage: 'dashboard',
  dashboardStats: {
    citizens: 0,
    citizensGrowth: 0,
    openDemands: 0,
    inProgressDemands: 0,
    resolvedDemands: 0,
    topNeighborhoods: [] as { name: string; count: number }[],
    topSubjects: [] as { name: string; count: number }[]
  },
  sidebarOpen: true,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  
  login: async (email, password) => {
    try {
      if (canUseDevLogin(email, password)) {
        set({ user: createDevUser(email), isAuthenticated: true });
        return { success: true };
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return { success: false, error: 'Conta não encontrada ou inativa.' };
        }

        const user: User = { 
          id: profile.id, 
          name: profile.name, 
          email: profile.email, 
          role: profile.role,
          avatar: profile.avatar,
          status: profile.status,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };
        
        set({ user, isAuthenticated: true });
        return { success: true };
      }

      return { success: false, error: 'E-mail ou senha incorretos.' };
    } catch (err) {
      return { success: false, error: 'Ocorreu um erro ao tentar entrar.' };
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, currentPage: 'dashboard' });
  },
}));

export const initializeAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (profile) {
      const user: User = { 
        id: profile.id, 
        name: profile.name, 
        email: profile.email, 
        role: profile.role,
        avatar: profile.avatar,
        status: profile.status,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
      useStore.setState({ user, isAuthenticated: true });
    }
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      useStore.setState({ user: null, isAuthenticated: false });
    } else if (event === 'SIGNED_IN' && session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (profile) {
        const user: User = { 
          id: profile.id, 
          name: profile.name, 
          email: profile.email, 
          role: profile.role,
          avatar: profile.avatar,
          status: profile.status,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        };
        useStore.setState({ user, isAuthenticated: true });
      }
    }
  });
};
