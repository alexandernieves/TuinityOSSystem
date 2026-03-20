'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ArrowLeft, Receipt, Package, 
  Trash2, RotateCcw, User, Calendar, 
  CreditCard, Loader2, CheckCircle2, 
  XCircle, AlertTriangle, ShieldCheck,
  Plus, Minus, ShoppingCart, ArrowRight,
  ClipboardList
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function ReturnsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [sale, setSale] = useState<any>(null);
  
  // Return Cart
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session check
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!user) return;
      try {
        const active = await api.posGetActiveSession(user.id);
        if (active) setSessionId(active.id);
      } catch (e) {}
    };
    checkSession();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;
    
    setLoading(true);
    setSale(null);
    setReturnItems([]);
    try {
      const data = await api.posSearchOriginalSale(ticketNumber);
      setSale(data);
    } catch (err: any) {
      toast.error(err.message || 'Ticket no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (line: any) => {
    const exists = returnItems.find(i => i.productId === line.productId);
    if (exists) {
      setReturnItems(returnItems.filter(i => i.productId !== line.productId));
    } else {
      setReturnItems([...returnItems, { ...line, returnQty: 1 }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const originalQty = Number(item.quantity);
        const newQty = Math.max(1, Math.min(originalQty, item.returnQty + delta));
        return { ...item, returnQty: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return returnItems.reduce((acc, item) => acc + (Number(item.unitPrice) * item.returnQty), 0);
  };

  const handleSubmit = async () => {
    if (!sessionId) return toast.error('Debes tener una caja abierta para procesar devoluciones');
    if (returnItems.length === 0) return toast.error('Selecciona al menos un producto');
    if (!reason.trim()) return toast.error('Ingresa un motivo de devolución');

    setIsSubmitting(true);
    try {
      const res = await api.posCreateReturn({
        userId: user?.id || '',
        sessionId,
        saleId: sale.id,
        items: returnItems.map(i => ({ productId: i.productId, quantity: i.returnQty })),
        reason,
        refundMethod
      });
      toast.success(`✅ Devolución procesada: ${fmt(res.amount)}`);
      router.push('/pos/history');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar devolución');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 p-1">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="h-10 w-10 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Devoluciones POS</h1>
          <p className="text-sm text-gray-500">Procesa retornos de mercancía y reembolsos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search & Original Sale */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
             className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm"
          >
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Busca el número de ticket (ej: POS-2024-0001)..."
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-emerald-500 outline-none transition-all font-mono"
                  value={ticketNumber}
                  onChange={e => setTicketNumber(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </button>
            </form>
          </motion.div>

          <AnimatePresence mode="wait">
            {sale ? (
              <motion.div 
                 key="sale-info"
                 initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                 className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
              >
                 <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Receipt className="h-5 w-5 text-emerald-500" />
                       <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Ticket Original: {sale.number}</h3>
                    </div>
                    <span className="text-xs font-mono text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</span>
                 </div>

                 <div className="p-0 overflow-x-auto">
                   <table className="w-full">
                     <thead>
                       <tr className="text-[10px] font-bold text-gray-400 border-b border-gray-100 dark:border-white/5 uppercase bg-gray-50/30 dark:bg-white/2">
                         <th className="px-6 py-3 text-left">Seleccionar</th>
                         <th className="px-6 py-3 text-left">Producto</th>
                         <th className="px-6 py-3 text-center">Disp.</th>
                         <th className="px-6 py-3 text-right">Precio</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {sale.lines.map((line: any) => {
                          const isSelected = !!returnItems.find(i => i.productId === line.productId);
                          return (
                            <tr key={line.id} className={cn(isSelected && "bg-emerald-50/50 dark:bg-emerald-900/10 transition-colors")}>
                              <td className="px-6 py-4">
                                <button 
                                  onClick={() => toggleItem(line)}
                                  className={cn(
                                    "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                    isSelected ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300 dark:border-white/10"
                                  )}
                                >
                                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                   <span className="text-xs font-bold">{line.product.name}</span>
                                   <span className="text-[10px] text-gray-400">{line.product.sku}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-xs font-mono">{Number(line.quantity)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-xs font-mono font-bold text-emerald-600">{fmt(Number(line.unitPrice))}</span>
                              </td>
                            </tr>
                          );
                        })}
                     </tbody>
                   </table>
                 </div>
              </motion.div>
            ) : !loading && (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-3xl">
                <Receipt className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">Ingresa un ticket para ver sus detalles</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Return Summary */}
        <div className="space-y-6">
          <motion.div 
             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
             className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col gap-5 sticky top-6"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-black uppercase tracking-widest ">Resumen de Retorno</h3>
            </div>

            <div className="space-y-3 min-h-[100px]">
               {returnItems.length === 0 ? (
                 <p className="text-xs text-center text-gray-400 py-8">No hay productos seleccionados</p>
               ) : (
                 returnItems.map(item => (
                   <div key={item.productId} className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                      <div className="flex justify-between items-start">
                         <span className="text-[10px] font-bold line-clamp-1 flex-1 pr-2">{item.product.name}</span>
                         <button onClick={() => toggleItem(item)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center bg-white dark:bg-black/40 rounded-lg border border-gray-200 dark:border-white/10 px-1">
                            <button onClick={() => updateQty(item.productId, -1)} className="p-1 hover:text-emerald-500"><Minus className="h-3 w-3" /></button>
                            <span className="w-8 text-center text-xs font-bold font-mono">{item.returnQty}</span>
                            <button onClick={() => updateQty(item.productId, 1)} className="p-1 hover:text-emerald-500"><Plus className="h-3 w-3" /></button>
                         </div>
                         <span className="text-xs font-mono font-bold text-emerald-600">{fmt(Number(item.unitPrice) * item.returnQty)}</span>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Motivo</label>
                  <textarea 
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs focus:border-emerald-500 outline-none h-20 resize-none mt-1"
                    placeholder="Ej: Defecto de fábrica, talla incorrecta..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
               </div>

               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Método Reimbolso</label>
                 <select 
                   className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:border-emerald-500 outline-none mt-1"
                   value={refundMethod}
                   onChange={e => setRefundMethod(e.target.value)}
                 >
                   <option value="CASH">Efectivo (+ Caja)</option>
                   <option value="STORE_CREDIT">Crédito de Tienda</option>
                   <option value="ORIGINAL_METHOD">Método Original</option>
                 </select>
               </div>

               <div className="flex justify-between items-center py-2">
                 <span className="text-sm font-medium text-gray-500">A Devolver</span>
                 <span className="text-xl font-black font-mono text-emerald-600">{fmt(calculateTotal())}</span>
               </div>

               <button 
                 onClick={handleSubmit}
                 disabled={isSubmitting || returnItems.length === 0}
                 className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
               >
                 {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                 Procesar Devolución
               </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
