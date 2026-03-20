'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Printer, Receipt, Package, 
  Trash2, RotateCcw, User, Calendar, 
  CreditCard, Loader2, CheckCircle2, 
  XCircle, AlertTriangle, ShieldCheck,
  ChevronDown, ChevronUp, MapPin, ClipboardList
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const STATUS_LABELS: Record<string, { label: string, color: string, icon: any }> = {
  'COMPLETED': { label: 'Completada', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  'VOIDED': { label: 'Anulada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  'RETURNED': { label: 'Devuelta Total', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: RotateCcw },
  'PARTIALLY_RETURNED': { label: 'Dev. Parcial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: RotateCcw },
};

export default function SaleDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Void modal
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.posGetSaleById(id as string);
      setSale(data);
    } catch (err: any) {
      toast.error('Error al cargar detalle de venta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleVoid = async () => {
    if (!voidReason.trim()) return toast.error('Debes ingresar un motivo de anulación');
    
    setIsVoiding(true);
    try {
      await api.posVoidSale(id as string, user?.id || '', voidReason);
      toast.success('🛑 Venta anulada correctamente');
      setShowVoidModal(false);
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Error al anular venta');
    } finally {
      setIsVoiding(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  if (!sale) return (
    <div className="p-8 text-center text-gray-500">
      <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-red-500" />
      No se encontró la información de esta venta.
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black">{sale.number}</h1>
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm",
                STATUS_LABELS[sale.status]?.color || 'bg-gray-100 text-gray-600'
              )}>
                  {STATUS_LABELS[sale.status] && (() => {
                    const StatusIcon = STATUS_LABELS[sale.status].icon;
                    return <StatusIcon className="h-3.5 w-3.5" />;
                  })()}
                  {STATUS_LABELS[sale.status]?.label || sale.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> 
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none items-center justify-center gap-2 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
          {sale.status !== 'VOIDED' && (
            <button 
              onClick={() => setShowVoidModal(true)}
              className="flex-1 md:flex-none items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/10 hover:bg-red-700 transition-all"
            >
              <Trash2 className="h-4 w-4" /> Anular
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
          >
             <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Detalles de Productos</h3>
             </div>
             
             <div className="p-0 overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="text-[10px] font-bold text-gray-400 border-b border-gray-100 dark:border-white/5 uppercase bg-gray-50/30 dark:bg-white/2">
                     <th className="px-6 py-3 text-left">SKU / Producto</th>
                     <th className="px-6 py-3 text-center">Cant</th>
                     <th className="px-6 py-3 text-right">Precio</th>
                     <th className="px-6 py-3 text-right">Total</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {sale.lines?.map((line: any) => (
                      <tr key={line.id}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black">{line.product?.name || 'Desconocido'}</span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{line.product?.sku}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">{Number(line.quantity)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-mono">{fmt(Number(line.unitPrice))}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-black font-mono text-emerald-600">{fmt(Number(line.total))}</span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>

             <div className="bg-gray-50/50 dark:bg-white/2 p-6 flex flex-col items-end gap-2">
               <div className="flex justify-between w-64 text-sm">
                 <span className="text-gray-500 font-medium">Subtotal</span>
                 <span className="font-mono">{fmt(Number(sale.subtotal))}</span>
               </div>
               <div className="flex justify-between w-64 text-sm">
                 <span className="text-gray-500 font-medium">Impuestos</span>
                 <span className="font-mono">{fmt(Number(sale.tax))}</span>
               </div>
               <div className="flex justify-between w-64 pt-2 border-t border-gray-200 dark:border-white/10">
                 <span className="text-base font-bold">Total Final</span>
                 <span className="text-2xl font-black font-mono text-emerald-600">{fmt(Number(sale.total))}</span>
               </div>
             </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm"
          >
             <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Log de Auditoría</h3>
             </div>
             <div className="space-y-4">
                <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                      <div className="w-0.5 flex-1 bg-gray-100 dark:bg-white/5 my-1" />
                   </div>
                   <div>
                      <p className="text-xs font-bold">Venta Creada</p>
                      <p className="text-[10px] text-gray-400 font-mono">{new Date(sale.createdAt).toLocaleString()}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Registrada por el cajero <span className="font-bold">{sale.cashRegister?.userName || sale.createdByUser?.name}</span></p>
                   </div>
                </div>
                {sale.status === 'VOIDED' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-red-600">Venta Anulada</p>
                        <p className="text-[10px] text-gray-400 font-mono">{new Date(sale.updatedAt).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-500 mt-1 italic italic text-red-700/60 font-medium">"Motivo pendiente de tracking manual"</p>
                    </div>
                  </div>
                )}
             </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Información de Pago</h3>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Método de Pago</p>
                    <p className="text-sm font-bold">{sale.paymentMethod || 'EFECTIVO'}</p>
                 </div>
              </div>

              {sale.referenceNumber && (
                <div>
                   <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Referencia / Operación</p>
                   <p className="text-xs font-mono bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5 break-all">{sale.referenceNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div>
                   <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Recibido</p>
                   <p className="text-sm font-mono font-bold">{fmt(Number(sale.amountReceived))}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Cambio</p>
                   <p className="text-sm font-mono font-bold text-blue-600">{fmt(Number(sale.changeAmount))}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Cajero & Caja</h3>
              <MapPin className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="space-y-4">
              <div>
                 <p className="text-xs font-medium mb-1">Cajero Responsable</p>
                 <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 font-bold text-[10px]">
                      {sale.createdByUser?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{sale.createdByUser?.name}</span>
                 </div>
              </div>
              <div>
                 <p className="text-xs font-medium mb-1">Número de Caja</p>
                 <span className="text-xs inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 font-bold text-gray-600 dark:text-gray-400 font-mono">
                   # {sale.cashRegisterId?.substring(0, 8).toUpperCase() || 'POS-DEFAULT-01'}
                 </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* VOID MODAL */}
      <AnimatePresence>
        {showVoidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#141414] rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center space-y-4">
                 <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Trash2 className="h-8 w-8 text-red-600" />
                 </div>
                 <h2 className="text-xl font-bold">¿Anular Venta?</h2>
                 <p className="text-sm text-gray-500 px-4">Esta acción revertirá el inventario y marcará el ticket como anulado de forma permanente.</p>
                 
                 <div className="text-left space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Motivo de Anulación</label>
                    <textarea 
                       className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm focus:border-red-500 outline-none transition-all h-24 resize-none"
                       placeholder="Ej: Error de digitación, cliente canceló pago, producto defectuoso..."
                       value={voidReason}
                       onChange={e => setVoidReason(e.target.value)}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3 pt-4 font-bold">
                    <button 
                       onClick={() => setShowVoidModal(false)}
                       className="py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                       onClick={handleVoid}
                       disabled={isVoiding}
                       className="py-3 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                    >
                      {isVoiding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Confirmar
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
