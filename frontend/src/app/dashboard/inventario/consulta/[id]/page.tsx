'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, FileText, History, Box, Tag, Globe, Settings2, Barcode, Scale, Building, MoveUpRight, MoveDownRight, Calculator, FileCheck2, Image as ImageIcon, Database
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface ProductDetail {
    id: string;
    description: string;
    internalReference: string | null;
    barcodes: { barcode: string }[];
    price_a: number;
    price_b: number;
    price_c: number;
    price_d: number;
    price_e: number;
    lastCifCost: number;
    minStock: number;
    unitOfMeasure: string;
    unitsPerBox: number;
    boxesPerPallet: number | null;
    volume: number;
    volumeCubicFeet: number | null;
    weight: number;
    showroomCode: string | null;
    mainImageUrl: string | null;

    brand: { name: string } | null;
    category: { name: string } | null;
    origin: { name: string } | null;
    tariff: { code: string } | null;
    composition: { name: string } | null;

    inventory: {
        branchId: string;
        quantity: number;
        reserved: number;
    }[];
}

interface InventoryMovement {
    id: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    quantity: number;
    reason: string;
    referenceId: string | null;
    createdBy: string;
    createdAt: string;
    branch: { name: string };
}

export default function DetalleProductoPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };

    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [movements, setMovements] = useState<InventoryMovement[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'GENERALES' | 'HISTORICO'>('GENERALES');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch product details
            const prodRes = await api<ProductDetail>(`/products/${id}`);
            setProduct(prodRes);

            // Fetch movements Kardex
            const moveRes = await api<InventoryMovement[]>(`/inventory/movements/${id}`);
            setMovements(moveRes);

        } catch (e: any) {
            console.error('Error fetching details:', e);
            toast.error(e.message || 'Error al cargar detalle de producto');
            router.push('/dashboard/inventario/consulta');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        setMounted(true);
        loadData();
    }, [loadData]);

    if (!mounted) return <div className="min-h-screen bg-[#F7F9FC]" suppressHydrationWarning />;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin" />
                <p className="mt-4 text-sm font-black text-[#64748B] uppercase tracking-widest animate-pulse">Cargando Ficha Operativa...</p>
            </div>
        );
    }

    if (!product) return null;

    // Calcular totales de inventario (Stock Global)
    const existenciasGlobales = product.inventory?.reduce((acc, inv) => acc + Number(inv.quantity), 0) || 0;
    const reservasGlobales = product.inventory?.reduce((acc, inv) => acc + Number(inv.reserved), 0) || 0;
    const porLlegarGlobal = 0; // Pendiente integración con Compras
    const disponibleGlobal = existenciasGlobales - reservasGlobales + porLlegarGlobal;

    return (
        <div className="min-h-screen bg-[#F7F9FC] pb-24" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">

                {/* Header Superior - Similar a Dynamo */}
                <div className="bg-white border border-[#E2E8F0] px-6 py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm rounded-2xl gap-4 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.push('/dashboard/inventario/consulta')} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-[#2563EB]/20">
                                    REF: {product.internalReference || 'S/N'}
                                </span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-[#0F172A] uppercase tracking-tight">{product.description}</h1>
                        </div>
                    </div>
                    {/* Botones de Acción Superiores */}
                    <div className="flex gap-2">
                        <button onClick={loadData} className="px-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-black text-[#0F172A] uppercase hover:bg-white transition-all shadow-sm border-b-4 active:border-b active:translate-y-[3px]">
                            Refrescar Kardex
                        </button>
                    </div>
                </div>

                {/* Tabs de Navegación (Estilo Dynamo Modernizado) */}
                <div className="flex gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('GENERALES')}
                        className={`px-5 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'GENERALES' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] border border-b-0 border-[#E2E8F0]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Generales
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORICO')}
                        className={`px-5 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORICO' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] border border-b-0 border-[#E2E8F0]'}`}
                    >
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4" /> Movimiento Histórico
                        </div>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* ===== TAB GENERALES ===== */}
                    {activeTab === 'GENERALES' && (
                        <motion.div
                            key="generales"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                        >
                            {/* Columna Izquierda: Datos del Producto */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Sección de Clasificación */}
                                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] pb-3">
                                        <Tag className="w-5 h-5 text-[#2563EB]" />
                                        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Clasificación Básica</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Grupo / Categoría</p>
                                            <p className="text-sm font-bold text-[#0F172A] uppercase">{product.category?.name || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Marca</p>
                                            <p className="text-sm font-bold text-[#0F172A] uppercase">{product.brand?.name || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">País Origen</p>
                                            <p className="text-sm font-bold text-[#0F172A] uppercase">{product.origin?.name || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Composición</p>
                                            <p className="text-sm font-bold text-[#0F172A] uppercase">{product.composition?.name || '---'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Logística */}
                                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 border-b border-[#E2E8F0] pb-3">
                                        <Box className="w-5 h-5 text-[#D97706]" />
                                        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Variables Logísticas</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Cód. Barra (Principal)</p>
                                            <p className="text-xs font-mono font-bold text-[#0F172A] uppercase bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded inline-block">
                                                {product.barcodes?.length > 0 ? product.barcodes[0].barcode : '---'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Ref. Showroom</p>
                                            <p className="text-xs font-mono font-bold text-[#0F172A] uppercase bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded inline-block text-red-600 border-red-200">
                                                {product.showroomCode || '---'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Unidad Medida</p>
                                            <p className="text-sm font-bold text-[#0F172A] uppercase">{product.unitOfMeasure || '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Arancel Aduanal</p>
                                            <p className="text-sm font-mono font-bold text-[#0F172A] uppercase">{product.tariff?.code || '---'}</p>
                                        </div>
                                        {/* Divider */}
                                        <div className="col-span-2 border-t border-[#E2E8F0] my-2"></div>

                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Cant. x Bulto</p>
                                            <p className="text-sm font-mono font-bold text-[#0F172A] uppercase">{product.unitsPerBox || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Cant. x Paleta</p>
                                            <p className="text-sm font-mono font-bold text-[#0F172A] uppercase">{product.boxesPerPallet || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Metros Cúbicos (m3)</p>
                                            <p className="text-sm font-mono font-bold text-[#0F172A] uppercase">{Number(product.volume || 0).toFixed(5)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Pies Cúbicos (ft3)</p>
                                            <p className="text-sm font-mono font-bold text-[#0F172A] uppercase">{Number(product.volumeCubicFeet || 0).toFixed(5)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Kilos x Bulto</p>
                                            <p className="text-sm font-mono font-bold text-[#0F172A] uppercase">{Number(product.weight || 0).toFixed(4)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Inventario, Precios y Foto */}
                            <div className="lg:col-span-5 space-y-6">

                                {/* Existencia y Disponibilidad */}
                                <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 border-b border-[#E2E8F0] pb-3">
                                        <Database className="w-5 h-5 text-[#16A34A]" />
                                        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Existencia Global</h3>
                                    </div>

                                    <div className="grid grid-cols-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden mb-4">
                                        <div className="p-3 text-center border-r border-[#E2E8F0] bg-white">
                                            <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-1">Existencia</p>
                                            <p className="text-lg font-black font-mono text-[#0F172A]">{existenciasGlobales}</p>
                                        </div>
                                        <div className="p-3 text-center border-r border-[#E2E8F0]">
                                            <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-1 text-opacity-70">Por Llegar</p>
                                            <p className="text-lg font-black font-mono text-[#64748B] text-opacity-70">+{porLlegarGlobal}</p>
                                        </div>
                                        <div className="p-3 text-center border-r border-[#E2E8F0]">
                                            <p className="text-[9px] font-black text-[#DC2626] uppercase tracking-widest mb-1">Separadas</p>
                                            <p className="text-lg font-black font-mono text-[#DC2626]">-{reservasGlobales}</p>
                                        </div>
                                        <div className="p-3 text-center bg-[#F0FDF4]">
                                            <p className="text-[9px] font-black text-[#16A34A] uppercase tracking-widest mb-1">Disponible</p>
                                            <p className="text-lg font-black font-mono text-[#16A34A]">{disponibleGlobal}</p>
                                        </div>
                                    </div>

                                    {/* Mínimo de inventario */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-[#FFFBEB] rounded-lg border border-[#D97706]/20">
                                        <span className="text-[10px] font-black text-[#D97706] uppercase tracking-widest">Alerta Mínima General</span>
                                        <span className="font-mono font-black text-[#0F172A]">{product.minStock}</span>
                                    </div>
                                </div>

                                {/* Precios y Foto */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Tabla de Precios */}
                                    <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm h-full">
                                        <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-3 pb-2 border-b border-[#E2E8F0]">Lista de Precio</h3>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Precio A', value: product.price_a },
                                                { label: 'Precio B', value: product.price_b },
                                                { label: 'Precio C', value: product.price_c },
                                                { label: 'Precio D', value: product.price_d },
                                                { label: 'Precio E', value: product.price_e },
                                            ].map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-1 border-b border-[#E2E8F0] border-dashed last:border-0">
                                                    <span className="text-xs font-black text-[#0F172A]">{p.label}</span>
                                                    <span className="font-mono text-sm font-bold text-[#64748B]">${Number(p.value).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">Costo AA.MI (CIF)</span>
                                                <span className="font-mono text-sm font-black text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#2563EB]/20">${Number(product.lastCifCost).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Foto */}
                                    <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center h-full min-h-[200px]">
                                        {product.mainImageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={product.mainImageUrl} alt="Product" className="object-contain w-full h-full max-h-[160px] rounded-lg" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <ImageIcon className="w-10 h-10 text-[#64748B]" />
                                                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest text-center">FOTO NO<br />DISPONIBLE</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* ===== TAB HISTORICO KARDEX ===== */}
                    {activeTab === 'HISTORICO' && (
                        <motion.div
                            key="historico"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden"
                        >
                            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
                                    <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Kardex Físico - Últimos Tiempos</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#F0FDF4] border border-[#16A34A] rounded-sm" /><span className="text-[9px] font-black text-[#475569] uppercase">Entradas</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#FEF2F2] border border-[#DC2626] rounded-sm" /><span className="text-[9px] font-black text-[#475569] uppercase">Salidas</span></div>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[400px]">
                                {movements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <History className="w-8 h-8 text-[#CBD5E1] mb-2" />
                                        <p className="text-xs font-black text-[#64748B] uppercase tracking-widest">No hay movimientos registrados</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-white border-b-2 border-[#E2E8F0]">
                                                <th className="px-5 py-3 text-[9px] font-black text-[#64748B] uppercase tracking-widest">Documento / Referencia</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-[#64748B] uppercase tracking-widest">Fecha y Hora</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-[#64748B] uppercase tracking-widest">Descripción / Razón</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-[#64748B] uppercase tracking-widest">Bodega (Sucursal)</th>
                                                <th className="px-5 py-3 text-right text-[9px] font-black text-[#16A34A] uppercase tracking-widest bg-[#F0FDF4]">Entradas (In)</th>
                                                <th className="px-5 py-3 text-right text-[9px] font-black text-[#DC2626] uppercase tracking-widest bg-[#FEF2F2]">Salidas (Out)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E2E8F0]">
                                            {movements.map((mov) => {
                                                const isIn = mov.quantity > 0;
                                                const isOut = mov.quantity < 0;
                                                const qtyAbsolute = Math.abs(mov.quantity);

                                                return (
                                                    <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs font-bold text-[#0F172A] uppercase">{mov.referenceId || '---'}</span>
                                                                <span className="text-[9px] text-[#94A3B8] font-mono">ID: {mov.id.split('-')[0].toUpperCase()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="text-xs font-bold text-[#475569]">
                                                                {new Date(mov.createdAt).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-[10px] font-mono text-[#94A3B8]">
                                                                {new Date(mov.createdAt).toLocaleTimeString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="text-[11px] font-black text-[#0F172A] uppercase max-w-[200px] truncate" title={mov.reason}>
                                                                {mov.reason || mov.type}
                                                            </div>
                                                            <div className="text-[9px] text-[#64748B] font-bold mt-0.5 flex items-center gap-1">
                                                                Usuario: {mov.createdBy === 'system' ? 'SISTEMA' : 'ADMIN'}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#475569] uppercase">
                                                                <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
                                                                {mov.branch?.name}
                                                            </div>
                                                        </td>
                                                        {/* Columna ENTRADAS */}
                                                        <td className="px-5 py-3 text-right bg-[#F0FDF4]/30 border-l border-[#E2E8F0]">
                                                            {isIn && (
                                                                <div className="flex items-center justify-end gap-1 text-[#16A34A]">
                                                                    <MoveUpRight className="w-3.5 h-3.5" />
                                                                    <span className="font-mono font-black text-sm">{qtyAbsolute}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        {/* Columna SALIDAS */}
                                                        <td className="px-5 py-3 text-right bg-[#FEF2F2]/30 border-l border-[#E2E8F0]">
                                                            {isOut && (
                                                                <div className="flex items-center justify-end gap-1 text-[#DC2626]">
                                                                    <MoveDownRight className="w-3.5 h-3.5" />
                                                                    <span className="font-mono font-black text-sm">{qtyAbsolute}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
