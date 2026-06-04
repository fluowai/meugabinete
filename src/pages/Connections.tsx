import { useCallback, useEffect, useState } from 'react';
import { QrCode, RefreshCcw, Smartphone, Wifi } from 'lucide-react';
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

const getBaseUrl = () => {
  let baseUrl = import.meta.env.VITE_WHATSAPP_SERVICE_URL || 'http://localhost:3001';
  if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  return baseUrl;
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
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Erro HTTP ${response.status}`);
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
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingGroups, setSyncingGroups] = useState(false);
  const [error, setError] = useState('');

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<WhatsAppConnection[]>('/api/whatsapp/connections');
      setConnections(data);
    } catch {
      setError('Não foi possivel carregar as conexões. Verifique o servidor backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const loadQR = async (instanceKey: string) => {
    setError('');
    try {
      const data = await apiFetch<{ qr: string }>(`/api/whatsapp/connections/${instanceKey}/qr`);
      setQrCode(data.qr || '');
    } catch {
      setError('Nao foi possivel carregar o QR Code.');
    }
  };

  const syncGroups = async () => {
    setSyncingGroups(true);
    setError('');
    try {
      await apiFetch('/api/whatsapp/connections/default/sync-groups', { method: 'POST' });
      await fetchConnections();
    } catch {
      setError('Nao foi possivel sincronizar os grupos.');
    } finally {
      setSyncingGroups(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conexões WhatsApp</h1>
          <p className="mt-1 text-slate-500">Gerencie suas instâncias e leia o QR Code.</p>
        </div>
        <button
          onClick={fetchConnections}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Atualizar Conexões
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

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
