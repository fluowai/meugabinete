import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  FileText,
  Globe2,
  ImageIcon,
  MessageSquare,
  Music,
  Paperclip,
  QrCode,
  RefreshCcw,
  Search,
  Smartphone,
  Users,
  Wifi,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

type ChatType = 'direct' | 'group';
type WhatsAppTab = ChatType | 'messages' | 'connections';

interface WhatsAppChat {
  id: string;
  chat_jid: string;
  chat_type: ChatType;
  display_name: string;
  normalized_phone?: string;
  country_code?: string;
  profile_picture_url?: string;
  participant_count?: number;
  group_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface WhatsAppMessage {
  id: string;
  message_id: string;
  chat_jid: string;
  sender_push_name?: string;
  sender_phone?: string;
  sender_country_code?: string;
  sender_profile_picture_url?: string;
  sender_display_name?: string;
  is_group: boolean;
  group_name?: string;
  message_type: string;
  text_content?: string;
  media_url?: string;
  media_mime_type?: string;
  media_filename?: string;
  mentioned_phones?: string[];
  received_at?: string;
  created_request_id?: string;
}

interface WhatsAppParticipant {
  id: string;
  participant_jid: string;
  normalized_phone: string;
  country_code?: string;
  push_name?: string;
  display_name: string;
  profile_picture_url?: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
  last_seen_at?: string;
}

interface WhatsAppConnection {
  id?: string;
  instance_key: string;
  name: string;
  provider?: string;
  status: string;
  connected?: boolean;
  jid?: string;
  phone?: string;
  push_name?: string;
  profile_picture_url?: string;
  last_seen_at?: string;
  last_connected_at?: string;
}

interface CloudAPIStatus {
  status: string;
  provider: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_registered: boolean;
  version: string;
}

const getBaseUrl = () => {
  let baseUrl = (import.meta.env.VITE_WHATSAPP_SERVICE_URL || '').trim();
  const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalPage && /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseUrl)) {
    baseUrl = '';
  }
  if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  return baseUrl.replace(/\/$/, '');
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Erro HTTP ${response.status}`);
  }
  return response.json();
}

const mediaIcon = (type: string) => {
  if (type === 'image' || type === 'sticker') return ImageIcon;
  if (type === 'audio') return Music;
  if (type === 'pdf' || type === 'document') return FileText;
  return Paperclip;
};

const formatPhone = (phone?: string) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length === 13) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.startsWith('55') && digits.length === 12) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return `+${digits}`;
};

const formatDateTime = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const tabConfig = [
  { id: 'direct' as const, label: 'Conversas', icon: MessageSquare },
  { id: 'group' as const, label: 'Grupos', icon: Users },
  { id: 'messages' as const, label: 'Mensagens', icon: FileText },
  { id: 'connections' as const, label: 'Conexões', icon: Wifi },
];

function Avatar({
  url,
  type,
  label,
  size = 'md',
}: {
  url?: string;
  type: 'direct' | 'group';
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const Icon = type === 'group' ? Users : MessageSquare;
  const dimensions = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  return (
    <div
      className={cn(
        dimensions,
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        type === 'group' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700',
      )}
      title={label}
    >
      {url ? <img referrerPolicy="no-referrer" src={url} alt={label} className="h-full w-full object-cover" /> : <Icon className="h-5 w-5" />}
    </div>
  );
}

export default function WhatsAppHub() {
  const [activeTab, setActiveTab] = useState<WhatsAppTab>('direct');
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [allMessages, setAllMessages] = useState<WhatsAppMessage[]>([]);
  const [participants, setParticipants] = useState<WhatsAppParticipant[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudAPIStatus | null>(null);
  const [loadingCloudStatus, setLoadingCloudStatus] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrInstanceKey, setQrInstanceKey] = useState('');
  const [qrStatus, setQrStatus] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [creatingRequestId, setCreatingRequestId] = useState<string | null>(null);
  const [syncingGroups, setSyncingGroups] = useState(false);
  const [syncingParticipants, setSyncingParticipants] = useState(false);
  const [error, setError] = useState('');

  const isChatTab = activeTab === 'direct' || activeTab === 'group';

  const fetchChats = useCallback(async (type: ChatType) => {
    setLoadingChats(true);
    setError('');
    try {
      const data = await apiFetch<WhatsAppChat[]>(`/api/whatsapp/chats?type=${type}`);
      setChats(data);
      setSelectedChat((current) => {
        if (current && data.some((chat) => chat.id === current.id)) return current;
        return data[0] || null;
      });
    } catch {
      setError('Nao foi possivel carregar as conversas do WhatsApp.');
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const fetchMessages = useCallback(async (chat: WhatsAppChat | null) => {
    if (!chat) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    setError('');
    try {
      const data = await apiFetch<WhatsAppMessage[]>(`/api/whatsapp/chats/${chat.id}/messages`);
      setMessages(data);
    } catch {
      setError('Nao foi possivel carregar as mensagens.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchAllMessages = useCallback(async () => {
    setLoadingMessages(true);
    setError('');
    try {
      const data = await apiFetch<WhatsAppMessage[]>('/api/whatsapp/messages?limit=300');
      setAllMessages(data);
    } catch {
      setError('Nao foi possivel listar as mensagens.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const fetchParticipants = useCallback(async (chat: WhatsAppChat | null) => {
    if (!chat || chat.chat_type !== 'group') {
      setParticipants([]);
      return;
    }
    setLoadingParticipants(true);
    try {
      const data = await apiFetch<WhatsAppParticipant[]>(`/api/whatsapp/groups/${chat.id}/participants`);
      setParticipants(data);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    setLoadingConnections(true);
    setError('');
    try {
      const data = await apiFetch<WhatsAppConnection[]>('/api/whatsapp/connections');
      setConnections(data);
    } catch {
      setError('Nao foi possivel carregar as conexoes.');
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  const fetchCloudStatus = useCallback(async () => {
    setLoadingCloudStatus(true);
    try {
      const data = await apiFetch<CloudAPIStatus>('/api/whatsapp/cloud-status');
      setCloudStatus(data);
    } catch {
      setCloudStatus(null);
    } finally {
      setLoadingCloudStatus(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'direct' || activeTab === 'group') {
      fetchChats(activeTab);
    } else if (activeTab === 'messages') {
      fetchAllMessages();
    } else if (activeTab === 'connections') {
      fetchConnections();
      fetchCloudStatus();
    }
  }, [activeTab, fetchAllMessages, fetchChats, fetchConnections, fetchCloudStatus]);

  useEffect(() => {
    fetchMessages(selectedChat);
    fetchParticipants(selectedChat);
  }, [selectedChat, fetchMessages, fetchParticipants]);

  useEffect(() => {
    if (activeTab !== 'direct' && activeTab !== 'group' && activeTab !== 'messages') return;
    const interval = window.setInterval(() => {
      if (activeTab === 'direct' || activeTab === 'group') {
        fetchChats(activeTab);
        fetchMessages(selectedChat);
      } else {
        fetchAllMessages();
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [activeTab, fetchAllMessages, fetchChats, fetchMessages, selectedChat]);

  const filteredChats = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return chats;
    return chats.filter((chat) => {
      const text = `${chat.display_name} ${chat.normalized_phone || ''} ${chat.group_name || ''} ${chat.last_message || ''}`.toLowerCase();
      return text.includes(needle);
    });
  }, [chats, search]);

  const filteredMessages = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return allMessages;
    return allMessages.filter((message) => {
      const text = `${message.sender_display_name || ''} ${message.sender_push_name || ''} ${message.sender_phone || ''} ${message.group_name || ''} ${message.text_content || ''}`.toLowerCase();
      return text.includes(needle);
    });
  }, [allMessages, search]);

  const createRequest = async (message: WhatsAppMessage) => {
    setCreatingRequestId(message.id);
    setError('');
    try {
      await apiFetch(`/api/whatsapp/messages/${message.id}/create-request`, { method: 'POST' });
      await Promise.all([fetchMessages(selectedChat), activeTab === 'messages' ? fetchAllMessages() : Promise.resolve()]);
    } catch {
      setError('Nao foi possivel criar a demanda a partir da mensagem.');
    } finally {
      setCreatingRequestId(null);
    }
  };

  const refreshCurrent = () => {
    if (activeTab === 'direct' || activeTab === 'group') fetchChats(activeTab);
    if (activeTab === 'messages') fetchAllMessages();
  };

  const loadQR = useCallback(async (instanceKey: string) => {
    setQrInstanceKey(instanceKey);
    setError('');
    try {
      const data = await apiFetch<{ qr: string; status: string; connected: boolean }>(`/api/whatsapp/connections/${instanceKey}/qr`);
      setQrCode(data.qr || '');
      setQrStatus(data.status || 'pairing');
      if (data.connected) await fetchConnections();
    } catch {
      setError('Nao foi possivel carregar o QR Code.');
    }
  }, [fetchConnections]);

  useEffect(() => {
    if (!qrInstanceKey || qrStatus === 'connected') return;
    const interval = window.setInterval(() => {
      loadQR(qrInstanceKey);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [loadQR, qrInstanceKey, qrStatus]);

  const syncGroups = async (instanceKey?: string) => {
    const targetKey = instanceKey || connections.find((connection) => connection.connected)?.instance_key;
    if (!targetKey) {
      setError('Conecte uma instancia antes de sincronizar os grupos.');
      return;
    }
    setSyncingGroups(true);
    setError('');
    try {
      await apiFetch(`/api/whatsapp/connections/${targetKey}/sync-groups`, { method: 'POST' });
      await fetchConnections();
    } catch {
      setError('Nao foi possivel sincronizar os grupos.');
    } finally {
      setSyncingGroups(false);
    }
  };

  const syncSelectedParticipants = async () => {
    if (!selectedChat) return;
    setSyncingParticipants(true);
    setError('');
    try {
      await apiFetch(`/api/whatsapp/groups/${selectedChat.id}/sync-participants`, { method: 'POST' });
      await fetchParticipants(selectedChat);
    } catch {
      setError('Nao foi possivel sincronizar os membros do grupo.');
    } finally {
      setSyncingParticipants(false);
    }
  };

  const renderMessage = (message: WhatsAppMessage) => {
    const Icon = mediaIcon(message.message_type);
    const sender = message.sender_display_name || message.sender_push_name || formatPhone(message.sender_phone) || 'Contato';
    return (
      <div key={message.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <Avatar url={message.sender_profile_picture_url} type={message.is_group ? 'group' : 'direct'} label={sender} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-900">{sender}</span>
            {message.sender_phone && <span className="text-xs font-medium text-slate-500">{formatPhone(message.sender_phone)}</span>}
            {message.sender_country_code && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Globe2 className="h-3 w-3" />
                +{message.sender_country_code}
              </span>
            )}
            {message.group_name && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">{message.group_name}</span>}
          </div>
          {message.text_content && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{message.text_content}</p>}
          {message.media_url && (
            <a
              href={message.media_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Icon className="h-4 w-4 text-blue-600" />
              <span className="truncate">{message.media_filename || message.message_type}</span>
            </a>
          )}
          {message.mentioned_phones && message.mentioned_phones.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {message.mentioned_phones.map((phone) => (
                <span key={phone} className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  @{formatPhone(phone)}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{formatDateTime(message.received_at)}</span>
            <button
              onClick={() => createRequest(message)}
              disabled={!!message.created_request_id || creatingRequestId === message.id}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              {message.created_request_id ? 'Demanda criada' : creatingRequestId === message.id ? 'Criando...' : 'Criar demanda'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Atendimento WhatsApp</h1>
          <p className="mt-1 text-slate-500">Mensagens, grupos, membros e instancias whatsmeow.</p>
        </div>
        <button
          onClick={refreshCurrent}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCcw className={cn('h-4 w-4', (loadingChats || loadingMessages || loadingConnections) && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      <div className="flex w-fit flex-wrap gap-1 rounded-xl bg-slate-200/70 p-1">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedChat(null);
              setMessages([]);
              setQrCode('');
              setSearch('');
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all',
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {isChatTab && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={activeTab === 'direct' ? 'Buscar por pushname ou numero...' : 'Buscar grupo...'}
                  className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingChats && <div className="p-8 text-center text-sm text-slate-500">Carregando...</div>}
              {!loadingChats && filteredChats.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">Nenhuma {activeTab === 'direct' ? 'conversa' : 'grupo'} encontrada.</div>
              )}
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn('w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50', selectedChat?.id === chat.id && 'bg-blue-50')}
                >
                  <div className="flex items-start gap-3">
                    <Avatar url={chat.profile_picture_url} type={chat.chat_type} label={chat.display_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="truncate font-bold text-slate-900">{chat.display_name}</p>
                        {chat.last_message_at && <span className="shrink-0 text-[11px] text-slate-400">{formatDateTime(chat.last_message_at)}</span>}
                      </div>
                      {chat.normalized_phone && <p className="text-xs text-slate-500">{formatPhone(chat.normalized_phone)}</p>}
                      {chat.chat_type === 'group' && (
                        <p className="text-xs text-slate-500">{chat.participant_count || 0} membros</p>
                      )}
                      <p className="mt-1 truncate text-sm text-slate-500">{chat.last_message || 'Sem mensagens'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            {selectedChat ? (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar url={selectedChat.profile_picture_url} type={selectedChat.chat_type} label={selectedChat.display_name} size="lg" />
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-slate-900">{selectedChat.display_name}</h2>
                      <p className="text-xs text-slate-500">
                        {selectedChat.chat_type === 'group'
                          ? `${selectedChat.participant_count || participants.length || 0} membros`
                          : formatPhone(selectedChat.normalized_phone)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedChat.chat_type === 'group' && (
                      <button
                        onClick={syncSelectedParticipants}
                        disabled={syncingParticipants}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <RefreshCcw className={cn('h-3.5 w-3.5', syncingParticipants && 'animate-spin')} />
                        Sincronizar membros
                      </button>
                    )}
                    <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                      <Bot className="h-3.5 w-3.5" />
                      Agentes ativos
                    </div>
                  </div>
                </div>

                {selectedChat.chat_type === 'group' && (
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {loadingParticipants && <span className="text-xs text-slate-500">Carregando membros...</span>}
                      {!loadingParticipants && participants.slice(0, 18).map((participant) => (
                        <div key={participant.id} className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                          <Avatar url={participant.profile_picture_url} type="direct" label={participant.display_name} size="sm" />
                          <div className="max-w-[150px]">
                            <div className="truncate text-xs font-semibold text-slate-800">{participant.display_name}</div>
                            <div className="truncate text-[11px] text-slate-500">{formatPhone(participant.normalized_phone)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
                  {loadingMessages && <div className="text-center text-sm text-slate-500">Carregando mensagens...</div>}
                  {!loadingMessages && messages.length === 0 && <div className="pt-20 text-center text-sm text-slate-500">Nenhuma mensagem nesta conversa.</div>}
                  {messages.map(renderMessage)}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {activeTab === 'group' ? <Users className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                </div>
                <h2 className="text-lg font-bold text-slate-900">Selecione uma conversa</h2>
                <p className="mt-1 max-w-sm text-sm text-slate-500">As mensagens capturadas pelo whatsmeow aparecem com pushname, numero tratado, pais, grupo e midias.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'messages' && (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, numero, grupo ou texto..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {loadingMessages && <div className="p-8 text-center text-sm text-slate-500">Carregando mensagens...</div>}
            {!loadingMessages && filteredMessages.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Nenhuma mensagem encontrada.</div>}
            {filteredMessages.map(renderMessage)}
          </div>
        </section>
      )}

      {activeTab === 'connections' && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">WhatsApp Web (whatsmeow)</h2>
              <p className="text-sm text-slate-500">Conexão via WhatsApp Web com QR Code</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {loadingConnections && <div className="text-center text-sm text-slate-500">Carregando...</div>}
              {!loadingConnections && connections.length === 0 && (
                <div className="pt-8 text-center text-sm text-slate-500">Nenhuma conexão encontrada.</div>
              )}
              {connections.map((conn) => (
                <div key={conn.instance_key} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-3 w-3 rounded-full', conn.connected ? 'bg-green-500' : 'bg-red-400')} />
                      <div>
                        <p className="font-bold text-slate-900">{conn.name}</p>
                        <p className="text-xs text-slate-500">{conn.push_name || conn.phone || conn.instance_key}</p>
                      </div>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', conn.connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                      {conn.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  {conn.jid && <p className="mt-2 text-xs text-slate-400">JID: {conn.jid}</p>}
                  {conn.last_seen_at && <p className="text-xs text-slate-400">Ultimo visto: {formatDateTime(conn.last_seen_at)}</p>}
                  <div className="mt-3 flex gap-2">
                    {!conn.connected && (
                      <button onClick={() => loadQR(conn.instance_key)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                        <QrCode className="h-4 w-4" />
                        Exibir QR real
                      </button>
                    )}
                    {conn.connected && (
                      <button onClick={() => syncGroups(conn.instance_key)} disabled={syncingGroups} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        <RefreshCcw className={cn('h-4 w-4', syncingGroups && 'animate-spin')} />
                        Sincronizar grupos
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {qrCode && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="mb-2 text-sm font-bold text-slate-700">Escaneie o QR Code com o WhatsApp</p>
                  <div className="inline-block rounded-lg bg-white p-2 shadow-sm">
                    <QRCodeSVG value={qrCode} size={240} level="M" includeMargin />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Leia com WhatsApp &gt; Aparelhos conectados.</p>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Cloud API (Oficial)</h2>
              <p className="text-sm text-slate-500">WhatsApp Business API oficial da Meta</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {loadingCloudStatus && <div className="text-center text-sm text-slate-500">Carregando...</div>}
              {!loadingCloudStatus && !cloudStatus && (
                <div className="pt-8 text-center text-sm text-slate-500">
                  Cloud API não configurada. Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID.
                </div>
              )}
              {cloudStatus && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Status</span>
                      <span className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold',
                        cloudStatus.status === 'connected' ? 'bg-green-50 text-green-700' :
                        cloudStatus.status === 'configured' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      )}>
                        {cloudStatus.status === 'connected' ? 'Conectado' :
                         cloudStatus.status === 'configured' ? 'Configurado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  {cloudStatus.phone_number_id && (
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500">Phone Number ID</p>
                      <p className="text-sm font-mono text-slate-900">{cloudStatus.phone_number_id}</p>
                    </div>
                  )}
                  {cloudStatus.business_account_id && (
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500">Business Account ID</p>
                      <p className="text-sm font-mono text-slate-900">{cloudStatus.business_account_id}</p>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Webhook</p>
                      <span className={cn('rounded-full px-3 py-1 text-xs font-bold', cloudStatus.webhook_registered ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                        {cloudStatus.webhook_registered ? 'Registrado' : 'Não registrado'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">API Version</p>
                    <p className="text-sm font-mono text-slate-900">{cloudStatus.version || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
