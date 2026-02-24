'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';
import {
    Search, ArrowLeft, Ban, CheckCircle, FileText,
    X, AlertTriangle, ArrowRightLeft, CalendarDays
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Transaction {
    id: string;
    transactionNumber: string;
    type: 'INVOICE' | 'PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'ADJUSTMENT';
    description: string;
    amount: string;
    transactionDate: string;
    isVoided: boolean;
    voidReason?: string;
    customer: {
        name: string;
        taxId: string;
    };
}

const TYPE_CONFIG = {
    INVOICE: { color: '#2563EB', bg: 'bg-[#2563EB]/10', text: 'text-[#2563EB]', label: 'Factura' },
    PAYMENT: { color: '#16A34A', bg: 'bg-[#16A34A]/10', text: 'text-[#16A34A]', label: 'Pago' },
    CREDIT_NOTE: { color: '#F59E0B', bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', label: 'Nota C.' },
    DEBIT_NOTE: { color: '#DC2626', bg: 'bg-[#DC2626]/10', text: 'text-[#DC2626]', label: 'Nota D.' },
    ADJUSTMENT: { color: '#64748B', bg: 'bg-[#64748B]/10', text: 'text-[#64748B]', label: 'Ajuste' },
};

export default function TransactionsHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Transaction[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    // Modal Anular
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...(search && { search }),
            });
            const response = await api<{ items: Transaction[], totalPages: number }>(`/customers/transactions/list?${params}`);
            setData(response.items || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            toast.error('Error al cargar transacciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchTransactions, 300);
        return () => clearTimeout(t);
    }, [page, search]);

    const handleVoid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTx || !voidReason) {
            toast.error('Debe ingresar un motivo para anular');
            return;
        }
        setVoiding(true);
        try {
            await api(`/customers/transactions/${selectedTx.id}/void`, {
                method: 'POST',
                body: { reason: voidReason }
            });
            toast.success('Transacción anulada correctamente');
            setIsVoidModalOpen(false);
            setVoidReason('');
            fetchTransactions();
        } catch (error: any) {
            toast.error(error.message || 'Error al anular transacción');
        } finally {
            setVoiding(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Historial de Movimientos</h1>
                        <p className="text-sm text-[#475569] mt-0.5">Consulta y anulación de transacciones en Cuentas por Cobrar.</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/dashboard/clientes')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] shadow-sm whitespace-nowrap"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Clientes
                </button>
            </div>

            {/* ── CARD ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden min-h-[500px]">

                {/* TOOLBAR */}
                <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC]">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Buscar por referencia o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all bg-white placeholder:text-[#94A3B8]"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0F172A]" />
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                {loading && data.length === 0 ? (
                    <div className="flex justify-center flex-col gap-3 items-center py-32">
                        <Spinner size="lg" color="primary" />
                        <span className="text-sm text-[#94A3B8]">Cargando movimientos...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Cliente</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Tipo</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Referencia</th>
                                    <th className="text-right py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Monto</th>
                                    <th className="text-center py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Estado</th>
                                    <th className="text-center py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-[#94A3B8] text-sm">
                                            No se encontraron transacciones.
                                        </td>
                                    </tr>
                                ) : data.map((tx) => {
                                    const tConfig = TYPE_CONFIG[tx.type] || TYPE_CONFIG.ADJUSTMENT;

                                    return (
                                        <tr key={tx.id} className="hover:bg-[#F7F9FC]/60 transition-colors">
                                            {/* Fecha */}
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm text-[#475569] font-medium">
                                                    <CalendarDays className="w-3.5 h-3.5 text-[#94A3B8]" />
                                                    {new Date(tx.transactionDate).toLocaleDateString()}
                                                </div>
                                            </td>

                                            {/* Cliente */}
                                            <td className="py-3 px-6">
                                                <p className="font-semibold text-[#0F172A] text-sm truncate max-w-[200px]">{tx.customer?.name}</p>
                                                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{tx.customer?.taxId}</p>
                                            </td>

                                            {/* Tipo */}
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${tConfig.bg} ${tConfig.text}`}>
                                                    {tConfig.label}
                                                </span>
                                            </td>

                                            {/* Referencia */}
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded w-fit">
                                                    <FileText className="w-3 h-3 text-[#94A3B8]" />
                                                    <span className="text-xs font-mono font-bold text-[#475569]">{tx.transactionNumber}</span>
                                                </div>
                                            </td>

                                            {/* Monto */}
                                            <td className="py-3 px-6 text-right whitespace-nowrap">
                                                <span className={`text-sm font-bold font-mono ${tx.isVoided ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'}`}>
                                                    ${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            {/* Estado */}
                                            <td className="py-3 px-6 text-center whitespace-nowrap">
                                                {tx.isVoided ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-bold uppercase tracking-wider">
                                                        <Ban className="w-3 h-3" /> Anulado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-bold uppercase tracking-wider">
                                                        <CheckCircle className="w-3 h-3" /> Activo
                                                    </span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-3 px-6 text-center whitespace-nowrap">
                                                {!tx.isVoided ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTx(tx);
                                                            setVoidReason('');
                                                            setIsVoidModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 text-[11px] font-bold text-[#DC2626] border border-[#DC2626]/20 bg-[#DC2626]/5 rounded hover:bg-[#DC2626] hover:text-white transition-all flex items-center gap-1 mx-auto"
                                                    >
                                                        <Ban className="w-3 h-3" /> ANULAR
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] font-medium text-[#94A3B8] italic">Sin acciones</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F7F9FC] flex justify-between items-center">
                        <span className="text-xs text-[#64748B]">Página <strong>{page}</strong> de {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs font-semibold border border-[#E2E8F0] bg-white rounded-lg text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-xs font-semibold border border-[#E2E8F0] bg-white rounded-lg text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL ANULAR ── */}
            {isVoidModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !voiding && setIsVoidModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.15s ease' }}>

                        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#FEF2F2] flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                            <h2 className="text-base font-semibold text-[#DC2626]">Anular Transacción</h2>
                        </div>

                        <form onSubmit={handleVoid}>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-[#475569]">
                                    ¿Está seguro que desea anular la transacción <strong className="font-mono text-[#0F172A]">{selectedTx?.transactionNumber}</strong> por un monto de <strong className="text-[#0F172A] font-mono">${selectedTx?.amount}</strong>?
                                </p>
                                <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]">
                                    Esta acción es irreversible. El saldo del cliente y los registros asociados serán ajustados automáticamente para reflejar la anulación.
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                                        Motivo de Anulación <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Escriba la justificación para auditoría..."
                                        value={voidReason}
                                        onChange={e => setVoidReason(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626] transition-all resize-none placeholder:text-[#94A3B8]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                                <button
                                    type="button"
                                    onClick={() => setIsVoidModalOpen(false)}
                                    disabled={voiding}
                                    className="px-4 py-2 text-sm text-[#475569] border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={voiding}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                                >
                                    {voiding ? (
                                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Anulando...</>
                                    ) : (
                                        <><Ban className="w-4 h-4" /> Confirmar Anulación</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
