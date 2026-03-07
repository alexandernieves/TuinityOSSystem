'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import {
  ArrowLeft,
  DollarSign,
  Search,
  Check,
  AlertCircle,
  Ban,
  CreditCard,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CLIENTS } from '@/lib/mock-data/clients';
import {
  getPendingInvoicesForClient,
  formatCurrencyCxC,
  addPayment,
  updateReceivable,
  addCxCTransaction,
} from '@/lib/mock-data/accounts-receivable';
import { formatDate } from '@/lib/mock-data/sales-orders';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import type { PaymentMethod } from '@/lib/types/accounts-receivable';
import {
  PAYMENT_METHOD_LABELS,
  CXC_STATUS_LABELS,
  CXC_STATUS_CONFIG,
} from '@/lib/types/accounts-receivable';

const PAYMENT_METHODS: PaymentMethod[] = ['transferencia', 'cheque', 'efectivo', 'tarjeta', 'deposito'];

const MOCK_BANKS = [
  { id: 'BK-001', name: 'Banesco' },
  { id: 'BK-002', name: 'Banistmo' },
  { id: 'BK-004', name: 'Multibank' },
  { id: 'BK-006', name: 'Banco General' },
  { id: 'BK-007', name: 'BAC Credomatic' },
];

export default function RegistrarCobroPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canRegisterPayments = checkPermission('canRegisterPayments');

  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Client selection
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Step 2: Invoice selection
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());

  // Step 3: Payment details
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [bankId, setBankId] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtered clients with outstanding balance
  const clientsWithBalance = useMemo(() => {
    const clientIds = new Set(
      MOCK_CLIENTS.filter((c) => c.creditUsed > 0 || c.status === 'blocked').map((c) => c.id)
    );
    return MOCK_CLIENTS.filter((c) => {
      const matchesSearch = !clientSearch ||
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(clientSearch.toLowerCase());
      return matchesSearch && (clientIds.has(c.id) || getPendingInvoicesForClient(c.id).length > 0);
    });
  }, [clientSearch]);

  const selectedClient = MOCK_CLIENTS.find((c) => c.id === selectedClientId);

  const pendingInvoices = useMemo(() => {
    if (!selectedClientId) return [];
    return getPendingInvoicesForClient(selectedClientId);
  }, [selectedClientId]);

  const selectedInvoicesTotal = useMemo(() => {
    return pendingInvoices
      .filter((inv) => selectedInvoiceIds.has(inv.id))
      .reduce((sum, inv) => sum + inv.balance, 0);
  }, [pendingInvoices, selectedInvoiceIds]);

  const parsedAmount = parseFloat(paymentAmount) || 0;
  const amountExceeds = parsedAmount > selectedInvoicesTotal && selectedInvoicesTotal > 0;

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllInvoices = () => {
    if (selectedInvoiceIds.size === pendingInvoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(pendingInvoices.map((inv) => inv.id)));
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedInvoiceIds(new Set());
    setPaymentAmount('');
    setCurrentStep(2);
  };

  const handleProceedToPayment = () => {
    if (selectedInvoiceIds.size === 0) {
      toast.error('Seleccion requerida', { description: 'Seleccione al menos una factura para aplicar el cobro.' });
      return;
    }
    setPaymentAmount(selectedInvoicesTotal.toFixed(2));
    setCurrentStep(3);
  };

  const handleSubmit = () => {
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Monto invalido', { description: 'El monto del cobro debe ser mayor a cero.' });
      return;
    }
    if (amountExceeds) {
      toast.error('Monto excede saldo', { description: 'El monto no puede exceder la suma de las facturas seleccionadas.' });
      return;
    }
    if (!reference.trim() && paymentMethod !== 'efectivo') {
      toast.error('Referencia requerida', { description: 'Ingrese el numero de referencia del pago.' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      // Build payment applications (FIFO)
      const sortedInvoices = pendingInvoices
        .filter((inv) => selectedInvoiceIds.has(inv.id))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      let remaining = parsedAmount;
      const applications = sortedInvoices.map((inv, idx) => {
        const applied = Math.min(remaining, inv.balance);
        remaining = Math.max(0, remaining - inv.balance);
        const newBalance = inv.balance - applied;
        return { id: `APP-${Date.now()}-${idx}`, paymentId: '', accountReceivableId: inv.id, invoiceNumber: inv.invoiceNumber, amountApplied: applied, previousBalance: inv.balance, newBalance };
      });

      const paymentId = `COB-${String(Date.now()).slice(-5)}`;
      const selectedBank = MOCK_BANKS.find((b) => b.id === bankId);
      applications.forEach((a) => { a.paymentId = paymentId; });

      addPayment({
        id: paymentId,
        clientId: selectedClientId!,
        clientName: selectedClient?.name ?? '',
        date: `${paymentDate}T10:00:00Z`,
        amount: parsedAmount,
        method: paymentMethod,
        reference: reference || undefined,
        bankId: bankId || undefined,
        bankName: selectedBank?.name,
        applications,
        createdBy: 'USR-006',
        createdByName: 'Jakeira Chavez',
        createdAt: new Date().toISOString(),
        notes: paymentNotes || undefined,
      });

      // Update receivable balances
      applications.forEach((app) => {
        const newStatus = app.newBalance === 0 ? 'pagado' : 'parcial';
        updateReceivable(app.accountReceivableId, { paidAmount: app.previousBalance - app.newBalance, balance: app.newBalance, status: newStatus as any });
      });

      // Add transaction entry
      addCxCTransaction({
        id: `TXN-${Date.now()}`,
        date: `${paymentDate}T10:00:00Z`,
        type: 'cobro',
        documentNumber: paymentId,
        description: `Cobro de ${selectedClient?.name}`,
        debit: 0,
        credit: parsedAmount,
        balance: 0,
        clientId: selectedClientId!,
        clientName: selectedClient?.name ?? '',
      });

      toast.success('Cobro registrado exitosamente', {
        description: `Se registro un cobro de ${formatCurrencyCxC(parsedAmount)} para ${selectedClient?.name}.`,
      });
      setIsSaving(false);
      router.push('/clientes/cxc');
    }, 1000);
  };

  if (!canRegisterPayments) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Ban className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Acceso restringido</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para registrar cobros.</p>
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Registrar Cobro</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Paso {currentStep} de 3</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: 'Seleccionar Cliente' },
          { num: 2, label: 'Seleccionar Facturas' },
          { num: 3, label: 'Detalles del Cobro' },
        ].map((step, idx) => (
          <div key={step.num} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
              currentStep > step.num
                ? 'bg-emerald-500 text-white'
                : currentStep === step.num
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#666666]'
            )}>
              {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
            </div>
            <span className={cn(
              'hidden text-sm font-medium sm:inline',
              currentStep >= step.num ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-[#666666]'
            )}>
              {step.label}
            </span>
            {idx < 2 && (
              <div className={cn(
                'mx-2 h-px w-8 sm:w-16',
                currentStep > step.num ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#2a2a2a]'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Client */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o codigo..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2">
            {clientsWithBalance.map((client) => {
              const balance = getPendingInvoicesForClient(client.id).reduce((s, i) => s + i.balance, 0);
              return (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a]">
                      <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                      <p className="text-xs text-gray-500 dark:text-[#888888]">{client.id} - {client.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrencyCxC(balance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">saldo pendiente</p>
                  </div>
                </button>
              );
            })}
            {clientsWithBalance.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-12">
                <Search className="mb-3 h-8 w-8 text-gray-300 dark:text-[#444444]" />
                <p className="text-sm text-gray-500 dark:text-[#888888]">No se encontraron clientes con saldo pendiente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Invoices */}
      {currentStep === 2 && selectedClient && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedClient.name}</p>
                <p className="text-xs text-gray-500 dark:text-[#888888]">{selectedClient.id}</p>
              </div>
            </div>
            <button
              onClick={() => { setCurrentStep(1); setSelectedClientId(null); }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Cambiar cliente
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2a2a2a] p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Facturas Pendientes ({pendingInvoices.length})
              </h3>
              <button
                onClick={selectAllInvoices}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {selectedInvoiceIds.size === pendingInvoices.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                    <th className="w-12 px-4 py-2.5"></th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Factura</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Vencimiento</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Original</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Saldo</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {pendingInvoices.map((inv) => {
                    const isSelected = selectedInvoiceIds.has(inv.id);
                    const invStatus = CXC_STATUS_CONFIG[inv.status];
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => toggleInvoice(inv.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected ? 'bg-brand-500/5' : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <div className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                            isSelected
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-gray-300 dark:border-[#2a2a2a]'
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-[#888888]">
                          {formatDate(inv.dueDate)}
                          {inv.daysOverdue > 0 && (
                            <span className="ml-2 text-xs font-semibold text-red-500">({inv.daysOverdue}d)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-500 dark:text-[#888888]">
                          {formatCurrencyCxC(inv.originalAmount)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrencyCxC(inv.balance)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            invStatus.bg,
                            invStatus.text
                          )}>
                            {CXC_STATUS_LABELS[inv.status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                {selectedInvoiceIds.size} factura(s) seleccionada(s)
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Total: {formatCurrencyCxC(selectedInvoicesTotal)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="flat" onPress={() => setCurrentStep(1)}>
                Atras
              </Button>
              <Button
                color="primary"
                onPress={handleProceedToPayment}
                isDisabled={selectedInvoiceIds.size === 0}
                className="bg-brand-700"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment Details */}
      {currentStep === 3 && selectedClient && (
        <div className="space-y-4">
          {/* Client & Invoice Summary */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-[#888888]">Cliente</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedClient.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-[#888888]">{selectedInvoiceIds.size} factura(s)</p>
                <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">{formatCurrencyCxC(selectedInvoicesTotal)}</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <CreditCard className="h-5 w-5 text-brand-500" />
              Detalles del Cobro
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Monto del Cobro <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    variant="bordered"
                    startContent={<span className="text-gray-400">$</span>}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    color={amountExceeds ? 'danger' : 'default'}
                  />
                  {amountExceeds && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      El monto excede el total de las facturas seleccionadas
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Metodo de Pago <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder="Seleccionar metodo..."
                    variant="bordered"
                    selectedKeys={[paymentMethod]}
                    onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as PaymentMethod)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Banco
                  </label>
                  <Select
                    placeholder="Seleccionar banco..."
                    variant="bordered"
                    selectedKeys={bankId ? [bankId] : []}
                    onSelectionChange={(keys) => setBankId(Array.from(keys)[0] as string)}
                  >
                    {MOCK_BANKS.map((b) => (
                      <SelectItem key={b.id}>{b.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Referencia {paymentMethod !== 'efectivo' && <span className="text-red-500">*</span>}
                  </label>
                  <Input
                    placeholder="Numero de referencia, cheque, etc."
                    variant="bordered"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha del Cobro
                  </label>
                  <Input
                    type="date"
                    variant="bordered"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notas
                </label>
                <textarea
                  placeholder="Observaciones del cobro..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* FIFO Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
              Vista Previa de Aplicacion (FIFO)
            </h3>
            <div className="space-y-2">
              {(() => {
                let remaining = parsedAmount;
                const sortedInvoices = pendingInvoices
                  .filter((inv) => selectedInvoiceIds.has(inv.id))
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                return sortedInvoices.map((inv) => {
                  const applied = Math.min(remaining, inv.balance);
                  remaining = Math.max(0, remaining - inv.balance);
                  const newBalance = inv.balance - applied;
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5">
                      <div>
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-[#888888]">Saldo: {formatCurrencyCxC(inv.balance)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-emerald-500">-{formatCurrencyCxC(applied)}</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          Nuevo saldo: {formatCurrencyCxC(newBalance)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="flat" onPress={() => setCurrentStep(2)}>
              Atras
            </Button>
            <Button
              color="primary"
              size="lg"
              startContent={<DollarSign className="h-5 w-5" />}
              onPress={handleSubmit}
              isLoading={isSaving}
              isDisabled={amountExceeds || parsedAmount <= 0}
              className="bg-brand-700"
            >
              Registrar Cobro - {formatCurrencyCxC(parsedAmount)}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
