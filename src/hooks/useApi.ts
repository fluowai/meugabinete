import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  LandingPage, Citizen, Organization, Appointment, 
  Mobilization, Request, Amendment, WhatsAppCampaign, EmailCampaign,
  Collaborator, BasicRegister, Signature, PaginatedResponse 
} from '../types';

// Helper para converter snake_case do banco para camelCase do frontend
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

// DASHBOARD
export function useDashboardStats() {
  const [stats, setStats] = useState({
    citizens: 0, 
    citizensGrowth: 0,
    openDemands: 0,
    inProgressDemands: 0,
    resolvedDemands: 0,
    topNeighborhoods: [] as { name: string; count: number }[],
    topSubjects: [] as { name: string; count: number }[]
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: cCount }, 
        { count: openCount },
        { count: inProgressCount },
        { count: resolvedCount },
      ] = await Promise.all([
        supabase.from('citizens').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      ]);

      setStats({
        citizens: cCount || 0, 
        citizensGrowth: 12.5,
        openDemands: openCount || 0,
        inProgressDemands: inProgressCount || 0,
        resolvedDemands: resolvedCount || 0,
        topNeighborhoods: [
          { name: 'Centro', count: 12 },
          { name: 'Vila Nova', count: 8 }
        ],
        topSubjects: [
          { name: 'Iluminação', count: 15 },
          { name: 'Saneamento', count: 10 }
        ]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { stats, loading, refresh };
}

// CITIZENS
export function useCitizens(page = 1, pageSize = 10, search = '') {
  const [result, setResult] = useState<PaginatedResponse<Citizen>>({
    data: [], total: 0, page, pageSize, totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('citizens').select('*', { count: 'exact' });
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,cpf.ilike.%${search}%`);
      }
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const { data: tagsData } = await supabase
        .from('citizen_tags')
        .select('citizen_id, tag')
        .in('citizen_id', data?.map(c => c.id) || []);

      const processedData = (data || []).map(citizen => ({
        ...mapKeys(citizen),
        tags: tagsData?.filter(t => t.citizen_id === citizen.id).map(t => t.tag) || []
      }));

      setResult({
        data: processedData,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (citizen: any) => {
    const { data, error } = await supabase.from('citizens').insert([citizen]).select().single();
    if (error) throw error;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, citizen: any) => {
    const { data, error } = await supabase.from('citizens').update(citizen).eq('id', id).select().single();
    if (error) throw error;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('citizens').delete().eq('id', id);
    if (error) throw error;
    await refresh();
    return true;
  }, [refresh]);

  return { ...result, loading, refresh, create, update, remove };
}

// ORGANIZATIONS
export function useOrganizations(page = 1, pageSize = 10, search = '') {
  const [result, setResult] = useState<PaginatedResponse<Organization>>({
    data: [], total: 0, page, pageSize, totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('organizations').select('*', { count: 'exact' });
      if (search) query = query.ilike('name', `%${search}%`);
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.range(from, to).order('name');
      if (error) throw error;

      const { data: tagsData } = await supabase
        .from('organization_tags')
        .select('organization_id, tag');

      const processed = (data || []).map(org => ({
        ...mapKeys(org),
        tags: tagsData?.filter(t => t.organization_id === org.id).map(t => t.tag) || []
      }));

      setResult({
        data: processed,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('organizations').delete().eq('id', id);
    await refresh();
    return true;
  }, [refresh]);

  return { ...result, loading, refresh, remove };
}

// APPOINTMENTS
export function useAppointments(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Appointment>>({
    data: [], total: 0, page, pageSize, totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const { data, count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .range(from, from + pageSize - 1)
        .order('date', { ascending: false });

      if (error) throw error;
      setResult({
        data: (data || []).map(mapKeys),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ...result, loading, refresh };
}

// LANDING PAGES
export function useLandingPages(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<LandingPage>>({
    data: [], total: 0, page, pageSize, totalPages: 0
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const { data, count, error } = await supabase
        .from('landing_pages')
        .select('*', { count: 'exact' })
        .range(from, from + pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResult({
        data: (data || []).map(mapKeys),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ...result, loading, refresh };
}

// COLLABORATORS
export function useCollaborators() {
  const [data, setData] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cols, error } = await supabase.from('collaborators').select('*').order('name');
      if (error) throw error;
      setData((cols || []).map(mapKeys));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

// BASIC REGISTERS
export function useBasicRegisters(category = '') {
  const [data, setData] = useState<BasicRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('basic_registers').select('*').order('name');
      if (category) query = query.eq('category', category);
      const { data: regs, error } = await query;
      if (error) throw error;
      setData((regs || []).map(mapKeys));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

// Outros módulos seguem o mesmo padrão
export function useMobilizations() {
  const [data, setData] = useState<Mobilization[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: res } = await supabase.from('mobilizations').select('*').order('start_date');
    setData((res || []).map(mapKeys));
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useRequests(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Request>>({
    data: [], total: 0, page, pageSize, totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const { data, count } = await supabase.from('requests').select('*', { count: 'exact' }).range(from, from + pageSize - 1);
    setResult({
      data: (data || []).map(mapKeys),
      total: count || 0,
      page, pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    });
    setLoading(false);
  }, [page, pageSize]);
  useEffect(() => { refresh(); }, [refresh]);
  return { ...result, loading, refresh };
}

export function useAmendments() {
  const [data, setData] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: res } = await supabase.from('amendments').select('*').order('year', { ascending: false });
    setData((res || []).map(mapKeys));
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useWhatsAppCampaigns() { return { data: [], loading: false, refresh: () => {} }; }
export function useEmailCampaigns() { return { data: [], loading: false, refresh: () => {} }; }
export function useSignatures() { return { data: [], loading: false, refresh: () => {} }; }