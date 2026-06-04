import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  BarChart3,
  Bot,
  Building2,
  Calendar,
  ChevronRight,
  Cpu,
  FolderOpen,
  Layout,
  LayoutDashboard,
  LogOut,
  Maximize2,
  Menu,
  MessageSquare,
  Moon,
  Send,
  Settings,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from './lib/utils';
import { useStore } from './stores/appStore';
import Dashboard from './pages/Dashboard';
import CitizenList from './pages/CitizenList';
import OrganizationList from './pages/OrganizationList';
import AppointmentList from './pages/AppointmentList';
import Requests from './pages/Requests';
import WhatsApp from './pages/WhatsApp';
import AI from './pages/AI';
import Reports from './pages/Reports';
import Collaborators from './pages/Collaborators';
import RankingCitizens from './pages/RankingCitizens';
import ServiceAgents from './pages/ServiceAgents';
import Team from './pages/Team';
import Login from './pages/Login';
import SettingsPage from './pages/Settings';

type NavItem = {
  id: string;
  label: string;
  icon: any;
  component: ReactNode;
  category: 'principal' | 'gestao' | 'configuracoes';
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: <Dashboard />, category: 'principal' },
  { id: 'cidadaos', label: 'Cidadãos', icon: Users, component: <CitizenList />, category: 'principal' },
  { id: 'demandas', label: 'Demandas', icon: MessageSquare, component: <Requests />, category: 'principal' },
  { id: 'whatsapp', label: 'Atendimentos', icon: Send, component: <WhatsApp defaultTab="direct" />, category: 'principal' },
  { id: 'conexoes', label: 'Conexões', icon: Wifi, component: <WhatsApp defaultTab="connections" />, category: 'gestao' },
  { id: 'compromissos', label: 'Compromissos', icon: Calendar, component: <AppointmentList />, category: 'principal' },
  { id: 'organizacoes', label: 'Organizações', icon: Building2, component: <OrganizationList />, category: 'principal' },
  { id: 'ai', label: 'Inteligência Artificial', icon: Cpu, component: <AI />, category: 'gestao' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, component: <Reports />, category: 'gestao' },
  { id: 'ranking', label: 'Ranking Cidadãos', icon: Award, component: <RankingCitizens />, category: 'gestao' },
  { id: 'agentes', label: 'Central de Agentes', icon: Bot, component: <ServiceAgents />, category: 'gestao' },
  { id: 'equipe', label: 'Equipe', icon: UserCheck, component: <Team />, category: 'gestao' },
  { id: 'colaboradores', label: 'Colaboradores', icon: FolderOpen, component: <Collaborators />, category: 'configuracoes' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, component: <SettingsPage />, category: 'configuracoes' },
];

const categories = [
  { key: 'principal', label: 'Operação' },
  { key: 'gestao', label: 'Gestão' },
  { key: 'configuracoes', label: 'Administração' },
] as const;

export default function App() {
  const { user, isAuthenticated, logout, sidebarOpen, setSidebarOpen, currentPage, setCurrentPage } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen, sidebarOpen]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const activeItem = navItems.find((item) => item.id === currentPage) || navItems[0];
  const currentComponent = activeItem.component;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-950">
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? (sidebarOpen ? 280 : 0) : sidebarOpen ? 280 : 76,
          x: isMobile && !sidebarOpen ? -280 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'z-40 flex shrink-0 flex-col overflow-hidden bg-slate-950 text-slate-200 shadow-2xl shadow-slate-950/20 border-r border-slate-900',
          isMobile ? 'fixed inset-y-0 left-0' : 'relative',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-950/30">
              <Layout className="h-5 w-5 text-white" />
            </div>
            {(sidebarOpen || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden whitespace-nowrap text-sm font-bold leading-tight tracking-tight text-white"
              >
                GABINETE
                <br />
                <span className="text-blue-300">360</span>
              </motion.div>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-zinc-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {categories.map((cat) => {
            const items = navItems.filter((item) => item.category === cat.key);
            if (!items.length) return null;

            return (
              <div key={cat.key} className="mb-5">
                {(sidebarOpen || isMobile) && (
                  <div className="mb-2.5 mt-3 px-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400/60 first:mt-0">
                    {cat.label}
                  </div>
                )}
                <nav className="space-y-1">
                  {items.map((item) => {
                    const isActive = currentPage === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        className={cn(
                          'group relative flex w-full items-center rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold border border-blue-500/30 shadow-lg shadow-blue-950/40'
                            : 'text-zinc-300 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        <item.icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors duration-200', isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white')} />
                        {(sidebarOpen || isMobile) && (
                          <>
                            <span className="ml-3 flex-1 truncate text-left">{item.label}</span>
                            <ChevronRight className={cn('h-3.5 w-3.5 transition-all duration-200', isActive ? 'rotate-90 text-white' : 'opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0')} />
                          </>
                        )}
                        {isActive && <div className="absolute bottom-2 left-0 top-2 w-1 rounded-r bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </motion.aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 font-medium backdrop-blur lg:px-7">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-semibold text-slate-900">{activeItem.label}</span>
              <span className="text-xs text-slate-500">Operação do gabinete</span>
            </div>
            <div className="text-sm font-bold text-blue-600 sm:hidden">GABINETE 360</div>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <button className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 sm:block">
                <Maximize2 className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <Moon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-6">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold leading-tight text-slate-900">{user?.name || 'Usuário'}</div>
                <div className="text-[11px] capitalize leading-tight text-slate-500">{user?.role || 'Admin'}</div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100"
                >
                  {user?.avatar ? (
                    <img referrerPolicy="no-referrer" src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
                    >
                      <div className="border-b border-slate-100 px-4 py-2 sm:hidden">
                        <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">{user?.role}</div>
                      </div>
                      <button onClick={() => logout()} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 scroll-smooth lg:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mx-auto w-full max-w-[1520px]">{currentComponent}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
