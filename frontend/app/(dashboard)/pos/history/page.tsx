'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Calendar, User, CreditCard, 
  Receipt, Filter, Loader2, ArrowLeft,
  ChevronRight, CheckCircle2, XCircle, 
  RotateCcw, Eye, ClipboardList
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const STATUS_LABELS: Record<string, { label: string, color: string }> = {
  'COMPLETED': { label: 'Completada', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'VOIDED': { label: 'Anulada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  'RETURNED': { label: 'Devuelta', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  'PARTIALLY_RETURNED': { label: 'Dev. Parcial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    ticketNumber: '',
    cashierId: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.posSearchSales({ ...filters, page, limit });
      setSales(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      toast.error('Error al cargar historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [page, limit]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSales();
  };

  return (
    <div className="flex flex-col h-full gap-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Historial de Ventas</h1>
            <p className="text-sm text-gray-500">Consulta y gestiona las transacciones de tienda</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm"
      >
        <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1"># Ticket</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="POS-2024..."
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-emerald-500 outline-none transition-all"
                value={filters.ticketNumber}
                onChange={e => setFilters({...filters, ticketNumber: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Método de Pago</label>
            <select 
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none transition-all appearance-none"
              value={filters.paymentMethod}
              onChange={e => setFilters({...filters, paymentMethod: e.target.value})}
            >
              <option value="">Todos los métodos</option>
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Desde</label>
            <input 
              type="date"
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hasta</label>
            <input 
              type="date"
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtrar
            </button>
          </div>
        </form>
      </motion.div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5">
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Fecha/Hora</th>
                <th className="px-6 py-4">Cajero</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cargando transacciones...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No se encontraron ventas</p>
                    <p className="text-xs text-gray-500 mt-1">Intenta ajustando los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-emerald-600">{sale.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{new Date(sale.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-xs">{sale.createdByUser?.name || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-medium">{sale.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black font-mono">{fmt(Number(sale.total))}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-full",
                        STATUS_LABELS[sale.status]?.color || 'bg-gray-100 text-gray-600'
                      )}>
                        {STATUS_LABELS[sale.status]?.label || sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/pos/history/${sale.id}`)}
                          className="h-8 w-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center text-gray-500 hover:text-emerald-500 hover:border-emerald-500 transition-all shadow-sm"
                          title="Ver Detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {sale.status !== 'VOIDED' && (
                          <button 
                            className="h-8 w-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500 transition-all shadow-sm"
                            title="Devolución"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Wrapper */}
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Pagination 
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            totalItems={total}
            rowsPerPage={limit}
            onPageChange={setPage}
            onRowsPerPageChange={setLimit}
            itemName="ventas"
          />
        </div>
      </div>
    </div>
  );
}
