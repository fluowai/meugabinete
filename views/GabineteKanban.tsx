import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, MessageSquare, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { leadService } from '../services/leads';
import { Lead } from '../types';
import { useAuth } from '../context/AuthContext';

const STAGES = ['Nova', 'Triagem', 'Aguardando Informações', 'Encaminhada', 'Em Execução', 'Respondida', 'Resolvida', 'Arquivada'];

const GabineteKanban: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    demand_subject: '',
    demand_category: '',
    demand_priority: 'normal',
    neighborhood: '',
    responsible_department: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadService.list();
      setLeads(data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar demandas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return leads;
    return leads.filter((lead) =>
      [lead.name, lead.phone, lead.protocol, lead.demand_subject, lead.demand_category, lead.neighborhood, lead.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [leads, search]);

  const grouped = useMemo(() => {
    const map = new Map(STAGES.map((stage) => [stage, [] as Lead[]]));
    filtered.forEach((lead) => {
      const stage = STAGES.includes(String(lead.status)) ? String(lead.status) : 'Nova';
      map.get(stage)?.push(lead);
    });
    return map;
  }, [filtered]);

  const createDemand = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile?.organization_id) return;
    try {
      await leadService.create({
        ...form,
        organization_id: profile.organization_id,
        source: 'Gabinete / Manual',
        status: 'Nova',
        citizen_name: form.name,
      } as any);
      setCreating(false);
      setForm({
        name: '',
        phone: '',
        demand_subject: '',
        demand_category: '',
        demand_priority: 'normal',
        neighborhood: '',
        responsible_department: '',
        notes: '',
      });
      await load();
      toast.success('Demanda cadastrada.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar demanda.');
    }
  };

  const move = async (lead: Lead, status: string) => {
    const previous = leads;
    setLeads((items) => items.map((item) => (item.id === lead.id ? { ...item, status: status as Lead['status'] } : item)));
    try {
      await leadService.updateStatus(lead.id, status);
    } catch (error: any) {
      setLeads(previous);
      toast.error(error.message || 'Erro ao mover demanda.');
    }
  };

  const remove = async (lead: Lead) => {
    if (!confirm(`Excluir a demanda de ${lead.name}?`)) return;
    try {
      await leadService.delete(lead.id);
      setLeads((items) => items.filter((item) => item.id !== lead.id));
      toast.success('Demanda excluída.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir demanda.');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Kanban</p>
          <h2 className="text-2xl font-black text-slate-950">Demandas do gabinete</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-primary" placeholder="Buscar demanda..." />
          </div>
          <button onClick={() => setCreating(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white">
            <Plus size={17} /> Nova
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-12 text-center text-sm font-bold text-slate-400">Carregando demandas...</div>
      ) : (
        <div className="grid gap-4 overflow-x-auto pb-3 lg:grid-cols-4 2xl:grid-cols-8">
          {STAGES.map((stage) => (
            <section key={stage} className="min-w-72 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 p-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">{stage}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500">{grouped.get(stage)?.length || 0}</span>
              </div>
              <div className="space-y-3 p-3">
                {(grouped.get(stage) || []).map((lead) => (
                  <article key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black leading-tight text-slate-950">{lead.name || 'Cidadão'}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{lead.protocol || lead.source || 'Sem protocolo'}</p>
                      </div>
                      <button onClick={() => remove(lead)} className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-600">
                      {lead.demand_subject || lead.notes || lead.classification || 'Sem descrição'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lead.phone ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500"><Phone size={12} /> {String(lead.phone).slice(-4).padStart(8, '*')}</span> : null}
                      {lead.due_at ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700"><CalendarClock size={12} /> prazo</span> : null}
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">{lead.demand_priority || 'normal'}</span>
                    </div>
                    <select value={String(lead.status || 'Nova')} onChange={(event) => move(lead, event.target.value)} className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none">
                      {STAGES.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {creating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={createDemand} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <MessageSquare className="text-primary" />
              <h3 className="text-xl font-black text-slate-950">Nova demanda</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Nome do cidadão" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
              <Input label="WhatsApp" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required />
              <Input label="Assunto" value={form.demand_subject} onChange={(value) => setForm({ ...form, demand_subject: value })} />
              <Input label="Categoria" value={form.demand_category} onChange={(value) => setForm({ ...form, demand_category: value })} />
              <Input label="Bairro" value={form.neighborhood} onChange={(value) => setForm({ ...form, neighborhood: value })} />
              <Input label="Responsável/órgão" value={form.responsible_department} onChange={(value) => setForm({ ...form, responsible_department: value })} />
            </div>
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-primary" placeholder="Descrição inicial" />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setCreating(false)} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
              <button className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-white">Salvar</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; required?: boolean; onChange: (value: string) => void }> = ({ label, value, required, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary" />
  </label>
);

export default GabineteKanban;
