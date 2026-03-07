'use client';

import { useState } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  ArrowLeft,
  Wallet,
  DollarSign,
  CreditCard,
  ArrowLeftRight,
  Plus,
  Lock,
  Unlock,
  Clock,
  User,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  MOCK_CASH_REGISTER,
  MOCK_CASH_MOVEMENTS,
  MOCK_CASH_CLOSINGS,
  getCashRegisterSummary,
  subscribeCashRegister,
  getCashRegisterData,
  subscribeCashMovements,
  getCashMovementsData,
  subscribeCashClosings,
  getCashClosingsData,
} from '@/lib/mock-data/pos';
import {
  CASH_MOVEMENT_TYPE_LABELS,
  CASH_REGISTER_STATUS_CONFIG,
} from '@/lib/types/pos';
import type { CashMovementType } from '@/lib/types/pos';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CajaPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  useStore(subscribeCashRegister, getCashRegisterData);
  useStore(subscribeCashMovements, getCashMovementsData);
  useStore(subscribeCashClosings, getCashClosingsData);

  const cashRegister = MOCK_CASH_REGISTER;
  const isCashOpen = cashRegister.status === 'abierta';
  const summary = getCashRegisterSummary();
  const statusCfg = CASH_REGISTER_STATUS_CONFIG[cashRegister.status];

  // Open cash modal
  const [isOpenCashOpen, setIsOpenCashOpen] = useState(false);
  const [initialFund, setInitialFund] = useState('200');
  const [openNotes, setOpenNotes] = useState('');

  // New movement modal
  const [isMovOpen, setIsMovOpen] = useState(false);
  const [movType, setMovType] = useState<CashMovementType>('entrada');
  const [movAmount, setMovAmount] = useState('');
  const [movReason, setMovReason] = useState('');

  // Close cash modal
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeObs, setCloseObs] = useState('');

  const expectedCash = summary.expectedCash;
  const actualCashNum = parseFloat(actualCash) || 0;
  const difference = actualCashNum - expectedCash;

  const handleOpenCash = () => {
    toast.success('Caja abierta exitosamente', { id: 'open-cash', description: `Fondo inicial: ${formatCurrency(parseFloat(initialFund) || 200)}` });
    setIsOpenCashOpen(false);
  };

  const handleNewMovement = () => {
    if (!movAmount || !movReason) {
      toast.error('Completa todos los campos', { id: 'mov-error' });
      return;
    }
    toast.success('Movimiento registrado', { id: 'new-movement', description: `${CASH_MOVEMENT_TYPE_LABELS[movType]}: ${formatCurrency(parseFloat(movAmount))}` });
    setIsMovOpen(false);
    setMovAmount('');
    setMovReason('');
  };

  const handleCloseCash = () => {
    toast.success('Caja cerrada exitosamente', { id: 'close-cash', description: `Diferencia: ${formatCurrency(difference)}` });
    setIsCloseOpen(false);
  };

  if (!checkPermission('canOpenCloseCash')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para gestionar la caja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ventas/pos')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gestion de Caja</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">{cashRegister.name} - {cashRegister.location}</p>
          </div>
        </div>
      </div>

      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              isCashOpen ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-amber-100 dark:bg-amber-950'
            )}>
              {isCashOpen ? <Unlock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> : <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusCfg.bg, statusCfg.text
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                  {statusCfg.label}
                </span>
              </div>
              {isCashOpen && cashRegister.currentOpening && (
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-[#888888]">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {cashRegister.currentOpening.openedByName}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(cashRegister.currentOpening.openedAt)}</span>
                  <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> Fondo: {formatCurrency(cashRegister.currentOpening.initialFund)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isCashOpen ? (
              <Button color="success" className="font-bold" onPress={() => setIsOpenCashOpen(true)}>
                <Unlock className="h-4 w-4" /> Abrir Caja
              </Button>
            ) : (
              <>
                <Button variant="bordered" size="sm" onPress={() => setIsMovOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Nuevo Movimiento
                </Button>
                <Button color="danger" variant="flat" size="sm" onPress={() => setIsCloseOpen(true)}>
                  <Lock className="h-3.5 w-3.5" /> Cerrar Caja
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Summary Cards (only when open) */}
      {isCashOpen && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Ventas Hoy', value: summary.totalSalesToday, icon: DollarSign, color: 'emerald' },
            { label: 'Ventas Efectivo', value: summary.cashSalesToday, icon: Banknote, color: 'green' },
            { label: 'Ventas Tarjeta', value: summary.cardSalesToday, icon: CreditCard, color: 'blue' },
            { label: 'Transferencias', value: summary.transferSalesToday, icon: ArrowLeftRight, color: 'violet' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-[#888888]">{stat.label}</span>
              </div>
              <p className="font-mono text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stat.value)}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cash Movements Table */}
      {isCashOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Movimientos de Caja</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Tipo</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Monto</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Motivo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Fecha</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {MOCK_CASH_MOVEMENTS.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-[#888888]">{mov.id}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        mov.type === 'entrada' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
                        mov.type === 'salida' && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
                        mov.type === 'retiro_parcial' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                      )}>
                        {mov.type === 'entrada' ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                        {CASH_MOVEMENT_TYPE_LABELS[mov.type]}
                      </span>
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono text-sm font-semibold',
                      mov.type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {mov.type === 'entrada' ? '+' : '-'}{formatCurrency(mov.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{mov.reason}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDateTime(mov.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{mov.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Historical Closings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
      >
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Cierres de Caja Historicos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">ID</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Fecha</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Cajero</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Ventas</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Diferencia</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {MOCK_CASH_CLOSINGS.map((closing) => (
                <tr key={closing.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-[#888888]">{closing.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(closing.closedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{closing.closedByName}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(closing.totalSales)}</td>
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

      {/* Open Cash Modal */}
      <CustomModal isOpen={isOpenCashOpen} onClose={() => setIsOpenCashOpen(false)} size="sm">
        <CustomModalHeader onClose={() => setIsOpenCashOpen(false)}>
          <Unlock className="h-5 w-5 text-emerald-600" /> Abrir Caja
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Fondo Inicial ($)</label>
            <input type="number" step="0.01" value={initialFund} onChange={(e) => setInitialFund(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 font-mono text-lg text-gray-900 dark:text-white text-center focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Notas (opcional)</label>
            <textarea value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Observaciones de apertura..." />
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" size="sm" onPress={() => setIsOpenCashOpen(false)}>Cancelar</Button>
          <Button color="success" size="sm" onPress={handleOpenCash}>Abrir Caja</Button>
        </CustomModalFooter>
      </CustomModal>

      {/* New Movement Modal */}
      <CustomModal isOpen={isMovOpen} onClose={() => setIsMovOpen(false)} size="sm">
        <CustomModalHeader onClose={() => setIsMovOpen(false)}>
          <Wallet className="h-5 w-5 text-blue-600" /> Nuevo Movimiento
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['entrada', 'salida', 'retiro_parcial'] as CashMovementType[]).map((t) => (
                <button key={t} onClick={() => setMovType(t)}
                  className={cn('rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                    movType === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                  )}>{CASH_MOVEMENT_TYPE_LABELS[t]}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Monto ($)</label>
            <input type="number" step="0.01" value={movAmount} onChange={(e) => setMovAmount(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 font-mono text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="0.00" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Motivo</label>
            <input type="text" value={movReason} onChange={(e) => setMovReason(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Razon del movimiento..." />
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" size="sm" onPress={() => setIsMovOpen(false)}>Cancelar</Button>
          <Button color="primary" size="sm" onPress={handleNewMovement}>Registrar</Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Close Cash Modal */}
      <CustomModal isOpen={isCloseOpen} onClose={() => setIsCloseOpen(false)} size="md" scrollable>
        <CustomModalHeader onClose={() => setIsCloseOpen(false)}>
          <Lock className="h-5 w-5 text-red-600" /> Cerrar Caja
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resumen de Ventas</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500 dark:text-[#888888]">Ventas Brutas</span>
              <span className="text-right font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(summary.totalSalesToday)}</span>
              <span className="text-gray-500 dark:text-[#888888]">Devoluciones</span>
              <span className="text-right font-mono text-red-500">{formatCurrency(0)}</span>
              <span className="text-gray-500 dark:text-[#888888]">Descuentos</span>
              <span className="text-right font-mono text-red-500">{formatCurrency(0)}</span>
              <span className="font-medium text-gray-900 dark:text-white">Ventas Netas</span>
              <span className="text-right font-mono font-bold text-emerald-600">{formatCurrency(summary.totalSalesToday)}</span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Desglose por Metodo</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500 dark:text-[#888888]">Efectivo</span>
              <span className="text-right font-mono text-gray-900 dark:text-white">{formatCurrency(summary.cashSalesToday)}</span>
              <span className="text-gray-500 dark:text-[#888888]">Tarjetas</span>
              <span className="text-right font-mono text-gray-900 dark:text-white">{formatCurrency(summary.cardSalesToday)}</span>
              <span className="text-gray-500 dark:text-[#888888]">Transferencias</span>
              <span className="text-right font-mono text-gray-900 dark:text-white">{formatCurrency(summary.transferSalesToday)}</span>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Arqueo de Caja</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-[#888888]">Efectivo Esperado</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(expectedCash)}</span>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Efectivo Contado</label>
              <input type="number" step="0.01" value={actualCash} onChange={(e) => setActualCash(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 font-mono text-lg text-gray-900 dark:text-white text-center focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0.00" />
            </div>
            {actualCash && (
              <div className={cn('flex items-center justify-between rounded-lg p-3',
                difference === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30')}>
                <span className={cn('text-sm font-medium', difference === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
                  {difference === 0 ? 'Cuadre perfecto' : difference > 0 ? 'Sobrante' : 'Faltante'}
                </span>
                <span className={cn('font-mono text-lg font-bold', difference === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
                  {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Observaciones</label>
            <textarea value={closeObs} onChange={(e) => setCloseObs(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Observaciones del cierre..." />
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" size="sm" onPress={() => setIsCloseOpen(false)}>Cancelar</Button>
          <Button color="danger" size="sm" onPress={handleCloseCash} isDisabled={!actualCash}>
            <Lock className="h-4 w-4" /> Confirmar Cierre
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
