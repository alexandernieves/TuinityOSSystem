'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Switch } from '@/components/ui/switch';
import {
  RotateCcw,
  Package,
  AlertCircle,
  Check,
  Search,
  FileText,
  Calendar,
  Building2,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getSalesOrdersData,
  subscribeSalesOrders,
  formatDate,
  formatCurrency,
} from '@/lib/mock-data/sales-orders';
import type { SalesOrder, SalesOrderLine } from '@/lib/types/sales-order';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';

const RETURN_REASONS = [
  { key: 'defectuoso', label: 'Producto Defectuoso' },
  { key: 'incorrecto', label: 'Producto Incorrecto' },
  { key: 'danado', label: 'Daño en Transporte' },
  { key: 'no_solicitado', label: 'No Solicitado' },
  { key: 'otro', label: 'Otro' },
];

interface ReturnLine {
  lineId: string;
  productReference: string;
  productDescription: string;
  originalQuantity: number;
  returnQuantity: number;
  reason: string;
}

interface Return {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  status: 'pendiente' | 'procesada' | 'rechazada';
  lines: ReturnLine[];
  total: number;
  createdAt: string;
  notes?: string;
}

// Mock returns data
const MOCK_RETURNS: Return[] = [
  {
    id: 'ret-001',
    returnNumber: 'DEV-00001',
    invoiceId: 'so-009',
    invoiceNumber: 'FAC-00009',
    customerId: 'cli-001',
    customerName: 'MARIA DEL MAR PEREZ SV',
    status: 'pendiente',
    lines: [
      {
        lineId: 'line-001',
        productReference: 'JW-BL-750',
        productDescription: 'Johnnie Walker Blue Label 750ml',
        originalQuantity: 12,
        returnQuantity: 2,
        reason: 'danado',
      },
    ],
    total: 460.0,
    createdAt: '2024-01-18',
    notes: 'Botellas llegaron con empaque roto',
  },
  {
    id: 'ret-002',
    returnNumber: 'DEV-00002',
    invoiceId: 'so-010',
    invoiceNumber: 'FAC-00010',
    customerId: 'cli-003',
    customerName: 'PONCHO PLACE',
    status: 'procesada',
    lines: [
      {
        lineId: 'line-002',
        productReference: 'HEN-VS-1000',
        productDescription: 'Hennessy VS 1000ml',
        originalQuantity: 24,
        returnQuantity: 4,
        reason: 'incorrecto',
      },
    ],
    total: 180.0,
    createdAt: '2024-01-15',
  },
];

export default function DevolucionesPage() {
  const router = useRouter();
  const salesOrders = useStore(subscribeSalesOrders, getSalesOrdersData);
  const { checkPermission } = useAuth();
  const canProcessReturns = checkPermission('canProcessReturns');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesOrder | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([]);
  const [returnNotes, setReturnNotes] = useState('');

  const [isNewReturnOpen, setIsNewReturnOpen] = useState(false);
  const [isViewReturnOpen, setIsViewReturnOpen] = useState(false);

  // Get invoiced orders (can create returns from)
  const invoicedOrders = useMemo(() => {
    return salesOrders.filter((order) => order.status === 'facturado');
  }, [salesOrders]);

  // Filter returns
  const filteredReturns = useMemo(() => {
    return MOCK_RETURNS.filter((ret) => {
      const matchesSearch =
        !searchQuery ||
        ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Stats
  const pendingReturns = MOCK_RETURNS.filter((r) => r.status === 'pendiente').length;
  const processedReturns = MOCK_RETURNS.filter((r) => r.status === 'procesada').length;
  const totalReturnValue = MOCK_RETURNS.filter((r) => r.status === 'procesada').reduce((sum, r) => sum + r.total, 0);

  const handleSelectInvoice = (order: SalesOrder) => {
    setSelectedInvoice(order);
    setReturnLines([]);
    setReturnNotes('');
  };

  const toggleLineForReturn = (line: SalesOrderLine) => {
    setReturnLines((prev) => {
      const existing = prev.find((l) => l.lineId === line.id);
      if (existing) {
        return prev.filter((l) => l.lineId !== line.id);
      }
      return [
        ...prev,
        {
          lineId: line.id,
          productReference: line.productReference,
          productDescription: line.productDescription,
          originalQuantity: line.quantity,
          returnQuantity: 1,
          reason: 'defectuoso',
        },
      ];
    });
  };

  const updateReturnLine = (lineId: string, field: 'returnQuantity' | 'reason', value: string | number) => {
    setReturnLines((prev) =>
      prev.map((l) =>
        l.lineId === lineId ? { ...l, [field]: value } : l
      )
    );
  };

  const handleCreateReturn = () => {
    if (!selectedInvoice || returnLines.length === 0) return;

    toast.success('Devolución creada', {
      description: `Se ha registrado la devolución para la factura ${selectedInvoice.orderNumber}.`,
    });
    setIsNewReturnOpen(false);
    setSelectedInvoice(null);
    setReturnLines([]);
    setReturnNotes('');
  };

  const handleViewReturn = (ret: Return) => {
    setSelectedReturn(ret);
    setIsViewReturnOpen(true);
  };

  const handleProcessReturn = () => {
    if (!selectedReturn) return;

    toast.success('Devolución procesada', {
      description: `La devolución ${selectedReturn.returnNumber} ha sido procesada.`,
    });
    setIsViewReturnOpen(false);
    setSelectedReturn(null);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      pendiente: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
      procesada: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle2 },
      rechazada: { bg: 'bg-red-500/10', text: 'text-red-500', icon: X },
    };
    return configs[status] || configs.pendiente;
  };

  // Redirect if not authorized
  if (!canProcessReturns) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
        <h2 className="mb-2 text-lg font-medium text-foreground">Acceso restringido</h2>
        <p className="mb-4 text-sm text-muted-foreground">No tienes permisos para gestionar devoluciones.</p>
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
          <h1 className="text-2xl font-semibold text-foreground">Devoluciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestionar devoluciones de productos
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => setIsNewReturnOpen(true)}
        >
          Nueva Devolución
        </Button>
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
              <p className="text-2xl font-semibold text-foreground">{pendingReturns}</p>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{processedReturns}</p>
              <p className="text-sm text-muted-foreground">Procesadas (mes)</p>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <RotateCcw className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalReturnValue)}</p>
              <p className="text-sm text-muted-foreground">Valor devuelto</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, factura o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            variant="bordered"
          />
        </div>
        <Select
          className="w-48"
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
          variant="bordered"
          placeholder="Estado"
          aria-label="Filtrar por estado"
        >
          <SelectItem key="all">Todos</SelectItem>
          <SelectItem key="pendiente">Pendientes</SelectItem>
          <SelectItem key="procesada">Procesadas</SelectItem>
          <SelectItem key="rechazada">Rechazadas</SelectItem>
        </Select>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <RotateCcw className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-1 text-lg font-medium text-foreground">Sin devoluciones</h3>
          <p className="text-sm text-muted-foreground">No hay devoluciones registradas</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Devolución</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Factura</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReturns.map((ret) => {
                const statusConfig = getStatusConfig(ret.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={ret.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-foreground">{ret.returnNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-muted-foreground">{ret.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">{ret.customerName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{formatDate(ret.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-semibold text-red-500">-{formatCurrency(ret.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize',
                        statusConfig.bg,
                        statusConfig.text
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => handleViewReturn(ret)}
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Return Modal */}
      <CustomModal isOpen={isNewReturnOpen} onClose={() => setIsNewReturnOpen(false)} size="3xl" scrollable>
        <CustomModalHeader onClose={() => setIsNewReturnOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <RotateCcw className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Nueva Devolución</h2>
              <p className="text-sm text-muted-foreground">Crear devolución desde factura</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          {!selectedInvoice ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecciona la factura para crear la devolución:</p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {invoicedOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectInvoice(order)}
                    className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-brand-500/50 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span>
                        <p className="mt-1 text-sm text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-foreground">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Invoice */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Factura seleccionada</p>
                  <p className="font-mono font-semibold text-foreground">{selectedInvoice.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.customerName}</p>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setSelectedInvoice(null)}
                  startContent={<X className="h-4 w-4" />}
                >
                  Cambiar
                </Button>
              </div>

              {/* Select Lines */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-foreground">Seleccionar productos a devolver:</h4>
                <div className="space-y-2">
                  {selectedInvoice.lines.map((line) => {
                    const isSelected = returnLines.some((l) => l.lineId === line.id);
                    const returnLine = returnLines.find((l) => l.lineId === line.id);

                    return (
                      <div
                        key={line.id}
                        className={cn(
                          'rounded-lg border p-4 transition-colors',
                          isSelected ? 'border-brand-500/50 bg-brand-500/5' : 'border-border bg-card'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => toggleLineForReturn(line)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{line.productDescription}</p>
                            <p className="text-xs text-muted-foreground">{line.productReference}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Cantidad original: <span className="font-mono font-medium">{line.quantity}</span>
                            </p>
                          </div>
                        </div>

                        {isSelected && returnLine && (
                          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad a devolver</label>
                              <Input
                                type="number"
                                min={1}
                                max={line.quantity}
                                value={String(returnLine.returnQuantity)}
                                onChange={(e) =>
                                  updateReturnLine(line.id, 'returnQuantity', parseInt(e.target.value) || 1)
                                }
                                variant="bordered"
                                size="sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Motivo</label>
                              <Select
                                selectedKeys={[returnLine.reason]}
                                onSelectionChange={(keys) =>
                                  updateReturnLine(line.id, 'reason', Array.from(keys)[0] as string)
                                }
                                variant="bordered"
                                size="sm"
                                aria-label="Motivo"
                              >
                                {RETURN_REASONS.map((reason) => (
                                  <SelectItem key={reason.key}>{reason.label}</SelectItem>
                                ))}
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas adicionales</label>
                <Textarea
                  placeholder="Descripción detallada del motivo de la devolución..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  variant="bordered"
                  minRows={2}
                />
              </div>

              {/* Warning */}
              {returnLines.length > 0 && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">
                        Se devolverán {returnLines.reduce((sum, l) => sum + l.returnQuantity, 0)} unidades
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Esta acción generará una nota de crédito y ajustará el inventario.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsNewReturnOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="warning"
            onPress={handleCreateReturn}
            isDisabled={!selectedInvoice || returnLines.length === 0}
            startContent={<RotateCcw className="h-4 w-4" />}
          >
            Crear Devolución
          </Button>
        </CustomModalFooter>
      </CustomModal>

      {/* View Return Modal */}
      <CustomModal isOpen={isViewReturnOpen} onClose={() => setIsViewReturnOpen(false)} size="lg" scrollable>
        <CustomModalHeader onClose={() => setIsViewReturnOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selectedReturn?.returnNumber}</h2>
              <p className="text-sm text-muted-foreground">Factura: {selectedReturn?.invoiceNumber}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium text-foreground">{selectedReturn?.customerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>
                <p className="font-medium text-foreground">{selectedReturn?.createdAt && formatDate(selectedReturn.createdAt)}</p>
              </div>
            </div>

            {/* Lines */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 text-sm font-medium text-foreground">Productos devueltos:</h4>
              <div className="space-y-3">
                {selectedReturn?.lines.map((line) => (
                  <div key={line.lineId} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{line.productDescription}</p>
                      <p className="text-xs text-muted-foreground">{line.productReference}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Motivo: {RETURN_REASONS.find((r) => r.key === line.reason)?.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-red-500">-{line.returnQuantity}</p>
                      <p className="text-xs text-muted-foreground">de {line.originalQuantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedReturn?.notes && (
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{selectedReturn.notes}</p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between rounded-lg border border-border bg-muted/30 p-4">
              <span className="font-medium text-foreground">Valor de devolución:</span>
              <span className="font-mono text-lg font-bold text-red-500">
                -{formatCurrency(selectedReturn?.total || 0)}
              </span>
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsViewReturnOpen(false)}>
            Cerrar
          </Button>
          {selectedReturn?.status === 'pendiente' && (
            <Button
              color="success"
              onPress={handleProcessReturn}
              startContent={<Check className="h-4 w-4" />}
            >
              Procesar Devolución
            </Button>
          )}
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
