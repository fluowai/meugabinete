-- =====================================================
-- REQUESTS - CAMPOS DE LOCALIZACAO E CACHE POSTGREST
-- =====================================================

ALTER TABLE requests ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS state VARCHAR(2);

CREATE INDEX IF NOT EXISTS idx_requests_city ON requests(city);
CREATE INDEX IF NOT EXISTS idx_requests_cep ON requests(cep);

-- Forca o PostgREST/Supabase a recarregar o schema cache apos aplicar as colunas.
NOTIFY pgrst, 'reload schema';
