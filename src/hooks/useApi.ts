import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../stores/appStore';
import type { 
  LandingPage, Citizen, Organization, Appointment, 
  Mobilization, Request, Amendment, WhatsAppCampaign, EmailCampaign,
  Collaborator, BasicRegister, Signature, Relationship, PaginatedResponse,
  Tenant, Plan, SupportTicket, SupportMessage, SuperAdminStats
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
      return JSON.parse(saved).map(mapKeys);
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

const MOCK_TENANT_ID = 'tenant_demo';

const getCurrentTenantId = (): string | null => {
  try {
    const state = useStore.getState();
    if (state.tenantOverride) return state.tenantOverride.tenantId;
    return state.user?.tenantId || null;
  } catch {
    return null;
  }
};

const defaultCitizens: Citizen[] = [
  {
    id: 'c1',
    tenantId: MOCK_TENANT_ID,
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
    tenantId: MOCK_TENANT_ID,
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
    tenantId: MOCK_TENANT_ID,
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
    tenantId: MOCK_TENANT_ID,
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
    tenantId: MOCK_TENANT_ID,
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
    tenantId: MOCK_TENANT_ID,
    title: 'Poda de Árvores na Av. Beira Mar',
    description: 'Árvores de grande porte obstruindo a sinalização de trânsito e a iluminação pública da avenida.',
    category: 'complaint',
    priority: 'high',
    status: 'open',
    subject: 'Infraestrutura',
    neighborhood: 'Centro',
    cep: '88015-200',
    address: 'Av. Beira Mar',
    addressNumber: 's/n',
    city: 'Florianópolis',
    state: 'SC',
    requesterId: 'c1',
    requesterName: 'Paulo Silva',
    assignedToName: 'Secretaria de Obras',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r2',
    tenantId: MOCK_TENANT_ID,
    title: 'Manutenção de Iluminação Pública',
    description: 'Poste de luz queimado há mais de duas semanas em frente ao condomínio Bocaiúva.',
    category: 'complaint',
    priority: 'medium',
    status: 'in-progress',
    subject: 'Iluminação',
    neighborhood: 'Centro',
    cep: '88020-100',
    address: 'Rua Bocaiúva',
    addressNumber: '150',
    city: 'Florianópolis',
    state: 'SC',
    requesterId: 'c2',
    requesterName: 'Ana Souza',
    assignedToName: 'Celesc',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'r3',
    tenantId: MOCK_TENANT_ID,
    title: 'Reforma do Parque Infantil',
    description: 'Brinquedos danificados e falta de areia no parquinho da praça comunitária.',
    category: 'request',
    priority: 'medium',
    status: 'resolved',
    subject: 'Lazer',
    neighborhood: 'Saco Grande',
    cep: '88032-000',
    address: 'Praça Comunitária do Saco Grande',
    addressNumber: 's/n',
    city: 'Florianópolis',
    state: 'SC',
    requesterId: 'c4',
    requesterName: 'Mariana Costa',
    assignedToName: 'Secretaria de Esporte e Lazer',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  }
];

const defaultCollaborators: Collaborator[] = [
  {
    id: 'col1',
    tenantId: MOCK_TENANT_ID,
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
    tenantId: MOCK_TENANT_ID,
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
  { id: 'b1', tenantId: MOCK_TENANT_ID, name: 'Partido Liberal (PL)', category: 'party', code: '22', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b2', tenantId: MOCK_TENANT_ID, name: 'Partido dos Trabalhadores (PT)', category: 'party', code: '13', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b3', tenantId: MOCK_TENANT_ID, name: 'Vereador', category: 'position', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b4', tenantId: MOCK_TENANT_ID, name: 'Secretário Executivo', category: 'position', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'b5', tenantId: MOCK_TENANT_ID, name: 'Florianópolis', category: 'county', code: 'FLN', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const defaultOrganizations: Organization[] = [
  { id: 'o1', tenantId: MOCK_TENANT_ID, name: 'Associação de Moradores do Centro (AMOCENTRO)', type: 'association', cnpj: '12.345.678/0001-90', email: 'contato@amocentro.org', phone: '(48) 3222-1111', notes: 'Entidade muito ativa em prol da segurança local.', tags: ['Moradores', 'Centro'], contacts: [], status: 'partner', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const defaultAppointments: Appointment[] = [
  { id: 'ap1', tenantId: MOCK_TENANT_ID, title: 'Reunião de Alinhamento de Demandas', date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0], time: '14:00', location: 'Gabinete Principal', description: 'Revisar os prazos de saneamento do Centro.', status: 'scheduled', type: 'meeting', priority: 'high', attendees: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ap2', tenantId: MOCK_TENANT_ID, title: 'Visita à Associação Saco Grande', date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0], time: '10:00', location: 'Saco Grande', description: 'Visitar praça comunitária e parquinho infantil.', status: 'scheduled', type: 'visit', priority: 'medium', attendees: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const defaultLandingPages: LandingPage[] = [
  { id: 'l1', tenantId: MOCK_TENANT_ID, name: 'Apoio à Revitalização da Orla', slug: 'revitaliza-orla', status: 'published', description: 'Página de apoio para coleta de assinaturas e demandas do Centro.', lgpdText: '', confirmationTitle: '', confirmationMessage: '', confirmationButtonText: '', confirmationButtonColor: '', showShareButton: false, shareButtonText: '', shareButtonColor: '', fields: [], views: 342, submissions: 114, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const defaultRelationships: Relationship[] = [
  { id: 'rel1', tenantId: MOCK_TENANT_ID, type: 'political', citizenId: 'c1', relatedToId: 'c2', relatedToName: 'Ana Souza', notes: 'Paulo intermediou a comunicação com a AMOCENTRO.', strength: 'strong', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const defaultSignatures: Signature[] = [
  { id: 's1', tenantId: MOCK_TENANT_ID, name: 'Emenda Parlamentar Obras 2026', role: 'Vereador', documentUrl: 'http://example.com/doc.pdf', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=150', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const defaultMobilizations: Mobilization[] = [
  { id: 'm1', tenantId: MOCK_TENANT_ID, name: 'Mutirão de Limpeza Praia', type: 'event', startDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), status: 'active', description: 'Mobilizar moradores para limpeza comunitária.', tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
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
      const tenantId = getCurrentTenantId();
      let citizens = getInitialMockData<Citizen>('citizens', defaultCitizens);
      let requests = getInitialMockData<Request>('requests', defaultRequests);
      if (tenantId) {
        citizens = citizens.filter(c => c.tenantId === tenantId);
        requests = requests.filter(r => r.tenantId === tenantId);
      }

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
      const tenantId = getCurrentTenantId();
      const applyTenantFilter = (q: any) => tenantId ? q.eq('tenant_id', tenantId) : q;
      const [
        { count: cCount },
        { count: openCount },
        { count: inProgressCount },
        { count: resolvedCount },
        { data: requestsData },
      ] = await Promise.all([
        applyTenantFilter(supabase.from('citizens').select('*', { count: 'exact', head: true })),
        applyTenantFilter(supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open')),
        applyTenantFilter(supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'in-progress')),
        applyTenantFilter(supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'resolved')),
        applyTenantFilter(supabase.from('requests').select('neighborhood, subject').limit(1000)),
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
      const tenantId = getCurrentTenantId();
      let list = getInitialMockData<Citizen>('citizens', defaultCitizens);
      if (tenantId) list = list.filter(c => c.tenantId === tenantId);
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
      const tenantId = getCurrentTenantId();
      let query = supabase.from('citizens').select('*', { count: 'exact' });
      if (tenantId) query = query.eq('tenant_id', tenantId);
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Citizen>('citizens', defaultCitizens);
      const newCitizen: Citizen = {
        ...c,
        id: 'mock_c_' + Math.random().toString(36).substr(2, 9),
        tenantId: c.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      let list = getInitialMockData<Organization>('organizations', defaultOrganizations);
      if (tenantId) list = list.filter(o => o.tenantId === tenantId);
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
      const tenantId = getCurrentTenantId();
      let query = supabase.from('organizations').select('*', { count: 'exact' });
      if (tenantId) query = query.eq('tenant_id', tenantId);
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

  const create = useCallback(async (o: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Organization>('organizations', defaultOrganizations);
      const newOrg: Organization = {
        ...o,
        id: 'mock_o_' + Math.random().toString(36).substr(2, 9),
        tenantId: o.tenantId || tenantId || undefined,
        tags: o.tags || [],
        contacts: o.contacts || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveMockData('organizations', [newOrg, ...list]);
      await refresh();
      return newOrg;
    }
    const { data, error: e } = await supabase.from('organizations').insert([o]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, o: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Organization>('organizations', defaultOrganizations);
      const updated = list.map(item => {
        if (item.id === id) {
          return { ...item, ...o, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      saveMockData('organizations', updated);
      await refresh();
      return updated.find(item => item.id === id) as Organization;
    }
    const { data, error: e } = await supabase.from('organizations').update(o).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  return { ...result, loading, error, refresh, create, update, remove };
}

export function useAppointments(page = 1, pageSize = 10) {
  const [result, setResult] = useState<PaginatedResponse<Appointment>>({ data: [], total: 0, page, pageSize, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);

    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Appointment>('appointments', defaultAppointments).filter(a => !tenantId || a.tenantId === tenantId);
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
      const tenantId = getCurrentTenantId();
      const from = (page - 1) * pageSize;
      let aptQuery = supabase.from('appointments').select('*', { count: 'exact' });
      if (tenantId) aptQuery = aptQuery.eq('tenant_id', tenantId);
      const { data, count, error: err } = await aptQuery.range(from, from + pageSize - 1).order('date', { ascending: false });
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (a: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Appointment>('appointments', defaultAppointments);
      const newAp: Appointment = {
        ...a,
        id: 'mock_ap_' + Math.random().toString(36).substr(2, 9),
        tenantId: a.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<LandingPage>('landing_pages', defaultLandingPages).filter(l => !tenantId || l.tenantId === tenantId);
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
      const tenantId = getCurrentTenantId();
      const from = (page - 1) * pageSize;
      let lpQuery = supabase.from('landing_pages').select('*', { count: 'exact' });
      if (tenantId) lpQuery = lpQuery.eq('tenant_id', tenantId);
      const { data, count, error: err } = await lpQuery.range(from, from + pageSize - 1).order('created_at', { ascending: false });
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (l: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<LandingPage>('landing_pages', defaultLandingPages);
      const newLp: LandingPage = {
        ...l,
        id: 'mock_lp_' + Math.random().toString(36).substr(2, 9),
        tenantId: l.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Collaborator>('collaborators', defaultCollaborators).filter(c => !tenantId || c.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let colQuery = supabase.from('collaborators').select('*');
      if (tenantId) colQuery = colQuery.eq('tenant_id', tenantId);
      const { data: cols, error: err } = await colQuery.order('name');
      if (err) throw err;
      setData((cols || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (c: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Collaborator>('collaborators', defaultCollaborators);
      const newCol: Collaborator = {
        ...c,
        id: 'mock_col_' + Math.random().toString(36).substr(2, 9),
        tenantId: c.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      let list = getInitialMockData<BasicRegister>('basic_registers', defaultBasicRegisters);
      if (tenantId) list = list.filter(r => r.tenantId === tenantId);
      if (category) {
        list = list.filter(r => r.category === category);
      }
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let query = supabase.from('basic_registers').select('*').order('name');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      if (category) query = query.eq('category', category);
      const { data: regs, error: err } = await query;
      if (err) throw err;
      setData((regs || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (b: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<BasicRegister>('basic_registers', defaultBasicRegisters);
      const newReg: BasicRegister = {
        ...b,
        id: 'mock_b_' + Math.random().toString(36).substr(2, 9),
        tenantId: b.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Mobilization>('mobilizations', defaultMobilizations).filter(m => !tenantId || m.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let mobQuery = supabase.from('mobilizations').select('*');
      if (tenantId) mobQuery = mobQuery.eq('tenant_id', tenantId);
      const { data: res, error: err } = await mobQuery.order('start_date');
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (m: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Mobilization>('mobilizations', defaultMobilizations);
      const newMob: Mobilization = {
        ...m,
        id: 'mock_m_' + Math.random().toString(36).substr(2, 9),
        tenantId: m.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Request>('requests', defaultRequests).filter(r => !tenantId || r.tenantId === tenantId);
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
      const tenantId = getCurrentTenantId();
      const from = (page - 1) * pageSize;
      let reqQuery = supabase.from('requests').select('*', { count: 'exact' });
      if (tenantId) reqQuery = reqQuery.eq('tenant_id', tenantId);
      const { data, count, error: err } = await reqQuery.range(from, from + pageSize - 1);
      if (err) throw err;
      setResult({ data: (data || []).map(mapKeys), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (r: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Request>('requests', defaultRequests);
      const newReq: Request = {
        ...r,
        id: 'mock_r_' + Math.random().toString(36).substr(2, 9),
        tenantId: r.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Amendment>('amendments', []).filter(a => !tenantId || a.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let amQuery = supabase.from('amendments').select('*');
      if (tenantId) amQuery = amQuery.eq('tenant_id', tenantId);
      const { data: res, error: err } = await amQuery.order('year', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (a: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Amendment>('amendments', []);
      const newAm: Amendment = {
        ...a,
        id: 'mock_am_' + Math.random().toString(36).substr(2, 9),
        tenantId: a.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<WhatsAppCampaign>('whatsapp_campaigns', []).filter(w => !tenantId || w.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let waQuery = supabase.from('whatsapp_campaigns').select('*');
      if (tenantId) waQuery = waQuery.eq('tenant_id', tenantId);
      const { data: res, error: err } = await waQuery.order('created_at', { ascending: false });
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<EmailCampaign>('email_campaigns', []).filter(e => !tenantId || e.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let ecQuery = supabase.from('email_campaigns').select('*');
      if (tenantId) ecQuery = ecQuery.eq('tenant_id', tenantId);
      const { data: res, error: err } = await ecQuery.order('created_at', { ascending: false });
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Relationship>('relationships', defaultRelationships).filter(r => !tenantId || r.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let relQuery = supabase.from('relationships').select('*');
      if (tenantId) relQuery = relQuery.eq('tenant_id', tenantId);
      const { data: res, error: err } = await relQuery.order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (r: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Relationship>('relationships', defaultRelationships);
      const newRel: Relationship = {
        ...r,
        id: 'mock_rel_' + Math.random().toString(36).substr(2, 9),
        tenantId: r.tenantId || tenantId || undefined,
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
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Signature>('signatures', defaultSignatures).filter(s => !tenantId || s.tenantId === tenantId);
      setData(list);
      setLoading(false);
      return;
    }

    try {
      const tenantId = getCurrentTenantId();
      let sigQuery = supabase.from('signatures').select('*');
      if (tenantId) sigQuery = sigQuery.eq('tenant_id', tenantId);
      const { data: res, error: err } = await sigQuery.order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (s: any) => {
    if (isMockMode()) {
      const tenantId = getCurrentTenantId();
      const list = getInitialMockData<Signature>('signatures', defaultSignatures);
      const newSig: Signature = {
        ...s,
        id: 'mock_sig_' + Math.random().toString(36).substr(2, 9),
        tenantId: s.tenantId || tenantId || undefined,
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

// ===========================
// HOOKS SAAS (MULTI-TENANT)
// ===========================

const defaultPlans: Plan[] = [
  {
    id: 'plan_basic',
    name: 'Básico',
    description: 'Para vereadores com orçamento reduzido',
    price: 97,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Até 500 cidadãos cadastrados',
      'Até 100 demandas mensais',
      'Até 3 colaboradores',
      'Dashboard básico',
      'WhatsApp integrado',
      'Suporte por email',
    ],
    limits: {
      maxCitizens: 500, maxRequests: 100, maxOrganizations: 20,
      maxAppointments: 50, maxCollaborators: 3, maxMobilizations: 10,
      maxLandingPages: 2, maxAmendments: 20, maxWhatsAppCampaigns: 5,
      maxEmailCampaigns: 5, maxTeamMembers: 3, maxStorageMb: 500,
      hasWhatsApp: true, hasAI: false, hasReports: true, hasApi: false, hasPrioritySupport: false,
    },
    active: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan_pro',
    name: 'Profissional',
    description: 'Para deputados estaduais com equipe média',
    price: 197,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Até 5.000 cidadãos cadastrados',
      'Até 500 demandas mensais',
      'Até 10 colaboradores',
      'Dashboard completo',
      'WhatsApp + IA integrados',
      'Landing pages ilimitadas',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    limits: {
      maxCitizens: 5000, maxRequests: 500, maxOrganizations: 100,
      maxAppointments: 200, maxCollaborators: 10, maxMobilizations: 50,
      maxLandingPages: 10, maxAmendments: 100, maxWhatsAppCampaigns: 20,
      maxEmailCampaigns: 20, maxTeamMembers: 10, maxStorageMb: 2000,
      hasWhatsApp: true, hasAI: true, hasReports: true, hasApi: true, hasPrioritySupport: true,
    },
    active: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    description: 'Para deputados federais/senadores com equipe grande',
    price: 497,
    currency: 'BRL',
    interval: 'monthly',
    features: [
      'Cidadãos ilimitados',
      'Demandas ilimitadas',
      'Colaboradores ilimitados',
      'Todos os recursos',
      'API pública',
      'Domínio personalizado',
      'Gerente de sucesso dedicado',
      'SLA 24h',
    ],
    limits: {
      maxCitizens: 999999, maxRequests: 999999, maxOrganizations: 999999,
      maxAppointments: 999999, maxCollaborators: 999999, maxMobilizations: 999999,
      maxLandingPages: 999999, maxAmendments: 999999, maxWhatsAppCampaigns: 999999,
      maxEmailCampaigns: 999999, maxTeamMembers: 999999, maxStorageMb: 50000,
      hasWhatsApp: true, hasAI: true, hasReports: true, hasApi: true, hasPrioritySupport: true,
    },
    active: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
];

const defaultTenants: Tenant[] = [
  {
    id: 'tenant_demo',
    name: 'Gabinete Demo',
    slug: 'demo',
    planId: 'plan_pro',
    email: 'demo@gabinete360.com.br',
    phone: '(48) 99999-0001',
    status: 'active',
    settings: {
      timezone: 'America/Sao_Paulo', locale: 'pt-BR', theme: 'light',
      businessHours: [
        { day: 1, open: '08:00', close: '18:00', enabled: true },
        { day: 2, open: '08:00', close: '18:00', enabled: true },
        { day: 3, open: '08:00', close: '18:00', enabled: true },
        { day: 4, open: '08:00', close: '18:00', enabled: true },
        { day: 5, open: '08:00', close: '17:00', enabled: true },
        { day: 6, open: '', close: '', enabled: false },
        { day: 0, open: '', close: '', enabled: false },
      ],
      primaryColor: '#2563eb',
    },
    assignedUsers: 3,
    createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'tenant_vereador',
    name: 'Vereador Carlos Santos',
    slug: 'carlos-santos',
    planId: 'plan_basic',
    email: 'carlos@gabinete360.com.br',
    status: 'active',
    settings: {
      timezone: 'America/Sao_Paulo', locale: 'pt-BR', theme: 'light',
      businessHours: [
        { day: 1, open: '09:00', close: '17:00', enabled: true },
        { day: 2, open: '09:00', close: '17:00', enabled: true },
        { day: 3, open: '09:00', close: '17:00', enabled: true },
        { day: 4, open: '09:00', close: '17:00', enabled: true },
        { day: 5, open: '09:00', close: '16:00', enabled: true },
        { day: 6, open: '', close: '', enabled: false },
        { day: 0, open: '', close: '', enabled: false },
      ],
      primaryColor: '#059669',
    },
    assignedUsers: 1,
    createdAt: '2024-07-15T00:00:00Z', updatedAt: '2024-07-15T00:00:00Z',
  },
  {
    id: 'tenant_deputado',
    name: 'Deputada Maria Oliveira',
    slug: 'maria-oliveira',
    planId: 'plan_enterprise',
    email: 'maria@gabinete360.com.br',
    phone: '(48) 99999-0002',
    status: 'active',
    settings: {
      timezone: 'America/Sao_Paulo', locale: 'pt-BR', theme: 'light',
      businessHours: [
        { day: 1, open: '08:00', close: '19:00', enabled: true },
        { day: 2, open: '08:00', close: '19:00', enabled: true },
        { day: 3, open: '08:00', close: '19:00', enabled: true },
        { day: 4, open: '08:00', close: '19:00', enabled: true },
        { day: 5, open: '08:00', close: '18:00', enabled: true },
        { day: 6, open: '09:00', close: '12:00', enabled: true },
        { day: 0, open: '', close: '', enabled: false },
      ],
      primaryColor: '#7c3aed',
    },
    assignedUsers: 8,
    createdAt: '2024-03-01T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z',
  },
];

const defaultSupportTickets: SupportTicket[] = [
  {
    id: 'ticket_1',
    tenantId: 'tenant_demo',
    tenantName: 'Gabinete Demo',
    subject: 'Problema ao enviar campanha WhatsApp',
    message: 'Estou tentando enviar uma campanha de WhatsApp mas aparece erro de conexão.',
    category: 'bug',
    priority: 'high',
    status: 'in_progress',
    messages: [
      {
        id: 'msg_1', ticketId: 'ticket_1', authorId: 'user_demo', authorName: 'Admin Demo',
        authorType: 'tenant', message: 'Estou tentando enviar uma campanha de WhatsApp mas aparece erro de conexão.', createdAt: '2024-08-10T14:30:00Z',
      },
      {
        id: 'msg_2', ticketId: 'ticket_1', authorId: 'support_1', authorName: 'Suporte Técnico',
        authorType: 'support', message: 'Olá! Verificamos que seu dispositivo WhatsApp foi desconectado. Pode tentar reconectar em Conexões?', createdAt: '2024-08-10T15:00:00Z',
      },
    ],
    assignedToName: 'Suporte Técnico',
    createdBy: 'user_demo',
    createdByName: 'Admin Demo',
    createdAt: '2024-08-10T14:30:00Z', updatedAt: '2024-08-10T15:00:00Z',
  },
  {
    id: 'ticket_2',
    tenantId: 'tenant_vereador',
    tenantName: 'Vereador Carlos Santos',
    subject: 'Dúvida sobre exportação de relatórios',
    message: 'Como faço para exportar a lista de cidadãos em Excel?',
    category: 'question',
    priority: 'low',
    status: 'open',
    messages: [
      {
        id: 'msg_3', ticketId: 'ticket_2', authorId: 'user_carlos', authorName: 'Carlos Santos',
        authorType: 'tenant', message: 'Como faço para exportar a lista de cidadãos em Excel?', createdAt: '2024-08-11T09:00:00Z',
      },
    ],
    createdBy: 'user_carlos',
    createdByName: 'Carlos Santos',
    createdAt: '2024-08-11T09:00:00Z', updatedAt: '2024-08-11T09:00:00Z',
  },
];

// --- HOOK: Tenants (Super Admin) ---
export function useTenants(page = 1, pageSize = 20) {
  const [data, setData] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    if (isMockMode()) {
      const list = getInitialMockData<Tenant>('tenants', defaultTenants);
      const totalItems = list.length;
      const from = (page - 1) * pageSize;
      setData(list.slice(from, from + pageSize));
      setTotal(totalItems);
      setLoading(false);
      return;
    }
    try {
      const from = (page - 1) * pageSize;
      const { data: res, count, error: err } = await supabase.from('tenants').select('*', { count: 'exact' }).range(from, from + pageSize - 1).order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
      setTotal(count || 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (t: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Tenant>('tenants', defaultTenants);
      const newTenant: Tenant = { ...t, id: 'tenant_' + Math.random().toString(36).substr(2, 9), assignedUsers: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveMockData('tenants', [newTenant, ...list]);
      await refresh();
      return newTenant;
    }
    const { data, error: e } = await supabase.from('tenants').insert([t]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, t: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Tenant>('tenants', defaultTenants);
      const updated = list.map(item => (item.id === id ? { ...item, ...t, updatedAt: new Date().toISOString() } : item));
      saveMockData('tenants', updated);
      await refresh();
      return updated.find(item => item.id === id) as Tenant;
    }
    const { data, error: e } = await supabase.from('tenants').update(t).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Tenant>('tenants', defaultTenants);
      saveMockData('tenants', list.filter(item => item.id !== id));
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('tenants').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, total, loading, error, refresh, create, update, remove };
}

// --- HOOK: Plans (Super Admin) ---
export function usePlans() {
  const [data, setData] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    if (isMockMode()) {
      setData(getInitialMockData<Plan>('plans', defaultPlans));
      setLoading(false);
      return;
    }
    try {
      const { data: res, error: err } = await supabase.from('plans').select('*').order('price');
      if (err) throw err;
      setData((res || []).map(mapKeys));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (p: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Plan>('plans', defaultPlans);
      const newPlan: Plan = { ...p, id: 'plan_' + Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      saveMockData('plans', [newPlan, ...list]);
      await refresh();
      return newPlan;
    }
    const { data, error: e } = await supabase.from('plans').insert([p]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const update = useCallback(async (id: string, p: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<Plan>('plans', defaultPlans);
      const updated = list.map(item => (item.id === id ? { ...item, ...p, updatedAt: new Date().toISOString() } : item));
      saveMockData('plans', updated);
      await refresh();
      return updated.find(item => item.id === id) as Plan;
    }
    const { data, error: e } = await supabase.from('plans').update(p).eq('id', id).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<Plan>('plans', defaultPlans);
      saveMockData('plans', list.filter(item => item.id !== id));
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('plans').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, loading, error, refresh, create, update, remove };
}

// --- HOOK: Support Tickets ---
export function useSupportTickets(page = 1, pageSize = 20, tenantFilter = '') {
  const [data, setData] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    if (isMockMode()) {
      let list = getInitialMockData<SupportTicket>('support_tickets', defaultSupportTickets);
      if (tenantFilter) list = list.filter(t => t.tenantId === tenantFilter);
      const totalItems = list.length;
      const from = (page - 1) * pageSize;
      setData(list.slice(from, from + pageSize));
      setTotal(totalItems);
      setLoading(false);
      return;
    }
    try {
      let query = supabase.from('support_tickets').select('*', { count: 'exact' });
      if (tenantFilter) query = query.eq('tenant_id', tenantFilter);
      const from = (page - 1) * pageSize;
      const { data: res, count, error: err } = await query.range(from, from + pageSize - 1).order('created_at', { ascending: false });
      if (err) throw err;
      setData((res || []).map(mapKeys));
      setTotal(count || 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, [page, pageSize, tenantFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (t: any) => {
    if (isMockMode()) {
      const list = getInitialMockData<SupportTicket>('support_tickets', defaultSupportTickets);
      const newTicket: SupportTicket = {
        ...t, id: 'ticket_' + Math.random().toString(36).substr(2, 9),
        messages: [{ id: 'msg_' + Math.random().toString(36).substr(2, 9), ticketId: '', authorId: t.createdBy, authorName: t.createdByName || '', authorType: 'tenant', message: t.message, createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      saveMockData('support_tickets', [newTicket, ...list]);
      await refresh();
      return newTicket;
    }
    const { data, error: e } = await supabase.from('support_tickets').insert([t]).select().single();
    if (e) throw e;
    await refresh();
    return mapKeys(data);
  }, [refresh]);

  const addMessage = useCallback(async (ticketId: string, msg: SupportMessage) => {
    if (isMockMode()) {
      const list = getInitialMockData<SupportTicket>('support_tickets', defaultSupportTickets);
      const updated = list.map(item => {
        if (item.id !== ticketId) return item;
        return { ...item, messages: [...(item.messages || []), msg], updatedAt: new Date().toISOString() };
      });
      saveMockData('support_tickets', updated);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('support_ticket_messages').insert([msg]);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  const updateStatus = useCallback(async (id: string, status: SupportTicket['status']) => {
    if (isMockMode()) {
      const list = getInitialMockData<SupportTicket>('support_tickets', defaultSupportTickets);
      const updated = list.map(item => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item));
      saveMockData('support_tickets', updated);
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('support_tickets').update({ status }).eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (isMockMode()) {
      const list = getInitialMockData<SupportTicket>('support_tickets', defaultSupportTickets);
      saveMockData('support_tickets', list.filter(item => item.id !== id));
      await refresh();
      return;
    }
    const { error: e } = await supabase.from('support_tickets').delete().eq('id', id);
    if (e) throw e;
    await refresh();
  }, [refresh]);

  return { data, total, loading, error, refresh, create, addMessage, updateStatus, remove };
}

// --- HOOK: Super Admin Stats ---
export function useSuperAdminStats() {
  const [stats, setStats] = useState<SuperAdminStats>({
    totalTenants: 0, activeTenants: 0, trialTenants: 0, suspendedTenants: 0,
    totalPlans: 0, openTickets: 0, totalUsers: 0, totalStorageUsed: 0,
    monthlyRevenue: 0, revenueGrowth: 0, recentTenants: [], recentTickets: [],
    topPlans: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    if (isMockMode()) {
      const tenants = getInitialMockData<Tenant>('tenants', defaultTenants);
      const plans = getInitialMockData<Plan>('plans', defaultPlans);
      const tickets = getInitialMockData<SupportTicket>('support_tickets', defaultSupportTickets);
      const activeTenants = tenants.filter(t => t.status === 'active');
      const planCounts: Record<string, { count: number; planName: string; price: number }> = {};
      for (const t of tenants) {
        const plan = plans.find(p => p.id === t.planId);
        const key = t.planId;
        if (!planCounts[key]) planCounts[key] = { count: 0, planName: plan?.name || 'Unknown', price: plan?.price || 0 };
        planCounts[key].count++;
      }
      setStats({
        totalTenants: tenants.length,
        activeTenants: activeTenants.length,
        trialTenants: tenants.filter(t => t.status === 'trial').length,
        suspendedTenants: tenants.filter(t => t.status === 'suspended').length,
        totalPlans: plans.length,
        openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
        totalUsers: tenants.reduce((sum, t) => sum + t.assignedUsers, 0),
        totalStorageUsed: 0,
        monthlyRevenue: Object.values(planCounts).reduce((sum, p) => sum + p.count * p.price, 0),
        revenueGrowth: 12.5,
        recentTenants: tenants.slice(0, 5),
        recentTickets: tickets.slice(0, 5).map(t => ({ ...t, tenantName: tenants.find(ten => ten.id === t.tenantId)?.name || t.tenantName || '' })),
        topPlans: Object.entries(planCounts).map(([planId, info]) => ({ planName: info.planName, count: info.count, revenue: info.count * info.price })),
      });
      setLoading(false);
      return;
    }
    try {
      const [tenantsRes, plansRes, ticketsRes] = await Promise.all([
        supabase.from('tenants').select('id, status, plan_id, assigned_users, created_at'),
        supabase.from('plans').select('id, name, price, active'),
        supabase.from('support_tickets').select('id, tenant_id, subject, status, priority, created_at').eq('status', 'open').or('status.eq.in_progress'),
      ]);
      const tenants = (tenantsRes.data || []).map(mapKeys);
      const plans = (plansRes.data || []).map(mapKeys);
      const tickets = (ticketsRes.data || []).map(mapKeys);
      const activeTenants = tenants.filter((t: any) => t.status === 'active');
      const planCounts: Record<string, { count: number; planName: string; price: number }> = {};
      for (const t of tenants) {
        const plan = plans.find((p: any) => p.id === t.planId);
        const key = t.planId;
        if (!planCounts[key]) planCounts[key] = { count: 0, planName: plan?.name || 'Unknown', price: plan?.price || 0 };
        planCounts[key].count++;
      }
      setStats({
        totalTenants: tenants.length, activeTenants: activeTenants.length,
        trialTenants: tenants.filter((t: any) => t.status === 'trial').length,
        suspendedTenants: tenants.filter((t: any) => t.status === 'suspended').length,
        totalPlans: plans.filter((p: any) => p.active).length, openTickets: tickets.length,
        totalUsers: tenants.reduce((sum: number, t: any) => sum + (t.assignedUsers || 0), 0),
        totalStorageUsed: 0, monthlyRevenue: Object.values(planCounts).reduce((sum: number, p: any) => sum + p.count * p.price, 0),
        revenueGrowth: 12.5, recentTenants: tenants.slice(0, 5), recentTickets: tickets.slice(0, 5),
        topPlans: Object.entries(planCounts).map(([planId, info]: any) => ({ planName: info.planName, count: info.count, revenue: info.count * info.price })),
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { stats, loading, error, refresh };
}
