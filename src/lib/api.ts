import { supabase } from '../../services/supabase';

export const getApiUrl = (path: string) => {
  const base = import.meta.env.VITE_API_URL || '';
  if (!base || base === 'same-origin') return path;
  return `${String(base).replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
};

export async function callApi<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload ? payload.error || payload.message : payload;
    throw new Error(message || `Erro HTTP ${response.status}`);
  }

  return payload as T;
}

export function setActiveOrganizationId(organizationId: string | null, userId?: string | null) {
  if (typeof window === 'undefined') return;
  if (organizationId) {
    sessionStorage.setItem('active_organization_id', organizationId);
    if (userId) sessionStorage.setItem('active_organization_user_id', userId);
  } else {
    sessionStorage.removeItem('active_organization_id');
    sessionStorage.removeItem('active_organization_user_id');
  }
}

export function clearStaleOrganizationData(userId?: string | null) {
  if (typeof window === 'undefined') return;
  void userId;
  sessionStorage.removeItem('active_organization_id');
  sessionStorage.removeItem('active_organization_user_id');
  sessionStorage.removeItem('impersonated_org_id');
  localStorage.removeItem('impersonatedOrgId');
}
