'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import {
  FileText,
  Search,
  ChevronRight,
  Download,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  getLedgerEntries,
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
  ACCOUNT_NATURE_LABELS,
} from '@/lib/types/accounting';
import type { LedgerEntry } from '@/lib/types/accounting';

export default function LibroMayorPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  const accounts = useStore(subscribeAccounts, getAccountsData);
  useStore(subscribeJournalEntries, getJournalEntriesData);

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountSearch, setAccountSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const leafAccounts = useMemo(
    () => MOCK_ACCOUNTS.filter((a) => a.level === 3 && a.isActive),
    [accounts]
  );

  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return leafAccounts;
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
    if (dateFrom) {
      entries = entries.filter((e) => e.date >= dateFrom);
    }
    if (dateTo) {
      entries = entries.filter((e) => e.date <= dateTo);
    }
    return entries;
  }, [selectedAccountId, dateFrom, dateTo]);

  const openingBalance = ledgerEntries.length > 0
    ? ledgerEntries[0].runningBalance - ledgerEntries[0].debit + ledgerEntries[0].credit
    : 0;
  const closingBalance = ledgerEntries.length > 0
    ? ledgerEntries[ledgerEntries.length - 1].runningBalance
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const handleExport = () => {
    toast.success('Exportando libro mayor', {
      description: `Exportando movimientos de ${selectedAccount?.name || 'cuenta'}`,
    });
  };

  const handlePrint = () => {
    toast.success('Preparando impresión', {
      description: 'El documento se abrirá en una nueva ventana.',
    });
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
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Libro Mayor</h1>
          </div>
        </div>
        {selectedAccountId && (
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

      {/* Account Selector + Date Range */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Seleccionar cuenta
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre de cuenta..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {accountSearch && (
            <div className="mt-1 max-h-48 overflow-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-lg">
              {filteredAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setAccountSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
                    selectedAccountId === acc.id && 'bg-purple-50 dark:bg-purple-950/30'
                  )}
                >
                  <span className="font-mono text-xs text-gray-500 dark:text-[#888888]">{acc.code}</span>
                  <span className="text-gray-900 dark:text-white">{acc.name}</span>
                </button>
              ))}
              {filteredAccounts.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-[#888888]">No se encontraron cuentas</p>
              )}
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

      {/* Account Header */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">{selectedAccount.code}</span>
              <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">{selectedAccount.name}</span>
            </div>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-medium',
                ACCOUNT_TYPE_COLORS[selectedAccount.type].bg,
                ACCOUNT_TYPE_COLORS[selectedAccount.type].text
              )}
            >
              {ACCOUNT_TYPE_LABELS[selectedAccount.type]}
            </span>
            <span className="rounded-md bg-gray-100 dark:bg-[#1a1a1a] px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              {ACCOUNT_NATURE_LABELS[selectedAccount.nature]}
            </span>
          </div>
        </motion.div>
      )}

      {/* Ledger Table */}
      {selectedAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {/* Opening balance */}
                  <tr className="bg-blue-50 dark:bg-blue-950/20">
                    <td colSpan={5} className="px-4 py-2 text-sm font-medium text-blue-800 dark:text-blue-300">
                      Saldo Inicial
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm font-semibold text-blue-800 dark:text-blue-300">
                      {formatCurrencyAccounting(openingBalance)}
                    </td>
                  </tr>
                  {ledgerEntries.map((entry, index) => (
                    <tr key={`${entry.journalEntryId}-${index}`} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{formatDate(entry.date)}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-sm text-purple-600 dark:text-purple-400">{entry.journalEntryId}</span>
                      </td>
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
                  {/* Closing balance */}
                  <tr className="bg-emerald-50 dark:bg-emerald-950/20 border-t-2 border-emerald-200 dark:border-emerald-800">
                    <td colSpan={5} className="px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Saldo Final
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      {formatCurrencyAccounting(closingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-2 text-center text-sm text-gray-500 dark:text-[#888888]">
            {ledgerEntries.length} movimientos encontrados
          </p>
        </motion.div>
      )}

      {/* Empty state */}
      {!selectedAccountId && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-20">
          <FileText className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Selecciona una cuenta</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Busca y selecciona una cuenta para ver sus movimientos</p>
        </div>
      )}
    </div>
  );
}
