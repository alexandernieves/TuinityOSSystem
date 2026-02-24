/**
 * ROLE-BASED ACCESS CONTROL (RBAC)
 * Defines exactly what each role can see and do within TuinityOS.
 */

export type UserRole =
    | 'OWNER'
    | 'ACCOUNTING'
    | 'PURCHASING'
    | 'SALES'
    | 'TRAFFIC'
    | 'WAREHOUSE'
    | 'SUPERVISOR'
    | 'ADMIN'
    | 'CLIENT'
    | 'MEMBER';

/** Navigation sections visible per role */
export const NAV_ACCESS: Record<string, UserRole[]> = {
    // ─── Main nav ───────────────────────────────────────────────────────────
    '/dashboard': ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SALES', 'TRAFFIC', 'WAREHOUSE', 'SUPERVISOR', 'ADMIN'],
    '/dashboard/pos': ['OWNER', 'ACCOUNTING', 'SALES', 'SUPERVISOR', 'ADMIN'],
    '/dashboard/inventario': ['OWNER', 'ACCOUNTING', 'PURCHASING', 'WAREHOUSE', 'SUPERVISOR', 'ADMIN'],
    '/dashboard/clientes': ['OWNER', 'ACCOUNTING', 'SALES', 'SUPERVISOR', 'ADMIN'],
    '/dashboard/contabilidad': ['OWNER', 'ACCOUNTING', 'SUPERVISOR', 'ADMIN'],
    '/dashboard/ventas': ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SALES', 'TRAFFIC', 'SUPERVISOR', 'ADMIN'],

    // ─── Settings (only OWNER + SUPERVISOR can access user management) ───
    '/dashboard/configuracion': ['OWNER', 'ADMIN', 'SUPERVISOR'],
    '/dashboard/configuracion/seguridad': ['OWNER', 'ADMIN'],
    '/dashboard/configuracion/sucursales': ['OWNER', 'ADMIN'],
    '/dashboard/configuracion/bodegas': ['OWNER', 'ADMIN', 'SUPERVISOR'],
    '/dashboard/configuracion/herramientas': ['OWNER', 'ADMIN', 'SUPERVISOR'],
};

/** Fine-grained permissions */
export const PERMISSIONS = {
    /** Can see purchase costs and supplier names */
    VIEW_COSTS: ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can see profit margins */
    VIEW_MARGINS: ['OWNER', 'ACCOUNTING', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can see supplier information */
    VIEW_SUPPLIERS: ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can see sale prices */
    VIEW_PRICES: ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SALES', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can edit product costs */
    EDIT_COSTS: ['OWNER', 'ACCOUNTING', 'PURCHASING', 'ADMIN'] as UserRole[],
    /** Can edit sale prices */
    EDIT_PRICES: ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can approve quotations / orders */
    APPROVE_ORDERS: ['OWNER', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can create quotes */
    CREATE_QUOTES: ['OWNER', 'ACCOUNTING', 'SALES', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can create orders */
    CREATE_ORDERS: ['OWNER', 'ACCOUNTING', 'SALES', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can create/edit clients */
    MANAGE_CLIENTS: ['OWNER', 'ACCOUNTING', 'SALES', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can generate invoices */
    GENERATE_INVOICES: ['OWNER', 'ACCOUNTING', 'SALES', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can make packing lists / dispatch docs */
    DISPATCH_DOCS: ['OWNER', 'ACCOUNTING', 'TRAFFIC', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can adjust inventory (requires supervisor approval for WAREHOUSE) */
    ADJUST_INVENTORY: ['OWNER', 'ACCOUNTING', 'PURCHASING', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can approve inventory adjustments */
    APPROVE_ADJUSTMENTS: ['OWNER', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can manage users (Security & Permissions page) */
    MANAGE_USERS: ['OWNER', 'ADMIN'] as UserRole[],
    /** Can run financial reports */
    VIEW_REPORTS: ['OWNER', 'ACCOUNTING', 'SUPERVISOR', 'ADMIN'] as UserRole[],
    /** Can void / cancel transactions */
    VOID_TRANSACTIONS: ['OWNER', 'ADMIN'] as UserRole[],
};

/** Check if a role has access to a nav section */
export function canAccessNav(role: UserRole | string | undefined, href: string): boolean {
    if (!role) return false;
    const allowed = NAV_ACCESS[href];
    if (!allowed) return true; // not explicitly restricted
    return allowed.includes(role as UserRole);
}

/** Check if a role has a specific permission */
export function hasPermission(role: UserRole | string | undefined, permission: keyof typeof PERMISSIONS): boolean {
    if (!role) return false;
    return (PERMISSIONS[permission] as string[]).includes(role);
}
