import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  Users2, 
  Target, 
  FileText, 
  Layout, 
  MessageSquare, 
  Mail, 
  Cpu, 
  BarChart3, 
  Settings, 
  PenTool,
  Maximize2,
  Moon,
  ChevronRight,
  Menu,
  LogOut,
  User,
  Bot,
  Award
} from 'lucide-react';
import { cn } from './lib/utils';
import { useStore } from './stores/appStore';
import Dashboard from './pages/Dashboard';
import CitizenList from './pages/CitizenList';
import Requests from './pages/Requests';
import WhatsApp from './pages/WhatsApp';
import AI from './pages/AI';
import RankingCitizens from './pages/RankingCitizens';
import ServiceAgents from './pages/ServiceAgents';
import Team from './pages/Team';
import BasicRegisters from './pages/BasicRegisters';
import Login from './pages/Login';

type NavItem = {
  id: string;
  label: string;
  icon: any;
  component: React.ReactNode;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: <Dashboard /> },
  { id: 'demandas', label: 'Demandas', icon: MessageSquare, component: <Requests /> },
  { id: 'cidadaos', label: 'Cidadãos', icon: Users, component: <CitizenList /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, component: <WhatsApp /> },
  { id: 'ai', label: 'Inteligência Artificial', icon: Cpu, component: <AI /> },
  { id: 'agentes-atendimento', label: 'Agentes de Atendimento', icon: Bot, component: <ServiceAgents /> },
  { id: 'equipe', label: 'Equipe', icon: Users2, component: <Team /> },
  { id: 'ranking-cidadaos', label: 'Ranking de Cidadãos', icon: Award, component: <RankingCitizens /> },
  { id: 'cadastros', label: 'Configurações', icon: Settings, component: <BasicRegisters /> },
];

export default function App() {
  const { user, isAuthenticated, logout, sidebarOpen, setSidebarOpen, currentPage, setCurrentPage } = useStore();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('landing-pages');
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
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  const currentComponent = navItems.find(n => n.id === currentPage)?.component || <Dashboard />;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-[#111827] overflow-hidden">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? (sidebarOpen ? 280 : 0) : (sidebarOpen ? 240 : 70),
          x: isMobile && !sidebarOpen ? -280 : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "bg-[#FFFFFF] border-r border-[#E5E7EB] flex flex-col overflow-hidden shrink-0 z-40 shadow-sm",
          isMobile ? "fixed inset-y-0 left-0" : "relative"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-[#E5E7EB] h-16">
          <div className="flex items-center gap-3">
            <div className="bg-[#2563EB] p-1.5 rounded-md">
              <Layout className="text-white w-5 h-5" />
            </div>
            {(sidebarOpen || isMobile) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-sm tracking-tight leading-tight overflow-hidden whitespace-nowrap text-[#2563EB]"
              >
                GABINETE<br />360
              </motion.div>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {(sidebarOpen || isMobile) && <div className="px-6 mb-3 text-[11px] uppercase font-semibold text-[#6B7280] tracking-wider">Menu Principal</div>}
          <nav className="space-y-1">
            {navItems.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setExpandedMenu(item.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-4 py-2.5 text-sm transition-all relative group",
                  currentPage === item.id 
                    ? "bg-[#EFF6FF] text-[#2563EB] font-medium" 
                    : "text-[#6B7280] hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", currentPage === item.id ? "text-[#2563EB]" : "text-[#9CA3AF]")} />
                {(sidebarOpen || isMobile) && (
                  <>
                    <span className="ml-3 flex-1 text-left truncate">{item.label}</span>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", currentPage === item.id ? "rotate-90" : "opacity-0 group-hover:opacity-40")} />
                  </>
                )}
                {currentPage === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB] rounded-r" />
                )}
              </button>
            ))}
            
            {(sidebarOpen || isMobile) && (
              <div className="px-6 pt-4 pb-2 text-[11px] uppercase font-semibold text-[#6B7280] tracking-wider">Configurações</div>
            )}
            
            {navItems.slice(8).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setExpandedMenu(item.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center px-4 py-2.5 text-sm transition-all relative",
                  currentPage === item.id 
                    ? "bg-[#EFF6FF] text-[#2563EB] font-medium" 
                    : "text-[#6B7280] hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", currentPage === item.id ? "text-[#2563EB]" : "text-[#9CA3AF]")} />
                {(sidebarOpen || isMobile) && (
                  <span className="ml-3 flex-1 text-left truncate">{item.label}</span>
                )}
                {currentPage === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB] rounded-r" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-[#FFFFFF] h-16 border-b border-[#E5E7EB] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 font-medium">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-[#6B7280] hidden sm:block">
              <span className="text-[#111827]">{navItems.find(n => n.id === currentPage)?.label}</span>
            </div>
            {/* Mobile Title */}
            <div className="text-sm font-bold text-[#2563EB] sm:hidden">
              GABINETE 360
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-md text-[#9CA3AF] hidden sm:block">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md text-[#9CA3AF]">
                <Moon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 lg:gap-3 lg:pl-6 lg:border-l lg:border-[#E5E7EB]">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-[#111827] leading-tight">{user?.name || 'Usuário'}</div>
                <div className="text-[11px] text-[#6B7280] leading-tight capitalize">{user?.role || 'Admin'}</div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-[#E5E7EB]"
                >
                  {user?.avatar ? (
                    <img referrerPolicy="no-referrer" src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                    >
                      <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                        <div className="text-sm font-semibold text-[#111827]">{user?.name}</div>
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">{user?.role}</div>
                      </div>
                      <button 
                        onClick={() => logout()}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth bg-[#F9FAFB]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentComponent}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}