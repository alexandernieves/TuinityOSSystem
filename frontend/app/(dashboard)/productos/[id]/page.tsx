"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import {
  ArrowLeft,
  Edit,
  Copy,
  ToggleLeft,
  Trash2,
  Package,
  Barcode,
  BarChart3,
  Ruler,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Truck,
  Printer,
  Plus,
  X,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_GROUPS } from "@/lib/mock-data/products";
import { api } from "@/lib/services/api";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/contexts/auth-context";
import { printReport } from "@/lib/utils/print-utils";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalBody,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import { SkeletonDashboard } from "@/components/ui/skeleton-dashboard";

// Product images mapping
const PRODUCT_IMAGES: Record<string, string> = {
  WHISKY:
    "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop",
  RON: "https://images.unsplash.com/photo-1598018553943-93a44e4e7af8?w=400&h=400&fit=crop",
  VODKA:
    "https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?w=400&h=400&fit=crop",
  TEQUILA:
    "https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=400&h=400&fit=crop",
  GINEBRA:
    "https://images.unsplash.com/photo-1608885898957-a559228e8749?w=400&h=400&fit=crop",
  VINO: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop",
  LICOR:
    "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop",
  SNACKS:
    "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=400&fit=crop",
  CERVEZA:
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewCosts = checkPermission("canViewCosts");
  const canManageBarcodes = checkPermission("canManageBarcodes");
  const canConfigureBrandProtection = checkPermission(
    "canConfigureBrandProtection",
  );
  const canViewProductAnalytics = checkPermission("canViewProductAnalytics");

  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // F3 - Multiple Barcodes state
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [newBarcodeCode, setNewBarcodeCode] = useState("");
  const [newBarcodeLabel, setNewBarcodeLabel] = useState("Caja");

  // F14 - Brand Protection state
  const [brandProtectionEnabled, setBrandProtectionEnabled] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const BRAND_PROTECTION_RATE = 0.05;

  const BARCODE_LABEL_OPTIONS = [
    "Caja",
    "Botella",
    "Inner Pack",
    "Display",
    "Otro",
  ] as const;

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await api.getProductById(productId);
      setProduct(data);
      setBrandProtectionEnabled(data?.brandProtection ?? false);
    } catch (err: any) {
      toast.error("Error al cargar", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  if (loading) return <SkeletonDashboard />;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-medium text-foreground">
          Producto no encontrado
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          El producto {productId} no existe o fue eliminado.
        </p>
        <Button color="primary" onPress={() => router.push("/productos")}>
          Volver a Productos
        </Button>
      </div>
    );
  }

  const imageUrl = PRODUCT_IMAGES[product.group] || PRODUCT_IMAGES["WHISKY"];
  const groupLabel =
    PRODUCT_GROUPS.find((g) => g.id === product.group)?.label || product.group;

  const getStockStatus = () => {
    if (!product || !product.stock)
      return {
        label: "Sin Datos",
        color: "bg-gray-500",
        textColor: "text-gray-500",
      };
    const available = product.stock.available || 0;
    const minQty = product.minimumQty || 0;

    if (available === 0) {
      return {
        label: "Sin Stock",
        color: "bg-red-500",
        textColor: "text-red-500",
      };
    }
    if (available <= minQty) {
      return {
        label: "Stock Bajo",
        color: "bg-amber-500",
        textColor: "text-amber-500",
      };
    }
    return {
      label: "En Stock",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
    };
  };

  const stockStatus = getStockStatus();

  const handleEdit = () => {
    router.push(`/productos/${product.id}/editar`);
  };

  const handleDuplicate = () => {
    toast.success("Producto duplicado", {
      description: `"${product.description}" ha sido copiado como borrador.`,
    });
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = product.status === "active" ? "inactivo" : "active";
      await api.updateProduct(product.id, { status: newStatus });
      toast.success(
        `Producto ${newStatus === "active" ? "activado" : "desactivado"}`,
        {
          description: `"${product.description}" ha sido actualizado.`,
        },
      );
      fetchProduct();
    } catch (err: any) {
      toast.error("Error al actualizar estado", { description: err.message });
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(false);
    try {
      await api.deleteProduct(product.id);
      toast.success("Producto eliminado", {
        description: `"${product.description}" ha sido eliminado.`,
      });
      router.push("/productos");
    } catch (err: any) {
      toast.error("Error al eliminar", { description: err.message });
    }
  };

  // F3 - Add barcode handler
  const handleAddBarcode = async () => {
    if (!product) return;
    const currentBarcodes = product.barcodes ?? [];
    if (currentBarcodes.length >= 5) {
      toast.error("Límite alcanzado", {
        id: "barcode-limit",
        description: "Solo se permiten hasta 5 códigos de barra por producto.",
      });
      return;
    }
    if (!newBarcodeCode.trim()) {
      toast.error("Código requerido", {
        id: "barcode-empty",
        description: "Ingresa un código de barras válido.",
      });
      return;
    }
    try {
      const updatedBarcodes = [
        ...currentBarcodes,
        { code: newBarcodeCode.trim(), label: newBarcodeLabel },
      ];
      await api.updateProduct(product.id, { barcodes: updatedBarcodes });
      toast.success("Código agregado", {
        id: "barcode-added",
        description: `${newBarcodeLabel}: ${newBarcodeCode.trim()}`,
      });
      setNewBarcodeCode("");
      setNewBarcodeLabel("Caja");
      setIsBarcodeModalOpen(false);
      fetchProduct();
    } catch (err: any) {
      toast.error("Error al agregar código", { description: err.message });
    }
  };

  // F3 - Remove barcode handler
  const handleRemoveBarcode = async (index: number) => {
    if (!product) return;
    try {
      const currentBarcodes = product.barcodes ?? [];
      const removed = currentBarcodes[index];
      const updatedBarcodes = currentBarcodes.filter(
        (_: any, i: number) => i !== index,
      );
      await api.updateProduct(product.id, { barcodes: updatedBarcodes });
      toast.success("Código eliminado", {
        id: "barcode-removed",
        description: `${removed.label}: ${removed.code}`,
      });
      fetchProduct();
    } catch (err: any) {
      toast.error("Error al eliminar código", { description: err.message });
    }
  };

  // F14 - Toggle brand protection handler
  const handleToggleBrandProtection = async () => {
    if (!product) return;
    const newValue = !brandProtectionEnabled;
    try {
      await api.updateProduct(product.id, {
        brandProtection: newValue,
        brandProtectionRate: BRAND_PROTECTION_RATE,
      });
      setBrandProtectionEnabled(newValue);
      toast.success(
        newValue
          ? "Protección de marca activada"
          : "Protección de marca desactivada",
        {
          id: "brand-protection-toggle",
          description: newValue
            ? `Tasa aplicada: ${(BRAND_PROTECTION_RATE * 100).toFixed(0)}%`
            : "El costo CIF ya no incluye protección de marca.",
        },
      );
      fetchProduct();
    } catch (err: any) {
      toast.error("Error al actualizar protección de marca", {
        description: err.message,
      });
    }
  };

  const handlePrint = () => {
    printReport({
      title: `Ficha de Producto`,
      subtitle: product.reference,
      columns: [
        { key: "campo", label: "Campo", width: "40%" },
        { key: "valor", label: "Valor" },
      ],
      data: [
        { campo: "Referencia", valor: product.reference },
        { campo: "Descripción", valor: product.description },
        { campo: "Categoría", valor: groupLabel },
        { campo: "Marca", valor: product.brand },
        { campo: "País de Origen", valor: product.country },
        { campo: "Código de Barras", valor: product.barcode || "-" },
        { campo: "Código Arancelario", valor: product.tariffCode },
        { campo: "Unidad", valor: product.unit },
        { campo: "Unidades por Caja", valor: product.unitsPerCase.toString() },
        {
          campo: "Stock Disponible",
          valor: product.stock?.available?.toString() || "0",
        },
        { campo: "Stock Mínimo", valor: product.minimumQty?.toString() || "0" },
        { campo: "Precio Nivel A", valor: `$${product.prices?.A || 0}` },
        { campo: "Precio Nivel B", valor: `$${product.prices?.B || 0}` },
        { campo: "Precio Nivel C", valor: `$${product.prices?.C || 0}` },
        { campo: "Precio Nivel D", valor: `$${product.prices?.D || 0}` },
        { campo: "Precio Nivel E", valor: `$${product.prices?.E || 0}` },
        ...(canViewCosts
          ? [
            { campo: "Proveedor", valor: product.supplier },
            { campo: "Costo FOB", valor: `$${product.costFOB || 0}` },
            { campo: "Costo CIF", valor: `$${product.costCIF || 0}` },
            {
              campo: "Costo Promedio",
              valor: `$${product.costAvgWeighted || 0}`,
            },
          ]
          : []),
      ],
      metadata: [
        { label: "Producto", value: product.description },
        { label: "Referencia", value: product.reference },
        {
          label: "Estado",
          value: product.status === "active" ? "Activo" : "Inactivo",
        },
      ],
    });
    toast.success("Documento generado", {
      description: "Ficha de producto lista para imprimir.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/productos")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {product.description}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  product.status === "active"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-gray-500/10 text-gray-500",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    product.status === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-500",
                  )}
                />
                {product.status === "active" ? "Activo" : "Inactivo"}
              </span>
              {/* F14 - Brand Protection Badge */}
              {brandProtectionEnabled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Marca Protegida
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {product.reference}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canViewProductAnalytics && (
            <Button
              variant="bordered"
              startContent={<BarChart3 className="h-4 w-4" />}
              onPress={() => router.push(`/productos/${product.id}/analytics`)}
            >
              Analytics
            </Button>
          )}
          <Button
            variant="bordered"
            startContent={<Printer className="h-4 w-4" />}
            onPress={handlePrint}
          >
            Imprimir
          </Button>
          <Button
            variant="bordered"
            startContent={<Edit className="h-4 w-4" />}
            onPress={handleEdit}
          >
            Editar
          </Button>
          <Button
            variant="bordered"
            startContent={<Copy className="h-4 w-4" />}
            onPress={handleDuplicate}
          >
            Duplicar
          </Button>
          <Button
            variant="bordered"
            startContent={<ToggleLeft className="h-4 w-4" />}
            onPress={handleToggleStatus}
          >
            {product.status === "active" ? "Desactivar" : "Activar"}
          </Button>
          <Button
            variant="bordered"
            color="danger"
            startContent={<Trash2 className="h-4 w-4" />}
            onPress={() => setIsDeleteModalOpen(true)}
          >
            Eliminar
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Image & Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Product Image */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-square w-full overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={product.description}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    stockStatus.color.replace("bg-", "bg-") + "/10",
                    stockStatus.textColor,
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      stockStatus.color,
                    )}
                  />
                  {stockStatus.label}
                </span>
                <span className="text-2xl font-bold text-foreground">
                  ${product.prices?.A || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Clasificación
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Categoría</span>
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                  {groupLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Subcategoría
                </span>
                <span className="text-sm text-foreground">
                  {product.subGroup}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marca</span>
                <span className="text-sm font-medium text-foreground">
                  {product.brand}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Middle Column - Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6 lg:col-span-2"
        >
          {/* Stock Information */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Inventario
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {product.stock?.existence || 0}
                </p>
                <p className="text-xs text-muted-foreground">Existencia</p>
              </div>
              <div className="rounded-lg bg-sky-500/10 p-4 text-center">
                <p className="text-2xl font-bold text-sky-500">
                  {product.stock?.arriving || 0}
                </p>
                <p className="text-xs text-muted-foreground">Por Llegar</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {product.stock?.reserved || 0}
                </p>
                <p className="text-xs text-muted-foreground">Reservado</p>
              </div>
              <div
                className={cn(
                  "rounded-lg p-4 text-center",
                  stockStatus.color.replace("bg-", "bg-") + "/10",
                )}
              >
                <p className={cn("text-2xl font-bold", stockStatus.textColor)}>
                  {product.stock?.available || 0}
                </p>
                <p className="text-xs text-muted-foreground">Disponible</p>
              </div>
            </div>
            {(product.stock?.available || 0) <= (product.minimumQty || 0) &&
              (product.stock?.available || 0) > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Stock por debajo del mínimo ({product.minimumQty || 0}{" "}
                    unidades)
                  </span>
                </div>
              )}
            {(product.stock?.arriving || 0) > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-sky-500/10 p-3 text-sm text-sky-500">
                <Truck className="h-4 w-4" />
                <span>{product.stock?.arriving} unidades en tránsito</span>
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Precios por Nivel
              </h3>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {(["A", "B", "C", "D", "E"] as const).map((level, index) => (
                <div
                  key={level}
                  className={cn(
                    "rounded-lg p-4 text-center",
                    index === 0 ? "bg-brand-500/10" : "bg-muted/50",
                  )}
                >
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Nivel {level}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      index === 0 ? "text-brand-500" : "text-foreground",
                    )}
                  >
                    ${product.prices ? product.prices[level] : 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Barcode className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Detalles del Producto
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Código de Barras
                </p>
                <p className="font-mono text-sm text-foreground">
                  {product.barcode || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Código Arancelario
                </p>
                <p className="font-mono text-sm text-foreground">
                  {product.tariffCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">País de Origen</p>
                <p className="text-sm text-foreground">{product.country}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unidad</p>
                <p className="text-sm text-foreground">{product.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Unidades por Caja
                </p>
                <p className="text-sm text-foreground">
                  {product.unitsPerCase}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cantidad Mínima</p>
                <p className="text-sm text-foreground">{product.minimumQty}</p>
              </div>
              {product.casesPerBulk && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Cajas por Bulto
                  </p>
                  <p className="text-sm text-foreground">
                    {product.casesPerBulk}
                  </p>
                </div>
              )}
              {product.casesPerPallet && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Cajas por Pallet
                  </p>
                  <p className="text-sm text-foreground">
                    {product.casesPerPallet}
                  </p>
                </div>
              )}
            </div>

            {/* F3 - Multiple Barcodes Section */}
            {(product.barcodes && product.barcodes.length > 0) ||
              canManageBarcodes ? (
              <div className="mt-5 border-t border-gray-200 pt-5 dark:border-[#2a2a2a]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Códigos de Barra Adicionales
                  </p>
                  {canManageBarcodes && (product.barcodes ?? []).length < 5 && (
                    <button
                      onClick={() => setIsBarcodeModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-500/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar Código
                    </button>
                  )}
                </div>
                {product.barcodes && product.barcodes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.barcodes.map((bc: any, index: number) => (
                      <span
                        key={`${bc.code}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground dark:border-[#2a2a2a] dark:bg-[#141414]"
                      >
                        <Barcode className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">
                          {bc.label}:
                        </span>
                        {bc.code}
                        {canManageBarcodes && (
                          <button
                            onClick={() => handleRemoveBarcode(index)}
                            className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground dark:text-[#888888]">
                    No hay códigos adicionales registrados.
                  </p>
                )}
                {(product.barcodes ?? []).length >= 5 && (
                  <p className="mt-2 text-xs text-muted-foreground dark:text-[#888888]">
                    Se alcanzó el límite de 5 códigos de barra.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Dimensions & Weight - if available */}
          {(product.dimensions || product.weightPerCase) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Dimensiones y Peso
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {product.dimensions && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Largo</p>
                      <p className="text-sm text-foreground">
                        {product.dimensions.length} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ancho</p>
                      <p className="text-sm text-foreground">
                        {product.dimensions.width} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alto</p>
                      <p className="text-sm text-foreground">
                        {product.dimensions.height} cm
                      </p>
                    </div>
                  </>
                )}
                {product.weightPerCase && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Peso por Caja
                    </p>
                    <p className="text-sm text-foreground">
                      {product.weightPerCase} kg
                    </p>
                  </div>
                )}
                {product.cubicMeters && (
                  <div>
                    <p className="text-xs text-muted-foreground">Volumen</p>
                    <p className="text-sm text-foreground">
                      {product.cubicMeters} m³
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Costs - Only for authorized users */}
          {canViewCosts && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Costos e Información Confidencial
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Proveedor</p>
                  <p className="text-sm font-medium text-foreground">
                    {product.supplier}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Costo FOB</p>
                  <p className="font-mono text-sm text-foreground">
                    ${product.costFOB}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Costo CIF</p>
                  <p className="font-mono text-sm text-foreground">
                    ${product.costCIF}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Costo Promedio
                  </p>
                  <p className="font-mono text-sm font-medium text-foreground">
                    ${product.costAvgWeighted}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-emerald-500/10 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Margen (vs Precio A)
                  </span>
                  <span className="font-mono font-medium text-emerald-500">
                    {product.prices?.A && product.costAvgWeighted
                      ? (
                        ((product.prices.A - product.costAvgWeighted) /
                          product.prices.A) *
                        100
                      ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* F14 - Brand Protection Toggle */}
              <div className="mt-4 rounded-lg border border-gray-200 p-4 dark:border-[#2a2a2a] dark:bg-[#141414]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        brandProtectionEnabled
                          ? "bg-violet-500/10"
                          : "bg-muted/50",
                      )}
                    >
                      <Shield
                        className={cn(
                          "h-4.5 w-4.5",
                          brandProtectionEnabled
                            ? "text-violet-500"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Protección de Marca
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-[#888888]">
                        Tasa: {(BRAND_PROTECTION_RATE * 100).toFixed(0)}% sobre
                        costo CIF
                      </p>
                    </div>
                  </div>
                  {canConfigureBrandProtection ? (
                    <button
                      onClick={handleToggleBrandProtection}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                        brandProtectionEnabled
                          ? "bg-violet-500"
                          : "bg-gray-300 dark:bg-gray-600",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                          brandProtectionEnabled
                            ? "translate-x-6"
                            : "translate-x-1",
                        )}
                      />
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        brandProtectionEnabled
                          ? "bg-violet-500/10 text-violet-500"
                          : "bg-gray-500/10 text-gray-500 dark:text-[#888888]",
                      )}
                    >
                      {brandProtectionEnabled ? "Activa" : "Inactiva"}
                    </span>
                  )}
                </div>
                {brandProtectionEnabled && (
                  <div className="mt-3 rounded-lg bg-violet-500/10 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Costo CIF Ajustado
                      </span>
                      <span className="font-mono font-medium text-violet-500">
                        $
                        {(
                          product.costCIF *
                          (1 + BRAND_PROTECTION_RATE)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground dark:text-[#888888]">
                        ${product.costCIF} +{" "}
                        {(BRAND_PROTECTION_RATE * 100).toFixed(0)}% protección
                      </span>
                      <span className="font-mono text-muted-foreground dark:text-[#888888]">
                        +${(product.costCIF * BRAND_PROTECTION_RATE).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* F3 - Add Barcode Modal */}
      <CustomModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        size="sm"
      >
        <CustomModalHeader onClose={() => setIsBarcodeModalOpen(false)}>
          <Barcode className="h-5 w-5 text-muted-foreground" />
          Agregar Código de Barras
        </CustomModalHeader>
        <CustomModalBody>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Código
              </label>
              <input
                type="text"
                value={newBarcodeCode}
                onChange={(e) => setNewBarcodeCode(e.target.value)}
                placeholder="Ej: 5000267014005"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-[#2a2a2a] dark:bg-[#141414]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Etiqueta
              </label>
              <select
                value={newBarcodeLabel}
                onChange={(e) => setNewBarcodeLabel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-[#2a2a2a] dark:bg-[#141414]"
              >
                {BARCODE_LABEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground dark:text-[#888888]">
              Máximo 5 códigos por producto. Actualmente:{" "}
              {(product?.barcodes ?? []).length}/5
            </p>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="bordered"
            size="sm"
            onPress={() => setIsBarcodeModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button color="primary" size="sm" onPress={handleAddBarcode}>
            Agregar
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Modal de Confirmación de Eliminación */}
      <CustomModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <CustomModalHeader onClose={() => setIsDeleteModalOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar Producto</h3>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
            ¿Estás seguro de que deseas eliminar <span className="font-semibold text-gray-900 dark:text-white">{product.description}</span>?
            Se perderá todo el historial y stock asociado a este registro.
          </p>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            variant="bordered"
            onPress={() => setIsDeleteModalOpen(false)}
            className="h-10 px-6 font-semibold"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleDelete}
            className="h-10 px-6 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)]"
          >
            Sí, eliminar producto
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
