'use client';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/services/api';
import { toast } from 'sonner';
import { Landmark, Upload, CheckCircle2, AlertCircle, RefreshCw, Eye, XCircle, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const fmt = (n: number) => n?.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) ?? '$0.00';

export default function ConciliacionPage() {
    const searchParams = useSearchParams();
    const bankAccountId = searchParams.get('bankAccountId');

    const [reconciliations, setReconciliations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRec, setSelectedRec] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL' | 'NEW'>('LIST');
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);

    // Form states for new reconciliation
    const [form, setForm] = useState({
        bankAccountId: bankAccountId || '',
        periodStart: '',
        periodEnd: '',
        statementBalance: '',
        bookBalance: '0',
        notes: ''
    });

    const load = async () => {
        setLoading(true);
        try {
            const [recs, accs] = await Promise.all([
                api.getReconciliations(bankAccountId || undefined),
                api.getBankAccounts()
            ]);
            setReconciliations(recs);
            setBankAccounts(accs);
        } catch (e: any) {
            toast.error('Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [bankAccountId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.createReconciliation(form);
            toast.success('Conciliación creada');
            setSelectedRec(res);
            setViewMode('DETAIL');
            load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleImportCSV = async (file: File) => {
        if (!selectedRec) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const csv = ev.target?.result as string;
                await api.importBankCSV(selectedRec.bankAccountId, csv);
                toast.success('CSV importado y auto-mapeado');
                const updated = await api.getReconciliationById(selectedRec.id);
                setSelectedRec(updated);
            } catch (e: any) {
                toast.error(e.message);
            }
        };
        reader.readAsText(file);
    };

    const handleAutoMatch = async () => {
        if (!selectedRec) return;
        try {
            await api.autoMatchTransactions(selectedRec.bankAccountId);
            toast.success('Auto-matching completado');
            const updated = await api.getReconciliationById(selectedRec.id);
            setSelectedRec(updated);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleCloseRec = async () => {
        if (!selectedRec) return;
        try {
            await api.closeReconciliation(selectedRec.id);
            toast.success('Conciliación cerrada');
            setViewMode('LIST');
            load();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    if (viewMode === 'DETAIL' && selectedRec) {
        return <ReconciliationDetail
            rec={selectedRec}
            onBack={() => setViewMode('LIST')}
            onImport={handleImportCSV}
            onAutoMatch={handleAutoMatch}
            onClose={handleCloseRec}
            onRefresh={async () => {
                const updated = await api.getReconciliationById(selectedRec.id);
                setSelectedRec(updated);
            }}
        />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conciliación Bancaria</h1>
                    <p className="text-sm text-gray-500">Asegura que tus saldos bancarios coincidan con tus libros contables</p>
                </div>
                <button
                    onClick={() => setViewMode('NEW')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                    <Landmark className="w-4 h-4" /> Iniciar Conciliación
                </button>
            </div>

            {viewMode === 'NEW' && (
                <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-2xl mx-auto shadow-xl">
                    <h2 className="text-xl font-bold mb-6">Nueva Conciliación</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">Cuenta Bancaria</label>
                                <select
                                    required
                                    value={form.bankAccountId}
                                    onChange={e => setForm({...form, bankAccountId: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all font-bold"
                                >
                                    <option value="">Selecciona cuenta...</option>
                                    {bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.name} ({acc.accountNumber})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Periodo Desde</label>
                                <input
                                    required
                                    type="date"
                                    value={form.periodStart}
                                    onChange={e => setForm({...form, periodStart: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Periodo Hasta</label>
                                <input
                                    required
                                    type="date"
                                    value={form.periodEnd}
                                    onChange={e => setForm({...form, periodEnd: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">Saldo según Extracto (Bancario)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={form.statementBalance}
                                        onChange={e => setForm({...form, statementBalance: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setViewMode('LIST')}
                                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                            >
                                Comenzar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewMode === 'LIST' && (
                <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Banco / Cuenta</th>
                                <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Período</th>
                                <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Saldo Extracto</th>
                                <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Diferencia</th>
                                <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {reconciliations.map(rec => (
                                <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white">{rec.bankAccount?.name}</p>
                                        <p className="text-xs text-gray-500">{rec.bankAccount?.bankName}</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono">
                                        {new Date(rec.periodStart).toLocaleDateString()} — {new Date(rec.periodEnd).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold">{fmt(rec.statementBalance)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono font-bold ${Math.abs(rec.difference) > 0.01 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {fmt(rec.difference)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            rec.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' :
                                            rec.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {rec.status === 'CLOSED' ? 'CERRADA' :
                                             rec.status === 'COMPLETED' ? 'COMPLETADA' : 'EN PROCESO'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={async () => {
                                                const res = await api.getReconciliationById(rec.id);
                                                setSelectedRec(res);
                                                setViewMode('DETAIL');
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {reconciliations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No hay conciliaciones históricas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ReconciliationDetail({ rec, onBack, onImport, onAutoMatch, onClose, onRefresh }: any) {
    const isClosed = rec.status === 'CLOSED';

    const txSummary = useMemo(() => {
        const txs = rec.transactions || [];
        return {
            total: txs.length,
            matched: txs.filter((t: any) => t.status === 'MATCHED' || t.status === 'RECONCILED').length,
            unmatched: txs.filter((t: any) => t.status === 'UNMATCHED').length,
            ignored: txs.filter((t: any) => t.status === 'IGNORED').length,
        };
    }, [rec.transactions]);

    const handleAction = (tx: any, action: 'MATCH' | 'IGNORE' | 'UNMATCH') => {
        if (isClosed) return;
        if (action === 'IGNORE') api.ignoreBankTx(tx.id).then(() => onRefresh());
        if (action === 'UNMATCH') api.unmatchBankTx(tx.id).then(() => onRefresh());
        // Manual MATCH would open a modal to select a Journal Entry
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
             <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                        <RefreshingIcon className="rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conciliación: {rec.bankAccount?.name}</h2>
                        <p className="text-xs text-gray-500 font-mono">
                            {new Date(rec.periodStart).toLocaleDateString()} al {new Date(rec.periodEnd).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                {!isClosed && (
                    <div className="flex gap-3">
                         <button onClick={onAutoMatch} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Auto-Matching
                        </button>
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5" /> Importar CSV
                            <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} />
                        </label>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cerrar Periodo
                        </button>
                    </div>
                )}
            </div>

            {/* Reconciliation Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Resumen de Saldos</h3>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Extracto Bancario</span>
                                <span className="font-mono font-bold">{fmt(rec.statementBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Libros (Contabilidad)</span>
                                <span className="font-mono font-bold">{fmt(rec.bookBalance)}</span>
                            </div>
                            <div className={`p-4 rounded-xl flex justify-between items-center ${Math.allAbsolute(rec.difference) < 0.01 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-700'}`}>
                                <span className="text-xs font-bold uppercase">Diferencia</span>
                                <span className="text-lg font-mono font-black">{fmt(rec.difference)}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Transacciones</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{txSummary.matched}</p>
                                    <p className="text-[10px] font-bold text-emerald-600">CONCILIADAS</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{txSummary.unmatched}</p>
                                    <p className="text-[10px] font-bold text-amber-600">PENDIENTES</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1.2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input placeholder="Buscar movimientos..." className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                        <th className="px-6 py-3 font-bold text-gray-500 text-[10px] uppercase">Fecha</th>
                                        <th className="px-6 py-3 font-bold text-gray-500 text-[10px] uppercase">Descripción / Referencia</th>
                                        <th className="px-6 py-3 font-bold text-gray-500 text-[10px] uppercase">Monto</th>
                                        <th className="px-6 py-3 font-bold text-gray-500 text-[10px] uppercase">Asiento Contable</th>
                                        <th className="px-6 py-3 font-bold text-gray-500 text-[10px] uppercase">Estado</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {rec.transactions?.map((tx: any) => (
                                        <tr key={tx.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${tx.status === 'IGNORED' ? 'opacity-50' : ''}`}>
                                            <td className="px-6 py-4 text-xs font-mono">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 dark:text-white max-w-xs truncate" title={tx.description}>{tx.description}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{tx.reference || '—'}</p>
                                            </td>
                                            <td className={`px-6 py-4 font-mono font-bold ${Number(tx.amount) > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                {Number(tx.amount) > 0 ? '+' : ''}{fmt(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.journalEntry ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-blue-600">#{tx.journalEntry.number}</span>
                                                        <span className="text-[10px] text-gray-500 max-w-[150px] truncate">{tx.journalEntry.memo}</span>
                                                    </div>
                                                ) : <span className="text-xs text-gray-300 italic">No vinculado</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                    tx.status === 'MATCHED' || tx.status === 'RECONCILED' ? 'bg-emerald-100 text-emerald-700' :
                                                    tx.status === 'IGNORED' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {tx.status === 'MATCHED' || tx.status === 'RECONCILED' ? 'CONCILIADO' :
                                                     tx.status === 'IGNORED' ? 'IGNORADO' : 'PENDIENTE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isClosed && (
                                                    <div className="flex gap-2 justify-end">
                                                        {tx.status === 'UNMATCHED' ? (
                                                            <button onClick={() => handleAction(tx, 'IGNORE')} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Ignorar">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleAction(tx, 'UNMATCH')} className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors" title="Desvincular">
                                                                <RefreshCw className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RefreshingIcon({ className }: { className?: string }) {
    return <RefreshCw className={`w-4 h-4 ${className}`} />;
}

const Math = {
    allAbsolute: (n: any) => window.Math.abs(Number(n))
};
