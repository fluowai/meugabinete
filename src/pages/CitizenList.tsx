import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Phone,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { Citizen } from '../types';
import { useCitizens } from '../hooks/useApi';
import { supabase } from '../lib/supabase';

interface CEPAddress {
  cep: string;
  address: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

const getBackendBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';
  if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  return baseUrl;
};

async function fetchFreeCEP(cep: string): Promise<CEPAddress> {
  const cleanCep = cep.replace(/\D/g, '');
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const response = await fetch(`${getBackendBaseUrl()}/api/cep/${cleanCep}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (response.ok) {
      return response.json();
    }
  } catch {
    // The backend proxies free CEP providers; this fallback keeps local forms usable.
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  const data = await response.json();
  if (!response.ok || data.erro) {
    throw new Error('CEP nao encontrado.');
  }
  return {
    cep: data.cep,
    address: data.logradouro,
    complement: data.complemento,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  };
}

const statusConfig = {
  lead: { label: 'Novo', className: 'bg-yellow-100 text-yellow-800' },
  prospect: { label: 'Recorrente', className: 'bg-blue-100 text-blue-800' },
  client: { label: 'Engajado', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-600' },
};

export default function CitizenList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    status: 'lead' as Citizen['status'],
    notes: '',
  });
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [editingCitizenId, setEditingCitizenId] = useState<string | null>(null);
  const [searchingCep, setSearchingCep] = useState(false);

  const { 
    data: citizens, 
    loading, 
    total, 
    page: currentPage, 
    totalPages, 
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

  const openCreateModal = () => {
    setFormError('');
    setEditingCitizenId(null);
    setFormData({
      name: '',
      phone: '',
      cep: '',
      address: '',
      addressNumber: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      status: 'lead',
      notes: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (citizen: Citizen) => {
    setFormError('');
    setEditingCitizenId(citizen.id);
    setFormData({
      name: citizen.name || '',
      phone: citizen.phone || '',
      cep: citizen.cep || '',
      address: citizen.address || '',
      addressNumber: citizen.addressNumber || '',
      complement: citizen.complement || '',
      neighborhood: citizen.neighborhood || '',
      city: citizen.city || '',
      state: citizen.state || '',
      status: citizen.status || 'lead',
      notes: citizen.notes || '',
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;
    setShowCreateModal(false);
    setFormError('');
    setEditingCitizenId(null);
  };

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
          const numInput = document.getElementById('addressNumberInput');
          if (numInput) numInput.focus();
        }, 100);
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        setFormError('Nao foi possivel consultar o CEP gratuito.');
      } finally {
        setSearchingCep(false);
      }
    }
  };

  const handleSaveCitizen = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Informe o nome do cidadão.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        cep: formData.cep.trim() || null,
        address: formData.address.trim() || null,
        address_number: formData.addressNumber.trim() || null,
        complement: formData.complement.trim() || null,
        neighborhood: formData.neighborhood.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim().toUpperCase() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
      };

      if (editingCitizenId) {
        await update(editingCitizenId, payload);
      } else {
        await create(payload);
      }
      setPage(1);
      closeCreateModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar o cidadão.');
    } finally {
      setSaving(false);
    }
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
            <option value="lead">Novo</option>
            <option value="prospect">Recorrente</option>
            <option value="client">Engajado</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cidadão
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] md:min-w-0">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
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
                  <td colSpan={6} className="px-6 py-16 text-center">
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
                        <span className="text-xs text-gray-500 md:hidden">{citizen.phone || '-'}</span>
                      </div>
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
                          onClick={() => openEditModal(citizen)}
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

      {showCreateModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeCreateModal}>
          <form
            onSubmit={handleSaveCitizen}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCitizenId ? 'Editar cidadão' : 'Novo cidadão'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingCitizenId ? 'Atualize os dados e informações do cidadão.' : 'Cadastre os dados básicos para atendimento.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Nome completo"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Citizen['status'] })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="lead">Novo</option>
                    <option value="prospect">Recorrente</option>
                    <option value="client">Engajado</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Seção de Endereço Residencial com Busca por CEP */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Endereço Residencial</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <div className="relative">
                      <input
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        maxLength={9}
                        className="w-full h-11 px-3 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

                <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr] gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro (Rua/Avenida)</label>
                    <input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Ex: Av. Paulista"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                    <input
                      id="addressNumberInput"
                      value={formData.addressNumber}
                      onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                    <input
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Ex: Apto 101, Bloco A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                    <input
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Ex: Centro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr] gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">UF</label>
                    <input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.slice(0, 2) })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="UF"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Contexto do atendimento, demanda inicial ou observações importantes."
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || searchingCep}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? 'Salvando...' : editingCitizenId ? 'Salvar alterações' : 'Cadastrar cidadão'}
              </button>
            </div>
          </form>
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
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Telefone</span>
                    <span className="text-gray-900">{selectedCitizen.phone || 'Telefone não informado'}</span>
                  </div>
                </div>
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

