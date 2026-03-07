'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Anchor } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStore } from '@/hooks/use-store';
import {
  getExpedientsData,
  subscribeExpedients,
  getDMCDocumentsData,
  subscribeDMCDocuments,
  getPortsData,
  subscribePorts,
  getExpedientById,
  getDMCsByExpedient,
} from '@/lib/mock-data/traffic';

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const inputClass =
  'h-9 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';
const selectClass =
  'h-9 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 text-sm text-gray-900 dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function NuevoBLPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPermission } = useAuth();
  const canCreate = checkPermission('canCreateBL');

  const allExpedients = useStore(subscribeExpedients, useCallback(() => getExpedientsData(), []));
  const allDmcs = useStore(subscribeDMCDocuments, useCallback(() => getDMCDocumentsData(), []));
  const ports = useStore(subscribePorts, useCallback(() => getPortsData(), []));

  const expedientId = searchParams.get('expedientId');
  const expedient = useMemo(
    () => (expedientId ? getExpedientById(expedientId) : undefined),
    [expedientId, allExpedients]
  );
  const dmcs = useMemo(
    () => (expedientId ? getDMCsByExpedient(expedientId) : []),
    [expedientId, allDmcs]
  );
  const dmc = dmcs[0];

  // Pre-build goods description from DMC lines
  const defaultGoodsDescription = useMemo(() => {
    if (!dmc) return '';
    return dmc.merchandiseLines
      .map((line) => `${line.numberOfCases} CS - ${line.description}`)
      .join('\n');
  }, [dmc]);

  // Form state
  const [shipperName, setShipperName] = useState('Evolution Zona Libre S.A.');
  const [shipperAddress, setShipperAddress] = useState(
    'Zona Libre de Colon, Calle 13, Edificio 4, Local 2, Colon, Panama'
  );
  const [consigneeName, setConsigneeName] = useState(expedient?.counterpartName ?? '');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [notifyPartyName, setNotifyPartyName] = useState('');
  const [notifyPartyAddress, setNotifyPartyAddress] = useState('');
  const [vesselName, setVesselName] = useState(expedient?.transport?.vesselName ?? '');
  const [voyageNumber, setVoyageNumber] = useState(expedient?.transport?.voyageNumber ?? '');
  const [portOfLoading, setPortOfLoading] = useState(
    expedient?.transport?.portOfLoading ?? 'PACLE'
  );
  const [portOfDischarge, setPortOfDischarge] = useState(
    expedient?.transport?.portOfDischarge ?? ''
  );
  const [bookingNumber, setBookingNumber] = useState(expedient?.transport?.bookingNumber ?? '');
  const [goodsDescription, setGoodsDescription] = useState(defaultGoodsDescription);
  const [numberOfPackages, setNumberOfPackages] = useState(expedient?.totalPackages ?? 0);
  const [grossWeight, setGrossWeight] = useState(expedient?.totalGrossWeightKg ?? 0);
  const [volume, setVolume] = useState(expedient?.totalVolumeM3 ?? 0);
  const [notes, setNotes] = useState('');

  const handleSaveDraft = () => {
    toast.success('Bill of Lading guardado como borrador', { id: 'bl-draft' });
  };

  const handleComplete = () => {
    toast.success('Bill of Lading completado exitosamente', { id: 'bl-complete' });
  };

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Anchor className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
          Sin permisos
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#888888]">
          No tienes permiso para crear Bill of Lading.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="flex w-fit items-center gap-1.5 text-sm text-gray-500 dark:text-[#888888] hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
            <Anchor className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Nuevo Bill of Lading
            </h1>
            {expedient && (
              <p className="text-sm text-gray-500 dark:text-[#888888]">
                Desde expediente {expedient.id} - {expedient.counterpartName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Shipper */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Remitente (Shipper)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                type="text"
                value={shipperName}
                onChange={(e) => setShipperName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Direccion</label>
              <input
                type="text"
                value={shipperAddress}
                onChange={(e) => setShipperAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Consignee & Notify */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Consignatario y Notificado
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Consignatario</label>
              <input
                type="text"
                value={consigneeName}
                onChange={(e) => setConsigneeName(e.target.value)}
                placeholder="Nombre del consignatario"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Direccion Consignatario</label>
              <input
                type="text"
                value={consigneeAddress}
                onChange={(e) => setConsigneeAddress(e.target.value)}
                placeholder="Direccion"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Notify Party</label>
              <input
                type="text"
                value={notifyPartyName}
                onChange={(e) => setNotifyPartyName(e.target.value)}
                placeholder="Nombre (opcional)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Direccion Notify Party</label>
              <input
                type="text"
                value={notifyPartyAddress}
                onChange={(e) => setNotifyPartyAddress(e.target.value)}
                placeholder="Direccion (opcional)"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Vessel & Ports */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Buque y Puertos
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Buque</label>
              <input
                type="text"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                placeholder="Nombre del buque"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Viaje</label>
              <input
                type="text"
                value={voyageNumber}
                onChange={(e) => setVoyageNumber(e.target.value)}
                placeholder="Numero de viaje"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Booking</label>
              <input
                type="text"
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                placeholder="Numero de booking"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Puerto de Embarque</label>
              <select
                value={portOfLoading}
                onChange={(e) => setPortOfLoading(e.target.value)}
                className={selectClass}
              >
                {ports.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Puerto de Descarga</label>
              <select
                value={portOfDischarge}
                onChange={(e) => setPortOfDischarge(e.target.value)}
                className={selectClass}
              >
                <option value="">Seleccionar...</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Goods & Cargo */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Carga
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Descripcion de la Mercancia</label>
              <textarea
                value={goodsDescription}
                onChange={(e) => setGoodsDescription(e.target.value)}
                rows={5}
                placeholder="Descripcion detallada de los bienes..."
                className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none font-mono"
              />
            </div>
            <div>
              <label className={labelClass}>Numero de Bultos</label>
              <input
                type="number"
                value={numberOfPackages || ''}
                onChange={(e) => setNumberOfPackages(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Peso Bruto (kg)</label>
              <input
                type="number"
                value={grossWeight || ''}
                onChange={(e) => setGrossWeight(Number(e.target.value))}
                className={inputClass}
                step="0.01"
              />
            </div>
            <div>
              <label className={labelClass}>Volumen (m3)</label>
              <input
                type="number"
                value={volume || ''}
                onChange={(e) => setVolume(Number(e.target.value))}
                className={inputClass}
                step="0.1"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-3">
              <p className="text-xs text-gray-500 dark:text-[#888888]">Bultos</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                {numberOfPackages}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-3">
              <p className="text-xs text-gray-500 dark:text-[#888888]">Peso Bruto</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(grossWeight)} kg
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-3">
              <p className="text-xs text-gray-500 dark:text-[#888888]">Volumen</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(volume)} m{'\u00B3'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Notas
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Observaciones adicionales..."
            className="w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveDraft}
            className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
          >
            Guardar Borrador
          </button>
          <button
            onClick={handleComplete}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Completar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
