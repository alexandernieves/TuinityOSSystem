import type { PermissionKey, UserRole } from '@/lib/types/user';

/**
 * Permission matrix by role.
 * Each permission key lists the roles that have access to it.
 */
export const PERMISSIONS: Record<PermissionKey, UserRole[]> = {
  canViewCosts: ['gerencia', 'contabilidad', 'compras'],
  canViewSuppliers: ['gerencia', 'contabilidad', 'compras'],
  canViewMargins: ['gerencia', 'contabilidad', 'compras'],
  canViewPriceLevels: ['gerencia', 'contabilidad', 'compras'],
  canEditProducts: ['gerencia', 'compras'],
  canEditPrices: ['gerencia', 'compras'],
  canCreatePurchaseOrders: ['gerencia', 'compras'],
  canApproveSales: ['gerencia'],
  canViewReports: ['gerencia', 'contabilidad'],
  canManageUsers: ['gerencia'],
  canAccessPOS: ['gerencia', 'vendedor', 'bodega'],
  canAccessTrafico: ['gerencia', 'contabilidad', 'trafico'],
  canAccessInventory: ['gerencia', 'compras', 'bodega'],
  canAccessCompras: ['gerencia', 'contabilidad', 'compras'],
  // Inventory module permissions
  canCreateAdjustments: ['gerencia', 'compras', 'bodega', 'trafico'],
  canApproveAdjustments: ['gerencia', 'compras'],
  canCreateTransfers: ['gerencia', 'compras', 'bodega'],
  canConfirmTransfers: ['gerencia', 'bodega'],
  canCreateCountSessions: ['gerencia', 'compras', 'bodega'],
  // Sales (Ventas B2B) module permissions
  canAccessVentas: ['gerencia', 'contabilidad', 'vendedor', 'compras'],
  canCreateQuotes: ['gerencia', 'vendedor', 'contabilidad'],
  canConvertToOrder: ['gerencia', 'vendedor'],
  canApproveOrders: ['gerencia'],
  canPackOrders: ['gerencia', 'bodega'],
  canCreateInvoices: ['gerencia', 'contabilidad'],
  canProcessReturns: ['gerencia', 'contabilidad', 'bodega'],
  canApplyDiscounts: ['gerencia', 'compras'],
  canOverridePriceLevel: ['gerencia'],
  canManageClients: ['gerencia', 'contabilidad'],
  // Clientes & Cuentas por Cobrar permissions
  canAccessCxC: ['gerencia', 'contabilidad'],
  canRegisterPayments: ['gerencia', 'contabilidad'],
  canApproveAnnulments: ['gerencia'],
  canViewAging: ['gerencia', 'contabilidad'],
  canSendStatements: ['gerencia', 'contabilidad'],
  // Contabilidad permissions
  canAccessContabilidad: ['gerencia', 'contabilidad'],
  canCreateManualEntries: ['contabilidad'],
  canApproveEntries: ['gerencia'],
  canViewFinancialStatements: ['gerencia', 'contabilidad'],
  canReconcileBank: ['contabilidad'],
  canCloseMonthlyPeriod: ['contabilidad'],
  canCloseAnnualPeriod: ['gerencia'],
  canAccessTreasury: ['gerencia', 'contabilidad'],
  canViewBankBalances: ['gerencia', 'contabilidad'],
  // Configuración permissions
  canAccessConfiguracion: ['gerencia'],
  canManageRoles: ['gerencia'],
  canManageCatalogs: ['gerencia', 'contabilidad', 'compras'],
  canViewAuditLog: ['gerencia'],
  // Historial
  canViewHistorial: ['gerencia'],
  // Tráfico y Documentación
  canCreateDMC: ['gerencia', 'trafico'],
  canCreateBL: ['gerencia', 'trafico'],
  canCreateCertificates: ['gerencia', 'trafico'],
  canAnnulTrafficDocs: ['gerencia', 'trafico'],
  canConfigureTrafico: ['gerencia'],
  // Punto de Venta B2C
  canSellPOS: ['gerencia', 'vendedor', 'bodega'],
  canOpenCloseCash: ['gerencia', 'vendedor', 'bodega'],
  canApplyPOSDiscount: ['gerencia'],
  canProcessPOSReturn: ['gerencia', 'vendedor', 'bodega'],
  canAnnulPOSSale: ['gerencia'],
  canViewPOSReports: ['gerencia', 'contabilidad', 'vendedor'],
  canViewPOSMargins: ['gerencia'],
  canConfigurePOSPrices: ['gerencia'],
  canRequestReplenishment: ['gerencia', 'bodega'],
  // Doc09 Feature Permissions
  canConfigureReorderPoints: ['gerencia', 'compras'],
  canViewInventoryAlerts: ['gerencia', 'compras', 'bodega'],
  canAcceptReorderRecommendations: ['gerencia', 'compras'],
  canManageBarcodes: ['gerencia', 'compras', 'bodega'],
  canManageExpiryDates: ['gerencia', 'compras', 'bodega'],
  canViewExpiryAlerts: ['gerencia', 'compras', 'bodega'],
  canConfigureApprovalChains: ['gerencia'],
  canApproveEscalated: ['gerencia'],
  canCreateB2BtoB2CTransfer: ['gerencia', 'compras', 'bodega'],
  canReceiveB2CTransfer: ['gerencia', 'bodega'],
  canGroupDocsByRubro: ['gerencia', 'trafico'],
  canManageKYC: ['gerencia', 'contabilidad'],
  canViewKYCStatus: ['gerencia', 'contabilidad', 'vendedor'],
  canSellIncoming: ['gerencia', 'vendedor'],
  canProrateCosts: ['gerencia', 'compras'],
  canViewCostAlerts: ['gerencia', 'compras', 'contabilidad'],
  canViewProductAnalytics: ['gerencia', 'compras', 'contabilidad'],
  canConfigureBrandProtection: ['gerencia'],
};

/**
 * Role display names in Spanish
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  gerencia: 'Gerencia',
  contabilidad: 'Contabilidad',
  compras: 'Compras',
  vendedor: 'Vendedor B2B',
  trafico: 'Tráfico',
  bodega: 'Bodega',
};

/**
 * Role colors for badges and UI
 */
export const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  gerencia: { bg: 'bg-brand-100', text: 'text-brand-800' },
  contabilidad: { bg: 'bg-info-bg', text: 'text-info' },
  compras: { bg: 'bg-success-bg', text: 'text-success' },
  vendedor: { bg: 'bg-warning-bg', text: 'text-warning' },
  trafico: { bg: 'bg-brand-50', text: 'text-brand-600' },
  bodega: { bg: 'bg-surface-tertiary', text: 'text-text-secondary' },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
