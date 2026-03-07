'use client';

import { useStore } from '@/hooks/use-store';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, RotateCcw, FileText, User, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { MOCK_POS_ORDERS, subscribePosOrders, getPosOrdersData } from '@/lib/mock-data/pos';
import {
  POS_ORDER_STATUS_CONFIG,
  POS_PAYMENT_METHOD_LABELS,
} from '@/lib/types/pos';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdenDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useStore(subscribePosOrders, getPosOrdersData);

  const order = MOCK_POS_ORDERS.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ventas/pos/ordenes')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Orden no encontrada</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <FileText className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-[#888888]">
            No se encontro la orden {id}
          </p>
          <button
            onClick={() => router.push('/ventas/pos/ordenes')}
            className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Volver al historial
          </button>
        </div>
      </div>
    );
  }

  const statusCfg = POS_ORDER_STATUS_CONFIG[order.status];
  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);

  const handleReprint = () => {
    toast.success('Ticket reenviado a impresora', { id: 'reprint-ticket' });
  };

  const handleReturn = () => {
    toast.info('Funcion de devolucion en desarrollo', { id: 'process-return' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ventas/pos/ordenes')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold text-gray-900 dark:text-white">{order.id}</h1>
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusCfg.bg, statusCfg.text
              )}>
                <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-[#888888]">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(order.createdAt)}
              <span className="text-gray-300 dark:text-[#444]">|</span>
              <span>Ticket: {order.ticketNumber}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReprint}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            <Printer className="h-3.5 w-3.5" />
            Reimprimir Ticket
          </button>
          <button
            onClick={handleReturn}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Procesar Devolucion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Order Lines */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Detalle de Productos ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Producto</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Cant.</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Precio Unit.</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{line.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-[#888888] font-mono">{line.productCode}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{line.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(line.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a]">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-[#888888]">Subtotal</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</td>
                </tr>
                {order.discountTotal > 0 && (
                  <tr className="bg-gray-50 dark:bg-[#0a0a0a]">
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-gray-500 dark:text-[#888888]">Descuentos</td>
                    <td className="px-4 py-2 text-right font-mono text-sm text-red-500">-{formatCurrency(order.discountTotal)}</td>
                  </tr>
                )}
                <tr className="bg-gray-50 dark:bg-[#0a0a0a]">
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">Total</td>
                  <td className="px-4 py-3 text-right font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Payment Info */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pago</h3>
            </div>
            {order.payments.map((payment, idx) => (
              <div key={idx} className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-[#888888]">Metodo</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {POS_PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-[#888888]">Monto</span>
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                {payment.reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-[#888888]">Referencia</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{payment.reference}</span>
                  </div>
                )}
              </div>
            ))}
            {order.changeGiven != null && order.changeGiven > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                <span className="text-xs text-gray-500 dark:text-[#888888]">Cambio entregado</span>
                <span className="font-mono text-sm font-medium text-amber-600 dark:text-amber-400">
                  {formatCurrency(order.changeGiven)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Customer Info */}
          {order.customerName !== 'Consumidor Final' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cliente</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                {order.customerId && (
                  <p className="text-xs text-gray-500 dark:text-[#888888] font-mono">{order.customerId}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Cashier / Notes */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-[#888888]">Cajero</span>
              <span className="font-medium text-gray-900 dark:text-white">{order.cashierName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-[#888888]">Caja</span>
              <span className="text-gray-700 dark:text-gray-300">{order.cashRegisterId}</span>
            </div>
            {order.notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-xs text-gray-500 dark:text-[#888888] mb-1">Notas</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
