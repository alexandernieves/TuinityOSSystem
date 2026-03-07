/**
 * Product Types for Evolution OS
 * Based on real data structure from Dynamo POS
 */

export interface ProductDimensions {
  length: number;  // cm
  width: number;   // cm
  height: number;  // cm
}

export interface ProductStock {
  existence: number;    // Current physical stock
  arriving: number;     // In transit (POs not yet received)
  reserved: number;     // Reserved for pending orders
  available: number;    // existence + arriving - reserved
}

export interface ProductPrices {
  A: number;  // Highest tier
  B: number;
  C: number;
  D: number;
  E: number;  // Lowest tier
}

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
  id: string;
  reference: string;           // EVL-00001 format
  description: string;         // Full product description
  group: string;               // WHISKY, RON, VODKA, etc.
  subGroup: string;
  brand: string;
  supplier: string;            // Supplier name (hidden from vendedores)
  country: string;             // Country of origin
  barcode?: string;
  barcodes?: { code: string; label: string }[];  // Up to 5 barcodes (F3)
  tariffCode: string;          // Código arancelario (e.g., "2208309000")
  unit: string;                // CJA (case), UND (unit), etc.
  unitsPerCase: number;
  casesPerBulk?: number;       // Cases per bulk package
  casesPerPallet?: number;     // Cases per pallet
  dimensions?: ProductDimensions;
  cubicMeters?: number;        // Calculated volume
  cubicFeet?: number;
  weightPerCase?: number;      // kg
  reorderPoint?: number;       // Punto mínimo / alerta de inventario (F1)
  minimumQty: number;          // Minimum order quantity
  stock: ProductStock;
  prices: ProductPrices;
  costFOB: number;             // FOB cost (hidden from vendedores)
  costCIF: number;             // CIF cost (hidden from vendedores)
  costAvgWeighted: number;     // Weighted average cost
  priceB2C?: number;           // Retail price per bottle/unit (B2C)
  brandProtection?: boolean;   // Protección de marca activa (F14)
  brandProtectionRate?: number; // Tasa de protección (default 0.05 = 5%)
  status: ProductStatus;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Product groups (categories)
export interface ProductGroup {
  id: string;
  label: string;
  subGroups: string[];
}

// Product search/filter params
export interface ProductFilters {
  search?: string;
  group?: string;
  subGroup?: string;
  brand?: string;
  supplier?: string;
  status?: ProductStatus;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'arriving';
}

// For product import from Excel
export interface ProductImportRow {
  reference: string;
  description: string;
  group: string;
  subGroup: string;
  brand: string;
  supplier: string;
  country: string;
  barcode?: string;
  tariffCode: string;
  unit: string;
  unitsPerCase: number;
  minimumQty: number;
  priceA: number;
  priceB: number;
  priceC: number;
  priceD: number;
  priceE: number;
  costFOB: number;
  status: ProductStatus;
  // Validation errors added during import
  errors?: string[];
}
