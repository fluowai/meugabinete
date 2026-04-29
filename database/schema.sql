-- =====================================================
-- GABINETE 360 - Banco de Dados SQL
-- Criação completa de todas as tabelas e alterações
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

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CIDADÃOS
-- =====================================================

CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    address TEXT,
    address_number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    cep VARCHAR(10),
    source VARCHAR(100),
    notes TEXT,
    score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'lead',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_citizens_name ON citizens(name);
CREATE INDEX idx_citizens_email ON citizens(email);
CREATE INDEX idx_citizens_cpf ON citizens(cpf);
CREATE INDEX idx_citizens_status ON citizens(status);
CREATE INDEX idx_citizens_city_state ON citizens(city, state);

CREATE TABLE IF NOT EXISTS citizen_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(citizen_id, tag)
);

-- =====================================================
-- ORGANIZAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    fantasy_name VARCHAR(255),
    cnpj VARCHAR(18),
    ie VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    address TEXT,
    address_number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(2),
    cep VARCHAR(10),
    type VARCHAR(50) DEFAULT 'other',
    sector VARCHAR(100),
    size VARCHAR(20),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'lead',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_status ON organizations(status);

CREATE TABLE IF NOT EXISTS organization_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, tag)
);

-- =====================================================
-- COMPROMISSOS
-- =====================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time VARCHAR(10),
    end_time VARCHAR(10),
    location VARCHAR(255),
    address TEXT,
    related_type VARCHAR(20),
    related_id UUID,
    status VARCHAR(20) DEFAULT 'scheduled',
    type VARCHAR(20) DEFAULT 'meeting',
    priority VARCHAR(20) DEFAULT 'medium',
    reminder BOOLEAN DEFAULT false,
    reminder_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_related ON appointments(related_type, related_id);

CREATE TABLE IF NOT EXISTS appointment_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LANDING PAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    lgpd_text TEXT,
    confirmation_title VARCHAR(255),
    confirmation_message TEXT,
    confirmation_button_text VARCHAR(100),
    confirmation_button_color VARCHAR(10) DEFAULT '#2563EB',
    show_share_button BOOLEAN DEFAULT false,
    share_button_text VARCHAR(100),
    share_button_color VARCHAR(10) DEFAULT '#25D366',
    status VARCHAR(20) DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);

CREATE TABLE IF NOT EXISTS landing_page_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    required BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,
    placeholder VARCHAR(100),
    options TEXT[],
    extra_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS landing_page_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    ip_address VARCHAR(20),
    user_agent TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RELACIONAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    related_to_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    related_to_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    strength VARCHAR(20) DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_relationships_citizen ON relationships(citizen_id);
CREATE INDEX idx_relationships_related ON relationships(related_to_id);

-- =====================================================
-- MOBILIZAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS mobilizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'planning',
    start_date DATE NOT NULL,
    end_date DATE,
    location VARCHAR(255),
    target_goal INTEGER,
    current_goal INTEGER DEFAULT 0,
    responsible_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobilizations_status ON mobilizations(status);
CREATE INDEX idx_mobilizations_dates ON mobilizations(start_date, end_date);

CREATE TABLE IF NOT EXISTS mobilization_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobilization_id UUID REFERENCES mobilizations(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mobilization_id, tag)
);

CREATE TABLE IF NOT EXISTS mobilization_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobilization_id UUID REFERENCES mobilizations(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mobilization_id, citizen_id)
);

-- =====================================================
-- SOLICITAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    requester_id UUID REFERENCES citizens(id),
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255),
    assigned_to_id UUID REFERENCES users(id),
    assigned_to_name VARCHAR(255),
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_category ON requests(category);
CREATE INDEX idx_requests_requester ON requests(requester_id);

CREATE TABLE IF NOT EXISTS request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- EMENDAS PARLAMENTARES
-- =====================================================

CREATE TABLE IF NOT EXISTS amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    author VARCHAR(255) NOT NULL,
    co_authors TEXT[],
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(15,2),
    category VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    beneficiaries TEXT,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(number, year)
);

CREATE INDEX idx_amendments_year ON amendments(year);
CREATE INDEX idx_amendments_status ON amendments(status);
CREATE INDEX idx_amendments_category ON amendments(category);

-- =====================================================
-- CAMPANHAS WHATSAPP
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    message_template TEXT NOT NULL,
    media_url TEXT,
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    responses_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_campaign_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, tag)
);

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    last_message TEXT,
    last_message_at TIMESTAMP,
    UNIQUE(phone)
);

-- =====================================================
-- CAMPANHAS EMAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_campaign_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, tag)
);

-- =====================================================
-- COLABORADORES
-- =====================================================

CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collaborators_email ON collaborators(email);
CREATE INDEX idx_collaborators_status ON collaborators(status);

-- =====================================================
-- CADASTROS BÁSICOS
-- =====================================================

CREATE TABLE IF NOT EXISTS basic_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    parent_id UUID REFERENCES basic_registers(id),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_basic_registers_category ON basic_registers(category);
CREATE INDEX idx_basic_registers_code ON basic_registers(code);

-- =====================================================
-- ASSINATURAS
-- =====================================================

CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    document_url TEXT,
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RELATÓRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    filters JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB
);

CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_generated ON reports(generated_at);

-- =====================================================
-- ATUALIZAÇÕES E TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas com updated_at
CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobilizations_updated_at BEFORE UPDATE ON mobilizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_amendments_updated_at BEFORE UPDATE ON amendments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_basic_registers_updated_at BEFORE UPDATE ON basic_registers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signatures_updated_at BEFORE UPDATE ON signatures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS) - Opcional
-- =====================================================

-- ENABLE ROW LEVEL SECURITY (Descomente se necessário)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (exemplo para usuários)
-- CREATE POLICY "Users can view own profile" ON users
--     FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- INSERÇÃO DE DADOS INICIAIS
-- =====================================================

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO users (id, name, email, password_hash, role, status) 
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Fabio Jorge',
    'fabio@gabinete360.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7pFdldKzdyqJqLgL5f5wH4G', --senha: admin123
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Inserir cadastros básicos iniciais
INSERT INTO basic_registers (category, name, code, status) VALUES
    ('party', 'Partido Progressista Nacional', 'PPN', 'active'),
    ('position', 'Deputado Federal', 'DF', 'active'),
    ('position', 'Deputado Estadual', 'DE', 'active'),
    ('position', 'Senador', 'SEN', 'active'),
    ('sector', 'Setor de Comunicação', 'SECOM', 'active'),
    ('sector', 'Setor de Relações Institucionais', 'SERI', 'active'),
    ('sector', 'Setor de Gestão', 'SEGES', 'active'),
    ('unity', 'Zona Urbana Sul', 'ZUS', 'active'),
    ('unity', 'Zona Urbana Norte', 'ZUN', 'active'),
    ('zone', 'Região Centro', 'RC', 'active')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================