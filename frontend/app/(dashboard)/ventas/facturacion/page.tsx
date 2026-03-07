'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  FileText,
  Receipt,
  DollarSign,
  Building2,
  Calendar,
  AlertCircle,
  Check,
  MapPin,
  CreditCard,
  Clock,
  Search,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getSalesOrdersData,
  subscribeSalesOrders,
  updateSalesOrder,
  formatDate,
  formatCurrency,
  getNextOrderNumber,
} from '@/lib/mock-data/sales-orders';
import type { SalesOrder } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';

const PAYMENT_METHODS = [
  { key: 'transferencia', label: 'Transferencia Bancaria' },
  { key: 'cheque', label: 'Cheque' },
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'tarjeta', label: 'Tarjeta de Crédito' },
];

export default function FacturacionPage() {
  const router = useRouter();
  const salesOrders = useStore(subscribeSalesOrders, getSalesOrdersData);
  const { checkPermission } = useAuth();
  const canCreateInvoices = checkPermission('canCreateInvoices');

  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('transferencia');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Get orders ready for invoicing (status: empacado)
  const readyToInvoice = useMemo(() => {
    return salesOrders.filter(
      (order) => order.status === 'empacado'
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [salesOrders]);

  // Get recent invoices (status: facturado)
  const recentInvoices = useMemo(() => {
    return salesOrders.filter(
      (order) => order.status === 'facturado'
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [salesOrders]);

  // Filter by search
  const filteredReadyToInvoice = useMemo(() => {
    if (!searchQuery) return readyToInvoice;
    const query = searchQuery.toLowerCase();
    return readyToInvoice.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query)
    );
  }, [readyToInvoice, searchQuery]);

  // Stats
  const pendingCount = readyToInvoice.length;
  const pendingTotal = readyToInvoice.reduce((sum, o) => sum + o.total, 0);
  const invoicedThisMonth = recentInvoices.length;
  const invoicedTotal = recentInvoices.reduce((sum, o) => sum + o.total, 0);

  const handleInvoiceClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setPaymentMethod('transferencia');
    setInvoiceNotes('');
    setIsInvoiceOpen(true);
  };

  const handleConfirmInvoice = () => {
    if (selectedOrder) {
      const invoiceNumber = getNextOrderNumber('factura');
      updateSalesOrder(selectedOrder.id, { status: 'facturado', invoiceId: invoiceNumber, invoiceNumber });
      toast.success('Factura generada', {
        description: `Se ha generado la factura ${invoiceNumber} para el pedido ${selectedOrder.orderNumber}.`,
      });
      setIsInvoiceOpen(false);
      setSelectedOrder(null);
    }
  };

  // Redirect if not authorized
  if (!canCreateInvoices) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Acceso restringido</h2>
        <p className="mb-4 text-sm text-muted-foreground">No tienes permisos para crear facturas.</p>
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
          <h1 className="text-2xl font-semibold text-foreground">Facturación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generar facturas para pedidos empacados
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
              <p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
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
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(pendingTotal)}</p>
              <p className="text-sm text-muted-foreground">Por facturar</p>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Receipt className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{invoicedThisMonth}</p>
              <p className="text-sm text-muted-foreground">Facturadas (mes)</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(invoicedTotal)}</p>
              <p className="text-sm text-muted-foreground">Facturado (mes)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            variant="bordered"
          />
        </div>
      </div>

      {/* Pending Invoices */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Pedidos por Facturar</h2>

        {filteredReadyToInvoice.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
            <Receipt className="mb-4 h-12 w-12 text-emerald-500" />
            <h3 className="mb-1 text-lg font-medium text-foreground">Todo facturado</h3>
            <p className="text-sm text-muted-foreground">No hay pedidos pendientes de facturación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReadyToInvoice.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-brand-500/50 hover:shadow-lg"
                onClick={() => handleInvoiceClick(order)}
              >
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-lg font-semibold text-foreground">
                      {order.orderNumber}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{order.customerCountry}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{order.lines.length} productos</p>
                    </div>
                    <p className="text-lg font-bold text-brand-500">
                      {formatCurrency(order.total)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Facturas Recientes</h2>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Factura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-foreground">{invoice.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{invoice.customerName}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customerCountry}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-semibold text-foreground">{formatCurrency(invoice.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                        <Check className="h-3 w-3" />
                        Facturada
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Generation Modal */}
      <CustomModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} size="2xl" scrollable>
        <CustomModalHeader onClose={() => setIsInvoiceOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
              <FileText className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Generar Factura</h2>
              <p className="text-sm text-muted-foreground">Pedido {selectedOrder?.orderNumber}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-3 text-sm font-medium text-foreground">Datos del Cliente</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium text-foreground">{selectedOrder?.customerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">País:</span>
                  <p className="font-medium text-foreground">{selectedOrder?.customerCountry}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nivel de Precio:</span>
                  <p className="font-medium text-foreground">Nivel {selectedOrder?.priceLevel}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Términos de Pago:</span>
                  <p className="font-medium text-foreground capitalize">
                    {selectedOrder?.paymentTerms?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Lines Summary */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 text-sm font-medium text-foreground">Detalle del Pedido</h4>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Producto</th>
                      <th className="pb-2 text-center text-xs font-medium text-muted-foreground">Cant.</th>
                      <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Precio</th>
                      <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedOrder?.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2">
                          <p className="text-foreground">{line.productDescription}</p>
                          <p className="text-xs text-muted-foreground">{line.productReference}</p>
                        </td>
                        <td className="py-2 text-center font-mono text-foreground">{line.quantity}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="py-2 text-right font-mono font-medium text-foreground">
                          {formatCurrency(line.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono text-foreground">{formatCurrency(selectedOrder?.subtotal || 0)}</span>
                </div>
                {(selectedOrder?.expensesTotal ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gastos adicionales:</span>
                    <span className="font-mono text-foreground">{formatCurrency(selectedOrder?.expensesTotal || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
                  <span className="text-foreground">Total:</span>
                  <span className="font-mono text-brand-500">{formatCurrency(selectedOrder?.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Método de Pago</label>
              <Select
                selectedKeys={[paymentMethod]}
                onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as string)}
                variant="bordered"
                aria-label="Método de Pago"
                startContent={<CreditCard className="h-4 w-4 text-muted-foreground" />}
              >
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.key}>{method.label}</SelectItem>
                ))}
              </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas (opcional)</label>
                <Input
                  placeholder="Observaciones de factura..."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  variant="bordered"
                />
              </div>
            </div>

            {/* FE Placeholder */}
            <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-500">Factura Electrónica</p>
                  <p className="text-xs text-muted-foreground">
                    La integración con el sistema de facturación electrónica estará disponible próximamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsInvoiceOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleConfirmInvoice}
            startContent={<FileText className="h-4 w-4" />}
          >
            Generar Factura
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
