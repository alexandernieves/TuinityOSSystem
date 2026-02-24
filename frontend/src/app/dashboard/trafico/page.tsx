'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Ship,
    FileText,
    Package,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    Send,
    Eye,
    Filter,
    Anchor
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Input,
    Select,
    SelectItem
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function TrafficPage() {
    const router = useRouter();
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchShipments();
        fetchStats();
    }, [filter]);

    const fetchShipments = async () => {
        const session = loadSession();
        if (!session) {
            router.push('/login');
            return;
        }

        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);

            const data = await api(`/traffic/shipments?${params.toString()}`, {
                accessToken: session.accessToken
            }) as any;
            setShipments(data.items || data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar envíos');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            const data = await api('/traffic/shipments/stats', {
                accessToken: session.accessToken
            });
            setStats(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleViewDocuments = (shipmentId: string) => {
        router.push(`/dashboard/trafico/${shipmentId}`);
    };

    const handleDispatch = async (shipmentId: string) => {
        const session = loadSession();
        if (!session) return;

        try {
            await api(`/traffic/shipments/${shipmentId}/dispatch`, {
                method: 'POST',
                accessToken: session.accessToken,
                body: { dispatchedAt: new Date().toISOString() }
            });
            toast.success('Envío marcado como despachado');
            fetchShipments();
            fetchStats();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al despachar envío');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'default';
            case 'PACKED': return 'primary';
            case 'DISPATCHED': return 'secondary';
            case 'IN_TRANSIT': return 'primary';
            case 'ARRIVED': return 'success';
            case 'DELIVERED': return 'success';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'BORRADOR';
            case 'PACKED': return 'EMBALADO';
            case 'DISPATCHED': return 'DESPACHADO';
            case 'IN_TRANSIT': return 'EN ALTAMAR';
            case 'ARRIVED': return 'EN PUERTO';
            case 'DELIVERED': return 'ENTREGADO';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <Ship className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando envíos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                <Ship className="w-7 h-7 text-blue-600" />
                                Tráfico Avanzado
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Seguimiento Marítimo y Logística de Contenedores
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendientes</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.DRAFT || 0}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Despachados</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.DISPATCHED || 0}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Anchor className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Tránsito</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.IN_TRANSIT || 0}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border-none shadow-sm">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arribados</p>
                                    <p className="text-2xl font-black text-slate-900">{stats.ARRIVED || 0}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="border-none shadow-sm bg-slate-800 text-white">
                            <CardBody className="p-4 flex flex-row items-center gap-4">
                                <div className="p-3 rounded-xl bg-white/10 text-white">
                                    <Ship className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Total</p>
                                    <p className="text-2xl font-black">{stats.TOTAL || 0}</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-3">
                    <Select
                        label="Filtrar por Estado"
                        placeholder="Todos"
                        className="max-w-xs"
                        selectedKeys={[filter]}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <SelectItem key="all">Todos</SelectItem>
                        <SelectItem key="DRAFT">Borrador</SelectItem>
                        <SelectItem key="DISPATCHED">Despachados</SelectItem>
                        <SelectItem key="IN_TRANSIT">En Tránsito</SelectItem>
                        <SelectItem key="ARRIVED">Arribados / Puerto</SelectItem>
                        <SelectItem key="DELIVERED">Entregados</SelectItem>
                    </Select>
                </div>

                {/* Shipments Table */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-0">
                        {shipments.length === 0 ? (
                            <div className="p-12 text-center">
                                <Ship className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">No hay envíos registrados</p>
                                <p className="text-xs text-slate-400 mt-1">Los envíos se generan automáticamente al aprobar ventas</p>
                            </div>
                        ) : (
                            <Table aria-label="Shipments table" removeWrapper>
                                <TableHeader>
                                    <TableColumn>ENVÍO</TableColumn>
                                    <TableColumn>CLIENTE</TableColumn>
                                    <TableColumn>DESTINO</TableColumn>
                                    <TableColumn>ITEMS</TableColumn>
                                    <TableColumn>PESO TOTAL</TableColumn>
                                    <TableColumn>ESTADO</TableColumn>
                                    <TableColumn>ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {shipments.map((shipment: any) => (
                                        <TableRow key={shipment.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-bold text-slate-700">#{shipment.shipmentNumber}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {new Date(shipment.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-600">
                                                    {shipment.sale?.customer?.name || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-600">
                                                    {shipment.destination || 'No especificado'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-slate-700">
                                                    {shipment.items?.length || 0} items
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-slate-700">
                                                    {Number(shipment.totalWeight || 0).toFixed(2)} kg
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getStatusColor(shipment.status)}
                                                    variant="flat"
                                                    size="sm"
                                                    className="font-bold text-[10px]"
                                                >
                                                    {getStatusLabel(shipment.status)}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="primary"
                                                        startContent={<Eye className="w-4 h-4" />}
                                                        onClick={() => handleViewDocuments(shipment.id)}
                                                    >
                                                        Ver Docs
                                                    </Button>
                                                    {shipment.status !== 'DISPATCHED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="success"
                                                            startContent={<Send className="w-4 h-4" />}
                                                            onClick={() => handleDispatch(shipment.id)}
                                                        >
                                                            Despachar
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
