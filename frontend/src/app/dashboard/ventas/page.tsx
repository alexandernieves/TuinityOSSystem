'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Plus,
    Search,
    Filter,
    Clock,
    FileCheck,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    TrendingUp,
    Calendar,
    Package,
    Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type Sale = {
    id: string;
    orderNumber: string;
    quoteNumber: string;
    customer?: { name: string };
    customerName?: string;
    status: 'QUOTE' | 'APPROVED_QUOTE' | 'PENDING' | 'APPROVED_ORDER' | 'PACKING' | 'COMPLETED' | 'VOID';
    total: number;
    currency: string;
    createdAt: string;
    user?: { name: string };
};

type StatusConfig = {
    label: string;
    variant: 'success' | 'warning' | 'error' | 'info' | 'critical';
    icon: React.ReactNode;
};

export default function VentasPipelinePage() {
    const router = useRouter();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async (q?: string) => {
        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            const queryParams = q ? `?q=${encodeURIComponent(q)}` : '';
            const data = await api<{ items: Sale[] }>(`/sales${queryParams}`, {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setSales(data.items || []);
        } catch (err) {
            toast.error('Error al cargar el pipeline de ventas');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig: Record<string, StatusConfig> = {
        QUOTE: { label: 'Cotización', variant: 'info', icon: <Clock className="w-4 h-4" /> },
        APPROVED_QUOTE: { label: 'Cotiz. Aprobada', variant: 'success', icon: <FileCheck className="w-4 h-4" /> },
        PENDING: { label: 'Pedido Pendiente', variant: 'warning', icon: <Clock className="w-4 h-4" /> },
        APPROVED_ORDER: { label: 'Orden Lista', variant: 'success', icon: <CheckCircle2 className="w-4 h-4" /> },
        PACKING: { label: 'En Empaque', variant: 'info', icon: <Package className="w-4 h-4" /> },
        COMPLETED: { label: 'Finalizado', variant: 'success', icon: <CheckCircle2 className="w-4 h-4" /> },
        VOID: { label: 'Anulado', variant: 'error', icon: <AlertTriangle className="w-4 h-4" /> },
    };

    const filteredSales = sales.filter(s =>
        s.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.quoteNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const quotesCount = sales.filter(s => s.status === 'QUOTE').length;
    const pendingCount = sales.filter(s => s.status === 'PENDING').length;
    const projectedRevenue = sales.reduce((acc, sale) => acc + (sale.status !== 'VOID' ? sale.total : 0), 0);

    return (
        <div className="space-y-6">
            <div id="pipeline-table">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#1A2B3C]" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#5A6C7D]">Pipeline Comercial Global</h2>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">En Negociación</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">{quotesCount}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                                <TrendingUp className="h-6 w-6 text-[#2980B9]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">Órdenes Pendientes</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">{pendingCount}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F39C12]/10">
                                <Clock className="h-6 w-6 text-[#F39C12]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card hover>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-[#5A6C7D]">Ingresos Proyectados</p>
                                <p className="mt-2 text-3xl font-semibold text-[#2C3E50]">${projectedRevenue.toLocaleString()}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2D8A4E]/10">
                                <Coins className="h-6 w-6 text-[#2D8A4E]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Table */}
            <Card>
                {/* Table Header */}
                <div className="flex flex-col gap-4 border-b border-[#E1E8ED] p-6 md:flex-row md:items-center md:justify-between">
                    <Input
                        placeholder="Buscar por cliente, pedido o cotización..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        className="md:w-96"
                    />

                    <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
                        Filtros Avanzados
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F4F7F6]">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Referencia / Cliente</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Estado</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Ejecutivo</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Total</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E8ED]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-sm text-[#5A6C7D]">
                                        Cargando pipeline...
                                    </td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <Briefcase className="mx-auto mb-4 h-16 w-16 text-[#B8C5D0]" />
                                        <p className="text-sm text-[#5A6C7D]">No hay registros en el pipeline</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="group cursor-pointer transition-colors hover:bg-[#F4F7F6]"
                                        onClick={() => router.push(`/dashboard/ventas/${sale.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-[#2C3E50]">
                                                    {sale.customer?.name || sale.customerName || 'Cliente sin nombre'}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-[#5A6C7D]">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>
                                                        {sale.orderNumber || sale.quoteNumber || 'Borrador'} • {new Date(sale.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusConfig[sale.status]?.variant || 'info'}>
                                                <div className="flex items-center gap-1.5">
                                                    {statusConfig[sale.status]?.icon}
                                                    {statusConfig[sale.status]?.label || sale.status}
                                                </div>
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs font-medium text-[#D4AF37]">
                                                    {sale.user?.name?.charAt(0) || 'S'}
                                                </div>
                                                <p className="text-sm font-medium text-[#2C3E50]">
                                                    {sale.user?.name || 'Vendedor Sistema'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-[#2C3E50]">
                                                ${sale.total.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-[#5A6C7D]">{sale.currency || 'USD'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="rounded-lg p-2 text-[#5A6C7D] transition-colors hover:bg-[#F4F7F6] hover:text-[#2C3E50] group-hover:text-[#2980B9]">
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
