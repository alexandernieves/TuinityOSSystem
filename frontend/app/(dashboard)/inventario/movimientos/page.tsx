
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw,
  Calendar,
  Filter,
  ArrowRightLeft,
  AlertOctagon,
  ShoppingBag
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/services/api';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils/cn';

export default function MovimientosPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventoryMovements();
      setMovements(data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case 'SALE':
      case 'SALE_OUT':
      case 'B2B_PACKING_OUT':
        return { label: 'Venta', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'PURCHASE_RECEIPT': 
        return { label: 'Compra', icon: ArrowDownLeft, color: 'text-emerald-600', bg: 'bg-emerald-100' };
      case 'INVENTORY_ADJUSTMENT_POSITIVE': 
      case 'ADJUSTMENT':
        return { label: 'Ajuste (+)', icon: RefreshCcw, color: 'text-emerald-700', bg: 'bg-emerald-50' };
      case 'INVENTORY_ADJUSTMENT_NEGATIVE': 
        return { label: 'Ajuste (-)', icon: RefreshCcw, color: 'text-red-700', bg: 'bg-red-50' };
      case 'TRANSFER_IN':
        return { label: 'Transf. (Ent)', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'TRANSFER_OUT':
        return { label: 'Transf. (Sal)', icon: ArrowRightLeft, color: 'text-indigo-600', bg: 'bg-indigo-100' };
      case 'DAMAGE':
        return { label: 'Avería', icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-100' };
      case 'POS_SALE':
        return { label: 'POS Venta', icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-100' };
      default:
        return { label: type.split('_').join(' '), icon: History, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const filteredMovements = movements.filter(m => {
      const product = m.product?.name || '';
      const lot = m.productLot?.lotNumber || '';
      const notes = m.notes || '';
      return product.toLowerCase().includes(searchQuery.toLowerCase()) ||
             lot.toLowerCase().includes(searchQuery.toLowerCase()) ||
             notes.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h1>
            <p className="text-sm text-gray-500">Kardex detallado de cada producto y lote</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por producto, lote o referencia..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Fecha
            </Button>
            <Button variant="outline" onClick={loadMovements}>
                Actualizar
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fecha / Hora</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Cant.</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Costo Unit.</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Valor Mov.</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo Cant.</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Saldo Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <SkeletonTable rows={10} columns={6} />
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((move, idx) => {
                  const info = getMovementTypeInfo(move.movementType);
                  return (
                    <motion.tr 
                      key={move.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(move.occurredAt).toLocaleString('es-PA', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap", info.bg, info.color)}>
                          <info.icon className="h-3 w-3" />
                          {info.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{move.product?.name}</div>
                        <div className="text-[10px] text-gray-400">{move.product?.sku}</div>
                      </td>
                      <td className={cn("px-6 py-4 text-right font-bold", 
                        ['SALE', 'TRANSFER_OUT', 'DAMAGE', 'INVENTORY_ADJUSTMENT_NEGATIVE'].includes(move.movementType) ? 'text-red-500' : 'text-emerald-600'
                      )}>
                        {['SALE', 'TRANSFER_OUT', 'DAMAGE', 'INVENTORY_ADJUSTMENT_NEGATIVE'].includes(move.movementType) ? '-' : '+'}{move.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-gray-600">
                        {formatCurrency(Number(move.unitCost || 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-semibold text-gray-700">
                        {formatCurrency(Number(move.totalCost || 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium text-gray-900">
                        {move.balanceQuantity || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-bold text-gray-900">
                        {formatCurrency(Number(move.balanceValue || 0))}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={move.notes}>
                        {move.notes || move.referenceId || '-'}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredMovements.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMovements.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(val) => {
            setRowsPerPage(val);
            setCurrentPage(1);
          }}
          itemName="movimientos"
        />
      )}
    </div>
  );
}
