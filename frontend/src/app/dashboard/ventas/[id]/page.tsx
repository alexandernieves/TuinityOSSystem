'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Clock,
    FileCheck,
    CheckCircle2,
    AlertTriangle,
    Download,
    Edit3,
    Package,
    Building2,
    Calendar,
    ChevronRight,
    MoreVertical,
    XCircle,
    CreditCard,
    FileText,
    User,
    Info,
    Check
} from 'lucide-react';
import {
    Divider,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Progress,
} from '@heroui/react';
import { toast } from 'sonner';
import { api, API_BASE_URL } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

type SaleItem = {
    id: string;
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    product?: {
        description: string;
        brand?: { name: string };
    };
};

type Sale = {
    id: string;
    orderNumber: string;
    quoteNumber: string;
    status: 'QUOTE' | 'APPROVED_QUOTE' | 'PENDING' | 'APPROVED_ORDER' | 'PACKING' | 'COMPLETED' | 'VOID' | 'REFUNDED';
    total: number;
    subtotal: number;
    tax: number;
    currency: string;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
    customer?: {
        id: string;
        name: string;
        taxId: string;
        creditLimit: number;
        currentBalance: number;
    };
    customerName?: string;
    items: SaleItem[];
    branch?: { name: string };
    user?: { name: string };
};

export default function SalesDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchSaleDetails();
    }, [id]);

    const fetchSaleDetails = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            const data = await api<Sale>(`/sales/${id}`, {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setSale(data);
        } catch (err) {
            toast.error('Error al cargar detalles de la venta');
            router.push('/dashboard/ventas');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        const session = loadSession();
        if (!session?.accessToken) return;

        setProcessing(true);
        const toastId = toast.loading(`Cambiando estado a ${newStatus}...`);
        try {
            await api(`/sales/${id}/status`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: { status: newStatus }
            });
            toast.success('Estado actualizado correctamente', { id: toastId });
            fetchSaleDetails();
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar estado', { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadPdf = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const url = `${API_BASE_URL}/sales/${id}/pdf`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `Venta-${sale?.orderNumber || sale?.quoteNumber || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Error al generar PDF');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
            <div className="text-center animate-pulse">
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-[#2980B9] border-t-transparent animate-spin"></div>
                <p className="mt-4 text-sm font-medium text-[#5A6C7D] uppercase tracking-widest">Sincronizando información comercial...</p>
            </div>
        </div>
    );

    if (!sale) return null;

    const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'critical'; step: number }> = {
        QUOTE: { label: 'Cotización', variant: 'info', step: 1 },
        APPROVED_QUOTE: { label: 'Cotiz. Aprobada', variant: 'info', step: 2 },
        PENDING: { label: 'Pedido Pendiente', variant: 'warning', step: 3 },
        APPROVED_ORDER: { label: 'Orden Lista', variant: 'success', step: 3 },
        PACKING: { label: 'En Empaque', variant: 'info', step: 4 },
        COMPLETED: { label: 'Finalizado', variant: 'success', step: 5 },
        VOID: { label: 'Anulado', variant: 'error', step: 0 },
        REFUNDED: { label: 'Reembolsado', variant: 'warning', step: 0 },
    };

    const currentStep = statusConfig[sale.status]?.step || 0;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/ventas')}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#E1E8ED] text-[#5A6C7D] transition-colors hover:bg-[#F4F7F6]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-[#2C3E50] tracking-tight">
                                {sale.orderNumber || sale.quoteNumber || 'Borrador'}
                            </h1>
                            <Badge variant={statusConfig[sale.status]?.variant || 'info'} className="px-3 py-1 text-xs">
                                {statusConfig[sale.status]?.label || sale.status}
                            </Badge>
                        </div>
                        <p className="text-xs font-medium text-[#5A6C7D]">Registrada por <span className="text-[#2C3E50]">{sale.user?.name || 'Sistema'}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="md"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={handleDownloadPdf}
                    >
                        Descargar PDF
                    </Button>

                    {/* Conditional Status Actions */}
                    {sale.status === 'QUOTE' && (
                        <Button
                            variant="primary"
                            size="md"
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                            onClick={() => handleUpdateStatus('APPROVED_QUOTE')}
                            isLoading={processing}
                        >
                            Aprobar Cotización
                        </Button>
                    )}

                    {(sale.status === 'QUOTE' || sale.status === 'APPROVED_QUOTE') && (
                        <Button
                            variant="primary"
                            size="md"
                            leftIcon={<FileText className="h-4 w-4" />}
                            onClick={() => handleUpdateStatus('PENDING')}
                            isLoading={processing}
                        >
                            Convertir en Pedido
                        </Button>
                    )}

                    {sale.status === 'PENDING' && (
                        <Button
                            variant="primary"
                            size="md"
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                            onClick={() => handleUpdateStatus('APPROVED_ORDER')}
                            isLoading={processing}
                        >
                            Aprobar para Picking
                        </Button>
                    )}

                    {sale.status === 'APPROVED_ORDER' && (
                        <Button
                            variant="primary"
                            size="md"
                            leftIcon={<Package className="h-4 w-4" />}
                            onClick={() => handleUpdateStatus('PACKING')}
                            isLoading={processing}
                        >
                            Comenzar Empaque
                        </Button>
                    )}

                    {(sale.status === 'APPROVED_ORDER' || sale.status === 'PACKING') && (
                        <Button
                            variant="primary"
                            size="md"
                            leftIcon={<CreditCard className="h-4 w-4" />}
                            onClick={() => handleUpdateStatus('COMPLETED')}
                            isLoading={processing}
                        >
                            Finalizar y Facturar
                        </Button>
                    )}

                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Button isIconOnly variant="ghost">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Acciones adicionales">
                            <DropdownItem key="edit" startContent={<Edit3 className="h-4 w-4" />}>Editar Venta</DropdownItem>
                            <DropdownItem
                                key="void"
                                className="text-[#C0392B]"
                                color="danger"
                                onClick={() => handleUpdateStatus('VOID')}
                                startContent={<XCircle className="h-4 w-4" />}
                            >
                                Anular Venta
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Progress & Items */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Pipeline Visual */}
                    <Card>
                        <CardContent className="p-8">
                            <div className="flex justify-between gap-2 overflow-x-auto pb-6 pt-2">
                                {[
                                    { label: 'Cotización', step: 1 },
                                    { label: 'Aprobación', step: 2 },
                                    { label: 'Preparación', step: 3 },
                                    { label: 'Empaque', step: 4 },
                                    { label: 'Finalizado', step: 5 },
                                ].map((step) => {
                                    const isActive = currentStep >= step.step;
                                    return (
                                        <div key={step.step} className="flex min-w-[100px] flex-1 flex-col items-center">
                                            <div className={clsx(
                                                "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500",
                                                isActive ? "bg-[#2980B9] text-white shadow-lg shadow-[#2980B9]/20" : "bg-[#F4F7F6] text-[#B8C5D0]"
                                            )}>
                                                {isActive ? <Check className="h-5 w-5 font-bold" /> : <Clock className="h-5 w-5" />}
                                            </div>
                                            <span className={clsx(
                                                "mt-3 text-[10px] font-bold uppercase tracking-widest",
                                                isActive ? "text-[#2980B9]" : "text-[#B8C5D0]"
                                            )}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F4F7F6]">
                                <div
                                    className="absolute left-0 top-0 h-full bg-[#2980B9] transition-all duration-700 ease-out"
                                    style={{ width: `${(Math.max(0, currentStep - 1) / 4) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between border-b border-[#E1E8ED] p-6">
                                <h3 className="flex items-center gap-3 text-sm font-semibold text-[#2C3E50]">
                                    <Package className="h-5 w-5 text-[#2980B9]" />
                                    Detalle de Artículos
                                </h3>
                                <Badge variant="info">
                                    {sale.items.length} Referencias
                                </Badge>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F4F7F6]">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-[11px] font-semibold uppercase tracking-widest text-[#5A6C7D]">Producto</th>
                                            <th className="px-8 py-4 text-center text-[11px] font-semibold uppercase tracking-widest text-[#5A6C7D]">Cantidad</th>
                                            <th className="px-8 py-4 text-right text-[11px] font-semibold uppercase tracking-widest text-[#5A6C7D]">Unitario</th>
                                            <th className="px-8 py-4 text-right text-[11px] font-semibold uppercase tracking-widest text-[#5A6C7D]">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E1E8ED]">
                                        {sale.items.map((item) => (
                                            <tr key={item.id} className="transition-colors hover:bg-[#F4F7F6]/50">
                                                <td className="px-8 py-5">
                                                    <p className="text-sm font-semibold text-[#2C3E50]">
                                                        {item.product?.description || item.description}
                                                    </p>
                                                    <p className="mt-1 text-xs text-[#5A6C7D]">
                                                        {item.product?.brand?.name || 'Evolution ZL'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="inline-block rounded-md bg-[#2980B9]/10 px-3 py-1 text-xs font-bold text-[#2980B9]">
                                                        {item.quantity} Uni.
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono text-sm font-medium text-[#5A6C7D]">
                                                    ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-8 py-5 text-right font-mono text-sm font-bold text-[#2C3E50]">
                                                    ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Internal Notes */}
                    {sale.notes && (
                        <Card className="border-l-4 border-l-[#D4AF37] bg-[#D4AF37]/5">
                            <CardContent className="p-6">
                                <div className="mb-2 flex items-center gap-2 text-[#D4AF37]">
                                    <Info className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Notas Internas</span>
                                </div>
                                <p className="text-sm font-medium leading-relaxed text-[#5A6C7D]">{sale.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Client Summary */}
                <div className="space-y-6">
                    {/* Client Profile */}
                    <Card>
                        <CardContent className="p-8">
                            <div className="mb-6 flex flex-col items-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1A2B3C] text-2xl font-bold text-white shadow-xl shadow-[#1A2B3C]/10">
                                    {(sale.customer?.name || sale.customerName || 'C').charAt(0).toUpperCase()}
                                </div>
                                <h4 className="mt-4 text-lg font-bold text-[#2C3E50] text-center">
                                    {sale.customer?.name || sale.customerName || 'Cliente No Identificado'}
                                </h4>
                                <Badge variant="info" className="mt-2 text-[10px]">
                                    RUC: {sale.customer?.taxId || 'Sin RUC'}
                                </Badge>
                            </div>

                            <Divider className="my-6" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#5A6C7D]">
                                        <Building2 className="h-4 w-4" />
                                        <span className="text-xs font-medium">Sucursal</span>
                                    </div>
                                    <span className="text-xs font-bold text-[#2C3E50]">{sale.branch?.name || 'Central'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#5A6C7D]">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-medium">F. Emisión</span>
                                    </div>
                                    <span className="text-xs font-bold text-[#2C3E50]">{new Date(sale.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#5A6C7D]">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="text-xs font-medium">Método</span>
                                    </div>
                                    <Badge variant="info" className="text-[10px]">
                                        {sale.paymentMethod || 'CONTADO'}
                                    </Badge>
                                </div>
                            </div>

                            {sale.customer && (
                                <div className="mt-8 rounded-xl bg-[#F4F7F6] p-5 ring-1 ring-[#E1E8ED]">
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#5A6C7D]">Estado de Crédito</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-[#5A6C7D]">Consumido</span>
                                            <span className="text-[#2C3E50]">${sale.customer.currentBalance.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white ring-1 ring-[#E1E8ED]">
                                            <div
                                                className={clsx(
                                                    "h-full transition-all duration-1000",
                                                    (sale.customer.currentBalance / sale.customer.creditLimit) > 0.9 ? 'bg-[#C0392B]' : 'bg-[#2980B9]'
                                                )}
                                                style={{ width: `${Math.min(100, (sale.customer.currentBalance / sale.customer.creditLimit) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold text-[#5A6C7D] uppercase">
                                            <span>Disponible</span>
                                            <span>Límite: ${sale.customer.creditLimit.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card className="border-none bg-[#1A2B3C] shadow-2xl">
                        <CardContent className="p-8 text-white">
                            <h3 className="mb-8 text-xs font-bold uppercase tracking-widest text-[#5A6C7D]">Liquidación Comercial</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#5A6C7D]">Subtotal Gravable</span>
                                    <span className="font-mono font-medium">${(sale.subtotal || (sale.total - (sale.tax || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[#5A6C7D]">ITBMS (7.0%)</span>
                                    <span className="font-mono font-medium text-[#D4AF37]">+ ${(sale.tax || (sale.total * 0.07)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <Divider className="my-6 bg-white/10" />
                                <div className="flex items-baseline justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6C7D]">Total Neto</p>
                                        <p className="mt-1 text-3xl font-bold font-mono text-[#2D8A4E]">
                                            ${sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-white/40 uppercase">{sale.currency || 'USD'}</span>
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl bg-white/5 p-4 border border-white/5 text-center">
                                <p className="text-[10px] font-medium leading-relaxed text-[#5A6C7D] uppercase">
                                    Validez del documento: 7 días<br />Sujeto a regulaciones de Zona Libre de Colón
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
