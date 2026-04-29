import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X,
  MessageSquare,
  Eye
} from 'lucide-react';
import { mockData } from '../hooks/mockApi';
import type { Request } from '../types';

type StatusTab = 'all' | 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'open', label: 'Abertas' },
  { key: 'in-progress', label: 'Em Progresso' },
  { key: 'waiting', label: 'Aguardando' },
  { key: 'resolved', label: 'Resolvidas' },
  { key: 'closed', label: 'Fechadas' },
];

const categoryColors: Record<string, string> = {
  information: 'bg-blue-100 text-blue-800',
  complaint: 'bg-red-100 text-red-800',
  suggestion: 'bg-yellow-100 text-yellow-800',
  request: 'bg-green-100 text-green-800',
  compliment: 'bg-purple-100 text-purple-800',
};

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

const categoryLabels: Record<string, string> = {
  information: 'Informação',
  complaint: 'Reclamação',
  suggestion: 'Sugestão',
  request: 'Solicitação',
  compliment: 'Elogio',
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
        (r.assignedToName && r.assignedToName.toLowerCase().includes(searchLower))
      );
    }
    
    return requests;
  }, [activeTab, search]);

  const getCounts = () => {
    const counts: Record<string, number> = { all: mockData.requests.length };
    statusTabs.slice(1).forEach(tab => {
      counts[tab.key] = mockData.requests.filter(r => r.status === tab.key).length;
    });
    return counts;
  };

  const counts = getCounts();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar solicitações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Solicitação
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
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{request.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[request.category]}`}>
                        {categoryLabels[request.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priorityColors[request.priority]}`}>
                        {priorityLabels[request.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status].bg} ${statusColors[request.status].text}`}>
                        {statusColors[request.status].icon}
                        {statusLabels[request.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {request.requesterName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {request.assignedToName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}