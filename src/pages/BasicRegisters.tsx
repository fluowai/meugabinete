import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Building2, Tag, MapPin, Layers, Briefcase, Map } from 'lucide-react';
import { cn } from '../lib/utils';
import type { BasicRegister } from '../types';
import { mockData } from '../hooks/mockApi';

const categoryConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  party: { label: 'Partido', className: 'bg-blue-100 text-blue-800', icon: Building2 },
  position: { label: 'Cargo', className: 'bg-purple-100 text-purple-800', icon: Tag },
  sector: { label: 'Setor', className: 'bg-green-100 text-green-800', icon: Layers },
  unity: { label: 'Unidade', className: 'bg-orange-100 text-orange-800', icon: Building2 },
  zone: { label: 'Zona', className: 'bg-yellow-100 text-yellow-800', icon: MapPin },
  county: { label: 'Município', className: 'bg-red-100 text-red-800', icon: Map },
};

const statusConfig = {
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-600' },
};

interface BasicRegisterFormData {
  category: 'party' | 'position' | 'sector' | 'unity' | 'zone' | 'county';
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
}

export default function BasicRegisters() {
  const [registers, setRegisters] = useState<BasicRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<BasicRegister | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BasicRegisterFormData>({
    category: 'party',
    name: '',
    code: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    loadRegisters();
  }, []);

  const loadRegisters = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setRegisters(mockData.basicRegisters);
    setLoading(false);
  };

  const filteredRegisters = registers.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || r.category === categoryFilter;
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      const index = mockData.basicRegisters.findIndex(r => r.id === id);
      if (index >= 0) {
        mockData.basicRegisters.splice(index, 1);
        await loadRegisters();
      }
    }
  };

  const openCreate = () => {
    setFormData({
      category: 'party',
      name: '',
      code: '',
      description: '',
      status: 'active',
    });
    setSelectedRegister(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const openEdit = (register: BasicRegister) => {
    setFormData({
      category: register.category,
      name: register.name,
      code: register.code || '',
      description: register.description || '',
      status: register.status,
    });
    setSelectedRegister(register);
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetails = (register: BasicRegister) => {
    setSelectedRegister(register);
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRegister(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    const now = new Date().toISOString();
    if (selectedRegister) {
      const index = mockData.basicRegisters.findIndex(r => r.id === selectedRegister.id);
      if (index >= 0) {
        mockData.basicRegisters[index] = {
          ...mockData.basicRegisters[index],
          ...formData,
          updatedAt: now,
        };
      }
    } else {
      const newRegister: BasicRegister = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      mockData.basicRegisters.push(newRegister);
    }

    await loadRegisters();
    closeModal();
  };

  const categoryOptions = [
    { value: 'party', label: 'Partido' },
    { value: 'position', label: 'Cargo' },
    { value: 'sector', label: 'Setor' },
    { value: 'unity', label: 'Unidade' },
    { value: 'zone', label: 'Zona' },
    { value: 'county', label: 'Município' },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading && !registers.length) {
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
              placeholder="Buscar registros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todas as categorias</option>
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Criado em</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegisters.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500">Nenhum registro encontrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRegisters.map((register) => {
                const config = categoryConfig[register.category];
                const Icon = config?.icon || Building2;
                return (
                  <tr key={register.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-900">{register.code || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900">{register.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', config?.className || 'bg-gray-100 text-gray-600')}>
                        {config?.label || register.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusConfig[register.status]?.className || 'bg-gray-100 text-gray-600')}>
                        {statusConfig[register.status]?.label || register.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">{formatDate(register.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetails(register)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(register)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(register.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {loading && registers.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedRegister && !isEditing ? 'Detalhes do Registro' : isEditing ? (selectedRegister ? 'Editar Registro' : 'Novo Registro') : 'Registro'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedRegister && !isEditing ? (
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedRegister.name}</h3>
                    <span className={cn('inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium', categoryConfig[selectedRegister.category]?.className || 'bg-gray-100 text-gray-600')}>
                      {categoryConfig[selectedRegister.category]?.label || selectedRegister.category}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Código</span>
                      <span className="text-gray-900 font-medium">{selectedRegister.code || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Descrição</span>
                      <span className="text-gray-900">{selectedRegister.description || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Status</span>
                      <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium w-fit', statusConfig[selectedRegister.status]?.className || 'bg-gray-100 text-gray-600')}>
                        {statusConfig[selectedRegister.status]?.label || selectedRegister.status}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Datas</span>
                      <div className="text-sm text-gray-600">
                        <p>Criado em: {formatDate(selectedRegister.createdAt)}</p>
                        <p>Atualizado em: {formatDate(selectedRegister.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as BasicRegisterFormData['category'] })}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      {categoryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do registro"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Código único"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição opcional"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!formData.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedRegister ? 'Salvar Alterações' : 'Criar Registro'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}