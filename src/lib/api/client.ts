const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TOKEN_KEY = 'dana365_session_token';

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  fn: string,
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;
  const token = getSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
    'apikey': ANON_KEY,
  };

  if (token) {
    headers['x-app-token'] = token;
  }

  let url = `${API_BASE}/${fn}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text);
}

export const api = {
  get: <T>(fn: string, path = '', params?: Record<string, string>) =>
    request<T>(fn, path, { params }),
  post: <T>(fn: string, path = '', body?: unknown) =>
    request<T>(fn, path, { method: 'POST', body }),
  put: <T>(fn: string, path = '', body?: unknown) =>
    request<T>(fn, path, { method: 'PUT', body }),
  del: <T>(fn: string, path = '') =>
    request<T>(fn, path, { method: 'DELETE' }),
};
