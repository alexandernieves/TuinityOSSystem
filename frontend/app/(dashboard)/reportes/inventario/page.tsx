'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Filter, Download, 
  RotateCcw, DollarSign,
  Loader2, BarChart3,
  Warehouse, ArrowLeft,
  ChevronDown, Search,
  CheckCircle2, XCircle,
  AlertTriangle, Receipt,
  Package, TrendingUp,
  MapPin
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export default function InventoryReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsInventory();
      setData(res);
    } catch (err) {
      toast.error('Error al cargar reporte de inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filtered = data.filter(item => 
    item.productName.toLowerCase().includes(query.toLowerCase()) || 
    item.sku.toLowerCase().includes(query.toLowerCase()) ||
    item.warehouseName.toLowerCase().includes(query.toLowerCase())
  );

  const stats = {
    totalUnits: data.reduce((acc, i) => acc + Number(i.available), 0),
    lowStock: data.filter(i => Number(i.available) < 10).length,
    activeWarehouses: new Set(data.map(i => i.warehouseName)).size
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
            <h1 className="text-2xl font-black">Reporte Global de Stock</h1>
            <p className="text-sm text-gray-500">Consulta existencias consolidadas por bodega y producto.</p>
          </div>
        </div>

        <button 
          onClick={() => {
             const headers = ['Bodega', 'SKU', 'Producto', 'Unidades'];
             const rows = data.map(d => [d.warehouseName, d.sku, d.productName, d.available]);
             const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
             const blob = new Blob([csv], { type: 'text/csv' });
             const url = window.URL.createObjectURL(blob);
             const a = document.createElement('a'); a.href = url; a.download = 'reporte-stock.csv'; a.click();
          }}
          className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
        >
          <Download className="h-4 w-4" />
          Exportar Lista CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
           <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600">
              <Package className="h-5 w-5" />
           </div>
           <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Total Unidades</p>
              <p className="text-xl font-black ">{fmtNum(stats.totalUnits)}</p>
           </div>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
           <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950/40 rounded-xl flex items-center justify-center text-orange-600">
              <AlertTriangle className="h-5 w-5" />
           </div>
           <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Low Stock Alarms</p>
              <p className="text-xl font-black  text-orange-600">{stats.lowStock}</p>
           </div>
        </div>
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
           <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600">
              <Warehouse className="h-5 w-5" />
           </div>
           <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Bodegas Activas</p>
              <p className="text-xl font-black  text-emerald-600">{stats.activeWarehouses}</p>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" placeholder="Filtrar por SKU, Producto o Bodega..."
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 outline-none transition-all"
                value={query} onChange={e => setQuery(e.target.value)}
              />
           </div>
           <button onClick={fetchInventory} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
              <RotateCcw className="h-4 w-4" /> Recargar
           </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
           <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-white/5">
                   <th className="px-6 py-4">Información del Producto</th>
                   <th className="px-6 py-4">Ubicación / Bodega</th>
                   <th className="px-6 py-4 text-center">Unidades Disponibles</th>
                   <th className="px-6 py-4 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-400 text-sm font-medium">Búsqueda sin resultados</td></tr>
                ) : filtered.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-800 dark:text-gray-100">{item.productName}</span>
                          <span className="text-[10px] text-gray-400  tracking-widest uppercase mt-0.5">{item.sku}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 flex items-center gap-2">
                       <MapPin className="h-3 w-3 text-emerald-500" />
                       {item.warehouseName}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={cn(
                          "text-lg font-black",
                          Number(item.available) <= 0 ? "text-red-500" : Number(item.available) < 10 ? "text-orange-500" : "text-gray-900 dark:text-gray-100"
                       )}>
                          {fmtNum(Number(item.available))}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                          Number(item.available) <= 0 ? "bg-red-50 text-red-600" : Number(item.available) < 10 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                       )}>
                          {Number(item.available) <= 0 ? 'Sin Stock' : Number(item.available) < 10 ? 'Bajo Stock' : 'Disponible'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
