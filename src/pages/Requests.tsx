import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X,
  MessageSquare,
  Eye,
  MapPin,
  Tag,
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { useRequests, useCitizens } from '../hooks/useApi';
import type { Request } from '../types';
import { cn } from '../lib/utils';

type StatusTab = 'all' | 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Abertas' },
  { key: 'in-progress', label: 'Em Progresso' },
  { key: 'waiting', label: 'Aguardando' },
  { key: 'resolved', label: 'Resolvidas' },
  { key: 'closed', label: 'Fechadas' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  open: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <AlertCircle className="w-3 h-3" /> },
  'in-progress': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-3 h-3" /> },
  waiting: { bg: 'bg-orange-100', text: 'text-orange-800', icon: <Clock className="w-3 h-3" /> },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <X className="w-3 h-3" /> },
};

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  'in-progress': 'Em Progresso',
  waiting: 'Aguardando',
  resolved: 'Resolvida',
  closed: 'Fechada',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

interface CEPAddress {
  cep: string;
  address: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

async function fetchFreeCEP(cep: string): Promise<CEPAddress> {
  const cleanCep = cep.replace(/\D/g, '');

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    const data = await response.json();
    if (response.ok && data.cep) {
      return {
        cep: data.cep,
        address: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      };
    }
  } catch {
    // ViaCEP below keeps the form usable if BrasilAPI is unavailable.
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  const data = await response.json();
  if (!response.ok || data.erro) throw new Error('CEP nao encontrado.');
  return {
    cep: data.cep,
    address: data.logradouro,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
}

export default function Requests() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const protocolPreview = useMemo(() => `#${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`, []);
  const [formData, setFormData] = useState({
    requesterId: '',
    subject: '',
    neighborhood: '',
    cep: '',
    address: '',
    addressNumber: '',
    complement: '',
    city: '',
    state: '',
    priority: 'medium',
    description: '',
    title: ''
  });

  const { data: requests, loading, create } = useRequests(1, 1000);
  const { data: citizens } = useCitizens(1, 1000);

  const getRequester = (request: Request) => {
    const citizen = citizens.find(c => c.id === request.requesterId);
    return {
      name: request.requesterName || citizen?.name || 'Cidadão não informado',
      phone: request.requesterPhone || citizen?.phone || '',
    };
  };

  const filteredRequests = useMemo(() => {
    let list = [...requests];
    
    if (activeTab !== 'all') {
      list = list.filter(r => r.status === activeTab);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      list = list.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        getRequester(r).name.toLowerCase().includes(searchLower) ||
        (r.subject && r.subject.toLowerCase().includes(searchLower)) ||
        (r.neighborhood && r.neighborhood.toLowerCase().includes(searchLower))
      );
    }
    
    return list;
  }, [activeTab, search, requests, citizens]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length };
    statusTabs.slice(1).forEach(tab => {
      c[tab.key] = requests.filter(r => r.status === tab.key).length;
    });
    return c;
  }, [requests]);

  const handleCepChange = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    let formatted = cleanCep;
    if (cleanCep.length > 5) {
      formatted = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`;
    }

    setFormData(prev => ({ ...prev, cep: formatted }));

    if (cleanCep.length === 8) {
      setSearchingCep(true);
      try {
        const data = await fetchFreeCEP(cleanCep);
        setFormData(prev => ({
          ...prev,
          cep: data.cep || prev.cep,
          address: data.address || prev.address,
          complement: prev.complement || data.complement || '',
          neighborhood: data.neighborhood || prev.neighborhood,
          city: data.city || prev.city,
          state: data.state || prev.state,
        }));
        setTimeout(() => {
          const numInput = document.getElementById('requestAddressNumber');
          if (numInput) numInput.focus();
        }, 100);
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setSearchingCep(false);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCitizen = citizens.find(c => c.id === formData.requesterId);
    const newRequest = {
      title: formData.title.trim() || formData.subject.trim(),
      description: formData.description.trim(),
      subject: formData.subject.trim(),
      cep: formData.cep.trim() || null,
      address: formData.address.trim() || null,
      address_number: formData.addressNumber.trim() || null,
      complement: formData.complement.trim() || null,
      neighborhood: formData.neighborhood.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim().toUpperCase() || null,
      category: 'request',
      priority: formData.priority,
      status: 'open',
      requester_id: formData.requesterId || null,
      requester_name: selectedCitizen?.name || 'Cidadao nao informado',
      requester_phone: selectedCitizen?.phone || null,
    };

    try {
      await create(newRequest);
      setIsModalOpen(false);
      setFormData({ requesterId: '', subject: '', neighborhood: '', cep: '', address: '', addressNumber: '', complement: '', city: '', state: '', priority: 'medium', description: '', title: '' });
    } catch (err) {
      console.error('Erro ao criar demanda:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar demandas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={cn(
                "px-2 py-0.5 text-xs rounded-full",
                activeTab === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
              )}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cidadão / WhatsApp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bairro</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Atribuído a</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((request) => {
                const requester = getRequester(request);

                return (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{requester.name}</div>
                        <div className="text-xs text-gray-500">{requester.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{request.subject}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{request.neighborhood}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", priorityColors[request.priority])}>
                      {priorityLabels[request.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{request.assignedToName || 'Não atribuído'}</span>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase",
                        request.assignedToType === 'ai' ? "text-purple-600" : "text-blue-600"
                      )}>
                        {request.assignedToType === 'ai' ? (
                          <><Bot className="w-3 h-3" /> IA Agent</>
                        ) : (
                          <><User className="w-3 h-3" /> Humano</>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusColors[request.status].bg,
                      statusColors[request.status].text
                    )}>
                      {statusColors[request.status].icon}
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Demanda Expandido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header com Protocolo */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Abertura de Demanda Popular</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                    <Clock className="w-3 h-3" />
                    Protocolo: {protocolPreview}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Coluna 1: Informações Básicas e Cidadão */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Identificação do Solicitante</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Cidadão</label>
                        <select 
                          required
                          value={formData.requesterId}
                          onChange={e => setFormData({...formData, requesterId: e.target.value})}
                          className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">Selecione um cidadão no cadastro...</option>
                          {citizens.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Canal de Entrada</label>
                          <select className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none">
                            <option value="whatsapp">WhatsApp</option>
                            <option value="phone">Telefone</option>
                            <option value="person">Presencial</option>
                            <option value="social">Redes Sociais</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Prazo Estimado</label>
                          <input type="date" className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Detalhes do Assunto</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Assunto Principal</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" required placeholder="Ex: Iluminação"
                            value={formData.subject}
                            onChange={e => setFormData({...formData, subject: e.target.value})}
                            className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Bairro</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" required placeholder="Ex: Centro"
                            value={formData.neighborhood}
                            onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                            className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Nível de Prioridade</label>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high', 'urgent'].map((p) => (
                          <button
                            key={p} type="button"
                            onClick={() => setFormData({...formData, priority: p})}
                            className={cn(
                              "flex-1 py-2.5 text-[10px] font-black rounded-xl border transition-all uppercase tracking-tighter",
                              formData.priority === p 
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                                : "bg-white border-gray-200 text-gray-400 hover:border-blue-200"
                            )}
                          >
                            {priorityLabels[p]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Localização e Descrição */}
                <div className="space-y-6">
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <h3 className="text-sm font-black text-blue-900/40 uppercase tracking-widest mb-4">Localização da Ocorrência</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">CEP</label>
                          <div className="relative">
                            <input
                              value={formData.cep}
                              onChange={(e) => handleCepChange(e.target.value)}
                              maxLength={9}
                              className="w-full h-12 px-4 pr-10 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                              placeholder="00000-000"
                            />
                            {searchingCep && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 mt-1 block">
                            Busca automática ao digitar 8 números
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Logradouro (Rua/Av)</label>
                        <input
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                          type="text" placeholder="Nome da rua onde está o problema..."
                          className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Nº</label>
                          <input
                            id="requestAddressNumber"
                            value={formData.addressNumber}
                            onChange={e => setFormData({...formData, addressNumber: e.target.value})}
                            type="text" placeholder="123"
                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Complemento</label>
                          <input
                            value={formData.complement}
                            onChange={e => setFormData({...formData, complement: e.target.value})}
                            type="text" placeholder="Ex: Apto 101, Bloco A"
                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Cidade</label>
                          <input
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                            type="text" placeholder="Cidade"
                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">UF</label>
                          <input
                            value={formData.state}
                            onChange={e => setFormData({...formData, state: e.target.value.slice(0, 2)})}
                            type="text" placeholder="UF" maxLength={2}
                            className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Ponto de Referência</label>
                          <input type="text" placeholder="Ex: Próximo ao mercado" className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Relato Completo da Demanda</label>
                    <textarea 
                      required rows={6}
                      placeholder="Descreva detalhadamente o problema relatado pelo cidadão..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button" onClick={() => setIsModalOpen(false)}
                      className="flex-1 h-14 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] h-14 bg-blue-600 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Registrar Demanda
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
