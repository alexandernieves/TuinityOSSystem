'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tooltip } from '@heroui/react';
import { ArrowLeft, ClipboardList, Plus, Trash2, Package, AlertTriangle, CheckCircle2, XCircle, Truck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { Switch } from '@/components/ui/switch';
import {
  formatCurrency,
} from '@/lib/mock-data/sales-orders';
import { api } from '@/lib/services/api';
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
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [numbering, setNumbering] = useState<any[]>([]);

  // New line state
  const [newLineProduct, setNewLineProduct] = useState('');
  const [newLineQty, setNewLineQty] = useState('');
  const [newLinePrice, setNewLinePrice] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, productsData, settingsData, numberingData] = await Promise.all([
          api.getClients(),
          api.getProducts(),
          api.getCommercialParams(),
          api.getDocumentNumbering()
        ]);
        setClients(clientsData);
        setProducts(productsData);
        setSettings(settingsData);
        setNumbering(numberingData);
      } catch (error) {
        toast.error('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      const defaultLevel = settings?.defaultPriceLevel || 'C';
      const price = product?.prices?.[selectedClient.priceLevel || defaultLevel] || product?.price || 0;
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
    const defaultLevel = settings?.defaultPriceLevel || 'C';
    const price = parseFloat(newLinePrice) || product.prices?.[selectedClient.priceLevel || defaultLevel] || product.price || 0;
    const subtotal = qty * price;
    const cost = product.costAvgWeighted || product.costCIF || 0;
    const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;
    const threshold = settings?.commissionThreshold ?? 10;

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
      commissionEligible: marginPercent >= threshold,
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

    setIsSaving(true);
    try {
      const quoteConfig = numbering.find(n => n.code === 'quote');
      const prefix = quoteConfig?.prefix || 'QT-';
      const orderNumber = `${prefix}${Date.now().toString().slice(-6)}`;

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
      setIsSaving(false);
    }
  };

  // Calculate totals
  const quoteSubtotal = quoteLines.reduce((sum, l) => sum + (l.subtotal || 0), 0);
  const taxRate = settings?.taxRate ?? 7;
  const quoteTax = quoteSubtotal * (taxRate / 100);
  const quoteTotal = quoteSubtotal + quoteTax;
  const quoteTotalCost = quoteLines.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  const quoteMarginPercent = quoteSubtotal > 0 ? ((quoteSubtotal - quoteTotalCost) / quoteSubtotal) * 100 : 0;
  const hasLowMarginLines = quoteLines.some((l) => (l.marginPercent || 0) < (settings?.commissionThreshold ?? 10));

  const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
  const labelStyle = { fontWeight: 600 };
  const labelClass = "block text-[13px] text-[#1a1a1a] mb-1.5";
  const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#1e3156] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonSecondaryClass = "px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50";

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <ClipboardList className="h-5 w-5 text-[#008060]" />
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
              <label className={labelClass} style={labelStyle}>
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={quoteFormData.customerId}
                onChange={(e) => handleFormChange('customerId', e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected client info */}
            {selectedClient && (
              <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4 shadow-inner">
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
                <label className={labelClass} style={labelStyle}>
                  Válido hasta
                </label>
                <input
                  type="date"
                  value={quoteFormData.validUntil}
                  onChange={(e) => handleFormChange('validUntil', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>
                  Entrega solicitada
                </label>
                <input
                  type="date"
                  value={quoteFormData.requestedDeliveryDate}
                  onChange={(e) => handleFormChange('requestedDeliveryDate', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* F10: Incoming Stock Toggle */}
            {canSellIncoming && (
              <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Truck className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <label htmlFor="incoming-stock-toggle" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none">
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
                  <label className={labelClass} style={labelStyle}>
                    Producto
                  </label>
                  <select
                    value={newLineProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className={inputClass}
                    disabled={!selectedClient}
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((product) => {
                      const stock = product.stock || { existence: 0, reserved: 0, arriving: 0 };
                      const physicalAvailable = stock.existence - stock.reserved;
                      const effectiveAvailable = includeIncomingStock
                        ? physicalAvailable + stock.arriving
                        : physicalAvailable;

                      return (
                        <option key={product.id} value={product.id}>
                          {product.description} - {product.reference} (Disp: {effectiveAvailable})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-20">
                  <label className={labelClass} style={labelStyle}>
                    Cant.
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newLineQty}
                    onChange={(e) => setNewLineQty(e.target.value)}
                    className={inputClass}
                    disabled={!selectedClient}
                  />
                </div>
                <div className="w-28">
                  <label className={labelClass} style={labelStyle}>
                    Precio
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8c9196]">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newLinePrice}
                      onChange={(e) => setNewLinePrice(e.target.value)}
                      className={inputClass + " pl-6"}
                      disabled={!selectedClient}
                      readOnly={!canViewMargins}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddLine}
                  disabled={!selectedClient}
                  className={cn(buttonPrimaryClass, "h-9 w-9 px-0")}
                >
                  <Plus className="h-4 w-4" />
                </button>
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
                <div className="mt-4 space-y-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] px-4 py-4 border border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{quoteLines.length} productos</span>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-4">
                        <span>Subtotal:</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(quoteSubtotal)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>ITBMS ({taxRate}%):</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(quoteTax)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 border-t border-gray-200 dark:border-[#2a2a2a] pt-1">
                        <span className="text-base font-bold text-gray-900 dark:text-white">Total:</span>
                        <span className="font-mono text-2xl font-bold text-[#253D6B] dark:text-blue-400">{formatCurrency(quoteTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-[#222]">
                    {canViewMargins && (
                      <span className={cn('text-sm', quoteMarginPercent >= (settings?.commissionThreshold ?? 10) ? 'text-emerald-500' : 'text-red-500')}>
                        ({quoteMarginPercent.toFixed(0)}% margen)
                      </span>
                    )}
                    {isVendedor && (
                      <Tooltip content={!hasLowMarginLines ? `Por encima del ${settings?.commissionThreshold ?? 10}%` : `Hay productos por debajo del ${settings?.commissionThreshold ?? 10}%`}>
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
                      : `Hay productos con margen menor al ${settings?.commissionThreshold ?? 10}%. ${canApproveOrders ? 'No requiere aprobación adicional.' : 'Requiere aprobación de supervisor.'}`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass} style={labelStyle}>
                Notas
              </label>
              <textarea
                placeholder="Notas para el cliente..."
                value={quoteFormData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <button
            onClick={() => router.back()}
            disabled={isSaving}
            className={buttonSecondaryClass}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateQuote}
            disabled={!selectedClient || quoteLines.length === 0 || isSaving}
            className={buttonPrimaryClass}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Crear Cotización'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
