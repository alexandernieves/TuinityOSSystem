export type UserRole =
  | 'gerencia'
  | 'contabilidad'
  | 'compras'
  | 'vendedor'
  | 'trafico'
  | 'bodega';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Permission keys for role-based access control
export type PermissionKey =
  | 'canViewCosts'
  | 'canViewSuppliers'
  | 'canViewMargins'
  | 'canViewPriceLevels'
  | 'canEditProducts'
  | 'canEditPrices'
  | 'canCreatePurchaseOrders'
  | 'canApproveSales'
  | 'canViewReports'
  | 'canManageUsers'
  | 'canAccessPOS'
  | 'canAccessTrafico'
  | 'canAccessInventory'
  | 'canAccessCompras'
  // Inventory module permissions
  | 'canCreateAdjustments'
  | 'canApproveAdjustments'
  | 'canCreateTransfers'
  | 'canConfirmTransfers'
  | 'canCreateCountSessions'
  // Sales (Ventas B2B) module permissions
  | 'canAccessVentas'
  | 'canCreateQuotes'
  | 'canConvertToOrder'
  | 'canApproveOrders'
  | 'canPackOrders'
  | 'canCreateInvoices'
  | 'canProcessReturns'
  | 'canApplyDiscounts'
  | 'canOverridePriceLevel'
  | 'canManageClients'
  // Clientes & Cuentas por Cobrar
  | 'canAccessCxC'
  | 'canRegisterPayments'
  | 'canApproveAnnulments'
  | 'canViewAging'
  | 'canSendStatements'
  // Contabilidad
  | 'canAccessContabilidad'
  | 'canCreateManualEntries'
  | 'canApproveEntries'
  | 'canViewFinancialStatements'
  | 'canReconcileBank'
  | 'canCloseMonthlyPeriod'
  | 'canCloseAnnualPeriod'
  | 'canAccessTreasury'
  | 'canViewBankBalances'
  // Configuración
  | 'canAccessConfiguracion'
  | 'canManageRoles'
  | 'canManageCatalogs'
  | 'canViewAuditLog'
  // Historial
  | 'canViewHistorial'
  // Tráfico y Documentación
  | 'canCreateDMC'
  | 'canCreateBL'
  | 'canCreateCertificates'
  | 'canAnnulTrafficDocs'
  | 'canConfigureTrafico'
  // Punto de Venta B2C
  | 'canSellPOS'
  | 'canOpenCloseCash'
  | 'canApplyPOSDiscount'
  | 'canProcessPOSReturn'
  | 'canAnnulPOSSale'
  | 'canViewPOSReports'
  | 'canViewPOSMargins'
  | 'canConfigurePOSPrices'
  | 'canRequestReplenishment'
  // Doc09 Feature Permissions
  // F1: Alertas de inventario
  | 'canConfigureReorderPoints'
  | 'canViewInventoryAlerts'
  // F2: Recomendación inteligente
  | 'canAcceptReorderRecommendations'
  // F3: Múltiples códigos de barra
  | 'canManageBarcodes'
  // F4: Fechas de vencimiento
  | 'canManageExpiryDates'
  | 'canViewExpiryAlerts'
  // F5: Aprobación en cascada
  | 'canConfigureApprovalChains'
  | 'canApproveEscalated'
  // F6: Transferencias bodega→tienda
  | 'canCreateB2BtoB2CTransfer'
  | 'canReceiveB2CTransfer'
  // F7: Documentos por rubro
  | 'canGroupDocsByRubro'
  // F9: KYC / Debida diligencia
  | 'canManageKYC'
  | 'canViewKYCStatus'
  // F10: Venta anticipada
  | 'canSellIncoming'
  // F11: Prorrateo de costos
  | 'canProrateCosts'
  | 'canViewCostAlerts'
  // F13: Analytics por producto
  | 'canViewProductAnalytics'
  // F14: Protección de marca
  | 'canConfigureBrandProtection';
