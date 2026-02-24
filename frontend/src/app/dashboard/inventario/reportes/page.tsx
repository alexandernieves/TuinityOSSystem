'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, RefreshCw, BarChart2, List, Hash,
    FileText, Tag, Package, Boxes, ExternalLink, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ReportDefinition {
    id: string;
    nombre: string;
    codigo: string;
    description: string;
    icon: any;
    path: string;
}

export default function InventoryReportsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // List of reports replicating Dynamo structure
    const reports: ReportDefinition[] = [
        {
            id: '112',
            nombre: 'Costo del Inventario',
            codigo: '112',
            description: 'Valorización detallada basada en costos CIF y Promedio Ponderado.',
            icon: BarChart2,
            path: '/dashboard/inventario/reportes/valoracion'
        },
        {
            id: '153',
            nombre: 'Listado de Compras',
            codigo: '153',
            description: 'Historial completo de órdenes de compra recibidas.',
            icon: List,
            path: '/dashboard/inventario/compras'
        },
        {
            id: '111',
            nombre: 'Listado de Existencia',
            codigo: '111',
            description: 'Consulta de stock actual por sucursales y marcas.',
            icon: Boxes,
            path: '/dashboard/inventario/reportes/existencias'
        },
        {
            id: '154',
            nombre: 'Listado de Ordenes de Compras Pendientes',
            codigo: '154',
            description: 'Seguimiento de mercancía por llegar y órdenes en tránsito.',
            icon: Calendar,
            path: '/dashboard/inventario/compras/ordenes'
        },
        {
            id: '110',
            nombre: 'Listado de Precios',
            codigo: '110',
            description: 'Resumen de precios de venta y márgenes de utilidad.',
            icon: Tag,
            path: '/dashboard/inventario/productos' // Redirigir a malla principal con export
        },
        {
            id: '109',
            nombre: 'Listado de Referencias',
            codigo: '109',
            description: 'Catálogo de códigos internos y referencias de fábrica.',
            icon: Hash,
            path: '/dashboard/inventario/consulta'
        },
        {
            id: '157',
            nombre: 'Listado de Transacciones',
            codigo: '157',
            description: 'Auditoría de todos los movimientos (Kardex) del sistema.',
            icon: FileText,
            path: '/dashboard/inventario/reportes/movimientos'
        },
        {
            id: '149',
            nombre: 'Reporte de Compras Total por Proveedor',
            codigo: '149',
            description: 'Análisis de volumen de compras agrupado por proveedor.',
            icon: Package,
            path: '/dashboard/inventario/reportes/compras-proveedor'
        }
    ];

    useEffect(() => { setMounted(true); }, []);

    const filteredReports = reports.filter(r =>
        r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.codigo.includes(searchQuery)
    );

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior estilo Dynamo/Evolution */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/inventario')}
                            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#2563EB]/10">
                                    Módulo Central
                                </span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Reportes de Inventario</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar reporte por nombre o código..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all outline-none w-64 md:w-80"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid de Reportes - Estilo Dynamo Tabla Listado */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden min-h-[600px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-[#64748B] uppercase tracking-widest w-24">Código</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-[#64748B] uppercase tracking-widest">Nombre del Reporte</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-[#64748B] uppercase tracking-widest hidden md:table-cell">Descripción</th>
                                <th className="px-6 py-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {filteredReports.map((report) => (
                                <tr
                                    key={report.id}
                                    onClick={() => router.push(report.path)}
                                    className="hover:bg-[#F8FAFC] cursor-pointer transition-all group"
                                >
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-lg border border-[#2563EB]/10">
                                            {report.codigo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#F1F5F9] text-[#64748B] rounded-lg group-hover:bg-[#2563EB] group-hover:text-white transition-all">
                                                <report.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors uppercase">
                                                {report.nombre}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 hidden md:table-cell">
                                        <p className="text-xs text-[#64748B] font-medium leading-relaxed max-w-md">
                                            {report.description}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mr-2">Ejecutar</span>
                                            <ExternalLink className="w-4 h-4 text-[#2563EB]" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredReports.length === 0 && (
                        <div className="py-24 text-center">
                            <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-[#CBD5E1]">
                                <Search className="w-8 h-8 text-[#94A3B8]" />
                            </div>
                            <h3 className="text-sm font-black text-[#0F172A] uppercase">Sin resultados</h3>
                            <p className="text-xs text-[#64748B] mt-1">No se encontró ningún reporte con ese código o nombre.</p>
                        </div>
                    )}
                </div>

                {/* Footer Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pt-4">
                    <span>Sistema de Inteligencia de Negocios</span>
                    <div className="w-1 h-1 bg-[#CBD5E1] rounded-full"></div>
                    <span>Tuinity Evolution OS</span>
                </div>
            </div>
        </div>
    );
}
