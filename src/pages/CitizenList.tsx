import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Citizen } from '../types';
import { useCitizens } from '../hooks/useApi';

const statusConfig = {
  lead: { label: 'Lead', className: 'bg-yellow-100 text-yellow-800' },
  prospect: { label: 'Prospect', className: 'bg-blue-100 text-blue-800' },
  client: { label: 'Cliente', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-600' },
};

export default function CitizenList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

  const { 
    data: citizens, 
    loading, 
    total, 
    page: currentPage, 
    totalPages, 
    refresh, 
    create, 
    update, 
    remove 
  } = useCitizens(page, 10, search);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cidadão?')) {
      await remove(id);
    }
  };

  const openDetails = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCitizen(null);
  };

  if (loading && !citizens.length) {
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
              placeholder="Buscar cidadãos..."
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
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="client">Cliente</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Cidadão
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">CPF</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Cidade/UF</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Tags</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {citizens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500">Nenhum cidadão encontrado</p>
                      <p className="text-sm text-gray-400">Tente ajustar sua busca ou filtro</p>
                    </div>
                  </td>
                </tr>
              ) : (
                citizens.map((citizen) => (
                  <tr key={citizen.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{citizen.name}</span>
                        <span className="text-xs text-gray-500 sm:hidden">{citizen.cpf}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{citizen.cpf || '-'}</span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{citizen.email || '-'}</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{citizen.phone || '-'}</span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="text-sm text-gray-500">
                        {citizen.city && citizen.state ? `${citizen.city}/${citizen.state}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusConfig[citizen.status]?.className || 'bg-gray-100 text-gray-600')}>
                        {statusConfig[citizen.status]?.label || citizen.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {citizen.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                        {citizen.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{citizen.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetails(citizen)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(citizen.id)}
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
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Mostrando {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, total)} de {total} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 px-3">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading && citizens.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showModal && selectedCitizen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Cidadão</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center pb-4 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">{selectedCitizen.name}</h3>
                <span className={cn('inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium', statusConfig[selectedCitizen.status]?.className || 'bg-gray-100 text-gray-600')}>
                  {statusConfig[selectedCitizen.status]?.label || selectedCitizen.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Endereço</span>
                    <span className="text-gray-900">
                      {selectedCitizen.city && selectedCitizen.state 
                        ? `${selectedCitizen.address || ''} ${selectedCitizen.addressNumber || ''} ${selectedCitizen.complement || ''} - ${selectedCitizen.neighborhood || ''}, ${selectedCitizen.city}/${selectedCitizen.state} ${selectedCitizen.cep || ''}`.trim()
                        : 'Endereço não informado'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Email</span>
                    <span className="text-gray-900">{selectedCitizen.email || 'Email não informado'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Telefone</span>
                    <span className="text-gray-900">{selectedCitizen.phone || 'Telefone não informado'}</span>
                  </div>
                </div>
                {selectedCitizen.cpf && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-4 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">CPF</span>
                      <span className="text-gray-900">{selectedCitizen.cpf}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedCitizen.tags.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-gray-500 text-xs block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCitizen.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCitizen.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-gray-500 text-xs block mb-2">Observações</span>
                  <p className="text-sm text-gray-900">{selectedCitizen.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}