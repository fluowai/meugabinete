-- =====================================================
-- REQUESTS - CAMPOS DE LOCALIZACAO E CACHE POSTGREST
-- =====================================================

ALTER TABLE requests ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_phone VARCHAR(20);

UPDATE requests r
SET requester_name = c.name
FROM citizens c
WHERE r.requester_id = c.id
  AND (r.requester_name IS NULL OR btrim(r.requester_name) = '');

UPDATE requests
SET requester_name = 'Cidadao nao informado'
WHERE requester_name IS NULL OR btrim(requester_name) = '';

UPDATE requests r
SET requester_phone = c.phone
FROM citizens c
WHERE r.requester_id = c.id
  AND r.requester_phone IS NULL;

ALTER TABLE requests ALTER COLUMN requester_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_city ON requests(city);
CREATE INDEX IF NOT EXISTS idx_requests_cep ON requests(cep);

-- Forca o PostgREST/Supabase a recarregar o schema cache apos aplicar as colunas.
NOTIFY pgrst, 'reload schema';
