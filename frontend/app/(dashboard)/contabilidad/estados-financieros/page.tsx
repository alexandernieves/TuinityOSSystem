'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/hooks/use-store';
import { motion } from 'framer-motion';
import { Tabs, Tab } from '@heroui/react';
import {
  BarChart3,
  ChevronRight,
  Download,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  getPLStatement,
  MOCK_ACCOUNTS,
  MOCK_BANK_ACCOUNTS,
  formatCurrencyAccounting,
  getCashFlowProjections,
  subscribeAccounts,
  getAccountsData,
  subscribeBankAccounts,
  getBankAccountsData,
} from '@/lib/mock-data/accounting';
import type { FinancialStatementLine } from '@/lib/types/accounting';

type StatementTab = 'estado_resultados' | 'balance_general' | 'flujo_efectivo';
type PeriodType = 'mensual' | 'trimestral' | 'anual';

export default function EstadosFinancierosPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canViewFinancialStatements = checkPermission('canViewFinancialStatements');

  useStore(subscribeAccounts, getAccountsData);
  useStore(subscribeBankAccounts, getBankAccountsData);

  const [activeTab, setActiveTab] = useState<StatementTab>('estado_resultados');
  const [period, setPeriod] = useState<PeriodType>('mensual');

  const plLines = useMemo(() => getPLStatement(), []);

  const handleExport = () => {
    toast.success('Exportando estado financiero', {
      description: 'El archivo se descargará en breve.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (amount: number) => {
    if (amount < 0) {
      return `(${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Balance General mock data
  const balanceGeneral = {
    activos: [
      { label: 'ACTIVOS', amount: 2850000, level: 0, isTotal: false, isBold: true },
      { label: 'Activo Corriente', amount: 1950000, level: 1, isTotal: false, isBold: true },
      { label: 'Caja General', amount: 15000, level: 2, isTotal: false, isBold: false },
      { label: 'Bancos', amount: 485000, level: 2, isTotal: false, isBold: false },
      { label: 'Cuentas por Cobrar', amount: 258802, level: 2, isTotal: false, isBold: false },
      { label: 'Inventario de Mercancías', amount: 1150000, level: 2, isTotal: false, isBold: false },
      { label: 'Anticipos a Proveedores', amount: 41198, level: 2, isTotal: false, isBold: false },
      { label: 'Total Activo Corriente', amount: 1950000, level: 1, isTotal: true, isBold: true },
      { label: 'Activo No Corriente', amount: 900000, level: 1, isTotal: false, isBold: true },
      { label: 'Mobiliario y Equipo', amount: 350000, level: 2, isTotal: false, isBold: false },
      { label: 'Vehículos', amount: 280000, level: 2, isTotal: false, isBold: false },
      { label: 'Depreciación Acumulada', amount: -120000, level: 2, isTotal: false, isBold: false },
      { label: 'Mejoras en Local Arrendado', amount: 390000, level: 2, isTotal: false, isBold: false },
      { label: 'Total Activo No Corriente', amount: 900000, level: 1, isTotal: true, isBold: true },
      { label: 'TOTAL ACTIVOS', amount: 2850000, level: 0, isTotal: true, isBold: true },
    ],
    pasivosPatrimonio: [
      { label: 'PASIVOS', amount: 980000, level: 0, isTotal: false, isBold: true },
      { label: 'Pasivo Corriente', amount: 680000, level: 1, isTotal: false, isBold: true },
      { label: 'Cuentas por Pagar', amount: 420000, level: 2, isTotal: false, isBold: false },
      { label: 'Impuestos por Pagar', amount: 35000, level: 2, isTotal: false, isBold: false },
      { label: 'Salarios por Pagar', amount: 85000, level: 2, isTotal: false, isBold: false },
      { label: 'Comisiones por Pagar', amount: 28000, level: 2, isTotal: false, isBold: false },
      { label: 'Anticipos de Clientes', amount: 112000, level: 2, isTotal: false, isBold: false },
      { label: 'Total Pasivo Corriente', amount: 680000, level: 1, isTotal: true, isBold: true },
      { label: 'Pasivo No Corriente', amount: 300000, level: 1, isTotal: false, isBold: true },
      { label: 'Préstamos Bancarios L/P', amount: 300000, level: 2, isTotal: false, isBold: false },
      { label: 'Total Pasivo No Corriente', amount: 300000, level: 1, isTotal: true, isBold: true },
      { label: 'TOTAL PASIVOS', amount: 980000, level: 0, isTotal: true, isBold: true },
      { label: '', amount: 0, level: 0, isTotal: false, isBold: false },
      { label: 'PATRIMONIO', amount: 1870000, level: 0, isTotal: false, isBold: true },
      { label: 'Capital Social', amount: 1000000, level: 2, isTotal: false, isBold: false },
      { label: 'Utilidades Retenidas', amount: 650000, level: 2, isTotal: false, isBold: false },
      { label: 'Utilidad del Ejercicio', amount: 220000, level: 2, isTotal: false, isBold: false },
      { label: 'TOTAL PATRIMONIO', amount: 1870000, level: 0, isTotal: true, isBold: true },
      { label: '', amount: 0, level: 0, isTotal: false, isBold: false },
      { label: 'TOTAL PASIVOS + PATRIMONIO', amount: 2850000, level: 0, isTotal: true, isBold: true },
    ],
  };

  // Flujo de Efectivo mock data
  const flujoEfectivo = {
    operaciones: [
      { label: 'ACTIVIDADES DE OPERACIÓN', amount: 0, level: 0, isTotal: false, isBold: true },
      { label: 'Utilidad Neta', amount: 220000, level: 1, isTotal: false, isBold: false },
      { label: 'Depreciación y Amortización', amount: 40000, level: 1, isTotal: false, isBold: false },
      { label: 'Aumento en Cuentas por Cobrar', amount: -45000, level: 1, isTotal: false, isBold: false },
      { label: 'Aumento en Inventarios', amount: -85000, level: 1, isTotal: false, isBold: false },
      { label: 'Aumento en Cuentas por Pagar', amount: 32000, level: 1, isTotal: false, isBold: false },
      { label: 'Flujo Neto de Operaciones', amount: 162000, level: 0, isTotal: true, isBold: true },
    ],
    inversion: [
      { label: 'ACTIVIDADES DE INVERSIÓN', amount: 0, level: 0, isTotal: false, isBold: true },
      { label: 'Compra de Equipo', amount: -25000, level: 1, isTotal: false, isBold: false },
      { label: 'Mejoras en Local', amount: -15000, level: 1, isTotal: false, isBold: false },
      { label: 'Flujo Neto de Inversión', amount: -40000, level: 0, isTotal: true, isBold: true },
    ],
    financiamiento: [
      { label: 'ACTIVIDADES DE FINANCIAMIENTO', amount: 0, level: 0, isTotal: false, isBold: true },
      { label: 'Pago de Préstamos', amount: -50000, level: 1, isTotal: false, isBold: false },
      { label: 'Flujo Neto de Financiamiento', amount: -50000, level: 0, isTotal: true, isBold: true },
    ],
    total: 72000,
  };

  const renderStatementLine = (line: { label: string; amount: number; level: number; isTotal: boolean; isBold: boolean }, index: number) => {
    if (!line.label) {
      return <tr key={index} className="h-4"><td colSpan={2} /></tr>;
    }

    const isUtilidad = line.label.includes('UTILIDAD OPERATIVA');

    return (
      <tr
        key={index}
        className={cn(
          line.isTotal && 'border-t border-gray-300 dark:border-[#2a2a2a]',
          isUtilidad && 'bg-emerald-50 dark:bg-emerald-950/20'
        )}
      >
        <td
          className={cn(
            'py-2 pr-4',
            line.isBold ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
            line.isTotal && 'font-bold',
            isUtilidad && 'text-emerald-700 dark:text-emerald-300 font-bold'
          )}
          style={{ paddingLeft: `${16 + line.level * 24}px` }}
        >
          {line.label}
        </td>
        <td
          className={cn(
            'py-2 text-right font-mono',
            line.isBold ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
            line.isTotal && 'font-bold',
            line.amount < 0 && 'text-red-600 dark:text-red-400',
            isUtilidad && 'text-emerald-700 dark:text-emerald-300 font-bold text-lg'
          )}
        >
          {line.level === 0 && !line.isTotal ? '' : `$${formatAmount(line.amount)}`}
        </td>
      </tr>
    );
  };

  const periods: { key: PeriodType; label: string }[] = [
    { key: 'mensual', label: 'Mensual' },
    { key: 'trimestral', label: 'Trimestral' },
    { key: 'anual', label: 'Anual' },
  ];

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
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Estados Financieros</h1>
          </div>
        </div>
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
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-1">
          {[
            { key: 'estado_resultados' as StatementTab, label: 'Estado de Resultados' },
            { key: 'balance_general' as StatementTab, label: 'Balance General' },
            { key: 'flujo_efectivo' as StatementTab, label: 'Flujo de Efectivo' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                period === p.key
                  ? 'bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statement Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
      >
        {/* Statement Header */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-5 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-[#888888]">EVOLUTION IMPORTADORA, S.A.</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {activeTab === 'estado_resultados' && 'Estado de Resultados'}
            {activeTab === 'balance_general' && 'Balance General'}
            {activeTab === 'flujo_efectivo' && 'Estado de Flujo de Efectivo'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#888888]">
            {period === 'mensual' && 'Febrero 2026'}
            {period === 'trimestral' && 'Q1 2026 (Ene - Mar)'}
            {period === 'anual' && 'Año Fiscal 2026'}
          </p>
          <p className="text-xs text-gray-400 dark:text-[#666666]">Cifras expresadas en dólares americanos (USD)</p>
        </div>

        <div className="p-5">
          {/* Estado de Resultados */}
          {activeTab === 'estado_resultados' && (
            <table className="w-full">
              <tbody>
                {plLines.map((line, index) => renderStatementLine(line, index))}
              </tbody>
            </table>
          )}

          {/* Balance General */}
          {activeTab === 'balance_general' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <table className="w-full">
                  <tbody>
                    {balanceGeneral.activos.map((line, index) => renderStatementLine(line, index))}
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full">
                  <tbody>
                    {balanceGeneral.pasivosPatrimonio.map((line, index) => renderStatementLine(line, index))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flujo de Efectivo */}
          {activeTab === 'flujo_efectivo' && (
            <div>
              <table className="w-full">
                <tbody>
                  {flujoEfectivo.operaciones.map((line, index) => renderStatementLine(line, index))}
                  <tr className="h-4"><td colSpan={2} /></tr>
                  {flujoEfectivo.inversion.map((line, index) => renderStatementLine(line, index + 100))}
                  <tr className="h-4"><td colSpan={2} /></tr>
                  {flujoEfectivo.financiamiento.map((line, index) => renderStatementLine(line, index + 200))}
                  <tr className="h-4"><td colSpan={2} /></tr>
                  <tr className="border-t-2 border-gray-400 dark:border-gray-600 bg-blue-50 dark:bg-blue-950/20">
                    <td className="py-3 pl-4 text-base font-bold text-blue-800 dark:text-blue-300">
                      FLUJO NETO DEL PERÍODO
                    </td>
                    <td className="py-3 text-right font-mono text-base font-bold text-blue-800 dark:text-blue-300">
                      ${formatAmount(flujoEfectivo.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
