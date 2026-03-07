/**
 * POS (Punto de Venta) types for B2C module
 * Based on Document 007 specifications - Módulo Punto de Venta B2C
 */

// ============================================
// STATUS & ENUM TYPES
// ============================================

// POS order status
export type POSOrderStatus =
  | 'completada'              // Completed sale
  | 'devuelta'                // Fully returned
  | 'parcialmente_devuelta'   // Partially returned
  | 'cancelada';              // Cancelled

// Payment methods available at POS
export type POSPaymentMethod =
  | 'efectivo'            // Cash
  | 'tarjeta_debito'      // Debit card
  | 'tarjeta_credito'     // Credit card
  | 'transferencia'       // Bank transfer
  | 'mixto';              // Mixed payment (multiple methods)

// Cash register status
export type CashRegisterStatus = 'abierta' | 'cerrada';

// Cash movement types (non-sale transactions)
export type CashMovementType =
  | 'entrada'         // Cash entry (e.g., change fund top-up)
  | 'salida'          // Cash exit (e.g., payment for supplies)
  | 'retiro_parcial'; // Partial cash withdrawal (security)

// Return status
export type POSReturnStatus =
  | 'pendiente'   // Pending review
  | 'aprobada'    // Approved by supervisor
  | 'rechazada'   // Rejected
  | 'procesada';  // Processed and completed

// Reimbursement type for returns
export type POSReturnReimbursementType =
  | 'efectivo'        // Cash refund
  | 'credito_tienda'  // Store credit
  | 'nota_credito';   // Credit note

// Return reason categories
export type POSReturnReasonCategory =
  | 'producto_danado'   // Damaged product
  | 'error_cajero'      // Cashier error
  | 'cambio_opinion'    // Change of mind
  | 'otro';             // Other

// ============================================
// STATUS CONFIGS (Tailwind classes for UI)
// ============================================

export const POS_ORDER_STATUS_CONFIG: Record<POSOrderStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  completada: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Completada',
  },
  devuelta: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Devuelta',
  },
  parcialmente_devuelta: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    label: 'Parcialmente Devuelta',
  },
  cancelada: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Cancelada',
  },
};

export const POS_RETURN_STATUS_CONFIG: Record<POSReturnStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  pendiente: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: 'Pendiente',
  },
  aprobada: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    label: 'Aprobada',
  },
  rechazada: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Rechazada',
  },
  procesada: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Procesada',
  },
};

export const CASH_REGISTER_STATUS_CONFIG: Record<CashRegisterStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  abierta: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Abierta',
  },
  cerrada: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Cerrada',
  },
};

// ============================================
// LABEL RECORDS
// ============================================

export const POS_ORDER_STATUS_LABELS: Record<POSOrderStatus, string> = {
  completada: 'Completada',
  devuelta: 'Devuelta',
  parcialmente_devuelta: 'Parcialmente Devuelta',
  cancelada: 'Cancelada',
};

export const POS_PAYMENT_METHOD_LABELS: Record<POSPaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta_debito: 'Tarjeta Débito',
  tarjeta_credito: 'Tarjeta Crédito',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
};

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  retiro_parcial: 'Retiro Parcial',
};

export const POS_RETURN_STATUS_LABELS: Record<POSReturnStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  procesada: 'Procesada',
};

export const POS_RETURN_REASON_LABELS: Record<POSReturnReasonCategory, string> = {
  producto_danado: 'Producto Dañado',
  error_cajero: 'Error de Cajero',
  cambio_opinion: 'Cambio de Opinión',
  otro: 'Otro',
};

export const REIMBURSEMENT_TYPE_LABELS: Record<POSReturnReimbursementType, string> = {
  efectivo: 'Efectivo',
  credito_tienda: 'Crédito de Tienda',
  nota_credito: 'Nota de Crédito',
};

// ============================================
// ORDER LINE & PAYMENT INTERFACES
// ============================================

// Line item in a POS order
export interface POSOrderLine {
  id: string;
  productId: string;
  productName: string;
  productCode: string;       // EVL-XXXXX format
  productGroup: string;      // Whisky, Vodka, etc.
  quantity: number;          // In bottles/units
  unitPrice: number;         // priceB2C
  discount?: number;         // Percentage (0-100)
  subtotal: number;          // qty * unitPrice * (1 - discount/100)
}

// Payment detail for a POS order
export interface POSPaymentDetail {
  method: POSPaymentMethod;
  amount: number;
  reference?: string;        // Card last 4 digits, transfer ref
  bankName?: string;         // For transfers
  cardType?: 'debito' | 'credito';
}

// ============================================
// MAIN POS ORDER
// ============================================

export interface POSOrder {
  id: string;                // POS-2026-XXXXXX format
  orderNumber: number;
  status: POSOrderStatus;
  createdAt: string;

  // Lines
  lines: POSOrderLine[];

  // Totals
  subtotal: number;
  discountTotal: number;
  total: number;

  // Payment
  payments: POSPaymentDetail[];
  changeGiven?: number;      // Cambio entregado

  // Customer
  customerId?: string;       // null = Consumidor Final
  customerName: string;      // Default: 'Consumidor Final'

  // Cash register
  cashRegisterId: string;
  cashierName: string;
  cashierId: string;

  // Invoice / Ticket
  invoiceNumber?: string;    // FBC-2026-XXXX if generated
  ticketNumber: string;      // TK-2026-XXXXXX

  notes?: string;
}

// ============================================
// CASH REGISTER TYPES
// ============================================

export interface CashRegister {
  id: string;
  name: string;              // 'Caja #1'
  location: string;          // 'Planta baja - Tienda'
  status: CashRegisterStatus;
  currentOpening?: CashRegisterOpening;
  isActive: boolean;
}

export interface CashRegisterOpening {
  id: string;
  cashRegisterId: string;
  openedAt: string;
  openedBy: string;
  openedByName: string;
  initialFund: number;       // Fondo de caja
  notes?: string;
}

export interface CashRegisterClosing {
  id: string;                // CC-2026-XXXX format
  cashRegisterId: string;
  openingId: string;
  closedAt: string;
  closedBy: string;
  closedByName: string;
  openedAt: string;

  // Sales summary
  totalSales: number;
  totalReturns: number;
  totalDiscounts: number;
  netSales: number;
  transactionCount: number;

  // Breakdown by payment method
  cashSales: number;
  debitCardSales: number;
  creditCardSales: number;
  transferSales: number;

  // Cash reconciliation
  initialFund: number;
  expectedCash: number;      // initialFund + cashSales + entries - exits - cashReturns
  actualCash: number;        // Physically counted
  difference: number;        // actual - expected (positive = sobrante, negative = faltante)

  // Cash movements (non-sale)
  cashEntries: number;
  cashExits: number;

  observations?: string;
  status: 'ok' | 'con_diferencia';
}

// ============================================
// CASH MOVEMENT
// ============================================

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedByName?: string;
}

// ============================================
// RETURNS (DEVOLUCIONES B2C)
// ============================================

export interface POSReturnLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface POSReturn {
  id: string;                // DEV-B-2026-XXXX format
  originalOrderId: string;
  originalOrderNumber: string;
  status: POSReturnStatus;
  createdAt: string;

  lines: POSReturnLine[];
  totalAmount: number;

  reason: string;
  reasonCategory: POSReturnReasonCategory;
  reimbursementType: POSReturnReimbursementType;

  processedBy: string;
  processedByName: string;
  approvedBy?: string;
  approvedByName?: string;

  notes?: string;
}

// ============================================
// POS CLIENT (Consumidor registrado)
// ============================================

export interface POSClient {
  id: string;                // Z0000001 format
  name: string;
  documentType: 'ruc' | 'cedula' | 'pasaporte';
  documentNumber: string;
  dv?: string;               // Dígito verificador (Panama)
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
}

// ============================================
// STORE INVENTORY & REPLENISHMENT
// ============================================

export interface StoreInventoryItem {
  productId: string;
  productName: string;
  productCode: string;
  productGroup: string;
  productImage?: string;
  barcode?: string;
  stockUnits: number;        // In bottles/units (own inventory)
  minimumStock: number;      // Reorder level
  priceB2C: number;
  unitsPerCase: number;      // For conversion when requesting replenishment
  lastReplenishmentDate?: string;
  stockStatus: 'ok' | 'bajo' | 'agotado';
}

export interface ReplenishmentRequestLine {
  productId: string;
  productName: string;
  requestedCases: number;
  requestedUnits: number;
}

export interface ReplenishmentRequest {
  id: string;                // REP-2026-XXXX format
  status: 'pendiente' | 'aprobada' | 'en_proceso' | 'recibida';
  createdAt: string;
  createdBy: string;
  createdByName: string;
  lines: ReplenishmentRequestLine[];
  notes?: string;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface POSStats {
  salesToday: number;
  salesYesterday: number;
  transactionsToday: number;
  averageTicket: number;
  topProductToday: string;
  cashRegisterStatus: CashRegisterStatus;
  lowStockAlerts: number;
}

// ============================================
// REPORTS
// ============================================

export interface POSDailyReportPaymentMethod {
  method: POSPaymentMethod;
  amount: number;
  count: number;
}

export interface POSDailyReportCashier {
  name: string;
  amount: number;
  count: number;
}

export interface POSDailyReportHour {
  hour: number;
  amount: number;
  count: number;
}

export interface POSDailyReport {
  date: string;
  grossSales: number;
  returns: number;
  discounts: number;
  netSales: number;
  averageTicket: number;
  transactionCount: number;
  byPaymentMethod: POSDailyReportPaymentMethod[];
  byCashier: POSDailyReportCashier[];
  byHour: POSDailyReportHour[];
}

export interface POSProductRanking {
  productId: string;
  productName: string;
  productGroup: string;
  unitsSold: number;
  revenue: number;
  percentOfTotal: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================
// PRODUCT CATEGORIES (Quick buttons)
// ============================================

export interface ProductCategory {
  id: string;
  label: string;
  icon?: string;
  count: number;
}

// ============================================
// FILTER TYPES
// ============================================

export interface POSOrderFilters {
  search?: string;
  status?: POSOrderStatus | 'all';
  paymentMethod?: POSPaymentMethod | 'all';
  cashRegisterId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
}

export interface POSReturnFilters {
  search?: string;
  status?: POSReturnStatus | 'all';
  reasonCategory?: POSReturnReasonCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface StoreInventoryFilters {
  search?: string;
  productGroup?: string;
  stockStatus?: 'ok' | 'bajo' | 'agotado' | 'all';
}
