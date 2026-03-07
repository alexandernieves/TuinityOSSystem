/**
 * Mock data for Sales Orders (Ventas B2B module)
 * Based on Document 005 specifications
 *
 * Pipeline: BORRADOR → COTIZADO → PEDIDO → APROBADO → EMPACADO → FACTURADO
 */

import type { PriceLevel } from '@/lib/types/client';
import type {
  SalesOrder,
  SalesOrderLine,
  SalesOrderStatus,
  SalesOrderFilters,
  SalesStats,
  DocumentType,
  AdditionalExpense,
  Invoice,
  Return,
} from '@/lib/types/sales-order';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';
import { MOCK_PRODUCTS } from './products';
import { MOCK_CLIENTS } from './clients';

// ============================================================================
// HELPER: Calculate margins and commission
// ============================================================================

/**
 * Calculate if a line is commission eligible (margin >= 10%)
 */
export function calculateCommissionEligible(
  unitPrice: number,
  unitCost: number
): boolean {
  if (unitPrice <= 0) return false;
  const marginPercent = ((unitPrice - unitCost) / unitPrice) * 100;
  return marginPercent >= 10;
}

/**
 * Get price for product at given level
 */
export function getProductPrice(productId: string, priceLevel: PriceLevel): number {
  const product = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!product) return 0;
  return product.prices[priceLevel];
}

/**
 * Get product cost (weighted average)
 */
export function getProductCost(productId: string): number {
  const product = MOCK_PRODUCTS.find((p) => p.id === productId);
  return product?.costAvgWeighted || product?.costCIF || 0;
}

// ============================================================================
// MOCK SALES ORDERS
// ============================================================================

const SEED_SALES_ORDERS: SalesOrder[] = [
  // ========== BORRADOR (Drafts) ==========
  {
    id: 'COT-04355',
    orderNumber: 'COT-04355',
    documentType: 'cotizacion',
    status: 'borrador',
    createdAt: '2026-02-24T09:30:00Z',
    updatedAt: '2026-02-24T09:30:00Z',
    customerId: 'CLI-00077',
    customerName: 'MEDIMEX, S.A.',
    customerTaxId: '155678-1-456789',
    customerCountry: 'Panamá',
    priceLevel: 'B',
    paymentTerms: 'credito_30',
    validUntil: '2026-03-10T23:59:59Z',
    lines: [
      {
        id: 'LINE-001',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 50,
        priceLevel: 'B',
        unitPrice: 115,
        originalPrice: 115,
        discount: 0,
        subtotal: 5750,
        unitCost: 83.95,
        totalCost: 4197.5,
        marginAmount: 1552.5,
        marginPercent: 27.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-002',
        productId: 'EVL-00005',
        productReference: 'EVL-00005',
        productDescription: 'WHISKY JOHNNIE WALKER BLACK LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 30,
        priceLevel: 'B',
        unitPrice: 165,
        originalPrice: 165,
        discount: 0,
        subtotal: 4950,
        unitCost: 125.35,
        totalCost: 3760.5,
        marginAmount: 1189.5,
        marginPercent: 24.0,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 10700,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 10700,
    totalCost: 7958,
    totalMargin: 2742,
    marginPercent: 25.6,
    commissionableAmount: 10700,
    createdBy: 'USR-001',
    createdByName: 'Javier Lange',
    requiresApproval: false,
  },

  // ========== COTIZADO (Quotes sent) ==========
  {
    id: 'COT-04350',
    orderNumber: 'COT-04350',
    documentType: 'cotizacion',
    status: 'cotizado',
    createdAt: '2026-02-24T08:00:00Z',
    updatedAt: '2026-02-24T10:30:00Z',
    customerId: 'CLI-00032',
    customerName: 'PONCHO PLACE',
    customerTaxId: '900123456-7',
    customerCountry: 'Colombia',
    priceLevel: 'B',
    paymentTerms: 'contado',
    validUntil: '2026-03-08T23:59:59Z',
    lines: [
      {
        id: 'LINE-003',
        productId: 'EVL-00003',
        productReference: 'EVL-00003',
        productDescription: 'WHISKY BUCHANAN\'S 12 AÑOS 750ML',
        productGroup: 'WHISKY',
        productBrand: 'BUCHANAN\'S',
        quantity: 40,
        priceLevel: 'B',
        unitPrice: 135,
        originalPrice: 135,
        discount: 0,
        subtotal: 5400,
        lastPriceToCustomer: 135,
        unitCost: 98.50,
        totalCost: 3940,
        marginAmount: 1460,
        marginPercent: 27.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-004',
        productId: 'EVL-00015',
        productReference: 'EVL-00015',
        productDescription: 'TEQUILA PATRÓN SILVER 750ML',
        productGroup: 'TEQUILA',
        productBrand: 'PATRÓN',
        quantity: 20,
        priceLevel: 'B',
        unitPrice: 125,
        originalPrice: 125,
        discount: 0,
        subtotal: 2500,
        unitCost: 92.00,
        totalCost: 1840,
        marginAmount: 660,
        marginPercent: 26.4,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [
      {
        id: 'EXP-001',
        description: 'Flete Bogotá',
        amount: 50,
        taxable: false,
      },
    ],
    subtotal: 7900,
    discountTotal: 0,
    expensesTotal: 50,
    taxRate: 0,
    taxAmount: 0,
    total: 7950,
    totalCost: 5780,
    totalMargin: 2120,
    marginPercent: 26.8,
    commissionableAmount: 7900,
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
    requiresApproval: false,
  },
  {
    id: 'COT-04342',
    orderNumber: 'COT-04342',
    documentType: 'cotizacion',
    status: 'cotizado',
    createdAt: '2026-02-19T14:00:00Z',
    updatedAt: '2026-02-19T14:30:00Z',
    customerId: 'CLI-00979',
    customerName: 'GIACOMO PAOLO LECCESE TURCONI',
    customerTaxId: 'IT-12345678901',
    customerCountry: 'Italia',
    priceLevel: 'B',
    paymentTerms: 'contado',
    validUntil: '2026-03-05T23:59:59Z',
    lines: [
      {
        id: 'LINE-005',
        productId: 'EVL-00007',
        productReference: 'EVL-00007',
        productDescription: 'WHISKY GLENFIDDICH 12 AÑOS 750ML',
        productGroup: 'WHISKY',
        productBrand: 'GLENFIDDICH',
        quantity: 25,
        priceLevel: 'B',
        unitPrice: 195,
        originalPrice: 195,
        discount: 0,
        subtotal: 4875,
        unitCost: 145.00,
        totalCost: 3625,
        marginAmount: 1250,
        marginPercent: 25.6,
        commissionEligible: true,
      },
      {
        id: 'LINE-006',
        productId: 'EVL-00009',
        productReference: 'EVL-00009',
        productDescription: 'WHISKY MONKEY SHOULDER 750ML',
        productGroup: 'WHISKY',
        productBrand: 'MONKEY SHOULDER',
        quantity: 30,
        priceLevel: 'B',
        unitPrice: 110,
        originalPrice: 110,
        discount: 0,
        subtotal: 3300,
        unitCost: 78.50,
        totalCost: 2355,
        marginAmount: 945,
        marginPercent: 28.6,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [
      {
        id: 'EXP-002',
        description: 'Embalaje especial exportación',
        amount: 165,
        taxable: false,
      },
    ],
    subtotal: 8175,
    discountTotal: 0,
    expensesTotal: 165,
    taxRate: 0,
    taxAmount: 0,
    total: 8340,
    totalCost: 5980,
    totalMargin: 2195,
    marginPercent: 26.8,
    commissionableAmount: 8175,
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
    requiresApproval: false,
  },

  // ========== PEDIDO (Orders confirmed, pending approval) ==========
  {
    id: 'PED-06560',
    orderNumber: 'PED-06560',
    documentType: 'pedido',
    status: 'pedido',
    createdAt: '2026-02-24T08:00:00Z',
    updatedAt: '2026-02-24T08:30:00Z',
    customerId: 'CLI-00032',
    customerName: 'PONCHO PLACE',
    customerTaxId: '900123456-7',
    customerCountry: 'Colombia',
    priceLevel: 'B',
    paymentTerms: 'contado',
    requestedDeliveryDate: '2026-03-01T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    quoteId: 'COT-04350',
    quoteNumber: 'COT-04350',
    lines: [
      {
        id: 'LINE-007',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 35,
        priceLevel: 'B',
        unitPrice: 115,
        originalPrice: 115,
        discount: 0,
        subtotal: 4025,
        lastPriceToCustomer: 115,
        unitCost: 83.95,
        totalCost: 2938.25,
        marginAmount: 1086.75,
        marginPercent: 27.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-008',
        productId: 'EVL-00018',
        productReference: 'EVL-00018',
        productDescription: 'VODKA ABSOLUT 750ML',
        productGroup: 'VODKA',
        productBrand: 'ABSOLUT',
        quantity: 10,
        priceLevel: 'B',
        unitPrice: 55,
        originalPrice: 55,
        discount: 0,
        subtotal: 550,
        unitCost: 52.00,
        totalCost: 520,
        marginAmount: 30,
        marginPercent: 5.5,
        commissionEligible: false, // Below 10% threshold
      },
    ],
    additionalExpenses: [],
    subtotal: 4575,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 4575,
    totalCost: 3458.25,
    totalMargin: 1116.75,
    marginPercent: 24.4,
    commissionableAmount: 4025, // Only the JW Red line
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
    requiresApproval: true, // Has line below 10% margin
    notes: 'Cliente solicita entrega urgente primera semana de marzo.',
  },
  {
    id: 'PED-06554',
    orderNumber: 'PED-06554',
    documentType: 'pedido',
    status: 'pedido',
    createdAt: '2026-02-23T10:00:00Z',
    updatedAt: '2026-02-23T10:30:00Z',
    customerId: 'CLI-00007',
    customerName: 'MARIA DEL MAR PEREZ SV',
    customerTaxId: '0614-150120-102-7',
    customerCountry: 'El Salvador',
    priceLevel: 'B',
    paymentTerms: 'credito_30',
    requestedDeliveryDate: '2026-03-05T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    lines: [
      {
        id: 'LINE-009',
        productId: 'EVL-00005',
        productReference: 'EVL-00005',
        productDescription: 'WHISKY JOHNNIE WALKER BLACK LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 40,
        priceLevel: 'B',
        unitPrice: 165,
        originalPrice: 165,
        discount: 0,
        subtotal: 6600,
        lastPriceToCustomer: 165,
        unitCost: 125.35,
        totalCost: 5014,
        marginAmount: 1586,
        marginPercent: 24.0,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 6600,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 6600,
    totalCost: 5014,
    totalMargin: 1586,
    marginPercent: 24.0,
    commissionableAmount: 6600,
    createdBy: 'USR-001',
    createdByName: 'Javier Lange',
    requiresApproval: false,
  },

  // ========== APROBADO (Approved, ready for packing) ==========
  {
    id: 'PED-06552',
    orderNumber: 'PED-06552',
    documentType: 'pedido',
    status: 'aprobado',
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-21T11:00:00Z',
    customerId: 'CLI-00007',
    customerName: 'MARIA DEL MAR PEREZ SV',
    customerTaxId: '0614-150120-102-7',
    customerCountry: 'El Salvador',
    priceLevel: 'B',
    paymentTerms: 'credito_30',
    requestedDeliveryDate: '2026-02-28T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    lines: [
      {
        id: 'LINE-010',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 60,
        priceLevel: 'B',
        unitPrice: 115,
        originalPrice: 115,
        discount: 0,
        subtotal: 6900,
        unitCost: 83.95,
        totalCost: 5037,
        marginAmount: 1863,
        marginPercent: 27.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-011',
        productId: 'EVL-00012',
        productReference: 'EVL-00012',
        productDescription: 'RON DIPLOMÁTICO RESERVA EXCLUSIVA 750ML',
        productGroup: 'RON',
        productBrand: 'DIPLOMÁTICO',
        quantity: 15,
        priceLevel: 'B',
        unitPrice: 115,
        originalPrice: 115,
        discount: 0,
        subtotal: 1725,
        unitCost: 82.50,
        totalCost: 1237.5,
        marginAmount: 487.5,
        marginPercent: 28.3,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 8625,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 8625,
    totalCost: 6274.5,
    totalMargin: 2350.5,
    marginPercent: 27.3,
    commissionableAmount: 8625,
    createdBy: 'USR-001',
    createdByName: 'Javier Lange',
    requiresApproval: false,
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvalDate: '2026-02-21T11:00:00Z',
  },
  {
    id: 'PED-06544',
    orderNumber: 'PED-06544',
    documentType: 'pedido',
    status: 'aprobado',
    createdAt: '2026-02-19T11:00:00Z',
    updatedAt: '2026-02-19T15:00:00Z',
    customerId: 'CLI-00896',
    customerName: 'INVERSIONES DISCARIBBEAN SAS',
    customerTaxId: '860034567-1',
    customerCountry: 'Colombia',
    priceLevel: 'C',
    paymentTerms: 'contado',
    requestedDeliveryDate: '2026-02-26T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    quoteId: 'COT-04337',
    quoteNumber: 'COT-04337',
    lines: [
      {
        id: 'LINE-012',
        productId: 'EVL-00006',
        productReference: 'EVL-00006',
        productDescription: 'WHISKY JOHNNIE WALKER GREEN LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 10,
        priceLevel: 'C',
        unitPrice: 190,
        originalPrice: 190,
        discount: 0,
        subtotal: 1900,
        unitCost: 142.50,
        totalCost: 1425,
        marginAmount: 475,
        marginPercent: 25.0,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [
      {
        id: 'EXP-003',
        description: 'Flete Cartagena',
        amount: 50,
        taxable: false,
      },
    ],
    subtotal: 1900,
    discountTotal: 0,
    expensesTotal: 50,
    taxRate: 0,
    taxAmount: 0,
    total: 1950,
    totalCost: 1425,
    totalMargin: 475,
    marginPercent: 25.0,
    commissionableAmount: 1900,
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
    requiresApproval: false,
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvalDate: '2026-02-19T15:00:00Z',
  },

  // ========== EMPACADO (Packed, ready for invoicing) ==========
  {
    id: 'PED-06507',
    orderNumber: 'PED-06507',
    documentType: 'pedido',
    status: 'empacado',
    createdAt: '2026-02-04T09:00:00Z',
    updatedAt: '2026-02-22T16:00:00Z',
    customerId: 'CLI-00077',
    customerName: 'MEDIMEX, S.A.',
    customerTaxId: '155678-1-456789',
    customerCountry: 'Panamá',
    priceLevel: 'B',
    paymentTerms: 'credito_30',
    requestedDeliveryDate: '2026-02-25T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    lines: [
      {
        id: 'LINE-013',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 100,
        priceLevel: 'B',
        unitPrice: 115,
        originalPrice: 115,
        discount: 0,
        subtotal: 11500,
        unitCost: 83.95,
        totalCost: 8395,
        marginAmount: 3105,
        marginPercent: 27.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-014',
        productId: 'EVL-00003',
        productReference: 'EVL-00003',
        productDescription: 'WHISKY BUCHANAN\'S 12 AÑOS 750ML',
        productGroup: 'WHISKY',
        productBrand: 'BUCHANAN\'S',
        quantity: 10,
        priceLevel: 'B',
        unitPrice: 135,
        originalPrice: 135,
        discount: 0,
        subtotal: 1350,
        unitCost: 98.50,
        totalCost: 985,
        marginAmount: 365,
        marginPercent: 27.0,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 12850,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 12850,
    totalCost: 9380,
    totalMargin: 3470,
    marginPercent: 27.0,
    commissionableAmount: 12850,
    createdBy: 'USR-001',
    createdByName: 'Javier Lange',
    requiresApproval: false,
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvalDate: '2026-02-05T10:00:00Z',
    packedBy: 'USR-008',
    packedByName: 'Carlos Bodega',
    packedAt: '2026-02-22T16:00:00Z',
  },

  // ========== FACTURADO (Invoiced) ==========
  {
    id: 'PED-06501',
    orderNumber: 'PED-06501',
    documentType: 'pedido',
    status: 'facturado',
    createdAt: '2026-01-30T11:00:00Z',
    updatedAt: '2026-02-20T14:00:00Z',
    customerId: 'CLI-00509',
    customerName: 'SULTAN WHOLESALE',
    customerTaxId: '98-7654321',
    customerCountry: 'Estados Unidos',
    priceLevel: 'A',
    paymentTerms: 'credito_60',
    requestedDeliveryDate: '2026-02-15T00:00:00Z',
    actualDeliveryDate: '2026-02-18T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    quoteId: 'COT-04302',
    quoteNumber: 'COT-04302',
    invoiceId: 'FAC-04420',
    invoiceNumber: 'FAC-04420',
    lines: [
      {
        id: 'LINE-015',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 500,
        priceLevel: 'A',
        unitPrice: 120,
        originalPrice: 120,
        discount: 0,
        subtotal: 60000,
        unitCost: 83.95,
        totalCost: 41975,
        marginAmount: 18025,
        marginPercent: 30.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-016',
        productId: 'EVL-00005',
        productReference: 'EVL-00005',
        productDescription: 'WHISKY JOHNNIE WALKER BLACK LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 300,
        priceLevel: 'A',
        unitPrice: 170,
        originalPrice: 170,
        discount: 0,
        subtotal: 51000,
        unitCost: 125.35,
        totalCost: 37605,
        marginAmount: 13395,
        marginPercent: 26.3,
        commissionEligible: true,
      },
      {
        id: 'LINE-017',
        productId: 'EVL-00007',
        productReference: 'EVL-00007',
        productDescription: 'WHISKY GLENFIDDICH 12 AÑOS 750ML',
        productGroup: 'WHISKY',
        productBrand: 'GLENFIDDICH',
        quantity: 200,
        priceLevel: 'A',
        unitPrice: 200,
        originalPrice: 200,
        discount: 0,
        subtotal: 40000,
        unitCost: 145.00,
        totalCost: 29000,
        marginAmount: 11000,
        marginPercent: 27.5,
        commissionEligible: true,
      },
      {
        id: 'LINE-018',
        productId: 'EVL-00012',
        productReference: 'EVL-00012',
        productDescription: 'RON DIPLOMÁTICO RESERVA EXCLUSIVA 750ML',
        productGroup: 'RON',
        productBrand: 'DIPLOMÁTICO',
        quantity: 250,
        priceLevel: 'A',
        unitPrice: 120,
        originalPrice: 120,
        discount: 0,
        subtotal: 30000,
        unitCost: 82.50,
        totalCost: 20625,
        marginAmount: 9375,
        marginPercent: 31.3,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 181000,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 181000,
    totalCost: 129205,
    totalMargin: 51795,
    marginPercent: 28.6,
    commissionableAmount: 181000,
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
    requiresApproval: false,
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvalDate: '2026-02-01T09:00:00Z',
    packedBy: 'USR-008',
    packedByName: 'Carlos Bodega',
    packedAt: '2026-02-10T14:00:00Z',
    notes: 'Pedido grande - cliente recurrente VIP',
  },
  {
    id: 'PED-06483',
    orderNumber: 'PED-06483',
    documentType: 'pedido',
    status: 'facturado',
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z',
    customerId: 'CLI-00007',
    customerName: 'MARIA DEL MAR PEREZ SV',
    customerTaxId: '0614-150120-102-7',
    customerCountry: 'El Salvador',
    priceLevel: 'B',
    paymentTerms: 'credito_30',
    actualDeliveryDate: '2026-02-12T00:00:00Z',
    dispatchType: 'salida',
    bodegaId: 'BOD-ZL',
    bodegaName: 'Zona Libre',
    invoiceId: 'FAC-04415',
    invoiceNumber: 'FAC-04415',
    lines: [
      {
        id: 'LINE-019',
        productId: 'EVL-00018',
        productReference: 'EVL-00018',
        productDescription: 'VODKA ABSOLUT 750ML',
        productGroup: 'VODKA',
        productBrand: 'ABSOLUT',
        quantity: 10,
        priceLevel: 'B',
        unitPrice: 55,
        originalPrice: 55,
        discount: 0,
        subtotal: 550,
        unitCost: 38.50,
        totalCost: 385,
        marginAmount: 165,
        marginPercent: 30.0,
        commissionEligible: true,
      },
      {
        id: 'LINE-020',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 5,
        priceLevel: 'B',
        unitPrice: 115,
        originalPrice: 115,
        discount: 0,
        subtotal: 575,
        unitCost: 83.95,
        totalCost: 419.75,
        marginAmount: 155.25,
        marginPercent: 27.0,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 1125,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 1125,
    totalCost: 804.75,
    totalMargin: 320.25,
    marginPercent: 28.5,
    commissionableAmount: 1125,
    createdBy: 'USR-001',
    createdByName: 'Javier Lange',
    requiresApproval: false,
    approvedBy: 'USR-001',
    approvedByName: 'Javier Lange',
    approvalDate: '2026-01-23T09:00:00Z',
    packedBy: 'USR-008',
    packedByName: 'Carlos Bodega',
    packedAt: '2026-02-10T10:00:00Z',
  },

  // ========== CANCELADO ==========
  {
    id: 'PED-06490',
    orderNumber: 'PED-06490',
    documentType: 'pedido',
    status: 'cancelado',
    createdAt: '2026-01-25T11:00:00Z',
    updatedAt: '2026-01-28T09:00:00Z',
    customerId: 'CLI-00890',
    customerName: 'GUILLERMO SOSA VELEZ',
    customerTaxId: '8-234-567',
    customerCountry: 'Panamá',
    priceLevel: 'C',
    paymentTerms: 'credito_30',
    lines: [
      {
        id: 'LINE-021',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED LABEL 750ML',
        productGroup: 'WHISKY',
        productBrand: 'JOHNNIE WALKER',
        quantity: 50,
        priceLevel: 'C',
        unitPrice: 110,
        originalPrice: 110,
        discount: 0,
        subtotal: 5500,
        unitCost: 83.95,
        totalCost: 4197.5,
        marginAmount: 1302.5,
        marginPercent: 23.7,
        commissionEligible: true,
      },
    ],
    additionalExpenses: [],
    subtotal: 5500,
    discountTotal: 0,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 5500,
    totalCost: 4197.5,
    totalMargin: 1302.5,
    marginPercent: 23.7,
    commissionableAmount: 5500,
    createdBy: 'USR-001',
    createdByName: 'Javier Lange',
    requiresApproval: false,
    internalNotes: 'Cancelado: Cliente excedió límite de crédito y no pudo regularizar.',
  },
];

// ============================================================================
// MOCK INVOICES
// ============================================================================

const SEED_INVOICES: Invoice[] = [
  {
    id: 'FAC-04420',
    invoiceNumber: 'FAC-04420',
    orderId: 'PED-06501',
    orderNumber: 'PED-06501',
    customerId: 'CLI-00509',
    customerName: 'SULTAN WHOLESALE',
    customerTaxId: '98-7654321',
    customerTaxIdType: 'EIN',
    customerCountry: 'Estados Unidos',
    customerAddress: '1200 Brickell Ave, Suite 500, Miami',
    issueDate: '2026-02-20T14:00:00Z',
    dueDate: '2026-04-20T23:59:59Z',
    lines: [],
    additionalExpenses: [],
    subtotal: 181000,
    expensesTotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 181000,
    paymentTerms: 'credito_60',
    status: 'emitida',
    invoiceType: 'zona_franca',
    sucursal: '0000',
    puntoFacturacion: '003',
    feStatus: 'aceptada',
    feReference: 'FE-2026-04420',
    feAuthorizationNumber: 'AUTH-9876543210',
    feSubmittedAt: '2026-02-20T14:05:00Z',
    feResponseAt: '2026-02-20T14:06:00Z',
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
  },
  {
    id: 'FAC-04418',
    invoiceNumber: 'FAC-04418',
    orderId: 'PED-06498',
    orderNumber: 'PED-06498',
    customerId: 'CLI-00032',
    customerName: 'PONCHO PLACE',
    customerTaxId: '900123456-7',
    customerTaxIdType: 'NIT',
    customerCountry: 'Colombia',
    customerAddress: 'Carrera 7 #127-35, Bogotá',
    issueDate: '2026-02-24T10:00:00Z',
    dueDate: '2026-02-24T23:59:59Z',
    lines: [],
    additionalExpenses: [
      { id: 'EXP-004', description: 'Flete', amount: 30, taxable: false },
    ],
    subtotal: 5839,
    expensesTotal: 30,
    taxRate: 0,
    taxAmount: 0,
    total: 5869,
    paymentTerms: 'contado',
    status: 'pagada',
    paidAmount: 5869,
    paidDate: '2026-02-24T10:30:00Z',
    invoiceType: 'zona_franca',
    sucursal: '0000',
    puntoFacturacion: '003',
    feStatus: 'aceptada',
    feReference: 'FE-2026-04418',
    feAuthorizationNumber: 'AUTH-1234567890',
    feSubmittedAt: '2026-02-24T10:02:00Z',
    feResponseAt: '2026-02-24T10:03:00Z',
    createdBy: 'USR-003',
    createdByName: 'Margarita Morelos',
  },
];

// ============================================================================
// STORE INFRASTRUCTURE – Sales Orders
// ============================================================================

let _salesOrders: SalesOrder[] = SEED_SALES_ORDERS;
let _soInitialized = false;
const { subscribe: subscribeSalesOrders, notify: _notifySalesOrders } = createSubscribers();

function ensureSalesOrdersInitialized(): void {
  if (typeof window === 'undefined' || _soInitialized) return;
  _salesOrders = loadCollection<SalesOrder>('sales_orders', SEED_SALES_ORDERS);
  _soInitialized = true;
}

export function getSalesOrdersData(): SalesOrder[] {
  ensureSalesOrdersInitialized();
  return _salesOrders;
}

export { subscribeSalesOrders };

// Backward-compatible export
export const MOCK_SALES_ORDERS: SalesOrder[] = new Proxy(SEED_SALES_ORDERS as SalesOrder[], {
  get(_target, prop, receiver) {
    ensureSalesOrdersInitialized();
    return Reflect.get(_salesOrders, prop, receiver);
  },
});

// ============================================================================
// STORE INFRASTRUCTURE – Invoices
// ============================================================================

let _invoices: Invoice[] = SEED_INVOICES;
let _invInitialized = false;
const { subscribe: subscribeInvoices, notify: _notifyInvoices } = createSubscribers();

function ensureInvoicesInitialized(): void {
  if (typeof window === 'undefined' || _invInitialized) return;
  _invoices = loadCollection<Invoice>('invoices', SEED_INVOICES);
  _invInitialized = true;
}

export function getInvoicesData(): Invoice[] {
  ensureInvoicesInitialized();
  return _invoices;
}

export { subscribeInvoices };

// Backward-compatible export
export const MOCK_INVOICES: Invoice[] = new Proxy(SEED_INVOICES as Invoice[], {
  get(_target, prop, receiver) {
    ensureInvoicesInitialized();
    return Reflect.get(_invoices, prop, receiver);
  },
});

// ============================================================================
// CRUD OPERATIONS – Sales Orders
// ============================================================================

export function addSalesOrder(order: SalesOrder): void {
  ensureSalesOrdersInitialized();
  _salesOrders = [..._salesOrders, order];
  saveCollection('sales_orders', _salesOrders);
  _notifySalesOrders();
}

export function updateSalesOrder(id: string, updates: Partial<SalesOrder>): void {
  ensureSalesOrdersInitialized();
  _salesOrders = _salesOrders.map((o) =>
    o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
  );
  saveCollection('sales_orders', _salesOrders);
  _notifySalesOrders();
}

export function removeSalesOrder(id: string): void {
  ensureSalesOrdersInitialized();
  _salesOrders = _salesOrders.filter((o) => o.id !== id);
  saveCollection('sales_orders', _salesOrders);
  _notifySalesOrders();
}

// ============================================================================
// CRUD OPERATIONS – Invoices
// ============================================================================

export function addInvoice(invoice: Invoice): void {
  ensureInvoicesInitialized();
  _invoices = [..._invoices, invoice];
  saveCollection('invoices', _invoices);
  _notifyInvoices();
}

export function updateInvoice(id: string, updates: Partial<Invoice>): void {
  ensureInvoicesInitialized();
  _invoices = _invoices.map((i) =>
    i.id === id ? { ...i, ...updates } : i
  );
  saveCollection('invoices', _invoices);
  _notifyInvoices();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get sales order by ID
 */
export function getSalesOrderById(id: string): SalesOrder | undefined {
  ensureSalesOrdersInitialized();
  return _salesOrders.find((order) => order.id === id);
}

/**
 * Get sales orders with filters
 */
export function getSalesOrders(filters?: SalesOrderFilters): SalesOrder[] {
  ensureSalesOrdersInitialized();
  let orders = [..._salesOrders];

  if (!filters) return orders;

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(searchLower) ||
        o.customerName.toLowerCase().includes(searchLower) ||
        o.customerId.toLowerCase().includes(searchLower)
    );
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    orders = orders.filter((o) => o.status === filters.status);
  }

  // Document type filter
  if (filters.documentType && filters.documentType !== 'all') {
    orders = orders.filter((o) => o.documentType === filters.documentType);
  }

  // Customer filter
  if (filters.customerId) {
    orders = orders.filter((o) => o.customerId === filters.customerId);
  }

  // Date range filter
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    orders = orders.filter((o) => new Date(o.createdAt) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    orders = orders.filter((o) => new Date(o.createdAt) <= to);
  }

  // Created by filter
  if (filters.createdBy) {
    orders = orders.filter((o) => o.createdBy === filters.createdBy);
  }

  // Requires approval filter
  if (filters.requiresApproval !== undefined) {
    orders = orders.filter((o) => o.requiresApproval === filters.requiresApproval);
  }

  return orders;
}

/**
 * Get sales stats
 */
export function getSalesStats(): SalesStats {
  ensureSalesOrdersInitialized();
  ensureInvoicesInitialized();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthOrders = _salesOrders.filter(
    (o) => new Date(o.createdAt) >= monthStart
  );

  const quotesThisMonth = thisMonthOrders.filter(
    (o) => o.documentType === 'cotizacion'
  ).length;

  const ordersThisMonth = thisMonthOrders.filter(
    (o) => o.documentType === 'pedido'
  ).length;

  const invoicesThisMonth = _invoices.filter(
    (i) => new Date(i.issueDate) >= monthStart
  ).length;

  const pendingQuotes = _salesOrders.filter(
    (o) => o.status === 'cotizado'
  ).length;

  const pendingApproval = _salesOrders.filter(
    (o) => o.status === 'pedido' && o.requiresApproval
  ).length;

  const readyToPack = _salesOrders.filter(
    (o) => o.status === 'aprobado'
  ).length;

  const readyToInvoice = _salesOrders.filter(
    (o) => o.status === 'empacado'
  ).length;

  const pipelineOrders = _salesOrders.filter(
    (o) => !['facturado', 'cancelado'].includes(o.status)
  );
  const pipelineValue = pipelineOrders.reduce((sum, o) => sum + o.total, 0);

  const invoicedThisMonth = _invoices.filter(
    (i) => new Date(i.issueDate) >= monthStart
  );
  const salesValueThisMonth = invoicedThisMonth.reduce((sum, i) => sum + i.total, 0);

  const marginThisMonth = thisMonthOrders
    .filter((o) => o.status === 'facturado')
    .reduce((sum, o) => sum + (o.totalMargin || 0), 0);

  const marginPercentThisMonth =
    salesValueThisMonth > 0
      ? (marginThisMonth / salesValueThisMonth) * 100
      : 0;

  const byStatus: Record<SalesOrderStatus, number> = {
    borrador: _salesOrders.filter((o) => o.status === 'borrador').length,
    cotizado: _salesOrders.filter((o) => o.status === 'cotizado').length,
    pedido: _salesOrders.filter((o) => o.status === 'pedido').length,
    aprobado: _salesOrders.filter((o) => o.status === 'aprobado').length,
    empacado: _salesOrders.filter((o) => o.status === 'empacado').length,
    facturado: _salesOrders.filter((o) => o.status === 'facturado').length,
    cancelado: _salesOrders.filter((o) => o.status === 'cancelado').length,
  };

  return {
    quotesThisMonth,
    ordersThisMonth,
    invoicesThisMonth,
    pendingQuotes,
    pendingApproval,
    readyToPack,
    readyToInvoice,
    pipelineValue,
    salesValueThisMonth,
    marginThisMonth,
    marginPercentThisMonth,
    byStatus,
  };
}

/**
 * Get next document number
 */
export function getNextOrderNumber(docType: DocumentType): string {
  ensureSalesOrdersInitialized();
  const prefix = docType === 'cotizacion' ? 'COT' : docType === 'pedido' ? 'PED' : 'FAC';

  const existing = _salesOrders.filter((o) =>
    o.orderNumber.startsWith(prefix)
  );

  const maxNumber = existing.reduce((max, o) => {
    const num = parseInt(o.orderNumber.replace(`${prefix}-`, ''), 10);
    return num > max ? num : max;
  }, 0);

  return `${prefix}-${String(maxNumber + 1).padStart(5, '0')}`;
}

/**
 * Get last price to customer for a product
 */
export function getLastPriceToCustomer(
  customerId: string,
  productId: string
): number | undefined {
  ensureSalesOrdersInitialized();
  const customerOrders = _salesOrders
    .filter(
      (o) =>
        o.customerId === customerId &&
        o.status !== 'cancelado' &&
        o.status !== 'borrador'
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  for (const order of customerOrders) {
    const line = order.lines.find((l) => l.productId === productId);
    if (line) return line.unitPrice;
  }

  return undefined;
}

/**
 * Get orders pending approval
 */
export function getOrdersPendingApproval(): SalesOrder[] {
  ensureSalesOrdersInitialized();
  return _salesOrders.filter(
    (o) => o.status === 'pedido' && o.requiresApproval
  );
}

/**
 * Get orders ready to pack
 */
export function getOrdersReadyToPack(): SalesOrder[] {
  ensureSalesOrdersInitialized();
  return _salesOrders.filter((o) => o.status === 'aprobado');
}

/**
 * Get orders ready to invoice
 */
export function getOrdersReadyToInvoice(): SalesOrder[] {
  ensureSalesOrdersInitialized();
  return _salesOrders.filter((o) => o.status === 'empacado');
}

// Re-export types
export type { SalesOrder, SalesOrderLine, SalesOrderStatus, SalesStats };
