import { useState, type ReactNode } from 'react';
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
  ChevronDown,
  ArrowUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

// Types
type NavItem = {
  id: string;
  label: string;
  icon: any;
  hasSubmenu?: boolean;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cidadaos', label: 'Cidadãos', icon: Users, hasSubmenu: true },
  { id: 'organizacoes', label: 'Organizações', icon: Building2, hasSubmenu: true },
  { id: 'compromissos', label: 'Compromissos', icon: Calendar, hasSubmenu: true },
  { id: 'relacionamentos', label: 'Relacionamentos', icon: Users2, hasSubmenu: true },
  { id: 'mobilizacoes', label: 'Mobilizações', icon: Target, hasSubmenu: true },
  { id: 'solicitacoes', label: 'Solicitações', icon: MessageSquare, hasSubmenu: true },
  { id: 'emendas', label: 'Emendas Parlamentares', icon: FileText, hasSubmenu: true },
  { id: 'landing-pages', label: 'Landing Pages', icon: Layout, hasSubmenu: true },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, hasSubmenu: true },
  { id: 'emails', label: 'E-mails', icon: Mail, hasSubmenu: true },
  { id: 'ai', label: 'Inteligência Artificial', icon: Cpu, hasSubmenu: true },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, hasSubmenu: true },
  { id: 'colaboradores', label: 'Colaboradores', icon: Users2, hasSubmenu: true },
  { id: 'cadastros', label: 'Cadastros básicos', icon: Settings, hasSubmenu: true },
  { id: 'assinaturas', label: 'Assinaturas', icon: PenTool, hasSubmenu: true },
];

export default function App() {
  const [activeItem, setActiveItem] = useState('landing-pages');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-[#111827]">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 70 }}
        className="bg-[#FFFFFF] border-right border-[#E5E7EB] flex flex-col overflow-hidden shrink-0 z-20 shadow-sm"
      >
        <div className="p-4 flex items-center gap-3 border-b border-[#E5E7EB] h-16">
          <div className="bg-[#2563EB] p-1.5 rounded-md">
            <Layout className="text-white w-5 h-5" />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-sm tracking-tight leading-tight overflow-hidden whitespace-nowrap text-[#2563EB]"
            >
              GABINETE<br />INTELIGENTE
            </motion.div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {isSidebarOpen && <div className="px-6 mb-3 text-[11px] uppercase font-semibold text-[#6B7280] tracking-wider">Main Menu</div>}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={cn(
                  "w-full flex items-center px-6 py-2.5 text-sm transition-all relative group",
                  activeItem === item.id 
                    ? "bg-[#EFF6FF] text-[#2563EB] font-medium border-r-4 border-[#2563EB]" 
                    : "text-[#6B7280] hover:bg-gray-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", activeItem === item.id ? "text-[#2563EB]" : "text-[#9CA3AF]")} />
                {isSidebarOpen && (
                  <span className="ml-3 flex-1 text-left truncate">{item.label}</span>
                )}
                {isSidebarOpen && item.hasSubmenu && (
                  <ChevronRight className={cn("w-4 h-4 transition-transform", activeItem === item.id ? "rotate-90" : "opacity-40")} />
                )}
              </button>
            ))}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-[#FFFFFF] h-16 border-b border-[#E5E7EB] flex items-center justify-between px-8 shrink-0 z-10 font-medium">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md text-[#6B7280]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm text-[#6B7280]">
              Projects / <span className="text-[#111827]">Landing Pages</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-md text-[#9CA3AF]">
                <Maximize2 className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-md text-[#9CA3AF]">
                <Moon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-[#E5E7EB]">
              <div className="text-right">
                <div className="text-sm font-semibold text-[#111827] leading-tight">Fabio Jorge</div>
                <div className="text-[11px] text-[#6B7280] leading-tight">Administrator</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-[#E5E7EB]">
                <img referrerPolicy="no-referrer" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fabio" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-[#F9FAFB]">
          <LandingPageConfig />
        </div>
      </main>

      {/* Scroll to Top */}
      <button className="fixed bottom-6 right-6 w-10 h-10 bg-[#2563EB] text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors z-50">
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

function LandingPageConfig() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Field Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-6">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div key={num} className="space-y-1">
            <Select value="Oculto" />
          </div>
        ))}
        
        {[2, 3, 4, 5].map((num) => (
          <div key={num} className="space-y-1">
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Campo extra {num}</label>
            <Select value="Oculto" />
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {/* Section: Confirmação de Cadastro */}
        <Section title="Confirmação de Cadastro">
          <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] shadow-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <InputGroup 
              label="Título da tela de confirmação" 
              placeholder="Inscrição realizada!" 
              description="Obs.: Máximo de 150 caracteres."
            />
            <InputGroup 
              label="Mensagem de confirmação" 
              placeholder="Agradecemos sua participação e colaboração." 
              description="Obs.: Máximo de 255 caracteres."
            />
            <InputGroup 
              label="Texto do botão de confirmar" 
              placeholder="Confirmar cadastro" 
              description="Obs.: Máximo de 45 caracteres."
            />
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#111827] uppercase tracking-wider">Cor do botão</label>
              <div className="flex flex-col gap-2">
                <div className="h-10 w-full bg-[#2563EB] rounded-md border border-[#E5E7EB] shadow-inner" />
                <button className="text-[10px] font-medium text-[#2563EB] text-left hover:underline">Restaurar a cor original</button>
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Compartilhar Landing Page */}
        <Section title="Compartilhar Landing Page">
          <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-2 space-y-2">
              <label className="text-[11px] font-semibold text-[#111827] uppercase tracking-wider">Exibir botão de compartilhar</label>
              <Select value="Selecione" />
            </div>
            <InputGroup 
              label="Texto do botão de compartilhar" 
              placeholder="Compartilhar por WhatsApp" 
              description="Obs.: Máximo de 45 caracteres."
            />
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#111827] uppercase tracking-wider">Cor do botão</label>
              <div className="flex flex-col gap-2">
                <div className="h-10 w-full bg-[#2563EB] rounded-md border border-[#E5E7EB] shadow-inner" />
                <button className="text-[10px] font-medium text-[#2563EB] text-left hover:underline">Restaurar a cor original</button>
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Descrição */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#2563EB]"></div>
            <label className="text-[11px] font-bold text-[#111827] uppercase tracking-widest">Descrição</label>
          </div>
          <RichTextEditor />
        </div>

        {/* Section: LGPD */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
            <label className="text-[11px] font-bold text-[#111827] uppercase tracking-widest">LGPD / Política de Privacidade</label>
          </div>
          <RichTextEditor defaultValue="Certificamos que todas as mobilizações de coleta e processamento de dados pessoais realizadas em nossas atividades estão rigorosamente em conformidade com as disposições da Lei Federal nº 13.709/19 (LGPD)." />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Select({ value }: { value: string }) {
  return (
    <div className="relative group">
      <div className="w-full h-10 bg-white border border-[#E5E7EB] rounded-md px-4 flex items-center justify-between text-sm text-[#111827] hover:border-[#2563EB] cursor-pointer transition-all">
        {value}
        <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
        <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[0.1em]">{title}</h3>
        <button className="text-[11px] font-semibold text-[#2563EB] hover:underline transition-all">Configurações Avançadas</button>
      </div>
      {children}
    </div>
  );
}

function InputGroup({ label, placeholder, description, className }: { label: string; placeholder: string; description: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-[11px] font-semibold text-[#111827] uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        defaultValue={placeholder}
        className="w-full h-10 bg-white border border-[#E5E7EB] rounded-md px-4 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all shadow-sm"
      />
      <p className="text-[11px] text-[#6B7280] italic leading-relaxed">{description}</p>
    </div>
  );
}

function RichTextEditor({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#2563EB]/10 focus-within:border-[#2563EB]">
      {/* Mock Toolbar */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-2 flex flex-wrap gap-1.5 items-center">
        {['Styles', 'Format', 'Font family', 'Font size'].map(group => (
          <div key={group} className="h-7 px-2 border border-[#E5E7EB] bg-white rounded flex items-center gap-2 text-[11px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            {group} <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
          </div>
        ))}
        <div className="w-px h-6 bg-[#E5E7EB] mx-1" />
        <div className="flex gap-1">
          {['B', 'I', 'U', 'S'].map(tool => (
            <div key={tool} className={cn(
              "w-7 h-7 flex items-center justify-center border border-[#E5E7EB] bg-white rounded text-[11px] font-bold text-[#4B5563] hover:bg-gray-100 cursor-pointer transition-colors shadow-sm",
              tool === 'B' && "font-black"
            )}>
              {tool}
            </div>
          ))}
          <div className="w-px h-6 bg-[#E5E7EB] mx-1" />
          <div className="flex gap-1">
             <div className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] bg-white rounded text-[10px] text-[#4B5563] hover:bg-gray-100 cursor-pointer shadow-sm">🔗</div>
             <div className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] bg-white rounded text-[10px] text-[#4B5563] hover:bg-gray-100 cursor-pointer shadow-sm">🖼️</div>
          </div>
        </div>
      </div>
      <div 
        className="min-h-[160px] p-6 text-sm text-[#111827] outline-none prose prose-headings:text-[#111827] prose-sm max-w-none bg-white leading-relaxed" 
        contentEditable 
        suppressContentEditableWarning
      >
        {defaultValue}
      </div>
      <div className="bg-[#F9FAFB] border-t border-[#E5E7EB] px-4 py-2 text-[11px] text-[#6B7280] flex justify-between items-center font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Status: Publicado</span>
        </div>
        <span>Caminho: {defaultValue ? 'body > p' : 'body'}</span>
      </div>
    </div>
  );
}
