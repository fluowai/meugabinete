import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Mail, MessageSquare, Phone, Search, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { leadService } from '../../services/leads';
import { Lead } from '../../types';
import { logger } from '../../utils/logger';

const CRMLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.list();
      setLeads(data);
    } catch (error: any) {
      logger.error('Failed to load citizen records', error);
      toast.error('Erro ao carregar cidadaos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.name, lead.email, lead.phone, lead.source, lead.status, lead.classification]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [leads, searchTerm]);

  const kanbanPath = '/gabinete/demandas';
  const messagesPath = '/gabinete/whatsapp';

  if (loading) {
    return <div className="p-10 text-center font-semibold text-slate-500">Carregando cidadaos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.18em] text-primary">Relacionamento</span>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Cidadaos</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Base central de contatos, historico de atendimento e demandas.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={kanbanPath}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
          >
            <LayoutGrid size={18} />
            Abrir demandas
          </Link>
          <Link
            to={messagesPath}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-bold text-slate-700 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <MessageSquare size={18} />
            WhatsApp
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Cidadaos" value={leads.length} icon={Users} />
        <MetricCard
          label="Em atendimento"
          value={leads.filter((lead) => ['Em Atendimento', 'Triagem', 'Aguardando Informacoes'].includes(String(lead.status))).length}
          icon={Phone}
        />
        <MetricCard
          label="Resolvidas"
          value={leads.filter((lead) => ['Resolvida', 'Respondida', 'Fechado'].includes(String(lead.status))).length}
          icon={CheckCircle2}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-black text-slate-900">Contatos e historico</h2>
            <p className="text-xs text-slate-500">Lista operacional separada do quadro de demandas.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Buscar por nome, telefone, origem..."
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {filteredLeads.map((lead) => (
            <article key={lead.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{lead.name}</p>
                  <p className="text-xs font-semibold text-slate-400">{lead.classification || 'Sem classificacao'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
                  {lead.status || 'Novo'}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2"><Phone size={14} /> {lead.phone || '-'}</span>
                {lead.email ? <span className="flex items-center gap-2 break-all"><Mail size={14} /> {lead.email}</span> : null}
                <span className="block text-xs text-slate-400">Origem: {lead.source || '-'}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-400">
                <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                <Link to={kanbanPath} className="text-primary">Abrir demanda</Link>
              </div>
            </article>
          ))}
          {filteredLeads.length === 0 ? (
            <div className="px-5 py-12 text-center font-semibold text-slate-400">Nenhum cidadao encontrado.</div>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-400">Cidadao</th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-400">Contato</th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-400">Origem</th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-400">Etapa</th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-400">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-400">{lead.classification || 'Sem classificacao'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-slate-600">
                      <span className="flex items-center gap-2"><Phone size={13} /> {lead.phone}</span>
                      {lead.email ? <span className="flex items-center gap-2"><Mail size={13} /> {lead.email}</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{lead.source || '-'}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                      {lead.status || 'Novo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center font-semibold text-slate-400">
                    Nenhum cidadao encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon size={21} />
    </div>
  </div>
);

export default CRMLeads;
