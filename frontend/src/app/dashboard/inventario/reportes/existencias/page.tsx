'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Package, FileSpreadsheet, RefreshCw,
    Filter, LayoutGrid, Building2, Tag, Box, ArrowUpDown, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx';

interface BranchStock {
    branchId: string;
    branchName: string;
    quantity: number;
    reserved: number;
    available: number;
}

interface ProductStock {
    id: string;
    reference: string;
    barcode: string;
    description: string;
    brandName: string;
    categoryName: string;
    minStock: number;
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
    branchDetails: BranchStock[];
}

interface Category {
    id: string;
    name: string;
}

interface Brand {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    name: string;
}

export default function ReporteExistenciasPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedBrand, setSelectedBrand] = useState<string>('all');
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ProductStock | 'totalAvailable'; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => { setMounted(true); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Backend responses for categories and brands are paginated: { items: [], meta: {} }
            const [stockData, catsResponse, brsResponse, bchs] = await Promise.all([
                api<ProductStock[]>('/inventory'),
                api<{ items: Category[] }>('/categories?limit=100'),
                api<{ items: Brand[] }>('/brands?limit=100'),
                api<Branch[]>('/branches')
            ]);

            setProducts(stockData || []);
            setCategories(catsResponse?.items || []);
            setBrands(brsResponse?.items || []);
            setBranches(bchs || []);
        } catch (e: any) {
            console.error('Error fetching inventory data:', e);
            toast.error(e.message || 'Error al cargar los datos del inventario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) loadData();
    }, [mounted]);

    const handleSort = (key: keyof ProductStock | 'totalAvailable') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        if (filteredProducts.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const exportData = filteredProducts.map(p => ({
            'REFERENCIA': p.reference,
            'CÓDIGO BARRA': p.barcode,
            'DESCRIPCIÓN': p.description,
            'MARCA': p.brandName,
            'CATEGORÍA': p.categoryName,
            'STOCK MÍNIMO': p.minStock,
            'EXISTENCIA TOTAL': p.totalQuantity,
            'RESERVADO': p.totalReserved,
            'DISPONIBLE': p.totalAvailable,
            ...p.branchDetails.reduce((acc, br) => ({
                ...acc,
                [br.branchName.toUpperCase()]: br.quantity
            }), {})
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invenatario');
        XLSX.writeFile(wb, `Reporte_Existencias_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel exportado correctamente');
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brandName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || p.categoryName === selectedCategory;
        const matchesBrand = selectedBrand === 'all' || p.brandName === selectedBrand;

        // Branch filter matches if the product has record in that branch or we are looking at all
        const matchesBranch = selectedBranch === 'all' || p.branchDetails.some(br => br.branchName === selectedBranch);

        return matchesSearch && matchesCategory && matchesBrand && matchesBranch;
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const aValue = a[key as keyof ProductStock] ?? 0;
        const bValue = b[key as keyof ProductStock] ?? 0;

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (!mounted) return <div className="min-h-screen bg-[#F7F9FC]" />;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl sticky top-0 z-30 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/inventario/reportes')}
                            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#2563EB]/10 flex items-center gap-1.5">
                                    <Package className="w-3 h-3" /> ANALÍTICA DE INVENTARIO
                                </span>
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Reporte de Existencias Global</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="px-5 py-2.5 bg-[#16A34A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#15803d] transition-all shadow-sm flex items-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
                        </button>
                    </div>
                </div>

                {/* Filtros Inteligentes */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#2563EB]" />
                        <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Filtros de Búsqueda</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-4 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar por referencia, código de barras o descripción..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all outline-none uppercase placeholder:normal-case placeholder:font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#64748B] uppercase ml-1 flex items-center gap-1.5">
                                <LayoutGrid className="w-3 h-3" /> Categoría
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] outline-none transition-all cursor-pointer"
                            >
                                <option value="all">Todas las Categorías</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#64748B] uppercase ml-1 flex items-center gap-1.5">
                                <Tag className="w-3 h-3" /> Marca
                            </label>
                            <select
                                value={selectedBrand}
                                onChange={(e) => setSelectedBrand(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] outline-none transition-all cursor-pointer"
                            >
                                <option value="all">Todas las Marcas</option>
                                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-[#64748B] uppercase ml-1 flex items-center gap-1.5">
                                <Building2 className="w-3 h-3" /> Sucursal
                            </label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] outline-none transition-all cursor-pointer"
                            >
                                <option value="all">Consolidado Mundial</option>
                                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setSelectedBrand('all');
                                    setSelectedBranch('all');
                                }}
                                className="w-full px-4 py-2.5 bg-[#F1F5F9] text-[#64748B] text-[10px] font-black uppercase rounded-xl hover:bg-[#E2E8F0] transition-all"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla Maestra */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto min-h-[500px]">
                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB] animate-spin" />
                                <p className="text-xs font-black text-[#94A3B8] uppercase tracking-[0.2em]">Cargando Inventario...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="py-32 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-20 h-20 bg-[#F8FAFC] rounded-3xl flex items-center justify-center mb-6 border border-dashed border-[#CBD5E1]">
                                    <Box className="w-10 h-10 text-[#94A3B8]" />
                                </div>
                                <h3 className="text-lg font-black text-[#0F172A] uppercase">Sin resultados</h3>
                                <p className="text-sm text-[#64748B] mt-2">No encontramos productos que coincidan con los filtros aplicados.</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse min-w-[1400px]">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th onClick={() => handleSort('reference')} className="px-5 py-4 text-left text-[10px] font-black text-[#64748B] uppercase tracking-widest cursor-pointer hover:text-[#2563EB] transition-colors">
                                            <div className="flex items-center gap-2">Referencia <ArrowUpDown className="w-3 h-3" /></div>
                                        </th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-[#64748B] uppercase tracking-widest">Descripción</th>
                                        <th className="px-5 py-4 text-left text-[10px] font-black text-[#64748B] uppercase tracking-widest">Marca / Cat</th>
                                        <th onClick={() => handleSort('totalQuantity')} className="px-5 py-4 text-right text-[10px] font-black text-[#64748B] uppercase tracking-widest cursor-pointer hover:text-[#2563EB] transition-colors">
                                            <div className="flex items-center justify-end gap-2">Existencia <ArrowUpDown className="w-3 h-3" /></div>
                                        </th>
                                        <th className="px-5 py-4 text-right text-[10px] font-black text-[#64748B] uppercase tracking-widest">Reservado</th>
                                        <th onClick={() => handleSort('totalAvailable')} className="px-5 py-4 text-right text-[10px] font-black text-[#64748B] uppercase tracking-widest cursor-pointer hover:text-[#2563EB] transition-colors bg-[#F0FDF4]/50">
                                            <div className="flex items-center justify-end gap-2 text-[#16A34A]">Disponible <ArrowUpDown className="w-3 h-3" /></div>
                                        </th>
                                        {/* Sucursales Dinámicas */}
                                        {selectedBranch === 'all' ? branches.map(br => (
                                            <th key={br.id} className="px-5 py-4 text-right text-[9px] font-black text-[#64748B] uppercase border-l border-[#E2E8F0]/50 tracking-tighter">
                                                {br.name}
                                            </th>
                                        )) : (
                                            <th className="px-5 py-4 text-right text-[10px] font-black text-[#2563EB] uppercase border-l border-[#E2E8F0]">
                                                Stock en {selectedBranch}
                                            </th>
                                        )}
                                        <th className="px-5 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {filteredProducts.map((p) => {
                                        const isLow = p.totalAvailable <= p.minStock && p.minStock > 0;

                                        return (
                                            <tr key={p.id} className="hover:bg-[#F8FAFC] transition-all group cursor-default">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-black text-[#0F172A] bg-[#F1F5F9] px-2 py-1 rounded-md border border-[#E2E8F0]">
                                                        {p.reference}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-[#334155] uppercase leading-tight">{p.description}</span>
                                                        <span className="text-[10px] font-mono text-[#94A3B8] mt-1">{p.barcode}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-[#64748B] uppercase tracking-tighter">{p.brandName}</span>
                                                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase">{p.categoryName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-[13px] font-black text-[#334155]">
                                                    {Number(p.totalQuantity).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 text-right font-mono text-xs font-bold text-[#DC2626]">
                                                    {Number(p.totalReserved).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4 text-right bg-[#F0FDF4]/20 border-r border-[#E2E8F0]/10">
                                                    <span className={`text-[14px] font-black font-mono ${isLow ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                                                        {Number(p.totalAvailable).toLocaleString()}
                                                    </span>
                                                </td>

                                                {/* Celdas de Sucursales */}
                                                {selectedBranch === 'all' ? branches.map(br => {
                                                    const branchStock = p.branchDetails.find(bd => bd.branchId === br.id);
                                                    return (
                                                        <td key={br.id} className="px-5 py-4 text-right font-mono text-xs font-bold text-[#64748B] border-l border-[#E2E8F0]/30 bg-[#F8FAFC]/30">
                                                            {branchStock ? Number(branchStock.quantity).toLocaleString() : '0'}
                                                        </td>
                                                    );
                                                }) : (
                                                    <td className="px-5 py-4 text-right font-mono text-[13px] font-black text-[#2563EB] border-l border-[#E2E8F0] bg-[#EFF6FF]/30">
                                                        {Number(p.branchDetails.find(br => br.branchName === selectedBranch)?.quantity || 0).toLocaleString()}
                                                    </td>
                                                )}

                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/inventario/consulta/${p.id}`)}
                                                        className="p-1.5 opacity-0 group-hover:opacity-100 transition-all text-[#94A3B8] hover:text-[#2563EB] hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] shadow-sm"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer con Resumen */}
                    {!loading && filteredProducts.length > 0 && (
                        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Total Productos</span>
                                    <span className="text-lg font-black text-[#0F172A]">{filteredProducts.length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Items en Stock</span>
                                    <span className="text-lg font-black text-[#2563EB]">
                                        {filteredProducts.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest text-[#16A34A]">Disp. Consolidada</span>
                                    <span className="text-lg font-black text-[#16A34A]">
                                        {filteredProducts.reduce((sum, p) => sum + p.totalAvailable, 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase italic">Valores expresados en unidades del sistema.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
