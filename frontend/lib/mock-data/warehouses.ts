/**
 * Warehouses Mock Data for Evolution OS
 * Based on Document 04 - Módulo de Control de Inventario
 * Store-backed: data persists in localStorage
 */

import { Warehouse, WarehouseType } from '@/lib/types/inventory';
import { loadCollection, saveCollection, createSubscribers } from '@/lib/store/local-store';

// Seed data (used on first load only)
const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-001',
    name: 'Bodega Zona Libre',
    code: 'ZL',
    type: 'B2B',
    location: 'Colón Free Zone, Panamá',
    isActive: true,
  },
  {
    id: 'WH-002',
    name: 'Tienda Panama City',
    code: 'PTY-TIENDA',
    type: 'B2C',
    location: 'Panama City, Panamá',
    isActive: true,
  },
  {
    id: 'WH-003',
    name: 'Bodega CFZ',
    code: 'CFZ',
    type: 'B2B',
    location: 'Colón Free Zone - Sector 2',
    isActive: true,
  },
];

// ============================================================================
// STORE INFRASTRUCTURE
// ============================================================================

let _warehouses: Warehouse[] = SEED_WAREHOUSES;
let _initialized = false;
const { subscribe: subscribeWarehouses, notify: _notifyWarehouses } = createSubscribers();

function ensureInitialized(): void {
  if (typeof window === 'undefined' || _initialized) return;
  _warehouses = loadCollection<Warehouse>('warehouses', SEED_WAREHOUSES);
  _initialized = true;
}

export function getWarehousesData(): Warehouse[] {
  ensureInitialized();
  return _warehouses;
}

export { subscribeWarehouses };

// Backward-compatible export
export const MOCK_WAREHOUSES: Warehouse[] = new Proxy(SEED_WAREHOUSES as Warehouse[], {
  get(_target, prop, receiver) {
    ensureInitialized();
    return Reflect.get(_warehouses, prop, receiver);
  },
});

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export function addWarehouse(warehouse: Warehouse): void {
  ensureInitialized();
  _warehouses = [..._warehouses, warehouse];
  saveCollection('warehouses', _warehouses);
  _notifyWarehouses();
}

export function updateWarehouse(id: string, updates: Partial<Warehouse>): void {
  ensureInitialized();
  _warehouses = _warehouses.map((w) =>
    w.id === id ? { ...w, ...updates } : w
  );
  saveCollection('warehouses', _warehouses);
  _notifyWarehouses();
}

export function removeWarehouse(id: string): void {
  ensureInitialized();
  _warehouses = _warehouses.filter((w) => w.id !== id);
  saveCollection('warehouses', _warehouses);
  _notifyWarehouses();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getWarehouseById(id: string): Warehouse | undefined {
  ensureInitialized();
  return _warehouses.find((w) => w.id === id);
}

export function getWarehousesByType(type: WarehouseType): Warehouse[] {
  ensureInitialized();
  return _warehouses.filter((w) => w.type === type && w.isActive);
}

export function getActiveWarehouses(): Warehouse[] {
  ensureInitialized();
  return _warehouses.filter((w) => w.isActive);
}

export function getB2BWarehouses(): Warehouse[] {
  return getWarehousesByType('B2B');
}

export function getB2CWarehouses(): Warehouse[] {
  return getWarehousesByType('B2C');
}

// Check if transfer is B2B to B2C (requires conversion)
export function isB2BtoB2CTransfer(sourceId: string, destId: string): boolean {
  const source = getWarehouseById(sourceId);
  const dest = getWarehouseById(destId);
  return source?.type === 'B2B' && dest?.type === 'B2C';
}

// Default inflation factor for B2B to B2C transfers
export const DEFAULT_TRANSFER_INFLATION_FACTOR = 1.15; // 15% markup
