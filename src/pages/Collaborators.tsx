import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Mail, Phone, X, Users, UserCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Collaborator } from '../types';
import { useCollaborators } from '../hooks/useApi';

const statusConfig = {
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-600' },
};

interface CollaboratorFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
}

export default function Collaborators() {
  const { data: collaborators, loading, refresh, create, update, remove } = useCollaborators();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CollaboratorFormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active',
  });

  const filteredCollaborators = collaborators.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este colaborador?')) {
      try {
        await remove(id);
      } catch (err) {
        console.error('Erro ao excluir colaborador:', err);
      }
    }
  };

  const openCreate = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      status: 'active',
    });
    setSelectedCollaborator(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const openEdit = (collaborator: Collaborator) => {
    setFormData({
      name: collaborator.name,
      email: collaborator.email,
      phone: collaborator.phone || '',
      role: collaborator.role,
      department: collaborator.department || '',
      status: collaborator.status,
    });
    setSelectedCollaborator(collaborator);
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetails = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCollaborator(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) return;

    try {
      if (selectedCollaborator) {
        await update(selectedCollaborator.id, formData);
      } else {
        await create(formData);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
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
              placeholder="Buscar colaboradores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
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
          Novo Colaborador
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Departamento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollaborators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Nenhum colaborador encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCollaborators.map((collaborator) => (
                  <tr key={collaborator.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{collaborator.name}</span>
                        <span className="text-[10px] text-gray-400 sm:hidden">{collaborator.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{collaborator.email}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{collaborator.phone || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500">{collaborator.role}</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{collaborator.department || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 rounded-full text-[10px] font-medium', statusConfig[collaborator.status]?.className || 'bg-gray-100 text-gray-600')}>
                        {statusConfig[collaborator.status]?.label || collaborator.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetails(collaborator)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(collaborator)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(collaborator.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Excluir"
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
      </div>

      {loading && collaborators.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCollaborator && !isEditing ? 'Detalhes do Colaborador' : isEditing ? (selectedCollaborator ? 'Editar Colaborador' : 'Novo Colaborador') : 'Colaborador'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedCollaborator && !isEditing ? (
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCollaborator.name}</h3>
                    <span className={cn('inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium', statusConfig[selectedCollaborator.status]?.className || 'bg-gray-100 text-gray-600')}>
                      {statusConfig[selectedCollaborator.status]?.label || selectedCollaborator.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Email</span>
                        <span className="text-gray-900">{selectedCollaborator.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Telefone</span>
                        <span className="text-gray-900">{selectedCollaborator.phone || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <UserCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Cargo</span>
                        <span className="text-gray-900">{selectedCollaborator.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs">Departamento</span>
                        <span className="text-gray-900">{selectedCollaborator.department || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-gray-500 text-xs block mb-2">Datas</span>
                    <div className="text-sm text-gray-600">
                      <p>Criado em: {formatDate(selectedCollaborator.createdAt)}</p>
                      <p>Atualizado em: {formatDate(selectedCollaborator.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Assessor Parlamentar"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Ex: Gabinete"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                      disabled={!formData.name || !formData.email}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedCollaborator ? 'Salvar Alterações' : 'Criar Colaborador'}
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