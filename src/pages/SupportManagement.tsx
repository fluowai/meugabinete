import { useState } from 'react';
import { Search, X, MessageSquare, Send, ChevronLeft, ChevronRight, LifeBuoy, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { SupportTicket, SupportMessage } from '../types';
import { useSupportTickets } from '../hooks/useApi';
import { useStore } from '../stores/appStore';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Aberto', color: 'bg-red-100 text-red-700' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'waiting', label: 'Aguardando', color: 'bg-blue-100 text-blue-700' },
  { value: 'resolved', label: 'Resolvido', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Fechado', color: 'bg-gray-100 text-gray-600' },
];

const categoryLabels: Record<string, string> = {
  bug: 'Bug', feature: 'Melhoria', question: 'Dúvida', billing: 'Faturamento', other: 'Outro',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
};

export default function SupportManagement() {
  const { data: tickets, total, loading, refresh, addMessage, updateStatus } = useSupportTickets(1, 50);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const { user } = useStore();

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || (t.tenantName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !user) return;
    const msg: SupportMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      ticketId: selectedTicket.id,
      authorId: user.id,
      authorName: user.name,
      authorType: 'support',
      message: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    await addMessage(selectedTicket.id, msg);
    if (selectedTicket.status === 'open') {
      await updateStatus(selectedTicket.id, 'in_progress');
    }
    setReplyText('');
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicket['status']) => {
    await updateStatus(ticketId, status);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
      </div>

      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar tickets..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{total} registro(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Nenhum ticket encontrado</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={cn("p-4 cursor-pointer hover:bg-gray-50 transition-colors", selectedTicket?.id === ticket.id && "bg-blue-50")}
                  onClick={() => openTicket(ticket)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900">{ticket.subject}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priorityColors[ticket.priority] || 'bg-gray-100')}>
                      {priorityLabels[ticket.priority] || ticket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{ticket.tenantName || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(ticket.createdAt)}</span>
                    <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-medium", statusOptions.find(s => s.value === ticket.status)?.color || 'bg-gray-100')}>
                      {statusOptions.find(s => s.value === ticket.status)?.label || ticket.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[600px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as SupportTicket['status'])}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {statusOptions.filter(s => s.value).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{selectedTicket.tenantName || 'N/A'}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-medium", priorityColors[selectedTicket.priority] || 'bg-gray-100')}>
                    {priorityLabels[selectedTicket.priority] || selectedTicket.priority}
                  </span>
                  <span>{categoryLabels[selectedTicket.category] || selectedTicket.category}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages?.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.authorType === 'support' ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-lg p-3", msg.authorType === 'support' ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200")}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">{msg.authorName}</span>
                        <span className="text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Selecione um ticket para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
