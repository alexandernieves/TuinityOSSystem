/**
 * Purchase Order Types for Evolution OS
 * Based on Document 003 specifications - Módulo Compras e Importación
 */

// Order status enum matching spec
export type PurchaseOrderStatus =
  | 'pendiente'     // Pending - order created, not shipped
  | 'en_transito'   // In transit - shipped, not arrived
  | 'en_recepcion'  // Partial reception in progress
  | 'completada'    // Fully received
  | 'cancelada';    // Cancelled

// Individual line item in a Purchase Order
export interface PurchaseOrderLine {
  id: string;
  productId: string;
  productReference: string;        // EVL-00001 format
  productDescription: string;
  quantity: number;                // Ordered quantity
  quantityReceived: number;        // Qty already received (for partial reception)
  unitCostFOB: number;             // FOB unit cost
  totalFOB: number;                // = quantity * unitCostFOB
  // CIF calculated at reception
  unitCostCIF?: number;
  totalCIF?: number;
}

// Expense breakdown for CIF calculation
export interface ExpenseBreakdown {
  freight: number;      // Flete marítimo
  insurance: number;    // Seguro
  customs: number;      // Aduana
  handling: number;     // Manejo/Handling
  other: number;        // Otros gastos
  total: number;        // Sum of all expenses
}

// Main Purchase Order interface
export interface PurchaseOrder {
  id: string;                      // OC-03566 format
  orderNumber: string;             // Same as id
  createdAt: string;               // ISO date
  supplierId: string;
  supplierName: string;
  supplierInvoice?: string;        // Proveedor's invoice number
  bodegaId: string;
  bodegaName: string;
  status: PurchaseOrderStatus;
  expectedArrivalDate?: string;
  actualArrivalDate?: string;
  lines: PurchaseOrderLine[];
  // Totals
  totalFOB: number;
  expensePercentage?: number;      // 15% default for quick mode
  expenseBreakdown?: ExpenseBreakdown;
  totalExpenses?: number;
  totalCIF?: number;
  // F11: Cost proration
  costProrated?: boolean;           // true when costs have been prorated to line items
  proratedAt?: string;              // When proration was applied
  proratedBy?: string;              // Who applied proration
  costIncreaseAlert?: boolean;      // true if any product cost increased >10%
  // Metadata
  createdBy: string;
  notes?: string;
  attachments?: string[];          // URLs to attached files
}

// Excel column mapping for imports
export interface ExcelColumnMapping {
  productReference?: string;       // Column letter/name for product ref
  productDescription?: string;
  quantity?: string;
  unitCostFOB?: string;
  barcode?: string;
  tariffCode?: string;
}

// Supplier type with optional Excel template
export interface Supplier {
  id: string;
  name: string;
  country: string;
  contact?: string;
  email?: string;
  phone?: string;
  // Saved Excel import template for this supplier
  columnTemplate?: ExcelColumnMapping;
}

// Bodega (warehouse) type
export interface Bodega {
  id: string;
  name: string;
  code: string;                    // ZL, CFZ, PTY
  location: string;
}

// Reception entry record - for Historial de Entradas
export interface MerchandiseEntry {
  id: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierInvoice: string;
  bodegaId: string;
  bodegaName: string;
  receivedBy: string;
  lines: MerchandiseEntryLine[];
  expenseMethod: 'percentage' | 'breakdown';
  expensePercentage?: number;
  expenseBreakdown?: ExpenseBreakdown;
  totalFOB: number;
  totalCIF: number;
  receptionType: 'completa' | 'parcial';
}

export interface MerchandiseEntryLine {
  productId: string;
  productReference: string;
  productDescription: string;
  quantityReceived: number;
  unitCostFOB: number;
  unitCostCIF: number;
  totalFOB: number;
  totalCIF: number;
  previousCostAvg: number;         // Before this entry
  newCostAvg: number;              // After weighted average calculation
}

// Product cost history entry - for Historial de Costos por Producto
export interface ProductCostHistoryEntry {
  id: string;
  date: string;
  entryId: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  quantity: number;
  costFOB: number;
  expensePercentage: number;
  costCIF: number;
  costWeightedAvg: number;
  supplierId: string;
  supplierName: string;
}

// Stats for the main page
export interface PurchaseOrderStats {
  activeOrders: number;            // Orders pending/in_transit/en_recepcion
  inTransit: number;               // Orders in transit
  receivedThisMonth: number;       // Completed this month
  valueInTransit: number;          // Total FOB value in transit
}

// Filters for the PO list
export interface PurchaseOrderFilters {
  search?: string;
  status?: PurchaseOrderStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  supplierId?: string;
  bodegaId?: string;
}

// Excel import types
export interface ExcelImportRow {
  rowNumber: number;
  data: Record<string, string | number>;
  mappedData?: {
    productReference: string;
    productDescription: string;
    quantity: number;
    unitCostFOB: number;
  };
  errors?: string[];
  warnings?: string[];
  productMatch?: {
    id: string;
    description: string;
    confidence: 'exact' | 'fuzzy' | 'none';
  };
}

export interface ExcelImportResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: ExcelImportRow[];
  suggestedMapping?: ExcelColumnMapping;
}

// Cost impact calculation for reception
export interface CostImpactLine {
  productId: string;
  productReference: string;
  productDescription: string;
  previousCost: number;
  newCostCIF: number;
  newWeightedAvg: number;
  changePercent: number;
  isSignificant: boolean;          // >5% change
}
