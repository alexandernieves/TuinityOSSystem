"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Upload,
  Download,
  LayoutGrid,
  List,
  MoreVertical,
  Package,
  AlertTriangle,
  TrendingUp,
  Truck,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  Edit,
  Copy,
  ToggleLeft,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
  FileSpreadsheet,
  DownloadCloud,
  FileCheck2,
  Loader2,
  FileText,
  Filter
} from "lucide-react";
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/lib/contexts/auth-context';
import { useAlerts } from "@/components/providers/alert-provider";
import { PRODUCT_GROUPS, Product } from "@/lib/mock-data/products";
import { MOCK_SUPPLIERS } from "@/lib/mock-data/purchase-orders";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import { DataTable } from "@/components/ui/data-table";
import { getProductColumns } from "./columns";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { TransferModal } from "./TransferModal";

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function ProductCard({
  product,
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: ProductCardProps) {
  const stockInfo = (function getStockStatus(product: Product) {
    const available = product.stock?.available || 0;
    const minimumQty = product.minimumQty || 0;
    if (available === 0) return { 
      label: "Sin Stock", 
      color: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300", 
      dotColor: "bg-red-500",
      icon: XCircle 
    };
    if (available <= minimumQty) return { 
      label: "Stock Bajo", 
      color: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", 
      dotColor: "bg-amber-500",
      icon: AlertCircle 
    };
    return { 
      label: "En Stock", 
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300", 
      dotColor: "bg-emerald-500",
      icon: CheckCircle2 
    };
  })(product);

  const StatusIcon = product.status === "active" ? CheckCircle2 : Ban;
  const StockIcon = stockInfo.icon;

  const getLabel = (value: any) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return value.name || value.label || value.code || 'Desconocido';
    }
    return '-';
  };

  const groupLabel = getLabel(product.group);
  const brandLabel = getLabel(product.brand);
  const groupKey = (product.group && typeof product.group === 'object') 
    ? ((product.group as any).id || (product.group as any).code) 
    : product.group;

  const imageUrl = product.image || PRODUCT_IMAGES[groupKey as string];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/2] w-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.description}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50/50 dark:bg-black/20">
             <div className="flex flex-col items-center gap-1 opacity-20">
                <Package className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Sin Imagen</span>
             </div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1 items-end pointer-events-none">
          <div 
            className={cn(
              "border-none flex items-center gap-1.5 px-2 py-0.5 h-auto font-black uppercase tracking-widest text-[8px] rounded-md backdrop-blur-md shadow-sm",
              stockInfo.color
            )}
          >
            <StockIcon className="h-2.5 w-2.5" />
            {stockInfo.label}
          </div>
          <div 
            className={cn(
              "border-none flex items-center gap-1.5 px-2 py-0.5 h-auto font-black uppercase tracking-widest text-[8px] rounded-md backdrop-blur-md shadow-sm",
              product.status === "active" 
                ? "bg-blue-50/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" 
                : "bg-gray-100/80 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300"
            )}
          >
            <StatusIcon className="h-2.5 w-2.5" />
            {product.status === "active" ? "Activo" : "Inactivo"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1 leading-tight tracking-tight">
            {product.description}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="text-xl font-black text-[#253D6B] dark:text-blue-400 flex items-baseline gap-0.5">
              <span className="text-xs font-bold">$</span>
              {(product.prices?.A || 0).toFixed(2)}
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                REF: {product.reference}
              </span>
              <span className="text-[9px] font-black text-blue-500/60 dark:text-blue-400/40 uppercase tracking-tighter">
                {brandLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full transition-all", (stockInfo as any).dotColor)} />
            <span className="text-xs font-black text-gray-800 dark:text-gray-200">
              {product.stock.available} <span className="text-[10px] text-gray-500 font-normal uppercase">Unidades</span>
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-brand-500 hover:bg-brand-50/50"
              onClick={() => onView(product)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-brand-500 hover:bg-brand-50/50"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-brand-500 hover:bg-brand-50/50"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-gray-200 dark:border-white/5">
                <DropdownMenuItem onClick={() => onDuplicate(product)} className="rounded-lg">
                  <Copy className="mr-2 h-3 w-3" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-white/5" />
                <DropdownMenuItem 
                   onClick={() => onToggleStatus(product)}
                   className="rounded-lg"
                >
                  <ToggleLeft className="mr-2 h-3 w-3" />
                  {product.status === "active" ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-white/5" />
                <DropdownMenuItem 
                  onClick={() => onDelete(product)}
                  className="text-red-600 focus:text-red-600 rounded-lg"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type ViewMode = "grid" | "list";
type StockFilter = "all" | "inStock" | "lowStock" | "outOfStock" | "arriving";

// Product images mapping
const PRODUCT_IMAGES: Record<string, string> = {
  WHISKY:
    "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=300&h=300&fit=crop",
  RON: "https://images.unsplash.com/photo-1598018553943-93a44e4e7af8?w=300&h=300&fit=crop",
  VODKA:
    "https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?w=300&h=300&fit=crop",
  TEQUILA:
    "https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=300&h=300&fit=crop",
  GINEBRA:
    "https://images.unsplash.com/photo-1608885898957-a559228e8749?w=300&h=300&fit=crop",
  VINO: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop",
  LICOR:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=300&h=300&fit=crop",
  SNACKS:
    "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=300&h=300&fit=crop",
  CERVEZA:
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop",
};

export default function ProductosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportSearchQuery, setExportSearchQuery] = useState('');
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set());
  const [rowSelection, setRowSelection] = useState({});
  const [selectedProductsForBulk, setSelectedProductsForBulk] = useState<Product[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Advanced filters state
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockRange, setStockRange] = useState({ min: "", max: "" });
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    loadProducts();
    loadWarehouses();
  }, [selectedWarehouse]);

  const loadWarehouses = async () => {
    try {
      const data = await api.getWarehouses();
      setWarehouses(data);
    } catch (err: any) {
      console.error("Error loading warehouses:", err);
    }
  };

  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery, stockFilter, selectedGroup, selectedBrand, priceRange, stockRange, selectedSupplier, statusFilter]);

  const { success: alertSuccess, error: alertError, info: alertInfo } = useAlerts();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(selectedWarehouse || undefined);
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
      alertError("Error al cargar productos", err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(
      (p) => (p.stock?.available || 0) === 0,
    ).length;
    const lowStock = products.filter(
      (p) =>
        (p.stock?.available || 0) > 0 &&
        (p.stock?.available || 0) <= (p.minimumQty || 0),
    ).length;
    const arriving = products.filter(
      (p) => (p.stock?.arriving || 0) > 0,
    ).length;

    return { total, outOfStock, lowStock, arriving };
  }, [products]);

  // helper tool to extract label from Brand/Group object or string
  const getDisplayLabel = (value: any) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return value.name || value.label || value.code || '';
    }
    return '';
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchQuery.toLowerCase();
      const brandLabel = getDisplayLabel(product.brand);
      const groupLabel = getDisplayLabel(product.group);

      const matchesSearch =
        !searchQuery ||
        (product.description?.toLowerCase().includes(searchLower) ?? false) ||
        (brandLabel?.toLowerCase().includes(searchLower) ?? false) ||
        (groupLabel?.toLowerCase().includes(searchLower) ?? false) ||
        (product.reference?.toLowerCase().includes(searchLower) ?? false) ||
        (product.barcode?.toLowerCase().includes(searchLower) ?? false) ||
        (product.barcodes?.some((b) =>
          b?.code?.toLowerCase().includes(searchLower),
        ) ?? false);

      let matchesStockFilter = true;
      if (stockFilter === "inStock") {
        matchesStockFilter = product.stock.available > product.minimumQty;
      } else if (stockFilter === "lowStock") {
        matchesStockFilter =
          product.stock.available > 0 &&
          product.stock.available <= product.minimumQty;
      } else if (stockFilter === "outOfStock") {
        matchesStockFilter = product.stock.available === 0;
      } else if (stockFilter === "arriving") {
        matchesStockFilter = product.stock.arriving > 0;
      }

      const productGroupValue = (product.group && typeof product.group === 'object') 
        ? ((product.group as any).id || (product.group as any).code) 
        : product.group;
      const productBrandValue = (product.brand && typeof product.brand === 'object') 
        ? (product.brand as any).name 
        : product.brand;

      const matchesGroup = !selectedGroup || productGroupValue === selectedGroup;
      const matchesBrand = !selectedBrand || productBrandValue === selectedBrand;

      // Advanced filters
      const matchesPriceMin =
        !priceRange.min || product.prices.A >= parseFloat(priceRange.min);
      const matchesPriceMax =
        !priceRange.max || product.prices.A <= parseFloat(priceRange.max);
      const matchesStockMin =
        !stockRange.min ||
        product.stock.available >= parseFloat(stockRange.min);
      const matchesStockMax =
        !stockRange.max ||
        product.stock.available <= parseFloat(stockRange.max);
      const matchesSupplier =
        !selectedSupplier ||
        MOCK_SUPPLIERS.find((s) => s.id === selectedSupplier)?.name ===
        product.supplier;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;

      return (
        matchesSearch &&
        matchesStockFilter &&
        matchesGroup &&
        matchesBrand &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesStockMin &&
        matchesStockMax &&
        matchesSupplier &&
        matchesStatus
      );
    });
  }, [
    products,
    searchQuery,
    stockFilter,
    selectedGroup,
    selectedBrand,
    priceRange,
    stockRange,
    selectedSupplier,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const paginationRange = useMemo(() => {
    const current = pageIndex + 1;
    const range: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      
      let start = Math.max(2, current - 1);
      let end = Math.min(totalPages - 1, current + 1);
      
      if (current <= 3) {
        end = 4;
      } else if (current >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      if (start > 2) range.push("...");
      for (let i = start; i <= end; i++) range.push(i);
      if (end < totalPages - 1) range.push("...");
      
      range.push(totalPages);
    }
    return range;
  }, [totalPages, pageIndex]);

  const uniqueBrands = useMemo(() => {
    return [...new Set(products.map((p) => getDisplayLabel(p.brand)))].filter(Boolean).sort();
  }, [products]);

  const getStockStatus = (product: Product) => {
    if (product.stock.available === 0) {
      return { label: "Sin Stock", color: "bg-red-500" };
    }
    if (product.stock.available <= product.minimumQty) {
      return { label: "Stock Bajo", color: "bg-amber-500" };
    }
    return { label: "En Stock", color: "bg-emerald-500" };
  };

  // Product actions
  const handleViewProduct = useCallback((product: Product) => {
    router.push(`/productos/${product.id}`);
  }, [router]);

  const handleEditProduct = useCallback((product: Product) => {
    router.push(`/productos/${product.id}/editar`);
  }, [router]);

  const handleDuplicateProduct = useCallback(async (product: Product) => {
    try {
      const { id, createdAt, updatedAt, ...productData } = product as any;
      const productName = product.description || product.name || "Producto";
      const copyData = {
        ...productData,
        reference: `${product.reference}-COPIA`,
        description: `${productName} (Copia)`,
        name: `${productName} (Copia)`,
        status: 'inactive'
      };
      await api.createProduct(copyData);
      alertSuccess(`Producto duplicado`, `"${productName}" ha sido copiado como borrador.`);
      loadProducts();
    } catch (err: any) {
      alertError("Error al duplicar", err.message);
    }
  }, [alertSuccess, alertError, loadProducts]);

  const handleToggleStatus = useCallback(async (product: Product) => {
    try {
      const productName = product.description || product.name || "Producto";
      const newStatus = product.status === "active" ? "inactive" : "active";
      
      await api.updateProduct(product.id, { status: newStatus });
      
      alertSuccess(
        `Producto ${newStatus === "active" ? "activado" : "desactivado"}`,
        `"${productName}" ha sido actualizado.`
      );
      loadProducts();
    } catch (err: any) {
      alertError("Error al actualizar estado", err.message);
    }
  }, [alertSuccess, alertError, loadProducts]);

  const handleDeleteProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (selectedProduct) {
      try {
        await api.deleteProduct(selectedProduct.id);
        setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
        alertSuccess("Producto eliminado", `"${selectedProduct.description}" ha sido eliminado.`);
      } catch (err: any) {
        alertError("Error al eliminar producto", err.message);
      } finally {
        setIsDeleteOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductsForBulk.length > 0) {
      try {
        const ids = selectedProductsForBulk.map((p) => p.id);
        await api.bulkDeleteProducts(ids);
        setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
        alertSuccess(
          "Productos eliminados",
          `${selectedProductsForBulk.length} productos han sido eliminados correctamente.`
        );
      } catch (err: any) {
        alertError("Error al eliminar productos", err.message);
      } finally {
        setIsBulkDeleteOpen(false);
        setSelectedProductsForBulk([]);
        setRowSelection({});
      }
    }
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      alertError('Sin productos', 'No tienes productos registrados para exportar.');
      return;
    }
    // Pre-seleccionar todos
    setExportSelectedIds(new Set(products.map(p => p.id)));
    setExportSearchQuery('');
    setExportFormat('xlsx');
    setIsExportOpen(true);
  };

  const onExportFile = async () => {
    if (exportSelectedIds.size === 0) {
      alertError('Sin selección', 'Selecciona al menos un producto para exportar.');
      return;
    }
    setIsExporting(true);
    try {
      await api.exportProducts(exportFormat, Array.from(exportSelectedIds));
      alertSuccess('Exportación completada', `${exportSelectedIds.size} producto(s) exportado(s) correctamente.`);
      setIsExportOpen(false);
    } catch (err: any) {
      alertError('Error al exportar', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportProducts = () => {
    setIsImportOpen(true);
    setImportResults(null);
    setImportProgress(0);
    setSelectedFile(null);
    setImportSuccess(false);
  };

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };
  const onConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

          if (jsonData.length <= 1) {
             throw new Error("El archivo está vacío o no tiene datos de productos");
          }

          let headerRowIndex = 0;
          let headers: string[] = [];
          
          for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
            const row = jsonData[i];
            if (row && Array.isArray(row) && row.some((v: any) => v?.toString().toLowerCase().includes('referencia'))) {
              headerRowIndex = i;
              headers = row.map((h: any) => h?.toString().trim().toLowerCase() || '');
              break;
            }
          }

          if (headers.length === 0) {
            headers = jsonData[0]?.map((h: any) => h?.toString().trim().toLowerCase() || '') || [];
          }

          let colMap: any = {};
          
          // Enhanced header detection for single-column arrays (bad delimiter parsing)
          if (headers.length === 1 && (headers[0].includes(',') || headers[0].includes(';'))) {
              const delimiter = headers[0].includes(',') ? ',' : ';';
              headers = headers[0].split(delimiter).map(h => h.trim().toLowerCase());
          }

          headers.forEach((h: string, i: number) => {
              const clean = h.trim().toLowerCase();
              if (clean === 'referencia' || clean === 'sku' || clean === 'ref' || clean.includes('referencia')) colMap.sku = i;
              if (clean === 'nombre' || clean === 'descripción' || clean === 'descripcion' || clean === 'name' || clean.includes('nombre') || clean.includes('descrip')) colMap.name = i;
              if ((clean === 'grupo' || clean === 'categoria' || clean === 'categoría' || clean === 'category' || clean.includes('grupo') || clean.includes('categ')) && !clean.includes('sub')) colMap.group = i;
              if (clean === 'marca' || clean === 'brand' || clean.includes('marca')) colMap.brand = i;
              if (clean === 'sub-grupo' || clean === 'subgrupo' || clean === 'subcategory' || clean.includes('subgrupo') || clean.includes('sub-grupo')) colMap.subgroup = i;
              if (clean === 'barra' || clean === 'barcode' || clean === 'ean' || clean.includes('barra')) colMap.barcode = i;
              if (clean === 'precio a' || clean === 'base' || clean === 'price' || clean.includes('precio a')) colMap.priceA = i;
              if (clean === 'existencia' || clean === 'disponible' || clean === 'stock' || clean === 'cantidad' || clean.includes('exis')) colMap.stock = i;
              if (clean.includes('minima') || clean.includes('mínima') || clean.includes('minimo') || clean.includes('mínimo')) colMap.minQty = i;
          });

          // Second pass: if some are still missing, be even more aggressive
          if (colMap.sku === undefined) colMap.sku = headers.indexOf('referencia') >= 0 ? headers.indexOf('referencia') : headers.indexOf('sku');
          if (colMap.name === undefined) colMap.name = headers.indexOf('nombre') >= 0 ? headers.indexOf('nombre') : (headers.indexOf('descripción') >= 0 ? headers.indexOf('descripción') : headers.indexOf('name'));
          if (colMap.group === undefined) colMap.group = headers.indexOf('grupo') >= 0 ? headers.indexOf('grupo') : (headers.indexOf('categoría') >= 0 ? headers.indexOf('categoría') : headers.indexOf('grupo'));


          const missing = [];
          if (colMap.sku === undefined) missing.push('Referencia');
          if (colMap.name === undefined) missing.push('Descripción');
          if (colMap.group === undefined) missing.push('Grupo');

          if (missing.length > 0) {
              throw new Error(`Faltan columnas requeridas en el archivo: ${missing.join(', ')}`);
          }

          const rows = jsonData.slice(headerRowIndex + 1).map((rawRow, index) => {
            let row = rawRow;
            // Handle bad delimiter parsing for data rows as well
            if (Array.isArray(row) && row.length === 1 && typeof row[0] === 'string' && (row[0].includes(',') || row[0].includes(';'))) {
                const delimiter = row[0].includes(',') ? ',' : ';';
                row = row[0].split(delimiter);
            }

            if (!row || (!row[colMap.sku] && !row[colMap.name])) return null;
            return {
              sku: row[colMap.sku]?.toString().trim(),
              name: row[colMap.name]?.toString().trim(),
              groupName: row[colMap.group]?.toString().trim(),
              brandName: colMap.brand !== undefined ? row[colMap.brand]?.toString().trim() : null,
              subgroupName: colMap.subgroup !== undefined ? row[colMap.subgroup]?.toString().trim() : null,
              barcode: colMap.barcode !== undefined ? row[colMap.barcode]?.toString().trim() : null,
              priceA: colMap.priceA !== undefined ? parseFloat(row[colMap.priceA]) : null,
              stock: colMap.stock !== undefined ? parseFloat(row[colMap.stock]) : null,
              minQty: colMap.minQty !== undefined ? parseInt(row[colMap.minQty]) || 0 : 0,
              rowNumber: index + headerRowIndex + 2
            };
          }).filter(Boolean);

          const totalRows = rows.length;
          const batchSize = 30;
          let successTotal = 0;
          let failedTotal = 0;
          const errorsTotal: string[] = [];

          for (let i = 0; i < totalRows; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const batchResult = await api.importProductsBatch(batch);
            
            if (batchResult.success) {
              successTotal += batchResult.details.success;
              failedTotal += batchResult.details.failed;
              errorsTotal.push(...batchResult.details.errors);
            }
            
            setImportProgress(Math.round(((i + batch.length) / totalRows) * 100));
          }

          setImportResults({
            success: successTotal,
            failed: failedTotal,
            errors: errorsTotal
          });
          setImportProgress(100);
          setImportSuccess(true);
          loadProducts();
          alertSuccess('Importación finalizada', `${successTotal} productos procesados correctamente.`);
        } catch (err: any) {
          console.error("Error processing import data:", err);
          alertError('Error al importar', err.message);
        } finally {
          setIsImporting(false);
        }
      };

      reader.onerror = () => {
        alertError('Error de lectura', 'No se pudo leer el archivo seleccionado.');
        setIsImporting(false);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err: any) {
      alertError('Error de importación', err.message);
      setIsImporting(false);
    }
  };

  // Create columns for DataTable
  const columns = useMemo(() => getProductColumns({
    onView: handleViewProduct,
    onEdit: handleEditProduct,
    onDuplicate: handleDuplicateProduct,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteProduct,
  }), [handleViewProduct, handleEditProduct, handleDuplicateProduct, handleToggleStatus, handleDeleteProduct]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Productos
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleImportProducts}
          >
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportProducts}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => router.push("/productos/nuevo")}
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Stats Cards Skeleton or Real */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="space-y-2">
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : (
          [
            {
              label: "Total Productos",
              value: stats.total,
              icon: Package,
              color: "blue",
              filter: "all" as StockFilter,
            },
            {
              label: "Con Stock",
              value: stats.total - stats.outOfStock - stats.lowStock,
              icon: TrendingUp,
              color: "emerald",
              filter: "inStock" as StockFilter,
            },
            {
              label: "Bajo Mínimo",
              value: stats.lowStock,
              icon: AlertTriangle,
              color: "amber",
              filter: "lowStock" as StockFilter,
            },
            {
              label: "Sin Stock",
              value: stats.outOfStock,
              icon: Package,
              color: "red",
              filter: "outOfStock" as StockFilter,
            },
            {
              label: "Por Llegar",
              value: stats.arriving,
              icon: Truck,
              color: "sky",
              filter: "arriving" as StockFilter,
            },
          ].map((stat, index) => (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() =>
                setStockFilter(stockFilter === stat.filter ? "all" : stat.filter)
              }
              className={cn(
                "rounded-xl border bg-white dark:bg-[#141414] p-3 text-left transition-all hover:shadow-md",
                stockFilter === stat.filter
                  ? "border-brand-500 ring-1 ring-brand-500"
                  : "border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    stat.color === "blue" && "bg-blue-50 dark:bg-blue-950",
                    stat.color === "emerald" &&
                    "bg-emerald-50 dark:bg-emerald-950",
                    stat.color === "amber" && "bg-amber-50 dark:bg-amber-950",
                    stat.color === "red" && "bg-red-50 dark:bg-red-950",
                    stat.color === "sky" && "bg-sky-50 dark:bg-sky-950",
                  )}
                >
                  <stat.icon
                    className={cn(
                      "h-5 w-5",
                      stat.color === "blue" && "text-blue-600",
                      stat.color === "emerald" && "text-emerald-600",
                      stat.color === "amber" && "text-amber-600",
                      stat.color === "red" && "text-red-600",
                      stat.color === "sky" && "text-sky-600",
                    )}
                  />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {selectedProductsForBulk.length > 0 && viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Button
                variant="default"
                size="sm"
                className="h-9 bg-brand-500 hover:bg-brand-600 text-white"
                onClick={() => setIsTransferModalOpen(true)}
              >
                <Truck className="mr-2 h-4 w-4" />
                Transferir {selectedProductsForBulk.length}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-9"
                onClick={() => setIsBulkDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar {selectedProductsForBulk.length} seleccionados
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  selectedGroup
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]",
                )}
              >
                {selectedGroup || "Categoría"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  selectedBrand
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]",
                )}
              >
                {selectedBrand || "Marca"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg max-h-64 overflow-auto">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  selectedWarehouse
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]",
                )}
              >
                {selectedWarehouse ? warehouses.find(w => w.id === selectedWarehouse)?.name : "Bodega"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem onClick={() => setSelectedWarehouse(null)}>
                Inventario Consolidado (Todas)
              </DropdownMenuItem>
              {warehouses.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => setSelectedWarehouse(selectedWarehouse === w.id ? null : w.id)}
                >
                  {w.name} ({w.type})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  statusFilter !== "all"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]",
                )}
              >
                {statusFilter === "all" ? "Estado" : statusFilter === "active" ? "Activos" : "Inactivos"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Solo Activos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Solo Inactivos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 items-center gap-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]">
                Popular
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] shadow-lg">
              <DropdownMenuItem>Más Popular</DropdownMenuItem>
              <DropdownMenuItem>Más Reciente</DropdownMenuItem>
              <DropdownMenuItem>Precio: Menor a Mayor</DropdownMenuItem>
              <DropdownMenuItem>Precio: Mayor a Menor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedGroup ||
            selectedBrand ||
            stockRange.min ||
            stockRange.max ||
            selectedSupplier ||
            statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setSelectedBrand(null);
                  setStockFilter("all");
                  setPriceRange({ min: "", max: "" });
                  setStockRange({ min: "", max: "" });
                  setSelectedSupplier(null);
                  setStatusFilter("all");
                }}
                className="flex h-9 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}

          <div className="flex items-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white",
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="h-8 w-[px] border-l border-gray-200 dark:border-[#2a2a2a] mx-1" />

          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border bg-white dark:bg-[#141414] transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
              priceRange.min ||
                priceRange.max ||
                stockRange.min ||
                stockRange.max ||
                selectedSupplier ||
                statusFilter !== "all"
                ? "border-brand-500 text-brand-600"
                : "border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid or Table mapping */}
      {loading ? (
        viewMode === "grid" ? (
          <SkeletonGrid />
        ) : (
          <SkeletonTable hasHeader={false} />
        )
      ) : viewMode === "grid" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[400px]">
            {filteredProducts.length > 0 ? (
              filteredProducts
                .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onView={handleViewProduct}
                    onEdit={handleEditProduct}
                    onDuplicate={handleDuplicateProduct}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteProduct}
                  />
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-20 opacity-40">
                    <div className="rounded-full bg-gray-50 dark:bg-[#1a1a1a] p-8 mb-4 border border-gray-100 dark:border-[#2a2a2a]">
                        <Package className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">Sin productos disponibles</p>
                    <p className="text-sm text-gray-500 max-w-xs text-center mt-2">Aún no hay productos en esta lista. Prueba a importar de forma masiva o añade uno nuevo.</p>
                </div>
            )}
          </div>

          {/* Grid Pagination Footer */}
          <Pagination
            currentPage={pageIndex + 1}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            rowsPerPage={pageSize}
            onPageChange={(page) => setPageIndex(page - 1)}
            onRowsPerPageChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            itemName="productos"
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          filterColumn="description"
          filterPlaceholder="Buscar por descripción..."
          pageSize={pageSize}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          onPageSizeChange={setPageSize}
          rowSelection={rowSelection}
          onRowSelectionStateChange={setRowSelection}
          onRowSelectionChange={setSelectedProductsForBulk}
          getRowId={(row) => row.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                "{selectedProduct?.description}"
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar múltiples productos</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar <span className="font-bold text-red-500">{selectedProductsForBulk.length}</span> productos seleccionados? Esta acción es permanente y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-32 overflow-y-auto rounded-md border p-2 space-y-1">
            {selectedProductsForBulk.slice(0, 5).map(p => (
              <div key={p.id} className="text-xs text-gray-500 flex items-center gap-2">
                <Trash2 className="h-3 w-3" /> {p.description || p.name}
              </div>
            ))}
            {selectedProductsForBulk.length > 5 && (
              <div className="text-xs text-gray-400 italic px-5">
                ...y {selectedProductsForBulk.length - 5} más
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Eliminar {selectedProductsForBulk.length} Productos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Filtros Avanzados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Price Range */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Rango de Precio
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mínimo
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Máximo
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={priceRange.max}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Stock Range */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Rango de Stock
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mínimo
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={stockRange.min}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStockRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Máximo
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={stockRange.max}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStockRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Supplier */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Proveedor
              </h3>
              <Select
                value={selectedSupplier || ""}
                onValueChange={(value: string) => setSelectedSupplier(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proveedores" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_SUPPLIERS.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Status Filter */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado del Producto
              </h3>
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full h-11 border-gray-200 dark:border-[#2a2a2a] rounded-lg">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg">Todos los estados</SelectItem>
                  <SelectItem value="active" className="rounded-lg">Solo Activos</SelectItem>
                  <SelectItem value="inactive" className="rounded-lg">Solo Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setPriceRange({ min: "", max: "" });
                setStockRange({ min: "", max: "" });
                setSelectedSupplier(null);
                setStatusFilter("all");
              }}
            >
              Limpiar filtros
            </Button>
            <Button
              onClick={() => {
                alertInfo("Filtros aplicados", "Los filtros han sido aplicados correctamente.");
                setIsFilterOpen(false);
              }}
            >
              Aplicar filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Import Products Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[500px] overflow-hidden no-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brand-500" />
              Importar Productos
            </DialogTitle>
            <DialogDescription>
              Sube un archivo Excel (.xlsx, .xls) o CSV para importar productos de forma masiva.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {!isImporting && !importResults && !importSuccess && (
              <>
                {!selectedFile ? (
                  <div 
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 transition-all hover:bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]/50 dark:hover:bg-[#1a1a1a]",
                    )}
                  >
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={onImportFile}
                    />
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-950/30">
                        <DownloadCloud className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Haz clic para subir o arrastra un archivo
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Excel o CSV (Máx. 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-brand-200 bg-brand-50/30 dark:border-brand-900/10 dark:bg-brand-900/10 gap-3">
                    <div className="h-10 w-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center text-brand-600">
                        <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[300px]">
                            {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        Cambiar archivo
                    </Button>
                  </div>
                )}
              </>
            )}

            {isImporting && (
              <div className="space-y-4 py-8 text-center">
                <div className="flex justify-center">
                   <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                    PROCESANDO...
                  </p>
                  <div className="px-10">
                    <Progress value={importProgress} className="h-2" />
                    <p className="mt-2 text-xs text-brand-600 font-bold">{importProgress}%</p>
                  </div>
                </div>
              </div>
            )}

            {importSuccess && importResults && (
              <div className="space-y-6 py-4 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                </motion.div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">¡Éxito!</h3>
                  <p className="text-sm text-gray-500">
                    {importResults.success} productos han sido importados.
                  </p>
                </div>

                {importResults.failed > 0 && (
                  <div className="space-y-2 text-left bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Fallos detectados ({importResults.failed})
                    </p>
                    <div className="max-h-[100px] overflow-y-auto text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 no-scrollbar">
                      {importResults.errors.map((err: string, i: number) => (
                        <div key={i} className="py-1 border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 truncate">
                          • {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {importResults.failed === 0 && (
                   <p className="text-[10px] text-gray-400 italic">Esta ventana se cerrará automáticamente...</p>
                )}
              </div>
            )}

            {!importResults && (
                <div className="mt-6 rounded-lg bg-blue-50/50 p-4 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
                    <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileCheck2 className="h-3.3 w-3.5" />
                        Columnas Permitidas:
                    </h4>
                    <p className="text-[10px] text-blue-700 dark:text-blue-500 leading-normal">
                        Referencia, Descripción, Grupo, Sub-Grupo, Marca, Código Barra, Disponible, Cantidad Minima, Precio A.
                    </p>
                    <button 
                        onClick={() => {
                            const headers = "Referencia,Descripción,Grupo,Sub-Grupo,Marca,Código Barra,Disponible,Cantidad Minima,Precio A\n";
                            const row1 = "JW-BLK-750,WHISKY JOHNNIE WALKER BLACK 750ML,WHISKY,WHISKY,JOHNNIE WALKER,7501050439022,100,10,45.50\n";
                            const row2 = "RON-ZAC-750,RON ZACAPA 23 AÑOS 750ML,RON,RON,ZACAPA,7401005001235,50,5,65.00\n";
                            const blob = new Blob([headers + row1 + row2], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.setAttribute("download", "plantilla_productos_tuinity.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors uppercase tracking-tight"
                    >
                        <DownloadCloud className="h-3.5 w-3.5" />
                        Descargar Plantilla de Ejemplo (.csv)
                    </button>
                </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <Button
              variant="secondary"
              disabled={isImporting}
              onClick={() => {
                setIsImportOpen(false);
                setImportResults(null);
                setSelectedFile(null);
                setImportSuccess(false);
              }}
              className="px-6 h-10 rounded-xl"
            >
              {importResults ? "Cerrar" : "Cancelar"}
            </Button>
            
            {selectedFile && !isImporting && !importResults && (
              <Button 
                onClick={onConfirmImport}
                className="px-6 h-10 rounded-xl shadow-sm flex items-center gap-2"
              >
                <FileCheck2 className="h-4 w-4" />
                Confirmar e Importar
              </Button>
            )}

            {importResults && (
              <Button 
                onClick={() => setIsImportOpen(false)}
                className="px-6 h-10 rounded-xl shadow-sm"
              >
                Listo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Export Products Modal */}
      <Dialog open={isExportOpen} onOpenChange={(open) => !isExporting && setIsExportOpen(open)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DownloadCloud className="h-5 w-5 text-brand-500" />
              Exportar Productos
            </DialogTitle>
            <DialogDescription>
              Selecciona los productos que deseas exportar y el formato de descarga.
            </DialogDescription>
          </DialogHeader>

          {/* Formato */}
          <div className="flex gap-3 py-2">
            <button
              onClick={() => setExportFormat('xlsx')}
              className={cn(
                "flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                exportFormat === 'xlsx'
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] hover:border-emerald-300"
              )}
            >
              <FileSpreadsheet className={cn("h-5 w-5", exportFormat === 'xlsx' ? "text-emerald-600" : "text-gray-400")} />
              <span className={cn("text-sm font-semibold", exportFormat === 'xlsx' ? "text-emerald-700 dark:text-emerald-300" : "text-gray-600 dark:text-gray-400")}>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={cn(
                "flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                exportFormat === 'csv'
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] hover:border-blue-300"
              )}
            >
              <FileCheck2 className={cn("h-5 w-5", exportFormat === 'csv' ? "text-blue-600" : "text-gray-400")} />
              <span className={cn("text-sm font-semibold", exportFormat === 'csv' ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400")}>CSV (.csv)</span>
            </button>
          </div>

          {/* Buscador + Selección */}
          <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exportSelectedIds.size === products.length && products.length > 0}
                  ref={(el) => {
                    if (el) el.indeterminate = exportSelectedIds.size > 0 && exportSelectedIds.size < products.length;
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportSelectedIds(new Set(products.map(p => p.id)));
                    } else {
                      setExportSelectedIds(new Set());
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Seleccionar todos ({exportSelectedIds.size}/{products.length})
                </span>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={exportSearchQuery}
                  onChange={(e) => setExportSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1" style={{ maxHeight: '280px' }}>
              {products
                .filter(p => !exportSearchQuery || p.description.toLowerCase().includes(exportSearchQuery.toLowerCase()) || p.reference?.toLowerCase().includes(exportSearchQuery.toLowerCase()))
                .map(product => (
                  <label
                    key={product.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#1e1e1e] last:border-0",
                      exportSelectedIds.has(product.id) && "bg-brand-50/50 dark:bg-brand-900/10"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={exportSelectedIds.has(product.id)}
                      onChange={(e) => {
                        setExportSelectedIds(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(product.id);
                          else next.delete(product.id);
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.description}</p>
                      <p className="text-xs text-gray-500">{product.reference || 'Sin SKU'} • Stock: {product.stock?.available ?? 0}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                      ${Number(product.prices?.A || 0).toFixed(2)}
                    </span>
                  </label>
                ))
              }
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="secondary" disabled={isExporting} onClick={() => setIsExportOpen(false)}>
              Cancelar
            </Button>
            <button
              onClick={onExportFile}
              disabled={isExporting || exportSelectedIds.size === 0}
              style={{ backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 600 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity text-sm"
            >
              {isExporting
                ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Exportando...</>
                : <><DownloadCloud className="h-4 w-4" />Exportar {exportSelectedIds.size} producto{exportSelectedIds.size !== 1 ? 's' : ''}</>
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        selectedProducts={selectedProductsForBulk}
        onSuccess={() => {
          setRowSelection({});
          setSelectedProductsForBulk([]);
          loadProducts();
        }}
      />
    </div>
  );
}
