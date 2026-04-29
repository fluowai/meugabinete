import { motion } from 'motion/react';
import { 
  Users, Building2, Calendar, Layout, Target, TrendingUp, TrendingDown,
  Eye, MousePointerClick, CheckCircle, Clock, AlertCircle, DollarSign,
  MessageSquare, Mail, FileText, Cpu, BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboardStats } from '../hooks/useApi';
import { mockData } from '../hooks/mockApi';

interface StatCardProps {
  label: string;
  value: number;
  growth: number;
  icon: any;
  color: string;
  onClick?: () => void;
}

function StatCard({ label, value, growth, icon: Icon, color, onClick }: StatCardProps) {
  const isPositive = growth >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition-all",
        onClick && "hover:border-blue-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {value.toLocaleString('pt-BR')}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {Math.abs(growth).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">vs mês anterior</span>
          </div>
        </div>
        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { stats, loading } = useDashboardStats();

  const recentAppointments = mockData.appointments
    .filter(a => a.status === 'scheduled')
    .slice(0, 5);

  const recentCitizens = mockData.citizens.slice(0, 5);

  const activeMobilizations = mockData.mobilizations.filter(m => m.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do seu Gabinete 360</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm self-start sm:self-auto">
          <span className="font-medium text-gray-400">Última atualização:</span> {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Cidadãos"
          value={stats.citizens}
          growth={stats.citizensGrowth}
          icon={Users}
          color="bg-blue-600"
          onClick={() => onNavigate?.('cidadaos')}
        />
        <StatCard
          label="Organizações"
          value={stats.organizations}
          growth={stats.organizationsGrowth}
          icon={Building2}
          color="bg-green-600"
          onClick={() => onNavigate?.('organizacoes')}
        />
        <StatCard
          label="Compromissos"
          value={stats.appointments}
          growth={stats.appointmentsGrowth}
          icon={Calendar}
          color="bg-purple-600"
          onClick={() => onNavigate?.('compromissos')}
        />
        <StatCard
          label="Landing Pages"
          value={stats.landingPages}
          growth={stats.landingPagesGrowth}
          icon={Layout}
          color="bg-orange-600"
          onClick={() => onNavigate?.('landing-pages')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Mobilizações"
          value={stats.mobilizations}
          growth={stats.mobilizationsGrowth}
          icon={Target}
          color="bg-red-600"
          onClick={() => onNavigate?.('mobilizacoes')}
        />
        <StatCard
          label="Solicitações Abertas"
          value={mockData.requests.filter(r => r.status === 'open' || r.status === 'in-progress').length}
          growth={5.2}
          icon={MessageSquare}
          color="bg-teal-600"
          onClick={() => onNavigate?.('solicitacoes')}
        />
        <StatCard
          label="Emendas Ativas"
          value={mockData.amendments.filter(e => e.status === 'proposed' || e.status === 'approved').length}
          growth={-3.1}
          icon={FileText}
          color="bg-indigo-600"
          onClick={() => onNavigate?.('emendas')}
        />
        <StatCard
          label="Campanhas WhatsApp"
          value={mockData.whatsappCampaigns.length}
          growth={12.5}
          icon={Cpu}
          color="bg-emerald-600"
          onClick={() => onNavigate?.('whatsapp')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Próximos Compromissos</h2>
            <button 
              onClick={() => onNavigate?.('compromissos')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-4">
            {recentAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum compromisso agendado</p>
            ) : (
              recentAppointments.map((apt) => (
                <div key={apt.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex flex-col items-center justify-center",
                    apt.priority === 'high' ? "bg-red-100" : apt.priority === 'medium' ? "bg-yellow-100" : "bg-blue-100"
                  )}>
                    <span className="text-xs font-medium text-gray-600">
                      {new Date(apt.date).toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {new Date(apt.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{apt.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{apt.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{apt.time}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        apt.type === 'meeting' && "bg-blue-100 text-blue-700",
                        apt.type === 'event' && "bg-purple-100 text-purple-700",
                        apt.type === 'visit' && "bg-green-100 text-green-700"
                      )}>
                        {apt.type === 'meeting' ? 'Reunião' : apt.type === 'event' ? 'Evento' : apt.type === 'visit' ? 'Visita' : 'Outro'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Mobilizações Ativas</h2>
            <button 
              onClick={() => onNavigate?.('mobilizacoes')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-4">
            {activeMobilizations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma mobilização ativa</p>
            ) : (
              activeMobilizations.map((mob) => (
                <div key={mob.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{mob.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      mob.type === 'petition' && "bg-orange-100 text-orange-700",
                      mob.type === 'demonstration' && "bg-red-100 text-red-700",
                      mob.type === 'event' && "bg-purple-100 text-purple-700",
                      mob.type === 'campaign' && "bg-blue-100 text-blue-700"
                    )}>
                      {mob.type === 'petition' ? 'Petição' : mob.type === 'demonstration' ? 'Manifestação' : mob.type === 'event' ? 'Evento' : 'Campanha'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(mob.currentGoal / mob.targetGoal) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-500">{mob.currentGoal.toLocaleString()} / {mob.targetGoal?.toLocaleString()}</span>
                    <span className="font-medium text-blue-600">
                      {mob.targetGoal ? Math.round((mob.currentGoal / mob.targetGoal) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Novos Cidadãos</h2>
            <button 
              onClick={() => onNavigate?.('cidadaos')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {recentCitizens.map((citizen) => (
              <div key={citizen.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-medium text-sm">
                    {citizen.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{citizen.name}</p>
                  <p className="text-xs text-gray-500">{citizen.city}, {citizen.state}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Landing Pages</h2>
            <button 
              onClick={() => onNavigate?.('landing-pages')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-4">
            {mockData.landingPages.slice(0, 3).map((page) => (
              <div key={page.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{page.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    page.status === 'published' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">visualizações</p>
                  </div>
                  <div>
                    <MousePointerClick className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-900">{page.submissions.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">conversões</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Campanhas</h2>
            <button 
              onClick={() => onNavigate?.('whatsapp')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {mockData.whatsappCampaigns.slice(0, 2).map((campaign) => (
              <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">{campaign.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    campaign.status === 'completed' && "bg-green-100 text-green-700",
                    campaign.status === 'scheduled' && "bg-blue-100 text-blue-700",
                    campaign.status === 'sending' && "bg-yellow-100 text-yellow-700"
                  )}>
                    {campaign.status === 'completed' ? 'Concluída' : campaign.status === 'scheduled' ? 'Agendada' : 'Enviando'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{campaign.sentCount}</p>
                    <p className="text-xs text-gray-500">enviados</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{campaign.deliveredCount}</p>
                    <p className="text-xs text-gray-500">recebidos</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{campaign.readCount}</p>
                    <p className="text-xs text-gray-500">lidos</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}