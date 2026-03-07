const STORE_PREFIX = 'evo_';
const STORE_VERSION = 1;

interface StoredPayload<T> {
  version: number;
  updatedAt: string;
  data: T;
}

export function loadCollection<T>(key: string, seedData: T[]): T[] {
  if (typeof window === 'undefined') return seedData;
  try {
    const raw = localStorage.getItem(`${STORE_PREFIX}${key}`);
    if (!raw) return seedData;
    const parsed: StoredPayload<T[]> = JSON.parse(raw);
    if (parsed.version !== STORE_VERSION) return seedData;
    return parsed.data;
  } catch {
    return seedData;
  }
}

export function saveCollection<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  const payload: StoredPayload<T[]> = {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    data,
  };
  localStorage.setItem(`${STORE_PREFIX}${key}`, JSON.stringify(payload));
}

export function loadSingleton<T>(key: string, seedData: T): T {
  if (typeof window === 'undefined') return seedData;
  try {
    const raw = localStorage.getItem(`${STORE_PREFIX}${key}`);
    if (!raw) return seedData;
    const parsed: StoredPayload<T> = JSON.parse(raw);
    if (parsed.version !== STORE_VERSION) return seedData;
    return parsed.data;
  } catch {
    return seedData;
  }
}

export function saveSingleton<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  const payload: StoredPayload<T> = {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    data,
  };
  localStorage.setItem(`${STORE_PREFIX}${key}`, JSON.stringify(payload));
}

export function resetStore(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORE_PREFIX}${key}`);
}

export function resetAllStores(): void {
  if (typeof window === 'undefined') return;
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORE_PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
}

export type Subscriber = () => void;

export function createSubscribers() {
  let subscribers: Subscriber[] = [];
  return {
    subscribe(fn: Subscriber): () => void {
      subscribers.push(fn);
      return () => {
        subscribers = subscribers.filter((s) => s !== fn);
      };
    },
    notify(): void {
      subscribers.forEach((fn) => fn());
    },
  };
}
