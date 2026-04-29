-- =====================================================
-- ATUALIZAÇÃO GABINETE 360 - VERSÃO ENXUTA (VICE-PREFEITO)
-- Foco em Demandas Populares e Atendimento via WhatsApp
-- =====================================================

-- 1. Atualizar a tabela de solicitações (agora tratadas como Demandas)
-- Adicionando campos de Assunto e Bairro para classificação automática e estatísticas
ALTER TABLE requests ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_phone VARCHAR(20);

-- 2. Garantir índices para buscas rápidas por telefone e bairro
CREATE INDEX IF NOT EXISTS idx_requests_neighborhood ON requests(neighborhood);
CREATE INDEX IF NOT EXISTS idx_requests_subject ON requests(subject);
CREATE INDEX IF NOT EXISTS idx_citizens_phone ON citizens(phone);

-- 3. Inserir Categorias de Demandas Populares nos Cadastros Básicos
INSERT INTO basic_registers (category, name, code, status) VALUES
    ('demand_subject', 'Iluminação Pública', 'ILUM', 'active'),
    ('demand_subject', 'Buraco na Via', 'BURA', 'active'),
    ('demand_subject', 'Poda de Árvore', 'PODA', 'active'),
    ('demand_subject', 'Limpeza de Terreno', 'LIMP', 'active'),
    ('demand_subject', 'Segurança', 'SEGU', 'active'),
    ('demand_subject', 'Saúde', 'SAUD', 'active'),
    ('demand_subject', 'Saneamento', 'SANE', 'active')
ON CONFLICT (name, category) DO NOTHING;

-- 4. Limpar/Ocultar dados de módulos desnecessários (Opcional - apenas se quiser limpar o banco)
-- DELETE FROM organizations;
-- DELETE FROM amendments;
-- DELETE FROM mobilizations;

-- 5. Adicionar campo de "AI Summary" para demandas se não existir
ALTER TABLE requests ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS ai_classification JSONB;

-- 6. Trigger para garantir que o bairro do cidadão seja copiado para a demanda se não informado
CREATE OR REPLACE FUNCTION sync_request_neighborhood()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.neighborhood IS NULL AND NEW.requester_id IS NOT NULL THEN
        SELECT neighborhood INTO NEW.neighborhood FROM citizens WHERE id = NEW.requester_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trg_sync_request_neighborhood ON requests;
CREATE TRIGGER trg_sync_request_neighborhood
BEFORE INSERT ON requests
FOR EACH ROW EXECUTE FUNCTION sync_request_neighborhood();

-- 7. Dados de exemplo para o novo Dashboard
INSERT INTO citizens (name, phone, neighborhood, city, state, status) VALUES
    ('João Silva Santos', '(11) 99999-9999', 'Centro', 'São Paulo', 'SP', 'client'),
    ('Maria Oliveira Costa', '(21) 98888-8888', 'Jardim América', 'Rio de Janeiro', 'RJ', 'prospect'),
    ('Pedro Henrique Santos', '(31) 97777-7777', 'Vila Nova', 'Belo Horizonte', 'MG', 'client')
ON CONFLICT DO NOTHING;

INSERT INTO requests (title, description, subject, neighborhood, category, priority, status, requester_name, requester_phone) VALUES
    ('Poste apagado', 'Lâmpada queimada na rua principal', 'Iluminação Pública', 'Centro', 'request', 'medium', 'in-progress', 'João Silva Santos', '(11) 99999-9999'),
    ('Buraco na via', 'Cratera enorme impedindo trânsito', 'Buraco na Via', 'Jardim América', 'request', 'high', 'open', 'Maria Oliveira Costa', '(21) 98888-8888'),
    ('Vazamento de esgoto', 'Esgoto correndo a céu aberto', 'Saneamento', 'Vila Nova', 'complaint', 'urgent', 'open', 'Pedro Henrique Santos', '(31) 97777-7777')
ON CONFLICT DO NOTHING;
