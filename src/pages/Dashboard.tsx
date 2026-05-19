import { motion } from 'motion/react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  MessageSquare,
  Tag,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useCitizens, useDashboardStats, useRequests } from '../hooks/useApi';
import { useStore } from '../stores/appStore';

interface StatCardProps {
  label: string;
  value: number;
  growth?: number;
  icon: any;
  tone: 'blue' | 'red' | 'amber' | 'green';
  onClick?: () => void;
}

const toneConfig = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  red: 'bg-rose-50 text-rose-700 ring-rose-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

function StatCard({ label, value, growth, icon: Icon, tone, onClick }: StatCardProps) {
  const isPositive = growth !== undefined ? growth >= 0 : true;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString('pt-BR')}</p>
        </div>
        <div className={cn('rounded-xl p-3 ring-1', toneConfig[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {growth !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-rose-600" />}
          <span className={cn('font-semibold', isPositive ? 'text-emerald-700' : 'text-rose-700')}>{Math.abs(growth).toFixed(1)}%</span>
          <span className="text-slate-500">vs mes anterior</span>
        </div>
      )}
    </motion.button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
      {label}
    </div>
  );
}

export default function DashboardPage() {
  const { setCurrentPage } = useStore();
  const { stats, loading } = useDashboardStats();
  const { data: requests } = useRequests(1, 5);
  const { data: citizens } = useCitizens(1, 5);

  const recentDemands = requests.slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className="flex flex-col gap-6 p-6 text-white lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              Gabinete do Vice-Prefeito
            </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Painel operacional</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Acompanhe demandas, atendimentos e relacionamento com a população em uma visão objetiva.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
            <div className="px-3">
              <div className="text-xl font-bold">{stats.openDemands}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-300">Abertas</div>
            </div>
            <div className="border-x border-white/10 px-3">
              <div className="text-xl font-bold">{stats.inProgressDemands}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-300">Andamento</div>
            </div>
            <div className="px-3">
              <div className="text-xl font-bold">{stats.resolvedDemands}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-300">Resolvidas</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Cidadãos" value={stats.citizens} growth={stats.citizensGrowth} icon={Users} tone="blue" onClick={() => setCurrentPage('cidadaos')} />
        <StatCard label="Demandas abertas" value={stats.openDemands} icon={AlertCircle} tone="red" onClick={() => setCurrentPage('demandas')} />
        <StatCard label="Em atendimento" value={stats.inProgressDemands} icon={Clock} tone="amber" onClick={() => setCurrentPage('demandas')} />
        <StatCard label="Resolvidas" value={stats.resolvedDemands} icon={CheckCircle} tone="green" onClick={() => setCurrentPage('demandas')} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-950">
            <MapPin className="h-5 w-5 text-blue-600" />
            Demandas por bairro
          </h2>
          {stats.topNeighborhoods.length ? (
            <div className="space-y-4">
              {stats.topNeighborhoods.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="font-semibold text-slate-950">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${stats.topNeighborhoods[0]?.count ? (item.count / stats.topNeighborhoods[0].count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Sem dados de bairro por enquanto" />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-950">
            <Tag className="h-5 w-5 text-indigo-600" />
            Assuntos recorrentes
          </h2>
          {stats.topSubjects.length ? (
            <div className="space-y-4">
              {stats.topSubjects.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="font-semibold text-slate-950">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${stats.topSubjects[0]?.count ? (item.count / stats.topSubjects[0].count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="Sem assuntos recorrentes ainda" />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Ultimas demandas recebidas
            </h2>
            <button onClick={() => setCurrentPage('demandas')} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Ver todas
            </button>
          </div>
          {recentDemands.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Cidadão</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Assunto</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Bairro</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDemands.map((demand) => (
                    <tr key={demand.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        <div className="font-medium text-slate-950">{demand.requesterName}</div>
                        <div className="text-xs text-slate-500">{demand.requesterPhone}</div>
                      </td>
                      <td className="py-4 text-sm text-slate-700">{demand.subject || '-'}</td>
                      <td className="py-4 text-sm text-slate-700">{demand.neighborhood || '-'}</td>
                      <td className="py-4 text-right">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                            demand.status === 'open'
                              ? 'bg-rose-50 text-rose-700'
                              : demand.status === 'in-progress'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700',
                          )}
                        >
                          {demand.status === 'open' ? 'Aberta' : demand.status === 'in-progress' ? 'Em andamento' : 'Resolvida'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState label="Nenhuma demanda registrada" />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-950">Cidadãos engajados</h2>
            <button onClick={() => setCurrentPage('ranking')} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Ver ranking
            </button>
          </div>
          {citizens.length ? (
            <div className="space-y-4">
              {citizens.slice(0, 5).map((citizen) => {
                const demandCount = requests.filter((request) => request.requesterId === citizen.id).length;
                return (
                  <div key={citizen.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {citizen.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{citizen.name}</p>
                        <p className="truncate text-xs text-slate-500">{citizen.neighborhood || 'Sem bairro'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-950">{demandCount || 1}</span>
                      <p className="text-[10px] font-semibold uppercase text-slate-400">demandas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState label="Nenhum cidadão cadastrado" />
          )}
        </div>
      </section>
    </div>
  );
}
