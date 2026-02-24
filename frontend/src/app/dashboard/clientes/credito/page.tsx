'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Spinner,
} from '@heroui/react';
import {
    CreditCard, AlertCircle, CheckCircle2, ShieldAlert,
    BadgeDollarSign, FileText, ArrowRight, XCircle, Users,
    TrendingUp, TrendingDown, MoreHorizontal, Search, SlidersHorizontal
} from 'lucide-react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface Customer {
    id: string;
    name: string;
    email: string | null;
    currentBalance: string;
    creditLimit: string;
    customerType: 'CASH' | 'CREDIT';
    creditStatus: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'BLOCKED';
    isBlocked: boolean;
    isApproved: boolean;
    _count: { sales: number };
}

export default function CreditManagementPage() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<string>('warning');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const fetchCustomers = async () => {
        const session = loadSession();
        if (!session?.tenantSlug) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                customerType: 'CREDIT',
            });

            if (selectedTab === 'overdue') {
                params.append('creditStatus', 'OVERDUE');
            } else if (selectedTab === 'blocked') {
                params.append('isBlocked', 'true');
            } else if (selectedTab === 'warning') {
                params.append('creditStatus', 'WARNING');
            }

            if (search) {
                params.append('search', search);
            }

            const response = await api<{ items: Customer[], totalPages: number }>(`/customers?${params}`);
            setCustomers(response.items || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos de crédito');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchCustomers, 400);
        return () => clearTimeout(t);
    }, [selectedTab, page, search]);

    const getStatusBadge = (customer: Customer) => {
        if (customer.isBlocked) return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3 h-3" /> Bloqueado
            </span>
        );

        switch (customer.creditStatus) {
            case 'NORMAL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Normal
                    </span>
                );
            case 'WARNING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3 h-3" /> Observación
                    </span>
                );
            case 'OVERDUE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-bold uppercase tracking-wider">
                        <XCircle className="w-3 h-3" /> Vencido
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0 shadow-sm">
                        <CreditCard className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">Gestión de Crédito</h1>
                        <p className="text-sm text-[#475569] mt-0.5">Control de riesgos, límites de crédito y estados de cartera.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] shadow-sm">
                        <FileText className="w-4 h-4 text-[#94A3B8]" />
                        Política de Crédito
                    </button>
                </div>
            </div>

            {/* ── KPI GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI: RIESGO TOTAL */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded-full uppercase">Crítico</span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Cartera en Riesgo</p>
                        <h3 className="text-2xl font-bold text-[#0F172A] mt-1">$45,200.00</h3>
                    </div>
                    <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                            <span>Límite de Riesgo Colectivo</span>
                            <span className="font-bold text-[#475569]">65%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#DC2626] rounded-full" style={{ width: '65%' }} />
                        </div>
                    </div>
                </div>

                {/* KPI: CREDIT USED */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                            <BadgeDollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Crédito Utilizado</p>
                        <h3 className="text-2xl font-bold text-[#0F172A] mt-1">$1.24M</h3>
                    </div>
                    <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                            <span>Uso Global de Límites</span>
                            <span className="font-bold text-[#475569]">32%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '32%' }} />
                        </div>
                    </div>
                </div>

                {/* KPI: BLOQUEADOS */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[#64748B]/10 flex items-center justify-center text-[#64748B]">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.5 rounded-full uppercase">
                            <AlertCircle className="w-3 h-3" /> Requiere Acción
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Clientes Bloqueados</p>
                        <h3 className="text-2xl font-bold text-[#0F172A] mt-1">12</h3>
                    </div>
                    <p className="mt-3 text-[10px] text-[#94A3B8]">Cuentas con suspensión de crédito activa</p>
                </div>

                {/* KPI: NEW REQUESTS */}
                <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Mora Promedio</p>
                        <h3 className="text-2xl font-bold text-[#0F172A] mt-1">14.2 días</h3>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-[#16A34A] font-bold italic">
                        ↓ -2.4 días vs mes anterior
                    </div>
                </div>
            </div>

            {/* ── MAIN TABLE CARD ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden min-h-[500px]">

                {/* Search & Tabs Toolbar */}
                <div className="px-6 border-b border-[#E2E8F0]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex overflow-x-auto no-scrollbar">
                            {[
                                { id: 'warning', label: 'Observación', icon: AlertCircle, color: '#F59E0B' },
                                { id: 'overdue', label: 'Vencidos', icon: XCircle, color: '#DC2626' },
                                { id: 'blocked', label: 'Bloqueados', icon: ShieldAlert, color: '#64748B' },
                                { id: 'all', label: 'Todos', icon: Users, color: '#2563EB' },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = selectedTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={clsx(
                                            "flex items-center gap-2 px-5 h-14 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
                                            isActive
                                                ? "border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5"
                                                : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F7F9FC]"
                                        )}
                                    >
                                        <Icon className={clsx("w-4 h-4", isActive ? "" : "opacity-70")} style={{ color: isActive ? tab.color : undefined }} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="py-3 flex items-center gap-2">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                                />
                            </div>
                            <button className="p-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F7F9FC] transition-colors">
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <Spinner size="lg" color="primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Detalles del Cliente</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Estado Crédito</th>
                                    <th className="text-left py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Uso de Límite</th>
                                    <th className="text-right py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Saldo Pendiente</th>
                                    <th className="text-right py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Límite Permitido</th>
                                    <th className="text-center py-4 px-6 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-[#94A3B8] text-sm italic">
                                            No se encontraron clientes con riesgo en este segmento.
                                        </td>
                                    </tr>
                                ) : customers.map((customer, idx) => {
                                    const percent = (parseFloat(customer.currentBalance) / parseFloat(customer.creditLimit)) * 100;
                                    const isOverLimit = percent > 100;

                                    return (
                                        <tr key={customer.id} className="hover:bg-[#F7F9FC]/50 transition-colors group">
                                            {/* Details */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white",
                                                        AVATAR_COLORS[idx % AVATAR_COLORS.length].replace('#', 'bg-[#') + '/10]',
                                                        AVATAR_COLORS[idx % AVATAR_COLORS.length].replace('#', 'text-[#') + ']'
                                                    )} style={{ backgroundColor: `${AVATAR_COLORS[idx % AVATAR_COLORS.length]}15`, color: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[#0F172A] text-sm leading-tight group-hover:text-[#2563EB] transition-colors cursor-pointer"
                                                            onClick={() => router.push(`/dashboard/clientes/administracion?id=${customer.id}`)}>
                                                            {customer.name}
                                                        </p>
                                                        <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{customer.email || 'S/E'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6">
                                                {getStatusBadge(customer)}
                                            </td>

                                            {/* Progress */}
                                            <td className="py-4 px-6">
                                                <div className="w-40">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={clsx("text-[10px] font-bold uppercase", isOverLimit ? "text-[#DC2626]" : "text-[#475569]")}>
                                                            {isOverLimit ? 'Límite Excedido' : `${percent.toFixed(1)}%`}
                                                        </span>
                                                        <span className="text-[10px] text-[#94A3B8]">{fmtNoDollar(customer.currentBalance)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                                                        <div
                                                            className={clsx(
                                                                "h-full rounded-full transition-all duration-1000",
                                                                isOverLimit ? "bg-[#DC2626]" : percent > 85 ? "bg-[#EA580C]" : percent > 50 ? "bg-[#F59E0B]" : "bg-[#2563EB]"
                                                            )}
                                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Balance */}
                                            <td className="py-4 px-6 text-right">
                                                <span className={clsx(
                                                    "font-bold font-mono text-sm",
                                                    parseFloat(customer.currentBalance) > 0 ? "text-[#0F172A]" : "text-[#16A34A]"
                                                )}>
                                                    ${parseFloat(customer.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            {/* Limit */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-sm font-medium text-[#475569] font-mono">
                                                        ${parseFloat(customer.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {isOverLimit && <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/clientes/administracion?id=${customer.id}`)}
                                                        className="px-3 py-1.5 text-[11px] font-bold text-[#2563EB] bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-lg hover:bg-[#2563EB] hover:text-white transition-all flex items-center gap-1.5"
                                                    >
                                                        DETALLE <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer / Pagination */}
                {!loading && customers.length > 0 && (
                    <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC] flex items-center justify-between">
                        <p className="text-xs text-[#64748B]">Mostrando <span className="font-bold text-[#0F172A]">{customers.length}</span> registros en este segmento</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-xs font-semibold border border-[#E2E8F0] bg-white rounded-lg text-[#94A3B8] cursor-not-allowed">Anterior</button>
                            <button className="px-3 py-1.5 text-xs font-semibold border border-[#E2E8F0] bg-white rounded-lg text-[#94A3B8] cursor-not-allowed">Siguiente</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

const AVATAR_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EA580C', '#DC2626', '#06B6D4'];

function fmtNoDollar(val: string) {
    return parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
