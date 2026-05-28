-- =====================================================
-- GABINETE 360 - Banco de Dados SQL (Versão Enxuta - Vice-Prefeito)
-- Criação completa de todas as tabelas otimizada para Gestão de Demandas
-- =====================================================

-- =====================================================
-- USUARIOS E AUTENTICAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar TEXT,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CIDADÃOS
-- =====================================================

CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    address_number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    cep VARCHAR(10),
    source VARCHAR(100) DEFAULT 'WhatsApp',
    notes TEXT,
    score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'lead', -- lead (Novo), prospect (Recorrente), client (Engajado)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_citizens_name ON citizens(name);
CREATE INDEX idx_citizens_phone ON citizens(phone);
CREATE INDEX idx_citizens_whatsapp ON citizens(whatsapp);
CREATE INDEX idx_citizens_cpf ON citizens(cpf);
CREATE INDEX idx_citizens_neighborhood ON citizens(neighborhood);

CREATE TABLE IF NOT EXISTS citizen_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(citizen_id, tag)
);

-- =====================================================
-- DEMANDAS (SOLICITAÇÕES)
-- =====================================================

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100), -- Assunto classificado pela IA ou manual
    neighborhood VARCHAR(100), -- Bairro da demanda
    category VARCHAR(20) DEFAULT 'request', -- request, complaint, suggestion, information
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'open', -- open, in-progress, resolved, cancelled
    requester_id UUID REFERENCES citizens(id),
    requester_name VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20),
    assigned_to_id UUID REFERENCES users(id),
    assigned_to_name VARCHAR(255),
    ai_summary TEXT, -- Resumo gerado pela IA
    ai_classification JSONB, -- Dados de classificação da IA
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_subject ON requests(subject);
CREATE INDEX idx_requests_neighborhood ON requests(neighborhood);
CREATE INDEX idx_requests_priority ON requests(priority);

CREATE TABLE IF NOT EXISTS request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- WHATSAPP - CONVERSAS, GRUPOS, MENSAGENS E AGENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_jid TEXT UNIQUE NOT NULL,
    chat_type VARCHAR(20) NOT NULL CHECK (chat_type IN ('direct', 'group')),
    display_name VARCHAR(255) NOT NULL,
    normalized_phone VARCHAR(20),
    country_code VARCHAR(8),
    group_name VARCHAR(255),
    profile_picture_url TEXT,
    participant_count INTEGER DEFAULT 0,
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_type ON whatsapp_chats(chat_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message_at ON whatsapp_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone ON whatsapp_chats(normalized_phone);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
    message_id TEXT UNIQUE NOT NULL,
    chat_jid TEXT NOT NULL,
    sender_jid TEXT,
    sender_push_name VARCHAR(255),
    sender_phone VARCHAR(20),
    sender_country_code VARCHAR(8),
    sender_profile_picture_url TEXT,
    sender_display_name VARCHAR(255),
    is_group BOOLEAN DEFAULT false,
    group_name VARCHAR(255),
    message_type VARCHAR(30) DEFAULT 'text',
    text_content TEXT,
    media_url TEXT,
    media_mime_type VARCHAR(255),
    media_filename VARCHAR(255),
    quoted_message_id TEXT,
    mentioned_phones JSONB DEFAULT '[]'::jsonb,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_request_id UUID REFERENCES requests(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_received_at ON whatsapp_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_phone ON whatsapp_messages(sender_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_is_group ON whatsapp_messages(is_group);

CREATE TABLE IF NOT EXISTS whatsapp_group_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_jid TEXT NOT NULL,
    participant_jid TEXT NOT NULL,
    normalized_phone VARCHAR(20) NOT NULL,
    country_code VARCHAR(8),
    push_name VARCHAR(255),
    display_name VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_super_admin BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_jid, participant_jid)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_group_participants_group ON whatsapp_group_participants(group_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_participants_phone ON whatsapp_group_participants(normalized_phone);

CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'whatsmeow',
    status VARCHAR(30) DEFAULT 'disconnected',
    connected BOOLEAN DEFAULT false,
    jid TEXT,
    phone VARCHAR(20),
    push_name VARCHAR(255),
    profile_picture_url TEXT,
    last_seen_at TIMESTAMP,
    last_connected_at TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_instance ON whatsapp_connections(instance_key);

CREATE TABLE IF NOT EXISTS service_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ai', 'human')),
    role VARCHAR(100),
    specialty VARCHAR(255),
    prompt TEXT,
    active BOOLEAN DEFAULT true,
    escalation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES service_agents(id),
    message_id UUID REFERENCES whatsapp_messages(id),
    request_id UUID REFERENCES requests(id),
    action_type VARCHAR(100) NOT NULL,
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CADASTROS BÁSICOS
-- =====================================================

CREATE TABLE IF NOT EXISTS basic_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(20) NOT NULL, -- demand_subject, neighborhood, status, etc
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, name)
);

-- =====================================================
-- WHATSAPP E CAMPANHAS
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    message_template TEXT NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ATUALIZAÇÕES E TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_chats_updated_at BEFORE UPDATE ON whatsapp_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_group_participants_updated_at BEFORE UPDATE ON whatsapp_group_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_connections_updated_at BEFORE UPDATE ON whatsapp_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_agents_updated_at BEFORE UPDATE ON service_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

INSERT INTO users (id, name, email, password_hash, role, status) 
VALUES ('10000000-0000-0000-0000-000000000001', 'Admin Gabinete', 'admin@gabinete.gov', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7pFdldKzdyqJqLgL5f5wH4G', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO basic_registers (category, name, code) VALUES
    ('demand_subject', 'Iluminação Pública', 'ILUM'),
    ('demand_subject', 'Buraco na Via', 'BURA'),
    ('demand_subject', 'Poda de Árvore', 'PODA'),
    ('demand_subject', 'Limpeza de Terreno', 'LIMP'),
    ('demand_subject', 'Segurança', 'SEGU'),
    ('demand_subject', 'Saúde', 'SAUD'),
    ('demand_subject', 'Saneamento', 'SANE')
ON CONFLICT DO NOTHING;

INSERT INTO service_agents (name, type, role, specialty, prompt, escalation_rules) VALUES
    ('Agente de Triagem Geral', 'ai', 'triage', 'Classificacao inicial de mensagens do WhatsApp', 'Classifique mensagens recebidas, identifique se viram demanda, defina prioridade, bairro, assunto e se precisa atendimento humano.', '{"escalate_priorities":["urgent","high"],"can_create_request":true}'::jsonb),
    ('Agente de Infraestrutura Urbana', 'ai', 'infrastructure', 'Buracos, iluminacao, poda, limpeza e zeladoria', 'Analise demandas de infraestrutura urbana, extraia localizacao, urgencia e orgao responsavel sugerido.', '{"subjects":["iluminacao","buraco","poda","limpeza","saneamento"]}'::jsonb),
    ('Agente de Saude e Assistencia', 'ai', 'health_social', 'Saude, medicamentos, consultas e vulnerabilidade social', 'Identifique demandas de saude e assistencia social, sinalize casos sensiveis e urgentes.', '{"requires_human_review":true,"sensitive":true}'::jsonb),
    ('Agente de Educacao e Comunidade', 'ai', 'education_community', 'Escolas, creches, liderancas e associacoes', 'Organize demandas de educacao e relacoes comunitarias, relacionando cidadaos, escolas e bairros.', '{"subjects":["educacao","creche","comunidade"]}'::jsonb),
    ('Agente de Agenda Politica', 'ai', 'agenda', 'Pedidos de reuniao, eventos e compromissos', 'Transforme pedidos de agenda em sugestoes de compromisso, com solicitante, local, data e prioridade politica.', '{"can_create_appointment":true}'::jsonb),
    ('Agente de Mobilizacao', 'ai', 'mobilization', 'Abaixo-assinados, eventos, voluntarios e campanhas territoriais', 'Identifique oportunidades de mobilizacao e organize grupos, bairros, liderancas e pautas recorrentes.', '{"can_suggest_campaign":true}'::jsonb),
    ('Agente de Comunicacao', 'ai', 'communications', 'Resposta ao cidadao e comunicacao publica', 'Sugira respostas claras, educadas e institucionais para WhatsApp, grupos e comunicados publicos.', '{"can_suggest_reply":true}'::jsonb),
    ('Agente LGPD e Risco', 'ai', 'compliance', 'Dados pessoais, ataques, ameacas e risco juridico', 'Sinalize mensagens com dados sensiveis, ameacas, ataques pessoais ou risco juridico antes de encaminhar.', '{"requires_human_review":true,"sensitive":true}'::jsonb),
    ('Assessor de Demandas Urgentes', 'human', 'urgent_case_owner', 'Tratamento humano de casos urgentes e sensiveis', 'Recebe demandas escaladas por urgencia, recorrencia, risco social ou contexto politico delicado.', '{"requires_human_review":true}'::jsonb),
    ('Coordenador de Gabinete', 'human', 'chief_of_staff', 'Priorizacao politica e distribuicao para equipe', 'Define prioridade politica, distribui demandas para responsaveis e acompanha cobrancas externas.', '{"can_assign":true}'::jsonb)
ON CONFLICT DO NOTHING;
