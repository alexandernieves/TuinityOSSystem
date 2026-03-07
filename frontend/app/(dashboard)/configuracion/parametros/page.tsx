'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Input,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  DollarSign,
  ChevronDown,
  Edit,
  Save,
  Percent,
  Hash,
  FileText,
  Tag,
  CreditCard,
  Receipt,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useStore } from '@/hooks/use-store';
import {
  getCommercialParamsData,
  subscribeCommercialParams,
  updateCommercialParams,
  getDocumentNumberingData,
  subscribeDocumentNumbering,
  updateDocumentNumbering,
} from '@/lib/mock-data/configuration';

export default function ParametrosPage() {
  const router = useRouter();

  const commercialParams = useStore(subscribeCommercialParams, getCommercialParamsData);
  const documentNumbering = useStore(subscribeDocumentNumbering, getDocumentNumberingData);

  const [isOpen, setIsOpen] = useState(false);

  const [expandedSection, setExpandedSection] = useState<string | null>('precios');
  const [commissionThreshold, setCommissionThreshold] = useState(commercialParams.commissionThreshold.toString());
  const [taxRate, setTaxRate] = useState(commercialParams.taxRate.toString());

  // Document numbering modal
  const [editingDoc, setEditingDoc] = useState<(typeof documentNumbering)[0] | null>(null);
  const [docForm, setDocForm] = useState({ prefix: '', paddingLength: '5' });

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleOpenDocModal = (doc: (typeof documentNumbering)[0]) => {
    setEditingDoc(doc);
    setDocForm({ prefix: doc.prefix, paddingLength: doc.paddingLength.toString() });
    setIsOpen(true);
  };

  const handleSaveDoc = () => {
    if (editingDoc) {
      updateDocumentNumbering(editingDoc.id, { prefix: docForm.prefix, paddingLength: parseInt(docForm.paddingLength) || 5 });
    }
    toast.success('Numeración actualizada', {
      description: `Se actualizó la numeración de ${editingDoc?.documentLabel}`,
    });
    setIsOpen(false);
  };

  const handleSaveParams = () => {
    updateCommercialParams({
      commissionThreshold: parseFloat(commissionThreshold) || 0,
      taxRate: parseFloat(taxRate) || 0,
    });
    toast.success('Parámetros guardados', {
      description: 'Los parámetros comerciales se han actualizado correctamente.',
    });
  };

  const sections = [
    {
      id: 'precios',
      title: 'Niveles de Precio (A-E)',
      icon: Tag,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      id: 'comisiones',
      title: 'Comisiones',
      icon: Percent,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      id: 'pagos',
      title: 'Términos de Pago',
      icon: CreditCard,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-950',
    },
    {
      id: 'impuestos',
      title: 'Impuestos',
      icon: Receipt,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      id: 'numeracion',
      title: 'Numeración de Documentos',
      icon: Hash,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <button
          onClick={() => router.push('/configuracion')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-[#888888] transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Configuración
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Parámetros Comerciales</h1>
              <p className="text-sm text-gray-500 dark:text-[#888888]">Precios, comisiones, impuestos y numeración de documentos</p>
            </div>
          </div>
          <button
            onClick={handleSaveParams}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Save className="h-4 w-4" />
            Guardar Todo
          </button>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          return (
            <div
              key={section.id}
              className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', section.bgColor)}>
                    <section.icon className={cn('h-4 w-4', section.color)} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4">
                      {/* Price Levels */}
                      {section.id === 'precios' && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Nivel</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Nombre</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Descripción</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Por Defecto</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Activo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                              {commercialParams.priceLevels.map((level) => (
                                <tr key={level.level} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                  <td className="px-4 py-3">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-sm font-bold text-brand-600">
                                      {level.level}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{level.name}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{level.description}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {commercialParams.defaultPriceLevel === level.level && (
                                      <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-500">Por Defecto</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Switch defaultChecked={level.isActive} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Commissions */}
                      {section.id === 'comisiones' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Umbral de Comisión</p>
                              <p className="text-xs text-gray-500 dark:text-[#888888]">Margen mínimo para generar comisión</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={commissionThreshold}
                                onChange={(e) => setCommissionThreshold(e.target.value)}
                                className="h-9 w-20 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-center text-sm font-medium text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Vendedor</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Tasa (%)</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Activo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                                {commercialParams.commissionRates.map((rate) => (
                                  <tr key={rate.userId} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                    <td className="px-4 py-3">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{rate.userName}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="number"
                                        step="0.5"
                                        defaultValue={rate.rate}
                                        className="h-8 w-20 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-2 text-center text-sm font-medium text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Switch defaultChecked={rate.isActive} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Payment Terms */}
                      {section.id === 'pagos' && (
                        <div className="space-y-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => toast.info('Agregar término de pago (mock)')}
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Agregar
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Código</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Etiqueta</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Días</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Activo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                                {commercialParams.paymentTermsOptions.map((term) => (
                                  <tr key={term.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                    <td className="px-4 py-3">
                                      <span className="rounded bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 font-mono text-xs text-gray-700 dark:text-gray-300">{term.code}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">{term.label}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{term.days}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Switch defaultChecked={term.isActive} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Taxes */}
                      {section.id === 'impuestos' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ITBMS (Impuesto de Transferencia de Bienes Muebles y Servicios)</p>
                              <p className="text-xs text-gray-500 dark:text-[#888888]">Tasa impositiva general aplicable</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                className="h-9 w-20 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-center text-sm font-medium text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Zonas Exentas de Impuesto</h4>
                            <div className="flex flex-wrap gap-2">
                              {commercialParams.taxExemptZones.map((zone) => (
                                <span
                                  key={zone}
                                  className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-600"
                                >
                                  {zone}
                                </span>
                              ))}
                              <button
                                onClick={() => toast.info('Agregar zona exenta (mock)')}
                                className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 dark:border-[#2a2a2a] px-3 py-1 text-sm text-gray-500 dark:text-[#888888] hover:border-gray-400 dark:hover:border-[#3a3a3a]"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Document Numbering */}
                      {section.id === 'numeracion' && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-[#2a2a2a]">
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Documento</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Prefijo</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Número Actual</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Relleno</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Ejemplo</th>
                                <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Editar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                              {documentNumbering.map((doc) => (
                                <tr key={doc.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                  <td className="px-4 py-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.documentLabel}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="rounded bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{doc.prefix}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{doc.currentNumber}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{doc.paddingLength} dígitos</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="rounded bg-brand-500/10 px-2 py-0.5 font-mono text-xs font-medium text-brand-600">{doc.example}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleOpenDocModal(doc)}
                                      className="flex mx-auto h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-[#666666] transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-white"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Document Numbering Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
              <Hash className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Numeración</h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">{editingDoc?.documentLabel}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prefijo</label>
              <Input placeholder="Ej: FAC-" value={docForm.prefix} onChange={(e) => setDocForm({ ...docForm, prefix: e.target.value })} variant="bordered" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitud de Relleno (dígitos)</label>
              <Input placeholder="5" type="number" value={docForm.paddingLength} onChange={(e) => setDocForm({ ...docForm, paddingLength: e.target.value })} variant="bordered" />
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-3">
              <p className="text-xs text-gray-500 dark:text-[#888888]">Vista previa:</p>
              <p className="mt-1 font-mono text-sm font-medium text-brand-600">
                {docForm.prefix}{String(editingDoc?.currentNumber || 1).padStart(parseInt(docForm.paddingLength) || 5, '0')}
              </p>
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
          <Button color="primary" onPress={handleSaveDoc} className="bg-brand-600">
            Guardar
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
