'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    Plus,
    Trash2,
    Save,
    ShoppingCart,
    User,
    Tag,
    Info,
    Building2,
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
    stock: number;
    price_a: number;
    price_b: number;
    price_c: number;
    price_d: number;
    price_e: number;
    unitsPerBox: number;
};

type Customer = {
    id: string;
    name: string;
    taxId?: string;
    email?: string;
};

type Branch = {
    id: string;
    name: string;
};

type Item = {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    priceLevel: 'A' | 'B' | 'C' | 'D' | 'E' | 'CUSTOM';
    lastPrice?: number;
    lastPriceDate?: string;
};

export default function NuevaCotizacionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<Item[]>([]);
    const [priceLevel, setPriceLevel] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const [branchesData, customersData] = await Promise.all([
                api<Branch[]>('/branches', { accessToken: session.accessToken }),
                api<{ items: Customer[] }>('/customers', { accessToken: session.accessToken })
            ]);
            setBranches(branchesData);
            setCustomers(customersData.items || []);
            if (branchesData.length > 0) setSelectedBranchId(branchesData[0].id);
        } catch (err) {
            toast.error('Error al cargar datos iniciales');
        }
    };

    const fetchProducts = async (q: string) => {
        if (q.length < 3) return;
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const data = await api<{ items: Product[] }>(`/products?q=${encodeURIComponent(q)}`, {
                method: 'GET',
                accessToken: session.accessToken,
            });
            setProducts(data.items || []);
        } catch (err) {
            console.error(err);
        }
    };

    const addItem = async (product: Product) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            toast.error('El producto ya está en la lista');
            return;
        }

        const initialPrice = product[`price_${priceLevel.toLowerCase()}` as keyof Product] as number;
        let lastPriceInfo: any = {};

        if (selectedCustomerId) {
            const session = loadSession();
            if (session?.accessToken) {
                try {
                    const res = await api<any>(`/sales/last-price?customerId=${selectedCustomerId}&productId=${product.id}`, {
                        accessToken: session.accessToken,
                    });
                    if (res.found) lastPriceInfo = res;
                } catch (e) {
                    console.error("Failed to fetch last price", e);
                }
            }
        }

        setItems([...items, {
            productId: product.id,
            description: product.description,
            quantity: 1,
            unitPrice: initialPrice,
            priceLevel: priceLevel,
            lastPrice: lastPriceInfo.unitPrice ? Number(lastPriceInfo.unitPrice) : undefined,
            lastPriceDate: lastPriceInfo.saleDate
        }]);
        setProducts([]);
        setSearch('');
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.productId !== id));
    };

    const updateItem = (id: string, updates: Partial<Item>) => {
        setItems(items.map(i => i.productId === id ? { ...i, ...updates } : i));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.07;
    const total = subtotal + tax;

    const handleSubmit = async () => {
        if (!selectedCustomerId || items.length === 0 || !selectedBranchId) {
            toast.error('Selecciona cliente, sucursal e incluye al menos un producto');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        const toastId = toast.loading('Guardando cotización...');

        try {
            await api('/sales', {
                method: 'POST',
                accessToken: session.accessToken,
                body: {
                    branchId: selectedBranchId,
                    customerId: selectedCustomerId,
                    items: items.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice
                    })),
                    status: 'QUOTE'
                },
            });

            toast.success('Cotización guardada correctamente', { id: toastId });
            router.push('/dashboard/ventas');
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar cotización', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/ventas')}
                        className="mb-4 flex items-center gap-2 text-sm text-[#5A6C7D] transition-colors hover:text-[#2C3E50]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Ventas
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                            <ShoppingCart className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Nueva Cotización</h1>
                            <p className="text-sm text-[#5A6C7D]">Genera una nueva propuesta comercial para tu cliente</p>
                        </div>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={handleSubmit}
                    isLoading={loading}
                >
                    Confirmar Cotización
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Client & Items */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Context Selection */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2C3E50]">
                                <User className="h-4 w-4 text-[#2980B9]" />
                                Contexto de la Venta
                            </h2>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#5A6C7D]">Cliente</label>
                                    <Autocomplete
                                        placeholder="Buscar por nombre o RUC"
                                        variant="bordered"
                                        className="w-full"
                                        onSelectionChange={(key) => setSelectedCustomerId(key as string)}
                                    >
                                        {customers.map((c) => (
                                            <AutocompleteItem key={c.id} textValue={c.name}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{c.name}</span>
                                                    <span className="text-xs text-[#5A6C7D]">{c.taxId || 'Sin RUC'}</span>
                                                </div>
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-[#5A6C7D]">Sucursal de Despacho</label>
                                    <Autocomplete
                                        placeholder="Seleccionar sucursal"
                                        variant="bordered"
                                        className="w-full"
                                        defaultSelectedKey={selectedBranchId}
                                        onSelectionChange={(key) => setSelectedBranchId(key as string)}
                                    >
                                        {branches.map((b) => (
                                            <AutocompleteItem key={b.id} textValue={b.name}>
                                                {b.name}
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>
                            </div>

                            <Divider className="my-6" />

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-[#5A6C7D]">Nivel de Precio General</label>
                                <div className="flex flex-wrap gap-2">
                                    {['A', 'B', 'C', 'D', 'E'].map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setPriceLevel(l as any)}
                                            className={clsx(
                                                "min-w-[80px] rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                                                priceLevel === l
                                                    ? "border-[#2980B9] bg-[#2980B9] text-white shadow-sm"
                                                    : "border-[#E1E8ED] bg-white text-[#5A6C7D] hover:border-[#2980B9]/30 hover:bg-[#F4F7F6]"
                                            )}
                                        >
                                            Tarifa {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Selector and Table */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-[#2C3E50]">
                                <Plus className="h-4 w-4 text-[#2980B9]" />
                                Artículos de la Cotización
                            </h2>

                            <div className="relative mb-6">
                                <Input
                                    placeholder="Buscar productos por descripción o marca..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        fetchProducts(e.target.value);
                                    }}
                                    leftIcon={<Search className="h-5 w-5" />}
                                    className="w-full"
                                />

                                {products.length > 0 && (
                                    <div className="absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#E1E8ED] bg-white shadow-xl">
                                        {products.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => addItem(p)}
                                                className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-[#F4F7F6]"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-[#2C3E50]">{p.description}</p>
                                                    <p className="text-xs text-[#5A6C7D]">Stock: {p.stock} unidades</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-[#2980B9]">
                                                        ${p[`price_${priceLevel.toLowerCase()}` as keyof Product] as number}
                                                    </p>
                                                    <Badge variant="info" className="mt-1">Tarifa {priceLevel}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F4F7F6]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[#5A6C7D]">Producto</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-[#5A6C7D]">Cantidad</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-[#5A6C7D]">Unitario</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-[#5A6C7D]">Subtotal</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E1E8ED]">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center">
                                                    <Tag className="mx-auto mb-2 h-8 w-8 text-[#B8C5D0]" />
                                                    <p className="text-sm text-[#5A6C7D]">No hay artículos seleccionados</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item) => (
                                                <tr key={item.productId} className="transition-colors hover:bg-[#F4F7F6]/50">
                                                    <td className="px-4 py-4">
                                                        <p className="text-sm font-medium text-[#2C3E50]">{item.description}</p>
                                                        <Badge variant="info" className="mt-1">Tarifa {item.priceLevel}</Badge>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex justify-center">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-20 rounded-lg border border-[#E1E8ED] bg-white px-2 py-1 text-center text-sm font-medium focus:border-[#2980B9] focus:outline-none"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.productId, { quantity: parseFloat(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#5A6C7D]">$</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-24 rounded-lg border border-[#E1E8ED] bg-white py-1 pl-5 pr-2 text-right text-sm font-medium focus:border-[#2980B9] focus:outline-none"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateItem(item.productId, { unitPrice: parseFloat(e.target.value) || 0, priceLevel: 'CUSTOM' })}
                                                                />
                                                            </div>
                                                            {item.lastPrice !== undefined && (
                                                                <span className="text-[10px] font-medium text-[#27AE60]">
                                                                    Último: ${item.lastPrice.toFixed(2)} ({item.lastPriceDate ? new Date(item.lastPriceDate).toLocaleDateString() : ''})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <p className="text-sm font-semibold text-[#2C3E50]">
                                                            ${(item.quantity * item.unitPrice).toLocaleString()}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => removeItem(item.productId)}
                                                            className="rounded-lg p-2 text-[#B8C5D0] transition-colors hover:bg-[#C0392B]/10 hover:text-[#C0392B]"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-6 border-none bg-[#1A2B3C] shadow-2xl">
                        <CardContent className="p-8 text-white">
                            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#5A6C7D]">Resumen de Cotización</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#5A6C7D]">Subtotal Bruto</span>
                                    <span className="font-medium font-mono">${subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#5A6C7D]">ITBMS (7%)</span>
                                    <span className="font-medium font-mono text-[#D4AF37]">+ ${tax.toLocaleString()}</span>
                                </div>
                                <Divider className="my-4 bg-white/10" />
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-[#5A6C7D]">Total Neto</p>
                                        <p className="text-3xl font-bold font-mono text-[#2D8A4E]">${total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 rounded-xl bg-white/5 p-4 border border-white/5">
                                <div className="flex items-start gap-3">
                                    <Info className="h-4 w-4 text-[#2980B9] shrink-0 mt-0.5" />
                                    <p className="text-[10px] leading-relaxed text-[#5A6C7D]">
                                        Las cotizaciones tienen una validez de 7 días naturales. El inventario no se reserva hasta que el pedido sea aprobado formalmente.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
