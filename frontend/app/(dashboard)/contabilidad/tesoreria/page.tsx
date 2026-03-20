'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { Landmark, Plus, ArrowRightLeft, TrendingUp, TrendingDown, MoreHorizontal, History } from 'lucide-react';

const fmt = (n: number) => n?.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) ?? '$0.00';

export default function TesoreriaPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [accs, cf] = await Promise.all([
                api.getBankAccounts(),
                api.getCashFlowByBank()
            ]);
            setAccounts(accs);
            setSummary(cf);
        } catch (e: any) {
            toast.error('Error cargando bancos: ' + e.message);
        } finally {
            setLoading(setLoading(false) as any);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tesorería y Bancos</h1>
                <p className="text-sm text-gray-500">Gestión de saldos, movimientos y transferencias entre cuentas</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Landmark className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Saldo Total Consolidado</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(summary.totalNet)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Ingresos (Período)</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600 font-mono">{fmt(summary.totalCashIn)}</p>
                    </div>
                    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Egresos (Período)</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600 font-mono">{fmt(summary.totalCashOut)}</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
                    <Plus className="w-4 h-4" /> Nueva Cuenta
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                    <ArrowRightLeft className="w-4 h-4" /> Transferencia entre Bancos
                </button>
            </div>

            {/* Banks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />) :
                    accounts.map(acc => (
                        <div key={acc.id} className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-blue-500/50 transition-all group">
                            <div className="p-5 border-b border-gray-100 dark:border-white/5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: acc.color + '20' || '#3b82f620', color: acc.color || '#3b82f6' }}>
                                            {acc.bankName?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{acc.name}</h3>
                                            <p className="text-xs text-gray-500">{acc.bankName} • {acc.accountNumber}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Saldo Actual</p>
                                        <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">{fmt(acc.currentBalance)}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${acc.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700'}`}>
                                        {acc.isActive ? 'ACTIVA' : 'INACTIVA'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex border-t border-gray-50 dark:border-white/5">
                                <button className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-r border-gray-50 dark:border-white/5">
                                    <History className="w-3.5 h-3.5" /> Movimientos
                                </button>
                                <button
                                    onClick={() => window.location.href = `/contabilidad/conciliacion?bankAccountId=${acc.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <Landmark className="w-3.5 h-3.5" /> Conciliar
                                </button>
                            </div>
                        </div>
                    ))
                }
            </div>

            {!loading && accounts.length === 0 && (
                <div className="p-12 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-gray-500">No hay cuentas bancarias configuradas.</p>
                </div>
            )}
        </div>
    );
}
