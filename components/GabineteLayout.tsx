import React, { useState } from 'react';
import { NavLink, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  Settings,
  Users,
  X,
  LucideIcon,
  Building2,
  Vote,
  Megaphone,
  Scale,
  UserCog,
  Brain,
  AlertTriangle,
  Map,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logger } from '@/utils/logger';

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/gabinete' },
      { icon: Users, label: 'Cidadãos', path: '/gabinete/cidadaos' },
      { icon: LayoutGrid, label: 'Demandas', path: '/gabinete/demandas' },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { icon: MessageSquare, label: 'WhatsApp', path: '/gabinete/whatsapp' },
      { icon: Mail, label: 'E-mail', path: '/gabinete/email' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { icon: Bot, label: 'IA Estratégica', path: '/gabinete/ia' },
      { icon: BarChart3, label: 'BI Político', path: '/gabinete/bi' },
      { icon: Brain, label: 'Inteligência Eleitoral', path: '/gabinete/inteligencia' },
      { icon: Map, label: 'Mapa Político', path: '/gabinete/mapa' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { icon: Building2, label: 'Mandato', path: '/gabinete/mandato' },
      { icon: Vote, label: 'Campanha', path: '/gabinete/campanha' },
      { icon: Megaphone, label: 'Marketing', path: '/gabinete/marketing' },
      { icon: Scale, label: 'Legislativo', path: '/gabinete/legislativo' },
      { icon: UserCog, label: 'Equipe', path: '/gabinete/equipe' },
      { icon: AlertTriangle, label: 'Crises', path: '/gabinete/crise' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { icon: FileText, label: 'Relatórios', path: '/gabinete/relatorios' },
      { icon: Settings, label: 'Configurações', path: '/gabinete/configuracoes' },
    ],
  },
];

const GabineteLayout: React.FC = () => {
  const { profile, signOut, isImpersonating, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  if (!loading && profile?.role === 'superadmin' && !isImpersonating) {
    return <Navigate to="/superadmin" replace />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  const isWorkspaceRoute = pathname.startsWith('/gabinete/whatsapp') || pathname.startsWith('/gabinete/ia');

  const renderMenuItem = (item: MenuItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/gabinete'}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${
          isActive || (item.path !== '/gabinete' && pathname.startsWith(item.path))
            ? 'bg-primary text-white shadow-lg shadow-primary/20'
            : 'text-slate-500 hover:bg-primary/10 hover:text-primary'
        }`
      }
    >
      <item.icon size={18} />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );

  const sidebar = (
    <>
      <div className="p-5">
        <Link to="/gabinete" className="flex items-center gap-3">
          <div className="flex h-11 items-center rounded-xl bg-gradient-to-br from-primary to-blue-700 px-4 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-primary/30">
            MG
          </div>
          <div className="hidden lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Meu</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gabinete</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(renderMenuItem)}
            </div>
          </div>
        ))}
        {profile?.role === 'superadmin' ? (
          <NavLink
            to="/superadmin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <AlertTriangle size={18} />
            <span>Super Admin</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="border-t border-slate-100 bg-slate-50/60 p-4">
        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
          <p className="truncate text-sm font-black text-slate-900">
            {profile?.full_name || (profile as any)?.name || 'Usuário'}
          </p>
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {profile?.organization?.name || 'Gabinete'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-bg-primary">
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col bg-white shadow-2xl">
            <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500">
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        {sidebar}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-bg-card/85 px-4 backdrop-blur md:h-20 md:px-8">
          <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="rounded-xl bg-bg-hover p-2.5 text-text-secondary md:hidden">
            <Menu size={22} />
          </button>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">
              Meu Gabinete
            </p>
            <h1 className="text-lg font-black leading-none text-slate-900">
              Meu Gabinete
            </h1>
          </div>

          <div className="relative hidden max-w-lg flex-1 lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input className="input-field h-11 pl-12" placeholder="Buscar protocolo, cidadão, bairro..." />
          </div>

          <Link
            to="/gabinete/demandas"
            className="btn h-10 bg-primary px-3 text-white shadow-lg shadow-primary/20 hover:bg-primary-hover md:h-11 md:px-5"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Nova Demanda</span>
          </Link>
        </header>

        <div className={`flex-1 overflow-y-auto bg-bg-primary ${isWorkspaceRoute ? 'p-2 md:p-4' : 'p-4 md:p-6'}`}>
          <div className={isWorkspaceRoute ? 'h-full min-h-0 w-full' : 'mx-auto max-w-[1600px]'}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GabineteLayout;
