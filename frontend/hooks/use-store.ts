'use client';

import { useSyncExternalStore } from 'react';

export function useStore<T>(
  subscribe: (callback: () => void) => () => void,
  getSnapshot: () => T,
): T {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
