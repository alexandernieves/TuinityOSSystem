"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Skeleton,
} from "@heroui/react";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalBody,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_GROUPS, Product } from "@/lib/mock-data/products";
import { MOCK_SUPPLIERS } from "@/lib/mock-data/purchase-orders";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";

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

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Advanced filters state
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [stockRange, setStockRange] = useState({ min: "", max: "" });
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Error al cargar productos", { description: err.message });
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        product.description.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.reference.toLowerCase().includes(searchLower) ||
        (product.barcode &&
          product.barcode.toLowerCase().includes(searchLower)) ||
        product.barcodes?.some((b) =>
          b.code.toLowerCase().includes(searchLower),
        );

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

      const matchesGroup = !selectedGroup || product.group === selectedGroup;
      const matchesBrand = !selectedBrand || product.brand === selectedBrand;

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
      const matchesActiveOnly = !showOnlyActive || product.status === "active";

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
        matchesActiveOnly
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
    showOnlyActive,
  ]);

  const uniqueBrands = useMemo(() => {
    return [...new Set(products.map((p) => p.brand))].sort();
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
  const handleViewProduct = (product: Product) => {
    router.push(`/productos/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    router.push(`/productos/${product.id}/editar`);
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const { id, _id, createdAt, updatedAt, ...productData } = product as any;
      const copyData = {
        ...productData,
        reference: `${product.reference}-COPIA`,
        description: `${product.description} (Copia)`,
        status: 'inactivo'
      };
      await api.createProduct(copyData);
      toast.success(`Producto duplicado`, {
        description: `"${product.description}" ha sido copiado como borrador.`,
      });
      loadProducts();
    } catch (err: any) {
      toast.error("Error al duplicar", { description: err.message });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === "active" ? "inactivo" : "active";
      await api.updateProduct(product.id, { status: newStatus });
      toast.success(
        `Producto ${newStatus === "active" ? "activado" : "desactivado"}`,
        {
          description: `"${product.description}" ha sido actualizado.`,
        },
      );
      loadProducts();
    } catch (err: any) {
      toast.error("Error al actualizar estado", { description: err.message });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      try {
        await api.deleteProduct(selectedProduct.id);
        setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
        toast.success("Producto eliminado", {
          description: `"${selectedProduct.description}" ha sido eliminado.`,
        });
      } catch (err: any) {
        toast.error("Error al eliminar producto", { description: err.message });
      } finally {
        setIsDeleteOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  const handleExportProducts = () => {
    toast.success("Exportando productos", {
      description: "El archivo Excel se descargará en breve.",
    });
  };

  const handleImportProducts = () => {
    toast.info("Importar productos", {
      description: "Selecciona un archivo Excel para importar.",
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Productos
        </h1>
        {loading && <Spinner size="sm" color="primary" />}
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportProducts}
            className="flex h-9 items-center gap-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <button
            onClick={handleExportProducts}
            className="flex h-9 items-center gap-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={() => router.push("/productos/nuevo")}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards Skeleton or Real */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded-lg" />
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

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  selectedGroup
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]",
                )}
              >
                {selectedGroup || "Categoría"}
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
              classNames={{ base: "bg-white border border-gray-200 shadow-lg" }}
            >
              {PRODUCT_GROUPS.map((group) => (
                <DropdownItem key={group.id}>{group.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  selectedBrand
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"
                    : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]",
                )}
              >
                {selectedBrand || "Marca"}
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
              classNames={{ base: "bg-white border border-gray-200 shadow-lg" }}
            >
              {uniqueBrands.map((brand) => (
                <DropdownItem key={brand}>{brand}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <button className="flex h-9 items-center gap-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]">
                Popular
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              classNames={{
                base: "bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] shadow-lg",
              }}
            >
              <DropdownItem key="popular">Más Popular</DropdownItem>
              <DropdownItem key="newest">Más Reciente</DropdownItem>
              <DropdownItem key="price-asc">Precio: Menor a Mayor</DropdownItem>
              <DropdownItem key="price-desc">
                Precio: Mayor a Menor
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {(selectedGroup ||
            selectedBrand ||
            stockFilter !== "all" ||
            priceRange.min ||
            priceRange.max ||
            stockRange.min ||
            stockRange.max ||
            selectedSupplier ||
            showOnlyActive) && (
              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setSelectedBrand(null);
                  setStockFilter("all");
                  setPriceRange({ min: "", max: "" });
                  setStockRange({ min: "", max: "" });
                  setSelectedSupplier(null);
                  setShowOnlyActive(false);
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

          <button
            onClick={() => setIsFilterOpen(true)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border bg-white dark:bg-[#141414] transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
              priceRange.min ||
                priceRange.max ||
                stockRange.min ||
                stockRange.max ||
                selectedSupplier ||
                showOnlyActive
                ? "border-brand-500 text-brand-600"
                : "border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Products Grid/Table Content or Skeletons */}
      {loading ? (
        viewMode === "grid" ? (
          <SkeletonGrid items={8} />
        ) : (
          <SkeletonTable hasHeader={false} />
        )
      ) : (
        <>
          {/* Products Grid View - Vertical cards with image header */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product);
                const imageUrl =
                  PRODUCT_IMAGES[product.group] || PRODUCT_IMAGES["WHISKY"];

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] transition-all hover:border-gray-300 dark:hover:border-[#3a3a3a] hover:shadow-md"
                  >
                    {/* Menu Button */}
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <button className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur-sm transition-all hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Acciones"
                        classNames={{
                          base: "bg-white border border-gray-200 shadow-lg",
                        }}
                      >
                        <DropdownItem
                          key="view"
                          startContent={<Eye className="h-4 w-4" />}
                          onPress={() => handleViewProduct(product)}
                        >
                          Ver ficha
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<Edit className="h-4 w-4" />}
                          onPress={() => handleEditProduct(product)}
                        >
                          Editar
                        </DropdownItem>
                        <DropdownItem
                          key="duplicate"
                          startContent={<Copy className="h-4 w-4" />}
                          onPress={() => handleDuplicateProduct(product)}
                        >
                          Duplicar
                        </DropdownItem>
                        <DropdownItem
                          key="toggle"
                          startContent={<ToggleLeft className="h-4 w-4" />}
                          onPress={() => handleToggleStatus(product)}
                        >
                          {product.status === "active" ? "Desactivar" : "Activar"}
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          startContent={<Trash2 className="h-4 w-4" />}
                          className="text-danger"
                          color="danger"
                          onPress={() => handleDeleteProduct(product)}
                        >
                          Eliminar
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>

                    {/* Stock indicator */}
                    <span
                      className={cn(
                        "absolute left-2 top-2 z-10 h-2.5 w-2.5 rounded-full",
                        stockStatus.color,
                      )}
                    />

                    {/* Product Image - Header */}
                    <button
                      onClick={() => handleViewProduct(product)}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]"
                    >
                      <img
                        src={imageUrl}
                        alt={product.description}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col p-4">
                      {/* Price Row */}
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          ${product.prices?.A || 0}
                        </span>
                        <span className="text-sm text-gray-400 dark:text-[#666666] line-through">
                          ${Math.round((product.prices?.A || 0) * 1.2)}
                        </span>
                      </div>

                      {/* Name */}
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="mb-3 text-left text-sm font-medium text-gray-900 dark:text-white leading-snug hover:text-brand-600 dark:hover:text-[#00D1B2]"
                      >
                        {product.description}
                      </button>

                      {/* Category & Brand */}
                      <p className="text-xs text-gray-500 dark:text-[#888888]">
                        Categoría:{" "}
                        <span className="text-gray-700 dark:text-gray-300">
                          {product.group}
                        </span>
                      </p>
                      <p className="mb-4 text-xs text-gray-500 dark:text-[#888888]">
                        Marca:{" "}
                        <span className="text-gray-700 dark:text-gray-300">
                          {product.brand}
                        </span>
                      </p>

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-[#2a2a2a] pt-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={product.supplier}
                            size="sm"
                            classNames={{
                              base: "h-6 w-6 text-[10px] bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300",
                            }}
                          />
                          <span className="max-w-28 truncate text-xs text-gray-500 dark:text-[#888888]">
                            {product.supplier.split(",")[0]}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 dark:text-[#888888]">
                            Qty:{" "}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              product.stock.available === 0
                                ? "text-red-600"
                                : product.stock.available <= product.minimumQty
                                  ? "text-amber-600"
                                  : "text-gray-900 dark:text-white",
                            )}
                          >
                            {product.stock.available}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Products List View - Table format */}
          {viewMode === "list" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Producto
                      </th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Referencia
                      </th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Categoría
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Marca
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Stock
                      </th>
                      <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Precio
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {filteredProducts.map((product, index) => {
                      const stockStatus = getStockStatus(product);
                      const imageUrl =
                        PRODUCT_IMAGES[product.group] || PRODUCT_IMAGES["WHISKY"];

                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="group transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-[#1a1a1a] sm:block">
                                <img
                                  src={imageUrl}
                                  alt={product.description}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => handleViewProduct(product)}
                                className="max-w-28 truncate text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-[#00D1B2] sm:max-w-xs"
                              >
                                {product.description}
                              </button>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3">
                            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                              {product.reference}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {product.group}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {product.brand}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                product.stock.available === 0
                                  ? "text-red-600"
                                  : product.stock.available <= product.minimumQty
                                    ? "text-amber-600"
                                    : "text-gray-900 dark:text-white",
                              )}
                            >
                              {product.stock.available}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${product.prices.A}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                                product.status === "active"
                                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                                  : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  stockStatus.color,
                                )}
                              />
                              {product.status === "active" ? "Activo" : "Inactivo"}
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
                                classNames={{
                                  base: "bg-white border border-gray-200 shadow-lg",
                                }}
                              >
                                <DropdownItem
                                  key="view"
                                  startContent={<Eye className="h-4 w-4" />}
                                  onPress={() => handleViewProduct(product)}
                                >
                                  Ver ficha
                                </DropdownItem>
                                <DropdownItem
                                  key="edit"
                                  startContent={<Edit className="h-4 w-4" />}
                                  onPress={() => handleEditProduct(product)}
                                >
                                  Editar
                                </DropdownItem>
                                <DropdownItem
                                  key="duplicate"
                                  startContent={<Copy className="h-4 w-4" />}
                                  onPress={() => handleDuplicateProduct(product)}
                                >
                                  Duplicar
                                </DropdownItem>
                                <DropdownItem
                                  key="toggle"
                                  startContent={<ToggleLeft className="h-4 w-4" />}
                                  onPress={() => handleToggleStatus(product)}
                                >
                                  {product.status === "active"
                                    ? "Desactivar"
                                    : "Activar"}
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  startContent={<Trash2 className="h-4 w-4" />}
                                  className="text-danger"
                                  color="danger"
                                  onPress={() => handleDeleteProduct(product)}
                                >
                                  Eliminar
                                </DropdownItem>
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
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
              <Package className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                No se encontraron productos
              </h3>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                Intenta ajustar los filtros o el término de búsqueda
              </p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
            Mostrando {filteredProducts.length} de {stats.total} productos
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        size="sm"
      >
        <CustomModalHeader onClose={() => setIsDeleteOpen(false)}>
          Eliminar producto
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Estás seguro de eliminar{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              "{selectedProduct?.description}"
            </span>
            ? Esta acción no se puede deshacer.
          </p>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button color="danger" onPress={confirmDelete}>
            Eliminar
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Filter Modal */}
      <CustomModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        size="md"
      >
        <CustomModalHeader onClose={() => setIsFilterOpen(false)}>
          <SlidersHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          Filtros Avanzados
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
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
                    startContent={<span className="text-gray-400">$</span>}
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                    variant="bordered"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Máximo
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    startContent={<span className="text-gray-400">$</span>}
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                    variant="bordered"
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
                    onChange={(e) =>
                      setStockRange((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                    variant="bordered"
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
                    onChange={(e) =>
                      setStockRange((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                    variant="bordered"
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
                placeholder="Todos los proveedores"
                selectedKeys={selectedSupplier ? [selectedSupplier] : []}
                onChange={(e) => setSelectedSupplier(e.target.value || null)}
                variant="bordered"
                labelPlacement="outside"
              >
                {MOCK_SUPPLIERS.map((supplier) => (
                  <SelectItem key={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Active Only Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Solo productos activos
                </p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">
                  Ocultar productos inactivos
                </p>
              </div>
              <Switch
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="light"
            onPress={() => {
              setPriceRange({ min: "", max: "" });
              setStockRange({ min: "", max: "" });
              setSelectedSupplier(null);
              setShowOnlyActive(false);
            }}
          >
            Limpiar filtros
          </Button>
          <Button
            color="primary"
            onPress={() => {
              toast.success("Filtros aplicados");
              setIsFilterOpen(false);
            }}
            className="bg-brand-600"
          >
            Aplicar filtros
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
