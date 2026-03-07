"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Package, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_GROUPS } from "@/lib/mock-data/products";
import { api } from "@/lib/services/api";

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

export default function NuevoProductoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateProduct = async () => {
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
    const newId = `EVL-${String(Date.now()).slice(-5)}`;

    const newProduct = {
      reference: formData.reference || newId, // Default to a generated reference if empty
      description: formData.description,
      brand: formData.brand,
      group: formData.group,
      subGroup: formData.group,
      supplier: supplierName,
      country: "",
      barcode: formData.barcode,
      tariffCode: formData.tariffCode,
      unit: formData.unit,
      unitsPerCase: 12,
      reorderPoint: parseInt(formData.minimumQty) || 10,
      minimumQty: parseInt(formData.minimumQty) || 10,
      prices: {
        A: parseFloat(formData.priceA) || 0,
        B: parseFloat(formData.priceB) || 0,
        C: parseFloat(formData.priceC) || 0,
        D: parseFloat(formData.priceD) || 0,
        E: parseFloat(formData.priceE) || 0,
      },
      costFOB: 0,
      costCIF: 0,
      costAvgWeighted: 0,
      status: formData.status ? "active" : "inactive",
    };

    setLoading(true);
    try {
      await api.createProduct(newProduct);

      toast.success("Producto creado", {
        description: `${formData.description} ha sido agregado al catálogo`,
      });

      router.push("/productos");
    } catch (err: any) {
      toast.error("Error al crear el producto", {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900">
            <Package className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Nuevo Producto
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              Completa la información del producto
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
              <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] transition-colors hover:border-brand-400 cursor-pointer">
                <ImagePlus className="h-6 w-6 text-gray-400" />
                <span className="text-[10px] text-gray-500 mt-1">Imagen</span>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="WHISKY JOHNNIE WALKER BLACK 12YRS 750ML"
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="JOHNNIE WALKER"
                      value={formData.brand}
                      onChange={(e) =>
                        handleFormChange("brand", e.target.value)
                      }
                      variant="bordered"
                      classNames={{
                        inputWrapper: "bg-white dark:bg-[#1a1a1a]",
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <Select
                      placeholder="Seleccionar"
                      selectedKeys={formData.group ? [formData.group] : []}
                      onChange={(e) =>
                        handleFormChange("group", e.target.value)
                      }
                      variant="bordered"
                      classNames={{ trigger: "bg-white dark:bg-[#1a1a1a]" }}
                    >
                      {PRODUCT_GROUPS.map((group) => (
                        <SelectItem key={group.id}>{group.label}</SelectItem>
                      ))}
                    </Select>
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
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Código de barras
                  </label>
                  <Input
                    placeholder="7501050439022"
                    value={formData.barcode}
                    onChange={(e) =>
                      handleFormChange("barcode", e.target.value)
                    }
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Referencia
                  </label>
                  <Input
                    placeholder="JW-BLK-750"
                    value={formData.reference}
                    onChange={(e) =>
                      handleFormChange("reference", e.target.value)
                    }
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cod. arancelario
                  </label>
                  <Input
                    placeholder="2208.30.00"
                    value={formData.tariffCode}
                    onChange={(e) =>
                      handleFormChange("tariffCode", e.target.value)
                    }
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
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
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Proveedor <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder="Seleccionar"
                    selectedKeys={formData.supplier ? [formData.supplier] : []}
                    onChange={(e) =>
                      handleFormChange("supplier", e.target.value)
                    }
                    variant="bordered"
                    classNames={{ trigger: "bg-white dark:bg-[#1a1a1a]" }}
                  >
                    {MOCK_SUPPLIERS.map((supplier) => (
                      <SelectItem key={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unidad
                  </label>
                  <Select
                    selectedKeys={[formData.unit]}
                    onChange={(e) => handleFormChange("unit", e.target.value)}
                    variant="bordered"
                    classNames={{ trigger: "bg-white dark:bg-[#1a1a1a]" }}
                  >
                    <SelectItem key="CAJA">Caja</SelectItem>
                    <SelectItem key="UNIDAD">Unidad</SelectItem>
                    <SelectItem key="BOTELLA">Botella</SelectItem>
                    <SelectItem key="PAQUETE">Paquete</SelectItem>
                  </Select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cantidad mínima
                  </label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.minimumQty}
                    onChange={(e) =>
                      handleFormChange("minimumQty", e.target.value)
                    }
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
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
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    A (Mayor)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    startContent={
                      <span className="text-xs text-gray-400">$</span>
                    }
                    value={formData.priceA}
                    onChange={(e) => handleFormChange("priceA", e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    B (Distr)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    startContent={
                      <span className="text-xs text-gray-400">$</span>
                    }
                    value={formData.priceB}
                    onChange={(e) => handleFormChange("priceB", e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    C (Detal)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    startContent={
                      <span className="text-xs text-gray-400">$</span>
                    }
                    value={formData.priceC}
                    onChange={(e) => handleFormChange("priceC", e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    D (Espec)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    startContent={
                      <span className="text-xs text-gray-400">$</span>
                    }
                    value={formData.priceD}
                    onChange={(e) => handleFormChange("priceD", e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    E (Públ)
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    startContent={
                      <span className="text-xs text-gray-400">$</span>
                    }
                    value={formData.priceE}
                    onChange={(e) => handleFormChange("priceE", e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: "bg-white dark:bg-[#1a1a1a]" }}
                  />
                </div>
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
          <Button
            variant="light"
            onPress={() => router.back()}
            isDisabled={loading}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleCreateProduct}
            isLoading={loading}
            className="bg-brand-600"
          >
            {loading ? "Creando..." : "Crear Producto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
