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
  Tooltip,
} from '@heroui/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { STATUS_CONFIG, DOCUMENT_TYPE_LABELS, normalizeStatus } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { SkeletonTable } from '@/components/ui/skeleton-table';

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
    const normalizedOrders = salesOrders.map(o => ({ ...o, status: normalizeStatus(o.status) }));

    const pendingQuotes = normalizedOrders.filter(o => o.status === 'cotizado').length;
    const pendingApproval = normalizedOrders.filter(o => o.status === 'pedido').length;
    const readyToPack = normalizedOrders.filter(o => o.status === 'aprobado').length;
    const readyToInvoice = normalizedOrders.filter(o => o.status === 'empacado').length;
    const salesValueThisMonth = normalizedOrders
      .filter(o => o.status === 'facturado')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pipelineValue = normalizedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const byStatus: Record<string, number> = {
      borrador: normalizedOrders.filter(o => o.status === 'borrador').length,
      cotizado: pendingQuotes,
      pedido: pendingApproval,
      aprobado: readyToPack,
      empacado: readyToInvoice,
      facturado: normalizedOrders.filter(o => o.status === 'facturado').length,
      cancelado: normalizedOrders.filter(o => o.status === 'cancelado').length,
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
      <div className="space-y-5">
        <SkeletonTable rows={5} columns={8} hasHeader={true} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Ventas B2B</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportOrders}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          {canCreateQuotes && (
            <Button
              onClick={() => router.push('/ventas/nueva')}
            >
              <Plus className="h-4 w-4" />
              Nueva Cotización
            </Button>
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
                'rounded-[12px] border-none bg-white p-3 text-left transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:bg-[#f7f7f7]',
                statusFilter === stat.filterStatus && 'ring-2 ring-brand-500 ring-offset-2'
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
      <Card className="p-4 mb-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium text-foreground">Pipeline de Ventas</h3>
          <span className="text-xs text-muted-foreground sm:text-sm">
            Pipeline: <span className="font-semibold text-foreground">{formatCurrency(stats.pipelineValue)}</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:gap-1">
          {PIPELINE_STAGES.map((stage, index) => {
            const count = stats.byStatus[stage.status];
            const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.borrador;
            const isActive = statusFilter === stage.status;

            return (
              <div key={stage.status} className="flex min-w-0 flex-1 items-center">
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => setStatusFilter(isActive ? 'all' : stage.status)}
                  className={cn(
                    'flex flex-1 flex-col items-center h-auto px-1.5 py-4 transition-all sm:px-3',
                    isActive ? 'ring-2 ring-brand-500 ring-offset-2' : ''
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
                  <span className="whitespace-nowrap text-[10px] sm:text-xs">{stage.label}</span>
                </Button>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground/50 sm:h-4 sm:w-4" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

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
              <Button
                variant={docTypeFilter !== 'all' ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {docTypeFilter !== 'all' ? DOCUMENT_TYPE_LABELS[docTypeFilter] : 'Tipo'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
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
              <Button
                variant={statusFilter !== 'all' ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {statusFilter !== 'all' ? (STATUS_CONFIG[statusFilter]?.label || statusFilter) : 'Estado'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
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
              <Button
                variant={selectedCustomer ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {selectedCustomer
                  ? clients.find((c) => c.id === selectedCustomer)?.name.slice(0, 15) + '...'
                  : 'Cliente'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 h-9 px-2 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#1a1a1a]">
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">No. Doc</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Fecha</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Cliente</th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center whitespace-nowrap">Tipo</th>
                {canViewMargins && (
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Total</th>
                )}
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Estado</th>
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                >
                  <td className="px-5 py-4">
                    <Button
                      variant="link"
                      className="p-0 h-auto font-bold text-brand-600 dark:text-brand-400"
                      onClick={() => handleViewOrder(order)}
                    >
                      {order.orderNumber}
                    </Button>
                    {order.salesChannel === 'canal_externo' && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        <Briefcase className="h-2.5 w-2.5" />
                        Tráfico
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{formatDate(order.createdAt)}</span>
                      <span className="text-[10px] text-muted-foreground">por {order.createdBy.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-secondary">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[140px] md:max-w-[200px]" title={order.clientName}>
                          {order.clientName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{order.clientReference || 'Ref: -'}</span>
                          {getCreditStatus(order.clientId).status === 'warning' && (
                            <Tooltip content="Mora en crédito" color="warning" size="sm">
                              <AlertTriangle className="h-3 w-3 text-warning" />
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={cn(
                      'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      order.documentType === 'cotizacion'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    )}>
                      {DOCUMENT_TYPE_LABELS[order.documentType as DocumentType]}
                    </span>
                  </td>
                  {canViewMargins && (
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(order.total)}</span>
                    </td>
                  )}
                  <td className="px-5 py-4 text-center">
                    <div className="flex justify-center">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                        STATUS_CONFIG[order.status]?.bg || 'bg-gray-100',
                        STATUS_CONFIG[order.status]?.text || 'text-gray-700'
                      )}>
                        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', STATUS_CONFIG[order.status]?.dot || 'bg-gray-500')} />
                        {STATUS_CONFIG[order.status]?.label || order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Acciones de venta"
                        items={[
                          { key: 'view', label: 'Ver documento', icon: Eye, action: () => handleViewOrder(order), show: true },
                          { key: 'print', label: 'Imprimir', icon: Download, action: () => { }, show: true },
                          { key: 'delete', label: 'Cancelar', icon: Trash2, action: () => handleDeleteOrder(order), show: order.status !== 'facturado' && order.status !== 'cancelada', danger: true },
                        ].filter(i => i.show)}
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
          <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
            Volver
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Cancelar Documento
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}

