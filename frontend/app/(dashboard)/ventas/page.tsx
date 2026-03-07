'use client';

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Tooltip,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  FileText,
  Briefcase,
  DollarSign,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  X,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  PackageCheck,
  FileCheck,
  Send,
  ThumbsUp,
  ChevronRight,
  User,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatCurrency,
  formatDate,
} from '@/lib/mock-data/sales-orders';
import { getCreditStatus } from '@/lib/mock-data/clients';
import { api } from '@/lib/services/api';
import { Loader2 } from 'lucide-react';
import type { SalesOrder, SalesOrderStatus, DocumentType } from '@/lib/types/sales-order';
import { STATUS_CONFIG, DOCUMENT_TYPE_LABELS } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';

type StatusFilter = SalesOrderStatus | 'all';
type DocTypeFilter = DocumentType | 'all';

// Pipeline stages for visual representation
const PIPELINE_STAGES: { status: SalesOrderStatus; label: string }[] = [
  { status: 'borrador', label: 'Borrador' },
  { status: 'cotizado', label: 'Cotizado' },
  { status: 'pedido', label: 'Pedido' },
  { status: 'aprobado', label: 'Aprobado' },
  { status: 'empacado', label: 'Empacado' },
  { status: 'facturado', label: 'Facturado' },
];

export default function VentasPage() {
  const router = useRouter();
  const { checkPermission, user } = useAuth();
  const canViewMargins = checkPermission('canViewMargins');
  const canCreateQuotes = checkPermission('canCreateQuotes');
  const canApproveOrders = checkPermission('canApproveOrders');
  const isVendedor = user?.role === 'vendedor';

  // State
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, clientsData] = await Promise.all([
          api.getSales(),
          api.getUsers() // Usando getUsers temporalmente si no hay getClients específico, o api.getUsers()
        ]);
        setSalesOrders(ordersData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Stats (Simplified for now based on local data)
  const stats = useMemo(() => {
    const pendingQuotes = salesOrders.filter(o => o.status === 'cotizado').length;
    const pendingApproval = salesOrders.filter(o => o.status === 'pedido').length;
    const readyToPack = salesOrders.filter(o => o.status === 'aprobado').length;
    const readyToInvoice = salesOrders.filter(o => o.status === 'empacado').length;
    const salesValueThisMonth = salesOrders
      .filter(o => o.status === 'facturado')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pipelineValue = salesOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const byStatus = {
      borrador: salesOrders.filter(o => o.status === 'borrador').length,
      cotizado: pendingQuotes,
      pedido: pendingApproval,
      aprobado: readyToPack,
      empacado: readyToInvoice,
      facturado: salesOrders.filter(o => o.status === 'facturado').length,
      cancelado: salesOrders.filter(o => o.status === 'cancelado').length,
    };

    return {
      pendingQuotes,
      pendingApproval,
      readyToPack,
      readyToInvoice,
      salesValueThisMonth,
      pipelineValue,
      byStatus
    };
  }, [salesOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        order.orderNumber.toLowerCase().includes(searchLower) ||
        (order.clientName || '').toLowerCase().includes(searchLower) ||
        (order.clientId || '').toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesDocType = docTypeFilter === 'all' || order.documentType === docTypeFilter;
      const matchesCustomer = !selectedCustomer || order.clientId === selectedCustomer;

      return matchesSearch && matchesStatus && matchesDocType && matchesCustomer;
    });
  }, [salesOrders, searchQuery, statusFilter, docTypeFilter, selectedCustomer]);

  // Handlers
  const handleViewOrder = (order: any) => {
    router.push(`/ventas/${order.id}`);
  };

  const handleDeleteOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOrder) {
      try {
        await api.updateSaleStatus(selectedOrder.id, 'cancelada');
        setSalesOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelada' } : o));
        toast.success('Documento cancelado', {
          description: `El documento ${selectedOrder.orderNumber} ha sido cancelado.`,
        });
      } catch (error) {
        toast.error('Error al cancelar documento');
      } finally {
        setIsDeleteOpen(false);
        setSelectedOrder(null);
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      await api.updateSaleStatus(id, status);
      setSalesOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleExportOrders = () => {
    toast.success('Exportando ventas', {
      description: 'El archivo Excel se descargará en breve.',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDocTypeFilter('all');
    setSelectedCustomer(null);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || docTypeFilter !== 'all' || selectedCustomer;

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        <p className="text-muted-foreground italic">Sincronizando tubería de ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Ventas B2B</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportOrders}
            className="flex h-9 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          {canCreateQuotes && (
            <button
              onClick={() => router.push('/ventas/nueva')}
              className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              Nueva Cotización
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: 'Cotizaciones',
            value: stats.pendingQuotes,
            icon: FileText,
            color: 'blue',
            filterStatus: 'cotizado' as StatusFilter,
            show: true,
          },
          {
            label: 'Por Aprobar',
            value: stats.pendingApproval,
            icon: ThumbsUp,
            color: 'purple',
            filterStatus: 'pedido' as StatusFilter,
            show: canApproveOrders,
          },
          {
            label: 'Por Empacar',
            value: stats.readyToPack,
            icon: PackageCheck,
            color: 'amber',
            filterStatus: 'aprobado' as StatusFilter,
            show: true,
          },
          {
            label: 'Por Facturar',
            value: stats.readyToInvoice,
            icon: FileCheck,
            color: 'emerald',
            filterStatus: 'empacado' as StatusFilter,
            show: true,
          },
          {
            label: 'Venta del Mes',
            value: formatCurrency(stats.salesValueThisMonth),
            icon: DollarSign,
            color: 'teal',
            filterStatus: 'facturado' as StatusFilter,
            isMonetary: true,
            show: canViewMargins,
          },
        ]
          .filter((stat) => stat.show)
          .map((stat, index) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setStatusFilter(statusFilter === stat.filterStatus ? 'all' : stat.filterStatus)}
              className={cn(
                'rounded-xl border bg-card p-3 text-left transition-all hover:shadow-md',
                statusFilter === stat.filterStatus
                  ? 'border-brand-500 ring-1 ring-brand-500'
                  : 'border-border hover:border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    stat.color === 'blue' && 'bg-blue-500/10',
                    stat.color === 'purple' && 'bg-purple-500/10',
                    stat.color === 'amber' && 'bg-amber-500/10',
                    stat.color === 'emerald' && 'bg-emerald-500/10',
                    stat.color === 'teal' && 'bg-teal-500/10'
                  )}
                >
                  <stat.icon
                    className={cn(
                      'h-5 w-5',
                      stat.color === 'blue' && 'text-blue-500',
                      stat.color === 'purple' && 'text-purple-500',
                      stat.color === 'amber' && 'text-amber-500',
                      stat.color === 'emerald' && 'text-emerald-500',
                      stat.color === 'teal' && 'text-teal-500'
                    )}
                  />
                </div>
                <div>
                  <p className={cn('font-semibold text-foreground', stat.isMonetary ? 'text-lg' : 'text-xl')}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.button>
          ))}
      </div>

      {/* Pipeline Visual */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium text-foreground">Pipeline de Ventas</h3>
          <span className="text-xs text-muted-foreground sm:text-sm">
            Pipeline: <span className="font-semibold text-foreground">{formatCurrency(stats.pipelineValue)}</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:gap-1">
          {PIPELINE_STAGES.map((stage, index) => {
            const count = stats.byStatus[stage.status];
            const config = STATUS_CONFIG[stage.status];
            const isActive = statusFilter === stage.status;

            return (
              <div key={stage.status} className="flex min-w-0 flex-1 items-center">
                <button
                  onClick={() => setStatusFilter(isActive ? 'all' : stage.status)}
                  className={cn(
                    'flex flex-1 flex-col items-center rounded-lg px-1.5 py-2 transition-all sm:p-3',
                    isActive ? 'bg-brand-500/10 ring-1 ring-brand-500' : 'hover:bg-accent'
                  )}
                >
                  <span
                    className={cn(
                      'mb-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:mb-1 sm:h-8 sm:w-8 sm:text-sm',
                      config.bg,
                      config.text
                    )}
                  >
                    {count}
                  </span>
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground sm:text-xs">{stage.label}</span>
                </button>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground/50 sm:h-4 sm:w-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documento o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Document Type Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  docTypeFilter !== 'all'
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {docTypeFilter !== 'all' ? DOCUMENT_TYPE_LABELS[docTypeFilter] : 'Tipo'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={docTypeFilter !== 'all' ? [docTypeFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setDocTypeFilter(selected === docTypeFilter ? 'all' : (selected as DocTypeFilter));
              }}
            >
              <DropdownItem key="cotizacion">Cotización</DropdownItem>
              <DropdownItem key="pedido">Pedido</DropdownItem>
              <DropdownItem key="factura">Factura</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Status Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  statusFilter !== 'all'
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {statusFilter !== 'all' ? STATUS_CONFIG[statusFilter].label : 'Estado'}
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
              <DropdownItem key="borrador">Borrador</DropdownItem>
              <DropdownItem key="cotizado">Cotizado</DropdownItem>
              <DropdownItem key="pedido">Pedido</DropdownItem>
              <DropdownItem key="aprobado">Aprobado</DropdownItem>
              <DropdownItem key="empacado">Empacado</DropdownItem>
              <DropdownItem key="facturado">Facturado</DropdownItem>
              <DropdownItem key="cancelado">Cancelado</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Customer Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  selectedCustomer
                    ? 'bg-brand-500/10 text-brand-500'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {selectedCustomer
                  ? clients.find((c) => c.id === selectedCustomer)?.name.slice(0, 15) + '...'
                  : 'Cliente'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={selectedCustomer ? [selectedCustomer] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedCustomer(selected === selectedCustomer ? null : selected);
              }}
              className="max-h-64 overflow-auto"
            >
              {clients.slice(0, 20).map((client) => (
                <DropdownItem key={client.id}>{client.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 px-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  No. Doc
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cliente
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fecha
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Líneas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
                {/* Margin column - different display per role */}
                <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {canViewMargins ? 'Margen' : isVendedor ? 'Comisión' : ''}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order, index) => {
                const statusConfig = (STATUS_CONFIG as any)[order.status] || (STATUS_CONFIG as any).borrador;
                const docTypeLabel = order.documentType === 'cotizacion' ? 'COT' : order.documentType === 'pedido' ? 'PED' : 'FAC';

                // Check if all lines are commission eligible
                const allLinesEligible = order.lines.every((l: any) => l.commissionEligible);

                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="font-mono text-sm font-medium text-brand-500 hover:text-brand-600 hover:underline"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
                          order.documentType === 'cotizacion' && 'bg-blue-500/10 text-blue-500',
                          order.documentType === 'pedido' && 'bg-purple-500/10 text-purple-500',
                          order.documentType === 'factura' && 'bg-teal-500/10 text-teal-500'
                        )}
                      >
                        {docTypeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <span className="block max-w-32 truncate text-sm text-foreground sm:max-w-50">{order.clientName}</span>
                        <p className="text-xs text-muted-foreground">{order.clientCountry}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
                        {order.lines.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    {/* Margin/Commission column */}
                    <td className="hidden lg:table-cell px-4 py-3 text-center">
                      {canViewMargins ? (
                        <span className="font-mono text-sm text-muted-foreground">
                          {order.marginPercent?.toFixed(1)}%
                        </span>
                      ) : isVendedor ? (
                        <Tooltip
                          content={allLinesEligible ? "Por encima del 10%" : "Por debajo del 10%"}
                          placement="top"
                        >
                          <span
                            className={cn(
                              'inline-flex items-center justify-center h-6 w-6 rounded-full cursor-help',
                              allLinesEligible
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-red-500/10 text-red-500'
                            )}
                          >
                            {allLinesEligible
                              ? <CheckCircle2 className="h-4 w-4" />
                              : <XCircle className="h-4 w-4" />
                            }
                          </span>
                        </Tooltip>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
                          (STATUS_CONFIG as any)[order.status].bg,
                          (STATUS_CONFIG as any)[order.status].text
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', (STATUS_CONFIG as any)[order.status].dot)} />
                        {(STATUS_CONFIG as any)[order.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Acciones"
                          items={[
                            { key: 'view', label: 'Ver detalle', icon: Eye, action: () => handleViewOrder(order), show: true },
                            { key: 'send', label: 'Enviar cotización', icon: Send, action: () => handleUpdateStatus(order.id, 'cotizado'), show: order.status === 'borrador' },
                            { key: 'convert', label: 'Convertir a pedido', icon: CheckCircle2, action: () => handleUpdateStatus(order.id, 'pedido'), show: order.status === 'cotizado' },
                            { key: 'approve', label: 'Aprobar', icon: ThumbsUp, action: () => handleUpdateStatus(order.id, 'aprobado'), show: order.status === 'pedido' && canApproveOrders },
                            { key: 'edit', label: 'Editar', icon: Edit, action: () => handleViewOrder(order), show: order.status === 'borrador' },
                            { key: 'delete', label: 'Cancelar', icon: Trash2, action: () => handleDeleteOrder(order), show: !['facturado', 'cancelado'].includes(order.status), danger: true },
                          ].filter(item => item.show)}
                        >
                          {(item) => (
                            <DropdownItem
                              key={item.key}
                              startContent={<item.icon className="h-4 w-4" />}
                              className={item.danger ? 'text-danger' : ''}
                              color={item.danger ? 'danger' : 'default'}
                              onPress={item.action}
                            >
                              {item.label}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-medium text-foreground">No se encontraron documentos</h3>
          <p className="text-sm text-muted-foreground">Intenta ajustar los filtros o crea una nueva cotización</p>
        </div>
      )}

      {/* Results count */}
      {filteredOrders.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {filteredOrders.length} de {salesOrders.length} documentos
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} size="sm">
        <CustomModalHeader onClose={() => setIsDeleteOpen(false)}>Cancelar documento</CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <p className="text-muted-foreground">
            ¿Estás seguro de cancelar{' '}
            <span className="font-medium text-foreground">"{selectedOrder?.orderNumber}"</span>? Esta acción
            no se puede deshacer.
          </p>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsDeleteOpen(false)}>
            Volver
          </Button>
          <Button color="danger" onPress={confirmDelete}>
            Cancelar Documento
          </Button>
        </CustomModalFooter>
      </CustomModal>

    </div>
  );
}
