'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    ArrowLeft,
    ShoppingCart,
    Box,
    Truck,
    MapPin,
    CheckCircle2,
    Info
} from 'lucide-react';
import { loadSession } from '@/lib/auth-storage';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@heroui/react';
import clsx from 'clsx';

type Sale = {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
};

export default function NewShipmentPage() {
    const router = useRouter();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSales, setSelectedSales] = useState<string[]>([]);
    const [destination, setDestination] = useState('');
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchEligibleSales();
    }, []);

    const fetchEligibleSales = async () => {
        const session = loadSession();
        if (!session) return;
        setLoading(true);
        try {
            const data = await api<{ items: Sale[] }>('/sales', { accessToken: session.accessToken });
            setSales(data.items.filter(s => ['COMPLETED', 'APPROVED_ORDER', 'PACKING'].includes(s.status)));
        } catch (error) {
            toast.error('Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (selectedSales.length === 0) {
            toast.error('Seleccione al menos un pedido');
            return;
        }
        if (!destination.trim()) {
            toast.error('Indique el destino del despacho');
            return;
        }

        const session = loadSession();
        if (!session) return;
        setCreating(true);
        try {
            const result = await api<{ id: string }>('/traffic/shipments', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    saleIds: selectedSales,
                    destination: destination.trim()
                }
            });
            toast.success('Despacho creado correctamente');
            router.push(`/dashboard/trafico/documentos/${result.id}`);
        } catch (error) {
            toast.error('Error al crear despacho');
        } finally {
            setCreating(false);
        }
    };

    const toggleSale = (id: string) => {
        setSelectedSales(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/trafico')}
                        className="mb-4 flex items-center gap-2 text-sm text-[#5A6C7D] transition-colors hover:text-[#2C3E50]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Tráfico
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                            <Truck className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Nuevo Despacho</h1>
                            <p className="text-sm text-[#5A6C7D]">Consolida pedidos para su exportación</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs font-medium text-[#5A6C7D]">Pedidos Seleccionados</p>
                        <p className="text-xl font-bold text-[#2980B9]">{selectedSales.length}</p>
                    </div>
                    <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Box className="h-4 w-4" />}
                        onClick={handleCreate}
                        isLoading={creating}
                    >
                        Confirmar Consolidación
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Sales Selection */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Input
                                placeholder="Buscar pedido o cliente..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                leftIcon={<Search className="h-4 w-4" />}
                                className="w-full"
                            />
                        </div>
                        <Badge variant="info">
                            {sales.length} pedidos disponibles
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#E1E8ED] bg-white text-[#5A6C7D]">
                                <div className="text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#2980B9]"></div>
                                    <p className="mt-4 text-sm font-medium">Buscando pedidos disponibles...</p>
                                </div>
                            </div>
                        ) : sales.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex h-64 flex-col items-center justify-center text-center">
                                    <Box className="mb-4 h-12 w-12 text-[#B8C5D0]" />
                                    <p className="text-sm font-medium text-[#5A6C7D]">No hay pedidos listos para despachar</p>
                                </CardContent>
                            </Card>
                        ) : (
                            sales
                                .filter(s => s.orderNumber.toLowerCase().includes(search.toLowerCase()) || s.customerName.toLowerCase().includes(search.toLowerCase()))
                                .map((sale) => (
                                    <div
                                        key={sale.id}
                                        onClick={() => toggleSale(sale.id)}
                                        className={clsx(
                                            "group cursor-pointer rounded-xl border p-5 transition-all",
                                            selectedSales.includes(sale.id)
                                                ? "border-[#2980B9] bg-[#2980B9]/5 shadow-sm"
                                                : "border-[#E1E8ED] bg-white hover:border-[#2980B9]/30 hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
                                                selectedSales.includes(sale.id)
                                                    ? "bg-[#2980B9] text-white"
                                                    : "bg-[#F4F7F6] text-[#B8C5D0] group-hover:bg-[#2980B9]/10 group-hover:text-[#2980B9]"
                                            )}>
                                                <ShoppingCart className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold text-[#2C3E50]">{sale.orderNumber}</p>
                                                    <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'info'}>
                                                        {sale.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-sm text-[#5A6C7D]">{sale.customerName}</p>
                                                <div className="mt-3 flex items-center gap-6">
                                                    <div className="text-xs text-[#5A6C7D]">
                                                        <span className="font-medium">Monto:</span> ${sale.total.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-[#5A6C7D]">
                                                        <span className="font-medium">Fecha:</span> {new Date(sale.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={clsx(
                                                "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                                                selectedSales.includes(sale.id)
                                                    ? "border-[#2980B9] bg-[#2980B9]"
                                                    : "border-[#E1E8ED] group-hover:border-[#2980B9]/30"
                                            )}>
                                                {selectedSales.includes(sale.id) && <CheckCircle2 className="h-4 w-4 text-white" />}
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Right: Destination Configuration */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardContent className="p-8">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2980B9] text-white">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#2C3E50]">Destino Final</h3>
                                    <p className="text-xs text-[#5A6C7D]">Requerido para DMs de Zona Libre</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-medium text-[#2C3E50]">Ubicación de Entrega</label>
                                <Input
                                    placeholder="Ej: Puerto Rico / San José, Costa Rica"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <Divider className="my-8" />

                            <div className="space-y-6">
                                <h4 className="text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">Resumen de Despacho</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#5A6C7D]">Pedidos Seleccionados</span>
                                        <span className="text-lg font-bold text-[#2C3E50]">{selectedSales.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#5A6C7D]">Peso Estimado</span>
                                        <span className="text-sm font-medium text-[#2C3E50]">Calculando...</span>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-[#D4AF37]/10 p-4 border border-[#D4AF37]/20">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-medium leading-relaxed text-[#5A6C7D]">
                                            Al confirmar, el sistema reservará estos pedidos exclusivamente para este despacho y cambiará su estado a <span className="text-[#2C3E50] font-semibold">PACKING</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
