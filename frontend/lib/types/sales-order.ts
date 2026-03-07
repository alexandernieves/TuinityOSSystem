/**
 * Sales Order types for Ventas B2B module
 * Based on Document 005 specifications
 *
 * Pipeline: BORRADOR → COTIZADO → PEDIDO → APROBADO → EMPACADO → FACTURADO
 */

import type { PriceLevel, PaymentTerms } from './client';

// Sales order status - pipeline stages
export type SalesOrderStatus =
  | 'borrador'      // Draft - being created
  | 'cotizado'      // Quote sent to customer
  | 'pedido'        // Order confirmed by customer
  | 'aprobado'      // Approved by gerencia
  | 'empacado'      // Packed by bodega
  | 'facturado'     // Invoiced
  | 'cancelado';    // Cancelled

// Document type
export type DocumentType = 'cotizacion' | 'pedido' | 'factura';

// Dispatch type (for DMC integration)
export type DispatchType = 'salida' | 'traspaso';

// Line item in a sales order
export interface SalesOrderLine {
  id: string;
  productId: string;
  productReference: string;
  productDescription: string;
  productGroup?: string;
  productBrand?: string;

  // Quantities
  quantity: number;
  quantityPacked?: number;        // For partial packing

  // Pricing
  priceLevel: PriceLevel;         // Price level applied
  unitPrice: number;              // Price for this customer
  originalPrice?: number;         // Original suggested price
  discount: number;               // Line discount % (0-100)
  subtotal: number;               // qty * unitPrice * (1 - discount/100)

  // Commission tracking - visible to vendedor as indicator only
  lastPriceToCustomer?: number;   // "Último precio" - from previous order to this customer

  // Hidden from vendedor - only visible to gerencia/contabilidad
  unitCost?: number;              // Weighted average cost
  totalCost?: number;             // unitCost * quantity
  marginAmount?: number;          // subtotal - totalCost
  marginPercent?: number;         // (unitPrice - unitCost) / unitPrice * 100
  commissionEligible?: boolean;   // true if marginPercent >= 10%

  // Logistics
  weightPerUnit?: number;
  totalWeight?: number;
  cubicMeters?: number;
}

// Additional expenses (gastos adicionales)
export interface AdditionalExpense {
  id: string;
  description: string;            // Flete, Embalaje, Seguro, Handling
  amount: number;
  taxable: boolean;
}

// Amendment record for post-approval changes
export interface Amendment {
  id: string;
  date: string;
  type: 'quantity' | 'price' | 'line_added' | 'line_removed' | 'other';
  field?: string;
  previousValue: string;
  newValue: string;
  reason: string;
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Main Sales Order interface
export interface SalesOrder {
  id: string;                      // COT-00001, PED-00001, FAC-00001
  orderNumber: string;
  documentType: DocumentType;
  status: SalesOrderStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Customer info
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerCountry?: string;
  priceLevel: PriceLevel;
  paymentTerms: PaymentTerms;

  // Dates
  validUntil?: string;             // Quote validity
  requestedDeliveryDate?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;

  // Dispatch
  dispatchType?: DispatchType;
  bodegaId?: string;
  bodegaName?: string;
  shippingAddressId?: string;
  shippingAddress?: string;

  // Lines
  lines: SalesOrderLine[];

  // Additional expenses - inherited through pipeline
  additionalExpenses: AdditionalExpense[];

  // Totals
  subtotal: number;                // Sum of line subtotals
  discountTotal: number;           // Sum of line discounts in $
  expensesTotal: number;           // Sum of additional expenses
  taxRate: number;                 // Tax rate % (ITBMS 7% or 0 for zona libre)
  taxAmount: number;               // Calculated tax
  total: number;                   // subtotal + expenses + tax

  // Margin info - HIDDEN from vendedor
  totalCost?: number;
  totalMargin?: number;
  marginPercent?: number;
  commissionableAmount?: number;   // Only lines with margin >= 10%

  // Workflow
  createdBy: string;               // Vendedor ID
  createdByName: string;           // Vendedor name
  requiresApproval: boolean;       // true if any line has margin < 10%
  approvedBy?: string;
  approvedByName?: string;
  approvalDate?: string;
  approvalNotes?: string;

  // Related documents - pipeline links
  quoteId?: string;                // If this order came from a quote
  quoteNumber?: string;
  orderId?: string;                // If this invoice came from an order
  sourceOrderNumber?: string;      // Order number this doc came from
  invoiceId?: string;              // If this order has been invoiced
  invoiceNumber?: string;

  // Amendments
  amendments?: Amendment[];

  // Packing
  packedBy?: string;
  packedByName?: string;
  packedAt?: string;
  packingNotes?: string;

  // F10: Venta anticipada - mercancía por llegar
  includesIncomingStock?: boolean;  // true if order includes arriving stock
  incomingStockNote?: string;       // Note about incoming stock

  // Metadata
  notes?: string;                  // Customer-visible notes
  internalNotes?: string;          // Internal only
  referenceNumber?: string;        // Customer PO number
  priority?: 'normal' | 'urgente';

  // Logistics totals
  totalWeight?: number;
  totalCubicMeters?: number;
  totalBultos?: number;
}

// Packing list - for bodega view (NO PRICES/COSTS)
export interface PackingListLine {
  productId: string;
  productReference: string;
  productDescription: string;
  productGroup?: string;
  quantity: number;
  quantityPacked: number;
  pending: number;
  location?: string;               // Warehouse location
  tariffCode?: string;             // Código arancelario for DMC
}

export interface PackingList {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerCountry?: string;
  requestedDeliveryDate?: string;
  lines: PackingListLine[];
  totalBultos?: number;
  totalWeight?: number;
  totalCubicMeters?: number;
  packedBy?: string;
  packedByName?: string;
  packedAt?: string;
  notes?: string;
  status: 'pending' | 'partial' | 'complete';
}

// Invoice - for FE integration
export interface Invoice {
  id: string;                      // FAC-00001
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;

  // Customer
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerTaxIdType?: string;
  customerCountry: string;
  customerAddress?: string;

  // Dates
  issueDate: string;
  dueDate: string;

  // Lines and totals
  lines: SalesOrderLine[];
  additionalExpenses: AdditionalExpense[];
  subtotal: number;
  expensesTotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  // Payment
  paymentTerms: PaymentTerms;
  status: 'emitida' | 'pagada' | 'parcial' | 'vencida' | 'anulada';
  paidAmount?: number;
  paidDate?: string;

  // FE (Factura Electrónica) integration placeholder
  feStatus?: 'pendiente' | 'enviada' | 'aceptada' | 'rechazada';
  feReference?: string;
  feAuthorizationNumber?: string;
  feSubmittedAt?: string;
  feResponseAt?: string;

  // Type - Zona Libre uses "Factura de Zona Franca"
  invoiceType: 'zona_franca' | 'nacional' | 'exportacion';
  sucursal?: string;
  puntoFacturacion?: string;

  // Metadata
  createdBy: string;
  createdByName: string;
  notes?: string;
}

// Return / Credit Note
export interface ReturnLine {
  productId: string;
  productReference: string;
  productDescription: string;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  subtotal: number;
  reason?: string;
}

export interface Return {
  id: string;                      // DEV-00001
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;

  // Customer
  customerId: string;
  customerName: string;

  // Details
  date: string;
  reason: string;
  lines: ReturnLine[];
  total: number;

  // Status
  status: 'pendiente' | 'aprobada' | 'procesada' | 'rechazada';

  // Workflow
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  processedBy?: string;
  processedByName?: string;
  processedAt?: string;

  // Notes
  notes?: string;
  rejectionReason?: string;
}

// Stats for dashboard
export interface SalesStats {
  // Counts
  quotesThisMonth: number;
  ordersThisMonth: number;
  invoicesThisMonth: number;

  // Pipeline
  pendingQuotes: number;
  pendingApproval: number;
  readyToPack: number;
  readyToInvoice: number;

  // Values
  pipelineValue: number;           // Total value in pipeline
  salesValueThisMonth: number;     // Invoiced this month

  // Margins - HIDDEN from vendedor
  marginThisMonth?: number;
  marginPercentThisMonth?: number;
  commissionableThisMonth?: number;

  // By status counts
  byStatus: Record<SalesOrderStatus, number>;
}

// Filters for list page
export interface SalesOrderFilters {
  search?: string;
  status?: SalesOrderStatus | 'all';
  documentType?: DocumentType | 'all';
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  requiresApproval?: boolean;
  priceLevel?: PriceLevel | 'all';
}

// Status configuration for UI
export const STATUS_CONFIG: Record<SalesOrderStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
  icon?: string;
}> = {
  borrador: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: 'Borrador',
  },
  cotizado: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    label: 'Cotizado',
  },
  pedido: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    label: 'Pedido',
  },
  aprobado: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Aprobado',
  },
  empacado: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Empacado',
  },
  facturado: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
    label: 'Facturado',
  },
  cancelado: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Cancelado',
  },
};

// Document type labels
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cotizacion: 'Cotización',
  pedido: 'Pedido',
  factura: 'Factura',
};

// Document type prefixes for numbering
export const DOCUMENT_TYPE_PREFIXES: Record<DocumentType, string> = {
  cotizacion: 'COT',
  pedido: 'PED',
  factura: 'FAC',
};
