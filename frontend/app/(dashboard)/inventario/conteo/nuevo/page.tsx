'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  ClipboardList,
  Warehouse,
  MapPin,
  Package,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_WAREHOUSES, subscribeWarehouses, getWarehousesData } from '@/lib/mock-data/warehouses';
import { MOCK_PRODUCTS } from '@/lib/mock-data/products';
import { generateNextCountSessionId, addCountSession } from '@/lib/mock-data/inventory';
import { useStore } from '@/hooks/use-store';

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
    router.push(`/inventario/conteo/${sessionId}`);
  };

  const selectedCount = selectedProducts.length;

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <ClipboardList className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nueva Sesión de Conteo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona la zona y productos a contar</p>
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
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Warehouse className="h-4 w-4 text-gray-400" />
                Bodega
              </label>
              <Select
                selectedKeys={[warehouseId]}
                onChange={(e) => setWarehouseId(e.target.value)}
                variant="bordered"
                classNames={{ trigger: 'bg-white' }}
              >
                {warehouses.map((w) => (
                  <SelectItem key={w.id}>
                    {w.name} ({w.type})
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPin className="h-4 w-4 text-gray-400" />
                Zona (opcional)
              </label>
              <Input
                placeholder="Ej: Pasillo A - Whisky"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                variant="bordered"
                classNames={{ inputWrapper: 'bg-white' }}
              />
            </div>
          </div>
        </div>

        {/* Products Selection */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Productos a Contar</h2>
              {selectedCount > 0 && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-sm font-medium text-brand-700">
                  {selectedCount} seleccionados
                </span>
              )}
            </div>
            <div className="w-80">
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                startContent={<Search className="h-4 w-4 text-gray-400" />}
                variant="bordered"
                classNames={{ inputWrapper: 'bg-white' }}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left">
                    <Switch
                      checked={selectAll && selectedCount === filteredProducts.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Código de Barras
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
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
                        isSelected && 'bg-brand-50 dark:bg-brand-900/20'
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
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.productDescription}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.productReference}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                          {product.barcode || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.systemQty}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Package className="h-4 w-4" />
            <span>
              {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado
              {selectedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="light" onPress={() => router.back()}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isDisabled={selectedCount === 0}
              className="bg-brand-600"
            >
              Iniciar Conteo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
