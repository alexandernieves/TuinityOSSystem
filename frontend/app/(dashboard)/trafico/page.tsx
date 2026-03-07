'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  Ship,
  FileText,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Circle,
  Search,
  ChevronDown,
  X,
  Anchor,
  ScrollText,
  Award,
  Settings,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { api } from '@/lib/services/api';
import {
  SHIPMENT_STATUS_CONFIG,
  SHIPMENT_TYPE_LABELS,
  SHIPMENT_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/lib/types/traffic';
import type { ShipmentType, ShipmentStatus, ShipmentPriority } from '@/lib/types/traffic';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

type StatusFilter = ShipmentStatus | 'all';
type TypeFilter = ShipmentType | 'all';

const SUB_NAV_ITEMS = [
  { label: 'DMC', href: '/trafico/dmc/nuevo', icon: ScrollText },
  { label: 'Bill of Lading', href: '/trafico/bl/nuevo', icon: Anchor },
  { label: 'Certificados', href: '/trafico/certificados', icon: Award },
  { label: 'Configuración', href: '/trafico/configuracion', icon: Settings },
];

const PRIORITY_DOT_CLASS: Record<ShipmentPriority, string> = {
  urgente: 'bg-red-500',
  normal: 'bg-emerald-500',
  anticipado: 'bg-amber-500',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TraficoPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canConfigureTrafico = checkPermission('canConfigureTrafico');

  const [realExpedients, setRealExpedients] = useState<any[]>([]);
  const [realStats, setRealStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getExpedients(),
      api.getTrafficStats()
    ])
      .then(([exps, s]) => {
        setRealExpedients(exps);
        setRealStats(s);
      })
      .catch(err => console.error('Error fetching traffic data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const normalizedExpedients = useMemo(() => {
    return realExpedients.map((exp: any) => ({
      id: exp.reference,
      type: exp.type as ShipmentType,
      status: exp.status as ShipmentStatus,
      priority: exp.priority as ShipmentPriority,
      createdAt: exp.createdAt,
      sourceDocumentId: exp.sourceDocumentId,
      sourceDocumentType: exp.sourceDocumentType,
      counterpartName: exp.counterpartName,
      counterpartCountry: exp.counterpartCountry || 'Panamá',
      totalPackages: exp.totals?.packages || 0,
      totalValueFOB: exp.totals?.valueFOB || 0,
      dmcId: exp.dmcId,
      blId: exp.blId,
      certificateIds: exp.certificateIds || [],
      estimatedDispatchDate: exp.estimatedDispatchDate
    }));
  }, [realExpedients]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredExpedients = useMemo(() => {
    return normalizedExpedients.filter((exp) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        exp.id.toLowerCase().includes(searchLower) ||
        exp.counterpartName.toLowerCase().includes(searchLower) ||
        exp.sourceDocumentId.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
      const matchesType = typeFilter === 'all' || exp.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [normalizedExpedients, searchQuery, statusFilter, typeFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all';

  const STATS_CARDS = [
    { label: 'Pendientes Hoy', value: realStats?.pendingToday || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'DMC en Borrador', value: realStats?.dmcPending || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'En Tránsito', value: realStats?.inTransit || 0, icon: Truck, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Entregados (Semana)', value: realStats?.completedThisWeek || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950">
            <Ship className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tráfico y Documentación</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Expedientes, DMC, Bill of Lading, Certificados</p>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {SUB_NAV_ITEMS.filter((item) => {
          if (item.href === '/trafico/configuracion') return canConfigureTrafico;
          return true;
        }).map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-sky-300 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-700 dark:hover:text-sky-400"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS_CARDS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  stat.color === 'amber' && 'bg-amber-50 dark:bg-amber-950',
                  stat.color === 'blue' && 'bg-blue-50 dark:bg-blue-950',
                  stat.color === 'sky' && 'bg-sky-50 dark:bg-sky-950',
                  stat.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-950'
                )}
              >
                <stat.icon
                  className={cn(
                    'h-5 w-5',
                    stat.color === 'amber' && 'text-amber-600',
                    stat.color === 'blue' && 'text-blue-600',
                    stat.color === 'sky' && 'text-sky-600',
                    stat.color === 'emerald' && 'text-emerald-600'
                  )}
                />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar expediente, cliente, factura..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  typeFilter !== 'all'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                )}
              >
                {typeFilter !== 'all' ? SHIPMENT_TYPE_LABELS[typeFilter] : 'Tipo'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={typeFilter !== 'all' ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setTypeFilter(selected === typeFilter ? 'all' : (selected as TypeFilter));
              }}
            >
              <DropdownItem key="salida">Salida</DropdownItem>
              <DropdownItem key="entrada">Entrada</DropdownItem>
              <DropdownItem key="traspaso">Traspaso</DropdownItem>
              <DropdownItem key="transferencia">Transferencia</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  statusFilter !== 'all'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                )}
              >
                {statusFilter !== 'all' ? SHIPMENT_STATUS_LABELS[statusFilter] : 'Estado'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setStatusFilter(selected === statusFilter ? 'all' : (selected as StatusFilter));
              }}
            >
              <DropdownItem key="pendiente">Pendiente</DropdownItem>
              <DropdownItem key="en_proceso">En Proceso</DropdownItem>
              <DropdownItem key="documentado">Documentado</DropdownItem>
              <DropdownItem key="despachado">Despachado</DropdownItem>
              <DropdownItem key="en_transito">En Tránsito</DropdownItem>
              <DropdownItem key="entregado">Entregado</DropdownItem>
              <DropdownItem key="cancelado">Cancelado</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Expedients Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Pri</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Expediente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Cliente / Proveedor</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Destino</th>
                <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Docs</th>
                <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Valor FOB</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Fecha Est.</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {filteredExpedients.map((exp, index) => {
                const statusConfig = SHIPMENT_STATUS_CONFIG[exp.status];
                return (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => router.push(`/trafico/expedientes/${exp.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <td className="hidden sm:table-cell px-4 py-3 text-center">
                      <span className={cn('inline-block h-3 w-3 rounded-full', PRIORITY_DOT_CLASS[exp.priority])} title={PRIORITY_LABELS[exp.priority]} />
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
                          exp.type === 'salida' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                          exp.type === 'entrada' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                          exp.type === 'traspaso' && 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                          exp.type === 'transferencia' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        )}
                      >
                        {SHIPMENT_TYPE_LABELS[exp.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-medium text-sky-600 dark:text-sky-400 group-hover:underline">
                          {exp.id}
                        </span>
                        <p className="truncate text-xs text-gray-500 dark:text-[#888]">{exp.sourceDocumentId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-24 truncate text-sm text-gray-900 dark:text-white sm:max-w-none">{exp.counterpartName}</span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{exp.counterpartCountry}</span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span title={exp.dmcId ? 'DMC generada' : 'DMC pendiente'}>
                          {exp.dmcId ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        </span>
                        <span title={exp.blId ? 'BL generado' : 'BL pendiente'}>
                          {exp.blId ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        </span>
                        <span title={exp.certificateIds?.length ? 'Certificado' : 'Sin certificado'}>
                          {exp.certificateIds?.length ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(exp.totalValueFOB)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-[#888]">
                        {exp.estimatedDispatchDate ? formatDate(exp.estimatedDispatchDate) : '\u2014'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusConfig.bg,
                          statusConfig.text
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                        {statusConfig.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredExpedients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <Ship className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No se encontraron expedientes</h3>
          <p className="text-sm text-gray-500 dark:text-[#888]">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}

      {/* Results count */}
      {filteredExpedients.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-[#888]">
          Mostrando {filteredExpedients.length} de {normalizedExpedients.length} expedientes
        </div>
      )}
    </div>
  );
}
