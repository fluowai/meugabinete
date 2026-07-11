import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Inbox,
  MapPin,
  MessageSquare,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

const DEMAND_STATUSES = ['Nova', 'Triagem', 'Aguardando Informações', 'Encaminhada', 'Em Execução', 'Respondida', 'Resolvida', 'Arquivada'];

const GabineteDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) return;

    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('id,name,status,source,created_at,demand_category,demand_priority,neighborhood,city,due_at,resolved_at,lead_score')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      } catch (error) {
        logger.error('Erro ao carregar dashboard do gabinete', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile?.organization_id]);

  const now = Date.now();
  const stats = useMemo(() => {
    const open = leads.filter((lead) => !['Resolvida', 'Arquivada'].includes(lead.status));
    const overdue = leads.filter((lead) => lead.due_at && new Date(lead.due_at).getTime() < now && !['Resolvida', 'Arquivada'].includes(lead.status));
    const urgent = leads.filter((lead) => ['alta', 'urgente'].includes(lead.demand_priority));
    const resolved = leads.filter((lead) => lead.status === 'Resolvida');
    return {
      total: leads.length,
      open: open.length,
      overdue: overdue.length,
      urgent: urgent.length,
      resolved: resolved.length,
      resolutionRate: leads.length ? Math.round((resolved.length / leads.length) * 100) : 0,
    };
  }, [leads, now]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    leads.forEach((lead) => {
      const key = lead.demand_category || 'Sem categoria';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).slice(0, 8);
  }, [leads]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const month = date.getMonth();
      const year = date.getFullYear();
      return {
        mes: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
        demandas: leads.filter((lead) => {
          const created = lead.created_at ? new Date(lead.created_at) : null;
          return created && created.getMonth() === month && created.getFullYear() === year;
        }).length,
        resolvidas: leads.filter((lead) => {
          const resolved = lead.resolved_at ? new Date(lead.resolved_at) : null;
          return resolved && resolved.getMonth() === month && resolved.getFullYear() === year;
        }).length,
      };
    });
  }, [leads]);

  const recent = leads.slice(0, 6);

  if (loading) {
    return <div className="rounded-2xl bg-white p-12 text-center text-sm font-bold text-slate-400">Carregando painel...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Painel do gabinete</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">Demandas em tempo real</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
              Acompanhe entrada, prioridade, prazos e resolução das solicitações dos cidadãos.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700">
            {stats.resolutionRate}% resolvidas
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Inbox} label="Demandas abertas" value={stats.open} />
        <Metric icon={AlertTriangle} label="Prioridade alta" value={stats.urgent} tone="amber" />
        <Metric icon={Clock3} label="Prazos vencidos" value={stats.overdue} tone="red" />
        <Metric icon={CheckCircle2} label="Resolvidas" value={stats.resolved} tone="emerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
            <BarChart3 size={18} className="text-primary" /> Evolução mensal
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="demandas" name="Demandas" stroke="#2563eb" fill="#dbeafe" strokeWidth={3} />
                <Area type="monotone" dataKey="resolvidas" name="Resolvidas" stroke="#059669" fill="#d1fae5" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
            <MessageSquare size={18} className="text-primary" /> Por categoria
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
          <Users size={18} className="text-primary" /> Demandas recentes
        </h3>
        <div className="divide-y divide-slate-100">
          {recent.map((lead) => (
            <div key={lead.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-black text-slate-950">{lead.name || 'Cidadão'}</p>
                <p className="text-sm font-medium text-slate-500">
                  {lead.demand_category || 'Sem categoria'} · {lead.source || 'Origem não informada'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[lead.neighborhood, lead.city].filter(Boolean).length ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    <MapPin size={13} /> {[lead.neighborhood, lead.city].filter(Boolean).join(' / ')}
                  </span>
                ) : null}
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{lead.status || 'Nova'}</span>
              </div>
            </div>
          ))}
          {!recent.length ? <p className="py-8 text-center text-sm font-bold text-slate-400">Nenhuma demanda registrada.</p> : null}
        </div>
      </section>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ElementType; label: string; value: number; tone?: 'blue' | 'amber' | 'red' | 'emerald' }> = ({ icon: Icon, label, value, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={21} />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
};

export default GabineteDashboard;
