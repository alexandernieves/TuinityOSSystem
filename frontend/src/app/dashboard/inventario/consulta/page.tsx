'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Filter, Package, AlertTriangle, Eye, Server, Layers, Tags, Hash, Plus, CheckCircle2, Factory, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// --- TYPES ---
interface Product {
    id: string;
    description: string;
    internalReference: string | null;
    barcodes: { barcode: string }[];
    price_a: number;
    minStock: number;
    brand: { name: string } | null;
    category: { name: string } | null;
    inventory: {
        quantity: number;
        reserved: number;
    }[];
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ConsultaProductoPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'MIN_STOCK' | 'LOW_STOCK' | 'AVAILABLE'>('ALL');

    const [currentPage, setCurrentPage] = useState(1);
    const limit = 20;

    useEffect(() => { setMounted(true); }, []);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset page
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/products?page=${currentPage}&limit=${limit}`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

            const response = await api<{ items: Product[], meta: PaginationMeta }>(url);

            // Post-filtering based on Dynamo tabs (since backend might not support all directly in the query without custom endpoints)
            let processedItems = response.items || [];

            if (filterType !== 'ALL') {
                processedItems = processedItems.filter(p => {
                    const totalQty = p.inventory?.reduce((sum, inv) => sum + Number(inv.quantity), 0) || 0;
                    const minStk = p.minStock || 0;

                    if (filterType === 'MIN_STOCK') {
                        return totalQty === minStk;
                    }
                    if (filterType === 'LOW_STOCK') {
                        return totalQty < minStk;
                    }
                    if (filterType === 'AVAILABLE') {
                        return totalQty > 0;
                    }
                    return true;
                });
            }

            setProducts(processedItems);
            setMeta(response.meta || null);
        } catch (e: any) {
            console.error('Error fetching products:', e);
            toast.error(e.message || 'Error al cargar los productos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, filterType]);

    useEffect(() => {
        if (mounted) loadProducts();
    }, [mounted, loadProducts]);

    if (!mounted) return <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning />;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30 gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.push('/dashboard/inventario')} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#F1F5F9] text-[#475569] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#E2E8F0]">MÓDULO DE INVENTARIO</span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Consulta de Producto</h1>
                        </div>
                    </div>
                </div>

                {/* Filtros y Buscador Avanzado */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#2563EB]" />
                        <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Búsqueda Maestra</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por Referencia, Código de Barras o Descripción..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] uppercase placeholder:normal-case placeholder:font-medium placeholder:text-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all outline-none"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#0F172A]">
                                    <Plus className="w-4 h-4 rotate-45" />
                                </button>
                            )}
                        </div>
                        {/* Botones Tipo Dynamo */}
                        <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
                            <button
                                onClick={() => { setFilterType('MIN_STOCK'); setCurrentPage(1); }}
                                className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${filterType === 'MIN_STOCK' ? 'bg-[#FFFBEB] text-[#D97706] border-[#D97706]/30 shadow-sm' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-gray-50'}`}
                            >
                                <AlertTriangle className="w-4 h-4" /> En Mínimo
                            </button>
                            <button
                                onClick={() => { setFilterType('LOW_STOCK'); setCurrentPage(1); }}
                                className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${filterType === 'LOW_STOCK' ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30 shadow-sm' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-gray-50'}`}
                            >
                                <Hash className="w-4 h-4" /> Bajo Mínimo
                            </button>
                            <button
                                onClick={() => { setFilterType('AVAILABLE'); setCurrentPage(1); }}
                                className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${filterType === 'AVAILABLE' ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/30 shadow-sm' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-gray-50'}`}
                            >
                                <CheckCircle2 className="w-4 h-4" /> Disponible
                            </button>
                            {filterType !== 'ALL' && (
                                <button
                                    onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
                                    className="px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-black text-[#475569] uppercase tracking-widest hover:bg-[#F1F5F9] transition-all"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla de Productos Clásica */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-0 overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" /></div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                <div className="w-16 h-16 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl flex items-center justify-center mb-4">
                                    <Package className="w-8 h-8 text-[#94A3B8]" />
                                </div>
                                <p className="text-xs font-black text-[#64748B] uppercase tracking-widest">No hay productos en inventario</p>
                                <p className="text-[11px] text-[#94A3B8] font-medium mt-1">Ajusta los filtros o valida la búsqueda.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest group">Referencia / Código</th>
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest group">Descripción</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#2563EB] uppercase tracking-widest group bg-[#EFF6FF]/50 border-l border-[#E2E8F0]">Stock (Existencias)</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#D97706] uppercase tracking-widest group bg-[#FFFBEB]/50 border-x border-[#E2E8F0]">Mínimo</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest group">Por Llegar</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#DC2626] uppercase tracking-widest group bg-[#FEF2F2]/50 border-x border-[#E2E8F0]">Separado</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#16A34A] uppercase tracking-widest group bg-[#F0FDF4]/50 border-r border-[#E2E8F0]">Disponible</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest group">Precio A</th>
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest group">Marca / Grupo</th>
                                        <th className="px-4 py-4 text-center w-16">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {products.map((product) => {
                                        const existencias = product.inventory?.reduce((sum, i) => sum + Number(i.quantity), 0) || 0;
                                        const reservados = product.inventory?.reduce((sum, i) => sum + Number(i.reserved), 0) || 0;
                                        const porLlegar = 0; // Calculo dinámico pendiente backend si necesario
                                        const disponible = existencias - reservados;

                                        const minStockAlert = existencias <= product.minStock;

                                        return (
                                            <tr key={product.id} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/inventario/consulta/${product.id}`)}>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-black text-[#0F172A] uppercase">{product.internalReference || 'NO-REF'}</span>
                                                        <span className="text-[10px] text-[#64748B] font-mono">{product.barcodes?.[0]?.barcode || 'SIN-BARCODE'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-[#0F172A] uppercase line-clamp-2">{product.description}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right bg-[#EFF6FF]/20 border-l border-[#E2E8F0]">
                                                    <span className={`text-[13px] font-black font-mono ${existencias > 0 ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                                                        {Number(existencias).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right bg-[#FFFBEB]/20 border-x border-[#E2E8F0]">
                                                    <span className="text-xs font-black text-[#D97706] font-mono">
                                                        {Number(product.minStock || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs font-bold text-[#64748B] font-mono">
                                                        {porLlegar}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right bg-[#FEF2F2]/20 border-x border-[#E2E8F0]">
                                                    <span className="text-xs font-black text-[#DC2626] font-mono">
                                                        {Number(reservados).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right bg-[#F0FDF4]/20 border-r border-[#E2E8F0]">
                                                    <span className={`text-sm font-black font-mono ${disponible > 0 ? 'text-[#16A34A]' : (disponible < 0 ? 'text-[#DC2626]' : 'text-[#64748B]')}`}>
                                                        {Number(disponible).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-xs font-black text-[#475569] font-mono">
                                                        ${Number(product.price_a).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#0F172A] uppercase">
                                                            <Factory className="w-3 h-3 text-[#94A3B8]" />
                                                            {product.brand?.name || 'S/M'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748B] uppercase">
                                                            <Layers className="w-3 h-3 text-[#CBD5E1]" />
                                                            {product.category?.name || 'S/C'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button type="button" className="p-1.5 text-[#94A3B8] hover:bg-[#2563EB] hover:text-white rounded-lg transition-all ml-auto">
                                                        <Eye className="w-4 h-4" />
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
                                Mostrando página {meta.page} de {meta.totalPages}
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
