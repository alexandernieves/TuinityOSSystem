import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  ArrowLeft,
  PackageCheck,
  Edit,
  Printer,
  MoreVertical,
  Building2,
  Package,
  Calendar,
  Hash,
  FileText,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calculator,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import type { PurchaseOrder, PurchaseOrderStatus, ExpenseBreakdown } from '@/lib/types/purchase-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { printPurchaseOrder } from '@/lib/utils/print-utils';
import { prorateCosts, formatCostCurrency } from '@/lib/utils/cost-proration';
import type { ProrationResult } from '@/lib/utils/cost-proration';

// Formateadores locales
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Status badge colors
const STATUS_CONFIG: Record<PurchaseOrderStatus, { bg: string; text: string; dot: string; label: string }> = {
  pendiente: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Pendiente' },
  en_transito: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', label: 'En Tránsito' },
  en_recepcion: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'En Recepción' },
  completada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Completada' },
  cancelada: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelada' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewCosts = checkPermission('canViewCosts');
  const canProrateCosts = checkPermission('canProrateCosts');

  const orderId = params.id as string;
  const isReceptionMode = searchParams.get('action') === 'receive';

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [receptionQuantities, setReceptionQuantities] = useState<Record<string, number>>({});
  const [expensePercentage, setExpensePercentage] = useState('15');
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  // F11: Cost Proration state
  const [prorationOpen, setProrationOpen] = useState(false);
  const [prorationExpenses, setProrationExpenses] = useState({
    freight: '',
    insurance: '',
    customs: '',
    handling: '',
    other: '',
  });
  const [prorationResult, setProrationResult] = useState<ProrationResult | null>(null);
  const [isProrationApplied, setIsProrationApplied] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Build previous costs map for cost increase comparison
  const [previousCostsMap, setPreviousCostsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (isReceptionMode && order) {
      setIsReceiveOpen(true);
    }
  }, [isReceptionMode, order]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await api.getPurchaseOrderById(orderId);
      setOrder(data);

      // Initialize reception quantities
      const initialQtys: Record<string, number> = {};
      data.lines.forEach((line: any) => {
        initialQtys[line.productId] = line.quantity - (line.quantityReceived || 0);
      });
      setReceptionQuantities(initialQtys);

      // Try to get previous costs from products
      const products = await api.getProducts();
      const costMap: Record<string, number> = {};
      products.forEach((p: any) => {
        if (p.costCIF) costMap[p.id] = p.costCIF;
        else if (p.costAvgWeighted) costMap[p.id] = p.costAvgWeighted;
      });
      setPreviousCostsMap(costMap);

    } catch (error: any) {
      toast.error('Error al cargar la orden', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReceptionQtyChange = (productId: string, qty: number) => {
    setReceptionQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const handleConfirmReception = async () => {
    if (!order) return;

    try {
      // Si el prorrateo fue aplicado, usar los costos CIF calculados
      // Si no, usar un cálculo simplificado basado en el porcentaje de gastos
      const expPerc = parseFloat(expensePercentage) || 0;

      const linesToReceive = order.lines.map(line => {
        const qtyToRec = receptionQuantities[line.productId] || 0;
        let unitCIF = line.unitCostCIF;

        if (prorationResult && isProrationApplied) {
          const proratedLine = prorationResult.lines.find(l => l.productId === line.productId);
          if (proratedLine) unitCIF = proratedLine.unitCostCIF;
        } else if (expPerc > 0) {
          unitCIF = line.unitCostFOB * (1 + expPerc / 100);
        }

        return {
          productId: line.productId,
          quantityReceived: qtyToRec,
          unitCostCIF: unitCIF
        };
      }).filter(l => l.quantityReceived > 0);

      if (linesToReceive.length === 0) {
        toast.error('No hay cantidades para recibir');
        return;
      }

      await api.receiveMerchandise(order.id, { lines: linesToReceive });

      toast.success('Mercancía recibida', {
        description: `La orden ${order.orderNumber} ha sido procesada exitosamente.`,
      });
      setIsReceiveOpen(false);
      loadOrder(); // Refresh data
    } catch (error: any) {
      toast.error('Error en recepción', { description: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-600" />
        <p className="text-gray-500">Cargando detalles de la orden...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-lg font-medium text-gray-900">Orden no encontrada</h2>
        <p className="mb-4 text-sm text-gray-500">La orden {orderId} no existe o fue eliminada.</p>
        <Button color="primary" onPress={() => router.push('/compras')} className="bg-brand-600">
          Volver a Compras
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const canReceive = order.status === 'en_transito' || order.status === 'en_recepcion';
  const canEdit = order.status === 'pendiente';

  // Calculate totals
  const totalQuantityOrdered = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalQuantityReceived = order.lines.reduce((sum, line) => sum + line.quantityReceived, 0);
  const totalPending = totalQuantityOrdered - totalQuantityReceived;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/compras')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold text-gray-900">{order.orderNumber}</h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  statusConfig.bg,
                  statusConfig.text
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                {statusConfig.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Creada el {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canReceive && (
            <Button
              color="success"
              onPress={() => setIsReceiveOpen(true)}
              startContent={<PackageCheck className="h-4 w-4" />}
            >
              Recibir Mercancía
            </Button>
          )}
          {canEdit && (
            <Button
              variant="bordered"
              startContent={<Edit className="h-4 w-4" />}
              onPress={() => toast.info('Editar orden', { description: 'Funcionalidad próximamente.' })}
            >
              Editar
            </Button>
          )}
          <Button
            variant="bordered"
            startContent={<Printer className="h-4 w-4" />}
            onPress={() => {
              printPurchaseOrder(
                {
                  orderNumber: order.orderNumber,
                  supplierName: order.supplierName,
                  supplierInvoice: order.supplierInvoice,
                  bodegaName: order.bodegaName,
                  createdAt: order.createdAt,
                  expectedArrivalDate: order.expectedArrivalDate,
                  status: statusConfig.label,
                  lines: order.lines.map((line) => ({
                    productReference: line.productReference,
                    productDescription: line.productDescription,
                    quantity: line.quantity,
                    quantityReceived: line.quantityReceived,
                    unitCostFOB: line.unitCostFOB,
                    totalFOB: line.totalFOB,
                  })),
                  totalFOB: order.totalFOB,
                  expensePercentage: order.expensePercentage,
                  totalCIF: order.totalCIF,
                  notes: order.notes,
                },
                canViewCosts
              );
              toast.success('Documento generado', {
                description: `Orden ${order.orderNumber} lista para imprimir.`,
              });
            }}
          >
            Imprimir
          </Button>
        </div>
      </motion.div>

      {/* Order Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Proveedor</span>
          </div>
          <p className="font-medium text-gray-900">{order.supplierName}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">No. Factura</span>
          </div>
          <p className="font-mono font-medium text-gray-900">{order.supplierInvoice || '-'}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Bodega Destino</span>
          </div>
          <p className="font-medium text-gray-900">{order.bodegaName}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Fecha Llegada</span>
          </div>
          <p className="font-medium text-gray-900">
            {order.actualArrivalDate
              ? formatDate(order.actualArrivalDate)
              : order.expectedArrivalDate
                ? `Est. ${formatDate(order.expectedArrivalDate)}`
                : '-'}
          </p>
        </div>
      </motion.div>

      {/* Lines Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Productos ({order.lines.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Referencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ordenado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Recibido
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pendiente
                </th>
                {canViewCosts && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Costo FOB
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total FOB
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.lines.map((line, index) => {
                const pending = line.quantity - line.quantityReceived;
                return (
                  <tr key={line.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600">{line.productReference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{line.productDescription}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">{line.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          line.quantityReceived === line.quantity
                            ? 'text-emerald-600'
                            : line.quantityReceived > 0
                              ? 'text-amber-600'
                              : 'text-gray-400'
                        )}
                      >
                        {line.quantityReceived}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          pending > 0 ? 'text-red-600' : 'text-gray-400'
                        )}
                      >
                        {pending}
                      </span>
                    </td>
                    {canViewCosts && (
                      <>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-gray-900">
                            {formatCurrency(line.unitCostFOB)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {formatCurrency(line.totalFOB)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Totales:
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-gray-900">{totalQuantityOrdered}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-emerald-600">{totalQuantityReceived}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('text-sm font-bold', totalPending > 0 ? 'text-red-600' : 'text-gray-400')}>
                    {totalPending}
                  </span>
                </td>
                {canViewCosts && (
                  <>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {formatCurrency(order.totalFOB)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Costs Section - Only for authorized roles */}
      {canViewCosts && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Costos e Internación</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-gray-500">Sub-Total FOB</p>
                <p className="font-mono text-xl font-bold text-gray-900">{formatCurrency(order.totalFOB)}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-gray-500">% Gastos Internación</p>
                <p className="font-mono text-xl font-bold text-gray-900">
                  {order.expensePercentage ? `${order.expensePercentage}%` : '-'}
                </p>
                {order.totalExpenses && (
                  <p className="mt-1 text-xs text-gray-500">
                    = {formatCurrency(order.totalExpenses)}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-emerald-700">Total CIF</p>
                <p className="font-mono text-xl font-bold text-emerald-700">
                  {order.totalCIF ? formatCurrency(order.totalCIF) : '-'}
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Costo real aterrizado
                </p>
              </div>
            </div>

            {/* CIF Formula explanation */}
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="text-xs text-sky-800">
                <strong>Fórmula CIF:</strong> Total FOB × (1 + %Gastos/100) = Total CIF
                {order.totalFOB && order.expensePercentage && (
                  <span className="ml-2 font-mono">
                    {formatCurrency(order.totalFOB)} × {(1 + order.expensePercentage / 100).toFixed(2)} ={' '}
                    {formatCurrency(order.totalFOB * (1 + order.expensePercentage / 100))}
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* F11: Prorrateo de Costos Section */}
      {canProrateCosts &&
        (order.status === 'en_recepcion' || order.status === 'completada') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
          >
            {/* Collapsible Header */}
            <button
              onClick={() => setProrationOpen(!prorationOpen)}
              className="flex w-full items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-[#222]"
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Prorrateo de Costos</h2>
                {(order.costProrated || isProrationApplied) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Prorrateo Aplicado
                  </span>
                )}
                {prorationResult?.hasAlerts && !order.costProrated && !isProrationApplied && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Alertas de costo
                  </span>
                )}
              </div>
              {prorationOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {/* Collapsible Content */}
            {prorationOpen && (
              <div className="p-4 space-y-5">
                {/* Already prorated: read-only view */}
                {(order.costProrated || isProrationApplied) ? (
                  <>
                    {/* Read-only results */}
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                      <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          El prorrateo fue aplicado
                          {order.proratedAt && ` el ${formatDate(order.proratedAt)}`}
                          {order.proratedBy && ` por ${order.proratedBy}`}
                          {isProrationApplied && !order.proratedAt && ' exitosamente'}
                          .
                        </span>
                      </div>
                    </div>

                    {prorationResult && (
                      <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3">
                            <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total FOB</p>
                            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                              {formatCostCurrency(prorationResult.totalFOB)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3">
                            <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total Gastos</p>
                            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                              {formatCostCurrency(prorationResult.totalExpenses)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                            <p className="mb-1 text-xs font-medium uppercase text-emerald-700 dark:text-emerald-400">Total CIF</p>
                            <p className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCostCurrency(prorationResult.totalCIF)}
                            </p>
                          </div>
                        </div>

                        {/* Results table (read-only) */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Producto</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Qty</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">FOB Total</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Gastos Asignados</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">CIF Total</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">CIF Unitario</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                              {prorationResult.lines.map((line) => (
                                <tr key={line.lineId} className={cn(
                                  'transition-colors',
                                  line.hasAlert
                                    ? 'bg-amber-50/50 dark:bg-amber-900/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                )}>
                                  <td className="px-3 py-2">
                                    <p className="text-sm text-gray-900 dark:text-white">{line.productDescription}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{line.productReference}</p>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{line.quantity}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCostCurrency(line.totalFOB)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCostCurrency(line.expenseShare)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCostCurrency(line.totalCIF)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCostCurrency(line.unitCostCIF)}</span>
                                      {line.hasAlert && (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Alerts for read-only view */}
                        {prorationResult.hasAlerts && (
                          <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                              <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                  Alerta de incremento de costo ({'>'}10%)
                                </p>
                                <ul className="mt-1.5 space-y-1">
                                  {prorationResult.alerts.map((alert) => (
                                    <li key={alert.productReference} className="text-xs text-amber-700 dark:text-amber-400">
                                      <span className="font-medium">{alert.productReference}</span> — {alert.productDescription}:
                                      {' '}{formatCostCurrency(alert.previousCost)} {'→'} {formatCostCurrency(alert.newCost)}
                                      {' '}(+{alert.increasePercent.toFixed(1)}%)
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Expense Inputs */}
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Gastos de internación</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {([
                          { key: 'freight' as const, label: 'Flete' },
                          { key: 'insurance' as const, label: 'Seguro' },
                          { key: 'customs' as const, label: 'Aduana' },
                          { key: 'handling' as const, label: 'Manejo' },
                          { key: 'other' as const, label: 'Otros' },
                        ]).map(({ key, label }) => (
                          <div key={key}>
                            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                <DollarSign className="h-3.5 w-3.5" />
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={prorationExpenses[key]}
                                onChange={(e) =>
                                  setProrationExpenses((prev) => ({ ...prev, [key]: e.target.value }))
                                }
                                className={cn(
                                  'w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-2 pl-8 pr-3 text-right font-mono text-sm',
                                  'text-gray-900 dark:text-white placeholder:text-gray-400',
                                  'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
                                  'transition-colors'
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Expense total */}
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Gastos:</span>
                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          {formatCostCurrency(
                            (parseFloat(prorationExpenses.freight) || 0) +
                            (parseFloat(prorationExpenses.insurance) || 0) +
                            (parseFloat(prorationExpenses.customs) || 0) +
                            (parseFloat(prorationExpenses.handling) || 0) +
                            (parseFloat(prorationExpenses.other) || 0)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Calculate Button */}
                    <div className="flex justify-end">
                      <Button
                        color="primary"
                        className="bg-brand-600"
                        startContent={<Calculator className="h-4 w-4" />}
                        onPress={() => {
                          const expenses: ExpenseBreakdown = {
                            freight: parseFloat(prorationExpenses.freight) || 0,
                            insurance: parseFloat(prorationExpenses.insurance) || 0,
                            customs: parseFloat(prorationExpenses.customs) || 0,
                            handling: parseFloat(prorationExpenses.handling) || 0,
                            other: parseFloat(prorationExpenses.other) || 0,
                            total:
                              (parseFloat(prorationExpenses.freight) || 0) +
                              (parseFloat(prorationExpenses.insurance) || 0) +
                              (parseFloat(prorationExpenses.customs) || 0) +
                              (parseFloat(prorationExpenses.handling) || 0) +
                              (parseFloat(prorationExpenses.other) || 0),
                          };

                          if (expenses.total <= 0) {
                            toast.error('Ingrese al menos un gasto', {
                              description: 'Debe ingresar valores mayores a 0 en los gastos de internación.',
                            });
                            return;
                          }

                          const result = prorateCosts(order.lines, expenses, previousCostsMap);
                          setProrationResult(result);

                          if (result.hasAlerts) {
                            toast.warning('Alerta de costos', {
                              description: `${result.alerts.length} producto(s) con incremento mayor al 10%.`,
                            });
                          } else {
                            toast.success('Prorrateo calculado', {
                              description: 'Revise los resultados antes de aplicar.',
                            });
                          }
                        }}
                      >
                        Calcular Prorrateo
                      </Button>
                    </div>

                    {/* Results Table (after calculation) */}
                    {prorationResult && (
                      <>
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3">
                            <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total FOB</p>
                            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                              {formatCostCurrency(prorationResult.totalFOB)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3">
                            <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Total Gastos</p>
                            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                              {formatCostCurrency(prorationResult.totalExpenses)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                            <p className="mb-1 text-xs font-medium uppercase text-emerald-700 dark:text-emerald-400">Total CIF</p>
                            <p className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                              {formatCostCurrency(prorationResult.totalCIF)}
                            </p>
                          </div>
                        </div>

                        {/* Alert Banner */}
                        {prorationResult.hasAlerts && (
                          <div className={cn(
                            'rounded-lg border p-4',
                            prorationResult.alerts.some((a) => a.increasePercent > 25)
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                              : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                          )}>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={cn(
                                'mt-0.5 h-4 w-4 shrink-0',
                                prorationResult.alerts.some((a) => a.increasePercent > 25)
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              )} />
                              <div>
                                <p className={cn(
                                  'text-sm font-medium',
                                  prorationResult.alerts.some((a) => a.increasePercent > 25)
                                    ? 'text-red-800 dark:text-red-300'
                                    : 'text-amber-800 dark:text-amber-300'
                                )}>
                                  Alerta: {prorationResult.alerts.length} producto(s) con incremento de costo {'>'}10%
                                </p>
                                <ul className="mt-1.5 space-y-1">
                                  {prorationResult.alerts.map((alert) => (
                                    <li key={alert.productReference} className={cn(
                                      'text-xs',
                                      prorationResult.alerts.some((a) => a.increasePercent > 25)
                                        ? 'text-red-700 dark:text-red-400'
                                        : 'text-amber-700 dark:text-amber-400'
                                    )}>
                                      <span className="font-medium">{alert.productReference}</span> — {alert.productDescription}:
                                      {' '}{formatCostCurrency(alert.previousCost)} {'→'} {formatCostCurrency(alert.newCost)}
                                      {' '}
                                      <span className="font-semibold">(+{alert.increasePercent.toFixed(1)}%)</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Results table */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Producto</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Qty</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">FOB Total</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Gastos Asignados</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">CIF Total</th>
                                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">CIF Unitario</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                              {prorationResult.lines.map((line) => (
                                <tr key={line.lineId} className={cn(
                                  'transition-colors',
                                  line.hasAlert
                                    ? 'bg-amber-50/50 dark:bg-amber-900/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                )}>
                                  <td className="px-3 py-2">
                                    <p className="text-sm text-gray-900 dark:text-white">{line.productDescription}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{line.productReference}</p>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{line.quantity}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCostCurrency(line.totalFOB)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="font-mono text-sm text-gray-900 dark:text-white">{formatCostCurrency(line.expenseShare)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCostCurrency(line.totalCIF)}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{formatCostCurrency(line.unitCostCIF)}</span>
                                      {line.hasAlert && (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                          +{line.costIncrease?.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                    {line.previousCostCIF && (
                                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                        ant: {formatCostCurrency(line.previousCostCIF)}
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                                <td className="px-3 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300" colSpan={2}>
                                  Totales:
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{formatCostCurrency(prorationResult.totalFOB)}</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{formatCostCurrency(prorationResult.totalExpenses)}</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCostCurrency(prorationResult.totalCIF)}</span>
                                </td>
                                <td className="px-3 py-2"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Apply Button */}
                        <div className="flex justify-end">
                          <Button
                            color="success"
                            startContent={<CheckCircle className="h-4 w-4" />}
                            onPress={() => setIsConfirmOpen(true)}
                          >
                            Aplicar Prorrateo
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

      {/* Proration Confirmation Modal */}
      <CustomModal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsConfirmOpen(false)}>
          <Calculator className="h-5 w-5 text-brand-600" />
          Confirmar Prorrateo
        </CustomModalHeader>
        <CustomModalBody className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Está a punto de aplicar el prorrateo de costos a esta orden. Esta acción asignará los gastos
            de internación proporcionalmente a cada línea de producto.
          </p>
          {prorationResult && (
            <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total FOB:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCostCurrency(prorationResult.totalFOB)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Gastos:</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCostCurrency(prorationResult.totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-[#2a2a2a] pt-1.5">
                <span className="font-medium text-gray-700 dark:text-gray-300">Total CIF:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatCostCurrency(prorationResult.totalCIF)}</span>
              </div>
            </div>
          )}
          {prorationResult?.hasAlerts && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{prorationResult.alerts.length} producto(s) con incremento de costo mayor al 10%.</span>
              </div>
            </div>
          )}
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            startContent={<CheckCircle className="h-4 w-4" />}
            onPress={() => {
              setIsProrationApplied(true);
              setIsConfirmOpen(false);
              toast.success('Prorrateo aplicado', {
                description: 'Los costos calculados se usarán al confirmar la recepción.',
              });
            }}
          >
            Confirmar y Aplicar
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Notes Section */}
      {order.notes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Notas</h2>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700">{order.notes}</p>
          </div>
        </motion.div>
      )}

      {/* Receive Merchandise Modal */}
      <CustomModal isOpen={isReceiveOpen} onClose={() => setIsReceiveOpen(false)} size="3xl" scrollable>
        <CustomModalHeader onClose={() => setIsReceiveOpen(false)}>
          <PackageCheck className="h-5 w-5 text-emerald-600" />
          Recibir Mercancía
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Proveedor:</span>
                <span className="ml-2 font-medium text-gray-900">{order.supplierName}</span>
              </div>
              <div>
                <span className="text-gray-500">Factura:</span>
                <span className="ml-2 font-mono font-medium text-gray-900">
                  {order.supplierInvoice || '-'}
                </span>
              </div>
            </div>

            {/* Quantities Confirmation */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-900">Confirmar cantidades recibidas</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Producto
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                        Ordenado
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                        Recibido
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                        Pendiente
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.lines.map((line) => {
                      const pending = line.quantity - line.quantityReceived;
                      return (
                        <tr key={line.id}>
                          <td className="px-3 py-2">
                            <div className="max-w-[250px]">
                              <p className="truncate text-sm text-gray-900">{line.productDescription}</p>
                              <p className="text-xs text-gray-500">{line.productReference}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-sm text-gray-900">{line.quantity}</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              size="sm"
                              value={String(receptionQuantities[line.productId] || 0)}
                              onChange={(e) => handleReceptionQtyChange(line.productId, parseInt(e.target.value) || 0)}
                              className="w-20"
                              classNames={{ inputWrapper: 'bg-white' }}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className={cn('text-sm', (pending - (receptionQuantities[line.productId] || 0)) > 0 ? 'text-amber-600' : 'text-gray-400')}>
                              {Math.max(0, pending - (receptionQuantities[line.productId] || 0))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses */}
            {canViewCosts && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">Gastos de internación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="% Gastos de internación"
                    type="number"
                    value={expensePercentage}
                    onChange={(e) => setExpensePercentage(e.target.value)}
                    variant="bordered"
                    classNames={{ inputWrapper: 'bg-white' }}
                    endContent={<span className="text-gray-400">%</span>}
                    description="Porcentaje total sobre FOB"
                  />
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Total gastos estimado</p>
                    <p className="font-mono text-lg font-bold text-gray-900">
                      {formatCurrency(order.totalFOB * (parseFloat(expensePercentage) / 100))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Impact Preview */}
            {canViewCosts && (
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900">Impacto en costos</h3>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <TrendingUp className="h-4 w-4" />
                    <span>
                      Al confirmar, los costos promedio ponderados se actualizarán automáticamente.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsReceiveOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onPress={handleConfirmReception}
          >
            Confirmar Recepción
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
