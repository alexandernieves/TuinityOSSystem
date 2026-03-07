'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
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
          <button
            onClick={handleExportOrders}
            className="flex h-9 items-center gap-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={() => router.push('/compras/nueva')}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" />
            Nueva Orden
          </button>
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
              'rounded-xl border bg-white dark:bg-[#141414] p-3 text-left transition-all hover:shadow-md',
              statusFilter === stat.filter
                ? 'border-brand-500 ring-1 ring-brand-500'
                : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
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
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  statusFilter !== 'all'
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
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
              classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
            >
              <DropdownItem key="pendiente">Pendiente</DropdownItem>
              <DropdownItem key="en_transito">En Tránsito</DropdownItem>
              <DropdownItem key="en_recepcion">En Recepción</DropdownItem>
              <DropdownItem key="completada">Completada</DropdownItem>
              <DropdownItem key="cancelada">Cancelada</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Supplier Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  selectedSupplier
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                )}
              >
                {selectedSupplier
                  ? suppliers.find((s) => s.id === selectedSupplier)?.name.slice(0, 15) + '...'
                  : 'Proveedor'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={selectedSupplier ? [selectedSupplier] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedSupplier(selected === selectedSupplier ? null : selected);
              }}
              classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
            >
              {suppliers.map((supplier) => (
                <DropdownItem key={supplier.id}>{supplier.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Bodega Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  selectedBodega
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
                )}
              >
                {selectedBodega
                  ? bodegas.find((b) => b.id === selectedBodega)?.name
                  : 'Bodega'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={selectedBodega ? [selectedBodega] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedBodega(selected === selectedBodega ? null : selected);
              }}
              classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
            >
              {bodegas.map((bodega) => (
                <DropdownItem key={bodega.id}>{bodega.name}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

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
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
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
                        className="font-mono text-sm font-medium text-brand-600 dark:text-[#00D1B2] hover:text-brand-700 dark:hover:text-[#00E5C3] hover:underline"
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
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-[#666666] transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Acciones"
                          classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
                          items={[
                            { key: 'view', label: 'Ver detalle', icon: Eye, action: () => handleViewOrder(order), show: true },
                            { key: 'receive', label: 'Recibir mercancía', icon: PackageCheck, action: () => handleReceiveOrder(order), show: order.status === 'en_transito' || order.status === 'en_recepcion' },
                            { key: 'edit', label: 'Editar', icon: Edit, action: () => handleViewOrder(order), show: order.status === 'pendiente' },
                            { key: 'delete', label: 'Cancelar orden', icon: Trash2, action: () => handleDeleteOrder(order), show: order.status !== 'completada' && order.status !== 'cancelada', danger: true },
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
          <ShoppingCart className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No se encontraron órdenes</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Intenta ajustar los filtros o crea una nueva orden</p>
        </div>
      )}

      {/* Results count */}
      {filteredOrders.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
          Mostrando {filteredOrders.length} de {orders.length} órdenes
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} size="sm">
        <CustomModalHeader onClose={() => setIsDeleteOpen(false)}>Cancelar orden</CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Estás seguro de cancelar la orden{' '}
            <span className="font-medium text-gray-900 dark:text-white">"{selectedOrder?.orderNumber}"</span>? Esta acción
            no se puede deshacer.
          </p>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsDeleteOpen(false)}>
            Volver
          </Button>
          <Button color="danger" onPress={confirmDelete}>
            Cancelar Orden
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Receive Merchandise Modal - Simplified for now */}
      <CustomModal isOpen={isReceiveOpen} onClose={() => setIsReceiveOpen(false)} size="2xl">
        <CustomModalHeader onClose={() => setIsReceiveOpen(false)}>
          <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Recibir Mercancía
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
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
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsReceiveOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onPress={() => {
              toast.success('Mercancía recibida', {
                description: `La orden ${selectedOrder?.orderNumber} ha sido procesada.`,
              });
              setIsReceiveOpen(false);
            }}
          >
            Confirmar Recepción
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
