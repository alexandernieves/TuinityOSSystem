'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    PlusCircle,
    MinusCircle,
    RefreshCw,
    ArrowLeft,
    Package,
    CheckCircle2,
    AlertTriangle,
    Building2,
    FileText
} from 'lucide-react';
import {
    Autocomplete,
    AutocompleteItem,
    Divider
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

export default function InventoryAdjustmentPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        productId: '',
        branchId: '',
        quantity: '',
        type: 'IN', // IN, OUT, ADJUSTMENT
        reason: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const [prodResponse, branchData] = await Promise.all([
                api<{ items: Product[] }>('/products?limit=100', { method: 'GET', accessToken: session.accessToken }),
                api<Branch[]>('/branches', { method: 'GET', accessToken: session.accessToken }),
            ]);
            setProducts(prodResponse?.items || []);
            setBranches(branchData || []);
        } catch (err) {
            toast.error('Error al cargar datos básicos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.productId || !formData.branchId || !formData.quantity) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) return;

        setSubmitting(true);
        const toastId = toast.loading('Procesando ajuste de inventario...');

        try {
            await api('/inventory/movements', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    productId: formData.productId,
                    branchId: formData.branchId,
                    type: formData.type,
                    quantity: Number(formData.quantity),
                    reason: formData.reason,
                }
            });

            toast.success('Inventario actualizado exitosamente', { id: toastId });
            router.push('/dashboard/inventario');
        } catch (err: any) {
            toast.error(err.message || 'Error al procesar el ajuste', { id: toastId });
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
                            <RefreshCw className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Ajuste de Inventario</h1>
                            <p className="text-sm text-[#5A6C7D]">Corrección técnica de stock físico vs sistema</p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block">
                    <Badge variant="warning" className="px-4 py-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Operación Crítica
                        </div>
                    </Badge>
                </div>
            </div>

            <Card className="mx-auto max-w-4xl">
                <CardContent className="p-8">
                    {/* Operation Type Selector */}
                    <div className="mb-10 flex flex-col gap-4">
                        <label className="text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">Tipo de Ajuste</label>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'IN' })}
                                className={clsx(
                                    "flex items-center justify-center gap-3 rounded-xl border p-4 transition-all",
                                    formData.type === 'IN'
                                        ? "border-[#2D8A4E] bg-[#2D8A4E]/5 text-[#2D8A4E] shadow-sm"
                                        : "border-[#E1E8ED] bg-white text-[#5A6C7D] hover:border-[#2D8A4E]/30"
                                )}
                            >
                                <PlusCircle className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase">Entrada</span>
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'OUT' })}
                                className={clsx(
                                    "flex items-center justify-center gap-3 rounded-xl border p-4 transition-all",
                                    formData.type === 'OUT'
                                        ? "border-[#C0392B] bg-[#C0392B]/5 text-[#C0392B] shadow-sm"
                                        : "border-[#E1E8ED] bg-white text-[#5A6C7D] hover:border-[#C0392B]/30"
                                )}
                            >
                                <MinusCircle className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase">Salida</span>
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'ADJUSTMENT' })}
                                className={clsx(
                                    "flex items-center justify-center gap-3 rounded-xl border p-4 transition-all",
                                    formData.type === 'ADJUSTMENT'
                                        ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] shadow-sm"
                                        : "border-[#E1E8ED] bg-white text-[#5A6C7D] hover:border-[#D4AF37]/30"
                                )}
                            >
                                <RefreshCw className="h-5 w-5" />
                                <span className="text-sm font-semibold uppercase">Reconteo</span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Product Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">
                                <Package className="h-4 w-4" /> Producto Seleccionado
                            </label>
                            <Autocomplete
                                placeholder="Escribe el nombre del producto..."
                                variant="bordered"
                                className="w-full"
                                isLoading={loading}
                                onSelectionChange={(key) => setFormData({ ...formData, productId: key as string })}
                                classNames={{
                                    popoverContent: "bg-white shadow-xl border border-[#E2E8F0]",
                                    listbox: "bg-white",
                                }}
                            >
                                {products.map((p) => (
                                    <AutocompleteItem
                                        key={p.id}
                                        textValue={p.description}
                                        className="hover:bg-[#F8FAFC]"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[#2C3E50]">{p.description}</span>
                                            <span className="text-xs text-[#5A6C7D]">{p.brand?.name || 'Evolution ZL'}</span>
                                        </div>
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                        </div>

                        {/* Branch Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">
                                <Building2 className="h-4 w-4" /> Sucursal / Bodega
                            </label>
                            <Autocomplete
                                placeholder="Selecciona sucursal..."
                                variant="bordered"
                                className="w-full"
                                isLoading={loading}
                                onSelectionChange={(key) => setFormData({ ...formData, branchId: key as string })}
                                classNames={{
                                    popoverContent: "bg-white shadow-xl border border-[#E2E8F0]",
                                    listbox: "bg-white",
                                }}
                            >
                                {branches.map((b) => (
                                    <AutocompleteItem
                                        key={b.id}
                                        textValue={b.name}
                                        className="hover:bg-[#F8FAFC]"
                                    >
                                        <span className="text-sm font-medium text-[#2C3E50]">{b.name}</span>
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">
                                Cantidad de Ajuste
                            </label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                leftIcon={<div className="rounded-md bg-[#1A2B3C] px-2 py-1 text-[10px] font-bold text-white uppercase">UN</div>}
                            />
                        </div>

                        {/* Reason */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">
                                <FileText className="h-4 w-4" /> Justificación
                            </label>
                            <Input
                                placeholder="Ej. Reconteo físico, Merma..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                    </div>

                    <Divider className="my-8" />

                    <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-[#F4F7F6] p-6 sm:flex-row">
                        <div className="flex items-start gap-4 text-[#5A6C7D]">
                            <AlertTriangle className="h-6 w-6 shrink-0 text-[#D4AF37]" />
                            <p className="text-[11px] font-medium leading-relaxed sm:max-w-md">
                                <span className="font-bold text-[#C0392B]">ADVERTENCIA:</span> Esta operación afectará los balances financieros y reportes de inventario de forma inmediata e irreversible. Asegúrese de que los datos sean correctos antes de confirmar.
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full shrink-0 sm:w-auto sm:px-12"
                            isLoading={submitting}
                            onClick={handleSubmit}
                            leftIcon={<CheckCircle2 className="h-5 w-5" />}
                        >
                            Confirmar Ajuste
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
