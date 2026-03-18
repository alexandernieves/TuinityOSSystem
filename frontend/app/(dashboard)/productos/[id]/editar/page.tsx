"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Package, ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_GROUPS } from "@/lib/mock-data/products";
import { api } from "@/lib/services/api";
import { SkeletonDashboard } from "@/components/ui/skeleton-dashboard";

const MOCK_SUPPLIERS = [
  { id: "1", name: "GLOBAL BRANDS, S.A." },
  { id: "2", name: "TRIPLE DOUBLE LIMITED" },
  { id: "3", name: "DIAGEO PANAMA" },
  { id: "4", name: "PERNOD RICARD" },
];

const initialFormState = {
  description: "",
  brand: "",
  group: "",
  barcode: "",
  reference: "",
  supplier: "",
  unit: "CAJA",
  minimumQty: "10",
  tariffCode: "",
  priceA: "",
  priceB: "",
  priceC: "",
  priceD: "",
  priceE: "",
  status: true,
};

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await api.getProductById(productId);
        if (data) {
          const supplierId = MOCK_SUPPLIERS.find(s => s.name === data.supplier)?.id || data.supplier;
          
          setFormData({
            description: data.description || "",
            brand: data.brand || "",
            group: (typeof data.group === 'object' ? data.group?.id || data.group?.code : data.group) || "",
            barcode: data.barcode || "",
            reference: data.reference || "",
            supplier: supplierId || "",
            unit: data.unit || "CAJA",
            minimumQty: data.minimumQty?.toString() || "10",
            tariffCode: data.tariffCode || "",
            priceA: data.prices?.A?.toString() || "",
            priceB: data.prices?.B?.toString() || "",
            priceC: data.prices?.C?.toString() || "",
            priceD: data.prices?.D?.toString() || "",
            priceE: data.prices?.E?.toString() || "",
            status: data.status === "active",
          });
        }
      } catch (err: any) {
        toast.error("Error al cargar producto", {
          description: err.message,
        });
        router.push("/productos");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProduct = async () => {
    if (
      !formData.description ||
      !formData.brand ||
      !formData.group ||
      !formData.supplier
    ) {
      toast.error("Campos requeridos", {
        description: "Por favor completa todos los campos obligatorios",
      });
      return;
    }

    const supplierName =
      MOCK_SUPPLIERS.find((s) => s.id === formData.supplier)?.name ||
      formData.supplier;

    const updatedProduct = {
      description: formData.description,
      brand: formData.brand,
      group: formData.group,
      subGroup: formData.group,
      supplier: supplierName,
      barcode: formData.barcode,
      reference: formData.reference,
      tariffCode: formData.tariffCode,
      unit: formData.unit,
      minimumQty: parseInt(formData.minimumQty) || 10,
      prices: {
        A: parseFloat(formData.priceA) || 0,
        B: parseFloat(formData.priceB) || 0,
        C: parseFloat(formData.priceC) || 0,
        D: parseFloat(formData.priceD) || 0,
        E: parseFloat(formData.priceE) || 0,
      },
      status: formData.status ? "active" : "inactive",
    };

    setSaving(true);
    try {
      await api.updateProduct(productId, updatedProduct);

      toast.success("Producto actualizado", {
        description: `${formData.description} ha sido guardado correctamente`,
      });

      router.push(`/productos/${productId}`);
    } catch (err: any) {
      toast.error("Error al actualizar el producto", {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-white dark:placeholder:text-[#555]";
  const labelStyle = { fontWeight: 600 };
  const labelClass = "block text-[13px] text-[#1a1a1a] mb-1.5 dark:text-gray-300";

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-700 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Editar Producto
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              ID: {productId}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="p-6">
          <div className="space-y-6">
            {/* Main Info */}
            <div className="flex gap-4">
              <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] transition-colors hover:border-[#008060] cursor-pointer group">
                <ImagePlus className="h-6 w-6 text-gray-400 group-hover:text-[#008060]" />
                <span className="text-[10px] text-gray-500 mt-1 group-hover:text-[#008060]">Cargar Foto</span>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Descripción del producto"
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={labelStyle}>
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Marca"
                      value={formData.brand}
                      onChange={(e) =>
                        handleFormChange("brand", e.target.value)
                      }
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass} style={labelStyle}>
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.group}
                      onChange={(e) =>
                        handleFormChange("group", e.target.value)
                      }
                      className={inputClass}
                      required
                    >
                      <option value="">Seleccionar</option>
                      {PRODUCT_GROUPS.map((group) => (
                        <option key={group.id} value={group.id}>{group.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Identificación
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Código de barras
                  </label>
                  <input
                    type="text"
                    placeholder="Código de barras"
                    value={formData.barcode}
                    onChange={(e) =>
                      handleFormChange("barcode", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Referencia"
                    value={formData.reference}
                    onChange={(e) =>
                      handleFormChange("reference", e.target.value)
                    }
                    className={inputClass}
                    disabled
                  />
                  <p className="mt-1 text-[10px] text-gray-400">La referencia no puede ser editada</p>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Cod. arancelario
                  </label>
                  <input
                    type="text"
                    placeholder="Código arancelario"
                    value={formData.tariffCode}
                    onChange={(e) =>
                      handleFormChange("tariffCode", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Supplier & Unit */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Proveedor y Unidad
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Proveedor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) =>
                      handleFormChange("supplier", e.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {MOCK_SUPPLIERS.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Unidad
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleFormChange("unit", e.target.value)}
                    className={inputClass}
                  >
                    <option value="CAJA">Caja</option>
                    <option value="UNIDAD">Unidad</option>
                    <option value="BOTELLA">Botella</option>
                    <option value="PAQUETE">Paquete</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>
                    Cantidad mínima
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.minimumQty}
                    onChange={(e) =>
                      handleFormChange("minimumQty", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Prices Section */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                Precios por nivel de cliente
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((level) => (
                  <div key={level}>
                    <label className={labelClass} style={labelStyle}>
                      Nivel {level}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8c9196]">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={formData[`price${level}` as keyof typeof formData]}
                        onChange={(e) => handleFormChange(`price${level}`, e.target.value)}
                        className={inputClass + " pl-6"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Estado del producto
                </p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">
                  Productos inactivos no aparecen en ventas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.status}
                  onCheckedChange={(value) => handleFormChange("status", value)}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formData.status ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdateProduct}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
