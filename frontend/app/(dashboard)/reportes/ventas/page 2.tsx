'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Calendar, Filter, Download, 
  TrendingUp, TrendingDown, DollarSign,
  ArrowRight, Loader2, BarChart3,
  ShoppingCart, History, ExternalLink,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function SalesReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  
  // Filters
  const [channel, setChannel] = useState('ALL');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsSales(startDate, endDate, channel);
      setSales(res);
    } catch (err) {
      toast.error('Error al cargar reporte de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [channel]);

  const handleExportCSV = () => {
    if (sales.length === 0) return;
    
    const headers = ['Fecha', 'Número', 'Canal', 'Cliente', 'Usuario', 'Total'];
    const rows = sales.map(s => [
      new Date(s.date).toLocaleDateString(),
      s.number,
      s.type,
      s.client || 'Mostrador',
      s.user || 'Sistema',
      s.total
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-ventas-${startDate}-a-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total), 0);
  const b2bTotal = sales.filter(s => s.type === 'B2B').reduce((acc, s) => acc + Number(s.total), 0);
  const posTotal = sales.filter(s => s.type === 'POS').reduce((acc, s) => acc + Number(s.total), 0);

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
            <h1 className="text-2xl font-black">Reporte Detallado de Ventas</h1>
            <p className="text-sm text-gray-500">Analiza el rendimiento por canal, fecha y vendedor.</p>
          </div>
        </div>

        <button 
          onClick={handleExportCSV}
          disabled={sales.length === 0}
          className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Filter className="h-4 w-4 text-emerald-500" /> Parámetros
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Canal de Venta</label>
                <div className="grid grid-cols-3 gap-2">
                  {['ALL', 'B2B', 'POS'].map(c => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      className={cn(
                        "py-2 text-[10px] font-black rounded-lg border transition-all",
                        channel === c 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                          : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500"
                      )}
                    >
                      {c === 'ALL' ? 'Todos' : c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Fecha Inicio</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Fecha Fin</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <button 
                onClick={fetchSales}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Actualizar Reporte
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/20 p-5 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Total Ingresos</p>
              <p className="text-xl font-black">{fmt(totalRevenue)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-500/20 p-5 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-1">Ventas B2B</p>
              <p className="text-xl font-black">{fmt(b2bTotal)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/20 p-5 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 mb-1">Ventas POS</p>
              <p className="text-xl font-black">{fmt(posTotal)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-white/5">
                    <th className="px-6 py-4">Fecha/Hora</th>
                    <th className="px-6 py-4">Canal</th>
                    <th className="px-6 py-4">Documento</th>
                    <th className="px-6 py-4">Cliente / Tercero</th>
                    <th className="px-6 py-4">Vendedor</th>
                    <th className="px-6 py-4 text-right">Monto Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                        <p className="text-sm text-gray-400 mt-2 font-medium">Cargando datos históricos...</p>
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-400">No hay ventas en este rango</p>
                      </td>
                    </tr>
                  ) : sales.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold">{new Date(s.date).toLocaleDateString()}</span>
                           <span className="text-[10px] text-gray-400  tracking-tighter">{new Date(s.date).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-md border",
                          s.type === 'B2B' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {s.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs  font-bold text-gray-700 dark:text-gray-300">{s.number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium truncate max-w-[150px] inline-block">{s.client || 'Mostrador'}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold">
                               {s.user?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">{s.user || 'Sistema'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "text-sm font-black",
                          s.type === 'B2B' ? "text-blue-600" : "text-emerald-600"
                        )}>
                          {fmt(Number(s.total))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
