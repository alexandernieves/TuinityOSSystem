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
  FileText,
  Printer,
  Mail,
  Building2,
  Ban,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CLIENTS } from '@/lib/mock-data/clients';
import {
  getPendingInvoicesForClient,
  getPayments,
  getCxCTransactions,
  formatCurrencyCxC,
  subscribeReceivables,
  subscribePayments,
  subscribeCxCTransactions,
  getReceivablesData,
} from '@/lib/mock-data/accounts-receivable';
import { formatDate } from '@/lib/mock-data/sales-orders';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  CXC_TRANSACTION_TYPE_LABELS,
} from '@/lib/types/accounts-receivable';

export default function EstadosCuentaPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canSendStatements = checkPermission('canSendStatements');
  const canAccessCxC = checkPermission('canAccessCxC');

  useStore(subscribeReceivables, getReceivablesData);
  useStore(subscribePayments, () => null);
  useStore(subscribeCxCTransactions, () => null);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().split('T')[0]);

  // Clients with balance
  const clientsWithBalance = useMemo(() => {
    return MOCK_CLIENTS.filter((c) => {
      const invoices = getPendingInvoicesForClient(c.id);
      return invoices.length > 0;
    });
  }, []);

  const selectedClient = MOCK_CLIENTS.find((c) => c.id === selectedClientId);

  // Client transactions
  const clientTransactions = useMemo(() => {
    if (!selectedClientId) return [];
    return getCxCTransactions({ clientId: selectedClientId })
      .filter((t) => t.date <= `${cutoffDate}T23:59:59Z`)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedClientId, cutoffDate]);

  const pendingInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    return getPendingInvoicesForClient(selectedClientId);
  }, [selectedClientId]);

  const totalBalance = pendingInvoices.reduce((s, i) => s + i.balance, 0);
  const totalDebits = clientTransactions.reduce((s, t) => s + t.debit, 0);
  const totalCredits = clientTransactions.reduce((s, t) => s + t.credit, 0);

  const handlePrint = () => {
    toast.info('Imprimir Estado de Cuenta', {
      description: 'La funcion de impresion estara disponible proximamente.',
    });
  };

  const handleSendEmail = () => {
    if (!canSendStatements) {
      toast.error('Sin permisos', { description: 'No tienes permisos para enviar estados de cuenta.' });
      return;
    }
    toast.success('Email enviado', {
      description: `Estado de cuenta enviado a ${selectedClient?.contacts[0]?.email || 'el contacto principal'}.`,
    });
  };

  if (!canAccessCxC) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Ban className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Acceso restringido</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para ver estados de cuenta.</p>
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/clientes/cxc')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Estados de Cuenta</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Generar y enviar estados de cuenta a clientes</p>
        </div>
      </div>

      {/* Selector */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Parametros</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cliente
            </label>
            <Select
              placeholder="Seleccionar cliente..."
              variant="bordered"
              selectedKeys={selectedClientId ? [selectedClientId] : []}
              onSelectionChange={(keys) => setSelectedClientId(Array.from(keys)[0] as string)}
            >
              {clientsWithBalance.map((c) => (
                <SelectItem key={c.id}>
                  {c.name} ({c.id})
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha de Corte
            </label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Statement Preview */}
      {selectedClient && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handlePrint}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            {canSendStatements && (
              <button
                onClick={handleSendEmail}
                className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                <Mail className="h-4 w-4" />
                Enviar por Email
              </button>
            )}
          </div>

          {/* Statement Document */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-8">
            {/* Statement Header */}
            <div className="mb-8 border-b border-gray-200 dark:border-[#2a2a2a] pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">ESTADO DE CUENTA</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-[#888888]">Evolution Trading Corp.</p>
                  <p className="text-xs text-gray-400 dark:text-[#666666]">Panama, Rep. de Panama</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#888888]">
                    <Calendar className="h-4 w-4" />
                    Fecha de corte: {cutoffDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-6 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">Cliente</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.name}</p>
                  <p className="text-sm text-gray-500 dark:text-[#888888]">{selectedClient.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">{selectedClient.taxIdType || 'Tax ID'}</p>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedClient.taxId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">Direccion</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.address}, {selectedClient.city}, {selectedClient.country}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">Contacto</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.contacts[0]?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-[#666666]">{selectedClient.contacts[0]?.email}</p>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            {clientTransactions.length > 0 ? (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Movimientos</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Fecha</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Tipo</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Documento</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Descripcion</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Debito</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Credito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {clientTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td className="px-2 py-2 text-xs text-gray-500 dark:text-[#888888]">{formatDate(txn.date)}</td>
                        <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400">{CXC_TRANSACTION_TYPE_LABELS[txn.type]}</td>
                        <td className="px-2 py-2 font-mono text-xs text-gray-900 dark:text-white">{txn.documentNumber}</td>
                        <td className="px-2 py-2 text-xs text-gray-500 dark:text-[#888888]">{txn.description}</td>
                        <td className="px-2 py-2 text-right font-mono text-xs text-gray-900 dark:text-white">
                          {txn.debit > 0 ? formatCurrencyCxC(txn.debit) : ''}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-xs text-emerald-500">
                          {txn.credit > 0 ? formatCurrencyCxC(txn.credit) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-[#3a3a3a]">
                      <td colSpan={4} className="px-2 py-2 text-right text-xs font-bold text-gray-900 dark:text-white">TOTALES</td>
                      <td className="px-2 py-2 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {formatCurrencyCxC(totalDebits)}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-xs font-bold text-emerald-500">
                        {formatCurrencyCxC(totalCredits)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="mb-6 flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-3 h-8 w-8 text-gray-300 dark:text-[#444444]" />
                <p className="text-sm text-gray-500 dark:text-[#888888]">No hay movimientos en el periodo seleccionado</p>
              </div>
            )}

            {/* Balance Summary */}
            <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">SALDO PENDIENTE</span>
                <span className={cn(
                  'font-mono text-2xl font-bold',
                  totalBalance > 0 ? 'text-red-500' : 'text-emerald-500'
                )}>
                  {formatCurrencyCxC(totalBalance)}
                </span>
              </div>
            </div>

            {/* Pending Invoices Detail */}
            {pendingInvoices.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Facturas Pendientes</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Factura</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Emision</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Vencimiento</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Monto Original</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Abonado</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {pendingInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-2 py-2 font-mono text-xs font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                        <td className="px-2 py-2 text-xs text-gray-500 dark:text-[#888888]">{formatDate(inv.issueDate)}</td>
                        <td className="px-2 py-2 text-xs text-gray-500 dark:text-[#888888]">
                          {formatDate(inv.dueDate)}
                          {inv.daysOverdue > 0 && (
                            <span className="ml-1 text-red-500">({inv.daysOverdue}d vencida)</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-xs text-gray-600 dark:text-gray-400">{formatCurrencyCxC(inv.originalAmount)}</td>
                        <td className="px-2 py-2 text-right font-mono text-xs text-emerald-500">
                          {inv.paidAmount > 0 ? formatCurrencyCxC(inv.paidAmount) : '-'}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">{formatCurrencyCxC(inv.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedClient && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-20">
          <FileText className="mb-4 h-12 w-12 text-gray-300 dark:text-[#444444]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Seleccione un cliente</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Elija un cliente para generar su estado de cuenta</p>
        </div>
      )}
    </motion.div>
  );
}
