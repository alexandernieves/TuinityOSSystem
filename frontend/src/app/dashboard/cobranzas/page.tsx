'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TrendingDown,
    DollarSign,
    Users,
    AlertCircle,
    Calendar,
    Phone,
    Clock,
    UserX,
    MessageSquare,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import {
    Card,
    CardBody,
    Button,
    Input,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Progress,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Textarea,
    Select,
    SelectItem
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function ReceivablesDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { isOpen: isInteractionOpen, onOpen: onInteractionOpen, onOpenChange: onInteractionOpenChange } = useDisclosure();
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [interactionType, setInteractionType] = useState('CALL');
    const [interactionDetails, setInteractionDetails] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        const session = loadSession();
        if (!session) {
            router.push('/login');
            return;
        }

        try {
            const dashboardData = await api('/receivables/dashboard', {
                accessToken: session.accessToken
            });
            setData(dashboardData);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar dashboard de cobranzas');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordInteraction = async () => {
        const session = loadSession();
        if (!session || !selectedCustomer) return;

        try {
            await api('/receivables/interactions', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    customerId: selectedCustomer.id,
                    type: interactionType,
                    details: interactionDetails,
                    status: 'COMPLETED',
                    date: new Date().toISOString()
                }
            });
            toast.success('Gestión registrada correctamente');
            setInteractionDetails('');
            onInteractionOpenChange();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al registrar gestión');
        }
    };

    const handleAutoBlock = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            const res: any = await api('/receivables/auto-block', {
                method: 'POST',
                accessToken: session.accessToken
            });
            toast.success(res.message);
            fetchDashboard();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al ejecutar bloqueo automático');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <Clock className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando cuentas por cobrar...</p>
                </div>
            </div>
        );
    }

    const agingColors: any = {
        'current': 'success',
        '1-30': 'warning',
        '31-60': 'danger',
        '61-90': 'danger',
        '90+': 'danger'
    };

    const getAgingPercentage = (val: number) => {
        if (!data?.totalPortfolio) return 0;
        return (val / data.totalPortfolio) * 100;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                <TrendingDown className="w-7 h-7 text-red-600" />
                                Cuentas por Cobrar
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Gestión de Cartera y Morosidad
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                color="danger"
                                variant="flat"
                                startContent={<UserX className="w-4 h-4" />}
                                onClick={handleAutoBlock}
                            >
                                Bloqueo Automático
                            </Button>
                            <Button
                                color="primary"
                                startContent={<ArrowUpRight className="w-4 h-4" />}
                                onClick={() => router.push('/dashboard/cobranzas/reporte-aging')}
                            >
                                Reporte Detallado
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <CardBody className="p-6">
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total Cartera</p>
                            <p className="text-4xl font-black">${data?.totalPortfolio?.toLocaleString()}</p>
                            <div className="mt-4 flex items-center gap-2 text-blue-100 italic text-sm">
                                <Users className="w-4 h-4" />
                                <span>{data?.topDebtors?.length} clientes con deuda</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-sm border-l-4 border-red-500">
                        <CardBody className="p-6">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Monto Vencido</p>
                            <p className="text-4xl font-black text-slate-900">${data?.totalOverdue?.toLocaleString()}</p>
                            <div className="mt-4">
                                <Progress
                                    value={data?.overduePercentage}
                                    color="danger"
                                    size="sm"
                                    label="Porcentaje de Mora"
                                    classNames={{ label: "text-xs font-bold uppercase" }}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardBody className="p-6">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Eficiencia de Cobro</p>
                            <p className="text-4xl font-black text-slate-900">
                                {(100 - (data?.overduePercentage || 0)).toFixed(1)}%
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold">
                                <DollarSign className="w-4 h-4" />
                                <span>Flujo de caja saludable</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Aging Report Summary */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-6">
                        <h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Análisis de Antigüedad (Aging Report)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {Object.entries(data?.aging || {}).map(([category, amount]: [string, any]) => (
                                <div key={category} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-slate-400">
                                            {category === 'current' ? 'Al Día' : `${category} Días`}
                                        </p>
                                        <p className="text-sm font-black text-slate-700">${amount?.toLocaleString()}</p>
                                    </div>
                                    <Progress
                                        value={getAgingPercentage(amount)}
                                        color={agingColors[category]}
                                        size="sm"
                                    />
                                    <p className="text-[10px] text-right text-slate-400">
                                        {getAgingPercentage(amount).toFixed(1)}% de cartera
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Top Debtors Table */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                Clientes con Mayor Morosidad
                            </h3>
                        </div>

                        <Table aria-label="Top debtors" removeWrapper>
                            <TableHeader>
                                <TableColumn>CLIENTE</TableColumn>
                                <TableColumn>MOROSIDAD</TableColumn>
                                <TableColumn>SALDO TOTAL</TableColumn>
                                <TableColumn>LÍMITE</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                                <TableColumn>ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {data?.topDebtors?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-bold text-slate-900">{item.name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-black text-red-600">${item.overdue.toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-700">${item.balance.toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-slate-400">${item.creditLimit.toLocaleString()}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={item.status === 'BLOCKED' ? 'danger' : 'warning'}
                                                className="font-bold uppercase text-[10px]"
                                            >
                                                {item.status}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    startContent={<MessageSquare className="w-3 h-3" />}
                                                    onClick={() => {
                                                        setSelectedCustomer(item);
                                                        onInteractionOpen();
                                                    }}
                                                >
                                                    Gestionar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => router.push(`/dashboard/clientes/${item.id}`)}
                                                >
                                                    Ficha
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>

            {/* Interaction Modal */}
            <Modal isOpen={isInteractionOpen} onOpenChange={onInteractionOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>Registrar Gestión de Cobro</ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-400 uppercase font-bold">Cliente</p>
                                        <p className="font-bold text-slate-900">{selectedCustomer?.name}</p>
                                        <p className="text-sm text-red-600 font-black mt-1">
                                            Deuda Vencida: ${selectedCustomer?.overdue?.toLocaleString()}
                                        </p>
                                    </div>

                                    <Select
                                        label="Tipo de Gestión"
                                        selectedKeys={[interactionType]}
                                        onChange={(e) => setInteractionType(e.target.value)}
                                    >
                                        <SelectItem key="CALL">Llamada Telefónica</SelectItem>
                                        <SelectItem key="EMAIL">Correo Electrónico</SelectItem>
                                        <SelectItem key="VISIT">Visita Presencial</SelectItem>
                                        <SelectItem key="PROMISE_TO_PAY">Promesa de Pago</SelectItem>
                                    </Select>

                                    <Textarea
                                        label="Detalles de la gestión"
                                        placeholder="Escribe el resultado de la comunicación..."
                                        value={interactionDetails}
                                        onChange={(e) => setInteractionDetails(e.target.value)}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button color="primary" onPress={handleRecordInteraction}>
                                    Guardar Gestión
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
