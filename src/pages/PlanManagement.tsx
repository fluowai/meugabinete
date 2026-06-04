import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, CreditCard, Check, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Plan } from '../types';
import { usePlans } from '../hooks/useApi';

const intervalLabels: Record<string, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
};

export default function PlanManagement() {
  const { data: plans, loading, create, update, remove } = usePlans();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'BRL',
    interval: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    active: true,
    limits: {
      maxCitizens: 1000, maxRequests: 100, maxOrganizations: 50,
      maxAppointments: 100, maxCollaborators: 5, maxMobilizations: 20,
      maxLandingPages: 5, maxAmendments: 50, maxWhatsAppCampaigns: 10,
      maxEmailCampaigns: 10, maxTeamMembers: 5, maxStorageMb: 1000,
      hasWhatsApp: true, hasAI: false, hasReports: true, hasApi: false, hasPrioritySupport: false,
    },
  });

  const openCreate = () => {
    setFormData({
      name: '', description: '', price: 0, currency: 'BRL', interval: 'monthly',
      features: [''], active: true,
      limits: { maxCitizens: 1000, maxRequests: 100, maxOrganizations: 50, maxAppointments: 100, maxCollaborators: 5, maxMobilizations: 20, maxLandingPages: 5, maxAmendments: 50, maxWhatsAppCampaigns: 10, maxEmailCampaigns: 10, maxTeamMembers: 5, maxStorageMb: 1000, hasWhatsApp: true, hasAI: false, hasReports: true, hasApi: false, hasPrioritySupport: false },
    });
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (p: Plan) => {
    setFormData({
      name: p.name, description: p.description, price: p.price, currency: p.currency,
      interval: p.interval, features: p.features.length ? p.features : [''], active: p.active,
      limits: { ...p.limits },
    });
    setEditingId(p.id);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) { setFormError('Nome é obrigatório.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = { ...formData, features: formData.features.filter(f => f.trim()) };
      if (editingId) { await update(editingId, payload); }
      else { await create(payload); }
      setShowModal(false); setEditingId(null);
    } catch { setFormError('Erro ao salvar plano.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      await remove(id);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={cn("bg-white rounded-xl border-2 p-6", plan.active ? "border-gray-200" : "border-gray-100 opacity-75")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(plan)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
              <span className="text-sm text-gray-500 ml-1">/{intervalLabels[plan.interval]}</span>
            </div>
            {!plan.active && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mb-3 inline-block">Inativo</span>}
            <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar Plano' : 'Novo Plano'}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funcionalidades (uma por linha)</label>
                <textarea value={formData.features.join('\n')} onChange={e => setFormData({...formData, features: e.target.value.split('\n')})} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Limites</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(formData.limits).filter(([key]) => !key.startsWith('has')).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{key.replace(/^max/, '').replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input type="number" value={value as number} onChange={e => setFormData({...formData, limits: { ...formData.limits, [key]: parseInt(e.target.value) || 0 }})} className="w-full h-8 px-2 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recursos (ativados)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(formData.limits).filter(([key]) => key.startsWith('has')).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={value as boolean} onChange={e => setFormData({...formData, limits: { ...formData.limits, [key]: e.target.checked }})} className="rounded border-gray-300" />
                      {key.replace(/^has/, '').replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="rounded border-gray-300" />
                <label className="text-sm text-gray-700">Plano ativo</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
