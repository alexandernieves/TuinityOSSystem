import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  tenantId?: string;
  userId?: string;
  role?: string;
  permissions?: string[];
  bypassTenantIsolation?: boolean;
};

const als = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  run<T>(store: RequestContextStore, fn: () => T): T {
    return als.run(store, fn);
  },

  getStore(): RequestContextStore | undefined {
    return als.getStore();
  },
};
