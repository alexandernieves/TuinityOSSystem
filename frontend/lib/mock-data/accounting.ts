/**
 * Mock data for Accounting (Contabilidad) module
 * Based on Document 007 specifications
 * Store-backed: data persists in localStorage
 */

import type {
  Account,
  AccountType,
  JournalEntry,
  JournalEntryLine,
  JournalEntrySource,
  BankAccount,
  BankReconciliation,
  ReconciliationItem,
  MonthlyClose,
  CloseChecklistItem,
  FinancialStatement,
  FinancialStatementLine,
  CashFlowProjection,
  BankMovement,
  LedgerEntry,
  TrialBalanceLine,
  AccountingStats,
  MonthlyPLSummary,
} from '@/lib/types/accounting';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// ============================================================================
// CHART OF ACCOUNTS (Plan de Cuentas) - Seed Data
// ============================================================================

const SEED_ACCOUNTS: Account[] = [
  // ACTIVOS (1000)
  { id: 'ACC-001', code: '1000-000', name: 'ACTIVOS', type: 'activo', nature: 'deudora', level: 1, isActive: true, hasMovements: false, balance: 2850000 },
  { id: 'ACC-002', code: '1100-000', name: 'Activo Corriente', type: 'activo', nature: 'deudora', parentId: 'ACC-001', parentCode: '1000-000', level: 2, isActive: true, hasMovements: false, balance: 1950000 },
  { id: 'ACC-003', code: '1100-001', name: 'Caja General', type: 'activo', nature: 'deudora', parentId: 'ACC-002', parentCode: '1100-000', level: 3, isActive: true, hasMovements: true, balance: 15000 },
  { id: 'ACC-004', code: '1100-002', name: 'Bancos', type: 'activo', nature: 'deudora', parentId: 'ACC-002', parentCode: '1100-000', level: 3, isActive: true, hasMovements: true, balance: 485000 },
  { id: 'ACC-005', code: '1100-003', name: 'Cuentas por Cobrar', type: 'activo', nature: 'deudora', parentId: 'ACC-002', parentCode: '1100-000', level: 3, isActive: true, hasMovements: true, balance: 258802 },
  { id: 'ACC-006', code: '1100-004', name: 'Inventario de Mercancías', type: 'activo', nature: 'deudora', parentId: 'ACC-002', parentCode: '1100-000', level: 3, isActive: true, hasMovements: true, balance: 1150000 },
  { id: 'ACC-007', code: '1100-005', name: 'Anticipos a Proveedores', type: 'activo', nature: 'deudora', parentId: 'ACC-002', parentCode: '1100-000', level: 3, isActive: true, hasMovements: true, balance: 41198 },
  { id: 'ACC-008', code: '1200-000', name: 'Activo No Corriente', type: 'activo', nature: 'deudora', parentId: 'ACC-001', parentCode: '1000-000', level: 2, isActive: true, hasMovements: false, balance: 900000 },
  { id: 'ACC-009', code: '1200-001', name: 'Mobiliario y Equipo', type: 'activo', nature: 'deudora', parentId: 'ACC-008', parentCode: '1200-000', level: 3, isActive: true, hasMovements: true, balance: 350000 },
  { id: 'ACC-010', code: '1200-002', name: 'Vehículos', type: 'activo', nature: 'deudora', parentId: 'ACC-008', parentCode: '1200-000', level: 3, isActive: true, hasMovements: true, balance: 280000 },
  { id: 'ACC-011', code: '1200-003', name: 'Depreciación Acumulada', type: 'activo', nature: 'acreedora', parentId: 'ACC-008', parentCode: '1200-000', level: 3, isActive: true, hasMovements: true, balance: -120000 },
  { id: 'ACC-012', code: '1200-004', name: 'Mejoras en Local Arrendado', type: 'activo', nature: 'deudora', parentId: 'ACC-008', parentCode: '1200-000', level: 3, isActive: true, hasMovements: true, balance: 390000 },

  // PASIVOS (2000)
  { id: 'ACC-013', code: '2000-000', name: 'PASIVOS', type: 'pasivo', nature: 'acreedora', level: 1, isActive: true, hasMovements: false, balance: 980000 },
  { id: 'ACC-014', code: '2100-000', name: 'Pasivo Corriente', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-013', parentCode: '2000-000', level: 2, isActive: true, hasMovements: false, balance: 680000 },
  { id: 'ACC-015', code: '2100-001', name: 'Cuentas por Pagar', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-014', parentCode: '2100-000', level: 3, isActive: true, hasMovements: true, balance: 420000 },
  { id: 'ACC-016', code: '2100-002', name: 'Impuestos por Pagar', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-014', parentCode: '2100-000', level: 3, isActive: true, hasMovements: true, balance: 35000 },
  { id: 'ACC-017', code: '2100-003', name: 'Salarios por Pagar', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-014', parentCode: '2100-000', level: 3, isActive: true, hasMovements: true, balance: 85000 },
  { id: 'ACC-018', code: '2100-004', name: 'Comisiones por Pagar', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-014', parentCode: '2100-000', level: 3, isActive: true, hasMovements: true, balance: 28000 },
  { id: 'ACC-019', code: '2100-005', name: 'Anticipos de Clientes', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-014', parentCode: '2100-000', level: 3, isActive: true, hasMovements: true, balance: 112000 },
  { id: 'ACC-020', code: '2200-000', name: 'Pasivo No Corriente', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-013', parentCode: '2000-000', level: 2, isActive: true, hasMovements: false, balance: 300000 },
  { id: 'ACC-021', code: '2200-001', name: 'Préstamos Bancarios L/P', type: 'pasivo', nature: 'acreedora', parentId: 'ACC-020', parentCode: '2200-000', level: 3, isActive: true, hasMovements: true, balance: 300000 },

  // PATRIMONIO (3000)
  { id: 'ACC-022', code: '3000-000', name: 'PATRIMONIO', type: 'patrimonio', nature: 'acreedora', level: 1, isActive: true, hasMovements: false, balance: 1870000 },
  { id: 'ACC-023', code: '3100-001', name: 'Capital Social', type: 'patrimonio', nature: 'acreedora', parentId: 'ACC-022', parentCode: '3000-000', level: 3, isActive: true, hasMovements: true, balance: 1000000 },
  { id: 'ACC-024', code: '3100-002', name: 'Utilidades Retenidas', type: 'patrimonio', nature: 'acreedora', parentId: 'ACC-022', parentCode: '3000-000', level: 3, isActive: true, hasMovements: true, balance: 650000 },
  { id: 'ACC-025', code: '3100-003', name: 'Utilidad del Ejercicio', type: 'patrimonio', nature: 'acreedora', parentId: 'ACC-022', parentCode: '3000-000', level: 3, isActive: true, hasMovements: true, balance: 220000 },

  // INGRESOS (4000)
  { id: 'ACC-026', code: '4000-000', name: 'INGRESOS', type: 'ingreso', nature: 'acreedora', level: 1, isActive: true, hasMovements: false, balance: 1850000 },
  { id: 'ACC-027', code: '4100-001', name: 'Ventas B2B', type: 'ingreso', nature: 'acreedora', parentId: 'ACC-026', parentCode: '4000-000', level: 3, isActive: true, hasMovements: true, balance: 1620000 },
  { id: 'ACC-028', code: '4100-002', name: 'Ventas B2C (POS)', type: 'ingreso', nature: 'acreedora', parentId: 'ACC-026', parentCode: '4000-000', level: 3, isActive: true, hasMovements: true, balance: 180000 },
  { id: 'ACC-029', code: '4200-001', name: 'Descuentos sobre Ventas', type: 'ingreso', nature: 'deudora', parentId: 'ACC-026', parentCode: '4000-000', level: 3, isActive: true, hasMovements: true, balance: -42000 },
  { id: 'ACC-030', code: '4200-002', name: 'Devoluciones sobre Ventas', type: 'ingreso', nature: 'deudora', parentId: 'ACC-026', parentCode: '4000-000', level: 3, isActive: true, hasMovements: true, balance: -18000 },
  { id: 'ACC-031', code: '4300-001', name: 'Otros Ingresos', type: 'ingreso', nature: 'acreedora', parentId: 'ACC-026', parentCode: '4000-000', level: 3, isActive: true, hasMovements: true, balance: 110000 },

  // COSTOS (5000)
  { id: 'ACC-032', code: '5000-000', name: 'COSTOS', type: 'costo', nature: 'deudora', level: 1, isActive: true, hasMovements: false, balance: 1100000 },
  { id: 'ACC-033', code: '5100-001', name: 'Costo de Mercancía Vendida', type: 'costo', nature: 'deudora', parentId: 'ACC-032', parentCode: '5000-000', level: 3, isActive: true, hasMovements: true, balance: 980000 },
  { id: 'ACC-034', code: '5100-002', name: 'Flete de Importación', type: 'costo', nature: 'deudora', parentId: 'ACC-032', parentCode: '5000-000', level: 3, isActive: true, hasMovements: true, balance: 85000 },
  { id: 'ACC-035', code: '5100-003', name: 'Seguros de Importación', type: 'costo', nature: 'deudora', parentId: 'ACC-032', parentCode: '5000-000', level: 3, isActive: true, hasMovements: true, balance: 22000 },
  { id: 'ACC-036', code: '5100-004', name: 'Gastos de Aduana', type: 'costo', nature: 'deudora', parentId: 'ACC-032', parentCode: '5000-000', level: 3, isActive: true, hasMovements: true, balance: 13000 },

  // GASTOS (6000)
  { id: 'ACC-037', code: '6000-000', name: 'GASTOS OPERATIVOS', type: 'gasto', nature: 'deudora', level: 1, isActive: true, hasMovements: false, balance: 530000 },
  { id: 'ACC-038', code: '6100-001', name: 'Salarios y Prestaciones', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 280000 },
  { id: 'ACC-039', code: '6100-002', name: 'Comisiones de Ventas', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 48000 },
  { id: 'ACC-040', code: '6200-001', name: 'Alquiler de Oficina/Bodega', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 72000 },
  { id: 'ACC-041', code: '6200-002', name: 'Servicios Públicos', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 18000 },
  { id: 'ACC-042', code: '6200-003', name: 'Seguros', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 24000 },
  { id: 'ACC-043', code: '6200-004', name: 'Depreciación', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 40000 },
  { id: 'ACC-044', code: '6300-001', name: 'Gastos de Viaje', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 15000 },
  { id: 'ACC-045', code: '6300-002', name: 'Publicidad y Marketing', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 12000 },
  { id: 'ACC-046', code: '6300-003', name: 'Gastos Bancarios', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 8000 },
  { id: 'ACC-047', code: '6300-004', name: 'Gastos de Tecnología', type: 'gasto', nature: 'deudora', parentId: 'ACC-037', parentCode: '6000-000', level: 3, isActive: true, hasMovements: true, balance: 13000 },
];

// ============================================================================
// JOURNAL ENTRIES (Asientos Contables) - Seed Data
// ============================================================================

const SEED_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'JE-00001', number: 1, date: '2026-02-01T10:00:00Z',
    description: 'Venta B2B a MEDIMEX, S.A. - Pedido PED-00045',
    source: 'venta', sourceDocumentId: 'FAC-00008', sourceDocumentNumber: 'FAC-00008',
    status: 'aprobado',
    lines: [
      { id: 'JEL-001', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 12780, credit: 0 },
      { id: 'JEL-002', accountId: 'ACC-027', accountCode: '4100-001', accountName: 'Ventas B2B', debit: 0, credit: 12780 },
    ],
    totalDebit: 12780, totalCredit: 12780, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-01T10:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'JE-00002', number: 2, date: '2026-02-01T10:00:00Z',
    description: 'Costo de venta - Pedido PED-00045',
    source: 'venta', sourceDocumentId: 'FAC-00008', sourceDocumentNumber: 'FAC-00008',
    status: 'aprobado',
    lines: [
      { id: 'JEL-003', accountId: 'ACC-033', accountCode: '5100-001', accountName: 'Costo de Mercancía Vendida', debit: 8200, credit: 0 },
      { id: 'JEL-004', accountId: 'ACC-006', accountCode: '1100-004', accountName: 'Inventario de Mercancías', debit: 0, credit: 8200 },
    ],
    totalDebit: 8200, totalCredit: 8200, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-01T10:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'JE-00003', number: 3, date: '2026-02-01T10:30:00Z',
    description: 'Cobro parcial de SULTAN WHOLESALE - COB-00001',
    source: 'cobro', sourceDocumentId: 'COB-00001', sourceDocumentNumber: 'COB-00001',
    status: 'aprobado',
    lines: [
      { id: 'JEL-005', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 50000, credit: 0 },
      { id: 'JEL-006', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 0, credit: 50000 },
    ],
    totalDebit: 50000, totalCredit: 50000, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-01T10:30:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'JE-00004', number: 4, date: '2026-02-05T09:00:00Z',
    description: 'Cobro total de DT LICORES - COB-00004',
    source: 'cobro', sourceDocumentId: 'COB-00004', sourceDocumentNumber: 'COB-00004',
    status: 'aprobado',
    lines: [
      { id: 'JEL-007', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 18200, credit: 0 },
      { id: 'JEL-008', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 0, credit: 18200 },
    ],
    totalDebit: 18200, totalCredit: 18200, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-05T09:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'JE-00005', number: 5, date: '2026-02-10T10:00:00Z',
    description: 'Venta B2B a DT LICORES - Pedido PED-00052',
    source: 'venta', sourceDocumentId: 'FAC-00006', sourceDocumentNumber: 'FAC-00006',
    status: 'aprobado',
    lines: [
      { id: 'JEL-009', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 3957, credit: 0 },
      { id: 'JEL-010', accountId: 'ACC-027', accountCode: '4100-001', accountName: 'Ventas B2B', debit: 0, credit: 3957 },
    ],
    totalDebit: 3957, totalCredit: 3957, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-10T10:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'JE-00006', number: 6, date: '2026-02-10T15:00:00Z',
    description: 'Cobro de BRAND DISTRIBUIDOR CURACAO - COB-00005',
    source: 'cobro', sourceDocumentId: 'COB-00005', sourceDocumentNumber: 'COB-00005',
    status: 'aprobado',
    lines: [
      { id: 'JEL-011', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 67000, credit: 0 },
      { id: 'JEL-012', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 0, credit: 67000 },
    ],
    totalDebit: 67000, totalCredit: 67000, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-10T15:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-10T15:00:00Z',
  },
  {
    id: 'JE-00007', number: 7, date: '2026-02-12T10:00:00Z',
    description: 'Registro de compra - OC-03570 (Diageo)',
    source: 'compra', sourceDocumentId: 'OC-03570', sourceDocumentNumber: 'OC-03570',
    status: 'aprobado',
    lines: [
      { id: 'JEL-013', accountId: 'ACC-006', accountCode: '1100-004', accountName: 'Inventario de Mercancías', debit: 125000, credit: 0 },
      { id: 'JEL-014', accountId: 'ACC-015', accountCode: '2100-001', accountName: 'Cuentas por Pagar', debit: 0, credit: 125000 },
    ],
    totalDebit: 125000, totalCredit: 125000, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-12T10:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-12T10:00:00Z',
  },
  {
    id: 'JE-00008', number: 8, date: '2026-02-15T10:00:00Z',
    description: 'Nómina quincenal - Feb 1ra quincena',
    source: 'manual', status: 'aprobado',
    lines: [
      { id: 'JEL-015', accountId: 'ACC-038', accountCode: '6100-001', accountName: 'Salarios y Prestaciones', debit: 42000, credit: 0 },
      { id: 'JEL-016', accountId: 'ACC-016', accountCode: '2100-002', accountName: 'Impuestos por Pagar', debit: 0, credit: 5800 },
      { id: 'JEL-017', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 0, credit: 36200 },
    ],
    totalDebit: 42000, totalCredit: 42000, isBalanced: true,
    createdBy: 'USR-003', createdByName: 'Jakeira Chavez', createdAt: '2026-02-15T10:00:00Z',
    approvedBy: 'USR-001', approvedByName: 'Javier Lange', approvedAt: '2026-02-15T11:00:00Z',
  },
  {
    id: 'JE-00009', number: 9, date: '2026-02-15T11:00:00Z',
    description: 'Cobro de MARIA DEL MAR PEREZ SV - COB-00007',
    source: 'cobro', sourceDocumentId: 'COB-00007', sourceDocumentNumber: 'COB-00007',
    status: 'aprobado',
    lines: [
      { id: 'JEL-018', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 12000, credit: 0 },
      { id: 'JEL-019', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 0, credit: 12000 },
    ],
    totalDebit: 12000, totalCredit: 12000, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-15T11:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-15T11:00:00Z',
  },
  {
    id: 'JE-00010', number: 10, date: '2026-02-18T10:00:00Z',
    description: 'Pago alquiler bodega Zona Libre - Feb 2026',
    source: 'pago', status: 'aprobado',
    lines: [
      { id: 'JEL-020', accountId: 'ACC-040', accountCode: '6200-001', accountName: 'Alquiler de Oficina/Bodega', debit: 6000, credit: 0 },
      { id: 'JEL-021', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 0, credit: 6000 },
    ],
    totalDebit: 6000, totalCredit: 6000, isBalanced: true,
    createdBy: 'USR-003', createdByName: 'Jakeira Chavez', createdAt: '2026-02-18T10:00:00Z',
    approvedBy: 'USR-001', approvedByName: 'Javier Lange', approvedAt: '2026-02-18T14:00:00Z',
  },
  {
    id: 'JE-00011', number: 11, date: '2026-02-20T10:00:00Z',
    description: 'Venta B2B a BRAND DISTRIBUIDOR CURACAO - FAC-00020',
    source: 'venta', sourceDocumentId: 'FAC-00020', sourceDocumentNumber: 'FAC-00020',
    status: 'aprobado',
    lines: [
      { id: 'JEL-022', accountId: 'ACC-005', accountCode: '1100-003', accountName: 'Cuentas por Cobrar', debit: 35000, credit: 0 },
      { id: 'JEL-023', accountId: 'ACC-027', accountCode: '4100-001', accountName: 'Ventas B2B', debit: 0, credit: 35000 },
    ],
    totalDebit: 35000, totalCredit: 35000, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-20T10:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'JE-00012', number: 12, date: '2026-02-22T10:00:00Z',
    description: 'Ajuste de inventario - Merma bodega ZL',
    source: 'ajuste_inventario', sourceDocumentId: 'AJ-00015', sourceDocumentNumber: 'AJ-00015',
    status: 'aprobado',
    lines: [
      { id: 'JEL-024', accountId: 'ACC-033', accountCode: '5100-001', accountName: 'Costo de Mercancía Vendida', debit: 1200, credit: 0 },
      { id: 'JEL-025', accountId: 'ACC-006', accountCode: '1100-004', accountName: 'Inventario de Mercancías', debit: 0, credit: 1200 },
    ],
    totalDebit: 1200, totalCredit: 1200, isBalanced: true,
    createdBy: 'SYS', createdByName: 'Sistema', createdAt: '2026-02-22T10:00:00Z',
    approvedBy: 'SYS', approvedByName: 'Sistema', approvedAt: '2026-02-22T10:00:00Z',
  },
  {
    id: 'JE-00013', number: 13, date: '2026-02-24T10:00:00Z',
    description: 'Pago servicios públicos - Feb 2026',
    source: 'manual', status: 'registrado',
    lines: [
      { id: 'JEL-026', accountId: 'ACC-041', accountCode: '6200-002', accountName: 'Servicios Públicos', debit: 1500, credit: 0 },
      { id: 'JEL-027', accountId: 'ACC-004', accountCode: '1100-002', accountName: 'Bancos', debit: 0, credit: 1500 },
    ],
    totalDebit: 1500, totalCredit: 1500, isBalanced: true,
    createdBy: 'USR-003', createdByName: 'Jakeira Chavez', createdAt: '2026-02-24T10:00:00Z',
    notes: 'Pendiente de aprobación por gerencia',
  },
  {
    id: 'JE-00014', number: 14, date: '2026-02-25T10:00:00Z',
    description: 'Comisiones de ventas - Feb 2026',
    source: 'manual', status: 'borrador',
    lines: [
      { id: 'JEL-028', accountId: 'ACC-039', accountCode: '6100-002', accountName: 'Comisiones de Ventas', debit: 4800, credit: 0 },
      { id: 'JEL-029', accountId: 'ACC-018', accountCode: '2100-004', accountName: 'Comisiones por Pagar', debit: 0, credit: 4800 },
    ],
    totalDebit: 4800, totalCredit: 4800, isBalanced: true,
    createdBy: 'USR-003', createdByName: 'Jakeira Chavez', createdAt: '2026-02-25T10:00:00Z',
    notes: 'Borrador - pendiente de verificar montos con gerencia',
  },
];

// ============================================================================
// BANK ACCOUNTS - Seed Data
// ============================================================================

const SEED_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'BA-001', bankId: 'BK-006', bankName: 'Banco General', accountNumber: '****4521', accountType: 'corriente', currency: 'USD', currentBalance: 185000, availableBalance: 182000, lastReconciliationDate: '2026-01-31', isActive: true, color: '#003366' },
  { id: 'BA-002', bankId: 'BK-002', bankName: 'Banistmo', accountNumber: '****7834', accountType: 'corriente', currency: 'USD', currentBalance: 92000, availableBalance: 90500, lastReconciliationDate: '2026-01-31', isActive: true, color: '#E31837' },
  { id: 'BA-003', bankId: 'BK-001', bankName: 'Banesco', accountNumber: '****2190', accountType: 'corriente', currency: 'USD', currentBalance: 67500, availableBalance: 67500, lastReconciliationDate: '2026-01-31', isActive: true, color: '#00529B' },
  { id: 'BA-004', bankId: 'BK-004', bankName: 'Multibank', accountNumber: '****5678', accountType: 'ahorros', currency: 'USD', currentBalance: 45000, availableBalance: 45000, lastReconciliationDate: '2026-01-31', isActive: true, color: '#0066B3' },
  { id: 'BA-005', bankId: 'BK-007', bankName: 'BAC Credomatic', accountNumber: '****9012', accountType: 'corriente', currency: 'USD', currentBalance: 38500, availableBalance: 36000, lastReconciliationDate: '2025-12-31', isActive: true, color: '#ED1C24' },
  { id: 'BA-006', bankId: 'BK-003', bankName: 'Credicorp Bank', accountNumber: '****3456', accountType: 'corriente', currency: 'USD', currentBalance: 28000, availableBalance: 28000, lastReconciliationDate: '2026-01-31', isActive: true, color: '#003B71' },
  { id: 'BA-007', bankId: 'BK-005', bankName: 'Allbank', accountNumber: '****7890', accountType: 'ahorros', currency: 'USD', currentBalance: 15000, availableBalance: 15000, isActive: true, color: '#8DC63F' },
  { id: 'BA-008', bankId: 'BK-009', bankName: 'Metro Bank', accountNumber: '****1234', accountType: 'corriente', currency: 'USD', currentBalance: 8500, availableBalance: 8500, isActive: true, color: '#00A3E0' },
  { id: 'BA-009', bankId: 'BK-008', bankName: 'St. George Bank', accountNumber: '****5670', accountType: 'corriente', currency: 'USD', currentBalance: 3200, availableBalance: 3200, isActive: true, color: '#78BE20' },
  { id: 'BA-010', bankId: 'BK-010', bankName: 'Mercantil Banco', accountNumber: '****8901', accountType: 'inversion', currency: 'USD', currentBalance: 2000, availableBalance: 2000, isActive: false, color: '#0033A0' },
  { id: 'BA-011', bankId: 'BK-011', bankName: 'Bank of China', accountNumber: '****2345', accountType: 'corriente', currency: 'USD', currentBalance: 300, availableBalance: 300, isActive: false, color: '#C41230' },
];

// ============================================================================
// BANK MOVEMENTS - Seed Data
// ============================================================================

const SEED_BANK_MOVEMENTS: BankMovement[] = [
  { id: 'BM-001', date: '2026-02-25T10:00:00Z', bankAccountId: 'BA-001', bankName: 'Banco General', description: 'Depósito transferencia SULTAN WHOLESALE', type: 'ingreso', amount: 50000, balance: 185000, reference: 'TRF-2026-0201-001' },
  { id: 'BM-002', date: '2026-02-24T10:00:00Z', bankAccountId: 'BA-001', bankName: 'Banco General', description: 'Pago servicios públicos', type: 'egreso', amount: 1500, balance: 135000, reference: 'PAG-2026-0224' },
  { id: 'BM-003', date: '2026-02-20T10:00:00Z', bankAccountId: 'BA-002', bankName: 'Banistmo', description: 'Depósito cobro MARIA DEL MAR PEREZ', type: 'ingreso', amount: 12000, balance: 92000, reference: 'TRF-SV-2026-0215' },
  { id: 'BM-004', date: '2026-02-18T10:00:00Z', bankAccountId: 'BA-001', bankName: 'Banco General', description: 'Pago alquiler bodega ZL', type: 'egreso', amount: 6000, balance: 136500, reference: 'PAG-ALQ-202602' },
  { id: 'BM-005', date: '2026-02-15T10:00:00Z', bankAccountId: 'BA-001', bankName: 'Banco General', description: 'Nómina 1ra quincena Feb', type: 'egreso', amount: 36200, balance: 142500, reference: 'NOM-202602-1' },
  { id: 'BM-006', date: '2026-02-10T15:00:00Z', bankAccountId: 'BA-001', bankName: 'Banco General', description: 'Depósito cobro BRAND CURACAO', type: 'ingreso', amount: 67000, balance: 178700, reference: 'TRF-CW-2026-0210' },
  { id: 'BM-007', date: '2026-02-05T09:00:00Z', bankAccountId: 'BA-005', bankName: 'BAC Credomatic', description: 'Depósito cobro DT LICORES', type: 'ingreso', amount: 18200, balance: 38500, reference: 'TRF-HN-2026-0205' },
  { id: 'BM-008', date: '2026-02-03T10:00:00Z', bankAccountId: 'BA-003', bankName: 'Banesco', description: 'Pago proveedor Diageo', type: 'egreso', amount: 45000, balance: 67500, reference: 'PAG-PROV-202602' },
];

// ============================================================================
// MONTHLY CLOSES - Seed Data
// ============================================================================

const SEED_MONTHLY_CLOSES: MonthlyClose[] = [
  {
    id: 'MC-202601', period: '2026-01', year: 2026, month: 1, monthName: 'Enero 2026',
    status: 'cerrado',
    checklist: [
      { id: 'CK-01', description: 'Todas las conciliaciones bancarias completadas', isCompleted: true, completedAt: '2026-02-03T10:00:00Z', completedBy: 'Jakeira Chavez' },
      { id: 'CK-02', description: 'Todos los asientos contables registrados', isCompleted: true, completedAt: '2026-02-03T11:00:00Z', completedBy: 'Jakeira Chavez' },
      { id: 'CK-03', description: 'Facturas del período emitidas', isCompleted: true, completedAt: '2026-02-03T12:00:00Z', completedBy: 'Jakeira Chavez' },
      { id: 'CK-04', description: 'Cobros del período registrados', isCompleted: true, completedAt: '2026-02-03T13:00:00Z', completedBy: 'Jakeira Chavez' },
      { id: 'CK-05', description: 'Depreciaciones calculadas', isCompleted: true, completedAt: '2026-02-03T14:00:00Z', completedBy: 'Jakeira Chavez' },
    ],
    closedBy: 'USR-003', closedByName: 'Jakeira Chavez', closedAt: '2026-02-05T10:00:00Z',
    totalEntries: 45, totalDebit: 892000, totalCredit: 892000,
  },
  {
    id: 'MC-202512', period: '2025-12', year: 2025, month: 12, monthName: 'Diciembre 2025',
    status: 'cerrado',
    checklist: [
      { id: 'CK-06', description: 'Todas las conciliaciones bancarias completadas', isCompleted: true },
      { id: 'CK-07', description: 'Todos los asientos contables registrados', isCompleted: true },
      { id: 'CK-08', description: 'Facturas del período emitidas', isCompleted: true },
      { id: 'CK-09', description: 'Cobros del período registrados', isCompleted: true },
      { id: 'CK-10', description: 'Depreciaciones calculadas', isCompleted: true },
    ],
    closedBy: 'USR-003', closedByName: 'Jakeira Chavez', closedAt: '2026-01-08T10:00:00Z',
    totalEntries: 52, totalDebit: 1050000, totalCredit: 1050000,
  },
  {
    id: 'MC-202602', period: '2026-02', year: 2026, month: 2, monthName: 'Febrero 2026',
    status: 'abierto',
    checklist: [
      { id: 'CK-11', description: 'Todas las conciliaciones bancarias completadas', isCompleted: false },
      { id: 'CK-12', description: 'Todos los asientos contables registrados', isCompleted: false },
      { id: 'CK-13', description: 'Facturas del período emitidas', isCompleted: false },
      { id: 'CK-14', description: 'Cobros del período registrados', isCompleted: true, completedAt: '2026-02-25T10:00:00Z', completedBy: 'Jakeira Chavez' },
      { id: 'CK-15', description: 'Depreciaciones calculadas', isCompleted: false },
    ],
    totalEntries: 14, totalDebit: 342937, totalCredit: 342937,
  },
];

// ============================================================================
// STORE INFRASTRUCTURE - Accounts
// ============================================================================

let _accounts: Account[] = SEED_ACCOUNTS;
let _accountsInit = false;
const { subscribe: subscribeAccounts, notify: _notifyAccounts } = createSubscribers();

function ensureAccountsInitialized(): void {
  if (typeof window === 'undefined' || _accountsInit) return;
  _accounts = loadCollection<Account>('accounts', SEED_ACCOUNTS);
  _accountsInit = true;
}

export function getAccountsData(): Account[] {
  ensureAccountsInitialized();
  return _accounts;
}

export { subscribeAccounts };

export const MOCK_ACCOUNTS: Account[] = new Proxy(SEED_ACCOUNTS as Account[], {
  get(_target, prop, receiver) {
    ensureAccountsInitialized();
    return Reflect.get(_accounts, prop, receiver);
  },
});

export function addAccount(account: Account): void {
  ensureAccountsInitialized();
  _accounts = [..._accounts, account];
  saveCollection('accounts', _accounts);
  _notifyAccounts();
}

export function updateAccount(id: string, updates: Partial<Account>): void {
  ensureAccountsInitialized();
  _accounts = _accounts.map((a) =>
    a.id === id ? { ...a, ...updates } : a
  );
  saveCollection('accounts', _accounts);
  _notifyAccounts();
}

export function removeAccount(id: string): void {
  ensureAccountsInitialized();
  _accounts = _accounts.filter((a) => a.id !== id);
  saveCollection('accounts', _accounts);
  _notifyAccounts();
}

// ============================================================================
// STORE INFRASTRUCTURE - Journal Entries
// ============================================================================

let _journalEntries: JournalEntry[] = SEED_JOURNAL_ENTRIES;
let _journalEntriesInit = false;
const { subscribe: subscribeJournalEntries, notify: _notifyJournalEntries } = createSubscribers();

function ensureJournalEntriesInitialized(): void {
  if (typeof window === 'undefined' || _journalEntriesInit) return;
  _journalEntries = loadCollection<JournalEntry>('journal_entries', SEED_JOURNAL_ENTRIES);
  _journalEntriesInit = true;
}

export function getJournalEntriesData(): JournalEntry[] {
  ensureJournalEntriesInitialized();
  return _journalEntries;
}

export { subscribeJournalEntries };

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = new Proxy(SEED_JOURNAL_ENTRIES as JournalEntry[], {
  get(_target, prop, receiver) {
    ensureJournalEntriesInitialized();
    return Reflect.get(_journalEntries, prop, receiver);
  },
});

export function addJournalEntry(entry: JournalEntry): void {
  ensureJournalEntriesInitialized();
  _journalEntries = [..._journalEntries, entry];
  saveCollection('journal_entries', _journalEntries);
  _notifyJournalEntries();
}

export function updateJournalEntry(id: string, updates: Partial<JournalEntry>): void {
  ensureJournalEntriesInitialized();
  _journalEntries = _journalEntries.map((e) =>
    e.id === id ? { ...e, ...updates } : e
  );
  saveCollection('journal_entries', _journalEntries);
  _notifyJournalEntries();
}

export function removeJournalEntry(id: string): void {
  ensureJournalEntriesInitialized();
  _journalEntries = _journalEntries.filter((e) => e.id !== id);
  saveCollection('journal_entries', _journalEntries);
  _notifyJournalEntries();
}

// ============================================================================
// STORE INFRASTRUCTURE - Bank Accounts
// ============================================================================

let _bankAccounts: BankAccount[] = SEED_BANK_ACCOUNTS;
let _bankAccountsInit = false;
const { subscribe: subscribeBankAccounts, notify: _notifyBankAccounts } = createSubscribers();

function ensureBankAccountsInitialized(): void {
  if (typeof window === 'undefined' || _bankAccountsInit) return;
  _bankAccounts = loadCollection<BankAccount>('bank_accounts', SEED_BANK_ACCOUNTS);
  _bankAccountsInit = true;
}

export function getBankAccountsData(): BankAccount[] {
  ensureBankAccountsInitialized();
  return _bankAccounts;
}

export { subscribeBankAccounts };

export const MOCK_BANK_ACCOUNTS: BankAccount[] = new Proxy(SEED_BANK_ACCOUNTS as BankAccount[], {
  get(_target, prop, receiver) {
    ensureBankAccountsInitialized();
    return Reflect.get(_bankAccounts, prop, receiver);
  },
});

export function addBankAccount(bankAccount: BankAccount): void {
  ensureBankAccountsInitialized();
  _bankAccounts = [..._bankAccounts, bankAccount];
  saveCollection('bank_accounts', _bankAccounts);
  _notifyBankAccounts();
}

export function updateBankAccount(id: string, updates: Partial<BankAccount>): void {
  ensureBankAccountsInitialized();
  _bankAccounts = _bankAccounts.map((b) =>
    b.id === id ? { ...b, ...updates } : b
  );
  saveCollection('bank_accounts', _bankAccounts);
  _notifyBankAccounts();
}

export function removeBankAccount(id: string): void {
  ensureBankAccountsInitialized();
  _bankAccounts = _bankAccounts.filter((b) => b.id !== id);
  saveCollection('bank_accounts', _bankAccounts);
  _notifyBankAccounts();
}

// ============================================================================
// STORE INFRASTRUCTURE - Bank Movements
// ============================================================================

let _bankMovements: BankMovement[] = SEED_BANK_MOVEMENTS;
let _bankMovementsInit = false;
const { subscribe: subscribeBankMovements, notify: _notifyBankMovements } = createSubscribers();

function ensureBankMovementsInitialized(): void {
  if (typeof window === 'undefined' || _bankMovementsInit) return;
  _bankMovements = loadCollection<BankMovement>('bank_movements', SEED_BANK_MOVEMENTS);
  _bankMovementsInit = true;
}

export function getBankMovementsData(): BankMovement[] {
  ensureBankMovementsInitialized();
  return _bankMovements;
}

export { subscribeBankMovements };

export const MOCK_BANK_MOVEMENTS: BankMovement[] = new Proxy(SEED_BANK_MOVEMENTS as BankMovement[], {
  get(_target, prop, receiver) {
    ensureBankMovementsInitialized();
    return Reflect.get(_bankMovements, prop, receiver);
  },
});

export function addBankMovement(movement: BankMovement): void {
  ensureBankMovementsInitialized();
  _bankMovements = [..._bankMovements, movement];
  saveCollection('bank_movements', _bankMovements);
  _notifyBankMovements();
}

export function updateBankMovement(id: string, updates: Partial<BankMovement>): void {
  ensureBankMovementsInitialized();
  _bankMovements = _bankMovements.map((m) =>
    m.id === id ? { ...m, ...updates } : m
  );
  saveCollection('bank_movements', _bankMovements);
  _notifyBankMovements();
}

export function removeBankMovement(id: string): void {
  ensureBankMovementsInitialized();
  _bankMovements = _bankMovements.filter((m) => m.id !== id);
  saveCollection('bank_movements', _bankMovements);
  _notifyBankMovements();
}

// ============================================================================
// STORE INFRASTRUCTURE - Monthly Closes
// ============================================================================

let _monthlyCloses: MonthlyClose[] = SEED_MONTHLY_CLOSES;
let _monthlyClosesInit = false;
const { subscribe: subscribeMonthlyCloses, notify: _notifyMonthlyCloses } = createSubscribers();

function ensureMonthlyClosesInitialized(): void {
  if (typeof window === 'undefined' || _monthlyClosesInit) return;
  _monthlyCloses = loadCollection<MonthlyClose>('monthly_closes', SEED_MONTHLY_CLOSES);
  _monthlyClosesInit = true;
}

export function getMonthlyClosesData(): MonthlyClose[] {
  ensureMonthlyClosesInitialized();
  return _monthlyCloses;
}

export { subscribeMonthlyCloses };

export const MOCK_MONTHLY_CLOSES: MonthlyClose[] = new Proxy(SEED_MONTHLY_CLOSES as MonthlyClose[], {
  get(_target, prop, receiver) {
    ensureMonthlyClosesInitialized();
    return Reflect.get(_monthlyCloses, prop, receiver);
  },
});

export function addMonthlyClose(close: MonthlyClose): void {
  ensureMonthlyClosesInitialized();
  _monthlyCloses = [..._monthlyCloses, close];
  saveCollection('monthly_closes', _monthlyCloses);
  _notifyMonthlyCloses();
}

export function updateMonthlyClose(id: string, updates: Partial<MonthlyClose>): void {
  ensureMonthlyClosesInitialized();
  _monthlyCloses = _monthlyCloses.map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveCollection('monthly_closes', _monthlyCloses);
  _notifyMonthlyCloses();
}

export function removeMonthlyClose(id: string): void {
  ensureMonthlyClosesInitialized();
  _monthlyCloses = _monthlyCloses.filter((c) => c.id !== id);
  saveCollection('monthly_closes', _monthlyCloses);
  _notifyMonthlyCloses();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build account tree from flat list
 */
export function getAccountTree(): Account[] {
  ensureAccountsInitialized();
  const topLevel = _accounts.filter(a => a.level === 1);
  const buildTree = (parent: Account): Account => {
    const children = _accounts.filter(a => a.parentId === parent.id);
    return {
      ...parent,
      children: children.length > 0 ? children.map(buildTree) : undefined,
    };
  };
  return topLevel.map(buildTree);
}

/**
 * Get account by ID
 */
export function getAccountById(id: string): Account | undefined {
  ensureAccountsInitialized();
  return _accounts.find(a => a.id === id);
}

/**
 * Get account by code
 */
export function getAccountByCode(code: string): Account | undefined {
  ensureAccountsInitialized();
  return _accounts.find(a => a.code === code);
}

/**
 * Get journal entries with filters
 */
export function getJournalEntries(filters?: {
  search?: string;
  source?: JournalEntrySource | 'all';
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): JournalEntry[] {
  ensureJournalEntriesInitialized();
  let entries = [..._journalEntries];

  if (!filters) return entries;

  if (filters.search) {
    const s = filters.search.toLowerCase();
    entries = entries.filter(e =>
      e.description.toLowerCase().includes(s) ||
      e.id.toLowerCase().includes(s) ||
      e.sourceDocumentNumber?.toLowerCase().includes(s)
    );
  }
  if (filters.source && filters.source !== 'all') {
    entries = entries.filter(e => e.source === filters.source);
  }
  if (filters.status && filters.status !== 'all') {
    entries = entries.filter(e => e.status === filters.status);
  }
  if (filters.dateFrom) {
    entries = entries.filter(e => e.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    entries = entries.filter(e => e.date <= filters.dateTo!);
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get ledger entries for a specific account
 */
export function getLedgerEntries(accountId: string): LedgerEntry[] {
  ensureJournalEntriesInitialized();
  const entries: LedgerEntry[] = [];
  let runningBalance = 0;

  const sortedJE = [..._journalEntries]
    .filter(je => je.status !== 'anulado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const je of sortedJE) {
    for (const line of je.lines) {
      if (line.accountId === accountId) {
        runningBalance += line.debit - line.credit;
        entries.push({
          date: je.date,
          journalEntryId: je.id,
          journalEntryNumber: je.number,
          description: je.description,
          debit: line.debit,
          credit: line.credit,
          runningBalance,
        });
      }
    }
  }

  return entries;
}

/**
 * Get trial balance
 */
export function getTrialBalance(): TrialBalanceLine[] {
  ensureAccountsInitialized();
  return _accounts
    .filter(a => a.level === 3 && a.hasMovements)
    .map(a => ({
      accountCode: a.code,
      accountName: a.name,
      accountType: a.type,
      debitBalance: a.balance > 0 && (a.nature === 'deudora') ? a.balance : 0,
      creditBalance: a.balance > 0 && (a.nature === 'acreedora') ? a.balance : (a.balance < 0 ? Math.abs(a.balance) : 0),
    }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

/**
 * Get accounting stats for dashboard
 */
export function getAccountingStats(): AccountingStats {
  ensureBankAccountsInitialized();
  return {
    monthlyRevenue: 285000,
    monthlyExpenses: 65000,
    netIncome: 220000,
    totalBankBalance: _bankAccounts.filter(ba => ba.isActive).reduce((sum, ba) => sum + ba.currentBalance, 0),
    grossMarginPercent: 40.5,
    cxcRotation: 32,
    averageCollectionDays: 28,
    pendingReconciliations: 1,
    pendingCloses: 1,
  };
}

/**
 * Get monthly P&L summaries for chart
 */
export function getMonthlyPLSummaries(): MonthlyPLSummary[] {
  return [
    { month: '2025-09', monthLabel: 'Sep', revenue: 310000, expenses: 78000, netIncome: 232000 },
    { month: '2025-10', monthLabel: 'Oct', revenue: 295000, expenses: 72000, netIncome: 223000 },
    { month: '2025-11', monthLabel: 'Nov', revenue: 340000, expenses: 82000, netIncome: 258000 },
    { month: '2025-12', monthLabel: 'Dic', revenue: 420000, expenses: 95000, netIncome: 325000 },
    { month: '2026-01', monthLabel: 'Ene', revenue: 275000, expenses: 68000, netIncome: 207000 },
    { month: '2026-02', monthLabel: 'Feb', revenue: 285000, expenses: 65000, netIncome: 220000 },
  ];
}

/**
 * Get P&L financial statement
 */
export function getPLStatement(): FinancialStatementLine[] {
  return [
    { label: 'INGRESOS', amount: 1850000, level: 0, isTotal: false, isBold: true },
    { accountCode: '4100-001', label: 'Ventas B2B', amount: 1620000, level: 1, isTotal: false, isBold: false },
    { accountCode: '4100-002', label: 'Ventas B2C (POS)', amount: 180000, level: 1, isTotal: false, isBold: false },
    { accountCode: '4200-001', label: 'Descuentos sobre Ventas', amount: -42000, level: 1, isTotal: false, isBold: false },
    { accountCode: '4200-002', label: 'Devoluciones sobre Ventas', amount: -18000, level: 1, isTotal: false, isBold: false },
    { accountCode: '4300-001', label: 'Otros Ingresos', amount: 110000, level: 1, isTotal: false, isBold: false },
    { label: 'TOTAL INGRESOS NETOS', amount: 1850000, level: 0, isTotal: true, isBold: true },
    { label: '', amount: 0, level: 0, isTotal: false, isBold: false },
    { label: 'COSTOS', amount: 1100000, level: 0, isTotal: false, isBold: true },
    { accountCode: '5100-001', label: 'Costo de Mercancía Vendida', amount: 980000, level: 1, isTotal: false, isBold: false },
    { accountCode: '5100-002', label: 'Flete de Importación', amount: 85000, level: 1, isTotal: false, isBold: false },
    { accountCode: '5100-003', label: 'Seguros de Importación', amount: 22000, level: 1, isTotal: false, isBold: false },
    { accountCode: '5100-004', label: 'Gastos de Aduana', amount: 13000, level: 1, isTotal: false, isBold: false },
    { label: 'TOTAL COSTOS', amount: 1100000, level: 0, isTotal: true, isBold: true },
    { label: '', amount: 0, level: 0, isTotal: false, isBold: false },
    { label: 'UTILIDAD BRUTA', amount: 750000, level: 0, isTotal: true, isBold: true },
    { label: '', amount: 0, level: 0, isTotal: false, isBold: false },
    { label: 'GASTOS OPERATIVOS', amount: 530000, level: 0, isTotal: false, isBold: true },
    { accountCode: '6100-001', label: 'Salarios y Prestaciones', amount: 280000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6100-002', label: 'Comisiones de Ventas', amount: 48000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6200-001', label: 'Alquiler', amount: 72000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6200-002', label: 'Servicios Públicos', amount: 18000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6200-003', label: 'Seguros', amount: 24000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6200-004', label: 'Depreciación', amount: 40000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6300-001', label: 'Gastos de Viaje', amount: 15000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6300-002', label: 'Publicidad y Marketing', amount: 12000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6300-003', label: 'Gastos Bancarios', amount: 8000, level: 1, isTotal: false, isBold: false },
    { accountCode: '6300-004', label: 'Gastos de Tecnología', amount: 13000, level: 1, isTotal: false, isBold: false },
    { label: 'TOTAL GASTOS OPERATIVOS', amount: 530000, level: 0, isTotal: true, isBold: true },
    { label: '', amount: 0, level: 0, isTotal: false, isBold: false },
    { label: 'UTILIDAD OPERATIVA', amount: 220000, level: 0, isTotal: true, isBold: true },
  ];
}

/**
 * Get cash flow projections
 */
export function getCashFlowProjections(): CashFlowProjection[] {
  return [
    { period: 'Semana 1 (Mar)', startDate: '2026-03-01', endDate: '2026-03-07', expectedIncome: 45000, expectedExpenses: 22000, netFlow: 23000, cumulativeBalance: 508000 },
    { period: 'Semana 2 (Mar)', startDate: '2026-03-08', endDate: '2026-03-14', expectedIncome: 38000, expectedExpenses: 48000, netFlow: -10000, cumulativeBalance: 498000 },
    { period: 'Semana 3 (Mar)', startDate: '2026-03-15', endDate: '2026-03-21', expectedIncome: 52000, expectedExpenses: 36200, netFlow: 15800, cumulativeBalance: 513800 },
    { period: 'Semana 4 (Mar)', startDate: '2026-03-22', endDate: '2026-03-31', expectedIncome: 60000, expectedExpenses: 25000, netFlow: 35000, cumulativeBalance: 548800 },
  ];
}

/**
 * Format currency for display
 */
export function formatCurrencyAccounting(amount: number): string {
  const isNegative = amount < 0;
  const formatted = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return isNegative ? `($${formatted})` : `$${formatted}`;
}
