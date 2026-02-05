export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tenantSlug: string;
  tenantId?: string;
  userId?: string;
};

const KEY = 'dynamoss.session';

export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
