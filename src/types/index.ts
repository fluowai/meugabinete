export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user';
  tenantId?: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPage {
  id: string;
  tenantId?: string;
  name: string;
  slug: string;
  description: string;
  lgpdText: string;
  confirmationTitle: string;
  confirmationMessage: string;
  confirmationButtonText: string;
  confirmationButtonColor: string;
  showShareButton: boolean;
  shareButtonText: string;
  shareButtonColor: string;
  fields: FormField[];
  status: 'draft' | 'published';
  views: number;
  submissions: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'cpf' | 'cnpj' | 'textarea' | 'select' | 'date' | 'checkbox' | 'cep' | 'uf' | 'municipio';
  required: boolean;
  visible: boolean;
  placeholder?: string;
  options?: string[];
  extraOrder?: number;
}

export interface Citizen {
  id: string;
  tenantId?: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  fatherName?: string;
  motherName?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  tags: string[];
  source?: string;
  notes?: string;
  score?: number;
  status: 'lead' | 'prospect' | 'client' | 'inactive';
  birthDateFormatted?: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  tenantId?: string;
  name: string;
  fantasyName?: string;
  cnpj?: string;
  ie?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  type: 'party' | 'union' | 'association' | 'company' | 'government' | 'non-profit' | 'other';
  sector?: string;
  size?: 'micro' | 'small' | 'medium' | 'large';
  tags: string[];
  contacts: OrganizationContact[];
  notes?: string;
  status: 'lead' | 'partner' | 'client' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationContact {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface Appointment {
  id: string;
  tenantId?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  address?: string;
  attendees: AppointmentAttendee[];
  relatedType?: 'citizen' | 'organization' | 'campaign';
  relatedId?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  type: 'meeting' | 'event' | 'call' | 'visit' | 'other';
  priority: 'low' | 'medium' | 'high';
  reminder?: boolean;
  reminderMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentAttendee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'declined';
}

export interface Relationship {
  id: string;
  tenantId?: string;
  type: 'family' | 'friend' | 'colleague' | 'neighbor' | 'political' | 'business' | 'other';
  citizenId: string;
  relatedToId: string;
  relatedToName: string;
  notes?: string;
  strength: 'weak' | 'medium' | 'strong';
  createdAt: string;
  updatedAt: string;
}

export interface Mobilization {
  id: string;
  tenantId?: string;
  name: string;
  description: string;
  type: 'petition' | 'demonstration' | 'event' | 'campaign' | 'volunteer' | 'donation';
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  location?: string;
  targetGoal?: number;
  currentGoal?: number;
  tags: string[];
  responsibleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  id: string;
  tenantId?: string;
  title: string;
  description: string;
  subject?: string;
  neighborhood?: string;
  cep?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  city?: string;
  state?: string;
  category: 'information' | 'complaint' | 'suggestion' | 'request' | 'compliment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToType?: 'ai' | 'human';
  aiSummary?: string;
  aiClassification?: any;
  score?: number;
  resolution?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Amendment {
  id: string;
  tenantId?: string;
  number: string;
  year: number;
  status: 'draft' | 'proposed' | 'approved' | 'rejected' | 'withdrawn';
  author: string;
  coAuthors: string[];
  subject: string;
  description: string;
  budget?: number;
  category: 'education' | 'health' | 'infrastructure' | 'security' | 'social' | 'other';
  location?: string;
  beneficiaries?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppCampaign {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledAt?: string;
  messageTemplate: string;
  mediaUrl?: string;
  recipientsCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  responsesCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'blocked';
  lastMessage?: string;
  lastMessageAt?: string;
  tags: string[];
}

export interface EmailCampaign {
  id: string;
  tenantId?: string;
  name: string;
  subject: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledAt?: string;
  recipientsCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'citizens' | 'organizations' | 'appointments' | 'mobilizations' | 'landings' | 'requests' | 'financial';
  description?: string;
  filters: Record<string, any>;
  generatedAt: string;
  data: any[];
}

export interface Collaborator {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BasicRegister {
  id: string;
  tenantId?: string;
  category: 'party' | 'position' | 'sector' | 'unity' | 'zone' | 'county';
  name: string;
  code?: string;
  parentId?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Signature {
  id: string;
  tenantId?: string;
  name: string;
  role: string;
  documentUrl?: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  citizens: number;
  citizensGrowth: number;
  openDemands: number;
  inProgressDemands: number;
  resolvedDemands: number;
  topNeighborhoods: { name: string; count: number }[];
  topSubjects: { name: string; count: number }[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: PlanLimits;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxCitizens: number;
  maxRequests: number;
  maxOrganizations: number;
  maxAppointments: number;
  maxCollaborators: number;
  maxMobilizations: number;
  maxLandingPages: number;
  maxAmendments: number;
  maxWhatsAppCampaigns: number;
  maxEmailCampaigns: number;
  maxTeamMembers: number;
  maxStorageMb: number;
  hasWhatsApp: boolean;
  hasAI: boolean;
  hasReports: boolean;
  hasApi: boolean;
  hasPrioritySupport: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  planId: string;
  plan?: Plan;
  document?: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  settings: TenantSettings;
  assignedUsers: number;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
  suspendedAt?: string;
}

export interface TenantSettings {
  timezone: string;
  locale: string;
  theme: 'light' | 'dark' | 'auto';
  businessHours: BusinessHour[];
  customDomain?: string;
  logoUrl?: string;
  primaryColor: string;
}

export interface BusinessHour {
  day: number;
  open: string;
  close: string;
  enabled: boolean;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName?: string;
  subject: string;
  message: string;
  category: 'bug' | 'feature' | 'question' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  messages: SupportMessage[];
  assignedToId?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorType: 'tenant' | 'support';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface SuperAdminStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalPlans: number;
  openTickets: number;
  totalUsers: number;
  totalStorageUsed: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  recentTenants: Tenant[];
  recentTickets: SupportTicket[];
  topPlans: { planName: string; count: number; revenue: number }[];
}