import type {
  Port,
  Carrier,
  RelatedCompany,
  DestinationRequirement,
  ShipmentExpedient,
  DMC,
  BillOfLading,
  FreeSaleCertificate,
  TimelineEvent,
  TrafficStats,
} from '@/lib/types/traffic';
import { MOCK_PRODUCTS } from '@/lib/mock-data/products';
import { loadCollection, saveCollection, loadSingleton, saveSingleton, createSubscribers } from '@/lib/store/local-store';

// ============================================
// CATALOGS
// ============================================

/**
 * Ports used in shipping operations from the Zona Libre de Colon
 */
const SEED_PORTS: Port[] = [
  { id: 'port-001', code: 'PACLE', name: 'ZL Colon', country: 'Panama' },
  { id: 'port-002', code: 'VELGR', name: 'La Guaira', country: 'Venezuela' },
  { id: 'port-003', code: 'ANWIL', name: 'Willemstad', country: 'Curazao' },
  { id: 'port-004', code: 'COCTG', name: 'Cartagena', country: 'Colombia' },
  { id: 'port-005', code: 'COADZ', name: 'San Andres', country: 'Colombia' },
  { id: 'port-006', code: 'JMKIN', name: 'Kingston', country: 'Jamaica' },
  { id: 'port-007', code: 'AWORJ', name: 'Oranjestad', country: 'Aruba' },
  { id: 'port-008', code: 'DOSDQ', name: 'Santo Domingo', country: 'Republica Dominicana' },
];

/**
 * Shipping carriers / navieras
 */
const SEED_CARRIERS: Carrier[] = [
  { id: 'carrier-001', name: 'Maersk', type: 'naviera' },
  { id: 'carrier-002', name: 'CMA CGM', type: 'naviera' },
  { id: 'carrier-003', name: 'MSC', type: 'naviera' },
  { id: 'carrier-004', name: 'Hapag-Lloyd', type: 'naviera' },
  { id: 'carrier-005', name: 'Evergreen', type: 'naviera' },
];

/**
 * Companies within the Evolution ZL group
 */
const SEED_RELATED_COMPANIES: RelatedCompany[] = [
  {
    id: 'rc-001',
    name: 'Evolution Zona Libre S.A.',
    ruc: '2-123-456',
    address: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    country: 'Panama',
    relationship: 'Empresa principal',
  },
  {
    id: 'rc-002',
    name: 'Malta Trading Ltd',
    ruc: 'MT123456',
    address: '45 Republic Street, Valletta VLT 1112, Malta',
    country: 'Malta',
    relationship: 'Subsidiaria europea',
  },
  {
    id: 'rc-003',
    name: 'Milano Distribution SRL',
    ruc: 'IT789012',
    address: 'Via Montenapoleone 8, 20121 Milano, Italia',
    country: 'Italia',
    relationship: 'Subsidiaria distribucion',
  },
];

/**
 * Requirements per destination country
 */
const SEED_DESTINATION_REQUIREMENTS: DestinationRequirement[] = [
  {
    country: 'Venezuela',
    requiresDMC: true,
    requiresBL: true,
    requiresFreeSaleCert: true,
    requiresOriginCert: false,
    notes: 'Requiere certificado de libre venta para productos alimenticios y bebidas alcoholicas',
  },
  {
    country: 'Curazao',
    requiresDMC: true,
    requiresBL: true,
    requiresFreeSaleCert: false,
    requiresOriginCert: false,
    notes: 'Tramite simplificado para islas ABC',
  },
  {
    country: 'Colombia',
    requiresDMC: true,
    requiresBL: true,
    requiresFreeSaleCert: true,
    requiresOriginCert: true,
    notes: 'Requiere registro sanitario INVIMA y certificado de origen para preferencias arancelarias',
  },
  {
    country: 'Jamaica',
    requiresDMC: true,
    requiresBL: true,
    requiresFreeSaleCert: false,
    requiresOriginCert: false,
    notes: 'Licencia de importacion de licores requerida por el consignatario',
  },
  {
    country: 'Aruba',
    requiresDMC: true,
    requiresBL: true,
    requiresFreeSaleCert: false,
    requiresOriginCert: false,
    notes: 'Tramite simplificado para islas ABC',
  },
  {
    country: 'Republica Dominicana',
    requiresDMC: true,
    requiresBL: true,
    requiresFreeSaleCert: true,
    requiresOriginCert: true,
    notes: 'Requiere certificado de libre venta y certificado de origen para bebidas alcoholicas',
  },
];

// ============================================
// SHIPMENT EXPEDIENTS
// ============================================

/**
 * 12 Shipment expedients with varied statuses, types, priorities, and counterparts
 */
const SEED_EXPEDIENTS: ShipmentExpedient[] = [
  // 1 - salida / pendiente / urgente - Venezuela
  {
    id: 'EXP-2026-0001',
    type: 'salida',
    status: 'pendiente',
    priority: 'urgente',
    createdAt: '2026-02-20T08:30:00.000Z',
    estimatedDispatchDate: '2026-02-25T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0112',
    sourceDocumentType: 'factura',
    counterpartName: 'Licoreria La Guairena C.A.',
    counterpartId: 'cli-ve-001',
    counterpartCountry: 'Venezuela',
    totalPackages: 180,
    totalCases: 180,
    totalNetWeightKg: 1980,
    totalGrossWeightKg: 2250,
    totalVolumeM3: 9.5,
    totalVolumeFt3: 335.5,
    totalValueFOB: 42500,
    transport: {
      mode: 'maritimo',
      carrierName: 'Maersk',
      vesselName: 'Maersk Cartagena',
      voyageNumber: 'MC-2026-042',
      bookingNumber: 'BK-MAE-78901',
      containerNumber: 'MSKU7234567',
      containerType: '20ft',
      sealNumber: 'SL-092341',
      portOfLoading: 'PACLE',
      portOfDischarge: 'VELGR',
      etd: '2026-02-25T14:00:00.000Z',
      eta: '2026-02-28T06:00:00.000Z',
    },
    dmcId: 'DMS-2026-0001',
    blId: 'BL-2026-0001',
    certificateIds: ['CERT-2026-0001'],
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Cliente solicita despacho urgente, pedido de reposicion critica',
  },
  // 2 - salida / en_proceso / normal - Curazao
  {
    id: 'EXP-2026-0002',
    type: 'salida',
    status: 'en_proceso',
    priority: 'normal',
    createdAt: '2026-02-18T10:15:00.000Z',
    estimatedDispatchDate: '2026-02-28T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0098',
    sourceDocumentType: 'factura',
    counterpartName: 'Curazao Spirits N.V.',
    counterpartId: 'cli-cw-001',
    counterpartCountry: 'Curazao',
    totalPackages: 95,
    totalCases: 95,
    totalNetWeightKg: 1045,
    totalGrossWeightKg: 1190,
    totalVolumeM3: 5.2,
    totalVolumeFt3: 183.6,
    totalValueFOB: 18750,
    transport: {
      mode: 'maritimo',
      carrierName: 'CMA CGM',
      vesselName: 'CMA CGM Antilles',
      voyageNumber: 'CG-2026-018',
      bookingNumber: 'BK-CMA-45678',
      containerNumber: 'CMAU8345612',
      containerType: '20ft',
      sealNumber: 'SL-054321',
      portOfLoading: 'PACLE',
      portOfDischarge: 'ANWIL',
      etd: '2026-02-28T10:00:00.000Z',
      eta: '2026-03-02T08:00:00.000Z',
    },
    dmcId: 'DMS-2026-0002',
    blId: 'BL-2026-0002',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // 3 - salida / documentado / normal - Colombia
  {
    id: 'EXP-2026-0003',
    type: 'salida',
    status: 'documentado',
    priority: 'normal',
    createdAt: '2026-02-10T09:00:00.000Z',
    estimatedDispatchDate: '2026-02-22T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0085',
    sourceDocumentType: 'factura',
    counterpartName: 'Distribuidora Caribe SAS',
    counterpartId: 'cli-co-001',
    counterpartCountry: 'Colombia',
    totalPackages: 250,
    totalCases: 250,
    totalNetWeightKg: 3125,
    totalGrossWeightKg: 3500,
    totalVolumeM3: 14.8,
    totalVolumeFt3: 522.7,
    totalValueFOB: 62300,
    transport: {
      mode: 'maritimo',
      carrierName: 'MSC',
      vesselName: 'MSC Pacifico',
      voyageNumber: 'MS-2026-035',
      bookingNumber: 'BK-MSC-23456',
      containerNumber: 'MSCU6123498',
      containerType: '40ft',
      sealNumber: 'SL-087654',
      portOfLoading: 'PACLE',
      portOfDischarge: 'COCTG',
      etd: '2026-02-22T16:00:00.000Z',
      eta: '2026-02-24T10:00:00.000Z',
    },
    dmcId: 'DMS-2026-0003',
    blId: 'BL-2026-0003',
    certificateIds: ['CERT-2026-0002'],
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Incluye certificado de libre venta y certificado de origen para preferencia arancelaria',
  },
  // 4 - salida / despachado / normal - Jamaica
  {
    id: 'EXP-2026-0004',
    type: 'salida',
    status: 'despachado',
    priority: 'normal',
    createdAt: '2026-02-05T14:20:00.000Z',
    estimatedDispatchDate: '2026-02-15T00:00:00.000Z',
    actualDispatchDate: '2026-02-15T09:30:00.000Z',
    sourceDocumentId: 'FAC-2026-0071',
    sourceDocumentType: 'factura',
    counterpartName: 'Jamaica Beverages Ltd',
    counterpartId: 'cli-jm-001',
    counterpartCountry: 'Jamaica',
    totalPackages: 120,
    totalCases: 120,
    totalNetWeightKg: 1440,
    totalGrossWeightKg: 1620,
    totalVolumeM3: 7.2,
    totalVolumeFt3: 254.3,
    totalValueFOB: 28900,
    transport: {
      mode: 'maritimo',
      carrierName: 'Hapag-Lloyd',
      vesselName: 'Hapag-Lloyd Caribbean Express',
      voyageNumber: 'HL-2026-012',
      bookingNumber: 'BK-HAP-67890',
      containerNumber: 'HLCU4567891',
      containerType: '20ft',
      sealNumber: 'SL-034567',
      portOfLoading: 'PACLE',
      portOfDischarge: 'JMKIN',
      etd: '2026-02-15T12:00:00.000Z',
      eta: '2026-02-18T14:00:00.000Z',
    },
    dmcId: 'DMS-2026-0004',
    blId: 'BL-2026-0004',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // 5 - salida / en_transito / normal - Aruba
  {
    id: 'EXP-2026-0005',
    type: 'salida',
    status: 'en_transito',
    priority: 'normal',
    createdAt: '2026-02-01T11:00:00.000Z',
    estimatedDispatchDate: '2026-02-10T00:00:00.000Z',
    actualDispatchDate: '2026-02-10T08:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0058',
    sourceDocumentType: 'factura',
    counterpartName: 'Island Liquor N.V.',
    counterpartId: 'cli-aw-001',
    counterpartCountry: 'Aruba',
    totalPackages: 65,
    totalCases: 65,
    totalNetWeightKg: 715,
    totalGrossWeightKg: 812,
    totalVolumeM3: 3.5,
    totalVolumeFt3: 123.6,
    totalValueFOB: 12400,
    transport: {
      mode: 'maritimo',
      carrierName: 'CMA CGM',
      vesselName: 'CMA CGM Antilles',
      voyageNumber: 'CG-2026-015',
      bookingNumber: 'BK-CMA-34567',
      containerNumber: 'CMAU7891234',
      containerType: '20ft',
      sealNumber: 'SL-076543',
      portOfLoading: 'PACLE',
      portOfDischarge: 'AWORJ',
      etd: '2026-02-10T11:00:00.000Z',
      eta: '2026-02-12T16:00:00.000Z',
    },
    dmcId: 'DMS-2026-0005',
    blId: 'BL-2026-0005',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // 6 - salida / entregado / normal - RD
  {
    id: 'EXP-2026-0006',
    type: 'salida',
    status: 'entregado',
    priority: 'normal',
    createdAt: '2026-01-15T09:45:00.000Z',
    estimatedDispatchDate: '2026-01-22T00:00:00.000Z',
    actualDispatchDate: '2026-01-22T07:30:00.000Z',
    sourceDocumentId: 'FAC-2026-0029',
    sourceDocumentType: 'factura',
    counterpartName: 'Ron del Santo S.R.L.',
    counterpartId: 'cli-do-001',
    counterpartCountry: 'Republica Dominicana',
    totalPackages: 200,
    totalCases: 200,
    totalNetWeightKg: 2400,
    totalGrossWeightKg: 2720,
    totalVolumeM3: 11.5,
    totalVolumeFt3: 406.2,
    totalValueFOB: 53200,
    transport: {
      mode: 'maritimo',
      carrierName: 'Evergreen',
      vesselName: 'Ever Caribe',
      voyageNumber: 'EG-2026-008',
      bookingNumber: 'BK-EVR-12345',
      containerNumber: 'EISU3456789',
      containerType: '40ft',
      sealNumber: 'SL-012345',
      portOfLoading: 'PACLE',
      portOfDischarge: 'DOSDQ',
      etd: '2026-01-22T10:00:00.000Z',
      eta: '2026-01-25T08:00:00.000Z',
    },
    dmcId: 'DMS-2026-0006',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Entregado exitosamente el 26 de enero 2026',
  },
  // 7 - salida / cancelado / normal - Venezuela
  {
    id: 'EXP-2026-0007',
    type: 'salida',
    status: 'cancelado',
    priority: 'normal',
    createdAt: '2026-01-20T16:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0035',
    sourceDocumentType: 'factura',
    counterpartName: 'Licores del Caribe C.A.',
    counterpartId: 'cli-ve-002',
    counterpartCountry: 'Venezuela',
    totalPackages: 45,
    totalCases: 45,
    totalNetWeightKg: 540,
    totalGrossWeightKg: 612,
    totalVolumeM3: 2.4,
    totalVolumeFt3: 84.8,
    totalValueFOB: 8900,
    dmcId: 'DMS-2026-0007',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Cancelado por el cliente - problemas con documentos de importacion en destino',
  },
  // 8 - entrada / pendiente / anticipado - desde Malta
  {
    id: 'EXP-2026-0008',
    type: 'entrada',
    status: 'pendiente',
    priority: 'anticipado',
    createdAt: '2026-02-22T07:00:00.000Z',
    estimatedDispatchDate: '2026-03-10T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0130',
    sourceDocumentType: 'orden_compra',
    counterpartName: 'Malta Trading Ltd',
    counterpartId: 'rc-002',
    counterpartCountry: 'Malta',
    totalPackages: 300,
    totalCases: 300,
    totalNetWeightKg: 4200,
    totalGrossWeightKg: 4800,
    totalVolumeM3: 18.5,
    totalVolumeFt3: 653.3,
    totalValueFOB: 78500,
    transport: {
      mode: 'maritimo',
      carrierName: 'MSC',
      vesselName: 'MSC Mediterranean',
      voyageNumber: 'MS-2026-051',
      portOfLoading: 'MTMLA',
      portOfDischarge: 'PACLE',
      etd: '2026-03-10T00:00:00.000Z',
      eta: '2026-03-28T00:00:00.000Z',
    },
    dmcId: 'DME-2026-0001',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Reposicion de inventario Q1 - productos europeos premium',
  },
  // 9 - entrada / en_proceso / normal - desde Italia
  {
    id: 'EXP-2026-0009',
    type: 'entrada',
    status: 'en_proceso',
    priority: 'normal',
    createdAt: '2026-02-15T13:30:00.000Z',
    estimatedDispatchDate: '2026-03-01T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0115',
    sourceDocumentType: 'orden_compra',
    counterpartName: 'Milano Distribution SRL',
    counterpartId: 'rc-003',
    counterpartCountry: 'Italia',
    totalPackages: 150,
    totalCases: 150,
    totalNetWeightKg: 1875,
    totalGrossWeightKg: 2130,
    totalVolumeM3: 8.9,
    totalVolumeFt3: 314.3,
    totalValueFOB: 45600,
    transport: {
      mode: 'maritimo',
      carrierName: 'Hapag-Lloyd',
      vesselName: 'Hapag-Lloyd Europa',
      voyageNumber: 'HL-2026-028',
      portOfLoading: 'ITGOA',
      portOfDischarge: 'PACLE',
      etd: '2026-03-01T00:00:00.000Z',
      eta: '2026-03-18T00:00:00.000Z',
    },
    dmcId: 'DME-2026-0002',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Vinos y licores italianos - Prosecco, Disaronno',
  },
  // 10 - traspaso / documentado / urgente - internal ZL
  {
    id: 'EXP-2026-0010',
    type: 'traspaso',
    status: 'documentado',
    priority: 'urgente',
    createdAt: '2026-02-24T08:00:00.000Z',
    estimatedDispatchDate: '2026-02-26T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0140',
    sourceDocumentType: 'transferencia',
    counterpartName: 'Almacen B - Zona Libre Colon',
    counterpartId: 'wh-002',
    counterpartCountry: 'Panama',
    totalPackages: 80,
    totalCases: 80,
    totalNetWeightKg: 960,
    totalGrossWeightKg: 1088,
    totalVolumeM3: 4.6,
    totalVolumeFt3: 162.5,
    totalValueFOB: 19800,
    transport: {
      mode: 'terrestre',
      portOfLoading: 'PACLE',
    },
    dmcId: 'DMT-2026-0001',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Traspaso urgente por reorganizacion de almacen - whisky y ron',
  },
  // 11 - traspaso / despachado / normal - internal ZL
  {
    id: 'EXP-2026-0011',
    type: 'traspaso',
    status: 'despachado',
    priority: 'normal',
    createdAt: '2026-02-12T10:00:00.000Z',
    estimatedDispatchDate: '2026-02-18T00:00:00.000Z',
    actualDispatchDate: '2026-02-18T11:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0105',
    sourceDocumentType: 'transferencia',
    counterpartName: 'Almacen C - Zona Libre Colon',
    counterpartId: 'wh-003',
    counterpartCountry: 'Panama',
    totalPackages: 50,
    totalCases: 50,
    totalNetWeightKg: 600,
    totalGrossWeightKg: 680,
    totalVolumeM3: 2.8,
    totalVolumeFt3: 98.9,
    totalValueFOB: 7200,
    transport: {
      mode: 'terrestre',
      portOfLoading: 'PACLE',
    },
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // 12 - transferencia / pendiente / anticipado - San Andres via aerea
  {
    id: 'EXP-2026-0012',
    type: 'transferencia',
    status: 'pendiente',
    priority: 'anticipado',
    createdAt: '2026-02-25T15:00:00.000Z',
    estimatedDispatchDate: '2026-03-05T00:00:00.000Z',
    sourceDocumentId: 'FAC-2026-0148',
    sourceDocumentType: 'factura',
    counterpartName: 'Distribuciones San Andres SAS',
    counterpartId: 'cli-co-002',
    counterpartCountry: 'Colombia',
    totalPackages: 20,
    totalCases: 20,
    totalNetWeightKg: 240,
    totalGrossWeightKg: 275,
    totalVolumeM3: 1.2,
    totalVolumeFt3: 42.4,
    totalValueFOB: 5200,
    transport: {
      mode: 'aereo',
      carrierName: 'Copa Airlines Cargo',
      portOfLoading: 'PACLE',
      portOfDischarge: 'COADZ',
      etd: '2026-03-05T06:00:00.000Z',
      eta: '2026-03-05T10:00:00.000Z',
    },
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
    notes: 'Envio aereo a San Andres - productos de alta rotacion',
  },
];

// ============================================
// DMC DOCUMENTS
// ============================================

/**
 * 10 DMC documents (7 salida, 2 entrada, 1 traspaso) with varied statuses
 */
const SEED_DMC_DOCUMENTS: DMC[] = [
  // DMS-2026-0001 - salida Venezuela (EXP-2026-0001), registrado
  {
    id: 'DMS-2026-0001',
    expedientId: 'EXP-2026-0001',
    type: 'salida',
    status: 'registrado',
    createdAt: '2026-02-20T09:00:00.000Z',
    completedAt: '2026-02-21T14:30:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Licoreria La Guairena C.A.',
    consigneeId: 'cli-ve-001',
    consigneeCountry: 'Venezuela',
    transport: {
      mode: 'maritimo',
      carrierName: 'Maersk',
      vesselName: 'Maersk Cartagena',
      voyageNumber: 'MC-2026-042',
      bookingNumber: 'BK-MAE-78901',
      containerNumber: 'MSKU7234567',
      containerType: '20ft',
      sealNumber: 'SL-092341',
      portOfLoading: 'PACLE',
      portOfDischarge: 'VELGR',
      etd: '2026-02-25T14:00:00.000Z',
      eta: '2026-02-28T06:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
        numberOfPackages: 80,
        numberOfCases: 80,
        netWeightKg: 880,
        grossWeightKg: 1000,
        volumeM3: 4.2,
        valueFOB: 19200,
      },
      {
        tariffCode: '2208401000',
        description: 'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
        numberOfPackages: 50,
        numberOfCases: 50,
        netWeightKg: 550,
        grossWeightKg: 625,
        volumeM3: 2.6,
        valueFOB: 12500,
      },
      {
        tariffCode: '2208601000',
        description: 'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
        numberOfPackages: 50,
        numberOfCases: 50,
        netWeightKg: 550,
        grossWeightKg: 625,
        volumeM3: 2.7,
        valueFOB: 10800,
      },
    ],
    totalPackages: 180,
    totalCases: 180,
    totalNetWeightKg: 1980,
    totalGrossWeightKg: 2250,
    totalVolumeM3: 9.5,
    totalVolumeFt3: 335.5,
    totalValueFOB: 42500,
    sourceInvoiceNumber: 'FAC-2026-0112',
    sourceInvoiceDate: '2026-02-19T00:00:00.000Z',
    governmentDMCNumber: 'GOB-DMS-2026-003421',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMS-2026-0002 - salida Curazao (EXP-2026-0002), completado
  {
    id: 'DMS-2026-0002',
    expedientId: 'EXP-2026-0002',
    type: 'salida',
    status: 'completado',
    createdAt: '2026-02-18T11:00:00.000Z',
    completedAt: '2026-02-19T16:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Curazao Spirits N.V.',
    consigneeId: 'cli-cw-001',
    consigneeCountry: 'Curazao',
    transport: {
      mode: 'maritimo',
      carrierName: 'CMA CGM',
      vesselName: 'CMA CGM Antilles',
      voyageNumber: 'CG-2026-018',
      bookingNumber: 'BK-CMA-45678',
      containerNumber: 'CMAU8345612',
      containerType: '20ft',
      sealNumber: 'SL-054321',
      portOfLoading: 'PACLE',
      portOfDischarge: 'ANWIL',
      etd: '2026-02-28T10:00:00.000Z',
      eta: '2026-03-02T08:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY CHIVAS REGAL 12YRS S/C NR 12X750',
        numberOfPackages: 40,
        numberOfCases: 40,
        netWeightKg: 440,
        grossWeightKg: 500,
        volumeM3: 2.1,
        valueFOB: 7760,
      },
      {
        tariffCode: '2208909000',
        description: 'TEQUILA 1800 COCONUT R NK 12X750ML 35%V',
        numberOfPackages: 30,
        numberOfCases: 30,
        netWeightKg: 330,
        grossWeightKg: 375,
        volumeM3: 1.6,
        valueFOB: 5250,
      },
      {
        tariffCode: '2208709000',
        description: 'LICOR KAHLUA CAFE 12X750ML 16%VOL',
        numberOfPackages: 25,
        numberOfCases: 25,
        netWeightKg: 275,
        grossWeightKg: 315,
        volumeM3: 1.5,
        valueFOB: 5740,
      },
    ],
    totalPackages: 95,
    totalCases: 95,
    totalNetWeightKg: 1045,
    totalGrossWeightKg: 1190,
    totalVolumeM3: 5.2,
    totalVolumeFt3: 183.6,
    totalValueFOB: 18750,
    sourceInvoiceNumber: 'FAC-2026-0098',
    sourceInvoiceDate: '2026-02-17T00:00:00.000Z',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMS-2026-0003 - salida Colombia (EXP-2026-0003), registrado
  {
    id: 'DMS-2026-0003',
    expedientId: 'EXP-2026-0003',
    type: 'salida',
    status: 'registrado',
    createdAt: '2026-02-10T10:00:00.000Z',
    completedAt: '2026-02-12T11:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Distribuidora Caribe SAS',
    consigneeId: 'cli-co-001',
    consigneeCountry: 'Colombia',
    transport: {
      mode: 'maritimo',
      carrierName: 'MSC',
      vesselName: 'MSC Pacifico',
      voyageNumber: 'MS-2026-035',
      bookingNumber: 'BK-MSC-23456',
      containerNumber: 'MSCU6123498',
      containerType: '40ft',
      sealNumber: 'SL-087654',
      portOfLoading: 'PACLE',
      portOfDischarge: 'COCTG',
      etd: '2026-02-22T16:00:00.000Z',
      eta: '2026-02-24T10:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY JOHNNIE WALKER BLACK 12YRS 24X375ML 40%V',
        numberOfPackages: 60,
        numberOfCases: 60,
        netWeightKg: 750,
        grossWeightKg: 840,
        volumeM3: 3.6,
        valueFOB: 17400,
      },
      {
        tariffCode: '2208909000',
        description: 'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
        numberOfPackages: 40,
        numberOfCases: 40,
        netWeightKg: 500,
        grossWeightKg: 560,
        volumeM3: 2.4,
        valueFOB: 21120,
      },
      {
        tariffCode: '2204109000',
        description: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
        numberOfPackages: 100,
        numberOfCases: 100,
        netWeightKg: 1250,
        grossWeightKg: 1400,
        volumeM3: 5.8,
        valueFOB: 15080,
      },
      {
        tariffCode: '2208509000',
        description: 'GINEBRA HENDRICKS RF 12X1000ML 44% VOL',
        numberOfPackages: 50,
        numberOfCases: 50,
        netWeightKg: 625,
        grossWeightKg: 700,
        volumeM3: 3.0,
        valueFOB: 8700,
      },
    ],
    totalPackages: 250,
    totalCases: 250,
    totalNetWeightKg: 3125,
    totalGrossWeightKg: 3500,
    totalVolumeM3: 14.8,
    totalVolumeFt3: 522.7,
    totalValueFOB: 62300,
    sourceInvoiceNumber: 'FAC-2026-0085',
    sourceInvoiceDate: '2026-02-09T00:00:00.000Z',
    governmentDMCNumber: 'GOB-DMS-2026-003218',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMS-2026-0004 - salida Jamaica (EXP-2026-0004), registrado
  {
    id: 'DMS-2026-0004',
    expedientId: 'EXP-2026-0004',
    type: 'salida',
    status: 'registrado',
    createdAt: '2026-02-06T08:30:00.000Z',
    completedAt: '2026-02-08T10:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Jamaica Beverages Ltd',
    consigneeId: 'cli-jm-001',
    consigneeCountry: 'Jamaica',
    transport: {
      mode: 'maritimo',
      carrierName: 'Hapag-Lloyd',
      vesselName: 'Hapag-Lloyd Caribbean Express',
      voyageNumber: 'HL-2026-012',
      bookingNumber: 'BK-HAP-67890',
      containerNumber: 'HLCU4567891',
      containerType: '20ft',
      sealNumber: 'SL-034567',
      portOfLoading: 'PACLE',
      portOfDischarge: 'JMKIN',
      etd: '2026-02-15T12:00:00.000Z',
      eta: '2026-02-18T14:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208401000',
        description: 'RON CAPTAIN MORGAN BLACK SPICED 12X1000ML 40%',
        numberOfPackages: 60,
        numberOfCases: 60,
        netWeightKg: 720,
        grossWeightKg: 810,
        volumeM3: 3.6,
        valueFOB: 14400,
      },
      {
        tariffCode: '2208309000',
        description: 'WHISKY BLACK & WHITE 24X375ML 40%VOL',
        numberOfPackages: 40,
        numberOfCases: 40,
        netWeightKg: 480,
        grossWeightKg: 540,
        volumeM3: 2.4,
        valueFOB: 9720,
      },
      {
        tariffCode: '2005200000',
        description: 'SNACKS PRINGLES BBQ 12X149G',
        numberOfPackages: 20,
        numberOfCases: 20,
        netWeightKg: 240,
        grossWeightKg: 270,
        volumeM3: 1.2,
        valueFOB: 4780,
      },
    ],
    totalPackages: 120,
    totalCases: 120,
    totalNetWeightKg: 1440,
    totalGrossWeightKg: 1620,
    totalVolumeM3: 7.2,
    totalVolumeFt3: 254.3,
    totalValueFOB: 28900,
    sourceInvoiceNumber: 'FAC-2026-0071',
    sourceInvoiceDate: '2026-02-04T00:00:00.000Z',
    governmentDMCNumber: 'GOB-DMS-2026-003105',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMS-2026-0005 - salida Aruba (EXP-2026-0005), registrado
  {
    id: 'DMS-2026-0005',
    expedientId: 'EXP-2026-0005',
    type: 'salida',
    status: 'registrado',
    createdAt: '2026-02-02T09:00:00.000Z',
    completedAt: '2026-02-04T15:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Island Liquor N.V.',
    consigneeId: 'cli-aw-001',
    consigneeCountry: 'Aruba',
    transport: {
      mode: 'maritimo',
      carrierName: 'CMA CGM',
      vesselName: 'CMA CGM Antilles',
      voyageNumber: 'CG-2026-015',
      bookingNumber: 'BK-CMA-34567',
      containerNumber: 'CMAU7891234',
      containerType: '20ft',
      sealNumber: 'SL-076543',
      portOfLoading: 'PACLE',
      portOfDischarge: 'AWORJ',
      etd: '2026-02-10T11:00:00.000Z',
      eta: '2026-02-12T16:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY MONKEY SHOULDER 6X700ML 40%VOL',
        numberOfPackages: 30,
        numberOfCases: 30,
        netWeightKg: 330,
        grossWeightKg: 375,
        volumeM3: 1.6,
        valueFOB: 5280,
      },
      {
        tariffCode: '2208601000',
        description: 'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
        numberOfPackages: 35,
        numberOfCases: 35,
        netWeightKg: 385,
        grossWeightKg: 437,
        volumeM3: 1.9,
        valueFOB: 7120,
      },
    ],
    totalPackages: 65,
    totalCases: 65,
    totalNetWeightKg: 715,
    totalGrossWeightKg: 812,
    totalVolumeM3: 3.5,
    totalVolumeFt3: 123.6,
    totalValueFOB: 12400,
    sourceInvoiceNumber: 'FAC-2026-0058',
    sourceInvoiceDate: '2026-01-31T00:00:00.000Z',
    governmentDMCNumber: 'GOB-DMS-2026-002987',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMS-2026-0006 - salida RD (EXP-2026-0006), registrado
  {
    id: 'DMS-2026-0006',
    expedientId: 'EXP-2026-0006',
    type: 'salida',
    status: 'registrado',
    createdAt: '2026-01-16T08:00:00.000Z',
    completedAt: '2026-01-18T12:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Ron del Santo S.R.L.',
    consigneeId: 'cli-do-001',
    consigneeCountry: 'Republica Dominicana',
    transport: {
      mode: 'maritimo',
      carrierName: 'Evergreen',
      vesselName: 'Ever Caribe',
      voyageNumber: 'EG-2026-008',
      bookingNumber: 'BK-EVR-12345',
      containerNumber: 'EISU3456789',
      containerType: '40ft',
      sealNumber: 'SL-012345',
      portOfLoading: 'PACLE',
      portOfDischarge: 'DOSDQ',
      etd: '2026-01-22T10:00:00.000Z',
      eta: '2026-01-25T08:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208401000',
        description: 'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
        numberOfPackages: 80,
        numberOfCases: 80,
        netWeightKg: 960,
        grossWeightKg: 1088,
        volumeM3: 4.6,
        valueFOB: 20000,
      },
      {
        tariffCode: '2208309000',
        description: 'WHISKY GLENFIDDICH 12ANO CRCH 12X750ML 40%',
        numberOfPackages: 40,
        numberOfCases: 40,
        netWeightKg: 480,
        grossWeightKg: 544,
        volumeM3: 2.3,
        valueFOB: 15200,
      },
      {
        tariffCode: '2208709000',
        description: 'LICOR AMARETTO DISARONNO RF 12X750ML',
        numberOfPackages: 50,
        numberOfCases: 50,
        netWeightKg: 600,
        grossWeightKg: 680,
        volumeM3: 2.9,
        valueFOB: 9500,
      },
      {
        tariffCode: '2208401000',
        description: 'RON MCCORMICK GOLD 12X1000ML 40%VOL',
        numberOfPackages: 30,
        numberOfCases: 30,
        netWeightKg: 360,
        grossWeightKg: 408,
        volumeM3: 1.7,
        valueFOB: 8500,
      },
    ],
    totalPackages: 200,
    totalCases: 200,
    totalNetWeightKg: 2400,
    totalGrossWeightKg: 2720,
    totalVolumeM3: 11.5,
    totalVolumeFt3: 406.2,
    totalValueFOB: 53200,
    sourceInvoiceNumber: 'FAC-2026-0029',
    sourceInvoiceDate: '2026-01-14T00:00:00.000Z',
    governmentDMCNumber: 'GOB-DMS-2026-002834',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMS-2026-0007 - salida Venezuela cancelado (EXP-2026-0007), anulado
  {
    id: 'DMS-2026-0007',
    expedientId: 'EXP-2026-0007',
    type: 'salida',
    status: 'anulado',
    createdAt: '2026-01-21T09:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Licores del Caribe C.A.',
    consigneeId: 'cli-ve-002',
    consigneeCountry: 'Venezuela',
    transport: {
      mode: 'maritimo',
      portOfLoading: 'PACLE',
      portOfDischarge: 'VELGR',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY JACK DANIELS N7 BLACK MINI 120X50ML 40%V',
        numberOfPackages: 25,
        numberOfCases: 25,
        netWeightKg: 300,
        grossWeightKg: 340,
        volumeM3: 1.3,
        valueFOB: 4950,
      },
      {
        tariffCode: '2208909000',
        description: 'TEQUILA 1800 COCONUT R NK 12X750ML 35%V',
        numberOfPackages: 20,
        numberOfCases: 20,
        netWeightKg: 240,
        grossWeightKg: 272,
        volumeM3: 1.1,
        valueFOB: 3950,
      },
    ],
    totalPackages: 45,
    totalCases: 45,
    totalNetWeightKg: 540,
    totalGrossWeightKg: 612,
    totalVolumeM3: 2.4,
    totalVolumeFt3: 84.8,
    totalValueFOB: 8900,
    sourceInvoiceNumber: 'FAC-2026-0035',
    sourceInvoiceDate: '2026-01-19T00:00:00.000Z',
    annulmentReason: 'Expediente cancelado por el cliente - problemas con documentos de importacion en Venezuela',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DME-2026-0001 - entrada desde Malta (EXP-2026-0008), borrador
  {
    id: 'DME-2026-0001',
    expedientId: 'EXP-2026-0008',
    type: 'entrada',
    status: 'borrador',
    createdAt: '2026-02-22T08:00:00.000Z',
    shipperName: 'Malta Trading Ltd',
    shipperRuc: 'MT123456',
    shipperAddress: '45 Republic Street, Valletta VLT 1112, Malta',
    consigneeName: 'Evolution Zona Libre S.A.',
    consigneeId: 'rc-001',
    consigneeCountry: 'Panama',
    transport: {
      mode: 'maritimo',
      carrierName: 'MSC',
      vesselName: 'MSC Mediterranean',
      voyageNumber: 'MS-2026-051',
      portOfLoading: 'MTMLA',
      portOfDischarge: 'PACLE',
      etd: '2026-03-10T00:00:00.000Z',
      eta: '2026-03-28T00:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY GLENLIVET 12YO DOUBLE OAK R GB 12X750ML',
        numberOfPackages: 120,
        numberOfCases: 120,
        netWeightKg: 1680,
        grossWeightKg: 1920,
        volumeM3: 7.4,
        valueFOB: 38400,
      },
      {
        tariffCode: '2208309000',
        description: 'WHISKY GLENFIDDICH 12ANO CRCH 12X750ML 40%',
        numberOfPackages: 100,
        numberOfCases: 100,
        netWeightKg: 1400,
        grossWeightKg: 1600,
        volumeM3: 6.1,
        valueFOB: 25500,
      },
      {
        tariffCode: '2208509000',
        description: 'GINEBRA HENDRICKS RF 12X1000ML 44% VOL',
        numberOfPackages: 80,
        numberOfCases: 80,
        netWeightKg: 1120,
        grossWeightKg: 1280,
        volumeM3: 5.0,
        valueFOB: 14600,
      },
    ],
    totalPackages: 300,
    totalCases: 300,
    totalNetWeightKg: 4200,
    totalGrossWeightKg: 4800,
    totalVolumeM3: 18.5,
    totalVolumeFt3: 653.3,
    totalValueFOB: 78500,
    sourceInvoiceNumber: 'FAC-2026-0130',
    sourceInvoiceDate: '2026-02-21T00:00:00.000Z',
    notes: 'Reposicion de inventario Q1 - productos europeos premium',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DME-2026-0002 - entrada desde Italia (EXP-2026-0009), borrador
  {
    id: 'DME-2026-0002',
    expedientId: 'EXP-2026-0009',
    type: 'entrada',
    status: 'borrador',
    createdAt: '2026-02-15T14:00:00.000Z',
    shipperName: 'Milano Distribution SRL',
    shipperRuc: 'IT789012',
    shipperAddress: 'Via Montenapoleone 8, 20121 Milano, Italia',
    consigneeName: 'Evolution Zona Libre S.A.',
    consigneeId: 'rc-001',
    consigneeCountry: 'Panama',
    transport: {
      mode: 'maritimo',
      carrierName: 'Hapag-Lloyd',
      vesselName: 'Hapag-Lloyd Europa',
      voyageNumber: 'HL-2026-028',
      portOfLoading: 'ITGOA',
      portOfDischarge: 'PACLE',
      etd: '2026-03-01T00:00:00.000Z',
      eta: '2026-03-18T00:00:00.000Z',
    },
    merchandiseLines: [
      {
        tariffCode: '2204109000',
        description: 'VINO SPERONE PROSECCO 12X750ML 11.5%V',
        numberOfPackages: 80,
        numberOfCases: 80,
        netWeightKg: 1000,
        grossWeightKg: 1136,
        volumeM3: 4.8,
        valueFOB: 24800,
      },
      {
        tariffCode: '2208709000',
        description: 'LICOR AMARETTO DISARONNO RF 12X750ML',
        numberOfPackages: 70,
        numberOfCases: 70,
        netWeightKg: 875,
        grossWeightKg: 994,
        volumeM3: 4.1,
        valueFOB: 20800,
      },
    ],
    totalPackages: 150,
    totalCases: 150,
    totalNetWeightKg: 1875,
    totalGrossWeightKg: 2130,
    totalVolumeM3: 8.9,
    totalVolumeFt3: 314.3,
    totalValueFOB: 45600,
    sourceInvoiceNumber: 'FAC-2026-0115',
    sourceInvoiceDate: '2026-02-14T00:00:00.000Z',
    notes: 'Vinos y licores italianos - Prosecco Sperone y Disaronno',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // DMT-2026-0001 - traspaso interno (EXP-2026-0010), completado
  {
    id: 'DMT-2026-0001',
    expedientId: 'EXP-2026-0010',
    type: 'traspaso',
    status: 'completado',
    createdAt: '2026-02-24T09:00:00.000Z',
    completedAt: '2026-02-24T16:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperRuc: '2-123-456',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Almacen B - Zona Libre Colon',
    consigneeId: 'wh-002',
    consigneeCountry: 'Panama',
    transport: {
      mode: 'terrestre',
      portOfLoading: 'PACLE',
    },
    merchandiseLines: [
      {
        tariffCode: '2208309000',
        description: 'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
        numberOfPackages: 40,
        numberOfCases: 40,
        netWeightKg: 480,
        grossWeightKg: 544,
        volumeM3: 2.3,
        valueFOB: 9600,
      },
      {
        tariffCode: '2208401000',
        description: 'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
        numberOfPackages: 40,
        numberOfCases: 40,
        netWeightKg: 480,
        grossWeightKg: 544,
        volumeM3: 2.3,
        valueFOB: 10200,
      },
    ],
    totalPackages: 80,
    totalCases: 80,
    totalNetWeightKg: 960,
    totalGrossWeightKg: 1088,
    totalVolumeM3: 4.6,
    totalVolumeFt3: 162.5,
    totalValueFOB: 19800,
    sourceInvoiceNumber: 'FAC-2026-0140',
    sourceInvoiceDate: '2026-02-23T00:00:00.000Z',
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
];

// ============================================
// BILLS OF LADING
// ============================================

/**
 * 5 Bills of Lading with varied statuses
 */
const SEED_BILLS_OF_LADING: BillOfLading[] = [
  // BL-2026-0001 - Venezuela (EXP-2026-0001), completado
  {
    id: 'BL-2026-0001',
    expedientId: 'EXP-2026-0001',
    status: 'completado',
    createdAt: '2026-02-21T10:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Licoreria La Guairena C.A.',
    consigneeAddress: 'Av. Soublette, Edif. La Marina, PB Local 3, La Guaira, Estado Vargas, Venezuela',
    notifyPartyName: 'Licoreria La Guairena C.A.',
    notifyPartyAddress: 'Av. Soublette, Edif. La Marina, PB Local 3, La Guaira, Estado Vargas, Venezuela',
    vesselName: 'Maersk Cartagena',
    voyageNumber: 'MC-2026-042',
    portOfLoading: 'PACLE - ZL Colon, Panama',
    portOfDischarge: 'VELGR - La Guaira, Venezuela',
    bookingNumber: 'BK-MAE-78901',
    goodsDescription: 'Whisky escoces, Ron venezolano, Vodka - 180 cajas en total. Bebidas alcoholicas para consumo. Contenedor 20ft MSKU7234567, Sello SL-092341.',
    numberOfPackages: 180,
    grossWeightKg: 2250,
    volumeM3: 9.5,
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // BL-2026-0002 - Curazao (EXP-2026-0002), borrador
  {
    id: 'BL-2026-0002',
    expedientId: 'EXP-2026-0002',
    status: 'borrador',
    createdAt: '2026-02-19T14:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Curazao Spirits N.V.',
    consigneeAddress: 'Handelskade 12, Willemstad, Curazao',
    vesselName: 'CMA CGM Antilles',
    voyageNumber: 'CG-2026-018',
    portOfLoading: 'PACLE - ZL Colon, Panama',
    portOfDischarge: 'ANWIL - Willemstad, Curazao',
    bookingNumber: 'BK-CMA-45678',
    goodsDescription: 'Whisky, Tequila, Licor de cafe - 95 cajas en total. Bebidas alcoholicas para distribucion. Contenedor 20ft CMAU8345612, Sello SL-054321.',
    numberOfPackages: 95,
    grossWeightKg: 1190,
    volumeM3: 5.2,
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // BL-2026-0003 - Colombia (EXP-2026-0003), enviado
  {
    id: 'BL-2026-0003',
    expedientId: 'EXP-2026-0003',
    status: 'enviado',
    createdAt: '2026-02-12T09:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Distribuidora Caribe SAS',
    consigneeAddress: 'Cra 46 No. 53-126, Zona Industrial Mamonal, Cartagena, Colombia',
    notifyPartyName: 'Distribuidora Caribe SAS',
    notifyPartyAddress: 'Cra 46 No. 53-126, Zona Industrial Mamonal, Cartagena, Colombia',
    vesselName: 'MSC Pacifico',
    voyageNumber: 'MS-2026-035',
    portOfLoading: 'PACLE - ZL Colon, Panama',
    portOfDischarge: 'COCTG - Cartagena, Colombia',
    bookingNumber: 'BK-MSC-23456',
    goodsDescription: 'Whisky, Tequila premium, Vino espumante, Ginebra - 250 cajas en total. Bebidas alcoholicas variadas para distribucion mayorista. Contenedor 40ft MSCU6123498, Sello SL-087654.',
    numberOfPackages: 250,
    grossWeightKg: 3500,
    volumeM3: 14.8,
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // BL-2026-0004 - Jamaica (EXP-2026-0004), enviado
  {
    id: 'BL-2026-0004',
    expedientId: 'EXP-2026-0004',
    status: 'enviado',
    createdAt: '2026-02-10T11:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Jamaica Beverages Ltd',
    consigneeAddress: 'Marcus Garvey Drive, Kingston 15, Jamaica',
    notifyPartyName: 'Jamaica Beverages Ltd',
    notifyPartyAddress: 'Marcus Garvey Drive, Kingston 15, Jamaica',
    vesselName: 'Hapag-Lloyd Caribbean Express',
    voyageNumber: 'HL-2026-012',
    portOfLoading: 'PACLE - ZL Colon, Panama',
    portOfDischarge: 'JMKIN - Kingston, Jamaica',
    bookingNumber: 'BK-HAP-67890',
    goodsDescription: 'Ron especiado, Whisky, Snacks - 120 cajas en total. Bebidas alcoholicas y snacks para importacion. Contenedor 20ft HLCU4567891, Sello SL-034567.',
    numberOfPackages: 120,
    grossWeightKg: 1620,
    volumeM3: 7.2,
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // BL-2026-0005 - Aruba (EXP-2026-0005), enviado
  {
    id: 'BL-2026-0005',
    expedientId: 'EXP-2026-0005',
    status: 'enviado',
    createdAt: '2026-02-05T10:00:00.000Z',
    shipperName: 'Evolution Zona Libre S.A.',
    shipperAddress: 'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama',
    consigneeName: 'Island Liquor N.V.',
    consigneeAddress: 'L.G. Smith Boulevard 152, Oranjestad, Aruba',
    vesselName: 'CMA CGM Antilles',
    voyageNumber: 'CG-2026-015',
    portOfLoading: 'PACLE - ZL Colon, Panama',
    portOfDischarge: 'AWORJ - Oranjestad, Aruba',
    bookingNumber: 'BK-CMA-34567',
    goodsDescription: 'Whisky blended, Vodka - 65 cajas en total. Bebidas alcoholicas para venta al por menor. Contenedor 20ft CMAU7891234, Sello SL-076543.',
    numberOfPackages: 65,
    grossWeightKg: 812,
    volumeM3: 3.5,
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
];

// ============================================
// FREE SALE CERTIFICATES
// ============================================

/**
 * 2 Free Sale Certificates for countries that require them
 */
const SEED_CERTIFICATES: FreeSaleCertificate[] = [
  // CERT-2026-0001 - Venezuela (EXP-2026-0001)
  {
    id: 'CERT-2026-0001',
    expedientId: 'EXP-2026-0001',
    type: 'libre_venta',
    status: 'completado',
    createdAt: '2026-02-21T11:00:00.000Z',
    exporterName: 'Evolution Zona Libre S.A.',
    destination: 'Venezuela',
    invoiceNumber: 'FAC-2026-0112',
    productDescriptions: [
      'WHISKY JOHNNIE WALKER RED NR 12X750ML 40%VOL',
      'RON DIPLOMATICO RVA EXCLUSIVA TUBO 6X750ML',
      'VODKA SMIRNOFF ORIGINAL 6X1.75ML 40%VO',
    ],
    quantities: [
      '80 cajas (960 unidades)',
      '50 cajas (300 unidades)',
      '50 cajas (300 unidades)',
    ],
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
  // CERT-2026-0002 - Colombia (EXP-2026-0003)
  {
    id: 'CERT-2026-0002',
    expedientId: 'EXP-2026-0003',
    type: 'libre_venta',
    status: 'completado',
    createdAt: '2026-02-12T10:00:00.000Z',
    exporterName: 'Evolution Zona Libre S.A.',
    destination: 'Colombia',
    invoiceNumber: 'FAC-2026-0085',
    productDescriptions: [
      'WHISKY JOHNNIE WALKER BLACK 12YRS 24X375ML 40%V',
      'TEQUILA DON JULIO 1942 GB COR 6X750ML 40%V',
      'VINO SPERONE PROSECCO 12X750ML 11.5%V',
      'GINEBRA HENDRICKS RF 12X1000ML 44% VOL',
    ],
    quantities: [
      '60 cajas (1440 unidades)',
      '40 cajas (240 unidades)',
      '100 cajas (1200 unidades)',
      '50 cajas (600 unidades)',
    ],
    createdBy: 'usr-trafico-1',
    createdByName: 'Carlos Mendoza',
  },
];

// ============================================
// TIMELINE EVENTS
// ============================================

/**
 * Timeline events keyed by expedient ID
 */
const SEED_TIMELINE_EVENTS: Record<string, TimelineEvent[]> = {
  // EXP-2026-0001 - pendiente/urgente Venezuela (6 events)
  'EXP-2026-0001': [
    {
      id: 'evt-001-01',
      timestamp: '2026-02-20T08:30:00.000Z',
      action: 'expediente_creado',
      description: 'Expediente de salida creado a partir de factura FAC-2026-0112',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-001-02',
      timestamp: '2026-02-20T09:00:00.000Z',
      action: 'dmc_generada',
      description: 'DMC de salida DMS-2026-0001 generada automaticamente con 3 lineas de mercancia',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-001-03',
      timestamp: '2026-02-21T10:00:00.000Z',
      action: 'bl_generado',
      description: 'Bill of Lading BL-2026-0001 creado - buque Maersk Cartagena, viaje MC-2026-042',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-001-04',
      timestamp: '2026-02-21T11:00:00.000Z',
      action: 'certificado_generado',
      description: 'Certificado de libre venta CERT-2026-0001 emitido para destino Venezuela',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-001-05',
      timestamp: '2026-02-21T14:30:00.000Z',
      action: 'dmc_registrada',
      description: 'DMC registrada en plataforma gubernamental - Numero GOB-DMS-2026-003421',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-001-06',
      timestamp: '2026-02-22T09:00:00.000Z',
      action: 'prioridad_actualizada',
      description: 'Prioridad cambiada a URGENTE - cliente solicita despacho inmediato por reposicion critica',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
  ],
  // EXP-2026-0003 - documentado Colombia (5 events)
  'EXP-2026-0003': [
    {
      id: 'evt-003-01',
      timestamp: '2026-02-10T09:00:00.000Z',
      action: 'expediente_creado',
      description: 'Expediente de salida creado a partir de factura FAC-2026-0085 para Distribuidora Caribe SAS',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-003-02',
      timestamp: '2026-02-10T10:00:00.000Z',
      action: 'dmc_generada',
      description: 'DMC de salida DMS-2026-0003 generada con 4 lineas de mercancia - whisky, tequila, vino, ginebra',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-003-03',
      timestamp: '2026-02-12T09:00:00.000Z',
      action: 'bl_generado',
      description: 'Bill of Lading BL-2026-0003 creado y enviado - buque MSC Pacifico, contenedor 40ft MSCU6123498',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-003-04',
      timestamp: '2026-02-12T10:00:00.000Z',
      action: 'certificado_generado',
      description: 'Certificado de libre venta CERT-2026-0002 emitido para destino Colombia',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-003-05',
      timestamp: '2026-02-12T11:00:00.000Z',
      action: 'dmc_registrada',
      description: 'DMC registrada en plataforma gubernamental - Numero GOB-DMS-2026-003218. Expediente documentado.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
  ],
  // EXP-2026-0004 - despachado Jamaica (5 events)
  'EXP-2026-0004': [
    {
      id: 'evt-004-01',
      timestamp: '2026-02-05T14:20:00.000Z',
      action: 'expediente_creado',
      description: 'Expediente de salida creado a partir de factura FAC-2026-0071 para Jamaica Beverages Ltd',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-004-02',
      timestamp: '2026-02-06T08:30:00.000Z',
      action: 'dmc_generada',
      description: 'DMC de salida DMS-2026-0004 generada con 3 lineas - ron, whisky, snacks',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-004-03',
      timestamp: '2026-02-10T11:00:00.000Z',
      action: 'bl_generado',
      description: 'Bill of Lading BL-2026-0004 creado - buque Hapag-Lloyd Caribbean Express, viaje HL-2026-012',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-004-04',
      timestamp: '2026-02-08T10:00:00.000Z',
      action: 'dmc_registrada',
      description: 'DMC registrada en plataforma gubernamental - Numero GOB-DMS-2026-003105',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-004-05',
      timestamp: '2026-02-15T09:30:00.000Z',
      action: 'mercancia_despachada',
      description: 'Mercancia despachada desde ZL Colon. Contenedor HLCU4567891 embarcado en Maersk Cartagena. ETA Kingston: 18 Feb 2026.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
  ],
  // EXP-2026-0006 - entregado RD (6 events)
  'EXP-2026-0006': [
    {
      id: 'evt-006-01',
      timestamp: '2026-01-15T09:45:00.000Z',
      action: 'expediente_creado',
      description: 'Expediente de salida creado a partir de factura FAC-2026-0029 para Ron del Santo S.R.L.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-006-02',
      timestamp: '2026-01-16T08:00:00.000Z',
      action: 'dmc_generada',
      description: 'DMC de salida DMS-2026-0006 generada con 4 lineas de mercancia - ron, whisky, licor',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-006-03',
      timestamp: '2026-01-18T12:00:00.000Z',
      action: 'dmc_registrada',
      description: 'DMC registrada en plataforma gubernamental - Numero GOB-DMS-2026-002834',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-006-04',
      timestamp: '2026-01-22T07:30:00.000Z',
      action: 'mercancia_despachada',
      description: 'Mercancia despachada desde ZL Colon. Contenedor 40ft EISU3456789 embarcado en Ever Caribe.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-006-05',
      timestamp: '2026-01-25T08:30:00.000Z',
      action: 'mercancia_arribada',
      description: 'Contenedor arribo a puerto DOSDQ - Santo Domingo. Inicio proceso de desaduanaje.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-006-06',
      timestamp: '2026-01-26T16:00:00.000Z',
      action: 'mercancia_entregada',
      description: 'Mercancia entregada exitosamente a Ron del Santo S.R.L. en Santo Domingo. Expediente completado.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
  ],
  // EXP-2026-0005 - en_transito Aruba (4 events)
  'EXP-2026-0005': [
    {
      id: 'evt-005-01',
      timestamp: '2026-02-01T11:00:00.000Z',
      action: 'expediente_creado',
      description: 'Expediente de salida creado a partir de factura FAC-2026-0058 para Island Liquor N.V.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-005-02',
      timestamp: '2026-02-02T09:00:00.000Z',
      action: 'dmc_generada',
      description: 'DMC de salida DMS-2026-0005 generada con 2 lineas - whisky y vodka',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-005-03',
      timestamp: '2026-02-05T10:00:00.000Z',
      action: 'bl_generado',
      description: 'Bill of Lading BL-2026-0005 creado y enviado - buque CMA CGM Antilles, viaje CG-2026-015',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-005-04',
      timestamp: '2026-02-10T08:00:00.000Z',
      action: 'mercancia_despachada',
      description: 'Mercancia despachada. Contenedor 20ft CMAU7891234 embarcado rumbo a Oranjestad, Aruba. ETA: 12 Feb 2026.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
  ],
  // EXP-2026-0007 - cancelado Venezuela (3 events)
  'EXP-2026-0007': [
    {
      id: 'evt-007-01',
      timestamp: '2026-01-20T16:00:00.000Z',
      action: 'expediente_creado',
      description: 'Expediente de salida creado a partir de factura FAC-2026-0035 para Licores del Caribe C.A.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-007-02',
      timestamp: '2026-01-21T09:00:00.000Z',
      action: 'dmc_generada',
      description: 'DMC de salida DMS-2026-0007 generada con 2 lineas - whisky y tequila',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
    {
      id: 'evt-007-03',
      timestamp: '2026-01-25T10:00:00.000Z',
      action: 'expediente_cancelado',
      description: 'Expediente cancelado por solicitud del cliente. Motivo: problemas con documentacion de importacion en Venezuela. DMC anulada.',
      userName: 'Carlos Mendoza',
      userRole: 'Coordinador de Trafico',
    },
  ],
};

// ============================================================================
// STORE INFRASTRUCTURE – Ports
// ============================================================================

let _ports: Port[] = SEED_PORTS;
let _portsInit = false;
const { subscribe: subscribePorts, notify: _notifyPorts } = createSubscribers();

function ensurePortsInitialized(): void {
  if (typeof window === 'undefined' || _portsInit) return;
  _ports = loadCollection<Port>('ports', SEED_PORTS);
  _portsInit = true;
}

export function getPortsData(): Port[] {
  ensurePortsInitialized();
  return _ports;
}

export { subscribePorts };

export const MOCK_PORTS: Port[] = new Proxy(SEED_PORTS as Port[], {
  get(_target, prop, receiver) {
    ensurePortsInitialized();
    return Reflect.get(_ports, prop, receiver);
  },
});

export function addPort(port: Port): void {
  ensurePortsInitialized();
  _ports = [..._ports, port];
  saveCollection('ports', _ports);
  _notifyPorts();
}

export function updatePort(id: string, updates: Partial<Port>): void {
  ensurePortsInitialized();
  _ports = _ports.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveCollection('ports', _ports);
  _notifyPorts();
}

export function removePort(id: string): void {
  ensurePortsInitialized();
  _ports = _ports.filter((p) => p.id !== id);
  saveCollection('ports', _ports);
  _notifyPorts();
}

// ============================================================================
// STORE INFRASTRUCTURE – Carriers
// ============================================================================

let _carriers: Carrier[] = SEED_CARRIERS;
let _carriersInit = false;
const { subscribe: subscribeCarriers, notify: _notifyCarriers } = createSubscribers();

function ensureCarriersInitialized(): void {
  if (typeof window === 'undefined' || _carriersInit) return;
  _carriers = loadCollection<Carrier>('carriers', SEED_CARRIERS);
  _carriersInit = true;
}

export function getCarriersData(): Carrier[] {
  ensureCarriersInitialized();
  return _carriers;
}

export { subscribeCarriers };

export const MOCK_CARRIERS: Carrier[] = new Proxy(SEED_CARRIERS as Carrier[], {
  get(_target, prop, receiver) {
    ensureCarriersInitialized();
    return Reflect.get(_carriers, prop, receiver);
  },
});

export function addCarrier(carrier: Carrier): void {
  ensureCarriersInitialized();
  _carriers = [..._carriers, carrier];
  saveCollection('carriers', _carriers);
  _notifyCarriers();
}

export function updateCarrier(id: string, updates: Partial<Carrier>): void {
  ensureCarriersInitialized();
  _carriers = _carriers.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCollection('carriers', _carriers);
  _notifyCarriers();
}

export function removeCarrier(id: string): void {
  ensureCarriersInitialized();
  _carriers = _carriers.filter((c) => c.id !== id);
  saveCollection('carriers', _carriers);
  _notifyCarriers();
}

// ============================================================================
// STORE INFRASTRUCTURE – Related Companies
// ============================================================================

let _relatedCompanies: RelatedCompany[] = SEED_RELATED_COMPANIES;
let _relatedCompaniesInit = false;
const { subscribe: subscribeRelatedCompanies, notify: _notifyRelatedCompanies } = createSubscribers();

function ensureRelatedCompaniesInitialized(): void {
  if (typeof window === 'undefined' || _relatedCompaniesInit) return;
  _relatedCompanies = loadCollection<RelatedCompany>('related_companies', SEED_RELATED_COMPANIES);
  _relatedCompaniesInit = true;
}

export function getRelatedCompaniesData(): RelatedCompany[] {
  ensureRelatedCompaniesInitialized();
  return _relatedCompanies;
}

export { subscribeRelatedCompanies };

export const MOCK_RELATED_COMPANIES: RelatedCompany[] = new Proxy(SEED_RELATED_COMPANIES as RelatedCompany[], {
  get(_target, prop, receiver) {
    ensureRelatedCompaniesInitialized();
    return Reflect.get(_relatedCompanies, prop, receiver);
  },
});

export function addRelatedCompany(company: RelatedCompany): void {
  ensureRelatedCompaniesInitialized();
  _relatedCompanies = [..._relatedCompanies, company];
  saveCollection('related_companies', _relatedCompanies);
  _notifyRelatedCompanies();
}

export function updateRelatedCompany(id: string, updates: Partial<RelatedCompany>): void {
  ensureRelatedCompaniesInitialized();
  _relatedCompanies = _relatedCompanies.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCollection('related_companies', _relatedCompanies);
  _notifyRelatedCompanies();
}

export function removeRelatedCompany(id: string): void {
  ensureRelatedCompaniesInitialized();
  _relatedCompanies = _relatedCompanies.filter((c) => c.id !== id);
  saveCollection('related_companies', _relatedCompanies);
  _notifyRelatedCompanies();
}

// ============================================================================
// STORE INFRASTRUCTURE – Destination Requirements
// ============================================================================

let _destinationRequirements: DestinationRequirement[] = SEED_DESTINATION_REQUIREMENTS;
let _destinationRequirementsInit = false;
const { subscribe: subscribeDestinationRequirements, notify: _notifyDestinationRequirements } = createSubscribers();

function ensureDestinationRequirementsInitialized(): void {
  if (typeof window === 'undefined' || _destinationRequirementsInit) return;
  _destinationRequirements = loadCollection<DestinationRequirement>('destination_requirements', SEED_DESTINATION_REQUIREMENTS);
  _destinationRequirementsInit = true;
}

export function getDestinationRequirementsData(): DestinationRequirement[] {
  ensureDestinationRequirementsInitialized();
  return _destinationRequirements;
}

export { subscribeDestinationRequirements };

export const MOCK_DESTINATION_REQUIREMENTS: DestinationRequirement[] = new Proxy(SEED_DESTINATION_REQUIREMENTS as DestinationRequirement[], {
  get(_target, prop, receiver) {
    ensureDestinationRequirementsInitialized();
    return Reflect.get(_destinationRequirements, prop, receiver);
  },
});

export function addDestinationRequirement(req: DestinationRequirement): void {
  ensureDestinationRequirementsInitialized();
  _destinationRequirements = [..._destinationRequirements, req];
  saveCollection('destination_requirements', _destinationRequirements);
  _notifyDestinationRequirements();
}

export function updateDestinationRequirement(country: string, updates: Partial<DestinationRequirement>): void {
  ensureDestinationRequirementsInitialized();
  _destinationRequirements = _destinationRequirements.map((r) => (r.country === country ? { ...r, ...updates } : r));
  saveCollection('destination_requirements', _destinationRequirements);
  _notifyDestinationRequirements();
}

export function removeDestinationRequirement(country: string): void {
  ensureDestinationRequirementsInitialized();
  _destinationRequirements = _destinationRequirements.filter((r) => r.country !== country);
  saveCollection('destination_requirements', _destinationRequirements);
  _notifyDestinationRequirements();
}

// ============================================================================
// STORE INFRASTRUCTURE – Expedients
// ============================================================================

let _expedients: ShipmentExpedient[] = SEED_EXPEDIENTS;
let _expedientsInit = false;
const { subscribe: subscribeExpedients, notify: _notifyExpedients } = createSubscribers();

function ensureExpedientsInitialized(): void {
  if (typeof window === 'undefined' || _expedientsInit) return;
  _expedients = loadCollection<ShipmentExpedient>('expedients', SEED_EXPEDIENTS);
  _expedientsInit = true;
}

export function getExpedientsData(): ShipmentExpedient[] {
  ensureExpedientsInitialized();
  return _expedients;
}

export { subscribeExpedients };

export const MOCK_EXPEDIENTS: ShipmentExpedient[] = new Proxy(SEED_EXPEDIENTS as ShipmentExpedient[], {
  get(_target, prop, receiver) {
    ensureExpedientsInitialized();
    return Reflect.get(_expedients, prop, receiver);
  },
});

export function addExpedient(exp: ShipmentExpedient): void {
  ensureExpedientsInitialized();
  _expedients = [..._expedients, exp];
  saveCollection('expedients', _expedients);
  _notifyExpedients();
}

export function updateExpedient(id: string, updates: Partial<ShipmentExpedient>): void {
  ensureExpedientsInitialized();
  _expedients = _expedients.map((e) => (e.id === id ? { ...e, ...updates } : e));
  saveCollection('expedients', _expedients);
  _notifyExpedients();
}

export function removeExpedient(id: string): void {
  ensureExpedientsInitialized();
  _expedients = _expedients.filter((e) => e.id !== id);
  saveCollection('expedients', _expedients);
  _notifyExpedients();
}

// ============================================================================
// STORE INFRASTRUCTURE – DMC Documents
// ============================================================================

let _dmcDocuments: DMC[] = SEED_DMC_DOCUMENTS;
let _dmcDocumentsInit = false;
const { subscribe: subscribeDMCDocuments, notify: _notifyDMCDocuments } = createSubscribers();

function ensureDMCDocumentsInitialized(): void {
  if (typeof window === 'undefined' || _dmcDocumentsInit) return;
  _dmcDocuments = loadCollection<DMC>('dmc', SEED_DMC_DOCUMENTS);
  _dmcDocumentsInit = true;
}

export function getDMCDocumentsData(): DMC[] {
  ensureDMCDocumentsInitialized();
  return _dmcDocuments;
}

export { subscribeDMCDocuments };

export const MOCK_DMC_DOCUMENTS: DMC[] = new Proxy(SEED_DMC_DOCUMENTS as DMC[], {
  get(_target, prop, receiver) {
    ensureDMCDocumentsInitialized();
    return Reflect.get(_dmcDocuments, prop, receiver);
  },
});

export function addDMCDocument(dmc: DMC): void {
  ensureDMCDocumentsInitialized();
  _dmcDocuments = [..._dmcDocuments, dmc];
  saveCollection('dmc', _dmcDocuments);
  _notifyDMCDocuments();
}

export function updateDMCDocument(id: string, updates: Partial<DMC>): void {
  ensureDMCDocumentsInitialized();
  _dmcDocuments = _dmcDocuments.map((d) => (d.id === id ? { ...d, ...updates } : d));
  saveCollection('dmc', _dmcDocuments);
  _notifyDMCDocuments();
}

export function removeDMCDocument(id: string): void {
  ensureDMCDocumentsInitialized();
  _dmcDocuments = _dmcDocuments.filter((d) => d.id !== id);
  saveCollection('dmc', _dmcDocuments);
  _notifyDMCDocuments();
}

// ============================================================================
// STORE INFRASTRUCTURE – Bills of Lading
// ============================================================================

let _billsOfLading: BillOfLading[] = SEED_BILLS_OF_LADING;
let _billsOfLadingInit = false;
const { subscribe: subscribeBillsOfLading, notify: _notifyBillsOfLading } = createSubscribers();

function ensureBillsOfLadingInitialized(): void {
  if (typeof window === 'undefined' || _billsOfLadingInit) return;
  _billsOfLading = loadCollection<BillOfLading>('bills_of_lading', SEED_BILLS_OF_LADING);
  _billsOfLadingInit = true;
}

export function getBillsOfLadingData(): BillOfLading[] {
  ensureBillsOfLadingInitialized();
  return _billsOfLading;
}

export { subscribeBillsOfLading };

export const MOCK_BILLS_OF_LADING: BillOfLading[] = new Proxy(SEED_BILLS_OF_LADING as BillOfLading[], {
  get(_target, prop, receiver) {
    ensureBillsOfLadingInitialized();
    return Reflect.get(_billsOfLading, prop, receiver);
  },
});

export function addBillOfLading(bl: BillOfLading): void {
  ensureBillsOfLadingInitialized();
  _billsOfLading = [..._billsOfLading, bl];
  saveCollection('bills_of_lading', _billsOfLading);
  _notifyBillsOfLading();
}

export function updateBillOfLading(id: string, updates: Partial<BillOfLading>): void {
  ensureBillsOfLadingInitialized();
  _billsOfLading = _billsOfLading.map((b) => (b.id === id ? { ...b, ...updates } : b));
  saveCollection('bills_of_lading', _billsOfLading);
  _notifyBillsOfLading();
}

export function removeBillOfLading(id: string): void {
  ensureBillsOfLadingInitialized();
  _billsOfLading = _billsOfLading.filter((b) => b.id !== id);
  saveCollection('bills_of_lading', _billsOfLading);
  _notifyBillsOfLading();
}

// ============================================================================
// STORE INFRASTRUCTURE – Free Sale Certificates
// ============================================================================

let _certificates: FreeSaleCertificate[] = SEED_CERTIFICATES;
let _certificatesInit = false;
const { subscribe: subscribeCertificates, notify: _notifyCertificates } = createSubscribers();

function ensureCertificatesInitialized(): void {
  if (typeof window === 'undefined' || _certificatesInit) return;
  _certificates = loadCollection<FreeSaleCertificate>('certificates', SEED_CERTIFICATES);
  _certificatesInit = true;
}

export function getCertificatesData(): FreeSaleCertificate[] {
  ensureCertificatesInitialized();
  return _certificates;
}

export { subscribeCertificates };

export const MOCK_CERTIFICATES: FreeSaleCertificate[] = new Proxy(SEED_CERTIFICATES as FreeSaleCertificate[], {
  get(_target, prop, receiver) {
    ensureCertificatesInitialized();
    return Reflect.get(_certificates, prop, receiver);
  },
});

export function addCertificate(cert: FreeSaleCertificate): void {
  ensureCertificatesInitialized();
  _certificates = [..._certificates, cert];
  saveCollection('certificates', _certificates);
  _notifyCertificates();
}

export function updateCertificate(id: string, updates: Partial<FreeSaleCertificate>): void {
  ensureCertificatesInitialized();
  _certificates = _certificates.map((c) => (c.id === id ? { ...c, ...updates } : c));
  saveCollection('certificates', _certificates);
  _notifyCertificates();
}

export function removeCertificate(id: string): void {
  ensureCertificatesInitialized();
  _certificates = _certificates.filter((c) => c.id !== id);
  saveCollection('certificates', _certificates);
  _notifyCertificates();
}

// ============================================================================
// STORE INFRASTRUCTURE – Timeline Events (singleton: Record<string, TimelineEvent[]>)
// ============================================================================

let _timelineEvents: Record<string, TimelineEvent[]> = SEED_TIMELINE_EVENTS;
let _timelineEventsInit = false;
const { subscribe: subscribeTimelineEvents, notify: _notifyTimelineEvents } = createSubscribers();

function ensureTimelineEventsInitialized(): void {
  if (typeof window === 'undefined' || _timelineEventsInit) return;
  _timelineEvents = loadSingleton<Record<string, TimelineEvent[]>>('timeline_events', SEED_TIMELINE_EVENTS);
  _timelineEventsInit = true;
}

export function getTimelineEventsData(): Record<string, TimelineEvent[]> {
  ensureTimelineEventsInitialized();
  return _timelineEvents;
}

export { subscribeTimelineEvents };

export const MOCK_TIMELINE_EVENTS: Record<string, TimelineEvent[]> = new Proxy(SEED_TIMELINE_EVENTS, {
  get(_target, prop, receiver) {
    ensureTimelineEventsInitialized();
    return Reflect.get(_timelineEvents, prop, receiver);
  },
});

export function setTimelineEventsForExpedient(expedientId: string, events: TimelineEvent[]): void {
  ensureTimelineEventsInitialized();
  _timelineEvents = { ..._timelineEvents, [expedientId]: events };
  saveSingleton('timeline_events', _timelineEvents);
  _notifyTimelineEvents();
}

export function addTimelineEvent(expedientId: string, event: TimelineEvent): void {
  ensureTimelineEventsInitialized();
  const existing = _timelineEvents[expedientId] ?? [];
  _timelineEvents = { ..._timelineEvents, [expedientId]: [...existing, event] };
  saveSingleton('timeline_events', _timelineEvents);
  _notifyTimelineEvents();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate traffic module statistics
 */
export function getTrafficStats(): TrafficStats {
  ensureExpedientsInitialized();
  ensureDMCDocumentsInitialized();

  const today = new Date().toISOString().slice(0, 10);

  const pendingToday = _expedients.filter(
    (e) => e.status === 'pendiente' && e.createdAt.slice(0, 10) <= today
  ).length;

  const dmcPending = _dmcDocuments.filter(
    (d) => d.status === 'borrador' || d.status === 'completado'
  ).length;

  const inTransit = _expedients.filter(
    (e) => e.status === 'en_transito'
  ).length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString();

  const completedThisWeek = _expedients.filter(
    (e) =>
      (e.status === 'entregado' || e.status === 'despachado') &&
      e.actualDispatchDate &&
      e.actualDispatchDate >= oneWeekAgoStr
  ).length;

  return {
    pendingToday,
    dmcPending,
    inTransit,
    completedThisWeek,
  };
}

/**
 * Find an expedient by its ID
 */
export function getExpedientById(id: string): ShipmentExpedient | undefined {
  ensureExpedientsInitialized();
  return _expedients.find((e) => e.id === id);
}

/**
 * Get all DMCs associated with an expedient
 */
export function getDMCsByExpedient(expedientId: string): DMC[] {
  ensureDMCDocumentsInitialized();
  return _dmcDocuments.filter((d) => d.expedientId === expedientId);
}

/**
 * Get the Bill of Lading associated with an expedient
 */
export function getBLByExpedient(expedientId: string): BillOfLading | undefined {
  ensureBillsOfLadingInitialized();
  return _billsOfLading.find((b) => b.expedientId === expedientId);
}

/**
 * Get all certificates associated with an expedient
 */
export function getCertificatesByExpedient(expedientId: string): FreeSaleCertificate[] {
  ensureCertificatesInitialized();
  return _certificates.filter((c) => c.expedientId === expedientId);
}

/**
 * Get all expedients with 'pendiente' status
 */
export function getPendingExpedients(): ShipmentExpedient[] {
  ensureExpedientsInitialized();
  return _expedients.filter((e) => e.status === 'pendiente');
}

/**
 * Get the timeline events for a given expedient
 */
export function getExpedientTimeline(expedientId: string): TimelineEvent[] {
  ensureTimelineEventsInitialized();
  return _timelineEvents[expedientId] || [];
}
