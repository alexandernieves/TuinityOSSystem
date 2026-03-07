'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import {
  Lock,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar,
  AlertTriangle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  MOCK_MONTHLY_CLOSES,
  formatCurrencyAccounting,
  subscribeMonthlyCloses,
  getMonthlyClosesData,
  updateMonthlyClose,
} from '@/lib/mock-data/accounting';
import {
  CLOSE_STATUS_LABELS,
  CLOSE_STATUS_CONFIG,
} from '@/lib/types/accounting';
import type { MonthlyClose, CloseStatus } from '@/lib/types/accounting';

type TabType = 'mensual' | 'anual';

export default function CierresPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canCloseMonthlyPeriod = checkPermission('canCloseMonthlyPeriod');
  const canCloseAnnualPeriod = checkPermission('canCloseAnnualPeriod');

  const monthlyCloses = useStore(subscribeMonthlyCloses, getMonthlyClosesData);

  const [activeTab, setActiveTab] = useState<TabType>('mensual');
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const sortedCloses = useMemo(
    () => [...MOCK_MONTHLY_CLOSES].sort((a, b) => b.period.localeCompare(a.period)),
    [monthlyCloses]
  );

  const selectedClose = useMemo(
    () => MOCK_MONTHLY_CLOSES.find((c) => c.period === selectedPeriod),
    [selectedPeriod, monthlyCloses]
  );

  const closedMonthsCount = MOCK_MONTHLY_CLOSES.filter((c) => c.status === 'cerrado').length;
  const annualProgress = (closedMonthsCount / 12) * 100;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isChecklistComplete = useMemo(() => {
    if (!selectedClose) return false;
    return selectedClose.checklist.every((item) =>
      item.isCompleted || checklist[item.id]
    );
  }, [selectedClose, checklist]);

  const toggleChecklistItem = (itemId: string) => {
    setChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleMonthlyClose = () => {
    if (!isChecklistComplete) {
      toast.error('Checklist incompleto', {
        description: 'Debes completar todos los items antes de ejecutar el cierre.',
      });
      return;
    }
    if (selectedClose) {
      updateMonthlyClose(selectedClose.id, {
        status: 'cerrado',
        closedBy: 'USR-001',
        closedByName: 'Usuario',
        closedAt: new Date().toISOString(),
      });
    }
    toast.success('Cierre mensual ejecutado', {
      description: `El cierre de ${selectedClose?.monthName} se ha ejecutado exitosamente.`,
    });
  };

  const handleAnnualClose = () => {
    toast.success('Cierre anual ejecutado', {
      description: 'El cierre del año fiscal 2025 se ha ejecutado exitosamente.',
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
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cierres Contables</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-1 w-fit">
        <button
          onClick={() => setActiveTab('mensual')}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-all',
            activeTab === 'mensual'
              ? 'bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Cierre Mensual
        </button>
        <button
          onClick={() => setActiveTab('anual')}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-all',
            activeTab === 'anual'
              ? 'bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Cierre Anual
        </button>
      </div>

      {/* Cierre Mensual */}
      {activeTab === 'mensual' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Timeline */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Períodos</h3>
            <div className="space-y-2">
              {sortedCloses.map((close, index) => {
                const config = CLOSE_STATUS_CONFIG[close.status];
                const isSelected = selectedPeriod === close.period;

                return (
                  <motion.button
                    key={close.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedPeriod(close.period)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800'
                        : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        close.status === 'cerrado' && 'bg-emerald-100 dark:bg-emerald-950',
                        close.status === 'en_proceso' && 'bg-blue-100 dark:bg-blue-950',
                        close.status === 'abierto' && 'bg-amber-100 dark:bg-amber-950'
                      )}
                    >
                      {close.status === 'cerrado' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{close.monthName}</p>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          config.bg,
                          config.text
                        )}
                      >
                        <span className={cn('h-1 w-1 rounded-full', config.dot)} />
                        {CLOSE_STATUS_LABELS[close.status]}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-gray-500 dark:text-[#888888]">
                      {close.totalEntries} asientos
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selectedClose ? (
              <motion.div
                key={selectedClose.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Period Header */}
                <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedClose.monthName}</h3>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          CLOSE_STATUS_CONFIG[selectedClose.status].bg,
                          CLOSE_STATUS_CONFIG[selectedClose.status].text
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', CLOSE_STATUS_CONFIG[selectedClose.status].dot)} />
                        {CLOSE_STATUS_LABELS[selectedClose.status]}
                      </span>
                    </div>
                    {selectedClose.closedByName && (
                      <div className="text-right text-xs text-gray-500 dark:text-[#888888]">
                        <p className="flex items-center gap-1 justify-end">
                          <User className="h-3 w-3" />
                          Cerrado por {selectedClose.closedByName}
                        </p>
                        {selectedClose.closedAt && (
                          <p>{formatDate(selectedClose.closedAt)}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-3 text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedClose.totalEntries}</p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">Total Asientos</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-3 text-center">
                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrencyAccounting(selectedClose.totalDebit)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">Total Débito</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-3 text-center">
                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrencyAccounting(selectedClose.totalCredit)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">Total Crédito</p>
                  </div>
                </div>

                {/* Checklist */}
                {selectedClose.status !== 'cerrado' && (
                  <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                      Pre-cierre: Verificación
                    </h4>
                    <div className="space-y-2">
                      {selectedClose.checklist.map((item) => {
                        const isChecked = item.isCompleted || checklist[item.id];
                        return (
                          <button
                            key={item.id}
                            onClick={() => !item.isCompleted && toggleChecklistItem(item.id)}
                            disabled={item.isCompleted}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                              isChecked
                                ? 'bg-emerald-50 dark:bg-emerald-950/20'
                                : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-5 w-5 items-center justify-center rounded border transition-all',
                                isChecked
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-gray-300 dark:border-[#444444]'
                              )}
                            >
                              {isChecked && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span
                              className={cn(
                                'text-sm',
                                isChecked
                                  ? 'text-emerald-700 dark:text-emerald-300 line-through'
                                  : 'text-gray-700 dark:text-gray-300'
                              )}
                            >
                              {item.description}
                            </span>
                            {item.completedBy && (
                              <span className="ml-auto text-[10px] text-gray-400 dark:text-[#666666]">
                                {item.completedBy}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {canCloseMonthlyPeriod && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={handleMonthlyClose}
                          disabled={!isChecklistComplete}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors',
                            isChecklistComplete
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-gray-400 dark:bg-[#444444] cursor-not-allowed'
                          )}
                        >
                          <Lock className="h-4 w-4" />
                          Ejecutar Cierre
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Closed Month Summary */}
                {selectedClose.status === 'cerrado' && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Período cerrado exitosamente
                      </span>
                    </div>
                    {selectedClose.closedByName && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        Cerrado por {selectedClose.closedByName}
                        {selectedClose.closedAt && ` el ${formatDate(selectedClose.closedAt)}`}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-20">
                <Calendar className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
                <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Selecciona un período</h3>
                <p className="text-sm text-gray-500 dark:text-[#888888]">Haz clic en un mes de la lista para ver su detalle</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cierre Anual */}
      {activeTab === 'anual' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Cierre Anual 2025</h3>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progreso de cierres mensuales</span>
                <span className="font-medium text-gray-900 dark:text-white">{closedMonthsCount} / 12 meses</span>
              </div>
              <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-[#2a2a2a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${annualProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-[#888888]">
                {closedMonthsCount < 12
                  ? `Faltan ${12 - closedMonthsCount} meses por cerrar para poder ejecutar el cierre anual.`
                  : 'Todos los meses del año han sido cerrados. Puede ejecutar el cierre anual.'}
              </p>
            </div>

            {/* Monthly Status Grid */}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const close = MOCK_MONTHLY_CLOSES.find((c) => c.month === month && c.year === 2025) ||
                  MOCK_MONTHLY_CLOSES.find((c) => c.month === month);
                const isClosed = close?.status === 'cerrado';

                return (
                  <div
                    key={month}
                    className={cn(
                      'flex flex-col items-center rounded-lg p-2 text-center border',
                      isClosed
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]'
                    )}
                  >
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{monthNames[i]}</span>
                    {isClosed ? (
                      <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="mt-1 h-4 w-4 text-gray-300 dark:text-[#444444]" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Annual Close Info */}
            <div className="mt-6 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Requisitos para el cierre anual
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>- Todos los 12 meses del ejercicio fiscal deben estar cerrados</li>
                    <li>- El cierre genera automáticamente el asiento de cierre de resultados</li>
                    <li>- Las utilidades se trasladan a Utilidades Retenidas</li>
                    <li>- Solo la gerencia puede ejecutar el cierre anual</li>
                  </ul>
                </div>
              </div>
            </div>

            {canCloseAnnualPeriod && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAnnualClose}
                  disabled={closedMonthsCount < 12}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors',
                    closedMonthsCount >= 12
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-gray-400 dark:bg-[#444444] cursor-not-allowed'
                  )}
                >
                  <Lock className="h-4 w-4" />
                  Ejecutar Cierre Anual
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
