import { callApi } from '../src/lib/api';

export interface ConnectEmailPayload {
  email: string;
  password: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
}

export interface EmailAccount extends ConnectEmailPayload {
  id: string;
  last_sync_at?: string | null;
}

export interface EmailMessage {
  id: string;
  account_id?: string;
  lead_id?: string | null;
  subject?: string;
  from_email: string;
  from_name?: string | null;
  to_email?: string[];
  body_html?: string;
  snippet?: string;
  date?: string | null;
  is_read?: boolean;
  is_archived?: boolean;
  folder?: string;
}

export interface EmailAgendaActivity {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  from_email?: string;
  created_at: string;
  leads?: {
    name?: string;
  };
}

export const emailService = {
  async listAccounts(): Promise<EmailAccount[]> {
    const response = await callApi<any>('/api/email/accounts').catch(() => ({ accounts: [] }));
    return response.accounts || response.data || [];
  },

  async connectAccount(payload: ConnectEmailPayload): Promise<EmailAccount> {
    const response = await callApi<any>('/api/email/accounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.account || response.data || response;
  },

  async listEmails(folder = 'inbox', page = 1, search = ''): Promise<{ emails: EmailMessage[] }> {
    const params = new URLSearchParams({ folder, page: String(page), search });
    const response = await callApi<any>(`/api/email/messages?${params}`).catch(() => ({ emails: [] }));
    return { emails: response.emails || response.data || [] };
  },

  async getThread(id: string): Promise<EmailMessage[]> {
    const response = await callApi<any>(`/api/email/messages/${id}/thread`).catch(() => ({ messages: [] }));
    return response.messages || response.data || [];
  },

  async updateEmail(id: string, payload: Partial<EmailMessage>): Promise<void> {
    await callApi(`/api/email/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  },

  async sync(accountId: string): Promise<{ synced: number }> {
    return callApi(`/api/email/accounts/${accountId}/sync`, { method: 'POST' }).catch(() => ({ synced: 0 }));
  },

  async send(payload: any): Promise<void> {
    await callApi('/api/email/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async reply(id: string, body_html: string): Promise<void> {
    await callApi(`/api/email/messages/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body_html }),
    });
  },

  async listAgenda(): Promise<EmailAgendaActivity[]> {
    const response = await callApi<any>('/api/email/agenda').catch(() => ({ agenda: [] }));
    return response.agenda || response.data || [];
  },
};
