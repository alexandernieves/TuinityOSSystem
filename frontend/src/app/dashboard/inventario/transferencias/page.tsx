'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRightLeft,
    ArrowLeft,
    Package,
    CheckCircle2,
    AlertTriangle,
    Building2,
    TrendingDown,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import {
    Autocomplete,
    AutocompleteItem,
    Divider,
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

type Product = {
    id: string;
    description: string;
    brand?: { name: string };
};

type Branch = {
    id: string;
    name: string;
};

export default function InventoryTransferPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        productId: '',
        fromBranchId: '',
        toBranchId: '',
        quantity: '',
        reason: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const [prodData, branchData] = await Promise.all([
                api<Product[]>('/products', { method: 'GET', accessToken: session.accessToken }),
                api<Branch[]>('/branches', { method: 'GET', accessToken: session.accessToken }),
            ]);
            setProducts(prodData);
            setBranches(branchData);
        } catch (err) {
            toast.error('Error al cargar datos básicos');
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!formData.productId || !formData.fromBranchId || !formData.toBranchId || !formData.quantity) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        if (formData.fromBranchId === formData.toBranchId) {
            toast.error('La sucursal de origen y destino deben ser diferentes');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) return;

        setSubmitting(true);
        const toastId = toast.loading('Procesando transferencia inter-sucursal...');

        try {
            await api('/inventory/transfers', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    productId: formData.productId,
                    fromBranchId: formData.fromBranchId,
                    toBranchId: formData.toBranchId,
                    quantity: Number(formData.quantity),
                    reason: formData.reason,
                }
            });

            toast.success('Transferencia completada correctamente', { id: toastId });
            router.push('/dashboard/inventario');
        } catch (err: any) {
            toast.error(err.message || 'Error en la transferencia', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/inventario')}
                        className="mb-4 flex items-center gap-2 text-sm text-[#5A6C7D] transition-colors hover:text-[#2C3E50]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Inventario
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                            <ArrowRightLeft className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Trasferencia Inter-Sucursal</h1>
                            <p className="text-sm text-[#5A6C7D]">Movimiento de mercancía entre bodegas oficiales</p>
                        </div>
                    </div>
                </div>

                <Badge variant="info" className="px-4 py-2">
                    Operación Logística
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Transfer Form */}
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardContent className="p-8">
                            <div className="mb-8 space-y-3">
                                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">
                                    <Package className="h-4 w-4" /> Producto a Transferir
                                </label>
                                <Autocomplete
                                    placeholder="Busca el producto por sello..."
                                    variant="bordered"
                                    className="w-full"
                                    onSelectionChange={(key) => setFormData({ ...formData, productId: key as string })}
                                >
                                    {products.map((p) => (
                                        <AutocompleteItem key={p.id} textValue={p.description}>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{p.description}</span>
                                                <span className="text-xs text-[#5A6C7D]">{p.brand?.name || 'Evolution ZL'}</span>
                                            </div>
                                        </AutocompleteItem>
                                    ))}
                                </Autocomplete>
                            </div>

                            <div className="relative mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:items-center">
                                {/* Source */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C0392B]">
                                        <TrendingDown className="h-4 w-4" /> Sucursal Origen
                                    </label>
                                    <Autocomplete
                                        placeholder="Desde..."
                                        variant="bordered"
                                        className="w-full"
                                        onSelectionChange={(key) => setFormData({ ...formData, fromBranchId: key as string })}
                                    >
                                        {branches.map((b) => (
                                            <AutocompleteItem key={b.id} textValue={b.name}>
                                                <span className="text-sm font-medium">{b.name}</span>
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>

                                {/* Flow Icon */}
                                <div className="hidden items-center justify-center md:absolute md:left-1/2 md:top-[60%] md:flex md:-translate-x-1/2">
                                    <div className="rounded-full bg-[#F4F7F6] p-2 text-[#2980B9] shadow-sm ring-1 ring-[#E1E8ED]">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Destination */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2D8A4E]">
                                        <Building2 className="h-4 w-4" /> Sucursal Destino
                                    </label>
                                    <Autocomplete
                                        placeholder="Hacia..."
                                        variant="bordered"
                                        className="w-full"
                                        onSelectionChange={(key) => setFormData({ ...formData, toBranchId: key as string })}
                                    >
                                        {branches.map((b) => (
                                            <AutocompleteItem key={b.id} textValue={b.name}>
                                                <span className="text-sm font-medium">{b.name}</span>
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>
                            </div>

                            <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">Unidades (Cajas)</label>
                                    <Input
                                        type="number"
                                        placeholder="Cant. exacta"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">Referencia de Envío</label>
                                    <Input
                                        placeholder="Ej. Reabastecimiento Central"
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Divider className="my-8" />

                            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-[#E6F0F5] p-6 sm:flex-row">
                                <div className="flex items-start gap-4 text-[#2980B9]">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p className="text-[11px] font-medium leading-relaxed sm:max-w-sm">
                                        Esta operación es inmediata y afectará el stock en ambas ubicaciones. Verifique la disponibilidad real antes de proceder.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full shrink-0 sm:w-auto sm:px-10"
                                    isLoading={submitting}
                                    onClick={handleTransfer}
                                    leftIcon={<CheckCircle2 className="h-5 w-5" />}
                                >
                                    Ejecutar Traslado
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Guidelines Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-8">
                            <h4 className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#2C3E50]">Reglas de Traslado</h4>
                            <ul className="space-y-4">
                                {[
                                    'El stock de origen debe ser suficiente.',
                                    'Ambas sucursales deben estar activas.',
                                    'La operación genera 2 registros de Kardex.',
                                    'No descuenta ITBMS ni genera factura.'
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4F7F6]">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#2980B9]"></div>
                                        </div>
                                        <span className="text-xs font-medium leading-relaxed text-[#5A6C7D]">{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-[#1A2B3C] shadow-xl">
                        <CardContent className="p-8 text-center text-white">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                                <ArrowRightLeft className="h-8 w-8 text-[#2980B9]" />
                            </div>
                            <h4 className="text-lg font-semibold uppercase tracking-tight">Consolidación Logística</h4>
                            <p className="mt-3 text-[10px] leading-relaxed text-[#5A6C7D] uppercase font-semibold">
                                Sistema de rastreo integrado por UUID. Todos los movimientos quedan auditados bajo su perfil de seguridad.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
