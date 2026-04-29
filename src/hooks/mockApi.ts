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
    organizations: 156,
    organizationsGrowth: 8.3,
    appointments: 89,
    appointmentsGrowth: -2.1,
    landingPages: 12,
    landingPagesGrowth: 25.0,
    mobilizations: 28,
    mobilizationsGrowth: 15.7
  } as DashboardStats,

  citizens: [
    { id: '1', name: 'João Silva Santos', email: 'joao.silva@email.com', phone: '(11) 99999-9999', cpf: '123.456.789-00', city: 'São Paulo', state: 'SP', tags: ['voluntário', 'eleitor'], status: 'client' as const, createdAt: '2026-01-15', updatedAt: '2026-04-20' },
    { id: '2', name: 'Maria Oliveira Costa', email: 'maria.oliveira@email.com', phone: '(21) 98888-8888', cpf: '987.654.321-00', city: 'Rio de Janeiro', state: 'RJ', tags: ['ativista'], status: 'prospect' as const, createdAt: '2026-02-01', updatedAt: '2026-04-18' },
    { id: '3', name: 'Pedro Henrique Santos', email: 'pedro.santos@email.com', phone: '(31) 97777-7777', cpf: '456.789.123-00', city: 'Belo Horizonte', state: 'MG', tags: ['doador', 'eleitor'], status: 'client' as const, createdAt: '2026-01-20', updatedAt: '2026-04-15' },
    { id: '4', name: 'Ana Paula Ferreira', email: 'ana.ferreira@email.com', phone: '(41) 96666-6666', cpf: '321.654.987-00', city: 'Curitiba', state: 'PR', tags: ['voluntário'], status: 'lead' as const, createdAt: '2026-03-10', updatedAt: '2026-04-10' },
    { id: '5', name: 'Carlos Eduardo Lima', email: 'carlos.lima@email.com', phone: '(51) 95555-5555', cpf: '654.321.987-00', city: 'Porto Alegre', state: 'RS', tags: ['eleitor'], status: 'client' as const, createdAt: '2026-02-28', updatedAt: '2026-04-08' },
    { id: '6', name: 'Juliana Aparecida', email: 'juliana@email.com', phone: '(61) 94444-4444', cpf: '789.123.456-00', city: 'Brasília', state: 'DF', tags: ['ativista', 'doador'], status: 'prospect' as const, createdAt: '2026-03-05', updatedAt: '2026-04-05' },
    { id: '7', name: 'Roberto Carlos Mendes', email: 'roberto@email.com', phone: '(71) 93333-3333', cpf: '147.258.369-00', city: 'Salvador', state: 'BA', tags: ['voluntário'], status: 'client' as const, createdAt: '2026-01-10', updatedAt: '2026-04-01' },
    { id: '8', name: 'Fernanda Ribeiro', email: 'fernanda@email.com', phone: '(81) 92222-2222', cpf: '258.369.147-00', city: 'Recife', state: 'PE', tags: ['eleitor'], status: 'lead' as const, createdAt: '2026-03-20', updatedAt: '2026-03-28' },
  ] as Citizen[],

  organizations: [
    { id: '1', name: 'Partido Progressista Nacional', fantasyName: 'PPN', cnpj: '12.345.678/0001-00', email: 'contato@ppn.org.br', phone: '(61) 3333-3333', city: 'Brasília', state: 'DF', type: 'party' as const, tags: ['político'], contacts: [{ id: '1', name: 'José Almeida', role: 'Presidente', email: 'jose@ppn.org.br', phone: '(61) 99999-9999', isPrimary: true }], status: 'partner' as const, createdAt: '2025-01-01', updatedAt: '2026-04-20' },
    { id: '2', name: 'Sindicato dos Trabalhadores Urbanos', fantasyName: 'STU', cnpj: '23.456.789/0001-00', email: 'contato@stu.org.br', phone: '(11) 3333-4444', city: 'São Paulo', state: 'SP', type: 'union' as const, tags: ['sindicato'], contacts: [{ id: '2', name: 'Maria Silva', role: 'Secretária', email: 'maria@stu.org.br', phone: '(11) 98888-8888', isPrimary: true }], status: 'partner' as const, createdAt: '2025-06-15', updatedAt: '2026-04-18' },
    { id: '3', name: 'Associação Comunitária Bairro Novo', fantasyName: 'ACBN', cnpj: '34.567.890/0001-00', email: 'contato@acbn.org.br', phone: '(21) 3333-5555', city: 'Rio de Janeiro', state: 'RJ', type: 'association' as const, tags: ['comunidade'], contacts: [], status: 'client' as const, createdAt: '2025-09-01', updatedAt: '2026-04-15' },
    { id: '4', name: 'Federação das Indústrias do Estado', fantasyName: 'FIE', cnpj: '45.678.901/0001-00', email: 'contato@fie.org.br', phone: '(31) 3333-6666', city: 'Belo Horizonte', state: 'MG', type: 'association' as const, tags: ['indústria', 'economia'], contacts: [], status: 'partner' as const, createdAt: '2025-03-20', updatedAt: '2026-04-10' },
  ] as Organization[],

  appointments: [
    { id: '1', title: 'Reunião de Diretoria', description: 'Reunião semanal com a diretoria do partido', date: '2026-04-25', time: '14:00', endTime: '16:00', location: 'Sede do Partido - Sala 101', address: 'SIG Sul, Quadra 702, Brasília/DF', attendees: [{ id: '1', name: 'José Almeida', email: 'jose@ppn.org.br', status: 'confirmed' as const }], type: 'meeting' as const, priority: 'high' as const, status: 'scheduled' as const, createdAt: '2026-04-20', updatedAt: '2026-04-20' },
    { id: '2', title: 'Audiência Pública - Orçamento 2026', description: 'Audiência para discussão do orçamento', date: '2026-04-28', time: '09:00', endTime: '12:00', location: 'Câmara Municipal', address: 'Praça da Sé, São Paulo/SP', attendees: [], type: 'event' as const, priority: 'high' as const, status: 'scheduled' as const, createdAt: '2026-04-18', updatedAt: '2026-04-18' },
    { id: '3', title: 'Visita Técnica - Comunidade Jardim Esperança', description: 'Visita à comunidade para diagnóstico', date: '2026-04-26', time: '10:00', endTime: '12:00', location: 'Comunidade Jardim Esperança', address: 'Rua das Flores, 150 - São Paulo/SP', attendees: [{ id: '2', name: 'Maria Silva', email: 'maria@stu.org.br', status: 'confirmed' as const }], type: 'visit' as const, priority: 'medium' as const, status: 'confirmed' as const, createdAt: '2026-04-15', updatedAt: '2026-04-20' },
    { id: '4', title: 'Teleconsulta - Coordenadores Regionais', description: 'Reunião virtual com coordenadores', date: '2026-04-24', time: '19:00', endTime: '20:30', location: 'Google Meet', attendees: [], type: 'call' as const, priority: 'medium' as const, status: 'scheduled' as const, createdAt: '2026-04-22', updatedAt: '2026-04-22' },
  ] as Appointment[],

  landingPages: [
    { id: '1', name: 'Inscrição Evento Lançamento 2026', slug: 'inscricao-evento-2026', description: '<p>Participe do grande evento de lançamento da campanha!</p><p>Será um noche memorável para celebrarmos juntos essa nova fase.</p>', lgpdText: 'Certificamos que todas as mobilizações de coleta e processamento de dados pessoais realizadas em nossas atividades estão rigorosamente em conformidade com as disposições da Lei Federal nº 13.709/19 (LGPD).', confirmationTitle: 'Inscrição Confirmada!', confirmationMessage: 'Agradecemos sua participação. Você receberá um e-mail com mais informações.', confirmationButtonText: 'Confirmar Presença', confirmationButtonColor: '#2563EB', showShareButton: true, shareButtonText: 'Compartilhar no WhatsApp', shareButtonColor: '#25D366', fields: [], status: 'published' as const, views: 1250, submissions: 342, createdAt: '2026-03-01', updatedAt: '2026-04-20' },
    { id: '2', name: 'Cadastro de Voluntários', slug: 'cadastro-voluntarios', description: '<p>Junte-se ao nosso time de voluntários!</p><p>Sua ajuda é fundamental para construirmos um futuro melhor.</p>', lgpdText: 'Seus dados serão utilizados apenas para fins de cadastro e contato sobre voluntariado.', confirmationTitle: 'Obrigado por se voluntariar!', confirmationMessage: 'Em breve entraremos em contato com instruções.', confirmationButtonText: 'Quero Voluntariar', confirmationButtonColor: '#10B981', showShareButton: false, shareButtonText: 'Compartilhar', shareButtonColor: '#10B981', fields: [], status: 'published' as const, views: 2340, submissions: 567, createdAt: '2026-02-15', updatedAt: '2026-04-18' },
    { id: '3', name: 'Doação para Campanha', slug: 'doacao-campanha', description: '<p>Apoie nossa campanha com sua contribuição.</p><p>Cada ajuda faz a diferença.</p>', lgpdText: 'Todas as doações são rigorosamente公证adas conforme a legislação vigente.', confirmationTitle: 'Obrigado!', confirmationMessage: 'Sua contribuição foi recebida com sucesso.', confirmationButtonText: 'Doar Agora', confirmationButtonColor: '#F59E0B', showShareButton: true, shareButtonText: 'Compartilhar', shareButtonColor: '#F59E0B', fields: [], status: 'draft' as const, views: 890, submissions: 45, createdAt: '2026-04-01', updatedAt: '2026-04-15' },
  ] as LandingPage[],

  relationships: [
    { id: '1', type: 'family' as const, citizenId: '1', relatedToId: '2', relatedToName: 'Maria Oliveira', notes: 'Irmão', strength: 'strong' as const, createdAt: '2026-01-15', updatedAt: '2026-01-15' },
    { id: '2', type: 'political' as const, citizenId: '1', relatedToId: '3', relatedToName: 'Pedro Santos', notes: 'Mesmo partido', strength: 'medium' as const, createdAt: '2026-02-01', updatedAt: '2026-02-01' },
  ] as Relationship[],

  mobilizations: [
    { id: '1', name: 'Ato Político Centro', description: 'Ato político no centro da cidade', type: 'demonstration' as const, status: 'active' as const, startDate: '2026-05-01', endDate: '2026-05-01', location: 'Praça Central', targetGoal: 5000, currentGoal: 3250, tags: ['político', 'centro'], createdAt: '2026-04-01', updatedAt: '2026-04-20' },
    { id: '2', name: 'Campanha de Assinaturas', description: 'Coleta de assinaturas para proposta de lei', type: 'petition' as const, status: 'active' as const, startDate: '2026-04-15', endDate: '2026-05-15', location: 'Vários pontos', targetGoal: 10000, currentGoal: 4520, tags: ['assinaturas', 'lei'], createdAt: '2026-04-10', updatedAt: '2026-04-20' },
    { id: '3', name: ' mutirão de Saúde', description: ' mutirão de saúde no bairro', type: 'event' as const, status: 'planning' as const, startDate: '2026-05-15', location: 'Centro Comunitário', targetGoal: 300, currentGoal: 0, tags: ['saúde', 'mutirão'], createdAt: '2026-04-18', updatedAt: '2026-04-18' },
  ] as Mobilization[],

  requests: [
    { id: '1', title: 'Solicitação de melhoria urbana', description: 'Solicitação de pavimentação da rua', category: 'request' as const, priority: 'medium' as const, status: 'in-progress' as const, requesterId: '1', requesterName: 'João Silva', requesterEmail: 'joao@email.com', assignedToId: '2', assignedToName: 'Maria Silva', resolution: 'Solicitação encaminhada à secretaria de obras', createdAt: '2026-04-15', updatedAt: '2026-04-20' },
    { id: '2', title: 'Reclamação sobre som邻居', description: 'Barulho excessivo em eventos', category: 'complaint' as const, priority: 'low' as const, status: 'resolved' as const, requesterId: '3', requesterName: 'Pedro Santos', assignedToId: '1', assignedToName: 'José Almeida', resolution: 'Multa aplicada ao responsável', createdAt: '2026-04-10', updatedAt: '2026-04-18' },
    { id: '3', title: 'Sugestão de programa social', description: 'Criação de programa para jovens', category: 'suggestion' as const, priority: 'high' as const, status: 'open' as const, requesterId: '4', requesterName: 'Ana Paula', requesterEmail: 'ana@email.com', createdAt: '2026-04-20', updatedAt: '2026-04-20' },
  ] as Request[],

  amendments: [
    { id: '1', number: '1234', year: 2026, status: 'proposed' as const, author: 'Deputado Fabio Jorge', coAuthors: ['Deputado José', 'Deputada Maria'], subject: 'Criação de programa de saúde mental', description: 'Programa de atendimento psicológico para jovens', budget: 5000000, category: 'health' as const, location: 'Estado de SP', beneficiaries: 'Jovens de 15 a 29 anos', createdAt: '2026-04-01', updatedAt: '2026-04-20' },
    { id: '2', number: '567', year: 2026, status: 'approved' as const, author: 'Deputado Fabio Jorge', coAuthors: [], subject: 'Investimento em infraestrutura esportiva', description: 'Construção de campos de futebol', budget: 10000000, category: 'infrastructure' as const, location: 'Municípios prioritários', createdAt: '2026-03-15', updatedAt: '2026-04-15' },
  ] as Amendment[],

  whatsappCampaigns: [
    { id: '1', name: 'Convite Evento Lançamento', description: 'WhatsApp sobre evento de lançamento', status: 'completed' as const, messageTemplate: 'Olá! Você está convidado para o grande evento de lançamento. Confirme sua presença:', recipientsCount: 5000, sentCount: 4800, deliveredCount: 4650, readCount: 3200, responsesCount: 892, tags: ['evento'], createdAt: '2026-04-10', updatedAt: '2026-04-15' },
    { id: '2', name: 'Lembrete Reunião', description: 'Lembrete de reunião importante', status: 'scheduled' as const, scheduledAt: '2026-04-24T08:00:00', messageTemplate: 'Lembrete: Reunião amanhã às 14h. Não falte!', recipientsCount: 150, sentCount: 0, deliveredCount: 0, readCount: 0, responsesCount: 0, tags: ['lembrete'], createdAt: '2026-04-20', updatedAt: '2026-04-20' },
  ] as WhatsAppCampaign[],

  emailCampaigns: [
    { id: '1', name: 'Newsletter Abril', subject: 'Newsletter - Abril 2026', body: '<h1>Olá!</h1><p>Veja as novidades do mês...</p>', status: 'completed' as const, recipientsCount: 8000, sentCount: 7800, openCount: 4200, clickCount: 890, tags: ['newsletter'], createdAt: '2026-04-01', updatedAt: '2026-04-05' },
  ] as EmailCampaign[],

  collaborators: [
    { id: '1', name: 'Fabio Jorge', email: 'fabio@gabinete360.com', phone: '(61) 99999-9999', role: 'Deputado Federal', department: 'Gabinete', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2026-04-20' },
    { id: '2', name: 'Maria Silva', email: 'maria@gabinete360.com', phone: '(61) 98888-8888', role: 'Chefe de Gabinete', department: 'Gabinete', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2026-04-20' },
    { id: '3', name: 'José Almeida', email: 'jose@gabinete360.com', phone: '(61) 97777-7777', role: 'Assessor Parlamentar', department: 'Gabinete', status: 'active' as const, createdAt: '2025-03-15', updatedAt: '2026-04-18' },
  ] as Collaborator[],

  basicRegisters: [
    { id: '1', category: 'party' as const, name: 'Partido Progressista Nacional', code: 'PPN', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    { id: '2', category: 'position' as const, name: 'Deputado Federal', code: 'DF', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    { id: '3', category: 'sector' as const, name: 'Setor de Comunicação', code: 'SECOM', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    { id: '4', category: 'unity' as const, name: 'Zona Urbana Sul', code: 'ZUS', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ] as BasicRegister[],

  signatures: [
    { id: '1', name: 'Fabio Jorge', role: 'Deputado Federal', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2026-04-20' },
    { id: '2', name: 'Maria Silva', role: 'Chefe de Gabinete', status: 'active' as const, createdAt: '2025-01-01', updatedAt: '2026-04-20' },
  ] as Signature[],
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