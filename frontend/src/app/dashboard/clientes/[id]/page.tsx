'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    FileText,
    DollarSign,
    History,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download,
    Mail,
    Phone,
    MapPin,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import {
    Avatar,
    Divider,
} from '@heroui/react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

type Sale = {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    invoiceNumber?: string;
};

type Payment = {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference?: string;
};

type CustomerDetail = {
    id: string;
    name: string;
    taxId: string;
    email?: string;
    phone?: string;
    address?: string;
    customerType: 'CASH' | 'CREDIT';
    creditLimit: number;
    currentBalance: number;
    creditStatus: string;
    isBlocked: boolean;
    sales: Sale[];
    payments: Payment[];
};

export default function CustomerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<CustomerDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        const session = loadSession();
        if (!session) return;
        setLoading(true);
        try {
            const data = await api<CustomerDetail>(`/customers/${id}`, { accessToken: session.accessToken });
            setCustomer(data);
        } catch (error) {
            toast.error('Error al cargar detalle del cliente');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
            <div className="text-center animate-pulse">
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-[#2980B9] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-sm font-medium text-[#5A6C7D] uppercase tracking-widest">Cargando perfil de cliente...</p>
            </div>
        </div>
    );

    if (!customer) return null;

    const timeline = [
        ...customer.sales.map(s => ({ ...s, type: 'SALE' as const, date: new Date(s.createdAt) })),
        ...(customer.payments || []).map(p => ({ ...p, type: 'PAYMENT' as const, date: new Date(p.paymentDate) }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/clientes/cxc')}
                        className="mb-4 flex items-center gap-2 text-sm text-[#5A6C7D] transition-colors hover:text-[#2C3E50]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Cartera (CXC)
                    </button>
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={customer.name}
                            className="h-12 w-12 bg-[#2980B9]/10 text-[#2980B9] font-bold"
                        />
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">{customer.name}</h1>
                            <p className="text-sm text-[#5A6C7D]">ID Fiscal: {customer.taxId}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="md"
                        leftIcon={<Download className="h-4 w-4" />}
                    >
                        Estado de Cuenta
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        leftIcon={<DollarSign className="h-4 w-4" />}
                    >
                        Registrar Abono
                    </Button>
                </div>
            </div>

            {/* Profile Hero Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card hover className="lg:col-span-2">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="space-y-6">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">Información de Contacto</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-[#2980B9]" />
                                        <span className="text-[#2C3E50] font-medium">{customer.email || 'No asignado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-[#2980B9]" />
                                        <span className="text-[#2C3E50] font-medium">{customer.phone || 'No asignado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-[#2980B9]" />
                                        <span className="text-[#2C3E50] font-medium leading-relaxed">{customer.address || 'Sin dirección registrada'}</span>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Badge variant={customer.isBlocked ? 'error' : 'success'} className="px-4 py-2">
                                        {customer.isBlocked ? 'CRÉDITO BLOQUEADO' : 'CRÉDITO ACTIVO'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-[#1A2B3C] p-8 text-white shadow-xl shadow-[#1A2B3C]/10 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Saldo Adeudado</p>
                                    <h2 className="mt-2 text-4xl font-bold font-mono">
                                        ${Number(customer.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h2>
                                    <div className="mt-8 space-y-3">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/50">
                                            <span>Uso de Línea de Crédito</span>
                                            <span>LIM: ${Number(customer.creditLimit).toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full bg-[#2980B9] transition-all duration-1000"
                                                style={{ width: `${Math.min(100, (Number(customer.currentBalance) / Number(customer.creditLimit)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DollarSign className="absolute -right-6 -bottom-6 h-32 w-32 text-white/5 rotate-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Security Status */}
                <Card className={clsx(
                    "border-none",
                    customer.isBlocked ? "bg-[#C0392B]" : "bg-[#2D8A4E]"
                )}>
                    <CardContent className="p-8 text-white">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                            {customer.isBlocked ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                        </div>
                        <h3 className="mt-6 text-xl font-bold uppercase tracking-tight">Estatus de Riesgo</h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-white/80">
                            {customer.isBlocked
                                ? 'Este cliente tiene operaciones suspendidas por morosidad crítica o exceso de límite.'
                                : 'Cliente con comportamiento de pago saludable. Credito disponible para nuevas órdenes.'}
                        </p>
                        <Button
                            variant="primary"
                            className="mt-8 w-full bg-white text-[#1A2B3C] hover:bg-white/90"
                            onClick={() => toast.info('Gestionando estatus de crédito...')}
                        >
                            {customer.isBlocked ? 'Desbloquear Crédito' : 'Bloquear Preventivamente'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Transaction Diario */}
                <div className="lg:col-span-8">
                    <Card>
                        <CardContent className="p-8">
                            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="flex items-center gap-3 text-lg font-semibold text-[#2C3E50]">
                                    <History className="h-5 w-5 text-[#2980B9]" />
                                    Diario de Transacciones
                                </h3>
                                <div className="flex gap-1 rounded-lg bg-[#F4F7F6] p-1">
                                    <button className="rounded-md bg-white px-4 py-1.5 text-xs font-bold text-[#2980B9] shadow-sm">Todo</button>
                                    <button className="rounded-md px-4 py-1.5 text-xs font-medium text-[#5A6C7D] hover:bg-white/50">Ventas</button>
                                    <button className="rounded-md px-4 py-1.5 text-xs font-medium text-[#5A6C7D] hover:bg-white/50">Abonos</button>
                                </div>
                            </div>

                            <div className="space-y-8 relative">
                                {/* Vertical line for timeline */}
                                <div className="absolute left-[23px] top-0 bottom-0 w-px bg-[#E1E8ED]" />

                                {timeline.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <Search className="mx-auto h-12 w-12 text-[#B8C5D0]" />
                                        <p className="mt-4 text-sm font-medium text-[#5A6C7D]">Sin actividad comercial registrada</p>
                                    </div>
                                ) : (
                                    timeline.map((item: any, idx) => (
                                        <div key={idx} className="relative flex gap-8 pb-10">
                                            <div className={clsx(
                                                "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm",
                                                item.type === 'SALE' ? "bg-[#1A2B3C] text-white" : "bg-[#2D8A4E] text-white"
                                            )}>
                                                {item.type === 'SALE' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[#2C3E50] uppercase tracking-tight">
                                                            {item.type === 'SALE' ? `Venta de Mercancía #${item.invoiceNumber || item.id.substring(0, 6)}` : `Recepción de Abono / Pago`}
                                                        </h4>
                                                        <p className="text-xs font-medium text-[#5A6C7D]">
                                                            {item.date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                                                        <p className={clsx(
                                                            "text-lg font-bold font-mono",
                                                            item.type === 'SALE' ? "text-[#2C3E50]" : "text-[#2D8A4E]"
                                                        )}>
                                                            {item.type === 'SALE' ? '+' : '-'} ${Number(item.total || item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <Badge variant={item.type === 'SALE' ? 'info' : 'success'} className="mt-1 text-[9px] font-bold">
                                                            {item.type === 'SALE' ? (item.status === 'COMPLETED' ? 'COMPLETADO' : 'PROCESANDO') : (item.paymentMethod || 'TRANSFERENCIA')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {item.reference && (
                                                    <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#F4F7F6] p-3 border border-[#E1E8ED]">
                                                        <FileText className="h-3.5 w-3.5 text-[#5A6C7D]" />
                                                        <span className="text-[10px] font-bold text-[#5A6C7D] uppercase tracking-wider">REF: {item.reference}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats & Mini Actions */}
                <div className="space-y-6 lg:col-span-4">
                    <Card>
                        <CardContent className="p-8">
                            <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-[#2C3E50]">Métricas del Cliente</h3>
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[#5A6C7D]">Ventas Consolidadas</span>
                                    <span className="text-sm font-bold text-[#2C3E50]">{customer.sales.length} facturas</span>
                                </div>
                                <Divider />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[#5A6C7D]">Abonos Aplicados</span>
                                    <span className="text-sm font-bold text-[#2D8A4E]">{customer.payments?.length || 0} pagos</span>
                                </div>
                                <Divider />
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[#5A6C7D]">Ticket Promedio</span>
                                    <span className="text-sm font-bold text-[#2C3E50]">
                                        ${(Number(customer.currentBalance) / (customer.sales.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                                <Divider />
                                <div className="pt-4">
                                    <p className="text-[10px] leading-relaxed text-[#5A6C7D] uppercase font-medium">
                                        Antigüedad de cuenta: <span className="text-[#2C3E50] font-bold">12 meses</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E1E8ED] bg-white transition-all hover:bg-[#F4F7F6] hover:shadow-sm">
                            <Mail className="h-6 w-6 text-[#2980B9]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A6C7D]">Email Cobro</span>
                        </button>
                        <button className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[#E1E8ED] bg-white transition-all hover:bg-[#F4F7F6] hover:shadow-sm">
                            <Phone className="h-6 w-6 text-[#2D8A4E]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A6C7D]">Llamar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
