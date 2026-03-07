'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Anchor,
  Award,
  Package,
  Ship,
  Clock,
  Globe,
  User,
  Truck,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Container,
  MapPin,
  XCircle,
  Circle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api'; import {
  SHIPMENT_STATUS_CONFIG,
  SHIPMENT_TYPE_LABELS,
  PRIORITY_LABELS,
  DMC_STATUS_CONFIG,
  BL_STATUS_CONFIG,
  TRANSPORT_MODE_LABELS,
  CERTIFICATE_TYPE_LABELS,
} from '@/lib/types/traffic';
import type { ShipmentPriority } from '@/lib/types/traffic';

type TabKey = 'resumen' | 'mercancia' | 'documentos' | 'logistica' | 'timeline';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'mercancia', label: 'Mercancia' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'logistica', label: 'Logistica' },
  { key: 'timeline', label: 'Timeline' },
];

const PRIORITY_COLOR: Record<ShipmentPriority, string> = {
  urgente: 'bg-red-50 text-red-700',
  normal: 'bg-green-50 text-green-700',
  anticipado: 'bg-yellow-50 text-yellow-700',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

const TIMELINE_ICONS: Record<string, typeof FileText> = {
  expediente_creado: FileText,
  dmc_generada: FileText,
  bl_generado: Anchor,
  certificado_generado: Award,
  dmc_registrada: CheckCircle2,
  transporte_asignado: Truck,
  despachado: Ship,
  en_transito: Ship,
  entregado: CheckCircle2,
  cancelado: AlertCircle,
};

type MercanciaView = 'producto' | 'arancelaria' | 'rubro';

// Extract rubro (product group) from merchandise description
// Descriptions typically start with the category: "WHISKY JOHNNIE...", "RON DIPLOMATICO...", etc.
function extractRubroFromDescription(description: string): string {
  const first = description.split(' ')[0]?.toUpperCase() ?? 'OTROS';
  const KNOWN_RUBROS = ['WHISKY', 'RON', 'VODKA', 'TEQUILA', 'LICOR', 'VINO', 'GINEBRA', 'CERVEZA', 'SNACKS', 'CHAMPAGNE', 'COGNAC', 'BRANDY'];
  return KNOWN_RUBROS.includes(first) ? first : 'OTROS';
}

export default function ExpedientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { checkPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [mercanciaView, setMercanciaView] = useState<MercanciaView>('producto');
  const [expandedRubros, setExpandedRubros] = useState<Set<string>>(new Set());

  const id = params.id as string;

  const [realExpedient, setRealExpedient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getExpedientById(id);
        setRealExpedient(data);
      } catch (err) {
        console.error('Error fetching expedient:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const expedient = realExpedient;
  // For now, these sub-resources are empty since we haven't implemented their list-by-expedient endpoints
  const dmcs: any[] = useMemo(() => [], []);
  const bl: any = useMemo(() => undefined, []);
  const certificates: any[] = useMemo(() => [], []);
  const timeline: any[] = useMemo(() => [], []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
        <p className="mt-4 text-sm text-gray-500 dark:text-[#888888]">Cargando expediente...</p>
      </div>
    );
  }

  if (!expedient) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertCircle className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
          Expediente no encontrado
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-[#888888]">
          El expediente &quot;{id}&quot; no existe o fue eliminado.
        </p>
        <button
          onClick={() => router.push('/trafico')}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Trafico
        </button>
      </div>
    );
  }

  const statusConfig = (SHIPMENT_STATUS_CONFIG as any)[expedient.status] || (SHIPMENT_STATUS_CONFIG as any).proceso;
  const dmc = dmcs[0];
  const merchandiseLines: any[] = dmc?.merchandiseLines ?? [];

  // Group merchandise lines by rubro
  const groupedByRubro = useMemo(() => {
    const groups: Record<string, {
      lines: typeof merchandiseLines;
      totalCases: number;
      totalNetWeight: number;
      totalGrossWeight: number;
      totalVolume: number;
      totalValue: number;
    }> = {};
    for (const line of merchandiseLines) {
      const rubro = extractRubroFromDescription(line.description);
      if (!groups[rubro]) {
        groups[rubro] = { lines: [], totalCases: 0, totalNetWeight: 0, totalGrossWeight: 0, totalVolume: 0, totalValue: 0 };
      }
      groups[rubro].lines.push(line);
      groups[rubro].totalCases += line.numberOfCases;
      groups[rubro].totalNetWeight += line.netWeightKg;
      groups[rubro].totalGrossWeight += line.grossWeightKg;
      groups[rubro].totalVolume += line.volumeM3;
      groups[rubro].totalValue += line.valueFOB;
    }
    return groups;
  }, [merchandiseLines]);

  const toggleRubro = (rubro: string) => {
    setExpandedRubros((prev) => {
      const next = new Set(prev);
      if (next.has(rubro)) next.delete(rubro);
      else next.add(rubro);
      return next;
    });
  };

  const expandAllRubros = () => {
    setExpandedRubros(new Set(Object.keys(groupedByRubro)));
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950">
              <Ship className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white font-mono">
                  {expedient.expedientNumber || expedient._id}
                </h1>
                <span
                  className={cn(
                    'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                    expedient.type === 'salida' &&
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                    expedient.type === 'entrada' &&
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    expedient.type === 'traspaso' &&
                    'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                    expedient.type === 'transferencia' &&
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  )}
                >
                  {(SHIPMENT_TYPE_LABELS as any)[expedient.type] || expedient.type}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    statusConfig.bg,
                    statusConfig.text
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig?.dot)} />
                  {statusConfig?.label || expedient.status}
                </span>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs',
                    (PRIORITY_COLOR as any)[expedient.priority] || 'bg-gray-100'
                  )}
                >
                  {(PRIORITY_LABELS as any)[expedient.priority] || expedient.priority}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-[#888888]">
                <span>{formatDate(expedient.createdAt)}</span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {expedient.counterpartName} - {expedient.counterpartCountry}
                </span>
              </div>
            </div>
          </div>

          {/* Document status bar */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 py-2.5">
            <div className="flex items-center gap-1.5" title={expedient.dmcId ? 'DMC generada' : 'DMC pendiente'}>
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-[#888888]">DMC</span>
              {expedient.dmcId ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-[#2a2a2a]" />
            <div className="flex items-center gap-1.5" title={expedient.blId ? 'BL generado' : 'BL pendiente'}>
              <Anchor className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-[#888888]">BL</span>
              {expedient.blId ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-[#2a2a2a]" />
            <div className="flex items-center gap-1.5" title={certificates.length ? 'Certificado emitido' : 'Sin certificado'}>
              <Award className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-[#888888]">Cert</span>
              {certificates.length ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-[#2a2a2a]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 dark:text-[#888888] hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'resumen' && (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Expedient data card */}
              <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Datos del Expediente
                </h3>
                <dl className="space-y-3">
                  {[
                    { label: 'Tipo', value: (SHIPMENT_TYPE_LABELS as any)[expedient.type] || expedient.type },
                    { label: 'Documento origen', value: `${expedient.sourceDocumentId} (${expedient.sourceDocumentType})` },
                    { label: 'Contraparte', value: expedient.counterpartName },
                    { label: 'Pais', value: expedient.counterpartCountry },
                    { label: 'Fecha creacion', value: formatDate(expedient.createdAt) },
                    { label: 'Fecha estimada despacho', value: expedient.estimatedDispatchDate ? formatDate(expedient.estimatedDispatchDate) : '\u2014' },
                    { label: 'Fecha real despacho', value: expedient.actualDispatchDate ? formatDate(expedient.actualDispatchDate) : '\u2014' },
                    { label: 'Creado por', value: expedient.createdByName },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-[#888888]">{item.label}</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white text-right">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                  {expedient.notes && (
                    <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                      <dt className="text-sm text-gray-500 dark:text-[#888888] mb-1">Notas</dt>
                      <dd className="text-sm text-gray-700 dark:text-gray-300">{expedient.notes}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Totals card */}
              <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Totales
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Bultos', value: expedient.totalPackages.toString(), icon: Package },
                    { label: 'Cajas', value: expedient.totalCases.toString(), icon: Container },
                    { label: 'Peso neto', value: `${formatNumber(expedient.totalNetWeightKg)} kg`, icon: Package },
                    { label: 'Peso bruto', value: `${formatNumber(expedient.totalGrossWeightKg)} kg`, icon: Package },
                    { label: 'Volumen m3', value: `${formatNumber(expedient.totalVolumeM3)} m\u00B3`, icon: Package },
                    { label: 'Volumen ft3', value: `${formatNumber(expedient.totalVolumeFt3)} ft\u00B3`, icon: Package },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-3"
                    >
                      <p className="text-xs text-gray-500 dark:text-[#888888]">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                  <div className="col-span-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 p-3">
                    <p className="text-xs text-sky-600 dark:text-sky-400">Valor FOB</p>
                    <p className="mt-1 text-2xl font-bold text-sky-700 dark:text-sky-300">
                      {formatCurrency(expedient.totalValueFOB)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mercancia' && (
            <div className="space-y-3">
              {/* View toggle buttons */}
              {merchandiseLines.length > 0 && (
                <div className="flex items-center gap-2">
                  {(['producto', 'arancelaria', 'rubro'] as MercanciaView[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        setMercanciaView(view);
                        if (view === 'rubro') expandAllRubros();
                      }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        mercanciaView === view
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-[#141414] dark:text-gray-400 dark:border-[#2a2a2a] dark:hover:bg-[#1a1a1a]'
                      )}
                    >
                      {view === 'rubro' && <Layers className="h-3.5 w-3.5" />}
                      {view === 'producto' && <Package className="h-3.5 w-3.5" />}
                      {view === 'arancelaria' && <FileText className="h-3.5 w-3.5" />}
                      {view === 'producto' ? 'Por producto' : view === 'arancelaria' ? 'Por arancelaria' : 'Agrupar por Rubro'}
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
                {merchandiseLines.length > 0 ? (
                  <>
                    {/* Rubro grouped view */}
                    {mercanciaView === 'rubro' ? (
                      <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                        {Object.entries(groupedByRubro)
                          .sort(([, a], [, b]) => b.totalValue - a.totalValue)
                          .map(([rubro, group]) => {
                            const isExpanded = expandedRubros.has(rubro);
                            return (
                              <div key={rubro}>
                                {/* Rubro header */}
                                <button
                                  onClick={() => toggleRubro(rubro)}
                                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </motion.div>
                                    <span className="inline-flex rounded-md bg-sky-100 dark:bg-sky-950/40 px-2 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                                      {rubro}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-[#888]">
                                      {group.lines.length} {group.lines.length === 1 ? 'producto' : 'productos'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6 text-xs">
                                    <span className="text-gray-500 dark:text-[#888]">
                                      {group.totalCases} cajas
                                    </span>
                                    <span className="text-gray-500 dark:text-[#888]">
                                      {formatNumber(group.totalNetWeight)} kg
                                    </span>
                                    <span className="text-gray-500 dark:text-[#888]">
                                      {formatNumber(group.totalVolume)} m{'\u00B3'}
                                    </span>
                                    <span className="font-mono font-semibold text-sky-700 dark:text-sky-300">
                                      {formatCurrency(group.totalValue)}
                                    </span>
                                  </div>
                                </button>

                                {/* Expanded products */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#1a1a1a]/50">
                                            <th className="px-4 py-2 pl-12 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-[#666]">Arancel</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-[#666]">Descripcion</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-[#666]">Cajas</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-[#666]">Peso Neto</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-[#666]">Vol m3</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-[#666]">FOB</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                                          {group.lines.map((line: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/50">
                                              <td className="px-4 py-2 pl-12 font-mono text-xs text-gray-600 dark:text-gray-400">{line.tariffCode}</td>
                                              <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">{line.description}</td>
                                              <td className="px-4 py-2 text-right text-xs text-gray-900 dark:text-white">{line.numberOfCases}</td>
                                              <td className="px-4 py-2 text-right text-xs text-gray-900 dark:text-white">{formatNumber(line.netWeightKg)}</td>
                                              <td className="px-4 py-2 text-right text-xs text-gray-900 dark:text-white">{formatNumber(line.volumeM3)}</td>
                                              <td className="px-4 py-2 text-right font-mono text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(line.valueFOB)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot>
                                          <tr className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50/80 dark:bg-[#1a1a1a]/80">
                                            <td className="px-4 py-2 pl-12 text-xs font-semibold text-gray-700 dark:text-gray-300" colSpan={2}>
                                              Subtotal {rubro}
                                            </td>
                                            <td className="px-4 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">{group.totalCases}</td>
                                            <td className="px-4 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNumber(group.totalNetWeight)}</td>
                                            <td className="px-4 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">{formatNumber(group.totalVolume)}</td>
                                            <td className="px-4 py-2 text-right font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{formatCurrency(group.totalValue)}</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}

                        {/* Grand total */}
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Totales</span>
                            <div className="flex items-center gap-6 text-xs">
                              <span className="font-semibold text-gray-900 dark:text-white">{expedient.totalCases} cajas</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(expedient.totalNetWeightKg)} kg</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(expedient.totalVolumeM3)} m{'\u00B3'}</span>
                              <span className="font-mono font-bold text-sky-700 dark:text-sky-300">{formatCurrency(expedient.totalValueFOB)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Default flat table view (producto / arancelaria) */
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Arancel
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Descripcion
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Cajas
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Peso Neto (kg)
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Peso Bruto (kg)
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Volumen (m3)
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                                Valor FOB
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                            {((mercanciaView === 'arancelaria'
                              ? [...merchandiseLines].sort((a: any, b: any) => a.tariffCode.localeCompare(b.tariffCode))
                              : merchandiseLines
                            ) as any[]).map((line: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                                  {line.tariffCode}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                  {line.description}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                  {line.numberOfCases}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                  {formatNumber(line.netWeightKg)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                  {formatNumber(line.grossWeightKg)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                  {formatNumber(line.volumeM3)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-sm font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(line.valueFOB)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white" colSpan={2}>
                                Totales
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                {expedient.totalCases}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                {formatNumber(expedient.totalNetWeightKg)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                {formatNumber(expedient.totalGrossWeightKg)}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                {formatNumber(expedient.totalVolumeM3)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-sm font-bold text-sky-700 dark:text-sky-300">
                                {formatCurrency(expedient.totalValueFOB)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <FileText className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      No hay DMC generada
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">
                      Genera una DMC para ver las lineas de mercancia
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documentos' && (
            <div className="space-y-4">
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {checkPermission('canCreateDMC') && !expedient.dmcId && (
                  <button
                    onClick={() => router.push(`/trafico/dmc/nuevo?expedientId=${expedient.id}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    +Generar DMC
                  </button>
                )}
                {checkPermission('canCreateBL') && !expedient.blId && (
                  <button
                    onClick={() => router.push(`/trafico/bl/nuevo?expedientId=${expedient.id}`)}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
                  >
                    <Anchor className="h-4 w-4" />
                    +Generar BL
                  </button>
                )}
                {checkPermission('canCreateCertificates') && (
                  <button
                    onClick={() => router.push(`/trafico/certificados`)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    <Award className="h-4 w-4" />
                    +Generar Certificado
                  </button>
                )}
              </div>

              {/* Document list */}
              <div className="space-y-3">
                {dmcs.map((d: any) => {
                  const config = (DMC_STATUS_CONFIG as any)[d.status] || (DMC_STATUS_CONFIG as any).borrador;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            DMC {d.id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#888888]">
                            {formatDate(d.createdAt)} - {d.createdByName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                          config.bg,
                          config.text
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                        {config.label}
                      </span>
                    </div>
                  );
                })}

                {bl && (
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                        <Anchor className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Bill of Lading {bl.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#888888]">
                          {formatDate(bl.createdAt)} - {bl.createdByName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        (BL_STATUS_CONFIG as any)[bl.status]?.bg || 'bg-gray-100',
                        (BL_STATUS_CONFIG as any)[bl.status]?.text || 'text-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          (BL_STATUS_CONFIG as any)[bl.status]?.dot || 'bg-gray-400'
                        )}
                      />
                      {(BL_STATUS_CONFIG as any)[bl.status]?.label || bl.status}
                    </span>
                  </div>
                )}

                {certificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                        <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {(CERTIFICATE_TYPE_LABELS as any)[cert.type] || cert.type} {cert.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#888888]">
                          {formatDate(cert.createdAt)} - {cert.createdByName} - Destino:{' '}
                          {cert.destination}
                        </p>
                      </div>
                    </div>
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
                  </div>
                ))}

                {dmcs.length === 0 && !bl && certificates.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] py-16">
                    <FileText className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Sin documentos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#888888]">
                      Este expediente aun no tiene documentos asociados
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logistica' && (
            <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
              {expedient.transport ? (
                <>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Datos de Transporte
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        label: 'Modo',
                        value: (TRANSPORT_MODE_LABELS as any)[expedient.transport.mode] || expedient.transport.mode,
                        icon: Truck,
                      },
                      {
                        label: 'Naviera / Carrier',
                        value: expedient.transport.carrierName ?? '\u2014',
                        icon: Ship,
                      },
                      {
                        label: 'Buque',
                        value: expedient.transport.vesselName ?? '\u2014',
                        icon: Ship,
                      },
                      {
                        label: 'Viaje',
                        value: expedient.transport.voyageNumber ?? '\u2014',
                        icon: MapPin,
                      },
                      {
                        label: 'Booking',
                        value: expedient.transport.bookingNumber ?? '\u2014',
                        icon: FileText,
                      },
                      {
                        label: 'Contenedor',
                        value: expedient.transport.containerNumber
                          ? `${expedient.transport.containerNumber} (${expedient.transport.containerType ?? ''})`
                          : '\u2014',
                        icon: Container,
                      },
                      {
                        label: 'Sello',
                        value: expedient.transport.sealNumber ?? '\u2014',
                        icon: CheckCircle2,
                      },
                      {
                        label: 'Puerto embarque',
                        value: expedient.transport.portOfLoading,
                        icon: MapPin,
                      },
                      {
                        label: 'Puerto descarga',
                        value: expedient.transport.portOfDischarge ?? '\u2014',
                        icon: MapPin,
                      },
                      {
                        label: 'ETD',
                        value: expedient.transport.etd
                          ? formatDateTime(expedient.transport.etd)
                          : '\u2014',
                        icon: CalendarDays,
                      },
                      {
                        label: 'ETA',
                        value: expedient.transport.eta
                          ? formatDateTime(expedient.transport.eta)
                          : '\u2014',
                        icon: CalendarDays,
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-gray-50 dark:bg-[#1a1a1a] p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <item.icon className="h-3.5 w-3.5 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-[#888888]">{item.label}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Truck className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Sin datos de transporte
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">
                    No se han asignado datos de transporte a este expediente
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
              {timeline.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[17px] top-0 bottom-0 w-px bg-gray-200 dark:border-[#2a2a2a]" />
                  <div className="space-y-6">
                    {timeline.map((event: any) => {
                      const IconComponent = TIMELINE_ICONS[event.action] || Clock;
                      return (
                        <div key={event.id} className="relative flex gap-4 pl-1">
                          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950 border-2 border-white dark:border-[#141414]">
                            <IconComponent className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {(event.action || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </p>
                              <span className="text-xs text-gray-400 dark:text-[#666]">
                                {formatDateTime(event.timestamp)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                              {event.description}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-[#888888]">
                                {event.userName} - {event.userRole}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <Clock className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Sin eventos
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#888888]">
                    No hay eventos registrados para este expediente
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div >
      </AnimatePresence >
    </div >
  );
}
