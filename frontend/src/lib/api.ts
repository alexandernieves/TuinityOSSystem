import { loadSession, clearSession } from './auth-storage';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  tenantSlug?: string | null;
  skipAuthRedirect?: boolean;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const session = loadSession();

  // Normalize path to remove any accidental /api/ prefix if the base URL already points to the root
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/') && !API_BASE_URL.endsWith('/api')) {
    cleanPath = cleanPath.replace('/api/', '/');
  }

  const url = `${API_BASE_URL}${cleanPath}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  // Always try to include x-tenant-slug if we have it in the session
  const tenantSlug = options.tenantSlug || session?.tenantSlug;
  if (tenantSlug) {
    headers['x-tenant-slug'] = tenantSlug;
  }

  // Set Authorization header
  const token = options.accessToken || session?.accessToken;
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  const getErrorMessage = (payload: unknown): string | undefined => {
    if (!payload || typeof payload !== 'object') return undefined;
    const p = payload as Record<string, unknown>;
    const msg = p.message ?? p.error;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg.every((m) => typeof m === 'string')) {
      return msg.join(', ');
    }
    return undefined;
  };

  if (!res.ok) {
    const message = getErrorMessage(data) ?? `HTTP ${res.status}`;

    // Handle Unauthorized (401)
    if (res.status === 401 && typeof window !== 'undefined' && !options.skipAuthRedirect) {
      clearSession();
      // Only redirect if not already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?mode=login&expired=true&tenant=${tenantSlug || ''}`;
      }
    }

    const error = new Error(message);
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}
