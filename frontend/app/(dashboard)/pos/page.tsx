'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, ArrowLeftRight, CheckCircle2, X, Loader2,
  Monitor, Package, User, LogOut, Receipt, Keyboard, History, RotateCcw, AlertTriangle, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Pagination, usePagination } from "@/components/ui/pagination";

interface CartItem {
  productId: string;
  warehouseId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  unitPrice?: number;
  prices?: { priceLevel: string; price: number }[];
  existences?: { warehouseId: string; available: number }[];
}

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Efectivo', icon: Banknote, color: 'bg-emerald-500 hover:bg-emerald-600' },
  { id: 'CARD', label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'TRANSFER', label: 'Transferencia', icon: ArrowLeftRight, color: 'bg-purple-500 hover:bg-purple-600' },
];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function POSPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Session state
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [openingAmount, setOpeningAmount] = useState('');
  const [startingSession, setStartingSession] = useState(false);

  // Products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<any[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('');
  const [query, setQuery] = useState('');

  const {
    currentPage,
    totalPages,
    totalItems,
    rowsPerPage,
    paginatedData,
    handlePageChange,
    handleRowsPerPageChange,
  } = usePagination(filteredProducts, 12);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);

  // Client Selection
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [newClient, setNewClient] = useState({ name: '', phone: '' });
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Last ticket
  const [lastSale, setLastSale] = useState<any>(null);

  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const change = Math.max(0, parseFloat(amountReceived || '0') - cartTotal);

  // Load session on mount
  useEffect(() => {
    if (!user?.id) return;
    api.posGetActiveSession(user.id)
      .then(s => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setLoadingSession(false));
  }, [user?.id]);

  // Load products + warehouses
  useEffect(() => {
    api.getProducts().then(setAllProducts).catch(() => {});
    api.getWarehouses().then(ws => {
      setAllWarehouses(ws);
      if (ws.length > 0) setDefaultWarehouseId(ws[0].id);
    }).catch(() => {});
    api.getClients().then(setClientsData).catch(() => {});
  }, []);

  // Focus search input always
  useEffect(() => {
    if (session) {
      searchRef.current?.focus();
    }
  }, [session, cart]);

  // Filter products based on search query
  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(p =>
        p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
      );
      setFilteredProducts(filtered);
    }
    handlePageChange(1); // Reset to page 1 on search
  }, [query, allProducts]);

  const addToCart = useCallback((product: Product) => {
    const warehouseId = defaultWarehouseId;
    const posPrice = (Array.isArray(product.prices) && product.prices.find(p => p.priceLevel === 'POS')?.price)
      || (Array.isArray(product.prices) && product.prices[0]?.price)
      || product.unitPrice
      || 0;

    setCart(prev => {
      const existing = prev.findIndex(i => i.productId === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += 1;
        updated[existing].subtotal = updated[existing].quantity * updated[existing].unitPrice;
        return updated;
      }
      return [...prev, {
        productId: product.id,
        warehouseId,
        sku: product.sku,
        name: product.name,
        unitPrice: posPrice,
        quantity: 1,
        subtotal: posPrice,
      }];
    });
    setQuery('');
    searchRef.current?.focus();
  }, [defaultWarehouseId]);

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      updated[idx].quantity = newQty;
      updated[idx].subtotal = newQty * updated[idx].unitPrice;
      return updated;
    });
  };

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const confirmSale = async () => {
    if (!session) return toast.error('No hay sesión activa de caja');
    if (cart.length === 0) return toast.error('El carrito está vacío');
    if (payMethod === 'CASH' && parseFloat(amountReceived || '0') < cartTotal)
      return toast.error('Monto recibido insuficiente');

    setProcessing(true);
    try {
      const sale = await api.posCreateSale({
        userId: user?.id,
        sessionId: session.id,
        customerId: selectedClient?.id,
        items: cart.map(i => ({
          productId: i.productId,
          warehouseId: i.warehouseId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        paymentMethod: payMethod,
        amountReceived: parseFloat(amountReceived || String(cartTotal)),
        referenceNumber: reference || undefined,
      });
      setLastSale(sale);
      setCart([]);
      setShowPayment(false);
      setAmountReceived('');
      setReference('');
      toast.success(`✅ Venta ${sale.number} completada`, { duration: 3000 });
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar venta');
    } finally {
      setProcessing(false);
    }
  };

  const startSession = async () => {
    if (!user?.id) return;
    setStartingSession(true);
    try {
      const s = await api.posStartSession({
        userId: user.id,
        openingAmount: parseFloat(openingAmount) || 0,
      });
      setSession(s);
      toast.success('Sesión de caja iniciada');
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir caja');
    } finally {
      setStartingSession(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name) return toast.error('El nombre es obligatorio');
    setIsCreatingClient(true);
    try {
      const c = await api.createClient({
        name: newClient.name,
        phone: newClient.phone,
        type: 'b2c',
        reference: `B2C-${Date.now().toString().slice(-6)}`
      });
      setClientsData([...clientsData, c]);
      setSelectedClient(c);
      setShowClientModal(false);
      setNewClient({ name: '', phone: '' });
      toast.success('Cliente B2C creado');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear cliente');
    } finally {
      setIsCreatingClient(false);
    }
  };

  // ---- LOADING ----
  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // ---- APERTURA DE CAJA ----
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-center"
        >
          <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Monitor className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Punto de Venta</h1>
          <p className="text-sm text-gray-500 mb-6">Abre la sesión de caja para empezar a vender</p>

          <div className="space-y-4 text-left mb-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Monto de Apertura ($)</label>
              <input
                type="number"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-mono bg-gray-50 dark:bg-black/20 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={startSession}
            disabled={startingSession}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
          >
            {startingSession ? <Loader2 className="h-5 w-5 animate-spin" /> : <Monitor className="h-5 w-5" />}
            Abrir Caja
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- LAST TICKET ----
  if (lastSale) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">¡Venta Completada!</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{lastSale.number}</p>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-4 space-y-2">
            {lastSale.lines?.map((line: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{line.product?.name || line.productId} × {line.quantity}</span>
                <span className="font-mono font-bold">{fmt(Number(line.total))}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-emerald-600">{fmt(Number(lastSale.total))}</span>
            </div>
            {Number(lastSale.changeAmount) > 0 && (
              <div className="flex justify-between text-blue-600 font-semibold">
                <span>Vuelto</span>
                <span>{fmt(Number(lastSale.changeAmount))}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setLastSale(null)}
            className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Nueva Venta
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- MAIN POS TERMINAL ----
  const isOldSession = session && new Date(session.openedAt).toDateString() !== new Date().toDateString();

  if (isOldSession) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
           className="w-full max-w-md bg-white dark:bg-[#141414] border border-red-200 dark:border-red-900/30 rounded-3xl p-8 shadow-2xl text-center"
        >
           <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
             <AlertTriangle className="h-8 w-8" />
           </div>
           <h1 className="text-2xl font-black mb-2 text-red-600">¡Cierre Pendiente!</h1>
           <p className="text-sm text-gray-500 mb-6">
             Tienes una sesión de caja abierta de una fecha anterior ({new Date(session.openedAt).toLocaleDateString()}). 
             Debes cerrarla antes de continuar operando.
           </p>
           <button
             onClick={() => router.push('/pos/cierre')}
             className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
           >
             <LogOut className="h-5 w-5" />
             Ir al Cierre de Caja
           </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Monitor className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Punto de Venta</h1>
            <p className="text-xs text-gray-500 mt-0.5">Cajero: {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/pos/history')}
            className="text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <History className="h-4 w-4 text-orange-500" />
            Historial
          </button>
          <button
            onClick={() => router.push('/pos/returns')}
            className="text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <RotateCcw className="h-4 w-4 text-blue-500" />
            Devoluciones
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-semibold">
            Sesión activa
          </span>
          <button
            onClick={() => router.push('/pos/cierre')}
            className="text-xs text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 flex items-center gap-1 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Cerrar Caja
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* LEFT: Product Catalog (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Scanner / Search Bar */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#141414] border-2 border-emerald-400 rounded-2xl px-5 py-4 shadow-lg shadow-emerald-500/10">
            <Keyboard className="h-6 w-6 text-emerald-500 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && paginatedData.length > 0) addToCart(paginatedData[0]);
                if (e.key === 'Escape') { setQuery(''); }
              }}
              placeholder="Escanear código de barras o buscar producto..."
              className="flex-1 bg-transparent outline-none text-lg font-medium placeholder:text-gray-400"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              <AnimatePresence mode="popLayout">
                {paginatedData.map((p) => {
                  const pricePos = (Array.isArray(p.prices) && p.prices.find(pr => pr.priceLevel === 'POS')?.price)
                    || (Array.isArray(p.prices) && p.prices[0]?.price)
                    || p.unitPrice || 0;
                  
                  return (
                    <motion.button
                      layout
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => addToCart(p)}
                      className="flex flex-col bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 rounded-2xl p-4 text-left transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 group relative overflow-hidden active:scale-95"
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="h-12 w-12 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                        <Package className="h-6 w-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate mb-1 text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{p.sku}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                        <span className="text-base font-black text-emerald-600 font-mono">{fmt(Number(pricePos))}</span>
                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                          <Plus className="h-3 w-3 text-emerald-600" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-auto">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              itemName="productos"
            />
          </div>
        </div>

        {/* RIGHT: Cart + Total (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-hidden">
          
          {/* Client Selection */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-500 transition-colors"
               onClick={() => setShowClientModal(true)}
          >
             <div className="flex items-center gap-3">
               <div className={cn(
                 "h-10 w-10 rounded-xl flex items-center justify-center",
                 selectedClient ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-white/5 text-gray-400"
               )}>
                 <User className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedClient ? selectedClient.name : 'Consumidor Final'}
                  </p>
                  {selectedClient && (
                    <p className="text-[10px] text-gray-500">{selectedClient.reference} {selectedClient.phone ? `• ${selectedClient.phone}` : ''}</p>
                  )}
                  {!selectedClient && (
                    <p className="text-[10px] text-gray-400">Clic para asociar cliente</p>
                  )}
               </div>
             </div>
             {selectedClient ? (
               <button 
                 onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }}
                 className="p-2 text-gray-400 hover:text-red-500 transition-colors"
               >
                 <X className="h-4 w-4" />
               </button>
             ) : (
               <Search className="h-4 w-4 text-gray-300" />
             )}
          </div>

          {/* Cart */}
          <div className="flex-1 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <ShoppingCart className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Carrito Actual</span>
              <span className="ml-auto text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)} unid
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400 opacity-50">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-medium">Carrito vacío</p>
                    <p className="text-xs mt-1">Selecciona productos a la izquierda</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <motion.div
                      key={`${item.productId}-${idx}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-200">{item.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{fmt(item.unitPrice)} c/u</p>
                      </div>

                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition-colors shadow-sm"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-6 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition-colors shadow-sm"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-black font-mono w-16 text-right text-emerald-600">
                        {fmt(item.subtotal)}
                      </span>

                      <button
                        onClick={() => removeItem(idx)}
                        className="h-8 w-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Subtotal summary above big button */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase">Subtotal Neto</span>
                  <span className="text-lg font-black font-mono text-gray-900 dark:text-white">{fmt(cartTotal)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCart([])}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-white/5 border border-red-200 dark:border-red-900/30 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="h-4 w-4" /> Vaciar
                  </button>
                  <button
                    onClick={() => { setShowPayment(true); setAmountReceived(String(cartTotal.toFixed(2))); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <Banknote className="h-4 w-4" /> Cobrar
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Stats / Session Info */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
             <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 dark:border-white/5">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resumen del Turno</span>
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             </div>
             <div className="space-y-3">
               {[
                 { label: 'Ingresos Efectivo', value: Number(session.cashSales || 0), icon: Banknote, color: 'text-emerald-500' },
                 { label: 'Pagos Tarjeta', value: Number(session.cardSales || 0), icon: CreditCard, color: 'text-blue-500' },
                 { label: 'Ventas Totales', value: Number(session.totalSales || 0), icon: Receipt, color: 'text-gray-900 dark:text-white' },
               ].map(s => (
                 <div key={s.label} className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <s.icon className={cn("h-4 w-4", s.color)} />
                     <span className="text-gray-500 line-clamp-1">{s.label}</span>
                   </div>
                   <span className="font-black font-mono">{fmt(s.value)}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#141414] rounded-3xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Registrar Pago</h2>
                <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Total */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-5 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total</p>
                <p className="text-4xl font-black font-mono text-gray-900 dark:text-white">{fmt(cartTotal)}</p>
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl text-white text-xs font-bold transition-all',
                      payMethod === m.id ? m.color : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                    )}
                  >
                    <m.icon className="h-5 w-5" />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Amount received */}
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Monto Recibido</label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={e => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full border-2 border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-2xl font-mono font-bold bg-gray-50 dark:bg-black/20 focus:outline-none focus:border-emerald-400"
                    autoFocus
                  />
                </div>

                {payMethod !== 'CASH' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Referencia / # Operación</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      placeholder="TX-12345..."
                      className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-black/20 focus:outline-none"
                    />
                  </div>
                )}

                {payMethod === 'CASH' && change > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Vuelto</span>
                    <span className="text-xl font-black font-mono text-blue-700 dark:text-blue-400">{fmt(change)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={confirmSale}
                disabled={processing || (payMethod === 'CASH' && parseFloat(amountReceived || '0') < cartTotal)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-white/5 disabled:text-gray-400 text-white py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Confirmar Venta
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT SEARCH / CREATE MODAL */}
      <AnimatePresence>
        {showClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#141414] rounded-3xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Asociar Cliente B2C
                </h2>
                <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs for Search / Create */}
              <div className="flex gap-4 border-b border-gray-100 dark:border-white/10 mb-4 pb-1">
                 <button className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-2">Buscar Existente</button>
                 {/* Creacion rapida */}
                 <div className="ml-auto flex items-center gap-2">
                   <input
                     type="text"
                     placeholder="Nombre rápido..."
                     value={newClient.name}
                     onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                     className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs w-32 focus:outline-blue-500"
                   />
                   <input
                     type="text"
                     placeholder="Teléfono..."
                     value={newClient.phone}
                     onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                     className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs w-28 focus:outline-blue-500"
                   />
                   <button 
                     onClick={handleCreateClient}
                     disabled={isCreatingClient || !newClient.name}
                     className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
                   >
                     {isCreatingClient ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Crear'}
                   </button>
                 </div>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Buscar por nombre, teléfono o documento..."
                   value={clientSearch}
                   onChange={e => setClientSearch(e.target.value)}
                   className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                   autoFocus
                 />
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-white/5 rounded-xl">
                 {clientsData.filter(c => 
                    !clientSearch || 
                    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                    c.phone?.includes(clientSearch) ||
                    c.reference?.toLowerCase().includes(clientSearch.toLowerCase())
                 ).slice(0, 50).map(c => (
                   <div 
                     key={c.id} 
                     onClick={() => { setSelectedClient(c); setShowClientModal(false); }}
                     className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                   >
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</span>
                         <span className="text-[10px] text-gray-500">{c.reference} {c.phone ? `• ${c.phone}` : ''}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                   </div>
                 ))}
                 {clientsData.length === 0 && (
                   <div className="p-8 text-center text-gray-400 text-sm">No hay clientes registrados</div>
                 )}
              </div>
              
              <button 
                onClick={() => { setSelectedClient(null); setShowClientModal(false); }}
                className="w-full mt-4 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
              >
                Continuar como Consumidor Final
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
