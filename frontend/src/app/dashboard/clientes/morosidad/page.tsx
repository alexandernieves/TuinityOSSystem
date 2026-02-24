'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@heroui/react';
import {
    TrendingDown, DollarSign, Calendar, AlertTriangle,
    ShieldAlert, BarChart3, RefreshCw, CheckCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AgingReport {
    current: string;
    days30: string;
    days60: string;
    days90: string;
    over90: string;
    total: number;
}

const fmt = (val?: string | number) => {
    if (val === undefined || val === null) return '$0.00';
    return `$${parseFloat(val.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const pct = (part: string | undefined, total: number) => {
    if (!total || !part) return '0.0';
    return ((parseFloat(part) / total) * 100).toFixed(1);
};

const BANDS = [
    {
        key: 'current' as keyof AgingReport,
        label: 'Corriente',
        range: '0 – 30 días',
        status: 'Al Día',
        icon: CheckCircle,
        color: '#16A34A',
        bg: '#16A34A',
        barColor: 'bg-[#16A34A]',
        badgeBg: 'bg-[#16A34A]/10',
        badgeText: 'text-[#16A34A]',
    },
    {
        key: 'days30' as keyof AgingReport,
        label: 'Atraso Leve',
        range: '31 – 60 días',
        status: 'Precaución',
        icon: Calendar,
        color: '#F59E0B',
        bg: '#F59E0B',
        barColor: 'bg-[#F59E0B]',
        badgeBg: 'bg-[#F59E0B]/10',
        badgeText: 'text-[#F59E0B]',
    },
    {
        key: 'days60' as keyof AgingReport,
        label: 'Atraso Medio',
        range: '61 – 90 días',
        status: 'Riesgo Moderado',
        icon: TrendingDown,
        color: '#EA580C',
        bg: '#EA580C',
        barColor: 'bg-[#EA580C]',
        badgeBg: 'bg-[#EA580C]/10',
        badgeText: 'text-[#EA580C]',
    },
    {
        key: 'over90' as keyof AgingReport,
        label: 'Atraso Crítico',
        range: '+ 90 días',
        status: 'Riesgo Alto',
        icon: ShieldAlert,
        color: '#DC2626',
        bg: '#DC2626',
        barColor: 'bg-[#DC2626]',
        badgeBg: 'bg-[#DC2626]/10',
        badgeText: 'text-[#DC2626]',
    },
];

export default function MorosidadPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AgingReport | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const report = await api<AgingReport>('/customers/reports/aging');
            setData(report);
        } catch {
            toast.error('Error al cargar reporte de morosidad');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-6 h-6 text-[#DC2626]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A]">Análisis de Morosidad</h1>
                        <p className="text-sm text-[#475569] mt-0.5">Monitorea el riesgo crediticio y antigüedad de saldos de la cartera.</p>
                    </div>
                </div>
                <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Spinner size="lg" color="primary" />
                </div>
            ) : (
                <div className="space-y-6">

                    {/* ── KPI CARDS ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {BANDS.map((band) => {
                            const BIcon = band.icon;
                            const value = data?.[band.key] as string | undefined;
                            const percentage = pct(value, data?.total ?? 0);
                            return (
                                <div
                                    key={band.key}
                                    className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div
                                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${band.color}18` }}
                                        >
                                            <BIcon className="w-4 h-4" style={{ color: band.color }} />
                                        </div>
                                        <span
                                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: `${band.color}15`, color: band.color }}
                                        >
                                            {percentage}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#475569] font-medium">{band.label}</p>
                                    <p className="text-xs text-[#94A3B8] mb-1">{band.range}</p>
                                    <p className="text-xl font-semibold text-[#0F172A]">{fmt(value)}</p>

                                    {/* Mini bar */}
                                    <div className="mt-3 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${band.barColor}`}
                                            style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── TOTAL CARTERA BANNER ── */}
                    <div className="bg-white border border-[#2563EB]/20 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-[#2563EB]" />
                            </div>
                            <div>
                                <p className="text-sm text-[#475569]">Cartera Total CxC</p>
                                <p className="text-2xl font-bold text-[#0F172A]">{fmt(data?.total)}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1">
                            <p className="text-xs text-[#475569]">Cartera en riesgo (+31 días)</p>
                            <p className="text-xl font-semibold text-[#DC2626]">
                                {fmt(
                                    (parseFloat(data?.days30 ?? '0') +
                                        parseFloat(data?.days60 ?? '0') +
                                        parseFloat(data?.over90 ?? '0')).toString()
                                )}
                            </p>
                        </div>
                    </div>

                    {/* ── TABLA DE ANTIGÜEDAD ── */}
                    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                            <span className="text-sm font-semibold text-[#0F172A]">Resumen de Antigüedad de Cuentas por Cobrar</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                    <tr>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Rango de Tiempo</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Estatus</th>
                                        <th className="text-right px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Monto Total</th>
                                        <th className="text-right px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">% Cartera</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider w-40">Distribución</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {BANDS.map((band) => {
                                        const BIcon = band.icon;
                                        const value = data?.[band.key] as string | undefined;
                                        const percentage = pct(value, data?.total ?? 0);
                                        return (
                                            <tr key={band.key} className="hover:bg-[#F7F9FC] transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <BIcon className="w-4 h-4 shrink-0" style={{ color: band.color }} />
                                                        <div>
                                                            <p className="text-sm font-semibold text-[#0F172A]">{band.label}</p>
                                                            <p className="text-xs text-[#94A3B8]">{band.range}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold uppercase ${band.badgeBg} ${band.badgeText}`}
                                                    >
                                                        {band.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className="text-sm font-semibold text-[#0F172A] font-mono">{fmt(value)}</span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <span
                                                        className="text-sm font-bold"
                                                        style={{ color: band.color }}
                                                    >{percentage}%</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${band.barColor}`}
                                                            style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Totals row */}
                                <tfoot className="bg-[#F7F9FC] border-t-2 border-[#E2E8F0]">
                                    <tr>
                                        <td colSpan={2} className="px-5 py-3 text-sm font-semibold text-[#0F172A]">Total Cartera</td>
                                        <td className="px-5 py-3 text-right text-sm font-bold text-[#0F172A] font-mono">{fmt(data?.total)}</td>
                                        <td className="px-5 py-3 text-right text-sm font-bold text-[#475569]">100%</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* ── RISK ALERT (only if overdue > 0) ── */}
                    {data && parseFloat(data.over90) > 0 && (
                        <div className="flex items-start gap-3 p-4 bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-[#DC2626]">Alerta de Riesgo Alto</p>
                                <p className="text-xs text-[#DC2626]/80 mt-0.5">
                                    Existen <strong>{fmt(data.over90)}</strong> de saldo con más de 90 días de atraso ({pct(data.over90, data.total)}% de la cartera).
                                    Se recomienda gestión de cobro inmediata.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
