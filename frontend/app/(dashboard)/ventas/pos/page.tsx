'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  Store,
  Search,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  DollarSign,
  ShoppingCart,
  Package,
  List,
  User,
  X,
  Check,
  AlertTriangle,
  LayoutGrid,
  History,
  Wallet,
  Boxes,
  Users,
  RotateCcw,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import type { StoreInventoryItem } from '@/lib/types/pos';

interface CartLine {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

type PaymentMethodSelection = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia';

const SUB_NAV_ITEMS = [
  { label: 'Órdenes', href: '/ventas/pos/ordenes', icon: History },
  { label: 'Caja', href: '/ventas/pos/caja', icon: Wallet },
  { label: 'Inventario', href: '/ventas/pos/inventario', icon: Boxes },
  { label: 'Clientes', href: '/ventas/pos/clientes', icon: Users },
  { label: 'Devoluciones', href: '/ventas/pos/devoluciones', icon: RotateCcw },
  { label: 'Reportes', href: '/ventas/pos/reportes', icon: BarChart3 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

export default function POSPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Real data states
  const [products, setProducts] = useState<StoreInventoryItem[]>([]);
  const [register, setRegister] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedClient] = useState<string>('Consumidor Final');

  // Modals / Payment States
  const [isOpeningModal, setIsOpeningModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('0.00');
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodSelection>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [transferRef, setTransferRef] = useState('');

  const isCashOpen = !!register;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [regStatus, allProducts, allStock] = await Promise.all([
        api.getPOSRegisterStatus(),
        api.getProducts(),
        api.getStock()
      ]);

      setRegister(regStatus);

      // Map real products to StoreInventoryItem
      const inventoryItems: StoreInventoryItem[] = allProducts.map((p: any) => {
        const stockInfo = allStock.find((s: any) => (s.productId._id || s.productId) === p.id);
        const units = stockInfo?.available || 0;
        return {
          productId: p.id,
          productName: p.description,
          productCode: p.reference,
          productGroup: p.group || 'General',
          priceB2C: p.priceB2C || p.pricePublic || 0,
          stockUnits: units,
          minimumStock: 5,
          unitsPerCase: 12,
          stockStatus: units <= 0 ? 'agotado' : units < 5 ? 'bajo' : 'ok',
          barcode: p.barcode
        };
      });

      setProducts(inventoryItems);
      if (!regStatus) setIsOpeningModal(true);
    } catch (error) {
      toast.error('Error al cargar datos del POS');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRegister = async () => {
    setIsProcessing(true);
    try {
      const newReg = await api.openPOSRegister(parseFloat(openingAmount) || 0);
      setRegister(newReg);
      setIsOpeningModal(false);
      toast.success('Caja abierta correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al abrir caja');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.productName.toLowerCase().includes(searchLower) ||
        item.productCode.toLowerCase().includes(searchLower) ||
        (item.barcode && item.barcode.includes(searchQuery));

      const matchesCategory = !selectedCategory || item.productGroup === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const categories = useMemo(() => {
    const groups: Record<string, number> = {};
    products.forEach(p => {
      groups[p.productGroup] = (groups[p.productGroup] || 0) + 1;
    });
    return Object.entries(groups).map(([label, count]) => ({ id: label, label, count }));
  }, [products]);

  const cartTotal = useMemo(() => cart.reduce((sum, line) => sum + line.subtotal, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  const addToCart = (item: StoreInventoryItem) => {
    if (item.stockUnits <= 0) return;
    if (!isCashOpen) {
      toast.error('Caja cerrada', { id: 'cash-closed' });
      setIsOpeningModal(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === item.productId);
      if (existing) {
        if (existing.quantity >= item.stockUnits) {
          toast.error('Stock insuficiente');
          return prev;
        }
        return prev.map((line) =>
          line.productId === item.productId
            ? { ...line, quantity: line.quantity + 1, subtotal: (line.quantity + 1) * line.unitPrice }
            : line
        );
      }
      return [
        ...prev,
        {
          id: `line-${Date.now()}`,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: 1,
          unitPrice: item.priceB2C,
          subtotal: item.priceB2C,
        },
      ];
    });
  };

  const updateQuantity = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.id !== lineId) return line;
          const newQty = line.quantity + delta;
          if (newQty <= 0) return null as unknown as CartLine;
          const stockItem = products.find((i) => i.productId === line.productId);
          if (stockItem && newQty > stockItem.stockUnits) {
            toast.error('Stock insuficiente', { id: `stock-${line.productId}` });
            return line;
          }
          return { ...line, quantity: newQty, subtotal: newQty * line.unitPrice };
        })
        .filter(Boolean)
    );
  };

  const removeLine = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.id !== lineId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const changeAmount = paymentMethod === 'efectivo' ? Math.max(0, cashReceivedNum - cartTotal) : 0;

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'efectivo' && cashReceivedNum < cartTotal) {
      toast.error('Monto insuficiente');
      return;
    }

    setIsProcessing(true);
    try {
      const saleData = {
        lines: cart.map(l => ({
          productId: l.productId,
          productReference: l.productCode,
          productDescription: l.productName,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          total: l.subtotal
        })),
        paymentMethod,
        subtotal: cartTotal,
        total: cartTotal,
        clientName: selectedClient,
        cashReceived: cashReceivedNum,
        changeGiven: changeAmount,
        paymentReference: paymentMethod === 'efectivo' ? null : (cardRef || transferRef),
        orderNumber: `POS-${Date.now().toString().slice(-6)}`,
        type: 'pos'
      };

      await api.processPOSSale(saleData);

      toast.success('Venta completada', {
        description: `Total: ${formatCurrency(cartTotal)} - ${selectedClient}`,
      });

      setIsPayOpen(false);
      clearCart();
      setCashReceived('');
      setCardRef('');
      setTransferRef('');
      setPaymentMethod('efectivo');

      // Refresh stock
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
            <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Punto de Venta</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Ventas al detal B2C</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUB_NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cash register warning */}
      {!isCashOpen && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Caja cerrada</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Debes abrir la caja para poder realizar ventas</p>
          </div>
          <button
            onClick={() => setIsOpeningModal(true)}
            className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
          >
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* Main POS Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left - Products */}
        <div className="lg:col-span-3 space-y-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar producto, código o barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  !selectedCategory
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                )}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                  )}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid / List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((item) => (
                <motion.button
                  key={item.productId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => addToCart(item)}
                  disabled={item.stockUnits <= 0 || !isCashOpen}
                  className={cn(
                    'relative rounded-xl border p-3 text-left transition-all',
                    item.stockUnits <= 0
                      ? 'cursor-not-allowed border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] opacity-50'
                      : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-sm active:scale-[0.98]'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 dark:text-[#666]">{item.productCode}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        item.stockStatus === 'ok' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
                        item.stockStatus === 'bajo' && 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
                        item.stockStatus === 'agotado' && 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                      )}
                    >
                      {item.stockUnits}
                    </span>
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-900 dark:text-white leading-tight line-clamp-2">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#888]">{item.productGroup}</p>
                  <p className="mt-1.5 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.priceB2C)}
                  </p>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {filteredProducts.map((item) => (
                <button
                  key={item.productId}
                  onClick={() => addToCart(item)}
                  disabled={item.stockUnits <= 0 || !isCashOpen}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    item.stockUnits <= 0
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:bg-gray-100 dark:active:bg-[#222]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500 dark:text-[#888]">{item.productCode} - {item.productGroup}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      item.stockStatus === 'ok' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
                      item.stockStatus === 'bajo' && 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
                      item.stockStatus === 'agotado' && 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                    )}
                  >
                    {item.stockUnits} uds
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 w-20 text-right">
                    {formatCurrency(item.priceB2C)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-12">
              <Package className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-[#888]">No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Right - Cart */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden">
            <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Orden Actual</span>
                  {cartItemCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 hover:underline">
                    Vaciar
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-[#888]">{selectedClient}</span>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <ShoppingCart className="mb-3 h-10 w-10 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400 dark:text-[#666]">Carrito vacío</p>
                  <p className="text-xs text-gray-300 dark:text-[#555] mt-1">Selecciona productos para agregar</p>
                </div>
              ) : (
                cart.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{line.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-[#888]">{formatCurrency(line.unitPrice)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(line.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-[#2a2a2a] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-[#2a2a2a] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white w-16 text-right">
                      {formatCurrency(line.subtotal)}
                    </span>
                    <button
                      onClick={() => removeLine(line.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-[#888]">Total</span>
                <span className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              <button
                onClick={() => setIsPayOpen(true)}
                disabled={cart.length === 0 || !isCashOpen}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition-all',
                  cart.length === 0 || !isCashOpen
                    ? 'cursor-not-allowed bg-gray-200 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-600'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-600/20'
                )}
              >
                <CreditCard className="h-5 w-5" />
                COBRAR {formatCurrency(cartTotal)}
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-[#2a2a2a] px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#888]">
                <span>{register?.name || 'Caja #1'}</span>
                <span className={cn('flex items-center gap-1', isCashOpen ? 'text-emerald-600' : 'text-red-500')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', isCashOpen ? 'bg-emerald-500' : 'bg-red-500')} />
                  {isCashOpen ? 'Abierta' : 'Cerrada'}
                </span>
                <span>{user?.email || 'Vendedor'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opening Modal */}
      <CustomModal isOpen={isOpeningModal} onClose={() => { }} size="sm">
        <CustomModalHeader>
          <Wallet className="h-5 w-5 text-emerald-600" />
          Apertura de Caja
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <p className="text-sm text-gray-500">
            Ingresa el monto inicial de efectivo en caja para comenzar a vender.
          </p>
          <Input
            type="number"
            label="Fondo Inicial"
            placeholder="0.00"
            startContent={<DollarSign className="h-4 w-4 text-gray-400" />}
            value={openingAmount}
            onChange={(e) => setOpeningAmount(e.target.value)}
            className="font-mono text-lg"
          />
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            color="success"
            className="w-full font-bold"
            onPress={handleOpenRegister}
            isLoading={isProcessing}
          >
            Abrir Caja y Empezar
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Payment Modal */}
      <CustomModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsPayOpen(false)}>
          <DollarSign className="h-5 w-5 text-emerald-600" />
          Cobrar Venta
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="text-center rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-4 mb-4">
            <p className="text-xs text-gray-500 dark:text-[#888] mb-1">Total a Cobrar</p>
            <p className="font-mono text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(cartTotal)}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
                { key: 'tarjeta_debito' as const, label: 'Débito', icon: CreditCard },
                { key: 'tarjeta_credito' as const, label: 'Crédito', icon: CreditCard },
                { key: 'transferencia' as const, label: 'Transferencia', icon: ArrowLeftRight },
              ]).map((method) => (
                <button
                  key={method.key}
                  onClick={() => setPaymentMethod(method.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                    paymentMethod === method.key
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                  )}
                >
                  <method.icon className="h-4 w-4" />
                  {method.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'efectivo' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto Recibido</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="h-12 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 text-xl font-mono font-bold text-gray-900 dark:text-white text-center placeholder:text-gray-300 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                {cashReceivedNum > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Cambio</span>
                    <span className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(changeAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(paymentMethod === 'tarjeta_debito' || paymentMethod === 'tarjeta_credito') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Últimos 4 dígitos</label>
                <input
                  type="text"
                  maxLength={4}
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 text-center font-mono text-lg text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            )}

            {paymentMethod === 'transferencia' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia</label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="Número de referencia"
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            )}
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsPayOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            className="font-bold"
            onPress={handleConfirmPayment}
            isDisabled={paymentMethod === 'efectivo' && cashReceivedNum < cartTotal}
            isLoading={isProcessing}
          >
            <Check className="h-4 w-4" />
            Confirmar Cobro
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
