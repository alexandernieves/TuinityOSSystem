import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Select, SelectItem } from '@heroui/react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Layers,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import type { PurchaseOrder } from '@/lib/types/purchase-order';

// Formateadores locales
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function HistorialCostosPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewCosts = checkPermission('canViewCosts');

  const [products, setProducts] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, oData] = await Promise.all([
        api.getProducts(),
        api.getPurchaseOrders(), // Get all orders to derive history
      ]);
      setProducts(pData);
      setAllOrders(oData);

      if (pData.length > 0) {
        setSelectedProductId(pData[0].id);
      }
    } catch (error: any) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [selectedProductId, products]);

  // Derived cost history from real orders
  const costHistory = useMemo(() => {
    if (!selectedProductId) return [];

    // Filter orders where this product was received
    const history = allOrders
      .filter(order => order.status === 'completada' || order.status === 'en_recepcion')
      .map(order => {
        const line = order.lines.find(l => l.productId === selectedProductId);
        if (!line || !line.quantityReceived) return null;

        return {
          id: `${order.id}-${line.productId}`,
          date: order.actualArrivalDate || order.createdAt,
          purchaseOrderId: order.id,
          purchaseOrderNumber: order.orderNumber,
          supplierName: order.supplierName,
          quantity: line.quantityReceived,
          costFOB: line.unitCostFOB,
          expensePercentage: order.expensePercentage || 0,
          costCIF: line.unitCostCIF || (line.unitCostFOB * (1 + (order.expensePercentage || 0) / 100)),
          costWeightedAvg: selectedProduct?.costAvgWeighted || 0 // This is a simplification
        };
      })
      .filter(Boolean) as any[];

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedProductId, allOrders, selectedProduct]);

  // Calculate stats
  const currentCost = selectedProduct?.costCIF || 0;
  const avgCost = costHistory.length > 0
    ? costHistory.reduce((sum, entry) => sum + entry.costCIF, 0) / costHistory.length
    : 0;
  const minCost = costHistory.length > 0
    ? Math.min(...costHistory.map((e) => e.costCIF))
    : 0;
  const maxCost = costHistory.length > 0
    ? Math.max(...costHistory.map((e) => e.costCIF))
    : 0;

  // If user doesn't have permission, show access denied
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-600" />
        <p className="text-gray-500">Cargando historial de costos...</p>
      </div>
    );
  }

  if (!canViewCosts) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <DollarSign className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-lg font-medium text-gray-900">Acceso Restringido</h2>
        <p className="mb-4 text-sm text-gray-500">
          No tienes permisos para ver el historial de costos.
        </p>
        <button
          onClick={() => router.push('/compras')}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Volver a Compras
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/compras')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Historial de Costos</h1>
            <p className="text-sm text-gray-500">Evolución de costos FOB, CIF y promedio ponderado</p>
          </div>
        </div>
      </div>

      {/* Product Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Producto</label>
              <Select
                placeholder="Buscar producto..."
                selectedKeys={selectedProductId ? [selectedProductId] : []}
                onChange={(e) => setSelectedProductId(e.target.value)}
                variant="bordered"
                aria-label="Seleccionar Producto"
                classNames={{ trigger: 'bg-white dark:bg-[#1a1a1a]' }}
              >
                {products.map((product: any) => (
                  <SelectItem key={product.id} textValue={product.description}>
                    <div className="flex flex-col">
                      <span className="text-sm">{product.description}</span>
                      <span className="text-xs text-gray-500">{product.reference}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {selectedProduct && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Existencia:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedProduct.stock.existence}</span>
              </div>
              <div>
                <span className="text-gray-500">Último Costo CIF:</span>
                <span className="ml-2 font-mono font-medium text-gray-900">
                  {formatCurrency(selectedProduct.costCIF)}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Product Info Header */}
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <Package className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium text-gray-900">{selectedProduct.description}</h2>
              <p className="text-sm text-gray-500">
                {selectedProduct.reference} | {selectedProduct.brand} | {selectedProduct.group}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cost Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Costo Actual CIF</span>
          </div>
          <p className="font-mono text-xl font-bold text-gray-900">{formatCurrency(currentCost)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Promedio CIF</span>
          </div>
          <p className="font-mono text-xl font-bold text-gray-900">{formatCurrency(avgCost)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-emerald-500">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Mínimo CIF</span>
          </div>
          <p className="font-mono text-xl font-bold text-emerald-600">{formatCurrency(minCost)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-red-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Máximo CIF</span>
          </div>
          <p className="font-mono text-xl font-bold text-red-600">{formatCurrency(maxCost)}</p>
        </div>
      </motion.div>

      {/* Cost Evolution Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Evolución de Costos</h2>
          </div>
        </div>
        <div className="flex h-64 items-center justify-center p-4">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">Gráfico de evolución de costos</p>
            <p className="text-xs text-gray-400">Integración con Tremor Charts próximamente</p>
          </div>
        </div>
      </motion.div>

      {/* Cost History Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Historial de Entradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  No. Orden
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Costo FOB
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  %Gastos
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Costo CIF
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Costo Prom.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costHistory.map((entry, index) => {
                const prevEntry = costHistory[index + 1];
                const costChange = prevEntry
                  ? ((entry.costCIF - prevEntry.costCIF) / prevEntry.costCIF) * 100
                  : 0;

                return (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{formatDate(entry.date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/compras/${entry.purchaseOrderId}`)}
                        className="font-mono text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        {entry.purchaseOrderNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{entry.supplierName}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">{entry.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm text-gray-900">
                        {formatCurrency(entry.costFOB)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-600">{entry.expensePercentage}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {formatCurrency(entry.costCIF)}
                        </span>
                        {costChange !== 0 && (
                          <span
                            className={cn(
                              'flex items-center text-xs',
                              costChange > 0 ? 'text-red-500' : 'text-emerald-500'
                            )}
                          >
                            {costChange > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(costChange).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {formatCurrency(entry.costWeightedAvg)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Empty State */}
      {costHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16">
          <DollarSign className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-1 text-lg font-medium text-gray-900">Sin historial de costos</h3>
          <p className="text-sm text-gray-500">Este producto no tiene entradas registradas</p>
        </div>
      )}
    </div>
  );
}
