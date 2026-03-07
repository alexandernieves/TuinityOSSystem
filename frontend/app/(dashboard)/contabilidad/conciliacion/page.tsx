'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import {
  ClipboardCheck,
  ChevronRight,
  Upload,
  Check,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  MOCK_BANK_ACCOUNTS,
  MOCK_BANK_MOVEMENTS,
  formatCurrencyAccounting,
  subscribeBankAccounts,
  getBankAccountsData,
  subscribeBankMovements,
  getBankMovementsData,
} from '@/lib/mock-data/accounting';
import type { BankAccount, BankMovement } from '@/lib/types/accounting';

interface ReconciliationItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'ingreso' | 'egreso';
  status: 'conciliado' | 'pendiente';
}

export default function ConciliacionPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canReconcileBank = checkPermission('canReconcileBank');

  useStore(subscribeBankAccounts, getBankAccountsData);
  useStore(subscribeBankMovements, getBankMovementsData);

  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [extractoImported, setExtractoImported] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<Set<string>>(new Set());
  const [selectedBanco, setSelectedBanco] = useState<Set<string>>(new Set());
  const [reconciledItems, setReconciledItems] = useState<Set<string>>(new Set());

  const activeBanks = MOCK_BANK_ACCOUNTS.filter((b) => b.isActive);

  const systemMovements: ReconciliationItem[] = useMemo(() => {
    if (!selectedBank) return [];
    return MOCK_BANK_MOVEMENTS.filter((m) => m.bankAccountId === selectedBank.id).map((m) => ({
      id: `sys-${m.id}`,
      date: m.date,
      description: m.description,
      amount: m.amount,
      type: m.type,
      status: reconciledItems.has(`sys-${m.id}`) ? 'conciliado' : 'pendiente',
    }));
  }, [selectedBank, reconciledItems]);

  const bankMovements: ReconciliationItem[] = useMemo(() => {
    if (!selectedBank || !extractoImported) return [];
    // Simulate bank movements (same data with slight variations)
    return MOCK_BANK_MOVEMENTS.filter((m) => m.bankAccountId === selectedBank.id).map((m) => ({
      id: `bnk-${m.id}`,
      date: m.date,
      description: `${m.description} (extracto)`,
      amount: m.amount,
      type: m.type,
      status: reconciledItems.has(`bnk-${m.id}`) ? 'conciliado' : 'pendiente',
    }));
  }, [selectedBank, extractoImported, reconciledItems]);

  const totalConciliado = systemMovements.filter((m) => m.status === 'conciliado').reduce((sum, m) => sum + m.amount, 0);
  const totalPendiente = systemMovements.filter((m) => m.status === 'pendiente').reduce((sum, m) => sum + m.amount, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const handleImportExtracto = () => {
    setExtractoImported(true);
    toast.success('Extracto importado', {
      description: `Se importaron ${systemMovements.length} movimientos del banco.`,
    });
  };

  const toggleSystemSelection = (id: string) => {
    setSelectedSystem((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBankSelection = (id: string) => {
    setSelectedBanco((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReconcile = () => {
    if (selectedSystem.size === 0 || selectedBanco.size === 0) {
      toast.error('Selecciona movimientos', {
        description: 'Debes seleccionar al menos un movimiento de cada lado.',
      });
      return;
    }
    const newReconciled = new Set(reconciledItems);
    selectedSystem.forEach((id) => newReconciled.add(id));
    selectedBanco.forEach((id) => newReconciled.add(id));
    setReconciledItems(newReconciled);
    setSelectedSystem(new Set());
    setSelectedBanco(new Set());
    toast.success('Movimientos conciliados', {
      description: `${selectedSystem.size} movimiento(s) conciliado(s) exitosamente.`,
    });
  };

  const handleCloseConciliation = () => {
    toast.success('Conciliación cerrada', {
      description: `Conciliación de ${selectedBank?.bankName} cerrada exitosamente.`,
    });
    setSelectedBank(null);
    setExtractoImported(false);
    setReconciledItems(new Set());
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
            <ClipboardCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Conciliación Bancaria</h1>
          </div>
        </div>
        {selectedBank && (
          <button
            onClick={() => {
              setSelectedBank(null);
              setExtractoImported(false);
              setReconciledItems(new Set());
            }}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#888888] hover:text-gray-700 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar banco
          </button>
        )}
      </div>

      {/* Step 1: Select Bank */}
      {!selectedBank && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Paso 1: Selecciona la cuenta bancaria a conciliar
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeBanks.map((bank, index) => (
              <motion.button
                key={bank.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedBank(bank)}
                className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 text-left transition-all hover:border-purple-300 dark:hover:border-purple-800 hover:shadow-md"
                style={{ borderLeftWidth: 4, borderLeftColor: bank.color }}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{bank.bankName}</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">
                  {bank.accountType === 'corriente' ? 'Cuenta Corriente' : bank.accountType === 'ahorros' ? 'Cuenta de Ahorros' : 'Inversión'} {bank.accountNumber}
                </p>
                <p className="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrencyAccounting(bank.currentBalance)}
                </p>
                {bank.lastReconciliationDate && (
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-[#666666]">
                    Última conciliación: {formatDate(bank.lastReconciliationDate)}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 & 3: Reconciliation View */}
      {selectedBank && (
        <>
          {/* Bank Info */}
          <div
            className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
            style={{ borderLeftWidth: 4, borderLeftColor: selectedBank.color }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedBank.bankName}</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">{selectedBank.accountNumber} | Saldo: {formatCurrencyAccounting(selectedBank.currentBalance)}</p>
              </div>
              {!extractoImported && (
                <button
                  onClick={handleImportExtracto}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                >
                  <Upload className="h-4 w-4" />
                  Importar Extracto
                </button>
              )}
            </div>
          </div>

          {/* Split View */}
          {extractoImported && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* System Movements */}
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden">
                  <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Movimientos del Sistema</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {systemMovements.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => item.status !== 'conciliado' && toggleSystemSelection(item.id)}
                        disabled={item.status === 'conciliado'}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                          item.status === 'conciliado'
                            ? 'bg-emerald-50 dark:bg-emerald-950/10 opacity-60'
                            : selectedSystem.has(item.id)
                            ? 'bg-purple-50 dark:bg-purple-950/20'
                            : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border',
                            item.status === 'conciliado'
                              ? 'border-emerald-500 bg-emerald-500'
                              : selectedSystem.has(item.id)
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300 dark:border-[#444444]'
                          )}
                        >
                          {(item.status === 'conciliado' || selectedSystem.has(item.id)) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">{item.description}</p>
                          <p className="text-[10px] text-gray-500 dark:text-[#888888]">{formatDate(item.date)}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              'font-mono text-sm font-medium',
                              item.type === 'ingreso' ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {item.type === 'ingreso' ? '+' : '-'}{formatCurrencyAccounting(item.amount)}
                          </span>
                          <p className="text-[10px]">
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                item.status === 'conciliado'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              )}
                            >
                              {item.status === 'conciliado' ? 'Conciliado' : 'Pendiente'}
                            </span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Movements */}
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden">
                  <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Movimientos del Banco</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {bankMovements.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => item.status !== 'conciliado' && toggleBankSelection(item.id)}
                        disabled={item.status === 'conciliado'}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                          item.status === 'conciliado'
                            ? 'bg-emerald-50 dark:bg-emerald-950/10 opacity-60'
                            : selectedBanco.has(item.id)
                            ? 'bg-purple-50 dark:bg-purple-950/20'
                            : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border',
                            item.status === 'conciliado'
                              ? 'border-emerald-500 bg-emerald-500'
                              : selectedBanco.has(item.id)
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300 dark:border-[#444444]'
                          )}
                        >
                          {(item.status === 'conciliado' || selectedBanco.has(item.id)) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">{item.description}</p>
                          <p className="text-[10px] text-gray-500 dark:text-[#888888]">{formatDate(item.date)}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              'font-mono text-sm font-medium',
                              item.type === 'ingreso' ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {item.type === 'ingreso' ? '+' : '-'}{formatCurrencyAccounting(item.amount)}
                          </span>
                          <p className="text-[10px]">
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                item.status === 'conciliado'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : 'bg-amber-500/10 text-amber-500'
                              )}
                            >
                              {item.status === 'conciliado' ? 'Conciliado' : 'Pendiente'}
                            </span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reconcile Button */}
              <div className="flex items-center justify-center gap-3">
                {(selectedSystem.size > 0 || selectedBanco.size > 0) && (
                  <button
                    onClick={handleReconcile}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Conciliar ({selectedSystem.size} + {selectedBanco.size})
                  </button>
                )}
              </div>

              {/* Summary Bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Conciliado</p>
                  <p className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrencyAccounting(totalConciliado)}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
                  <p className="text-sm text-amber-600 dark:text-amber-400">Pendiente</p>
                  <p className="font-mono text-xl font-bold text-amber-700 dark:text-amber-300">
                    {formatCurrencyAccounting(totalPendiente)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Diferencia</p>
                  <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(0)}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              {canReconcileBank && (
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseConciliation}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Cerrar Conciliación
                  </button>
                </div>
              )}
            </>
          )}

          {/* Before import */}
          {!extractoImported && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
              <Upload className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
              <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Importar Extracto Bancario</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">Haz clic en el botón de arriba para importar el extracto del banco</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
