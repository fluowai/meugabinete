ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS selected_plan_at TIMESTAMPTZ;

INSERT INTO public.plans (name, slug, price_monthly, features, limits, is_active, trial_days)
VALUES
  (
    'Teste',
    'free',
    0,
    '["crm","reports"]'::jsonb,
    '{"users":1,"properties":50,"whatsapp_instances":0}'::jsonb,
    true,
    14
  ),
  (
    'Essencial',
    'starter',
    197,
    '["crm","whatsapp","reports"]'::jsonb,
    '{"users":5,"properties":500,"whatsapp_instances":1}'::jsonb,
    true,
    14
  ),
  (
    'Profissional',
    'pro',
    397,
    '["crm","whatsapp","ia_triage","reports","team"]'::jsonb,
    '{"users":15,"properties":2500,"whatsapp_instances":3}'::jsonb,
    true,
    14
  ),
  (
    'Institucional',
    'enterprise',
    797,
    '["crm","whatsapp","ia_triage","reports","team","api"]'::jsonb,
    '{"users":-1,"properties":-1,"whatsapp_instances":10}'::jsonb,
    true,
    14
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  trial_days = EXCLUDED.trial_days,
  updated_at = now();

UPDATE public.organizations
SET niche = 'traditional'
WHERE niche IN ('hybrid', 'urbano', 'rural');

NOTIFY pgrst, 'reload schema';
