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
  User
} from 'lucide-react';
import { mockData } from '../hooks/mockApi';
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

export default function Requests() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    requesterId: '',
    subject: '',
    neighborhood: '',
    priority: 'medium',
    description: '',
    title: ''
  });

  const filteredRequests = useMemo(() => {
    let requests = [...mockData.requests];
    
    if (activeTab !== 'all') {
      requests = requests.filter(r => r.status === activeTab);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      requests = requests.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.requesterName.toLowerCase().includes(searchLower) ||
        (r.subject && r.subject.toLowerCase().includes(searchLower)) ||
        (r.neighborhood && r.neighborhood.toLowerCase().includes(searchLower))
      );
    }
    
    return requests;
  }, [activeTab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mockData.requests.length };
    statusTabs.slice(1).forEach(tab => {
      c[tab.key] = mockData.requests.filter(r => r.status === tab.key).length;
    });
    return c;
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const citizen = mockData.citizens.find(c => c.id === formData.requesterId);
    
    const newRequest: Request = {
      id: Date.now().toString(),
      title: formData.title || formData.subject,
      description: formData.description,
      subject: formData.subject,
      neighborhood: formData.neighborhood,
      category: 'request',
      priority: formData.priority as any,
      status: 'open',
      requesterId: formData.requesterId,
      requesterName: citizen?.name || 'Cidadão Avulso',
      requesterPhone: citizen?.phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockData.requests.unshift(newRequest);
    setIsModalOpen(false);
    setFormData({ requesterId: '', subject: '', neighborhood: '', priority: 'medium', description: '', title: '' });
  };

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
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{request.requesterName}</div>
                        <div className="text-xs text-gray-500">{request.requesterPhone}</div>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Demanda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Nova Demanda Popular</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cidadão Solicitante</label>
                  <select 
                    required
                    value={formData.requesterId}
                    onChange={e => setFormData({...formData, requesterId: e.target.value})}
                    className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="">Selecione um cidadão...</option>
                    {mockData.citizens.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assunto</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Iluminação"
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bairro</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Centro"
                        value={formData.neighborhood}
                        onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                        className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridade</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p})}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded-lg border transition-all uppercase tracking-wider",
                          formData.priority === p 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" 
                            : "bg-white border-gray-200 text-gray-500 hover:border-blue-300"
                        )}
                      >
                        {priorityLabels[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição da Demanda</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Descreva o que o cidadão solicitou..."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  Cadastrar Demanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}