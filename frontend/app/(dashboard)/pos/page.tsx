'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  Banknote, ArrowLeftRight, CheckCircle2, X, Loader2,
  Monitor, Package, User, LogOut, Receipt, Keyboard, History, RotateCcw, AlertTriangle, ChevronRight,
  Warehouse
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Pagination, usePagination } from "@/components/ui/pagination";
import { SkeletonGrid } from '@/components/ui/skeleton-grid';

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
  const [loadingProducts, setLoadingProducts] = useState(false);
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

  useEffect(() => {
    if (!user?.id) return;
    setLoadingProducts(true);
    api.posGetActiveSession(user.id)
      .then(s => {
        setSession(s);
        if (s?.warehouseId) {
          api.getProducts(s.warehouseId).then(setAllProducts).finally(() => setLoadingProducts(false));
        } else {
          setLoadingProducts(false);
        }
      })
      .catch(() => {
        setSession(null);
        setLoadingProducts(false);
      })
      .finally(() => setLoadingSession(false));
  }, [user?.id]);

  // Load products + warehouses
  useEffect(() => {
    api.getProducts().then(setAllProducts).catch(() => {});
    api.getWarehouses().then((ws: any[]) => {
      // B2C / POS never shows Principal warehouse
      const filtered = ws.filter(w => !w.name.toLowerCase().includes('principal'));
      setAllWarehouses(filtered);
      if (filtered.length > 0) setDefaultWarehouseId(filtered[0].id);
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
    const warehouseId = session?.warehouseId || defaultWarehouseId;
    const pPrices: any = product.prices;
    const posPrice = (Array.isArray(pPrices) && pPrices.find((p: any) => p.priceLevel === 'POS')?.price)
      || (Array.isArray(pPrices) && pPrices[0]?.price)
      || (typeof pPrices === 'object' && (pPrices.POS || pPrices.C || pPrices.A))
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
          warehouseId: session?.warehouseId || i.warehouseId,
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
    const warehouseId = (allWarehouses.find(w => w.id === defaultWarehouseId) || allWarehouses[0])?.id;
    try {
      const s = await api.posStartSession({
        userId: user.id,
        openingAmount: parseFloat(openingAmount) || 0,
        warehouseId
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
    const defaultWarehouse = allWarehouses.find(w => w.id === defaultWarehouseId) || allWarehouses[0];

    return (
      <div className="flex items-center justify-center min-h-[80vh] relative overflow-hidden bg-white dark:bg-[#0A0A0A]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white dark:bg-[#0A0A0A] border-none p-10 text-center">
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <Monitor className="h-16 w-16 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-white">Terminal de Venta</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 max-w-[280px]">
                Inicie el turno de trabajo estableciendo el fondo de caja inicial.
              </p>
            </div>

            <div className="space-y-6 mb-10 text-left">
              {/* Terminal Info */}
              <div className="flex items-center gap-4 px-2">
                <Warehouse className="h-6 w-6 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sucursal / Bodega</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {defaultWarehouse?.name || 'Cargando...'}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-900 dark:text-white">$</div>
                  <input
                    type="number"
                    value={openingAmount}
                    onChange={e => setOpeningAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border-b-2 border-gray-100 dark:border-white/5 focus:border-emerald-500 rounded-none pl-8 pr-2 py-4 text-4xl font-extrabold bg-transparent focus:outline-none transition-all placeholder:text-gray-200"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={startingSession}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-white/5 text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 group"
            >
              {startingSession ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <span>Abrir Caja Registradora</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="mt-12 text-center">
              <p className="text-xs text-gray-400 font-medium tracking-wide">
                OPERADOR: <span className="text-gray-900 dark:text-gray-200 font-bold uppercase">{user?.name}</span>
              </p>
            </div>
          </div>
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
          className="w-full max-w-sm bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-8"
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
           className="w-full max-w-md bg-white dark:bg-[#141414] border border-red-200 dark:border-red-900/30 rounded-2xl p-8 text-center"
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
             className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
           >
             <LogOut className="h-5 w-5" />
             Ir al Cierre de Caja
           </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0A0A0A]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-white/5 pb-6 pt-2">
        <div className="flex items-center gap-4">
          <Monitor className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white uppercase tracking-widest">Terminal POS</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                CAJERO: <span className="text-gray-900 dark:text-gray-200">{user?.name}</span> • <span className="text-emerald-600">{(allWarehouses.find(w => w.id === (session?.warehouseId))?.name) || 'Colón'}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Turno</p>
              <p className="text-base font-extrabold text-gray-900 dark:text-white">{fmt(Number(session?.totalSales || 0))}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/pos/history')}
            className="h-10 px-4 bg-transparent border border-gray-100 dark:border-white/5 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <History className="h-4 w-4 text-orange-500" />
            <span className="hidden sm:inline">Historial</span>
          </button>
          <button
            onClick={() => router.push('/pos/returns')}
            className="h-10 px-4 bg-transparent border border-gray-100 dark:border-white/5 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <RotateCcw className="h-4 w-4 text-blue-500" />
            <span className="hidden sm:inline">Devoluciones</span>
          </button>
          <div className="w-px h-8 bg-gray-100 dark:bg-white/10 mx-1" />
          <button
            onClick={() => router.push('/pos/cierre')}
            className="h-10 px-4 text-red-600 rounded-xl flex items-center gap-2 text-xs font-bold border border-red-100 dark:border-red-900/20 hover:bg-red-600 hover:text-white transition-all active:scale-95 group"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Turno
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* LEFT: Product Catalog (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          {/* Scanner / Search Bar */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-4">
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
            {loadingProducts ? (
              <div className="p-1">
                <SkeletonGrid items={12} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              <AnimatePresence mode="popLayout">
                {paginatedData.map((p: any) => {
                  const pPrices: any = p.prices;
                  const pricePos = (Array.isArray(pPrices) && pPrices.find((pr: any) => pr.priceLevel === 'POS')?.price)
                    || (Array.isArray(pPrices) && pPrices[0]?.price)
                    || (typeof pPrices === 'object' && (pPrices.POS || pPrices.C || pPrices.A))
                    || p.unitPrice || 0;
                  
                  return (
                    <motion.button
                      layout
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => addToCart(p)}
                      className="flex flex-col bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 rounded-2xl p-4 text-left transition-all hover:bg-gray-50 dark:hover:bg-white/5 group relative overflow-hidden active:scale-95"
                    >
                      <div className="h-10 w-10 flex items-center justify-center mb-4">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold truncate mb-1 text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{p.sku}</p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                        <span className="text-base font-extrabold text-emerald-600">{fmt(Number(pricePos))}</span>
                        <div className="flex flex-col items-end">
                           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Stock</p>
                           <p className="text-xs font-bold text-gray-900 dark:text-gray-200">
                             {p.stock?.available ?? (p.existences?.find((e: any) => e.warehouseId === (session?.warehouseId))?.available || 0)}
                           </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
            )}
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
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
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
          <div className="flex-1 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-0">
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
                        <p className="text-[11px] text-gray-400 font-bold mt-0.5">{fmt(item.unitPrice)} c/u</p>
                      </div>

                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black w-6 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold w-20 text-right text-emerald-600">
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
              <div className="p-6 border-t border-gray-100 dark:border-white/5">
                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Base Imponible</span>
                    <span className="font-extrabold">{fmt(cartTotal / 1.15)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Impuestos (15%)</span>
                    <span className="font-extrabold">{fmt(cartTotal - (cartTotal / 1.15))}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/5 mt-4">
                    <span className="font-bold uppercase tracking-widest text-[10px] text-gray-900 dark:text-white">Total a Pagar</span>
                    <span className="text-3xl font-black text-emerald-600 tracking-tighter">{fmt(cartTotal)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCart([])}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-200 dark:border-white/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" /> Vaciar
                  </button>
                  <button
                    onClick={() => { setShowPayment(true); setAmountReceived(String(cartTotal.toFixed(2))); }}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <Banknote className="h-4 w-4" /> Procesar Pago
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Stats / Session Info */}
          <div className="p-5 border-t border-gray-100 dark:border-white/5">
             <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen del Turno</span>
             </div>
             <div className="space-y-3">
               {[
                 { label: 'Efectivo', value: Number(session.cashSales || 0), icon: Banknote, color: 'text-emerald-500' },
                 { label: 'Tarjeta', value: Number(session.cardSales || 0), icon: CreditCard, color: 'text-blue-500' },
                 { label: 'Total', value: Number(session.totalSales || 0), icon: Receipt, color: 'text-gray-900 dark:text-white' },
               ].map(s => (
                 <div key={s.label} className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-2">
                     <span className="text-gray-500 font-bold uppercase tracking-tighter text-[9px]">{s.label}</span>
                   </div>
                   <span className="font-extrabold">{fmt(s.value)}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {showPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/10 rounded-2xl w-full max-w-md p-10 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase tracking-widest leading-none">Procesar Pago</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Método y Monto</p>
                </div>
                <button 
                  onClick={() => setShowPayment(false)} 
                  className="h-10 w-10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Total Display */}
              <div className="py-8 mb-8 text-center border-b border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-2">Monto Total</p>
                <p className="text-5xl font-extrabold text-emerald-600 tracking-tighter">{fmt(cartTotal)}</p>
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 py-5 rounded-xl transition-all border',
                      payMethod === m.id 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'bg-transparent border-gray-100 dark:border-white/5 text-gray-400 hover:border-emerald-200'
                    )}
                  >
                    <m.icon className={cn("h-6 w-6", payMethod === m.id ? "text-white" : "text-gray-300")} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Amount received */}
              <div className="space-y-6 mb-10">
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-900 dark:text-white">$</div>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={e => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full border-b-2 border-gray-100 dark:border-white/5 focus:border-emerald-500 pl-8 pr-2 py-4 text-4xl font-extrabold bg-transparent focus:outline-none transition-all placeholder:text-gray-200"
                    autoFocus
                  />
                </div>

                {payMethod !== 'CASH' && (
                  <div className="relative">
                    <input
                      type="text"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      placeholder="Referencia de Operación"
                      className="w-full border-b border-gray-100 dark:border-white/5 py-3 text-sm font-bold bg-transparent focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                )}

                {payMethod === 'CASH' && change > 0 && (
                  <div className="py-4 flex justify-between items-center border-t border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cambio / Vuelto</span>
                    <span className="text-2xl font-extrabold text-blue-600 leading-none">{fmt(change)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={confirmSale}
                disabled={processing || (payMethod === 'CASH' && parseFloat(amountReceived || '0') < cartTotal)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-400 text-white py-6 rounded-xl font-black text-base uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
                Finalizar Venta
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT SEARCH / CREATE MODAL */}
      <AnimatePresence>
        {showClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/10 rounded-2xl w-full max-w-2xl p-0 flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-extrabold flex items-center gap-3 text-gray-900 dark:text-white uppercase tracking-widest">
                    Asociar Cliente
                  </h2>
                  <button 
                    onClick={() => setShowClientModal(false)} 
                    className="h-10 w-10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Creacion rapida */}
                <div className="p-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Registro Rápido</p>
                  <div className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px] relative">
                      <input
                        type="text"
                        placeholder="Nombre Completo"
                        value={newClient.name}
                        onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                        className="w-full bg-transparent border-b border-gray-100 dark:border-white/5 px-2 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="w-full md:w-48 relative">
                       <input
                         type="text"
                         placeholder="Teléfono"
                         value={newClient.phone}
                         onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                         className="w-full bg-transparent border-b border-gray-100 dark:border-white/5 px-2 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                       />
                    </div>
                    <button 
                      onClick={handleCreateClient}
                      disabled={isCreatingClient || !newClient.name}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-white/5 text-white rounded-xl h-[44px] px-8 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      {isCreatingClient ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Registrar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-8 py-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Búsqueda Global</p>
                  <div className="relative">
                     <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                     <input
                       type="text"
                       placeholder="Nombre, teléfono, RUC..."
                       value={clientSearch}
                       onChange={e => setClientSearch(e.target.value)}
                       className="w-full bg-transparent border-b border-gray-100 dark:border-white/5 pl-8 pr-2 py-3 text-base font-bold text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                       autoFocus
                     />
                  </div>
                </div>

                <div className="px-8 pb-8 flex-1 overflow-y-auto space-y-1">
                   {clientsData.filter(c => 
                      !clientSearch || 
                      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      c.phone?.includes(clientSearch) ||
                      c.reference?.toLowerCase().includes(clientSearch.toLowerCase())
                   ).slice(0, 20).map(c => (
                     <div 
                       key={c.id} 
                       onClick={() => { setSelectedClient(c); setShowClientModal(false); }}
                       className="flex items-center gap-4 p-4 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-all group"
                     >
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-extrabold text-gray-900 dark:text-white">{c.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{c.reference} {c.phone ? `• ${c.phone}` : ''}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-white/5">
                <button 
                  onClick={() => { setSelectedClient(null); setShowClientModal(false); }}
                  className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-95"
                >
                  Continuar como Consumidor Final
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
