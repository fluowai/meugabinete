import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const defaultSupabaseUrl = 'https://cjirkvgalpignnaxixzr.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaXJrdmdhbHBpZ25uYXhpeHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjIzNzksImV4cCI6MjA5MzAzODM3OX0.MLVoApshNS_-0i56dnYXYEoP1_8WPEI5oknGbI6ijkg';

const isValidUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

const isPlaceholder = (val?: string): boolean => {
  if (!val) return true;
  const trimmed = val.trim();
  return trimmed === ''
    || trimmed.includes('YOUR_SUPABASE')
    || trimmed.includes('your-project')
    || trimmed.includes('your-anon-key')
    || trimmed.includes('placeholder');
};

// Supabase anon key and project URL are public frontend configuration.
// Keep a production fallback so a missing CI secret never generates a placeholder bundle.
const finalUrl = isValidUrl(supabaseUrl) && !isPlaceholder(supabaseUrl)
  ? supabaseUrl
  : defaultSupabaseUrl;

const finalKey = supabaseAnonKey && !isPlaceholder(supabaseAnonKey)
  ? supabaseAnonKey
  : defaultSupabaseAnonKey;

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
