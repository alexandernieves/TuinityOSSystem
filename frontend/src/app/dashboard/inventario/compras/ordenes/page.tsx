'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Save, Trash2, Search,
    Package, Calendar, Building, Info, Receipt,
    Calculator, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { api } from '@/lib/api';
import { SharedProductImage } from '@/components/shared/SharedProductImage';

// --- TYPES ---
interface Branch {
    id: string;
    name: string;
}

interface Product {
    id: string;
    description: string;
    internalReference: string | null;
    mainImageUrl?: string | null;
}

interface PurchaseItem {
    id: string; // temp purely for UI
    productId: string;
    product?: Product;
    quantity: number;
    unitFobValue: number;
}

// --- PRODUCT PICKER COMPONENT ---
function ProductPicker({ products, onSelect, onClose }: { products: Product[], onSelect: (p: Product) => void, onClose: () => void }) {
    const [search, setSearch] = useState('');

    const filtered = products.filter(p =>
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.internalReference || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-[#E2E8F0] shadow-sm flex items-center gap-3">
                    <Search className="w-5 h-5 text-[#94A3B8]" />
                    <input
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar producto por nombre o referencia..."
                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-[#F8FAFC]">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-[#94A3B8]">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">Sin resultados</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filtered.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="flex items-center gap-4 p-3 bg-white hover:bg-[#EEF2FF] rounded-xl border border-transparent hover:border-[#818CF8] transition-all text-left group"
                                >
                                    <SharedProductImage src={p.mainImageUrl} size={12} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-[#0F172A] uppercase truncate group-hover:text-[#4F46E5]">{p.description}</p>
                                        <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">REF: {p.internalReference || 'S/REF'}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-[#C7D2FE] group-hover:text-[#4F46E5]" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function OrdenesCompraPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [branchId, setBranchId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [proformaNumber, setProformaNumber] = useState('');
    const [orderDate, setOrderDate] = useState<any>(today(getLocalTimeZone()));
    const [expectedDate, setExpectedDate] = useState<any>(null);
    const [notes, setNotes] = useState('');

    // Costs State
    const [freightCost, setFreightCost] = useState<number>(0);
    const [insuranceCost, setInsuranceCost] = useState<number>(0);
    const [dutiesCost, setDutiesCost] = useState<number>(0);
    const [otherCosts, setOtherCosts] = useState<number>(0);

    // Items State
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Load necessary initial data
    const loadInitialData = useCallback(async () => {
        try {
            const [bRes, pRes] = await Promise.all([
                api<Branch[]>('/branches'),
                api<{ items: Product[] }>('/products?limit=100') // Adjust pagination if catalog is massive
            ]);
            setBranches(Array.isArray(bRes) ? bRes : (bRes as any)?.items || []);
            setProducts(pRes.items || []);
        } catch (e: any) {
            console.error('Error loading data:', e);
            toast.error(e.message || 'Error cargando catálogos');
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    // Computed Values
    const totalFOB = items.reduce((acc, current) => acc + (current.quantity * current.unitFobValue), 0);
    const totalCIF = totalFOB + freightCost + insuranceCost + dutiesCost + otherCosts;

    // Handlers
    const handleAddItem = (product: Product) => {
        if (items.find(i => i.productId === product.id)) {
            toast.error('Este producto ya está en la orden');
            setShowPicker(false);
            return;
        }
        setItems(prev => [...prev, {
            id: Math.random().toString(),
            productId: product.id,
            product,
            quantity: 1,
            unitFobValue: 0
        }]);
        setShowPicker(false);
    };

    const handleUpdateItem = (id: string, field: 'quantity' | 'unitFobValue', value: number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!branchId) return toast.error('Debe seleccionar una sucursal destino');
        if (!supplierName.trim()) return toast.error('El nombre del proveedor es obligatorio');
        if (items.length === 0) return toast.error('Debe agregar al menos un producto a la orden');
        if (items.some(i => i.quantity <= 0)) return toast.error('Todas las cantidades deben ser mayores a cero');
        if (items.some(i => i.unitFobValue <= 0)) return toast.error('Todos los precios FOB deben ser mayores a cero');

        setSaving(true);
        try {
            const payload = {
                branchId,
                supplierName: supplierName.trim(),
                invoiceNumber: invoiceNumber.trim() || undefined,
                proformaNumber: proformaNumber.trim() || undefined,
                fobValue: totalFOB,
                freightCost: Number(freightCost) || 0,
                insuranceCost: Number(insuranceCost) || 0,
                dutiesCost: Number(dutiesCost) || 0,
                otherCosts: Number(otherCosts) || 0,
                orderDate: orderDate ? new Date(orderDate.toString()).toISOString() : undefined,
                expectedDate: expectedDate ? new Date(expectedDate.toString()).toISOString() : undefined,
                notes: notes.trim() || undefined,
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: Number(i.quantity),
                    unitFobValue: Number(i.unitFobValue)
                }))
            };

            await api('/purchases', { method: 'POST', body: payload });
            toast.success('Orden de Compra emitida exitosamente', { duration: 4000 });
            router.push('/dashboard/inventario/compras');
        } catch (e: any) {
            toast.error(e.message || 'Error al guardar la orden de compra');
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning />;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24" suppressHydrationWarning>
            {showPicker && <ProductPicker products={products} onSelect={handleAddItem} onClose={() => setShowPicker(false)} />}

            <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
                {/* Header Superior */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#C7D2FE]">NUEVO DOCUMENTO</span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Registro de Orden de Compra</h1>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-[#16A34A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#16A34A]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Procesando...' : 'Emitir Orden'}
                    </button>
                </div>

                {loadingData ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* COLUMNA IZQUIERDA: GENERAL Y ARTICULOS */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Card: Datos Generales */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FBFCFE] flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-[#2563EB]" />
                                    <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Información Principal</h2>
                                </div>
                                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1.5">Proveedor <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                                <input required value={supplierName} onChange={e => setSupplierName(e.target.value.toUpperCase())} placeholder="EJ: DIAGEO LATAM"
                                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all uppercase" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1.5">Sucursal Destino <span className="text-red-500">*</span></label>
                                            <select required value={branchId} onChange={e => setBranchId(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all">
                                                <option value="" disabled>Seleccione una sucursal</option>
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1.5">Invoice (Fac)</label>
                                                <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value.toUpperCase())} placeholder="INV-0001"
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all uppercase" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1.5">Proforma</label>
                                                <input value={proformaNumber} onChange={e => setProformaNumber(e.target.value.toUpperCase())} placeholder="PROF-0001"
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all uppercase" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block">Fecha de Orden</label>
                                            <DatePicker
                                                value={orderDate}
                                                onChange={setOrderDate}
                                                showMonthAndYearPickers
                                                variant="bordered"
                                                popoverProps={{
                                                    classNames: {
                                                        content: "p-1 bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl min-w-[calc(var(--popover-trigger-width))] w-[calc(var(--popover-trigger-width))]"
                                                    }
                                                }}
                                                calendarProps={{
                                                    classNames: {
                                                        base: "bg-white text-[#0F172A] w-full max-w-full shadow-none",
                                                        headerWrapper: "bg-white pt-2 w-full",
                                                        gridWrapper: "pb-2 w-full",
                                                        cellButton: "data-[today=true]:bg-[#BAE6FD] data-[today=true]:text-[#0F172A] data-[today=true]:font-black data-[selected=true]:bg-[#2563EB] data-[selected=true]:text-white font-medium hover:bg-[#F8FAFC] transition-colors rounded-lg",
                                                    }
                                                }}
                                                classNames={{
                                                    base: "w-full",
                                                    inputWrapper: "bg-gray-50 border-[#E2E8F0] shadow-none rounded-xl hover:bg-white focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-all",
                                                    input: "text-sm font-bold text-[#0F172A]"
                                                }}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block">Fecha Esperada (ETA)</label>
                                            <DatePicker
                                                value={expectedDate}
                                                onChange={setExpectedDate}
                                                showMonthAndYearPickers
                                                variant="bordered"
                                                popoverProps={{
                                                    classNames: {
                                                        content: "p-1 bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl min-w-[calc(var(--popover-trigger-width))] w-[calc(var(--popover-trigger-width))]"
                                                    }
                                                }}
                                                calendarProps={{
                                                    classNames: {
                                                        base: "bg-white text-[#0F172A] w-full max-w-full shadow-none",
                                                        headerWrapper: "bg-white pt-2 w-full",
                                                        gridWrapper: "pb-2 w-full",
                                                        cellButton: "data-[today=true]:bg-[#BAE6FD] data-[today=true]:text-[#0F172A] data-[today=true]:font-black data-[selected=true]:bg-[#2563EB] data-[selected=true]:text-white font-medium hover:bg-[#F8FAFC] transition-colors rounded-lg",
                                                    }
                                                }}
                                                classNames={{
                                                    base: "w-full",
                                                    inputWrapper: "bg-gray-50 border-[#E2E8F0] shadow-none rounded-xl hover:bg-white focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-all",
                                                    input: "text-sm font-bold text-[#0F172A]"
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1.5">Notas / Instrucciones</label>
                                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Términos de pago, contenedor..." rows={2}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all resize-none" />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Card: Productos a Comprar */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FBFCFE] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-[#2563EB]" />
                                        <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Detalle de Artículos</h2>
                                        <span className="ml-2 bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded border border-[#2563EB]/20">{items.length}</span>
                                    </div>
                                    <button type="button" onClick={() => setShowPicker(true)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-[#2563EB] text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#1B2FA0] transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Agregar Artículo
                                    </button>
                                </div>
                                <div className="p-0 overflow-x-auto min-h-[300px]">
                                    {items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                            <div className="w-16 h-16 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center mb-4">
                                                <Package className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-xs font-black text-[#64748B] uppercase tracking-widest">La orden está vacía</p>
                                            <p className="text-[11px] text-[#94A3B8] font-medium mt-1">Busca y selecciona productos para continuar.</p>
                                        </div>
                                    ) : (
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                                    <th className="px-4 py-3 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest w-10">#</th>
                                                    <th className="px-4 py-3 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Producto</th>
                                                    <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest w-32">Cantidad</th>
                                                    <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest w-36">Unitario (FOB)</th>
                                                    <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest w-36">Subtotal</th>
                                                    <th className="px-4 py-3 text-center w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E2E8F0]">
                                                {items.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-3 text-xs font-black text-[#94A3B8]">{index + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <SharedProductImage src={item.product?.mainImageUrl} size={8} />
                                                                <div>
                                                                    <p className="text-xs font-black text-[#0F172A] uppercase line-clamp-1" title={item.product?.description}>{item.product?.description}</p>
                                                                    <p className="text-[10px] text-[#2563EB] font-mono mt-0.5">REF: {item.product?.internalReference || 'S/REF'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input type="number" min="1" step="1" value={item.quantity || ''} onChange={e => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                                className="w-full px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-right focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] outline-none" />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8]">$</span>
                                                                <input type="number" min="0" step="0.01" value={item.unitFobValue || ''} onChange={e => handleUpdateItem(item.id, 'unitFobValue', parseFloat(e.target.value) || 0)}
                                                                    className="w-full pl-5 pr-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold text-right focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] outline-none" />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-xs font-mono font-black text-[#0F172A]">${(item.quantity * item.unitFobValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-4 flex justify-end">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-0.5">Subtotal FOB de Artefactos</p>
                                        <p className="text-lg font-mono font-black text-[#0F172A]">${totalFOB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA: COSTOS Y CIF */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Card: Desglose de Costos */}
                            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden sticky top-28">
                                <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#0F172A] text-white flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-[#38BDF8]" />
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[#FFFFFF]">Resumen de Liquidación</h2>
                                </div>

                                <div className="p-5 space-y-5">
                                    <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
                                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Subtotal FOB</span>
                                        <span className="text-sm font-mono font-black text-[#0F172A]">${totalFOB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Flete Marítimo / Aéreo</label>
                                            <input type="number" min="0" step="0.01" value={freightCost || ''} onChange={e => setFreightCost(parseFloat(e.target.value) || 0)}
                                                className="w-28 px-2 py-1.5 bg-gray-50 border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold text-right focus:bg-white focus:border-[#2563EB] outline-none" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Seguro de Carga</label>
                                            <input type="number" min="0" step="0.01" value={insuranceCost || ''} onChange={e => setInsuranceCost(parseFloat(e.target.value) || 0)}
                                                className="w-28 px-2 py-1.5 bg-gray-50 border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold text-right focus:bg-white focus:border-[#2563EB] outline-none" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Aranceles / Tasa ZL</label>
                                            <input type="number" min="0" step="0.01" value={dutiesCost || ''} onChange={e => setDutiesCost(parseFloat(e.target.value) || 0)}
                                                className="w-28 px-2 py-1.5 bg-gray-50 border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold text-right focus:bg-white focus:border-[#2563EB] outline-none" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Honorarios / Otros</label>
                                            <input type="number" min="0" step="0.01" value={otherCosts || ''} onChange={e => setOtherCosts(parseFloat(e.target.value) || 0)}
                                                className="w-28 px-2 py-1.5 bg-gray-50 border border-[#E2E8F0] rounded-lg text-xs font-mono font-bold text-right focus:bg-white focus:border-[#2563EB] outline-none" />
                                        </div>
                                    </div>

                                </div>

                                <div className="bg-[#F7F9FC] border-t border-[#E2E8F0] p-5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.2em] mb-0.5">VALOR CIF TOTAL</p>
                                            <p className="text-[10px] text-[#475569] font-medium leading-tight max-w-[120px]">Costo integral estimado de la importación.</p>
                                        </div>
                                        <span className="text-2xl font-mono font-black text-[#0F172A] tracking-tighter">
                                            ${totalCIF.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                </div>
                            </div>

                            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 flex gap-3">
                                <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider mb-1">Cálculo de Proporción</h4>
                                    <p className="text-[11px] text-[#2563EB]/80 leading-relaxed font-medium">Al momento de la recepción física en el almacén, estos costos proyectados se prorratearán utilizando el factor peso/volumen o valor para determinar el costo unitario final de cada ítem.</p>
                                </div>
                            </div>

                        </div>

                    </div>
                )}
            </form>
        </div>
    );
}
