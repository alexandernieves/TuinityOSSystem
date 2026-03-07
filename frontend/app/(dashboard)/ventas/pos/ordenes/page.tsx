'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, ShoppingBag, Filter } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import { MOCK_POS_ORDERS, subscribePosOrders, getPosOrdersData } from '@/lib/mock-data/pos';
import {
  POS_ORDER_STATUS_CONFIG,
  POS_PAYMENT_METHOD_LABELS,
} from '@/lib/types/pos';
import type { POSOrderStatus, POSPaymentMethod } from '@/lib/types/pos';

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

type DateRange = 'hoy' | 'semana' | 'mes';

export default function OrdenesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  useStore(subscribePosOrders, getPosOrdersData);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('mes');
  const [statusFilter, setStatusFilter] = useState<POSOrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<POSPaymentMethod | 'all'>('all');

  const filteredOrders = useMemo(() => {
    return MOCK_POS_ORDERS.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.cashierName.toLowerCase().includes(searchLower) ||
        order.ticketNumber.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const primaryMethod = order.payments.length > 1 ? 'mixto' : order.payments[0]?.method;
      const matchesPayment = paymentFilter === 'all' || primaryMethod === paymentFilter;

      let matchesDate = true;
      if (dateRange === 'hoy') {
        matchesDate = order.createdAt.startsWith('2026-02-27');
      } else if (dateRange === 'semana') {
        const orderDate = new Date(order.createdAt);
        const weekStart = new Date('2026-02-23T00:00:00.000Z');
        matchesDate = orderDate >= weekStart;
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [searchQuery, dateRange, statusFilter, paymentFilter]);

  if (!checkPermission('canAccessPOS')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para acceder a esta seccion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/ventas/pos')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Ordenes</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Consulta y detalle de ventas POS</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por # orden, cliente, cajero..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Date Range */}
          <div className="flex rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            {(['hoy', 'semana', 'mes'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors',
                  dateRange === range
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-[#141414] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                )}
              >
                {range === 'hoy' ? 'Hoy' : range === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          {/* Payment Method */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as POSPaymentMethod | 'all')}
            className="h-9 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los metodos</option>
            {(Object.entries(POS_PAYMENT_METHOD_LABELS) as [POSPaymentMethod, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as POSOrderStatus | 'all')}
            className="h-9 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            {(Object.entries(POS_ORDER_STATUS_CONFIG) as [POSOrderStatus, typeof POS_ORDER_STATUS_CONFIG[POSOrderStatus]][]).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]"># Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Metodo Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Cajero</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {filteredOrders.map((order) => {
                  const statusCfg = POS_ORDER_STATUS_CONFIG[order.status];
                  const primaryMethod = order.payments.length > 1 ? 'mixto' : order.payments[0]?.method;
                  const itemCount = order.lines.reduce((sum, l) => sum + l.quantity, 0);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/ventas/pos/ordenes/${order.id}`)}
                          className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {order.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-100 dark:bg-[#1a1a1a] px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {itemCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {POS_PAYMENT_METHOD_LABELS[primaryMethod as POSPaymentMethod] ?? primaryMethod}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {order.cashierName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusCfg.bg, statusCfg.text
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a]">
            <p className="text-xs text-gray-500 dark:text-[#888888]">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <ShoppingBag className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-[#888888]">No se encontraron ordenes</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-[#666]">Intenta ajustar los filtros de busqueda</p>
        </div>
      )}
    </div>
  );
}
