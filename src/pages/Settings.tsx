import React, { useState, useEffect } from 'react';
import { 
  Cpu, BookOpen, Key, Plus, Trash2, CheckCircle2, 
  HelpCircle, Bot, Save, AlertTriangle, ShieldCheck, Sparkles 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LLMConfig {
  id?: string;
  provider: 'gemini' | 'openai' | 'groq';
  display_name: string;
  api_key: string;
  default_model: string;
  api_base_url?: string;
  is_active: boolean;
}

interface AgentDocument {
  id: string;
  agent_id: string;
  agent_name: string;
  title: string;
  content: string;
  source_type: 'text' | 'file' | 'url';
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  role?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'llms' | 'rag'>('llms');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // LLM states
  const [llmConfigs, setLlmConfigs] = useState<LLMConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'groq'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // RAG states
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [sourceType, setSourceType] = useState<'text' | 'file' | 'url'>('text');
  const [agentDocs, setAgentDocs] = useState<AgentDocument[]>([]);

  // Providers metadata
  const providerMeta = {
    gemini: { name: 'Google Gemini', defaultModel: 'gemini-2.5-flash', icon: Sparkles },
    openai: { name: 'OpenAI (ChatGPT)', defaultModel: 'gpt-4o', icon: Cpu },
    groq: { name: 'Groq (Llama)', defaultModel: 'llama-3.3-70b-versatile', icon: Key },
  };

  // Alert message controller
  const triggerAlert = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // FETCH LLM PROVIDERS
  const fetchLLMs = async () => {
    try {
      const { data, error } = await supabase.from('llm_providers').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setLlmConfigs(data as LLMConfig[]);
      } else {
        // Fallback or read from localStorage
        const local = localStorage.getItem('gabinete_llms');
        if (local) {
          setLlmConfigs(JSON.parse(local));
        }
      }
    } catch (err) {
      console.warn('Fallback para LocalStorage na tabela llm_providers:', err);
      const local = localStorage.getItem('gabinete_llms');
      if (local) setLlmConfigs(JSON.parse(local));
    }
  };

  // FETCH AGENTS
  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase.from('service_agents').select('id, name, type, role').eq('type', 'ai');
      if (error) throw error;
      setAgents(data || []);
      if (data && data.length > 0) {
        setSelectedAgentId(data[0].id);
      }
    } catch (err) {
      console.error('Erro ao buscar agentes:', err);
      // Hardcoded AI agents fallback
      const fallbackAgents = [
        { id: '1', name: 'Agente de Triagem Geral', type: 'ai' },
        { id: '2', name: 'Agente de Infraestrutura Urbana', type: 'ai' },
        { id: '3', name: 'Agente de Saude e Assistencia', type: 'ai' },
      ];
      setAgents(fallbackAgents);
      setSelectedAgentId('1');
    }
  };

  // FETCH AGENT STUDY DOCUMENTS (RAG)
  const fetchAgentDocs = async () => {
    try {
      const { data, error } = await supabase.from('agent_documents').select('*');
      if (error) throw error;
      setAgentDocs(data || []);
    } catch (err) {
      console.warn('Fallback para LocalStorage na tabela agent_documents:', err);
      const local = localStorage.getItem('gabinete_rag_docs');
      if (local) setAgentDocs(JSON.parse(local));
    }
  };

  useEffect(() => {
    fetchLLMs();
    fetchAgents();
    fetchAgentDocs();
  }, []);

  useEffect(() => {
    setDefaultModel(providerMeta[selectedProvider].defaultModel);
  }, [selectedProvider]);

  // REGISTER OR UPDATE LLM
  const handleSaveLLM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      triggerAlert('error', 'Por favor, insira a chave de API.');
      return;
    }

    setLoading(true);
    const newConfig: LLMConfig = {
      provider: selectedProvider,
      display_name: providerMeta[selectedProvider].name,
      api_key: apiKey.trim(),
      default_model: defaultModel || providerMeta[selectedProvider].defaultModel,
      api_base_url: customUrl.trim() || undefined,
      is_active: llmConfigs.length === 0, // Active by default if first LLM
    };

    try {
      // Try to save to Supabase
      const { error } = await supabase.from('llm_providers').upsert(newConfig, { onConflict: 'provider' });
      if (error) throw error;
      
      triggerAlert('success', `Configuração da LLM ${providerMeta[selectedProvider].name} salva com sucesso no banco!`);
      fetchLLMs();
    } catch (err) {
      console.warn('Salvando localmente devido a falha na tabela:', err);
      
      // Local storage save logic
      const currentConfigs = [...llmConfigs];
      const index = currentConfigs.findIndex(c => c.provider === selectedProvider);
      if (index >= 0) {
        currentConfigs[index] = { ...currentConfigs[index], ...newConfig };
      } else {
        currentConfigs.push(newConfig);
      }
      
      localStorage.setItem('gabinete_llms', JSON.stringify(currentConfigs));
      setLlmConfigs(currentConfigs);
      triggerAlert('success', `Configuração da LLM ${providerMeta[selectedProvider].name} salva localmente!`);
    } finally {
      setApiKey('');
      setCustomUrl('');
      setLoading(false);
    }
  };

  // TOGGLE ACTIVE LLM
  const handleToggleActiveLLM = async (providerName: string) => {
    const updated = llmConfigs.map(c => ({
      ...c,
      is_active: c.provider === providerName
    }));

    try {
      // Save updates to Supabase
      for (const config of updated) {
        await supabase.from('llm_providers').upsert(config, { onConflict: 'provider' });
      }
      triggerAlert('success', `Provedor ativo alterado para ${providerName.toUpperCase()}!`);
      fetchLLMs();
    } catch (err) {
      localStorage.setItem('gabinete_llms', JSON.stringify(updated));
      setLlmConfigs(updated);
      triggerAlert('success', `Provedor ativo alterado localmente para ${providerName.toUpperCase()}!`);
    }
  };

  // DELETE LLM CONFIG
  const handleDeleteLLM = async (providerName: string) => {
    try {
      const { error } = await supabase.from('llm_providers').delete().eq('provider', providerName);
      if (error) throw error;
      triggerAlert('success', 'Configuração da LLM excluída do banco.');
      fetchLLMs();
    } catch (err) {
      const filtered = llmConfigs.filter(c => c.provider !== providerName);
      localStorage.setItem('gabinete_llms', JSON.stringify(filtered));
      setLlmConfigs(filtered);
      triggerAlert('success', 'Configuração da LLM excluída localmente.');
    }
  };

  // CREATE RAG / STUDY MATERIAL
  const handleSaveRAGDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) {
      triggerAlert('error', 'Preencha o título e o conteúdo de estudo.');
      return;
    }

    setLoading(true);
    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    const agentName = selectedAgent ? selectedAgent.name : 'Agente IA';

    const newDoc = {
      id: Date.now().toString(),
      agent_id: selectedAgentId,
      agent_name: agentName,
      title: docTitle.trim(),
      content: docContent.trim(),
      source_type: sourceType,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('agent_documents').insert([newDoc]);
      if (error) throw error;
      
      triggerAlert('success', `O "${docTitle}" foi estudado com sucesso pelo agente ${agentName}!`);
      fetchAgentDocs();
    } catch (err) {
      console.warn('Salvando RAG localmente devido a falha na tabela:', err);
      const updatedDocs = [newDoc, ...agentDocs];
      localStorage.setItem('gabinete_rag_docs', JSON.stringify(updatedDocs));
      setAgentDocs(updatedDocs);
      triggerAlert('success', `O "${docTitle}" foi aprendido localmente pelo agente ${agentName}!`);
    } finally {
      setDocTitle('');
      setDocContent('');
      setLoading(false);
    }
  };

  // DELETE RAG DOCUMENT
  const handleDeleteRAGDoc = async (id: string) => {
    try {
      const { error } = await supabase.from('agent_documents').delete().eq('id', id);
      if (error) throw error;
      triggerAlert('success', 'Material de estudo removido do banco.');
      fetchAgentDocs();
    } catch (err) {
      const filtered = agentDocs.filter(d => d.id !== id);
      localStorage.setItem('gabinete_rag_docs', JSON.stringify(filtered));
      setAgentDocs(filtered);
      triggerAlert('success', 'Material de estudo removido localmente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações & Conectores de IA</h1>
          <p className="text-slate-600 mt-1">Gerencie os tokens das LLMs e as bases de estudo para os agentes de atendimento (RAG).</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-semibold text-emerald-800 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm font-semibold text-rose-800 animate-fade-in shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('llms')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'llms'
              ? 'bg-white text-blue-600 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          Cadastro de LLMs
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'rag'
              ? 'bg-white text-blue-600 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Base de Estudo RAG
        </button>
      </div>

      {/* TAB 1: LLM REGISTRY */}
      {activeTab === 'llms' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Provedores de Linguagem Configurados
              </h2>
            </div>
            <div className="p-6 flex-1">
              {llmConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <Cpu className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">Nenhum provedor de LLM cadastrado</p>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">Preencha o formulário lateral para cadastrar sua primeira chave e começar a operar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {llmConfigs.map(config => {
                    const MetaIcon = providerMeta[config.provider]?.icon || Cpu;
                    return (
                      <div 
                        key={config.provider} 
                        className={`flex items-center justify-between p-5 border rounded-xl transition-all shadow-sm ${
                          config.is_active 
                            ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-200' 
                            : 'border-slate-200 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                            config.is_active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <MetaIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{config.display_name}</span>
                              {config.is_active && (
                                <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 font-medium truncate">Modelo: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600">{config.default_model}</code></p>
                            <p className="text-[11px] text-slate-500 mt-1">Chave: <span className="font-mono">••••••••••••••••{config.api_key.slice(-4)}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!config.is_active && (
                            <button
                              onClick={() => handleToggleActiveLLM(config.provider)}
                              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-bold rounded-lg text-xs transition"
                            >
                              Ativar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLLM(config.provider)}
                            className="p-2 border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir conector"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Novo Conector
            </h2>
            <form onSubmit={handleSaveLLM} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Provedor de LLM</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as any)}
                  className="h-11 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="groq">Groq (Llama)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Chave de API (API Key)</label>
                <input
                  type="password"
                  required
                  placeholder="Insira sua API Key secreta"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-11 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Modelo Padrão</label>
                <input
                  type="text"
                  placeholder={providerMeta[selectedProvider].defaultModel}
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="h-11 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  Endpoint Customizado <span className="text-[10px] text-slate-500 font-semibold uppercase">(Opcional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://api.openai.com/v1"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="h-11 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-4 transition shadow-sm"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Provedor'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: AGENT RAG STUDY BASE */}
      {activeTab === 'rag' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Acervo de Estudo (Base RAG)
              </h2>
            </div>
            <div className="p-6 flex-1">
              {agentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">Nenhum material de estudo catalogado</p>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">Forneça manuais ou FAQs no painel ao lado para que os agentes de IA possam "estudar".</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agentDocs.map(doc => (
                    <div key={doc.id} className="p-5 border border-slate-200/80 rounded-xl bg-white hover:border-slate-300 transition shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{doc.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              <Bot className="w-3 h-3" /> {doc.agent_name}
                            </span>
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              Fonte: {doc.source_type}
                            </span>
                            <span className="text-[10px] text-slate-600 font-medium">
                              Estudado em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-3 bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-medium line-clamp-3 leading-relaxed whitespace-pre-wrap">
                            {doc.content}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRAGDoc(doc.id)}
                          className="p-2 border border-slate-150 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition shrink-0"
                          title="Remover material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Side to Upload RAG */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Alimentar Conhecimento do Agente
            </h2>
            <form onSubmit={handleSaveRAGDoc} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Selecione o Agente IA Alvo</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="h-11 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} {agent.role ? `(${agent.role})` : ''}
                    </option>
                  ))}
                  {agents.length === 0 && (
                    <option value="">Nenhum agente IA disponível</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tipo de Fonte</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['text', 'file', 'url'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSourceType(type)}
                      className={`h-10 text-xs font-bold rounded-lg border uppercase tracking-wider transition ${
                        sourceType === type
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'text' ? 'Texto Livre' : type === 'file' ? 'Arquivo' : 'URL Link'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Título do Material</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FAQ de Iluminação Pública 2026, Lei de Zeladoria"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="h-11 px-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Conteúdo do Estudo / Respostas de Referência</label>
                <textarea
                  required
                  rows={8}
                  placeholder={
                    sourceType === 'text' 
                      ? "Cole aqui o texto livre, regras municipais ou perguntas e respostas que o agente deve usar para responder aos cidadãos no WhatsApp..."
                      : sourceType === 'url'
                      ? "Insira o link oficial e cole abaixo os principais textos extraídos dessa página para guiar o agente..."
                      : "Insira o nome do arquivo importado e cole as linhas completas do documento aqui para indexação no RAG..."
                  }
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3.5 text-xs text-amber-850 flex items-start gap-2.5">
                <HelpCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">
                  O conteúdo inserido será fatiado e anexado contextualmente nas consultas que o Agente IA realizar. Isso garante respostas precisas sem que a IA "invente" informações fora do escopo do gabinete.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedAgentId}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-2 transition shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                {loading ? 'Processando estudo...' : 'Ensinar ao Agente (RAG)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
