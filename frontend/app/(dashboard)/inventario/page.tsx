'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
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

// Product images mapping
const PRODUCT_IMAGES: Record<string, string> = {
  'WHISKY': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=300&h=300&fit=crop',
  'RON': 'https://images.unsplash.com/photo-1598018553943-93a44e4e7af8?w=300&h=300&fit=crop',
  'VODKA': 'https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?w=300&h=300&fit=crop',
  'TEQUILA': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=300&h=300&fit=crop',
  'GINEBRA': 'https://images.unsplash.com/photo-1608885898957-a559228e8749?w=300&h=300&fit=crop',
  'VINO': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop',
  'LICOR': 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=300&h=300&fit=crop',
  'SNACKS': 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300&h=300&fit=crop',
  'CERVEZA': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop',
};

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
      const stockValue = item.existence * (p.costAvgWeighted || 0);

      const alerts = [];
      if (item.available === 0) alerts.push({ type: 'out_of_stock' as const, severity: 'danger' as const, message: 'Sin stock disponible', productId: p._id });
      else if (item.available <= (p.minimumQty || 5)) alerts.push({ type: 'low_stock' as const, severity: 'warning' as const, message: 'Stock bajo el mínimo', productId: p._id });

      return {
        productId: p._id,
        productReference: p.reference,
        productDescription: p.description,
        group: p.category,
        subGroup: p.subCategory || 'General',
        brand: p.brand || 'General',
        supplier: p.supplierName || 'Varios',
        warehouseId: 'WH-001', // Fallback
        warehouseName: 'Bodega Central', // Fallback
        existence: item.existence,
        arriving: item.arriving,
        reserved: item.reserved,
        available: item.available,
        minimumQty: p.minimumQty || 0,
        reorderPoint: p.reorderPoint,
        unitsPerCase: p.unitsPerCase || 1,
        lastPurchaseDate: p.lastPurchaseDate,
        lastSaleDate: p.lastSaleDate,
        costCIF: p.costAvgWeighted || 0,
        stockValue: stockValue,
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
      pendingAdjustments: realAdjustments.filter((a) => a.status === 'pendiente').length,
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

      // Advanced filters
      const matchesMin = !stockRange.min || item.available >= parseFloat(stockRange.min);
      const matchesMax = !stockRange.max || item.available <= parseFloat(stockRange.max);
      const matchesAlerts = !showOnlyWithAlerts || item.alerts.length > 0;

      return matchesSearch && matchesGroup && matchesBrand && matchesSupplier && matchesStock && matchesMin && matchesMax && matchesAlerts;
    });
  }, [normalizedItems, searchQuery, stockFilter, selectedGroup, selectedBrand, selectedSupplier, stockRange, showOnlyWithAlerts]);

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <Warehouse className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Inventario</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Control de stock, ajustes y transferencias</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAcceptReorderRecommendations && (
            <button
              onClick={handleOpenRecommendations}
              className="flex h-9 items-center gap-2 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 px-3 text-sm font-medium text-purple-700 dark:text-purple-300 transition-colors hover:bg-purple-100 dark:hover:bg-purple-950/50"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Recomendaciones IA</span>
              <span className="sm:hidden">IA</span>
            </button>
          )}
          {canCreateCountSessions && (
            <button
              onClick={handleNewCount}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Conteo Físico</span>
            </button>
          )}
          {canCreateTransfers && (
            <button
              onClick={handleNewTransfer}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Transferencia</span>
            </button>
          )}
          {canCreateAdjustments && (
            <button
              onClick={handleNewAdjustment}
              className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Ajuste</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
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
              'rounded-xl border bg-white dark:bg-[#141414] p-3 text-left transition-all hover:shadow-md',
              !stat.isValue && stockFilter === stat.filter
                ? 'border-brand-500 ring-1 ring-brand-500'
                : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
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
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                selectedGroup ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
              )}>
                {selectedGroup || 'Categoría'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={selectedGroup ? [selectedGroup] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedGroup(selected === selectedGroup ? null : selected);
              }}
              classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
            >
              {PRODUCT_GROUPS.map((group) => (
                <DropdownItem key={group.id}>{group.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Brand Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                selectedBrand ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
              )}>
                {selectedBrand || 'Marca'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={selectedBrand ? [selectedBrand] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedBrand(selected === selectedBrand ? null : selected);
              }}
              className="max-h-64 overflow-auto"
              classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
            >
              {uniqueBrands.map((brand) => (
                <DropdownItem key={brand}>{brand}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Warehouse Filter */}
          <Dropdown>
            <DropdownTrigger>
              <button className={cn(
                'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                selectedWarehouse ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
              )}>
                {selectedWarehouse ? MOCK_WAREHOUSES.find((w) => w.id === selectedWarehouse)?.name : 'Bodega'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={selectedWarehouse ? [selectedWarehouse] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedWarehouse(selected === selectedWarehouse ? null : selected);
              }}
              classNames={{ base: 'bg-white border border-gray-200 shadow-lg' }}
            >
              {MOCK_WAREHOUSES.map((warehouse) => (
                <DropdownItem key={warehouse.id}>
                  {warehouse.name} ({warehouse.type})
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}

          {/* Advanced filters button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border bg-white dark:bg-[#141414] transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
              (stockRange.min || stockRange.max || showOnlyWithAlerts || selectedSupplier)
                ? 'border-brand-500 text-brand-600'
                : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Producto</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Grupo</th>
                <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Existencia</th>
                <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Por Llegar</th>
                <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Separado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Disponible</th>
                <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Mínimo</th>
                {canViewInventoryAlerts && (
                  <th className="hidden xl:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Pto. Reorden</th>
                )}
                {canViewExpiryAlerts && (
                  <th className="hidden xl:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Venc. Próximo</th>
                )}
                <th className="hidden xl:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Últ. Compra</th>
                <th className="hidden xl:table-cell px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Últ. Venta</th>
                {canViewCosts && (
                  <>
                    <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Costo CIF</th>
                    <th className="hidden lg:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Valor</th>
                  </>
                )}
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Alerta</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {inventoryItems.map((item, index) => {
                const stockStatus = getStockStatus(item);
                const imageUrl = PRODUCT_IMAGES[item.group] || PRODUCT_IMAGES['WHISKY'];
                const hasStagnantAlert = item.alerts.some((a) => a.type === 'stagnant_4m' || a.type === 'stagnant_6m');

                return (
                  <motion.tr
                    key={item.productId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-[#1a1a1a] sm:block">
                          <img src={imageUrl} alt={item.productDescription} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => handleViewProduct(item)}
                            className="block max-w-28 truncate text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-[#00D1B2] sm:max-w-xs"
                          >
                            {item.productDescription}
                          </button>
                          <p className="truncate text-xs text-gray-500 dark:text-[#888888]">{item.productReference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.group}</span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.existence}</span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right">
                      <span className={cn('text-sm', item.arriving > 0 ? 'font-medium text-sky-600' : 'text-gray-400 dark:text-[#666666]')}>
                        {item.arriving || '-'}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right">
                      <span className={cn('text-sm', item.reserved > 0 ? 'font-medium text-amber-600' : 'text-gray-400 dark:text-[#666666]')}>
                        {item.reserved || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-nowrap items-center justify-end gap-2">
                        <span className={cn('text-sm font-semibold', stockStatus.textColor)}>
                          {item.available}
                        </span>
                        {canViewInventoryAlerts && stockStatus.label !== 'En Stock' && (
                          <span className={cn('inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium', stockStatus.badge)}>
                            {stockStatus.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.minimumQty}</span>
                    </td>
                    {canViewInventoryAlerts && (
                      <td className="hidden xl:table-cell px-4 py-3 text-right">
                        <span className={cn(
                          'text-sm',
                          item.reorderPoint != null ? 'text-gray-600 dark:text-gray-400' : 'text-gray-300 dark:text-[#444444]'
                        )}>
                          {item.reorderPoint ?? '-'}
                        </span>
                      </td>
                    )}
                    {canViewExpiryAlerts && (() => {
                      const expiry = getNearestExpiry(item.productId);
                      if (!expiry) {
                        return (
                          <td className="hidden xl:table-cell px-4 py-3 text-center">
                            <span className="text-gray-300 dark:text-[#444444]">-</span>
                          </td>
                        );
                      }
                      const config = EXPIRY_ALERT_CONFIG[expiry.alertLevel];
                      return (
                        <td className="hidden xl:table-cell px-4 py-3 text-center">
                          <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', config.bg, config.text)}>
                            {expiry.daysUntilExpiry < 0
                              ? 'Vencido'
                              : `${expiry.daysUntilExpiry}d`}
                          </span>
                        </td>
                      );
                    })()}
                    <td className="hidden xl:table-cell px-4 py-3 text-center">
                      <span className="text-xs text-gray-500 dark:text-[#888888]">{formatDate(item.lastPurchaseDate)}</span>
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3 text-center">
                      <span className="text-xs text-gray-500 dark:text-[#888888]">{formatDate(item.lastSaleDate)}</span>
                    </td>
                    {canViewCosts && (
                      <>
                        <td className="hidden lg:table-cell px-4 py-3 text-right">
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-400">{formatCurrency(item.costCIF)}</span>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-right">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.stockValue)}</span>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.alerts.map((alert, idx) => (
                          <span
                            key={idx}
                            title={alert.message}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full',
                              alert.type === 'out_of_stock' && 'bg-red-100 dark:bg-red-950',
                              alert.type === 'low_stock' && 'bg-amber-100 dark:bg-amber-950',
                              alert.type === 'reorder_point' && 'bg-amber-100 dark:bg-amber-950',
                              (alert.type === 'stagnant_4m' || alert.type === 'stagnant_6m') && 'bg-orange-100 dark:bg-orange-950'
                            )}
                          >
                            {alert.type === 'out_of_stock' && <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />}
                            {alert.type === 'low_stock' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                            {alert.type === 'reorder_point' && <Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                            {(alert.type === 'stagnant_4m' || alert.type === 'stagnant_6m') && <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
                          </span>
                        ))}
                        {item.alerts.length === 0 && (
                          <span className="text-gray-300 dark:text-[#444444]">-</span>
                        )}
                      </div>
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
                            { key: 'view', label: 'Ver producto', icon: Eye, action: () => handleViewProduct(item), show: true },
                            { key: 'adjust', label: 'Crear ajuste', icon: Edit, action: () => handleCreateAdjustment(item), show: canCreateAdjustments },
                            { key: 'movements', label: 'Ver movimientos', icon: Calendar, action: () => handleViewMovements(item), show: true },
                          ].filter((menuItem) => menuItem.show)}
                        >
                          {(menuItem) => (
                            <DropdownItem key={menuItem.key} startContent={<menuItem.icon className="h-4 w-4" />} onPress={menuItem.action}>
                              {menuItem.label}
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
      {inventoryItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
          <Package className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No se encontraron productos</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Intenta ajustar los filtros o el término de búsqueda</p>
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
        Mostrando {inventoryItems.length} productos en inventario
      </div>

      {/* Advanced Filters Modal */}
      <CustomModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsFilterOpen(false)}>
          <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          Filtros Avanzados
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-6">
            {/* Stock Range */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Rango de Stock Disponible</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mínimo</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={stockRange.min}
                    onChange={(e) => setStockRange((prev) => ({ ...prev, min: e.target.value }))}
                    variant="bordered"
                    classNames={{ inputWrapper: 'bg-white' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Máximo</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={stockRange.max}
                    onChange={(e) => setStockRange((prev) => ({ ...prev, max: e.target.value }))}
                    variant="bordered"
                    classNames={{ inputWrapper: 'bg-white' }}
                  />
                </div>
              </div>
            </div>

            {/* Supplier - Role restricted */}
            {canViewSuppliers && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor</h3>
                <Select
                  placeholder="Todos los proveedores"
                  selectedKeys={selectedSupplier ? [selectedSupplier] : []}
                  onChange={(e) => setSelectedSupplier(e.target.value || null)}
                  variant="bordered"
                  classNames={{ trigger: 'bg-white' }}
                >
                  {uniqueSuppliers.map((supplier) => (
                    <SelectItem key={supplier}>{supplier}</SelectItem>
                  ))}
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
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="light"
            onPress={() => {
              setStockRange({ min: '', max: '' });
              setSelectedSupplier(null);
              setShowOnlyWithAlerts(false);
            }}
          >
            Limpiar filtros
          </Button>
          <Button
            color="primary"
            onPress={() => {
              toast.success('Filtros aplicados');
              setIsFilterOpen(false);
            }}
            className="bg-brand-600"
          >
            Aplicar filtros
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* F2: Reorder Recommendations Modal */}
      <CustomModal isOpen={isReorderModalOpen} onClose={() => setIsReorderModalOpen(false)} size="3xl" scrollable>
        <CustomModalHeader onClose={() => setIsReorderModalOpen(false)}>
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Recomendaciones de Punto de Reorden
        </CustomModalHeader>
        <CustomModalBody>
          {/* Stats Summary */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
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
                      <span className={cn('text-sm text-gray-600 dark:text-gray-400', rec.status === 'rejected' && 'line-through')}>{rec.group}</span>
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
                              <input
                                type="number"
                                value={adjustValue}
                                onChange={(e) => setAdjustValue(e.target.value)}
                                className="h-7 w-16 rounded-md border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-xs text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdjustRecommendation(rec); if (e.key === 'Escape') { setAdjustingId(null); setAdjustValue(''); } }}
                              />
                              <button
                                onClick={() => handleAdjustRecommendation(rec)}
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 transition-colors hover:bg-brand-200 dark:hover:bg-brand-900"
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
                          rec.status === 'adjusted' && 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400',
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
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="light"
            onPress={() => setIsReorderModalOpen(false)}
          >
            Cerrar
          </Button>
          <Button
            color="primary"
            className="bg-brand-600"
            onPress={handleAcceptAll}
            isDisabled={recommendations.filter((r) => r.status === 'pending').length === 0}
          >
            Aceptar Todas ({recommendations.filter((r) => r.status === 'pending').length})
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
