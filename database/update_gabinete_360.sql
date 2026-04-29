-- =====================================================
-- ATUALIZAÇÃO GABINETE 360 - EQUIPE E CORREÇÕES
-- =====================================================

-- 1. CRIAR TABELA DE TAGS DE CIDADÃOS (CORREÇÃO DO ERRO 404)
CREATE TABLE IF NOT EXISTS citizen_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(citizen_id, tag)
);

-- 2. CRIAR TABELA DE COLABORADORES / EQUIPE
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user', -- admin, manager, user
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    avatar_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADICIONAR NÍVEL DE ACESSO NA TABELA DE USUÁRIOS EXISTENTE (SE NECESSÁRIO)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);
CREATE INDEX IF NOT EXISTS idx_citizen_tags_cid ON citizen_tags(citizen_id);

-- 5. DADOS INICIAIS DA EQUIPE
INSERT INTO collaborators (name, email, role, department) VALUES
    ('Paulo Silva', 'paulo@gabinete.gov', 'admin', 'Gabinete'),
    ('Ana Souza', 'ana@gabinete.gov', 'manager', 'Comunicação')
ON CONFLICT (email) DO NOTHING;
