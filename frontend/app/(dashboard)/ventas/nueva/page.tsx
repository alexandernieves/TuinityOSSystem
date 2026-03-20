'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ClipboardList, Plus, Trash2, Package, AlertTriangle, CheckCircle2, XCircle, Truck, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { ProductBrowser } from './product-browser';
import { ClientBrowser } from './client-browser';
import { format, parseISO, isValid } from 'date-fns';
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
  const { checkPermission, user } = useAuth();
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
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // New line state
  const [newLineProduct, setNewLineProduct] = useState('');
  const [newLineQty, setNewLineQty] = useState('');
  const [newLinePrice, setNewLinePrice] = useState('');
  const [productHistory, setProductHistory] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsData, productsData, settingsData, numberingData, warehousesData] = await Promise.all([
          api.getClients(),
          api.getProducts(),
          api.getCommercialParams(),
          api.getDocumentNumbering(),
          api.getWarehouses()
        ]);
        setClients(clientsData);
        setProducts(productsData);
        setSettings(settingsData);
        setNumbering(numberingData);
        setWarehouses(warehousesData);
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

  const handleProductSelect = async (productId: string) => {
    setNewLineProduct(productId);
    setProductHistory(null);
    if (selectedClient && productId) {
      const product = products.find(p => p.id === productId);
      const defaultLevel = settings?.defaultPriceLevel || 'C';
      const price = product?.prices?.[selectedClient.priceLevel || defaultLevel] || product?.price || 0;
      setNewLinePrice(price.toString());

      try {
        const history = await api.getProductHistory(productId, selectedClient.id);
        if (history) {
          setProductHistory(history);
        }
      } catch (err) {
        console.warn('No se pudo obtener el historial de precios');
      }
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

    const qty = parseFloat(newLineQty) || 0;
    const defaultLevel = settings?.defaultPriceLevel || 'C';
    const price = parseFloat(newLinePrice) || product.prices?.[selectedClient.priceLevel || defaultLevel] || product.price || 0;
    const subtotal = qty * price;
    const cost = Number(product.standardCost || 0);
    const marginPercent = price > 0 ? ((price - cost) / price) * 100 : 0;
    const threshold = settings?.commissionThreshold ?? 10;

    const newLine: any = {
      id: `LINE-NEW-${Date.now()}`,
      productId: product.id,
      productReference: product.sku || product.reference,
      productDescription: product.name || product.description,
      productCategory: product.group?.name || 'Varios',
      quantity: qty,
      unitPrice: price,
      subtotal,
      unitCost: cost,
      totalCost: cost * qty,
      marginPercent,
      requiresApproval: marginPercent < threshold,
      commissionEligible: marginPercent >= threshold,
    };

    setQuoteLines((prev) => {
        const newLines = [...prev, newLine];
        // Sort by Category then Description
        return newLines.sort((a, b) => {
            const catA = (a.productCategory || '').toLowerCase();
            const catB = (b.productCategory || '').toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            return a.productDescription.localeCompare(b.productDescription);
        });
    });
    setNewLineProduct('');
    setNewLineQty('');
    setNewLinePrice('');
    setProductHistory(null);
    toast.success('Producto agregado');
  };

  const handleAddExpense = () => {
    if (!newExpenseDesc || !newExpenseAmount) return;
    const amount = parseFloat(newExpenseAmount) || 0;
    setExpenses(prev => [...prev, {
      id: `EXP-${Date.now()}`,
      description: newExpenseDesc,
      amount
    }]);
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
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
      const quoteConfig = numbering.find(n => n.code === 'quote' || n.code === 'cotizacion');
      const prefix = quoteConfig?.prefix || 'COT-';
      const orderNumber = `${prefix}${Date.now().toString().slice(-6)}`;

      const payload = {
        number: orderNumber,
        clientId: selectedClient.id,
        warehouseId: warehouses.find(w => w.code === 'ZL')?.id || warehouses[0]?.id,
        lines: quoteLines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          price: l.unitPrice,
          total: l.subtotal
        })),
        expenses: expenses.map(e => ({
            description: e.description,
            amount: e.amount
        })),
        expensesTotal,
        subtotal: quoteSubtotal,
        total: quoteTotal,
        notes: quoteFormData.notes,
        createdBy: user?.id || 'unknown'
      };

      await api.createQuotation(payload);

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
  const expensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const taxRate = settings?.taxRate ?? 7;
  const quoteTax = (quoteSubtotal + expensesTotal) * (taxRate / 100);
  const quoteTotal = quoteSubtotal + expensesTotal + quoteTax;
  const quoteTotalCost = quoteLines.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  const quoteMarginPercent = quoteSubtotal > 0 ? ((quoteSubtotal - quoteTotalCost) / quoteSubtotal) * 100 : 0;
  const hasLowMarginLines = quoteLines.some((l) => l.requiresApproval);

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
              <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">Seleccionar Cliente</Label>
              <ClientBrowser 
                clients={clients}
                value={quoteFormData.customerId}
                onSelect={(val) => {
                  console.log(`[SALES] Client selected: ${val}`);
                  handleFormChange('customerId', val);
                }}
                placeholder="Busca por nombre, RUC o código de cliente..."
              />
            </div>

            {/* Selected client info */}
            {selectedClient && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#141414] overflow-hidden"
              >
                <div className="border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#1a1a1a]/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#253D6B]/10 flex items-center justify-center text-[#253D6B] font-bold text-lg uppercase">
                      {selectedClient.legalName?.charAt(0) || selectedClient.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-none mb-1">{selectedClient.legalName || selectedClient.name}</h3>
                      <p className="text-xs text-gray-500">{selectedClient.taxId || 'Sin RUC'} • {selectedClient.country}</p>
                    </div>
                  </div>
                  <Badge variant={selectedClient.creditProfile?.isCreditBlocked ? "destructive" : "default"} className={cn(
                    "uppercase tracking-wider text-[10px] font-bold",
                    !selectedClient.creditProfile?.isCreditBlocked ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""
                  )}>
                    {selectedClient.creditProfile?.isCreditBlocked ? 'Crédito Bloqueado' : 'Crédito Activo'}
                  </Badge>
                </div>
                
                <div className="p-4 grid grid-cols-4 gap-4">
                   <div className="space-y-1">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nivel Precio</p>
                     <p className={cn(
                        'text-lg font-black',
                        selectedClient.creditProfile?.priceLevel === 'A' ? 'text-emerald-600' :
                        selectedClient.creditProfile?.priceLevel === 'B' ? 'text-blue-600' : 'text-purple-600'
                      )}>
                        {selectedClient.creditProfile?.priceLevel || selectedClient.priceLevel || 'C'}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Términos</p>
                     <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {selectedClient.creditProfile?.creditDays ? `${selectedClient.creditProfile.creditDays} días` : 'Contado'}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Límite Aprobado</p>
                     <p className="text-sm font-mono font-medium text-gray-600 dark:text-gray-400">
                        {formatCurrency(selectedClient.creditProfile?.creditLimit || 0)}
                     </p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Disponible</p>
                     <p className={cn(
                        'text-lg font-mono font-black',
                        ((selectedClient.creditProfile?.creditLimit || 0) - (selectedClient.creditProfile?.currentBalance || 0)) > 0 
                          ? 'text-emerald-500' : 'text-red-500'
                     )}>
                        {formatCurrency((selectedClient.creditProfile?.creditLimit || 0) - (selectedClient.creditProfile?.currentBalance || 0))}
                     </p>
                   </div>
                </div>
                
                {/* Visual Credit Bar */}
                {(selectedClient.creditProfile?.creditLimit || 0) > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">
                      <span>Uso de crédito</span>
                      <span>{Math.round(((selectedClient.creditProfile?.currentBalance || 0) / selectedClient.creditProfile.creditLimit) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", 
                          ((selectedClient.creditProfile?.currentBalance || 0) / selectedClient.creditProfile.creditLimit) > 0.9 ? "bg-red-500" :
                          ((selectedClient.creditProfile?.currentBalance || 0) / selectedClient.creditProfile.creditLimit) > 0.75 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, ((selectedClient.creditProfile?.currentBalance || 0) / selectedClient.creditProfile.creditLimit) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Válido hasta</Label>
                <DatePicker 
                  date={quoteFormData.validUntil ? parseISO(quoteFormData.validUntil) : undefined}
                  setDate={(date) => handleFormChange('validUntil', date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Válido hasta..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Entrega solicitada</Label>
                <DatePicker 
                  date={quoteFormData.requestedDeliveryDate ? parseISO(quoteFormData.requestedDeliveryDate) : undefined}
                  setDate={(date) => handleFormChange('requestedDeliveryDate', date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Fecha de entrega..."
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#253D6B]" />
                  Productos en Cotización
                </h3>
              </div>

              {/* Quick Add Row */}
              <div className="flex items-end gap-3 bg-gray-50/50 dark:bg-[#1a1a1a]/50 p-4 rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] mb-6">
                <div className="flex-1 min-w-0">
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Búsqueda Rápida</Label>
                  <ProductBrowser
                    products={products}
                    selectedClient={selectedClient}
                    includeIncomingStock={includeIncomingStock}
                    onSelect={(p) => handleProductSelect(p.id)}
                    value={newLineProduct}
                  />
                </div>
                <div className="w-24">
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newLineQty}
                    onChange={(e) => setNewLineQty(e.target.value)}
                    disabled={!selectedClient}
                    className="h-10 bg-white dark:bg-[#141414]"
                  />
                </div>
                <div className="w-32">
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Precio Unit.</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-bold">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newLinePrice}
                      onChange={(e) => setNewLinePrice(e.target.value)}
                      className="pl-7 h-10 bg-white dark:bg-[#141414]"
                      disabled={!selectedClient}
                      readOnly={!canViewMargins}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddLine}
                  disabled={!selectedClient || !newLineQty || !newLineProduct}
                  className="h-10 bg-[#253D6B] hover:bg-[#1e3156] px-6 rounded-xl font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              {/* Selected Product Context Block */}
              {(() => {
                const selected = products.find(p => p.id === newLineProduct);
                if (!selected && !productHistory) return null;

                const stock = selected?.stock || { existence: 0, reserved: 0, arriving: 0 };
                const available = (stock.existence || 0) - (stock.reserved || 0) + (includeIncomingStock ? (stock.arriving || 0) : 0);
                const price = parseFloat(newLinePrice) || 0;
                const cost = Number(selected?.standardCost || 0);
                const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;
                const threshold = settings?.commissionThreshold ?? 10;
                const commissions = marginPct >= threshold;
                const requiresApproval = price > 0 && marginPct < threshold;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4"
                  >
                    <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-sm overflow-hidden">
                      
                      {/* Product Name Header */}
                      {selected && (
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#2a2a2a]">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#253D6B]" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">{selected.name || selected.description}</span>
                            <span className="text-xs text-gray-400 font-mono">{selected.sku || selected.reference}</span>
                          </div>
                          {/* Commission/Approval indicator — visible only when price is set */}
                          {price > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-help select-none',
                                    commissions
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  )}>
                                    {commissions
                                      ? <><CheckCircle2 className="h-3 w-3" /> Comisiona</>
                                      : <><AlertTriangle className="h-3 w-3" /> Requiere Aprobación</>
                                    }
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{commissions
                                    ? `Margen sobre el umbral de comisión (${threshold}%)`
                                    : `Precio por debajo del umbral. Requiere aprobación de supervisor.`}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-stretch divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-[#2a2a2a]">

                        {/* --- Inventory Block --- */}
                        {selected && (
                          <div className="flex-1 p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Disponibilidad en Bodega</p>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className={cn(
                                "text-2xl font-black font-mono",
                                available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                              )}>
                                {available}
                              </span>
                              <span className="text-sm text-gray-500">{selected.unit || 'uds'} disponibles</span>
                            </div>
                            <div className="flex gap-3 text-[11px] text-gray-400 font-mono">
                              <span>{stock.existence || 0} físico</span>
                              <span>·</span>
                              <span>{stock.reserved || 0} reservado</span>
                              {includeIncomingStock && <><span>·</span><span className="text-amber-500">{stock.arriving || 0} en tránsito</span></>}
                            </div>
                          </div>
                        )}

                        {/* --- History Block --- */}
                        {productHistory ? (
                          <div className="flex-1 p-4 bg-blue-50/30 dark:bg-blue-900/5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Última Venta a este Cliente</p>
                            <div className="space-y-2">
                              <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-black font-mono text-gray-900 dark:text-white">
                                  {formatCurrency(productHistory.price)}
                                </span>
                                <span className="text-xs font-semibold text-gray-400">por unidad</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] p-2 text-center">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Cantidad</p>
                                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 font-mono">{productHistory.quantity ?? '—'}</p>
                                </div>
                                <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] p-2 text-center">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Fecha</p>
                                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{new Date(productHistory.date).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                </div>
                                <div className="rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] p-2 text-center">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Vendedor</p>
                                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{productHistory.vendor}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : selected ? (
                          <div className="flex-1 p-4 flex flex-col items-center justify-center gap-1.5 bg-gray-50/60 dark:bg-[#1a1a1a]/60">
                            <Info className="h-5 w-5 text-gray-300" />
                            <p className="text-xs text-gray-400 font-medium">Este cliente nunca ha comprado este producto</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

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
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Aprobación</th>
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn(
                                      'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight',
                                      !line.requiresApproval
                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm animate-pulse'
                                    )}>
                                      {!line.requiresApproval
                                        ? <>OK</>
                                        : <>Requiere Aprobación</>
                                      }
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{!line.requiresApproval ? "Margen correcto" : "Margen insuficiente"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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

              {/* Additional Expenses Section */}
              <div className="mt-8 border-t border-gray-100 dark:border-[#2a2a2a] pt-6">
                 <h3 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">Gastos Adicionales (Flete, etc.)</h3>
                 
                 <div className="flex items-end gap-3 mb-4">
                    <div className="flex-1">
                        <Label className="text-sm font-semibold mb-1.5 block">Descripción</Label>
                        <Input 
                            placeholder="Ej: Flete, Embalaje..." 
                            value={newExpenseDesc}
                            onChange={e => setNewExpenseDesc(e.target.value)}
                        />
                    </div>
                    <div className="w-32">
                        <Label className="text-sm font-semibold mb-1.5 block">Monto</Label>
                        <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={newExpenseAmount}
                            onChange={e => setNewExpenseAmount(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleAddExpense}
                        disabled={!newExpenseDesc || !newExpenseAmount}
                        variant="outline"
                        className="h-[38px]"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Gasto
                    </Button>
                 </div>

                 {expenses.length > 0 && (
                    <div className="space-y-2">
                        {expenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a]">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium">{exp.description}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm font-semibold">{formatCurrency(exp.amount)}</span>
                                    <button 
                                        onClick={() => handleRemoveExpense(exp.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
              </div>

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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              'ml-3 inline-flex items-center gap-1.5 text-sm cursor-help',
                              !hasLowMarginLines ? 'text-emerald-500' : 'text-amber-500'
                            )}>
                              {!hasLowMarginLines
                                ? <><CheckCircle2 className="h-4 w-4" /> Comisiona</>
                                : <><AlertTriangle className="h-4 w-4" /> Revisar</>
                              }
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{!hasLowMarginLines ? `Por encima del ${settings?.commissionThreshold ?? 10}%` : `Hay productos por debajo del ${settings?.commissionThreshold ?? 10}%`}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateQuote}
            disabled={!selectedClient || quoteLines.length === 0 || isSaving}
            className="bg-[#253D6B] hover:bg-[#1e3156]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Crear Cotización'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
