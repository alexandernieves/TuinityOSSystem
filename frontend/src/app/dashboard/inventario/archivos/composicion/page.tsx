'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Edit, Trash2, X, Cpu,
    List, Grid3X3,
    AlertCircle, Info, ArrowLeft, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { ActionButton } from '@/components/shared/ActionButton';
import { Package } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Composition {
    id: string;
    name: string;
    description?: string | null;
    _count?: { products: number };
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }
interface ApiResponse {
    items: Composition[];
    meta: ApiMeta;
}

// ─── PRODUCT COUNT BADGE ─────────────────────────────────────────────────────
function ProductCountBadge({ count }: { count: number }) {
    return (
        <StatusBadge
            status={count > 0 ? 'optimo' : 'default'}
            label={`${count} producto${count !== 1 ? 's' : ''}`}
        />
    );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
interface FormModalProps {
    composition?: Composition | null;
    saving: boolean;
    onSave: (data: { name: string; description: string }) => void;
    onClose: () => void;
}

function CompositionFormModal({ composition, saving, onSave, onClose }: FormModalProps) {
    const isEdit = !!composition;
    const [name, setName] = useState(composition?.name ?? '');
    const [desc, setDesc] = useState(composition?.description ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('El nombre de la composición es requerido'); return; }
        onSave({ name: name.trim(), description: desc.trim() });
    };

    const labelCls = "text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5";
    const inputCls = "w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all font-medium";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-[#F59E0B]" />
                        </div>
                        <div>
                            <p className="text-[9px] text-[#2563EB] font-black uppercase tracking-widest mb-0.5">Gestión de Inventario</p>
                            <h2 className="text-base font-black text-[#0F172A] uppercase tracking-tight">
                                {isEdit ? 'Editar Composición' : 'Nueva Composición'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-all">
                        <X className="w-4 h-4 text-[#64748B]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#FBFCFE]">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-4 bg-[#F59E0B] rounded-full" />
                            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Información</h3>
                        </div>
                        <div>
                            <label className={labelCls}>Nombre / Tipo de Material <span className="text-red-500">*</span></label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value.toUpperCase())}
                                placeholder="Ej: ALGODÓN 100%, POLIÉSTER, CUERO..."
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Descripción / Observaciones</label>
                            <textarea
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Breve descripción del material o composición del producto..."
                                rows={3}
                                className={inputCls + " resize-none"}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold border border-[#E2E8F0] text-[#0F172A] rounded-xl hover:bg-[#F8FAFC] transition-all bg-white">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-bold bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8] transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                        >
                            {saving ? <AlertCircle className="w-4 h-4 animate-spin" /> : null}
                            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── DELETE DIALOG ────────────────────────────────────────────────────────────
function DeleteDialog({ composition, onConfirm, onCancel }: { composition: Composition; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-[#DC2626]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight">Eliminar Composición</h3>
                        <p className="text-sm text-[#475569] font-medium">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-xl p-3 mb-5 text-center">
                    <span className="text-sm text-[#DC2626] font-black uppercase tracking-wide">{composition.name}</span>
                </div>
                <p className="text-sm text-[#475569] mb-5 leading-relaxed font-medium">
                    ¿Estás seguro de que deseas eliminar esta composición? Los productos asociados podrían quedar sin referencia de material.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm border border-[#E2E8F0] bg-white rounded-xl hover:bg-[#F7F9FC] transition-colors text-[#475569] font-bold">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm bg-[#DC2626] text-white rounded-xl hover:bg-[#B91C1C] transition-colors font-black">
                        Sí, eliminar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function ListSkeleton() {
    return (
        <div className="divide-y divide-[#E2E8F0]">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="px-4 py-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CompositionsPage() {
    const router = useRouter();
    const LIMIT = 10;
    const [isMounted, setIsMounted] = useState(false);
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [currentPage, setCurrentPage] = useState(1);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editComposition, setEditComposition] = useState<Composition | null>(null);
    const [deleteComposition, setDeleteComposition] = useState<Composition | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const loadCompositions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api<ApiResponse>(`/compositions?limit=${LIMIT}&page=${currentPage}&search=${search}`);
            if (res && typeof res === 'object' && Array.isArray(res.items)) {
                setCompositions(res.items);
                if (res.meta) setMeta(res.meta);
            } else {
                setCompositions([]);
            }
        } catch (err) {
            console.error('API Error:', err);
            toast.error('Error al cargar composiciones');
            setCompositions([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => {
        if (isMounted) {
            loadCompositions();
        }
    }, [isMounted, loadCompositions]);

    if (!isMounted) return null;

    const handleSave = async (data: { name: string; description: string }) => {
        setSaving(true);
        try {
            if (editComposition) {
                await api(`/compositions/${editComposition.id}`, { method: 'PATCH', body: data });
                toast.success('Composición actualizada');
            } else {
                await api('/compositions', { method: 'POST', body: data });
                toast.success('Composición creada');
            }
            setShowFormModal(false);
            setEditComposition(null);
            loadCompositions();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteComposition) return;
        try {
            await api(`/compositions/${deleteComposition.id}`, { method: 'DELETE' });
            toast.success('Composición eliminada');
            setDeleteComposition(null);
            loadCompositions();
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar');
        }
    };

    const withProducts = compositions.filter(c => (c._count?.products || 0) > 0).length;
    const withoutProducts = compositions.filter(c => (c._count?.products || 0) === 0).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC]" suppressHydrationWarning>
            <AnimatePresence>
                {(showFormModal || editComposition) && (
                    <CompositionFormModal
                        composition={editComposition}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => { setShowFormModal(false); setEditComposition(null); }}
                    />
                )}
                {deleteComposition && (
                    <DeleteDialog
                        composition={deleteComposition}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteComposition(null)}
                    />
                )}
            </AnimatePresence>

            {/* Sticky Header Area */}
            <div className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md pt-6 pb-2">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white border border-[#E2E8F0] shadow-lg rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-11 h-11 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                <ArrowLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 text-[9px] font-black tracking-wider rounded">
                                        GESTIÓN DE ARCHIVOS
                                    </span>
                                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest hidden sm:block">Sync v4.2</span>
                                </div>
                                <h1 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight leading-none">
                                    Composiciones
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setShowFormModal(true)}
                                icon={Plus}
                                label="Nueva Composición"
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="space-y-6">
                {/* STATS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard label="Total Composiciones" value={meta.total} icon={Cpu} color="#F59E0B" loading={loading} />
                    <StatsCard label="Con Productos" value={withProducts} icon={Package} color="#16A34A" loading={loading} />
                    <StatsCard label="Sin Productos" value={withoutProducts} icon={AlertCircle} color="#DC2626" loading={loading} />
                    <StatsCard label="Páginas" value={meta.totalPages} icon={Layers} color="#7C3AED" loading={loading} />
                </div>

                {/* TABLE / GRID */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    {/* Table toolbar */}
                    <div className="p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-sm w-full relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o descripción..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-sm transition-all text-[#0F172A] font-medium"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm">
                                <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#2563EB] text-white' : 'text-[#475569] hover:bg-[#F7F9FC]'}`}><List className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('grid')} className={`p-2.5 border-l border-[#E2E8F0] transition-colors ${viewMode === 'grid' ? 'bg-[#2563EB] text-white' : 'text-[#475569] hover:bg-[#F7F9FC]'}`}><Grid3X3 className="w-4 h-4" /></button>
                            </div>
                            <div className="bg-[#F59E0B]/5 px-4 py-2 rounded-xl border border-[#F59E0B]/10">
                                <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">{meta.total} REGISTROS</span>
                            </div>
                        </div>
                    </div>

                    {/* List View */}
                    {viewMode === 'list' ? (
                        <DataTable
                            columns={[
                                {
                                    header: 'Composición / Material',
                                    key: 'name',
                                    render: (comp) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/10 shrink-0">
                                                <Cpu className="w-5 h-5 text-[#F59E0B]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#0F172A] uppercase tracking-tight">{comp.name}</span>
                                                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Material / Composición</span>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Descripción',
                                    key: 'description',
                                    render: (comp) => <p className="text-sm text-[#475569] line-clamp-1 max-w-xs font-medium">{comp.description || '—'}</p>
                                },
                                {
                                    header: 'Productos',
                                    key: 'products',
                                    align: 'center' as const,
                                    render: (comp) => <ProductCountBadge count={comp._count?.products || 0} />
                                },
                                {
                                    header: 'Acciones',
                                    key: 'actions',
                                    align: 'right' as const,
                                    render: (comp) => (
                                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => setEditComposition(comp)}
                                                className="p-2 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteComposition(comp)}
                                                className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            data={compositions}
                            loading={loading}
                            onRowClick={setEditComposition}
                        />
                    ) : (
                        /* Grid View */
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-[#F8FAFC]">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-5 border border-[#E2E8F0] space-y-3 animate-pulse">
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))
                            ) : compositions.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-[#F59E0B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Cpu className="w-10 h-10 text-[#F59E0B]" />
                                    </div>
                                    <p className="text-base font-black text-[#94A3B8] uppercase tracking-widest">Sin Composiciones</p>
                                    <p className="text-sm text-[#94A3B8] mt-1">Crea tu primera composición usando el botón superior</p>
                                </div>
                            ) : compositions.map(comp => (
                                <motion.div
                                    key={comp.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:shadow-md transition-all group flex flex-col relative overflow-hidden cursor-pointer"
                                    onClick={() => setEditComposition(comp)}
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-bl-full pointer-events-none" />
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/10">
                                            <Cpu className="w-6 h-6 text-[#F59E0B]" />
                                        </div>
                                        <ProductCountBadge count={comp._count?.products || 0} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-[#0F172A] mb-1 uppercase tracking-tight line-clamp-1">{comp.name}</h3>
                                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-3">— Material</p>
                                        <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">{comp.description || 'Sin descripción'}</p>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-[#F1F5F9] flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => setEditComposition(comp)} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleteComposition(comp)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={meta.totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Info Banner */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm">
                        <Info className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider mb-1">Mantenimiento de Composiciones</h4>
                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            Este catálogo centraliza todos los tipos de composición y materiales registrados en el sistema. Defina valores como "Algodón 100%",
                            "Poliéster", "Cuero Genuino", "Madera MDF", entre otros. Las composiciones son esenciales para el etiquetado de productos,
                            cumplimiento normativo y reportes de inventario.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
