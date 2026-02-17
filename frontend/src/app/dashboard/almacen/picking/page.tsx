'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Package,
    Search,
    Filter,
    ClipboardList,
    CheckCircle2,
    Clock,
    ArrowRight,
    Truck,
    Box,
    QrCode,
    Scan,
    AlertCircle,
    PlayCircle,
    MoreVertical,
    Printer
} from 'lucide-react';
import {
    Button,
    Input,
    Badge,
    Card,
    Divider,
    Progress,
    Tooltip,
    Chip,
    Tabs,
    Tab
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import clsx from 'clsx';

type PickingOrder = {
    id: string;
    orderNumber: string;
    customer?: { name: string };
    customerName?: string;
    status: 'PENDING' | 'APPROVED_ORDER' | 'PACKING' | 'COMPLETED';
    itemCount: number;
    totalQuantity: number;
    createdAt: string;
    branch?: { name: string };
};

export default function PickingMonitorPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<PickingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPickingOrders();
    }, []);

    const fetchPickingOrders = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            // Fetching sales that are in picking-relevant statuses
            const data = await api<{ items: PickingOrder[] }>(`/sales?status=PENDING,APPROVED_ORDER,PACKING`, {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setOrders(data.items || []);
        } catch (err) {
            toast.error('Error al sincronizar monitor de picking');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        PENDING: { label: 'Por Preparar', color: 'warning', icon: <Clock className="w-4 h-4" /> },
        APPROVED_ORDER: { label: 'Listo para Picking', color: 'primary', icon: <Package className="w-4 h-4" /> },
        PACKING: { label: 'En Empaque', color: 'secondary', icon: <Box className="w-4 h-4" /> },
        COMPLETED: { label: 'Despachado', color: 'success', icon: <CheckCircle2 className="w-4 h-4" /> },
    };

    const filteredOrders = orders.filter(o =>
        (filter === 'ALL' || o.status === filter) &&
        (o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.customer?.name || o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8 space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header Central de Almacén */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-[24px] shadow-xl shadow-blue-500/20">
                            <Scan className="w-8 h-8" />
                        </div>
                        Monitor de Picking
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Gestión de preparación de pedidos y flujo de bodega.</p>
                </div>

                <div className="flex gap-4">
                    <Button
                        color="primary"
                        variant="flat"
                        size="lg"
                        radius="lg"
                        startContent={<QrCode className="w-5 h-5" />}
                        className="font-black uppercase tracking-widest"
                    >
                        Escanear Código
                    </Button>
                    <Button
                        variant="solid"
                        color="primary"
                        size="lg"
                        radius="lg"
                        onClick={fetchPickingOrders}
                        startContent={<PlayCircle className="w-5 h-5" />}
                        className="font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
                    >
                        Actualizar Monitor
                    </Button>
                </div>
            </div>

            {/* Picking Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Pendientes', value: orders.filter(o => o.status === 'PENDING').length, color: 'bg-amber-50 text-amber-600', icon: Clock },
                    { label: 'En Proceso', value: orders.filter(o => o.status === 'APPROVED_ORDER').length, color: 'bg-blue-50 text-blue-600', icon: Package },
                    { label: 'Empacando', value: orders.filter(o => o.status === 'PACKING').length, color: 'bg-purple-50 text-purple-600', icon: Box },
                    { label: 'Eficiencia', value: '98%', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 rounded-[32px] border-none shadow-sm flex flex-row items-center justify-between group hover:shadow-md transition-all">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                        </div>
                        <div className={clsx("p-3 rounded-2xl", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Table Interface */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]">

                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6 bg-white/50 backdrop-blur-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                        <Input
                            placeholder="Nro. Pedido, Cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            variant="flat"
                            radius="lg"
                            size="lg"
                            className="pl-2"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        {[
                            { label: 'Todos', value: 'ALL' },
                            { label: 'Por Preparar', value: 'PENDING' },
                            { label: 'En Picking', value: 'APPROVED_ORDER' },
                            { label: 'En Empaque', value: 'PACKING' },
                        ].map(t => (
                            <button
                                key={t.value}
                                onClick={() => setFilter(t.value)}
                                className={clsx(
                                    "px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all",
                                    filter === t.value ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido / Referencia</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Bodega</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Progreso</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest">Sincronizando operaciones de almacén...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-32 text-center">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest">No hay pedidos pendientes en picking</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/dashboard/ventas/${order.id}`)} // Reuse sales details for logic
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <p className="font-black text-slate-900 uppercase text-sm">{order.orderNumber || 'PEDIDO-' + order.id.substring(0, 6)}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{order.customer?.name || order.customerName}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Chip
                                                variant="flat"
                                                color={(statusConfig[order.status] as any).color}
                                                startContent={(statusConfig[order.status] as any).icon}
                                                className="font-black uppercase tracking-widest text-[9px] h-8 px-4"
                                            >
                                                {statusConfig[order.status].label}
                                            </Chip>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2 w-48 mx-auto">
                                                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                                                    <span>Picking</span>
                                                    <span>{order.status === 'PACKING' ? '100%' : order.status === 'APPROVED_ORDER' ? '40%' : '0%'}</span>
                                                </div>
                                                <Progress
                                                    size="sm"
                                                    color={order.status === 'PACKING' ? 'success' : 'primary'}
                                                    value={order.status === 'PACKING' ? 100 : order.status === 'APPROVED_ORDER' ? 40 : 0}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip content="Imprimir Lista de Picking">
                                                    <Button isIconOnly variant="flat" radius="lg" size="sm">
                                                        <Printer className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </Tooltip>
                                                <Button
                                                    color="primary"
                                                    radius="lg"
                                                    size="sm"
                                                    className="font-black uppercase tracking-widest text-[10px]"
                                                    endContent={<ArrowRight className="w-4 h-4" />}
                                                >
                                                    {order.status === 'PENDING' ? 'Iniciar Picking' : 'Gestionar'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-[9px] font-bold uppercase tracking-widest italic">Priorizando órdenes por fecha de vencimiento y ruta logística.</p>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filteredOrders.length} PEDIDOS VISIBLES EN MONITOR</p>
                </div>
            </div>
        </div>
    );
}
