import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, DollarSign, X, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Amendment } from '../types';
import { useAmendments } from '../hooks/useApi';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'proposed', label: 'Proposto' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Rejeitado' },
  { value: 'withdrawn', label: 'Retirado' },
];

const categoryOptions = [
  { value: '', label: 'Todas' },
  { value: 'education', label: 'Educação' },
  { value: 'health', label: 'Saúde' },
  { value: 'infrastructure', label: 'Infraestrutura' },
  { value: 'security', label: 'Segurança' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Outro' },
];

const statusBadgeColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  proposed: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

const categoryBadgeColors: Record<string, string> = {
  education: 'bg-blue-100 text-blue-700',
  health: 'bg-green-100 text-green-700',
  infrastructure: 'bg-orange-100 text-orange-700',
  security: 'bg-red-100 text-red-700',
  social: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Amendments() {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAmendment, setSelectedAmendment] = useState<Amendment | null>(null);

  const { data: amendments, loading, refresh, remove } = useAmendments();

  const filteredAmendments = amendments.filter(am => {
    if (statusFilter && am.status !== statusFilter) return false;
    if (categoryFilter && am.category !== categoryFilter) return false;
    if (yearFilter && am.year.toString() !== yearFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        am.subject.toLowerCase().includes(search) ||
        am.author.toLowerCase().includes(search) ||
        am.number.includes(search)
      );
    }
    return true;
  });

  const years = [...new Set(amendments.map(a => a.year))].sort((a, b) => b - a);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta emenda?')) {
      await remove(id);
    }
  };

  const handleView = (am: Amendment) => {
    setSelectedAmendment(am);
    setShowModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Emendas</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Emenda
        </button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar emendas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categoryOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os anos</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{filteredAmendments.length} registro(s)</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Número</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ano</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Autor</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tema</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Orçamento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAmendments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Nenhuma emenda encontrada
                </td>
              </tr>
            ) : (
              filteredAmendments.map((am) => (
                <tr key={am.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{am.number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{am.year}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{am.author}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{am.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    {am.budget ? (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(am.budget)}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", categoryBadgeColors[am.category])}>
                      {categoryOptions.find(c => c.value === am.category)?.label || am.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusBadgeColors[am.status])}>
                      {statusOptions.find(s => s.value === am.status)?.label || am.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleView(am)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(am.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedAmendment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Emenda nº {selectedAmendment.number}/{selectedAmendment.year}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusBadgeColors[selectedAmendment.status])}>
                  {statusOptions.find(s => s.value === selectedAmendment.status)?.label || selectedAmendment.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Categoria:</span>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", categoryBadgeColors[selectedAmendment.category])}>
                  {categoryOptions.find(c => c.value === selectedAmendment.category)?.label || selectedAmendment.category}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Autor</h3>
                <p className="text-sm text-gray-500">{selectedAmendment.author}</p>
              </div>
              {selectedAmendment.coAuthors && selectedAmendment.coAuthors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Coautores</h3>
                  <p className="text-sm text-gray-500">{selectedAmendment.coAuthors.join(', ')}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-700">Tema</h3>
                <p className="text-sm text-gray-500">{selectedAmendment.subject}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Descrição</h3>
                <p className="text-sm text-gray-500">{selectedAmendment.description}</p>
              </div>
              {selectedAmendment.budget && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Orçamento</h3>
                  <p className="text-sm text-gray-500">{formatCurrency(selectedAmendment.budget)}</p>
                </div>
              )}
              {selectedAmendment.location && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Local</h3>
                  <p className="text-sm text-gray-500">{selectedAmendment.location}</p>
                </div>
              )}
              {selectedAmendment.beneficiaries && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Beneficiários</h3>
                  <p className="text-sm text-gray-500">{selectedAmendment.beneficiaries}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}