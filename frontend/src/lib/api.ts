import { loadSession } from './auth-storage';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  tenantSlug?: string | null;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const session = loadSession();
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const token = options.accessToken ?? session?.accessToken;
  const tenant = options.tenantSlug ?? session?.tenantSlug;

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (tenant) {
    headers['x-tenant-slug'] = tenant;
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });

  const text = await res.text();
  const data: unknown = text ? (JSON.parse(text) as unknown) : null;

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
    const error = new Error(message) as any;
    error.status = res.status;

    if (res.status === 401 && typeof window !== 'undefined') {
      const { clearSession } = require('./auth-storage');
      clearSession();
      window.location.href = '/login';
    }

    throw error;
  }

  return data as T;
}
