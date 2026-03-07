/**
 * Traffic & Documentation types for Evolution OS
 * Módulo de Tráfico y Documentación
 *
 * Handles: Expedientes de embarque, DMC (Declaración de Mercancías),
 * Bill of Lading, Certificados de Libre Venta, tracking timeline
 */

// ============================================
// STATUS & ENUM TYPES
// ============================================

export type ShipmentType = 'salida' | 'entrada' | 'traspaso' | 'transferencia';

export type ShipmentStatus =
  | 'pendiente'       // Waiting to be processed
  | 'en_proceso'      // Being documented
  | 'documentado'     // All documents ready
  | 'despachado'      // Dispatched from origin
  | 'en_transito'     // In transit to destination
  | 'entregado'       // Delivered
  | 'cancelado';      // Cancelled

export type DMCType = 'salida' | 'entrada' | 'traspaso';

export type DMCStatus =
  | 'borrador'        // Draft - being prepared
  | 'completado'      // All fields filled, ready for registration
  | 'registrado'      // Registered with government platform
  | 'anulado';        // Annulled

export type BLStatus =
  | 'borrador'        // Draft
  | 'completado'      // Complete, ready to send
  | 'enviado';        // Sent to carrier/consignee

export type CertificateType = 'libre_venta' | 'origen' | 'fitosanitario';

export type TransportMode = 'maritimo' | 'aereo' | 'terrestre' | 'multimodal';

export type ShipmentPriority = 'urgente' | 'normal' | 'anticipado';

// ============================================
// SUPPORTING INTERFACES
// ============================================

export interface Port {
  id: string;
  code: string;
  name: string;
  country: string;
}

export interface Carrier {
  id: string;
  name: string;
  type: 'naviera' | 'aerolinea' | 'terrestre';
}

export interface RelatedCompany {
  id: string;
  name: string;
  ruc: string;
  address: string;
  country: string;
  relationship: string;
}

export interface DestinationRequirement {
  country: string;
  requiresDMC: boolean;
  requiresBL: boolean;
  requiresFreeSaleCert: boolean;
  requiresOriginCert: boolean;
  notes?: string;
}

// ============================================
// TRANSPORT DATA
// ============================================

export interface TransportData {
  mode: TransportMode;
  carrierName?: string;
  vesselName?: string;
  voyageNumber?: string;
  bookingNumber?: string;
  containerNumber?: string;
  containerType?: string;         // '20ft' | '40ft' | '40ft_hc' | 'reefer'
  sealNumber?: string;
  portOfLoading: string;
  portOfDischarge?: string;
  etd?: string;                   // Estimated time of departure
  eta?: string;                   // Estimated time of arrival
}

// ============================================
// DMC MERCHANDISE LINE
// ============================================

export interface DMCMerchandiseLine {
  tariffCode: string;
  description: string;
  numberOfPackages: number;
  numberOfCases: number;
  netWeightKg: number;
  grossWeightKg: number;
  volumeM3: number;
  valueFOB: number;
  isModified?: boolean;           // Flag if manually edited vs auto-calculated
}

// ============================================
// SHIPMENT EXPEDIENT (Main document)
// ============================================

export interface ShipmentExpedient {
  id: string;                     // EXP-2026-XXXX
  type: ShipmentType;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  createdAt: string;
  estimatedDispatchDate?: string;
  actualDispatchDate?: string;

  // Source document
  sourceDocumentId: string;       // FAC-XXXX, OC-XXXX, TR-XXXX
  sourceDocumentType: 'factura' | 'orden_compra' | 'transferencia';

  // Counterpart
  counterpartName: string;        // Client or supplier name
  counterpartId?: string;
  counterpartCountry: string;

  // Totals
  totalPackages: number;
  totalCases: number;
  totalNetWeightKg: number;
  totalGrossWeightKg: number;
  totalVolumeM3: number;
  totalVolumeFt3: number;
  totalValueFOB: number;

  // Transport
  transport?: TransportData;

  // Document references
  dmcId?: string;
  blId?: string;
  certificateIds?: string[];

  // Tracking
  createdBy: string;
  createdByName: string;
  notes?: string;
}

// ============================================
// DMC (Declaración de Mercancías)
// ============================================

export interface DMC {
  id: string;                     // DMS-2026-XXXX / DME-2026-XXXX / DMT-2026-XXXX
  expedientId: string;
  type: DMCType;
  status: DMCStatus;
  createdAt: string;
  completedAt?: string;

  // Parties
  shipperName: string;
  shipperRuc: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeId?: string;
  consigneeCountry: string;

  // Transport (inherited or manual)
  transport: TransportData;

  // Merchandise grouped by tariff code
  merchandiseLines: DMCMerchandiseLine[];

  // Totals
  totalPackages: number;
  totalCases: number;
  totalNetWeightKg: number;
  totalGrossWeightKg: number;
  totalVolumeM3: number;
  totalVolumeFt3: number;
  totalValueFOB: number;

  // Reference
  sourceInvoiceNumber?: string;
  sourceInvoiceDate?: string;
  governmentDMCNumber?: string;   // Assigned by platform

  // Metadata
  notes?: string;
  annulmentReason?: string;
  createdBy: string;
  createdByName: string;
}

// ============================================
// BILL OF LADING
// ============================================

export interface BillOfLading {
  id: string;                     // BL-2026-XXXX
  expedientId: string;
  status: BLStatus;
  createdAt: string;

  // Parties
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyPartyName?: string;
  notifyPartyAddress?: string;

  // Transport
  vesselName: string;
  voyageNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  bookingNumber?: string;

  // Cargo
  goodsDescription: string;
  numberOfPackages: number;
  grossWeightKg: number;
  volumeM3: number;

  createdBy: string;
  createdByName: string;
  notes?: string;
}

// ============================================
// FREE SALE CERTIFICATE
// ============================================

export interface FreeSaleCertificate {
  id: string;                     // CERT-2026-XXXX
  expedientId: string;
  type: CertificateType;
  status: 'borrador' | 'completado';
  createdAt: string;

  exporterName: string;
  destination: string;
  invoiceNumber: string;
  productDescriptions: string[];
  quantities: string[];

  createdBy: string;
  createdByName: string;
}

// ============================================
// TIMELINE & TRACKING
// ============================================

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  userName: string;
  userRole: string;
}

// ============================================
// STATS & FILTERS
// ============================================

export interface TrafficStats {
  pendingToday: number;
  dmcPending: number;
  inTransit: number;
  completedThisWeek: number;
}

export interface TrafficFilters {
  search?: string;
  type?: ShipmentType | 'all';
  status?: ShipmentStatus | 'all';
  dateRange?: 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
}

// ============================================
// STATUS CONFIGS (Tailwind classes for UI)
// ============================================

export const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  pendiente: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: 'Pendiente',
  },
  en_proceso: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    label: 'En Proceso',
  },
  documentado: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Documentado',
  },
  despachado: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    label: 'Despachado',
  },
  en_transito: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    label: 'En Tránsito',
  },
  entregado: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    label: 'Entregado',
  },
  cancelado: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Cancelado',
  },
};

export const DMC_STATUS_CONFIG: Record<DMCStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  borrador: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: 'Borrador',
  },
  completado: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Completado',
  },
  registrado: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    label: 'Registrado',
  },
  anulado: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Anulado',
  },
};

export const BL_STATUS_CONFIG: Record<BLStatus, {
  bg: string;
  text: string;
  dot: string;
  label: string;
}> = {
  borrador: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
    label: 'Borrador',
  },
  completado: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Completado',
  },
  enviado: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    label: 'Enviado',
  },
};

// ============================================
// LABEL RECORDS
// ============================================

export const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  salida: 'Salida',
  entrada: 'Entrada',
  traspaso: 'Traspaso',
  transferencia: 'Transferencia',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  documentado: 'Documentado',
  despachado: 'Despachado',
  en_transito: 'En Tránsito',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const DMC_TYPE_LABELS: Record<DMCType, string> = {
  salida: 'Salida',
  entrada: 'Entrada',
  traspaso: 'Traspaso',
};

export const DMC_STATUS_LABELS: Record<DMCStatus, string> = {
  borrador: 'Borrador',
  completado: 'Completado',
  registrado: 'Registrado',
  anulado: 'Anulado',
};

export const BL_STATUS_LABELS: Record<BLStatus, string> = {
  borrador: 'Borrador',
  completado: 'Completado',
  enviado: 'Enviado',
};

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  maritimo: 'Marítimo',
  aereo: 'Aéreo',
  terrestre: 'Terrestre',
  multimodal: 'Multimodal',
};

export const PRIORITY_LABELS: Record<ShipmentPriority, string> = {
  urgente: 'Urgente',
  normal: 'Normal',
  anticipado: 'Anticipado',
};

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  libre_venta: 'Libre Venta',
  origen: 'Origen',
  fitosanitario: 'Fitosanitario',
};
