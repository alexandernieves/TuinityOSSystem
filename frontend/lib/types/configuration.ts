/**
 * Configuration (Configuración) types
 * Based on Document 008 specifications
 */

import type { UserRole, PermissionKey } from './user';

// Company information
export interface CompanyInfo {
  legalName: string;
  tradeName: string;
  taxId: string;                    // RUC
  taxIdType: string;
  legalRepresentative: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  currency: string;                 // USD
  timezone: string;
  fiscalYearStart: number;          // Month (1-12)
  electronicInvoicing: boolean;     // FE enabled
}

// Branch / Location
export interface Branch {
  id: string;                       // BR-001 format
  name: string;
  code: string;
  type: 'oficina' | 'bodega' | 'tienda' | 'zona_libre';
  address: string;
  city: string;
  country: string;
  phone?: string;
  manager?: string;
  isActive: boolean;
  isHeadquarters: boolean;
}

// Role template with granular permissions
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  baseRole: UserRole;
  isSystemRole: boolean;            // Admin Supremo = not editable
  isActive: boolean;
  permissions: RolePermissionGroup[];
  userCount: number;
}

// Permission grouped by module
export interface RolePermissionGroup {
  module: string;
  moduleLabel: string;
  icon: string;
  permissions: RolePermissionItem[];
}

// Individual permission toggle
export interface RolePermissionItem {
  key: PermissionKey | string;
  label: string;
  description: string;
  enabled: boolean;
}

// Approval flow
export interface ApprovalFlow {
  id: string;                       // AF-001 format
  name: string;
  description: string;
  triggerCondition: string;
  isActive: boolean;
  steps: ApprovalStep[];
  escalationTimeout?: number;       // Hours before escalation
  escalateTo?: string;              // Role/user for escalation
}

// Approval step (extended for F5 cascade approvals)
export interface ApprovalStep {
  id: string;
  order: number;
  approverRole: UserRole;
  approverLabel: string;
  approverUserId?: string;        // Specific user (e.g., "USR-003" for Jackie)
  approverUserName?: string;      // Display name
  isRequired: boolean;
  canSkip: boolean;
  timeoutHours?: number;          // Hours before escalation to next step
  escalationTimeoutHours?: number; // F5: explicit escalation timeout
  notifyAlways?: string[];        // F5: user IDs always notified (e.g., Javier)
}

// Master catalog
export interface MasterCatalog {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  lastUpdated: string;
  icon: string;
}

// Catalog item (generic)
export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// Notification configuration
export interface NotificationConfig {
  id: string;
  event: string;
  eventLabel: string;
  description: string;
  module: string;
  channels: NotificationChannel[];
  isActive: boolean;
  recipients: NotificationRecipient[];
}

// Notification channel
export interface NotificationChannel {
  type: 'email' | 'in_app' | 'sms';
  enabled: boolean;
  template?: string;
}

// Notification recipient
export interface NotificationRecipient {
  type: 'role' | 'user' | 'custom';
  value: string;                    // Role name or user ID
  label: string;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  module: string;
  moduleLabel: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string;
  changes?: AuditChange[];
}

// Audit action types
export type AuditAction = 'crear' | 'editar' | 'eliminar' | 'aprobar' | 'rechazar' | 'login' | 'logout' | 'exportar' | 'imprimir' | 'anular';

// Audit change detail
export interface AuditChange {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

// Active session
export interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  loginAt: string;
  lastActivity: string;
  ipAddress: string;
  browser: string;
  isCurrent: boolean;
}

// Security policies
export interface SecurityPolicies {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  twoFactorEnabled: boolean;
  passwordExpirationDays: number;
}

// Commercial parameters
export interface CommercialParams {
  priceLevels: PriceLevelConfig[];
  defaultPriceLevel: string;
  commissionThreshold: number;      // 10%
  commissionRates: CommissionRate[];
  taxRate: number;                  // 7% ITBMS
  taxExemptZones: string[];         // Zona Libre
  paymentTermsOptions: PaymentTermOption[];
}

// Price level configuration
export interface PriceLevelConfig {
  level: string;                    // A, B, C, D, E
  name: string;
  description: string;
  isActive: boolean;
}

// Commission rate per seller
export interface CommissionRate {
  userId: string;
  userName: string;
  rate: number;                     // percentage
  isActive: boolean;
}

// Payment term option
export interface PaymentTermOption {
  id: string;
  code: string;
  label: string;
  days: number;
  isActive: boolean;
}

// Document numbering sequence
export interface DocumentNumbering {
  id: string;
  documentType: string;
  documentLabel: string;
  prefix: string;
  currentNumber: number;
  paddingLength: number;            // Zero-padding
  example: string;                  // "COT-00001"
}

// System info
export interface SystemInfo {
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  lastDeploy: string;
  nextjsVersion: string;
  nodeVersion: string;
  database: string;
  uptime: string;
}

// Integration status
export interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'activo' | 'inactivo' | 'error' | 'pendiente';
  icon: string;
  lastSync?: string;
  config?: Record<string, string>;
}

// Labels
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  aprobar: 'Aprobar',
  rechazar: 'Rechazar',
  login: 'Inicio de Sesión',
  logout: 'Cierre de Sesión',
  exportar: 'Exportar',
  imprimir: 'Imprimir',
  anular: 'Anular',
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, { bg: string; text: string }> = {
  crear: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  editar: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  eliminar: { bg: 'bg-red-500/10', text: 'text-red-500' },
  aprobar: { bg: 'bg-teal-500/10', text: 'text-teal-500' },
  rechazar: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  login: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  logout: { bg: 'bg-gray-500/10', text: 'text-gray-500' },
  exportar: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  imprimir: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  anular: { bg: 'bg-red-500/10', text: 'text-red-500' },
};

export const INTEGRATION_STATUS_CONFIG: Record<Integration['status'], { bg: string; text: string; dot: string }> = {
  activo: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  inactivo: { bg: 'bg-gray-500/10', text: 'text-gray-500', dot: 'bg-gray-500' },
  error: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
  pendiente: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
};

// Module list for permission builder
export const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'productos', label: 'Productos', icon: 'Package' },
  { id: 'compras', label: 'Compras', icon: 'ShoppingCart' },
  { id: 'inventario', label: 'Inventario', icon: 'Warehouse' },
  { id: 'ventas', label: 'Ventas B2B', icon: 'Briefcase' },
  { id: 'pos', label: 'Punto de Venta', icon: 'Store' },
  { id: 'clientes', label: 'Clientes', icon: 'Users' },
  { id: 'cxc', label: 'Cuentas por Cobrar', icon: 'CreditCard' },
  { id: 'contabilidad', label: 'Contabilidad', icon: 'Calculator' },
  { id: 'trafico', label: 'Tráfico', icon: 'Ship' },
  { id: 'reportes', label: 'Reportes', icon: 'BarChart3' },
  { id: 'configuracion', label: 'Configuración', icon: 'Settings' },
] as const;
