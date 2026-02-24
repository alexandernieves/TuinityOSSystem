type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  tenantSlug?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (options.accessToken) {
    headers.authorization = `Bearer ${options.accessToken}`;
  } else if (options.tenantSlug) {
    headers['x-tenant-slug'] = options.tenantSlug;
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
    throw new Error(message);
  }

  return data as T;
}
