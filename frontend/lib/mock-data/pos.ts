/**
 * Mock data for POS (Punto de Venta) B2C module.
 * Based on Document 007 specifications.
 * Store-backed: data persists in localStorage
 */
import type {
  POSOrder,
  POSOrderLine,
  POSPaymentDetail,
  CashRegister,
  CashRegisterClosing,
  CashMovement,
  POSReturn,
  POSClient,
  StoreInventoryItem,
  ProductCategory,
  POSStats,
  POSDailyReport,
  POSProductRanking,
} from '@/lib/types/pos';

import { MOCK_PRODUCTS, SEED_PRODUCTS } from '@/lib/mock-data/products';
import { loadCollection, saveCollection, loadSingleton, saveSingleton, createSubscribers } from '@/lib/store/local-store';

// ============================================
// HELPER: Quick product lookup
// Uses SEED_PRODUCTS (static array) for module-level initialization
// to avoid Proxy/localStorage issues during server-side rendering.
// Falls back to MOCK_PRODUCTS (live data) at runtime.
// ============================================

function getProduct(id: string) {
  return SEED_PRODUCTS.find((p) => p.id === id)!;
}

/** Round to 2 decimals */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================
// 1. SEED_POS_ORDERS  (25 orders)
// ============================================

function buildLine(
  lineId: string,
  productId: string,
  qty: number,
  discount?: number
): POSOrderLine {
  const p = getProduct(productId);
  const unitPrice = p.priceB2C!;
  const discountPct = discount ?? 0;
  const subtotal = r2(qty * unitPrice * (1 - discountPct / 100));
  return {
    id: lineId,
    productId: p.id,
    productName: p.description,
    productCode: p.reference,
    productGroup: p.group,
    quantity: qty,
    unitPrice,
    ...(discountPct > 0 ? { discount: discountPct } : {}),
    subtotal,
  };
}

function buildOrder(
  orderNum: number,
  dateISO: string,
  lines: POSOrderLine[],
  payments: POSPaymentDetail[],
  opts: {
    status?: POSOrder['status'];
    customerId?: string;
    customerName?: string;
    cashierName: string;
    cashierId: string;
    changeGiven?: number;
    discountTotal?: number;
    notes?: string;
  }
): POSOrder {
  const padNum = String(orderNum).padStart(6, '0');
  const subtotal = r2(lines.reduce((s, l) => s + l.subtotal, 0));
  const discountTotal = opts.discountTotal ?? 0;
  const total = r2(subtotal - discountTotal);
  return {
    id: `POS-2026-${padNum}`,
    orderNumber: orderNum,
    status: opts.status ?? 'completada',
    createdAt: dateISO,
    lines,
    subtotal,
    discountTotal,
    total,
    payments,
    ...(opts.changeGiven != null ? { changeGiven: opts.changeGiven } : {}),
    customerId: opts.customerId,
    customerName: opts.customerName ?? 'Consumidor Final',
    cashRegisterId: 'caja-1',
    cashierName: opts.cashierName,
    cashierId: opts.cashierId,
    ticketNumber: `TK-2026-${padNum}`,
    ...(opts.notes ? { notes: opts.notes } : {}),
  };
}

const SEED_POS_ORDERS: POSOrder[] = [
  // ─── Today (Feb 27) ── 8 orders ───────────────────────────────────

  // Order 1 - efectivo, Consumidor Final
  buildOrder(
    1,
    '2026-02-27T08:15:22.000Z',
    [
      buildLine('L-001-1', 'EVL-00001', 2),          // 2 x 6.99 = 13.98
      buildLine('L-001-2', 'EVL-00017', 3),          // 3 x 4.99 = 14.97
    ],
    [{ method: 'efectivo', amount: 30 }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1', changeGiven: 1.05 }
  ),

  // Order 2 - tarjeta_debito, Consumidor Final
  buildOrder(
    2,
    '2026-02-27T09:02:45.000Z',
    [
      buildLine('L-002-1', 'EVL-00002', 1),          // 14.99
      buildLine('L-002-2', 'EVL-00018', 2),          // 2 x 3.49 = 6.98
      buildLine('L-002-3', 'EVL-00015', 1),          // 12.99
    ],
    [{ method: 'tarjeta_debito', amount: 34.96, reference: '4532' }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1' }
  ),

  // Order 3 - efectivo, registered customer
  buildOrder(
    3,
    '2026-02-27T10:18:33.000Z',
    [
      buildLine('L-003-1', 'EVL-00009', 2),          // 2 x 24.99 = 49.98
      buildLine('L-003-2', 'EVL-00006', 3),          // 3 x 8.99 = 26.97
    ],
    [{ method: 'efectivo', amount: 80 }],
    {
      cashierName: 'Pedro Sanchez',
      cashierId: 'usr-vendedor-2',
      customerId: 'Z0000001',
      customerName: 'Roberto Gonzalez M.',
      changeGiven: 3.05,
    }
  ),

  // Order 4 - tarjeta_credito
  buildOrder(
    4,
    '2026-02-27T11:45:10.000Z',
    [
      buildLine('L-004-1', 'EVL-00004', 1),          // 189.99
    ],
    [{ method: 'tarjeta_credito', amount: 189.99, reference: '8901', cardType: 'credito' }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1' }
  ),

  // Order 5 - efectivo
  buildOrder(
    5,
    '2026-02-27T12:30:55.000Z',
    [
      buildLine('L-005-1', 'EVL-00012', 5),          // 5 x 1.99 = 9.95
      buildLine('L-005-2', 'EVL-00018', 1),          // 3.49
      buildLine('L-005-3', 'EVL-00001', 1),          // 6.99
    ],
    [{ method: 'efectivo', amount: 21 }],
    { cashierName: 'Pedro Sanchez', cashierId: 'usr-vendedor-2', changeGiven: 0.57 }
  ),

  // Order 6 - transferencia, registered customer
  buildOrder(
    6,
    '2026-02-27T13:22:18.000Z',
    [
      buildLine('L-006-1', 'EVL-00005', 1),          // 299.99
      buildLine('L-006-2', 'EVL-00013', 1),          // 45.99
    ],
    [{ method: 'transferencia', amount: 345.98, reference: 'TRF-88421', bankName: 'Banco General' }],
    {
      cashierName: 'Maria Garcia',
      cashierId: 'usr-vendedor-1',
      customerId: 'Z0000003',
      customerName: 'Carlos Mendez R.',
    }
  ),

  // Order 7 - mixto (efectivo + tarjeta)
  buildOrder(
    7,
    '2026-02-27T15:10:42.000Z',
    [
      buildLine('L-007-1', 'EVL-00008', 1),          // 32.99
      buildLine('L-007-2', 'EVL-00010', 1),          // 29.99
      buildLine('L-007-3', 'EVL-00019', 2),          // 2 x 21.99 = 43.98
      buildLine('L-007-4', 'EVL-00006', 2),          // 2 x 8.99 = 17.98
    ],
    [
      { method: 'efectivo', amount: 75 },
      { method: 'tarjeta_debito', amount: 49.94, reference: '7812' },
    ],
    { cashierName: 'Ana Lopez', cashierId: 'usr-bodega-1' }
  ),

  // Order 8 - tarjeta_debito
  buildOrder(
    8,
    '2026-02-27T16:45:30.000Z',
    [
      buildLine('L-008-1', 'EVL-00014', 1),          // 32.99
      buildLine('L-008-2', 'EVL-00016', 2),          // 2 x 9.99 = 19.98
    ],
    [{ method: 'tarjeta_debito', amount: 52.97, reference: '3344' }],
    { cashierName: 'Ana Lopez', cashierId: 'usr-bodega-1' }
  ),

  // ─── Yesterday (Feb 26) ── 7 orders ──────────────────────────────

  // Order 9 - efectivo
  buildOrder(
    9,
    '2026-02-26T08:30:11.000Z',
    [
      buildLine('L-009-1', 'EVL-00001', 4),          // 4 x 6.99 = 27.96
      buildLine('L-009-2', 'EVL-00017', 2),          // 2 x 4.99 = 9.98
    ],
    [{ method: 'efectivo', amount: 40 }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1', changeGiven: 2.06 }
  ),

  // Order 10 - tarjeta_credito, registered customer
  buildOrder(
    10,
    '2026-02-26T09:45:22.000Z',
    [
      buildLine('L-010-1', 'EVL-00020', 1),          // 59.99
      buildLine('L-010-2', 'EVL-00013', 1),          // 45.99
    ],
    [{ method: 'tarjeta_credito', amount: 105.98, reference: '5567', cardType: 'credito' }],
    {
      cashierName: 'Pedro Sanchez',
      cashierId: 'usr-vendedor-2',
      customerId: 'Z0000002',
      customerName: 'Ana Maria Castillo',
    }
  ),

  // Order 11 - efectivo
  buildOrder(
    11,
    '2026-02-26T10:55:08.000Z',
    [
      buildLine('L-011-1', 'EVL-00015', 2),          // 2 x 12.99 = 25.98
      buildLine('L-011-2', 'EVL-00012', 10),         // 10 x 1.99 = 19.90
      buildLine('L-011-3', 'EVL-00018', 3),          // 3 x 3.49 = 10.47
    ],
    [{ method: 'efectivo', amount: 60 }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1', changeGiven: 3.65 }
  ),

  // Order 12 - tarjeta_debito
  buildOrder(
    12,
    '2026-02-26T12:20:44.000Z',
    [
      buildLine('L-012-1', 'EVL-00007', 1),          // 19.99
      buildLine('L-012-2', 'EVL-00011', 1),          // 18.99
    ],
    [{ method: 'tarjeta_debito', amount: 38.98, reference: '9021' }],
    { cashierName: 'Pedro Sanchez', cashierId: 'usr-vendedor-2' }
  ),

  // Order 13 - efectivo, CANCELADA
  buildOrder(
    13,
    '2026-02-26T13:10:30.000Z',
    [
      buildLine('L-013-1', 'EVL-00004', 1),          // 189.99
    ],
    [{ method: 'efectivo', amount: 200 }],
    {
      cashierName: 'Maria Garcia',
      cashierId: 'usr-vendedor-1',
      changeGiven: 10.01,
      status: 'cancelada',
      notes: 'Cliente cancel la compra antes de retirar el producto.',
    }
  ),

  // Order 14 - tarjeta_debito
  buildOrder(
    14,
    '2026-02-26T15:08:19.000Z',
    [
      buildLine('L-014-1', 'EVL-00009', 1),          // 24.99
      buildLine('L-014-2', 'EVL-00006', 4),          // 4 x 8.99 = 35.96
      buildLine('L-014-3', 'EVL-00016', 1),          // 9.99
    ],
    [{ method: 'tarjeta_debito', amount: 70.94, reference: '2288' }],
    {
      cashierName: 'Ana Lopez',
      cashierId: 'usr-bodega-1',
      customerId: 'Z0000004',
      customerName: 'Luis Eduardo Herrera',
    }
  ),

  // Order 15 - efectivo, PARCIALMENTE_DEVUELTA
  buildOrder(
    15,
    '2026-02-26T16:30:55.000Z',
    [
      buildLine('L-015-1', 'EVL-00002', 2),          // 2 x 14.99 = 29.98
      buildLine('L-015-2', 'EVL-00003', 1),          // 17.99
      buildLine('L-015-3', 'EVL-00019', 1),          // 21.99
    ],
    [{ method: 'efectivo', amount: 70 }],
    {
      cashierName: 'Pedro Sanchez',
      cashierId: 'usr-vendedor-2',
      changeGiven: 0.04,
      status: 'parcialmente_devuelta',
      notes: 'Se devolvio 1 botella de JW Red por etiqueta danada.',
    }
  ),

  // ─── This week (Feb 23-25) ── 10 orders ──────────────────────────

  // Order 16 - Feb 25 - efectivo
  buildOrder(
    16,
    '2026-02-25T09:12:05.000Z',
    [
      buildLine('L-016-1', 'EVL-00001', 6),          // 6 x 6.99 = 41.94
      buildLine('L-016-2', 'EVL-00017', 4),          // 4 x 4.99 = 19.96
    ],
    [{ method: 'efectivo', amount: 62 }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1', changeGiven: 0.10 }
  ),

  // Order 17 - Feb 25 - tarjeta_credito
  buildOrder(
    17,
    '2026-02-25T11:40:33.000Z',
    [
      buildLine('L-017-1', 'EVL-00005', 1),          // 299.99
      buildLine('L-017-2', 'EVL-00008', 1),          // 32.99
    ],
    [{ method: 'tarjeta_credito', amount: 332.98, reference: '1122', cardType: 'credito' }],
    {
      cashierName: 'Pedro Sanchez',
      cashierId: 'usr-vendedor-2',
      customerId: 'Z0000005',
      customerName: 'Marta Lucia Pineda',
    }
  ),

  // Order 18 - Feb 25 - tarjeta_debito
  buildOrder(
    18,
    '2026-02-25T14:05:48.000Z',
    [
      buildLine('L-018-1', 'EVL-00014', 2),          // 2 x 32.99 = 65.98
      buildLine('L-018-2', 'EVL-00010', 1),          // 29.99
      buildLine('L-018-3', 'EVL-00018', 2),          // 2 x 3.49 = 6.98
    ],
    [{ method: 'tarjeta_debito', amount: 102.95, reference: '6745' }],
    { cashierName: 'Ana Lopez', cashierId: 'usr-bodega-1' }
  ),

  // Order 19 - Feb 25 - efectivo
  buildOrder(
    19,
    '2026-02-25T16:22:10.000Z',
    [
      buildLine('L-019-1', 'EVL-00012', 8),          // 8 x 1.99 = 15.92
    ],
    [{ method: 'efectivo', amount: 16 }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1', changeGiven: 0.08 }
  ),

  // Order 20 - Feb 24 - transferencia
  buildOrder(
    20,
    '2026-02-24T10:30:22.000Z',
    [
      buildLine('L-020-1', 'EVL-00004', 1),          // 189.99
      buildLine('L-020-2', 'EVL-00009', 2),          // 2 x 24.99 = 49.98
      buildLine('L-020-3', 'EVL-00006', 6),          // 6 x 8.99 = 53.94
    ],
    [{ method: 'transferencia', amount: 293.91, reference: 'TRF-77102', bankName: 'BAC' }],
    {
      cashierName: 'Pedro Sanchez',
      cashierId: 'usr-vendedor-2',
      customerId: 'Z0000006',
      customerName: 'Fernando Antonio De Leon',
    }
  ),

  // Order 21 - Feb 24 - efectivo
  buildOrder(
    21,
    '2026-02-24T12:50:14.000Z',
    [
      buildLine('L-021-1', 'EVL-00007', 1),          // 19.99
      buildLine('L-021-2', 'EVL-00015', 1),          // 12.99
      buildLine('L-021-3', 'EVL-00001', 2),          // 2 x 6.99 = 13.98
    ],
    [{ method: 'efectivo', amount: 47 }],
    { cashierName: 'Maria Garcia', cashierId: 'usr-vendedor-1', changeGiven: 0.04 }
  ),

  // Order 22 - Feb 24 - tarjeta_debito
  buildOrder(
    22,
    '2026-02-24T15:10:38.000Z',
    [
      buildLine('L-022-1', 'EVL-00020', 1),          // 59.99
    ],
    [{ method: 'tarjeta_debito', amount: 59.99, reference: '4410' }],
    { cashierName: 'Ana Lopez', cashierId: 'usr-bodega-1' }
  ),

  // Order 23 - Feb 23 - efectivo
  buildOrder(
    23,
    '2026-02-23T09:20:05.000Z',
    [
      buildLine('L-023-1', 'EVL-00003', 2),          // 2 x 17.99 = 35.98
      buildLine('L-023-2', 'EVL-00011', 1),          // 18.99
      buildLine('L-023-3', 'EVL-00016', 1),          // 9.99
      buildLine('L-023-4', 'EVL-00018', 1),          // 3.49
    ],
    [{ method: 'efectivo', amount: 70 }],
    { cashierName: 'Pedro Sanchez', cashierId: 'usr-vendedor-2', changeGiven: 1.55 }
  ),

  // Order 24 - Feb 23 - tarjeta_credito, registered customer
  buildOrder(
    24,
    '2026-02-23T12:15:44.000Z',
    [
      buildLine('L-024-1', 'EVL-00013', 1),          // 45.99
      buildLine('L-024-2', 'EVL-00010', 2),          // 2 x 29.99 = 59.98
      buildLine('L-024-3', 'EVL-00002', 1),          // 14.99
      buildLine('L-024-4', 'EVL-00019', 1),          // 21.99
      buildLine('L-024-5', 'EVL-00012', 4),          // 4 x 1.99 = 7.96
    ],
    [{ method: 'tarjeta_credito', amount: 150.91, reference: '6633', cardType: 'credito' }],
    {
      cashierName: 'Maria Garcia',
      cashierId: 'usr-vendedor-1',
      customerId: 'Z0000007',
      customerName: 'Isabel Cristina Moreno',
    }
  ),

  // Order 25 - Feb 23 - efectivo
  buildOrder(
    25,
    '2026-02-23T16:05:30.000Z',
    [
      buildLine('L-025-1', 'EVL-00015', 3),          // 3 x 12.99 = 38.97
      buildLine('L-025-2', 'EVL-00017', 2),          // 2 x 4.99 = 9.98
    ],
    [{ method: 'efectivo', amount: 49 }],
    { cashierName: 'Pedro Sanchez', cashierId: 'usr-vendedor-2', changeGiven: 0.05 }
  ),
];

// ============================================
// 2. SEED_CASH_REGISTER (singleton)
// ============================================

const SEED_CASH_REGISTER: CashRegister = {
  id: 'caja-1',
  name: 'Caja #1',
  location: 'Planta baja - Tienda',
  status: 'abierta',
  isActive: true,
  currentOpening: {
    id: 'AP-2026-0227',
    cashRegisterId: 'caja-1',
    openedAt: '2026-02-27T07:55:00.000Z',
    openedBy: 'usr-vendedor-1',
    openedByName: 'Maria Garcia',
    initialFund: 200,
    notes: 'Apertura normal del dia.',
  },
};

// ============================================
// 3. SEED_CASH_CLOSINGS (10 closings)
// ============================================

const SEED_CASH_CLOSINGS: CashRegisterClosing[] = [
  {
    id: 'CC-2026-0001',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0215',
    closedAt: '2026-02-15T18:05:00.000Z',
    closedBy: 'usr-vendedor-1',
    closedByName: 'Maria Garcia',
    openedAt: '2026-02-15T08:00:00.000Z',
    totalSales: 1245.50,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 1245.50,
    transactionCount: 22,
    cashSales: 520.30,
    debitCardSales: 385.20,
    creditCardSales: 240.00,
    transferSales: 100.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 0,
    expectedCash: 720.30,
    actualCash: 720.30,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0002',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0216',
    closedAt: '2026-02-16T18:15:00.000Z',
    closedBy: 'usr-vendedor-2',
    closedByName: 'Pedro Sanchez',
    openedAt: '2026-02-16T08:00:00.000Z',
    totalSales: 985.75,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 985.75,
    transactionCount: 18,
    cashSales: 415.80,
    debitCardSales: 310.45,
    creditCardSales: 159.50,
    transferSales: 100.00,
    initialFund: 200,
    cashEntries: 50,
    cashExits: 30,
    expectedCash: 635.80,
    actualCash: 630.30,
    difference: -5.50,
    status: 'con_diferencia',
    observations: 'Faltante de $5.50. Posible error en cambio durante hora pico.',
  },
  {
    id: 'CC-2026-0003',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0217',
    closedAt: '2026-02-17T18:00:00.000Z',
    closedBy: 'usr-vendedor-1',
    closedByName: 'Maria Garcia',
    openedAt: '2026-02-17T08:00:00.000Z',
    totalSales: 1580.20,
    totalReturns: 14.99,
    totalDiscounts: 0,
    netSales: 1565.21,
    transactionCount: 28,
    cashSales: 680.10,
    debitCardSales: 450.10,
    creditCardSales: 350.00,
    transferSales: 100.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 100,
    expectedCash: 780.10,
    actualCash: 780.10,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0004',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0218',
    closedAt: '2026-02-18T18:20:00.000Z',
    closedBy: 'usr-vendedor-2',
    closedByName: 'Pedro Sanchez',
    openedAt: '2026-02-18T08:00:00.000Z',
    totalSales: 890.40,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 890.40,
    transactionCount: 15,
    cashSales: 340.40,
    debitCardSales: 280.00,
    creditCardSales: 170.00,
    transferSales: 100.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 0,
    expectedCash: 540.40,
    actualCash: 540.40,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0005',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0219',
    closedAt: '2026-02-19T18:10:00.000Z',
    closedBy: 'usr-vendedor-1',
    closedByName: 'Maria Garcia',
    openedAt: '2026-02-19T08:00:00.000Z',
    totalSales: 2135.80,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 2135.80,
    transactionCount: 35,
    cashSales: 895.50,
    debitCardSales: 620.30,
    creditCardSales: 420.00,
    transferSales: 200.00,
    initialFund: 200,
    cashEntries: 100,
    cashExits: 200,
    expectedCash: 995.50,
    actualCash: 995.50,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0006',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0220',
    closedAt: '2026-02-20T18:30:00.000Z',
    closedBy: 'usr-vendedor-2',
    closedByName: 'Pedro Sanchez',
    openedAt: '2026-02-20T08:00:00.000Z',
    totalSales: 1320.60,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 1320.60,
    transactionCount: 24,
    cashSales: 560.25,
    debitCardSales: 390.35,
    creditCardSales: 270.00,
    transferSales: 100.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 50,
    expectedCash: 710.25,
    actualCash: 710.25,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0007',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0221',
    closedAt: '2026-02-21T18:00:00.000Z',
    closedBy: 'usr-vendedor-1',
    closedByName: 'Maria Garcia',
    openedAt: '2026-02-21T08:00:00.000Z',
    totalSales: 2480.90,
    totalReturns: 29.98,
    totalDiscounts: 0,
    netSales: 2450.92,
    transactionCount: 32,
    cashSales: 1020.45,
    debitCardSales: 710.45,
    creditCardSales: 550.00,
    transferSales: 200.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 150,
    expectedCash: 1070.45,
    actualCash: 1072.45,
    difference: 2.00,
    status: 'con_diferencia',
    observations: 'Sobrante de $2.00. Se presume error a favor en un cambio.',
  },
  {
    id: 'CC-2026-0008',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0223',
    closedAt: '2026-02-23T18:10:00.000Z',
    closedBy: 'usr-vendedor-2',
    closedByName: 'Pedro Sanchez',
    openedAt: '2026-02-23T08:00:00.000Z',
    totalSales: 1750.30,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 1750.30,
    transactionCount: 26,
    cashSales: 730.15,
    debitCardSales: 510.15,
    creditCardSales: 310.00,
    transferSales: 200.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 0,
    expectedCash: 930.15,
    actualCash: 930.15,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0009',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0224',
    closedAt: '2026-02-24T18:05:00.000Z',
    closedBy: 'usr-vendedor-1',
    closedByName: 'Maria Garcia',
    openedAt: '2026-02-24T08:00:00.000Z',
    totalSales: 1420.85,
    totalReturns: 0,
    totalDiscounts: 0,
    netSales: 1420.85,
    transactionCount: 21,
    cashSales: 590.40,
    debitCardSales: 420.45,
    creditCardSales: 310.00,
    transferSales: 100.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 0,
    expectedCash: 790.40,
    actualCash: 790.40,
    difference: 0,
    status: 'ok',
  },
  {
    id: 'CC-2026-0010',
    cashRegisterId: 'caja-1',
    openingId: 'AP-2026-0226',
    closedAt: '2026-02-26T18:20:00.000Z',
    closedBy: 'usr-vendedor-2',
    closedByName: 'Pedro Sanchez',
    openedAt: '2026-02-26T08:00:00.000Z',
    totalSales: 1685.50,
    totalReturns: 14.99,
    totalDiscounts: 0,
    netSales: 1670.51,
    transactionCount: 25,
    cashSales: 710.20,
    debitCardSales: 490.30,
    creditCardSales: 285.00,
    transferSales: 200.00,
    initialFund: 200,
    cashEntries: 0,
    cashExits: 100,
    expectedCash: 810.20,
    actualCash: 810.20,
    difference: 0,
    status: 'ok',
  },
];

// ============================================
// 4. SEED_CASH_MOVEMENTS (5 movements)
// ============================================

const SEED_CASH_MOVEMENTS: CashMovement[] = [
  {
    id: 'MOV-2026-0001',
    cashRegisterId: 'caja-1',
    type: 'entrada',
    amount: 100,
    reason: 'Fondo adicional para cambio en billetes pequenos.',
    createdAt: '2026-02-27T08:05:00.000Z',
    createdBy: 'usr-vendedor-1',
    createdByName: 'Maria Garcia',
  },
  {
    id: 'MOV-2026-0002',
    cashRegisterId: 'caja-1',
    type: 'salida',
    amount: 35,
    reason: 'Pago proveedor limpieza - factura #LM-445.',
    createdAt: '2026-02-27T11:30:00.000Z',
    createdBy: 'usr-vendedor-1',
    createdByName: 'Maria Garcia',
    approvedBy: 'usr-vendedor-2',
    approvedByName: 'Pedro Sanchez',
  },
  {
    id: 'MOV-2026-0003',
    cashRegisterId: 'caja-1',
    type: 'retiro_parcial',
    amount: 500,
    reason: 'Retiro de seguridad - exceso de efectivo en caja.',
    createdAt: '2026-02-27T14:00:00.000Z',
    createdBy: 'usr-vendedor-2',
    createdByName: 'Pedro Sanchez',
    approvedBy: 'usr-vendedor-1',
    approvedByName: 'Maria Garcia',
  },
  {
    id: 'MOV-2026-0004',
    cashRegisterId: 'caja-1',
    type: 'entrada',
    amount: 50,
    reason: 'Reposicion de fondo de caja tras retiro.',
    createdAt: '2026-02-26T08:10:00.000Z',
    createdBy: 'usr-vendedor-1',
    createdByName: 'Maria Garcia',
  },
  {
    id: 'MOV-2026-0005',
    cashRegisterId: 'caja-1',
    type: 'salida',
    amount: 20,
    reason: 'Compra de bolsas para empaque.',
    createdAt: '2026-02-26T16:00:00.000Z',
    createdBy: 'usr-bodega-1',
    createdByName: 'Ana Lopez',
    approvedBy: 'usr-vendedor-2',
    approvedByName: 'Pedro Sanchez',
  },
];

// ============================================
// 5. SEED_POS_CLIENTS (8 B2C clients)
// ============================================

const SEED_POS_CLIENTS: POSClient[] = [
  {
    id: 'Z0000001',
    name: 'Roberto Gonzalez M.',
    documentType: 'cedula',
    documentNumber: '8-456-1234',
    phone: '+507 6612-3344',
    email: 'rgonzalez@gmail.com',
    createdAt: '2025-11-10T10:00:00.000Z',
    totalPurchases: 18,
    lastPurchaseDate: '2026-02-27T10:18:33.000Z',
  },
  {
    id: 'Z0000002',
    name: 'Ana Maria Castillo',
    documentType: 'cedula',
    documentNumber: '4-789-5678',
    phone: '+507 6701-9988',
    email: 'amcastillo@hotmail.com',
    createdAt: '2025-12-05T14:30:00.000Z',
    totalPurchases: 12,
    lastPurchaseDate: '2026-02-26T09:45:22.000Z',
  },
  {
    id: 'Z0000003',
    name: 'Carlos Mendez R.',
    documentType: 'ruc',
    documentNumber: '155642987-2-2021',
    dv: '56',
    phone: '+507 6555-4422',
    email: 'cmendez@empresas.com',
    address: 'Via Espana, Edificio Torres de Alba, Piso 8',
    createdAt: '2025-09-20T08:00:00.000Z',
    totalPurchases: 25,
    lastPurchaseDate: '2026-02-27T13:22:18.000Z',
  },
  {
    id: 'Z0000004',
    name: 'Luis Eduardo Herrera',
    documentType: 'cedula',
    documentNumber: '6-712-3456',
    phone: '+507 6890-1122',
    createdAt: '2026-01-15T11:00:00.000Z',
    totalPurchases: 7,
    lastPurchaseDate: '2026-02-26T15:08:19.000Z',
  },
  {
    id: 'Z0000005',
    name: 'Marta Lucia Pineda',
    documentType: 'cedula',
    documentNumber: '3-456-7890',
    phone: '+507 6234-5566',
    email: 'mlpineda@gmail.com',
    createdAt: '2025-10-01T09:00:00.000Z',
    totalPurchases: 15,
    lastPurchaseDate: '2026-02-25T11:40:33.000Z',
  },
  {
    id: 'Z0000006',
    name: 'Fernando Antonio De Leon',
    documentType: 'ruc',
    documentNumber: '155698741-2-2019',
    dv: '32',
    phone: '+507 6412-7788',
    email: 'fdeleon@corporacion.com',
    address: 'Calle 50, Bella Vista, Local 12',
    createdAt: '2025-08-12T16:00:00.000Z',
    totalPurchases: 22,
    lastPurchaseDate: '2026-02-24T10:30:22.000Z',
  },
  {
    id: 'Z0000007',
    name: 'Isabel Cristina Moreno',
    documentType: 'pasaporte',
    documentNumber: 'PE-4567821',
    phone: '+507 6345-9900',
    email: 'icmoreno@outlook.com',
    createdAt: '2026-01-20T13:00:00.000Z',
    totalPurchases: 5,
    lastPurchaseDate: '2026-02-23T12:15:44.000Z',
  },
  {
    id: 'Z0000008',
    name: 'Diego Armando Rios',
    documentType: 'cedula',
    documentNumber: '9-234-5678',
    phone: '+507 6178-3344',
    createdAt: '2026-02-01T10:30:00.000Z',
    totalPurchases: 3,
    lastPurchaseDate: '2026-02-20T14:15:00.000Z',
  },
];

// ============================================
// 6. SEED_STORE_INVENTORY (20 products)
// ============================================

function buildInventoryItem(
  productId: string,
  stockUnits: number,
  minimumStock: number
): StoreInventoryItem {
  const p = getProduct(productId);
  const stockStatus: StoreInventoryItem['stockStatus'] =
    stockUnits === 0 ? 'agotado' : stockUnits < minimumStock ? 'bajo' : 'ok';
  return {
    productId: p.id,
    productName: p.description,
    productCode: p.reference,
    productGroup: p.group,
    productImage: p.image,
    barcode: p.barcode,
    stockUnits,
    minimumStock,
    priceB2C: p.priceB2C!,
    unitsPerCase: p.unitsPerCase,
    stockStatus,
    ...(stockUnits > 0
      ? { lastReplenishmentDate: '2026-02-22T10:00:00.000Z' }
      : {}),
  };
}

const SEED_STORE_INVENTORY: StoreInventoryItem[] = [
  buildInventoryItem('EVL-00001', 72, 48),
  buildInventoryItem('EVL-00002', 30, 24),
  buildInventoryItem('EVL-00003', 18, 24),
  buildInventoryItem('EVL-00004', 4, 6),
  buildInventoryItem('EVL-00005', 2, 6),
  buildInventoryItem('EVL-00006', 48, 24),
  buildInventoryItem('EVL-00007', 15, 12),
  buildInventoryItem('EVL-00008', 10, 12),
  buildInventoryItem('EVL-00009', 36, 24),
  buildInventoryItem('EVL-00010', 18, 12),
  buildInventoryItem('EVL-00011', 0, 24),
  buildInventoryItem('EVL-00012', 90, 48),
  buildInventoryItem('EVL-00013', 8, 12),
  buildInventoryItem('EVL-00014', 14, 12),
  buildInventoryItem('EVL-00015', 36, 24),
  buildInventoryItem('EVL-00016', 24, 24),
  buildInventoryItem('EVL-00017', 60, 36),
  buildInventoryItem('EVL-00018', 42, 24),
  buildInventoryItem('EVL-00019', 20, 12),
  buildInventoryItem('EVL-00020', 6, 12),
];

// ============================================
// 7. SEED_POS_RETURNS (3 returns)
// ============================================

const SEED_POS_RETURNS: POSReturn[] = [
  {
    id: 'DEV-B-2026-0001',
    originalOrderId: 'POS-2026-000015',
    originalOrderNumber: 'TK-2026-000015',
    status: 'procesada',
    createdAt: '2026-02-26T17:00:00.000Z',
    lines: [
      {
        productId: 'EVL-00002',
        productName: 'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
        quantity: 1,
        unitPrice: 14.99,
        subtotal: 14.99,
      },
    ],
    totalAmount: 14.99,
    reason: 'Etiqueta danada en la botella, cliente solicita cambio.',
    reasonCategory: 'producto_danado',
    reimbursementType: 'efectivo',
    processedBy: 'usr-vendedor-2',
    processedByName: 'Pedro Sanchez',
    approvedBy: 'usr-vendedor-1',
    approvedByName: 'Maria Garcia',
    notes: 'Producto devuelto a bodega para revision de calidad.',
  },
  {
    id: 'DEV-B-2026-0002',
    originalOrderId: 'POS-2026-000020',
    originalOrderNumber: 'TK-2026-000020',
    status: 'pendiente',
    createdAt: '2026-02-25T16:30:00.000Z',
    lines: [
      {
        productId: 'EVL-00006',
        productName: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
        quantity: 2,
        unitPrice: 8.99,
        subtotal: 17.98,
      },
    ],
    totalAmount: 17.98,
    reason: 'Cliente indica que las botellas tenian sedimento inusual.',
    reasonCategory: 'producto_danado',
    reimbursementType: 'nota_credito',
    processedBy: 'usr-vendedor-2',
    processedByName: 'Pedro Sanchez',
    notes: 'Pendiente revision del supervisor para aprobar devolucion.',
  },
  {
    id: 'DEV-B-2026-0003',
    originalOrderId: 'POS-2026-000011',
    originalOrderNumber: 'TK-2026-000011',
    status: 'aprobada',
    createdAt: '2026-02-26T14:45:00.000Z',
    lines: [
      {
        productId: 'EVL-00015',
        productName: 'RON CAPTAIN MORGAN BLACK SPICED 12X1000ML 40%',
        quantity: 1,
        unitPrice: 12.99,
        subtotal: 12.99,
      },
      {
        productId: 'EVL-00018',
        productName: 'SNACKS PRINGLES BBQ 12X149G',
        quantity: 1,
        unitPrice: 3.49,
        subtotal: 3.49,
      },
    ],
    totalAmount: 16.48,
    reason: 'Cajero cobro productos adicionales por error.',
    reasonCategory: 'error_cajero',
    reimbursementType: 'credito_tienda',
    processedBy: 'usr-vendedor-1',
    processedByName: 'Maria Garcia',
    approvedBy: 'usr-vendedor-2',
    approvedByName: 'Pedro Sanchez',
    notes: 'Error confirmado al revisar el ticket original.',
  },
];

// ============================================
// 8. SEED_PRODUCT_CATEGORIES
// ============================================

const SEED_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'WHISKY', label: 'Whisky', icon: 'glass-water', count: 9 },
  { id: 'VODKA', label: 'Vodka', icon: 'wine', count: 1 },
  { id: 'RON', label: 'Ron', icon: 'beer', count: 3 },
  { id: 'TEQUILA', label: 'Tequila', icon: 'martini', count: 3 },
  { id: 'GINEBRA', label: 'Ginebra', icon: 'cocktail', count: 1 },
  { id: 'VINO', label: 'Vino', icon: 'wine', count: 1 },
  { id: 'LICOR', label: 'Licor', icon: 'cup-soda', count: 2 },
  { id: 'CERVEZA', label: 'Cerveza', icon: 'beer', count: 0 },
  { id: 'SNACKS', label: 'Snacks', icon: 'cookie', count: 1 },
];

// ============================================================================
// STORE INFRASTRUCTURE – POS Orders
// ============================================================================

let _posOrders: POSOrder[] = SEED_POS_ORDERS;
let _posOrdersInitialized = false;
const { subscribe: subscribePosOrders, notify: _notifyPosOrders } = createSubscribers();

function ensurePosOrdersInitialized(): void {
  if (typeof window === 'undefined' || _posOrdersInitialized) return;
  _posOrders = loadCollection<POSOrder>('pos_orders', SEED_POS_ORDERS);
  _posOrdersInitialized = true;
}

export function getPosOrdersData(): POSOrder[] {
  ensurePosOrdersInitialized();
  return _posOrders;
}

export { subscribePosOrders };

export const MOCK_POS_ORDERS: POSOrder[] = new Proxy(SEED_POS_ORDERS as POSOrder[], {
  get(_target, prop, receiver) {
    ensurePosOrdersInitialized();
    return Reflect.get(_posOrders, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Cash Register (singleton)
// ============================================================================

let _cashRegister: CashRegister = SEED_CASH_REGISTER;
let _cashRegisterInitialized = false;
const { subscribe: subscribeCashRegister, notify: _notifyCashRegister } = createSubscribers();

function ensureCashRegisterInitialized(): void {
  if (typeof window === 'undefined' || _cashRegisterInitialized) return;
  _cashRegister = loadSingleton<CashRegister>('cash_register', SEED_CASH_REGISTER);
  _cashRegisterInitialized = true;
}

export function getCashRegisterData(): CashRegister {
  ensureCashRegisterInitialized();
  return _cashRegister;
}

export { subscribeCashRegister };

export const MOCK_CASH_REGISTER: CashRegister = new Proxy(SEED_CASH_REGISTER as CashRegister, {
  get(_target, prop, receiver) {
    ensureCashRegisterInitialized();
    return Reflect.get(_cashRegister, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Cash Closings
// ============================================================================

let _cashClosings: CashRegisterClosing[] = SEED_CASH_CLOSINGS;
let _cashClosingsInitialized = false;
const { subscribe: subscribeCashClosings, notify: _notifyCashClosings } = createSubscribers();

function ensureCashClosingsInitialized(): void {
  if (typeof window === 'undefined' || _cashClosingsInitialized) return;
  _cashClosings = loadCollection<CashRegisterClosing>('cash_closings', SEED_CASH_CLOSINGS);
  _cashClosingsInitialized = true;
}

export function getCashClosingsData(): CashRegisterClosing[] {
  ensureCashClosingsInitialized();
  return _cashClosings;
}

export { subscribeCashClosings };

export const MOCK_CASH_CLOSINGS: CashRegisterClosing[] = new Proxy(SEED_CASH_CLOSINGS as CashRegisterClosing[], {
  get(_target, prop, receiver) {
    ensureCashClosingsInitialized();
    return Reflect.get(_cashClosings, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Cash Movements
// ============================================================================

let _cashMovements: CashMovement[] = SEED_CASH_MOVEMENTS;
let _cashMovementsInitialized = false;
const { subscribe: subscribeCashMovements, notify: _notifyCashMovements } = createSubscribers();

function ensureCashMovementsInitialized(): void {
  if (typeof window === 'undefined' || _cashMovementsInitialized) return;
  _cashMovements = loadCollection<CashMovement>('cash_movements', SEED_CASH_MOVEMENTS);
  _cashMovementsInitialized = true;
}

export function getCashMovementsData(): CashMovement[] {
  ensureCashMovementsInitialized();
  return _cashMovements;
}

export { subscribeCashMovements };

export const MOCK_CASH_MOVEMENTS: CashMovement[] = new Proxy(SEED_CASH_MOVEMENTS as CashMovement[], {
  get(_target, prop, receiver) {
    ensureCashMovementsInitialized();
    return Reflect.get(_cashMovements, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – POS Clients
// ============================================================================

let _posClients: POSClient[] = SEED_POS_CLIENTS;
let _posClientsInitialized = false;
const { subscribe: subscribePosClients, notify: _notifyPosClients } = createSubscribers();

function ensurePosClientsInitialized(): void {
  if (typeof window === 'undefined' || _posClientsInitialized) return;
  _posClients = loadCollection<POSClient>('pos_clients', SEED_POS_CLIENTS);
  _posClientsInitialized = true;
}

export function getPosClientsData(): POSClient[] {
  ensurePosClientsInitialized();
  return _posClients;
}

export { subscribePosClients };

export const MOCK_POS_CLIENTS: POSClient[] = new Proxy(SEED_POS_CLIENTS as POSClient[], {
  get(_target, prop, receiver) {
    ensurePosClientsInitialized();
    return Reflect.get(_posClients, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Store Inventory
// ============================================================================

let _storeInventory: StoreInventoryItem[] = SEED_STORE_INVENTORY;
let _storeInventoryInitialized = false;
const { subscribe: subscribeStoreInventory, notify: _notifyStoreInventory } = createSubscribers();

function ensureStoreInventoryInitialized(): void {
  if (typeof window === 'undefined' || _storeInventoryInitialized) return;
  _storeInventory = loadCollection<StoreInventoryItem>('store_inventory', SEED_STORE_INVENTORY);
  _storeInventoryInitialized = true;
}

export function getStoreInventoryData(): StoreInventoryItem[] {
  ensureStoreInventoryInitialized();
  return _storeInventory;
}

export { subscribeStoreInventory };

export const MOCK_STORE_INVENTORY: StoreInventoryItem[] = new Proxy(SEED_STORE_INVENTORY as StoreInventoryItem[], {
  get(_target, prop, receiver) {
    ensureStoreInventoryInitialized();
    return Reflect.get(_storeInventory, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – POS Returns
// ============================================================================

let _posReturns: POSReturn[] = SEED_POS_RETURNS;
let _posReturnsInitialized = false;
const { subscribe: subscribePosReturns, notify: _notifyPosReturns } = createSubscribers();

function ensurePosReturnsInitialized(): void {
  if (typeof window === 'undefined' || _posReturnsInitialized) return;
  _posReturns = loadCollection<POSReturn>('pos_returns', SEED_POS_RETURNS);
  _posReturnsInitialized = true;
}

export function getPosReturnsData(): POSReturn[] {
  ensurePosReturnsInitialized();
  return _posReturns;
}

export { subscribePosReturns };

export const MOCK_POS_RETURNS: POSReturn[] = new Proxy(SEED_POS_RETURNS as POSReturn[], {
  get(_target, prop, receiver) {
    ensurePosReturnsInitialized();
    return Reflect.get(_posReturns, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Product Categories
// ============================================================================

let _productCategories: ProductCategory[] = SEED_PRODUCT_CATEGORIES;
let _productCategoriesInitialized = false;
const { subscribe: subscribeProductCategories, notify: _notifyProductCategories } = createSubscribers();

function ensureProductCategoriesInitialized(): void {
  if (typeof window === 'undefined' || _productCategoriesInitialized) return;
  _productCategories = loadCollection<ProductCategory>('product_categories', SEED_PRODUCT_CATEGORIES);
  _productCategoriesInitialized = true;
}

export function getProductCategoriesData(): ProductCategory[] {
  ensureProductCategoriesInitialized();
  return _productCategories;
}

export { subscribeProductCategories };

export const MOCK_PRODUCT_CATEGORIES: ProductCategory[] = new Proxy(SEED_PRODUCT_CATEGORIES as ProductCategory[], {
  get(_target, prop, receiver) {
    ensureProductCategoriesInitialized();
    return Reflect.get(_productCategories, prop, receiver);
  },
});

// ============================================================================
// CRUD OPERATIONS – POS Orders
// ============================================================================

export function addPosOrder(order: POSOrder): void {
  ensurePosOrdersInitialized();
  _posOrders = [..._posOrders, order];
  saveCollection('pos_orders', _posOrders);
  _notifyPosOrders();
}

export function updatePosOrder(id: string, updates: Partial<POSOrder>): void {
  ensurePosOrdersInitialized();
  _posOrders = _posOrders.map((o) => (o.id === id ? { ...o, ...updates } : o));
  saveCollection('pos_orders', _posOrders);
  _notifyPosOrders();
}

export function removePosOrder(id: string): void {
  ensurePosOrdersInitialized();
  _posOrders = _posOrders.filter((o) => o.id !== id);
  saveCollection('pos_orders', _posOrders);
  _notifyPosOrders();
}

// ============================================================================
// CRUD OPERATIONS – Cash Register (singleton)
// ============================================================================

export function updateCashRegister(updates: Partial<CashRegister>): void {
  ensureCashRegisterInitialized();
  _cashRegister = { ..._cashRegister, ...updates };
  saveSingleton('cash_register', _cashRegister);
  _notifyCashRegister();
}

// ============================================================================
// CRUD OPERATIONS – Cash Closings
// ============================================================================

export function addCashClosing(closing: CashRegisterClosing): void {
  ensureCashClosingsInitialized();
  _cashClosings = [..._cashClosings, closing];
  saveCollection('cash_closings', _cashClosings);
  _notifyCashClosings();
}

export function updateCashClosing(id: string, updates: Partial<CashRegisterClosing>): void {
  ensureCashClosingsInitialized();
  _cashClosings = _cashClosings.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCollection('cash_closings', _cashClosings);
  _notifyCashClosings();
}

export function removeCashClosing(id: string): void {
  ensureCashClosingsInitialized();
  _cashClosings = _cashClosings.filter((c) => c.id !== id);
  saveCollection('cash_closings', _cashClosings);
  _notifyCashClosings();
}

// ============================================================================
// CRUD OPERATIONS – Cash Movements
// ============================================================================

export function addCashMovement(movement: CashMovement): void {
  ensureCashMovementsInitialized();
  _cashMovements = [..._cashMovements, movement];
  saveCollection('cash_movements', _cashMovements);
  _notifyCashMovements();
}

export function updateCashMovement(id: string, updates: Partial<CashMovement>): void {
  ensureCashMovementsInitialized();
  _cashMovements = _cashMovements.map((m) => (m.id === id ? { ...m, ...updates } : m));
  saveCollection('cash_movements', _cashMovements);
  _notifyCashMovements();
}

export function removeCashMovement(id: string): void {
  ensureCashMovementsInitialized();
  _cashMovements = _cashMovements.filter((m) => m.id !== id);
  saveCollection('cash_movements', _cashMovements);
  _notifyCashMovements();
}

// ============================================================================
// CRUD OPERATIONS – POS Clients
// ============================================================================

export function addPosClient(client: POSClient): void {
  ensurePosClientsInitialized();
  _posClients = [..._posClients, client];
  saveCollection('pos_clients', _posClients);
  _notifyPosClients();
}

export function updatePosClient(id: string, updates: Partial<POSClient>): void {
  ensurePosClientsInitialized();
  _posClients = _posClients.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCollection('pos_clients', _posClients);
  _notifyPosClients();
}

export function removePosClient(id: string): void {
  ensurePosClientsInitialized();
  _posClients = _posClients.filter((c) => c.id !== id);
  saveCollection('pos_clients', _posClients);
  _notifyPosClients();
}

// ============================================================================
// CRUD OPERATIONS – Store Inventory
// ============================================================================

export function addStoreInventoryItem(item: StoreInventoryItem): void {
  ensureStoreInventoryInitialized();
  _storeInventory = [..._storeInventory, item];
  saveCollection('store_inventory', _storeInventory);
  _notifyStoreInventory();
}

export function updateStoreInventoryItem(productId: string, updates: Partial<StoreInventoryItem>): void {
  ensureStoreInventoryInitialized();
  _storeInventory = _storeInventory.map((i) => (i.productId === productId ? { ...i, ...updates } : i));
  saveCollection('store_inventory', _storeInventory);
  _notifyStoreInventory();
}

export function removeStoreInventoryItem(productId: string): void {
  ensureStoreInventoryInitialized();
  _storeInventory = _storeInventory.filter((i) => i.productId !== productId);
  saveCollection('store_inventory', _storeInventory);
  _notifyStoreInventory();
}

// ============================================================================
// CRUD OPERATIONS – POS Returns
// ============================================================================

export function addPosReturn(ret: POSReturn): void {
  ensurePosReturnsInitialized();
  _posReturns = [..._posReturns, ret];
  saveCollection('pos_returns', _posReturns);
  _notifyPosReturns();
}

export function updatePosReturn(id: string, updates: Partial<POSReturn>): void {
  ensurePosReturnsInitialized();
  _posReturns = _posReturns.map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveCollection('pos_returns', _posReturns);
  _notifyPosReturns();
}

export function removePosReturn(id: string): void {
  ensurePosReturnsInitialized();
  _posReturns = _posReturns.filter((r) => r.id !== id);
  saveCollection('pos_returns', _posReturns);
  _notifyPosReturns();
}

// ============================================================================
// CRUD OPERATIONS – Product Categories
// ============================================================================

export function addProductCategory(category: ProductCategory): void {
  ensureProductCategoriesInitialized();
  _productCategories = [..._productCategories, category];
  saveCollection('product_categories', _productCategories);
  _notifyProductCategories();
}

export function updateProductCategory(id: string, updates: Partial<ProductCategory>): void {
  ensureProductCategoriesInitialized();
  _productCategories = _productCategories.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCollection('product_categories', _productCategories);
  _notifyProductCategories();
}

export function removeProductCategory(id: string): void {
  ensureProductCategoriesInitialized();
  _productCategories = _productCategories.filter((c) => c.id !== id);
  saveCollection('product_categories', _productCategories);
  _notifyProductCategories();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get POS dashboard stats for today.
 */
export function getPOSStats(): POSStats {
  ensurePosOrdersInitialized();
  ensureStoreInventoryInitialized();
  ensureCashRegisterInitialized();

  const today = '2026-02-27';
  const yesterday = '2026-02-26';

  const todayOrders = _posOrders.filter(
    (o) => o.createdAt.startsWith(today) && o.status !== 'cancelada'
  );
  const yesterdayOrders = _posOrders.filter(
    (o) => o.createdAt.startsWith(yesterday) && o.status !== 'cancelada'
  );

  const salesToday = r2(todayOrders.reduce((s, o) => s + o.total, 0));
  const salesYesterday = r2(yesterdayOrders.reduce((s, o) => s + o.total, 0));
  const transactionsToday = todayOrders.length;
  const averageTicket = transactionsToday > 0 ? r2(salesToday / transactionsToday) : 0;

  // Top product by units sold today
  const productUnits: Record<string, { name: string; qty: number }> = {};
  for (const order of todayOrders) {
    for (const line of order.lines) {
      if (!productUnits[line.productId]) {
        productUnits[line.productId] = { name: line.productName, qty: 0 };
      }
      productUnits[line.productId].qty += line.quantity;
    }
  }
  const topProduct = Object.values(productUnits).sort((a, b) => b.qty - a.qty)[0];

  const lowStockAlerts = _storeInventory.filter(
    (i) => i.stockStatus === 'bajo' || i.stockStatus === 'agotado'
  ).length;

  return {
    salesToday,
    salesYesterday,
    transactionsToday,
    averageTicket,
    topProductToday: topProduct?.name ?? '-',
    cashRegisterStatus: _cashRegister.status,
    lowStockAlerts,
  };
}

/**
 * Get all orders from today.
 */
export function getTodayOrders(): POSOrder[] {
  ensurePosOrdersInitialized();
  return _posOrders.filter((o) => o.createdAt.startsWith('2026-02-27'));
}

/**
 * Get store inventory item for a specific product.
 */
export function getStoreStock(productId: string): StoreInventoryItem | undefined {
  ensureStoreInventoryInitialized();
  return _storeInventory.find((i) => i.productId === productId);
}

/**
 * Get a summary of the current cash register state.
 */
export function getCashRegisterSummary(): {
  status: CashRegister['status'];
  initialFund: number;
  cashSalesToday: number;
  cardSalesToday: number;
  transferSalesToday: number;
  totalSalesToday: number;
  cashEntries: number;
  cashExits: number;
  expectedCash: number;
  transactionsToday: number;
} {
  ensurePosOrdersInitialized();
  ensureCashMovementsInitialized();
  ensureCashRegisterInitialized();

  const today = '2026-02-27';
  const todayOrders = _posOrders.filter(
    (o) => o.createdAt.startsWith(today) && o.status !== 'cancelada'
  );

  let cashSalesToday = 0;
  let cardSalesToday = 0;
  let transferSalesToday = 0;

  for (const order of todayOrders) {
    for (const payment of order.payments) {
      switch (payment.method) {
        case 'efectivo':
          cashSalesToday = r2(cashSalesToday + payment.amount - (order.changeGiven ?? 0));
          break;
        case 'tarjeta_debito':
        case 'tarjeta_credito':
          cardSalesToday = r2(cardSalesToday + payment.amount);
          break;
        case 'transferencia':
          transferSalesToday = r2(transferSalesToday + payment.amount);
          break;
        default:
          break;
      }
    }
  }

  const totalSalesToday = r2(todayOrders.reduce((s, o) => s + o.total, 0));

  // Today's movements
  const todayMovements = _cashMovements.filter((m) => m.createdAt.startsWith(today));
  const cashEntries = r2(
    todayMovements.filter((m) => m.type === 'entrada').reduce((s, m) => s + m.amount, 0)
  );
  const cashExits = r2(
    todayMovements
      .filter((m) => m.type === 'salida' || m.type === 'retiro_parcial')
      .reduce((s, m) => s + m.amount, 0)
  );

  const initialFund = _cashRegister.currentOpening?.initialFund ?? 200;
  const expectedCash = r2(initialFund + cashSalesToday + cashEntries - cashExits);

  return {
    status: _cashRegister.status,
    initialFund,
    cashSalesToday,
    cardSalesToday,
    transferSalesToday,
    totalSalesToday,
    cashEntries,
    cashExits,
    expectedCash,
    transactionsToday: todayOrders.length,
  };
}

/**
 * Get daily report for a given date (ISO date string YYYY-MM-DD).
 */
export function getDailyReport(date: string): POSDailyReport {
  ensurePosOrdersInitialized();
  ensurePosReturnsInitialized();

  const dayOrders = _posOrders.filter(
    (o) => o.createdAt.startsWith(date) && o.status !== 'cancelada'
  );
  const dayReturns = _posReturns.filter((r) => r.createdAt.startsWith(date));

  const grossSales = r2(dayOrders.reduce((s, o) => s + o.subtotal, 0));
  const returns = r2(dayReturns.reduce((s, r) => s + r.totalAmount, 0));
  const discounts = r2(dayOrders.reduce((s, o) => s + o.discountTotal, 0));
  const netSales = r2(grossSales - returns - discounts);
  const transactionCount = dayOrders.length;
  const averageTicket = transactionCount > 0 ? r2(netSales / transactionCount) : 0;

  // By payment method
  const methodMap: Record<string, { amount: number; count: number }> = {};
  for (const order of dayOrders) {
    for (const p of order.payments) {
      const key = p.method === 'tarjeta_debito' || p.method === 'tarjeta_credito'
        ? p.method
        : p.method;
      if (!methodMap[key]) methodMap[key] = { amount: 0, count: 0 };
      methodMap[key].amount = r2(methodMap[key].amount + p.amount);
      methodMap[key].count += 1;
    }
  }
  const byPaymentMethod = Object.entries(methodMap).map(([method, data]) => ({
    method: method as POSOrder['payments'][0]['method'],
    amount: data.amount,
    count: data.count,
  }));

  // By cashier
  const cashierMap: Record<string, { amount: number; count: number }> = {};
  for (const order of dayOrders) {
    if (!cashierMap[order.cashierName]) cashierMap[order.cashierName] = { amount: 0, count: 0 };
    cashierMap[order.cashierName].amount = r2(cashierMap[order.cashierName].amount + order.total);
    cashierMap[order.cashierName].count += 1;
  }
  const byCashier = Object.entries(cashierMap).map(([name, data]) => ({
    name,
    amount: data.amount,
    count: data.count,
  }));

  // By hour
  const hourMap: Record<number, { amount: number; count: number }> = {};
  for (const order of dayOrders) {
    const hour = new Date(order.createdAt).getUTCHours();
    if (!hourMap[hour]) hourMap[hour] = { amount: 0, count: 0 };
    hourMap[hour].amount = r2(hourMap[hour].amount + order.total);
    hourMap[hour].count += 1;
  }
  const byHour = Object.entries(hourMap)
    .map(([h, data]) => ({ hour: Number(h), amount: data.amount, count: data.count }))
    .sort((a, b) => a.hour - b.hour);

  return {
    date,
    grossSales,
    returns,
    discounts,
    netSales,
    averageTicket,
    transactionCount,
    byPaymentMethod,
    byCashier,
    byHour,
  };
}

/**
 * Get top-selling products ranked by units sold across all orders.
 */
export function getTopProducts(limit: number = 10): POSProductRanking[] {
  ensurePosOrdersInitialized();

  const productMap: Record<
    string,
    { name: string; group: string; units: number; revenue: number }
  > = {};

  const completedOrders = _posOrders.filter((o) => o.status === 'completada');
  for (const order of completedOrders) {
    for (const line of order.lines) {
      if (!productMap[line.productId]) {
        productMap[line.productId] = {
          name: line.productName,
          group: line.productGroup,
          units: 0,
          revenue: 0,
        };
      }
      productMap[line.productId].units += line.quantity;
      productMap[line.productId].revenue = r2(productMap[line.productId].revenue + line.subtotal);
    }
  }

  const totalRevenue = Object.values(productMap).reduce((s, p) => s + p.revenue, 0);

  const ranked = Object.entries(productMap)
    .map(([id, data]) => ({
      productId: id,
      productName: data.name,
      productGroup: data.group,
      unitsSold: data.units,
      revenue: data.revenue,
      percentOfTotal: totalRevenue > 0 ? r2((data.revenue / totalRevenue) * 100) : 0,
      trend: (data.units >= 5 ? 'up' : data.units >= 3 ? 'stable' : 'down') as
        | 'up'
        | 'down'
        | 'stable',
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold);

  return ranked.slice(0, limit);
}
