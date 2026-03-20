'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, TrendingDown, Landmark, PieChart, Filter, Calendar } from 'lucide-react';

const fmt = (n: number) => n?.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) ?? '$0.00';

type ReportTab = 'MONTHLY' | 'CHANNEL' | 'CASH_FLOW';

export default function ReportesContablesPage() {
    const [tab, setTab] = useState<ReportTab>('MONTHLY');
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState<any>(null);
    const [channelData, setChannelData] = useState<any>(null);
    const [cashFlowData, setCashFlowData] = useState<any>(null);
    const [year, setYear] = useState(new Date().getFullYear());

    const load = async () => {
        setLoading(true);
        try {
            if (tab === 'MONTHLY') setMonthlyData(await api.getMonthlyComparison(year));
            if (tab === 'CHANNEL') setChannelData(await api.getChannelComparison());
            if (tab === 'CASH_FLOW') setCashFlowData(await api.getCashFlowByBank());
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [tab, year]);

    const TABS = [
        { id: 'MONTHLY', label: 'Comparativo Mensual', icon: BarChart3 },
        { id: 'CHANNEL', label: 'Análisis por Canal (B2B/B2C)', icon: PieChart },
        { id: 'CASH_FLOW', label: 'Flujo de Caja por Banco', icon: Landmark },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes Financieros Avanzados</h1>
                    <p className="text-sm text-gray-500">Análisis comparativo, proyecciones y rentabilidad por canal</p>
                </div>
                {tab === 'MONTHLY' && (
                    <div className="flex items-center gap-3 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 shadow-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm font-bold bg-transparent focus:outline-none">
                            <option value={2025}>Año 2025</option>
                            <option value={2024}>Año 2024</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl w-fit">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id as ReportTab)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            tab === t.id ? 'bg-white dark:bg-[#1a1a1a] text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                ))}
            </div>

            {loading ? <LoadingState /> : (
                <div className="mt-4">
                    {tab === 'MONTHLY' && monthlyData && <MonthlyComparisonView data={monthlyData} />}
                    {tab === 'CHANNEL' && channelData && <ChannelComparisonView data={channelData} />}
                    {tab === 'CASH_FLOW' && cashFlowData && <CashFlowByBankView data={cashFlowData} />}
                </div>
            )}
        </div>
    );
}

function LoadingState() {
    return <div className="p-20 text-center text-gray-400 animate-pulse">Cargando reporte contable...</div>;
}

function MonthlyComparisonView({ data }: any) {
    const maxVal = Math.max(...data.months.map((m: any) => m.totalRevenue), 1);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold mb-8">Evolución de Ingresos y Gastos — {data.year}</h3>
                <div className="min-w-[800px] flex items-end gap-6 h-64 border-b border-gray-100 dark:border-white/5 pb-6">
                    {data.months.map((m: any) => (
                        <div key={m.month} className="flex-1 space-y-3 group">
                            <div className="flex items-end gap-1.5 h-full relative">
                                <div className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t-lg transition-all" style={{ height: `${(m.totalRevenue/maxVal)*100}%` }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{fmt(m.totalRevenue)}</span>
                                </div>
                                <div className="flex-1 bg-red-400 hover:bg-red-500 rounded-t-lg transition-all" style={{ height: `${(m.totalExpenses/maxVal)*100}%` }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{fmt(m.totalExpenses)}</span>
                                </div>
                            </div>
                            <p className="text-center text-[10px] font-bold text-gray-400 uppercase">{m.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                            <th className="px-6 py-4 font-bold text-gray-500 text-[10px]">Mes</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-[10px]">Ingresos</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-[10px]">Gastos</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-[10px]">Utilidad neta</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-[10px]">Margen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {data.months.map((m: any) => (
                            <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold">{m.label}</td>
                                <td className="px-6 py-4 font-mono">{fmt(m.totalRevenue)}</td>
                                <td className="px-6 py-4 font-mono">{fmt(m.totalExpenses)}</td>
                                <td className={`px-6 py-4 font-mono font-bold ${m.netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(m.netIncome)}</td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-500 text-xs font-bold">
                                        {m.totalRevenue > 0 ? ((m.netIncome/m.totalRevenue)*100).toFixed(1) : 0}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChannelComparisonView({ data }: any) {
    const { b2b, b2c, consolidated } = data;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChannelCard title="Ventas B2B (Distribución)" data={b2b} color="blue" />
            <ChannelCard title="Ventas B2C (Tienda / POS)" data={b2c} color="purple" />

            <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-8 border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">Punto de Equilibrio</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Estimación basada en margen actual y gastos operativos consolidados.</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-blue-900 dark:text-blue-200">{fmt(consolidated.totalExpenses * 1.07)}</p>
                    <p className="text-xs font-bold text-blue-600 opacity-70 uppercase tracking-widest mt-1">META DE VENTAS RECOMENDADA</p>
                </div>
            </div>
        </div>
    );
}

function ChannelCard({ title, data, color }: any) {
    const isBlue = color === 'blue';
    return (
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className={`text-lg font-bold ${isBlue ? 'text-blue-600' : 'text-purple-600'}`}>{title}</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ingresos Brutos</p>
                    <p className="text-xl font-mono font-bold">{fmt(data.totalRevenue)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utilidad Estimada</p>
                    <p className={`text-xl font-mono font-bold ${data.netIncome >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmt(data.netIncome)}</p>
                </div>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                 <div className={`${isBlue ? 'bg-blue-500' : 'bg-purple-500'} h-full transition-all`} style={{ width: '100%' }} />
            </div>
            <p className="text-xs text-gray-500 font-medium italic">Margen contribución: {data.totalRevenue > 0 ? ((data.netIncome/data.totalRevenue)*100).toFixed(1) : 0}%</p>
        </div>
    );
}

function CashFlowByBankView({ data }: any) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.banks.map((b: any) => (
                <div key={b.bank.id} className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ backgroundColor: b.bank.color + '20', color: b.bank.color }}>
                            {b.bank.bankName[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{b.bank.name}</h3>
                            <p className="text-xs text-gray-500">{b.bank.bankName} • {b.bank.accountNumber}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold"><TrendingUp className="w-3.5 h-3.5" /> Entradas</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(b.cashIn)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-red-500 font-bold"><TrendingDown className="w-3.5 h-3.5" /> Salidas</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(b.cashOut)}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Flujo Neto</span>
                            <span className={`text-lg font-mono font-black ${b.netFlow >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{fmt(b.netFlow)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
