import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { DashboardStats, User } from '../types';

interface TenantOverride {
  tenantId: string;
  tenantName: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentPage: string;
  dashboardStats: DashboardStats;
  sidebarOpen: boolean;
  tenantOverride: TenantOverride | null;

  setUser: (user: User | null) => void;
  setCurrentPage: (page: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setTenantOverride: (tenantId: string, tenantName: string) => void;
  clearTenantOverride: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const now = () => new Date().toISOString();

const createDevUser = (email: string): User => ({
  id: 'dev-admin',
  name: 'Admin Gabinete',
  email,
  role: email.includes('superadmin') ? 'super_admin' : 'admin',
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
  tenantOverride: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setTenantOverride: (tenantId, tenantName) => set({ tenantOverride: { tenantId, tenantName } }),
  clearTenantOverride: () => set({ tenantOverride: null }),

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
        const user = createUserFromAuth(authData.user);
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
    set({ user: null, isAuthenticated: false, currentPage: 'dashboard', tenantOverride: null });
  },
}));

export const initializeAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    const user = createUserFromAuth(session.user);
    useStore.setState({ user, isAuthenticated: true });
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      useStore.setState({ user: null, isAuthenticated: false });
    } else if (event === 'SIGNED_IN' && session?.user) {
      const user = createUserFromAuth(session.user);
      useStore.setState({ user, isAuthenticated: true });
    }
  });
};
