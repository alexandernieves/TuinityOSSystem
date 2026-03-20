'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { Lock, Unlock, ClipboardCheck, AlertCircle, TrendingUp, TrendingDown, CheckCircle2, XCircle, MoreVertical } from 'lucide-react';

const fmt = (n: number) => n?.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) ?? '$0.00';

export default function CierresPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'LIST' | 'CLOSING'>('LIST');
    const [checklist, setChecklist] = useState<any>(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.getAccountingPeriods();
            setPeriods(data);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const startClosing = async (period: any) => {
        try {
            const checks = await api.getPeriodChecklist(period.id);
            setChecklist(checks);
            setSelectedPeriod(period);
            setViewMode('CLOSING');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleClose = async () => {
        if (!selectedPeriod) return;
        try {
            await api.closeAccountingPeriod(selectedPeriod.id);
            toast.success(`Periodo ${selectedPeriod.name} cerrado exitosamente`);
            setViewMode('LIST');
            load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleReopen = async (period: any) => {
        if (!confirm(`¿Estás seguro de reabrir ${period.name}? Esto quedará registrado en la auditoría.`)) return;
        try {
            await api.reopenAccountingPeriod(period.id);
            toast.success(`Periodo ${period.name} reabierto`);
            load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    if (viewMode === 'CLOSING' && selectedPeriod) {
        return <ClosingChecklist
            period={selectedPeriod}
            checklist={checklist}
            onBack={() => setViewMode('LIST')}
            onClose={handleClose}
        />;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cierres Contables</h1>
                <p className="text-sm text-gray-500">Bloqueo de períodos para asegurar la integridad de la información histórica</p>
            </div>

            <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Período</th>
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Utilidad Neta</th>
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Cierre Realizado</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {periods.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                                    <p className="text-xs text-gray-500">Año {p.year} • Mes {p.month}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                        p.status === 'CLOSED' ? 'bg-blue-100 text-blue-700' :
                                        p.status === 'REOPENED' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {p.status === 'CLOSED' ? 'CERRADO' : p.status === 'REOPENED' ? 'REABIERTO' : 'ABIERTO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold">
                                    {p.netIncome !== null ? fmt(p.netIncome) : <span className="text-gray-300 italic">No calculado</span>}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {p.closedAt ? new Date(p.closedAt).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {p.status === 'OPEN' || p.status === 'REOPENED' ? (
                                        <button
                                            onClick={() => startClosing(p)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ml-auto"
                                        >
                                            <Lock className="w-3.5 h-3.5" /> Cerrar Mes
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReopen(p)}
                                            className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 ml-auto"
                                        >
                                            <Unlock className="w-3.5 h-3.5" /> Reabrir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ClosingChecklist({ period, checklist, onBack, onClose }: any) {
    const { checks, canClose } = checklist;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                    <CheckCircle2 className="w-5 h-5 rotate-180" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cierrre de Mes: {period.name}</h2>
                    <p className="text-xs text-gray-500">Checklist de validación contable</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-8">
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${checks.journalEntries.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {checks.journalEntries.ok ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">Validación de Asientos Diario</h4>
                            <p className="text-sm text-gray-500">{checks.journalEntries.total} asientos encontrados en el período.</p>
                            {!checks.journalEntries.ok && <p className="text-xs text-red-500 font-bold mt-1">Hay {checks.journalEntries.unbalanced} asientos descuadrados!</p>}
                        </div>
                        {checks.journalEntries.ok && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${checks.bankReconciliation.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {checks.bankReconciliation.ok ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">Conciliación Bancaria</h4>
                            <p className="text-sm text-gray-500">Todos los bancos deben tener su conciliación cerrada.</p>
                            {!checks.bankReconciliation.ok && <p className="text-xs text-amber-600 font-bold mt-1">Hay {checks.bankReconciliation.openCount} conciliación(es) abierta(s).</p>}
                        </div>
                        {checks.bankReconciliation.ok && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl text-center space-y-4 ${canClose ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    {canClose ? (
                        <>
                            <p className="text-sm text-blue-800 dark:text-blue-300">Todas las validaciones han pasado correctamente. ¿Deseas proceder con el cierre irreversible de este período?</p>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 inline-flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4" /> Proceder al Cierre
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-red-800 dark:text-red-300">No se puede cerrar el período hasta que todas las validaciones estén en verde.</p>
                            <button disabled className="px-8 py-3 bg-gray-300 text-white rounded-xl text-sm font-bold cursor-not-allowed inline-flex items-center gap-2">
                                <Lock className="w-4 h-4" /> Cierre Bloqueado
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
