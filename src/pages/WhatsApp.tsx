import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, MessageSquare, Send, CheckCircle, Eye, X, Clock, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import type { WhatsAppCampaign } from '../types';
import { mockData } from '../hooks/mockApi';

const statusConfig = {
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
  scheduled: { label: 'Agendado', className: 'bg-blue-100 text-blue-800' },
  sending: { label: 'Enviando', className: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
};

interface CampaignFormData {
  name: string;
  description: string;
  messageTemplate: string;
  scheduledAt: string;
  status: 'draft' | 'scheduled';
  tags: string;
}

export default function WhatsApp() {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<WhatsAppCampaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    messageTemplate: '',
    scheduledAt: '',
    status: 'draft',
    tags: '',
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setCampaigns(mockData.whatsappCampaigns);
    setLoading(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      messageTemplate: '',
      scheduledAt: '',
      status: 'draft',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (campaign: WhatsAppCampaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      messageTemplate: campaign.messageTemplate,
      scheduledAt: campaign.scheduledAt || '',
      status: campaign.status === 'draft' || campaign.status === 'scheduled' ? campaign.status : 'draft',
      tags: campaign.tags.join(', '),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => 
        c.id === editingCampaign.id ? {
          ...c,
          name: formData.name,
          description: formData.description,
          messageTemplate: formData.messageTemplate,
          scheduledAt: formData.scheduledAt || undefined,
          status: formData.status as WhatsAppCampaign['status'],
          tags,
          updatedAt: new Date().toISOString(),
        } : c
      ));
    } else {
      const newCampaign: WhatsAppCampaign = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        status: formData.status as WhatsAppCampaign['status'],
        scheduledAt: formData.scheduledAt || undefined,
        messageTemplate: formData.messageTemplate,
        recipientsCount: 0,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        responsesCount: 0,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCampaigns(prev => [newCampaign, ...prev]);
    }
    closeModal();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calculatePercentage = (value: number, total: number) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  const StatBar = ({ value, total, color, label }: { value: number; total: number; color: string; label: string }) => {
    const percentage = calculatePercentage(value, total);
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-900">{value.toLocaleString('pt-BR')}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
      </div>
    );
  };

  if (loading && !campaigns.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
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
              placeholder="Buscar campanhas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendado</option>
            <option value="sending">Enviando</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredCampaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusConfig[campaign.status].className)}>
                  {statusConfig[campaign.status].label}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{campaign.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{campaign.description}</p>

              {campaign.status === 'completed' || campaign.status === 'sending' ? (
                <div className="space-y-3 mb-4">
                  <StatBar
                    value={campaign.sentCount}
                    total={campaign.recipientsCount}
                    color="bg-blue-500"
                    label="Enviadas"
                  />
                  <StatBar
                    value={campaign.deliveredCount}
                    total={campaign.sentCount}
                    color="bg-green-500"
                    label="Entregues"
                  />
                  <StatBar
                    value={campaign.readCount}
                    total={campaign.deliveredCount}
                    color="bg-purple-500"
                    label="Lidas"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{campaign.recipientsCount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  <span>{campaign.sentCount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{campaign.deliveredCount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{campaign.readCount.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {campaign.scheduledAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(campaign.scheduledAt)}</span>
                </div>
              )}

              {campaign.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {campaign.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => openEditModal(campaign)}
                className="w-full mt-3 pt-3 border-t border-gray-100 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Editar Campanha
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma campanha encontrada</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
                        </h2>
                        <p className="text-sm text-gray-500">WhatsApp</p>
                      </div>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        placeholder="Ex: Convite Evento Lançamento"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        placeholder="Breve descrição da campanha"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Mensagem</label>
                      <textarea
                        value={formData.messageTemplate}
                        onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                        className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                        placeholder="Olá! Você está convidado para o grande evento..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'scheduled' })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      >
                        <option value="draft">Rascunho</option>
                        <option value="scheduled">Agendado</option>
                      </select>
                    </div>

                    {formData.status === 'scheduled' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora de Envio</label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        placeholder="evento, lançamento, convite"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 h-10 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-10 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        {editingCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}