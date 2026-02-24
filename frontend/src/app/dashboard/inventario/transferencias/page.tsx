'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ArrowRightLeft, Package, Check, Trash2, Save, Printer, X,
    ArrowRight, MapPin, Building2, FileText, User, Calendar, Info,
    AlertCircle, Search, Plus, TrendingDown, TrendingUp, History,
    Hash, Boxes
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
    Autocomplete,
    AutocompleteItem,
    Divider,
    Tooltip,
    Input as HeroInput
} from '@heroui/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import clsx from 'clsx';

interface Product {
    id: string;
    description: string;
    internalReference: string;
    barcodes: { barcode: string }[];
    brand?: { name: string };
}

interface Branch {
    id: string;
    name: string;
}

interface TransferItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
}

export default function InventoryTransferPage() {
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        fromBranchId: '',
        toBranchId: '',
        reason: '',
        transferNumber: `TRF-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
    });

    const [items, setItems] = useState<TransferItem[]>([]);

    // Quick Add Item
    const [quickItem, setQuickItem] = useState({
        productId: '',
        quantity: '1'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [branchesData, productsData] = await Promise.all([
                api<Branch[]>('/branches'),
                api<{ items: Product[] }>('/products?limit=100')
            ]);
            setBranches(branchesData || []);
            setProducts(productsData?.items || []);
        } catch (e: any) {
            toast.error('Error al cargar datos básicos');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        if (!quickItem.productId || !quickItem.quantity) return;

        const product = products.find(p => p.id === quickItem.productId);
        if (!product) return;

        const existing = items.find(i => i.productId === quickItem.productId);
        if (existing) {
            setItems(items.map(i => i.productId === quickItem.productId ? { ...i, quantity: i.quantity + Number(quickItem.quantity) } : i));
        } else {
            setItems([...items, {
                id: Math.random().toString(36).substr(2, 9),
                productId: quickItem.productId,
                product: product,
                quantity: Number(quickItem.quantity)
            }]);
        }
        setQuickItem({ productId: '', quantity: '1' });
        toast.success('Producto añadido al envío');
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleTransfer = async () => {
        if (!formData.fromBranchId || !formData.toBranchId || items.length === 0) {
            toast.error('Complete sucursales y añada al menos un producto');
            return;
        }

        if (formData.fromBranchId === formData.toBranchId) {
            toast.error('La sucursal de origen debe ser distinta a la de destino');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Procesando transferencia masiva...');

        try {
            await api('/inventory/transfers/bulk', {
                method: 'POST',
                body: {
                    fromBranchId: formData.fromBranchId,
                    toBranchId: formData.toBranchId,
                    reason: formData.reason,
                    items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
                }
            });
            toast.success('Transferencia ejecutada con éxito', { id: toastId });
            router.push('/dashboard/inventario');
        } catch (e: any) {
            toast.error(e.message || 'Error en la transferencia', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalRefs = items.length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans tracking-tight">
            {/* Header Moderno con Glassmorphism */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/inventario')}
                            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border border-[#2563EB]/10">
                                    Logística Interna
                                </span>
                                <Badge variant="info" className="h-5 px-2 text-[9px] font-bold">INTER-SUCURSAL</Badge>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase">Transferencia de Mercancía</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
                            <Tooltip content="Nueva Transferencia">
                                <button onClick={() => { setItems([]); setFormData({ ...formData, reason: '' }) }} className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-[#64748B]">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <Tooltip content="Ver Historial">
                                <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-[#64748B]">
                                    <History className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <div className="w-px h-6 bg-[#CBD5E1] mx-1"></div>
                            <button
                                onClick={handleTransfer}
                                disabled={submitting || items.length === 0}
                                className="px-6 py-2 bg-[#2563EB] text-white rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-[#1D4ED8] disabled:opacity-50 transition-all shadow-lg shadow-[#2563EB]/20"
                            >
                                <Save className="w-4 h-4" /> Ejecutar Traslado
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 flex flex-col xl:flex-row gap-6">
                {/* Main Section */}
                <div className="flex-1 space-y-6">

                    {/* Source and Destination Pickers */}
                    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                {/* Source */}
                                <div className="p-8 space-y-4 border-r border-[#F1F5F9] bg-[#FEF2F2]/30">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-[#EF4444] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <TrendingDown className="w-3 h-3" /> Bodega de Salida (Origen)
                                        </label>
                                        <Badge variant="error" className="text-[8px] px-1.5">- STOCK</Badge>
                                    </div>
                                    <Autocomplete
                                        placeholder="Seleccione origen..."
                                        variant="bordered"
                                        onSelectionChange={(key) => setFormData({ ...formData, fromBranchId: key as string })}
                                        classNames={{
                                            popoverContent: "bg-white shadow-2xl border border-[#E2E8F0]",
                                            listbox: "bg-white",
                                        }}
                                    >
                                        {branches.map((b) => (
                                            <AutocompleteItem key={b.id} textValue={b.name}>{b.name}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>

                                {/* Destination */}
                                <div className="p-8 space-y-4 bg-[#F0FDF4]/30">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-[#22C55E] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3" /> Bodega de Entrada (Destino)
                                        </label>
                                        <Badge variant="success" className="text-[8px] px-1.5">+ STOCK</Badge>
                                    </div>
                                    <Autocomplete
                                        placeholder="Seleccione destino..."
                                        variant="bordered"
                                        onSelectionChange={(key) => setFormData({ ...formData, toBranchId: key as string })}
                                        classNames={{
                                            popoverContent: "bg-white shadow-2xl border border-[#E2E8F0]",
                                            listbox: "bg-white",
                                        }}
                                    >
                                        {branches.map((b) => (
                                            <AutocompleteItem key={b.id} textValue={b.name}>{b.name}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                                <Hash className="w-5 h-5 text-[#64748B]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#94A3B8] uppercase">Nº Transferencia</p>
                                <p className="text-sm font-black text-[#0F172A]">{formData.transferNumber}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#F1F5F9] rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-[#64748B]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#94A3B8] uppercase">Fecha Emisión</p>
                                <p className="text-sm font-black text-[#0F172A]">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex items-center gap-4 md:col-span-1">
                            <div className="w-full flex flex-col gap-1">
                                <p className="text-[10px] font-black text-[#94A3B8] uppercase">Motivo / Observación</p>
                                <input
                                    className="text-xs font-bold text-[#0F172A] outline-none w-full bg-transparent border-b border-dashed border-[#CBD5E1] focus:border-[#2563EB]"
                                    placeholder="Ej: Reabastecimiento sala de ventas..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden min-h-[400px]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[#0F172A] text-white">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] w-[20%]">Referencia</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] w-[40%]">Descripción del Producto</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] w-[15%]">Cant. a Enviar</th>
                                    <th className="px-6 py-4 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {/* Quick Entry Row */}
                                <tr className="bg-[#F8FAFC]">
                                    <td className="px-6 py-4">
                                        <input
                                            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs font-black focus:border-[#2563EB] outline-none"
                                            placeholder="SCANNER / REF"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <Autocomplete
                                            placeholder="Buscar producto..."
                                            variant="flat"
                                            size="sm"
                                            onSelectionChange={(key) => setQuickItem({ ...quickItem, productId: key as string })}
                                            classNames={{
                                                popoverContent: "bg-white shadow-2xl border border-[#E2E8F0]",
                                                listbox: "bg-white",
                                            }}
                                        >
                                            {products.map((p) => (
                                                <AutocompleteItem key={p.id} textValue={p.description}>
                                                    <div className="flex flex-col uppercase">
                                                        <span className="text-xs font-black">{p.internalReference}</span>
                                                        <span className="text-[10px] text-[#64748B]">{p.description}</span>
                                                    </div>
                                                </AutocompleteItem>
                                            ))}
                                        </Autocomplete>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            value={quickItem.quantity}
                                            onChange={(e) => setQuickItem({ ...quickItem, quantity: e.target.value })}
                                            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs font-black text-right outline-none focus:border-[#2563EB]"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={handleAddItem}
                                            className="p-2 bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8]"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>

                                {/* Items List */}
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#F8FAFC] group">
                                        <td className="px-6 py-4 font-black text-xs text-[#2563EB]">{item.product.internalReference}</td>
                                        <td className="px-6 py-4 font-bold text-xs uppercase text-[#0F172A]">{item.product.description}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="bg-[#F1F5F9] px-4 py-1.5 rounded-lg text-xs font-black text-[#0F172A] border border-[#E2E8F0]">
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => removeItem(item.id)} className="p-2 text-[#94A3B8] hover:text-[#EF4444] transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <ArrowRightLeft className="w-12 h-12 text-[#64748B]" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Agregue productos para procesar la transferencia</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="w-full xl:w-[400px] space-y-6">
                    {/* Visual Flow Indicator */}
                    <Card className="bg-[#0F172A] border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EF4444] via-[#2563EB] to-[#22C55E]"></div>
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex items-center gap-8 w-full justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-[#FEF2F2]/10 rounded-2xl flex items-center justify-center border border-[#EF4444]/20">
                                            <TrendingDown className="w-6 h-6 text-[#EF4444]" />
                                        </div>
                                        <span className="text-[8px] font-black text-[#EF4444] uppercase tracking-widest text-center">SALIDA</span>
                                    </div>
                                    <div className="flex-1 border-t border-dashed border-[#2563EB]/40 relative">
                                        <ArrowRight className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 text-[#2563EB]" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-[#F0FDF4]/10 rounded-2xl flex items-center justify-center border border-[#22C55E]/20">
                                            <TrendingUp className="w-6 h-6 text-[#22C55E]" />
                                        </div>
                                        <span className="text-[8px] font-black text-[#22C55E] uppercase tracking-widest text-center">ENTRADA</span>
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Proceso de Reubicación</h4>
                                    <p className="text-[10px] font-medium text-[#64748B] leading-relaxed uppercase">
                                        Se generará automáticamente un comprobante de traslado y los movimientos de Kardex correspondientes para auditoría.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white border border-[#E2E8F0] p-6 rounded-3xl shadow-sm">
                            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-4">Resumen del Envío</p>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#F1F5F9] rounded-lg"><Boxes className="w-4 h-4 text-[#2563EB]" /></div>
                                        <span className="text-xs font-bold text-[#0F172A] uppercase">Total Unidades</span>
                                    </div>
                                    <span className="text-lg font-black text-[#0F172A]">{totalQuantity}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#F1F5F9] rounded-lg"><Package className="w-4 h-4 text-[#2563EB]" /></div>
                                        <span className="text-xs font-bold text-[#0F172A] uppercase">Total Referencias</span>
                                    </div>
                                    <span className="text-lg font-black text-[#0F172A]">{totalRefs}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#FEF3C7] border border-[#F59E0B]/20 p-6 rounded-3xl flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-[#D97706] shrink-0" />
                            <div>
                                <h5 className="text-[10px] font-black text-[#92400E] uppercase mb-1">Stock de Emergencia</h5>
                                <p className="text-[11px] font-bold text-[#B45309] leading-relaxed uppercase">
                                    Verifique que la bodega de origen cuente con stock suficiente para no interrumpir operaciones de venta en curso.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
