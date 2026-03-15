"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalBody,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Search,
  Package,
  ImagePlus,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import {
  ADJUSTMENT_REASONS,
  type AdjustmentType,
  type AdjustmentReason,
} from "@/lib/types/inventory";

interface FormLine {
  productId: string;
  productReference: string;
  productDescription: string;
  currentStock: number;
  adjustmentQty: number;
  costCIF: number;
}

export default function NuevoAjustePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkPermission } = useAuth();
  const canViewCosts = checkPermission("canViewCosts");

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [adjustmentType, setAdjustmentType] =
    useState<AdjustmentType>("negativo");
  const [reason, setReason] = useState<AdjustmentReason | "">("");
  const [observation, setObservation] = useState("");
  const [lines, setLines] = useState<FormLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Product search modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wData, pData] = await Promise.all([
          api.getWarehouses(),
          api.getProducts(),
        ]);
        setWarehouses(wData);
        if (wData.length > 0) setWarehouseId(wData[0].id);
        setProducts(pData);
      } catch (error) {
        toast.error("Error cargando datos");
      }
    };
    fetchData();
  }, []);

  // Pre-populate product from URL if provided
  useEffect(() => {
    const productId = searchParams.get("product");
    if (productId && products.length > 0) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setLines([
          {
            productId: product.id,
            productReference: product.reference,
            productDescription: product.description,
            currentStock: product.stock?.existence || 0,
            adjustmentQty: 1,
            costCIF: product.costCIF || 0,
          },
        ]);
      }
    }
  }, [searchParams, products]);

  // Filter products for search
  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const searchLower = productSearch.toLowerCase();
    return (
      p.description.toLowerCase().includes(searchLower) ||
      p.reference.toLowerCase().includes(searchLower) ||
      p.barcode?.toLowerCase().includes(searchLower)
    );
  });

  // Add product to lines
  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if already added
    if (lines.some((l) => l.productId === productId)) {
      toast.error("Producto duplicado", {
        description: "Este producto ya está en la lista",
      });
      return;
    }

    setLines([
      ...lines,
      {
        productId: product.id,
        productReference: product.reference,
        productDescription: product.description,
        currentStock: product.stock?.existence || 0,
        adjustmentQty: 1,
        costCIF: product.costCIF || 0,
      },
    ]);

    setIsSearchOpen(false);
    setProductSearch("");
  };

  // Remove product from lines
  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Update line quantity
  const handleUpdateQty = (index: number, qty: number) => {
    const newLines = [...lines];
    newLines[index].adjustmentQty = qty;
    setLines(newLines);
  };

  // Calculate totals
  const totalItems = lines.reduce(
    (sum, l) => sum + Math.abs(l.adjustmentQty),
    0,
  );
  const totalValue = lines.reduce(
    (sum, l) => sum + Math.abs(l.adjustmentQty) * l.costCIF,
    0,
  );

  // Validate form
  const validateForm = () => {
    if (!reason) {
      toast.error("Motivo requerido", {
        description: "Selecciona un motivo para el ajuste",
      });
      return false;
    }

    if (lines.length === 0) {
      toast.error("Sin productos", {
        description: "Agrega al menos un producto al ajuste",
      });
      return false;
    }

    // Validate no zero quantities
    if (lines.some((l) => l.adjustmentQty === 0)) {
      toast.error("Cantidad inválida", {
        description: "Las cantidades deben ser mayores a 0",
      });
      return false;
    }

    // Validate stock for negative adjustments
    if (adjustmentType === "negativo") {
      for (const line of lines) {
        if (line.adjustmentQty > line.currentStock) {
          toast.error("Stock insuficiente", {
            description: `${line.productDescription}: Solo hay ${line.currentStock} en stock`,
          });
          return false;
        }
      }
    }

    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await api.createAdjustment({
        createdBy: user?.id,
        warehouseId,
        type: adjustmentType,
        reason: reason as string,
        observation,
        lines: lines.map((l) => ({
          productId: l.productId,
          currentStock: l.currentStock,
          adjustmentQty: l.adjustmentQty,
          resultingStock:
            adjustmentType === "positivo"
              ? l.currentStock + l.adjustmentQty
              : l.currentStock - l.adjustmentQty,
          costCIF: l.costCIF,
          lineValue: l.adjustmentQty * l.costCIF,
        })),
        totalItems,
        totalValue,
      });

      toast.success("Ajuste creado", {
        description: `El ajuste ha sido enviado para aprobación.`,
      });

      router.push("/inventario/ajustes");
    } catch (err: any) {
      toast.error("Error al crear el ajuste", {
        description: err.message,
      });
      setIsSaving(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelStyle = { fontWeight: 600 };
  const labelClass = "block text-[13px] text-[#1a1a1a] mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <FileText className="h-5 w-5 text-[#008060]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Nuevo Ajuste de Inventario
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              Crear ajuste positivo o negativo
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        {/* Form Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Warehouse */}
            <div>
              <label className={labelClass} style={labelStyle}>
                Bodega
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className={inputClass}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className={labelClass} style={labelStyle}>
                Tipo de Ajuste
              </label>
              <div className="flex rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-1 bg-gray-50 dark:bg-[#1a1a1a]">
                <button
                  onClick={() => setAdjustmentType("positivo")}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                    adjustmentType === "positivo"
                      ? "bg-white dark:bg-[#141414] text-emerald-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-white",
                  )}
                >
                  + Positivo
                </button>
                <button
                  onClick={() => setAdjustmentType("negativo")}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all",
                    adjustmentType === "negativo"
                      ? "bg-white dark:bg-[#141414] text-red-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-white",
                  )}
                >
                  - Negativo
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className={labelClass} style={labelStyle}>
                Motivo <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                className={inputClass}
              >
                <option value="">Seleccionar motivo</option>
                {Object.entries(ADJUSTMENT_REASONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observation */}
          <div className="mt-6">
            <label className={labelClass} style={labelStyle}>
              Observación
            </label>
            <textarea
              placeholder="Detalle adicional del ajuste (opcional)"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className={cn(inputClass, "resize-none h-24")}
              rows={3}
            />
          </div>

          {/* Evidence Upload */}
          <div className="mt-6">
            <label className={labelClass} style={labelStyle}>
              Evidencia (opcional)
            </label>
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] transition-colors hover:border-[#008060] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer">
              <div className="flex flex-col items-center text-gray-500 dark:text-[#888888]">
                <ImagePlus className="mb-1 h-6 w-6" />
                <span className="text-xs">
                  Click o arrastra para subir fotos
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Productos a Ajustar
            </h2>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-[#333]"
            >
              <Plus className="h-4 w-4" />
              Agregar Producto
            </button>
          </div>

          {/* Products Table */}
          {lines.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Stock Actual
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Cantidad{" "}
                      {adjustmentType === "positivo" ? "a Sumar" : "a Restar"}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Stock Resultante
                    </th>
                    {canViewCosts && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Valor
                      </th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {lines.map((line, index) => {
                    const resultingStock =
                      adjustmentType === "positivo"
                        ? line.currentStock + line.adjustmentQty
                        : line.currentStock - line.adjustmentQty;
                    const isNegativeResult = resultingStock < 0;

                    return (
                      <tr key={line.productId} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {line.productDescription}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[#888888]">
                              {line.productReference}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {line.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={1}
                            value={line.adjustmentQty.toString()}
                            onChange={(e) =>
                              handleUpdateQty(
                                index,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className={cn(inputClass, "w-24 ml-auto text-right")}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isNegativeResult
                                ? "text-red-600"
                                : "text-gray-900 dark:text-white",
                            )}
                          >
                            {resultingStock}
                            {isNegativeResult && (
                              <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-red-500" />
                            )}
                          </span>
                        </td>
                        {canViewCosts && (
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm text-gray-700 dark:text-gray-400">
                              {formatCurrency(
                                line.adjustmentQty * line.costCIF,
                              )}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveLine(index)}
                            className="flex mx-auto h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] py-12">
              <Package className="mb-3 h-10 w-10 text-gray-400" />
              <p className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                Sin productos
              </p>
              <p className="mb-4 text-xs text-gray-500 dark:text-[#888888]">
                Agrega productos para el ajuste
              </p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>
          )}

          {/* Summary */}
          {lines.length > 0 && (
            <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-4 border border-gray-100 dark:border-[#2a2a2a]">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalItems}
                  </p>
                </div>
                {canViewCosts && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">Valor Total</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar para Aprobación"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Search Modal */}
      <CustomModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        size="2xl"
        scrollable
      >
        <CustomModalHeader onClose={() => setIsSearchOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <Search className="h-5 w-5 text-[#008060]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Buscar Producto
              </h2>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Buscar por nombre, referencia o código de barras..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className={cn(inputClass, "pl-10")}
            />
          </div>
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
            {filteredProducts.slice(0, 20).map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-3 text-left transition-all hover:border-[#008060] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 dark:bg-[#2a2a2a]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#008060] transition-colors">
                    {product.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">
                    {product.reference} • Stock: {product.stock?.existence || 0}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-gray-400 group-hover:text-[#008060]" />
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-[#888888]">
                <Package className="mx-auto h-8 w-8 mb-2 opacity-20" />
                No se encontraron productos
              </div>
            )}
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
