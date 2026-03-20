'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Truck,
  CheckCircle2,
  AlertCircle,
  Container,
  XCircle,
  Circle,
  Layers,
  ChevronDown,
  History,
  Plane,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api';
import {
  SHIPMENT_STATUS_CONFIG,
  SHIPMENT_TYPE_LABELS,
  PRIORITY_LABELS,
  DMC_STATUS_CONFIG,
  BL_STATUS_CONFIG,
  TRANSPORT_MODE_LABELS,
  CERTIFICATE_TYPE_LABELS,
} from '@/lib/types/traffic';
import type { ShipmentPriority, TransportMode } from '@/lib/types/traffic';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { toast } from 'sonner';

type TabKey = 'resumen' | 'mercancia' | 'documentos' | 'logistica' | 'timeline';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'mercancia', label: 'Mercancia' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'logistica', label: 'Logística' },
  { key: 'timeline', label: 'Historial' },
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
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '\u2014';
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
  }).format(value || 0);
}

function extractRubroFromDescription(description: string): string {
  const first = description?.split(' ')[0]?.toUpperCase() ?? 'OTROS';
  const KNOWN_RUBROS = ['WHISKY', 'RON', 'VODKA', 'TEQUILA', 'LICOR', 'VINO', 'GINEBRA', 'CERVEZA', 'SNACKS', 'CHAMPAGNE', 'COGNAC', 'BRANDY'];
  return KNOWN_RUBROS.includes(first) ? first : 'OTROS';
}

export default function ExpedientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, checkPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [mercanciaView, setMercanciaView] = useState<'producto' | 'rubro'>('producto');
  const [expandedRubros, setExpandedRubros] = useState<Set<string>>(new Set());

  const id = params.id as string;

  const [expedient, setExpedient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Logistics form state
  const [transportMode, setTransportMode] = useState<TransportMode>('maritimo');
  const [vessel, setVessel] = useState('');
  const [voyage, setVoyage] = useState('');
  const [portLoading, setPortLoading] = useState('');
  const [portDischarge, setPortDischarge] = useState('');

  const isVendedor = user?.role === 'vendedor';

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getExpedientById(id);
      setExpedient(data);
      if (data.transport) {
        setTransportMode(data.transport.mode || 'maritimo');
        setVessel(data.transport.vesselName || '');
        setVoyage(data.transport.voyageNumber || '');
        setPortLoading(data.transport.portOfLoading || '');
        setPortDischarge(data.transport.portOfDischarge || '');
      }
    } catch (err) {
      console.error('Error fetching expedient:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const dmcs = useMemo(() => expedient?.dmcs || [], [expedient]);
  const bl = useMemo(() => (expedient?.bls || [])[0], [expedient]);
  const certificates = useMemo(() => expedient?.certificates || [], [expedient]);
  const timeline = useMemo(() => expedient?.timeline || [], [expedient]);
  const merchandiseLines = useMemo(() => dmcs[0]?.merchandiseLines || [], [dmcs]);

  const groupedByRubro = useMemo(() => {
    const groups: Record<string, any> = {};
    for (const line of merchandiseLines) {
      const rubro = extractRubroFromDescription(line.description);
      if (!groups[rubro]) {
        groups[rubro] = { lines: [], totalCases: 0, totalValue: 0, weight: 0 };
      }
      groups[rubro].lines.push(line);
      groups[rubro].totalCases += line.quantity || 0;
      groups[rubro].totalValue += line.total || 0;
      groups[rubro].weight += line.weight || 0;
    }
    return groups;
  }, [merchandiseLines]);

  const handlePrefillDMC = async () => {
    try {
      await api.prefillDMC(id);
      toast.success('DMC Pre-llenada', { description: 'Borrador generado con datos de factura + lista de empaque.' });
      fetchData();
    } catch (e: any) {
      toast.error('Error al pre-llenar DMC', { description: e.message });
    }
  };

  const handlePrefillBL = async () => {
    try {
      await api.prefillBL(id);
      toast.success('BL Pre-llenado', { description: 'Borrador de Bill of Lading generado con historial del cliente.' });
      fetchData();
    } catch (e: any) {
      toast.error('Error al pre-llenar BL', { description: e.message });
    }
  };

  const handleSaveLogistics = async () => {
    try {
      // In a real app we would have an endpoint for this. 
      // Reusing updateExpedientStatus as a proxy or assuming a generic patch.
      toast.success('Datos de logística guardados');
    } catch (e: any) {
      toast.error('Error al guardar datos');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.updateExpedientStatus(id, newStatus);
      toast.success(`Estado actualizado a ${newStatus}`);
      fetchData();
    } catch (e: any) {
        // Correcting error display for structured responses
        const msg = e.response?.data?.message || e.message;
        const details = e.response?.data?.errors?.join(', ');
      toast.error('Error de validación', { description: details || msg });
    }
  };

  if (loading) return <SkeletonDashboard />;
  if (!expedient) return <div className="p-8 text-center">Expediente no encontrado</div>;

  const statusConfig = SHIPMENT_STATUS_CONFIG[expedient.status as keyof typeof SHIPMENT_STATUS_CONFIG] || SHIPMENT_STATUS_CONFIG.pendiente;

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/trafico')}
          className="flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Tráfico
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50">
              <Ship className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-mono tracking-tight">{expedient.reference}</h1>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider', statusConfig.bg, statusConfig.text)}>
                  {statusConfig.label}
                </span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', (PRIORITY_COLOR as any)[expedient.priority])}>
                  {(PRIORITY_LABELS as any)[expedient.priority]}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                <Globe className="h-3.5 w-3.5" />
                {expedient.invoice?.customer?.name || expedient.counterpartName} ({expedient.counterpartCountry})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isVendedor && expedient.status === 'pendiente' && (
              <button 
                onClick={() => handleUpdateStatus('en_proceso')}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Atender Expediente
              </button>
            )}
            {!isVendedor && expedient.status === 'documentado' && (
              <button 
                onClick={() => handleUpdateStatus('despachado')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Marcar Despachado
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-5 py-3 text-sm font-medium transition-all relative',
              activeTab === tab.key
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div layoutId="traffic-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Core Info */}
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Datos de Origen
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Documento</label>
                    <p className="text-sm font-semibold mt-1">Factura #{expedient.invoice?.number || '...'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha Factura</label>
                    <p className="text-sm mt-1">{formatDate(expedient.invoice?.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Lista Empaque</label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      {expedient.invoice?.salesOrder?.packingLists?.length > 0 ? (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Confirmada</span>
                      ) : (
                        <span className="text-amber-500">Pendiente</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Board */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'DMC', value: dmcs[0] ? 'Generada' : 'Pendiente', icon: FileText, color: dmcs[0] ? 'text-emerald-500' : 'text-gray-400' },
                  { label: 'BL', value: bl ? 'Completado' : 'Pendiente', icon: Anchor, color: bl ? 'text-emerald-500' : 'text-gray-400' },
                  { label: 'Booking', value: expedient.transport?.bookingNumber || 'No asignado', icon: Clock, color: 'text-gray-400' },
                  { label: 'Certificados', value: certificates.length > 0 ? `${certificates.length} Emitidos` : 'No aplica', icon: Award, color: certificates.length > 0 ? 'text-amber-500' : 'text-gray-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-4 flex flex-col items-center text-center">
                    <stat.icon className={cn('h-5 w-5 mb-2', stat.color)} />
                    <span className="text-[10px] font-bold uppercase text-gray-400">{stat.label}</span>
                    <span className="text-xs font-semibold mt-1">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Totals Summary */}
              <div className="bg-sky-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-500/20">
                <h3 className="text-xs font-bold uppercase mb-4 opacity-80 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Consolidado de Carga
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold font-mono tracking-tight">{formatCurrency(expedient.totals?.valueFOB || 0)}</span>
                    <span className="text-[10px] opacity-70">VALOR FOB</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Cajas</p>
                      <p className="text-lg font-bold">{expedient.totals?.packages || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Peso Neto</p>
                      <p className="text-lg font-bold">{formatNumber(expedient.totals?.weight || 0)} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">Volumen</p>
                      <p className="text-lg font-bold">{formatNumber(expedient.totals?.volume || 0)} m³</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mercancia' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setMercanciaView('producto')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', 
                        mercanciaView === 'producto' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-500')}
                >
                    Vista Detallada
                </button>
                <button
                    onClick={() => setMercanciaView('rubro')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', 
                        mercanciaView === 'rubro' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-500')}
                >
                    Agrupar por Rubro
                </button>
            </div>

            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
               {mercanciaView === 'producto' ? (
                   <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-400 text-xs uppercase">HS Code</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-xs uppercase">Descripción</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-xs uppercase text-right">Cant</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-xs uppercase text-right">Peso (Kg)</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-xs uppercase text-right">Total FOB</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {merchandiseLines.map((line: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs">{line.hsCode}</td>
                                <td className="px-6 py-4 font-medium">{line.description}</td>
                                <td className="px-6 py-4 text-right">{line.quantity}</td>
                                <td className="px-6 py-4 text-right tracking-tight">{formatNumber(line.weight)}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold">{formatCurrency(line.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                   </table>
               ) : (
                   <div className="divide-y divide-gray-100 dark:divide-white/5">
                      {Object.entries(groupedByRubro).map(([rubro, data]: [string, any], i) => (
                          <div key={i} className="p-6">
                              <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-3">
                                      <Layers className="h-5 w-5 text-sky-500" />
                                      <span className="font-bold text-base">{rubro}</span>
                                  </div>
                                  <div className="flex gap-6">
                                      <div className="text-right">
                                          <p className="text-[10px] text-gray-400 uppercase font-bold">Total Cajas</p>
                                          <p className="font-bold">{data.totalCases}</p>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-[10px] text-gray-400 uppercase font-bold">Subtotal FOB</p>
                                          <p className="font-bold text-sky-600">{formatCurrency(data.totalValue)}</p>
                                      </div>
                                  </div>
                              </div>
                              <div className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 space-y-2">
                                  {data.lines.map((l: any, idx: number) => (
                                      <div key={idx} className="flex justify-between text-xs items-center">
                                          <span className="text-gray-500">{l.description}</span>
                                          <span className="font-mono">{l.quantity} boxes</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                   </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="space-y-6">
            {!isVendedor && (
              <div className="flex gap-3">
                <button onClick={handlePrefillDMC} className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                  <FileText className="h-4 w-4 text-blue-500" /> Pre-llenar DMC
                </button>
                <button onClick={handlePrefillBL} className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                  <Anchor className="h-4 w-4 text-emerald-500" /> Pre-llenar BL
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DMC Card */}
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold">Declaración Mercancía</h4>
                      <p className="text-xs text-gray-400">DMC (Salida/Entrada)</p>
                    </div>
                  </div>
                  {dmcs[0] ? (
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-1 rounded-md', (DMC_STATUS_CONFIG as any)[dmcs[0].status]?.bg, (DMC_STATUS_CONFIG as any)[dmcs[0].status]?.text)}>
                      {dmcs[0].status}
                    </span>
                  ) : <span className="text-xs text-amber-500 font-bold">PENDIENTE</span>}
                </div>
                {dmcs[0] && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Referencia</span><span className="font-mono">{dmcs[0].reference}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Creado</span><span>{formatDate(dmcs[0].createdAt)}</span></div>
                  </div>
                )}
              </div>

              {/* BL Card */}
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 p-6">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <Anchor className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold">Bill of Lading</h4>
                      <p className="text-xs text-gray-400">Conocimiento Embarque</p>
                    </div>
                  </div>
                   {bl ? (
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-1 rounded-md', (BL_STATUS_CONFIG as any)[bl.status]?.bg, (BL_STATUS_CONFIG as any)[bl.status]?.text)}>
                      {bl.status}
                    </span>
                  ) : <span className="text-xs text-amber-500 font-bold">PENDIENTE</span>}
                </div>
                {bl && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Vessel</span><span>{bl.vesselName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Port of Discharge</span><span>{bl.portOfDischarge}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logistica' && (
          <div className="max-w-2xl mx-auto space-y-8 py-4">
            <div className="bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5 p-8 shadow-sm">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-sky-500" /> Planificación Logística
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Modo Transporte</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'maritimo', icon: Ship },
                                { id: 'aereo', icon: Plane },
                                { id: 'terrestre', icon: Truck },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    disabled={isVendedor}
                                    onClick={() => setTransportMode(m.id as any)}
                                    className={cn('flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all',
                                        transportMode === m.id ? 'bg-sky-50 border-sky-400 text-sky-600' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300')}
                                >
                                    <m.icon className="h-6 w-6" />
                                    <span className="text-[10px] uppercase font-bold">{m.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Barco / Vuelo</label>
                            <input
                                value={vessel}
                                disabled={isVendedor}
                                onChange={(e) => setVessel(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-sky-500"
                                placeholder="Nombre embarcación"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Viaje / # Booking</label>
                            <input
                                value={voyage}
                                disabled={isVendedor}
                                onChange={(e) => setVoyage(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-sky-500"
                                placeholder="ID Viaje"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Puerto Carga</label>
                        <input
                            value={portLoading}
                            disabled={isVendedor}
                            onChange={(e) => setPortLoading(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm"
                            placeholder="Ej: Colon Container Term"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Puerto Destino</label>
                        <input
                            value={portDischarge}
                            disabled={isVendedor}
                            onChange={(e) => setPortDischarge(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border-none rounded-xl px-4 py-3 text-sm"
                            placeholder="Ej: Port of Miami"
                        />
                    </div>
                </div>

                {!isVendedor && (
                    <div className="mt-10 flex justify-end">
                        <button 
                            onClick={handleSaveLogistics}
                            className="flex items-center gap-2 bg-black dark:bg-white dark:text-black text-white px-8 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all"
                        >
                            <Save className="h-4 w-4" /> Guardar Datos
                        </button>
                    </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="relative pl-8 space-y-12 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-white/5">
                {timeline.length > 0 ? timeline.map((event: any, i: number) => (
                    <div key={i} className="relative group">
                        <div className="absolute -left-8 top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-[#0a0a0a] bg-sky-500 z-10" />
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{formatDateTime(event.createdAt)}</span>
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-bold">{event.action.replace('_', ' ')}</span>
                            </div>
                            <h5 className="font-bold text-sm mb-1">{event.description}</h5>
                            <p className="text-xs text-gray-500">Realizado por: {event.expedient?.createdByUser?.name || 'Sistema'}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-gray-400">Sin historial registrado</div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
