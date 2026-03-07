'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Activity,
  Users,
  TrendingUp,
  Clock,
  ShieldOff,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  Trash2,
  FileCheck,
  ArrowRightLeft,
  Package,
  RefreshCw,
  CheckSquare,
  Lock,
  Send,
  LogIn,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ActivityChange {
  field: string;
  before: string;
  after: string;
}

interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  target: string;
  detail: string;
  timestamp: string;
  changes: ActivityChange | null;
}

// ============================================
// MOCK DATA (expanded to cover more days in Feb)
// ============================================

const ACTIVITY_LOG: ActivityEntry[] = [
  // Feb 26 (Today)
  { id: 'act-001', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'approved', module: 'ventas', target: 'Pedido PED-00023', detail: 'Aprobó pedido por $24,500 para WORLD DUTY FREE GROUP', timestamp: '2026-02-26T09:45:00', changes: null },
  { id: 'act-002', userId: 'USR-004', userName: 'Celideth Dominguez', userRole: 'vendedor', action: 'created', module: 'ventas', target: 'Cotización COT-00089', detail: 'Creó cotización para MARIA DEL MAR PEREZ SV por $8,200', timestamp: '2026-02-26T09:30:00', changes: null },
  { id: 'act-003', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'registered', module: 'cxc', target: 'Cobro COB-00008', detail: 'Registró cobro de $5,200 de CASA VERGARA PA (transferencia)', timestamp: '2026-02-26T09:15:00', changes: null },
  { id: 'act-004', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'confirmed', module: 'inventario', target: 'Transferencia TR-00012', detail: 'Confirmó recepción de 45 cajas en Bodega Principal', timestamp: '2026-02-26T09:00:00', changes: null },
  { id: 'act-005', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'compras', action: 'created', module: 'compras', target: 'OC-00078', detail: 'Creó orden de compra a GLOBAL BRANDS por $32,100', timestamp: '2026-02-26T08:45:00', changes: null },
  { id: 'act-006', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'modified', module: 'clientes', target: 'CLI-00009', detail: 'Modificó límite de crédito de CORPORACION FAVORITA EC: $80,000 → $120,000', timestamp: '2026-02-26T08:30:00', changes: { field: 'creditLimit', before: '$80,000', after: '$120,000' } },
  { id: 'act-007', userId: 'USR-006', userName: 'Arnold Arenas', userRole: 'vendedor', action: 'created', module: 'ventas', target: 'Cotización COT-00088', detail: 'Creó cotización para DISTRIBUIDORA CENTRAL GT por $15,800', timestamp: '2026-02-26T08:15:00', changes: null },
  { id: 'act-008', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'created', module: 'contabilidad', target: 'Asiento JE-00015', detail: 'Creó asiento manual de ajuste por depreciación $1,200', timestamp: '2026-02-26T08:00:00', changes: null },
  { id: 'act-009', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', action: 'updated', module: 'trafico', target: 'Embarque EMB-00034', detail: 'Actualizó ETA del contenedor MSKU-4829: 28 feb → 01 mar', timestamp: '2026-02-26T07:45:00', changes: { field: 'ETA', before: '28 Feb 2026', after: '01 Mar 2026' } },
  { id: 'act-010', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'created', module: 'inventario', target: 'Conteo CF-00019', detail: 'Inició sesión de conteo en Bodega Colón ZL', timestamp: '2026-02-26T07:30:00', changes: null },
  { id: 'act-025', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'login', module: 'sistema', target: 'Sesión', detail: 'Inició sesión desde 190.45.32.100', timestamp: '2026-02-26T07:00:00', changes: null },
  { id: 'act-026', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'login', module: 'sistema', target: 'Sesión', detail: 'Inició sesión desde 190.45.32.105', timestamp: '2026-02-26T07:15:00', changes: null },
  // Feb 25 (Yesterday)
  { id: 'act-011', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'approved', module: 'inventario', target: 'Ajuste AJ-00044', detail: 'Aprobó ajuste de inventario de 12 cajas de Whisky Chivas', timestamp: '2026-02-25T17:00:00', changes: null },
  { id: 'act-012', userId: 'USR-004', userName: 'Celideth Dominguez', userRole: 'vendedor', action: 'converted', module: 'ventas', target: 'PED-00022', detail: 'Convirtió cotización COT-00085 a pedido PED-00022', timestamp: '2026-02-25T16:30:00', changes: null },
  { id: 'act-013', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'compras', action: 'modified', module: 'productos', target: 'EVL-00015', detail: 'Actualizó precios de VODKA ABSOLUT: Nivel A $92→$95', timestamp: '2026-02-25T16:00:00', changes: { field: 'prices.A', before: '$92.00', after: '$95.00' } },
  { id: 'act-014', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'reconciled', module: 'contabilidad', target: 'Conciliación Banesco', detail: 'Completó conciliación bancaria de enero - Banesco', timestamp: '2026-02-25T15:00:00', changes: null },
  { id: 'act-015', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'packed', module: 'ventas', target: 'PED-00021', detail: 'Empacó pedido PED-00021 (15 cajas, 3 productos)', timestamp: '2026-02-25T14:30:00', changes: null },
  { id: 'act-016', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'approved', module: 'cxc', target: 'Anulación ANU-00003', detail: 'Aprobó anulación de factura FAC-00018 por error de facturación', timestamp: '2026-02-25T14:00:00', changes: null },
  { id: 'act-017', userId: 'USR-006', userName: 'Arnold Arenas', userRole: 'vendedor', action: 'created', module: 'clientes', target: 'CLI-00022', detail: 'Registró nuevo cliente: IMPORTADORA LÓPEZ CR', timestamp: '2026-02-25T13:00:00', changes: null },
  { id: 'act-018', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', action: 'created', module: 'inventario', target: 'Ajuste AJ-00043', detail: 'Creó ajuste por mercancía dañada en tránsito: 3 cajas', timestamp: '2026-02-25T12:00:00', changes: null },
  // Feb 24
  { id: 'act-019', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'compras', action: 'created', module: 'compras', target: 'OC-00077', detail: 'Creó OC a TRIPLE DOUBLE TRADING por $28,500', timestamp: '2026-02-24T16:00:00', changes: null },
  { id: 'act-020', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'closed', module: 'contabilidad', target: 'Cierre Enero 2026', detail: 'Ejecutó cierre contable del mes de enero 2026', timestamp: '2026-02-24T15:00:00', changes: null },
  { id: 'act-021', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'modified', module: 'configuracion', target: 'Parámetros', detail: 'Modificó umbral de comisión: 10% → 12%', timestamp: '2026-02-24T14:00:00', changes: { field: 'commissionThreshold', before: '10%', after: '12%' } },
  { id: 'act-022', userId: 'USR-004', userName: 'Celideth Dominguez', userRole: 'vendedor', action: 'sent', module: 'cxc', target: 'Estado de cuenta', detail: 'Envió estado de cuenta a 5 clientes (corte 24/02)', timestamp: '2026-02-24T11:00:00', changes: null },
  { id: 'act-023', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'completed', module: 'inventario', target: 'Conteo CF-00018', detail: 'Finalizó conteo cíclico: 98.5% precisión, 3 diferencias', timestamp: '2026-02-24T10:00:00', changes: null },
  { id: 'act-024', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'created', module: 'inventario', target: 'Transferencia TR-00011', detail: 'Creó transferencia de 80 cajas Colón ZL → Tienda PTY', timestamp: '2026-02-24T09:00:00', changes: null },
  // Feb 23
  { id: 'act-030', userId: 'USR-004', userName: 'Celideth Dominguez', userRole: 'vendedor', action: 'created', module: 'ventas', target: 'Cotización COT-00084', detail: 'Creó cotización para DUTY FREE AMERICAS por $42,000', timestamp: '2026-02-23T15:30:00', changes: null },
  { id: 'act-031', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'registered', module: 'cxc', target: 'Cobro COB-00007', detail: 'Registró cobro de $12,800 de BRAND DISTRIBUIDOR CURACAO', timestamp: '2026-02-23T14:00:00', changes: null },
  { id: 'act-032', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'approved', module: 'ventas', target: 'PED-00020', detail: 'Aprobó pedido por $18,200 para CARIBBEAN SPIRITS', timestamp: '2026-02-23T11:00:00', changes: null },
  // Feb 20
  { id: 'act-033', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'compras', action: 'created', module: 'compras', target: 'OC-00076', detail: 'Creó OC a DIAGEO PANAMA por $45,000', timestamp: '2026-02-20T16:00:00', changes: null },
  { id: 'act-034', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'confirmed', module: 'inventario', target: 'Transferencia TR-00010', detail: 'Confirmó recepción de 120 cajas de OC-00074', timestamp: '2026-02-20T10:00:00', changes: null },
  { id: 'act-035', userId: 'USR-006', userName: 'Arnold Arenas', userRole: 'vendedor', action: 'created', module: 'ventas', target: 'Cotización COT-00083', detail: 'Creó cotización para ISLAND BEVERAGES CO por $9,500', timestamp: '2026-02-20T09:00:00', changes: null },
  // Feb 19
  { id: 'act-036', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', action: 'updated', module: 'trafico', target: 'Embarque EMB-00033', detail: 'Registró arribo de contenedor CMAU-3821 en puerto Colón', timestamp: '2026-02-19T14:00:00', changes: null },
  { id: 'act-037', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'created', module: 'contabilidad', target: 'Asiento JE-00014', detail: 'Registró provisión de gastos de importación $3,400', timestamp: '2026-02-19T11:00:00', changes: null },
  // Feb 18
  { id: 'act-038', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'approved', module: 'inventario', target: 'Ajuste AJ-00042', detail: 'Aprobó ajuste por merma: 8 cajas de Vodka Absolut', timestamp: '2026-02-18T16:00:00', changes: null },
  { id: 'act-039', userId: 'USR-004', userName: 'Celideth Dominguez', userRole: 'vendedor', action: 'converted', module: 'ventas', target: 'PED-00019', detail: 'Convirtió cotización COT-00080 a pedido', timestamp: '2026-02-18T10:00:00', changes: null },
  // Feb 17
  { id: 'act-040', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'created', module: 'inventario', target: 'Conteo CF-00017', detail: 'Inició conteo cíclico en zona B - Ron y Tequila', timestamp: '2026-02-17T08:30:00', changes: null },
  // Feb 14
  { id: 'act-041', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'compras', action: 'modified', module: 'productos', target: 'EVL-00003', detail: 'Actualizó costo FOB de JOHNNIE WALKER BLACK: $135→$142', timestamp: '2026-02-14T15:00:00', changes: { field: 'costFOB', before: '$135.00', after: '$142.00' } },
  { id: 'act-042', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'registered', module: 'cxc', target: 'Cobro COB-00006', detail: 'Registró cobro de $22,100 de WORLD DUTY FREE GROUP', timestamp: '2026-02-14T12:00:00', changes: null },
  // Feb 12
  { id: 'act-043', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'approved', module: 'ventas', target: 'PED-00018', detail: 'Aprobó pedido especial con descuento 15% para DUTY FREE AMERICAS', timestamp: '2026-02-12T14:00:00', changes: null },
  { id: 'act-044', userId: 'USR-006', userName: 'Arnold Arenas', userRole: 'vendedor', action: 'created', module: 'clientes', target: 'CLI-00021', detail: 'Registró nuevo cliente: BEBIDAS SELECTAS GT', timestamp: '2026-02-12T09:30:00', changes: null },
  // Feb 10
  { id: 'act-045', userId: 'USR-008', userName: 'Jesus Ferreira', userRole: 'bodega', action: 'packed', module: 'ventas', target: 'PED-00017', detail: 'Empacó pedido para DISTRIBUIDORA DEL MAR (28 cajas)', timestamp: '2026-02-10T11:00:00', changes: null },
  // Feb 7
  { id: 'act-046', userId: 'USR-004', userName: 'Ariel Brome', userRole: 'trafico', action: 'created', module: 'trafico', target: 'Embarque EMB-00032', detail: 'Registró nuevo embarque de BEAM SUNTORY - 200 cajas', timestamp: '2026-02-07T15:00:00', changes: null },
  { id: 'act-047', userId: 'USR-003', userName: 'Jakeira Chavez', userRole: 'compras', action: 'created', module: 'compras', target: 'OC-00075', detail: 'Creó OC a BACARDI GLOBAL por $18,900', timestamp: '2026-02-07T10:00:00', changes: null },
  // Feb 5
  { id: 'act-048', userId: 'USR-002', userName: 'Astelvia Watts', userRole: 'contabilidad', action: 'reconciled', module: 'contabilidad', target: 'Conciliación BAC', detail: 'Completó conciliación bancaria de diciembre - BAC', timestamp: '2026-02-05T16:00:00', changes: null },
  // Feb 3
  { id: 'act-049', userId: 'USR-001', userName: 'Javier Lange', userRole: 'gerencia', action: 'modified', module: 'configuracion', target: 'Usuarios', detail: 'Activó permisos de facturación para Astelvia Watts', timestamp: '2026-02-03T09:00:00', changes: null },
  { id: 'act-050', userId: 'USR-004', userName: 'Celideth Dominguez', userRole: 'vendedor', action: 'created', module: 'ventas', target: 'Cotización COT-00078', detail: 'Creó cotización para CASA VERGARA PA por $6,800', timestamp: '2026-02-03T14:00:00', changes: null },
];

// ============================================
// ACTION CONFIG
// ============================================

const ACTION_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; bgColor: string }> = {
  created: { label: 'Creó', icon: Plus, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  modified: { label: 'Modificó', icon: Pencil, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  approved: { label: 'Aprobó', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  rejected: { label: 'Rechazó', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
  deleted: { label: 'Eliminó', icon: Trash2, color: 'text-red-400', bgColor: 'bg-red-400/10' },
  registered: { label: 'Registró', icon: FileCheck, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  confirmed: { label: 'Confirmó', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  converted: { label: 'Convirtió', icon: ArrowRightLeft, color: 'text-violet-400', bgColor: 'bg-violet-400/10' },
  packed: { label: 'Empacó', icon: Package, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  updated: { label: 'Actualizó', icon: RefreshCw, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  reconciled: { label: 'Concilió', icon: CheckSquare, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  closed: { label: 'Cerró', icon: Lock, color: 'text-violet-400', bgColor: 'bg-violet-400/10' },
  sent: { label: 'Envió', icon: Send, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  completed: { label: 'Completó', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  login: { label: 'Sesión', icon: LogIn, color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

// ============================================
// MODULE CONFIG
// ============================================

const MODULE_CONFIG: Record<string, { label: string; color: string }> = {
  ventas: { label: 'Ventas', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  compras: { label: 'Compras', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  inventario: { label: 'Inventario', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  clientes: { label: 'Clientes', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  contabilidad: { label: 'Contabilidad', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  cxc: { label: 'CxC', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  trafico: { label: 'Tráfico', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  productos: { label: 'Productos', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  configuracion: { label: 'Config', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  sistema: { label: 'Sistema', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

// ============================================
// HELPERS
// ============================================

const REFERENCE_TODAY = new Date('2026-02-26T12:00:00');

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const entryKey = toDateKey(date);
  const todayKey = toDateKey(REFERENCE_TODAY);
  const yesterday = new Date(REFERENCE_TODAY);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  if (entryKey === todayKey) return 'Hoy';
  if (entryKey === yesterdayKey) return 'Ayer';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ============================================
// MINI CALENDAR COMPONENT
// ============================================

const DAYS_OF_WEEK = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

interface MiniCalendarProps {
  activityDates: Map<string, number>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

function MiniCalendar({ activityDates, selectedDate, onSelectDate }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(REFERENCE_TODAY.getMonth());
  const [viewYear, setViewYear] = useState(REFERENCE_TODAY.getFullYear());

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday-based week (0=Mon, 6=Sun)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: (number | null)[] = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Trailing empty cells to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewMonth, viewYear]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(REFERENCE_TODAY);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#141414]">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] dark:text-[#666]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{monthLabel}</span>
        <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] dark:text-[#666]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7 gap-0">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium uppercase text-gray-400 dark:text-[#666]">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const activityCount = activityDates.get(dateKey) || 0;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const isFuture = new Date(dateKey) > REFERENCE_TODAY;

          return (
            <button
              key={dateKey}
              onClick={() => {
                if (isFuture) return;
                onSelectDate(isSelected ? null : dateKey);
              }}
              disabled={isFuture}
              className={cn(
                'relative flex h-9 w-full flex-col items-center justify-center rounded-lg text-sm transition-all',
                isFuture && 'cursor-default text-gray-300 dark:text-[#333]',
                !isFuture && !isSelected && !isToday && 'text-gray-700 hover:bg-gray-100 dark:text-[#ccc] dark:hover:bg-[#1a1a1a]',
                !isFuture && isToday && !isSelected && 'font-bold text-brand-600 dark:text-brand-400',
                isSelected && 'bg-brand-600 font-bold text-white',
              )}
            >
              <span className="leading-none">{day}</span>
              {/* Activity dot */}
              {activityCount > 0 && !isFuture && (
                <span
                  className={cn(
                    'absolute bottom-0.5 h-1 w-1 rounded-full',
                    isSelected ? 'bg-white' : activityCount >= 5 ? 'bg-brand-500' : activityCount >= 3 ? 'bg-brand-400' : 'bg-brand-300 dark:bg-brand-600',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-[#2a2a2a]">
        <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-[#666]">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-300 dark:bg-brand-600" />1-2</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-400" />3-4</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />5+</span>
        </div>
        {selectedDate && (
          <button
            onClick={() => onSelectDate(null)}
            className="flex items-center gap-1 text-[10px] font-medium text-brand-500 hover:text-brand-600"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HistorialPage() {
  const { checkPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Permission check
  if (!checkPermission('canViewHistorial')) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <ShieldOff className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Acceso Restringido</h2>
        <p className="text-sm text-gray-500 dark:text-[#888]">
          Solo los administradores pueden ver el historial de actividad.
        </p>
      </div>
    );
  }

  // Activity dates map (dateKey → count)
  const activityDates = useMemo(() => {
    const map = new Map<string, number>();
    ACTIVITY_LOG.forEach((entry) => {
      const key = toDateKey(new Date(entry.timestamp));
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, []);

  // Unique users for filter
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    ACTIVITY_LOG.forEach((a) => map.set(a.userId, a.userName));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, []);

  // Unique action types for filter
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    ACTIVITY_LOG.forEach((a) => set.add(a.action));
    return Array.from(set).sort();
  }, []);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return ACTIVITY_LOG.filter((entry) => {
      if (searchQuery && !entry.detail.toLowerCase().includes(searchQuery.toLowerCase()) && !entry.target.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (userFilter !== 'all' && entry.userId !== userFilter) return false;
      if (moduleFilter !== 'all' && entry.module !== moduleFilter) return false;
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
      if (selectedDate) {
        const entryKey = toDateKey(new Date(entry.timestamp));
        if (entryKey !== selectedDate) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [searchQuery, userFilter, moduleFilter, actionFilter, selectedDate]);

  // Group by day
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: ActivityEntry[] }[] = [];
    let currentLabel = '';

    filteredEntries.forEach((entry) => {
      const label = getDateLabel(entry.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, entries: [entry] });
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    });

    return groups;
  }, [filteredEntries]);

  // Stats
  const stats = useMemo(() => {
    const todayEntries = ACTIVITY_LOG.filter((e) => e.timestamp.startsWith('2026-02-26'));
    const todayUsers = new Set(todayEntries.map((e) => e.userId));
    const moduleCounts: Record<string, number> = {};
    todayEntries.forEach((e) => {
      moduleCounts[e.module] = (moduleCounts[e.module] || 0) + 1;
    });
    const topModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0];
    const lastAction = ACTIVITY_LOG.reduce((latest, entry) =>
      new Date(entry.timestamp) > new Date(latest.timestamp) ? entry : latest
    );

    return {
      todayActions: todayEntries.length,
      activeUsers: todayUsers.size,
      topModule: topModule ? MODULE_CONFIG[topModule[0]]?.label || topModule[0] : '-',
      lastActionTime: formatTime(lastAction.timestamp),
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
          <History className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Actividad</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">
            Registro completo de acciones realizadas por todos los usuarios
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#666]" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#666]"
          />
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition-colors focus:border-brand-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#ccc]"
        >
          <option value="all">Todos los usuarios</option>
          {uniqueUsers.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition-colors focus:border-brand-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#ccc]"
        >
          <option value="all">Todos los módulos</option>
          {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition-colors focus:border-brand-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#ccc]"
        >
          <option value="all">Todas las acciones</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>{ACTION_CONFIG[action]?.label || action}</option>
          ))}
        </select>
        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400"
          >
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Acciones Hoy', value: stats.todayActions, icon: Activity, color: 'text-brand-500', bgColor: 'bg-brand-100' },
          { label: 'Usuarios Activos', value: stats.activeUsers, icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Módulo Más Activo', value: stats.topModule, icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Última Acción', value: stats.lastActionTime, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#141414]"
          >
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bgColor)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#888]">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content: Calendar sidebar + Timeline */}
      <div className="flex gap-6">
        {/* Calendar sidebar */}
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-20">
            <MiniCalendar
              activityDates={activityDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            {/* Selected date info */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-[#2a2a2a] dark:bg-[#141414]"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-[#888]">Actividad del día</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredEntries.length} <span className="text-sm font-normal text-gray-500 dark:text-[#888]">{filteredEntries.length === 1 ? 'acción' : 'acciones'}</span>
                </p>
                {/* Module breakdown for selected date */}
                <div className="mt-2 space-y-1">
                  {(() => {
                    const counts: Record<string, number> = {};
                    filteredEntries.forEach((e) => {
                      counts[e.module] = (counts[e.module] || 0) + 1;
                    });
                    return Object.entries(counts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([mod, count]) => {
                        const cfg = MODULE_CONFIG[mod];
                        return (
                          <div key={mod} className="flex items-center justify-between text-xs">
                            <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium', cfg?.color || 'text-gray-400')}>
                              {cfg?.label || mod}
                            </span>
                            <span className="text-gray-500 dark:text-[#888]">{count}</span>
                          </div>
                        );
                      });
                  })()}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="min-w-0 flex-1 space-y-6">
          {groupedEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Search className="h-10 w-10 text-gray-300 dark:text-[#444]" />
              <p className="text-sm text-gray-500 dark:text-[#888]">No se encontraron actividades con los filtros seleccionados.</p>
            </div>
          )}

          {groupedEntries.map((group) => (
            <div key={group.label}>
              {/* Date Header */}
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{group.label}</h3>
                <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
                <span className="text-xs text-gray-400 dark:text-[#666]">
                  {group.entries.length} {group.entries.length === 1 ? 'acción' : 'acciones'}
                </span>
              </div>

              {/* Entries */}
              <div className="space-y-2">
                {group.entries.map((entry, entryIndex) => {
                  const actionCfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.created;
                  const moduleCfg = MODULE_CONFIG[entry.module];
                  const ActionIcon = actionCfg.icon;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: entryIndex * 0.03 }}
                      className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-[#2a2a2a] dark:bg-[#141414] dark:hover:border-[#3a3a3a]"
                    >
                      {/* Action Icon */}
                      <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', actionCfg.bgColor)}>
                        <ActionIcon className={cn('h-4 w-4', actionCfg.color)} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-1 text-sm">
                          <span className="font-semibold text-gray-900 dark:text-white">{entry.userName}</span>
                          <span className="text-gray-500 dark:text-[#888]">{actionCfg.label.toLowerCase()}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{entry.target}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-[#888] line-clamp-1">{entry.detail}</p>

                        {/* Changes diff */}
                        {entry.changes && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs dark:bg-[#1a1a1a]">
                            <span className="font-mono text-red-400 line-through">{entry.changes.before}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400 dark:text-[#666]" />
                            <span className="font-mono text-emerald-400">{entry.changes.after}</span>
                          </div>
                        )}
                      </div>

                      {/* Right side */}
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {moduleCfg && (
                          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', moduleCfg.color)}>
                            {moduleCfg.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-[#666]">{formatTime(entry.timestamp)}</span>
                        <span className="text-[10px] text-gray-400 dark:text-[#555]">
                          {ROLE_LABELS[entry.userRole as keyof typeof ROLE_LABELS] || entry.userRole}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
