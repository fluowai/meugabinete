import { Building2, CreditCard, DollarSign, LifeBuoy, TrendingUp, ChevronRight, ArrowUpRight, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSuperAdminStats } from '../hooks/useApi';

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  suspended: 'Suspensa',
  trial: 'Trial',
  cancelled: 'Cancelada',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  trial: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const ticketStatusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  waiting: 'Aguardando',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const ticketStatusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  waiting: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function SuperAdminDashboard() {
  const { stats, loading, error } = useSuperAdminStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Erro ao carregar dados: {error}
      </div>
    );
  }

  const cards = [
    { label: 'Total de Contas', value: stats.totalTenants.toString(), icon: Building2, color: 'bg-blue-500' },
    { label: 'Contas Ativas', value: stats.activeTenants.toString(), icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Receita Mensal', value: formatCurrency(stats.monthlyRevenue), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Tickets Abertos', value: stats.openTickets.toString(), icon: LifeBuoy, color: 'bg-orange-500' },
    { label: 'Crescimento', value: `${stats.revenueGrowth}%`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", card.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Contas Recentes</h2>
            <span className="text-xs text-gray-400">{stats.totalTenants} total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentTenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-xs text-gray-500">{tenant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[tenant.status] || 'bg-gray-100 text-gray-600')}>
                    {statusLabels[tenant.status] || tenant.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Tickets Recentes</h2>
            <span className="text-xs text-gray-400">{stats.openTickets} abertos</span>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priorityColors[ticket.priority] || 'bg-gray-100 text-gray-600')}>
                    {priorityLabels[ticket.priority] || ticket.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{ticket.tenantName || 'N/A'}</p>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ticketStatusColors[ticket.status] || 'bg-gray-100 text-gray-600')}>
                    {ticketStatusLabels[ticket.status] || ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Planos</h2>
          <span className="text-xs text-gray-400">{stats.totalPlans} planos ativos</span>
        </div>
        <div className="p-5">
          {stats.topPlans.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum plano em uso</p>
          ) : (
            <div className="space-y-4">
              {stats.topPlans.map((plan) => {
                const percentage = stats.totalTenants > 0 ? Math.round((plan.count / stats.totalTenants) * 100) : 0;
                return (
                  <div key={plan.planName}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{plan.planName}</span>
                      <span className="text-sm text-gray-500">{plan.count} contas · {formatCurrency(plan.revenue)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
