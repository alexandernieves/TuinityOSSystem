'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import { Tooltip } from '@heroui/react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Landmark,
  BookOpen,
  FileText,
  Scale,
  ClipboardCheck,
  Lock,
  Wallet,
  BarChart3,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  getAccountingStats,
  getMonthlyPLSummaries,
  MOCK_BANK_ACCOUNTS,
  formatCurrencyAccounting,
  subscribeBankAccounts,
  getBankAccountsData,
} from '@/lib/mock-data/accounting';

const SUB_NAV_ITEMS = [
  { label: 'Libro Diario', href: '/contabilidad/libro-diario', icon: BookOpen },
  { label: 'Libro Mayor', href: '/contabilidad/libro-mayor', icon: FileText },
  { label: 'Plan de Cuentas', href: '/contabilidad/plan-cuentas', icon: Scale },
  { label: 'Estados Financieros', href: '/contabilidad/estados-financieros', icon: BarChart3 },
  { label: 'Conciliación', href: '/contabilidad/conciliacion', icon: ClipboardCheck },
  { label: 'Cierres', href: '/contabilidad/cierres', icon: Lock },
  { label: 'Tesorería', href: '/contabilidad/tesoreria', icon: Wallet },
  { label: 'Reportes', href: '/contabilidad/reportes', icon: BarChart3 },
];

export default function ContabilidadPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canAccessContabilidad = checkPermission('canAccessContabilidad');

  useStore(subscribeBankAccounts, getBankAccountsData);

  const stats = getAccountingStats();
  const plSummaries = getMonthlyPLSummaries();
  const activeBanks = MOCK_BANK_ACCOUNTS.filter((b) => b.isActive);

  const maxRevenue = Math.max(...plSummaries.map((s) => s.revenue));

  const statCards = [
    {
      label: 'Ingresos del Mes',
      value: formatCurrencyAccounting(stats.monthlyRevenue),
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Gastos del Mes',
      value: formatCurrencyAccounting(stats.monthlyExpenses),
      icon: TrendingDown,
      color: 'red',
    },
    {
      label: 'Utilidad Neta',
      value: formatCurrencyAccounting(stats.netIncome),
      icon: DollarSign,
      color: 'blue',
    },
    {
      label: 'Saldo en Bancos',
      value: formatCurrencyAccounting(stats.totalBankBalance),
      icon: Landmark,
      color: 'purple',
    },
  ];

  const indicators = [
    { label: 'Margen Bruto', value: `${stats.grossMarginPercent}%`, color: 'emerald' },
    { label: 'Rotación CxC', value: `${stats.cxcRotation} días`, color: 'blue' },
    { label: 'Días Promedio Cobro', value: `${stats.averageCollectionDays} días`, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
            <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Contabilidad</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Dashboard financiero y módulos contables</p>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2">
        {SUB_NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-400"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  stat.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-950',
                  stat.color === 'red' && 'bg-red-50 dark:bg-red-950',
                  stat.color === 'blue' && 'bg-blue-50 dark:bg-blue-950',
                  stat.color === 'purple' && 'bg-purple-50 dark:bg-purple-950'
                )}
              >
                <stat.icon
                  className={cn(
                    'h-5 w-5',
                    stat.color === 'emerald' && 'text-emerald-600',
                    stat.color === 'red' && 'text-red-600',
                    stat.color === 'blue' && 'text-blue-600',
                    stat.color === 'purple' && 'text-purple-600'
                  )}
                />
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* P&L Chart + Bank Balances */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* P&L Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Ingresos vs Gastos (6 meses)</h3>
          <div className="space-y-3">
            {plSummaries.map((month) => (
              <div key={month.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-8">{month.monthLabel}</span>
                  <span className="font-mono text-gray-500 dark:text-[#888888]">
                    Neto: {formatCurrencyAccounting(month.netIncome)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-right text-[10px] text-gray-500 dark:text-[#888888]">Ingresos</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-right font-mono text-[10px] text-gray-600 dark:text-gray-400">
                      {formatCurrencyAccounting(month.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-right text-[10px] text-gray-500 dark:text-[#888888]">Gastos</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${(month.expenses / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-right font-mono text-[10px] text-gray-600 dark:text-gray-400">
                      {formatCurrencyAccounting(month.expenses)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-[#888888]">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Ingresos
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              Gastos
            </div>
          </div>
        </div>

        {/* Bank Balances */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Saldos Bancarios</h3>
            <button
              onClick={() => router.push('/contabilidad/tesoreria')}
              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Ver todo <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {activeBanks.slice(0, 7).map((bank) => (
              <div
                key={bank.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-[#2a2a2a] p-2.5"
                style={{ borderLeftWidth: 3, borderLeftColor: bank.color }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bank.bankName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-[#888888]">{bank.accountNumber}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyAccounting(bank.currentBalance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Indicators + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Key Indicators */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Indicadores Clave</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {indicators.map((ind) => (
              <div
                key={ind.label}
                className="rounded-lg border border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3 text-center"
              >
                <p
                  className={cn(
                    'text-lg font-bold sm:text-xl',
                    ind.color === 'emerald' && 'text-emerald-600',
                    ind.color === 'blue' && 'text-blue-600',
                    ind.color === 'amber' && 'text-amber-600'
                  )}
                >
                  {ind.value}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-[#888888]">{ind.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Alertas Pendientes</h3>
          <div className="space-y-3">
            {stats.pendingReconciliations > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {stats.pendingReconciliations} conciliación(es) pendiente(s)
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Completar conciliación bancaria del período actual</p>
                </div>
                <button
                  onClick={() => router.push('/contabilidad/conciliacion')}
                  className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
                >
                  Ir
                </button>
              </div>
            )}
            {stats.pendingCloses > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3">
                <Lock className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    {stats.pendingCloses} cierre(s) mensual(es) pendiente(s)
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Ejecutar cierre del mes actual</p>
                </div>
                <button
                  onClick={() => router.push('/contabilidad/cierres')}
                  className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                >
                  Ir
                </button>
              </div>
            )}
            {stats.pendingReconciliations === 0 && stats.pendingCloses === 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <ClipboardCheck className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Todo al día. No hay alertas pendientes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
