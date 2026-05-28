import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const isPlaceholder = (val?: string): boolean => {
  if (!val) return true;
  const trimmed = val.trim();
  return trimmed.includes('YOUR_SUPABASE') || trimmed === '';
};

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.warn(
    'Supabase credentials missing or using placeholders. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to connect to a real database.'
  );
}

// Utiliza credenciais mockadas válidas sintaticamente para evitar que o bundle do React trave na inicialização
const finalUrl = isValidUrl(supabaseUrl) && !isPlaceholder(supabaseUrl)
  ? supabaseUrl
  : 'https://placeholder-project.supabase.co';

const finalKey = supabaseAnonKey && !isPlaceholder(supabaseAnonKey)
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4ODMwMDAsImV4cCI6MTkwNDQ0NzAwMH0.placeholder';

export const supabase = createClient(
  finalUrl,
  finalKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: {
        'X-Client-Info': 'meugabinete-web',
      },
    },
  }
);

