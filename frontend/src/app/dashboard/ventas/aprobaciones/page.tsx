'use client';

import React, { useState, useEffect } from 'react';
import {
    FileCheck,
    Search,
    Filter,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    Calendar,
    User,
    DollarSign,
    Zap,
    Clock,
    ShieldAlert
} from 'lucide-react';
import {
    Button,
    Input,
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Avatar,
    Progress,
    Tooltip,
    Divider,
    Tabs,
    Tab
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { useRouter } from 'next/navigation';

type PendingSale = {
    id: string;
    orderNumber: string | null;
    quoteNumber: string | null;
    status: string;
    total: number;
    paymentMethod: string;
    createdAt: string;
    customerName: string;
    customer: {
        id: string;
        name: string;
        taxId: string;
        currentBalance: number;
        creditLimit: number;
        isBlocked: boolean;
    } | null;
    user: {
        name: string;
    };
};

export default function SalesApprovalPage() {
    const router = useRouter();
    const [sales, setSales] = useState<PendingSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingSales();
    }, []);

    const fetchPendingSales = async () => {
        const session = loadSession();
        if (!session) return;

        setLoading(true);
        try {
            const data = await api<{ items: PendingSale[] }>('/sales?status=QUOTE,PENDING&limit=100', {
                accessToken: session.accessToken
            });
            setSales(data.items);
        } catch (error) {
            toast.error('Error al cargar órdenes pendientes');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, currentStatus: string) => {
        const session = loadSession();
        if (!session) return;

        setProcessingId(id);
        const nextStatus = currentStatus === 'QUOTE' ? 'PENDING' : 'APPROVED_ORDER';

        try {
            await api(`/sales/${id}/status`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: {
                    status: nextStatus,
                    authorizedBy: session.userId || 'Ariel Manager',
                    notes: `Aprobación rápida desde Centro de Aprobaciones`
                }
            });
            toast.success(`Orden ${nextStatus === 'PENDING' ? 'convertida em Pedido' : 'aprobada'} con éxito`);
            fetchPendingSales();
        } catch (error: any) {
            toast.error(error.message || 'Error al aprobar orden');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = sales.filter(s =>
        (s.customerName || s.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.orderNumber || s.quoteNumber || '').includes(search)
    );

    const stats = {
        totalPending: sales.length,
        totalValue: sales.reduce((acc, s) => acc + Number(s.total), 0),
        atRisk: sales.filter(s => {
            if (!s.customer) return false;
            const balance = Number(s.customer.currentBalance) + Number(s.total);
            return balance > Number(s.customer.creditLimit) || s.customer.isBlocked;
        }).length
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Centro de Aprobaciones</h1>
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cola de Gestión de Pedidos B2B • Ariel (Manager)</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="flat"
                        radius="full"
                        onPress={fetchPendingSales}
                        startContent={<Clock className="w-4 h-4" />}
                        className="font-black uppercase text-[10px] tracking-wider"
                    >
                        Actualizar Cola
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden rounded-[40px]">
                    <CardBody className="p-8 flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest mb-1">Órdenes Pendientes</p>
                            <h3 className="text-4xl font-black">{stats.totalPending}</h3>
                        </div>
                        <div className="p-4 bg-white/10 rounded-3xl">
                            <Zap className="w-8 h-8 fill-current" />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[40px]">
                    <CardBody className="p-8 flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Volumen en Revisión</p>
                            <h3 className="text-4xl font-black text-slate-900">${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-3xl text-slate-400">
                            <DollarSign className="w-8 h-8" />
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[40px]">
                    <CardBody className="p-8 flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Riesgo de Crédito</p>
                            <h3 className="text-4xl font-black text-red-500">{stats.atRisk} <span className="text-sm font-bold text-slate-400">ALERTAS</span></h3>
                        </div>
                        <div className="p-4 bg-red-50 rounded-3xl text-red-500">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Filter & Search */}
            <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input
                        placeholder="Buscar por cliente, cotización o pedido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                        classNames={{
                            inputWrapper: "bg-white border-none shadow-sm h-14 rounded-2xl"
                        }}
                    />
                </div>
                <Button isIconOnly variant="flat" className="h-14 w-14 rounded-2xl bg-white shadow-sm">
                    <Filter className="w-5 h-5 text-slate-400" />
                </Button>
            </div>

            {/* List Table */}
            <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
                <Table
                    aria-label="Pendientes de Aprobación"
                    selectionMode="none"
                    classNames={{
                        wrapper: "p-0 shadow-none",
                        th: "bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest py-6 px-8",
                        td: "py-6 px-8 border-b border-slate-50"
                    }}
                >
                    <TableHeader>
                        <TableColumn>DOCUMENTO</TableColumn>
                        <TableColumn>CLIENTE / RELACIÓN</TableColumn>
                        <TableColumn>CRÉDITO USADO</TableColumn>
                        <TableColumn>TOTAL</TableColumn>
                        <TableColumn>SOLICITANTE</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn align="center">ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No hay órdenes pendientes de aprobación">
                        {filtered.map((s) => {
                            const creditLimit = Number(s.customer?.creditLimit || 0);
                            const currentBalance = Number(s.customer?.currentBalance || 0);
                            const usage = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
                            const overflows = (currentBalance + Number(s.total)) > creditLimit;

                            return (
                                <TableRow key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 uppercase">#{s.orderNumber || s.quoteNumber}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(s.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={s.customerName || s.customer?.name}
                                                size="sm"
                                                className="font-black bg-blue-100 text-blue-600"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{s.customerName || s.customer?.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.customer?.taxId}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[150px] space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className={overflows ? "text-red-500" : "text-slate-400"}>
                                                    {overflows ? 'LÍMITE EXCEDIDO' : 'DENTRO DE LÍMITE'}
                                                </span>
                                                <span className="text-slate-900">{usage.toFixed(0)}%</span>
                                            </div>
                                            <Progress
                                                size="sm"
                                                value={usage}
                                                color={overflows ? "danger" : "primary"}
                                                className="h-1.5"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 text-lg">${Number(s.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            <Chip size="sm" variant="flat" color={s.paymentMethod === 'CREDIT' ? 'warning' : 'success'} className="font-black text-[9px] uppercase px-0">
                                                {s.paymentMethod === 'CREDIT' ? 'VENTA A CRÉDITO' : 'CONTADO / CASH'}
                                            </Chip>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 uppercase">{s.user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            variant="dot"
                                            color={s.status === 'QUOTE' ? 'secondary' : 'warning'}
                                            className="font-black uppercase text-[10px]"
                                        >
                                            {s.status === 'QUOTE' ? 'COTIZACIÓN' : 'PEDIDO PENDIENTE'}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 justify-center">
                                            <Button
                                                size="sm"
                                                radius="full"
                                                color="primary"
                                                className="font-black uppercase text-[10px] tracking-widest px-6"
                                                startContent={processingId === s.id ? null : <ArrowRight className="w-3 h-3" />}
                                                isLoading={processingId === s.id}
                                                onPress={() => handleApprove(s.id, s.status)}
                                            >
                                                {s.status === 'QUOTE' ? 'Convertir a Pedido' : 'Aprobar Cama'}
                                            </Button>
                                            <Tooltip content="Ver Documento Detalle">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    radius="full"
                                                    onPress={() => router.push(`/dashboard/ventas/${s.id}`)}
                                                >
                                                    <Search className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>

            <div className="flex items-center gap-4 p-8 bg-slate-900 rounded-[40px] text-white">
                <div className="p-4 bg-white/10 rounded-[28px]">
                    <AlertCircle className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h4 className="font-black uppercase text-sm tracking-widest">Protocolo de Aprobación</h4>
                    <p className="text-slate-400 text-xs">Las órdenes con 'LÍMITE EXCEDIDO' requieren autorización manual de gerencia. Al aprobar, el sistema reservará automáticamente el stock en bodega y notificará a Tráfico para el despacho.</p>
                </div>
                <div className="ml-auto">
                    <Button variant="bordered" className="text-white border-white/20 font-black uppercase text-[10px] tracking-widest px-8 h-12 rounded-2xl">
                        Descargar Reporte del Día
                    </Button>
                </div>
            </div>
        </div>
    );
}
