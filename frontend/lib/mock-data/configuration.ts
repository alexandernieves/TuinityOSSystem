/**
 * Mock data for Configuration (Configuración) module
 * Based on Document 008 specifications
 * Store-backed: data persists in localStorage
 */

import type {
  CompanyInfo,
  Branch,
  RoleTemplate,
  ApprovalFlow,
  MasterCatalog,
  CatalogItem,
  NotificationConfig,
  AuditLogEntry,
  ActiveSession,
  SecurityPolicies,
  CommercialParams,
  DocumentNumbering,
  SystemInfo,
  Integration,
} from '@/lib/types/configuration';
import {
  loadCollection,
  saveCollection,
  loadSingleton,
  saveSingleton,
  createSubscribers,
} from '@/lib/store/local-store';

// ============================================================================
// SEED DATA: COMPANY INFO
// ============================================================================

const SEED_COMPANY_INFO: CompanyInfo = {
  legalName: 'Evolution Trading Corp.',
  tradeName: 'Evolution Zona Libre',
  taxId: '155678-1-789012',
  taxIdType: 'RUC',
  legalRepresentative: 'Javier Lange',
  address: 'Zona Libre de Colón, Edificio 2045, Local 3-A',
  city: 'Colón',
  country: 'Panamá',
  phone: '+507 441-8900',
  email: 'info@evolutionzl.com',
  website: 'www.evolutionzl.com',
  logo: 'https://res.cloudinary.com/db3espoei/image/upload/v1771993730/Logo_Evolution_ZL__1_-1_wgd1hg.svg',
  currency: 'USD',
  timezone: 'America/Panama',
  fiscalYearStart: 1,
  electronicInvoicing: false,
};

// ============================================================================
// SEED DATA: BRANCHES
// ============================================================================

const SEED_BRANCHES: Branch[] = [
  { id: 'BR-001', name: 'Zona Libre de Colón', code: 'ZL', type: 'zona_libre', address: 'Zona Libre de Colón, Edificio 2045', city: 'Colón', country: 'Panamá', phone: '+507 441-8900', manager: 'Javier Lange', isActive: true, isHeadquarters: true },
  { id: 'BR-002', name: 'Tienda PTY', code: 'PTY-TIENDA', type: 'tienda', address: 'Vía España, Local 42', city: 'Ciudad de Panamá', country: 'Panamá', phone: '+507 263-4567', manager: 'Pedro Bodega', isActive: true, isHeadquarters: false },
  { id: 'BR-003', name: 'Bodega CFZ', code: 'CFZ', type: 'bodega', address: 'Colón Free Zone, Warehouse 15', city: 'Colón', country: 'Panamá', phone: '+507 441-2345', manager: 'Jesus Ferreira', isActive: true, isHeadquarters: false },
];

// ============================================================================
// SEED DATA: ROLE TEMPLATES
// ============================================================================

const SEED_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'RT-001', name: 'Administrador Supremo', description: 'Acceso total al sistema. No puede ser eliminado ni modificado.', baseRole: 'gerencia', isSystemRole: true, isActive: true, userCount: 1,
    permissions: [
      { module: 'all', moduleLabel: 'Todos los Módulos', icon: 'Shield', permissions: [{ key: 'ALL', label: 'Acceso Total', description: 'Acceso completo a todas las funciones del sistema', enabled: true }] },
    ],
  },
  {
    id: 'RT-002', name: 'Gerencia', description: 'Acceso a todos los módulos con capacidad de aprobación y supervisión.', baseRole: 'gerencia', isSystemRole: false, isActive: true, userCount: 1,
    permissions: [
      { module: 'ventas', moduleLabel: 'Ventas B2B', icon: 'Briefcase', permissions: [
        { key: 'canAccessVentas', label: 'Acceder a Ventas', description: 'Ver módulo de ventas B2B', enabled: true },
        { key: 'canApproveOrders', label: 'Aprobar Pedidos', description: 'Aprobar pedidos de venta', enabled: true },
        { key: 'canViewMargins', label: 'Ver Márgenes', description: 'Ver márgenes de ganancia', enabled: true },
      ]},
      { module: 'contabilidad', moduleLabel: 'Contabilidad', icon: 'Calculator', permissions: [
        { key: 'canAccessContabilidad', label: 'Acceder a Contabilidad', description: 'Ver módulo de contabilidad', enabled: true },
        { key: 'canApproveEntries', label: 'Aprobar Asientos', description: 'Aprobar asientos contables', enabled: true },
        { key: 'canCloseAnnualPeriod', label: 'Cierre Anual', description: 'Ejecutar cierre anual', enabled: true },
      ]},
    ],
  },
  {
    id: 'RT-003', name: 'Ventas', description: 'Gestión de cotizaciones, pedidos y clientes. Sin acceso a costos ni márgenes.', baseRole: 'vendedor', isSystemRole: false, isActive: true, userCount: 2,
    permissions: [
      { module: 'ventas', moduleLabel: 'Ventas B2B', icon: 'Briefcase', permissions: [
        { key: 'canAccessVentas', label: 'Acceder a Ventas', description: 'Ver módulo de ventas B2B', enabled: true },
        { key: 'canCreateQuotes', label: 'Crear Cotizaciones', description: 'Crear nuevas cotizaciones', enabled: true },
        { key: 'canViewMargins', label: 'Ver Márgenes', description: 'Ver márgenes de ganancia', enabled: false },
        { key: 'canViewCosts', label: 'Ver Costos', description: 'Ver costos de productos', enabled: false },
      ]},
    ],
  },
  {
    id: 'RT-004', name: 'Compras', description: 'Gestión de órdenes de compra, proveedores y precios.', baseRole: 'compras', isSystemRole: false, isActive: true, userCount: 1,
    permissions: [
      { module: 'compras', moduleLabel: 'Compras', icon: 'ShoppingCart', permissions: [
        { key: 'canAccessCompras', label: 'Acceder a Compras', description: 'Ver módulo de compras', enabled: true },
        { key: 'canCreatePurchaseOrders', label: 'Crear Órdenes', description: 'Crear órdenes de compra', enabled: true },
        { key: 'canViewCosts', label: 'Ver Costos', description: 'Ver costos de productos', enabled: true },
      ]},
    ],
  },
  {
    id: 'RT-005', name: 'Finanzas', description: 'Contabilidad, CxC, facturación y reportes financieros.', baseRole: 'contabilidad', isSystemRole: false, isActive: true, userCount: 1,
    permissions: [
      { module: 'contabilidad', moduleLabel: 'Contabilidad', icon: 'Calculator', permissions: [
        { key: 'canAccessContabilidad', label: 'Acceder a Contabilidad', description: 'Ver módulo de contabilidad', enabled: true },
        { key: 'canCreateManualEntries', label: 'Asientos Manuales', description: 'Crear asientos contables manuales', enabled: true },
        { key: 'canReconcileBank', label: 'Conciliación', description: 'Realizar conciliaciones bancarias', enabled: true },
        { key: 'canCloseMonthlyPeriod', label: 'Cierre Mensual', description: 'Ejecutar cierre mensual', enabled: true },
      ]},
    ],
  },
  {
    id: 'RT-006', name: 'Almacén', description: 'Inventario, transferencias, conteos físicos y empaque.', baseRole: 'bodega', isSystemRole: false, isActive: true, userCount: 2,
    permissions: [
      { module: 'inventario', moduleLabel: 'Inventario', icon: 'Warehouse', permissions: [
        { key: 'canAccessInventory', label: 'Acceder a Inventario', description: 'Ver módulo de inventario', enabled: true },
        { key: 'canCreateAdjustments', label: 'Crear Ajustes', description: 'Crear ajustes de inventario', enabled: true },
        { key: 'canCreateTransfers', label: 'Crear Transferencias', description: 'Crear transferencias entre bodegas', enabled: true },
        { key: 'canPackOrders', label: 'Empacar Pedidos', description: 'Gestionar empaque de pedidos', enabled: true },
      ]},
    ],
  },
  {
    id: 'RT-007', name: 'Solo Lectura', description: 'Acceso de solo lectura a todos los módulos visibles.', baseRole: 'vendedor', isSystemRole: false, isActive: true, userCount: 0,
    permissions: [
      { module: 'all', moduleLabel: 'Todos los Módulos', icon: 'Eye', permissions: [{ key: 'READ_ONLY', label: 'Solo Lectura', description: 'Puede ver pero no crear ni editar', enabled: true }] },
    ],
  },
];

// ============================================================================
// SEED DATA: APPROVAL FLOWS
// ============================================================================

const SEED_APPROVAL_FLOWS: ApprovalFlow[] = [
  {
    id: 'AF-001', name: 'Pedidos B2B', description: 'Aprobación de pedidos de venta B2B. Escalación en cascada si no hay respuesta.',
    triggerCondition: 'Pedido B2B creado o margen < 10%', isActive: true,
    steps: [
      { id: 'AS-001', order: 1, approverRole: 'contabilidad', approverLabel: 'Jakeira Chavez', approverUserId: 'USR-003', approverUserName: 'Jakeira Chavez', isRequired: true, canSkip: false, timeoutHours: 24, escalationTimeoutHours: 24, notifyAlways: ['USR-001'] },
      { id: 'AS-001b', order: 1, approverRole: 'gerencia', approverLabel: 'Astelvia Watts', approverUserId: 'USR-002', approverUserName: 'Astelvia Watts', isRequired: false, canSkip: true, timeoutHours: 24, escalationTimeoutHours: 24, notifyAlways: ['USR-001'] },
      { id: 'AS-002', order: 2, approverRole: 'gerencia', approverLabel: 'Javier Lange (Escalación)', approverUserId: 'USR-001', approverUserName: 'Javier Lange', isRequired: true, canSkip: false, timeoutHours: 48 },
    ],
    escalationTimeout: 24, escalateTo: 'gerencia',
  },
  {
    id: 'AF-002', name: 'Devoluciones y Notas de Crédito', description: 'Aprobación de devoluciones con escalación a gerencia.',
    triggerCondition: 'Solicitud de devolución creada', isActive: true,
    steps: [
      { id: 'AS-003', order: 1, approverRole: 'gerencia', approverLabel: 'Astelvia Watts', approverUserId: 'USR-002', approverUserName: 'Astelvia Watts', isRequired: true, canSkip: false, timeoutHours: 12, escalationTimeoutHours: 12, notifyAlways: ['USR-001'] },
      { id: 'AS-004', order: 2, approverRole: 'gerencia', approverLabel: 'Javier Lange (Escalación)', approverUserId: 'USR-001', approverUserName: 'Javier Lange', isRequired: true, canSkip: false, timeoutHours: 24 },
    ],
    escalationTimeout: 12, escalateTo: 'gerencia',
  },
  {
    id: 'AF-003', name: 'Ajustes de Inventario', description: 'Ajustes de inventario aprobados por Astelvia, escalación a Javier.',
    triggerCondition: 'Ajuste de inventario creado', isActive: true,
    steps: [
      { id: 'AS-005', order: 1, approverRole: 'gerencia', approverLabel: 'Astelvia Watts', approverUserId: 'USR-002', approverUserName: 'Astelvia Watts', isRequired: true, canSkip: false, timeoutHours: 24, escalationTimeoutHours: 24, notifyAlways: ['USR-001'] },
      { id: 'AS-006', order: 2, approverRole: 'gerencia', approverLabel: 'Javier Lange (Escalación)', approverUserId: 'USR-001', approverUserName: 'Javier Lange', isRequired: true, canSkip: false, timeoutHours: 48 },
    ],
    escalationTimeout: 24, escalateTo: 'gerencia',
  },
  {
    id: 'AF-004', name: 'Órdenes de Compra (OC)', description: 'OC aprobadas por Astelvia, escalación a Javier.',
    triggerCondition: 'Orden de compra creada', isActive: true,
    steps: [
      { id: 'AS-007', order: 1, approverRole: 'gerencia', approverLabel: 'Astelvia Watts', approverUserId: 'USR-002', approverUserName: 'Astelvia Watts', isRequired: true, canSkip: false, timeoutHours: 24, escalationTimeoutHours: 24, notifyAlways: ['USR-001'] },
      { id: 'AS-008', order: 2, approverRole: 'gerencia', approverLabel: 'Javier Lange (Escalación)', approverUserId: 'USR-001', approverUserName: 'Javier Lange', isRequired: true, canSkip: false, timeoutHours: 48 },
    ],
    escalationTimeout: 24, escalateTo: 'gerencia',
  },
  {
    id: 'AF-005', name: 'Anulaciones de Documentos', description: 'Toda anulación requiere aprobación exclusiva de Javier.',
    triggerCondition: 'Solicitud de anulación creada', isActive: true,
    steps: [
      { id: 'AS-009', order: 1, approverRole: 'gerencia', approverLabel: 'Javier Lange', approverUserId: 'USR-001', approverUserName: 'Javier Lange', isRequired: true, canSkip: false, timeoutHours: 24 },
    ],
  },
  {
    id: 'AF-006', name: 'Aprobación de Crédito', description: 'Asignación o aumento de crédito requiere aprobación de Javier.',
    triggerCondition: 'Solicitud de crédito o aumento de límite', isActive: true,
    steps: [
      { id: 'AS-010', order: 1, approverRole: 'gerencia', approverLabel: 'Javier Lange', approverUserId: 'USR-001', approverUserName: 'Javier Lange', isRequired: true, canSkip: false, timeoutHours: 48 },
    ],
  },
];

// ============================================================================
// SEED DATA: MASTER CATALOGS
// ============================================================================

const SEED_MASTER_CATALOGS: MasterCatalog[] = [
  { id: 'CAT-001', name: 'Países y Ciudades', description: 'Catálogo de países y ciudades (ISO 3166)', itemCount: 195, lastUpdated: '2026-01-15T10:00:00Z', icon: 'Globe' },
  { id: 'CAT-002', name: 'Áreas / Departamentos', description: 'Áreas organizacionales de la empresa', itemCount: 6, lastUpdated: '2026-02-01T10:00:00Z', icon: 'Building2' },
  { id: 'CAT-003', name: 'Marcas', description: 'Marcas de productos disponibles', itemCount: 45, lastUpdated: '2026-02-20T10:00:00Z', icon: 'Tag' },
  { id: 'CAT-004', name: 'Categorías de Producto', description: 'Categorías y subcategorías de productos', itemCount: 9, lastUpdated: '2026-01-10T10:00:00Z', icon: 'Package' },
  { id: 'CAT-005', name: 'Proveedores', description: 'Proveedores registrados', itemCount: 12, lastUpdated: '2026-02-15T10:00:00Z', icon: 'Truck' },
  { id: 'CAT-006', name: 'Códigos Arancelarios', description: 'Códigos del sistema armonizado (HS)', itemCount: 28, lastUpdated: '2025-12-01T10:00:00Z', icon: 'FileText' },
  { id: 'CAT-007', name: 'Bancos', description: 'Entidades bancarias registradas', itemCount: 11, lastUpdated: '2026-01-05T10:00:00Z', icon: 'Landmark' },
  { id: 'CAT-008', name: 'Tipos de Documento', description: 'Tipos de documentos del sistema', itemCount: 8, lastUpdated: '2025-11-20T10:00:00Z', icon: 'FileCheck' },
  { id: 'CAT-009', name: 'Métodos de Pago', description: 'Formas de pago aceptadas', itemCount: 5, lastUpdated: '2026-01-08T10:00:00Z', icon: 'CreditCard' },
  { id: 'CAT-010', name: 'Motivos de Anulación', description: 'Razones válidas para anular documentos', itemCount: 7, lastUpdated: '2026-02-10T10:00:00Z', icon: 'XCircle' },
];

// ============================================================================
// SEED DATA: CATALOG ITEMS
// ============================================================================

const SEED_CATALOG_ITEMS_PAYMENT_METHODS: CatalogItem[] = [
  { id: 'CI-001', code: 'TRF', name: 'Transferencia Bancaria', description: 'Transferencia electrónica entre cuentas bancarias', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-002', code: 'CHQ', name: 'Cheque', description: 'Pago mediante cheque bancario', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-003', code: 'EFE', name: 'Efectivo', description: 'Pago en efectivo', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-004', code: 'TAR', name: 'Tarjeta de Crédito/Débito', description: 'Pago con tarjeta bancaria', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-005', code: 'DEP', name: 'Depósito Bancario', description: 'Depósito directo en cuenta bancaria', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_BANKS: CatalogItem[] = [
  { id: 'CI-B01', code: 'BAN', name: 'Banesco', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B02', code: 'BIS', name: 'Banistmo', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B03', code: 'CRE', name: 'Credicorp Bank', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B04', code: 'MUL', name: 'Multibank', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B05', code: 'ALL', name: 'Allbank', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B06', code: 'BG', name: 'Banco General', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B07', code: 'BAC', name: 'BAC Credomatic', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B08', code: 'STG', name: 'St. George Bank', isActive: true, sortOrder: 8, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B09', code: 'MET', name: 'Metro Bank', isActive: true, sortOrder: 9, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B10', code: 'MER', name: 'Mercantil Banco', isActive: false, sortOrder: 10, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-B11', code: 'BOC', name: 'Bank of China', isActive: false, sortOrder: 11, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_AREAS: CatalogItem[] = [
  { id: 'CI-A01', code: 'GER', name: 'Gerencia', description: 'Dirección general y toma de decisiones estratégicas', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-A02', code: 'VEN', name: 'Ventas', description: 'Gestión comercial B2B y relación con clientes', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-A03', code: 'COM', name: 'Compras', description: 'Adquisición de productos y gestión de proveedores', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-A04', code: 'BOD', name: 'Bodega', description: 'Almacenamiento, inventario y despacho', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-A05', code: 'FIN', name: 'Finanzas', description: 'Contabilidad, facturación y cuentas por cobrar', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-A06', code: 'TRA', name: 'Tráfico', description: 'Documentación aduanera y logística de embarques', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_BRANDS: CatalogItem[] = [
  { id: 'CI-M01', code: 'JW', name: 'Johnnie Walker', description: 'Whisky escocés - Diageo', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M02', code: 'CHR', name: 'Chivas Regal', description: 'Whisky escocés premium - Pernod Ricard', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M03', code: 'MAC', name: 'The Macallan', description: 'Single malt whisky - Edrington', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M04', code: 'GG', name: 'Grey Goose', description: 'Vodka premium francés - Bacardi', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M05', code: 'SMN', name: 'Smirnoff', description: 'Vodka - Diageo', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M06', code: 'DJU', name: 'Don Julio', description: 'Tequila premium - Diageo', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M07', code: 'PTR', name: 'Patrón', description: 'Tequila ultra premium - Bacardi', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M08', code: 'DIP', name: 'Diplomático', description: 'Ron venezolano premium', isActive: true, sortOrder: 8, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M09', code: 'CMG', name: 'Captain Morgan', description: 'Ron especiado - Diageo', isActive: true, sortOrder: 9, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M10', code: 'HDR', name: "Hendrick's", description: 'Ginebra escocesa - William Grant', isActive: true, sortOrder: 10, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M11', code: 'SPR', name: 'Sperone', description: 'Vinos espumantes italianos', isActive: true, sortOrder: 11, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-M12', code: 'MOT', name: 'Moët & Chandon', description: 'Champagne - LVMH', isActive: true, sortOrder: 12, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_CATEGORIES: CatalogItem[] = [
  { id: 'CI-C01', code: 'WHSK', name: 'Whisky', description: 'Whisky escocés, irlandés, bourbon y blends', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C02', code: 'VODK', name: 'Vodka', description: 'Vodka de todas las procedencias', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C03', code: 'RON', name: 'Ron', description: 'Ron añejo, blanco, especiado y premium', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C04', code: 'TEQ', name: 'Tequila', description: 'Tequila blanco, reposado, añejo y extra añejo', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C05', code: 'GIN', name: 'Ginebra', description: 'Ginebra London Dry, artesanal y flavored', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C06', code: 'VINO', name: 'Vino', description: 'Vinos tintos, blancos, rosados y espumantes', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C07', code: 'LIC', name: 'Licor', description: 'Licores, cremas y aperitivos', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C08', code: 'CERV', name: 'Cerveza', description: 'Cerveza artesanal e importada', isActive: true, sortOrder: 8, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-C09', code: 'SNCK', name: 'Snacks', description: 'Snacks, acompañamientos y accesorios', isActive: true, sortOrder: 9, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_SUPPLIERS: CatalogItem[] = [
  { id: 'CI-S01', code: 'DIAG', name: 'Diageo', description: 'Principal proveedor de whisky, vodka, tequila y ron', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S02', code: 'PERN', name: 'Pernod Ricard', description: 'Chivas Regal, Absolut, Jameson', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S03', code: 'BAC', name: 'Bacardi Limited', description: 'Bacardi, Grey Goose, Patrón, Bombay', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S04', code: 'WGS', name: 'William Grant & Sons', description: "Glenfiddich, The Balvenie, Hendrick's", isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S05', code: 'EDR', name: 'Edrington Group', description: 'The Macallan, Highland Park', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S06', code: 'LVMH', name: 'LVMH Moët Hennessy', description: 'Moët & Chandon, Dom Pérignon, Hennessy', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S07', code: 'DUSA', name: 'DUSA (Destilerías Unidas)', description: 'Ron Diplomático', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S08', code: 'CAMP', name: 'Campari Group', description: 'Campari, Aperol, Appleton Estate', isActive: true, sortOrder: 8, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S09', code: 'SPR', name: 'Sperone Wines', description: 'Prosecco y vinos italianos', isActive: true, sortOrder: 9, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S10', code: 'KELL', name: "Kellogg's/Pringles", description: 'Snacks y acompañamientos', isActive: true, sortOrder: 10, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S11', code: 'BROWN', name: 'Brown-Forman', description: "Jack Daniel's, Woodford Reserve", isActive: true, sortOrder: 11, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-S12', code: 'BEAM', name: 'Beam Suntory', description: "Jim Beam, Maker's Mark, Roku Gin", isActive: false, sortOrder: 12, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_TARIFF_CODES: CatalogItem[] = [
  { id: 'CI-T01', code: '2208.30.10', name: 'Whisky en envases <= 2L', description: 'Whisky en recipientes de capacidad inferior o igual a 2 litros', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T02', code: '2208.60.10', name: 'Vodka en envases <= 2L', description: 'Vodka en recipientes de capacidad inferior o igual a 2 litros', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T03', code: '2208.40.11', name: 'Ron en envases <= 2L', description: 'Ron y aguardiente de caña en recipientes <= 2 litros', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T04', code: '2208.90.10', name: 'Tequila en envases <= 2L', description: 'Tequila y mezcal en recipientes <= 2 litros', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T05', code: '2208.50.10', name: 'Gin en envases <= 2L', description: 'Gin y ginebra en recipientes <= 2 litros', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T06', code: '2204.10.00', name: 'Vino espumoso', description: 'Vino espumoso (champagne, prosecco, cava)', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T07', code: '2204.21.00', name: 'Vino en envases <= 2L', description: 'Vino de uvas frescas en recipientes <= 2 litros', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T08', code: '2208.70.10', name: 'Licores en envases <= 2L', description: 'Licores y cremas en recipientes <= 2 litros', isActive: true, sortOrder: 8, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T09', code: '2203.00.00', name: 'Cerveza de malta', description: 'Cerveza de malta en cualquier presentación', isActive: true, sortOrder: 9, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-T10', code: '1905.90.90', name: 'Snacks y galletas', description: 'Productos de panadería, pastelería y galletería', isActive: true, sortOrder: 10, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_DOC_TYPES: CatalogItem[] = [
  { id: 'CI-D01', code: 'FAC', name: 'Factura Comercial', description: 'Factura de venta B2B', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D02', code: 'NC', name: 'Nota de Crédito', description: 'Nota de crédito por devolución o ajuste', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D03', code: 'ND', name: 'Nota de Débito', description: 'Nota de débito por cargo adicional', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D04', code: 'COT', name: 'Cotización', description: 'Cotización o proforma de venta', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D05', code: 'OC', name: 'Orden de Compra', description: 'Orden de compra a proveedores', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D06', code: 'DMC', name: 'Declaración de Mercancía', description: 'DMC de movimiento comercial en Zona Libre', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D07', code: 'BL', name: 'Bill of Lading', description: 'Conocimiento de embarque marítimo', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-D08', code: 'CERT', name: 'Certificado', description: 'Certificados de libre venta, origen, etc.', isActive: true, sortOrder: 8, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

const SEED_CATALOG_ITEMS_ANNUL_REASONS: CatalogItem[] = [
  { id: 'CI-R01', code: 'ERR-DAT', name: 'Error en datos', description: 'Error en datos del cliente, productos o montos', isActive: true, sortOrder: 1, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-R02', code: 'DUP', name: 'Documento duplicado', description: 'Se emitió el documento por duplicado', isActive: true, sortOrder: 2, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-R03', code: 'CAN-CLI', name: 'Cancelación del cliente', description: 'El cliente canceló la operación', isActive: true, sortOrder: 3, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-R04', code: 'DEV', name: 'Devolución total', description: 'Devolución completa de mercancía', isActive: true, sortOrder: 4, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-R05', code: 'ERR-FISC', name: 'Error fiscal', description: 'Error en datos fiscales o tributarios', isActive: true, sortOrder: 5, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-R06', code: 'FRAUDE', name: 'Fraude detectado', description: 'Se detectó actividad fraudulenta', isActive: true, sortOrder: 6, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
  { id: 'CI-R07', code: 'OTRO', name: 'Otro motivo', description: 'Otro motivo no clasificado', isActive: true, sortOrder: 7, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' },
];

// ============================================================================
// SEED DATA: NOTIFICATION CONFIGS
// ============================================================================

const SEED_NOTIFICATION_CONFIGS: NotificationConfig[] = [
  { id: 'NC-001', event: 'order_requires_approval', eventLabel: 'Pedido Requiere Aprobación', description: 'Cuando un pedido de venta requiere aprobación por margen bajo', module: 'ventas', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: true }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'gerencia', label: 'Gerencia' }] },
  { id: 'NC-002', event: 'payment_received', eventLabel: 'Cobro Registrado', description: 'Cuando se registra un cobro de un cliente', module: 'cxc', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: false }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'gerencia', label: 'Gerencia' }, { type: 'role', value: 'vendedor', label: 'Vendedor Asignado' }] },
  { id: 'NC-003', event: 'invoice_overdue', eventLabel: 'Factura Vencida', description: 'Cuando una factura supera su fecha de vencimiento', module: 'cxc', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: true }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'contabilidad', label: 'Contabilidad' }, { type: 'role', value: 'gerencia', label: 'Gerencia' }] },
  { id: 'NC-004', event: 'inventory_low_stock', eventLabel: 'Stock Bajo', description: 'Cuando un producto alcanza el nivel mínimo de stock', module: 'inventario', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: true }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'compras', label: 'Compras' }, { type: 'role', value: 'bodega', label: 'Bodega' }] },
  { id: 'NC-005', event: 'annulment_requested', eventLabel: 'Anulación Solicitada', description: 'Cuando se solicita la anulación de un documento', module: 'cxc', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: true }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'gerencia', label: 'Gerencia' }] },
  { id: 'NC-006', event: 'purchase_order_received', eventLabel: 'Mercancía Recibida', description: 'Cuando se completa la recepción de una orden de compra', module: 'compras', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: false }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'compras', label: 'Compras' }, { type: 'role', value: 'contabilidad', label: 'Contabilidad' }] },
  { id: 'NC-007', event: 'monthly_close_pending', eventLabel: 'Cierre Mensual Pendiente', description: 'Recordatorio de cierre mensual pendiente', module: 'contabilidad', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: true }, { type: 'sms', enabled: false }], isActive: true, recipients: [{ type: 'role', value: 'contabilidad', label: 'Contabilidad' }] },
  { id: 'NC-008', event: 'credit_limit_exceeded', eventLabel: 'Límite de Crédito Excedido', description: 'Cuando un cliente excede su límite de crédito', module: 'clientes', channels: [{ type: 'in_app', enabled: true }, { type: 'email', enabled: true }, { type: 'sms', enabled: true }], isActive: true, recipients: [{ type: 'role', value: 'gerencia', label: 'Gerencia' }, { type: 'role', value: 'contabilidad', label: 'Contabilidad' }] },
];

// ============================================================================
// SEED DATA: AUDIT LOG
// ============================================================================

const SEED_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'AL-001', timestamp: '2026-02-26T09:15:00Z', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'login', module: 'auth', moduleLabel: 'Autenticación', entityType: 'session', entityId: 'SES-001', description: 'Inicio de sesión exitoso', ipAddress: '190.218.45.123' },
  { id: 'AL-002', timestamp: '2026-02-26T09:20:00Z', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'aprobar', module: 'ventas', moduleLabel: 'Ventas B2B', entityType: 'sales_order', entityId: 'PED-00089', description: 'Aprobó pedido PED-00089 de GIACOMO PAOLO LECCESE TURCONI', ipAddress: '190.218.45.123' },
  { id: 'AL-003', timestamp: '2026-02-26T08:45:00Z', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'contabilidad', action: 'crear', module: 'contabilidad', moduleLabel: 'Contabilidad', entityType: 'journal_entry', entityId: 'JE-00014', description: 'Creó asiento contable JE-00014 (Comisiones de ventas)', ipAddress: '190.218.45.125' },
  { id: 'AL-004', timestamp: '2026-02-25T16:30:00Z', userId: 'USR-005', userName: 'Margarita Morelos', userRole: 'vendedor', action: 'crear', module: 'ventas', moduleLabel: 'Ventas B2B', entityType: 'sales_order', entityId: 'COT-00156', description: 'Creó cotización COT-00156 para BRAND DISTRIBUIDOR CURACAO', ipAddress: '190.218.45.130' },
  { id: 'AL-005', timestamp: '2026-02-25T15:00:00Z', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'contabilidad', action: 'crear', module: 'cxc', moduleLabel: 'Cuentas por Cobrar', entityType: 'payment', entityId: 'COB-00007', description: 'Registró cobro COB-00007 de MARIA DEL MAR PEREZ SV por $12,000', ipAddress: '190.218.45.125' },
  { id: 'AL-006', timestamp: '2026-02-25T14:00:00Z', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', action: 'crear', module: 'inventario', moduleLabel: 'Inventario', entityType: 'transfer', entityId: 'TR-00032', description: 'Creó transferencia TR-00032 de ZL a PTY-TIENDA', ipAddress: '190.218.45.128' },
  { id: 'AL-007', timestamp: '2026-02-25T11:00:00Z', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'aprobar', module: 'cxc', moduleLabel: 'Cuentas por Cobrar', entityType: 'annulment', entityId: 'ANU-00002', description: 'Aprobó anulación ANU-00002 de cobro COB-00010', ipAddress: '190.218.45.123' },
  { id: 'AL-008', timestamp: '2026-02-24T10:00:00Z', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'gerencia', action: 'crear', module: 'compras', moduleLabel: 'Compras', entityType: 'purchase_order', entityId: 'OC-03572', description: 'Creó orden de compra OC-03572 para Diageo', ipAddress: '190.218.45.126' },
  { id: 'AL-009', timestamp: '2026-02-24T09:30:00Z', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'contabilidad', action: 'editar', module: 'clientes', moduleLabel: 'Clientes', entityType: 'client', entityId: 'CLI-00999', description: 'Actualizó estado de CLI-00999 a Bloqueado', ipAddress: '190.218.45.125', changes: [{ field: 'status', fieldLabel: 'Estado', oldValue: 'active', newValue: 'blocked' }] },
  { id: 'AL-010', timestamp: '2026-02-23T16:00:00Z', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', action: 'editar', module: 'trafico', moduleLabel: 'Tráfico', entityType: 'shipment', entityId: 'SHP-00045', description: 'Actualizó tracking de embarque SHP-00045', ipAddress: '190.218.45.129' },
  { id: 'AL-011', timestamp: '2026-02-23T14:00:00Z', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'exportar', module: 'reportes', moduleLabel: 'Reportes', entityType: 'report', entityId: 'RPT-SALES-FEB', description: 'Exportó reporte de ventas de febrero 2026', ipAddress: '190.218.45.123' },
  { id: 'AL-012', timestamp: '2026-02-22T10:00:00Z', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'rechazar', module: 'cxc', moduleLabel: 'Cuentas por Cobrar', entityType: 'annulment', entityId: 'ANU-00003', description: 'Rechazó anulación ANU-00003 de NC-00003', ipAddress: '190.218.45.123' },
];

// ============================================================================
// SEED DATA: ACTIVE SESSIONS
// ============================================================================

const SEED_ACTIVE_SESSIONS: ActiveSession[] = [
  { id: 'SES-001', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', loginAt: '2026-02-26T09:15:00Z', lastActivity: '2026-02-26T10:30:00Z', ipAddress: '190.218.45.123', browser: 'Chrome 122 / Windows 11', isCurrent: true },
  { id: 'SES-002', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'contabilidad', loginAt: '2026-02-26T08:30:00Z', lastActivity: '2026-02-26T10:25:00Z', ipAddress: '190.218.45.125', browser: 'Firefox 123 / macOS', isCurrent: false },
  { id: 'SES-003', userId: 'USR-005', userName: 'Margarita Morelos', userRole: 'vendedor', loginAt: '2026-02-26T09:00:00Z', lastActivity: '2026-02-26T10:20:00Z', ipAddress: '190.218.45.130', browser: 'Chrome 122 / Windows 10', isCurrent: false },
  { id: 'SES-004', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', loginAt: '2026-02-26T07:00:00Z', lastActivity: '2026-02-26T10:15:00Z', ipAddress: '190.218.45.128', browser: 'Safari 17 / iPad', isCurrent: false },
];

// ============================================================================
// SEED DATA: SECURITY POLICIES
// ============================================================================

const SEED_SECURITY_POLICIES: SecurityPolicies = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  sessionTimeoutMinutes: 480,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  twoFactorEnabled: false,
  passwordExpirationDays: 90,
};

// ============================================================================
// SEED DATA: COMMERCIAL PARAMETERS
// ============================================================================

const SEED_COMMERCIAL_PARAMS: CommercialParams = {
  priceLevels: [
    { level: 'A', name: 'Mayorista', description: 'Grandes distribuidores con volumen alto', isActive: true },
    { level: 'B', name: 'Distribuidor', description: 'Distribuidores medianos', isActive: true },
    { level: 'C', name: 'Detallista', description: 'Comercios minoristas', isActive: true },
    { level: 'D', name: 'Especial', description: 'Precios especiales negociados', isActive: true },
    { level: 'E', name: 'Público', description: 'Precio al público general', isActive: true },
  ],
  defaultPriceLevel: 'C',
  commissionThreshold: 10,
  commissionRates: [
    { userId: 'USR-001', userName: 'Javier Lange', rate: 3, isActive: true },
    { userId: 'USR-005', userName: 'Margarita Morelos', rate: 2.5, isActive: true },
    { userId: 'USR-006', userName: 'Arnold Arenas', rate: 2, isActive: true },
  ],
  taxRate: 7,
  taxExemptZones: ['Zona Libre de Colón'],
  paymentTermsOptions: [
    { id: 'PT-001', code: 'contado', label: 'Contado', days: 0, isActive: true },
    { id: 'PT-002', code: 'credito_15', label: 'Crédito 15 días', days: 15, isActive: true },
    { id: 'PT-003', code: 'credito_30', label: 'Crédito 30 días', days: 30, isActive: true },
    { id: 'PT-004', code: 'credito_45', label: 'Crédito 45 días', days: 45, isActive: true },
    { id: 'PT-005', code: 'credito_60', label: 'Crédito 60 días', days: 60, isActive: true },
  ],
};

// ============================================================================
// SEED DATA: DOCUMENT NUMBERING
// ============================================================================

const SEED_DOCUMENT_NUMBERING: DocumentNumbering[] = [
  { id: 'DN-001', documentType: 'cotizacion', documentLabel: 'Cotización', prefix: 'COT-', currentNumber: 156, paddingLength: 5, example: 'COT-00156' },
  { id: 'DN-002', documentType: 'pedido', documentLabel: 'Pedido', prefix: 'PED-', currentNumber: 89, paddingLength: 5, example: 'PED-00089' },
  { id: 'DN-003', documentType: 'factura', documentLabel: 'Factura', prefix: 'FAC-', currentNumber: 42, paddingLength: 5, example: 'FAC-00042' },
  { id: 'DN-004', documentType: 'orden_compra', documentLabel: 'Orden de Compra', prefix: 'OC-', currentNumber: 3572, paddingLength: 5, example: 'OC-03572' },
  { id: 'DN-005', documentType: 'ajuste', documentLabel: 'Ajuste de Inventario', prefix: 'AJ-', currentNumber: 15, paddingLength: 5, example: 'AJ-00015' },
  { id: 'DN-006', documentType: 'transferencia', documentLabel: 'Transferencia', prefix: 'TR-', currentNumber: 32, paddingLength: 5, example: 'TR-00032' },
  { id: 'DN-007', documentType: 'conteo', documentLabel: 'Conteo Físico', prefix: 'CF-', currentNumber: 8, paddingLength: 5, example: 'CF-00008' },
  { id: 'DN-008', documentType: 'cobro', documentLabel: 'Cobro', prefix: 'COB-', currentNumber: 7, paddingLength: 5, example: 'COB-00007' },
  { id: 'DN-009', documentType: 'nota_credito', documentLabel: 'Nota de Crédito', prefix: 'NC-', currentNumber: 3, paddingLength: 5, example: 'NC-00003' },
];

// ============================================================================
// SEED DATA: SYSTEM INFO
// ============================================================================

const SEED_SYSTEM_INFO: SystemInfo = {
  version: '0.1.0',
  buildNumber: 'build-2026.02.26-001',
  environment: 'development',
  lastDeploy: '2026-02-26T08:00:00Z',
  nextjsVersion: '16.1.6',
  nodeVersion: '22.x',
  database: 'Mock Data (Frontend Only)',
  uptime: '15 días, 3 horas',
};

// ============================================================================
// SEED DATA: INTEGRATIONS
// ============================================================================

const SEED_INTEGRATIONS: Integration[] = [
  { id: 'INT-001', name: 'Facturación Electrónica (FE)', description: 'Integración con DGI para emisión de facturas electrónicas', status: 'pendiente', icon: 'FileCheck', config: { provider: 'DGI Panamá', apiUrl: 'Pendiente de configurar' } },
  { id: 'INT-002', name: 'DMC (Despacho de Mercancía)', description: 'Sistema de despacho y control aduanero de Zona Libre', status: 'pendiente', icon: 'Ship', config: { provider: 'Zona Libre de Colón', apiUrl: 'Pendiente' } },
  { id: 'INT-003', name: 'Banca en Línea', description: 'Importación de extractos bancarios', status: 'inactivo', icon: 'Landmark', config: { banks: 'Banco General, Banistmo' } },
  { id: 'INT-004', name: 'Correo Electrónico', description: 'Envío de estados de cuenta y notificaciones por email', status: 'pendiente', icon: 'Mail' },
  { id: 'INT-005', name: 'OpenAI (Chat Evo)', description: 'Asistente virtual con inteligencia artificial', status: 'activo', icon: 'Bot', lastSync: '2026-02-26T10:00:00Z', config: { model: 'gpt-4o-mini', maxTokens: '500' } },
];

// ============================================================================
// STORE INFRASTRUCTURE
// ============================================================================

// --- Company Info (singleton) ---
let _companyInfo: CompanyInfo = SEED_COMPANY_INFO;
let _companyInfoInitialized = false;
const { subscribe: subscribeCompanyInfo, notify: _notifyCompanyInfo } = createSubscribers();

function ensureCompanyInfoInitialized(): void {
  if (typeof window === 'undefined' || _companyInfoInitialized) return;
  _companyInfo = loadSingleton<CompanyInfo>('company_info', SEED_COMPANY_INFO);
  _companyInfoInitialized = true;
}

export function getCompanyInfoData(): CompanyInfo {
  ensureCompanyInfoInitialized();
  return _companyInfo;
}

export { subscribeCompanyInfo };

export const MOCK_COMPANY_INFO: CompanyInfo = new Proxy(SEED_COMPANY_INFO as CompanyInfo, {
  get(_target, prop, receiver) {
    ensureCompanyInfoInitialized();
    return Reflect.get(_companyInfo, prop, receiver);
  },
});

export function updateCompanyInfo(updates: Partial<CompanyInfo>): void {
  ensureCompanyInfoInitialized();
  _companyInfo = { ..._companyInfo, ...updates };
  saveSingleton('company_info', _companyInfo);
  _notifyCompanyInfo();
}

// --- Branches (collection) ---
let _branches: Branch[] = SEED_BRANCHES;
let _branchesInitialized = false;
const { subscribe: subscribeBranches, notify: _notifyBranches } = createSubscribers();

function ensureBranchesInitialized(): void {
  if (typeof window === 'undefined' || _branchesInitialized) return;
  _branches = loadCollection<Branch>('branches', SEED_BRANCHES);
  _branchesInitialized = true;
}

export function getBranchesData(): Branch[] {
  ensureBranchesInitialized();
  return _branches;
}

export { subscribeBranches };

export const MOCK_BRANCHES: Branch[] = new Proxy(SEED_BRANCHES as Branch[], {
  get(_target, prop, receiver) {
    ensureBranchesInitialized();
    return Reflect.get(_branches, prop, receiver);
  },
});

export function addBranch(branch: Branch): void {
  ensureBranchesInitialized();
  _branches = [..._branches, branch];
  saveCollection('branches', _branches);
  _notifyBranches();
}

export function updateBranch(id: string, updates: Partial<Branch>): void {
  ensureBranchesInitialized();
  _branches = _branches.map((b) => b.id === id ? { ...b, ...updates } : b);
  saveCollection('branches', _branches);
  _notifyBranches();
}

export function removeBranch(id: string): void {
  ensureBranchesInitialized();
  _branches = _branches.filter((b) => b.id !== id);
  saveCollection('branches', _branches);
  _notifyBranches();
}

// --- Role Templates (collection) ---
let _roleTemplates: RoleTemplate[] = SEED_ROLE_TEMPLATES;
let _roleTemplatesInitialized = false;
const { subscribe: subscribeRoleTemplates, notify: _notifyRoleTemplates } = createSubscribers();

function ensureRoleTemplatesInitialized(): void {
  if (typeof window === 'undefined' || _roleTemplatesInitialized) return;
  _roleTemplates = loadCollection<RoleTemplate>('role_templates', SEED_ROLE_TEMPLATES);
  _roleTemplatesInitialized = true;
}

export function getRoleTemplatesData(): RoleTemplate[] {
  ensureRoleTemplatesInitialized();
  return _roleTemplates;
}

export { subscribeRoleTemplates };

export const MOCK_ROLE_TEMPLATES: RoleTemplate[] = new Proxy(SEED_ROLE_TEMPLATES as RoleTemplate[], {
  get(_target, prop, receiver) {
    ensureRoleTemplatesInitialized();
    return Reflect.get(_roleTemplates, prop, receiver);
  },
});

export function addRoleTemplate(role: RoleTemplate): void {
  ensureRoleTemplatesInitialized();
  _roleTemplates = [..._roleTemplates, role];
  saveCollection('role_templates', _roleTemplates);
  _notifyRoleTemplates();
}

export function updateRoleTemplate(id: string, updates: Partial<RoleTemplate>): void {
  ensureRoleTemplatesInitialized();
  _roleTemplates = _roleTemplates.map((r) => r.id === id ? { ...r, ...updates } : r);
  saveCollection('role_templates', _roleTemplates);
  _notifyRoleTemplates();
}

export function removeRoleTemplate(id: string): void {
  ensureRoleTemplatesInitialized();
  _roleTemplates = _roleTemplates.filter((r) => r.id !== id);
  saveCollection('role_templates', _roleTemplates);
  _notifyRoleTemplates();
}

// --- Approval Flows (collection) ---
let _approvalFlows: ApprovalFlow[] = SEED_APPROVAL_FLOWS;
let _approvalFlowsInitialized = false;
const { subscribe: subscribeApprovalFlows, notify: _notifyApprovalFlows } = createSubscribers();

function ensureApprovalFlowsInitialized(): void {
  if (typeof window === 'undefined' || _approvalFlowsInitialized) return;
  _approvalFlows = loadCollection<ApprovalFlow>('approval_flows', SEED_APPROVAL_FLOWS);
  _approvalFlowsInitialized = true;
}

export function getApprovalFlowsData(): ApprovalFlow[] {
  ensureApprovalFlowsInitialized();
  return _approvalFlows;
}

export { subscribeApprovalFlows };

export const MOCK_APPROVAL_FLOWS: ApprovalFlow[] = new Proxy(SEED_APPROVAL_FLOWS as ApprovalFlow[], {
  get(_target, prop, receiver) {
    ensureApprovalFlowsInitialized();
    return Reflect.get(_approvalFlows, prop, receiver);
  },
});

export function addApprovalFlow(flow: ApprovalFlow): void {
  ensureApprovalFlowsInitialized();
  _approvalFlows = [..._approvalFlows, flow];
  saveCollection('approval_flows', _approvalFlows);
  _notifyApprovalFlows();
}

export function updateApprovalFlow(id: string, updates: Partial<ApprovalFlow>): void {
  ensureApprovalFlowsInitialized();
  _approvalFlows = _approvalFlows.map((f) => f.id === id ? { ...f, ...updates } : f);
  saveCollection('approval_flows', _approvalFlows);
  _notifyApprovalFlows();
}

export function removeApprovalFlow(id: string): void {
  ensureApprovalFlowsInitialized();
  _approvalFlows = _approvalFlows.filter((f) => f.id !== id);
  saveCollection('approval_flows', _approvalFlows);
  _notifyApprovalFlows();
}

// --- Master Catalogs (collection) ---
let _masterCatalogs: MasterCatalog[] = SEED_MASTER_CATALOGS;
let _masterCatalogsInitialized = false;
const { subscribe: subscribeMasterCatalogs, notify: _notifyMasterCatalogs } = createSubscribers();

function ensureMasterCatalogsInitialized(): void {
  if (typeof window === 'undefined' || _masterCatalogsInitialized) return;
  _masterCatalogs = loadCollection<MasterCatalog>('master_catalogs', SEED_MASTER_CATALOGS);
  _masterCatalogsInitialized = true;
}

export function getMasterCatalogsData(): MasterCatalog[] {
  ensureMasterCatalogsInitialized();
  return _masterCatalogs;
}

export { subscribeMasterCatalogs };

export const MOCK_MASTER_CATALOGS: MasterCatalog[] = new Proxy(SEED_MASTER_CATALOGS as MasterCatalog[], {
  get(_target, prop, receiver) {
    ensureMasterCatalogsInitialized();
    return Reflect.get(_masterCatalogs, prop, receiver);
  },
});

export function addMasterCatalog(catalog: MasterCatalog): void {
  ensureMasterCatalogsInitialized();
  _masterCatalogs = [..._masterCatalogs, catalog];
  saveCollection('master_catalogs', _masterCatalogs);
  _notifyMasterCatalogs();
}

export function updateMasterCatalog(id: string, updates: Partial<MasterCatalog>): void {
  ensureMasterCatalogsInitialized();
  _masterCatalogs = _masterCatalogs.map((c) => c.id === id ? { ...c, ...updates } : c);
  saveCollection('master_catalogs', _masterCatalogs);
  _notifyMasterCatalogs();
}

// --- Catalog Items (per catalog, stored by key) ---
interface CatalogItemsStoreEntry {
  items: CatalogItem[];
  initialized: boolean;
  seed: CatalogItem[];
  key: string;
}

const CATALOG_ITEMS_MAP: Record<string, CatalogItemsStoreEntry> = {
  'CAT-002': { items: SEED_CATALOG_ITEMS_AREAS, initialized: false, seed: SEED_CATALOG_ITEMS_AREAS, key: 'catalog_items_areas' },
  'CAT-003': { items: SEED_CATALOG_ITEMS_BRANDS, initialized: false, seed: SEED_CATALOG_ITEMS_BRANDS, key: 'catalog_items_brands' },
  'CAT-004': { items: SEED_CATALOG_ITEMS_CATEGORIES, initialized: false, seed: SEED_CATALOG_ITEMS_CATEGORIES, key: 'catalog_items_categories' },
  'CAT-005': { items: SEED_CATALOG_ITEMS_SUPPLIERS, initialized: false, seed: SEED_CATALOG_ITEMS_SUPPLIERS, key: 'catalog_items_suppliers' },
  'CAT-006': { items: SEED_CATALOG_ITEMS_TARIFF_CODES, initialized: false, seed: SEED_CATALOG_ITEMS_TARIFF_CODES, key: 'catalog_items_tariff_codes' },
  'CAT-007': { items: SEED_CATALOG_ITEMS_BANKS, initialized: false, seed: SEED_CATALOG_ITEMS_BANKS, key: 'catalog_items_banks' },
  'CAT-008': { items: SEED_CATALOG_ITEMS_DOC_TYPES, initialized: false, seed: SEED_CATALOG_ITEMS_DOC_TYPES, key: 'catalog_items_doc_types' },
  'CAT-009': { items: SEED_CATALOG_ITEMS_PAYMENT_METHODS, initialized: false, seed: SEED_CATALOG_ITEMS_PAYMENT_METHODS, key: 'catalog_items_payment_methods' },
  'CAT-010': { items: SEED_CATALOG_ITEMS_ANNUL_REASONS, initialized: false, seed: SEED_CATALOG_ITEMS_ANNUL_REASONS, key: 'catalog_items_annul_reasons' },
};

const { subscribe: subscribeCatalogItems, notify: _notifyCatalogItems } = createSubscribers();
export { subscribeCatalogItems };

function ensureCatalogItemsInitialized(catalogId: string): void {
  const entry = CATALOG_ITEMS_MAP[catalogId];
  if (!entry || entry.initialized || typeof window === 'undefined') return;
  entry.items = loadCollection<CatalogItem>(entry.key, entry.seed);
  entry.initialized = true;
}

// Backward-compatible exports for catalog items
export const MOCK_CATALOG_ITEMS_PAYMENT_METHODS = SEED_CATALOG_ITEMS_PAYMENT_METHODS;
export const MOCK_CATALOG_ITEMS_BANKS = SEED_CATALOG_ITEMS_BANKS;
export const MOCK_CATALOG_ITEMS_AREAS = SEED_CATALOG_ITEMS_AREAS;
export const MOCK_CATALOG_ITEMS_BRANDS = SEED_CATALOG_ITEMS_BRANDS;
export const MOCK_CATALOG_ITEMS_CATEGORIES = SEED_CATALOG_ITEMS_CATEGORIES;
export const MOCK_CATALOG_ITEMS_SUPPLIERS = SEED_CATALOG_ITEMS_SUPPLIERS;
export const MOCK_CATALOG_ITEMS_TARIFF_CODES = SEED_CATALOG_ITEMS_TARIFF_CODES;
export const MOCK_CATALOG_ITEMS_DOC_TYPES = SEED_CATALOG_ITEMS_DOC_TYPES;
export const MOCK_CATALOG_ITEMS_ANNUL_REASONS = SEED_CATALOG_ITEMS_ANNUL_REASONS;

// --- Notification Configs (collection) ---
let _notificationConfigs: NotificationConfig[] = SEED_NOTIFICATION_CONFIGS;
let _notificationConfigsInitialized = false;
const { subscribe: subscribeNotificationConfigs, notify: _notifyNotificationConfigs } = createSubscribers();

function ensureNotificationConfigsInitialized(): void {
  if (typeof window === 'undefined' || _notificationConfigsInitialized) return;
  _notificationConfigs = loadCollection<NotificationConfig>('notification_configs', SEED_NOTIFICATION_CONFIGS);
  _notificationConfigsInitialized = true;
}

export function getNotificationConfigsData(): NotificationConfig[] {
  ensureNotificationConfigsInitialized();
  return _notificationConfigs;
}

export { subscribeNotificationConfigs };

export const MOCK_NOTIFICATION_CONFIGS: NotificationConfig[] = new Proxy(SEED_NOTIFICATION_CONFIGS as NotificationConfig[], {
  get(_target, prop, receiver) {
    ensureNotificationConfigsInitialized();
    return Reflect.get(_notificationConfigs, prop, receiver);
  },
});

export function updateNotificationConfig(id: string, updates: Partial<NotificationConfig>): void {
  ensureNotificationConfigsInitialized();
  _notificationConfigs = _notificationConfigs.map((n) => n.id === id ? { ...n, ...updates } : n);
  saveCollection('notification_configs', _notificationConfigs);
  _notifyNotificationConfigs();
}

// --- Audit Log (collection) ---
let _auditLog: AuditLogEntry[] = SEED_AUDIT_LOG;
let _auditLogInitialized = false;
const { subscribe: subscribeAuditLog, notify: _notifyAuditLog } = createSubscribers();

function ensureAuditLogInitialized(): void {
  if (typeof window === 'undefined' || _auditLogInitialized) return;
  _auditLog = loadCollection<AuditLogEntry>('audit_log', SEED_AUDIT_LOG);
  _auditLogInitialized = true;
}

export function getAuditLogData(): AuditLogEntry[] {
  ensureAuditLogInitialized();
  return _auditLog;
}

export { subscribeAuditLog };

export const MOCK_AUDIT_LOG: AuditLogEntry[] = new Proxy(SEED_AUDIT_LOG as AuditLogEntry[], {
  get(_target, prop, receiver) {
    ensureAuditLogInitialized();
    return Reflect.get(_auditLog, prop, receiver);
  },
});

export function addAuditLogEntry(entry: AuditLogEntry): void {
  ensureAuditLogInitialized();
  _auditLog = [entry, ..._auditLog];
  saveCollection('audit_log', _auditLog);
  _notifyAuditLog();
}

// --- Active Sessions (collection) ---
let _activeSessions: ActiveSession[] = SEED_ACTIVE_SESSIONS;
let _activeSessionsInitialized = false;
const { subscribe: subscribeActiveSessions, notify: _notifyActiveSessions } = createSubscribers();

function ensureActiveSessionsInitialized(): void {
  if (typeof window === 'undefined' || _activeSessionsInitialized) return;
  _activeSessions = loadCollection<ActiveSession>('active_sessions', SEED_ACTIVE_SESSIONS);
  _activeSessionsInitialized = true;
}

export function getActiveSessionsData(): ActiveSession[] {
  ensureActiveSessionsInitialized();
  return _activeSessions;
}

export { subscribeActiveSessions };

export const MOCK_ACTIVE_SESSIONS: ActiveSession[] = new Proxy(SEED_ACTIVE_SESSIONS as ActiveSession[], {
  get(_target, prop, receiver) {
    ensureActiveSessionsInitialized();
    return Reflect.get(_activeSessions, prop, receiver);
  },
});

export function removeActiveSession(id: string): void {
  ensureActiveSessionsInitialized();
  _activeSessions = _activeSessions.filter((s) => s.id !== id);
  saveCollection('active_sessions', _activeSessions);
  _notifyActiveSessions();
}

// --- Security Policies (singleton) ---
let _securityPolicies: SecurityPolicies = SEED_SECURITY_POLICIES;
let _securityPoliciesInitialized = false;
const { subscribe: subscribeSecurityPolicies, notify: _notifySecurityPolicies } = createSubscribers();

function ensureSecurityPoliciesInitialized(): void {
  if (typeof window === 'undefined' || _securityPoliciesInitialized) return;
  _securityPolicies = loadSingleton<SecurityPolicies>('security_policies', SEED_SECURITY_POLICIES);
  _securityPoliciesInitialized = true;
}

export function getSecurityPoliciesData(): SecurityPolicies {
  ensureSecurityPoliciesInitialized();
  return _securityPolicies;
}

export { subscribeSecurityPolicies };

export const MOCK_SECURITY_POLICIES: SecurityPolicies = new Proxy(SEED_SECURITY_POLICIES as SecurityPolicies, {
  get(_target, prop, receiver) {
    ensureSecurityPoliciesInitialized();
    return Reflect.get(_securityPolicies, prop, receiver);
  },
});

export function updateSecurityPolicies(updates: Partial<SecurityPolicies>): void {
  ensureSecurityPoliciesInitialized();
  _securityPolicies = { ..._securityPolicies, ...updates };
  saveSingleton('security_policies', _securityPolicies);
  _notifySecurityPolicies();
}

// --- Commercial Params (singleton) ---
let _commercialParams: CommercialParams = SEED_COMMERCIAL_PARAMS;
let _commercialParamsInitialized = false;
const { subscribe: subscribeCommercialParams, notify: _notifyCommercialParams } = createSubscribers();

function ensureCommercialParamsInitialized(): void {
  if (typeof window === 'undefined' || _commercialParamsInitialized) return;
  _commercialParams = loadSingleton<CommercialParams>('commercial_params', SEED_COMMERCIAL_PARAMS);
  _commercialParamsInitialized = true;
}

export function getCommercialParamsData(): CommercialParams {
  ensureCommercialParamsInitialized();
  return _commercialParams;
}

export { subscribeCommercialParams };

export const MOCK_COMMERCIAL_PARAMS: CommercialParams = new Proxy(SEED_COMMERCIAL_PARAMS as CommercialParams, {
  get(_target, prop, receiver) {
    ensureCommercialParamsInitialized();
    return Reflect.get(_commercialParams, prop, receiver);
  },
});

export function updateCommercialParams(updates: Partial<CommercialParams>): void {
  ensureCommercialParamsInitialized();
  _commercialParams = { ..._commercialParams, ...updates };
  saveSingleton('commercial_params', _commercialParams);
  _notifyCommercialParams();
}

// --- Document Numbering (collection) ---
let _documentNumbering: DocumentNumbering[] = SEED_DOCUMENT_NUMBERING;
let _documentNumberingInitialized = false;
const { subscribe: subscribeDocumentNumbering, notify: _notifyDocumentNumbering } = createSubscribers();

function ensureDocumentNumberingInitialized(): void {
  if (typeof window === 'undefined' || _documentNumberingInitialized) return;
  _documentNumbering = loadCollection<DocumentNumbering>('document_numbering', SEED_DOCUMENT_NUMBERING);
  _documentNumberingInitialized = true;
}

export function getDocumentNumberingData(): DocumentNumbering[] {
  ensureDocumentNumberingInitialized();
  return _documentNumbering;
}

export { subscribeDocumentNumbering };

export const MOCK_DOCUMENT_NUMBERING: DocumentNumbering[] = new Proxy(SEED_DOCUMENT_NUMBERING as DocumentNumbering[], {
  get(_target, prop, receiver) {
    ensureDocumentNumberingInitialized();
    return Reflect.get(_documentNumbering, prop, receiver);
  },
});

export function updateDocumentNumbering(id: string, updates: Partial<DocumentNumbering>): void {
  ensureDocumentNumberingInitialized();
  _documentNumbering = _documentNumbering.map((d) => d.id === id ? { ...d, ...updates } : d);
  saveCollection('document_numbering', _documentNumbering);
  _notifyDocumentNumbering();
}

// --- System Info (singleton) ---
let _systemInfo: SystemInfo = SEED_SYSTEM_INFO;
let _systemInfoInitialized = false;
const { subscribe: subscribeSystemInfo, notify: _notifySystemInfo } = createSubscribers();

function ensureSystemInfoInitialized(): void {
  if (typeof window === 'undefined' || _systemInfoInitialized) return;
  _systemInfo = loadSingleton<SystemInfo>('system_info', SEED_SYSTEM_INFO);
  _systemInfoInitialized = true;
}

export function getSystemInfoData(): SystemInfo {
  ensureSystemInfoInitialized();
  return _systemInfo;
}

export { subscribeSystemInfo };

export const MOCK_SYSTEM_INFO: SystemInfo = new Proxy(SEED_SYSTEM_INFO as SystemInfo, {
  get(_target, prop, receiver) {
    ensureSystemInfoInitialized();
    return Reflect.get(_systemInfo, prop, receiver);
  },
});

export function updateSystemInfo(updates: Partial<SystemInfo>): void {
  ensureSystemInfoInitialized();
  _systemInfo = { ..._systemInfo, ...updates };
  saveSingleton('system_info', _systemInfo);
  _notifySystemInfo();
}

// --- Integrations (collection) ---
let _integrations: Integration[] = SEED_INTEGRATIONS;
let _integrationsInitialized = false;
const { subscribe: subscribeIntegrations, notify: _notifyIntegrations } = createSubscribers();

function ensureIntegrationsInitialized(): void {
  if (typeof window === 'undefined' || _integrationsInitialized) return;
  _integrations = loadCollection<Integration>('integrations', SEED_INTEGRATIONS);
  _integrationsInitialized = true;
}

export function getIntegrationsData(): Integration[] {
  ensureIntegrationsInitialized();
  return _integrations;
}

export { subscribeIntegrations };

export const MOCK_INTEGRATIONS: Integration[] = new Proxy(SEED_INTEGRATIONS as Integration[], {
  get(_target, prop, receiver) {
    ensureIntegrationsInitialized();
    return Reflect.get(_integrations, prop, receiver);
  },
});

export function updateIntegration(id: string, updates: Partial<Integration>): void {
  ensureIntegrationsInitialized();
  _integrations = _integrations.map((i) => i.id === id ? { ...i, ...updates } : i);
  saveCollection('integrations', _integrations);
  _notifyIntegrations();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAuditLog(filters?: { userId?: string; module?: string; action?: string; dateFrom?: string; dateTo?: string }): AuditLogEntry[] {
  ensureAuditLogInitialized();
  let entries = [..._auditLog];

  if (!filters) return entries;

  if (filters.userId) entries = entries.filter(e => e.userId === filters.userId);
  if (filters.module) entries = entries.filter(e => e.module === filters.module);
  if (filters.action) entries = entries.filter(e => e.action === filters.action);
  if (filters.dateFrom) entries = entries.filter(e => e.timestamp >= filters.dateFrom!);
  if (filters.dateTo) entries = entries.filter(e => e.timestamp <= filters.dateTo!);

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getCatalogItems(catalogId: string): CatalogItem[] {
  ensureCatalogItemsInitialized(catalogId);
  const entry = CATALOG_ITEMS_MAP[catalogId];
  if (!entry) return [];
  return entry.items;
}

export function updateCatalogItem(catalogId: string, itemId: string, updates: Partial<CatalogItem>): void {
  ensureCatalogItemsInitialized(catalogId);
  const entry = CATALOG_ITEMS_MAP[catalogId];
  if (!entry) return;
  entry.items = entry.items.map((i) => i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i);
  saveCollection(entry.key, entry.items);
  _notifyCatalogItems();
}

export function addCatalogItem(catalogId: string, item: CatalogItem): void {
  ensureCatalogItemsInitialized(catalogId);
  const entry = CATALOG_ITEMS_MAP[catalogId];
  if (!entry) return;
  entry.items = [...entry.items, item];
  saveCollection(entry.key, entry.items);
  _notifyCatalogItems();
}

export function removeCatalogItem(catalogId: string, itemId: string): void {
  ensureCatalogItemsInitialized(catalogId);
  const entry = CATALOG_ITEMS_MAP[catalogId];
  if (!entry) return;
  entry.items = entry.items.filter((i) => i.id !== itemId);
  saveCollection(entry.key, entry.items);
  _notifyCatalogItems();
}
