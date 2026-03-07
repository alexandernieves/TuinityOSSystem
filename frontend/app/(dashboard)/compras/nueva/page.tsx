'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, SelectItem, Textarea } from '@heroui/react';
import { ArrowLeft, ClipboardList, Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api';
import type { PurchaseOrder, PurchaseOrderLine } from '@/lib/types/purchase-order';

const initialOrderForm = {
  supplierId: '',
  bodegaId: '',
  supplierInvoice: '',
  expectedArrivalDate: '',
  notes: '',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function NuevaCompraPage() {
  const router = useRouter();
  const { user, checkPermission } = useAuth();
  const canViewCosts = checkPermission('canViewCosts');

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [orderFormData, setOrderFormData] = useState(initialOrderForm);
  const [orderLines, setOrderLines] = useState<PurchaseOrderLine[]>([]);
  const [newLineProduct, setNewLineProduct] = useState('');
  const [newLineQty, setNewLineQty] = useState('');
  const [newLineCost, setNewLineCost] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, bData, pData] = await Promise.all([
        api.getSuppliers(),
        api.getWarehouses(),
        api.getProducts(),
      ]);
      setSuppliers(sData);
      setBodegas(bData);
      setProducts(pData);
    } catch (error: any) {
      toast.error('Error al cargar datos', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setOrderFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLine = () => {
    if (!newLineProduct || !newLineQty) {
      toast.error('Selecciona un producto y cantidad');
      return;
    }

    const product = products.find((p) => p.id === newLineProduct);
    if (!product) return;

    const qty = parseInt(newLineQty);
    const cost = parseFloat(newLineCost) || product.costFOB;

    const newLine: PurchaseOrderLine = {
      id: `line-${Date.now()}`,
      productId: product.id,
      productReference: product.reference,
      productDescription: product.description,
      quantity: qty,
      quantityReceived: 0,
      unitCostFOB: cost,
      totalFOB: qty * cost,
    };

    setOrderLines([...orderLines, newLine]);
    setNewLineProduct('');
    setNewLineQty('');
    setNewLineCost('');
  };

  const handleRemoveLine = (lineId: string) => {
    setOrderLines(orderLines.filter((l) => l.id !== lineId));
  };

  const handleCreateOrder = async () => {
    if (!orderFormData.supplierId || !orderFormData.bodegaId) {
      toast.error('Campos requeridos', {
        description: 'Selecciona proveedor y bodega destino',
      });
      return;
    }

    if (orderLines.length === 0) {
      toast.error('Sin productos', {
        description: 'Agrega al menos un producto a la orden',
      });
      return;
    }

    const supplier = suppliers.find((s) => s.id === orderFormData.supplierId);
    const bodega = bodegas.find((b) => b.id === orderFormData.bodegaId);

    // Generar un número de orden temporal o dejar que el backend lo haga (aquí usaremos uno temporal para avisar)
    const orderNumber = `OC-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    const newOrderPayload = {
      orderNumber,
      supplierId: orderFormData.supplierId,
      supplierName: supplier?.name ?? '',
      supplierInvoice: orderFormData.supplierInvoice || undefined,
      bodegaId: orderFormData.bodegaId,
      bodegaName: bodega?.name ?? '',
      status: 'pendiente',
      expectedArrivalDate: orderFormData.expectedArrivalDate || undefined,
      lines: orderLines.map(l => ({
        productId: l.productId,
        productReference: l.productReference,
        productDescription: l.productDescription,
        quantity: l.quantity,
        unitCostFOB: l.unitCostFOB,
        totalFOB: l.totalFOB
      })),
      totalFOB: totalFOB,
      createdBy: user?.name || 'Admin',
      notes: orderFormData.notes || undefined,
    };

    try {
      await api.createPurchaseOrder(newOrderPayload);
      toast.success('Orden creada', {
        description: `Orden ${orderNumber} creada exitosamente`,
      });
      router.push('/compras');
    } catch (error: any) {
      toast.error('Error al crear orden', { description: error.message });
    }
  };

  const totalFOB = orderLines.reduce((sum, l) => sum + l.totalFOB, 0);

  if (loading) {
    return <div className="flex h-96 items-center justify-center text-gray-500">Cargando formulario...</div>;
  }

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
            <ClipboardList className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nueva Orden de Compra</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Completa la información de la orden</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="p-6">
          <div className="space-y-6">
            {/* Supplier and Bodega */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Proveedor <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder="Seleccionar proveedor"
                  selectedKeys={orderFormData.supplierId ? [orderFormData.supplierId] : []}
                  onChange={(e) => handleFormChange('supplierId', e.target.value)}
                  variant="bordered"
                  classNames={{ trigger: 'bg-white dark:bg-[#1a1a1a]' }}
                >
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bodega destino <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder="Seleccionar bodega"
                  selectedKeys={orderFormData.bodegaId ? [orderFormData.bodegaId] : []}
                  onChange={(e) => handleFormChange('bodegaId', e.target.value)}
                  variant="bordered"
                  classNames={{ trigger: 'bg-white dark:bg-[#1a1a1a]' }}
                >
                  {bodegas.map((bodega) => (
                    <SelectItem key={bodega.id}>{bodega.name}</SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Invoice and Date */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  No. Factura proveedor
                </label>
                <Input
                  placeholder="INV-2024-0001"
                  value={orderFormData.supplierInvoice}
                  onChange={(e) => handleFormChange('supplierInvoice', e.target.value)}
                  variant="bordered"
                  classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Llegada estimada
                </label>
                <Input
                  type="date"
                  value={orderFormData.expectedArrivalDate}
                  onChange={(e) => handleFormChange('expectedArrivalDate', e.target.value)}
                  variant="bordered"
                  classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notas
              </label>
              <Textarea
                placeholder="Instrucciones especiales..."
                value={orderFormData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                variant="bordered"
                minRows={2}
                classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
              />
            </div>

            {/* Products Section */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">Productos</h3>

              {/* Add Product Row */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Producto
                  </label>
                  <Select
                    placeholder="Seleccionar producto..."
                    selectedKeys={newLineProduct ? [newLineProduct] : []}
                    onChange={(e) => setNewLineProduct(e.target.value)}
                    variant="bordered"
                    classNames={{ trigger: 'bg-white dark:bg-[#1a1a1a]' }}
                  >
                    {products.slice(0, 50).map((product: any) => (
                      <SelectItem key={product.id} textValue={product.description}>
                        <div className="flex flex-col">
                          <span className="text-sm">{product.description}</span>
                          <span className="text-xs text-gray-500">{product.reference}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="w-24">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cant.
                  </label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={newLineQty}
                    onChange={(e) => setNewLineQty(e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                  />
                </div>
                {canViewCosts && (
                  <div className="w-28">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Costo
                    </label>
                    <Input
                      placeholder="0.00"
                      type="number"
                      value={newLineCost}
                      onChange={(e) => setNewLineCost(e.target.value)}
                      variant="bordered"
                      startContent={<span className="text-xs text-gray-400">$</span>}
                      classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                    />
                  </div>
                )}
                <Button color="primary" onPress={handleAddLine} isIconOnly className="bg-brand-600 mb-0.5">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lines List */}
              {orderLines.length > 0 ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Cantidad</th>
                        {canViewCosts && (
                          <>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Costo</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                      {orderLines.map((line) => (
                        <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{line.productDescription}</p>
                              <p className="text-xs text-gray-500">{line.productReference}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{line.quantity}</span>
                          </td>
                          {canViewCosts && (
                            <>
                              <td className="px-4 py-3 text-right">
                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{formatCurrency(line.unitCostFOB)}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(line.totalFOB)}</span>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveLine(line.id)}
                              className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] py-12">
                  <Package className="mb-3 h-10 w-10 text-gray-400" />
                  <p className="mb-1 text-sm font-medium text-gray-900 dark:text-white">Sin productos</p>
                  <p className="text-xs text-gray-500">Agrega productos a la orden</p>
                </div>
              )}

              {/* Total */}
              {orderLines.length > 0 && canViewCosts && (
                <div className="mt-4 flex justify-end">
                  <div className="rounded-lg bg-gray-100 dark:bg-[#1a1a1a] px-6 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total FOB: </span>
                    <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(totalFOB)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <Button variant="light" onPress={() => router.back()}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleCreateOrder} className="bg-brand-600">
            Crear Orden
          </Button>
        </div>
      </div>
    </div>
  );
}
