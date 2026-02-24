'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    DollarSign,
    AlertCircle,
    ShieldAlert,
    ChevronRight,
    Clock,
    CheckCircle2,
    Ban
} from 'lucide-react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type CustomerCredit = {
    id: string;
    name: string;
    taxId: string;
    customerType: 'CASH' | 'CREDIT';
    creditLimit: number;
    currentBalance: number;
    creditStatus: 'NORMAL' | 'OVERDUE' | 'BLOCKED';
    isBlocked: boolean;
    _count: { sales: number };
};

export default function AccountsReceivablePage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<CustomerCredit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'BLOCKED'>('ALL');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const session = loadSession();
        if (!session) return;
        setLoading(true);
        try {
            const result = await api<{ items: CustomerCredit[] }>('/customers?limit=100', {
                accessToken: session.accessToken
            });
            setCustomers(result.items);
        } catch (error) {
            toast.error('Error al cargar cuentas por cobrar');
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.taxId.includes(search);
        if (filter === 'OVERDUE') return matchesSearch && c.creditStatus === 'OVERDUE';
        if (filter === 'BLOCKED') return matchesSearch && c.isBlocked;
        return matchesSearch;
    });

    const totalReceivable = customers.reduce((acc, c) => acc + Number(c.currentBalance), 0);
    const totalBlocked = customers.filter(c => c.isBlocked).length;
    const totalOverdue = customers.filter(c => c.creditStatus === 'OVERDUE').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                            <DollarSign className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Cuentas por Cobrar</h1>
                            <p className="text-sm text-[#5A6C7D]">Gestión de créditos y cartera</p>
                        </div>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                    Registro de Cobro
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card hover>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-[#5A6C7D]">Cartera Total</p>
                        <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">
                            ${totalReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#2D8A4E]">
                            <span className="font-medium">Saldo Activo</span>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-[#5A6C7D]">Clientes Morosos</p>
                        <p className="mt-2 text-3xl font-semibold text-[#C0392B]">{totalOverdue}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#C0392B]">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">Requieren Seguimiento</span>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-[#5A6C7D]">Créditos Bloqueados</p>
                        <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">{totalBlocked}</p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#5A6C7D]">
                            <ShieldAlert className="h-4 w-4" />
                            <span className="font-medium">Acceso Restringido</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Customers Table */}
            <Card>
                {/* Table Header */}
                <div className="flex flex-col gap-4 border-b border-[#E1E8ED] p-6 md:flex-row md:items-center md:justify-between">
                    <Input
                        placeholder="Buscar cliente por nombre o RUC..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        className="md:w-96"
                    />

                    <div className="flex gap-2 rounded-lg bg-[#F4F7F6] p-1">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={clsx(
                                "rounded-md px-4 py-2 text-xs font-medium transition-all",
                                filter === 'ALL' ? "bg-white text-[#2980B9] shadow-sm" : "text-[#5A6C7D] hover:text-[#2C3E50]"
                            )}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilter('OVERDUE')}
                            className={clsx(
                                "rounded-md px-4 py-2 text-xs font-medium transition-all",
                                filter === 'OVERDUE' ? "bg-[#C0392B] text-white shadow-md" : "text-[#5A6C7D] hover:text-[#C0392B]"
                            )}
                        >
                            Morosos
                        </button>
                        <button
                            onClick={() => setFilter('BLOCKED')}
                            className={clsx(
                                "rounded-md px-4 py-2 text-xs font-medium transition-all",
                                filter === 'BLOCKED' ? "bg-[#1A2B3C] text-white shadow-md" : "text-[#5A6C7D] hover:text-[#1A2B3C]"
                            )}
                        >
                            Bloqueados
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F4F7F6]">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Cliente / ID</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Estado de Crédito</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Uso de Límite</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Saldo Pendiente</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E8ED]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-sm text-[#5A6C7D]">
                                        Calculando antigüedad de saldos...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <Users className="mx-auto mb-4 h-16 w-16 text-[#B8C5D0]" />
                                        <p className="text-sm text-[#5A6C7D]">No hay saldos pendientes en esta vista</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c) => {
                                    const usagePercent = Math.min(100, (Number(c.currentBalance) / Number(c.creditLimit)) * 100);
                                    return (
                                        <tr
                                            key={c.id}
                                            className="group cursor-pointer transition-colors hover:bg-[#F4F7F6]"
                                            onClick={() => router.push(`/dashboard/clientes/${c.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2980B9]/10 text-xs font-semibold text-[#2980B9]">
                                                        {c.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[#2C3E50]">{c.name}</p>
                                                        <p className="text-xs text-[#5A6C7D]">RUC: {c.taxId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {c.isBlocked ? (
                                                    <Badge variant="error">
                                                        <div className="flex items-center gap-1.5">
                                                            <Ban className="h-3 w-3" />
                                                            BLOQUEADO
                                                        </div>
                                                    </Badge>
                                                ) : c.creditStatus === 'OVERDUE' ? (
                                                    <Badge variant="warning">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3" />
                                                            MOROSIDAD
                                                        </div>
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="success">
                                                        <div className="flex items-center gap-1.5">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            AL DÍA
                                                        </div>
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-[#5A6C7D]">Consumo</span>
                                                        <span className={clsx(
                                                            "font-semibold",
                                                            usagePercent > 90 ? "text-[#C0392B]" : "text-[#2980B9]"
                                                        )}>
                                                            {usagePercent.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-32 overflow-hidden rounded-full bg-[#E1E8ED]">
                                                        <div
                                                            className={clsx(
                                                                "h-full transition-all",
                                                                usagePercent > 90 ? "bg-[#C0392B]" : "bg-[#2980B9]"
                                                            )}
                                                            style={{ width: `${usagePercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-lg font-semibold text-[#2C3E50]">
                                                        ${Number(c.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="mt-1 rounded-full bg-[#F4F7F6] px-3 py-1 text-xs text-[#5A6C7D]">
                                                        Límite: ${Number(c.creditLimit).toLocaleString()}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="rounded-lg p-2 text-[#5A6C7D] transition-colors hover:bg-[#F4F7F6] hover:text-[#2C3E50] group-hover:text-[#2980B9]">
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Footer Help */}
            <div className="flex justify-center">
                <div className="flex items-center gap-3 rounded-full bg-[#1A2B3C] px-6 py-3 text-white shadow-lg">
                    <ShieldAlert className="h-5 w-5 text-[#D4AF37]" />
                    <p className="text-xs font-medium">
                        El sistema bloquea automáticamente despachos si el saldo excede el límite de crédito configurado.
                    </p>
                </div>
            </div>
        </div>
    );
}
