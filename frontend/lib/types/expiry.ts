/**
 * Expiry Date Management Types (F4)
 * Tracks product batches with expiration dates for FIFO and alerts.
 */

export type ExpiryAlertLevel = 'ok' | 'caution' | 'warning' | 'critical' | 'expired';

export interface ExpiryBatch {
  id: string;
  productId: string;
  productReference: string;
  productDescription: string;
  batchNumber: string;         // Lot/batch identifier
  expiryDate: string;          // ISO date
  quantity: number;            // Units in this batch
  warehouseId: string;
  warehouseName: string;
  receivedAt: string;          // When this batch was received
  purchaseOrderId?: string;    // Source PO if applicable
}

export interface ExpiryAlert {
  batch: ExpiryBatch;
  daysUntilExpiry: number;
  alertLevel: ExpiryAlertLevel;
  label: string;
}

export const EXPIRY_ALERT_CONFIG: Record<ExpiryAlertLevel, { bg: string; text: string; label: string }> = {
  ok: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: '> 90 días' },
  caution: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: '60-90 días' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: '30-60 días' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-500', label: '< 30 días' },
  expired: { bg: 'bg-red-500/20', text: 'text-red-600', label: 'Vencido' },
};

/**
 * Determine alert level based on days until expiry
 */
export function getExpiryAlertLevel(daysUntilExpiry: number): ExpiryAlertLevel {
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'critical';
  if (daysUntilExpiry <= 60) return 'warning';
  if (daysUntilExpiry <= 90) return 'caution';
  return 'ok';
}
