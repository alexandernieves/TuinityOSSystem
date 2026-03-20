'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Switch } from '@/components/ui/switch';
import {
  Search,
  Plus,
  Warehouse,
  Package,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Truck,
  Clock,
  DollarSign,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  Edit,
  ClipboardList,
  ArrowRightLeft,
  MoreVertical,
  X,
  Calendar,
  FileText,
  Sparkles,
  Check,
  XCircle,
  Pencil,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_WAREHOUSES } from '@/lib/mock-data/warehouses'; import { PRODUCT_GROUPS, SEED_PRODUCTS, updateProduct } from '@/lib/mock-data/products';
import { generateRecommendations, getRecommendationStats } from '@/lib/utils/reorder-recommendation';
import type { ReorderRecommendation } from '@/lib/utils/reorder-recommendation';
import { getNearestExpiry } from '@/lib/mock-data/expiry-batches';
import { EXPIRY_ALERT_CONFIG } from '@/lib/types/expiry';
import type { InventoryItem, InventoryStockFilter } from '@/lib/types/inventory';
import { api } from '@/lib/services/api';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Pagination } from '@/components/ui/pagination';

// Inventory Items per page constant
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];

export default function InventarioPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewCosts = checkPermission('canViewCosts');
  const canViewSuppliers = checkPermission('canViewSuppliers');
  const canCreateAdjustments = checkPermission('canCreateAdjustments');
  const canCreateTransfers = checkPermission('canCreateTransfers');
  const canCreateCountSessions = checkPermission('canCreateCountSessions');
  const canViewInventoryAlerts = checkPermission('canViewInventoryAlerts');
  const canAcceptReorderRecommendations = checkPermission('canAcceptReorderRecommendations');
  const canViewExpiryAlerts = checkPermission('canViewExpiryAlerts');


  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<InventoryStockFilter>('all');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [realItems, setRealItems] = useState<any[]>([]);
  const [realAdjustments, setRealAdjustments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    Promise.all([
      api.getInventoryItems(),
      api.getAdjustments()
    ])
      .then(([items, adjustments]) => {
        setRealItems(items);
        setRealAdjustments(adjustments);
      })
      .catch(err => console.error('Error fetching inventory data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const normalizedItems = useMemo(() => {
    return realItems.map((item: any) => {
      const p = item.product || {};
      // Ensure we have a cost to see something in "Valor Total"
      // If costAvgWeighted is 0 or missing, we use costCIF or a fraction of price A
      const cost = Number(p.costAvgWeighted || p.costCIF || 0);
      const stockValue = item.existence * cost;

      const alerts = [];
      if (item.available === 0) alerts.push({ type: 'out_of_stock' as const, severity: 'danger' as const, message: 'Sin stock disponible', productId: p.id });
      else if (item.available <= (p.minimumQty || 5)) alerts.push({ type: 'low_stock' as const, severity: 'warning' as const, message: 'Stock bajo el mínimo', productId: p.id });

      return {
        productId: p.id,
        productReference: p.sku || p.reference || 'S/R',
        productDescription: p.description || p.name || 'Sin nombre',
        group: p.group?.name || p.category?.name || 'Varios',
        subGroup: p.subgroup?.name || p.subcategory?.name || 'General',
        brand: p.brand?.name || 'General',
        supplier: p.supplierName || 'Varios',
        warehouseId: 'ALL',
        warehouseName: 'Inventario Consolidado',
        existence: item.existence || 0,
        arriving: item.arriving || 0,
        reserved: item.reserved || 0,
        available: item.available || 0,
        minimumQty: p.minimumQty || p.minimumQuantity || 0,
        reorderPoint: p.reorderPoint,
        unitsPerCase: p.unitsPerCase || p.unitsPerBox || 1,
        lastPurchaseDate: p.lastPurchaseDate,
        lastSaleDate: p.lastSaleDate,
        costCIF: cost,
        price: Number(p.prices?.A || 0),
        stockValue: stockValue,
        productImage: p.image,
        alerts
      } as InventoryItem;
    });
  }, [realItems]);

  // Advanced filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stockRange, setStockRange] = useState({ min: '', max: '' });
  const [showOnlyWithAlerts, setShowOnlyWithAlerts] = useState(false);

  // F2: Reorder Recommendations
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState('');

  const recommendationStats = useMemo(() => getRecommendationStats(recommendations), [recommendations]);

  const handleOpenRecommendations = () => {
    const recs = generateRecommendations(SEED_PRODUCTS);
    setRecommendations(recs);
    setIsReorderModalOpen(true);
  };

  const handleAcceptRecommendation = (rec: ReorderRecommendation) => {
    updateProduct(rec.productId, { reorderPoint: rec.recommendedReorderPoint });
    setRecommendations((prev) =>
      prev.map((r) => r.productId === rec.productId ? { ...r, status: 'accepted' as const, currentReorderPoint: rec.recommendedReorderPoint, difference: 0 } : r)
    );
    toast.success(`Punto de reorden actualizado a ${rec.recommendedReorderPoint}`, { id: `reorder-accept-${rec.productId}` });
  };

  const handleAdjustRecommendation = (rec: ReorderRecommendation) => {
    if (adjustingId === rec.productId) {
      const val = parseInt(adjustValue, 10);
      if (!isNaN(val) && val >= 0) {
        updateProduct(rec.productId, { reorderPoint: val });
        setRecommendations((prev) =>
          prev.map((r) => r.productId === rec.productId ? { ...r, status: 'adjusted' as const, currentReorderPoint: val, difference: rec.recommendedReorderPoint - val } : r)
        );
        toast.success(`Punto de reorden ajustado a ${val}`, { id: `reorder-adjust-${rec.productId}` });
      }
      setAdjustingId(null);
      setAdjustValue('');
    } else {
      setAdjustingId(rec.productId);
      setAdjustValue(String(rec.recommendedReorderPoint));
    }
  };

  const handleRejectRecommendation = (rec: ReorderRecommendation) => {
    setRecommendations((prev) =>
      prev.map((r) => r.productId === rec.productId ? { ...r, status: 'rejected' as const } : r)
    );
    toast.info('Recomendación rechazada', { id: `reorder-reject-${rec.productId}` });
  };

  const handleAcceptAll = () => {
    const pending = recommendations.filter((r) => r.status === 'pending');
    pending.forEach((rec) => {
      updateProduct(rec.productId, { reorderPoint: rec.recommendedReorderPoint });
    });
    setRecommendations((prev) =>
      prev.map((r) => r.status === 'pending' ? { ...r, status: 'accepted' as const, currentReorderPoint: r.recommendedReorderPoint, difference: 0 } : r)
    );
    toast.success(`${pending.length} puntos de reorden actualizados`, { id: 'reorder-accept-all' });
  };

  // Get data
  const stats = useMemo(() => {
    const productsWithStock = normalizedItems.filter((i) => i.available > i.minimumQty).length;
    const belowMinimum = normalizedItems.filter((i) => i.available > 0 && i.available <= i.minimumQty).length;
    const belowReorderPoint = normalizedItems.filter((i) => i.reorderPoint != null && i.available <= i.reorderPoint).length;
    const outOfStock = normalizedItems.filter((i) => i.available === 0).length;
    const totalValue = normalizedItems.reduce((sum, i) => sum + i.stockValue, 0);
    const arrivingProducts = normalizedItems.filter((i) => i.arriving > 0).length;

    return {
      productsWithStock,
      belowMinimum,
      belowReorderPoint,
      outOfStock,
      stagnant4Months: 0,
      totalValue,
      pendingAdjustments: realAdjustments.filter((a) => a.status?.toLowerCase() === 'pendiente' || a.status === 'PENDING').length,
      arrivingProducts,
    };
  }, [normalizedItems, realAdjustments]);

  const pendingAdjustments = useMemo(() => {
    return realAdjustments.filter((a) => a.status === 'pendiente');
  }, [realAdjustments]);

  // Filter inventory items
  const inventoryItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const matchesSearch = !searchQuery ||
        item.productDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productReference.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGroup = !selectedGroup || item.group === selectedGroup;
      const matchesBrand = !selectedBrand || item.brand === selectedBrand;
      const matchesSupplier = !selectedSupplier || item.supplier === selectedSupplier;

      let matchesStock = true;
      if (stockFilter === 'out_of_stock') matchesStock = item.available === 0;
      else if (stockFilter === 'low_stock') matchesStock = item.available > 0 && item.available <= item.minimumQty;
      else if (stockFilter === 'in_stock') matchesStock = item.available > item.minimumQty;
      else if (stockFilter === 'below_reorder') matchesStock = item.reorderPoint != null && item.available <= item.reorderPoint;

      // Advanced filters
      const matchesMin = !stockRange.min || item.available >= parseFloat(stockRange.min);
      const matchesMax = !stockRange.max || item.available <= parseFloat(stockRange.max);
      const matchesAlerts = !showOnlyWithAlerts || item.alerts.length > 0;

      return matchesSearch && matchesGroup && matchesBrand && matchesSupplier && matchesStock && matchesMin && matchesMax && matchesAlerts;
    });
  }, [normalizedItems, searchQuery, stockFilter, selectedGroup, selectedBrand, selectedSupplier, stockRange, showOnlyWithAlerts]);

  // Paginación
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return inventoryItems.slice(startIndex, endIndex);
  }, [inventoryItems, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(inventoryItems.length / rowsPerPage);

  // Get unique brands from inventory
  const uniqueBrands = useMemo(() => {
    return [...new Set(normalizedItems.map((i) => i.brand))].sort();
  }, [normalizedItems]);

  // Get unique suppliers from inventory
  const uniqueSuppliers = useMemo(() => {
    return [...new Set(normalizedItems.map((i) => i.supplier))].sort();
  }, [normalizedItems]);

  // Get stock status for an item
  const getStockStatus = (item: InventoryItem) => {
    if (item.available === 0) {
      return { label: 'Sin Stock', color: 'bg-red-500', textColor: 'text-red-600', badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' };
    }
    if (item.reorderPoint != null && item.available <= item.reorderPoint) {
      return { label: 'Bajo Reorden', color: 'bg-amber-500', textColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' };
    }
    if (item.available <= item.minimumQty) {
      return { label: 'Stock Bajo', color: 'bg-amber-500', textColor: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' };
    }
    return { label: 'En Stock', color: 'bg-emerald-500', textColor: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' };
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStockFilter('all');
    setSelectedGroup(null);
    setSelectedBrand(null);
    setSelectedWarehouse(null);
    setSelectedSupplier(null);
    setStockRange({ min: '', max: '' });
    setShowOnlyWithAlerts(false);
  };

  const hasActiveFilters = searchQuery || stockFilter !== 'all' || selectedGroup || selectedBrand ||
    selectedWarehouse || selectedSupplier || stockRange.min || stockRange.max || showOnlyWithAlerts;

  // Navigation handlers
  const handleNewAdjustment = () => {
    router.push('/inventario/ajustes/nuevo');
  };

  const handleNewTransfer = () => {
    router.push('/inventario/transferencias/nueva');
  };

  const handleNewCount = () => {
    router.push('/inventario/conteo/nuevo');
  };

  const handleViewProduct = (item: InventoryItem) => {
    router.push(`/productos/${item.productId}`);
  };

  const handleCreateAdjustment = (item: InventoryItem) => {
    router.push(`/inventario/ajustes/nuevo?product=${item.productId}`);
  };

  const handleViewMovements = (item: InventoryItem) => {
    toast.info('Movimientos', {
      description: `Ver historial de movimientos de ${item.productDescription}`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SkeletonTable rows={5} columns={8} hasHeader={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Warehouse className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Inventario</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Control de stock, ajustes y transferencias</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCreateCountSessions && (
            <Button
              variant="secondary"
              onClick={handleNewCount}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Conteo Físico</span>
            </Button>
          )}
          {canCreateTransfers && (
            <Button
              variant="secondary"
              onClick={handleNewTransfer}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transferencia</span>
            </Button>
          )}
          {canCreateAdjustments && (
            <Button
              onClick={handleNewAdjustment}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Ajuste</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
        {[
          { label: 'Con Stock', value: stats.productsWithStock, icon: TrendingUp, color: 'emerald', filter: 'in_stock' as InventoryStockFilter },
          { label: 'Bajo Mínimo', value: stats.belowMinimum, icon: AlertTriangle, color: 'amber', filter: 'low_stock' as InventoryStockFilter },
          ...(canViewInventoryAlerts ? [{ label: 'Bajo Pto. Reorden', value: stats.belowReorderPoint, icon: Package, color: stats.belowReorderPoint > 0 ? 'amber' : 'emerald', filter: 'below_reorder' as InventoryStockFilter }] : []),
          { label: 'Sin Stock', value: stats.outOfStock, icon: AlertCircle, color: 'red', filter: 'out_of_stock' as InventoryStockFilter },
          { label: 'Estancados 4+', value: stats.stagnant4Months, icon: Clock, color: 'orange', filter: 'stagnant' as InventoryStockFilter },
          ...(canViewCosts ? [{ label: 'Valor Total', value: formatCurrency(stats.totalValue), icon: DollarSign, color: 'blue', filter: 'all' as InventoryStockFilter, isValue: true }] : []),
          { label: 'Ajustes Pend.', value: stats.pendingAdjustments, icon: FileText, color: stats.pendingAdjustments > 0 ? 'red' : 'gray', filter: 'all' as InventoryStockFilter, link: '/inventario/ajustes?status=pendiente' },
        ].map((stat, index) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              if (stat.link) {
                router.push(stat.link);
              } else if (!stat.isValue) {
                setStockFilter(stockFilter === stat.filter ? 'all' : stat.filter);
              }
            }}
            className={cn(
              'rounded-[12px] border-none bg-white p-3 text-left transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:bg-[#f7f7f7]',
              !stat.isValue && stockFilter === stat.filter && 'ring-2 ring-blue-500 ring-offset-2'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                stat.color === 'blue' && 'bg-blue-50 dark:bg-blue-950',
                stat.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-950',
                stat.color === 'amber' && 'bg-amber-50 dark:bg-amber-950',
                stat.color === 'red' && 'bg-red-50 dark:bg-red-950',
                stat.color === 'orange' && 'bg-orange-50 dark:bg-orange-950',
                stat.color === 'gray' && 'bg-gray-50 dark:bg-[#1a1a1a]'
              )}>
                <stat.icon className={cn(
                  'h-5 w-5',
                  stat.color === 'blue' && 'text-blue-600',
                  stat.color === 'emerald' && 'text-emerald-600',
                  stat.color === 'amber' && 'text-amber-600',
                  stat.color === 'red' && 'text-red-600',
                  stat.color === 'orange' && 'text-orange-600',
                  stat.color === 'gray' && 'text-gray-600'
                )} />
              </div>
              <div>
                <p className={cn(
                  'font-semibold text-gray-900 dark:text-white',
                  stat.isValue ? 'text-lg' : 'text-xl'
                )}>{stat.value}</p>
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
            placeholder="Buscar en inventario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={stockFilter !== 'all' ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {stockFilter === 'all' ? 'Ver todos' :
                  stockFilter === 'out_of_stock' ? 'Sin Stock' :
                    stockFilter === 'low_stock' ? 'Bajo Stock' : 'Disponible'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PRODUCT_GROUPS.map((group) => (
                <DropdownMenuItem 
                  key={group.id}
                  onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                >
                  {group.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Brand Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedBrand ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {selectedBrand || 'Marca'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-auto">
              {uniqueBrands.map((brand) => (
                <DropdownMenuItem 
                  key={brand}
                  onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                >
                  {brand}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Warehouse Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedWarehouse ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                {selectedWarehouse ? MOCK_WAREHOUSES.find((w) => w.id === selectedWarehouse)?.name : 'Bodega'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {MOCK_WAREHOUSES.map((warehouse) => (
                <DropdownMenuItem 
                  key={warehouse.id}
                  onClick={() => setSelectedWarehouse(selectedWarehouse === warehouse.id ? null : warehouse.id)}
                >
                  {warehouse.name} ({warehouse.type})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
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

          {/* Advanced filters button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border bg-white dark:bg-[#141414] transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
              (stockRange.min || stockRange.max || showOnlyWithAlerts || selectedSupplier)
                ? 'border-blue-500 text-blue-600'
                : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Producto</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Grupo</th>
                <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Existencia</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Disponible</th>
                <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Mínimo</th>
                {canViewInventoryAlerts && (
                  <th className="hidden xl:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Pto. Reorden</th>
                )}
                {canViewExpiryAlerts && (
                  <th className="hidden xl:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Venc. Próximo</th>
                )}
                {canViewCosts && (
                  <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Valor</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Precio</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Alerta</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {paginatedItems.map((item, index) => {
                const stockStatus = getStockStatus(item);

                return (
                  <motion.tr
                    key={`${item.productId}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-[#222222] sm:block">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productDescription} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-[#111111]">
                              <Package className="h-5 w-5 text-gray-400 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            onClick={() => router.push(`/productos/${item.productId}`)}
                          >
                            {item.productDescription}
                          </Button>
                          <p className="truncate text-xs text-blue-600 font-medium">{item.productReference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {typeof item.group === "object" && item.group !== null && (item.group as { name?: string }).name
                          ? (item.group as { name?: string }).name
                          : typeof item.group === "string"
                            ? item.group
                            : "Sin categoría"}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right text-sm">
                      {item.existence}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-sm font-bold', stockStatus.textColor)}>
                        {item.available}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right text-sm text-gray-500">
                      {item.minimumQty}
                    </td>
                    {canViewInventoryAlerts && (
                      <td className="hidden xl:table-cell px-4 py-3 text-right text-sm text-gray-500">
                        {item.reorderPoint ?? '-'}
                      </td>
                    )}
                    {canViewExpiryAlerts && (
                      <td className="hidden xl:table-cell px-4 py-3 text-center">
                        {(() => {
                          const expiry = getNearestExpiry(item.productId);
                          if (!expiry) return <span className="text-gray-300">-</span>;
                          const config = EXPIRY_ALERT_CONFIG[expiry.alertLevel];
                          return (
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', config.bg, config.text)}>
                              {expiry.daysUntilExpiry < 0 ? 'Vencido' : `${expiry.daysUntilExpiry}d`}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                    {canViewCosts && (
                      <td className="hidden lg:table-cell px-4 py-3 text-right text-sm font-semibold">
                        {formatCurrency(item.stockValue)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-sm font-semibold">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.alerts.map((alert, idx) => (
                          <span
                            key={idx}
                            title={alert.message}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full',
                              alert.type === 'out_of_stock' && 'bg-red-100',
                              alert.type === 'low_stock' && 'bg-amber-100',
                              alert.type === 'reorder_point' && 'bg-amber-100',
                              (alert.type === 'stagnant_4m' || alert.type === 'stagnant_6m') && 'bg-orange-100'
                            )}
                          >
                            {alert.type === 'out_of_stock' && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
                            {alert.type === 'low_stock' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                            {alert.type === 'reorder_point' && <Package className="h-3.5 w-3.5 text-amber-600" />}
                            {(alert.type === 'stagnant_4m' || alert.type === 'stagnant_6m') && <Clock className="h-3.5 w-3.5 text-orange-600" />}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProduct(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver detalle</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateAdjustment(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Crear ajuste</span>
                          </DropdownMenuItem>
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

      {/* Paginación */}
      {inventoryItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={inventoryItems.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setCurrentPage(1);
          }}
          itemName="productos"
        />
      )}

      {/* Empty State */}
      {
        inventoryItems.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
            <Package className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No se encontraron productos</h3>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Intenta ajustar los filtros o el término de búsqueda</p>
          </div>
        )
      }

      {/* Results count */}
      <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
        Mostrando {inventoryItems.length} productos en inventario
      </div>

      {/* Advanced Filters Modal */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Filtros Avanzados
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Stock Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rango de Stock Disponible</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="min-stock" className="text-xs text-gray-500">Mínimo</Label>
                  <Input
                    id="min-stock"
                    type="number"
                    placeholder="0"
                    value={stockRange.min}
                    onChange={(e) => setStockRange((prev) => ({ ...prev, min: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-stock" className="text-xs text-gray-500">Máximo</Label>
                  <Input
                    id="max-stock"
                    type="number"
                    placeholder="1000"
                    value={stockRange.max}
                    onChange={(e) => setStockRange((prev) => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Supplier - Role restricted */}
            {canViewSuppliers && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</Label>
                <Select
                  value={selectedSupplier || ""}
                  onValueChange={(val) => setSelectedSupplier(val || null)}
                >
                  <SelectTrigger className="bg-white dark:bg-[#1a1a1a]">
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSuppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show only with alerts */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Solo productos con alertas</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">Mostrar solo bajo stock, sin stock o estancados</p>
              </div>
              <Switch
                checked={showOnlyWithAlerts}
                onCheckedChange={setShowOnlyWithAlerts}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setStockRange({ min: '', max: '' });
                setSelectedSupplier(null);
                setShowOnlyWithAlerts(false);
              }}
            >
              Limpiar filtros
            </Button>
            <Button
              onClick={() => {
                toast.success('Filtros aplicados');
                setIsFilterOpen(false);
              }}
            >
              Aplicar filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* F2: Reorder Recommendations Modal */}
      <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Recomendaciones de Punto de Reorden
            </DialogTitle>
            <DialogDescription>
              Optimiza tus puntos de reorden basados en el historial de ventas y tendencias actuales.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* Stats Summary */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{recommendationStats.needsIncrease}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">Necesitan aumento</p>
              </div>
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3">
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{recommendationStats.needsDecrease}</p>
                <p className="text-xs text-red-600 dark:text-red-500">Necesitan reducción</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3">
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{recommendationStats.noChange}</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">Sin cambio</p>
              </div>
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{recommendationStats.notSet}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Sin configurar</p>
              </div>
            </div>

            {/* Recommendations Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Producto</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Grupo</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Mínimo Actual</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Recomendado</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Diferencia</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Confianza</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {recommendations.map((rec) => (
                      <tr
                        key={rec.productId}
                        className={cn(
                          'transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
                          rec.status === 'rejected' && 'opacity-50'
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <div className={cn(rec.status === 'rejected' && 'line-through')}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{rec.productDescription}</p>
                            <p className="text-xs text-gray-500 dark:text-[#888888]">{rec.productReference}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={cn('text-sm text-gray-600 dark:text-gray-400', rec.status === 'rejected' && 'line-through')}>
                            {typeof rec.group === "object" && rec.group !== null && (rec.group as { name?: string }).name
                              ? (rec.group as { name?: string }).name
                              : typeof rec.group === "string"
                                ? rec.group
                                : "Sin categoría"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={cn('text-sm font-medium', rec.currentReorderPoint != null ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-[#444444]')}>
                            {rec.currentReorderPoint ?? '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{rec.recommendedReorderPoint}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={cn(
                            'text-sm font-semibold',
                            rec.difference > 0 && 'text-emerald-600 dark:text-emerald-400',
                            rec.difference < 0 && 'text-red-600 dark:text-red-400',
                            rec.difference === 0 && 'text-gray-400 dark:text-[#666666]'
                          )}>
                            {rec.difference > 0 ? `+${rec.difference}` : rec.difference === 0 ? '0' : rec.difference}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                            rec.confidence === 'alta' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
                            rec.confidence === 'media' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                            rec.confidence === 'baja' && 'bg-gray-100 text-gray-600 dark:bg-[#1a1a1a] dark:text-[#888888]'
                          )}>
                            {rec.confidence}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {rec.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleAcceptRecommendation(rec)}
                                className="flex h-7 items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-colors hover:bg-emerald-200 dark:hover:bg-emerald-900"
                                title="Aceptar"
                              >
                                <Check className="h-3 w-3" />
                                Aceptar
                              </button>
                              {adjustingId === rec.productId ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={adjustValue}
                                    onChange={(e) => setAdjustValue(e.target.value)}
                                    className="h-7 w-16 px-2 text-xs"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdjustRecommendation(rec); if (e.key === 'Escape') { setAdjustingId(null); setAdjustValue(''); } }}
                                  />
                                  <button
                                    onClick={() => handleAdjustRecommendation(rec)}
                                    className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 transition-colors hover:bg-blue-200 dark:hover:bg-blue-900"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAdjustRecommendation(rec)}
                                  className="flex h-7 items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950 px-2 text-xs font-medium text-amber-700 dark:text-amber-400 transition-colors hover:bg-amber-200 dark:hover:bg-amber-900"
                                  title="Ajustar"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Ajustar
                                </button>
                              )}
                              <button
                                onClick={() => handleRejectRecommendation(rec)}
                                className="flex h-7 items-center gap-1 rounded-md bg-red-100 dark:bg-red-950 px-2 text-xs font-medium text-red-700 dark:text-red-400 transition-colors hover:bg-red-200 dark:hover:bg-red-900"
                                title="Rechazar"
                              >
                                <XCircle className="h-3 w-3" />
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                              rec.status === 'accepted' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
                              rec.status === 'adjusted' && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
                              rec.status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            )}>
                              {rec.status === 'accepted' && 'Aceptado'}
                              {rec.status === 'adjusted' && 'Ajustado'}
                              {rec.status === 'rejected' && 'Rechazado'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 gap-2 border-t">
            <Button
              variant="outline"
              onClick={() => setIsReorderModalOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={handleAcceptAll}
              disabled={recommendations.filter((r) => r.status === 'pending').length === 0}
            >
              Aceptar Todas ({recommendations.filter((r) => r.status === 'pending').length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
