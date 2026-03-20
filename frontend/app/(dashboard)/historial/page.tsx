'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';
import { api } from '@/lib/services/api';
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
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

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
  oldData?: any;
  newData?: any;
}

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

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const entryKey = toDateKey(date);
  const now = new Date();
  const todayKey = toDateKey(now);
  const yesterday = new Date(now);
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
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

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

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewMonth, viewYear]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(now);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#2a2a2a] dark:bg-[#141414]">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] dark:text-[#666]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{monthLabel}</span>
        <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] dark:text-[#666]">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium uppercase text-gray-400 dark:text-[#666]">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} className="h-9" />;

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const activityCount = activityDates.get(dateKey) || 0;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const isFuture = new Date(dateKey + 'T23:59:59') > now;

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
                !isFuture && isToday && !isSelected && 'font-bold text-blue-600 dark:text-blue-400',
                isSelected && 'bg-blue-600 font-bold text-white',
              )}
            >
              <span className="leading-none">{day}</span>
              {activityCount > 0 && !isFuture && (
                <span
                  className={cn(
                    'absolute bottom-1 h-2 w-2 rounded-full shadow-sm',
                    isSelected ? 'bg-white' : 'bg-blue-600',
                  )}
                />
              )}
            </button>
          );
        })}
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [platformUsers, setPlatformUsers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [auditRes, usersRes] = await Promise.all([
          api.getAuditLogs({ limit: 500 }),
          api.getUsers()
        ]);
        
        // Map backend logs to frontend interface
        const mappedLogs = (auditRes.logs || []).map((log: any) => ({
          id: log.id,
          userId: log.userId,
          userName: log.user?.name || 'Sistema',
          userRole: log.user?.roles?.[0]?.role?.name || 'sistema',
          action: log.action.toLowerCase(),
          module: log.entity.toLowerCase(),
          target: `${log.entity} ${log.entityId || ''}`,
          detail: `Acción: ${log.action} en ${log.entity}`,
          timestamp: log.createdAt,
          changes: log.newData || log.oldData ? { field: 'Datos', before: 'Anterior', after: 'Nuevo' } : null,
          oldData: log.oldData,
          newData: log.newData
        }));
        
        setLogs(mappedLogs);
        setPlatformUsers(usersRes || []);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // PERMISSION CHECK
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

  const activityDates = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((entry) => {
      const key = toDateKey(new Date(entry.timestamp));
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [logs]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((a) => set.add(a.action));
    return Array.from(set).sort();
  }, [logs]);

  const filteredEntries = useMemo(() => {
    return logs.filter((entry) => {
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
  }, [logs, searchQuery, userFilter, moduleFilter, actionFilter, selectedDate]);

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

  const stats = useMemo(() => {
    const todayStr = toDateKey(new Date());
    const todayEntries = logs.filter((e) => toDateKey(new Date(e.timestamp)) === todayStr);
    const todayUsers = new Set(todayEntries.map((e) => e.userId));
    const moduleCounts: Record<string, number> = {};
    todayEntries.forEach((e) => {
      moduleCounts[e.module] = (moduleCounts[e.module] || 0) + 1;
    });
    const topModule = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0];
    const lastAction = logs[0];

    return {
      todayActions: todayEntries.length,
      activeUsers: todayUsers.size,
      topModule: topModule ? MODULE_CONFIG[topModule[0]]?.label || topModule[0] : '-',
      lastActionTime: lastAction ? formatTime(lastAction.timestamp) : '-',
    };
  }, [logs]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <History className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Actividad</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">
            Registro completo de acciones realizadas por los usuarios de la plataforma
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#666]" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#666]"
          />
        </div>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#ccc]"
        >
          <option value="all">Todos los usuarios</option>
          {platformUsers.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#ccc]"
        >
          <option value="all">Todos los módulos</option>
          {Object.entries(MODULE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition-colors focus:border-blue-500 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#ccc]"
        >
          <option value="all">Todas las acciones</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>{ACTION_CONFIG[action]?.label || action}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Acciones Hoy', value: stats.todayActions, icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-100' },
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

      <div className="flex gap-6">
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-20">
            <MiniCalendar
              activityDates={activityDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <RefreshCw className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500 dark:text-[#888]">Cargando historial real...</p>
            </div>
          )}

          {!isLoading && groupedEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Search className="h-10 w-10 text-gray-300 dark:text-[#444]" />
              <p className="text-sm text-gray-500 dark:text-[#888]">No se encontraron actividades registradas.</p>
            </div>
          )}

          {groupedEntries.map((group) => (
            <div key={group.label}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{group.label}</h3>
                <div className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a2a]" />
                <span className="text-xs text-gray-400 dark:text-[#666]">
                  {group.entries.length} {group.entries.length === 1 ? 'acción' : 'acciones'}
                </span>
              </div>

              <div className="space-y-2">
                {group.entries.map((entry, entryIndex) => {
                  const actionCfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.created;
                  const moduleCfg = MODULE_CONFIG[entry.module] || MODULE_CONFIG.sistema;
                  const ActionIcon = actionCfg.icon;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: entryIndex * 0.03 }}
                      className={cn(
                        "group flex flex-col rounded-xl border border-gray-200 bg-white transition-all hover:border-blue-200 dark:border-[#2a2a2a] dark:bg-[#141414] overflow-hidden cursor-pointer",
                        expandedId === entry.id && "ring-1 ring-blue-500 border-blue-200 shadow-md"
                      )}
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', actionCfg.bgColor)}>
                          <ActionIcon className={cn('h-4 w-4', actionCfg.color)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-1 text-sm">
                            <span className="font-bold text-gray-900 dark:text-white">{entry.userName}</span>
                            <span className="text-gray-500 dark:text-[#888]">{actionCfg.label.toLowerCase()}</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{entry.target}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#888] font-medium">{entry.detail}</p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', moduleCfg.color)}>
                            {moduleCfg.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 dark:text-[#666]">{formatTime(entry.timestamp)}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", expandedId === entry.id && "rotate-180")} />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedId === entry.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-gray-50/50 border-t border-gray-100 dark:bg-black/20 dark:border-[#2a2a2a]"
                          >
                            <div className="p-4 pt-2 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Datos Anteriores</h4>
                                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs dark:border-[#333] dark:bg-[#1a1a1a] overflow-x-auto">
                                    {entry.oldData ? (
                                      <pre className="whitespace-pre-wrap font-sans text-gray-600 dark:text-gray-400">
                                        {JSON.stringify(entry.oldData, null, 2)}
                                      </pre>
                                    ) : (
                                      <span className="italic text-gray-400">Sin datos previos (Creación)</span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Datos Nuevos</h4>
                                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs dark:border-[#333] dark:bg-[#1a1a1a] overflow-x-auto text-emerald-600 dark:text-emerald-400">
                                    {entry.newData ? (
                                      <pre className="whitespace-pre-wrap font-sans">
                                        {JSON.stringify(entry.newData, null, 2)}
                                      </pre>
                                    ) : (
                                      <span className="italic text-gray-400">Sin datos nuevos (Eliminación)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-3 dark:border-[#2a2a2a]">
                                <div className="flex gap-4">
                                   <span>ID Registro: <span className="font-mono">{entry.id}</span></span>
                                   <span>Módulo: {moduleCfg.label}</span>
                                </div>
                                <button className="text-blue-500 hover:underline">Ver registro completo</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
