'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Edit, Trash2, X, Globe,
    ChevronLeft, ChevronRight, Filter, List, Grid3X3,
    AlertTriangle, AlertCircle, Info, ChevronDown, ArrowLeft,
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { ActionButton } from '@/components/shared/ActionButton';
import { Package, Download, Upload, MapPin } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Origin {
    id: string;
    name: string;
    code?: string | null;
    _count?: { products: number };
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }
interface ApiResponse {
    items: Origin[];
    meta: ApiMeta;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ProductCountBadge({ count }: { count: number }) {
    return (
        <StatusBadge
            status={count > 0 ? 'optimo' : 'default'}
            label={`${count} PRODUCTOS`}
        />
    );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
interface FormModalProps {
    origin?: Origin | null;
    saving: boolean;
    onSave: (data: { name: string; code: string }) => void;
    onClose: () => void;
}

function OriginFormModal({ origin, saving, onSave, onClose }: FormModalProps) {
    const isEdit = !!origin;
    const [name, setName] = useState(origin?.name ?? '');
    const [code, setCode] = useState(origin?.code ?? '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('El nombre del país es requerido'); return; }
        onSave({ name: name.trim(), code: code.trim() });
    };

    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5";
    const inputCls = "w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                    <div>
                        <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest mb-0.5">MANTENIMIENTO</p>
                        <h2 className="text-xl font-bold text-[#0F172A] uppercase">
                            {isEdit ? 'Editar Origen' : 'Nuevo Origen'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#FBFCFE]">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-5">
                        <div>
                            <label className={labelCls}>Nombre del País <span className="text-red-500">*</span></label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value.toUpperCase())}
                                placeholder="Ej: PANAMÁ"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Código Numérico (Opcional)</label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="Ej: 001"
                                maxLength={3}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] transition-all bg-white text-[#475569]">
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
function DeleteDialog({ origin, onConfirm, onCancel }: { origin: Origin; onConfirm: () => void; onCancel: () => void }) {
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
                        <h3 className="text-lg font-semibold text-[#0F172A]">Eliminar Origen</h3>
                        <p className="text-sm text-[#475569]">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg p-3 mb-5 text-center">
                    <span className="text-sm text-[#DC2626] font-bold uppercase">{origin.name}</span>
                </div>
                <p className="text-sm text-[#475569] mb-5 leading-relaxed">¿Estás seguro de que deseas eliminar este país de origen? Asegúrate de que no haya productos vinculados.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] font-bold">
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
export default function OriginsPage() {
    const router = useRouter();
    const [origins, setOrigins] = useState<Origin[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 12, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editOrigin, setEditOrigin] = useState<Origin | null>(null);
    const [deleteOrigin, setDeleteOrigin] = useState<Origin | null>(null);

    const loadOrigins = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api<ApiResponse>(`/origins?limit=${meta.limit}&page=${currentPage}&search=${search}`);
            setOrigins(res.items);
            setMeta(res.meta);
        } catch {
            toast.error('Error al cargar orígenes');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, meta.limit]);

    useEffect(() => { loadOrigins(); }, [loadOrigins]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleSave = async (data: { name: string; code: string }) => {
        setSaving(true);
        try {
            if (editOrigin) {
                await api(`/origins/${editOrigin.id}`, { method: 'PATCH', body: data });
                toast.success('Origen actualizado');
            } else {
                await api('/origins', { method: 'POST', body: data });
                toast.success('Origen creado');
            }
            setShowFormModal(false);
            setEditOrigin(null);
            loadOrigins();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteOrigin) return;
        try {
            await api(`/origins/${deleteOrigin.id}`, { method: 'DELETE' });
            toast.success('Origen eliminado');
            setDeleteOrigin(null);
            loadOrigins();
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar');
        }
    };

    const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

    if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AnimatePresence>
                {(showFormModal || editOrigin) && (
                    <OriginFormModal
                        origin={editOrigin}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => { setShowFormModal(false); setEditOrigin(null); }}
                    />
                )}
                {deleteOrigin && (
                    <DeleteDialog
                        origin={deleteOrigin}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteOrigin(null)}
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
                                    Países de Origen
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setShowFormModal(true)}
                                icon={Plus}
                                label="Nuevo Origen"
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* CONTENT */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-md w-full relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar país..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-sm transition-all text-[#0F172A] font-medium"
                            />
                        </div>
                        <div className="px-3 py-1.5 bg-[#F8FAFC] rounded-full border border-[#E2E8F0]">
                            <p className="text-xs font-semibold text-[#475569]">
                                Total: <span className="text-[#2563EB]">{meta.total}</span> países
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : origins.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 mb-4 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                                <Globe className="w-10 h-10 text-[#CBD5E1]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0F172A] mb-1 uppercase">Sin Orígenes</h3>
                            <p className="text-sm text-[#94A3B8] mb-8 max-w-xs">No hay países registrados para el origen de productos.</p>
                            <button onClick={() => setShowFormModal(true)} className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8] transition-all">
                                Crear mi primer origen
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">País de Origen</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Código</th>
                                        <th className="text-center px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Productos Asociados</th>
                                        <th className="text-right px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {origins.map(origin => (
                                        <tr key={origin.id} className="hover:bg-[#F8FAFC]/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] font-bold text-xs uppercase">
                                                        {origin.name.substring(0, 2)}
                                                    </div>
                                                    <span className="text-sm font-bold text-[#0F172A] uppercase tracking-tight">{origin.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-[#475569]">
                                                {origin.code || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <ProductCountBadge count={origin._count?.products || 0} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={() => setEditOrigin(origin)} className="p-1 text-[#F59E0B] hover:scale-110 transition-transform"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeleteOrigin(origin)} className="p-1 text-[#DC2626] hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {meta.totalPages > 1 && (
                        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                            <p className="text-xs font-bold text-[#64748B] uppercase">Página {currentPage} de {meta.totalPages}</p>
                            <div className="flex gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-[#E2E8F0] rounded-xl disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                {pages.map(n => (
                                    <button key={n} onClick={() => setCurrentPage(n)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === n ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}>{n}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))} disabled={currentPage === meta.totalPages} className="p-2 bg-white border border-[#E2E8F0] rounded-xl disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm">
                        <Info className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider mb-1">Catálogo de Orígenes</h4>
                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            Este registro permite estandarizar los países de fabricación de sus productos utilizando el sistema de codificación de 3 dígitos (ej: 001 para Panamá).
                            Esta estandarización es crucial para el cumplimiento aduanero y reportes operativos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
