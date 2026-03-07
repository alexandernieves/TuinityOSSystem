'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/hooks/use-store';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  ArrowLeft,
  Plus,
  Ban,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Clock,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAnnulmentRequestsData,
  subscribeAnnulmentRequests,
  addAnnulmentRequest,
  updateAnnulmentRequest,
  formatCurrencyCxC,
} from '@/lib/mock-data/accounts-receivable';
import { formatDate } from '@/lib/mock-data/sales-orders';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import type { AnnulmentStatus } from '@/lib/types/accounts-receivable';
import {
  ANNULMENT_STATUS_LABELS,
  ANNULMENT_STATUS_CONFIG,
} from '@/lib/types/accounts-receivable';

const DOCUMENT_TYPES = [
  { key: 'factura', label: 'Factura' },
  { key: 'cobro', label: 'Cobro' },
  { key: 'nota_credito', label: 'Nota de Credito' },
];

export default function AnulacionesPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canAccessCxC = checkPermission('canAccessCxC');
  const canApproveAnnulments = checkPermission('canApproveAnnulments');

  const annulmentRequests = useStore(subscribeAnnulmentRequests, getAnnulmentRequestsData);

  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New request form
  const [newDocType, setNewDocType] = useState('factura');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return annulmentRequests;
    return annulmentRequests.filter((r) => r.status === statusFilter);
  }, [statusFilter, annulmentRequests]);

  const resetForm = () => {
    setNewDocType('factura');
    setNewDocNumber('');
    setNewAmount('');
    setNewReason('');
    setNewObservations('');
  };

  const handleSubmitRequest = () => {
    if (!newDocNumber.trim()) {
      toast.error('Campo requerido', { description: 'El numero de documento es obligatorio.' });
      return;
    }
    if (!newAmount.trim() || parseFloat(newAmount) <= 0) {
      toast.error('Monto invalido', { description: 'Ingrese un monto valido.' });
      return;
    }
    if (!newReason.trim()) {
      toast.error('Campo requerido', { description: 'La razon de anulacion es obligatoria.' });
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      addAnnulmentRequest({
        id: `ANU-${String(Date.now()).slice(-5)}`,
        documentType: newDocType as any,
        documentId: newDocNumber,
        documentNumber: newDocNumber,
        clientId: '',
        clientName: '',
        amount: parseFloat(newAmount),
        reason: newReason,
        observations: newObservations || undefined,
        status: 'solicitada',
        requestedBy: 'USR-006',
        requestedByName: 'Jakeira Chavez',
        requestedAt: new Date().toISOString(),
      });
      toast.success('Solicitud creada exitosamente', {
        description: `Se creo la solicitud de anulacion para ${newDocNumber}.`,
      });
      setIsSaving(false);
      resetForm();
      setIsOpen(false);
    }, 800);
  };

  const handleApprove = (id: string) => {
    updateAnnulmentRequest(id, {
      status: 'aprobada',
      approvedBy: 'USR-001',
      approvedByName: 'Javier Lange',
      approvedAt: new Date().toISOString(),
    });
    toast.success('Solicitud aprobada', {
      description: `La solicitud ${id} ha sido aprobada.`,
    });
  };

  const handleReject = (id: string) => {
    updateAnnulmentRequest(id, {
      status: 'rechazada',
      approvedBy: 'USR-001',
      approvedByName: 'Javier Lange',
      approvedAt: new Date().toISOString(),
      rejectionReason: 'Rechazada por administrador',
    });
    toast.info('Solicitud rechazada', {
      description: `La solicitud ${id} ha sido rechazada.`,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!canAccessCxC) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Ban className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Acceso restringido</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">No tienes permisos para ver anulaciones.</p>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/clientes/cxc')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Solicitudes de Anulacion</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Gestion de anulaciones de documentos CxC</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'solicitada', 'aprobada', 'rechazada', 'ejecutada'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === status
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]'
            )}
          >
            {status === 'all' ? 'Todas' : ANNULMENT_STATUS_LABELS[status as AnnulmentStatus]}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.map((req, index) => {
          const isExpanded = expandedId === req.id;
          const statusConfig = ANNULMENT_STATUS_CONFIG[req.status];

          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]"
            >
              {/* Row */}
              <button
                onClick={() => toggleExpand(req.id)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a]">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{req.id}</span>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        statusConfig.bg,
                        statusConfig.text
                      )}>
                        {ANNULMENT_STATUS_LABELS[req.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-[#888888]">
                      {req.documentNumber} - {req.clientName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{formatCurrencyCxC(req.amount)}</p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">{formatDate(req.requestedAt)}</p>
                  </div>
                  {canApproveAnnulments && req.status === 'solicitada' && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 transition-colors hover:bg-emerald-500/20"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#888888]">Tipo Documento</p>
                          <p className="mt-0.5 text-sm font-medium capitalize text-gray-900 dark:text-white">
                            {req.documentType === 'nota_credito' ? 'Nota de Credito' : req.documentType}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#888888]">Numero Documento</p>
                          <p className="mt-0.5 font-mono text-sm font-medium text-gray-900 dark:text-white">{req.documentNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#888888]">Cliente</p>
                          <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{req.clientName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-[#888888]">Monto</p>
                          <p className="mt-0.5 font-mono text-sm font-bold text-gray-900 dark:text-white">{formatCurrencyCxC(req.amount)}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-gray-500 dark:text-[#888888]">Razon</p>
                        <p className="mt-0.5 text-sm text-gray-900 dark:text-white">{req.reason}</p>
                      </div>

                      {req.observations && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 dark:text-[#888888]">Observaciones</p>
                          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{req.observations}</p>
                        </div>
                      )}

                      {req.rejectionReason && (
                        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                          <p className="text-xs font-medium text-red-500">Motivo de Rechazo</p>
                          <p className="mt-0.5 text-sm text-red-600">{req.rejectionReason}</p>
                        </div>
                      )}

                      {/* Audit Trail */}
                      <div className="mt-4 border-t border-gray-200 dark:border-[#2a2a2a] pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">Historial de Auditoria</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10">
                              <FileText className="h-3 w-3 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">Solicitud creada</p>
                              <p className="text-xs text-gray-500 dark:text-[#888888]">
                                por {req.requestedByName} - {formatDate(req.requestedAt)}
                              </p>
                            </div>
                          </div>

                          {req.approvedAt && (
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full',
                                req.status === 'rechazada' ? 'bg-red-500/10' : 'bg-emerald-500/10'
                              )}>
                                {req.status === 'rechazada' ? (
                                  <X className="h-3 w-3 text-red-500" />
                                ) : (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {req.status === 'rechazada' ? 'Solicitud rechazada' : 'Solicitud aprobada'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-[#888888]">
                                  por {req.approvedByName} - {formatDate(req.approvedAt)}
                                </p>
                              </div>
                            </div>
                          )}

                          {req.status === 'ejecutada' && (
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10">
                                <Check className="h-3 w-3 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">Anulacion ejecutada</p>
                                <p className="text-xs text-gray-500 dark:text-[#888888]">Documento anulado en el sistema</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] py-16">
          <Ban className="mb-4 h-12 w-12 text-gray-400 dark:text-[#666666]" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">Sin solicitudes</h3>
          <p className="text-sm text-gray-500 dark:text-[#888888]">No hay solicitudes de anulacion con el filtro seleccionado</p>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
        Mostrando {filteredRequests.length} de {annulmentRequests.length} solicitudes
      </div>

      {/* New Request Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
          <CustomModalHeader onClose={() => setIsOpen(false)}>
              <Ban className="h-5 w-5 text-red-500" />
              Nueva Solicitud de Anulacion
          </CustomModalHeader>
          <CustomModalBody className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder="Seleccionar..."
                    variant="bordered"
                    selectedKeys={[newDocType]}
                    onSelectionChange={(keys) => setNewDocType(Array.from(keys)[0] as string)}
                  >
                    {DOCUMENT_TYPES.map((dt) => (
                      <SelectItem key={dt.key}>{dt.label}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Numero de Documento <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="FAC-00000"
                    variant="bordered"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monto <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="0.00"
                  type="number"
                  variant="bordered"
                  startContent={<span className="text-gray-400">$</span>}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Razon de Anulacion <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Motivo de la anulacion..."
                  variant="bordered"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observaciones
                </label>
                <textarea
                  placeholder="Detalles adicionales..."
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="rounded-lg bg-amber-500/5 border border-amber-500/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Esta solicitud sera enviada a Gerencia para aprobacion. El documento no sera anulado hasta que se apruebe y ejecute.
                  </p>
                </div>
              </div>
            </div>
          </CustomModalBody>
          <CustomModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)} isDisabled={isSaving}>
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleSubmitRequest}
              isLoading={isSaving}
            >
              Enviar Solicitud
            </Button>
          </CustomModalFooter>
      </CustomModal>
    </motion.div>
  );
}
