/**
 * Inventory Mock Data for Evolution OS
 * Based on Document 04 - Módulo de Control de Inventario
 * Store-backed: data persists in localStorage
 */

import {
  InventoryItem,
  InventoryStats,
  InventoryAdjustment,
  InventoryTransfer,
  PhysicalCountSession,
  InventoryAlert,
  AlertType,
  AdjustmentStatus,
  AdjustmentReason,
  TransferStatus,
  CountSessionStatus,
  InventoryFilters,
  InventoryStockFilter,
  ConversionCalculation,
} from '@/lib/types/inventory';
import { MOCK_PRODUCTS, Product } from '@/lib/mock-data/products';
import { MOCK_WAREHOUSES, DEFAULT_TRANSFER_INFLATION_FACTOR } from '@/lib/mock-data/warehouses';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// ============================================
// EXTENDED PRODUCTS WITH INVENTORY DATA
// (Adding last purchase/sale dates from Doc 04)
// ============================================

interface ExtendedProductData {
  productId: string;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  warehouseId: string;
}

const EXTENDED_PRODUCT_DATA: ExtendedProductData[] = [
  { productId: 'EVL-00001', lastPurchaseDate: '2026-01-16', lastSaleDate: '2026-01-21', warehouseId: 'WH-001' },
  { productId: 'EVL-00002', lastPurchaseDate: '2026-02-10', lastSaleDate: '2026-02-20', warehouseId: 'WH-001' },
  { productId: 'EVL-00003', lastPurchaseDate: '2026-01-05', lastSaleDate: '2026-02-15', warehouseId: 'WH-001' },
  { productId: 'EVL-00004', lastPurchaseDate: '2025-11-20', lastSaleDate: '2026-01-10', warehouseId: 'WH-001' },
  { productId: 'EVL-00005', lastPurchaseDate: '2025-08-15', lastSaleDate: '2025-10-20', warehouseId: 'WH-001' }, // Stagnant 4+ months
  { productId: 'EVL-00006', lastPurchaseDate: '2026-02-01', lastSaleDate: '2026-02-18', warehouseId: 'WH-001' },
  { productId: 'EVL-00007', lastPurchaseDate: '2026-01-25', lastSaleDate: '2026-02-12', warehouseId: 'WH-001' },
  { productId: 'EVL-00008', lastPurchaseDate: '2025-12-10', lastSaleDate: '2026-02-05', warehouseId: 'WH-001' },
  { productId: 'EVL-00009', lastPurchaseDate: '2025-06-12', lastSaleDate: '2025-09-25', warehouseId: 'WH-001' }, // Stagnant 6+ months
  { productId: 'EVL-00010', lastPurchaseDate: '2026-02-08', lastSaleDate: '2026-02-22', warehouseId: 'WH-001' },
  { productId: 'EVL-00011', lastPurchaseDate: '2025-10-05', lastSaleDate: '2025-11-15', warehouseId: 'WH-001' }, // Stagnant 4+ months
  { productId: 'EVL-00012', lastPurchaseDate: '2021-04-19', lastSaleDate: '2021-05-11', warehouseId: 'WH-001' }, // VERY stagnant - 5 years!
  { productId: 'EVL-00013', lastPurchaseDate: '2026-01-28', lastSaleDate: '2026-02-19', warehouseId: 'WH-001' },
  { productId: 'EVL-00014', lastPurchaseDate: '2026-02-05', lastSaleDate: '2026-02-21', warehouseId: 'WH-001' },
  { productId: 'EVL-00015', lastPurchaseDate: '2026-02-12', lastSaleDate: '2026-02-23', warehouseId: 'WH-001' },
  { productId: 'EVL-00016', lastPurchaseDate: '2025-12-20', lastSaleDate: '2026-02-10', warehouseId: 'WH-001' },
  { productId: 'EVL-00017', lastPurchaseDate: '2026-02-01', lastSaleDate: '2026-02-24', warehouseId: 'WH-001' },
  { productId: 'EVL-00018', lastPurchaseDate: '2024-10-08', lastSaleDate: '2024-12-31', warehouseId: 'WH-001' }, // Stagnant - from Doc 04
  { productId: 'EVL-00019', lastPurchaseDate: '2026-01-15', lastSaleDate: '2026-02-08', warehouseId: 'WH-001' },
  { productId: 'EVL-00020', lastPurchaseDate: '2025-11-25', lastSaleDate: '2025-12-17', warehouseId: 'WH-001' }, // Stagnant 4+ months
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMonthsDifference(date1: Date, date2: Date): number {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12;
  return months - date1.getMonth() + date2.getMonth();
}

function calculateAlerts(product: Product, extData: ExtendedProductData): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  const now = new Date('2026-02-24'); // Current date from system

  // Out of stock
  if (product.stock.available === 0) {
    alerts.push({
      type: 'out_of_stock',
      severity: 'danger',
      message: 'Sin stock disponible',
      productId: product.id,
      actionLabel: 'Crear OC',
      actionHref: `/compras/nueva?product=${product.id}`,
    });
  }
  // Low stock
  else if (product.stock.available <= product.minimumQty) {
    alerts.push({
      type: 'low_stock',
      severity: 'warning',
      message: `Stock bajo mínimo (${product.stock.available}/${product.minimumQty})`,
      productId: product.id,
      actionLabel: 'Crear OC',
      actionHref: `/compras/nueva?product=${product.id}`,
    });
  }

  // Reorder point alert (F1)
  if (product.reorderPoint != null && product.stock.available > 0 && product.stock.available <= product.reorderPoint) {
    alerts.push({
      type: 'reorder_point',
      severity: 'warning',
      message: `Bajo punto de reorden (${product.stock.available} disponible, mínimo: ${product.reorderPoint})`,
      productId: product.id,
      actionLabel: 'Crear OC',
      actionHref: `/compras/nueva?product=${product.id}`,
    });
  }

  // Stagnant products (Regla de Javier)
  const lastMovement = extData.lastSaleDate || extData.lastPurchaseDate;
  if (lastMovement) {
    const lastDate = new Date(lastMovement);
    const monthsSinceMovement = getMonthsDifference(lastDate, now);

    if (monthsSinceMovement >= 6) {
      alerts.push({
        type: 'stagnant_6m',
        severity: 'danger',
        message: `Sin movimiento hace ${monthsSinceMovement} meses`,
        productId: product.id,
      });
    } else if (monthsSinceMovement >= 4) {
      alerts.push({
        type: 'stagnant_4m',
        severity: 'warning',
        message: `Sin movimiento hace ${monthsSinceMovement} meses`,
        productId: product.id,
      });
    }
  }

  return alerts;
}

// ============================================
// INVENTORY ITEMS
// ============================================

export function getInventoryItems(filters?: InventoryFilters): InventoryItem[] {
  const warehouse = MOCK_WAREHOUSES[0]; // Default to first warehouse

  const items: InventoryItem[] = MOCK_PRODUCTS.map((product) => {
    const extData = EXTENDED_PRODUCT_DATA.find((e) => e.productId === product.id) || {
      productId: product.id,
      warehouseId: 'WH-001',
    };

    const alerts = calculateAlerts(product, extData);

    return {
      productId: product.id,
      productReference: product.reference,
      productDescription: product.description,
      group: product.group,
      subGroup: product.subGroup,
      brand: product.brand,
      supplier: product.supplier,
      warehouseId: extData.warehouseId,
      warehouseName: warehouse.name,
      existence: product.stock.existence,
      arriving: product.stock.arriving,
      reserved: product.stock.reserved,
      available: product.stock.available,
      minimumQty: product.minimumQty,
      reorderPoint: product.reorderPoint,
      unitsPerCase: product.unitsPerCase,
      lastPurchaseDate: extData.lastPurchaseDate,
      lastSaleDate: extData.lastSaleDate,
      costCIF: product.costCIF,
      stockValue: product.stock.existence * product.costCIF,
      alerts,
    };
  });

  // Apply filters
  if (!filters) return items;

  return items.filter((item) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        item.productDescription.toLowerCase().includes(searchLower) ||
        item.productReference.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Stock filter
    if (filters.stockFilter && filters.stockFilter !== 'all') {
      switch (filters.stockFilter) {
        case 'in_stock':
          if (item.available <= item.minimumQty) return false;
          break;
        case 'low_stock':
          if (item.available === 0 || item.available > item.minimumQty) return false;
          break;
        case 'out_of_stock':
          if (item.available !== 0) return false;
          break;
        case 'stagnant':
          if (!item.alerts.some((a) => a.type === 'stagnant_4m' || a.type === 'stagnant_6m')) return false;
          break;
        case 'arriving':
          if (item.arriving === 0) return false;
          break;
        case 'below_reorder':
          if (!item.reorderPoint || item.available > item.reorderPoint) return false;
          break;
      }
    }

    // Group filter
    if (filters.group && item.group !== filters.group) return false;

    // Brand filter
    if (filters.brand && item.brand !== filters.brand) return false;

    // Warehouse filter
    if (filters.warehouseId && item.warehouseId !== filters.warehouseId) return false;

    // Supplier filter
    if (filters.supplierId && item.supplier !== filters.supplierId) return false;

    return true;
  });
}

// ============================================
// SEED DATA: ADJUSTMENTS
// ============================================

const SEED_ADJUSTMENTS: InventoryAdjustment[] = [
  {
    id: 'AJ-00001',
    createdAt: '2026-02-20T10:30:00Z',
    createdBy: 'USR-008',
    createdByName: 'Ariel Brome (Tráfico)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    type: 'negativo',
    reason: 'rotura',
    observation: 'Cajas dañadas durante descarga de contenedor DMC-2026-015',
    evidenceUrls: ['/images/evidence/aj-00001-1.jpg'],
    lines: [
      {
        id: 'AJL-001',
        productId: 'EVL-00001',
        productReference: 'EVL-00001',
        productDescription: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
        currentStock: 129,
        adjustmentQty: -3,
        resultingStock: 126,
        costCIF: 83.95,
        lineValue: 251.85,
      },
      {
        id: 'AJL-002',
        productId: 'EVL-00006',
        productReference: 'EVL-00006',
        productDescription: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
        currentStock: 43,
        adjustmentQty: -2,
        resultingStock: 41,
        costCIF: 43.7,
        lineValue: 87.4,
      },
    ],
    totalItems: 5,
    totalValue: 339.25,
    status: 'pendiente',
  },
  {
    id: 'AJ-00002',
    createdAt: '2026-02-18T14:15:00Z',
    createdBy: 'USR-008',
    createdByName: 'Ariel Brome (Tráfico)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    type: 'positivo',
    reason: 'error_conteo',
    observation: 'Se encontraron cajas adicionales en inventario físico zona B',
    lines: [
      {
        id: 'AJL-003',
        productId: 'EVL-00009',
        productReference: 'EVL-00009',
        productDescription: 'WHISKY CHIVAS REGAL 12YRS S/C NR 12X750',
        currentStock: 119,
        adjustmentQty: 5,
        resultingStock: 124,
        costCIF: 143.75,
        lineValue: 718.75,
      },
    ],
    totalItems: 5,
    totalValue: 718.75,
    status: 'aprobado',
    approvedBy: 'USR-003',
    approvedByName: 'Javier Lange (Gerencia)',
    approvedAt: '2026-02-19T09:00:00Z',
    approvalNotes: 'Verificado con fotos del conteo',
  },
  {
    id: 'AJ-00003',
    createdAt: '2026-02-15T11:00:00Z',
    createdBy: 'USR-005',
    createdByName: 'María (Bodega)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    type: 'negativo',
    reason: 'vencimiento',
    observation: 'Productos vencidos retirados de estante',
    lines: [
      {
        id: 'AJL-004',
        productId: 'EVL-00018',
        productReference: 'EVL-00018',
        productDescription: 'SNACKS PRINGLES BBQ 12X149G',
        currentStock: 35,
        adjustmentQty: -10,
        resultingStock: 25,
        costCIF: 18.4,
        lineValue: 184.0,
      },
    ],
    totalItems: 10,
    totalValue: 184.0,
    status: 'aplicado',
    approvedBy: 'USR-003',
    approvedByName: 'Javier Lange (Gerencia)',
    approvedAt: '2026-02-15T15:30:00Z',
    appliedAt: '2026-02-15T15:35:00Z',
  },
  {
    id: 'AJ-00004',
    createdAt: '2026-02-10T09:45:00Z',
    createdBy: 'USR-005',
    createdByName: 'María (Bodega)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    type: 'negativo',
    reason: 'robo',
    observation: 'Faltante detectado en auditoría sorpresa',
    lines: [
      {
        id: 'AJL-005',
        productId: 'EVL-00004',
        productReference: 'EVL-00004',
        productDescription: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
        currentStock: 23,
        adjustmentQty: -2,
        resultingStock: 21,
        costCIF: 607.2,
        lineValue: 1214.4,
      },
    ],
    totalItems: 2,
    totalValue: 1214.4,
    status: 'rechazado',
    approvedBy: 'USR-003',
    approvedByName: 'Javier Lange (Gerencia)',
    approvedAt: '2026-02-11T10:00:00Z',
    rejectionReason: 'Requiere investigación adicional antes de procesar. Contactar seguridad.',
  },
  {
    id: 'AJ-00005',
    createdAt: '2026-02-22T16:20:00Z',
    createdBy: 'USR-008',
    createdByName: 'Ariel Brome (Tráfico)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    type: 'negativo',
    reason: 'merma',
    observation: 'Merma por evaporación detectada en auditoría',
    lines: [
      {
        id: 'AJL-006',
        productId: 'EVL-00007',
        productReference: 'EVL-00007',
        productDescription: 'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
        currentStock: 30,
        adjustmentQty: -1,
        resultingStock: 29,
        costCIF: 59.8,
        lineValue: 59.8,
      },
    ],
    totalItems: 1,
    totalValue: 59.8,
    status: 'pendiente',
  },
];

// ============================================
// SEED DATA: TRANSFERS
// ============================================

const SEED_TRANSFERS: InventoryTransfer[] = [
  {
    id: 'TR-00001',
    createdAt: '2026-02-21T14:00:00Z',
    createdBy: 'USR-004',
    createdByName: 'Celideth (Compras)',
    sourceWarehouseId: 'WH-001',
    sourceWarehouseName: 'Bodega Zona Libre',
    sourceWarehouseType: 'B2B',
    destWarehouseId: 'WH-002',
    destWarehouseName: 'Tienda Panama City',
    destWarehouseType: 'B2C',
    observation: 'Reposición semanal tienda PTY',
    lines: [
      {
        id: 'TRL-001',
        productId: 'EVL-00001',
        productReference: 'EVL-00001',
        productDescription: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
        sourceStock: 129,
        quantityCases: 5,
        unitsPerCase: 24,
        resultingUnits: 120,
        realCostCIF: 83.95,
        transferCost: 96.54, // 83.95 * 1.15
        totalValue: 419.75,
      },
      {
        id: 'TRL-002',
        productId: 'EVL-00007',
        productReference: 'EVL-00007',
        productDescription: 'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
        sourceStock: 30,
        quantityCases: 3,
        unitsPerCase: 6,
        resultingUnits: 18,
        realCostCIF: 59.8,
        transferCost: 68.77,
        totalValue: 179.4,
      },
    ],
    totalCases: 8,
    totalUnits: 138,
    totalValue: 599.15,
    inflationFactor: 1.15,
    status: 'enviada',
  },
  {
    id: 'TR-00002',
    createdAt: '2026-02-14T10:30:00Z',
    createdBy: 'USR-004',
    createdByName: 'Celideth (Compras)',
    sourceWarehouseId: 'WH-001',
    sourceWarehouseName: 'Bodega Zona Libre',
    sourceWarehouseType: 'B2B',
    destWarehouseId: 'WH-002',
    destWarehouseName: 'Tienda Panama City',
    destWarehouseType: 'B2C',
    observation: 'Transferencia productos premium',
    lines: [
      {
        id: 'TRL-003',
        productId: 'EVL-00004',
        productReference: 'EVL-00004',
        productDescription: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
        sourceStock: 23,
        quantityCases: 2,
        unitsPerCase: 6,
        resultingUnits: 12,
        realCostCIF: 607.2,
        transferCost: 698.28,
        totalValue: 1214.4,
        receivedQty: 12,
        hasDiscrepancy: false,
      },
    ],
    totalCases: 2,
    totalUnits: 12,
    totalValue: 1214.4,
    inflationFactor: 1.15,
    status: 'recibida',
    receivedAt: '2026-02-15T09:00:00Z',
    receivedBy: 'USR-006',
    receivedByName: 'Carlos (Tienda)',
    hasDiscrepancies: false,
  },
  {
    id: 'TR-00003',
    createdAt: '2026-02-08T11:15:00Z',
    createdBy: 'USR-004',
    createdByName: 'Celideth (Compras)',
    sourceWarehouseId: 'WH-001',
    sourceWarehouseName: 'Bodega Zona Libre',
    sourceWarehouseType: 'B2B',
    destWarehouseId: 'WH-002',
    destWarehouseName: 'Tienda Panama City',
    destWarehouseType: 'B2C',
    observation: 'Reposición licores',
    lines: [
      {
        id: 'TRL-004',
        productId: 'EVL-00011',
        productReference: 'EVL-00011',
        productDescription: 'LICOR AMARETTO DISARONNO RF 12X750ML',
        sourceStock: 100,
        quantityCases: 5,
        unitsPerCase: 12,
        resultingUnits: 60,
        realCostCIF: 109.25,
        transferCost: 125.64,
        totalValue: 546.25,
        receivedQty: 58, // Discrepancy!
        hasDiscrepancy: true,
        discrepancyNotes: 'Faltaron 2 botellas en una caja, caja llegó abierta',
      },
    ],
    totalCases: 5,
    totalUnits: 60,
    totalValue: 546.25,
    inflationFactor: 1.15,
    status: 'recibida_discrepancia',
    receivedAt: '2026-02-09T08:30:00Z',
    receivedBy: 'USR-006',
    receivedByName: 'Carlos (Tienda)',
    hasDiscrepancies: true,
    discrepancySummary: '2 unidades faltantes en LICOR AMARETTO DISARONNO',
  },
];

// ============================================
// SEED DATA: PHYSICAL COUNT SESSIONS
// ============================================

const SEED_COUNT_SESSIONS: PhysicalCountSession[] = [
  {
    id: 'CF-00001',
    createdAt: '2026-02-23T08:00:00Z',
    createdBy: 'USR-008',
    createdByName: 'Ariel Brome (Tráfico)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    zone: 'Pasillo A - Whisky',
    status: 'en_progreso',
    lines: [
      {
        id: 'CFL-001',
        productId: 'EVL-00001',
        productReference: 'EVL-00001',
        productDescription: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
        barcode: '0000050196166',
        systemQty: 129,
        countedQty: 126,
        difference: -3,
        scannedAt: '2026-02-23T08:15:00Z',
        countedBy: 'Ariel Brome',
      },
      {
        id: 'CFL-002',
        productId: 'EVL-00002',
        productReference: 'EVL-00002',
        productDescription: 'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
        barcode: '5000267014005',
        systemQty: 100,
        countedQty: 100,
        difference: 0,
        scannedAt: '2026-02-23T08:20:00Z',
        countedBy: 'Ariel Brome',
      },
      {
        id: 'CFL-003',
        productId: 'EVL-00003',
        productReference: 'EVL-00003',
        productDescription: 'WHISKY JOHNNIE WALKER BLACK 12YRS 24X375ML 40%V',
        systemQty: 50,
        countedQty: 52,
        difference: 2,
        scannedAt: '2026-02-23T08:25:00Z',
        countedBy: 'Ariel Brome',
      },
      {
        id: 'CFL-004',
        productId: 'EVL-00009',
        productReference: 'EVL-00009',
        productDescription: 'WHISKY CHIVAS REGAL 12YRS S/C NR 12X750',
        systemQty: 119,
        // Not yet counted
      },
      {
        id: 'CFL-005',
        productId: 'EVL-00013',
        productReference: 'EVL-00013',
        productDescription: 'WHISKY GLENFIDDICH 12AÑO CRCH 12X750ML 40%',
        systemQty: 25,
        // Not yet counted
      },
    ],
    totalProducts: 5,
    countedProducts: 3,
    productsWithDifference: 2,
  },
  {
    id: 'CF-00002',
    createdAt: '2026-02-15T07:30:00Z',
    createdBy: 'USR-005',
    createdByName: 'María (Bodega)',
    warehouseId: 'WH-001',
    warehouseName: 'Bodega Zona Libre',
    zone: 'Pasillo C - Tequila/Mezcal',
    status: 'completado',
    lines: [
      {
        id: 'CFL-006',
        productId: 'EVL-00004',
        productReference: 'EVL-00004',
        productDescription: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
        systemQty: 23,
        countedQty: 23,
        difference: 0,
        scannedAt: '2026-02-15T07:45:00Z',
        countedBy: 'María',
      },
      {
        id: 'CFL-007',
        productId: 'EVL-00005',
        productReference: 'EVL-00005',
        productDescription: 'TEQUILA CLASE AZUL REPOSADO GB 6X750ML 40%',
        systemQty: 7,
        countedQty: 7,
        difference: 0,
        scannedAt: '2026-02-15T07:50:00Z',
        countedBy: 'María',
      },
      {
        id: 'CFL-008',
        productId: 'EVL-00019',
        productReference: 'EVL-00019',
        productDescription: 'TEQUILA 1800 COCONUT R NK 12X750ML 35%V',
        systemQty: 47,
        countedQty: 47,
        difference: 0,
        scannedAt: '2026-02-15T08:00:00Z',
        countedBy: 'María',
      },
    ],
    totalProducts: 3,
    countedProducts: 3,
    productsWithDifference: 0,
    completedAt: '2026-02-15T08:10:00Z',
    completedBy: 'USR-005',
    completedByName: 'María (Bodega)',
    adjustmentsGenerated: 0,
  },
];

// ============================================
// STORE INFRASTRUCTURE: ADJUSTMENTS
// ============================================

let _adjustments: InventoryAdjustment[] = SEED_ADJUSTMENTS;
let _adjustmentsInitialized = false;
const { subscribe: subscribeAdjustments, notify: _notifyAdjustments } = createSubscribers();

function ensureAdjustmentsInitialized(): void {
  if (typeof window === 'undefined' || _adjustmentsInitialized) return;
  _adjustments = loadCollection<InventoryAdjustment>('adjustments', SEED_ADJUSTMENTS);
  _adjustmentsInitialized = true;
}

export function getAdjustmentsData(): InventoryAdjustment[] {
  ensureAdjustmentsInitialized();
  return _adjustments;
}

export { subscribeAdjustments };

// Backward-compatible export
export const MOCK_ADJUSTMENTS: InventoryAdjustment[] = new Proxy(SEED_ADJUSTMENTS as InventoryAdjustment[], {
  get(_target, prop, receiver) {
    ensureAdjustmentsInitialized();
    return Reflect.get(_adjustments, prop, receiver);
  },
});

// CRUD
export function addAdjustment(adjustment: InventoryAdjustment): void {
  ensureAdjustmentsInitialized();
  _adjustments = [..._adjustments, adjustment];
  saveCollection('adjustments', _adjustments);
  _notifyAdjustments();
}

export function updateAdjustment(id: string, updates: Partial<InventoryAdjustment>): void {
  ensureAdjustmentsInitialized();
  _adjustments = _adjustments.map((a) =>
    a.id === id ? { ...a, ...updates } : a
  );
  saveCollection('adjustments', _adjustments);
  _notifyAdjustments();
}

export function removeAdjustment(id: string): void {
  ensureAdjustmentsInitialized();
  _adjustments = _adjustments.filter((a) => a.id !== id);
  saveCollection('adjustments', _adjustments);
  _notifyAdjustments();
}

// ============================================
// STORE INFRASTRUCTURE: TRANSFERS
// ============================================

let _transfers: InventoryTransfer[] = SEED_TRANSFERS;
let _transfersInitialized = false;
const { subscribe: subscribeTransfers, notify: _notifyTransfers } = createSubscribers();

function ensureTransfersInitialized(): void {
  if (typeof window === 'undefined' || _transfersInitialized) return;
  _transfers = loadCollection<InventoryTransfer>('transfers', SEED_TRANSFERS);
  _transfersInitialized = true;
}

export function getTransfersData(): InventoryTransfer[] {
  ensureTransfersInitialized();
  return _transfers;
}

export { subscribeTransfers };

// Backward-compatible export
export const MOCK_TRANSFERS: InventoryTransfer[] = new Proxy(SEED_TRANSFERS as InventoryTransfer[], {
  get(_target, prop, receiver) {
    ensureTransfersInitialized();
    return Reflect.get(_transfers, prop, receiver);
  },
});

// CRUD
export function addTransfer(transfer: InventoryTransfer): void {
  ensureTransfersInitialized();
  _transfers = [..._transfers, transfer];
  saveCollection('transfers', _transfers);
  _notifyTransfers();
}

export function updateTransfer(id: string, updates: Partial<InventoryTransfer>): void {
  ensureTransfersInitialized();
  _transfers = _transfers.map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );
  saveCollection('transfers', _transfers);
  _notifyTransfers();
}

export function removeTransfer(id: string): void {
  ensureTransfersInitialized();
  _transfers = _transfers.filter((t) => t.id !== id);
  saveCollection('transfers', _transfers);
  _notifyTransfers();
}

// ============================================
// STORE INFRASTRUCTURE: COUNT SESSIONS
// ============================================

let _countSessions: PhysicalCountSession[] = SEED_COUNT_SESSIONS;
let _countSessionsInitialized = false;
const { subscribe: subscribeCountSessions, notify: _notifyCountSessions } = createSubscribers();

function ensureCountSessionsInitialized(): void {
  if (typeof window === 'undefined' || _countSessionsInitialized) return;
  _countSessions = loadCollection<PhysicalCountSession>('count_sessions', SEED_COUNT_SESSIONS);
  _countSessionsInitialized = true;
}

export function getCountSessionsData(): PhysicalCountSession[] {
  ensureCountSessionsInitialized();
  return _countSessions;
}

export { subscribeCountSessions };

// Backward-compatible export
export const MOCK_COUNT_SESSIONS: PhysicalCountSession[] = new Proxy(SEED_COUNT_SESSIONS as PhysicalCountSession[], {
  get(_target, prop, receiver) {
    ensureCountSessionsInitialized();
    return Reflect.get(_countSessions, prop, receiver);
  },
});

// CRUD
export function addCountSession(session: PhysicalCountSession): void {
  ensureCountSessionsInitialized();
  _countSessions = [..._countSessions, session];
  saveCollection('count_sessions', _countSessions);
  _notifyCountSessions();
}

export function updateCountSession(id: string, updates: Partial<PhysicalCountSession>): void {
  ensureCountSessionsInitialized();
  _countSessions = _countSessions.map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveCollection('count_sessions', _countSessions);
  _notifyCountSessions();
}

export function removeCountSession(id: string): void {
  ensureCountSessionsInitialized();
  _countSessions = _countSessions.filter((c) => c.id !== id);
  saveCollection('count_sessions', _countSessions);
  _notifyCountSessions();
}

// ============================================
// INVENTORY STATS
// ============================================

export function getInventoryStats(): InventoryStats {
  ensureAdjustmentsInitialized();
  const items = getInventoryItems();

  const productsWithStock = items.filter((i) => i.available > i.minimumQty).length;
  const belowMinimum = items.filter((i) => i.available > 0 && i.available <= i.minimumQty).length;
  const belowReorderPoint = items.filter((i) => i.reorderPoint != null && i.available <= i.reorderPoint).length;
  const outOfStock = items.filter((i) => i.available === 0).length;
  const stagnant4Months = items.filter((i) =>
    i.alerts.some((a) => a.type === 'stagnant_4m' || a.type === 'stagnant_6m')
  ).length;
  const stagnant6Months = items.filter((i) => i.alerts.some((a) => a.type === 'stagnant_6m')).length;
  const totalValue = items.reduce((sum, i) => sum + i.stockValue, 0);
  const arrivingProducts = items.filter((i) => i.arriving > 0).length;

  return {
    productsWithStock,
    belowMinimum,
    belowReorderPoint,
    outOfStock,
    stagnant4Months,
    stagnant6Months,
    totalValue,
    pendingAdjustments: _adjustments.filter((a) => a.status === 'pendiente').length,
    arrivingProducts,
  };
}

// ============================================
// HELPER FUNCTIONS FOR INVENTORY MODULE
// ============================================

export function getAdjustmentById(id: string): InventoryAdjustment | undefined {
  ensureAdjustmentsInitialized();
  return _adjustments.find((a) => a.id === id);
}

export function getTransferById(id: string): InventoryTransfer | undefined {
  ensureTransfersInitialized();
  return _transfers.find((t) => t.id === id);
}

export function getCountSessionById(id: string): PhysicalCountSession | undefined {
  ensureCountSessionsInitialized();
  return _countSessions.find((c) => c.id === id);
}

export function getPendingAdjustments(): InventoryAdjustment[] {
  ensureAdjustmentsInitialized();
  return _adjustments.filter((a) => a.status === 'pendiente');
}

export function getPendingTransfers(): InventoryTransfer[] {
  ensureTransfersInitialized();
  return _transfers.filter((t) => t.status === 'enviada');
}

export function getActiveCountSessions(): PhysicalCountSession[] {
  ensureCountSessionsInitialized();
  return _countSessions.filter((c) => c.status === 'en_progreso');
}

// Calculate box-to-bottle conversion for B2B to B2C transfers
export function calculateConversion(
  product: Product,
  casesQty: number,
  inflationFactor: number = DEFAULT_TRANSFER_INFLATION_FACTOR
): ConversionCalculation {
  const totalUnits = casesQty * product.unitsPerCase;
  const realCostPerUnit = product.costCIF / product.unitsPerCase;
  const inflatedCostPerUnit = realCostPerUnit * inflationFactor;
  const totalRealCost = casesQty * product.costCIF;
  const totalTransferCost = totalUnits * inflatedCostPerUnit;

  return {
    casesTransferred: casesQty,
    unitsPerCase: product.unitsPerCase,
    totalUnits,
    realCostPerCase: product.costCIF,
    realCostPerUnit,
    inflatedCostPerUnit,
    totalRealCost,
    totalTransferCost,
  };
}

// Validate stock operation (prevent negative availability)
export function validateStockOperation(
  productId: string,
  quantityToReduce: number
): { valid: boolean; message?: string; currentAvailable?: number; projectedAvailable?: number } {
  const items = getInventoryItems();
  const item = items.find((i) => i.productId === productId);

  if (!item) {
    return { valid: false, message: 'Producto no encontrado en inventario' };
  }

  const projectedAvailable = item.available - quantityToReduce;

  if (projectedAvailable < 0) {
    return {
      valid: false,
      message: `Operación bloqueada: Disponible resultante sería ${projectedAvailable} unidades`,
      currentAvailable: item.available,
      projectedAvailable,
    };
  }

  return {
    valid: true,
    currentAvailable: item.available,
    projectedAvailable,
  };
}

// Generate next ID for adjustments, transfers, count sessions
export function generateNextAdjustmentId(): string {
  ensureAdjustmentsInitialized();
  const maxId = Math.max(
    ..._adjustments.map((a) => parseInt(a.id.replace('AJ-', ''), 10)),
    0
  );
  return `AJ-${String(maxId + 1).padStart(5, '0')}`;
}

export function generateNextTransferId(): string {
  ensureTransfersInitialized();
  const maxId = Math.max(
    ..._transfers.map((t) => parseInt(t.id.replace('TR-', ''), 10)),
    0
  );
  return `TR-${String(maxId + 1).padStart(5, '0')}`;
}

export function generateNextCountSessionId(): string {
  ensureCountSessionsInitialized();
  const maxId = Math.max(
    ..._countSessions.map((c) => parseInt(c.id.replace('CF-', ''), 10)),
    0
  );
  return `CF-${String(maxId + 1).padStart(5, '0')}`;
}
