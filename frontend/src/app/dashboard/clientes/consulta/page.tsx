'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, Spinner } from '@heroui/react';
import {
    Search,
    Eye,
    Users,
    Filter,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertTriangle,
    XCircle,
    CreditCard,
    Wallet,
    UserCheck,
    TrendingUp,
    DollarSign,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type CustomerType = 'CASH' | 'CREDIT';
type CreditStatus = 'NORMAL' | 'WARNING' | 'OVERDUE' | 'BLOCKED';

interface Customer {
    id: string;
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    customerType: CustomerType;
    creditLimit: string;
    currentBalance: string;
    creditStatus: CreditStatus;
    isBlocked: boolean;
    isApproved: boolean;
    _count: {
        sales: number;
        transactions: number;
    };
}

const ITEMS_PER_PAGE = 8;

export default function DirectorioClientesPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customerType, setCustomerType] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Summary KPIs
    const [kpis, setKpis] = useState({
        total: 0,
        activos: 0,
        credito: 0,
        contado: 0,
    });

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: ITEMS_PER_PAGE.toString(),
                ...(search && { search }),
                ...(customerType && customerType !== 'all' && { customerType }),
            });

            const response = await api<{ items: Customer[]; totalPages: number; total: number }>(`/customers?${params}`);
            const items = response.items || [];
            setCustomers(items);
            setTotalPages(response.totalPages || 1);
            setTotalItems(response.total || items.length);

            // Derive KPIs from first full load (no filter)
            if (!search && !customerType) {
                setKpis({
                    total: response.total || items.length,
                    activos: items.filter(c => !c.isBlocked).length,
                    credito: items.filter(c => c.customerType === 'CREDIT').length,
                    contado: items.filter(c => c.customerType === 'CASH').length,
                });
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Error al cargar el directorio de clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search, customerType]);

    const getStatusBadge = (customer: Customer) => {
        if (customer.isBlocked) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-semibold uppercase">
                    <XCircle className="w-3 h-3" />
                    Bloqueado
                </span>
            );
        }
        switch (customer.creditStatus) {
            case 'NORMAL':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-semibold uppercase">
                        <CheckCircle className="w-3 h-3" />
                        Normal
                    </span>
                );
            case 'WARNING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] font-semibold uppercase">
                        <AlertTriangle className="w-3 h-3" />
                        Advertencia
                    </span>
                );
            case 'OVERDUE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-[11px] font-semibold uppercase">
                        <AlertTriangle className="w-3 h-3" />
                        Vencido
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#94A3B8]/10 text-[#94A3B8] text-[11px] font-semibold uppercase">
                        {customer.creditStatus}
                    </span>
                );
        }
    };

    const avatarColors = [
        'bg-[#2563EB]/10 text-[#2563EB]',
        'bg-[#16A34A]/10 text-[#16A34A]',
        'bg-[#F59E0B]/10 text-[#F59E0B]',
        'bg-[#DC2626]/10 text-[#DC2626]',
        'bg-[#38BDF8]/10 text-[#38BDF8]',
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">

            {/* ── HEADER ── */}
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-[#475569] mb-3">
                        <span className="hover:text-[#2563EB] cursor-pointer transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-[#2563EB] cursor-pointer transition-colors" onClick={() => router.push('/dashboard/clientes')}>Clientes</span>
                        <span>/</span>
                        <span className="text-[#0F172A] font-medium">Directorio</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20">
                            <Users className="h-6 w-6 text-[#2563EB]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-[#0F172A]">Directorio de Clientes</h1>
                            <p className="text-sm text-[#475569]">Consulta y gestiona tu base de datos de clientes activos.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[#475569]">Total Clientes</p>
                            <p className="text-2xl font-semibold text-[#0F172A] mt-1">{totalItems || kpis.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#2563EB]" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[#475569]">Activos</p>
                            <p className="text-2xl font-semibold text-[#0F172A] mt-1">{kpis.activos}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-[#16A34A]" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[#475569]">Con Crédito</p>
                            <p className="text-2xl font-semibold text-[#0F172A] mt-1">{kpis.credito}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-[#F59E0B]" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#E2E8F0] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[#475569]">De Contado</p>
                            <p className="text-2xl font-semibold text-[#0F172A] mt-1">{kpis.contado}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#38BDF8]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SEARCH & FILTERS ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                <div className="p-4 border-b border-[#E2E8F0] bg-[#F7F9FC]">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, RIF o email..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm text-[#0F172A]"
                            />
                        </div>

                        {/* Type filter */}
                        <div className="relative min-w-[180px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                            <select
                                value={customerType}
                                onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-8 py-2.5 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm text-[#0F172A] appearance-none"
                            >
                                <option value="">Tipo de Cliente</option>
                                <option value="all">Todos</option>
                                <option value="CASH">Contado</option>
                                <option value="CREDIT">Crédito</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                        </div>
                    </div>

                    {/* Active filter badges */}
                    {(search || (customerType && customerType !== '')) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {search && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs rounded-md font-medium">
                                    Búsqueda: "{search}"
                                    <button onClick={() => { setSearch(''); setPage(1); }} className="hover:opacity-70">
                                        <XCircle className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {customerType && customerType !== '' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs rounded-md font-medium">
                                    Tipo: {customerType === 'CREDIT' ? 'Crédito' : customerType === 'CASH' ? 'Contado' : 'Todos'}
                                    <button onClick={() => { setCustomerType(''); setPage(1); }} className="hover:opacity-70">
                                        <XCircle className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── TABLE ── */}
                {loading && customers.length === 0 ? (
                    <div className="flex justify-center items-center py-24">
                        <Spinner size="lg" color="primary" />
                    </div>
                ) : customers.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-14 h-14 rounded-full bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 text-[#94A3B8]" />
                        </div>
                        <p className="font-semibold text-[#0F172A]">No se encontraron clientes</p>
                        <p className="text-xs text-[#94A3B8] mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Cliente</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">RIF/NIT</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Límite</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Saldo</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Estado</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Ventas</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {customers.map((customer, idx) => (
                                    <tr
                                        key={customer.id}
                                        className="hover:bg-[#F7F9FC] transition-colors cursor-pointer group"
                                        onClick={() => router.push(`/dashboard/clientes/${customer.id}`)}
                                    >
                                        {/* Cliente */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center font-bold text-sm shrink-0`}>
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#0F172A]">{customer.name}</p>
                                                    {customer.email && (
                                                        <p className="text-xs text-[#94A3B8] truncate max-w-[180px]">{customer.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* RIF/NIT */}
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-[#F7F9FC] text-xs font-mono text-[#475569] border border-[#E2E8F0]">
                                                {customer.taxId || 'N/A'}
                                            </span>
                                        </td>

                                        {/* Tipo */}
                                        <td className="px-4 py-3">
                                            {customer.customerType === 'CREDIT' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-[11px] font-bold uppercase">
                                                    <CreditCard className="w-3 h-3" />
                                                    Crédito
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-bold uppercase">
                                                    <Wallet className="w-3 h-3" />
                                                    Contado
                                                </span>
                                            )}
                                        </td>

                                        {/* Límite */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-semibold text-[#0F172A]">
                                                {customer.customerType === 'CREDIT'
                                                    ? `$${parseFloat(customer.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                                    : <span className="text-[#94A3B8] font-normal">—</span>
                                                }
                                            </p>
                                        </td>

                                        {/* Saldo */}
                                        <td className="px-4 py-3">
                                            <p className={`text-sm font-semibold ${parseFloat(customer.currentBalance) > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                                                ${parseFloat(customer.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-4 py-3">
                                            {getStatusBadge(customer)}
                                        </td>

                                        {/* Ventas */}
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-semibold text-[#0F172A]">{customer._count.sales}</span>
                                                <span className="text-[10px] text-[#94A3B8]">Transacciones</span>
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="p-1.5 text-[#2563EB] hover:bg-[#2563EB]/10 rounded transition-colors"
                                                    title="Ver detalle"
                                                    onClick={() => router.push(`/dashboard/clientes/${customer.id}`)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-[#475569]">
                            Página <span className="font-semibold text-[#0F172A]">{page}</span> de{' '}
                            <span className="font-semibold text-[#0F172A]">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="p-2 border border-[#E2E8F0] rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-[#475569]" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                            ? 'bg-[#2563EB] text-white'
                                            : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F7F9FC]'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="p-2 border border-[#E2E8F0] rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-[#475569]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
