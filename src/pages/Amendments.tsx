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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: amendments, loading, create, update, remove } = useAmendments();

  const [formData, setFormData] = useState({
    number: '',
    year: new Date().getFullYear(),
    author: '',
    coAuthors: '',
    subject: '',
    description: '',
    budget: 0,
    category: 'education' as Amendment['category'],
    status: 'draft' as Amendment['status'],
    location: '',
    beneficiaries: '',
  });

  const openCreate = () => {
    setFormData({
      number: '',
      year: new Date().getFullYear(),
      author: '',
      coAuthors: '',
      subject: '',
      description: '',
      budget: 0,
      category: 'education',
      status: 'draft',
      location: '',
      beneficiaries: '',
    });
    setSelectedAmendment(null);
    setIsEditing(true);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (am: Amendment) => {
    setFormData({
      number: am.number,
      year: am.year,
      author: am.author,
      coAuthors: am.coAuthors?.join(', ') || '',
      subject: am.subject,
      description: am.description,
      budget: am.budget || 0,
      category: am.category,
      status: am.status,
      location: am.location || '',
      beneficiaries: am.beneficiaries || '',
    });
    setSelectedAmendment(am);
    setIsEditing(true);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.number || !formData.author || !formData.subject) {
      setFormError('Número, autor e tema são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        coAuthors: formData.coAuthors ? formData.coAuthors.split(',').map(s => s.trim()) : [],
        budget: formData.budget || undefined,
      };
      if (selectedAmendment) {
        await update(selectedAmendment.id, payload);
      } else {
        await create(payload);
      }
      setShowModal(false);
      setIsEditing(false);
      setSelectedAmendment(null);
    } catch {
      setFormError('Erro ao salvar emenda.');
    } finally {
      setSaving(false);
    }
  };

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
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
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
                      <button onClick={() => openEdit(am)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!isEditing) { setShowModal(false); } }}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {isEditing ? (selectedAmendment ? `Editar Emenda nº ${selectedAmendment.number}` : 'Nova Emenda') : selectedAmendment ? `Emenda nº ${selectedAmendment.number}/${selectedAmendment.year}` : ''}
              </h2>
              <button onClick={() => { setShowModal(false); setIsEditing(false); setSelectedAmendment(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isEditing ? (
                <>
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                    <input type="text" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                      <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Amendment['category']})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        {categoryOptions.filter(c => c.value).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
                    <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coautores (separados por vírgula)</label>
                    <input type="text" value={formData.coAuthors} onChange={e => setFormData({...formData, coAuthors: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Nome 1, Nome 2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tema *</label>
                    <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
                      <input type="number" value={formData.budget || ''} onChange={e => setFormData({...formData, budget: parseFloat(e.target.value) || 0})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Amendment['status']})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        {statusOptions.filter(s => s.value).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiários</label>
                    <input type="text" value={formData.beneficiaries} onChange={e => setFormData({...formData, beneficiaries: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => { setShowModal(false); setIsEditing(false); setSelectedAmendment(null); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {saving ? 'Salvando...' : selectedAmendment ? 'Salvar Alterações' : 'Criar Emenda'}
                    </button>
                  </div>
                </>
              ) : selectedAmendment ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}