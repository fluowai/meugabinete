-- Political Intelligence OS - Core Schema Migration
-- Creates tables for political management platform

-- ============================================================
-- 1. CITIZENS (cidadaos) - People the political office serves
-- ============================================================
CREATE TABLE IF NOT EXISTS citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  whatsapp_jid TEXT,
  
  -- Demographics
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Outro', 'Nao informado')),
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zone TEXT CHECK (zone IN ('Urbana', 'Rural', 'Periurbana')),
  electoral_zone TEXT,
  electoral_section TEXT,
  
  -- Classification
  profile TEXT CHECK (profile IN (
    'cidadao_comum', 'lider_comunitario', 'servidor_publico',
    'empresario', 'profissional_liberal', 'politico', 'ativista',
    'representante_entidade', 'outro'
  )),
  socioeconomic_level TEXT CHECK (socioeconomic_level IN ('A', 'B', 'C', 'D', 'E')),
  
  -- Political context
  voter_registration TEXT,
  party_affiliation TEXT,
  voting_history JSONB DEFAULT '[]'::jsonb,
  
  -- Tags & scoring
  tags TEXT[] DEFAULT '{}',
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  
  -- Metadata
  source TEXT, -- 'WhatsApp', 'Presencial', 'Telefone', 'Rede Social', 'Indicacao'
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizens_organization ON citizens(organization_id);
CREATE INDEX IF NOT EXISTS idx_citizens_phone ON citizens(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_citizens_neighborhood ON citizens(organization_id, neighborhood);
CREATE INDEX IF NOT EXISTS idx_citizens_city ON citizens(organization_id, city);

-- ============================================================
-- 2. DEMANDAS (demands) - Citizen demands/complaints/requests
-- ============================================================
CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  
  -- Demand info
  protocol TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'saude', 'educacao', 'seguranca', 'infraestrutura', 'assistencia_social',
    'meio_ambiente', 'trabalho', 'habitacao', 'transporte', 'cultura',
    'agricultura', 'justica', 'outro'
  )),
  priority TEXT CHECK (priority IN ('urgente', 'alta', 'normal', 'baixa')) DEFAULT 'normal',
  status TEXT CHECK (status IN (
    'recebida', 'em_analise', 'em_andamento', 'encaminhada',
    'concluida', 'cancelada', 'reaberta'
  )) DEFAULT 'recebida',
  
  -- Location
  neighborhood TEXT,
  city TEXT,
  address TEXT,
  address_complement TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  
  -- Assignment
  responsible_department TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Protocol & tracking
  channel TEXT, -- 'WhatsApp', 'Telefone', 'Presencial', 'Site', 'E-mail'
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- AI scoring
  sentiment_score DOUBLE PRECISION,
  urgency_ai_score DOUBLE PRECISION,
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demands_organization ON demands(organization_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_demands_category ON demands(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_demands_citizen ON demands(citizen_id);
CREATE INDEX IF NOT EXISTS idx_demands_protocol ON demands(organization_id, protocol);
CREATE INDEX IF NOT EXISTS idx_demands_neighborhood ON demands(organization_id, neighborhood);

-- ============================================================
-- 3. DEMAND ACTIVITIES - Timeline of actions on demands
-- ============================================================
CREATE TABLE IF NOT EXISTS demand_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL, -- 'Nota', 'Status', 'Transferencia', 'WhatsApp', 'Telefone', 'Visita', 'Tarefa', 'Tag'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demand_activities_demand ON demand_activities(demand_id);
CREATE INDEX IF NOT EXISTS idx_demand_activities_org ON demand_activities(organization_id);

-- ============================================================
-- 4. POLITICAL OFFICES (gabinetes) - Office/mandate management
-- ============================================================
CREATE TABLE IF NOT EXISTS political_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('gabinete', 'mandato', 'campanha', 'legislativo', 'partido')) DEFAULT 'gabinete',
  holder_name TEXT NOT NULL, -- Nome do titular
  role_title TEXT, -- 'Vereador', 'Deputado', 'Senador', 'Prefeito', etc.
  
  party TEXT,
  coalition TEXT,
  
  -- Mandate period
  mandate_start DATE,
  mandate_end DATE,
  election_year INTEGER,
  
  -- Contact
  office_address TEXT,
  office_phone TEXT,
  office_email TEXT,
  
  -- Social media
  social_media JSONB DEFAULT '{}'::jsonb,
  
  -- Electoral district
  electoral_zone TEXT,
  electoral_section TEXT,
  base_territory JSONB DEFAULT '{}'::jsonb, -- GeoJSON or text description
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_political_offices_organization ON political_offices(organization_id);

-- ============================================================
-- 5. CAMPAIGNS (campanhas) - Electoral and awareness campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  political_office_id UUID REFERENCES political_offices(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('eleitoral', 'awareness', 'governo', 'comunicacao', 'mobilizacao')) DEFAULT 'comunicacao',
  status TEXT CHECK (status IN ('planejada', 'ativa', 'pausada', 'finalizada', 'cancelada')) DEFAULT 'planejada',
  
  -- Budget
  budget NUMERIC(12,2),
  spent NUMERIC(12,2) DEFAULT 0,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Targets
  target_audience TEXT,
  target_neighborhoods TEXT[],
  target_reach INTEGER,
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  
  -- Content
  messages JSONB DEFAULT '[]'::jsonb,
  hashtags TEXT[],
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(organization_id, status);

-- ============================================================
-- 6. ELECTIONS (eleicoes) - Electoral results tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- 'Eleicoes 2026', 'Municipal 2024'
  type TEXT CHECK (type IN ('municipal', 'estadual', 'federal', 'suplementar')) DEFAULT 'municipal',
  year INTEGER NOT NULL,
  round INTEGER DEFAULT 1,
  
  -- Results
  total_votes INTEGER,
  valid_votes INTEGER,
  blank_votes INTEGER,
  null_votes INTEGER,
  turnout_percentage DOUBLE PRECISION,
  
  -- Candidate info (if applicable)
  candidate_name TEXT,
  candidate_number TEXT,
  party TEXT,
  coalition TEXT,
  elected BOOLEAN DEFAULT false,
  
  -- Territory breakdown
  results_by_zone JSONB DEFAULT '{}'::jsonb,
  results_by_neighborhood JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_elections_organization ON elections(organization_id);
CREATE INDEX IF NOT EXISTS idx_elections_year ON elections(organization_id, year);

-- ============================================================
-- 7. TERRITORY INDICATORS (indicadores_territoriais)
-- ============================================================
CREATE TABLE IF NOT EXISTS territory_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT,
  
  -- Population
  population INTEGER,
  registered_voters INTEGER,
  
  -- Infrastructure (scores 0-10)
  health_infrastructure DOUBLE PRECISION,
  education_infrastructure DOUBLE PRECISION,
  security_level DOUBLE PRECISION,
  urban_mobility DOUBLE PRECISION,
  basic_sanitation DOUBLE PRECISION,
  leisure_culture DOUBLE PRECISION,
  
  -- Political
  political_leaning TEXT CHECK (political_leaning IN (
    'esquerda', 'centro_esquerda', 'centro', 'centro_direita', 'direita', 'indefinido'
  )) DEFAULT 'indefinido',
  main_demands TEXT[], -- Top recurring demand categories
  satisfaction_index DOUBLE PRECISION,
  
  -- Data source
  data_source TEXT,
  data_date DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_territory_indicators_org ON territory_indicators(organization_id);
CREATE INDEX IF NOT EXISTS idx_territory_indicators_neighborhood ON territory_indicators(organization_id, neighborhood);

-- ============================================================
-- 8. SURVEYS (pesquisas) - Polling and satisfaction surveys
-- ============================================================
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  political_office_id UUID REFERENCES political_offices(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('satisfacao', 'intencao_voto', 'percepcao', 'audiencia', 'customizada')) DEFAULT 'customizada',
  status TEXT CHECK (status IN ('rascunho', 'ativa', 'pausada', 'finalizada')) DEFAULT 'rascunho',
  
  -- Survey structure
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Results
  total_responses INTEGER DEFAULT 0,
  results_summary JSONB DEFAULT '{}'::jsonb,
  
  -- Period
  start_date DATE,
  end_date DATE,
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surveys_organization ON surveys(organization_id);

-- ============================================================
-- 9. SURVEY RESPONSES (pesquisas_respostas)
-- ============================================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  channel TEXT, -- 'WhatsApp', 'Presencial', 'Online', 'Telefone'
  respondent_name TEXT,
  respondent_neighborhood TEXT,
  
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);

-- ============================================================
-- 10. MANDATE PROJECTS (projetos_mandato) - Legislative/executive projects
-- ============================================================
CREATE TABLE IF NOT EXISTS mandate_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  political_office_id UUID REFERENCES political_offices(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('lei', 'projeto', 'emenda', 'mocao', 'requerimento', 'audiencia', 'visita', 'obra', 'programa')) DEFAULT 'projeto',
  status TEXT CHECK (status IN (
    'proposta', 'em_discussao', 'aprovada', 'rejeitada', 'arquivada',
    'em_execucao', 'concluida', 'cancelada'
  )) DEFAULT 'proposta',
  
  -- Legislative info
  number TEXT,
  year INTEGER,
  author TEXT,
  co_authors TEXT[],
  
  -- Scope
  area TEXT, -- 'Saude', 'Educacao', 'Seguranca', etc.
  affected_neighborhoods TEXT[],
  
  -- Budget (if applicable)
  estimated_budget NUMERIC(12,2),
  approved_budget NUMERIC(12,2),
  
  -- Dates
  presented_at DATE,
  approved_at DATE,
  deadline DATE,
  
  -- Progress
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Attachments
  documents JSONB DEFAULT '[]'::jsonb,
  
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandate_projects_organization ON mandate_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_mandate_projects_status ON mandate_projects(organization_id, status);

-- ============================================================
-- 11. CONTENT CALENDAR (calendario_conteudo)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN (
    'post_instagram', 'post_facebook', 'tweet', 'video_youtube',
    'reel', 'stories', 'artigo', 'newsletter', 'comunicado',
    'release', 'folder', 'outro'
  )) DEFAULT 'post_instagram',
  
  status TEXT CHECK (status IN (
    'ideia', 'rascunho', 'aprovacao', 'agendado', 'publicado', 'arquivado'
  )) DEFAULT 'ideia',
  
  -- Schedule
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Content
  text_content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  hashtags TEXT[],
  
  -- Engagement metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- AI assistance
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_calendar_organization ON content_calendar(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled ON content_calendar(scheduled_for);

-- ============================================================
-- 12. CRISIS EVENTS (eventos_crise) - Crisis management
-- ============================================================
CREATE TABLE IF NOT EXISTS crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('critica', 'alta', 'media', 'baixa')) DEFAULT 'media',
  status TEXT CHECK (status IN ('detectada', 'em_analise', 'em_tratamento', 'controlada', 'encerrada')) DEFAULT 'detectada',
  source TEXT, -- 'Midia', 'Rede Social', 'Denuncia', 'Interno', 'Ouvidoria'
  
  -- Impact
  affected_areas TEXT[],
  estimated_reach INTEGER,
  sentiment_impact DOUBLE PRECISION,
  
  -- Response
  action_plan TEXT,
  spokesperson TEXT,
  official_statement TEXT,
  
  -- Timeline
  detected_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crisis_events_organization ON crisis_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_crisis_events_status ON crisis_events(organization_id, status);

-- ============================================================
-- 13. CRISIS TIMELINE (crise_timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS crisis_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crisis_id UUID NOT NULL REFERENCES crisis_events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crisis_timeline_crisis ON crisis_timeline(crisis_id);

-- ============================================================
-- 14. TEAM MEMBERS (equipe) - Extended team management
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Assessor', 'Chefe de Gabinete', 'Assessor de Imprensa', etc.
  department TEXT, -- 'Gabinete', 'Comunicacao', 'Juridico', 'Financeiro', 'Campo'
  
  -- Contact
  phone TEXT,
  email TEXT,
  
  -- Permissions
  can_manage_demands BOOLEAN DEFAULT false,
  can_manage_campaigns BOOLEAN DEFAULT false,
  can_manage_content BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,
  can_access_ai BOOLEAN DEFAULT false,
  
  -- Work schedule
  working_hours JSONB DEFAULT '{}'::jsonb,
  
  active BOOLEAN DEFAULT true,
  joined_at DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_organization ON team_members(organization_id);

-- ============================================================
-- 15. POLITICAL MAP POINTS (mapa_politico_pontos)
-- ============================================================
CREATE TABLE IF NOT EXISTS political_map_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  label TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'base_eleitoral', 'lideranca', 'obras', 'demandas', 'comicio',
    'evento', 'concorrente', 'oportunidade', 'problema', 'outro'
  )) DEFAULT 'outro',
  
  -- Location
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  
  -- Details
  description TEXT,
  priority TEXT CHECK (priority IN ('alta', 'media', 'baixa')) DEFAULT 'media',
  
  -- Related entities
  demand_id UUID REFERENCES demands(id) ON DELETE SET NULL,
  citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL,
  
  -- Attachments
  photos JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_political_map_points_org ON political_map_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_political_map_points_type ON political_map_points(organization_id, type);

-- ============================================================
-- RLS Policies (Row Level Security)
-- ============================================================
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_map_points ENABLE ROW LEVEL SECURITY;

-- Organization-based isolation policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'citizens', 'demands', 'demand_activities', 'political_offices',
      'campaigns', 'elections', 'territory_indicators', 'surveys',
      'survey_responses', 'mandate_projects', 'content_calendar',
      'crisis_events', 'crisis_timeline', 'team_members', 'political_map_points'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY org_isolation_%s ON %s
       USING (organization_id = current_setting(''app.current_organization_id'')::uuid)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all political tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'citizens', 'demands', 'political_offices', 'campaigns',
      'elections', 'territory_indicators', 'surveys',
      'mandate_projects', 'content_calendar', 'crisis_events',
      'team_members', 'political_map_points'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trigger_update_updated_at_%s
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
END $$;
