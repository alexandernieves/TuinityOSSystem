'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, AlertTriangle, FileSpreadsheet, TriangleAlert, Hash, CalendarDays, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx';

interface LowStockProduct {
    id: string;
    reference: string;
    description: string;
    barcode: string;
    minStock: number;
    quantity: number;
    incoming: number;
    reserved: number;
    available: number;
    lastPurchaseDate: string | null;
    lastSaleDate: string | null;
    brandName: string;
}

export default function ConsultaBajoExistenciaPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<LowStockProduct[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { setMounted(true); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api<LowStockProduct[]>('/inventory/low-stock');
            setProducts(data || []);
        } catch (e: any) {
            console.error('Error fetching low stock:', e);
            toast.error(e.message || 'Error al cargar productos bajo existencia');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) loadData();
    }, [mounted]);

    const handleExportExcel = () => {
        if (products.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const exportData = products.map(p => ({
            'REFERENCIA': p.reference,
            'DESCRIPCIÓN': p.description,
            'CÓDIGO BARRA': p.barcode,
            'CANT. MÍNIMA': p.minStock,
            'EXISTENCIA': p.quantity,
            'POR LLEGAR': p.incoming,
            'SEPARADO': p.reserved,
            'DISPONIBLE': p.available,
            'ÚLT. COMPRA': p.lastPurchaseDate ? new Date(p.lastPurchaseDate).toLocaleDateString() : 'N/A',
            'ÚLT. VENTA': p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : 'N/A',
            'MARCA': p.brandName
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bajo_Existencia');
        XLSX.writeFile(wb, `Consulta_Bajo_Existencia_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Archivo Excel generado correctamente');
    };

    const filteredProducts = products.filter(p =>
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!mounted) return <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning />;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Sticky Header Area */}
                <div className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md pt-6 pb-2">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white border border-[#E2E8F0] shadow-lg rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => router.push('/dashboard/inventario')}
                                    className="w-11 h-11 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                                >
                                    <ArrowLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-[#FEF2F2] text-[#DC2626] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-[#DC2626]/20 flex items-center gap-1.5 leading-none">
                                            <TriangleAlert className="w-3 h-3" /> MÓDULO DE ALERTAS
                                        </span>
                                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest hidden sm:block">Sync v4.2</span>
                                    </div>
                                    <h1 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight leading-none">
                                        Bajo Existencia
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filtros Críticos y Exportación */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-[#2563EB]" />
                            <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Productos por debajo de la mínima</h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={loadData} className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-black text-[#0F172A] uppercase hover:bg-white transition-all shadow-sm flex items-center gap-2" disabled={loading}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
                            </button>
                            <button onClick={handleExportExcel} className="px-4 py-2 bg-[#16A34A] text-white border border-[#16A34A] rounded-lg text-xs font-black uppercase hover:bg-[#15803d] transition-all shadow-sm flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4" /> Exportar a Excel
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar en el reporte por Referencia, Código de Barras o Descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] uppercase placeholder:normal-case placeholder:font-medium placeholder:text-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Tabla Maestra - Replica Dynamo Estilo Moderno */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-0 overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" /></div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                <div className="w-16 h-16 bg-[#F0FDF4] border border-dashed border-[#86EFAC] rounded-2xl flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-8 h-8 text-[#16A34A]" />
                                </div>
                                <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Todo está en orden</p>
                                <p className="text-[11px] text-[#64748B] font-medium mt-1">No hay productos por debajo del punto mínimo.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse min-w-[1300px]">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest whitespace-nowrap"><Hash className="w-3 h-3 inline mr-1" /> Referencia</th>
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Descripción</th>
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Código Barra</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#D97706] uppercase tracking-widest bg-[#FFFBEB]/50 border-l border-[#E2E8F0]">Cant. Mínima</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#2563EB] uppercase tracking-widest">Existencia</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#64748B] uppercase tracking-widest">Por Llegar</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#DC2626] uppercase tracking-widest bg-[#FEF2F2]/50 border-x border-[#E2E8F0]">Separado</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black text-[#16A34A] uppercase tracking-widest bg-[#F0FDF4]/50 border-r border-[#E2E8F0]">Disponible</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black text-[#64748B] uppercase tracking-widest"><CalendarDays className="w-3 h-3 inline mr-1" /> Ult. Compra</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black text-[#64748B] uppercase tracking-widest"><CalendarDays className="w-3 h-3 inline mr-1" /> Ult. Venta</th>
                                        <th className="px-4 py-4 text-left text-[9px] font-black text-[#64748B] uppercase tracking-widest">Marca</th>
                                        <th className="px-4 py-4 w-12 text-center text-[9px] font-black text-[#64748B] uppercase tracking-widest">Ir</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {filteredProducts.map((p) => {
                                        // Calculations logic
                                        const isCritical = p.available < 0; // If negative it's highly critical
                                        const isLow = p.available === p.minStock;

                                        return (
                                            <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group" onClick={() => router.push(`/dashboard/inventario/consulta/${p.id}`)}>
                                                <td className="px-4 py-3 text-xs font-black text-[#0F172A] uppercase whitespace-nowrap">
                                                    {p.reference}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] font-bold text-[#475569] uppercase truncate max-w-[200px]" title={p.description}>
                                                    {p.description}
                                                </td>
                                                <td className="px-4 py-3 text-[10px] font-mono font-bold text-[#64748B]">
                                                    {p.barcode}
                                                </td>
                                                <td className="px-4 py-3 text-right text-xs font-black font-mono text-[#D97706] bg-[#FFFBEB]/20 border-l border-[#E2E8F0]">
                                                    {Number(p.minStock).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-[13px] font-black font-mono text-[#2563EB]">
                                                    {Number(p.quantity).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-xs font-bold font-mono text-[#64748B]">
                                                    {Number(p.incoming).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right text-xs font-black font-mono text-[#DC2626] bg-[#FEF2F2]/20 border-x border-[#E2E8F0]">
                                                    {Number(p.reserved).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right bg-[#F0FDF4]/20 border-r border-[#E2E8F0]">
                                                    <span className={`text-sm font-black font-mono ${isCritical ? 'text-[#DC2626]' : (isLow ? 'text-[#D97706]' : 'text-[#16A34A]')}`}>
                                                        {Number(p.available).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-[10px] font-mono text-[#475569]">
                                                    {p.lastPurchaseDate ? new Date(p.lastPurchaseDate).toLocaleDateString() : '---'}
                                                </td>
                                                <td className="px-4 py-3 text-center text-[10px] font-mono text-[#475569]">
                                                    {p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : '---'}
                                                </td>
                                                <td className="px-4 py-3 text-[10px] font-black text-[#0F172A] uppercase">
                                                    {p.brandName}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center items-center w-6 h-6 rounded border border-transparent group-hover:bg-white group-hover:border-[#E2E8F0] shadow-sm text-[#94A3B8] transition-all">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Tarjeta Resumen/Footer */}
                    {!loading && filteredProducts.length > 0 && (
                        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
                            <span className="text-xs font-black text-[#64748B] uppercase tracking-widest">
                                TOTAL DE PRODUCTOS EN ALERTA: <span className="text-[#DC2626]">{filteredProducts.length}</span>
                            </span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
