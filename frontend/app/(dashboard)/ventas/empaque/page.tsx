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
import { Switch } from '@/components/ui/switch';
import {
  PackageCheck,
  Package,
  Printer,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Truck,
  AlertCircle,
  Check,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getSalesOrdersData,
  subscribeSalesOrders,
  updateSalesOrder,
  formatDate,
} from '@/lib/mock-data/sales-orders';
import type { SalesOrder } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { printPackingList } from '@/lib/utils/print-utils';

export default function EmpaquePage() {
  const router = useRouter();
  const salesOrders = useStore(subscribeSalesOrders, getSalesOrdersData);
  const { checkPermission } = useAuth();
  const canPackOrders = checkPermission('canPackOrders');

  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [packingNotes, setPackingNotes] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [checkedLines, setCheckedLines] = useState<Set<string>>(new Set());

  const [isPackOpen, setIsPackOpen] = useState(false);

  // Get orders ready for packing (status: aprobado)
  const readyToPack = useMemo(() => {
    return salesOrders.filter(
      (order) => order.status === 'aprobado'
    ).sort((a, b) => {
      // Sort by requested delivery date (urgent first)
      const dateA = a.requestedDeliveryDate ? new Date(a.requestedDeliveryDate).getTime() : Infinity;
      const dateB = b.requestedDeliveryDate ? new Date(b.requestedDeliveryDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }, [salesOrders]);

  // Stats
  const totalOrders = readyToPack.length;
  const totalLines = readyToPack.reduce((sum, order) => sum + order.lines.length, 0);
  const urgentOrders = readyToPack.filter(
    (o) => o.requestedDeliveryDate && new Date(o.requestedDeliveryDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  ).length;

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

  const toggleLineCheck = (lineId: string) => {
    setCheckedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const handlePackClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setPackingNotes('');
    // Pre-check all lines
    const allLineIds = order.lines.map((l) => l.id);
    setCheckedLines(new Set(allLineIds));
    setIsPackOpen(true);
  };

  const handlePrint = (order: SalesOrder) => {
    printPackingList({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerCountry: order.customerCountry,
      requestedDeliveryDate: order.requestedDeliveryDate,
      shippingAddress: order.shippingAddress,
      status: order.status,
      lines: order.lines.map((line) => ({
        productReference: line.productReference,
        productDescription: line.productDescription,
        productBrand: line.productBrand,
        productGroup: line.productGroup,
        quantity: line.quantity,
      })),
    });
    toast.success('Documento generado', {
      description: `Lista de empaque ${order.orderNumber} lista para imprimir.`,
    });
  };

  const handleConfirmPack = () => {
    if (selectedOrder) {
      updateSalesOrder(selectedOrder.id, { status: 'empacado', packedAt: new Date().toISOString() });
      toast.success('Pedido empacado', {
        description: `El pedido ${selectedOrder.orderNumber} ha sido marcado como empacado y está listo para facturación.`,
      });
      setIsPackOpen(false);
      setSelectedOrder(null);
      setCheckedLines(new Set());
    }
  };

  // Redirect if not authorized
  if (!canPackOrders) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Acceso restringido</h2>
        <p className="mb-4 text-sm text-muted-foreground">No tienes permisos para empacar pedidos.</p>
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
          <h1 className="text-2xl font-semibold text-foreground">Lista de Empaque</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos aprobados listos para empacar
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalOrders}</p>
              <p className="text-sm text-muted-foreground">Pedidos por empacar</p>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <PackageCheck className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{totalLines}</p>
              <p className="text-sm text-muted-foreground">Líneas totales</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              urgentOrders > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
            )}>
              <Truck className={cn('h-5 w-5', urgentOrders > 0 ? 'text-red-500' : 'text-emerald-500')} />
            </div>
            <div>
              <p className={cn(
                'text-2xl font-semibold',
                urgentOrders > 0 ? 'text-red-500' : 'text-foreground'
              )}>
                {urgentOrders}
              </p>
              <p className="text-sm text-muted-foreground">Urgentes (2 días)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Orders List */}
      {readyToPack.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <PackageCheck className="mb-4 h-12 w-12 text-emerald-500" />
          <h3 className="mb-1 text-lg font-medium text-foreground">Todo empacado</h3>
          <p className="text-sm text-muted-foreground">No hay pedidos pendientes de empaque</p>
        </div>
      ) : (
        <div className="space-y-4">
          {readyToPack.map((order, index) => {
            const isExpanded = expandedOrders.has(order.id);
            const isUrgent = order.requestedDeliveryDate && new Date(order.requestedDeliveryDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'overflow-hidden rounded-xl border bg-card',
                  isUrgent ? 'border-red-500/50' : 'border-border'
                )}
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
                        <span className="font-mono text-lg font-semibold text-foreground">
                          {order.orderNumber}
                        </span>
                        {isUrgent && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                            URGENTE
                          </span>
                        )}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {order.lines.length} productos
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {order.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {order.customerCountry}
                        </span>
                        {order.requestedDeliveryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Entrega: {formatDate(order.requestedDeliveryDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="bordered"
                      startContent={<Printer className="h-4 w-4" />}
                      onPress={() => handlePrint(order)}
                    >
                      Imprimir
                    </Button>
                    <Button
                      size="sm"
                      color="success"
                      startContent={<PackageCheck className="h-4 w-4" />}
                      onPress={() => handlePackClick(order)}
                    >
                      Marcar Empacado
                    </Button>
                  </div>
                </div>

                {/* Expanded Lines - NO PRICES */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Producto</th>
                          <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Referencia</th>
                          <th className="pb-2 text-center text-xs font-medium uppercase text-muted-foreground">Cantidad</th>
                          <th className="pb-2 text-left text-xs font-medium uppercase text-muted-foreground">Grupo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {order.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="py-2">
                              <p className="text-sm font-medium text-foreground">{line.productDescription}</p>
                              {line.productBrand && (
                                <span className="text-xs text-muted-foreground">{line.productBrand}</span>
                              )}
                            </td>
                            <td className="py-2">
                              <span className="font-mono text-sm text-muted-foreground">{line.productReference}</span>
                            </td>
                            <td className="py-2 text-center">
                              <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-brand-500/10 px-3 font-mono text-sm font-bold text-brand-500">
                                {line.quantity}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {line.productGroup || 'Sin grupo'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Shipping info */}
                    {order.shippingAddress && (
                      <div className="mt-4 rounded-lg bg-card p-3 text-sm">
                        <p className="font-medium text-foreground">Dirección de entrega:</p>
                        <p className="text-muted-foreground">{order.shippingAddress}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pack Confirmation Modal */}
      <CustomModal isOpen={isPackOpen} onClose={() => setIsPackOpen(false)} size="lg" scrollable>
        <CustomModalHeader onClose={() => setIsPackOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <PackageCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Confirmar Empaque</h2>
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
                <span className="text-muted-foreground">Destino:</span>
                <p className="font-medium text-foreground">{selectedOrder?.customerCountry}</p>
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 text-sm font-medium text-foreground">Verificar productos empacados:</h4>
              <div className="space-y-2">
                {selectedOrder?.lines.map((line) => (
                  <label
                    key={line.id}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                  >
                    <Switch
                      checked={checkedLines.has(line.id)}
                      onCheckedChange={() => toggleLineCheck(line.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{line.productDescription}</p>
                      <p className="text-xs text-muted-foreground">{line.productReference}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-brand-500">x{line.quantity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas de empaque (opcional)</label>
              <Textarea
                placeholder="Observaciones sobre el empaque, bultos, peso..."
                value={packingNotes}
                onChange={(e) => setPackingNotes(e.target.value)}
                variant="bordered"
                minRows={2}
              />
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsPackOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="success"
            onPress={handleConfirmPack}
            isDisabled={selectedOrder ? checkedLines.size !== selectedOrder.lines.length : false}
            startContent={<Check className="h-4 w-4" />}
          >
            Confirmar Empaque
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
