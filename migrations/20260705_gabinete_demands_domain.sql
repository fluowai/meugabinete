-- Gabinete domain layer for WhatsApp-driven public demand management.
-- The existing CRM tables are kept for compatibility, but now carry citizen/demand fields.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS protocol TEXT,
  ADD COLUMN IF NOT EXISTS citizen_name TEXT,
  ADD COLUMN IF NOT EXISTS demand_subject TEXT,
  ADD COLUMN IF NOT EXISTS demand_category TEXT,
  ADD COLUMN IF NOT EXISTS demand_priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (demand_priority IN ('baixa', 'normal', 'alta', 'urgente')),
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS responsible_department TEXT,
  ADD COLUMN IF NOT EXISTS public_agency TEXT,
  ADD COLUMN IF NOT EXISTS protocol_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_org_protocol
  ON public.leads(organization_id, protocol)
  WHERE protocol IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_org_demand_category
  ON public.leads(organization_id, demand_category);

CREATE INDEX IF NOT EXISTS idx_leads_org_demand_priority
  ON public.leads(organization_id, demand_priority);

CREATE INDEX IF NOT EXISTS idx_leads_org_due_at
  ON public.leads(organization_id, due_at)
  WHERE due_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_demand_protocol(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_number INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'GB-' || to_char(now(), 'YYYY') || '-';

  SELECT COALESCE(MAX((regexp_match(protocol, '[0-9]+$'))[1]::INTEGER), 0) + 1
    INTO seq_number
  FROM public.leads
  WHERE organization_id = org_id
    AND protocol LIKE prefix || '%';

  RETURN prefix || lpad(seq_number::TEXT, 6, '0');
END;
$$;

UPDATE public.leads
SET status = CASE status
  WHEN 'Novo' THEN 'Nova'
  WHEN 'Qualificação' THEN 'Triagem'
  WHEN 'Em Atendimento' THEN 'Triagem'
  WHEN 'Visita' THEN 'Aguardando Informações'
  WHEN 'Simulação' THEN 'Encaminhada'
  WHEN 'Proposta' THEN 'Encaminhada'
  WHEN 'Documentação' THEN 'Em Execução'
  WHEN 'Fechado' THEN 'Resolvida'
  WHEN 'Perdido' THEN 'Arquivada'
  ELSE status
END
WHERE status IN (
  'Novo',
  'Qualificação',
  'Em Atendimento',
  'Visita',
  'Simulação',
  'Proposta',
  'Documentação',
  'Fechado',
  'Perdido'
);

UPDATE public.leads
SET
  citizen_name = COALESCE(citizen_name, name),
  demand_priority = COALESCE(demand_priority, 'normal'),
  classification = COALESCE(classification, 'Triagem inicial')
WHERE citizen_name IS NULL
   OR demand_priority IS NULL
   OR classification IS NULL;

UPDATE public.leads
SET protocol = public.generate_demand_protocol(organization_id)
WHERE protocol IS NULL;
