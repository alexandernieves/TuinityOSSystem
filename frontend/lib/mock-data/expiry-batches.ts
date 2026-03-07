/**
 * Mock Expiry Batch Data (F4)
 * Simulates product batches with various expiration dates.
 */

import type { ExpiryBatch, ExpiryAlert } from '@/lib/types/expiry';
import { getExpiryAlertLevel } from '@/lib/types/expiry';

// Helper: days from now
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export const SEED_EXPIRY_BATCHES: ExpiryBatch[] = [
  // EVL-00001 Black & White - arriving, no expiry concern
  {
    id: 'EXP-001',
    productId: 'EVL-00001',
    productReference: 'EVL-00001',
    productDescription: 'WHISKY BLACK & WHITE 24X375ML',
    batchNumber: 'LOT-2025-A1',
    expiryDate: daysFromNow(540),
    quantity: 129,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(30),
  },
  // EVL-00002 JW Red - one batch expiring soon
  {
    id: 'EXP-002',
    productId: 'EVL-00002',
    productReference: 'EVL-00002',
    productDescription: 'WHISKY JOHNNIE WALKER RED 12X750ML',
    batchNumber: 'LOT-2024-R1',
    expiryDate: daysFromNow(25), // CRITICAL: < 30 days
    quantity: 40,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(330),
  },
  {
    id: 'EXP-003',
    productId: 'EVL-00002',
    productReference: 'EVL-00002',
    productDescription: 'WHISKY JOHNNIE WALKER RED 12X750ML',
    batchNumber: 'LOT-2025-R2',
    expiryDate: daysFromNow(365),
    quantity: 60,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(60),
  },
  // EVL-00006 Prosecco - wine expires faster
  {
    id: 'EXP-004',
    productId: 'EVL-00006',
    productReference: 'EVL-00006',
    productDescription: 'VINO SPERONE PROSECCO 12X750ML',
    batchNumber: 'LOT-2024-P1',
    expiryDate: daysFromNow(45), // WARNING: 30-60 days
    quantity: 20,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(270),
  },
  {
    id: 'EXP-005',
    productId: 'EVL-00006',
    productReference: 'EVL-00006',
    productDescription: 'VINO SPERONE PROSECCO 12X750ML',
    batchNumber: 'LOT-2025-P2',
    expiryDate: daysFromNow(180),
    quantity: 23,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(45),
  },
  // EVL-00010 Diplomatico - one batch in caution zone
  {
    id: 'EXP-006',
    productId: 'EVL-00010',
    productReference: 'EVL-00010',
    productDescription: 'RON DIPLOMATICO RVA EXCLUSIVA 6X750ML',
    batchNumber: 'LOT-2024-D1',
    expiryDate: daysFromNow(75), // CAUTION: 60-90 days
    quantity: 15,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(200),
  },
  {
    id: 'EXP-007',
    productId: 'EVL-00010',
    productReference: 'EVL-00010',
    productDescription: 'RON DIPLOMATICO RVA EXCLUSIVA 6X750ML',
    batchNumber: 'LOT-2025-D2',
    expiryDate: daysFromNow(420),
    quantity: 31,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(30),
  },
  // EVL-00018 Pringles - snacks expire sooner
  {
    id: 'EXP-008',
    productId: 'EVL-00018',
    productReference: 'EVL-00018',
    productDescription: 'SNACKS PRINGLES BBQ 12X149G',
    batchNumber: 'LOT-2024-S1',
    expiryDate: daysFromNow(15), // CRITICAL
    quantity: 10,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(165),
  },
  {
    id: 'EXP-009',
    productId: 'EVL-00018',
    productReference: 'EVL-00018',
    productDescription: 'SNACKS PRINGLES BBQ 12X149G',
    batchNumber: 'LOT-2025-S2',
    expiryDate: daysFromNow(120),
    quantity: 25,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(30),
  },
  // EVL-00016 Kahlua - one expired batch
  {
    id: 'EXP-010',
    productId: 'EVL-00016',
    productReference: 'EVL-00016',
    productDescription: 'LICOR KAHLUA CAFE 12X750ML',
    batchNumber: 'LOT-2023-K1',
    expiryDate: daysFromNow(-10), // EXPIRED
    quantity: 5,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(400),
  },
  {
    id: 'EXP-011',
    productId: 'EVL-00016',
    productReference: 'EVL-00016',
    productDescription: 'LICOR KAHLUA CAFE 12X750ML',
    batchNumber: 'LOT-2025-K2',
    expiryDate: daysFromNow(300),
    quantity: 60,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(20),
  },
  // EVL-00015 Captain Morgan
  {
    id: 'EXP-012',
    productId: 'EVL-00015',
    productReference: 'EVL-00015',
    productDescription: 'RON CAPTAIN MORGAN BLACK SPICED 12X1000ML',
    batchNumber: 'LOT-2025-CM1',
    expiryDate: daysFromNow(55), // WARNING
    quantity: 20,
    warehouseId: 'WH-ZL',
    warehouseName: 'Bodega Zona Libre',
    receivedAt: daysAgo(240),
  },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get all expiry batches
 */
export function getExpiryBatches(): ExpiryBatch[] {
  return SEED_EXPIRY_BATCHES;
}

/**
 * Get batches for a specific product
 */
export function getBatchesByProduct(productId: string): ExpiryBatch[] {
  return SEED_EXPIRY_BATCHES
    .filter((b) => b.productId === productId)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FIFO
}

/**
 * Get all batches with their alert status
 */
export function getExpiryAlerts(): ExpiryAlert[] {
  const now = new Date();
  return SEED_EXPIRY_BATCHES
    .map((batch) => {
      const expiryDate = new Date(batch.expiryDate);
      const diffMs = expiryDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const alertLevel = getExpiryAlertLevel(daysUntilExpiry);
      return {
        batch,
        daysUntilExpiry,
        alertLevel,
        label: daysUntilExpiry < 0
          ? `Vencido hace ${Math.abs(daysUntilExpiry)} días`
          : `Vence en ${daysUntilExpiry} días`,
      };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // Most urgent first
}

/**
 * Get alerts filtered to only concerning ones (≤90 days)
 */
export function getUpcomingExpiryAlerts(): ExpiryAlert[] {
  return getExpiryAlerts().filter((a) => a.daysUntilExpiry <= 90);
}

/**
 * Get the nearest expiry date for a product
 */
export function getNearestExpiry(productId: string): ExpiryAlert | null {
  const alerts = getExpiryAlerts().filter((a) => a.batch.productId === productId);
  return alerts.length > 0 ? alerts[0] : null;
}

/**
 * Get expiry statistics
 */
export function getExpiryStats() {
  const alerts = getExpiryAlerts();
  return {
    totalBatches: alerts.length,
    expired: alerts.filter((a) => a.alertLevel === 'expired').length,
    critical: alerts.filter((a) => a.alertLevel === 'critical').length,
    warning: alerts.filter((a) => a.alertLevel === 'warning').length,
    caution: alerts.filter((a) => a.alertLevel === 'caution').length,
    ok: alerts.filter((a) => a.alertLevel === 'ok').length,
  };
}
