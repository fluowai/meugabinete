import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, MapPin, PieChart, Users } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

const GabineteReports: React.FC = () => {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) return;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('leads')
          .select('id,protocol,name,citizen_name,status,source,demand_category,demand_priority,neighborhood,city,responsible_department,due_at,created_at,resolved_at')
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRows(data || []);
      } catch (error) {
        logger.error('Erro ao carregar relatórios', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.organization_id]);

  const summary = useMemo(() => {
    const byCategory = countBy(rows, 'demand_category');
    const byNeighborhood = countBy(rows, 'neighborhood');
    const byStatus = countBy(rows, 'status');
    return { byCategory, byNeighborhood, byStatus };
  }, [rows]);

  const exportCsv = () => {
    const header = ['Protocolo', 'Cidadao', 'Status', 'Categoria', 'Prioridade', 'Bairro', 'Cidade', 'Responsavel', 'Criado em', 'Prazo'];
    const csvRows = rows.map((row) => [
      row.protocol || '',
      row.citizen_name || row.name || '',
      row.status || '',
      row.demand_category || '',
      row.demand_priority || '',
      row.neighborhood || '',
      row.city || '',
      row.responsible_department || '',
      row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '',
      row.due_at ? new Date(row.due_at).toLocaleDateString('pt-BR') : '',
    ]);
    const csv = [header, ...csvRows]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relatorio-demandas-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="rounded-2xl bg-white p-12 text-center text-sm font-bold text-slate-400">Carregando relatórios...</div>;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Relatórios</p>
          <h2 className="mt-1 text-3xl font-black text-slate-950">Prestação de contas</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Resumo operacional para acompanhamento interno e comunicação pública.</p>
        </div>
        <button onClick={exportCsv} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white">
          <Download size={17} /> Exportar CSV
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <ReportCard icon={Users} label="Demandas registradas" value={rows.length} />
        <ReportCard icon={FileText} label="Com protocolo" value={rows.filter((row) => row.protocol).length} />
        <ReportCard icon={PieChart} label="Categorias ativas" value={summary.byCategory.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Ranking title="Categorias" items={summary.byCategory} />
        <Ranking title="Bairros" items={summary.byNeighborhood} icon={MapPin} />
        <Ranking title="Status" items={summary.byStatus} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-black text-slate-900">Base de demandas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Protocolo</th>
                <th className="px-4 py-3 text-left">Cidadão</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Bairro</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-bold text-slate-700">{row.protocol || '-'}</td>
                  <td className="px-4 py-3">{row.citizen_name || row.name || '-'}</td>
                  <td className="px-4 py-3">{row.demand_category || '-'}</td>
                  <td className="px-4 py-3">{row.neighborhood || '-'}</td>
                  <td className="px-4 py-3">{row.status || '-'}</td>
                  <td className="px-4 py-3">{row.due_at ? new Date(row.due_at).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-bold text-slate-400">Nenhuma demanda encontrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

function countBy(rows: any[], field: string) {
  const grouped: Record<string, number> = {};
  rows.forEach((row) => {
    const key = row[field] || 'Não informado';
    grouped[key] = (grouped[key] || 0) + 1;
  });
  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

const ReportCard: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <Icon className="mb-4 text-primary" size={24} />
    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
  </div>
);

const Ranking: React.FC<{ title: string; items: Array<{ label: string; value: number }>; icon?: React.ElementType }> = ({ title, items, icon: Icon = PieChart }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
      <Icon size={17} className="text-primary" /> {title}
    </h3>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, item.value * 10)}%` }} />
          </div>
        </div>
      ))}
      {!items.length ? <p className="py-6 text-center text-sm font-bold text-slate-400">Sem dados.</p> : null}
    </div>
  </section>
);

export default GabineteReports;
