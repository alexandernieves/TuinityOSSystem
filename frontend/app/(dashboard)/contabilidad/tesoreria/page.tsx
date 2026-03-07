'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import {
  Button,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  Wallet,
  ChevronRight,
  Landmark,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  MOCK_BANK_ACCOUNTS,
  MOCK_BANK_MOVEMENTS,
  getCashFlowProjections,
  formatCurrencyAccounting,
  subscribeBankAccounts,
  getBankAccountsData,
  subscribeBankMovements,
  getBankMovementsData,
  addBankMovement,
} from '@/lib/mock-data/accounting';

export default function TesoreriaPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canAccessTreasury = checkPermission('canAccessTreasury');

  useStore(subscribeBankAccounts, getBankAccountsData);
  const bankMovements = useStore(subscribeBankMovements, getBankMovementsData);

  const [isOpen, setIsOpen] = useState(false);

  // Payment form
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentBeneficiary, setPaymentBeneficiary] = useState('');
  const [paymentConcept, setPaymentConcept] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const activeBanks = MOCK_BANK_ACCOUNTS.filter((b) => b.isActive);
  const totalBalance = activeBanks.reduce((sum, b) => sum + b.currentBalance, 0);
  const projections = getCashFlowProjections();

  const recentMovements = useMemo(
    () => [...MOCK_BANK_MOVEMENTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [bankMovements]
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const handleEmitPayment = () => {
    if (!paymentBank || !paymentAmount || !paymentBeneficiary || !paymentConcept) {
      toast.error('Campos requeridos', {
        description: 'Completa todos los campos obligatorios.',
      });
      return;
    }
    addBankMovement({
      id: `BM-${Date.now()}`,
      date: new Date().toISOString(),
      bankAccountId: paymentBank,
      bankName: MOCK_BANK_ACCOUNTS.find((b) => b.id === paymentBank)?.bankName || '',
      description: `${paymentConcept} - ${paymentBeneficiary}`,
      type: 'egreso',
      amount: parseFloat(paymentAmount),
      balance: 0,
      reference: paymentReference || undefined,
    });
    toast.success('Pago emitido', {
      description: `Pago de ${formatCurrencyAccounting(parseFloat(paymentAmount))} emitido a ${paymentBeneficiary}.`,
    });
    setIsOpen(false);
    setPaymentBank('');
    setPaymentAmount('');
    setPaymentBeneficiary('');
    setPaymentConcept('');
    setPaymentReference('');
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
            <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tesorería</h1>
          </div>
        </div>
        {canAccessTreasury && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Emitir Pago
          </button>
        )}
      </div>

      {/* Total Balance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gradient-to-r from-purple-600 to-purple-800 p-6 text-white"
      >
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 opacity-80" />
          <div>
            <p className="text-sm opacity-80">Saldo Total en Bancos</p>
            <p className="font-mono text-3xl font-bold">{formatCurrencyAccounting(totalBalance)}</p>
            <p className="text-xs opacity-60">{activeBanks.length} cuentas activas</p>
          </div>
        </div>
      </motion.div>

      {/* Bank Cards Grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Cuentas Bancarias</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeBanks.map((bank, index) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
              style={{ borderLeftWidth: 4, borderLeftColor: bank.color }}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{bank.bankName}</p>
              <p className="text-xs text-gray-500 dark:text-[#888888]">
                {bank.accountType === 'corriente' ? 'Corriente' : bank.accountType === 'ahorros' ? 'Ahorros' : 'Inversión'} | {bank.accountNumber}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-[#888888]">Saldo Actual</span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(bank.currentBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-[#888888]">Disponible</span>
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrencyAccounting(bank.availableBalance)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Movements */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Movimientos Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Banco</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Descripción</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Monto</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {recentMovements.map((mov, index) => (
                <motion.tr
                  key={mov.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                >
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{formatDate(mov.date)}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white">{mov.bankName}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">{mov.description}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                        mov.type === 'ingreso'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      )}
                    >
                      {mov.type === 'ingreso' ? (
                        <ArrowDownRight className="h-3 w-3" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" />
                      )}
                      {mov.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={cn(
                        'font-mono text-sm font-medium',
                        mov.type === 'ingreso' ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {mov.type === 'ingreso' ? '+' : '-'}{formatCurrencyAccounting(mov.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(mov.balance)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Flow Projection */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Proyección de Flujo de Efectivo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Período</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Ingresos Esperados</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Gastos Esperados</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Flujo Neto</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {projections.map((proj, index) => (
                <tr key={proj.period} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                  <td className="px-4 py-2.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{proj.period}</p>
                    <p className="text-[10px] text-gray-500 dark:text-[#888888]">
                      {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-mono text-sm text-emerald-600">{formatCurrencyAccounting(proj.expectedIncome)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-mono text-sm text-red-600">{formatCurrencyAccounting(proj.expectedExpenses)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-mono text-sm font-semibold',
                        proj.netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {proj.netFlow >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCurrencyAccounting(proj.netFlow)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrencyAccounting(proj.cumulativeBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <CustomModalHeader onClose={() => setIsOpen(false)}>
              <Plus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Emitir Pago
          </CustomModalHeader>
          <CustomModalBody className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Banco</label>
                <select
                  value={paymentBank}
                  onChange={(e) => setPaymentBank(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Seleccionar banco...</option>
                  {activeBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bankName} ({bank.accountNumber}) - {formatCurrencyAccounting(bank.availableBalance)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 font-mono text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Referencia del pago"
                    className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiario</label>
                <input
                  type="text"
                  value={paymentBeneficiary}
                  onChange={(e) => setPaymentBeneficiary(e.target.value)}
                  placeholder="Nombre del beneficiario"
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Concepto</label>
                <input
                  type="text"
                  value={paymentConcept}
                  onChange={(e) => setPaymentConcept(e.target.value)}
                  placeholder="Concepto del pago"
                  className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </CustomModalBody>
          <CustomModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onPress={handleEmitPayment} className="bg-purple-600 text-white">
              Emitir Pago
            </Button>
          </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
