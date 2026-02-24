'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Filter, Calendar, Building, FileText, Eye, CheckCircle2, Clock, Truck, ChevronLeft, ChevronRight, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

// --- TYPES ---
interface PurchaseOrder {
    id: string;
    invoiceNumber: string | null;
    proformaNumber: string | null;
    supplierName: string;
    orderDate: string;
    expectedDate: string | null;
    totalCifValue: number;
    status: 'DRAFT' | 'PARTIAL' | 'RECEIVED';
    branchId: string;
    branch: { name: string };
    items: any[];
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ConsultaOrdenesPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    useEffect(() => { setMounted(true); }, []);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/purchases?page=${currentPage}&limit=${limit}`;
            if (debouncedSearch) url += `&supplierName=${encodeURIComponent(debouncedSearch)}`;
            if (statusFilter) url += `&status=${statusFilter}`;

            const response = await api<{ items: PurchaseOrder[], meta: PaginationMeta }>(url);
            setOrders(response.items || []);
            setMeta(response.meta || null);
        } catch (e: any) {
            console.error('Error fetching orders:', e);
            toast.error(e.message || 'Error al cargar las órdenes de compra');
            setOrders([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, statusFilter]);

    useEffect(() => {
        if (mounted) {
            loadOrders();
        }
    }, [mounted, loadOrders]);


    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RECEIVED':
                return { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'RECIBIDA' };
            case 'PARTIAL':
                return { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', icon: <Truck className="w-3.5 h-3.5" />, label: 'PARCIAL' };
            default: // DRAFT
                return { bg: 'bg-[#FEF9C3]', text: 'text-[#CA8A04]', border: 'border-[#CA8A04]/20', icon: <Clock className="w-3.5 h-3.5" />, label: 'EMITIDA / DRAFT' };
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning />;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30 gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.push('/dashboard/inventario/compras')} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#F1F5F9] text-[#475569] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#E2E8F0]">HISTORIAL GENERAL</span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Consulta de Órdenes</h1>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-[#2563EB]" />
                        <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Filtros de Búsqueda</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                <input
                                    type="text"
                                    placeholder="Buscar por Proveedor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all uppercase"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all uppercase"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="DRAFT">Emitida / Draft</option>
                                <option value="PARTIAL">Recepción Parcial</option>
                                <option value="RECEIVED">Recibida Completa</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabla de Resultados */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-0 overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" /></div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                <div className="w-16 h-16 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-xs font-black text-[#64748B] uppercase tracking-widest">No hay órdenes registradas</p>
                                <p className="text-[11px] text-[#94A3B8] font-medium mt-1">Ajusta los filtros o crea una nueva orden.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Documento</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Proveedor</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Sucursal</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Fechas</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Artículos</th>
                                        <th className="px-5 py-4 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Total Liquidación</th>
                                        <th className="px-5 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Estado</th>
                                        <th className="px-5 py-4 text-center w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {orders.map((order) => {
                                        const style = getStatusStyle(order.status);
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider">{order.invoiceNumber || order.proformaNumber || 'SIN/DOC'}</span>
                                                        <span className="text-[10px] text-[#94A3B8] font-mono">ID: {order.id.split('-')[0].toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="w-4 h-4 text-[#94A3B8]" />
                                                        <span className="text-sm font-bold text-[#0F172A] uppercase line-clamp-1">{order.supplierName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
                                                        <span className="text-[11px] font-black text-[#475569] uppercase truncate">{order.branch?.name || 'S/N'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#475569]">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(order.orderDate).toLocaleDateString()}
                                                        </div>
                                                        {order.expectedDate && (
                                                            <div className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mt-0.5">
                                                                ETA: {new Date(order.expectedDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5">
                                                        <Package className="w-3 h-3 text-[#64748B]" />
                                                        <span className="text-xs font-black text-[#475569]">{order.items?.length || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className="text-sm font-mono font-black text-[#0F172A]">
                                                        ${Number(order.totalCifValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${style.bg} ${style.border} ${style.text}`}>
                                                        {style.icon}
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{style.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/inventario/compras/consulta-ordenes/${order.id}`)}
                                                        className="p-1.5 text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EEF2FF] rounded-lg transition-colors flex items-center justify-center m-auto"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Paginación */}
                    {!loading && meta && meta.totalPages > 1 && (
                        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                                Mostrando {orders.length} de {meta.total}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={currentPage === meta.totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

