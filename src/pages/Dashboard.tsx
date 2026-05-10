import { motion } from 'motion/react';
import { 
  Users, TrendingUp, TrendingDown,
  CheckCircle, Clock, AlertCircle,
  MessageSquare, MapPin, Tag
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useDashboardStats } from '../hooks/useApi';
import { useStore } from '../stores/appStore';
import { mockData } from '../hooks/mockApi';

interface StatCardProps {
  label: string;
  value: number;
  growth?: number;
  icon: any;
  color: string;
  onClick?: () => void;
}

function StatCard({ label, value, growth, icon: Icon, color, onClick }: StatCardProps) {
  const isPositive = growth !== undefined ? growth >= 0 : true;
  
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
          {growth !== undefined && (
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
          )}
        </div>
        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { setCurrentPage } = useStore();
  const { stats, loading } = useDashboardStats();

  const recentDemands = mockData.requests.slice(0, 5);

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
          <h1 className="text-2xl font-bold text-gray-900">Painel de Atendimento Popular</h1>
          <p className="text-gray-500 mt-1">Gestão de demandas e relacionamento com o cidadão</p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm self-start sm:self-auto">
          <span className="font-medium text-gray-400">Gabinete do Vice-Prefeito</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Cidadãos Cadastrados"
          value={stats.citizens}
          growth={stats.citizensGrowth}
          icon={Users}
          color="bg-blue-600"
          onClick={() => setCurrentPage?.('cidadaos')}
        />
        <StatCard
          label="Demandas Abertas"
          value={stats.openDemands}
          icon={AlertCircle}
          color="bg-red-500"
          onClick={() => setCurrentPage?.('demandas')}
        />
        <StatCard
          label="Em Atendimento"
          value={stats.inProgressDemands}
          icon={Clock}
          color="bg-yellow-500"
          onClick={() => setCurrentPage?.('demandas')}
        />
        <StatCard
          label="Resolvidas"
          value={stats.resolvedDemands}
          icon={CheckCircle}
          color="bg-green-600"
          onClick={() => setCurrentPage?.('demandas')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Neighborhoods */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Demandas por Bairro
          </h2>
          <div className="space-y-4">
            {stats.topNeighborhoods.map((n, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{n.name}</span>
                  <span className="text-gray-500 font-bold">{n.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(n.count / stats.topNeighborhoods[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Subjects */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-600" />
            Assuntos mais Recorrentes
          </h2>
          <div className="space-y-4">
            {stats.topSubjects.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="text-gray-500 font-bold">{s.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${(s.count / stats.topSubjects[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Demands */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Últimas Demandas Recebidas</h2>
            <button 
              onClick={() => setCurrentPage?.('demandas')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Cidadão</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Assunto</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase">Bairro</th>
                  <th className="pb-3 text-xs font-semibold text-gray-400 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentDemands.map((demand) => (
                  <tr key={demand.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-gray-900">{demand.requesterName}</div>
                      <div className="text-xs text-gray-500">{demand.requesterPhone}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-gray-700">{demand.subject}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-gray-700">{demand.neighborhood}</div>
                    </td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        demand.status === 'open' ? "bg-red-100 text-red-700" :
                        demand.status === 'in-progress' ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {demand.status === 'open' ? 'Aberta' : 
                         demand.status === 'in-progress' ? 'Em andamento' : 'Resolvida'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Citizen Contributors */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Cidadãos Engajados</h2>
            <button 
              onClick={() => setCurrentPage?.('ranking-cidadaos')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver ranking
            </button>
          </div>
          <div className="space-y-4">
            {mockData.citizens.slice(0, 5).map((citizen) => {
              const demandCount = mockData.requests.filter(r => r.requesterId === citizen.id).length;
              return (
                <div key={citizen.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {citizen.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{citizen.name}</p>
                      <p className="text-xs text-gray-500">{citizen.neighborhood}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{demandCount || 1}</span>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">demandas</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}