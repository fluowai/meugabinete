import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  LandingPage, Citizen, Organization, Appointment, 
  Mobilization, Request, Amendment, WhatsAppCampaign, EmailCampaign,
  Collaborator, BasicRegister, Signature, Relationship, PaginatedResponse 
} from '../types';

// Helper de Mapeamento de Chaves de Snake para Camel
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

// Verifica se estamos em modo mock (ausência ou credencial placeholder do Supabase)
const isMockMode = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return !url || url.includes('YOUR_SUPABASE') || url.includes('placeholder-project');
};

// --- MOCK DATABASE PERSISTENTE EM LOCALSTORAGE ---

const getInitialMockData = <T>(key: string, defaultData: T[]): T[] => {
  if (typeof window === 'undefined') return defaultData;
  const saved = localStorage.getItem(`gabinete_mock_${key}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultData;
    }
  }
  return defaultData;
};

const saveMockData = <T>(key: string, data: T[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`gabinete_mock_${key}`, JSON.stringify(data));
  }
};

const defaultCitizens: Citizen[] = [
  {
    id: 'c1',
    name: 'Paulo Silva',
    phone: '(48) 99123-4567',
    cpf: '123.456.789-00',
    cep: '88010-000',
    address: 'Avenida Beira Mar Norte',
    addressNumber: '1000',
    complement: 'Apto 401',
    neighborhood: 'Centro',
    city: 'Florianópolis',
    state: 'SC',
    status: 'client',
    notes: 'Líder comunitário do Centro, muito engajado nas demandas de saneamento.',
    tags: ['Líder', 'Saneamento', 'Apoiador'],
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c2',
    name: 'Ana Souza',
    phone: '(48) 98877-6655',
    cpf: '987.654.321-11',
    cep: '88015-200',
    address: 'Rua Bocaiúva',
    addressNumber: '450',
    complement: 'Sala 3',
    neighborhood: 'Centro',
    city: 'Florianópolis',
    state: 'SC',
    status: 'prospect',
    notes: 'Contato frequente sobre melhorias na iluminação pública e segurança.',
    tags: ['Comunicação', 'Segurança'],
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c3',
    name: 'Carlos Ferreira',
    phone: '(11) 97766-5544',
    cpf: '111.222.333-44',
    cep: '01310-100',
    address: 'Avenida Paulista',
    addressNumber: '1500',
    complement: 'Conjunto 12',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    status: 'lead',
    notes: 'Interessado em apoiar campanhas de doação e mobilizações sociais.',
    tags: ['Novo', 'Voluntário'],
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c4',
    name: 'Mariana Costa',
    phone: '(48) 99111-2222',
    cpf: '444.555.666-77',
    cep: '88054-000',
    address: 'Rodovia SC-401',
    addressNumber: '5000',
    complement: 'Block B',
    neighborhood: 'Saco Grande',
    city: 'Florianópolis',
    state: 'SC',
    status: 'client',
    notes: 'Professora da rede municipal, atua em causas de educação e cultura.',
    tags: ['Educação', 'Cultura'],
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'c5',
    name: 'Roberto Almeida',
    phone: '(48) 98400-1122',
    cpf: '888.777.666-55',
    cep: '88066-000',
    address: 'Avenida Campeche',
    addressNumber: '120',
    complement: '',
    neighborhood: 'Campeche',
    city: 'Florianópolis',
    state: 'SC',
    status: 'inactive',
    notes: 'Mudou-se de município, mas manteve contato para fins históricos.',
    tags: ['Sul da Ilha'],
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
  }
];

const defaultRequests: Request[] = [
  {
    id: 'r1',
    citizenId: 'c1',
    citizenName: 'Paulo Silva',
    title: 'Poda de Árvores na Av. Beira Mar',
    description: 'Árvores de grande porte obstruindo a sinalização de trânsito e a iluminação pública da avenida.',
    status: 'open',
    priority: 'high',
    subject: 'Infraestrutura',
    neighborhood: 'Centro',
    assignedTo: 'Secretaria de Obras',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r2',
    citizenId: 'c2',
    citizenName: 'Ana Souza',
    title: 'Manutenção de Iluminação Pública',
    description: 'Poste de luz queimado há mais de duas semanas em frente ao condomínio Bocaiúva.',
    status: 'in-progress',
    priority: 'medium',
    subject: 'Iluminação',
    neighborhood: 'Centro',
    assignedTo: 'Celesc',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r3',
    citizenId: 'c4',
    citizenName: 'Mariana Costa',
    title: 'Reforma do Parque Infantil',
    description: 'Brinquedos danificados e falta de areia no parquinho da praça comunitária.',
    status: 'resolved',
    priority: 'medium',
    subject: 'Lazer',
    neighborhood: 'Saco Grande',
    assignedTo: 'Secretaria de Esporte e Lazer',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

const defaultCollaborators: Collaborator[] = [
  {
    id: 'col1',
    name: 'Paulo Silva',
    email: 'paulo@gabinete.gov',
    phone: '(48) 99123-4567',
    role: 'admin',
    department: 'Gabinete',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'col2',
    name: 'Ana Souza',
    email: 'ana@gabinete.gov',
    phone: '(48) 98877-6655',
    role: 'manager',
    department: 'Comunicação',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultBasicRegisters: BasicRegister[] = [
  { id: 'b1', name: 'Partido Liberal (PL)', category: 'partido', code: '22', status: 'active', createdAt: new Date().toISOString() },
  { id: 'b2', name: 'Partido dos Trabalhadores (PT)', category: 'partido', code: '13', status: 'active', createdAt: new Date().toISOString() },
  { id: 'b3', name: 'Vereador', category: 'cargo', status: 'active', createdAt: new Date().toISOString() },
  { id: 'b4', name: 'Secretário Executivo', category: 'cargo', status: 'active', createdAt: new Date().toISOString() },
  { id: 'b5', name: 'Florianópolis', category: 'municipio', code: 'FLN', status: 'active', createdAt: new Date().toISOString() }
];

const defaultOrganizations: Organization[] = [
  { id: 'o1', name: 'Associação de Moradores do Centro (AMOCENTRO)', cnpj: '12.345.678/0001-90', email: 'contato@amocentro.org', phone: '(48) 3222-1111', notes: 'Entidade muito ativa em prol da segurança local.', tags: ['Moradores', 'Centro'], createdAt: new Date().toISOString() }
];

const defaultAppointments: Appointment[] = [
  { id: 'ap1', title: 'Reunião de Alinhamento de Demandas', date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0], time: '14:00', location: 'Gabinete Principal', description: 'Revisar os prazos de saneamento do Centro.', status: 'scheduled', createdAt: new Date().toISOString() },
  { id: 'ap2', title: 'Visita à Associação Saco Grande', date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0], time: '10:00', location: 'Saco Grande', description: 'Visitar praça comunitária e parquinho infantil.', status: 'scheduled', createdAt: new Date().toISOString() }
];

const defaultLandingPages: LandingPage[] = [
  { id: 'l1', title: 'Apoio à Revitalização da Orla', slug: 'revitaliza-orla', status: 'published', description: 'Página de apoio para coleta de assinaturas e demandas do Centro.', views: 342, submissions: 114, createdAt: new Date().toISOString() }
];

const defaultRelationships: Relationship[] = [
  { id: 'rel1', citizenId: 'c1', citizenName: 'Paulo Silva', contactName: 'Ana Souza', description: 'Paulo intermediou a comunicação com a AMOCENTRO.', createdAt: new Date().toISOString() }
];

const defaultSignatures: Signature[] = [
  { id: 's1', title: 'Emenda Parlamentar Obras 2026', key: 'EP-OBRAS-2026', documentUrl: 'http://example.com/doc.pdf', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=150', status: 'active', createdAt: new Date().toISOString() }
];

const defaultMobilizations: Mobilization[] = [
  { id: 'm1', name: 'Mutirão de Limpeza Praia', startDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), status: 'active', description: 'Mobilizar moradores para limpeza comunitária.', createdAt: new Date().toISOString() }
];

// --- FIM DA BASE DE DADOS MOCK ---

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

    if (isMockMode()) {
      // Carrega estatísticas do localStorage
      const citizens = getInitialMockData<Citizen>('citizens', defaultCitizens);
      const requests = getInitialMockData<Request>('requests', defaultRequests);

      const openCount = requests.filter(r => r.status === 'open').length;
      const inProgressCount = requests.filter(r => r.status === 'in-progress').length;
      const resolvedCount = requests.filter(r => r.status === 'resolved').length;

      const countBy = (field: 'neighborhood' | 'subject') => {
        const counts = new Map<string, number>();
        requests.forEach((item) => {
          const value = item[field]?.trim();
          if (value) counts.set(value, (counts.get(value) || 0) + 1);
        });
        return [...counts.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      setStats({
        citizens: citizens.length,
        citizensGrowth: 8,
        openDemands: openCount,
        inProgressDemands: inProgressCount,
        resolvedDemands: resolvedCount,
        topNeighborhoods: countBy('neighborhood'),
        topSubjects: countBy('subject'),
      });
      setLoading(false);
      return;
    }

    try {
      const [
        { count: cCount },
        { count: openCount },
        { count: inProgressCount },
        { count: resolvedCount },
        { data: requestsData },
      ] = await Promise.all([
        supabase.from('citizens').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('requests').select('neighborhood, subject').limit(1000),
      ]);

      const countBy = (field: 'neighborhood' | 'subject') => {
        const counts = new Map<string, number>();
        (requestsData || []).forEach((item) => {
          const value = item[field]?.trim();
          if (value) counts.set(value, (counts.get(value) || 0) + 1);
        });
        return [...counts.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      setStats({
        citizens: cCount || 0,
        citizensGrowth: 0,
        openDemands: openCount || 0,
        inProgressDemands: inProgressCount || 0,
        resolvedDemands: resolvedCount || 0,
        topNeighborhoods: countBy('neighborhood'),
        topSubjects: countBy('subject'),
      });
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

    if (isMockMode()) {
      let list = getInitialMockData<Citizen>('citizens', defaultCitizens);
      if (search) {
        const query = search.toLowerCase();
        list = list.filter(c => 
          (c.name || '').toLowerCase().includes(query) ||
          (c.phone || '').toLowerCase().includes(query) ||
          (c.cpf || '').toLowerCase().includes(query) ||
          (c.city || '').toLowerCase().includes(query) ||
          (c.neighborhood || '').toLowerCase().includes(query)
        );
      }
      const total = list.length;
      const from = (page - 1) * pageSize;
      const paginatedData = list.slice(from, from + pageSize);
      
      setResult({
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
      setLoading(false);
      return;
    }

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

  const create = useCallback(async (c: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Citizen>('citizens', defaultCitizens);
      const newCitizen: Citizen = {
        ...c,
        id: 'mock_c_' + Math.random().toString(36).substr(2, 9),
        tags: c.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [newCitizen, ...list];
      saveMockData('citizens', updated);
      await refresh();
      return newCitizen;
    }
    const { data, error: e } = await supabase.from('citizens').insert([c]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, c: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Citizen>('citizens', defaultCitizens);
      const updated = list.map(item => {
        if (item.id === id) {
          return { ...item, ...c, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      saveMockData('citizens', updated);
      await refresh();
      return updated.find(item => item.id === id) as Citizen;
    }
    const { data, error: e } = await supabase.from('citizens').update(c).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Citizen>('citizens', defaultCitizens);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('citizens', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('citizens').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { ...result, loading, error, refresh, create, update, remove };
}

export function useOrganizations(page = 1, pageSize = 10, search = '') {
  const [result, setResult] = useState<PaginatedResponse<Organization>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      let list = getInitialMockData<Organization>('organizations', defaultOrganizations);
      if (search) {
        list = list.filter(o => o.name?.toLowerCase().includes(search.toLowerCase()));
      }
      const total = list.length;
      const from = (page - 1) * pageSize;
      setResult({
        data: list.slice(from, from + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
      setLoading(false);
      return;
    }

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

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Organization>('organizations', defaultOrganizations);
      const filtered = list.filter(o => o.id !== id);
      saveMockData('organizations', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('organizations').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { ...result, loading, error, refresh, remove };
}

export function useAppointments(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Appointment>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<Appointment>('appointments', defaultAppointments);
      const total = list.length;
      const from = (page - 1) * pageSize;
      setResult({
        data: list.slice(from, from + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
      setLoading(false);
      return;
    }

    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await supabase.from('appointments').select('*', { count: 'exact' }).range(from, from + pageSize - 1).order('date', { ascending: false });
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (a: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Appointment>('appointments', defaultAppointments);
      const newAp: Appointment = {
        ...a,
        id: 'mock_ap_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveMockData('appointments', [newAp, ...list]);
      await refresh();
      return newAp;
    }
    const { data, error: e } = await supabase.from('appointments').insert([a]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, a: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Appointment>('appointments', defaultAppointments);
      const updated = list.map(item => (item.id === id ? { ...item, ...a } : item));
      saveMockData('appointments', updated);
      await refresh();
      return updated.find(item => item.id === id) as Appointment;
    }
    const { data, error: e } = await supabase.from('appointments').update(a).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Appointment>('appointments', defaultAppointments);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('appointments', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('appointments').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { ...result, loading, error, refresh, create, update, remove };
}

export function useLandingPages(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<LandingPage>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<LandingPage>('landing_pages', defaultLandingPages);
      const total = list.length;
      const from = (page - 1) * pageSize;
      setResult({
        data: list.slice(from, from + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
      setLoading(false);
      return;
    }

    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await supabase.from('landing_pages').select('*', { count: 'exact' }).range(from, from + pageSize - 1).order('created_at', { ascending: false });
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (l: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<LandingPage>('landing_pages', defaultLandingPages);
      const newLp: LandingPage = {
        ...l,
        id: 'mock_lp_' + Math.random().toString(36).substr(2, 9),
        views: 0,
        submissions: 0,
        createdAt: new Date().toISOString()
      };
      saveMockData('landing_pages', [newLp, ...list]);
      await refresh();
      return newLp;
    }
    const { data, error: e } = await supabase.from('landing_pages').insert([l]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, l: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<LandingPage>('landing_pages', defaultLandingPages);
      const updated = list.map(item => (item.id === id ? { ...item, ...l } : item));
      saveMockData('landing_pages', updated);
      await refresh();
      return updated.find(item => item.id === id) as LandingPage;
    }
    const { data, error: e } = await supabase.from('landing_pages').update(l).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<LandingPage>('landing_pages', defaultLandingPages);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('landing_pages', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('landing_pages').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { ...result, loading, error, refresh, create, update, remove };
}

export function useCollaborators() {
  const [data, setData] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<Collaborator>('collaborators', defaultCollaborators);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const { data: cols, error: err } = await supabase.from('collaborators').select('*').order('name');
      if (err) throw err;
      setData((cols || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (c: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Collaborator>('collaborators', defaultCollaborators);
      const newCol: Collaborator = {
        ...c,
        id: 'mock_col_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveMockData('collaborators', [newCol, ...list]);
      await refresh();
      return newCol;
    }
    const { data, error: e } = await supabase.from('collaborators').insert([c]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, c: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Collaborator>('collaborators', defaultCollaborators);
      const updated = list.map(item => (item.id === id ? { ...item, ...c, updatedAt: new Date().toISOString() } : item));
      saveMockData('collaborators', updated);
      await refresh();
      return updated.find(item => item.id === id) as Collaborator;
    }
    const { data, error: e } = await supabase.from('collaborators').update(c).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Collaborator>('collaborators', defaultCollaborators);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('collaborators', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('collaborators').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}

export function useBasicRegisters(category = '') {
  const [data, setData] = useState<BasicRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      let list = getInitialMockData<BasicRegister>('basic_registers', defaultBasicRegisters);
      if (category) {
        list = list.filter(r => r.category === category);
      }
      setData(list);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('basic_registers').select('*').order('name');
      if (category) query = query.eq('category', category);
      const { data: regs, error: err } = await query;
      if (err) throw err;
      setData((regs || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (b: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<BasicRegister>('basic_registers', defaultBasicRegisters);
      const newReg: BasicRegister = {
        ...b,
        id: 'mock_b_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveMockData('basic_registers', [newReg, ...list]);
      await refresh();
      return newReg;
    }
    const { data, error: e } = await supabase.from('basic_registers').insert([b]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, b: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<BasicRegister>('basic_registers', defaultBasicRegisters);
      const updated = list.map(item => (item.id === id ? { ...item, ...b } : item));
      saveMockData('basic_registers', updated);
      await refresh();
      return updated.find(item => item.id === id) as BasicRegister;
    }
    const { data, error: e } = await supabase.from('basic_registers').update(b).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<BasicRegister>('basic_registers', defaultBasicRegisters);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('basic_registers', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('basic_registers').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}

export function useMobilizations() {
  const [data, setData] = useState<Mobilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<Mobilization>('mobilizations', defaultMobilizations);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const { data: res, error: err } = await supabase.from('mobilizations').select('*').order('start_date');
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (m: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Mobilization>('mobilizations', defaultMobilizations);
      const newMob: Mobilization = {
        ...m,
        id: 'mock_m_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveMockData('mobilizations', [newMob, ...list]);
      await refresh();
      return newMob;
    }
    const { data, error: e } = await supabase.from('mobilizations').insert([m]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, m: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Mobilization>('mobilizations', defaultMobilizations);
      const updated = list.map(item => (item.id === id ? { ...item, ...m } : item));
      saveMockData('mobilizations', updated);
      await refresh();
      return updated.find(item => item.id === id) as Mobilization;
    }
    const { data, error: e } = await supabase.from('mobilizations').update(m).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Mobilization>('mobilizations', defaultMobilizations);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('mobilizations', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('mobilizations').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}

export function useRequests(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Request>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<Request>('requests', defaultRequests);
      const total = list.length;
      const from = (page - 1) * pageSize;
      setResult({
        data: list.slice(from, from + pageSize),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
      setLoading(false);
      return;
    }

    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await supabase.from('requests').select('*', { count: 'exact' }).range(from, from + pageSize - 1);
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (r: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Request>('requests', defaultRequests);
      const newReq: Request = {
        ...r,
        id: 'mock_r_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveMockData('requests', [newReq, ...list]);
      await refresh();
      return newReq;
    }
    const { data, error: e } = await supabase.from('requests').insert([r]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, r: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Request>('requests', defaultRequests);
      const updated = list.map(item => (item.id === id ? { ...item, ...r, updatedAt: new Date().toISOString() } : item));
      saveMockData('requests', updated);
      await refresh();
      return updated.find(item => item.id === id) as Request;
    }
    const { data, error: e } = await supabase.from('requests').update(r).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Request>('requests', defaultRequests);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('requests', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('requests').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { ...result, loading, error, refresh, create, update, remove };
}

export function useAmendments() {
  const [data, setData] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<Amendment>('amendments', []);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const { data: res, error: err } = await supabase.from('amendments').select('*').order('year', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (a: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Amendment>('amendments', []);
      const newAm: Amendment = {
        ...a,
        id: 'mock_am_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveMockData('amendments', [newAm, ...list]);
      await refresh();
      return newAm;
    }
    const { data, error: e } = await supabase.from('amendments').insert([a]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, a: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Amendment>('amendments', []);
      const updated = list.map(item => (item.id === id ? { ...item, ...a } : item));
      saveMockData('amendments', updated);
      await refresh();
      return updated.find(item => item.id === id) as Amendment;
    }
    const { data, error: e } = await supabase.from('amendments').update(a).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Amendment>('amendments', []);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('amendments', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('amendments').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}

export function useWhatsAppCampaigns() {
  const [data, setData] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<WhatsAppCampaign>('whatsapp_campaigns', []);
      setData(list);
      setLoading(false);
      return;
    }

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

    if (isMockMode()) {
      const list = getInitialMockData<EmailCampaign>('email_campaigns', []);
      setData(list);
      setLoading(false);
      return;
    }

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

    if (isMockMode()) {
      const list = getInitialMockData<Relationship>('relationships', defaultRelationships);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const { data: res, error: err } = await supabase.from('relationships').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (r: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Relationship>('relationships', defaultRelationships);
      const newRel: Relationship = {
        ...r,
        id: 'mock_rel_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveMockData('relationships', [newRel, ...list]);
      await refresh();
      return newRel;
    }
    const { data, error: e } = await supabase.from('relationships').insert([r]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, r: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Relationship>('relationships', defaultRelationships);
      const updated = list.map(item => (item.id === id ? { ...item, ...r } : item));
      saveMockData('relationships', updated);
      await refresh();
      return updated.find(item => item.id === id) as Relationship;
    }
    const { data, error: e } = await supabase.from('relationships').update(r).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Relationship>('relationships', defaultRelationships);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('relationships', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('relationships').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}

export function useSignatures() {
  const [data, setData] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const list = getInitialMockData<Signature>('signatures', defaultSignatures);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const { data: res, error: err } = await supabase.from('signatures').select('*').order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (s: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Signature>('signatures', defaultSignatures);
      const newSig: Signature = {
        ...s,
        id: 'mock_sig_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      saveMockData('signatures', [newSig, ...list]);
      await refresh();
      return newSig;
    }
    const { data, error: e } = await supabase.from('signatures').insert([s]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, s: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Signature>('signatures', defaultSignatures);
      const updated = list.map(item => (item.id === id ? { ...item, ...s } : item));
      saveMockData('signatures', updated);
      await refresh();
      return updated.find(item => item.id === id) as Signature;
    }
    const { data, error: e } = await supabase.from('signatures').update(s).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Signature>('signatures', defaultSignatures);
      const filtered = list.filter(item => item.id !== id);
      saveMockData('signatures', filtered);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('signatures').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}
