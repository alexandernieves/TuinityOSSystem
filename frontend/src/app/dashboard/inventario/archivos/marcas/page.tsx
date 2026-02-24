'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Edit, Trash2, X, Tag,
    ChevronLeft, ChevronRight, Filter, List, Grid3X3,
    AlertTriangle, AlertCircle, Info, ChevronDown, ArrowLeft,
    Image as ImageIcon, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SharedProductImage } from '@/components/shared/SharedProductImage';
import { Pagination } from '@/components/shared/Pagination';
import { ActionButton } from '@/components/shared/ActionButton';
import { Package, Download, Upload } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Brand {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    _count?: { products: number };
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }
interface ApiResponse {
    items: Brand[];
    meta: ApiMeta;
}

// ─── STATUS BADGE (Helper for Brand consistency) ─────────────────────────────
function ProductCountBadge({ count }: { count: number }) {
    return (
        <StatusBadge
            status={count > 0 ? 'optimo' : 'default'}
            label={`${count} UNIDADES`}
        />
    );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
interface FormModalProps {
    brand?: Brand | null;
    saving: boolean;
    onSave: (data: FormData) => void;
    onClose: () => void;
}

function BrandFormModal({ brand, saving, onSave, onClose }: FormModalProps) {
    const isEdit = !!brand;
    const [name, setName] = useState(brand?.name ?? '');
    const [desc, setDesc] = useState(brand?.description ?? '');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(brand?.imageUrl ?? null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('El nombre de la marca es requerido'); return; }

        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', desc.trim());
        if (image) formData.append('image', image);

        onSave(formData);
    };

    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5";
    const inputCls = "w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                    <div>
                        <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest mb-0.5">MANTENIMIENTO</p>
                        <h2 className="text-xl font-bold text-[#0F172A] uppercase">
                            {isEdit ? 'Editar Marca' : 'Nueva Marca'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#FBFCFE]">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-5">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <label className={labelCls}>Logo / Imagen</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center cursor-pointer hover:border-[#3B82F6] hover:bg-[#F8FAFC] transition-all overflow-hidden relative group"
                                >
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-[#94A3B8] mb-1" />
                                            <span className="text-[10px] text-[#94A3B8] font-bold">SUBIR</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex-1 space-y-5">
                                <div>
                                    <label className={labelCls}>Nombre de la Marca <span className="text-red-500">*</span></label>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value.toUpperCase())}
                                        placeholder="Ej: BLACK & WHITE"
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Descripción / Observaciones</label>
                                    <textarea
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        placeholder="Breve descripción de la marca..."
                                        rows={2}
                                        className={inputCls + " resize-none"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] transition-all bg-white">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 text-sm font-bold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <AlertCircle className="w-4 h-4 animate-spin" /> : null}
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── DELETE DIALOG ────────────────────────────────────────────────────────────
function DeleteDialog({ brand, onConfirm, onCancel }: { brand: Brand; onConfirm: () => void; onCancel: () => void }) {
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
                        <h3 className="text-lg font-semibold text-[#0F172A]">Eliminar Marca</h3>
                        <p className="text-sm text-[#475569]">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg p-3 mb-5 text-center">
                    <span className="text-sm text-[#DC2626] font-bold uppercase">{brand.name}</span>
                </div>
                <p className="text-sm text-[#475569] mb-5 leading-relaxed">¿Estás seguro de que deseas eliminar esta marca? Los productos asociados podrían quedar sin referencia de fabricante.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] font-semibold">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors font-bold">
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
export default function BrandsPage() {
    const router = useRouter();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 8, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editBrand, setEditBrand] = useState<Brand | null>(null);
    const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);

    const loadBrands = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api<ApiResponse>(`/brands?limit=${meta.limit}&page=${currentPage}&search=${search}`);
            setBrands(res.items);
            setMeta(res.meta);
        } catch {
            toast.error('Error al cargar marcas');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, meta.limit]);

    useEffect(() => { loadBrands(); }, [loadBrands]);

    const handleSave = async (formData: FormData) => {
        setSaving(true);
        try {
            if (editBrand) {
                await api(`/brands/${editBrand.id}`, { method: 'PATCH', body: formData });
                toast.success('Marca actualizada');
            } else {
                await api('/brands', { method: 'POST', body: formData });
                toast.success('Marca creada');
            }
            setShowFormModal(false);
            setEditBrand(null);
            loadBrands();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteBrand) return;
        try {
            await api(`/brands/${deleteBrand.id}`, { method: 'DELETE' });
            toast.success('Marca eliminada');
            setDeleteBrand(null);
            loadBrands();
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar');
        }
    };

    // Pagination helper
    const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

    if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

    return (
        <div className="min-h-screen bg-[#F8FAFC]" suppressHydrationWarning>
            <AnimatePresence>
                {(showFormModal || editBrand) && (
                    <BrandFormModal
                        brand={editBrand}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => { setShowFormModal(false); setEditBrand(null); }}
                    />
                )}
                {deleteBrand && (
                    <DeleteDialog
                        brand={deleteBrand}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteBrand(null)}
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
                                    <span className="px-2 py-0.5 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-black tracking-wider rounded">
                                        GESTIÓN DE ARCHIVOS
                                    </span>
                                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest hidden sm:block">Sync v4.2</span>
                                </div>
                                <h1 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight leading-none">
                                    Marcas
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setShowFormModal(true)}
                                icon={Plus}
                                label="Crear Marca"
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard label="Total Marcas" value={meta.total} icon={Tag} color="#2563EB" loading={loading} />
                    <StatsCard label="Con Productos" value={brands.filter(b => (b._count?.products || 0) > 0).length} icon={Package} color="#16A34A" loading={loading} />
                    <StatsCard label="Sin Productos" value={brands.filter(b => (b._count?.products || 0) === 0).length} icon={AlertCircle} color="#DC2626" loading={loading} />
                    <StatsCard label="Páginas" value={meta.totalPages} icon={List} color="#7C3AED" loading={loading} />
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-md w-full relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input type="text" placeholder="Buscar por nombre o descripción..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-sm transition-all text-[#0F172A] font-medium" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm">
                                <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-[#2563EB] text-white' : 'text-[#475569] hover:bg-[#F7F9FC]'}`}><List className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('grid')} className={`p-2.5 border-l border-[#E2E8F0] ${viewMode === 'grid' ? 'bg-[#2563EB] text-white' : 'text-[#475569] hover:bg-[#F7F9FC]'}`}><Grid3X3 className="w-4 h-4" /></button>
                            </div>
                            <div className="bg-[#2563EB]/5 px-4 py-2 rounded-xl border border-[#2563EB]/10">
                                <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">{meta.total} REGISTROS</span>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <DataTable
                            columns={[
                                {
                                    header: 'Marca / Fabricante',
                                    key: 'name',
                                    render: (brand) => (
                                        <div className="flex items-center gap-3">
                                            <SharedProductImage src={brand.imageUrl} size={10} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#0F172A] uppercase tracking-tight">{brand.name}</span>
                                                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Fabricante</span>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Descripción General',
                                    key: 'description',
                                    render: (brand) => <p className="text-sm text-[#475569] line-clamp-1 max-w-xs font-medium">{brand.description || '—'}</p>
                                },
                                {
                                    header: 'Productos',
                                    key: 'products',
                                    align: 'center',
                                    render: (brand) => <ProductCountBadge count={brand._count?.products || 0} />
                                },
                                {
                                    header: 'Acciones',
                                    key: 'actions',
                                    align: 'right',
                                    render: (brand) => (
                                        <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setEditBrand(brand)} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/5 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => setDeleteBrand(brand)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/5 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )
                                }
                            ]}
                            data={brands}
                            loading={loading}
                            onRowClick={setEditBrand}
                        />
                    ) : (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-[#F8FAFC]">
                            {brands.map(brand => (
                                <div key={brand.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:shadow-md transition-all group flex flex-col relative overflow-hidden">
                                    <div className="flex items-start justify-between mb-4">
                                        <SharedProductImage src={brand.imageUrl} size={12} />
                                        <StatusBadge
                                            status={(brand._count?.products || 0) > 0 ? 'optimo' : 'default'}
                                            label={(brand._count?.products || 0) > 0 ? 'activo' : 'sin productos'}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-bold text-[#0F172A] mb-1 uppercase tracking-tight line-clamp-1">{brand.name}</h3>
                                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mb-3">— FABRICANTE</p>
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-[#94A3B8] font-medium">Descripción</span>
                                                <span className="text-[#475569] font-bold uppercase truncate max-w-[100px]">{brand.description || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-[#94A3B8] font-medium">Productos</span>
                                                <span className="text-[#0F172A] font-black">{brand._count?.products || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-[#F1F5F9] flex items-center gap-4">
                                        <button className="text-[#94A3B8] hover:text-[#2563EB] transition-colors"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => setEditBrand(brand)} className="text-[#F59E0B] hover:text-[#D97706] transition-colors"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteBrand(brand)} className="text-[#DC2626] hover:text-[#B91C1C] transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={meta.totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Info Card matching Grupos footer style */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm">
                        <Info className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider mb-1">Mantenimiento de Marcas</h4>
                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            Este catálogo centraliza todos los fabricantes registrados en el sistema. Las marcas son esenciales para la categorización
                            en facturación y el seguimiento de stock en tiempo real. Use nombres oficiales para asegurar la integridad de los reportes.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
