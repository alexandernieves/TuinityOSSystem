'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  RotateCcw,
  Percent,
  Receipt,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  getDailyReport,
  getTopProducts,
  MOCK_CASH_CLOSINGS,
  subscribePosOrders,
  getPosOrdersData,
  subscribePosReturns,
  getPosReturnsData,
  subscribeCashClosings,
  getCashClosingsData,
} from '@/lib/mock-data/pos';
import { POS_PAYMENT_METHOD_LABELS } from '@/lib/types/pos';
import type { POSPaymentMethod } from '@/lib/types/pos';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

type ReportTab = 'ventas' | 'productos' | 'cierres';

export default function ReportesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  useStore(subscribePosOrders, getPosOrdersData);
  useStore(subscribePosReturns, getPosReturnsData);
  useStore(subscribeCashClosings, getCashClosingsData);

  const [activeTab, setActiveTab] = useState<ReportTab>('ventas');

  const dailyReport = useMemo(() => getDailyReport('2026-02-27'), []);
  const topProducts = useMemo(() => getTopProducts(10), []);

  if (!checkPermission('canViewPOSReports')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para ver reportes POS.</p>
      </div>
    );
  }

  const maxPaymentAmount = Math.max(...dailyReport.byPaymentMethod.map((m) => m.amount), 1);
  const maxCashierAmount = Math.max(...dailyReport.byCashier.map((c) => c.amount), 1);
  const maxHourAmount = Math.max(...dailyReport.byHour.map((h) => h.amount), 1);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'ventas', label: 'Ventas Diarias' },
    { key: 'productos', label: 'Productos Mas Vendidos' },
    { key: 'cierres', label: 'Cierres de Caja' },
  ];

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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reportes POS</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Analisis de ventas y rendimiento</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-[#141414] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- Ventas Diarias Tab ---- */}
      {activeTab === 'ventas' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'Ventas Brutas', value: dailyReport.grossSales, icon: DollarSign },
              { label: 'Devoluciones', value: dailyReport.returns, icon: RotateCcw },
              { label: 'Descuentos', value: dailyReport.discounts, icon: Percent },
              { label: 'Ventas Netas', value: dailyReport.netSales, icon: DollarSign },
              { label: 'Ticket Promedio', value: dailyReport.averageTicket, icon: Receipt },
              { label: 'Transacciones', value: dailyReport.transactionCount, icon: BarChart3, isCurrency: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-[#888888]">{stat.label}</span>
                </div>
                <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                  {stat.isCurrency === false ? stat.value : formatCurrency(stat.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Payment Method Breakdown */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Desglose por Metodo de Pago</h3>
            <div className="space-y-3">
              {dailyReport.byPaymentMethod.map((item) => (
                <div key={item.method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {POS_PAYMENT_METHOD_LABELS[item.method as POSPaymentMethod] ?? item.method}
                    </span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)} <span className="text-xs text-gray-400">({item.count} txn)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.amount / maxPaymentAmount) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cashier Breakdown */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Desglose por Cajero</h3>
            <div className="space-y-3">
              {dailyReport.byCashier.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)} <span className="text-xs text-gray-400">({item.count} txn)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.amount / maxCashierAmount) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Breakdown */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Ventas por Hora</h3>
            <div className="flex items-end gap-2 h-40">
              {dailyReport.byHour.map((item) => (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-gray-500 dark:text-[#888888]">
                    {formatCurrency(item.amount)}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.amount / maxHourAmount) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full min-h-[4px] rounded-t-md bg-violet-500"
                  />
                  <span className="text-xs text-gray-500 dark:text-[#888888]">{item.hour}:00</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ---- Productos Mas Vendidos Tab ---- */}
      {activeTab === 'productos' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Categoria</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Uds. Vendidas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Ingresos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">% del Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Tendencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {topProducts.map((product, idx) => (
                  <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        idx === 0 && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                        idx === 1 && 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                        idx === 2 && 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
                        idx > 2 && 'bg-gray-100 text-gray-500 dark:bg-[#1a1a1a] dark:text-gray-400',
                      )}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white max-w-[250px] truncate">
                      {product.productName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{product.productGroup}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {product.unitsSold}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${product.percentOfTotal}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-[#888888]">{product.percentOfTotal}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500 mx-auto" />}
                      {product.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />}
                      {product.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ---- Cierres de Caja Tab ---- */}
      {activeTab === 'cierres' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Cajero</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Total Ventas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Esperado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Contado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Diferencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {MOCK_CASH_CLOSINGS.map((closing) => (
                  <tr key={closing.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(closing.closedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{closing.closedByName}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(closing.totalSales)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(closing.expectedCash)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(closing.actualCash)}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono text-sm font-medium',
                      closing.difference === 0 ? 'text-gray-500' : closing.difference > 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {closing.difference === 0 ? '$0.00' : closing.difference > 0 ? `+${formatCurrency(closing.difference)}` : formatCurrency(closing.difference)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        closing.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', closing.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {closing.status === 'ok' ? 'OK' : 'Con Diferencia'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
