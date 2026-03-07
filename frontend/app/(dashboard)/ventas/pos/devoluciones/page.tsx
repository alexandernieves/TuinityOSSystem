'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { ArrowLeft, Search, RotateCcw, Plus, Trash2, Minus, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';
import {
  MOCK_POS_RETURNS,
  MOCK_POS_ORDERS,
  subscribePosReturns,
  getPosReturnsData,
  subscribePosOrders,
  getPosOrdersData,
} from '@/lib/mock-data/pos';
import {
  POS_RETURN_STATUS_CONFIG,
  POS_RETURN_REASON_LABELS,
  REIMBURSEMENT_TYPE_LABELS,
} from '@/lib/types/pos';
import type { POSReturnStatus, POSReturnReasonCategory, POSReturnReimbursementType, POSOrder, POSOrderLine } from '@/lib/types/pos';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ReturnLine {
  productId: string;
  productName: string;
  maxQty: number;
  quantity: number;
  unitPrice: number;
}

export default function DevolucionesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();

  useStore(subscribePosReturns, getPosReturnsData);
  useStore(subscribePosOrders, getPosOrdersData);

  const [statusFilter, setStatusFilter] = useState<POSReturnStatus | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<POSReturnReasonCategory | 'all'>('all');

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnReasonCategory, setReturnReasonCategory] = useState<POSReturnReasonCategory>('producto_danado');
  const [returnReimbursement, setReturnReimbursement] = useState<POSReturnReimbursementType>('efectivo');
  const [returnNotes, setReturnNotes] = useState('');

  const filteredReturns = useMemo(() => {
    return MOCK_POS_RETURNS.filter((ret) => {
      const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || ret.reasonCategory === reasonFilter;
      return matchesStatus && matchesReason;
    });
  }, [statusFilter, reasonFilter]);

  // Search orders for the return form
  const matchingOrders = useMemo(() => {
    if (!orderSearch || orderSearch.length < 2) return [];
    const q = orderSearch.toLowerCase();
    return MOCK_POS_ORDERS.filter(
      (o) =>
        o.status === 'completada' &&
        (o.id.toLowerCase().includes(q) ||
          o.ticketNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [orderSearch]);

  const returnTotal = useMemo(() => {
    return returnLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  }, [returnLines]);

  const handleSelectOrder = (order: POSOrder) => {
    setSelectedOrder(order);
    setOrderSearch('');
    setReturnLines(
      order.lines.map((l: POSOrderLine) => ({
        productId: l.productId,
        productName: l.productName,
        maxQty: l.quantity,
        quantity: 0,
        unitPrice: l.unitPrice,
      }))
    );
  };

  const updateLineQty = (idx: number, delta: number) => {
    setReturnLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const newQty = Math.max(0, Math.min(l.maxQty, l.quantity + delta));
        return { ...l, quantity: newQty };
      })
    );
  };

  const removeLineFromReturn = (idx: number) => {
    setReturnLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: 0 } : l)));
  };

  const handleNewReturn = () => {
    setSelectedOrder(null);
    setOrderSearch('');
    setReturnLines([]);
    setReturnReason('');
    setReturnReasonCategory('producto_danado');
    setReturnReimbursement('efectivo');
    setReturnNotes('');
    setIsOpen(true);
  };

  const handleSubmitReturn = () => {
    const activeLines = returnLines.filter((l) => l.quantity > 0);
    if (!selectedOrder) {
      toast.error('Selecciona una orden original', { id: 'return-error' });
      return;
    }
    if (activeLines.length === 0) {
      toast.error('Agrega al menos un producto a devolver', { id: 'return-error' });
      return;
    }
    if (!returnReason.trim()) {
      toast.error('Indica el motivo de la devolucion', { id: 'return-error' });
      return;
    }

    toast.success('Devolucion registrada exitosamente', {
      id: 'new-return',
      description: `${formatCurrency(returnTotal)} - ${activeLines.length} producto(s)`,
    });
    setIsOpen(false);
  };

  if (!checkPermission('canProcessPOSReturn')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para gestionar devoluciones.</p>
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
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Devoluciones B2C</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Gestion de devoluciones de punto de venta</p>
          </div>
        </div>
        <button
          onClick={handleNewReturn}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Devolucion
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as POSReturnStatus | 'all')}
          className="h-9 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          {(Object.entries(POS_RETURN_STATUS_CONFIG) as [POSReturnStatus, typeof POS_RETURN_STATUS_CONFIG[POSReturnStatus]][]).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value as POSReturnReasonCategory | 'all')}
          className="h-9 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">Todos los motivos</option>
          {(Object.entries(POS_RETURN_REASON_LABELS) as [POSReturnReasonCategory, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredReturns.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]"># Devolucion</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Orden Original</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-[#888888]">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-[#888888]">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Tipo Reembolso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#888888]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {filteredReturns.map((ret) => {
                  const statusCfg = POS_RETURN_STATUS_CONFIG[ret.status];
                  const itemCount = ret.lines.reduce((sum, l) => sum + l.quantity, 0);

                  return (
                    <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {ret.id}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/ventas/pos/ordenes/${ret.originalOrderId}`)}
                          className="font-mono text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          {ret.originalOrderNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(ret.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-100 dark:bg-[#1a1a1a] px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {itemCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(ret.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-[#1a1a1a] px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {POS_RETURN_REASON_LABELS[ret.reasonCategory]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {REIMBURSEMENT_TYPE_LABELS[ret.reimbursementType]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusCfg.bg, statusCfg.text
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a]">
            <p className="text-xs text-gray-500 dark:text-[#888888]">
              {filteredReturns.length} {filteredReturns.length === 1 ? 'devolucion' : 'devoluciones'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <RotateCcw className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-[#888888]">No se encontraron devoluciones</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-[#666]">Intenta ajustar los filtros</p>
        </div>
      )}

      {/* New Return Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg" scrollable>
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <RotateCcw className="h-5 w-5 text-emerald-600" />
          Nueva Devolucion B2C
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
            <div className="space-y-4">
              {/* Step 1: Find order */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Orden original *
                </label>
                {!selectedOrder ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Buscar por # orden, ticket o cliente..."
                    />
                    {matchingOrders.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] shadow-lg">
                        {matchingOrders.map((order) => (
                          <button
                            key={order.id}
                            onClick={() => handleSelectOrder(order)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                          >
                            <div>
                              <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{order.ticketNumber}</span>
                              <span className="ml-2 text-xs text-gray-500 dark:text-[#888888]">{order.customerName}</span>
                            </div>
                            <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {formatCurrency(order.total)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5">
                    <div>
                      <span className="font-mono text-sm font-medium text-emerald-700 dark:text-emerald-400">{selectedOrder.ticketNumber}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-[#888888]">{selectedOrder.customerName}</span>
                      <span className="ml-2 text-xs text-gray-400">({formatDate(selectedOrder.createdAt)})</span>
                    </div>
                    <button
                      onClick={() => { setSelectedOrder(null); setReturnLines([]); }}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Select products to return */}
              {selectedOrder && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Productos a devolver
                  </label>
                  <div className="space-y-2">
                    {returnLines.map((line, idx) => (
                      <div
                        key={line.productId}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                          line.quantity > 0
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{line.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-[#888888]">
                            {formatCurrency(line.unitPrice)} x {line.maxQty} max
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateLineQty(idx, -1)}
                            disabled={line.quantity === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-[#2a2a2a] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono text-sm font-semibold text-gray-900 dark:text-white">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => updateLineQty(idx, 1)}
                            disabled={line.quantity >= line.maxQty}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 dark:border-[#2a2a2a] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </button>
                          {line.quantity > 0 && (
                            <button
                              onClick={() => removeLineFromReturn(idx)}
                              className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {line.quantity > 0 && (
                          <span className="w-20 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(line.quantity * line.unitPrice)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Return total */}
                  {returnTotal > 0 && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5">
                      <span className="text-sm font-medium text-gray-500 dark:text-[#888888]">Total devolucion</span>
                      <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(returnTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Reason and details */}
              {selectedOrder && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Categoria del motivo *
                      </label>
                      <select
                        value={returnReasonCategory}
                        onChange={(e) => setReturnReasonCategory(e.target.value as POSReturnReasonCategory)}
                        className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
                      >
                        {(Object.entries(POS_RETURN_REASON_LABELS) as [POSReturnReasonCategory, string][]).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                        Tipo de reembolso
                      </label>
                      <select
                        value={returnReimbursement}
                        onChange={(e) => setReturnReimbursement(e.target.value as POSReturnReimbursementType)}
                        className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-emerald-500 focus:outline-none"
                      >
                        {(Object.entries(REIMBURSEMENT_TYPE_LABELS) as [POSReturnReimbursementType, string][]).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Motivo detallado *
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                      placeholder="Describe el motivo de la devolucion..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                      Notas adicionales
                    </label>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Observaciones (opcional)"
                    />
                  </div>

                  {/* Approval threshold info */}
                  {returnTotal > 0 && (
                    <div className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                      returnTotal > 200
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                        : returnTotal > 50
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                    )}>
                      {returnTotal > 200
                        ? 'Devolucion mayor a $200 - requiere aprobacion de gerencia'
                        : returnTotal > 50
                          ? 'Devolucion $50-$200 - requiere aprobacion del encargado'
                          : 'Devolucion menor a $50 - puede ser procesada por el cajero'}
                    </div>
                  )}
                </>
              )}
            </div>
          </CustomModalBody>
          <CustomModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
            <Button
              color="success"
              onPress={handleSubmitReturn}
              isDisabled={!selectedOrder || returnTotal === 0}
            >
              <RotateCcw className="h-4 w-4" /> Registrar Devolucion
            </Button>
          </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
