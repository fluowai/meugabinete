import type { 
  LandingPage, Citizen, Organization, Appointment, Relationship,
  Mobilization, Request, Amendment, WhatsAppCampaign, EmailCampaign,
  Report, Collaborator, BasicRegister, Signature, DashboardStats, PaginatedResponse
} from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const mockData = {
  dashboardStats: {
    citizens: 15234,
    citizensGrowth: 12.5,
    openDemands: 45,
    inProgressDemands: 28,
    resolvedDemands: 156,
    topNeighborhoods: [
      { name: 'Centro', count: 42 },
      { name: 'Jardim América', count: 35 },
      { name: 'Vila Nova', count: 28 },
      { name: 'Santo Antônio', count: 22 },
      { name: 'Bela Vista', count: 18 }
    ],
    topSubjects: [
      { name: 'Iluminação Pública', count: 56 },
      { name: 'Buraco na Via', count: 48 },
      { name: 'Poda de Árvore', count: 32 },
      { name: 'Limpeza de Terreno', count: 25 },
      { name: 'Segurança', count: 20 }
    ]
  } as DashboardStats,

  citizens: [
    { id: '1', name: 'João Silva Santos', email: 'joao.silva@email.com', phone: '(11) 99999-9999', cpf: '123.456.789-00', city: 'São Paulo', state: 'SP', neighborhood: 'Centro', tags: ['demandante frequente'], status: 'client' as const, score: 850, totalDemands: 25, createdAt: '2026-01-15', updatedAt: '2026-04-20' },
    { id: '2', name: 'Maria Oliveira Costa', email: 'maria.oliveira@email.com', phone: '(21) 98888-8888', cpf: '987.654.321-00', city: 'Rio de Janeiro', state: 'RJ', neighborhood: 'Jardim América', tags: ['líder comunitária'], status: 'prospect' as const, score: 620, totalDemands: 18, createdAt: '2026-02-01', updatedAt: '2026-04-18' },
    { id: '3', name: 'Pedro Henrique Santos', email: 'pedro.santos@email.com', phone: '(31) 97777-7777', cpf: '456.789.123-00', city: 'Belo Horizonte', state: 'MG', neighborhood: 'Vila Nova', tags: ['comerciante'], status: 'client' as const, score: 450, totalDemands: 12, createdAt: '2026-01-20', updatedAt: '2026-04-15' },
    { id: '4', name: 'Ana Paula Ferreira', email: 'ana.ferreira@email.com', phone: '(41) 96666-6666', cpf: '321.654.987-00', city: 'Curitiba', state: 'PR', neighborhood: 'Santo Antônio', tags: ['estudante'], status: 'lead' as const, score: 120, totalDemands: 5, createdAt: '2026-03-10', updatedAt: '2026-04-10' },
    { id: '5', name: 'Carlos Eduardo Lima', email: 'carlos.lima@email.com', phone: '(51) 95555-5555', cpf: '654.321.987-00', city: 'Porto Alegre', state: 'RS', neighborhood: 'Bela Vista', tags: ['aposentado'], status: 'client' as const, score: 380, totalDemands: 9, createdAt: '2026-02-28', updatedAt: '2026-04-08' },
    { id: '6', name: 'Juliana Aparecida', email: 'juliana@email.com', phone: '(61) 94444-4444', cpf: '789.123.456-00', city: 'Brasília', state: 'DF', neighborhood: 'Centro', tags: ['professora'], status: 'prospect' as const, score: 210, totalDemands: 4, createdAt: '2026-03-05', updatedAt: '2026-04-05' },
  ] as Citizen[],

  requests: [
    { id: '1', title: 'Troca de lâmpada', description: 'Poste em frente ao número 150 está apagado há 3 dias.', subject: 'Iluminação Pública', neighborhood: 'Centro', category: 'request' as const, priority: 'medium' as const, status: 'in-progress' as const, requesterId: '1', requesterName: 'João Silva Santos', requesterPhone: '(11) 99999-9999', assignedToName: 'Agente Virtual Luna', assignedToType: 'ai', createdAt: '2026-04-15', updatedAt: '2026-04-20' },
    { id: '2', title: 'Operação tapa-buraco', description: 'Buraco enorme na esquina da Rua Principal com a Rua Secundária.', subject: 'Buraco na Via', neighborhood: 'Jardim América', category: 'request' as const, priority: 'high' as const, status: 'open' as const, requesterId: '2', requesterName: 'Maria Oliveira Costa', requesterPhone: '(21) 98888-8888', assignedToName: 'Aguardando Triagem', assignedToType: 'ai', createdAt: '2026-04-10', updatedAt: '2026-04-18' },
    { id: '3', title: 'Limpeza de bueiro entupido', description: 'Sempre que chove a rua alaga por causa desse bueiro.', subject: 'Saneamento', neighborhood: 'Vila Nova', category: 'complaint' as const, priority: 'urgent' as const, status: 'open' as const, requesterId: '3', requesterName: 'Pedro Henrique Santos', requesterPhone: '(31) 97777-7777', assignedToName: 'Assessor Fabio', assignedToType: 'human', createdAt: '2026-04-20', updatedAt: '2026-04-20' },
  ] as Request[],

  organizations: [],
  appointments: [],
  landingPages: [],
  relationships: [],
  mobilizations: [],
  amendments: [],
  whatsappCampaigns: [],
  emailCampaigns: [],
  collaborators: [],
  basicRegisters: [],
  signatures: [],
};

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(100);
  return mockData.dashboardStats;
}

export async function getCitizens(page = 1, pageSize = 10, search?: string): Promise<PaginatedResponse<Citizen>> {
  await delay(100);
  let filtered = [...mockData.citizens];
  if (search) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf?.includes(search)
    );
  }
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return { data: paged, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
}

export async function getCitizen(id: string): Promise<Citizen | undefined> {
  await delay(50);
  return mockData.citizens.find(c => c.id === id);
}

export async function createCitizen(citizen: Partial<Citizen>): Promise<Citizen> {
  await delay(100);
  const newCitizen: Citizen = { ...citizen, id: generateId(), tags: [], status: 'lead', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Citizen;
  mockData.citizens.push(newCitizen);
  return newCitizen;
}

export async function updateCitizen(id: string, citizen: Partial<Citizen>): Promise<Citizen | undefined> {
  await delay(100);
  const index = mockData.citizens.findIndex(c => c.id === id);
  if (index >= 0) {
    mockData.citizens[index] = { ...mockData.citizens[index], ...citizen, updatedAt: new Date().toISOString() };
    return mockData.citizens[index];
  }
  return undefined;
}

export async function deleteCitizen(id: string): Promise<boolean> {
  await delay(100);
  const index = mockData.citizens.findIndex(c => c.id === id);
  if (index >= 0) {
    mockData.citizens.splice(index, 1);
    return true;
  }
  return false;
}

export async function getOrganizations(page = 1, pageSize = 10, search?: string): Promise<PaginatedResponse<Organization>> {
  await delay(100);
  let filtered = [...mockData.organizations];
  if (search) {
    filtered = filtered.filter(o => 
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.cnpj?.includes(search) ||
      o.email?.toLowerCase().includes(search)
    );
  }
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return { data: paged, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
}

export async function getOrganization(id: string): Promise<Organization | undefined> {
  await delay(50);
  return mockData.organizations.find(o => o.id === id);
}

export async function createOrganization(org: Partial<Organization>): Promise<Organization> {
  await delay(100);
  const newOrg: Organization = { ...org, id: generateId(), tags: [], contacts: [], status: 'lead', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Organization;
  mockData.organizations.push(newOrg);
  return newOrg;
}

export async function updateOrganization(id: string, org: Partial<Organization>): Promise<Organization | undefined> {
  await delay(100);
  const index = mockData.organizations.findIndex(o => o.id === id);
  if (index >= 0) {
    mockData.organizations[index] = { ...mockData.organizations[index], ...org, updatedAt: new Date().toISOString() };
    return mockData.organizations[index];
  }
  return undefined;
}

export async function deleteOrganization(id: string): Promise<boolean> {
  await delay(100);
  const index = mockData.organizations.findIndex(o => o.id === id);
  if (index >= 0) {
    mockData.organizations.splice(index, 1);
    return true;
  }
  return false;
}

export async function getAppointments(page = 1, pageSize = 10, status?: string): Promise<PaginatedResponse<Appointment>> {
  await delay(100);
  let filtered = [...mockData.appointments];
  if (status) {
    filtered = filtered.filter(a => a.status === status);
  }
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return { data: paged, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
}

export async function getAppointment(id: string): Promise<Appointment | undefined> {
  await delay(50);
  return mockData.appointments.find(a => a.id === id);
}

export async function createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
  await delay(100);
  const newAppointment: Appointment = { ...appointment, id: generateId(), type: 'meeting', priority: 'medium', status: 'scheduled', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Appointment;
  mockData.appointments.push(newAppointment);
  return newAppointment;
}

export async function updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment | undefined> {
  await delay(100);
  const index = mockData.appointments.findIndex(a => a.id === id);
  if (index >= 0) {
    mockData.appointments[index] = { ...mockData.appointments[index], ...appointment, updatedAt: new Date().toISOString() };
    return mockData.appointments[index];
  }
  return undefined;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  await delay(100);
  const index = mockData.appointments.findIndex(a => a.id === id);
  if (index >= 0) {
    mockData.appointments.splice(index, 1);
    return true;
  }
  return false;
}

export async function getLandingPages(page = 1, pageSize = 10, status?: string): Promise<PaginatedResponse<LandingPage>> {
  await delay(100);
  let filtered = [...mockData.landingPages];
  if (status) {
    filtered = filtered.filter(l => l.status === status);
  }
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return { data: paged, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
}

export async function getLandingPage(id: string): Promise<LandingPage | undefined> {
  await delay(50);
  return mockData.landingPages.find(l => l.id === id);
}

export async function createLandingPage(page: Partial<LandingPage>): Promise<LandingPage> {
  await delay(100);
  const newPage: LandingPage = { ...page, id: generateId(), views: 0, submissions: 0, status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as LandingPage;
  mockData.landingPages.push(newPage);
  return newPage;
}

export async function updateLandingPage(id: string, page: Partial<LandingPage>): Promise<LandingPage | undefined> {
  await delay(100);
  const index = mockData.landingPages.findIndex(l => l.id === id);
  if (index >= 0) {
    mockData.landingPages[index] = { ...mockData.landingPages[index], ...page, updatedAt: new Date().toISOString() };
    return mockData.landingPages[index];
  }
  return undefined;
}

export async function deleteLandingPage(id: string): Promise<boolean> {
  await delay(100);
  const index = mockData.landingPages.findIndex(l => l.id === id);
  if (index >= 0) {
    mockData.landingPages.splice(index, 1);
    return true;
  }
  return false;
}

export async function getMobilizations(): Promise<Mobilization[]> {
  await delay(100);
  return mockData.mobilizations;
}

export async function getRequests(page = 1, pageSize = 10, status?: string): Promise<PaginatedResponse<Request>> {
  await delay(100);
  let filtered = [...mockData.requests];
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  return { data: paged, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
}

export async function getAmendments(): Promise<Amendment[]> {
  await delay(100);
  return mockData.amendments;
}

export async function getWhatsAppCampaigns(): Promise<WhatsAppCampaign[]> {
  await delay(100);
  return mockData.whatsappCampaigns;
}

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  await delay(100);
  return mockData.emailCampaigns;
}

export async function getCollaborators(): Promise<Collaborator[]> {
  await delay(100);
  return mockData.collaborators;
}

export async function getBasicRegisters(category?: string): Promise<BasicRegister[]> {
  await delay(100);
  if (category) {
    return mockData.basicRegisters.filter(b => b.category === category);
  }
  return mockData.basicRegisters;
}

export async function getSignatures(): Promise<Signature[]> {
  await delay(100);
  return mockData.signatures;
}