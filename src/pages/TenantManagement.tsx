import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Building2, Mail, Phone, CheckCircle2, XCircle, AlertTriangle, Clock, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Tenant, Plan } from '../types';
import { useTenants, usePlans } from '../hooks/useApi';
import { useStore } from '../stores/appStore';

const statusOptions = [
  { value: 'active', label: 'Ativa', color: 'bg-green-100 text-green-700' },
  { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-700' },
  { value: 'suspended', label: 'Suspensa', color: 'bg-red-100 text-red-700' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
];

interface TenantFormData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  document: string;
  planId: string;
  status: Tenant['status'];
}

export default function TenantManagement() {
  const { data: tenants, total, loading, refresh, create, update, remove } = useTenants(1, 100);
  const { data: plans } = usePlans();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { setUser, setTenantOverride, user } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<TenantFormData>({
    name: '', slug: '', email: '', phone: '', document: '', planId: 'plan_basic', status: 'trial',
  });

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreate = () => {
    setFormData({ name: '', slug: '', email: '', phone: '', document: '', planId: 'plan_basic', status: 'trial' });
    setEditingId(null);
    setSelectedTenant(null);
    setIsEditing(true);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (t: Tenant) => {
    setFormData({ name: t.name, slug: t.slug, email: t.email, phone: t.phone || '', document: t.document || '', planId: t.planId, status: t.status });
    setEditingId(t.id);
    setSelectedTenant(t);
    setIsEditing(true);
    setFormError('');
    setShowModal(true);
  };

  const openDetails = (t: Tenant) => {
    setSelectedTenant(t);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.email) {
      setFormError('Nome, slug e email são obrigatórios.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        settings: {
          timezone: 'America/Sao_Paulo', locale: 'pt-BR', theme: 'light' as const,
          businessHours: [
            { day: 1, open: '08:00', close: '18:00', enabled: true },
            { day: 2, open: '08:00', close: '18:00', enabled: true },
            { day: 3, open: '08:00', close: '18:00', enabled: true },
            { day: 4, open: '08:00', close: '18:00', enabled: true },
            { day: 5, open: '08:00', close: '17:00', enabled: true },
            { day: 6, open: '', close: '', enabled: false },
            { day: 0, open: '', close: '', enabled: false },
          ],
          primaryColor: '#2563eb',
        },
      };
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }
      setShowModal(false); setIsEditing(false); setEditingId(null);
    } catch {
      setFormError('Erro ao salvar conta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta? Todos os dados serão perdidos.')) {
      await remove(id);
    }
  };

  const handleAccessAsTenant = (t: Tenant) => {
    setTenantOverride(t.id, t.name);
  };

  const getPlanName = (planId: string) => {
    return plans.find(p => p.id === planId)?.name || planId;
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR');

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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Contas</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar contas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os status</option>
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} registro(s)</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Conta</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Plano</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Usuários</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Criada em</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Nenhuma conta encontrada</td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{t.name}</span>
                          <span className="text-xs text-gray-400 block">{t.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500">{getPlanName(t.planId)}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{t.assignedUsers}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusOptions.find(s => s.value === t.status)?.color || 'bg-gray-100 text-gray-600')}>
                        {statusOptions.find(s => s.value === t.status)?.label || t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{formatDate(t.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetails(t)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAccessAsTenant(t)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg" title="Acessar como">
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg" title="Excluir">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!isEditing) { setShowModal(false); } }}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {isEditing ? (editingId ? 'Editar Conta' : 'Nova Conta') : selectedTenant?.name}
              </h2>
              <button onClick={() => { setShowModal(false); setIsEditing(false); setEditingId(null); setSelectedTenant(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>)}
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                      <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                      <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                      <select value={formData.planId} onChange={e => setFormData({...formData, planId: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}/mês</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Tenant['status']})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => { setShowModal(false); setIsEditing(false); setEditingId(null); setSelectedTenant(null); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Conta'}
                    </button>
                  </div>
                </>
              ) : selectedTenant ? (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{selectedTenant.email}</span>
                  </div>
                  {selectedTenant.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedTenant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>Plano: {getPlanName(selectedTenant.planId)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusOptions.find(s => s.value === selectedTenant.status)?.color || 'bg-gray-100 text-gray-600')}>
                      {statusOptions.find(s => s.value === selectedTenant.status)?.label || selectedTenant.status}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-gray-500 text-xs block mb-2">Informações</span>
                    <div className="text-sm text-gray-600">
                      <p>Slug: /{selectedTenant.slug}</p>
                      <p>Usuários: {selectedTenant.assignedUsers}</p>
                      <p>Criada em: {formatDate(selectedTenant.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button onClick={() => handleAccessAsTenant(selectedTenant)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      <LogIn className="w-4 h-4" />
                      Acessar como {selectedTenant.name}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
