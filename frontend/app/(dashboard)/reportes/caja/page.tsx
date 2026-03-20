'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Filter, Download, 
  RotateCcw, DollarSign,
  Loader2, BarChart3,
  LogOut, ArrowLeft,
  ChevronDown, Search,
  CheckCircle2, XCircle,
  AlertTriangle, Receipt
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function CashRegisterReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registers, setRegisters] = useState<any[]>([]);
  
  // Filters
  const [cashierId, setCashierId] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRegisters = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsCashRegisters({ startDate, endDate, cashierId });
      setRegisters(res);
    } catch (err) {
      toast.error('Error al cargar historial de cajas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisters();
  }, []);

  const totals = {
    opening: registers.reduce((acc, r) => acc + Number(r.openingAmount || 0), 0),
    closing: registers.reduce((acc, r) => acc + Number(r.closingAmount || 0), 0),
    diff: registers.reduce((acc, r) => acc + Number(r.difference || 0), 0),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-1">
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
            <h1 className="text-2xl font-black">Historial de Cierres de Caja</h1>
            <p className="text-sm text-gray-500">Consulta los arqueos, diferencias y totales por turno.</p>
          </div>
        </div>

        <button 
          onClick={() => toast.success('Función próximamente')}
          className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
        >
          <Download className="h-4 w-4" />
          Exportar PDF Report
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
           <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Aperturas</p>
           <p className="text-xl font-black">{fmt(totals.opening)}</p>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
           <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Cierres Declarados</p>
           <p className="text-xl font-black text-emerald-600">{fmt(totals.closing)}</p>
        </div>
        <div className={cn(
           "bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm",
           totals.diff < 0 ? "border-red-200" : totals.diff > 0 ? "border-emerald-200" : ""
        )}>
           <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Diferencia Neta (Sobrante/Faltante)</p>
           <p className={cn(
             "text-xl font-black",
             totals.diff < 0 ? "text-red-500" : totals.diff > 0 ? "text-emerald-500" : ""
           )}>{fmt(totals.diff)}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sticky Panel */}
        <div className="w-full lg:w-72 space-y-6">
           <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm sticky top-6">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                 <Filter className="h-4 w-4 text-emerald-500" /> Filtrar Registros
              </h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Fecha Desde</label>
                    <input 
                      type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Fecha Hasta</label>
                    <input 
                      type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                    />
                 </div>
                 <button 
                   onClick={fetchRegisters} disabled={loading}
                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 mt-4"
                 >
                   {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                   Consultar
                 </button>
              </div>
           </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 space-y-4">
           {registers.length === 0 && !loading ? (
             <div className="bg-white dark:bg-[#141414] border border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
                <Receipt className="h-12 w-12 text-gray-200 mb-2 opacity-20" />
                <p className="text-sm font-bold text-gray-400">No se encontraron cierres en el rango seleccionado</p>
             </div>
           ) : (
             <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-white/5">
                           <th className="px-6 py-4">Turno / Caja</th>
                           <th className="px-6 py-4">Cajero</th>
                           <th className="px-6 py-4">Estado</th>
                           <th className="px-6 py-4">Apertura</th>
                           <th className="px-6 py-4">Cierre (Esperado)</th>
                           <th className="px-6 py-4">Cierre (Declarado)</th>
                           <th className="px-6 py-4 text-right">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-20 text-center">
                              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                            </td>
                          </tr>
                        ) : registers.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="text-xs  font-black text-gray-400 uppercase tracking-tighter">#{r.id.substring(0,8)}</span>
                                  <span className="text-[10px] text-gray-500 mt-1">{new Date(r.openedAt).toLocaleString()}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                                     {r.user?.name?.substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold">{r.user?.name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500">
                                  {r.status}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-xs">{fmt(Number(r.openingAmount))}</td>
                            <td className="px-6 py-4 text-xs text-blue-500">{fmt(Number(r.expectedAmount || 0))}</td>
                            <td className="px-6 py-4 text-xs font-bold">{fmt(Number(r.closingAmount || 0))}</td>
                            <td className="px-6 py-4 text-right">
                               <div className={cn(
                                 "text-sm font-black",
                                 Number(r.difference) < 0 ? "text-red-500" : Number(r.difference) > 0 ? "text-emerald-500" : "text-gray-400"
                               )}>
                                  {fmt(Number(r.difference || 0))}
                                  {Number(r.difference) !== 0 && (
                                    <AlertTriangle className="h-3 w-3 inline ml-1 opacity-50" />
                                  )}
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
