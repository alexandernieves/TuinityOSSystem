/**
 * Accounting (Contabilidad) types
 * Based on Document 007 specifications
 */

// Account types in chart of accounts
export type AccountType = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'costo' | 'gasto';

// Account nature
export type AccountNature = 'deudora' | 'acreedora';

// Journal entry source
export type JournalEntrySource = 'venta' | 'compra' | 'cobro' | 'pago' | 'ajuste_inventario' | 'transferencia' | 'manual' | 'cierre';

// Journal entry status
export type JournalEntryStatus = 'borrador' | 'registrado' | 'aprobado' | 'anulado';

// Reconciliation status
export type ReconciliationStatus = 'abierta' | 'en_proceso' | 'cerrada';

// Reconciliation item status
export type ReconciliationItemStatus = 'conciliado' | 'pendiente_sistema' | 'pendiente_banco' | 'discrepancia';

// Monthly close status
export type CloseStatus = 'abierto' | 'en_proceso' | 'cerrado';

// Financial statement type
export type FinancialStatementType = 'estado_resultados' | 'balance_general' | 'flujo_efectivo';

// Period type
export type PeriodType = 'mensual' | 'trimestral' | 'anual' | 'comparativo';

// Chart of accounts entry
export interface Account {
  id: string;
  code: string;                     // XXXX-YYY format (e.g., "1000-000")
  name: string;
  type: AccountType;
  nature: AccountNature;
  parentId?: string;                // For hierarchical structure
  parentCode?: string;
  level: number;                    // 1=category, 2=subcategory, 3=detail
  isActive: boolean;
  hasMovements: boolean;
  balance: number;
  description?: string;
  children?: Account[];             // For tree rendering
}

// Journal entry (asiento contable)
export interface JournalEntry {
  id: string;                       // JE-00001 format
  number: number;                   // Sequential number
  date: string;
  description: string;
  source: JournalEntrySource;
  sourceDocumentId?: string;        // e.g., FAC-00001, OC-03566
  sourceDocumentNumber?: string;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;              // totalDebit === totalCredit
  createdBy: string;
  createdByName: string;
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  notes?: string;
}

// Journal entry line
export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
  costCenterId?: string;
}

// Bank account
export interface BankAccount {
  id: string;                       // BA-001 format
  bankId: string;
  bankName: string;
  bankLogo?: string;
  accountNumber: string;
  accountType: 'corriente' | 'ahorros' | 'inversion';
  currency: string;
  currentBalance: number;
  availableBalance: number;
  lastReconciliationDate?: string;
  isActive: boolean;
  color: string;                    // For UI display
}

// Bank reconciliation
export interface BankReconciliation {
  id: string;                       // REC-00001 format
  bankAccountId: string;
  bankAccountName: string;
  bankName: string;
  period: string;                   // "2026-02"
  startDate: string;
  endDate: string;
  systemBalance: number;
  bankBalance: number;
  difference: number;
  status: ReconciliationStatus;
  items: ReconciliationItem[];
  reconciledCount: number;
  pendingCount: number;
  createdBy: string;
  createdAt: string;
  closedBy?: string;
  closedAt?: string;
}

// Reconciliation item
export interface ReconciliationItem {
  id: string;
  date: string;
  description: string;
  reference?: string;
  systemAmount?: number;            // Amount in system
  bankAmount?: number;              // Amount in bank statement
  status: ReconciliationItemStatus;
  matchedItemId?: string;           // ID of matched counterpart
}

// Monthly close
export interface MonthlyClose {
  id: string;
  period: string;                   // "2026-02"
  year: number;
  month: number;
  monthName: string;
  status: CloseStatus;
  checklist: CloseChecklistItem[];
  closedBy?: string;
  closedByName?: string;
  closedAt?: string;
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  notes?: string;
}

// Close checklist item
export interface CloseChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

// Annual close
export interface AnnualClose {
  id: string;
  year: number;
  status: CloseStatus;
  monthsClosed: number;             // out of 12
  closingEntryId?: string;          // JE reference
  closedBy?: string;
  closedByName?: string;
  closedAt?: string;
  retainedEarnings: number;
}

// Financial statement line
export interface FinancialStatementLine {
  accountCode?: string;
  label: string;
  amount: number;
  previousAmount?: number;          // For comparatives
  level: number;                    // Indentation level
  isTotal: boolean;
  isBold: boolean;
  children?: FinancialStatementLine[];
}

// Financial statement
export interface FinancialStatement {
  type: FinancialStatementType;
  title: string;
  period: string;
  periodLabel: string;
  companyName: string;
  generatedAt: string;
  lines: FinancialStatementLine[];
  totals: Record<string, number>;
}

// Cash flow projection
export interface CashFlowProjection {
  period: string;                   // "Semana 1", "Semana 2", etc.
  startDate: string;
  endDate: string;
  expectedIncome: number;           // CxC por vencer
  expectedExpenses: number;         // CxP + gastos fijos
  netFlow: number;
  cumulativeBalance: number;
}

// Treasury dashboard data
export interface TreasuryDashboard {
  totalBankBalance: number;
  bankAccounts: BankAccount[];
  recentMovements: BankMovement[];
  cashFlowProjection: CashFlowProjection[];
}

// Bank movement
export interface BankMovement {
  id: string;
  date: string;
  bankAccountId: string;
  bankName: string;
  description: string;
  reference?: string;
  type: 'ingreso' | 'egreso';
  amount: number;
  balance: number;
}

// Ledger entry (for Libro Mayor)
export interface LedgerEntry {
  date: string;
  journalEntryId: string;
  journalEntryNumber: number;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

// Trial balance line
export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
}

// Accounting stats for dashboard
export interface AccountingStats {
  monthlyRevenue: number;
  monthlyExpenses: number;
  netIncome: number;
  totalBankBalance: number;
  grossMarginPercent: number;
  cxcRotation: number;             // Days
  averageCollectionDays: number;
  pendingReconciliations: number;
  pendingCloses: number;
}

// Monthly P&L summary (for chart)
export interface MonthlyPLSummary {
  month: string;
  monthLabel: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

// Labels
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  patrimonio: 'Patrimonio',
  ingreso: 'Ingreso',
  costo: 'Costo',
  gasto: 'Gasto',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, { bg: string; text: string }> = {
  activo: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  pasivo: { bg: 'bg-red-500/10', text: 'text-red-500' },
  patrimonio: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  ingreso: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  costo: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  gasto: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
};

export const ACCOUNT_NATURE_LABELS: Record<AccountNature, string> = {
  deudora: 'Deudora',
  acreedora: 'Acreedora',
};

export const JOURNAL_SOURCE_LABELS: Record<JournalEntrySource, string> = {
  venta: 'Venta',
  compra: 'Compra',
  cobro: 'Cobro',
  pago: 'Pago',
  ajuste_inventario: 'Ajuste Inventario',
  transferencia: 'Transferencia',
  manual: 'Manual',
  cierre: 'Cierre',
};

export const JOURNAL_SOURCE_COLORS: Record<JournalEntrySource, { bg: string; text: string }> = {
  venta: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  compra: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  cobro: { bg: 'bg-teal-500/10', text: 'text-teal-500' },
  pago: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  ajuste_inventario: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  transferencia: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  manual: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  cierre: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
};

export const JOURNAL_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  borrador: 'Borrador',
  registrado: 'Registrado',
  aprobado: 'Aprobado',
  anulado: 'Anulado',
};

export const JOURNAL_STATUS_CONFIG: Record<JournalEntryStatus, { bg: string; text: string; dot: string }> = {
  borrador: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
  registrado: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  aprobado: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  anulado: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
};

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  abierta: 'Abierta',
  en_proceso: 'En Proceso',
  cerrada: 'Cerrada',
};

export const CLOSE_STATUS_LABELS: Record<CloseStatus, string> = {
  abierto: 'Abierto',
  en_proceso: 'En Proceso',
  cerrado: 'Cerrado',
};

export const CLOSE_STATUS_CONFIG: Record<CloseStatus, { bg: string; text: string; dot: string }> = {
  abierto: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
  en_proceso: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
  cerrado: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
};

export const FINANCIAL_STATEMENT_TYPE_LABELS: Record<FinancialStatementType, string> = {
  estado_resultados: 'Estado de Resultados',
  balance_general: 'Balance General',
  flujo_efectivo: 'Flujo de Efectivo',
};

// Bank constants (11 banks)
export const BANKS = [
  { id: 'BK-001', name: 'Banesco', color: '#00529B' },
  { id: 'BK-002', name: 'Banistmo', color: '#E31837' },
  { id: 'BK-003', name: 'Credicorp Bank', color: '#003B71' },
  { id: 'BK-004', name: 'Multibank', color: '#0066B3' },
  { id: 'BK-005', name: 'Allbank', color: '#8DC63F' },
  { id: 'BK-006', name: 'Banco General', color: '#003366' },
  { id: 'BK-007', name: 'BAC Credomatic', color: '#ED1C24' },
  { id: 'BK-008', name: 'St. George Bank', color: '#78BE20' },
  { id: 'BK-009', name: 'Metro Bank', color: '#00A3E0' },
  { id: 'BK-010', name: 'Mercantil Banco', color: '#0033A0' },
  { id: 'BK-011', name: 'Bank of China', color: '#C41230' },
] as const;
