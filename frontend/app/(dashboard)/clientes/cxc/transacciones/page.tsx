'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  ArrowLeft,
  Search,
  Download,
  Clock,
  Ban,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCxCTransactions,
  getCxCTransactionsData,
  subscribeCxCTransactions,
  formatCurrencyCxC,
} from '@/lib/mock-data/accounts-receivable';
import { formatDate } from '@/lib/mock-data/sales-orders';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import type { CxCTransactionType } from '@/lib/types/accounts-receivable';
import {
  CXC_TRANSACTION_TYPE_LABELS,
} from '@/lib/types/accounts-receivable';

const TRANSACTION_TYPE_CONFIG: Record<CxCTransactionType, { bg: string; text: string; icon: React.ElementType }> = {
  factura: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: ArrowUpRight },
  cobro: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: ArrowDownRight },
  nota_credito: { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: ArrowDownRight },
  anulacion: { bg: 'bg-red-500/10', text: 'text-red-500', icon: Ban },
  ajuste: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: FileText },
};

export default function TransaccionesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canAccessCxC = checkPermission('canAccessCxC');

  useStore(subscribeCxCTransactions, getCxCTransactionsData);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const transactions = useMemo(() => {
    return getCxCTransactions({
      search: searchQuery || undefined,
      transactionType: typeFilter === 'all' ? 'all' : typeFilter as CxCTransactionType,
      dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
      dateTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
    });
  }, [searchQuery, typeFilter, dateFrom, dateTo]);

  const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);
  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);

  if (!canAccessCxC) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Ban className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Acceso restringido</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para ver transacciones CxC.</p>
        <Button color="primary" onPress={() => router.push('/clientes/cxc')} className="bg-brand-700">
          Volver a CxC
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/clientes/cxc')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Consulta de Transacciones</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Historial de movimientos de cuentas por cobrar</p>
          </div>
        </div>
        <button
          onClick={() => toast.info('Exportar', { description: 'La funcion de exportacion estara disponible proximamente.' })}
          className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-[#888888]">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cliente, documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-[#888888]">Tipo</label>
          <Select
            placeholder="Todos"
            variant="bordered"
            size="sm"
            selectedKeys={[typeFilter]}
            onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] as string)}
          >
            <SelectItem key="all">Todos</SelectItem>
            <SelectItem key="factura">Factura</SelectItem>
            <SelectItem key="cobro">Cobro</SelectItem>
            <SelectItem key="nota_credito">Nota de Credito</SelectItem>
            <SelectItem key="anulacion">Anulacion</SelectItem>
          </Select>
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-[#888888]">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-[#888888]">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-[#888888]">Total Debitos</p>
          <p className="font-mono text-xl font-bold text-blue-500">{formatCurrencyCxC(totalDebits)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-[#888888]">Total Creditos</p>
          <p className="font-mono text-xl font-bold text-emerald-500">{formatCurrencyCxC(totalCredits)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-[#888888]">Transacciones</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Cliente</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Debito</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Credito</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {transactions.map((txn, index) => {
                const config = TRANSACTION_TYPE_CONFIG[txn.type];
                const TxnIcon = config.icon;
                return (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#888888]">{formatDate(txn.date)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                        config.bg,
                        config.text
                      )}>
                        <TxnIcon className="h-3 w-3" />
                        {CXC_TRANSACTION_TYPE_LABELS[txn.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{txn.documentNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{txn.clientName}</td>
                    <td className="px-4 py-3 text-right">
                      {txn.debit > 0 ? (
                        <span className="font-mono text-sm font-medium text-blue-500">{formatCurrencyCxC(txn.debit)}</span>
                      ) : (
                        <span className="text-sm text-gray-300 dark:text-[#444444]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {txn.credit > 0 ? (
                        <span className="font-mono text-sm font-medium text-emerald-500">{formatCurrencyCxC(txn.credit)}</span>
                      ) : (
                        <span className="text-sm text-gray-300 dark:text-[#444444]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {txn.balance > 0 ? formatCurrencyCxC(txn.balance) : '-'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
          <Clock className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Sin transacciones</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">No se encontraron transacciones con los filtros aplicados</p>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
        Mostrando {transactions.length} transacciones
      </div>
    </motion.div>
  );
}
