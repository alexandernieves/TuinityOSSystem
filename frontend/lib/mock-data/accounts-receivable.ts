/**
 * Mock data for Accounts Receivable (Cuentas por Cobrar)
 * Based on Document 006 specifications
 * Store-backed: data persists in localStorage
 */

import type {
  AccountReceivable,
  Payment,
  PaymentApplication,
  AnnulmentRequest,
  AgingBucket,
  AgingBucketKey,
  CxCTransaction,
  CxCStats,
  CxCFilters,
  CxCDocumentStatus,
} from '@/lib/types/accounts-receivable';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// ============================================================================
// SEED DATA — Accounts Receivable (Pending Invoices)
// ============================================================================

const SEED_ACCOUNTS_RECEIVABLE: AccountReceivable[] = [
  {
    id: 'CXC-00001',
    invoiceId: 'FAC-00015',
    invoiceNumber: 'FAC-00015',
    clientId: 'CLI-00509',
    clientName: 'SULTAN WHOLESALE',
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    issueDate: '2026-01-15T10:00:00Z',
    dueDate: '2026-03-15T10:00:00Z',
    originalAmount: 45200,
    paidAmount: 0,
    balance: 45200,
    status: 'pendiente',
    daysOverdue: 0,
    agingBucket: 'corriente',
    currency: 'USD',
  },
  {
    id: 'CXC-00002',
    invoiceId: 'FAC-00012',
    invoiceNumber: 'FAC-00012',
    clientId: 'CLI-00509',
    clientName: 'SULTAN WHOLESALE',
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    issueDate: '2025-12-10T10:00:00Z',
    dueDate: '2026-02-10T10:00:00Z',
    originalAmount: 78500,
    paidAmount: 50000,
    balance: 28500,
    status: 'parcial',
    daysOverdue: 16,
    agingBucket: '1_30',
    currency: 'USD',
  },
  {
    id: 'CXC-00003',
    invoiceId: 'FAC-00010',
    invoiceNumber: 'FAC-00010',
    clientId: 'CLI-00007',
    clientName: 'MARIA DEL MAR PEREZ SV',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2026-01-20T10:00:00Z',
    dueDate: '2026-02-20T10:00:00Z',
    originalAmount: 14040,
    paidAmount: 0,
    balance: 14040,
    status: 'vencido',
    daysOverdue: 6,
    agingBucket: '1_30',
    currency: 'USD',
  },
  {
    id: 'CXC-00004',
    invoiceId: 'FAC-00008',
    invoiceNumber: 'FAC-00008',
    clientId: 'CLI-00077',
    clientName: 'MEDIMEX, S.A.',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2026-02-01T10:00:00Z',
    dueDate: '2026-03-01T10:00:00Z',
    originalAmount: 12780,
    paidAmount: 0,
    balance: 12780,
    status: 'pendiente',
    daysOverdue: 0,
    agingBucket: 'corriente',
    currency: 'USD',
  },
  {
    id: 'CXC-00005',
    invoiceId: 'FAC-00006',
    invoiceNumber: 'FAC-00006',
    clientId: 'CLI-00045',
    clientName: 'DT LICORES',
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    issueDate: '2026-02-10T10:00:00Z',
    dueDate: '2026-03-10T10:00:00Z',
    originalAmount: 3957,
    paidAmount: 0,
    balance: 3957,
    status: 'pendiente',
    daysOverdue: 0,
    agingBucket: 'corriente',
    currency: 'USD',
  },
  {
    id: 'CXC-00006',
    invoiceId: 'FAC-00005',
    invoiceNumber: 'FAC-00005',
    clientId: 'CLI-00123',
    clientName: 'BRAND DISTRIBUIDOR CURACAO',
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    issueDate: '2026-01-05T10:00:00Z',
    dueDate: '2026-02-19T10:00:00Z',
    originalAmount: 22500,
    paidAmount: 0,
    balance: 22500,
    status: 'vencido',
    daysOverdue: 7,
    agingBucket: '1_30',
    currency: 'USD',
  },
  {
    id: 'CXC-00007',
    invoiceId: 'FAC-00004',
    invoiceNumber: 'FAC-00004',
    clientId: 'CLI-00088',
    clientName: 'MERCANSA',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2026-01-10T10:00:00Z',
    dueDate: '2026-02-10T10:00:00Z',
    originalAmount: 15800,
    paidAmount: 0,
    balance: 15800,
    status: 'vencido',
    daysOverdue: 16,
    agingBucket: '1_30',
    currency: 'USD',
  },
  {
    id: 'CXC-00008',
    invoiceId: 'FAC-00003',
    invoiceNumber: 'FAC-00003',
    clientId: 'CLI-00234',
    clientName: 'LEONILDE SANCHEZ PEÑA',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2026-01-25T10:00:00Z',
    dueDate: '2026-02-10T10:00:00Z',
    originalAmount: 8500,
    paidAmount: 0,
    balance: 8500,
    status: 'vencido',
    daysOverdue: 16,
    agingBucket: '1_30',
    currency: 'USD',
  },
  {
    id: 'CXC-00009',
    invoiceId: 'FAC-00002',
    invoiceNumber: 'FAC-00002',
    clientId: 'CLI-00567',
    clientName: 'FLOCK-COMERCIO DE BEBIDAS',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2025-12-01T10:00:00Z',
    dueDate: '2026-01-30T10:00:00Z',
    originalAmount: 60025,
    paidAmount: 35000,
    balance: 25025,
    status: 'parcial',
    daysOverdue: 27,
    agingBucket: '1_30',
    currency: 'USD',
  },
  {
    id: 'CXC-00010',
    invoiceId: 'FAC-00001',
    invoiceNumber: 'FAC-00001',
    clientId: 'CLI-00890',
    clientName: 'GUILLERMO SOSA VELEZ',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2025-12-20T10:00:00Z',
    dueDate: '2026-01-20T10:00:00Z',
    originalAmount: 18500,
    paidAmount: 0,
    balance: 18500,
    status: 'vencido',
    daysOverdue: 37,
    agingBucket: '31_60',
    currency: 'USD',
  },
  {
    id: 'CXC-00011',
    invoiceId: 'FAC-00018',
    invoiceNumber: 'FAC-00018',
    clientId: 'CLI-00456',
    clientName: 'FRANCISCO QUINTERO',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2026-02-15T10:00:00Z',
    dueDate: '2026-03-15T10:00:00Z',
    originalAmount: 11800,
    paidAmount: 0,
    balance: 11800,
    status: 'pendiente',
    daysOverdue: 0,
    agingBucket: 'corriente',
    currency: 'USD',
  },
  {
    id: 'CXC-00012',
    invoiceId: 'FAC-00020',
    invoiceNumber: 'FAC-00020',
    clientId: 'CLI-00123',
    clientName: 'BRAND DISTRIBUIDOR CURACAO',
    salesRepId: 'USR-003',
    salesRepName: 'Margarita Morelos',
    issueDate: '2026-02-20T10:00:00Z',
    dueDate: '2026-04-05T10:00:00Z',
    originalAmount: 35000,
    paidAmount: 0,
    balance: 35000,
    status: 'pendiente',
    daysOverdue: 0,
    agingBucket: 'corriente',
    currency: 'USD',
  },
  {
    id: 'CXC-00013',
    invoiceId: 'FAC-99001',
    invoiceNumber: 'FAC-99001',
    clientId: 'CLI-00999',
    clientName: 'CLIENTE BLOQUEADO EJEMPLO',
    salesRepId: undefined,
    salesRepName: undefined,
    issueDate: '2025-09-15T10:00:00Z',
    dueDate: '2025-10-15T10:00:00Z',
    originalAmount: 15000,
    paidAmount: 0,
    balance: 15000,
    status: 'vencido',
    daysOverdue: 134,
    agingBucket: '90_plus',
    currency: 'USD',
    notes: 'Cliente bloqueado - deuda en gestión de cobro',
  },
  {
    id: 'CXC-00014',
    invoiceId: 'FAC-99002',
    invoiceNumber: 'FAC-99002',
    clientId: 'CLI-00999',
    clientName: 'CLIENTE BLOQUEADO EJEMPLO',
    salesRepId: undefined,
    salesRepName: undefined,
    issueDate: '2025-08-01T10:00:00Z',
    dueDate: '2025-09-01T10:00:00Z',
    originalAmount: 10000,
    paidAmount: 0,
    balance: 10000,
    status: 'vencido',
    daysOverdue: 178,
    agingBucket: '90_plus',
    currency: 'USD',
    notes: 'Cliente bloqueado - deuda en gestión de cobro',
  },
  {
    id: 'CXC-00015',
    invoiceId: 'FAC-00025',
    invoiceNumber: 'FAC-00025',
    clientId: 'CLI-00088',
    clientName: 'MERCANSA',
    salesRepId: 'USR-001',
    salesRepName: 'Javier Lange',
    issueDate: '2025-11-15T10:00:00Z',
    dueDate: '2025-12-15T10:00:00Z',
    originalAmount: 6700,
    paidAmount: 0,
    balance: 6700,
    status: 'vencido',
    daysOverdue: 73,
    agingBucket: '61_90',
    currency: 'USD',
  },
];

// ============================================================================
// SEED DATA — Payments
// ============================================================================

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'COB-00001',
    clientId: 'CLI-00509',
    clientName: 'SULTAN WHOLESALE',
    date: '2026-02-01T10:00:00Z',
    amount: 50000,
    method: 'transferencia',
    reference: 'TRF-2026-0201-001',
    bankId: 'BK-006',
    bankName: 'Banco General',
    applications: [
      {
        id: 'APP-001',
        paymentId: 'COB-00001',
        accountReceivableId: 'CXC-00002',
        invoiceNumber: 'FAC-00012',
        amountApplied: 50000,
        previousBalance: 78500,
        newBalance: 28500,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-02-01T10:30:00Z',
    notes: 'Pago parcial de factura FAC-00012',
  },
  {
    id: 'COB-00002',
    clientId: 'CLI-00567',
    clientName: 'FLOCK-COMERCIO DE BEBIDAS',
    date: '2026-01-20T10:00:00Z',
    amount: 35000,
    method: 'transferencia',
    reference: 'TRF-BR-2026-0120',
    bankId: 'BK-002',
    bankName: 'Banistmo',
    applications: [
      {
        id: 'APP-002',
        paymentId: 'COB-00002',
        accountReceivableId: 'CXC-00009',
        invoiceNumber: 'FAC-00002',
        amountApplied: 35000,
        previousBalance: 60025,
        newBalance: 25025,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-01-20T11:00:00Z',
  },
  {
    id: 'COB-00003',
    clientId: 'CLI-00077',
    clientName: 'MEDIMEX, S.A.',
    date: '2026-01-15T10:00:00Z',
    amount: 24500,
    method: 'cheque',
    reference: 'CHQ-4521',
    bankId: 'BK-001',
    bankName: 'Banesco',
    applications: [
      {
        id: 'APP-003',
        paymentId: 'COB-00003',
        accountReceivableId: 'CXC-00016',
        invoiceNumber: 'FAC-00030',
        amountApplied: 24500,
        previousBalance: 24500,
        newBalance: 0,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-01-15T14:00:00Z',
    notes: 'Pago total con cheque',
  },
  {
    id: 'COB-00004',
    clientId: 'CLI-00045',
    clientName: 'DT LICORES',
    date: '2026-02-05T10:00:00Z',
    amount: 18200,
    method: 'transferencia',
    reference: 'TRF-HN-2026-0205',
    bankId: 'BK-007',
    bankName: 'BAC Credomatic',
    applications: [
      {
        id: 'APP-004',
        paymentId: 'COB-00004',
        accountReceivableId: 'CXC-00017',
        invoiceNumber: 'FAC-00028',
        amountApplied: 18200,
        previousBalance: 18200,
        newBalance: 0,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'COB-00005',
    clientId: 'CLI-00123',
    clientName: 'BRAND DISTRIBUIDOR CURACAO',
    date: '2026-02-10T10:00:00Z',
    amount: 67000,
    method: 'transferencia',
    reference: 'TRF-CW-2026-0210',
    bankId: 'BK-006',
    bankName: 'Banco General',
    applications: [
      {
        id: 'APP-005',
        paymentId: 'COB-00005',
        accountReceivableId: 'CXC-00018',
        invoiceNumber: 'FAC-00022',
        amountApplied: 45000,
        previousBalance: 45000,
        newBalance: 0,
      },
      {
        id: 'APP-006',
        paymentId: 'COB-00005',
        accountReceivableId: 'CXC-00006',
        invoiceNumber: 'FAC-00005',
        amountApplied: 22000,
        previousBalance: 22500,
        newBalance: 500,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-02-10T15:00:00Z',
    notes: 'Pago aplicado a dos facturas',
  },
  {
    id: 'COB-00006',
    clientId: 'CLI-00234',
    clientName: 'LEONILDE SANCHEZ PEÑA',
    date: '2026-01-28T10:00:00Z',
    amount: 6502,
    method: 'deposito',
    reference: 'DEP-2026-0128',
    bankId: 'BK-004',
    bankName: 'Multibank',
    applications: [
      {
        id: 'APP-007',
        paymentId: 'COB-00006',
        accountReceivableId: 'CXC-00019',
        invoiceNumber: 'FAC-00035',
        amountApplied: 6502,
        previousBalance: 6502,
        newBalance: 0,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-01-28T10:30:00Z',
  },
  {
    id: 'COB-00007',
    clientId: 'CLI-00007',
    clientName: 'MARIA DEL MAR PEREZ SV',
    date: '2026-02-15T10:00:00Z',
    amount: 12000,
    method: 'transferencia',
    reference: 'TRF-SV-2026-0215',
    bankId: 'BK-002',
    bankName: 'Banistmo',
    applications: [
      {
        id: 'APP-008',
        paymentId: 'COB-00007',
        accountReceivableId: 'CXC-00020',
        invoiceNumber: 'FAC-00038',
        amountApplied: 12000,
        previousBalance: 12000,
        newBalance: 0,
      },
    ],
    createdBy: 'USR-006',
    createdByName: 'Jakeira Chavez',
    createdAt: '2026-02-15T11:00:00Z',
  },
];

// ============================================================================
// SEED DATA — Annulment Requests
// ============================================================================

const SEED_ANNULMENT_REQUESTS: AnnulmentRequest[] = [
  {
    id: 'ANU-00001',
    documentType: 'factura',
    documentId: 'FAC-00040',
    documentNumber: 'FAC-00040',
    clientId: 'CLI-00032',
    clientName: 'PONCHO PLACE',
    amount: 4500,
    reason: 'Error en cantidades facturadas',
    observations: 'El cliente reportó que recibió 10 cajas menos de lo facturado. Se debe anular y refacturar.',
    status: 'solicitada',
    requestedBy: 'USR-006',
    requestedByName: 'Jakeira Chavez',
    requestedAt: '2026-02-24T09:00:00Z',
  },
  {
    id: 'ANU-00002',
    documentType: 'cobro',
    documentId: 'COB-00010',
    documentNumber: 'COB-00010',
    clientId: 'CLI-00088',
    clientName: 'MERCANSA',
    amount: 5200,
    reason: 'Cobro aplicado al cliente equivocado',
    observations: 'El cobro fue registrado para Mercansa pero corresponde a Francisco Quintero.',
    status: 'aprobada',
    requestedBy: 'USR-006',
    requestedByName: 'Jakeira Chavez',
    requestedAt: '2026-02-20T14:00:00Z',
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvedAt: '2026-02-21T09:00:00Z',
  },
  {
    id: 'ANU-00003',
    documentType: 'nota_credito',
    documentId: 'NC-00003',
    documentNumber: 'NC-00003',
    clientId: 'CLI-00045',
    clientName: 'DT LICORES',
    amount: 1800,
    reason: 'Nota de crédito emitida por monto incorrecto',
    status: 'rechazada',
    requestedBy: 'USR-006',
    requestedByName: 'Jakeira Chavez',
    requestedAt: '2026-02-18T10:00:00Z',
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvedAt: '2026-02-18T16:00:00Z',
    rejectionReason: 'El monto de la NC es correcto según la devolución registrada.',
  },
  {
    id: 'ANU-00004',
    documentType: 'factura',
    documentId: 'FAC-00042',
    documentNumber: 'FAC-00042',
    clientId: 'CLI-00979',
    clientName: 'GIACOMO PAOLO LECCESE TURCONI',
    amount: 7200,
    reason: 'Factura duplicada',
    observations: 'Se generaron dos facturas para el mismo pedido PED-00089.',
    status: 'ejecutada',
    requestedBy: 'USR-006',
    requestedByName: 'Jakeira Chavez',
    requestedAt: '2026-02-10T08:00:00Z',
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvedAt: '2026-02-10T11:00:00Z',
  },
];

// ============================================================================
// SEED DATA — CxC Transactions (Journal)
// ============================================================================

const SEED_CXC_TRANSACTIONS: CxCTransaction[] = [
  { id: 'TXN-001', date: '2026-02-20T10:00:00Z', type: 'factura', documentNumber: 'FAC-00020', description: 'Factura a BRAND DISTRIBUIDOR CURACAO', debit: 35000, credit: 0, balance: 35000, clientId: 'CLI-00123', clientName: 'BRAND DISTRIBUIDOR CURACAO' },
  { id: 'TXN-002', date: '2026-02-15T10:00:00Z', type: 'cobro', documentNumber: 'COB-00007', description: 'Cobro de MARIA DEL MAR PEREZ SV', debit: 0, credit: 12000, balance: 0, clientId: 'CLI-00007', clientName: 'MARIA DEL MAR PEREZ SV' },
  { id: 'TXN-003', date: '2026-02-15T10:00:00Z', type: 'factura', documentNumber: 'FAC-00018', description: 'Factura a FRANCISCO QUINTERO', debit: 11800, credit: 0, balance: 11800, clientId: 'CLI-00456', clientName: 'FRANCISCO QUINTERO' },
  { id: 'TXN-004', date: '2026-02-10T10:00:00Z', type: 'cobro', documentNumber: 'COB-00005', description: 'Cobro de BRAND DISTRIBUIDOR CURACAO', debit: 0, credit: 67000, balance: 0, clientId: 'CLI-00123', clientName: 'BRAND DISTRIBUIDOR CURACAO' },
  { id: 'TXN-005', date: '2026-02-10T10:00:00Z', type: 'factura', documentNumber: 'FAC-00006', description: 'Factura a DT LICORES', debit: 3957, credit: 0, balance: 3957, clientId: 'CLI-00045', clientName: 'DT LICORES' },
  { id: 'TXN-006', date: '2026-02-05T10:00:00Z', type: 'cobro', documentNumber: 'COB-00004', description: 'Cobro de DT LICORES', debit: 0, credit: 18200, balance: 0, clientId: 'CLI-00045', clientName: 'DT LICORES' },
  { id: 'TXN-007', date: '2026-02-01T10:00:00Z', type: 'cobro', documentNumber: 'COB-00001', description: 'Cobro parcial de SULTAN WHOLESALE', debit: 0, credit: 50000, balance: 0, clientId: 'CLI-00509', clientName: 'SULTAN WHOLESALE' },
  { id: 'TXN-008', date: '2026-02-01T10:00:00Z', type: 'factura', documentNumber: 'FAC-00008', description: 'Factura a MEDIMEX, S.A.', debit: 12780, credit: 0, balance: 12780, clientId: 'CLI-00077', clientName: 'MEDIMEX, S.A.' },
  { id: 'TXN-009', date: '2026-01-28T10:00:00Z', type: 'cobro', documentNumber: 'COB-00006', description: 'Cobro de LEONILDE SANCHEZ PEÑA', debit: 0, credit: 6502, balance: 0, clientId: 'CLI-00234', clientName: 'LEONILDE SANCHEZ PEÑA' },
  { id: 'TXN-010', date: '2026-01-25T10:00:00Z', type: 'factura', documentNumber: 'FAC-00003', description: 'Factura a LEONILDE SANCHEZ PEÑA', debit: 8500, credit: 0, balance: 8500, clientId: 'CLI-00234', clientName: 'LEONILDE SANCHEZ PEÑA' },
  { id: 'TXN-011', date: '2026-01-20T10:00:00Z', type: 'cobro', documentNumber: 'COB-00002', description: 'Cobro parcial de FLOCK BEBIDAS', debit: 0, credit: 35000, balance: 0, clientId: 'CLI-00567', clientName: 'FLOCK-COMERCIO DE BEBIDAS' },
  { id: 'TXN-012', date: '2026-01-20T10:00:00Z', type: 'factura', documentNumber: 'FAC-00010', description: 'Factura a MARIA DEL MAR PEREZ SV', debit: 14040, credit: 0, balance: 14040, clientId: 'CLI-00007', clientName: 'MARIA DEL MAR PEREZ SV' },
  { id: 'TXN-013', date: '2026-01-15T10:00:00Z', type: 'cobro', documentNumber: 'COB-00003', description: 'Cobro de MEDIMEX, S.A.', debit: 0, credit: 24500, balance: 0, clientId: 'CLI-00077', clientName: 'MEDIMEX, S.A.' },
  { id: 'TXN-014', date: '2026-01-15T10:00:00Z', type: 'factura', documentNumber: 'FAC-00015', description: 'Factura a SULTAN WHOLESALE', debit: 45200, credit: 0, balance: 45200, clientId: 'CLI-00509', clientName: 'SULTAN WHOLESALE' },
  { id: 'TXN-015', date: '2026-01-10T10:00:00Z', type: 'factura', documentNumber: 'FAC-00004', description: 'Factura a MERCANSA', debit: 15800, credit: 0, balance: 15800, clientId: 'CLI-00088', clientName: 'MERCANSA' },
  { id: 'TXN-016', date: '2026-02-10T14:00:00Z', type: 'anulacion', documentNumber: 'ANU-00004', description: 'Anulación de FAC-00042 (duplicada)', debit: 0, credit: 7200, balance: 0, clientId: 'CLI-00979', clientName: 'GIACOMO PAOLO LECCESE TURCONI' },
  { id: 'TXN-017', date: '2025-12-10T10:00:00Z', type: 'factura', documentNumber: 'FAC-00012', description: 'Factura a SULTAN WHOLESALE', debit: 78500, credit: 0, balance: 78500, clientId: 'CLI-00509', clientName: 'SULTAN WHOLESALE' },
  { id: 'TXN-018', date: '2025-12-01T10:00:00Z', type: 'factura', documentNumber: 'FAC-00002', description: 'Factura a FLOCK BEBIDAS', debit: 60025, credit: 0, balance: 60025, clientId: 'CLI-00567', clientName: 'FLOCK-COMERCIO DE BEBIDAS' },
];

// ============================================================================
// STORE INFRASTRUCTURE — Receivables
// ============================================================================

let _receivables: AccountReceivable[] = SEED_ACCOUNTS_RECEIVABLE;
let _receivablesInit = false;
const { subscribe: subscribeReceivables, notify: _notifyReceivables } = createSubscribers();

function ensureReceivablesInit(): void {
  if (typeof window === 'undefined' || _receivablesInit) return;
  _receivables = loadCollection<AccountReceivable>('receivables', SEED_ACCOUNTS_RECEIVABLE);
  _receivablesInit = true;
}

export function getReceivablesData(): AccountReceivable[] {
  ensureReceivablesInit();
  return _receivables;
}

export { subscribeReceivables };

// Backward-compatible export
export const MOCK_ACCOUNTS_RECEIVABLE: AccountReceivable[] = new Proxy(SEED_ACCOUNTS_RECEIVABLE as AccountReceivable[], {
  get(_target, prop, receiver) {
    ensureReceivablesInit();
    return Reflect.get(_receivables, prop, receiver);
  },
});

// CRUD
export function addReceivable(item: AccountReceivable): void {
  ensureReceivablesInit();
  _receivables = [..._receivables, item];
  saveCollection('receivables', _receivables);
  _notifyReceivables();
}

export function updateReceivable(id: string, updates: Partial<AccountReceivable>): void {
  ensureReceivablesInit();
  _receivables = _receivables.map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveCollection('receivables', _receivables);
  _notifyReceivables();
}

export function removeReceivable(id: string): void {
  ensureReceivablesInit();
  _receivables = _receivables.filter((r) => r.id !== id);
  saveCollection('receivables', _receivables);
  _notifyReceivables();
}

// ============================================================================
// STORE INFRASTRUCTURE — Payments
// ============================================================================

let _payments: Payment[] = SEED_PAYMENTS;
let _paymentsInit = false;
const { subscribe: subscribePayments, notify: _notifyPayments } = createSubscribers();

function ensurePaymentsInit(): void {
  if (typeof window === 'undefined' || _paymentsInit) return;
  _payments = loadCollection<Payment>('payments', SEED_PAYMENTS);
  _paymentsInit = true;
}

export function getPaymentsData(): Payment[] {
  ensurePaymentsInit();
  return _payments;
}

export { subscribePayments };

// Backward-compatible export
export const MOCK_PAYMENTS: Payment[] = new Proxy(SEED_PAYMENTS as Payment[], {
  get(_target, prop, receiver) {
    ensurePaymentsInit();
    return Reflect.get(_payments, prop, receiver);
  },
});

// CRUD
export function addPayment(item: Payment): void {
  ensurePaymentsInit();
  _payments = [..._payments, item];
  saveCollection('payments', _payments);
  _notifyPayments();
}

export function updatePayment(id: string, updates: Partial<Payment>): void {
  ensurePaymentsInit();
  _payments = _payments.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveCollection('payments', _payments);
  _notifyPayments();
}

export function removePayment(id: string): void {
  ensurePaymentsInit();
  _payments = _payments.filter((p) => p.id !== id);
  saveCollection('payments', _payments);
  _notifyPayments();
}

// ============================================================================
// STORE INFRASTRUCTURE — Annulment Requests
// ============================================================================

let _annulmentRequests: AnnulmentRequest[] = SEED_ANNULMENT_REQUESTS;
let _annulmentRequestsInit = false;
const { subscribe: subscribeAnnulmentRequests, notify: _notifyAnnulmentRequests } = createSubscribers();

function ensureAnnulmentRequestsInit(): void {
  if (typeof window === 'undefined' || _annulmentRequestsInit) return;
  _annulmentRequests = loadCollection<AnnulmentRequest>('annulment_requests', SEED_ANNULMENT_REQUESTS);
  _annulmentRequestsInit = true;
}

export function getAnnulmentRequestsData(): AnnulmentRequest[] {
  ensureAnnulmentRequestsInit();
  return _annulmentRequests;
}

export { subscribeAnnulmentRequests };

// Backward-compatible export
export const MOCK_ANNULMENT_REQUESTS: AnnulmentRequest[] = new Proxy(SEED_ANNULMENT_REQUESTS as AnnulmentRequest[], {
  get(_target, prop, receiver) {
    ensureAnnulmentRequestsInit();
    return Reflect.get(_annulmentRequests, prop, receiver);
  },
});

// CRUD
export function addAnnulmentRequest(item: AnnulmentRequest): void {
  ensureAnnulmentRequestsInit();
  _annulmentRequests = [..._annulmentRequests, item];
  saveCollection('annulment_requests', _annulmentRequests);
  _notifyAnnulmentRequests();
}

export function updateAnnulmentRequest(id: string, updates: Partial<AnnulmentRequest>): void {
  ensureAnnulmentRequestsInit();
  _annulmentRequests = _annulmentRequests.map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveCollection('annulment_requests', _annulmentRequests);
  _notifyAnnulmentRequests();
}

export function removeAnnulmentRequest(id: string): void {
  ensureAnnulmentRequestsInit();
  _annulmentRequests = _annulmentRequests.filter((r) => r.id !== id);
  saveCollection('annulment_requests', _annulmentRequests);
  _notifyAnnulmentRequests();
}

// ============================================================================
// STORE INFRASTRUCTURE — CxC Transactions
// ============================================================================

let _cxcTransactions: CxCTransaction[] = SEED_CXC_TRANSACTIONS;
let _cxcTransactionsInit = false;
const { subscribe: subscribeCxCTransactions, notify: _notifyCxCTransactions } = createSubscribers();

function ensureCxCTransactionsInit(): void {
  if (typeof window === 'undefined' || _cxcTransactionsInit) return;
  _cxcTransactions = loadCollection<CxCTransaction>('cxc_transactions', SEED_CXC_TRANSACTIONS);
  _cxcTransactionsInit = true;
}

export function getCxCTransactionsData(): CxCTransaction[] {
  ensureCxCTransactionsInit();
  return _cxcTransactions;
}

export { subscribeCxCTransactions };

// Backward-compatible export
export const MOCK_CXC_TRANSACTIONS: CxCTransaction[] = new Proxy(SEED_CXC_TRANSACTIONS as CxCTransaction[], {
  get(_target, prop, receiver) {
    ensureCxCTransactionsInit();
    return Reflect.get(_cxcTransactions, prop, receiver);
  },
});

// CRUD
export function addCxCTransaction(item: CxCTransaction): void {
  ensureCxCTransactionsInit();
  _cxcTransactions = [..._cxcTransactions, item];
  saveCollection('cxc_transactions', _cxcTransactions);
  _notifyCxCTransactions();
}

export function updateCxCTransaction(id: string, updates: Partial<CxCTransaction>): void {
  ensureCxCTransactionsInit();
  _cxcTransactions = _cxcTransactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
  saveCollection('cxc_transactions', _cxcTransactions);
  _notifyCxCTransactions();
}

export function removeCxCTransaction(id: string): void {
  ensureCxCTransactionsInit();
  _cxcTransactions = _cxcTransactions.filter((t) => t.id !== id);
  saveCollection('cxc_transactions', _cxcTransactions);
  _notifyCxCTransactions();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get CxC dashboard stats
 */
export function getCxCStats(): CxCStats {
  ensureReceivablesInit();
  ensurePaymentsInit();
  const active = _receivables.filter(ar => ar.status !== 'anulado' && ar.status !== 'pagado');
  const totalReceivable = active.reduce((sum, ar) => sum + ar.balance, 0);
  const currentAmount = active.filter(ar => ar.agingBucket === 'corriente').reduce((sum, ar) => sum + ar.balance, 0);
  const overdue1_30 = active.filter(ar => ar.agingBucket === '1_30').reduce((sum, ar) => sum + ar.balance, 0);
  const overdue31_60 = active.filter(ar => ar.agingBucket === '31_60').reduce((sum, ar) => sum + ar.balance, 0);
  const overdue61_90 = active.filter(ar => ar.agingBucket === '61_90').reduce((sum, ar) => sum + ar.balance, 0);
  const overdue90Plus = active.filter(ar => ar.agingBucket === '90_plus').reduce((sum, ar) => sum + ar.balance, 0);

  const collectionsThisMonth = _payments
    .filter(p => p.date >= '2026-02-01T00:00:00Z')
    .reduce((sum, p) => sum + p.amount, 0);

  const clientsWithBalance = new Set(active.map(ar => ar.clientId));
  const overdueClients = new Set(active.filter(ar => ar.daysOverdue > 0).map(ar => ar.clientId));

  return {
    totalReceivable,
    currentAmount,
    overdue1_30,
    overdue31_60,
    overdue61_90,
    overdue90Plus,
    collectionsThisMonth,
    totalClients: clientsWithBalance.size,
    overdueClients: overdueClients.size,
    averageDaysToCollect: 32,
  };
}

/**
 * Get aging buckets data
 */
export function getAgingData(): AgingBucket[] {
  ensureReceivablesInit();
  const active = _receivables.filter(ar => ar.status !== 'anulado' && ar.status !== 'pagado');
  const total = active.reduce((sum, ar) => sum + ar.balance, 0);

  const buckets: AgingBucketKey[] = ['corriente', '1_30', '31_60', '61_90', '90_plus'];
  const labels: Record<AgingBucketKey, string> = {
    corriente: 'Corriente',
    '1_30': '1-30 días',
    '31_60': '31-60 días',
    '61_90': '61-90 días',
    '90_plus': '90+ días',
  };
  const colors: Record<AgingBucketKey, string> = {
    corriente: 'bg-emerald-500',
    '1_30': 'bg-amber-500',
    '31_60': 'bg-orange-500',
    '61_90': 'bg-red-400',
    '90_plus': 'bg-red-600',
  };

  return buckets.map(key => {
    const items = active.filter(ar => ar.agingBucket === key);
    const amount = items.reduce((sum, ar) => sum + ar.balance, 0);
    return {
      key,
      label: labels[key],
      amount,
      count: items.length,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: colors[key],
    };
  });
}

/**
 * Get accounts receivable with filters
 */
export function getAccountsReceivable(filters?: CxCFilters): AccountReceivable[] {
  ensureReceivablesInit();
  let items = [..._receivables];

  if (!filters) return items;

  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter(ar =>
      ar.clientName.toLowerCase().includes(s) ||
      ar.invoiceNumber.toLowerCase().includes(s) ||
      ar.id.toLowerCase().includes(s)
    );
  }
  if (filters.clientId) {
    items = items.filter(ar => ar.clientId === filters.clientId);
  }
  if (filters.status && filters.status !== 'all') {
    items = items.filter(ar => ar.status === filters.status);
  }
  if (filters.agingBucket && filters.agingBucket !== 'all') {
    items = items.filter(ar => ar.agingBucket === filters.agingBucket);
  }
  if (filters.salesRepId) {
    items = items.filter(ar => ar.salesRepId === filters.salesRepId);
  }

  return items;
}

/**
 * Get pending invoices for a client
 */
export function getPendingInvoicesForClient(clientId: string): AccountReceivable[] {
  ensureReceivablesInit();
  return _receivables.filter(
    ar => ar.clientId === clientId && (ar.status === 'pendiente' || ar.status === 'parcial' || ar.status === 'vencido')
  );
}

/**
 * Get payments with optional client filter
 */
export function getPayments(clientId?: string): Payment[] {
  ensurePaymentsInit();
  if (clientId) {
    return _payments.filter(p => p.clientId === clientId);
  }
  return [..._payments];
}

/**
 * Get CxC transactions with filters
 */
export function getCxCTransactions(filters?: CxCFilters): CxCTransaction[] {
  ensureCxCTransactionsInit();
  let txns = [..._cxcTransactions];

  if (!filters) return txns;

  if (filters.search) {
    const s = filters.search.toLowerCase();
    txns = txns.filter(t =>
      t.clientName.toLowerCase().includes(s) ||
      t.documentNumber.toLowerCase().includes(s) ||
      t.description.toLowerCase().includes(s)
    );
  }
  if (filters.clientId) {
    txns = txns.filter(t => t.clientId === filters.clientId);
  }
  if (filters.transactionType && filters.transactionType !== 'all') {
    txns = txns.filter(t => t.type === filters.transactionType);
  }
  if (filters.dateFrom) {
    txns = txns.filter(t => t.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    txns = txns.filter(t => t.date <= filters.dateTo!);
  }

  return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get top clients by outstanding balance
 */
export function getTopClientsByBalance(limit: number = 10): { clientId: string; clientName: string; balance: number; invoiceCount: number }[] {
  ensureReceivablesInit();
  const clientMap = new Map<string, { clientName: string; balance: number; invoiceCount: number }>();

  _receivables
    .filter(ar => ar.status !== 'anulado' && ar.status !== 'pagado')
    .forEach(ar => {
      const existing = clientMap.get(ar.clientId);
      if (existing) {
        existing.balance += ar.balance;
        existing.invoiceCount += 1;
      } else {
        clientMap.set(ar.clientId, {
          clientName: ar.clientName,
          balance: ar.balance,
          invoiceCount: 1,
        });
      }
    });

  return Array.from(clientMap.entries())
    .map(([clientId, data]) => ({ clientId, ...data }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

/**
 * Format currency for display
 */
export function formatCurrencyCxC(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
