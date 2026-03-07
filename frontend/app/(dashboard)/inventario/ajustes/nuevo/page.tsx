"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/auth-context";
import { cn } from "@/lib/utils/cn";
import { api } from "@/lib/services/api";
import { useStore } from "@/hooks/use-store";
import {
  ADJUSTMENT_REASONS,
  type AdjustmentType,
  type AdjustmentReason,
  type AdjustmentLine,
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

    setLoading(true);
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
          adjustmentQty: l.adjustmentQty, // Note: backend could expect absolute or relative positive quantity depending on type. Our schema takes absolute quantity.
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
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <FileText className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Nuevo Ajuste de Inventario
            </h1>
            <p className="text-sm text-gray-500">
              Crear ajuste positivo o negativo
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Form Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Warehouse */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bodega
              </label>
              <Select
                selectedKeys={[warehouseId]}
                onChange={(e) => setWarehouseId(e.target.value)}
                variant="bordered"
                classNames={{ trigger: "bg-white" }}
              >
                {warehouses.map((w) => (
                  <SelectItem key={w.id}>{w.name}</SelectItem>
                ))}
              </Select>
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo de Ajuste
              </label>
              <div className="flex rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setAdjustmentType("positivo")}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    adjustmentType === "positivo"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  + Positivo
                </button>
                <button
                  onClick={() => setAdjustmentType("negativo")}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    adjustmentType === "negativo"
                      ? "bg-red-100 text-red-700"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  - Negativo
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Motivo <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Seleccionar motivo"
                selectedKeys={reason ? [reason] : []}
                onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                variant="bordered"
                classNames={{ trigger: "bg-white" }}
              >
                {Object.entries(ADJUSTMENT_REASONS).map(([key, label]) => (
                  <SelectItem key={key}>{label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Observation */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Observación
            </label>
            <Textarea
              placeholder="Detalle adicional del ajuste (opcional)"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              variant="bordered"
              classNames={{ inputWrapper: "bg-white" }}
            />
          </div>

          {/* Evidence Upload */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Evidencia (opcional)
            </label>
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-brand-400 hover:bg-brand-50">
              <div className="flex flex-col items-center text-gray-500">
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
            <h2 className="text-lg font-semibold text-gray-900">
              Productos a Ajustar
            </h2>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              Agregar Producto
            </button>
          </div>

          {/* Products Table */}
          {lines.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Stock Actual
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Cantidad{" "}
                      {adjustmentType === "positivo" ? "a Sumar" : "a Restar"}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Stock Resultante
                    </th>
                    {canViewCosts && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Valor
                      </th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, index) => {
                    const resultingStock =
                      adjustmentType === "positivo"
                        ? line.currentStock + line.adjustmentQty
                        : line.currentStock - line.adjustmentQty;
                    const isNegativeResult = resultingStock < 0;

                    return (
                      <tr key={line.productId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {line.productDescription}
                            </p>
                            <p className="text-xs text-gray-500">
                              {line.productReference}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-600">
                            {line.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={1}
                            value={line.adjustmentQty.toString()}
                            onChange={(e) =>
                              handleUpdateQty(
                                index,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            variant="bordered"
                            size="sm"
                            classNames={{
                              base: "w-24 ml-auto",
                              inputWrapper: "bg-white",
                              input: "text-right",
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isNegativeResult
                                ? "text-red-600"
                                : "text-gray-900",
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
                            <span className="font-mono text-sm text-gray-700">
                              {formatCurrency(
                                line.adjustmentQty * line.costCIF,
                              )}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveLine(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12">
              <Package className="mb-3 h-10 w-10 text-gray-400" />
              <p className="mb-1 text-sm font-medium text-gray-900">
                Sin productos
              </p>
              <p className="mb-4 text-xs text-gray-500">
                Agrega productos para el ajuste
              </p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>
          )}

          {/* Summary */}
          {lines.length > 0 && (
            <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-500">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalItems}
                  </p>
                </div>
                {canViewCosts && (
                  <div>
                    <p className="text-xs text-gray-500">Valor Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="light"
                  onPress={() => router.back()}
                  isDisabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  className="bg-brand-600"
                  isLoading={loading}
                >
                  {loading ? "Enviando..." : "Enviar para Aprobación"}
                </Button>
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
          <Search className="h-5 w-5 text-gray-600" />
          Buscar Producto
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <Input
            placeholder="Buscar por nombre, referencia o código de barras..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            variant="bordered"
            startContent={<Search className="h-4 w-4 text-gray-400" />}
            classNames={{ inputWrapper: "bg-white" }}
          />
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {filteredProducts.slice(0, 20).map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {product.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.reference} • Stock: {product.stock?.existence || 0}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-gray-400" />
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">
                No se encontraron productos
              </div>
            )}
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsSearchOpen(false)}>
            Cerrar
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
