import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Send, Eye, MousePointer, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { EmailCampaign } from '../types';
import { mockData } from '../hooks/mockApi';

const statusConfig = {
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'Agendada', className: 'bg-blue-100 text-blue-700' },
  sending: { label: 'Enviando', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
};

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    status: 'draft' as EmailCampaign['status'],
  });

  const loadCampaigns = async () => {
    setLoading(true);
    const data = await mockData.getEmailCampaigns();
    setCampaigns(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setFormData({ name: '', subject: '', body: '', status: 'draft' });
    setSelectedCampaign(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (campaign: EmailCampaign) => {
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
      status: campaign.status,
    });
    setSelectedCampaign(campaign);
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetails = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCampaign(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject) return;

    const now = new Date().toISOString();
    if (isEditing && selectedCampaign) {
      const updated: EmailCampaign = {
        ...selectedCampaign,
        ...formData,
        updatedAt: now,
      };
      const index = mockData.emailCampaigns.findIndex(c => c.id === selectedCampaign.id);
      if (index >= 0) {
        mockData.emailCampaigns[index] = updated;
      }
    } else {
      const newCampaign: EmailCampaign = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...formData,
        recipientsCount: 0,
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      mockData.emailCampaigns.push(newCampaign);
    }

    await loadCampaigns();
    closeModal();
  };

  if (loading && !campaigns.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      <div className="grid gap-4">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma campanha encontrada</p>
            <p className="text-sm text-gray-400">Tente ajustar sua busca</p>
          </div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusConfig[campaign.status]?.className)}>
                      {statusConfig[campaign.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{campaign.subject}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{campaign.sentCount.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-400">enviados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{campaign.openCount.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-400">abertos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MousePointer className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{campaign.clickCount.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-400">cliques</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(campaign)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(campaign)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {loading && campaigns.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCampaign && !isEditing ? 'Detalhes da Campanha' : isEditing ? 'Editar Campanha' : 'Nova Campanha'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedCampaign && !isEditing ? (
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCampaign.name}</h3>
                    <span className={cn('inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium', statusConfig[selectedCampaign.status]?.className)}>
                      {statusConfig[selectedCampaign.status]?.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 text-xs block mb-1">Assunto</span>
                    <p className="text-gray-900">{selectedCampaign.subject}</p>
                  </div>

                  <div>
                    <span className="text-gray-500 text-xs block mb-1">Corpo do Email</span>
                    <div
                      className="p-4 bg-gray-50 rounded-lg text-gray-900 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedCampaign.body }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{selectedCampaign.recipientsCount.toLocaleString('pt-BR')}</div>
                      <div className="text-sm text-gray-500">Destinatários</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{selectedCampaign.sentCount.toLocaleString('pt-BR')}</div>
                      <div className="text-sm text-gray-500">Enviados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">
                        {selectedCampaign.sentCount > 0 ? Math.round((selectedCampaign.openCount / selectedCampaign.sentCount) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-500">Taxa de Abertura</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Campanha</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Newsletter Abril"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assunto do Email</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Ex: Newsletter - Abril 2026"
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Corpo do Email (HTML)</label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder="<h1>Olá!</h1><p>Seu conteúdo aqui...</p>"
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as EmailCampaign['status'] })}
                      className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="scheduled">Agendada</option>
                      <option value="sending">Enviando</option>
                      <option value="completed">Concluída</option>
                      <option value="cancelled">Cancelada</option>
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
                      disabled={!formData.name || !formData.subject}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditing ? 'Salvar Alterações' : 'Criar Campanha'}
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