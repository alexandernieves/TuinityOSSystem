'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus, Upload, Search, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type PurchaseOrder = {
    id: string;
    orderNumber: string;
    provider: string;
    status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    totalFob: number;
    totalCif: number;
    currency: string;
    createdAt: string;
    _count?: {
        items: number;
    };
};

export default function ComprasPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async (search?: string) => {
        const session = loadSession();
        if (!session?.accessToken) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            const queryParams = search ? `?q=${encodeURIComponent(search)}` : '';
            const data = await api<PurchaseOrder[]>(`/purchases${queryParams}`, {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setOrders(data);
        } catch (err: any) {
            if (err.status === 401) router.push('/login');
            else toast.error('Error al cargar órdenes de compra');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info'; icon: React.ReactNode }> = {
        PENDING: { label: 'Borrador', variant: 'warning', icon: <Clock className="w-4 h-4" /> },
        ORDERED: { label: 'Pedido', variant: 'info', icon: <FileText className="w-4 h-4" /> },
        RECEIVED: { label: 'Recibido', variant: 'success', icon: <CheckCircle className="w-4 h-4" /> },
        CANCELLED: { label: 'Cancelado', variant: 'error', icon: <AlertCircle className="w-4 h-4" /> },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2D8A4E]/10">
                            <ShoppingBag className="h-6 w-6 text-[#2D8A4E]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Compras e Importaciones</h1>
                            <p className="text-sm text-[#5A6C7D]">Gestiona tus órdenes de compra y el flujo de costos FOB → CIF</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        size="md"
                        leftIcon={<Upload className="w-4 h-4" />}
                        onClick={() => router.push('/dashboard/compras/importar')}
                    >
                        Importar Factura
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => router.push('/dashboard/compras/nueva')}
                    >
                        Nueva Orden
                    </Button>
                </div>
            </div>

            {/* Search Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Buscar por número de orden, proveedor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOrders(searchQuery)}
                            leftIcon={<Search className="h-5 w-5" />}
                            className="flex-1"
                        />
                        <Button variant="primary" size="md" onClick={() => fetchOrders(searchQuery)}>
                            Filtrar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F4F7F6]">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Orden #</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Proveedor</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Estado</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Total FOB</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Total CIF</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Fecha</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E8ED]">
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-6 py-8">
                                            <div className="h-4 animate-pulse rounded bg-[#F4F7F6]"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-[#B8C5D0]" />
                                        <p className="text-sm text-[#5A6C7D]">No se encontraron órdenes de compra</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="cursor-pointer transition-colors hover:bg-[#F4F7F6]"
                                        onClick={() => router.push(`/dashboard/compras/${order.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-[#2C3E50]">#{order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#5A6C7D]">{order.provider}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusConfig[order.status]?.variant || 'info'}>
                                                <div className="flex items-center gap-1.5">
                                                    {statusConfig[order.status]?.icon}
                                                    {statusConfig[order.status]?.label}
                                                </div>
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-[#2C3E50]">
                                                ${order.totalFob?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-semibold text-[#2980B9]">
                                                ${order.totalCif?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[#5A6C7D]">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                Ver Detalle
                                            </Button>
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
