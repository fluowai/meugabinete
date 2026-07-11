import { logger } from '@/utils/logger';
import React, { useEffect, useState } from 'react';
import { Check, CreditCard, Edit2, Plus, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  currency?: string;
  limits: {
    users: number;
    properties: number;
    whatsapp_instances: number;
  };
  features: string[];
  is_active: boolean;
}

const AVAILABLE_FEATURES = [
  { id: 'crm', label: 'CRM de Demandas' },
  { id: 'whatsapp', label: 'WhatsApp centralizado' },
  { id: 'ia_triage', label: 'IA de triagem' },
  { id: 'reports', label: 'Relatorios e prestacao de contas' },
  { id: 'team', label: 'Gestao de equipe' },
  { id: 'api', label: 'Acesso API' },
];

const emptyPlan: Partial<Plan> = {
  name: '',
  price_monthly: 0,
  limits: { users: 1, properties: 100, whatsapp_instances: 1 },
  features: [],
  is_active: true,
};

const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Plan>>(emptyPlan);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (error) logger.error('Error fetching plans:', error);
    else setPlans(data || []);
    setLoading(false);
  };

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingId(plan.id);
      setFormData({ ...plan });
    } else {
      setEditingId(null);
      setFormData({ ...emptyPlan });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingId) {
        await supabase.from('plans').update(formData).eq('id', editingId);
      } else {
        await supabase.from('plans').insert([formData]);
      }
      await fetchPlans();
      setIsModalOpen(false);
    } catch (error) {
      logger.error(error);
      alert('Erro ao salvar plano');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso pode afetar gabinetes usando este plano.')) return;
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) alert('Erro ao deletar. O plano pode estar em uso.');
    else fetchPlans();
  };

  const toggleFeature = (featureId: string) => {
    const current = Array.isArray(formData.features) ? formData.features : [];
    setFormData({
      ...formData,
      features: current.includes(featureId)
        ? current.filter((feature) => feature !== featureId)
        : [...current, featureId],
    });
  };

  if (loading) return <div>Carregando planos...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar planos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus size={20} /> Novo plano
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border bg-white p-6 shadow ${
              !plan.is_active ? 'opacity-60 grayscale' : 'border-blue-100'
            }`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {Number(plan.price_monthly || 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(plan)}
                  className="rounded p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mb-4 space-y-2 text-sm text-gray-600">
              <LimitRow label="Demandas/mes" value={plan.limits?.properties || 0} />
              <LimitRow label="Usuarios" value={plan.limits?.users || 0} />
              <LimitRow label="WhatsApp" value={plan.limits?.whatsapp_instances || 0} />
            </div>

            <div className="flex flex-wrap gap-2">
              {(Array.isArray(plan.features) ? plan.features : []).map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                >
                  <Check size={12} />
                  {feature}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <CreditCard size={20} />
                {editingId ? 'Editar plano' : 'Novo plano'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Nome</span>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border px-3 py-2"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Preco mensal (R$)</span>
                  <input
                    type="number"
                    required
                    className="w-full rounded-lg border px-3 py-2"
                    value={formData.price_monthly || 0}
                    onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-800">Limites</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <LimitInput
                    label="Demandas/mes"
                    value={formData.limits?.properties || 0}
                    onChange={(properties) =>
                      setFormData({ ...formData, limits: { ...formData.limits!, properties } })
                    }
                  />
                  <LimitInput
                    label="Usuarios"
                    value={formData.limits?.users || 0}
                    onChange={(users) => setFormData({ ...formData, limits: { ...formData.limits!, users } })}
                  />
                  <LimitInput
                    label="WhatsApp"
                    value={formData.limits?.whatsapp_instances || 0}
                    onChange={(whatsapp_instances) =>
                      setFormData({ ...formData, limits: { ...formData.limits!, whatsapp_instances } })
                    }
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-800">Funcionalidades</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <label
                      key={feature.id}
                      className="flex cursor-pointer items-center gap-2 rounded border p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.features) && formData.features.includes(feature.id)}
                        onChange={() => toggleFeature(feature.id)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700">Plano ativo</span>
              </label>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {formLoading ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LimitRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between border-b pb-1">
    <span>{label}:</span>
    <strong>{value}</strong>
  </div>
);

const LimitInput: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label className="block">
    <span className="mb-1 block text-xs text-gray-500">{label}</span>
    <input
      type="number"
      className="w-full rounded-lg border px-3 py-2"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

export default PlanManager;
