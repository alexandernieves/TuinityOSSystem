'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Building, Package, Receipt, Calculator, Clock, CheckCircle2, Truck, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { SharedProductImage } from '@/components/shared/SharedProductImage';

interface OrderDetail {
    id: string;
    supplierName: string;
    invoiceNumber: string | null;
    proformaNumber: string | null;
    fobValue: number;
    freightCost: number;
    insuranceCost: number;
    dutiesCost: number;
    otherCosts: number;
    totalCifValue: number;
    status: 'DRAFT' | 'PARTIAL' | 'RECEIVED';
    branchId: string;
    branch: { name: string };
    orderDate: string;
    expectedDate: string | null;
    notes: string | null;
    items: Array<{
        id: string;
        productId: string;
        quantity: number;
        receivedQuantity: number;
        unitFobValue: number;
        unitCifValue: number;
        subtotalFob: number;
        subtotalCif: number;
        product: {
            id: string;
            description: string;
            mainImageUrl: string | null;
            internalReference: string | null;
        }
    }>;
}

export default function DetalleOrdenCompraPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const orderId = resolvedParams.id;

    const [mounted, setMounted] = useState(false);
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReceiving, setIsReceiving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});

    const loadData = useCallback(async () => {
        try {
            const data = await api<OrderDetail>(`/purchases/${orderId}`);
            setOrder(data);
        } catch (e: any) {
            toast.error(e.message || 'Error al cargar los detalles de la orden');
            router.push('/dashboard/inventario/compras/consulta-ordenes');
        } finally {
            setLoading(false);
        }
    }, [orderId, router]);

    useEffect(() => {
        setMounted(true);
        loadData();
    }, [loadData]);


    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RECEIVED':
                return { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', icon: <CheckCircle2 className="w-4 h-4" />, label: 'RECIBIDA COMPLETA' };
            case 'PARTIAL':
                return { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', icon: <Truck className="w-4 h-4" />, label: 'RECEPCIÓN PARCIAL' };
            default: // DRAFT
                return { bg: 'bg-[#FEF9C3]', text: 'text-[#CA8A04]', border: 'border-[#CA8A04]/20', icon: <Clock className="w-4 h-4" />, label: 'EMITIDA / DRAFT' };
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] py-20 flex justify-center items-start">
                <div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    const statusStyle = getStatusStyle(order.status);

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30 gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.back()} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                                    {statusStyle.icon}
                                    {statusStyle.label}
                                </span>
                                <span className="text-[10px] text-[#94A3B8] font-mono">ID: {order.id.split('-')[0].toUpperCase()}</span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">
                                {order.invoiceNumber || order.proformaNumber ? `Orden: ${order.invoiceNumber || order.proformaNumber}` : 'Orden sin documento'}
                            </h1>
                        </div>
                    </div>
                    {order.status !== 'RECEIVED' && (
                        <button
                            onClick={() => {
                                const qties: Record<string, number> = {};
                                order.items.forEach(item => {
                                    qties[item.productId] = item.quantity - item.receivedQuantity;
                                });
                                setReceiveQuantities(qties);
                                setIsReceiving(true);
                            }}
                            className="px-6 py-3 bg-[#2563EB] hover:bg-[#1B2FA0] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Recibir Mercancía
                        </button>
                    )}
                </div>

                {/* MODAL DE RECEPCION */}
                <AnimatePresence>
                    {isReceiving && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                                    <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight">Recepción de Inventario</h3>
                                    <p className="text-xs text-[#64748B] font-medium mt-1">Confirma las cantidades que están ingresando físicamente al almacén.</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {order.items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-[#E2E8F0]">
                                            <SharedProductImage src={item.product.mainImageUrl} size={10} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-[#0F172A] uppercase truncate">{item.product.description}</p>
                                                <p className="text-[10px] text-[#2563EB] font-mono mt-0.5">REF: {item.product.internalReference || 'S/REF'}</p>
                                                <p className="text-[10px] text-[#94A3B8] font-bold mt-1 uppercase tracking-widest">Pendiente: {item.quantity - item.receivedQuantity}</p>
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.quantity - item.receivedQuantity}
                                                    value={receiveQuantities[item.productId] ?? 0}
                                                    onChange={(e) => setReceiveQuantities(prev => ({ ...prev, [item.productId]: parseInt(e.target.value) || 0 }))}
                                                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-bold text-right focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-[#E2E8F0] bg-[#FBFCFE] flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsReceiving(false)}
                                        className="px-6 py-2.5 text-xs font-black text-[#64748B] uppercase tracking-widest hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={submitting}
                                        onClick={async () => {
                                            setSubmitting(true);
                                            try {
                                                const itemsToReceive = Object.entries(receiveQuantities)
                                                    .filter(([_, qty]) => qty > 0)
                                                    .map(([productId, quantity]) => ({ productId, quantity }));

                                                if (itemsToReceive.length === 0) {
                                                    toast.error('Debe ingresar al menos una cantidad mayor a cero');
                                                    return;
                                                }

                                                await api(`/purchases/${orderId}/receive`, {
                                                    method: 'PATCH',
                                                    body: { items: itemsToReceive }
                                                });

                                                toast.success('Mercancía recibida e inventario actualizado');
                                                setIsReceiving(false);
                                                loadData();
                                            } catch (e: any) {
                                                toast.error(e.message || 'Error al procesar la recepción');
                                            } finally {
                                                setSubmitting(false);
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-[#16A34A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#16A34A]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Confirmar Entrada
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* COLUMNA IZQUIERDA: GENERAL Y ARTICULOS */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Card: Datos Generales */}
                        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FBFCFE] flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#2563EB]" />
                                <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Información Principal</h2>
                            </div>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Proveedor</label>
                                    <div className="flex items-center gap-2 text-[#0F172A] font-bold text-sm">
                                        <Building className="w-4 h-4 text-[#94A3B8]" />
                                        <span className="uppercase">{order.supplierName}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Destino / Almacén</label>
                                    <div className="flex items-center gap-2 text-[#2563EB] font-black text-sm">
                                        <Building className="w-4 h-4" />
                                        <span className="uppercase">{order.branch?.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Fecha de Orden</label>
                                    <div className="flex items-center gap-2 text-[#0F172A] font-bold text-sm">
                                        <Calendar className="w-4 h-4 text-[#94A3B8]" />
                                        <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Esperada (ETA)</label>
                                    <div className="flex items-center gap-2 text-[#0F172A] font-bold text-sm">
                                        <Truck className="w-4 h-4 text-[#94A3B8]" />
                                        <span>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'No definida'}</span>
                                    </div>
                                </div>
                                <div className="sm:col-span-2 md:col-span-3">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Notas / Instrucciones</label>
                                    <p className="text-sm text-[#475569] font-medium bg-gray-50 p-3 rounded-xl border border-[#E2E8F0]">
                                        {order.notes || 'Ninguna instrucción adicional.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card: Productos Comprados */}
                        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#FBFCFE] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#2563EB]" />
                                    <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Artículos de la Orden</h2>
                                    <span className="ml-2 bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded border border-[#2563EB]/20">{order.items.length}</span>
                                </div>
                            </div>
                            <div className="p-0 overflow-x-auto min-h-[300px]">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                            <th className="px-4 py-3 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Producto</th>
                                            <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Cant.</th>
                                            <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Recibido</th>
                                            <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Costo Unit (FOB)</th>
                                            <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest bg-emerald-50/50">Costo Unit (CIF)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E2E8F0]">
                                        {order.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <SharedProductImage src={item.product.mainImageUrl} size={8} />
                                                        <div>
                                                            <p className="text-xs font-black text-[#0F172A] uppercase line-clamp-1">{item.product.description}</p>
                                                            <p className="text-[9px] text-[#2563EB] font-mono mt-0.5">REF: {item.product.internalReference || 'S/REF'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-xs font-bold text-[#0F172A]">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`text-xs font-black px-2 py-1 rounded-md ${item.receivedQuantity === item.quantity ? 'bg-green-100 text-green-700' : item.receivedQuantity > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {item.receivedQuantity} / {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-xs font-mono font-medium text-[#475569]">
                                                    ${Number(item.unitFobValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right bg-emerald-50/30">
                                                    <span className="text-xs font-mono font-black text-[#16A34A]">
                                                        ${Number(item.unitCifValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: COSTOS Y CIF */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Card: Desglose de Costos */}
                        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden sticky top-28">
                            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#0F172A] text-white flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-[#38BDF8]" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-[#FFFFFF]">Desglose de Adquisición</h2>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
                                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Subtotal FOB</span>
                                    <span className="text-sm font-mono font-black text-[#0F172A]">${Number(order.fobValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Flete</span>
                                    <span className="text-xs font-mono font-medium text-[#475569]">${Number(order.freightCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Seguro</span>
                                    <span className="text-xs font-mono font-medium text-[#475569]">${Number(order.insuranceCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Aranceles</span>
                                    <span className="text-xs font-mono font-medium text-[#475569]">${Number(order.dutiesCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Otros Gastos</span>
                                    <span className="text-xs font-mono font-medium text-[#475569]">${Number(order.otherCosts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="bg-[#F7F9FC] border-t border-[#E2E8F0] p-5">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.2em] mb-0.5">VALOR CIF TOTAL</p>
                                    </div>
                                    <span className="text-2xl font-mono font-black text-[#0F172A] tracking-tighter">
                                        ${Number(order.totalCifValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

