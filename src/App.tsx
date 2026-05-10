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
  Award,
  FileSpreadsheet,
  Signature,
  UserCheck,
  FolderOpen,
  Send
} from 'lucide-react';
import { cn } from './lib/utils';
import { useStore } from './stores/appStore';
import Dashboard from './pages/Dashboard';
import CitizenList from './pages/CitizenList';
import OrganizationList from './pages/OrganizationList';
import AppointmentList from './pages/AppointmentList';
import LandingPageList from './pages/LandingPageList';
import Relationships from './pages/Relationships';
import Mobilizations from './pages/Mobilizations';
import Requests from './pages/Requests';
import Amendments from './pages/Amendments';
import WhatsApp from './pages/WhatsApp';
import EmailCampaigns from './pages/EmailCampaigns';
import AI from './pages/AI';
import Reports from './pages/Reports';
import Collaborators from './pages/Collaborators';
import BasicRegisters from './pages/BasicRegisters';
import Signatures from './pages/Signatures';
import RankingCitizens from './pages/RankingCitizens';
import ServiceAgents from './pages/ServiceAgents';
import Team from './pages/Team';
import Login from './pages/Login';

type NavItem = {
  id: string;
  label: string;
  icon: any;
  component: React.ReactNode;
  category: 'principal' | 'campanhas' | 'gestao' | 'configuracoes';
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: <Dashboard />, category: 'principal' },
  { id: 'cidadaos', label: 'Cidadãos', icon: Users, component: <CitizenList />, category: 'principal' },
  { id: 'demandas', label: 'Demandas', icon: MessageSquare, component: <Requests />, category: 'principal' },
  { id: 'compromissos', label: 'Compromissos', icon: Calendar, component: <AppointmentList />, category: 'principal' },
  { id: 'organizacoes', label: 'Organizações', icon: Building2, component: <OrganizationList />, category: 'principal' },
  { id: 'landing-pages', label: 'Landing Pages', icon: Layout, component: <LandingPageList />, category: 'principal' },
  { id: 'whatsapp', label: 'WhatsApp', icon: Send, component: <WhatsApp />, category: 'campanhas' },
  { id: 'email-campaigns', label: 'E-mails', icon: Mail, component: <EmailCampaigns />, category: 'campanhas' },
  { id: 'mobilizacoes', label: 'Mobilizações', icon: Target, component: <Mobilizations />, category: 'campanhas' },
  { id: 'relacionamentos', label: 'Relacionamentos', icon: Users2, component: <Relationships />, category: 'campanhas' },
  { id: 'ai', label: 'Inteligência Artificial', icon: Cpu, component: <AI />, category: 'gestao' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, component: <Reports />, category: 'gestao' },
  { id: 'ranking', label: 'Ranking Cidadãos', icon: Award, component: <RankingCitizens />, category: 'gestao' },
  { id: 'agentes', label: 'Agentes', icon: Bot, component: <ServiceAgents />, category: 'gestao' },
  { id: 'equipe', label: 'Equipe', icon: UserCheck, component: <Team />, category: 'gestao' },
  { id: 'emendas', label: 'Emendas', icon: FileSpreadsheet, component: <Amendments />, category: 'gestao' },
  { id: 'assinaturas', label: 'Assinaturas', icon: Signature, component: <Signatures />, category: 'configuracoes' },
  { id: 'colaboradores', label: 'Colaboradores', icon: FolderOpen, component: <Collaborators />, category: 'configuracoes' },
  { id: 'cadastros', label: 'Cadastros Básicos', icon: PenTool, component: <BasicRegisters />, category: 'configuracoes' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, component: <div className="flex items-center justify-center h-96 text-gray-500">Página de configurações em construção</div>, category: 'configuracoes' },
];

export default function App() {
  const { user, isAuthenticated, logout, sidebarOpen, setSidebarOpen, currentPage, setCurrentPage } = useStore();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
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

  const categories = [
    { key: 'principal', label: 'Menu Principal' },
    { key: 'campanhas', label: 'Campanhas' },
    { key: 'gestao', label: 'Gestão' },
    { key: 'configuracoes', label: 'Configurações' },
  ] as const;

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-[#111827] overflow-hidden">
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
          width: isMobile ? (sidebarOpen ? 280 : 0) : (sidebarOpen ? 260 : 70),
          x: isMobile && !sidebarOpen ? -280 : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "bg-[#FFFFFF] border-r border-[#E5E7EB] flex flex-col overflow-hidden shrink-0 z-40 shadow-sm",
          isMobile ? "fixed inset-y-0 left-0" : "relative"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-[#E5E7EB] h-16 shrink-0">
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
          {categories.map((cat) => {
            const items = navItems.filter(n => n.category === cat.key);
            if (items.length === 0) return null;
            
            return (
              <div key={cat.key} className="mb-2">
                {(sidebarOpen || isMobile) && (
                  <div className="px-6 mb-2 mt-3 first:mt-0 text-[10px] uppercase font-semibold text-[#6B7280] tracking-wider">{cat.label}</div>
                )}
                <nav className="space-y-0.5">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        setExpandedMenu(item.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center px-4 py-2 text-sm transition-all relative group",
                        currentPage === item.id 
                          ? "bg-[#EFF6FF] text-[#2563EB] font-medium" 
                          : "text-[#6B7280] hover:bg-gray-50"
                      )}
                    >
                      <item.icon className={cn("w-4.5 h-4.5 shrink-0", currentPage === item.id ? "text-[#2563EB]" : "text-[#9CA3AF]")} />
                      {(sidebarOpen || isMobile) && (
                        <>
                          <span className="ml-3 flex-1 text-left truncate text-sm">{item.label}</span>
                          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", currentPage === item.id ? "rotate-90" : "opacity-0 group-hover:opacity-40")} />
                        </>
                      )}
                      {currentPage === item.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2563EB] rounded-r" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            );
          })}
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
