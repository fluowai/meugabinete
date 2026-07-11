export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status:
    | 'Nova'
    | 'Triagem'
    | 'Aguardando Informações'
    | 'Encaminhada'
    | 'Em Execução'
    | 'Respondida'
    | 'Resolvida'
    | 'Arquivada';
  classification?: string;
  protocol?: string;
  citizen_name?: string;
  demand_subject?: string;
  demand_category?: string;
  demand_priority?: 'baixa' | 'normal' | 'alta' | 'urgente';
  neighborhood?: string;
  city?: string;
  address?: string;
  responsible_department?: string;
  public_agency?: string;
  due_at?: string;
  resolved_at?: string;
  lead_score?: number;
  ai_profile?: {
    temperature?: 'frio' | 'morno' | 'quente';
    stage?: string;
    intent?: string;
    confidence?: number;
    nextAction?: {
      type?: string;
      title?: string;
      dueAt?: string;
      reason?: string;
    };
    visit?: {
      requested?: boolean;
      scheduledAt?: string;
      notes?: string;
    };
    handoffRequired?: boolean;
    handoffReason?: string;
  };
  ai_next_action?: string;
  ai_last_intent?: string;
  ai_last_confidence?: number;
  next_follow_up_at?: string;
  tags?: string[];
  createdAt: string;
  notes?: string;
  chat_jid?: string;
  ad_reference?: string;
  organic_channel?: string;
  last_contacted_at?: string;
  campaign?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'ASSESSOR';
  agencyName: string;
  avatar: string;
}
