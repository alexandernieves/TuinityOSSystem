'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronRight,
  Download,
  Printer,
  Search,
  FileSpreadsheet,
  BookOpen,
  PieChart,
  GitCompareArrows,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  getTrialBalance,
  getLedgerEntries,
  getMonthlyPLSummaries,
  MOCK_ACCOUNTS,
  formatCurrencyAccounting,
  subscribeAccounts,
  getAccountsData,
  subscribeJournalEntries,
  getJournalEntriesData,
} from '@/lib/mock-data/accounting';
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_COLORS,
} from '@/lib/types/accounting';

type ReportType = 'balance_comprobacion' | 'auxiliar_cuenta' | 'analisis_gastos' | 'comparativos';

const REPORT_CARDS: { key: ReportType; label: string; description: string; icon: typeof FileSpreadsheet }[] = [
  { key: 'balance_comprobacion', label: 'Balance de Comprobación', description: 'Saldos deudores y acreedores de todas las cuentas', icon: FileSpreadsheet },
  { key: 'auxiliar_cuenta', label: 'Auxiliar por Cuenta', description: 'Detalle de movimientos por cuenta específica', icon: BookOpen },
  { key: 'analisis_gastos', label: 'Análisis de Gastos', description: 'Distribución y análisis de gastos operativos', icon: PieChart },
  { key: 'comparativos', label: 'Comparativos', description: 'Comparación mensual de ingresos y gastos', icon: GitCompareArrows },
];

export default function ReportesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewFinancialStatements = checkPermission('canViewFinancialStatements');

  const accounts = useStore(subscribeAccounts, getAccountsData);
  useStore(subscribeJournalEntries, getJournalEntriesData);

  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const trialBalance = useMemo(() => getTrialBalance(), [accounts]);
  const totalDebit = trialBalance.reduce((sum, l) => sum + l.debitBalance, 0);
  const totalCredit = trialBalance.reduce((sum, l) => sum + l.creditBalance, 0);

  const plSummaries = useMemo(() => getMonthlyPLSummaries(), []);

  const gastoAccounts = useMemo(
    () => MOCK_ACCOUNTS.filter((a) => a.type === 'gasto' && a.level === 3 && a.hasMovements),
    [accounts]
  );
  const maxGasto = Math.max(...gastoAccounts.map((a) => a.balance));

  const leafAccounts = useMemo(
    () => MOCK_ACCOUNTS.filter((a) => a.level === 3 && a.isActive),
    [accounts]
  );

  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return [];
    const s = accountSearch.toLowerCase();
    return leafAccounts.filter(
      (a) => a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s)
    );
  }, [leafAccounts, accountSearch]);

  const selectedAccount = useMemo(
    () => MOCK_ACCOUNTS.find((a) => a.id === selectedAccountId),
    [selectedAccountId, accounts]
  );

  const ledgerEntries = useMemo(() => {
    if (!selectedAccountId) return [];
    let entries = getLedgerEntries(selectedAccountId);
    if (dateFrom) entries = entries.filter((e) => e.date >= dateFrom);
    if (dateTo) entries = entries.filter((e) => e.date <= dateTo);
    return entries;
  }, [selectedAccountId, dateFrom, dateTo]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const handleExport = () => {
    toast.success('Exportando reporte', {
      description: 'El archivo se descargará en breve.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/contabilidad')}
            className="text-sm text-gray-500 dark:text-[#888888] hover:text-gray-700 dark:hover:text-white"
          >
            Contabilidad
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reportes Financieros</h1>
          </div>
        </div>
        {selectedReport && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={handlePrint}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        )}
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {REPORT_CARDS.map((report, index) => (
          <motion.button
            key={report.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedReport(report.key)}
            className={cn(
              'rounded-xl border p-4 text-left transition-all hover:shadow-md',
              selectedReport === report.key
                ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50 dark:bg-purple-950/20'
                : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  selectedReport === report.key
                    ? 'bg-purple-100 dark:bg-purple-900'
                    : 'bg-gray-100 dark:bg-[#1a1a1a]'
                )}
              >
                <report.icon
                  className={cn(
                    'h-5 w-5',
                    selectedReport === report.key
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                />
              </div>
            </div>
            <p
              className={cn(
                'text-sm font-semibold',
                selectedReport === report.key
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-900 dark:text-white'
              )}
            >
              {report.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-[#888888] mt-0.5">{report.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport === 'balance_comprobacion' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-[#888888]">EVOLUTION IMPORTADORA, S.A.</p>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Balance de Comprobación</h3>
            <p className="text-xs text-gray-400 dark:text-[#666666]">Al 26 de Febrero, 2026</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Cuenta</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo Deudor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo Acreedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {trialBalance.map((line) => {
                  const typeColor = ACCOUNT_TYPE_COLORS[line.accountType];
                  return (
                    <tr key={line.accountCode} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2.5 font-mono text-sm text-gray-600 dark:text-gray-400">{line.accountCode}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white">{line.accountName}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', typeColor.bg, typeColor.text)}>
                          {ACCOUNT_TYPE_LABELS[line.accountType]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900 dark:text-white">
                        {line.debitBalance > 0 ? formatCurrencyAccounting(line.debitBalance) : ''}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900 dark:text-white">
                        {line.creditBalance > 0 ? formatCurrencyAccounting(line.creditBalance) : ''}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1a1a] font-bold">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">TOTALES</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(totalCredit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-4 py-2 text-center">
            <span
              className={cn(
                'text-xs font-medium',
                Math.abs(totalDebit - totalCredit) < 0.01
                  ? 'text-emerald-600'
                  : 'text-red-600'
              )}
            >
              {Math.abs(totalDebit - totalCredit) < 0.01
                ? 'Balance cuadrado - Diferencia: $0.00'
                : `Diferencia: ${formatCurrencyAccounting(Math.abs(totalDebit - totalCredit))}`}
            </span>
          </div>
        </motion.div>
      )}

      {selectedReport === 'auxiliar_cuenta' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Account Selector */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Cuenta</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cuenta por código o nombre..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              {accountSearch && filteredAccounts.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-lg">
                  {filteredAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setAccountSearch('');
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    >
                      <span className="font-mono text-xs text-gray-500 dark:text-[#888888]">{acc.code}</span>
                      <span className="text-gray-900 dark:text-white">{acc.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Selected Account Info */}
          {selectedAccount && (
            <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-3">
              <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">{selectedAccount.code}</span>
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{selectedAccount.name}</span>
              <span
                className={cn(
                  'ml-2 rounded-md px-2 py-0.5 text-xs font-medium',
                  ACCOUNT_TYPE_COLORS[selectedAccount.type].bg,
                  ACCOUNT_TYPE_COLORS[selectedAccount.type].text
                )}
              >
                {ACCOUNT_TYPE_LABELS[selectedAccount.type]}
              </span>
            </div>
          )}

          {/* Ledger Table */}
          {selectedAccountId && ledgerEntries.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Asiento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Descripción</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Debe</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Haber</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {ledgerEntries.map((entry, index) => (
                      <tr key={`${entry.journalEntryId}-${index}`} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                        <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{formatDate(entry.date)}</td>
                        <td className="px-4 py-2.5 font-mono text-sm text-purple-600 dark:text-purple-400">{entry.journalEntryId}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white">{entry.description}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900 dark:text-white">
                          {entry.debit > 0 ? formatCurrencyAccounting(entry.debit) : ''}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900 dark:text-white">
                          {entry.credit > 0 ? formatCurrencyAccounting(entry.credit) : ''}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrencyAccounting(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedAccountId && ledgerEntries.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-[#888888]">No hay movimientos para esta cuenta en el rango seleccionado</p>
            </div>
          )}

          {!selectedAccountId && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-400 dark:text-[#666666]" />
              <p className="text-sm text-gray-500 dark:text-[#888888]">Selecciona una cuenta para ver sus movimientos</p>
            </div>
          )}
        </motion.div>
      )}

      {selectedReport === 'analisis_gastos' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Análisis de Gastos Operativos</h3>
            <p className="text-xs text-gray-500 dark:text-[#888888]">Distribución de gastos del período actual</p>
          </div>
          <div className="p-4 space-y-3">
            {gastoAccounts
              .sort((a, b) => b.balance - a.balance)
              .map((account) => {
                const percentage = (account.balance / gastoAccounts.reduce((s, a) => s + a.balance, 0)) * 100;
                return (
                  <div key={account.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500 dark:text-[#888888]">{account.code}</span>
                        <span className="text-gray-900 dark:text-white">{account.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-[#888888]">{percentage.toFixed(1)}%</span>
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white w-24 text-right">
                          {formatCurrencyAccounting(account.balance)}
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${(account.balance / maxGasto) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a]">
            <div className="flex items-center justify-between font-bold">
              <span className="text-sm text-gray-900 dark:text-white">Total Gastos Operativos</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {formatCurrencyAccounting(gastoAccounts.reduce((s, a) => s + a.balance, 0))}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {selectedReport === 'comparativos' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Comparativo Mensual</h3>
            <p className="text-xs text-gray-500 dark:text-[#888888]">Últimos 6 meses de actividad</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Mes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Gastos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Utilidad Neta</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Margen %</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Var. vs Anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {plSummaries.map((month, index) => {
                  const prevMonth = index > 0 ? plSummaries[index - 1] : null;
                  const variation = prevMonth
                    ? ((month.netIncome - prevMonth.netIncome) / prevMonth.netIncome) * 100
                    : 0;
                  const margin = (month.netIncome / month.revenue) * 100;

                  return (
                    <tr key={month.month} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{month.monthLabel} {month.month.split('-')[0]}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-emerald-600">{formatCurrencyAccounting(month.revenue)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-red-600">{formatCurrencyAccounting(month.expenses)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">{formatCurrencyAccounting(month.netIncome)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-600 dark:text-gray-400">{margin.toFixed(1)}%</td>
                      <td className="px-4 py-2.5 text-center">
                        {index === 0 ? (
                          <span className="text-xs text-gray-400 dark:text-[#666666]">-</span>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              variation >= 0
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-red-500/10 text-red-500'
                            )}
                          >
                            {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1a1a] font-bold">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">PROMEDIO</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-600">
                    {formatCurrencyAccounting(plSummaries.reduce((s, m) => s + m.revenue, 0) / plSummaries.length)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-red-600">
                    {formatCurrencyAccounting(plSummaries.reduce((s, m) => s + m.expenses, 0) / plSummaries.length)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(plSummaries.reduce((s, m) => s + m.netIncome, 0) / plSummaries.length)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

      {/* No report selected */}
      {!selectedReport && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
          <BarChart3 className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Selecciona un tipo de reporte</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Haz clic en una de las tarjetas para generar el reporte</p>
        </div>
      )}
    </div>
  );
}
