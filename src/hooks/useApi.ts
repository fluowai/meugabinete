import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  LandingPage, Citizen, Organization, Appointment, 
  Mobilization, Request, Amendment, WhatsAppCampaign, EmailCampaign,
  Collaborator, BasicRegister, Signature, Relationship, PaginatedResponse 
} from '../types';

const mapKeys = (obj: any) => {
  if (!obj) return obj;
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase().replace('-', '').replace('_', '');
    });
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

export function useDashboardStats() {
  const [stats, setStats] = useState({
    citizens: 0, citizensGrowth: 0, openDemands: 0, inProgressDemands: 0, resolvedDemands: 0,
    topNeighborhoods: [] as { name: string; count: number }[],
    topSubjects: [] as { name: string; count: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ count: cCount }, { count: openCount }, { count: inProgressCount }, { count: resolvedCount }] = await Promise.all([
        supabase.from('citizens').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      ]);
      setStats({ citizens: cCount || 0, citizensGrowth: 12.5, openDemands: openCount || 0, inProgressDemands: inProgressCount || 0, resolvedDemands: resolvedCount || 0, topNeighborhoods: [{ name: 'Centro', count: 12 }, { name: 'Vila Nova', count: 8 }], topSubjects: [{ name: 'Iluminação', count: 15 }, { name: 'Saneamento', count: 10 }] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { stats, loading, error, refresh };
}

export function useCitizens(page = 1, pageSize = 10, search = '') {
  const [result, setResult] = useState<PaginatedResponse<Citizen>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let query = supabase.from('citizens').select('*', { count: 'exact' });
      if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,cpf.ilike.%${search}%`);
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await query.order('created_at', { ascending: false }).range(from, from + pageSize - 1);
      if (err) throw err;
      const { data: tagsData } = await supabase.from('citizen_tags').select('citizen_id, tag').in('citizen_id', data?.map(c => c.id) || []);
      setResult({ data: (data || []).map(c => ({ ...mapKeys(c), tags: tagsData?.filter(t => t.citizen_id === c.id).map(t => t.tag) || [] })), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize, search]);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (c: any) => { const { data, error: e } = await supabase.from('citizens').insert([c]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, c: any) => { const { data, error: e } = await supabase.from('citizens').update(c).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('citizens').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { ...result, loading, error, refresh, create, update, remove };
}

export function useOrganizations(page = 1, pageSize = 10, search = '') {
  const [result, setResult] = useState<PaginatedResponse<Organization>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let query = supabase.from('organizations').select('*', { count: 'exact' });
      if (search) query = query.ilike('name', `%${search}%`);
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await query.range(from, from + pageSize - 1).order('name');
      if (err) throw err;
      const { data: tagsData } = await supabase.from('organization_tags').select('organization_id, tag');
      setResult({ data: (data || []).map(o => ({ ...mapKeys(o), tags: tagsData?.filter(t => t.organization_id === o.id).map(t => t.tag) || [] })), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize, search]);

  useEffect(() => { refresh(); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('organizations').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { ...result, loading, error, refresh, remove };
}

export function useAppointments(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Appointment>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await supabase.from('appointments').select('*', { count: 'exact' }).range(from, from + pageSize - 1).order('date', { ascending: false });
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (a: any) => { const { data, error: e } = await supabase.from('appointments').insert([a]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, a: any) => { const { data, error: e } = await supabase.from('appointments').update(a).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('appointments').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { ...result, loading, error, refresh, create, update, remove };
}

export function useLandingPages(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<LandingPage>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await supabase.from('landing_pages').select('*', { count: 'exact' }).range(from, from + pageSize - 1).order('created_at', { ascending: false });
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (l: any) => { const { data, error: e } = await supabase.from('landing_pages').insert([l]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, l: any) => { const { data, error: e } = await supabase.from('landing_pages').update(l).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('landing_pages').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { ...result, loading, error, refresh, create, update, remove };
}

export function useCollaborators() {
  const [data, setData] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: cols, error: err } = await supabase.from('collaborators').select('*').order('name');
      if (err) throw err;
      setData((cols || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (c: any) => { const { data, error: e } = await supabase.from('collaborators').insert([c]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, c: any) => { const { data, error: e } = await supabase.from('collaborators').update(c).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('collaborators').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { data, loading, error, refresh, create, update, remove };
}

export function useBasicRegisters(category = '') {
  const [data, setData] = useState<BasicRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      let query = supabase.from('basic_registers').select('*').order('name');
      if (category) query = query.eq('category', category);
      const { data: regs, error: err } = await query;
      if (err) throw err;
      setData((regs || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (b: any) => { const { data, error: e } = await supabase.from('basic_registers').insert([b]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, b: any) => { const { data, error: e } = await supabase.from('basic_registers').update(b).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('basic_registers').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { data, loading, error, refresh, create, update, remove };
}

export function useMobilizations() {
  const [data, setData] = useState<Mobilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res, error: err } = await supabase.from('mobilizations').select('*').order('start_date');
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (m: any) => { const { data, error: e } = await supabase.from('mobilizations').insert([m]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, m: any) => { const { data, error: e } = await supabase.from('mobilizations').update(m).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('mobilizations').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { data, loading, error, refresh, create, update, remove };
}

export function useRequests(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Request>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await supabase.from('requests').select('*', { count: 'exact' }).range(from, from + pageSize - 1);
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (r: any) => { const { data, error: e } = await supabase.from('requests').insert([r]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, r: any) => { const { data, error: e } = await supabase.from('requests').update(r).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('requests').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { ...result, loading, error, refresh, create, update, remove };
}

export function useAmendments() {
  const [data, setData] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res, error: err } = await supabase.from('amendments').select('*').order('year', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (a: any) => { const { data, error: e } = await supabase.from('amendments').insert([a]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, a: any) => { const { data, error: e } = await supabase.from('amendments').update(a).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('amendments').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { data, loading, error, refresh, create, update, remove };
}

export function useWhatsAppCampaigns() {
  const [data, setData] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res, error: err } = await supabase.from('whatsapp_campaigns').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useEmailCampaigns() {
  const [data, setData] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res, error: err } = await supabase.from('email_campaigns').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useRelationships() {
  const [data, setData] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res, error: err } = await supabase.from('relationships').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (r: any) => { const { data, error: e } = await supabase.from('relationships').insert([r]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, r: any) => { const { data, error: e } = await supabase.from('relationships').update(r).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('relationships').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { data, loading, error, refresh, create, update, remove };
}

export function useSignatures() {
  const [data, setData] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res, error: err } = await supabase.from('signatures').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const create = useCallback(async (s: any) => { const { data, error: e } = await supabase.from('signatures').insert([s]).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const update = useCallback(async (id: string, s: any) => { const { data, error: e } = await supabase.from('signatures').update(s).eq('id', id).select().single(); if (e) throw e; await refresh(); return mapKeys(data); }, [refresh]);
  const remove = useCallback(async (id: string) => { const { error: e } = await supabase.from('signatures').delete().eq('id', id); if (e) throw e; await refresh(); }, [refresh]);
  return { data, loading, error, refresh, create, update, remove };
}

