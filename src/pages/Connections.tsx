import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Plus, QrCode, RefreshCcw, Send, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

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
  webhook_url?: string;
  configured?: boolean;
  missing_fields?: string[];
}

interface CloudTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
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
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Erro HTTP ${response.status}`);
  }
  return response.json();
}

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

export default function Connections() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudAPIStatus | null>(null);
  const [cloudTemplates, setCloudTemplates] = useState<CloudTemplate[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCloudStatus, setLoadingCloudStatus] = useState(false);
  const [loadingCloudTemplates, setLoadingCloudTemplates] = useState(false);
  const [syncingGroups, setSyncingGroups] = useState(false);
  const [sendingCloudTest, setSendingCloudTest] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [instanceName, setInstanceName] = useState('Instância principal');
  const [cloudTestPhone, setCloudTestPhone] = useState('');
  const [cloudTestMessage, setCloudTestMessage] = useState('Teste de integração da API Oficial do WhatsApp.');
  const [error, setError] = useState('');
  const [cloudMessage, setCloudMessage] = useState('');

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<WhatsAppConnection[]>('/api/whatsapp/connections');
      setConnections(data);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'erro desconhecido';
      setError(`Não foi possível carregar as conexões: ${detail}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCloudStatus = useCallback(async () => {
    setLoadingCloudStatus(true);
    setCloudMessage('');
    try {
      const data = await apiFetch<CloudAPIStatus>('/api/whatsapp/cloud-status');
      setCloudStatus(data);
    } catch (err) {
      setCloudStatus(null);
      setCloudMessage(err instanceof Error ? err.message : 'Não foi possível carregar a API Oficial.');
    } finally {
      setLoadingCloudStatus(false);
    }
  }, []);

  const fetchCloudTemplates = useCallback(async () => {
    setLoadingCloudTemplates(true);
    setCloudMessage('');
    try {
      const data = await apiFetch<CloudTemplate[]>('/api/whatsapp/cloud/templates');
      setCloudTemplates(data);
    } catch (err) {
      setCloudTemplates([]);
      setCloudMessage(err instanceof Error ? err.message : 'Não foi possível carregar os templates oficiais.');
    } finally {
      setLoadingCloudTemplates(false);
    }
  }, []);

  const createInstance = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError('');
    try {
      const connection = await apiFetch<WhatsAppConnection>('/api/whatsapp/connections', {
        method: 'POST',
        body: JSON.stringify({ name: instanceName.trim() }),
      });
      setShowCreateForm(false);
      await fetchConnections();
      await loadQR(connection.instance_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a instância.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchCloudStatus();
  }, [fetchConnections, fetchCloudStatus]);

  useEffect(() => {
    if (cloudStatus?.status === 'connected' || cloudStatus?.status === 'configured') {
      fetchCloudTemplates();
    }
  }, [cloudStatus?.status, fetchCloudTemplates]);

  const refreshAll = () => {
    fetchConnections();
    fetchCloudStatus();
  };

  const loadQR = async (instanceKey: string) => {
    setError('');
    try {
      const data = await apiFetch<{ qr: string }>(`/api/whatsapp/connections/${instanceKey}/qr`);
      setQrCode(data.qr || '');
    } catch {
      setError('Não foi possível carregar o QR Code.');
    }
  };

  const syncGroups = async () => {
    setSyncingGroups(true);
    setError('');
    try {
      await apiFetch('/api/whatsapp/connections/default/sync-groups', { method: 'POST' });
      await fetchConnections();
    } catch {
      setError('Não foi possível sincronizar os grupos.');
    } finally {
      setSyncingGroups(false);
    }
  };

  const sendCloudTest = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendingCloudTest(true);
    setCloudMessage('');
    try {
      await apiFetch('/api/whatsapp/cloud/send-text', {
        method: 'POST',
        body: JSON.stringify({
          to: cloudTestPhone.replace(/\D/g, ''),
          text: cloudTestMessage.trim(),
        }),
      });
      setCloudMessage('Mensagem de teste enviada pela API Oficial.');
    } catch (err) {
      setCloudMessage(err instanceof Error ? err.message : 'Não foi possível enviar pela API Oficial.');
    } finally {
      setSendingCloudTest(false);
    }
  };

  const cloudConfigured = cloudStatus?.status === 'connected' || cloudStatus?.status === 'configured';
  const cloudConnected = cloudStatus?.status === 'connected';

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conexões WhatsApp</h1>
          <p className="mt-1 text-slate-500">Gerencie suas instâncias e leia o QR Code.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Criar instância
          </button>
          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCcw className={cn('h-4 w-4', (loading || loadingCloudStatus) && 'animate-spin')} />
            Atualizar integrações
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={createInstance} className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-semibold text-slate-700">
            Nome da instância
            <input
              value={instanceName}
              onChange={(event) => setInstanceName(event.target.value)}
              required
              maxLength={255}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={creating || !instanceName.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {creating ? 'Criando...' : 'Criar e gerar QR Code'}
          </button>
        </form>
      )}

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">WhatsApp Web (whatsmeow)</h2>
              <p className="mt-1 text-sm text-slate-500">API não oficial via QR Code, usada para ler conversas, grupos e mensagens.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Não oficial</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Instâncias</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{connections.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Conectadas</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{connections.filter((item) => item.connected).length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <h2 className="font-bold text-slate-900">WhatsApp Cloud API (Oficial)</h2>
              <p className="mt-1 text-sm text-slate-500">API oficial da Meta para envio de mensagens, templates e webhooks.</p>
            </div>
            <span
              className={cn(
                'w-fit rounded-full px-3 py-1 text-xs font-bold',
                cloudConnected ? 'bg-emerald-50 text-emerald-700' : cloudConfigured ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700',
              )}
            >
              {loadingCloudStatus ? 'Verificando...' : cloudConnected ? 'Conectada' : cloudConfigured ? 'Configurada' : 'Não configurada'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Phone Number ID</p>
              <p className="mt-1 break-all font-mono text-slate-900">{cloudStatus?.phone_number_id || '-'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Business Account ID</p>
              <p className="mt-1 break-all font-mono text-slate-900">{cloudStatus?.business_account_id || '-'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Webhook</p>
              <p className={cn('mt-1 font-semibold', cloudStatus?.webhook_registered ? 'text-emerald-700' : 'text-red-700')}>
                {cloudStatus?.webhook_registered ? 'Registrado' : 'Não registrado'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">Templates</p>
              <p className="mt-1 font-semibold text-slate-900">{loadingCloudTemplates ? 'Carregando...' : cloudTemplates.length}</p>
            </div>
          </div>

          {cloudStatus?.webhook_url && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
              Webhook para configurar na Meta: <span className="font-mono">{cloudStatus.webhook_url}</span>
            </div>
          )}

          {!cloudConfigured && cloudStatus?.missing_fields && cloudStatus.missing_fields.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
              Configure no ambiente do servidor: <span className="font-mono">{cloudStatus.missing_fields.join(', ')}</span>
            </div>
          )}

          {cloudMessage && (
            <div className={cn('mt-3 rounded-lg border px-3 py-2 text-sm', cloudMessage.includes('enviada') ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700')}>
              {cloudMessage}
            </div>
          )}

          <form onSubmit={sendCloudTest} className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr_auto]">
            <input
              value={cloudTestPhone}
              onChange={(event) => setCloudTestPhone(event.target.value)}
              placeholder="5599999999999"
              disabled={!cloudConfigured || sendingCloudTest}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
            <input
              value={cloudTestMessage}
              onChange={(event) => setCloudTestMessage(event.target.value)}
              disabled={!cloudConfigured || sendingCloudTest}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!cloudConfigured || !cloudTestPhone.trim() || !cloudTestMessage.trim() || sendingCloudTest}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {cloudConnected ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {sendingCloudTest ? 'Enviando...' : 'Testar oficial'}
            </button>
          </form>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Instâncias</h2>
              <p className="text-xs text-slate-500">Status das conexoes whatsmeow.</p>
            </div>
            <button
              onClick={syncGroups}
              disabled={syncingGroups}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw className={cn('h-4 w-4', syncingGroups && 'animate-spin')} />
              Sincronizar grupos
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Instância</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Número</th>
                  <th className="px-5 py-3 font-semibold">Pushname</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">Carregando conexões...</td>
                  </tr>
                )}
                {!loading && connections.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">Nenhuma instância encontrada.</td>
                  </tr>
                )}
                {connections.map((connection) => (
                  <tr key={connection.instance_key} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{connection.name}</div>
                          <div className="text-xs text-slate-500">{connection.provider || 'whatsmeow'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-bold',
                          connection.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {connection.connected ? 'Conectada' : connection.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatPhone(connection.phone) || '-'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{connection.push_name || '-'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => loadQR(connection.instance_key)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <QrCode className="h-4 w-4" />
                        Gerar QR Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex min-h-[320px] flex-col rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">QR Code da Instância</h2>
            <p className="text-xs text-slate-500">Token atual para conectar seu número.</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
              {qrCode ? (
                <textarea
                  readOnly
                  value={qrCode}
                  className="h-full min-h-[220px] w-full resize-none rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700 focus:outline-none"
                />
              ) : (
                <div className="text-center text-sm text-slate-500">
                  <QrCode className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  QR indisponível ou instância já conectada.
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
