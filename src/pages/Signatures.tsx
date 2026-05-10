import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, PenTool, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Signature } from '../types';
import { useSignatures } from '../hooks/useApi';

const statusConfig = {
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-600' },
};

interface SignatureFormData {
  name: string;
  role: string;
  documentUrl: string;
  imageUrl: string;
  status: 'active' | 'inactive';
}

export default function Signatures() {
  const { data: signatures, loading, refresh, create, update, remove } = useSignatures();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SignatureFormData>({
    name: '',
    role: '',
    documentUrl: '',
    imageUrl: '',
    status: 'active',
  });

  const filteredSignatures = signatures.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta assinatura?')) {
      try {
        await remove(id);
      } catch (err) {
        console.error('Erro ao excluir assinatura:', err);
      }
    }
  };

  const openCreate = () => {
    setFormData({
      name: '',
      role: '',
      documentUrl: '',
      imageUrl: '',
      status: 'active',
    });
    setSelectedSignature(null);
    setIsEditing(true);
    setShowModal(true);
  };

  const openEdit = (signature: Signature) => {
    setFormData({
      name: signature.name,
      role: signature.role,
      documentUrl: signature.documentUrl || '',
      imageUrl: signature.imageUrl || '',
      status: signature.status,
    });
    setSelectedSignature(signature);
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetails = (signature: Signature) => {
    setSelectedSignature(signature);
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSignature(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) return;

    try {
      if (selectedSignature) {
        await update(selectedSignature.id, formData);
      } else {
        await create(formData);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar assinatura:', err);
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
              placeholder="Buscar assinaturas..."
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
          Nova Assinatura
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cargo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Criado em</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredSignatures.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <PenTool className="w-12 h-12 text-gray-300" />
                    <p className="text-gray-500">Nenhuma assinatura encontrada</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSignatures.map((signature) => (
                <tr key={signature.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <PenTool className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{signature.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">{signature.role}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusConfig[signature.status]?.className || 'bg-gray-100 text-gray-600')}>
                      {statusConfig[signature.status]?.label || signature.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">{formatDate(signature.createdAt)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetails(signature)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(signature)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(signature.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
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

      {loading && signatures.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedSignature && !isEditing ? 'Detalhes da Assinatura' : isEditing ? (selectedSignature ? 'Editar Assinatura' : 'Nova Assinatura') : 'Assinatura'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedSignature && !isEditing ? (
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b border-gray-100">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <PenTool className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedSignature.name}</h3>
                    <p className="text-gray-500">{selectedSignature.role}</p>
                    <span className={cn('inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium', statusConfig[selectedSignature.status]?.className || 'bg-gray-100 text-gray-600')}>
                      {statusConfig[selectedSignature.status]?.label || selectedSignature.status}
                    </span>
                  </div>

                  {selectedSignature.documentUrl && (
                    <div>
                      <span className="text-gray-500 text-xs block mb-2">Documento</span>
                      <a
                        href={selectedSignature.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="w-4 h-4" />
                        Ver documento
                      </a>
                    </div>
                  )}

                  {selectedSignature.imageUrl && (
                    <div>
                      <span className="text-gray-500 text-xs block mb-2">Imagem</span>
                      <img
                        src={selectedSignature.imageUrl}
                        alt={selectedSignature.name}
                        className="w-full max-w-xs rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-gray-500 text-xs block mb-2">Datas</span>
                    <div className="text-sm text-gray-600">
                      <p>Criado em: {formatDate(selectedSignature.createdAt)}</p>
                      <p>Atualizado em: {formatDate(selectedSignature.updatedAt)}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Deputado Federal"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL do Documento</label>
                    <input
                      type="text"
                      value={formData.documentUrl}
                      onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
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
                      disabled={!formData.name || !formData.role}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {selectedSignature ? 'Salvar Alterações' : 'Criar Assinatura'}
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