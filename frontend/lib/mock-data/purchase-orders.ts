/**
 * Purchase Orders data store (localStorage-backed)
 * Based on the clients.ts pattern
 */

import type {
  PurchaseOrder,
  Supplier,
  Bodega,
  MerchandiseEntry,
  PurchaseOrderStats,
  ProductCostHistoryEntry,
} from '@/lib/types/purchase-order';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Seed suppliers for Evolution OS
 * Based on real suppliers from Dynamo POS
 */
const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'TRIPLE DOUBLE TRADING LLC',
    country: 'USA',
    contact: 'John Smith',
    email: 'orders@tripledouble.com',
    phone: '+1 305-555-0100',
    columnTemplate: {
      productReference: 'A',
      productDescription: 'B',
      quantity: 'C',
      unitCostFOB: 'D',
    },
  },
  {
    id: 'SUP-002',
    name: 'GLOBAL BRANDS, S.A.',
    country: 'PANAMA',
    contact: 'Maria Rodriguez',
    email: 'ventas@globalbrands.com.pa',
    phone: '+507 6555-0200',
  },
  {
    id: 'SUP-003',
    name: 'JP CHENET',
    country: 'FRANCIA',
    contact: 'Pierre Dupont',
    email: 'export@jpchenet.fr',
    phone: '+33 1 55 00 0300',
  },
  {
    id: 'SUP-004',
    name: 'ADYCORP',
    country: 'PANAMA',
    contact: 'Carlos Mendez',
    email: 'pedidos@adycorp.com',
    phone: '+507 6555-0400',
  },
  {
    id: 'SUP-005',
    name: 'DIAGEO PANAMA',
    country: 'PANAMA',
    contact: 'Ana Martinez',
    email: 'orders@diageo.com.pa',
    phone: '+507 6555-0500',
  },
];

/**
 * Seed bodegas (warehouses)
 */
const SEED_BODEGAS: Bodega[] = [
  {
    id: 'BOD-001',
    name: 'Bodega Zona Libre',
    code: 'ZL',
    location: 'Colón Free Zone, Building 23',
  },
  {
    id: 'BOD-002',
    name: 'Bodega CFZ',
    code: 'CFZ',
    location: 'Colón Free Zone, Building 45',
  },
  {
    id: 'BOD-003',
    name: 'Bodega Panama City',
    code: 'PTY',
    location: 'Panama City, Industrial Zone',
  },
];

/**
 * Seed purchase orders
 * Includes OC-03566 from Document 003
 */
const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [
  // OC-03566 - From Document 003 (Real data)
  {
    id: 'OC-03566',
    orderNumber: 'OC-03566',
    createdAt: '2026-02-06T10:30:00Z',
    supplierId: 'SUP-001',
    supplierName: 'TRIPLE DOUBLE TRADING LLC',
    supplierInvoice: 'TD002038',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    status: 'completada',
    expectedArrivalDate: '2026-02-06',
    actualArrivalDate: '2026-02-06',
    lines: [
      {
        id: 'LINE-001',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE W. RED NR 12X750ML 40%VOL.AL',
        quantity: 100,
        quantityReceived: 100,
        unitCostFOB: 73.0,
        totalFOB: 7300.0,
        unitCostCIF: 83.95,
        totalCIF: 8395.0,
      },
      {
        id: 'LINE-002',
        productId: 'EVL-00003',
        productReference: 'EVL-00003',
        productDescription: 'WHISKY JOHNNIE W. BLACK 12YRS 24X375ML 40%V',
        quantity: 50,
        quantityReceived: 50,
        unitCostFOB: 195.0,
        totalFOB: 9750.0,
        unitCostCIF: 224.25,
        totalCIF: 11212.5,
      },
      {
        id: 'LINE-003',
        productId: 'EVL-00021',
        productReference: 'EVL-00021',
        productDescription: 'WHISKY JOHNNIE WALKER GREEN 6X1000ML',
        quantity: 50,
        quantityReceived: 50,
        unitCostFOB: 175.0,
        totalFOB: 8750.0,
        unitCostCIF: 201.25,
        totalCIF: 10062.5,
      },
      {
        id: 'LINE-004',
        productId: 'EVL-00013',
        productReference: 'EVL-00013',
        productDescription: 'WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40%',
        quantity: 25,
        quantityReceived: 25,
        unitCostFOB: 255.0,
        totalFOB: 6375.0,
        unitCostCIF: 293.25,
        totalCIF: 7331.25,
      },
      {
        id: 'LINE-005',
        productId: 'EVL-00014',
        productReference: 'EVL-00014',
        productDescription: 'WHISKY MONKEY SHOULDER 6X700ML 40%VOL',
        quantity: 30,
        quantityReceived: 30,
        unitCostFOB: 88.0,
        totalFOB: 2640.0,
        unitCostCIF: 101.2,
        totalCIF: 3036.0,
      },
      {
        id: 'LINE-006',
        productId: 'EVL-00022',
        productReference: 'EVL-00022',
        productDescription: 'WHISKY JAMESON 1X4500ML 40%VOL W/CRADLE G',
        quantity: 3,
        quantityReceived: 3,
        unitCostFOB: 50.0,
        totalFOB: 150.0,
        unitCostCIF: 57.5,
        totalCIF: 172.5,
      },
      {
        id: 'LINE-007',
        productId: 'EVL-00019',
        productReference: 'EVL-00019',
        productDescription: 'TEQUILA 1800 COCONUT R NK 12X750ML 35%V',
        quantity: 47,
        quantityReceived: 47,
        unitCostFOB: 115.0,
        totalFOB: 5405.0,
        unitCostCIF: 132.25,
        totalCIF: 6215.75,
      },
      {
        id: 'LINE-008',
        productId: 'EVL-00004',
        productReference: 'EVL-00004',
        productDescription: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
        quantity: 23,
        quantityReceived: 23,
        unitCostFOB: 528.0,
        totalFOB: 12144.0,
        unitCostCIF: 607.2,
        totalCIF: 13965.6,
      },
      {
        id: 'LINE-009',
        productId: 'EVL-00005',
        productReference: 'EVL-00005',
        productDescription: 'TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40%',
        quantity: 7,
        quantityReceived: 7,
        unitCostFOB: 840.0,
        totalFOB: 5880.0,
        unitCostCIF: 966.0,
        totalCIF: 6762.0,
      },
      {
        id: 'LINE-010',
        productId: 'EVL-00023',
        productReference: 'EVL-00023',
        productDescription: 'WHISKY GLENFIDDICH 15YRS 12X750ML 40%VOL',
        quantity: 25,
        quantityReceived: 25,
        unitCostFOB: 411.0,
        totalFOB: 10275.0,
        unitCostCIF: 472.65,
        totalCIF: 11816.25,
      },
    ],
    totalFOB: 68669.0,
    expensePercentage: 15,
    totalExpenses: 10300.35,
    totalCIF: 78969.35,
    createdBy: 'USR-004',
    notes: 'Orden completada - Q1 2026 replenishment',
  },

  // OC-03567 - In transit
  {
    id: 'OC-03567',
    orderNumber: 'OC-03567',
    createdAt: '2026-02-10T14:00:00Z',
    supplierId: 'SUP-002',
    supplierName: 'GLOBAL BRANDS, S.A.',
    supplierInvoice: 'GB-2026-0089',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    status: 'en_transito',
    expectedArrivalDate: '2026-02-28',
    lines: [
      {
        id: 'LINE-011',
        productId: 'EVL-00001',
        productReference: 'EVL-00001',
        productDescription: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
        quantity: 200,
        quantityReceived: 0,
        unitCostFOB: 73.0,
        totalFOB: 14600.0,
      },
      {
        id: 'LINE-012',
        productId: 'EVL-00007',
        productReference: 'EVL-00007',
        productDescription: 'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
        quantity: 150,
        quantityReceived: 0,
        unitCostFOB: 52.0,
        totalFOB: 7800.0,
      },
      {
        id: 'LINE-013',
        productId: 'EVL-00008',
        productReference: 'EVL-00008',
        productDescription: 'GINEBRA HENDRICKS RF 12X1000ML 44% VOL',
        quantity: 50,
        quantityReceived: 0,
        unitCostFOB: 165.0,
        totalFOB: 8250.0,
      },
      {
        id: 'LINE-014',
        productId: 'EVL-00012',
        productReference: 'EVL-00012',
        productDescription: 'WHISKY JACK DANIELS N°7 BLACK MINI 120X50ML 40%V',
        quantity: 100,
        quantityReceived: 0,
        unitCostFOB: 68.0,
        totalFOB: 6800.0,
      },
    ],
    totalFOB: 37450.0,
    createdBy: 'USR-004',
    notes: 'Embarque febrero - productos básicos',
  },

  // OC-03568 - Partial reception
  {
    id: 'OC-03568',
    orderNumber: 'OC-03568',
    createdAt: '2026-02-15T09:00:00Z',
    supplierId: 'SUP-003',
    supplierName: 'JP CHENET',
    supplierInvoice: 'JPC-2026-0456',
    bodegaId: 'BOD-002',
    bodegaName: 'Bodega CFZ',
    status: 'en_recepcion',
    expectedArrivalDate: '2026-02-20',
    actualArrivalDate: '2026-02-20',
    lines: [
      {
        id: 'LINE-015',
        productId: 'EVL-00006',
        productReference: 'EVL-00006',
        productDescription: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
        quantity: 100,
        quantityReceived: 60,
        unitCostFOB: 38.0,
        totalFOB: 3800.0,
        unitCostCIF: 43.7,
        totalCIF: 2622.0,
      },
      {
        id: 'LINE-016',
        productId: 'EVL-00010',
        productReference: 'EVL-00010',
        productDescription: 'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
        quantity: 80,
        quantityReceived: 80,
        unitCostFOB: 75.0,
        totalFOB: 6000.0,
        unitCostCIF: 86.25,
        totalCIF: 6900.0,
      },
      {
        id: 'LINE-017',
        productId: 'EVL-00015',
        productReference: 'EVL-00015',
        productDescription: 'RON CAPTAIN MORGAN BLACK SPICED 12X1000ML 40%',
        quantity: 60,
        quantityReceived: 60,
        unitCostFOB: 58.0,
        totalFOB: 3480.0,
        unitCostCIF: 66.7,
        totalCIF: 4002.0,
      },
    ],
    totalFOB: 13280.0,
    expensePercentage: 15,
    totalExpenses: 1992.0,
    totalCIF: 13524.0,
    createdBy: 'USR-004',
    notes: 'Recepción parcial - 40 cajas de Prosecco pendientes',
  },

  // OC-03569 - Pending
  {
    id: 'OC-03569',
    orderNumber: 'OC-03569',
    createdAt: '2026-02-20T11:30:00Z',
    supplierId: 'SUP-004',
    supplierName: 'ADYCORP',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    status: 'pendiente',
    expectedArrivalDate: '2026-03-10',
    lines: [
      {
        id: 'LINE-018',
        productId: 'EVL-00009',
        productReference: 'EVL-00009',
        productDescription: 'WHISKY CHIVAS REGAL 12YRS S/C NR 12X750',
        quantity: 100,
        quantityReceived: 0,
        unitCostFOB: 125.0,
        totalFOB: 12500.0,
      },
      {
        id: 'LINE-019',
        productId: 'EVL-00018',
        productReference: 'EVL-00018',
        productDescription: 'SNACKS PRINGLES BBQ 12X149G',
        quantity: 200,
        quantityReceived: 0,
        unitCostFOB: 16.0,
        totalFOB: 3200.0,
      },
    ],
    totalFOB: 15700.0,
    createdBy: 'USR-004',
    notes: 'Orden marzo - Chivas y Snacks',
  },

  // OC-03570 - In transit
  {
    id: 'OC-03570',
    orderNumber: 'OC-03570',
    createdAt: '2026-02-18T16:00:00Z',
    supplierId: 'SUP-001',
    supplierName: 'TRIPLE DOUBLE TRADING LLC',
    supplierInvoice: 'TD002045',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    status: 'en_transito',
    expectedArrivalDate: '2026-03-05',
    lines: [
      {
        id: 'LINE-020',
        productId: 'EVL-00004',
        productReference: 'EVL-00004',
        productDescription: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
        quantity: 50,
        quantityReceived: 0,
        unitCostFOB: 528.0,
        totalFOB: 26400.0,
      },
      {
        id: 'LINE-021',
        productId: 'EVL-00005',
        productReference: 'EVL-00005',
        productDescription: 'TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40%',
        quantity: 30,
        quantityReceived: 0,
        unitCostFOB: 840.0,
        totalFOB: 25200.0,
      },
      {
        id: 'LINE-022',
        productId: 'EVL-00013',
        productReference: 'EVL-00013',
        productDescription: 'WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40%',
        quantity: 40,
        quantityReceived: 0,
        unitCostFOB: 255.0,
        totalFOB: 10200.0,
      },
    ],
    totalFOB: 61800.0,
    createdBy: 'USR-004',
    notes: 'Premium tequilas order - March delivery',
  },

  // OC-03565 - Completed older order
  {
    id: 'OC-03565',
    orderNumber: 'OC-03565',
    createdAt: '2026-01-15T10:00:00Z',
    supplierId: 'SUP-003',
    supplierName: 'JP CHENET',
    supplierInvoice: 'JPC-2026-0321',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    status: 'completada',
    expectedArrivalDate: '2026-01-28',
    actualArrivalDate: '2026-01-28',
    lines: [
      {
        id: 'LINE-023',
        productId: 'EVL-00011',
        productReference: 'EVL-00011',
        productDescription: 'LICOR AMARETTO DISARONNO RF 12X750ML',
        quantity: 50,
        quantityReceived: 50,
        unitCostFOB: 95.0,
        totalFOB: 4750.0,
        unitCostCIF: 109.25,
        totalCIF: 5462.5,
      },
      {
        id: 'LINE-024',
        productId: 'EVL-00016',
        productReference: 'EVL-00016',
        productDescription: 'LICOR KAHLUA CAFE 12X750ML 16%VOL',
        quantity: 80,
        quantityReceived: 80,
        unitCostFOB: 45.0,
        totalFOB: 3600.0,
        unitCostCIF: 51.75,
        totalCIF: 4140.0,
      },
      {
        id: 'LINE-025',
        productId: 'EVL-00020',
        productReference: 'EVL-00020',
        productDescription: 'WHISKY GLENLIVET 12YO DOUBLE OAK R GB 12X750ML',
        quantity: 20,
        quantityReceived: 20,
        unitCostFOB: 320.0,
        totalFOB: 6400.0,
        unitCostCIF: 368.0,
        totalCIF: 7360.0,
      },
    ],
    totalFOB: 14750.0,
    expensePercentage: 15,
    totalExpenses: 2212.5,
    totalCIF: 16962.5,
    createdBy: 'USR-004',
    notes: 'Enero - Licores y Single Malts',
  },

  // OC-03564 - Cancelled
  {
    id: 'OC-03564',
    orderNumber: 'OC-03564',
    createdAt: '2026-01-10T08:00:00Z',
    supplierId: 'SUP-005',
    supplierName: 'DIAGEO PANAMA',
    bodegaId: 'BOD-003',
    bodegaName: 'Bodega Panama City',
    status: 'cancelada',
    lines: [
      {
        id: 'LINE-026',
        productId: 'EVL-00017',
        productReference: 'EVL-00017',
        productDescription: 'RON MCCORMICK GOLD 12X1000ML 40%VOL',
        quantity: 300,
        quantityReceived: 0,
        unitCostFOB: 22.0,
        totalFOB: 6600.0,
      },
    ],
    totalFOB: 6600.0,
    createdBy: 'USR-004',
    notes: 'Cancelada - proveedor sin stock',
  },
];

/**
 * Seed merchandise entries (Historial de Entradas)
 */
const SEED_MERCHANDISE_ENTRIES: MerchandiseEntry[] = [
  {
    id: 'ENT-001',
    purchaseOrderId: 'OC-03566',
    purchaseOrderNumber: 'OC-03566',
    date: '2026-02-06T14:00:00Z',
    supplierId: 'SUP-001',
    supplierName: 'TRIPLE DOUBLE TRADING LLC',
    supplierInvoice: 'TD002038',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    receivedBy: 'USR-006', // Bodega user
    lines: [
      {
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE W. RED NR 12X750ML 40%VOL.AL',
        quantityReceived: 100,
        unitCostFOB: 73.0,
        unitCostCIF: 83.95,
        totalFOB: 7300.0,
        totalCIF: 8395.0,
        previousCostAvg: 80.0,
        newCostAvg: 82.5,
      },
      {
        productId: 'EVL-00003',
        productReference: 'EVL-00003',
        productDescription: 'WHISKY JOHNNIE W. BLACK 12YRS 24X375ML 40%V',
        quantityReceived: 50,
        unitCostFOB: 195.0,
        unitCostCIF: 224.25,
        totalFOB: 9750.0,
        totalCIF: 11212.5,
        previousCostAvg: 190.0,
        newCostAvg: 201.12,
      },
    ],
    expenseMethod: 'percentage',
    expensePercentage: 15,
    totalFOB: 68669.0,
    totalCIF: 78969.35,
    receptionType: 'completa',
  },
  {
    id: 'ENT-002',
    purchaseOrderId: 'OC-03568',
    purchaseOrderNumber: 'OC-03568',
    date: '2026-02-20T10:30:00Z',
    supplierId: 'SUP-003',
    supplierName: 'JP CHENET',
    supplierInvoice: 'JPC-2026-0456',
    bodegaId: 'BOD-002',
    bodegaName: 'Bodega CFZ',
    receivedBy: 'USR-006',
    lines: [
      {
        productId: 'EVL-00006',
        productReference: 'EVL-00006',
        productDescription: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
        quantityReceived: 60,
        unitCostFOB: 38.0,
        unitCostCIF: 43.7,
        totalFOB: 2280.0,
        totalCIF: 2622.0,
        previousCostAvg: 42.5,
        newCostAvg: 43.1,
      },
      {
        productId: 'EVL-00010',
        productReference: 'EVL-00010',
        productDescription: 'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
        quantityReceived: 80,
        unitCostFOB: 75.0,
        unitCostCIF: 86.25,
        totalFOB: 6000.0,
        totalCIF: 6900.0,
        previousCostAvg: 84.0,
        newCostAvg: 85.5,
      },
    ],
    expenseMethod: 'percentage',
    expensePercentage: 15,
    totalFOB: 11760.0,
    totalCIF: 13524.0,
    receptionType: 'parcial',
  },
  {
    id: 'ENT-003',
    purchaseOrderId: 'OC-03565',
    purchaseOrderNumber: 'OC-03565',
    date: '2026-01-28T11:00:00Z',
    supplierId: 'SUP-003',
    supplierName: 'JP CHENET',
    supplierInvoice: 'JPC-2026-0321',
    bodegaId: 'BOD-001',
    bodegaName: 'Bodega Zona Libre',
    receivedBy: 'USR-006',
    lines: [
      {
        productId: 'EVL-00011',
        productReference: 'EVL-00011',
        productDescription: 'LICOR AMARETTO DISARONNO RF 12X750ML',
        quantityReceived: 50,
        unitCostFOB: 95.0,
        unitCostCIF: 109.25,
        totalFOB: 4750.0,
        totalCIF: 5462.5,
        previousCostAvg: 106.0,
        newCostAvg: 107.5,
      },
    ],
    expenseMethod: 'percentage',
    expensePercentage: 15,
    totalFOB: 14750.0,
    totalCIF: 16962.5,
    receptionType: 'completa',
  },
];

/**
 * Seed cost history entries for products
 */
const SEED_COST_HISTORY: ProductCostHistoryEntry[] = [
  // JW Red cost history
  {
    id: 'COST-001',
    date: '2026-02-06',
    entryId: 'ENT-001',
    purchaseOrderId: 'OC-03566',
    purchaseOrderNumber: 'OC-03566',
    quantity: 100,
    costFOB: 73.0,
    expensePercentage: 15,
    costCIF: 83.95,
    costWeightedAvg: 82.5,
    supplierId: 'SUP-001',
    supplierName: 'TRIPLE DOUBLE TRADING LLC',
  },
  {
    id: 'COST-002',
    date: '2025-12-15',
    entryId: 'ENT-OLD-001',
    purchaseOrderId: 'OC-03550',
    purchaseOrderNumber: 'OC-03550',
    quantity: 150,
    costFOB: 70.0,
    expensePercentage: 14,
    costCIF: 79.8,
    costWeightedAvg: 80.0,
    supplierId: 'SUP-001',
    supplierName: 'TRIPLE DOUBLE TRADING LLC',
  },
  {
    id: 'COST-003',
    date: '2025-10-20',
    entryId: 'ENT-OLD-002',
    purchaseOrderId: 'OC-03520',
    purchaseOrderNumber: 'OC-03520',
    quantity: 120,
    costFOB: 68.0,
    expensePercentage: 15,
    costCIF: 78.2,
    costWeightedAvg: 78.5,
    supplierId: 'SUP-002',
    supplierName: 'GLOBAL BRANDS, S.A.',
  },
  // JW Black cost history
  {
    id: 'COST-004',
    date: '2026-02-06',
    entryId: 'ENT-001',
    purchaseOrderId: 'OC-03566',
    purchaseOrderNumber: 'OC-03566',
    quantity: 50,
    costFOB: 195.0,
    expensePercentage: 15,
    costCIF: 224.25,
    costWeightedAvg: 201.12,
    supplierId: 'SUP-001',
    supplierName: 'TRIPLE DOUBLE TRADING LLC',
  },
];

// ============================================================================
// STORE INFRASTRUCTURE — Purchase Orders
// ============================================================================

let _purchaseOrders: PurchaseOrder[] = SEED_PURCHASE_ORDERS;
let _purchaseOrdersInit = false;
const { subscribe: subscribePurchaseOrders, notify: _notifyPurchaseOrders } = createSubscribers();

function ensurePurchaseOrdersInitialized(): void {
  if (typeof window === 'undefined' || _purchaseOrdersInit) return;
  _purchaseOrders = loadCollection<PurchaseOrder>('purchase_orders', SEED_PURCHASE_ORDERS);
  _purchaseOrdersInit = true;
}

export function getPurchaseOrdersData(): PurchaseOrder[] {
  ensurePurchaseOrdersInitialized();
  return _purchaseOrders;
}

export { subscribePurchaseOrders };

// Backward-compatible export
export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = new Proxy(SEED_PURCHASE_ORDERS as PurchaseOrder[], {
  get(_target, prop, receiver) {
    ensurePurchaseOrdersInitialized();
    return Reflect.get(_purchaseOrders, prop, receiver);
  },
});

// CRUD
export function addPurchaseOrder(order: PurchaseOrder): void {
  ensurePurchaseOrdersInitialized();
  _purchaseOrders = [..._purchaseOrders, order];
  saveCollection('purchase_orders', _purchaseOrders);
  _notifyPurchaseOrders();
}

export function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): void {
  ensurePurchaseOrdersInitialized();
  _purchaseOrders = _purchaseOrders.map((po) =>
    po.id === id ? { ...po, ...updates } : po
  );
  saveCollection('purchase_orders', _purchaseOrders);
  _notifyPurchaseOrders();
}

export function removePurchaseOrder(id: string): void {
  ensurePurchaseOrdersInitialized();
  _purchaseOrders = _purchaseOrders.filter((po) => po.id !== id);
  saveCollection('purchase_orders', _purchaseOrders);
  _notifyPurchaseOrders();
}

// ============================================================================
// STORE INFRASTRUCTURE — Suppliers
// ============================================================================

let _suppliers: Supplier[] = SEED_SUPPLIERS;
let _suppliersInit = false;
const { subscribe: subscribeSuppliers, notify: _notifySuppliers } = createSubscribers();

function ensureSuppliersInitialized(): void {
  if (typeof window === 'undefined' || _suppliersInit) return;
  _suppliers = loadCollection<Supplier>('suppliers', SEED_SUPPLIERS);
  _suppliersInit = true;
}

export function getSuppliersData(): Supplier[] {
  ensureSuppliersInitialized();
  return _suppliers;
}

export { subscribeSuppliers };

// Backward-compatible export
export const MOCK_SUPPLIERS: Supplier[] = new Proxy(SEED_SUPPLIERS as Supplier[], {
  get(_target, prop, receiver) {
    ensureSuppliersInitialized();
    return Reflect.get(_suppliers, prop, receiver);
  },
});

// CRUD
export function addSupplier(supplier: Supplier): void {
  ensureSuppliersInitialized();
  _suppliers = [..._suppliers, supplier];
  saveCollection('suppliers', _suppliers);
  _notifySuppliers();
}

export function updateSupplier(id: string, updates: Partial<Supplier>): void {
  ensureSuppliersInitialized();
  _suppliers = _suppliers.map((s) =>
    s.id === id ? { ...s, ...updates } : s
  );
  saveCollection('suppliers', _suppliers);
  _notifySuppliers();
}

export function removeSupplier(id: string): void {
  ensureSuppliersInitialized();
  _suppliers = _suppliers.filter((s) => s.id !== id);
  saveCollection('suppliers', _suppliers);
  _notifySuppliers();
}

// ============================================================================
// STORE INFRASTRUCTURE — Bodegas
// ============================================================================

let _bodegas: Bodega[] = SEED_BODEGAS;
let _bodegasInit = false;
const { subscribe: subscribeBodegas, notify: _notifyBodegas } = createSubscribers();

function ensureBodegasInitialized(): void {
  if (typeof window === 'undefined' || _bodegasInit) return;
  _bodegas = loadCollection<Bodega>('bodegas', SEED_BODEGAS);
  _bodegasInit = true;
}

export function getBodegasData(): Bodega[] {
  ensureBodegasInitialized();
  return _bodegas;
}

export { subscribeBodegas };

// Backward-compatible export
export const MOCK_BODEGAS: Bodega[] = new Proxy(SEED_BODEGAS as Bodega[], {
  get(_target, prop, receiver) {
    ensureBodegasInitialized();
    return Reflect.get(_bodegas, prop, receiver);
  },
});

// CRUD
export function addBodega(bodega: Bodega): void {
  ensureBodegasInitialized();
  _bodegas = [..._bodegas, bodega];
  saveCollection('bodegas', _bodegas);
  _notifyBodegas();
}

export function updateBodega(id: string, updates: Partial<Bodega>): void {
  ensureBodegasInitialized();
  _bodegas = _bodegas.map((b) =>
    b.id === id ? { ...b, ...updates } : b
  );
  saveCollection('bodegas', _bodegas);
  _notifyBodegas();
}

export function removeBodega(id: string): void {
  ensureBodegasInitialized();
  _bodegas = _bodegas.filter((b) => b.id !== id);
  saveCollection('bodegas', _bodegas);
  _notifyBodegas();
}

// ============================================================================
// STORE INFRASTRUCTURE — Merchandise Entries
// ============================================================================

let _merchandiseEntries: MerchandiseEntry[] = SEED_MERCHANDISE_ENTRIES;
let _merchandiseEntriesInit = false;
const { subscribe: subscribeMerchandiseEntries, notify: _notifyMerchandiseEntries } = createSubscribers();

function ensureMerchandiseEntriesInitialized(): void {
  if (typeof window === 'undefined' || _merchandiseEntriesInit) return;
  _merchandiseEntries = loadCollection<MerchandiseEntry>('merchandise_entries', SEED_MERCHANDISE_ENTRIES);
  _merchandiseEntriesInit = true;
}

export function getMerchandiseEntriesData(): MerchandiseEntry[] {
  ensureMerchandiseEntriesInitialized();
  return _merchandiseEntries;
}

export { subscribeMerchandiseEntries };

// Backward-compatible export
export const MOCK_MERCHANDISE_ENTRIES: MerchandiseEntry[] = new Proxy(SEED_MERCHANDISE_ENTRIES as MerchandiseEntry[], {
  get(_target, prop, receiver) {
    ensureMerchandiseEntriesInitialized();
    return Reflect.get(_merchandiseEntries, prop, receiver);
  },
});

// CRUD
export function addMerchandiseEntry(entry: MerchandiseEntry): void {
  ensureMerchandiseEntriesInitialized();
  _merchandiseEntries = [..._merchandiseEntries, entry];
  saveCollection('merchandise_entries', _merchandiseEntries);
  _notifyMerchandiseEntries();
}

export function updateMerchandiseEntry(id: string, updates: Partial<MerchandiseEntry>): void {
  ensureMerchandiseEntriesInitialized();
  _merchandiseEntries = _merchandiseEntries.map((e) =>
    e.id === id ? { ...e, ...updates } : e
  );
  saveCollection('merchandise_entries', _merchandiseEntries);
  _notifyMerchandiseEntries();
}

export function removeMerchandiseEntry(id: string): void {
  ensureMerchandiseEntriesInitialized();
  _merchandiseEntries = _merchandiseEntries.filter((e) => e.id !== id);
  saveCollection('merchandise_entries', _merchandiseEntries);
  _notifyMerchandiseEntries();
}

// ============================================================================
// STORE INFRASTRUCTURE — Cost History
// ============================================================================

let _costHistory: ProductCostHistoryEntry[] = SEED_COST_HISTORY;
let _costHistoryInit = false;
const { subscribe: subscribeCostHistory, notify: _notifyCostHistory } = createSubscribers();

function ensureCostHistoryInitialized(): void {
  if (typeof window === 'undefined' || _costHistoryInit) return;
  _costHistory = loadCollection<ProductCostHistoryEntry>('cost_history', SEED_COST_HISTORY);
  _costHistoryInit = true;
}

export function getCostHistoryData(): ProductCostHistoryEntry[] {
  ensureCostHistoryInitialized();
  return _costHistory;
}

export { subscribeCostHistory };

// Backward-compatible export
export const MOCK_COST_HISTORY: ProductCostHistoryEntry[] = new Proxy(SEED_COST_HISTORY as ProductCostHistoryEntry[], {
  get(_target, prop, receiver) {
    ensureCostHistoryInitialized();
    return Reflect.get(_costHistory, prop, receiver);
  },
});

// CRUD
export function addCostHistoryEntry(entry: ProductCostHistoryEntry): void {
  ensureCostHistoryInitialized();
  _costHistory = [..._costHistory, entry];
  saveCollection('cost_history', _costHistory);
  _notifyCostHistory();
}

export function updateCostHistoryEntry(id: string, updates: Partial<ProductCostHistoryEntry>): void {
  ensureCostHistoryInitialized();
  _costHistory = _costHistory.map((e) =>
    e.id === id ? { ...e, ...updates } : e
  );
  saveCollection('cost_history', _costHistory);
  _notifyCostHistory();
}

export function removeCostHistoryEntry(id: string): void {
  ensureCostHistoryInitialized();
  _costHistory = _costHistory.filter((e) => e.id !== id);
  saveCollection('cost_history', _costHistory);
  _notifyCostHistory();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get purchase order by ID
 */
export function getPurchaseOrderById(id: string): PurchaseOrder | undefined {
  ensurePurchaseOrdersInitialized();
  return _purchaseOrders.find((po) => po.id === id);
}

/**
 * Get supplier by ID
 */
export function getSupplierById(id: string): Supplier | undefined {
  ensureSuppliersInitialized();
  return _suppliers.find((s) => s.id === id);
}

/**
 * Get bodega by ID
 */
export function getBodegaById(id: string): Bodega | undefined {
  ensureBodegasInitialized();
  return _bodegas.find((b) => b.id === id);
}

/**
 * Get merchandise entry by ID
 */
export function getMerchandiseEntryById(id: string): MerchandiseEntry | undefined {
  ensureMerchandiseEntriesInitialized();
  return _merchandiseEntries.find((e) => e.id === id);
}

/**
 * Get cost history for a product
 */
export function getProductCostHistory(productId: string): ProductCostHistoryEntry[] {
  ensureCostHistoryInitialized();
  // In real implementation, would filter by productId
  // For now, return all for demo
  return _costHistory;
}

/**
 * Calculate purchase order stats
 */
export function getPurchaseOrderStats(): PurchaseOrderStats {
  ensurePurchaseOrdersInitialized();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeStatuses: Array<'pendiente' | 'en_transito' | 'en_recepcion'> = [
    'pendiente',
    'en_transito',
    'en_recepcion',
  ];

  const activeOrders = _purchaseOrders.filter((po) =>
    activeStatuses.includes(po.status as 'pendiente' | 'en_transito' | 'en_recepcion')
  ).length;

  const inTransit = _purchaseOrders.filter(
    (po) => po.status === 'en_transito'
  ).length;

  const receivedThisMonth = _purchaseOrders.filter(
    (po) =>
      po.status === 'completada' &&
      po.actualArrivalDate &&
      new Date(po.actualArrivalDate) >= monthStart
  ).length;

  const valueInTransit = _purchaseOrders
    .filter((po) => po.status === 'en_transito')
    .reduce((sum, po) => sum + po.totalFOB, 0);

  return {
    activeOrders,
    inTransit,
    receivedThisMonth,
    valueInTransit,
  };
}

/**
 * Get unique suppliers from orders
 */
export function getUniqueOrderSuppliers(): Supplier[] {
  ensurePurchaseOrdersInitialized();
  ensureSuppliersInitialized();
  const supplierIds = [...new Set(_purchaseOrders.map((po) => po.supplierId))];
  return _suppliers.filter((s) => supplierIds.includes(s.id));
}

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
 * Get next order number
 */
export function getNextOrderNumber(): string {
  ensurePurchaseOrdersInitialized();
  const maxNumber = Math.max(
    ..._purchaseOrders.map((po) => parseInt(po.orderNumber.replace('OC-', '')))
  );
  return `OC-${String(maxNumber + 1).padStart(5, '0')}`;
}

// Re-export Product type for use in compras
export type { Product } from '@/lib/types/product';
