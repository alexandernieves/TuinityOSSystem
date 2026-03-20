'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  ShoppingCart,
  Truck,
  PackageCheck,
  DollarSign,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  X,
  Package,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { Pagination } from '@/components/ui/pagination';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderStats } from '@/lib/types/purchase-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { SkeletonTable } from '@/components/ui/skeleton-table';

type StatusFilter = PurchaseOrderStatus | 'all';

// Formateadores locales (en vez de mock-data)
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Status badge colors
const STATUS_CONFIG: Record<PurchaseOrderStatus, { bg: string; text: string; dot: string; label: string }> = {
  pendiente: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Pendiente' },
  en_transito: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', label: 'En Tránsito' },
  en_recepcion: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'En Recepción' },
  completada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completada' },
  cancelada: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelada' },
};

export default function ComprasPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewCosts = checkPermission('canViewCosts');

  // State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedBodega, setSelectedBodega] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [ordersData, suppliersData, bodegasData] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getWarehouses(), // En el backend se llaman warehouses
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
      setBodegas(bodegasData);
    } catch (error: any) {
      toast.error('Error al cargar datos', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Stats calculate from data
  const stats = useMemo<PurchaseOrderStats>(() => {
    const activeStates = ['pendiente', 'en_transito', 'en_recepcion'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      activeOrders: orders.filter(o => activeStates.includes(o.status)).length,
      inTransit: orders.filter(o => o.status === 'en_transito').length,
      receivedThisMonth: orders.filter(o => {
        if (o.status !== 'completada') return false;
        const d = new Date(o.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length,
      valueInTransit: orders.filter(o => o.status === 'en_transito')
        .reduce((acc, curr) => acc + (curr.totalFOB || 0), 0),
    };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.supplierName.toLowerCase().includes(searchLower) ||
        (order.supplierInvoice?.toLowerCase().includes(searchLower) ?? false);

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSupplier = !selectedSupplier || order.supplierId === selectedSupplier;
      const matchesBodega = !selectedBodega || order.bodegaId === selectedBodega;

      return matchesSearch && matchesStatus && matchesSupplier && matchesBodega;
    });
  }, [orders, searchQuery, statusFilter, selectedSupplier, selectedBodega]);

  // Handlers
  const handleViewOrder = (order: PurchaseOrder) => {
    router.push(`/compras/${order.id}`);
  };

  const handleDeleteOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOrder) {
      try {
        await api.updatePurchaseOrderStatus(selectedOrder.id, 'cancelada');
        toast.success('Orden cancelada', {
          description: `La orden ${selectedOrder.orderNumber} ha sido cancelada.`,
        });
        setIsDeleteOpen(false);
        setSelectedOrder(null);
        loadInitialData(); // Reload list
      } catch (error: any) {
        toast.error('Error al cancelar orden', { description: error.message });
      }
    }
  };

  const handleReceiveOrder = (order: PurchaseOrder) => {
    router.push(`/compras/${order.id}?action=receive`);
  };

  const handleExportOrders = () => {
    toast.success('Exportando órdenes', {
      description: 'El archivo Excel se descargará en breve.',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedSupplier(null);
    setSelectedBodega(null);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedSupplier || selectedBodega;

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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Compras</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleExportOrders}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => router.push('/compras/nueva')}
          >
            <Plus className="h-4 w-4" />
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Órdenes Activas',
            value: stats.activeOrders,
            icon: ShoppingCart,
            color: 'blue',
            filter: 'all' as StatusFilter,
          },
          {
            label: 'En Tránsito',
            value: stats.inTransit,
            icon: Truck,
            color: 'sky',
            filter: 'en_transito' as StatusFilter,
          },
          {
            label: 'Recibidas (Mes)',
            value: stats.receivedThisMonth,
            icon: PackageCheck,
            color: 'emerald',
            filter: 'completada' as StatusFilter,
          },
          {
            label: 'Valor en Tránsito',
            value: formatCurrency(stats.valueInTransit),
            icon: DollarSign,
            color: 'violet',
            filter: 'en_transito' as StatusFilter,
            isMonetary: true,
          },
        ].map((stat, index) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setStatusFilter(statusFilter === stat.filter ? 'all' : stat.filter)}
            className={cn(
              'rounded-[12px] border-none bg-white p-3 text-left transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:bg-[#f7f7f7]',
              statusFilter === stat.filter && 'ring-2 ring-blue-500 ring-offset-2'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  stat.color === 'blue' && 'bg-blue-50 dark:bg-blue-950',
                  stat.color === 'sky' && 'bg-sky-50 dark:bg-sky-950',
                  stat.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-950',
                  stat.color === 'violet' && 'bg-violet-50 dark:bg-violet-950'
                )}
              >
                <stat.icon
                  className={cn(
                    'h-5 w-5',
                    stat.color === 'blue' && 'text-blue-600',
                    stat.color === 'sky' && 'text-sky-600',
                    stat.color === 'emerald' && 'text-emerald-600',
                    stat.color === 'violet' && 'text-violet-600'
                  )}
                />
              </div>
              <div>
                <p className={cn('font-semibold text-gray-900 dark:text-white', stat.isMonetary ? 'text-lg' : 'text-xl')}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">{stat.label}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar orden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={statusFilter !== 'all' ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {statusFilter !== 'all' ? STATUS_CONFIG[statusFilter].label : 'Estado'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {['pendiente', 'en_transito', 'en_recepcion', 'completada', 'cancelada'].map((status) => (
                <DropdownMenuItem 
                  key={status} 
                  onClick={() => setStatusFilter(statusFilter === status ? 'all' : status as StatusFilter)}
                >
                  {STATUS_CONFIG[status as PurchaseOrderStatus].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Supplier Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedSupplier ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {selectedSupplier
                  ? suppliers.find((s) => s.id === selectedSupplier)?.name.slice(0, 15) + '...'
                  : 'Proveedor'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-auto w-64">
              {suppliers.map((supplier) => (
                <DropdownMenuItem 
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(selectedSupplier === supplier.id ? null : supplier.id)}
                >
                  {supplier.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bodega Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedBodega ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {selectedBodega
                  ? bodegas.find((b) => b.id === selectedBodega)?.name
                  : 'Bodega'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {bodegas.map((bodega) => (
                <DropdownMenuItem 
                  key={bodega.id}
                  onClick={() => setSelectedBodega(selectedBodega === bodega.id ? null : bodega.id)}
                >
                  {bodega.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  No. Orden
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Proveedor
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  No. Factura
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Productos
                </th>
                {canViewCosts && (
                  <>
                    <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Total FOB
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      %Gastos
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Total CIF
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Estado
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Llegada
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {filteredOrders.map((order, index) => {
                const statusConfig = STATUS_CONFIG[order.status];

                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="font-mono text-sm font-medium text-blue-600 dark:text-[#00D1B2] hover:text-blue-700 dark:hover:text-[#00E5C3] hover:underline"
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-24 truncate text-sm text-gray-900 dark:text-white sm:max-w-50">{order.supplierName}</span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <span className="font-mono text-sm text-gray-600 dark:text-gray-400 truncate">{order.supplierInvoice || '-'}</span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-[#2a2a2a] px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {order.lines.length}
                      </span>
                    </td>
                    {canViewCosts && (
                      <>
                        <td className="hidden md:table-cell px-4 py-3 text-right">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(order.totalFOB)}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {order.expensePercentage ? `${order.expensePercentage}%` : '-'}
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-right">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                            {order.totalCIF ? formatCurrency(order.totalCIF) : '-'}
                          </span>
                        </td>
                      </>
                    )}
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
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {order.expectedArrivalDate ? formatDate(order.expectedArrivalDate) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 dark:text-[#666666] hover:text-gray-600 dark:hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver detalle</span>
                          </DropdownMenuItem>
                          {(order.status === 'en_transito' || order.status === 'en_recepcion') && (
                            <DropdownMenuItem onClick={() => handleReceiveOrder(order)}>
                              <PackageCheck className="mr-2 h-4 w-4" />
                              <span>Recibir mercancía</span>
                            </DropdownMenuItem>
                          )}
                          {order.status === 'pendiente' && (
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                          )}
                          {(order.status !== 'completada' && order.status !== 'cancelada') && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteOrder(order)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Cancelar orden</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {
        filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
            <ShoppingCart className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No se encontraron órdenes</h3>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Intenta ajustar los filtros o crea una nueva orden</p>
          </div>
        )
      }

      {/* Results count */}
      {
        filteredOrders.length > 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
            Mostrando {filteredOrders.length} de {orders.length} órdenes
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar orden</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de cancelar la orden <span className="font-medium text-gray-900 dark:text-white">"{selectedOrder?.orderNumber}"</span>? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Recibir Mercancía
            </DialogTitle>
            <DialogDescription>
              Confirma los detalles de la recepción para actualizar inventario y costos.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950 p-4">
                <p className="text-sm text-sky-800 dark:text-sky-300">
                  Esta funcionalidad permitirá confirmar las cantidades recibidas, registrar los gastos de
                  internación y actualizar automáticamente el inventario y los costos promedio ponderados.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-[#888888]">Proveedor:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedOrder.supplierName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-[#888888]">Factura:</span>
                  <span className="ml-2 font-mono font-medium text-gray-900 dark:text-white">
                    {selectedOrder.supplierInvoice || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-[#888888]">Bodega:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedOrder.bodegaName}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-[#888888]">Productos:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedOrder.lines.length} líneas</span>
                </div>
              </div>

              {canViewCosts && (
                <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total FOB:</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {formatCurrency(selectedOrder.totalFOB)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success('Mercancía recibida', {
                  description: `La orden ${selectedOrder?.orderNumber} ha sido procesada.`,
                });
                setIsReceiveOpen(false);
              }}
            >
              Confirmar Recepción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
