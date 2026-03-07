'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, SelectItem, Textarea, Tooltip } from '@heroui/react';
import { ArrowLeft, ClipboardList, Plus, Trash2, Package, AlertTriangle, CheckCircle2, XCircle, Truck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { Switch } from '@/components/ui/switch';
import {
  formatCurrency,
} from '@/lib/mock-data/sales-orders';
import { api } from '@/lib/services/api';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const initialQuoteForm = {
  customerId: '',
  notes: '',
  validUntil: '',
  requestedDeliveryDate: '',
};

export default function NuevaCotizacionPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewMargins = checkPermission('canViewMargins');
  const canApproveOrders = checkPermission('canApproveOrders');
  const canSellIncoming = checkPermission('canSellIncoming');
  const isVendedor = !canViewMargins; // Vendedores no pueden ver márgenes exactos

  // Form state
  const [quoteFormData, setQuoteFormData] = useState(initialQuoteForm);
  const [quoteLines, setQuoteLines] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [includeIncomingStock, setIncludeIncomingStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // New line state
  const [newLineProduct, setNewLineProduct] = useState('');
  const [newLineQty, setNewLineQty] = useState('');
  const [newLinePrice, setNewLinePrice] = useState('');

  // Fetch initial data
  useState(() => {
    const fetchData = async () => {
      try {
        const [clientsData, productsData] = await Promise.all([
          api.getClients(),
          api.getProducts()
        ]);
        setClients(clientsData);
        setProducts(productsData);
      } catch (error) {
        toast.error('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  });

  const handleFormChange = (field: string, value: string) => {
    setQuoteFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'customerId') {
      const client = clients.find((c) => c.id === value);
      setSelectedClient(client || null);
      setQuoteLines([]);
    }
  };

  const handleProductSelect = (productId: string) => {
    setNewLineProduct(productId);
    if (selectedClient && productId) {
      const product = products.find(p => p.id === productId);
      // Lógica de precio basada en nivel
      const price = product?.prices?.[selectedClient.priceLevel || 'C'] || product?.price || 0;
      setNewLinePrice(price.toString());
    }
  };

  const handleAddLine = () => {
    if (!newLineProduct || !newLineQty || !selectedClient) {
      toast.error('Datos incompletos', {
        description: 'Selecciona un producto y completa la cantidad.',
      });
      return;
    }

    const product = products.find((p) => p.id === newLineProduct);
    if (!product) return;

    const qty = parseFloat(newLineQty);
    const price = parseFloat(newLinePrice) || product.prices?.[selectedClient.priceLevel || 'C'] || product.price || 0;
    const subtotal = qty * price;
    const cost = product.costAvgWeighted || product.costCIF || 0;
    const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;

    const newLine: any = {
      id: `LINE-NEW-${Date.now()}`,
      productId: product.id,
      productReference: product.reference,
      productDescription: product.description,
      quantity: qty,
      unitPrice: price,
      subtotal,
      unitCost: cost,
      totalCost: cost * qty,
      marginPercent,
      commissionEligible: marginPercent >= 10,
    };

    setQuoteLines((prev) => [...prev, newLine]);
    setNewLineProduct('');
    setNewLineQty('');
    setNewLinePrice('');
    toast.success('Producto agregado');
  };

  const handleRemoveLine = (lineId: string) => {
    setQuoteLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleCreateQuote = async () => {
    if (!quoteFormData.customerId || quoteLines.length === 0) {
      toast.error('Faltan datos requeridos');
      return;
    }

    try {
      const orderNumber = `QT-${Date.now().toString().slice(-6)}`;

      const payload = {
        orderNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        bodegaId: 'BOD-001', // General por defecto por ahora
        bodegaName: 'Bodega Principal',
        status: 'borrador',
        lines: quoteLines.map(l => ({
          productId: l.productId,
          productReference: l.productReference,
          productDescription: l.productDescription,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.subtotal
        })),
        subtotal: quoteSubtotal,
        total: quoteSubtotal,
        notes: quoteFormData.notes
      };

      await api.createSale(payload);

      toast.success('Cotización creada exitosamente');
      router.push('/ventas');
    } catch (error: any) {
      toast.error('Error al crear cotización', {
        description: error.message
      });
    }
  };

  // Calculate totals
  const quoteSubtotal = quoteLines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
  const quoteTotalCost = quoteLines.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  const quoteMarginPercent = quoteSubtotal > 0 ? ((quoteSubtotal - quoteTotalCost) / quoteSubtotal) * 100 : 0;
  const hasLowMarginLines = quoteLines.some((l) => (l.marginPercent || 0) < 10);

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900">
            <ClipboardList className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Nueva Cotización</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Completa la información de la cotización</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="p-6">
          <div className="space-y-6">
            {/* Cliente Section */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cliente <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Seleccionar cliente..."
                selectedKeys={quoteFormData.customerId ? [quoteFormData.customerId] : []}
                onChange={(e) => handleFormChange('customerId', e.target.value)}
                variant="bordered"
                classNames={{ trigger: 'bg-white dark:bg-[#1a1a1a]' }}
              >
                {clients.map((client) => (
                  <SelectItem key={client.id} textValue={client.name}>
                    <div className="flex flex-col">
                      <span className="text-sm">{client.name}</span>
                      <span className="text-xs text-gray-500">{client.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Selected client info */}
            {selectedClient && (
              <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <span className="text-sm text-gray-500">Nivel de precios: </span>
                    <span className={cn(
                      'font-semibold',
                      selectedClient.priceLevel === 'A' && 'text-emerald-500',
                      selectedClient.priceLevel === 'B' && 'text-blue-500',
                      selectedClient.priceLevel === 'C' && 'text-purple-500'
                    )}>
                      {selectedClient.priceLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Crédito disponible: </span>
                    <span className={cn('font-mono font-semibold', selectedClient.creditAvailable > 0 ? 'text-emerald-500' : 'text-red-500')}>
                      {formatCurrency(selectedClient.creditAvailable)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Términos: </span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {selectedClient.paymentTerms === 'contado' ? 'Contado' :
                        (typeof selectedClient.paymentTerms === 'string'
                          ? (selectedClient.paymentTerms.replace('credito_', '') + ' días')
                          : 'No especificado')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Válido hasta
                </label>
                <Input
                  type="date"
                  value={quoteFormData.validUntil}
                  onChange={(e) => handleFormChange('validUntil', e.target.value)}
                  variant="bordered"
                  classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entrega solicitada
                </label>
                <Input
                  type="date"
                  value={quoteFormData.requestedDeliveryDate}
                  onChange={(e) => handleFormChange('requestedDeliveryDate', e.target.value)}
                  variant="bordered"
                  classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                />
              </div>
            </div>

            {/* F10: Incoming Stock Toggle */}
            {canSellIncoming && (
              <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Truck className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <label htmlFor="incoming-stock-toggle" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                        Incluir mercancía por llegar
                      </label>
                      <p className="text-xs text-gray-500 dark:text-[#888888]">
                        Permite vender productos con stock en tránsito
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="incoming-stock-toggle"
                    checked={includeIncomingStock}
                    onCheckedChange={setIncludeIncomingStock}
                  />
                </div>
                {includeIncomingStock && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Las órdenes con mercancía por llegar solo pueden ser cotización o pedido, no se pueden facturar</span>
                  </div>
                )}
              </div>
            )}

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
                    onChange={(e) => handleProductSelect(e.target.value)}
                    variant="bordered"
                    isDisabled={!selectedClient}
                    classNames={{ trigger: 'bg-white dark:bg-[#1a1a1a]' }}
                  >
                    {products.map((product) => {
                      const stock = product.stock || { existence: 0, reserved: 0, arriving: 0 };
                      const physicalAvailable = stock.existence - stock.reserved;
                      const effectiveAvailable = includeIncomingStock
                        ? physicalAvailable + stock.arriving
                        : physicalAvailable;

                      return (
                        <SelectItem key={product.id} textValue={product.description}>
                          <div className="flex flex-col">
                            <span className="text-sm">{product.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {product.reference} - ${product.prices?.[selectedClient?.priceLevel || 'C'] || product.price || 0}
                              </span>
                              <span className={cn(
                                'text-xs',
                                effectiveAvailable > 0 ? 'text-emerald-500' : 'text-red-500'
                              )}>
                                Disp: {effectiveAvailable}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </Select>
                </div>
                <div className="w-20">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cant.
                  </label>
                  <Input
                    placeholder="0"
                    type="number"
                    value={newLineQty}
                    onChange={(e) => setNewLineQty(e.target.value)}
                    variant="bordered"
                    isDisabled={!selectedClient}
                    classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                  />
                </div>
                <div className="w-28">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={newLinePrice}
                    onChange={(e) => setNewLinePrice(e.target.value)}
                    variant="bordered"
                    isDisabled={!selectedClient}
                    startContent={<span className="text-xs text-gray-400">$</span>}
                    isReadOnly={!canViewMargins}
                    classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
                  />
                </div>
                <Button color="primary" onPress={handleAddLine} isIconOnly isDisabled={!selectedClient} className="bg-brand-600 mb-0.5">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lines List */}
              {quoteLines.length > 0 ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Cant.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Precio</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Subtotal</th>
                        {canViewMargins && (
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Margen</th>
                        )}
                        {isVendedor && (
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Comisión</th>
                        )}
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                      {quoteLines.map((line) => (
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
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{formatCurrency(line.unitPrice || 0)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(line.subtotal || 0)}</span>
                          </td>
                          {canViewMargins && (
                            <td className="px-4 py-3 text-right">
                              <span className={cn(
                                'font-mono text-sm font-medium',
                                (line.marginPercent || 0) >= 10 ? 'text-emerald-500' : 'text-red-500'
                              )}>
                                {line.marginPercent?.toFixed(0)}%
                              </span>
                            </td>
                          )}
                          {isVendedor && (
                            <td className="px-4 py-3 text-center">
                              <Tooltip
                                content={line.commissionEligible ? "Por encima del 10%" : "Por debajo del 10%"}
                                placement="top"
                              >
                                <span className={cn(
                                  'inline-flex items-center justify-center h-6 w-6 rounded-full cursor-help',
                                  line.commissionEligible
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-red-500/10 text-red-500'
                                )}>
                                  {line.commissionEligible
                                    ? <CheckCircle2 className="h-4 w-4" />
                                    : <XCircle className="h-4 w-4" />
                                  }
                                </span>
                              </Tooltip>
                            </td>
                          )}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveLine(line.id || '')}
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
                  <p className="text-xs text-gray-500">
                    {selectedClient ? 'Agrega productos a la cotización' : 'Selecciona un cliente primero'}
                  </p>
                </div>
              )}

              {/* Totals */}
              {quoteLines.length > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3">
                  <span className="text-sm text-gray-500">{quoteLines.length} productos</span>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Total: </span>
                    <span className="font-mono text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(quoteSubtotal)}</span>
                    {canViewMargins && (
                      <span className={cn('ml-3 text-sm', quoteMarginPercent >= 10 ? 'text-emerald-500' : 'text-red-500')}>
                        ({quoteMarginPercent.toFixed(0)}% margen)
                      </span>
                    )}
                    {isVendedor && (
                      <Tooltip content={!hasLowMarginLines ? "Por encima del 10%" : "Hay productos por debajo del 10%"}>
                        <span className={cn(
                          'ml-3 inline-flex items-center gap-1.5 text-sm cursor-help',
                          !hasLowMarginLines ? 'text-emerald-500' : 'text-amber-500'
                        )}>
                          {!hasLowMarginLines
                            ? <><CheckCircle2 className="h-4 w-4" /> Comisiona</>
                            : <><AlertTriangle className="h-4 w-4" /> Revisar</>
                          }
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}

              {/* Warning for low margin */}
              {hasLowMarginLines && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    {isVendedor
                      ? 'Hay productos que no generan comisión. Requiere aprobación de supervisor.'
                      : `Hay productos con margen menor al 10%. ${canApproveOrders ? 'No requiere aprobación adicional.' : 'Requiere aprobación de supervisor.'}`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notas
              </label>
              <Textarea
                placeholder="Notas para el cliente..."
                value={quoteFormData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                variant="bordered"
                minRows={2}
                classNames={{ inputWrapper: 'bg-white dark:bg-[#1a1a1a]' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <Button variant="light" onPress={() => router.back()}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleCreateQuote}
            isDisabled={!selectedClient || quoteLines.length === 0}
            className="bg-brand-600"
          >
            Crear Cotización
          </Button>
        </div>
      </div>
    </div>
  );
}
