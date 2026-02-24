'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Filter, Calendar, Building, Package, ExternalLink, Calculator, HandCoins, ShieldCheck, FileText, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface PurchaseOrder {
    id: string;
    invoiceNumber: string | null;
    proformaNumber: string | null;
    supplierName: string;
    orderDate: string;
    receivedDate: string | null;
    status: 'DRAFT' | 'PARTIAL' | 'RECEIVED';
    branch: { name: string };

    // Costos Globales
    fobValue: number;
    freightCost: number;
    insuranceFee: number;
    customsDuties: number;
    otherCosts: number;
    totalCifValue: number;

    items: {
        id: string;
        quantity: number;
        receivedQuantity: number;
        unitFobValue: number;
        unitCifValue: number;
        product: {
            id: string;
            description: string;
        };
    }[];
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ConsultaCostosPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const limit = 20;

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            // Buscamos lasórdenes que ya hayan sido recibidas o que tengan un movimiento
            // Para poder consultar sus costos reales o proyectados de CIF.
            // Aqui usaremos el endpoint general y filtramos.
            let url = `/purchases?page=${currentPage}&limit=${limit}`;
            if (searchQuery) url += `&supplierName=${encodeURIComponent(searchQuery)}`;

            const response = await api<{ items: PurchaseOrder[], meta: PaginationMeta }>(url);

            // Filtramos en cliente para solo ver operaciones procesadas o recibidas, 
            // pero que tengan items para analizar.
            const filteredOrders = (response.items || []).filter(o => o.items && o.items.length > 0);

            setOrders(filteredOrders);
            setMeta(response.meta || null);
        } catch (e: any) {
            console.error('Error fetching costs:', e);
            toast.error(e.message || 'Error al cargar historial de costos');
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        setMounted(true);
        loadOrders();
    }, [loadOrders]);

    if (!mounted) return null;

    const formatMoney = (val: number | string) => {
        return Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    return (
        <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30 gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.push('/dashboard/inventario/compras')} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#F1F5F9] text-[#475569] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#E2E8F0]">MÓDULO FINANCIERO</span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Análisis de Costos por Entrada</h1>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Buscar por Proveedor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] font-medium placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all outline-none"
                        />
                    </div>
                    <button onClick={loadOrders} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-[#2563EB]/20 hover:bg-[#1D4ED8] transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Filter className="w-4 h-4" /> Buscar
                    </button>
                </div>

                {/* Lista de Analisis de Costos */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white border border-[#E2E8F0] rounded-2xl">
                        <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
                            <Calculator className="w-8 h-8 text-[#94A3B8]" />
                        </div>
                        <h3 className="text-[#0F172A] font-black text-lg uppercase tracking-tight">Sin registros financieros</h3>
                        <p className="text-[#64748B] text-sm max-w-sm mt-1">No hay órdenes con costos registrados para este filtro de búsqueda.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const isExpanded = expandedOrderId === order.id;
                            const factorCIF = Number(order.fobValue) > 0 ? (Number(order.totalCifValue) / Number(order.fobValue)) : 1;
                            const percentageIncrease = (factorCIF - 1) * 100;
                            const docName = order.invoiceNumber || order.proformaNumber || 'S/DOC';

                            return (
                                <div key={order.id} className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${isExpanded ? 'border-[#2563EB] ring-1 ring-[#2563EB]/10' : 'border-[#E2E8F0]'}`}>
                                    {/* Cabecera de la Orden */}
                                    <div
                                        className="p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#F8FAFC] text-[#64748B] group-hover:bg-[#F1F5F9]'}`}>
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">{order.supplierName}</h3>
                                                    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded border uppercase ${order.status === 'RECEIVED' ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20' : order.status === 'PARTIAL' ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20' : 'bg-[#FEFCE8] text-[#CA8A04] border-[#CA8A04]/20'}`}>
                                                        {order.status === 'RECEIVED' ? 'RECIBIDO' : order.status}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-3 text-xs font-bold text-[#64748B]">
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-3.5 h-3.5" /> REF: {docName}
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" /> Date: {new Date(order.orderDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Costos Resumen Header */}
                                        <div className="flex items-center justify-end gap-6 shrink-0 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest">Total FOB</span>
                                                <span className="text-sm font-black text-[#0F172A] font-mono">{formatMoney(order.fobValue)}</span>
                                            </div>
                                            <div className="w-px h-8 bg-[#E2E8F0]" />
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest">Total CIF</span>
                                                <span className="text-sm font-black text-[#2563EB] font-mono">{formatMoney(order.totalCifValue)}</span>
                                            </div>
                                            <div className="w-px h-8 bg-[#E2E8F0]" />
                                            <div className="flex flex-col items-center justify-center min-w-[70px]">
                                                <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest text-center">% Incr.</span>
                                                <div className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-black px-1.5 py-0.5 rounded bg-white border shadow-sm ${percentageIncrease > 20 ? 'text-[#DC2626] border-[#DC2626]/20' : 'text-[#64748B] border-[#E2E8F0]'}`}>
                                                    <TrendingUp className="w-3 h-3" />
                                                    +{percentageIncrease.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="pl-2 ml-2 border-l border-[#E2E8F0] flex items-center justify-center h-full">
                                                <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-transparent text-[#94A3B8] group-hover:bg-[#F1F5F9]'}`}>
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detalle Desplegable */}
                                    {isExpanded && (
                                        <div className="border-t border-[#E2E8F0] bg-[#FBFCFE] p-5 animate-in slide-in-from-top-4 duration-300">

                                            {/* Desglose Gasto Gastos */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                                                    <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Gasto: Flete Terrestre/Marítimo</span>
                                                    <p className="text-sm font-black text-[#0F172A] font-mono">{formatMoney(order.freightCost)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                                                    <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Gasto: Seguro Mercancía</span>
                                                    <p className="text-sm font-black text-[#0F172A] font-mono">{formatMoney(order.insuranceFee)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                                                    <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Gasto: Impuestos/Aduana</span>
                                                    <p className="text-sm font-black text-[#0F172A] font-mono">{formatMoney(order.customsDuties)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                                                    <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest block mb-1">Gasto: Otros Imprevistos</span>
                                                    <p className="text-sm font-black text-[#0F172A] font-mono">{formatMoney(order.otherCosts)}</p>
                                                </div>
                                            </div>

                                            {/* Tabla Líneas de Detalle Prorrateo */}
                                            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                                                <div className="bg-[#F1F5F9] px-4 py-2 border-b border-[#E2E8F0] flex items-center gap-2">
                                                    <HandCoins className="w-4 h-4 text-[#475569]" />
                                                    <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Prorrateo de Costos Unitarios</span>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-[#E2E8F0]">
                                                                <th className="px-4 py-3 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Producto</th>
                                                                <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Base Pura (FOB)</th>
                                                                <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest px-2">Total Prorrateado (CIF)</th>
                                                                <th className="px-4 py-3 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Rentabilidad Delta</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#E2E8F0]">
                                                            {order.items.map(item => {
                                                                const fob = Number(item.unitFobValue);
                                                                const cif = Number(item.unitCifValue);
                                                                const delta = cif - fob;
                                                                return (
                                                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                                                        <td className="px-4 py-3">
                                                                            <span className="text-xs font-black text-[#0F172A] uppercase line-clamp-1">{item.product.description}</span>
                                                                            <span className="text-[10px] font-bold text-[#64748B] mt-0.5 flex gap-2">
                                                                                <span>CANT: {item.quantity}</span>
                                                                                {item.receivedQuantity > 0 && <span className="text-[#16A34A]">RECIB: {item.receivedQuantity}</span>}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right font-mono text-xs font-black text-[#64748B]">{formatMoney(fob)} / u</td>
                                                                        <td className="px-4 py-3 text-right font-mono text-sm font-black text-[#2563EB] bg-[#EFF6FF]/30">{formatMoney(cif)} / u</td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <span className="inline-block text-[10px] font-black text-[#DC2626] font-mono">+ {formatMoney(delta)} / u</span>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer y Paginación */}
                {!loading && meta && meta.totalPages > 1 && (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                            Mostrando página {meta.page} de {meta.totalPages} (Total {meta.total} ordenes)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={currentPage === meta.totalPages}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
