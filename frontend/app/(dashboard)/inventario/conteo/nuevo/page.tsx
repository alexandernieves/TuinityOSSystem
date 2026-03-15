'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  ClipboardList,
  Warehouse,
  MapPin,
  Package,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_WAREHOUSES, subscribeWarehouses, getWarehousesData } from '@/lib/mock-data/warehouses';
import { MOCK_PRODUCTS } from '@/lib/mock-data/products';
import { generateNextCountSessionId, addCountSession } from '@/lib/mock-data/inventory';
import { useStore } from '@/hooks/use-store';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

interface ProductSelection {
  productId: string;
  productReference: string;
  productDescription: string;
  barcode: string;
  systemQty: number;
  selected: boolean;
}

export default function NuevoConteoPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canCreateCount = checkPermission('canCreateCountSessions');

  // Reactive store subscription
  const warehouses = useStore(subscribeWarehouses, getWarehousesData);

  const [warehouseId, setWarehouseId] = useState('WH-001');
  const [zone, setZone] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (!canCreateCount) {
    router.push('/inventario/conteo');
    return null;
  }

  // Create product selections from mock products
  const availableProducts: ProductSelection[] = MOCK_PRODUCTS.map((p) => ({
    productId: p.id,
    productReference: p.reference,
    productDescription: p.description,
    barcode: p.barcode || '',
    systemQty: p.stock.existence,
    selected: selectedProducts.some((sp) => sp.productId === p.id && sp.selected),
  }));

  const filteredProducts = availableProducts.filter((p) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.productDescription.toLowerCase().includes(searchLower) ||
      p.productReference.toLowerCase().includes(searchLower) ||
      p.barcode.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleProduct = (productId: string) => {
    const existing = selectedProducts.find((sp) => sp.productId === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.filter((sp) => sp.productId !== productId));
    } else {
      const product = availableProducts.find((p) => p.productId === productId);
      if (product) {
        setSelectedProducts([...selectedProducts, { ...product, selected: true }]);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
      setSelectAll(false);
    } else {
      setSelectedProducts(filteredProducts.map((p) => ({ ...p, selected: true })));
      setSelectAll(true);
    }
  };

  const handleSubmit = () => {
    if (selectedProducts.length === 0) {
      toast.error('Sin productos', {
        description: 'Selecciona al menos un producto para contar',
      });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const sessionId = generateNextCountSessionId();
      const warehouse = warehouses.find((w) => w.id === warehouseId);

      addCountSession({
        id: sessionId,
        createdAt: new Date().toISOString(),
        createdBy: 'USR-000',
        createdByName: 'Usuario',
        warehouseId,
        warehouseName: warehouse?.name || '',
        zone: zone || undefined,
        status: 'en_progreso',
        lines: selectedProducts.map((p, idx) => ({
          id: `CFL-NEW-${idx}`,
          productId: p.productId,
          productReference: p.productReference,
          productDescription: p.productDescription,
          barcode: p.barcode || undefined,
          systemQty: p.systemQty,
        })),
        totalProducts: selectedProducts.length,
        countedProducts: 0,
        productsWithDifference: 0,
      });

      toast.success('Sesión creada', {
        description: `La sesión ${sessionId} ha sido creada. Puedes comenzar a contar.`,
      });
      setIsSaving(false);
      router.push(`/inventario/conteo/${sessionId}`);
    }, 500);
  };

  const selectedCount = selectedProducts.length;

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelClass = "mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#1a1a1a]";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <ClipboardList className="h-5 w-5 text-[#008060]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nueva Sesión de Conteo</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Selecciona la zona y productos a contar</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        {/* Configuration Section */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Configuración</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                <Warehouse className="h-4 w-4 text-gray-400" />
                Bodega
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className={inputClass}
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                <MapPin className="h-4 w-4 text-gray-400" />
                Zona (opcional)
              </label>
              <input
                placeholder="Ej: Pasillo A - Whisky"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Products Selection */}
        <div className="p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Productos a Contar</h2>
              {selectedCount > 0 && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {selectedCount} seleccionados
                </span>
              )}
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9196]" />
              <input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(inputClass, "pl-9")}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left">
                    <Switch
                      checked={selectAll && selectedCount === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Código de Barras
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Stock Sistema
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {filteredProducts.slice(0, 15).map((product) => {
                  const isSelected = selectedProducts.some((sp) => sp.productId === product.productId);
                  return (
                    <tr
                      key={product.productId}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
                        isSelected && 'bg-emerald-50/50 dark:bg-emerald-900/10'
                      )}
                      onClick={() => handleToggleProduct(product.productId)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => handleToggleProduct(product.productId)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-gray-900 dark:text-white">
                            {product.productDescription}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.productReference}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[13px] text-gray-600 dark:text-gray-400">
                          {product.barcode || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                          {product.systemQty}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[13px] text-gray-500 dark:text-[#888888]">
                      No se encontraron productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > 15 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Mostrando 15 de {filteredProducts.length} productos. Usa la búsqueda para filtrar.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-b-xl">
          <div className="flex items-center gap-2 text-[13px] text-[#1a1a1a] dark:text-gray-400 font-medium">
            <Package className="h-4 w-4" />
            <span>
              {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
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
              disabled={selectedCount === 0 || isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Iniciar Conteo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
