'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  ArrowLeft,
  Search,
  Boxes,
  AlertTriangle,
  PackagePlus,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_STORE_INVENTORY, MOCK_PRODUCT_CATEGORIES, subscribeStoreInventory, getStoreInventoryData } from '@/lib/mock-data/pos';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InventarioPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  useStore(subscribeStoreInventory, getStoreInventoryData);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isOpen, setIsOpen] = useState(false);

  const lowStockItems = useMemo(() => {
    return MOCK_STORE_INVENTORY.filter((i) => i.stockStatus === 'bajo' || i.stockStatus === 'agotado');
  }, []);

  const filteredItems = useMemo(() => {
    return MOCK_STORE_INVENTORY.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.productName.toLowerCase().includes(searchLower) ||
        item.productCode.toLowerCase().includes(searchLower);

      const matchesCategory = categoryFilter === 'all' || item.productGroup === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const handleRequestReplenishment = () => {
    toast.success('Solicitud de reposicion enviada', { id: 'replenishment-request', description: 'El equipo de bodega sera notificado.' });
    setIsOpen(false);
  };

  if (!checkPermission('canAccessPOS')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para acceder a esta seccion.</p>
      </div>
    );
  }

  const uniqueGroups = [...new Set(MOCK_STORE_INVENTORY.map((i) => i.productGroup))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ventas/pos')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Inventario de Tienda</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Stock disponible para venta B2C</p>
          </div>
        </div>
        <Button variant="bordered" size="sm" onPress={() => setIsOpen(true)}>
          <PackagePlus className="h-3.5 w-3.5" /> Solicitar Reposicion
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {lowStockItems.length} producto{lowStockItems.length !== 1 ? 's' : ''} con stock bajo o agotado
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {lowStockItems.filter((i) => i.stockStatus === 'agotado').length} agotado(s), {lowStockItems.filter((i) => i.stockStatus === 'bajo').length} bajo minimo
            </p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto o codigo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">Todas las categorias</option>
          {uniqueGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredItems.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Categoria</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Minimo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Precio B2C</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Ult. Reposicion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {filteredItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white max-w-[220px] truncate">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-[#888888]">{item.productCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.productGroup}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex min-w-[32px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold',
                        item.stockStatus === 'ok' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
                        item.stockStatus === 'bajo' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                        item.stockStatus === 'agotado' && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
                      )}>
                        {item.stockUnits}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{item.minimumStock}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-block h-2.5 w-2.5 rounded-full',
                        item.stockStatus === 'ok' && 'bg-emerald-500',
                        item.stockStatus === 'bajo' && 'bg-amber-500',
                        item.stockStatus === 'agotado' && 'bg-red-500',
                      )} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.priceB2C)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {item.lastReplenishmentDate ? formatDate(item.lastReplenishmentDate) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a]">
            <p className="text-xs text-gray-500 dark:text-[#888888]">
              {filteredItems.length} producto{filteredItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <Package className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-[#888888]">No se encontraron productos</p>
        </div>
      )}

      {/* Replenishment Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <PackagePlus className="h-5 w-5 text-blue-600" />
          Solicitar Reposicion
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-[#888888] mb-4">
              Selecciona los productos que necesitan reposicion:
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {lowStockItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">
                      Stock: {item.stockUnits} / Min: {item.minimumStock}
                    </p>
                  </div>
                  <span className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                    item.stockStatus === 'agotado' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  )}>
                    {item.stockStatus === 'agotado' ? 'Agotado' : 'Bajo'}
                  </span>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-[#666] text-center py-4">
                  Todos los productos tienen stock suficiente.
                </p>
              )}
            </div>
          </CustomModalBody>
          <CustomModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
            <Button color="primary" onPress={handleRequestReplenishment} isDisabled={lowStockItems.length === 0}>
              Enviar Solicitud
            </Button>
          </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
