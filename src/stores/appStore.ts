import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { DashboardStats, User } from '../types';

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

const now = () => new Date().toISOString();

const createDevUser = (email: string): User => ({
  id: 'dev-admin',
  name: 'Admin Gabinete',
  email,
  role: 'admin',
  status: 'active',
  createdAt: now(),
  updatedAt: now(),
});

const createUserFromAuth = (authUser: any): User => ({
  id: authUser.id,
  name: authUser.user_metadata?.name || 'Admin Gabinete',
  email: authUser.email || '',
  role: authUser.user_metadata?.role || 'admin',
  avatar: authUser.user_metadata?.avatar,
  status: 'active',
  createdAt: authUser.created_at || now(),
  updatedAt: authUser.updated_at || authUser.created_at || now(),
});

const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  avatar: profile.avatar,
  status: profile.status,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const canUseDevLogin = (email: string, password: string) => {
  const devLoginEmail = import.meta.env.VITE_DEV_LOGIN_EMAIL;
  const devLoginPassword = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return (
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
    topSubjects: [] as { name: string; count: number }[],
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
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .eq('status', 'active')
          .maybeSingle();

        const user = profile ? mapProfileToUser(profile) : createUserFromAuth(authData.user);
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

    const user = profile ? mapProfileToUser(profile) : createUserFromAuth(session.user);
    useStore.setState({ user, isAuthenticated: true });
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

      const user = profile ? mapProfileToUser(profile) : createUserFromAuth(session.user);
      useStore.setState({ user, isAuthenticated: true });
    }
  });
};
