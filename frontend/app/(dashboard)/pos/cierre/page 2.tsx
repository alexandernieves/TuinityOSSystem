'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Loader2, CheckCircle2, AlertTriangle, Receipt } from 'lucide-react';
import { api } from '@/lib/services/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function CierreCAjaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    api.posGetActiveSession(user.id)
      .then(s => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleClose = async () => {
    if (!session) return;
    setClosing(true);
    try {
      await api.posCloseSession(session.id, {
        closingAmount: parseFloat(closingAmount) || 0,
        notes
      });
      setClosed(true);
      toast.success('Caja cerrada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar caja');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );

  if (closed) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm mx-auto"
      >
        <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Caja Cerrada</h2>
        <p className="text-gray-500 mb-6">Tu turno ha finalizado correctamente.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-gray-900 dark:bg-white dark:text-black text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Ir al Dashboard
        </button>
      </motion.div>
    </div>
  );

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center text-gray-500">
        <p>No hay una sesión activa</p>
        <button onClick={() => router.push('/pos')} className="mt-4 text-emerald-600 font-bold">← Ir al POS</button>
      </div>
    </div>
  );

  const expectedCash = Number(session.openingAmount || 0) + Number(session.cashSales || 0);
  const currentDiff = (parseFloat(closingAmount) || 0) - expectedCash;

  return (
    <div className="max-w-6xl mx-auto xl:px-4 space-y-6 pb-20 p-2">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold">
        <ArrowLeft className="h-4 w-4" /> Volver al POS
      </button>

      <div>
        <h1 className="text-3xl font-black tracking-tight">Cierre de Caja Detallado</h1>
        <p className="text-gray-500 text-sm mt-1">Revisa el resumen de ventas, transacciones y confirma el arqueo de tu turno.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Register Form */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Información del Turno</h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                 <span className="text-sm text-gray-500 font-medium">Cajero</span>
                 <span className="text-sm font-bold text-gray-900 dark:text-white">{session.userName}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                 <span className="text-sm text-gray-500 font-medium">Apertura</span>
                 <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(session.openedAt).toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                 <span className="text-sm text-emerald-700 dark:text-emerald-400 font-bold">Fondo Apertura</span>
                 <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">{fmt(Number(session.openingAmount))}</span>
               </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Desglose de Ingresos</h3>
            <div className="space-y-3">
              {[
                { label: 'Efectivo', value: Number(session.cashSales || 0), color: 'text-emerald-600' },
                { label: 'Tarjeta', value: Number(session.cardSales || 0), color: 'text-blue-600' },
                { label: 'Transferencia', value: Number(session.transferSales || 0), color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-500 font-medium">{s.label}</span>
                  <span className={cn("text-lg font-black font-mono", s.color)}>{fmt(s.value)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-white/10 border-dashed pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Ventas Totales</span>
                  <span className="text-2xl font-black font-mono text-gray-900 dark:text-white">{fmt(Number(session.totalSales || 0))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141414] border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-6 space-y-5 shadow-sm">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Arqueo y Cierre</h3>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex justify-between items-center">
               <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Efectivo Teórico (Esperado)</span>
               <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">{fmt(expectedCash)}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Efectivo Real en Caja</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold">$</span>
                   </div>
                   <input
                     type="number"
                     value={closingAmount}
                     onChange={e => setClosingAmount(e.target.value)}
                     placeholder="0.00"
                     className="w-full border-2 border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-4 text-2xl font-black font-mono bg-gray-50 dark:bg-black/20 focus:outline-none focus:border-emerald-500 hover:border-gray-300 transition-colors"
                   />
                </div>
              </div>

              {closingAmount !== '' && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }} 
                   animate={{ opacity: 1, height: 'auto' }}
                   className={cn(
                      "rounded-xl p-4 border",
                      currentDiff < 0 ? "bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400" 
                      : currentDiff > 0 ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400"
                      : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400"
                   )}
                 >
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold uppercase tracking-widest">Diferencia</span>
                       <span className="text-xl font-black font-mono">
                         {currentDiff > 0 ? '+' : ''}{fmt(currentDiff)}
                       </span>
                    </div>
                    {currentDiff !== 0 && (
                      <p className="text-[10px] mt-1 opacity-80 font-bold uppercase tracking-wider text-right">
                        {currentDiff < 0 ? 'Faltante en caja' : 'Sobrante en caja'}
                      </p>
                    )}
                 </motion.div>
              )}

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Observaciones Mánager</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Justifique las diferencias presentadas, si las hay..."
                  className="w-full border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-black/20 focus:outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={closing || closingAmount === ''}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              {closing ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
              Procesar Cierre Final
            </button>
          </div>
        </div>

        {/* Right Column: Transactions List */}
        <div className="md:col-span-7">
           <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm h-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 flex justify-between items-center">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Listado de Transacciones</h3>
                 <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                   {session.posSales?.length || 0} Txns
                 </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                 {(!session.posSales || session.posSales.length === 0) ? (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12">
                     <Receipt className="h-10 w-10 mb-2 opacity-20" />
                     <p className="text-sm font-bold">Sin transacciones</p>
                     <p className="text-xs">No se han registrado ventas en este turno.</p>
                   </div>
                 ) : (
                   <table className="w-full text-left">
                     <thead className="sticky top-0 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-white/5 shadow-sm">
                       <tr className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                         <th className="px-5 py-3">Hora / Ticket</th>
                         <th className="px-5 py-3">Método</th>
                         <th className="px-5 py-3 text-right">Monto</th>
                         <th className="px-5 py-3 text-center">Est</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {session.posSales.map((sale: any) => (
                          <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400  mb-0.5 tracking-tighter">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">{sale.number}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={cn(
                                 "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                                 sale.paymentMethod === 'CASH' ? "bg-emerald-50 text-emerald-600" :
                                 sale.paymentMethod === 'CARD' ? "bg-blue-50 text-blue-600" :
                                 "bg-purple-50 text-purple-600"
                              )}>
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-sm font-black font-mono">{fmt(Number(sale.total))}</span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {sale.status === 'VOIDED' ? (
                                <span className="text-red-500 font-bold" title="Anulada">🔴</span>
                              ) : sale.status === 'RETURNED' || sale.status === 'PARTIALLY_RETURNED' ? (
                                <span className="text-orange-500 font-bold" title="Con Devolución">🔄</span>
                              ) : (
                                <span className="text-emerald-500 font-bold" title="Completada">✅</span>
                              )}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
