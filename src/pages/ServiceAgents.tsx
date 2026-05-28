import { useEffect, useState } from 'react';
import { Bot, Plus, RefreshCcw, Route, Shield, Sparkles, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface Agent {
  id: string;
  name: string;
  type: 'ai' | 'human';
  role?: string;
  specialty?: string;
  prompt?: string;
  active?: boolean;
  escalation_rules?: Record<string, unknown>;
}

const getBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';
  if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  return baseUrl;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }
  return response.json();
}

export default function ServiceAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ai' as 'ai' | 'human',
    role: 'triage',
    specialty: '',
    prompt: '',
  });

  const fetchAgents = async () => {
    setLoading(true);
    setError('');
    try {
      setAgents(await apiFetch<Agent[]>('/api/agents'));
    } catch (err) {
      setError('Nao foi possivel carregar a central de agentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const createAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await apiFetch('/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          active: true,
          escalation_rules: formData.type === 'ai' ? { can_create_request: true } : { requires_human_review: true },
        }),
      });
      setShowForm(false);
      setFormData({ name: '', type: 'ai', role: 'triage', specialty: '', prompt: '' });
      await fetchAgents();
    } catch (err) {
      setError('Nao foi possivel criar o agente.');
    }
  };

  const aiAgents = agents.filter(agent => agent.type === 'ai').length;
  const humanAgents = agents.filter(agent => agent.type === 'human').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Agentes</h1>
          <p className="text-gray-500 mt-1">Agentes que triagem, classificam, sugerem resposta e escalam demandas do WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAgents}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            Atualizar
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo agente
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Agentes IA</p>
              <p className="text-2xl font-bold text-gray-900">{aiAgents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Agentes Humanos</p>
              <p className="text-2xl font-bold text-gray-900">{humanAgents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Fluxo</p>
              <p className="text-sm font-bold text-gray-900">Mensagem {'->'} IA {'->'} Demanda {'->'} Time</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={createAgent} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <input
            required
            value={formData.name}
            onChange={event => setFormData({ ...formData, name: event.target.value })}
            placeholder="Nome do agente"
            className="h-11 px-3 border border-gray-200 rounded-lg text-sm"
          />
          <select
            value={formData.type}
            onChange={event => setFormData({ ...formData, type: event.target.value as 'ai' | 'human' })}
            className="h-11 px-3 border border-gray-200 rounded-lg text-sm"
          >
            <option value="ai">Inteligencia Artificial</option>
            <option value="human">Humano</option>
          </select>
          <input
            value={formData.role}
            onChange={event => setFormData({ ...formData, role: event.target.value })}
            placeholder="Papel: triage, reply, case_owner"
            className="h-11 px-3 border border-gray-200 rounded-lg text-sm"
          />
          <input
            value={formData.specialty}
            onChange={event => setFormData({ ...formData, specialty: event.target.value })}
            placeholder="Especialidade"
            className="h-11 px-3 border border-gray-200 rounded-lg text-sm"
          />
          <textarea
            value={formData.prompt}
            onChange={event => setFormData({ ...formData, prompt: event.target.value })}
            placeholder="Prompt ou instrucoes do agente"
            className="lg:col-span-2 min-h-24 p-3 border border-gray-200 rounded-lg text-sm"
          />
          <div className="lg:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">
              Salvar agente
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Agentes configurados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Agente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Papel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Especialidade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Uso no fluxo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map(agent => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        agent.type === 'ai' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {agent.type === 'ai' ? <Bot className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded",
                      agent.type === 'ai' ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {agent.type === 'ai' ? 'IA' : 'Humano'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{agent.role || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{agent.specialty || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      {agent.type === 'ai' ? 'Classifica e sugere tratamento' : 'Recebe escalonamentos'}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && agents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Nenhum agente configurado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
