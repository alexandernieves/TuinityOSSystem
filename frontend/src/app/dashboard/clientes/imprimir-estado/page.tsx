'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@heroui/react';
import {
    Printer, FileText, Search, ChevronDown,
    User, CreditCard, Calendar, Hash, ArrowUpRight, ArrowDownLeft, SlidersHorizontal, Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Customer { id: string; name: string; taxId: string; }
interface Transaction {
    id: string;
    type: string;
    description: string;
    amount: string;
    createdAt: string;
    transactionNumber?: string;
}
interface Statement {
    customer: Customer;
    openingBalance: number;
    transactions: Transaction[];
    closingBalance: number;
}

const TYPE_LABELS: Record<string, string> = {
    INVOICE: 'Factura',
    PAYMENT: 'Pago / Abono',
    CREDIT_NOTE: 'Nota de Crédito',
    DEBIT_NOTE: 'Nota de Débito',
    ADJUSTMENT: 'Ajuste',
};

const isCargo = (type: string) => ['INVOICE', 'DEBIT_NOTE'].includes(type);
const isAbono = (type: string) => ['PAYMENT', 'CREDIT_NOTE', 'ADJUSTMENT'].includes(type);

const fmt = (val: number | string) =>
    `$${parseFloat(val.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ImprimirEstadoPage() {
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showList, setShowList] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [statement, setStatement] = useState<Statement | null>(null);

    useEffect(() => {
        setLoadingCustomers(true);
        api<{ items: Customer[] }>('/customers?customerType=CREDIT&limit=200')
            .then(r => setCustomers(r.items || []))
            .catch(() => toast.error('Error al cargar clientes'))
            .finally(() => setLoadingCustomers(false));
    }, []);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.taxId || '').toLowerCase().includes(customerSearch.toLowerCase())
    );

    const handleGenerate = async () => {
        if (!selectedCustomer) { toast.error('Selecciona un cliente primero'); return; }
        setLoading(true);
        try {
            const res = await api<Statement>(`/customers/${selectedCustomer.id}/statement?startDate=2020-01-01`);
            setStatement(res);
        } catch (e: any) {
            toast.error(e.message || 'Error al generar estado de cuenta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20 space-y-6">

            {/* ── PRINT STYLES ── */}
            <style>{`
                @media print {
                    body > * { visibility: hidden !important; }
                    #statement-doc, #statement-doc * { visibility: visible !important; }
                    #statement-doc {
                        position: fixed; top: 0; left: 0;
                        width: 100%; background: #fff;
                        padding: 32px; box-shadow: none; border: none;
                    }
                }
            `}</style>

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                        <Printer className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A]">Imprimir Estado de Cuentas</h1>
                        <p className="text-sm text-[#475569] mt-0.5">Genera e imprime el estado de cuenta de un cliente de crédito.</p>
                    </div>
                </div>
                {statement && (
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir / PDF
                    </button>
                )}
            </div>

            {/* ── SELECTOR CARD ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-visible print:hidden">
                <div className="px-5 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-sm font-semibold text-[#0F172A]">Seleccionar Cliente</span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row gap-4 items-end">
                    {/* Custom autocomplete */}
                    <div className="flex-1 relative">
                        <label className="block text-sm font-medium text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#94A3B8]" />
                            Cliente (Solo Crédito) <span className="text-[#DC2626]">*</span>
                        </label>
                        <div
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:border-[#2563EB]/40 transition-colors"
                            onClick={() => setShowList(v => !v)}
                        >
                            {selectedCustomer ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                                        {selectedCustomer.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#0F172A] truncate">{selectedCustomer.name}</p>
                                        {selectedCustomer.taxId && <p className="text-xs text-[#94A3B8]">{selectedCustomer.taxId}</p>}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-[#94A3B8] flex-1 text-sm">
                                    {loadingCustomers ? 'Cargando clientes...' : 'Buscar y seleccionar cliente...'}
                                </span>
                            )}
                            <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />
                        </div>

                        {showList && (
                            <div
                                className="absolute z-50 mt-1 w-full bg-white border border-[#E2E8F0] rounded-lg shadow-xl overflow-hidden"
                                style={{ animation: 'dropdownIn 0.15s ease-out' }}
                            >
                                <div className="p-2 border-b border-[#E2E8F0]">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Buscar por nombre o RIF..."
                                            value={customerSearch}
                                            onChange={e => setCustomerSearch(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            className="w-full pl-8 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                    {filtered.length === 0 ? (
                                        <p className="text-xs text-[#94A3B8] text-center py-4">Sin resultados</p>
                                    ) : filtered.map(c => (
                                        <button
                                            type="button"
                                            key={c.id}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-[#F7F9FC] transition-colors"
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setStatement(null);
                                                setShowList(false);
                                                setCustomerSearch('');
                                            }}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                                                {c.taxId && <p className="text-xs text-[#94A3B8]">{c.taxId}</p>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !selectedCustomer}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
                        ) : (
                            <><FileText className="w-4 h-4" /> Generar Estado</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── STATEMENT DOCUMENT ── */}
            {statement && (
                <div id="statement-doc" className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">

                    {/* Doc Header */}
                    <div className="px-8 py-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#2563EB]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Estado de Cuenta</p>
                                <p className="text-lg font-bold text-[#0F172A]">TuinityOS System</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-[#475569] font-medium uppercase tracking-wider">Fecha de Emisión</p>
                            <p className="text-sm font-mono text-[#0F172A] mt-0.5">{new Date().toLocaleDateString('es-VE')}</p>
                        </div>
                    </div>

                    {/* Customer info + balance */}
                    <div className="px-8 py-5 bg-[#F7F9FC] border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Cliente</p>
                            <p className="text-xl font-bold text-[#0F172A]">{statement.customer.name}</p>
                            <p className="text-sm text-[#475569] font-mono mt-0.5">RIF/NIT: {statement.customer.taxId || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Saldo Actual</p>
                            <p className={`text-3xl font-black ${statement.closingBalance > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                                {fmt(statement.closingBalance)}
                            </p>
                            <p className="text-xs text-[#475569] mt-1">Al {new Date().toLocaleDateString('es-VE')}</p>
                        </div>
                    </div>

                    {/* Summary pills */}
                    <div className="px-8 py-4 border-b border-[#E2E8F0] flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span className="text-xs text-[#475569]">Saldo inicial: <strong className="text-[#0F172A]">{fmt(statement.openingBalance)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                            <Hash className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span className="text-xs text-[#475569]">Movimientos: <strong className="text-[#0F172A]">{statement.transactions.length}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#DC2626]/5 rounded-lg border border-[#DC2626]/20">
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#DC2626]" />
                            <span className="text-xs text-[#DC2626]">
                                Cargos: <strong>
                                    {fmt(statement.transactions
                                        .filter(t => isCargo(t.type))
                                        .reduce((s, t) => s + parseFloat(t.amount), 0))}
                                </strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#16A34A]/5 rounded-lg border border-[#16A34A]/20">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span className="text-xs text-[#16A34A]">
                                Abonos: <strong>
                                    {fmt(statement.transactions
                                        .filter(t => isAbono(t.type))
                                        .reduce((s, t) => s + parseFloat(t.amount), 0))}
                                </strong>
                            </span>
                        </div>
                    </div>

                    {/* Movements table */}
                    <div className="px-8 py-5">
                        <div className="flex items-center gap-2 mb-4">
                            <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                            <h3 className="text-sm font-semibold text-[#0F172A]">Historial de Movimientos</h3>
                        </div>

                        {statement.transactions.length === 0 ? (
                            <div className="py-12 text-center border border-[#E2E8F0] rounded-lg">
                                <FileText className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                                <p className="text-sm text-[#475569]">No hay movimientos registrados en el período.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                                <table className="w-full">
                                    <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Fecha</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Tipo</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">N° Ref.</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Descripción</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Cargos (+)</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Abonos (-)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E2E8F0]">
                                        {statement.transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-[#F7F9FC] transition-colors">
                                                <td className="px-4 py-3 text-xs font-mono text-[#475569]">
                                                    {new Date(tx.createdAt).toLocaleDateString('es-VE')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isCargo(tx.type)
                                                        ? 'bg-[#DC2626]/10 text-[#DC2626]'
                                                        : 'bg-[#16A34A]/10 text-[#16A34A]'
                                                        }`}>
                                                        {isCargo(tx.type) ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                        {TYPE_LABELS[tx.type] || tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-mono text-[#475569]">
                                                    {tx.transactionNumber || tx.id.slice(0, 8).toUpperCase()}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-[#0F172A] max-w-[180px] truncate" title={tx.description}>
                                                    {tx.description || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold font-mono text-[#DC2626]">
                                                    {isCargo(tx.type) ? fmt(parseFloat(tx.amount)) : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold font-mono text-[#16A34A]">
                                                    {isAbono(tx.type) ? fmt(parseFloat(tx.amount)) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-[#E2E8F0] bg-[#F7F9FC]">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-[#0F172A]">Saldo Final</td>
                                            <td colSpan={2} className="px-4 py-3 text-right">
                                                <span className={`text-lg font-bold font-mono ${statement.closingBalance > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                                                    {fmt(statement.closingBalance)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer firma */}
                    <div className="px-8 py-5 border-t border-[#E2E8F0] bg-[#F7F9FC] flex justify-between items-center text-xs text-[#94A3B8]">
                        <span>Generado el {new Date().toLocaleString('es-VE')}</span>
                        <div className="text-center">
                            <div className="w-48 border-t border-[#475569]/30 pt-2">
                                <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest">Firma Autorizada</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
