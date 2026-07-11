import { callApi } from '../src/lib/api';
import { Lead } from '../types';

const normalizeLead = (lead: any): Lead => ({
  ...lead,
  createdAt: lead.createdAt || lead.created_at || new Date().toISOString(),
});

export const leadService = {
  async list(): Promise<Lead[]> {
    const response = await callApi<any>('/api/crm/leads');
    const rows = Array.isArray(response) ? response : response.leads || response.data || [];
    return rows.map(normalizeLead);
  },

  async create(payload: Partial<Lead>): Promise<Lead> {
    const response = await callApi<any>('/api/crm/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeLead(response.lead || response.data || response);
  },

  async updateStatus(id: string, status: Lead['status'] | string): Promise<Lead> {
    const response = await callApi<any>(`/api/crm/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normalizeLead(response.lead || response.data || response);
  },

  async delete(id: string): Promise<void> {
    await callApi(`/api/crm/leads/${id}`, { method: 'DELETE' });
  },
};
