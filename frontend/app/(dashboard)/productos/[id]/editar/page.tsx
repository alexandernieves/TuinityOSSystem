"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Package, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_GROUPS } from "@/lib/mock-data/products";
import { api } from "@/lib/services/api";
import { MOCK_SUPPLIERS } from "@/lib/mock-data/purchase-orders";
import { SkeletonDashboard } from "@/components/ui/skeleton-dashboard";
import { cn } from "@/lib/utils/cn";

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await api.getProductById(productId);
        setProduct(data);
        const supplierMatch = MOCK_SUPPLIERS.find(
          (s) => s.name === data.supplier,
        );
        setFormData({
          description: data.description || "",
          brand: data.brand || "",
          group: data.group || "",
          subGroup: data.subGroup || "",
          barcode: data.barcode || "",
          reference: data.reference || "",
          supplier: supplierMatch?.id || data.supplier || "",
          country: data.country || "",
          unit: data.unit || "CJA",
          unitsPerCase: data.unitsPerCase?.toString() || "12",
          minimumQty: data.minimumQty?.toString() || "10",
          tariffCode: data.tariffCode || "",
          priceA: data.prices?.A?.toString() || "",
          priceB: data.prices?.B?.toString() || "",
          priceC: data.prices?.C?.toString() || "",
          priceD: data.prices?.D?.toString() || "",
          priceE: data.prices?.E?.toString() || "",
          costFOB: data.costFOB?.toString() || "",
          costCIF: data.costCIF?.toString() || "",
          status: data.status === "active",
        });
        setImagePreview(data.image || null);
      } catch (err: any) {
        toast.error("Error al cargar producto");
      } finally {
        setLoading(false);
      }
    };
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

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveProduct = async () => {
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

    setSaving(true);
    try {
      await api.updateProduct(productId, {
        description: formData.description,
        brand: formData.brand,
        group: formData.group,
        subGroup: formData.subGroup,
        barcode: formData.barcode,
        reference: formData.reference,
        supplier: supplierName,
        country: formData.country,
        unit: formData.unit,
        unitsPerCase: parseInt(formData.unitsPerCase) || product.unitsPerCase,
        minimumQty: parseInt(formData.minimumQty) || product.minimumQty,
        tariffCode: formData.tariffCode,
        prices: {
          A: parseFloat(formData.priceA) || product.prices?.A || 0,
          B: parseFloat(formData.priceB) || product.prices?.B || 0,
          C: parseFloat(formData.priceC) || product.prices?.C || 0,
          D: parseFloat(formData.priceD) || product.prices?.D || 0,
          E: parseFloat(formData.priceE) || product.prices?.E || 0,
        },
        costFOB: parseFloat(formData.costFOB) || product.costFOB || 0,
        costCIF: parseFloat(formData.costCIF) || product.costCIF || 0,
        status: formData.status ? "active" : "inactive",
      });

      toast.success("Producto actualizado", {
        description: `Los cambios en "${formData.description}" han sido guardados`,
      });

      router.push(`/productos/${product.id}`);
    } catch (err: any) {
      toast.error("Error al actualizar el producto", {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const response = await api.uploadProductImage(productId, file);
      toast.success("Imagen subida correctamente");
      setImagePreview(response.image); // URL de S3
    } catch (err: any) {
      toast.error("Error al subir imagen");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const inputClasses = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]";
  const labelClasses = "block text-[13px] text-[#1a1a1a] mb-1.5";
  const sectionTitleClasses = "text-[11px] text-[#1a1a1a] mb-4 border-l-4 border-[#ff6f00] pl-2 font-[700] tracking-[0.5px] uppercase";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c9cccf] bg-white text-[#1a1a1a] transition-all hover:bg-[#f6f6f7] shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[#1a1a1a]" />
          <h1 className="text-[20px] font-bold text-[#1a1a1a] tracking-tight">
            Editar producto
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#e1e3e5] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-8">
          {/* SECCIÓN 1: Información Principal con Imagen */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Imagen del Producto */}
            <div className="shrink-0">
              <label className={labelClasses} style={{ fontWeight: 600 }}>
                Imagen del Producto
              </label>
              <div 
                onClick={() => document.getElementById("image-upload")?.click()}
                className="group relative flex h-40 w-40 flex-col items-center justify-center overflow-hidden rounded-[12px] border border-[#c9cccf] bg-[#f6f6f7] transition-all hover:border-[#8c9196] cursor-pointer shadow-sm"
              >
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Product" 
                      className="h-full w-full object-cover" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <ImagePlus className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6 text-[#8c9196] mb-2" />
                    <span className="text-[12px] font-medium text-[#8c9196]">Añadir imagen</span>
                  </>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#008060] border-t-transparent" />
                  </div>
                )}
              </div>
              <input 
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex-1 space-y-4">
              {/* Descripción */}
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Descripción del Producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: WHISKY JOHNNIE WALKER BLACK 12YRS 750ML"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className={inputClasses}
                />
              </div>

              {/* Marca y Categoría */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses} style={{ fontWeight: 600 }}>
                    Marca *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: JOHNNIE WALKER"
                    value={formData.brand}
                    onChange={(e) => handleFormChange("brand", e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses} style={{ fontWeight: 600 }}>
                    Categoría *
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => handleFormChange("group", e.target.value)}
                    className="w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]"
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

          {/* SECCIÓN 2: IDENTIFICACIÓN TÉCNICA */}
          <div className="mb-6">
            <h2 className={sectionTitleClasses}>
              IDENTIFICACIÓN TÉCNICA
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Referencia Interna
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => handleFormChange("reference", e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleFormChange("barcode", e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Posición Arancelaria
                </label>
                <input
                  type="text"
                  value={formData.tariffCode}
                  onChange={(e) => handleFormChange("tariffCode", e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: PROVEEDOR Y LOGÍSTICA */}
          <div className="mb-6">
            <h2 className={sectionTitleClasses}>
              PROVEEDOR Y LOGÍSTICA
            </h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Proveedor *
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => handleFormChange("supplier", e.target.value)}
                  className="w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                >
                  <option value="">Seleccionar</option>
                  {MOCK_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  País de Origen
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleFormChange("country", e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Empaque / Unidad
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => handleFormChange("unit", e.target.value)}
                  className="w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                >
                  <option value="CJA">Caja</option>
                  <option value="UND">Unidad</option>
                  <option value="BOT">Botella</option>
                  <option value="PAQ">Paquete</option>
                </select>
              </div>
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Unidades por Caja
                </label>
                <input
                  type="number"
                  value={formData.unitsPerCase}
                  onChange={(e) => handleFormChange("unitsPerCase", e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="max-w-xs">
              <label className={labelClasses} style={{ fontWeight: 600 }}>
                Cantidad Mínima Requerida
              </label>
              <input
                type="number"
                value={formData.minimumQty}
                onChange={(e) => handleFormChange("minimumQty", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          {/* SECCIÓN 4: NIVELES DE VENTA (PRECIOS) */}
          <div className="mb-6">
            <h2 className={sectionTitleClasses}>
              NIVELES DE VENTA (PRECIOS)
            </h2>
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Nivel A (Mayor)", field: "priceA" },
                { label: "Nivel B (Distr)", field: "priceB" },
                { label: "Nivel C (Detal)", field: "priceC" },
                { label: "Nivel D (Espec)", field: "priceD" },
                { label: "Nivel E (Pial)", field: "priceE" },
              ].map((price) => (
                <div key={price.field}>
                  <label className={labelClasses} style={{ fontWeight: 600 }}>
                    {price.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-[7px] text-[13px] text-[#008060]" style={{ fontWeight: 600 }}>$</span>
                    <input
                      type="number"
                      value={formData[price.field]}
                      onChange={(e) => handleFormChange(price.field, e.target.value)}
                      className="w-full pl-6 pr-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 5: GESTIÓN DE COSTOS */}
          <div className="mb-6">
            <h2 className={sectionTitleClasses}>
              GESTIÓN DE COSTOS
            </h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Costo FOB Operativo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-[7px] text-[13px] text-[#008060]" style={{ fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    value={formData.costFOB}
                    onChange={(e) => handleFormChange("costFOB", e.target.value)}
                    className="w-full pl-6 pr-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses} style={{ fontWeight: 600 }}>
                  Costo CIF Proyectado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-[7px] text-[13px] text-[#008060]" style={{ fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    value={formData.costCIF}
                    onChange={(e) => handleFormChange("costCIF", e.target.value)}
                    className="w-full pl-6 pr-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 6: TOGGLE SWITCH */}
          <div className="mb-8 bg-white rounded-[12px] p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08)]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-2 h-2 rounded-full", formData.status ? "bg-[#008060]" : "bg-[#6d7175]")}></div>
                  <h3 className="text-[13px] text-[#1a1a1a]" style={{ fontWeight: 600 }}>
                    Visibilidad y Estado del Producto
                  </h3>
                </div>
                <p className="text-[13px] text-[#6d7175] leading-relaxed">
                  Al desactivar este producto, dejará de estar disponible para nuevos pedidos, facturas y proformas. Los datos históricos y reportes previos permanecerán intactos.
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <span className="text-[11px] text-[#6d7175]" style={{ fontWeight: 600 }}>
                  {formData.status ? "SISTEMA ACTIVO" : "SISTEMA INACTIVO"}
                </span>
                <button 
                  onClick={() => handleFormChange("status", !formData.status)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    formData.status ? "bg-[#008060]" : "bg-[#c9cccf]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    formData.status ? "translate-x-6" : "translate-x-1"
                  )}></span>
                </button>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e1e3e5]">
            <button 
              onClick={() => router.back()}
              className="px-4 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[#1a1a1a] text-[13px] hover:bg-[#f6f6f7] transition-colors shadow-[0_1px_0_rgba(0,0,0,0.05)]"
              style={{ fontWeight: 600 }}
            >
              Cancelar trámite
            </button>
            <button
              onClick={handleSaveProduct}
              disabled={saving}
              className="px-4 py-[7px] rounded-[8px] bg-[#2c5282] text-white text-[13px] hover:bg-[#1e3a5f] transition-colors shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] flex items-center gap-2 disabled:opacity-50"
              style={{ fontWeight: 600 }}
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v12M2 8h12"/>
                </svg>
              )}
              Actualizar inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
