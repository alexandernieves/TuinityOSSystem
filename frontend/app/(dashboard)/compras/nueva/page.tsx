'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Plus, Trash2, Package, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api';
import type { PurchaseOrder, PurchaseOrderLine } from '@/lib/types/purchase-order';
import { DatePicker } from '@/components/ui/date-picker';
import {
  CustomModal,
  CustomModalHeader,
  CustomModalBody,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils/cn";

const initialOrderForm = {
  supplierId: '',
  bodegaId: '',
  supplierInvoice: '',
  expectedArrivalDate: null as Date | null,
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
  const [isSaving, setIsSaving] = useState(false);

  // Product search modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Form state
  const [orderFormData, setOrderFormData] = useState(initialOrderForm);
  const [orderLines, setOrderLines] = useState<PurchaseOrderLine[]>([]);

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

  const {
    currentPage,
    totalPages,
    totalItems: searchTotalItems,
    rowsPerPage,
    paginatedData: paginatedProducts,
    handlePageChange,
    handleRowsPerPageChange,
  } = usePagination(filteredProducts, 10);

  // Reset page when search changes
  useEffect(() => {
    handlePageChange(1);
  }, [productSearch]);

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

  const handleFormChange = (field: string, value: any) => {
    setOrderFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if already added
    if (orderLines.some((l) => l.productId === productId)) {
      toast.error('Producto duplicado', {
        description: 'Este producto ya está en la lista',
      });
      return;
    }

    const newLine: PurchaseOrderLine = {
      id: `line-${Date.now()}`,
      productId: product.id,
      productReference: product.reference,
      productDescription: product.description,
      quantity: 1,
      quantityReceived: 0,
      unitCostFOB: product.costFOB || 0,
      totalFOB: product.costFOB || 0,
    };

    setOrderLines([...orderLines, newLine]);
    setIsSearchOpen(false);
    setProductSearch("");
  };

  const handleUpdateLine = (lineId: string, field: keyof PurchaseOrderLine, value: any) => {
    setOrderLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value };
        if (field === 'quantity' || field === 'unitCostFOB') {
          updatedLine.totalFOB = updatedLine.quantity * updatedLine.unitCostFOB;
        }
        return updatedLine;
      }
      return line;
    }));
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

    setIsSaving(true);
    const supplier = suppliers.find((s) => s.id === orderFormData.supplierId);
    const bodega = bodegas.find((b) => b.id === orderFormData.bodegaId);

    // Generar un número de orden temporal o dejar que el backend lo haga
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
      setIsSaving(false);
    }
  };

  const totalFOB = orderLines.reduce((sum, l) => sum + l.totalFOB, 0);

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelStyle = { fontWeight: 600 };
  const labelClass = "block text-[13px] text-[#1a1a1a] mb-1.5";

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <ClipboardList className="h-5 w-5 text-[#008060]" />
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
                <label className={labelClass} style={labelStyle}>Proveedor</label>
                <select
                  value={orderFormData.supplierId}
                  onChange={(e) => handleFormChange('supplierId', e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Bodega destino</label>
                <select
                  value={orderFormData.bodegaId}
                  onChange={(e) => handleFormChange('bodegaId', e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Seleccionar bodega</option>
                  {bodegas.map((bodega) => (
                    <option key={bodega.id} value={bodega.id}>{bodega.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Invoice and Date */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelClass} style={labelStyle}>No. Factura proveedor</label>
                <input
                  type="text"
                  placeholder="INV-2024-0001"
                  value={orderFormData.supplierInvoice}
                  onChange={(e) => handleFormChange('supplierInvoice', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Llegada estimada</label>
                <DatePicker
                  date={orderFormData.expectedArrivalDate || undefined}
                  setDate={(date) => handleFormChange('expectedArrivalDate', date)}
                  placeholder="Seleccionar fecha de llegada"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>Notas</label>
              <textarea
                placeholder="Instrucciones especiales..."
                value={orderFormData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>

            {/* Products Section */}
            <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Productos</h3>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-[#333]"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </button>
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
                            <input
                              type="number"
                              min={1}
                              value={line.quantity.toString()}
                              onChange={(e) => handleUpdateLine(line.id, 'quantity', parseInt(e.target.value) || 0)}
                              className={cn(inputClass, "w-20 ml-auto text-right")}
                            />
                          </td>
                          {canViewCosts && (
                            <>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={line.unitCostFOB.toString()}
                                  onChange={(e) => handleUpdateLine(line.id, 'unitCostFOB', parseFloat(e.target.value) || 0)}
                                  className={cn(inputClass, "w-24 ml-auto text-right font-mono")}
                                />
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
          <button
            onClick={() => router.back()}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateOrder}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#008060] text-white font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#006e52] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Crear Orden'
            )}
          </button>
        </div>
      </div>

      {/* Product Search Modal */}
      <CustomModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        size="xl"
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
        <CustomModalBody className="space-y-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Buscar por nombre, referencia o código de barras..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className={cn(inputClass, "pl-10")}
            />
          </div>
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {paginatedProducts.map((product) => (
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
            {paginatedProducts.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-[#888888]">
                <Package className="mx-auto h-8 w-8 mb-2 opacity-20" />
                No se encontraron productos
              </div>
            )}
          </div>
        </CustomModalBody>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={searchTotalItems}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            itemName="productos"
          />
        </div>
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
