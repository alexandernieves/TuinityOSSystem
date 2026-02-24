export type RequestContextStore = {
    tenantId?: string;
    userId?: string;
    role?: string;
    permissions?: string[];
    bypassTenantIsolation?: boolean;
};
export declare const RequestContext: {
    run<T>(store: RequestContextStore, fn: () => T): T;
    getStore(): RequestContextStore | undefined;
};
