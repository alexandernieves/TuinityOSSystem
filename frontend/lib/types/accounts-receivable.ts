/**
 * Accounts Receivable (Cuentas por Cobrar) types
 * Based on Document 006 specifications
 */

// Payment methods
export type PaymentMethod = 'transferencia' | 'cheque' | 'efectivo' | 'tarjeta' | 'deposito';

// CxC document status
export type CxCDocumentStatus = 'pendiente' | 'parcial' | 'pagado' | 'vencido' | 'anulado';

// Annulment status
export type AnnulmentStatus = 'solicitada' | 'aprobada' | 'rechazada' | 'ejecutada';

// Transaction type
export type CxCTransactionType = 'factura' | 'cobro' | 'nota_credito' | 'anulacion' | 'ajuste';

// Aging bucket keys
export type AgingBucketKey = 'corriente' | '1_30' | '31_60' | '61_90' | '90_plus';

// Account Receivable document (pending invoice)
export interface AccountReceivable {
  id: string;                       // CXC-00001 format
  invoiceId: string;                // FAC-00001
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  salesRepId?: string;
  salesRepName?: string;
  issueDate: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  balance: number;                  // originalAmount - paidAmount
  status: CxCDocumentStatus;
  daysOverdue: number;              // 0 if not overdue
  agingBucket: AgingBucketKey;
  currency: string;                 // USD
  notes?: string;
}

// Payment record
export interface Payment {
  id: string;                       // COB-00001 format
  clientId: string;
  clientName: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;               // Check number, transfer ref, etc.
  bankId?: string;
  bankName?: string;
  applications: PaymentApplication[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
}

// How a payment is applied to specific invoices
export interface PaymentApplication {
  id: string;
  paymentId: string;
  accountReceivableId: string;
  invoiceNumber: string;
  amountApplied: number;
  previousBalance: number;
  newBalance: number;
}

// Annulment request
export interface AnnulmentRequest {
  id: string;                       // ANU-00001 format
  documentType: 'factura' | 'cobro' | 'nota_credito';
  documentId: string;
  documentNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  reason: string;
  observations?: string;
  status: AnnulmentStatus;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Aging bucket data
export interface AgingBucket {
  key: AgingBucketKey;
  label: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

// Account statement
export interface AccountStatement {
  id: string;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  generatedAt: string;
  cutoffDate: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  transactions: CxCTransaction[];
}

// CxC transaction (journal entry)
export interface CxCTransaction {
  id: string;
  date: string;
  type: CxCTransactionType;
  documentNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  clientId: string;
  clientName: string;
}

// Dashboard stats
export interface CxCStats {
  totalReceivable: number;
  currentAmount: number;
  overdue1_30: number;
  overdue31_60: number;
  overdue61_90: number;
  overdue90Plus: number;
  collectionsThisMonth: number;
  totalClients: number;
  overdueClients: number;
  averageDaysToCollect: number;
}

// Filters for CxC queries
export interface CxCFilters {
  search?: string;
  clientId?: string;
  status?: CxCDocumentStatus | 'all';
  agingBucket?: AgingBucketKey | 'all';
  dateFrom?: string;
  dateTo?: string;
  salesRepId?: string;
  transactionType?: CxCTransactionType | 'all';
}

// Labels
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  deposito: 'Depósito',
};

export const CXC_STATUS_LABELS: Record<CxCDocumentStatus, string> = {
  pendiente: 'Pendiente',
  parcial: 'Pago Parcial',
  pagado: 'Pagado',
  vencido: 'Vencido',
  anulado: 'Anulado',
};

export const CXC_STATUS_CONFIG: Record<CxCDocumentStatus, { bg: string; text: string; dot: string }> = {
  pendiente: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  parcial: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  pagado: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  vencido: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
  anulado: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
};

export const ANNULMENT_STATUS_LABELS: Record<AnnulmentStatus, string> = {
  solicitada: 'Solicitada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  ejecutada: 'Ejecutada',
};

export const ANNULMENT_STATUS_CONFIG: Record<AnnulmentStatus, { bg: string; text: string }> = {
  solicitada: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  aprobada: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  rechazada: { bg: 'bg-red-500/10', text: 'text-red-500' },
  ejecutada: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
};

export const AGING_BUCKET_LABELS: Record<AgingBucketKey, string> = {
  corriente: 'Corriente',
  '1_30': '1-30 días',
  '31_60': '31-60 días',
  '61_90': '61-90 días',
  '90_plus': '90+ días',
};

export const AGING_BUCKET_COLORS: Record<AgingBucketKey, string> = {
  corriente: 'bg-emerald-500',
  '1_30': 'bg-amber-500',
  '31_60': 'bg-orange-500',
  '61_90': 'bg-red-400',
  '90_plus': 'bg-red-600',
};

export const CXC_TRANSACTION_TYPE_LABELS: Record<CxCTransactionType, string> = {
  factura: 'Factura',
  cobro: 'Cobro',
  nota_credito: 'Nota de Crédito',
  anulacion: 'Anulación',
  ajuste: 'Ajuste',
};
