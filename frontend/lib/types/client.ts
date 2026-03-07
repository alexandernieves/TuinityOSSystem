/**
 * Client/Customer types for Ventas B2B module
 * Based on Document 005 specifications
 */

// Price level tiers (A=highest/mayorista, E=lowest/público)
export type PriceLevel = 'A' | 'B' | 'C' | 'D' | 'E';

// Payment terms
export type PaymentTerms =
  | 'contado'       // Cash on delivery
  | 'credito_15'    // 15 days credit
  | 'credito_30'    // 30 days credit
  | 'credito_45'    // 45 days credit
  | 'credito_60';   // 60 days credit

// Client status
export type ClientStatus = 'active' | 'inactive' | 'blocked';

// Client contact
export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;       // Ej: "Compras", "Gerente", "Contabilidad"
  isPrimary: boolean;
}

// Shipping address
export interface ShippingAddress {
  id: string;
  label: string;       // "Principal", "Bodega", "Sucursal"
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

// Main Client interface
export interface Client {
  id: string;                      // CLI-00001 or {ISO}-{SEQ} format (F8)
  countryCode?: string;            // ISO country code for auto-generated IDs (F8)
  name: string;                    // Company name
  tradeName?: string;              // Nombre comercial
  taxId: string;                   // RUC / Tax ID / NIT
  taxIdType?: string;              // "RUC", "NIT", "EIN"
  country: string;
  city?: string;
  address?: string;

  // Pricing & Credit
  priceLevel: PriceLevel;          // Auto-assigned, vendedor cannot change
  creditLimit: number;             // Credit limit in USD
  creditUsed: number;              // Current balance (outstanding invoices)
  creditAvailable: number;         // = creditLimit - creditUsed
  paymentTerms: PaymentTerms;

  // Contacts & Addresses
  contacts: ClientContact[];
  shippingAddresses: ShippingAddress[];

  // Relationships
  salesRepId?: string;             // Assigned vendedor
  salesRepName?: string;           // Denormalized for display

  // KYC / Due Diligence (F9)
  kycStatus?: 'not_required' | 'pending' | 'in_review' | 'approved' | 'expired' | 'rejected';
  kycExpiresAt?: string;

  // Status & Metadata
  status: ClientStatus;
  notes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;

  // Statistics (computed)
  totalOrders?: number;
  totalPurchases?: number;         // Total USD lifetime
  averageOrderValue?: number;
}

// Credit status indicator
export interface CreditStatus {
  available: number;
  used: number;
  limit: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'exceeded' | 'blocked';
  message: string;
}

// Client filters for list page
export interface ClientFilters {
  search?: string;
  priceLevel?: PriceLevel | 'all';
  country?: string;
  status?: ClientStatus | 'all';
  hasCreditAvailable?: boolean;
  salesRepId?: string;
}

// Client stats for dashboard
export interface ClientStats {
  totalClients: number;
  activeClients: number;
  withCreditAvailable: number;
  blockedClients: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
}

// Payment terms labels
export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  contado: 'Contado',
  credito_15: 'Crédito 15 días',
  credito_30: 'Crédito 30 días',
  credito_45: 'Crédito 45 días',
  credito_60: 'Crédito 60 días',
};

// Price level labels
export const PRICE_LEVEL_LABELS: Record<PriceLevel, string> = {
  A: 'Nivel A - Mayorista',
  B: 'Nivel B - Distribuidor',
  C: 'Nivel C - Detallista',
  D: 'Nivel D - Especial',
  E: 'Nivel E - Público',
};

// Client status labels
export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
};
