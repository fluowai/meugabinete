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