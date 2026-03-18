
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Search, 
  Calendar, 
  AlertTriangle, 
  ChevronRight, 
  Filter,
  ArrowUpDown,
  History,
  Info,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/services/api';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { cn } from '@/lib/utils/cn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';

export default function LotesPage() {
  const [lots, setLots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'expired' | 'near_expiry'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadLots();
  }, []);

  const loadLots = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLots();
      setLots(data || []);
    } catch (error) {
      console.error('Error loading lots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const productName = lot.product?.name || '';
      const sku = lot.product?.sku || '';
      const lotNumber = lot.lotNumber || '';
      
      const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lotNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (!lot.expirationDate) return filterStatus === 'all';

      const daysToExpiry = Math.ceil((new Date(lot.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      
      if (filterStatus === 'expired') return daysToExpiry <= 0;
      if (filterStatus === 'near_expiry') return daysToExpiry > 0 && daysToExpiry <= 90;
      
      return true;
    });
  }, [lots, searchQuery, filterStatus]);

  // Paginación
  const paginatedLots = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredLots.slice(startIndex, endIndex);
  }, [filteredLots, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredLots.length / rowsPerPage);

  const getExpiryStatus = (date?: string) => {
    if (!date) return { label: 'Sin Expiración', color: 'text-gray-400', bg: 'bg-gray-100' };
    
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    
    if (days <= 0) return { label: 'Expirado', color: 'text-red-600', bg: 'bg-red-100' };
    if (days <= 90) return { label: `Próximo (${days}d)`, color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: `Válido (${days}d)`, color: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Lotes</h1>
            <p className="text-sm text-gray-500">Control de trazabilidad y fechas de expiración (FEFO)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Lotes Activos</p>
                <h3 className="text-2xl font-bold mt-1">{lots.length}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <BoxIcon />
              </div>
           </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('near_expiry')}>
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Próximos a Vencer (90d)</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-600">
                    {lots.filter(l => l.expirationDate && Math.ceil((new Date(l.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 90 && Math.ceil((new Date(l.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) > 0).length}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('expired')}>
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lotes Expirados</p>
                <h3 className="text-2xl font-bold mt-1 text-red-600">
                    {lots.filter(l => l.expirationDate && new Date(l.expirationDate) <= new Date()).length}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Info className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por SKU, producto o número de lote..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setFilterStatus('all')}>
                <Filter className="h-4 w-4" />
                Filtros
            </Button>
            <Button variant="outline" onClick={loadLots}>
                Actualizar
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Producto / SKU</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Lote</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Expiración</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Disponible</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Bodega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <SkeletonTable rows={5} columns={6} />
                  </td>
                </tr>
              ) : filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron lotes que coincidan con los criterios.
                  </td>
                </tr>
              ) : (
                paginatedLots.map((lot, idx) => {
                  const expiry = getExpiryStatus(lot.expirationDate);
                  return (
                    <motion.tr 
                      key={lot.id} 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{lot.product?.name}</div>
                        <div className="text-xs text-blue-600 font-medium">{lot.product?.sku}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">
                        {lot.lotNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-900">{lot.availableQuantity}</span>
                        <span className="text-xs text-gray-400 ml-1">und</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase", expiry.bg, expiry.color)}>
                          {expiry.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lot.warehouse?.name}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredLots.length}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(size) => {
          setRowsPerPage(size)
          setCurrentPage(1)
        }}
        itemName="lotes"
      />
      
      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl text-blue-700 text-sm">
        <Info className="h-4 w-4" />
        <p>El sistema utiliza una política <strong>FEFO (First Expired, First Out)</strong> para priorizar el despacho de lotes con fecha de vencimiento más próxima.</p>
      </div>
    </div>
  );
}

function BoxIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
}
