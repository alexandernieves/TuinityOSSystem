'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import {
  Award,
  Search,
  ChevronDown,
  X,
  Plus,
  ArrowLeft,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStore } from '@/hooks/use-store';
import {
  getCertificatesData,
  subscribeCertificates,
  getExpedientsData,
  subscribeExpedients,
} from '@/lib/mock-data/traffic';
import { CERTIFICATE_TYPE_LABELS } from '@/lib/types/traffic';
import type { CertificateType } from '@/lib/types/traffic';

type TypeFilter = CertificateType | 'all';
type StatusFilter = 'borrador' | 'completado' | 'all';

const CERT_TYPE_BADGE: Record<CertificateType, { bg: string; text: string }> = {
  libre_venta: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  origen: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  fitosanitario: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CertificadosPage() {
  const router = useRouter();
  const { checkPermission, user } = useAuth();
  const canCreate = checkPermission('canCreateCertificates');

  const certificates = useStore(subscribeCertificates, useCallback(() => getCertificatesData(), []));
  const expedients = useStore(subscribeExpedients, useCallback(() => getExpedientsData(), []));

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // New certificate modal state
  const [isOpen, setIsOpen] = useState(false);
  const [certType, setCertType] = useState<CertificateType>('libre_venta');
  const [certExpedient, setCertExpedient] = useState('');
  const [certDestination, setCertDestination] = useState('');
  const [certInvoice, setCertInvoice] = useState('');
  const [certProducts, setCertProducts] = useState<{ description: string; quantity: string }[]>([
    { description: '', quantity: '' },
  ]);

  const filtered = useMemo(() => {
    return certificates.filter((cert) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        cert.id.toLowerCase().includes(query) ||
        cert.expedientId.toLowerCase().includes(query) ||
        cert.destination.toLowerCase().includes(query) ||
        cert.invoiceNumber.toLowerCase().includes(query);
      const matchesType = typeFilter === 'all' || cert.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [certificates, searchQuery, typeFilter, statusFilter]);

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  // Available expedients for selection
  const availableExpedients = useMemo(() => {
    return expedients.filter((exp) => exp.type === 'salida').map((exp) => ({
      id: exp.id,
      label: `${exp.id} - ${exp.counterpartName} (${exp.counterpartCountry})`,
      destination: exp.counterpartCountry,
      invoice: exp.sourceDocumentId,
    }));
  }, [expedients]);

  const handleExpedientChange = (expId: string) => {
    setCertExpedient(expId);
    const exp = availableExpedients.find((e) => e.id === expId);
    if (exp) {
      setCertDestination(exp.destination);
      setCertInvoice(exp.invoice);
    }
  };

  const addProductLine = () => {
    setCertProducts((prev) => [...prev, { description: '', quantity: '' }]);
  };

  const removeProductLine = (idx: number) => {
    setCertProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateProductLine = (idx: number, field: 'description' | 'quantity', value: string) => {
    setCertProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const handleOpenModal = () => {
    setCertType('libre_venta');
    setCertExpedient('');
    setCertDestination('');
    setCertInvoice('');
    setCertProducts([{ description: '', quantity: '' }]);
    setIsOpen(true);
  };

  const handleSubmitCertificate = () => {
    if (!certExpedient) {
      toast.error('Selecciona un expediente', { id: 'cert-error' });
      return;
    }
    const validProducts = certProducts.filter((p) => p.description.trim() && p.quantity.trim());
    if (validProducts.length === 0) {
      toast.error('Agrega al menos un producto con descripcion y cantidad', { id: 'cert-error' });
      return;
    }

    toast.success('Certificado creado exitosamente', {
      id: 'new-cert',
      description: `${CERTIFICATE_TYPE_LABELS[certType]} - ${certDestination}`,
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/trafico')}
          className="flex w-fit items-center gap-1.5 text-sm text-gray-500 dark:text-[#888888] hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Trafico
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Certificados
              </h1>
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                Certificados de libre venta, origen y fitosanitarios
              </p>
            </div>
          </div>

          {canCreate && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Certificado
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar certificado, expediente, destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  typeFilter !== 'all'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                )}
              >
                {typeFilter !== 'all' ? CERTIFICATE_TYPE_LABELS[typeFilter] : 'Tipo'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={typeFilter !== 'all' ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setTypeFilter(selected === typeFilter ? 'all' : (selected as TypeFilter));
              }}
            >
              <DropdownItem key="libre_venta">Libre Venta</DropdownItem>
              <DropdownItem key="origen">Origen</DropdownItem>
              <DropdownItem key="fitosanitario">Fitosanitario</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <button
                className={cn(
                  'flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  statusFilter !== 'all'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                )}
              >
                {statusFilter !== 'all'
                  ? statusFilter === 'completado'
                    ? 'Completado'
                    : 'Borrador'
                  : 'Estado'}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              selectionMode="single"
              selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setStatusFilter(selected === statusFilter ? 'all' : (selected as StatusFilter));
              }}
            >
              <DropdownItem key="borrador">Borrador</DropdownItem>
              <DropdownItem key="completado">Completado</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Expediente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Destino
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Factura
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                  Creado por
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {filtered.map((cert, index) => {
                const typeBadge = CERT_TYPE_BADGE[cert.type];
                return (
                  <motion.tr
                    key={cert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    onClick={() => router.push(`/trafico/expedientes/${cert.expedientId}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-amber-600 dark:text-amber-400 group-hover:underline">
                        {cert.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                          typeBadge.bg,
                          typeBadge.text
                        )}
                      >
                        {CERTIFICATE_TYPE_LABELS[cert.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-sky-600 dark:text-sky-400">
                        {cert.expedientId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {cert.destination}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#888888]">
                      {cert.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          cert.status === 'completado'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            cert.status === 'completado' ? 'bg-emerald-500' : 'bg-gray-500'
                          )}
                        />
                        {cert.status === 'completado' ? 'Completado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#888888]">
                      {formatDate(cert.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#888888]">
                      {cert.createdByName}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
          <Award className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
            No se encontraron certificados
          </h3>
          <p className="text-sm text-gray-500 dark:text-[#888]">
            Intenta ajustar los filtros de busqueda
          </p>
        </div>
      )}

      {/* Results count */}
      {filtered.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-[#888]">
          Mostrando {filtered.length} de {certificates.length} certificados
        </div>
      )}

      {/* New Certificate Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg" scrollable>
          <CustomModalHeader onClose={() => setIsOpen(false)}>
            <Award className="h-5 w-5 text-amber-600" />
            Nuevo Certificado
          </CustomModalHeader>
          <CustomModalBody className="space-y-4">
              {/* Certificate type */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Tipo de certificado *
                </label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as CertificateType)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-amber-500 focus:outline-none"
                >
                  {(Object.entries(CERTIFICATE_TYPE_LABELS) as [CertificateType, string][]).map(
                    ([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    )
                  )}
                </select>
              </div>

              {/* Expedient selection */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Expediente *
                </label>
                <select
                  value={certExpedient}
                  onChange={(e) => handleExpedientChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Seleccionar expediente...</option>
                  {availableExpedients.map((exp) => (
                    <option key={exp.id} value={exp.id}>{exp.label}</option>
                  ))}
                </select>
              </div>

              {/* Auto-filled fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Pais destino
                  </label>
                  <input
                    type="text"
                    value={certDestination}
                    onChange={(e) => setCertDestination(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] px-4 text-sm text-gray-700 dark:text-gray-300"
                    readOnly
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Factura
                  </label>
                  <input
                    type="text"
                    value={certInvoice}
                    onChange={(e) => setCertInvoice(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] px-4 text-sm text-gray-700 dark:text-gray-300"
                    readOnly
                  />
                </div>
              </div>

              {/* Exporter */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                  Exportador
                </label>
                <input
                  type="text"
                  value="Evolution Zona Libre S.A."
                  className="h-10 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] px-4 text-sm text-gray-700 dark:text-gray-300"
                  readOnly
                />
              </div>

              {/* Product lines */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#888888]">
                    Productos *
                  </label>
                  <button
                    onClick={addProductLine}
                    className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Agregar linea
                  </button>
                </div>
                <div className="space-y-2">
                  {certProducts.map((product, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={product.description}
                          onChange={(e) => updateProductLine(idx, 'description', e.target.value)}
                          className="h-9 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-amber-500 focus:outline-none"
                          placeholder="Descripcion del producto"
                        />
                      </div>
                      <div className="w-40">
                        <input
                          type="text"
                          value={product.quantity}
                          onChange={(e) => updateProductLine(idx, 'quantity', e.target.value)}
                          className="h-9 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] focus:border-amber-500 focus:outline-none"
                          placeholder="Ej: 80 cajas"
                        />
                      </div>
                      {certProducts.length > 1 && (
                        <button
                          onClick={() => removeProductLine(idx)}
                          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          </CustomModalBody>
          <CustomModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
            <Button
              className="bg-amber-600 text-white"
              onPress={handleSubmitCertificate}
              isDisabled={!certExpedient}
            >
              <Award className="h-4 w-4" /> Crear Certificado
            </Button>
          </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
