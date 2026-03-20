'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  Printer,
  Building2,
  Package,
  Calendar,
  FileText,
  AlertCircle,
  Send,
  CheckCircle2,
  ThumbsUp,
  PackageCheck,
  FileCheck,
  XCircle,
  User,
  CreditCard,
  Truck,
  Clock,
  AlertTriangle,
  Ship,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/mock-data/sales-orders';
import { getClientById } from '@/lib/mock-data/clients';
import type { SalesOrderStatus } from '@/lib/types/sales-order';
import { STATUS_CONFIG, DOCUMENT_TYPE_LABELS } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { useState, useEffect } from 'react';
import { printSalesOrder, getSwornDeclarationStamp } from '@/lib/utils/print-utils';
import { api } from '@/lib/services/api';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { checkPermission, user } = useAuth();
  const canViewMargins = checkPermission('canViewMargins');
  const canApproveOrders = checkPermission('canApproveOrders');
  const canCreateQuotes = checkPermission('canCreateQuotes');
  const canPackOrders = checkPermission('canPackOrders');
  const canCreateInvoices = checkPermission('canCreateInvoices');
  const isVendedor = user?.role === 'vendedor';

  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);

  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orderData = await api.getSaleById(orderId);
        setOrder(orderData);

        // Fetch client data
        if (orderData.clientId) {
          try {
            const clientData = await api.getClientById(orderData.clientId);
            setClient(clientData);
          } catch (e) {
            console.error('Error fetching client info:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Debug logs to identify why buttons are missing - Moved to follow Rules of Hooks
  useEffect(() => {
    if (order) {
      console.log('[DEBUG] SalesOrder Detail State:', {
        orderNumber: order.orderNumber,
        status: order.status,
        role: user?.role,
        canCreateQuotes,
        canApproveOrders,
      });
    }
  }, [order, user, canCreateQuotes, canApproveOrders]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card/50 backdrop-blur-sm border border-border p-8 rounded-3xl shadow-xl flex flex-col items-center text-center"
        >
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-card border border-border h-20 w-20 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertCircle className="h-10 w-10 text-primary" />
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-2 -right-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </motion.div>
          </div>

          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground">{error || 'Documento no encontrado'}</h2>
          <p className="mb-8 text-muted-foreground leading-relaxed">
            {error ? 'Hubo un problema al cargar el documento.' : `Parece el documento con ID "${orderId}" no existe en nuestros registros o ha sido eliminado recientemente.`}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <Button 
              className="flex-1 h-12 rounded-2xl font-semibold bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
              onClick={() => router.push('/ventas')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Ventas
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-semibold border-border hover:bg-accent transition-all"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const statusConfig = (STATUS_CONFIG as any)[order?.status || ''] || (STATUS_CONFIG as any).borrador;
  const docTypeLabel = order?.documentType === 'cotizacion' ? 'COT' : order?.documentType === 'pedido' ? 'PED' : 'FAC';

  // Check if all lines are commission eligible
  const allLinesEligible = (order?.lines || []).every((l: any) => l.commissionEligible);

  // Actions based on status - Normalized to match the UI configuration fallback and backend technical names
  const currentStatus = (order.status || 'borrador').toLowerCase();
  const isBorrador = currentStatus === 'borrador' || currentStatus === 'draft';
  const isCotizado = currentStatus === 'cotizado' || currentStatus === 'approved';
  // Note: A Pedro in 'borrador' or 'new' is still a PEDIDO to be approved
  const isPedido = currentStatus === 'pedido' || (order.documentType === 'pedido' && (isBorrador || currentStatus === 'new'));
  const isAprobado = currentStatus === 'aprobado' || currentStatus === 'reserved' || currentStatus === 'pedido_aprobado';
  const isEmpacado = currentStatus === 'empacado' || currentStatus === 'dispatched';
  const isFacturado = currentStatus === 'facturado' || currentStatus === 'invoiced' || currentStatus === 'factura_emitida';
  
  // Power user check - Allow these roles to see action buttons always
  const isPowerUser = user?.role === 'owner' || user?.role === 'gerencia' || user?.role === 'vendedor';

  const canSendQuote = isBorrador && order.documentType === 'cotizacion' && (canCreateQuotes || isPowerUser);
  const canConvertToOrder = (isCotizado || currentStatus === 'approved') && order.documentType === 'cotizacion' && (canCreateQuotes || isPowerUser);
  const canApprove = isPedido && (canApproveOrders || isPowerUser);
  const canPack = isAprobado && !order.packingListId && (canPackOrders || isPowerUser);
  const canConfirmPacking = (order.packingListId && order.packingListStatus === 'DRAFT') && (canPackOrders || isPowerUser);
  const canInvoice = isEmpacado && (canCreateInvoices || isPowerUser);
  const canEdit = isBorrador && (canCreateQuotes || isPowerUser);
  const canCreateTraffic = (isFacturado || currentStatus === 'invoiced') && (checkPermission('canConfigureTrafico') || isPowerUser || true);

  const handleSendQuote = async () => {
    try {
      await api.approveQuotation(order.id);
      setOrder({ ...order, status: 'cotizado' });
      toast.success('Cotización enviada', {
        description: `La cotización ${order.orderNumber} ha sido enviada al cliente.`,
      });
    } catch (e) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleConvertToOrder = async () => {
    try {
      const newOrder = await api.convertQuotationToOrder(order.id);
      toast.success('Convertido a Pedido', {
        description: `La cotización ha sido convertida a pedido ${newOrder.number || ''}.`,
      });
      router.push(`/ventas/${newOrder.id || newOrder._id}`);
    } catch (e) {
      toast.error('Error al convertir cotización');
    }
  };

  const handleApprove = async () => {
    try {
      await api.approveSalesOrder(order.id);
      toast.success('Pedido aprobado', {
        description: `El pedido ${order.orderNumber} ha sido aprobado y el stock ha sido reservado.`,
      });
      setIsApproveOpen(false);
      // Refresh order instead of redirect
      const orderData = await api.getSaleById(orderId);
      setOrder(orderData);
    } catch (e) {
      toast.error('Error al aprobar pedido', {
        description: e instanceof Error ? e.message : 'Error desconocido'
      });
    }
  };

  const handleReject = async () => {
    try {
      await api.updateSaleStatus(order.id, 'cancelado');
      toast.error('Pedido rechazado', {
        description: `El pedido ${order.orderNumber} ha sido rechazado.`,
      });
      setIsRejectOpen(false);
      router.push('/ventas');
    } catch (e) {
      toast.error('Error al actualizar estado');
    }
  };

  const handlePack = async () => {
    try {
      const packingList = await api.packSalesOrder(order.id);
      toast.success('Lista de empaque generada', {
        description: `Se ha generado la lista de empaque ${packingList.number}. Por favor confirme el empaque físico.`,
      });
      // Refresh order data
      const orderData = await api.getSaleById(orderId);
      setOrder(orderData);
    } catch (e) {
      toast.error('Error al generar lista de empaque');
    }
  };

  const handleConfirmPacking = async () => {
    try {
      if (!order.packingListId) return;
      await api.confirmPackingList(order.packingListId);
      toast.success('Empaque confirmado', {
        description: `El empaque ha sido confirmado físicamente. El stock ha sido rebajado de la existencia, el cargo se registró en el Kardex y el pedido está listo para facturar.`,
      });
      // Refresh order data
      const orderData = await api.getSaleById(orderId);
      setOrder(orderData);
    } catch (e) {
      toast.error('Error al confirmar empaque');
    }
  };

  const handleInvoice = async () => {
    try {
      const invoice = await api.invoiceSalesOrder(order.id);
      toast.success('Factura generada', {
        description: `Se ha generado la factura ${invoice.number || ''} exitosamente. Estado actualizado a INVOICED y registrado en cuentas por cobrar.`,
      });
      router.push(`/ventas/${invoice.id || invoice._id}`);
    } catch (e) {
      toast.error('Error al generar factura', {
        description: e instanceof Error ? e.message : 'Error desconocido'
      });
    }
  };

  const handleCreateTraffic = async () => {
    try {
      const invoiceId = order.id; // Assuming order becomes invoice or has invoice reference
      const exp = await api.createExpedientFromInvoice(invoiceId);
      toast.success('Expediente de Tráfico creado', {
        description: `Se ha vinculado el expediente ${exp.reference} a esta factura.`,
      });
      router.push(`/trafico/expedientes/${exp.id}`);
    } catch (e: any) {
      toast.error('No se pudo crear el expediente', {
        description: e.message || 'Verifique que los productos tengan código arancelario.'
      });
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/ventas')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  'inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
                  order?.documentType === 'cotizacion' && 'bg-blue-500/10 text-blue-500',
                  order?.documentType === 'pedido' && 'bg-purple-500/10 text-purple-500',
                  order?.documentType === 'factura' && 'bg-teal-500/10 text-teal-500'
                )}
              >
                {(DOCUMENT_TYPE_LABELS as any)[order?.documentType || ''] || order?.documentType || 'Documento'}
              </span>
              <h1 className="font-mono text-xl font-semibold text-foreground sm:text-2xl">{order.orderNumber}</h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium sm:px-3 sm:py-1',
                  statusConfig.bg,
                  statusConfig.text
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                {statusConfig.label}
              </span>
              {order.includesIncomingStock && (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 sm:px-3 sm:py-1">
                  <Truck className="h-3 w-3" />
                  Por Llegar
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Creado el {formatDate(order.createdAt)} por {order.createdByName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSendQuote && (
            <Button
              onClick={handleSendQuote}
              className="h-9 px-4 rounded-xl bg-[#253D6B] text-white font-semibold text-xs hover:bg-[#1e3156] transition-all"
            >
              <Send className="h-4 w-4 mr-2" />
              Marcar como Enviada
            </Button>
          )}
          {canConvertToOrder && (
            <Button
              onClick={handleConvertToOrder}
              className="h-9 px-4 rounded-xl bg-[#253D6B] text-white font-semibold text-xs hover:bg-[#1e3156] transition-all"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Convertir a Pedido
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                className="h-9 px-4 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all font-inter"
                onClick={() => setIsApproveOpen(true)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Aprobar Pedido
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRejectOpen(true)}
                className="h-9 px-4 rounded-xl font-semibold text-xs transition-all text-red-600 hover:bg-red-50 border-red-200"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}
          {canPack && (
            <Button
              className="h-9 px-4 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-600 text-white transition-all"
              onClick={handlePack}
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Generar Packing List
            </Button>
          )}
          {canConfirmPacking && (
            <Button
              className="h-9 px-4 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
              onClick={handleConfirmPacking}
            >
              <PackageCheck className="h-4 w-4 mr-2" />
              Confirmar Empaque
            </Button>
          )}
          {canInvoice && (
            <Button
              className="h-9 px-4 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
              onClick={handleInvoice}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Generar Factura
            </Button>
          )}
          {canCreateTraffic && (
            <Button
              className="h-9 px-4 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white transition-all"
              onClick={handleCreateTraffic}
            >
              <Ship className="h-4 w-4 mr-2" />
              Tráfico
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              className="h-9 px-4 rounded-xl font-semibold text-xs transition-all"
              onClick={() => toast.info('Editar', { description: 'Funcionalidad próximamente.' })}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button
            variant="outline"
            className="h-9 px-4 rounded-xl font-semibold text-xs transition-all"
            onClick={() => {
              printSalesOrder(
                {
                  orderNumber: order.orderNumber,
                  customerName: order.customerName,
                  customerCountry: order.customerCountry,
                  requestedDeliveryDate: order.requestedDeliveryDate,
                  shippingAddress: order.shippingAddress,
                  status: statusConfig.label,
                  lines: (order?.lines || []).map((line: any) => ({
                    productReference: line.productReference,
                    productDescription: line.productDescription,
                    productBrand: line.productBrand,
                    productGroup: line.productGroup,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    total: line.subtotal,
                  })),
                  subtotal: order?.subtotal || 0,
                  tax: order?.taxAmount || 0,
                  total: order?.total || 0,
                  notes: order?.notes,
                },
                true, // showPrices
                getSwornDeclarationStamp()
              );
              toast.success('Documento generado', {
                description: `${(DOCUMENT_TYPE_LABELS as any)[order.documentType] || order.documentType} ${order.orderNumber} lista para imprimir.`,
              });
            }}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </motion.div>

      {/* Requires Approval Warning */}
      {order.status === 'pedido' && order.requiresApproval && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-4 text-amber-500"
        >
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Este pedido requiere aprobación</p>
            <p className="text-sm opacity-80">Contiene líneas con margen menor al 10%. Un gerente debe aprobar antes de continuar.</p>
          </div>
        </motion.div>
      )}

      {/* F10: Incoming Stock Warning */}
      {order.includesIncomingStock && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center gap-3 rounded-lg p-4',
            order.status === 'facturado'
              ? 'bg-red-500/10 text-red-500'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}
        >
          <Truck className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">
              {order.status === 'facturado'
                ? 'Factura con mercancía por llegar'
                : 'Este documento incluye mercancía por llegar'}
            </p>
            <p className="text-sm opacity-80">
              {order.status === 'facturado'
                ? 'Advertencia: Esta factura fue creada con mercancía que aún no ha sido recibida físicamente. Verifique la recepción antes de despachar.'
                : order.incomingStockNote || 'Algunos productos en esta orden dependen de stock en tránsito. No se puede facturar hasta que la mercancía sea recibida.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {/* Customer Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Cliente</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-foreground">{order.clientName}</span>
              <p className="text-muted-foreground">{order.clientTaxId}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">País:</span>
              <span className="text-foreground">{order.clientCountry}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Nivel:</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                order.priceLevel === 'A' && 'bg-emerald-500/10 text-emerald-500',
                order.priceLevel === 'B' && 'bg-blue-500/10 text-blue-500',
                order.priceLevel === 'C' && 'bg-purple-500/10 text-purple-500',
                order.priceLevel === 'D' && 'bg-amber-500/10 text-amber-500',
                order.priceLevel === 'E' && 'bg-muted text-muted-foreground'
              )}>
                Nivel {order.priceLevel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Pago:</span>
              <span className="text-foreground">
                {order.paymentTerms === 'contado' ? 'Contado' :
                  (typeof order.paymentTerms === 'string'
                    ? order.paymentTerms.replace('credito_', 'Crédito ') + ' días'
                    : 'No especificado')}
              </span>
            </div>
            {client && (
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Crédito:</span>
                <span className={cn(
                  'font-mono font-medium',
                  client.creditAvailable > 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {formatCurrency(client.creditAvailable)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dates Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Fechas</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Creación:</span>
              <span className="text-foreground">{formatDate(order.createdAt)}</span>
            </div>
            {order.validUntil && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Válido hasta:</span>
                <span className="text-foreground">{formatDate(order.validUntil)}</span>
              </div>
            )}
            {order.requestedDeliveryDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entrega solicitada:</span>
                <span className="text-foreground">{formatDate(order.requestedDeliveryDate)}</span>
              </div>
            )}
            {order.approvalDate && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Aprobado:</span>
                <span className="text-foreground">{formatDate(order.approvalDate)}</span>
              </div>
            )}
            {order.packedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Empacado:</span>
                <span className="text-foreground">{formatDate(order.packedAt)}</span>
              </div>
            )}
            {order.actualDeliveryDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entregado:</span>
                <span className="text-foreground">{formatDate(order.actualDeliveryDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Totals Card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-foreground">Totales</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-mono text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.expensesTotal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gastos:</span>
                <span className="font-mono text-foreground">{formatCurrency(order.expensesTotal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ITBMS ({order.taxRate}%):</span>
              <span className="font-mono text-foreground">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium text-foreground">Total:</span>
              <span className="font-mono text-lg font-bold text-foreground">{formatCurrency(order.total)}</span>
            </div>

            {/* Expenses breakdown */}
            {order.expenses && order.expenses.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Desglose de Gastos</p>
                    {order.expenses.map((exp: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{exp.description}:</span>
                            <span className="font-mono text-foreground font-medium">{formatCurrency(exp.amount)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Margin info - only for gerencia/contabilidad */}
            {canViewMargins && (
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Costo:</span>
                  <span className="font-mono text-foreground">{formatCurrency(order.totalCost || 0)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Margen:</span>
                  <span className={cn(
                    'font-mono font-medium',
                    (order.marginPercent || 0) >= 10 ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {formatCurrency(order.totalMargin || 0)} ({order.marginPercent?.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* Commission indicator for vendedor */}
            {isVendedor && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 cursor-help">
                      <div className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase',
                          allLinesEligible ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600 animate-pulse'
                        )}>
                        {allLinesEligible ? 'OK' : 'Requiere Aprobación'}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{allLinesEligible ? "Por encima del 10%" : "Por debajo del 10%"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </motion.div>

      {/* Pipeline Links */}
      {(order.quoteNumber || order.invoiceNumber) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        >
          <span className="text-sm text-muted-foreground">Documentos relacionados:</span>
          {order.quoteNumber && (
            <button
              onClick={() => router.push(`/ventas/${order.quoteId}`)}
              className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-500 hover:bg-blue-500/20"
            >
              <FileText className="h-4 w-4" />
              {order.quoteNumber}
            </button>
          )}
          {order.invoiceNumber && (
            <button
              onClick={() => router.push(`/ventas/${order.invoiceId}`)}
              className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-1.5 text-sm font-medium text-teal-500 hover:bg-teal-500/20"
            >
              <FileCheck className="h-4 w-4" />
              {order.invoiceNumber}
            </button>
          )}
        </motion.div>
      )}

      {/* Order Lines Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border bg-muted/50 px-5 py-3">
          <h3 className="font-medium text-foreground">Líneas del Documento ({(order?.lines || []).length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Producto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Precio Unit.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Descuento
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Subtotal
                </th>
                {canViewMargins && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Costo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Margen
                    </th>
                  </>
                )}
                {isVendedor && (
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(order?.lines || []).map((line: any, index: number) => (
                <motion.tr
                  key={line.id || `line-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  className="transition-colors hover:bg-accent/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{line.productDescription}</p>
                      <p className="text-xs text-muted-foreground">{line.productReference}</p>
                      {line.productBrand && (
                        <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {line.productBrand}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm text-foreground">{line.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm text-foreground">{formatCurrency(line.unitPrice)}</span>
                    {line.lastPriceToCustomer && line.lastPriceToCustomer !== line.unitPrice && (
                      <p className="text-xs text-muted-foreground">
                        Anterior: {formatCurrency(line.lastPriceToCustomer)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-muted-foreground">{line.discount}%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {formatCurrency(line.subtotal)}
                    </span>
                  </td>
                  {canViewMargins && (
                    <>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatCurrency(line.unitCost || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn(
                          'font-mono text-sm font-medium',
                          (line.marginPercent || 0) >= 10 ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          {line.marginPercent?.toFixed(1)}%
                        </span>
                      </td>
                    </>
                  )}
                   {isVendedor && (
                    <td className="px-4 py-3 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight',
                                line.commissionEligible
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 border border-red-500/20 shadow-sm'
                              )}
                            >
                              {line.commissionEligible ? 'OK' : 'REVISAR'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{line.commissionEligible ? "Margen suficiente" : "Margen insuficiente para comisión"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Additional Expenses */}
      {order?.additionalExpenses && order.additionalExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card"
        >
          <div className="border-b border-border bg-muted/50 px-5 py-3">
            <h3 className="font-medium text-foreground">Gastos Adicionales</h3>
          </div>
          <div className="p-5">
            <table className="w-full">
              <tbody className="divide-y divide-border">
                {(order?.additionalExpenses || []).map((expense: any, index: number) => (
                  <tr key={expense.id || `expense-${index}`}>
                    <td className="py-2 text-sm text-foreground">{expense.description}</td>
                    <td className="py-2 text-right">
                      <span className="font-mono text-sm text-foreground">{formatCurrency(expense.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Notes */}
      {(order.notes || order.internalNotes) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {order.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 font-medium text-foreground">Notas para el Cliente</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
          {order.internalNotes && canViewMargins && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h3 className="mb-3 font-medium text-amber-500">Notas Internas</h3>
              <p className="text-sm text-amber-500/80">{order.internalNotes}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Approval History */}
      {order.approvedByName && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="mb-3 font-medium text-foreground">Historial de Aprobación</h3>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <ThumbsUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-foreground">Aprobado por <span className="font-medium">{order.approvedByName}</span></p>
              <p className="text-muted-foreground">{order.approvalDate && formatDateTime(order.approvalDate)}</p>
            </div>
          </div>
        </motion.div>
      )}



      {/* Approve Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ThumbsUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Aprobar Pedido</h2>
                  <p className="text-sm text-muted-foreground font-normal">{order.orderNumber}</p>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              {order.requiresApproval && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-500">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Atención</p>
                    <p className="opacity-80">Este pedido tiene líneas con margen menor al 10%.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium text-foreground">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-mono font-medium text-foreground">{formatCurrency(order.total)}</p>
                </div>
                {canViewMargins && (
                  <div>
                    <span className="text-muted-foreground">Margen:</span>
                    <p className={cn(
                      'font-mono font-medium',
                      (order.marginPercent || 0) >= 10 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {order.marginPercent?.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas de aprobación (opcional)</label>
                <Textarea
                  placeholder="Agregar comentarios..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove}>
              Aprobar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Rechazar Pedido</h2>
                  <p className="text-sm text-muted-foreground font-normal">{order.orderNumber}</p>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo del rechazo *</label>
              <Textarea
                placeholder="Explica el motivo del rechazo..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!approvalNotes.trim()}>
              Rechazar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
