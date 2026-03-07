/**
 * Inventory Types for Evolution OS
 * Based on Document 04 - Módulo de Control de Inventario
 */

// ============================================
// WAREHOUSE TYPES
// ============================================

export type WarehouseType = 'B2B' | 'B2C';

export interface Warehouse {
  id: string;
  name: string;
  code: string;           // 'ZL' (Zona Libre), 'PTY-TIENDA'
  type: WarehouseType;
  location: string;
  isActive: boolean;
}

// ============================================
// INVENTORY ITEM (Extended product view)
// ============================================

export type AlertType = 'low_stock' | 'out_of_stock' | 'stagnant_4m' | 'stagnant_6m' | 'negative' | 'reorder_point';
export type AlertSeverity = 'warning' | 'danger' | 'info';

export interface InventoryAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  productId: string;
  actionLabel?: string;     // e.g., "Crear OC"
  actionHref?: string;
}

export interface InventoryItem {
  productId: string;
  productReference: string;
  productDescription: string;
  group: string;
  subGroup: string;
  brand: string;
  supplier: string;
  warehouseId: string;
  warehouseName: string;
  existence: number;        // Physical stock
  arriving: number;         // In transit (from POs)
  reserved: number;         // Reserved for pending orders
  available: number;        // Calculated: existence + arriving - reserved
  minimumQty: number;
  reorderPoint?: number;       // Punto mínimo / alerta de inventario (F1)
  unitsPerCase: number;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  costCIF: number;          // Role-restricted
  stockValue: number;       // existence * costCIF, role-restricted
  alerts: InventoryAlert[];
}

// ============================================
// INVENTORY STATS
// ============================================

export interface InventoryStats {
  productsWithStock: number;
  belowMinimum: number;
  belowReorderPoint: number;    // Products below reorder point (F1)
  outOfStock: number;
  stagnant4Months: number;
  stagnant6Months: number;
  totalValue: number;           // Role-restricted
  pendingAdjustments: number;
  arrivingProducts: number;
}

// ============================================
// FILTER TYPES
// ============================================

export type InventoryStockFilter =
  | 'all'
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'stagnant'
  | 'arriving'
  | 'below_reorder';

export interface InventoryFilters {
  search?: string;
  stockFilter?: InventoryStockFilter;
  group?: string;
  subGroup?: string;
  brand?: string;
  warehouseId?: string;
  supplierId?: string;         // Role-restricted filter
}

// ============================================
// ADJUSTMENT TYPES
// ============================================

export type AdjustmentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'aplicado';
export type AdjustmentType = 'positivo' | 'negativo';

export type AdjustmentReason =
  | 'merma'
  | 'rotura'
  | 'robo'
  | 'error_conteo'
  | 'vencimiento'
  | 'devolucion'
  | 'otro';

export const ADJUSTMENT_REASONS: Record<AdjustmentReason, string> = {
  merma: 'Merma',
  rotura: 'Rotura',
  robo: 'Robo',
  error_conteo: 'Error de conteo',
  vencimiento: 'Vencimiento',
  devolucion: 'Devolución',
  otro: 'Otro',
};

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  aplicado: 'Aplicado',
};

export interface AdjustmentLine {
  id: string;
  productId: string;
  productReference: string;
  productDescription: string;
  currentStock: number;       // Stock at creation time (read-only)
  adjustmentQty: number;      // Quantity to add/subtract
  resultingStock: number;     // Calculated: currentStock ± adjustmentQty
  costCIF: number;            // Role-restricted
  lineValue: number;          // |adjustmentQty| * costCIF
  detail?: string;            // Optional line-level detail
}

export interface InventoryAdjustment {
  id: string;                 // AJ-XXXXX format
  createdAt: string;
  createdBy: string;
  createdByName: string;
  warehouseId: string;
  warehouseName: string;
  type: AdjustmentType;
  reason: AdjustmentReason;
  observation?: string;
  evidenceUrls?: string[];    // Image uploads
  lines: AdjustmentLine[];
  totalItems: number;         // Sum of |adjustmentQty|
  totalValue: number;         // Sum of line values
  status: AdjustmentStatus;
  // Approval data
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  appliedAt?: string;
}

// ============================================
// TRANSFER TYPES
// ============================================

export type TransferStatus = 'borrador' | 'enviada' | 'recibida' | 'recibida_discrepancia';

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  recibida: 'Recibida',
  recibida_discrepancia: 'Recibida con discrepancia',
};

export interface TransferLine {
  id: string;
  productId: string;
  productReference: string;
  productDescription: string;
  sourceStock: number;        // Stock in origin warehouse
  quantityCases: number;      // Cases to transfer
  unitsPerCase: number;       // From product
  resultingUnits: number;     // For B2C: quantityCases * unitsPerCase
  realCostCIF: number;        // Hidden - real cost from B2B
  transferCost: number;       // Inflated cost for B2C (realCostCIF * inflationFactor)
  totalValue: number;         // quantityCases * realCostCIF or resultingUnits * transferCost
  // Reception fields
  receivedQty?: number;       // Actual quantity received
  hasDiscrepancy?: boolean;
  discrepancyNotes?: string;
}

export interface InventoryTransfer {
  id: string;                 // TR-XXXXX format
  createdAt: string;
  createdBy: string;
  createdByName: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  sourceWarehouseType: WarehouseType;
  destWarehouseId: string;
  destWarehouseName: string;
  destWarehouseType: WarehouseType;
  observation?: string;
  lines: TransferLine[];
  totalCases: number;
  totalUnits: number;
  totalValue: number;
  inflationFactor: number;    // Default 1.15 (15%)
  status: TransferStatus;
  // Reception data
  receivedAt?: string;
  receivedBy?: string;
  receivedByName?: string;
  hasDiscrepancies?: boolean;
  discrepancySummary?: string;
}

// Conversion calculation helper type
export interface ConversionCalculation {
  casesTransferred: number;
  unitsPerCase: number;
  totalUnits: number;
  realCostPerCase: number;
  realCostPerUnit: number;
  inflatedCostPerUnit: number;
  totalRealCost: number;
  totalTransferCost: number;
}

// ============================================
// PHYSICAL COUNT TYPES
// ============================================

export type CountSessionStatus = 'en_progreso' | 'completado' | 'cancelado';

export const COUNT_SESSION_STATUS_LABELS: Record<CountSessionStatus, string> = {
  en_progreso: 'En progreso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export interface CountLine {
  id: string;
  productId: string;
  productReference: string;
  productDescription: string;
  barcode?: string;
  systemQty: number;          // What system says
  countedQty?: number;        // What was physically counted
  difference?: number;        // countedQty - systemQty
  scannedAt?: string;
  countedBy?: string;
  adjustmentCreated?: boolean;
  adjustmentId?: string;
}

export interface PhysicalCountSession {
  id: string;                 // CF-XXXXX format
  createdAt: string;
  createdBy: string;
  createdByName: string;
  warehouseId: string;
  warehouseName: string;
  zone?: string;              // Optional zone within warehouse
  status: CountSessionStatus;
  lines: CountLine[];
  totalProducts: number;
  countedProducts: number;
  productsWithDifference: number;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  adjustmentsGenerated?: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface AdjustmentFormData {
  warehouseId: string;
  type: AdjustmentType;
  reason: AdjustmentReason;
  observation: string;
  lines: Omit<AdjustmentLine, 'id' | 'resultingStock' | 'lineValue'>[];
}

export interface TransferFormData {
  sourceWarehouseId: string;
  destWarehouseId: string;
  observation: string;
  inflationFactor: number;
  lines: Omit<TransferLine, 'id' | 'resultingUnits' | 'transferCost' | 'totalValue'>[];
}

export interface CountSessionFormData {
  warehouseId: string;
  zone?: string;
  productIds?: string[];      // Specific products to count, or all if empty
}

// ============================================
// HELPER FUNCTIONS TYPES
// ============================================

export interface StockValidationResult {
  valid: boolean;
  message?: string;
  currentAvailable?: number;
  projectedAvailable?: number;
}

// Stagnant product detection (Regla de Javier)
export interface StagnantProductInfo {
  productId: string;
  lastMovementDate: string | null;
  monthsWithoutMovement: number;
  severity: 'warning' | 'danger';  // 4-6 months = warning, 6+ = danger
}
