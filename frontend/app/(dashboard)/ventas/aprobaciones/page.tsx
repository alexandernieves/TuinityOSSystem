'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Textarea,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  ThumbsUp,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getSalesOrdersData,
  subscribeSalesOrders,
  updateSalesOrder,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data/sales-orders';
import type { SalesOrder } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';

export default function AprobacionesPage() {
  const router = useRouter();
  const salesOrders = useStore(subscribeSalesOrders, getSalesOrdersData);
  const { checkPermission, user } = useAuth();
  const canApproveOrders = checkPermission('canApproveOrders');
  const canViewMargins = checkPermission('canViewMargins');

  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // Get orders pending approval
  const pendingOrders = useMemo(() => {
    return salesOrders.filter(
      (order) => order.status === 'pedido' && order.requiresApproval
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [salesOrders]);

  // Stats
  const totalPendingValue = pendingOrders.reduce((sum, order) => sum + order.total, 0);
  const avgMargin = pendingOrders.length > 0
    ? pendingOrders.reduce((sum, order) => sum + (order.marginPercent || 0), 0) / pendingOrders.length
    : 0;

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleApproveClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setApprovalNotes('');
    setIsApproveOpen(true);
  };

  const handleRejectClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setApprovalNotes('');
    setIsRejectOpen(true);
  };

  const handleApprove = () => {
    if (selectedOrder) {
      updateSalesOrder(selectedOrder.id, { status: 'aprobado', approvedBy: user?.id, approvedByName: user?.name, approvalDate: new Date().toISOString() });
      toast.success('Pedido aprobado', {
        description: `El pedido ${selectedOrder.orderNumber} ha sido aprobado y está listo para empacar.`,
      });
      setIsApproveOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleReject = () => {
    if (selectedOrder) {
      updateSalesOrder(selectedOrder.id, { status: 'cancelado', internalNotes: approvalNotes });
      toast.error('Pedido rechazado', {
        description: `El pedido ${selectedOrder.orderNumber} ha sido rechazado.`,
      });
      setIsRejectOpen(false);
      setSelectedOrder(null);
    }
  };

  // Redirect if not authorized
  if (!canApproveOrders) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-500" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Acceso restringido</h2>
        <p className="mb-4 text-sm text-muted-foreground">No tienes permisos para aprobar pedidos.</p>
        <Button color="primary" onPress={() => router.push('/ventas')}>
          Volver a Ventas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Aprobaciones Pendientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos con margen menor al 10% que requieren aprobación
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{pendingOrders.length}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalPendingValue)}</p>
              <p className="text-sm text-muted-foreground">Valor total</p>
            </div>
          </div>
        </motion.div>

        {canViewMargins && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className={cn(
                  'text-2xl font-semibold',
                  avgMargin >= 10 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {avgMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Margen promedio</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pending Orders List */}
      {pendingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <ThumbsUp className="mb-4 h-12 w-12 text-emerald-500" />
          <h3 className="mb-1 text-lg font-medium text-foreground">Todo al día</h3>
          <p className="text-sm text-muted-foreground">No hay pedidos pendientes de aprobación</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map((order, index) => {
            const isExpanded = expandedOrders.has(order.id);
            const lowMarginLines = order.lines.filter((l) => (l.marginPercent || 0) < 10);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/ventas/${order.id}`)}
                          className="font-mono text-lg font-semibold text-brand-500 hover:underline"
                        >
                          {order.orderNumber}
                        </button>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                          {lowMarginLines.length} línea{lowMarginLines.length > 1 ? 's' : ''} con margen bajo
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {order.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {order.createdByName}
                        </span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-mono text-lg font-semibold text-foreground">{formatCurrency(order.total)}</p>
                      {canViewMargins && (
                        <p className={cn(
                          'font-mono text-sm',
                          (order.marginPercent || 0) >= 10 ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          Margen: {order.marginPercent?.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<Eye className="h-4 w-4" />}
                        onPress={() => router.push(`/ventas/${order.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="bordered"
                        startContent={<XCircle className="h-4 w-4" />}
                        onPress={() => handleRejectClick(order)}
                      >
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        color="success"
                        startContent={<ThumbsUp className="h-4 w-4" />}
                        onPress={() => handleApproveClick(order)}
                      >
                        Aprobar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Lines */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <h4 className="mb-3 text-sm font-medium text-foreground">Líneas con margen bajo</h4>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Producto</th>
                          <th className="pb-2 text-right text-xs font-medium uppercase text-muted-foreground">Cantidad</th>
                          <th className="pb-2 text-right text-xs font-medium uppercase text-muted-foreground">Precio</th>
                          {canViewMargins && (
                            <>
                              <th className="pb-2 text-right text-xs font-medium uppercase text-muted-foreground">Costo</th>
                              <th className="pb-2 text-right text-xs font-medium uppercase text-muted-foreground">Margen</th>
                            </>
                          )}
                          <th className="pb-2 text-right text-xs font-medium uppercase text-muted-foreground">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lowMarginLines.map((line) => (
                          <tr key={line.id}>
                            <td className="py-2">
                              <p className="text-sm text-foreground">{line.productDescription}</p>
                              <p className="text-xs text-muted-foreground">{line.productReference}</p>
                            </td>
                            <td className="py-2 text-right">
                              <span className="font-mono text-sm text-foreground">{line.quantity}</span>
                            </td>
                            <td className="py-2 text-right">
                              <span className="font-mono text-sm text-foreground">{formatCurrency(line.unitPrice)}</span>
                            </td>
                            {canViewMargins && (
                              <>
                                <td className="py-2 text-right">
                                  <span className="font-mono text-sm text-muted-foreground">{formatCurrency(line.unitCost || 0)}</span>
                                </td>
                                <td className="py-2 text-right">
                                  <span className="font-mono text-sm font-medium text-red-500">
                                    {line.marginPercent?.toFixed(1)}%
                                  </span>
                                </td>
                              </>
                            )}
                            <td className="py-2 text-right">
                              <span className="font-mono text-sm font-medium text-foreground">{formatCurrency(line.subtotal)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      <CustomModal isOpen={isApproveOpen} onClose={() => setIsApproveOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsApproveOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <ThumbsUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Aprobar Pedido</h2>
              <p className="text-sm text-muted-foreground">{selectedOrder?.orderNumber}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">Este pedido tiene margen bajo</p>
                <p className="opacity-80">Al aprobar, el pedido pasará a estado "Aprobado" y podrá ser empacado.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium text-foreground">{selectedOrder?.customerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="font-mono font-medium text-foreground">{formatCurrency(selectedOrder?.total || 0)}</p>
              </div>
              {canViewMargins && (
                <div>
                  <span className="text-muted-foreground">Margen:</span>
                  <p className="font-mono font-medium text-red-500">
                    {selectedOrder?.marginPercent?.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            <Textarea
              label="Notas de aprobación (opcional)"
              placeholder="Agregar comentarios..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              variant="bordered"
              minRows={2}
            />
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsApproveOpen(false)}>
            Cancelar
          </Button>
          <Button color="success" onPress={handleApprove}>
            Aprobar Pedido
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* Reject Modal */}
      <CustomModal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsRejectOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Rechazar Pedido</h2>
              <p className="text-sm text-muted-foreground">{selectedOrder?.orderNumber}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium text-foreground">{selectedOrder?.customerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="font-mono font-medium text-foreground">{formatCurrency(selectedOrder?.total || 0)}</p>
              </div>
            </div>

            <Textarea
              label="Motivo del rechazo *"
              placeholder="Explica el motivo del rechazo..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              variant="bordered"
              minRows={3}
            />
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsRejectOpen(false)}>
            Cancelar
          </Button>
          <Button color="danger" onPress={handleReject} isDisabled={!approvalNotes.trim()}>
            Rechazar Pedido
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
