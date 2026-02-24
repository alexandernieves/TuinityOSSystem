'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Edit, Trash2, X, MapPin, Building2,
    ChevronLeft, ChevronRight, Info, AlertCircle, ArrowLeft,
    Layers, Package, Check
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Warehouse {
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    address: string | null;
    isActive: boolean;
    _count?: { locations: number };
}

interface Location {
    id: string;
    warehouseId: string;
    code: string | null;
    name: string;
    type: 'GENERAL' | 'PASILLO' | 'ESTANTE' | 'ZONA' | 'PISO';
    description: string | null;
    capacity: number | null;
    isActive: boolean;
    warehouse?: { id: string; name: string };
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }

const LOCATION_TYPES = ['GENERAL', 'PASILLO', 'ESTANTE', 'ZONA', 'PISO'] as const;

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    GENERAL: { bg: '#EFF6FF', text: '#2563EB', label: 'General' },
    PASILLO: { bg: '#F0FDF4', text: '#16A34A', label: 'Pasillo' },
    ESTANTE: { bg: '#FFF7ED', text: '#EA580C', label: 'Estante' },
    ZONA: { bg: '#FDF4FF', text: '#9333EA', label: 'Zona' },
    PISO: { bg: '#FFF1F2', text: '#E11D48', label: 'Piso' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
    const c = TYPE_COLORS[type] || TYPE_COLORS.GENERAL;
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: c.bg, color: c.text }}>
            {c.label}
        </span>
    );
}

// ─── WAREHOUSE FORM MODAL ─────────────────────────────────────────────────────
function WarehouseFormModal({ warehouse, saving, onSave, onClose }: {
    warehouse?: Warehouse | null; saving: boolean;
    onSave: (d: any) => void; onClose: () => void;
}) {
    const [name, setName] = useState(warehouse?.name ?? '');
    const [code, setCode] = useState(warehouse?.code ?? '');
    const [description, setDescription] = useState(warehouse?.description ?? '');
    const [address, setAddress] = useState(warehouse?.address ?? '');
    const [isActive, setIsActive] = useState(warehouse?.isActive ?? true);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5";
    const inputCls = "w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#3B82F6] font-bold uppercase tracking-widest">MANTENIMIENTO</p>
                        <h2 className="text-lg font-black text-[#0F172A] uppercase">{warehouse ? 'Editar Almacén' : 'Nuevo Almacén'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full"><X className="w-4 h-4 text-[#64748B]" /></button>
                </div>
                <form id="wh-form" onSubmit={e => { e.preventDefault(); if (!name.trim()) { toast.error('El nombre es requerido'); return; } onSave({ name: name.trim().toUpperCase(), code: code.trim().toUpperCase(), description: description.trim(), address: address.trim(), isActive }); }}
                    className="p-5 space-y-4 overflow-y-auto bg-[#FBFCFE]">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4">
                        <div>
                            <label className={labelCls}>Nombre <span className="text-red-500">*</span></label>
                            <input ref={inputRef} value={name} onChange={e => setName(e.target.value.toUpperCase())} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Código</label>
                            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ALM-001" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Descripción</label>
                            <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Dirección / Ubicación Física</label>
                            <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-[#2563EB]" />
                            <span className="text-sm font-semibold text-[#0F172A]">Activo</span>
                        </label>
                    </div>
                </form>
                <div className="p-4 border-t border-[#E2E8F0] flex justify-end gap-3 bg-white">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-[#F8FAFC]">Cancelar</button>
                    <button type="submit" form="wh-form" disabled={saving} className="px-5 py-2 text-sm font-bold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 flex items-center gap-2">
                        {saving ? <AlertCircle className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── LOCATION FORM MODAL ──────────────────────────────────────────────────────
function LocationFormModal({ location, warehouses, saving, onSave, onClose }: {
    location?: Location | null; warehouses: Warehouse[]; saving: boolean;
    onSave: (d: any) => void; onClose: () => void;
}) {
    const [warehouseId, setWarehouseId] = useState(location?.warehouseId ?? (warehouses[0]?.id ?? ''));
    const [name, setName] = useState(location?.name ?? '');
    const [code, setCode] = useState(location?.code ?? '');
    const [type, setType] = useState<string>(location?.type ?? 'GENERAL');
    const [description, setDescription] = useState(location?.description ?? '');
    const [capacity, setCapacity] = useState<string>(location?.capacity?.toString() ?? '');
    const [isActive, setIsActive] = useState(location?.isActive ?? true);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5";
    const inputCls = "w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#F59E0B] font-bold uppercase tracking-widest">MANTENIMIENTO</p>
                        <h2 className="text-lg font-black text-[#0F172A] uppercase">{location ? 'Editar Ubicación' : 'Nueva Ubicación'}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full"><X className="w-4 h-4 text-[#64748B]" /></button>
                </div>
                <form id="loc-form" onSubmit={e => {
                    e.preventDefault();
                    if (!warehouseId) { toast.error('Selecciona un almacén'); return; }
                    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
                    onSave({ warehouseId, name: name.trim().toUpperCase(), code: code.trim().toUpperCase(), type, description: description.trim(), capacity: capacity ? parseInt(capacity) : undefined, isActive });
                }} className="p-5 space-y-4 overflow-y-auto bg-[#FBFCFE]">
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4">
                        <div>
                            <label className={labelCls}>Almacén <span className="text-red-500">*</span></label>
                            <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className={inputCls} disabled={!!location}>
                                <option value="">Seleccionar...</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Nombre <span className="text-red-500">*</span></label>
                                <input ref={inputRef} value={name} onChange={e => setName(e.target.value.toUpperCase())} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Código</label>
                                <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="LOC-001" className={inputCls} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Tipo</label>
                                <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
                                    {LOCATION_TYPES.map(t => <option key={t} value={t}>{TYPE_COLORS[t].label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Capacidad (u.)</label>
                                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="500" min={0} className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Descripción</label>
                            <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded text-[#2563EB]" />
                            <span className="text-sm font-semibold text-[#0F172A]">Activo</span>
                        </label>
                    </div>
                </form>
                <div className="p-4 border-t border-[#E2E8F0] flex justify-end gap-3 bg-white">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-[#F8FAFC]">Cancelar</button>
                    <button type="submit" form="loc-form" disabled={saving} className="px-5 py-2 text-sm font-bold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 flex items-center gap-2">
                        {saving ? <AlertCircle className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── DELETE DIALOG ────────────────────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-[#DC2626]" /></div>
                    <div><h3 className="font-bold text-[#0F172A]">Confirmar eliminación</h3><p className="text-xs text-[#94A3B8]">Esta acción no se puede deshacer</p></div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg p-3 mb-4 text-center">
                    <span className="text-sm font-bold text-[#DC2626] uppercase">{name}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-bold border border-[#E2E8F0] rounded-lg text-[#475569]">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-bold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C]">Eliminar</button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function ListSkeleton() {
    return (
        <div className="divide-y divide-[#E2E8F0]">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="px-4 py-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function UbicacionesPage() {
    const router = useRouter();

    // Tabs
    const [activeTab, setActiveTab] = useState<'almacenes' | 'ubicaciones'>('almacenes');

    // Warehouses state
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loadingWH, setLoadingWH] = useState(true);
    const [whForm, setWhForm] = useState(false);
    const [editWH, setEditWH] = useState<Warehouse | null>(null);
    const [deleteWH, setDeleteWH] = useState<Warehouse | null>(null);
    const [savingWH, setSavingWH] = useState(false);

    // Locations state
    const [locations, setLocations] = useState<Location[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
    const [loadingLoc, setLoadingLoc] = useState(true);
    const [search, setSearch] = useState('');
    const [filterWH, setFilterWH] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [locForm, setLocForm] = useState(false);
    const [editLoc, setEditLoc] = useState<Location | null>(null);
    const [deleteLoc, setDeleteLoc] = useState<Location | null>(null);
    const [savingLoc, setSavingLoc] = useState(false);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // ── Load warehouses ──
    const loadWarehouses = useCallback(async () => {
        setLoadingWH(true);
        try {
            const res = await api<Warehouse[]>('/locations/warehouses');
            setWarehouses(res);
        } catch { toast.error('Error al cargar almacenes'); }
        finally { setLoadingWH(false); }
    }, []);

    useEffect(() => { loadWarehouses(); }, [loadWarehouses]);

    // ── Load locations ──
    const loadLocations = useCallback(async () => {
        setLoadingLoc(true);
        try {
            const params = new URLSearchParams({ page: String(currentPage), limit: '15', ...(search ? { search } : {}), ...(filterWH ? { warehouseId: filterWH } : {}) });
            const res = await api<{ items: Location[]; meta: ApiMeta }>(`/locations?${params}`);
            setLocations(res.items);
            setMeta(res.meta);
        } catch { toast.error('Error al cargar ubicaciones'); }
        finally { setLoadingLoc(false); }
    }, [currentPage, search, filterWH]);

    useEffect(() => { loadLocations(); }, [loadLocations]);
    useEffect(() => { setCurrentPage(1); }, [search, filterWH]);

    // ── Warehouse CRUD ──
    const handleSaveWH = async (data: any) => {
        setSavingWH(true);
        try {
            if (editWH) { await api(`/locations/warehouses/${editWH.id}`, { method: 'PATCH', body: data }); toast.success('Almacén actualizado'); }
            else { await api('/locations/warehouses', { method: 'POST', body: data }); toast.success('Almacén creado'); }
            setWhForm(false); setEditWH(null); loadWarehouses(); loadLocations();
        } catch (e: any) { toast.error(e.message || 'Error al guardar'); }
        finally { setSavingWH(false); }
    };

    const handleDeleteWH = async () => {
        if (!deleteWH) return;
        try { await api(`/locations/warehouses/${deleteWH.id}`, { method: 'DELETE' }); toast.success('Almacén eliminado'); setDeleteWH(null); loadWarehouses(); }
        catch (e: any) { toast.error(e.message || 'Error al eliminar'); }
    };

    // ── Location CRUD ──
    const handleSaveLoc = async (data: any) => {
        setSavingLoc(true);
        try {
            if (editLoc) { await api(`/locations/${editLoc.id}`, { method: 'PATCH', body: data }); toast.success('Ubicación actualizada'); }
            else { await api('/locations', { method: 'POST', body: data }); toast.success('Ubicación creada'); }
            setLocForm(false); setEditLoc(null); loadLocations();
        } catch (e: any) { toast.error(e.message || 'Error al guardar'); }
        finally { setSavingLoc(false); }
    };

    const handleDeleteLoc = async () => {
        if (!deleteLoc) return;
        try { await api(`/locations/${deleteLoc.id}`, { method: 'DELETE' }); toast.success('Ubicación eliminada'); setDeleteLoc(null); loadLocations(); }
        catch (e: any) { toast.error(e.message || 'Error al eliminar'); }
    };

    const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

    if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AnimatePresence>
                {(whForm || editWH) && <WarehouseFormModal warehouse={editWH} saving={savingWH} onSave={handleSaveWH} onClose={() => { setWhForm(false); setEditWH(null); }} />}
                {(locForm || editLoc) && <LocationFormModal location={editLoc} warehouses={warehouses} saving={savingLoc} onSave={handleSaveLoc} onClose={() => { setLocForm(false); setEditLoc(null); }} />}
                {deleteWH && <DeleteDialog name={deleteWH.name} onConfirm={handleDeleteWH} onCancel={() => setDeleteWH(null)} />}
                {deleteLoc && <DeleteDialog name={deleteLoc.name} onConfirm={handleDeleteLoc} onCancel={() => setDeleteLoc(null)} />}
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
                                    Ubicaciones
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setWhForm(true)}
                                icon={Building2}
                                label="Nuevo Almacén"
                                variant="secondary"
                            />
                            <ActionButton
                                onClick={() => { setEditLoc(null); setLocForm(true); }}
                                icon={Plus}
                                label="Nueva Ubicación"
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* TABS */}
            <div className="space-y-6">
                <div className="flex gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 w-fit mb-6 shadow-sm">
                    {([['almacenes', Building2, 'Almacenes'], ['ubicaciones', Layers, 'Ubicaciones']] as const).map(([tab, Icon, label]) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>
                            <Icon className="w-4 h-4" /> {label}
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                                {tab === 'almacenes' ? warehouses.length : meta.total}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── ALMACENES TAB ── */}
                {activeTab === 'almacenes' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
                        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                            <h2 className="text-sm font-black text-[#0F172A] uppercase">Almacenes Registrados</h2>
                            <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full">{warehouses.length} almacenes</span>
                        </div>
                        {loadingWH ? <ListSkeleton /> : warehouses.length === 0 ? (
                            <div className="p-16 text-center">
                                <Building2 className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
                                <p className="text-sm text-[#94A3B8] font-semibold">No hay almacenes registrados</p>
                                <button onClick={() => setWhForm(true)} className="mt-4 px-5 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg hover:bg-[#1D4ED8]">Crear primer almacén</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <tr>
                                            {['Almacén', 'Dirección', 'Ubicaciones', 'Estado', 'Acciones'].map(h => (
                                                <th key={h} className={`px-6 py-3 text-xs font-bold text-[#64748B] uppercase tracking-widest ${h === 'Acciones' ? 'text-right' : 'text-left'} ${h === 'Ubicaciones' || h === 'Estado' ? 'text-center' : ''}`}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E2E8F0]">
                                        {warehouses.map(w => (
                                            <tr key={w.id} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-[#2563EB]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#0F172A]">{w.name}</p>
                                                            <p className="text-xs text-[#94A3B8]">{w.code || 'SIN CÓDIGO'} {w.description && `· ${w.description}`}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[#475569]">{w.address || '—'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB]">
                                                        <Package className="w-3 h-3" /> {w._count?.locations ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${w.isActive ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-gray-100 text-gray-400'}`}>
                                                        {w.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setEditWH(w)} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded border border-[#E2E8F0] bg-white shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => setDeleteWH(w)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded border border-[#E2E8F0] bg-white shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── UBICACIONES TAB ── */}
                {activeTab === 'ubicaciones' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard label="Total Almacenes" value={warehouses.length} icon={Building2} color="#2563EB" loading={loadingLoc} />
                            <StatsCard label="Total Ubicaciones" value={meta.total} icon={MapPin} color="#16A34A" loading={loadingLoc} />
                            <StatsCard label="Zonas Activas" value={locations.filter(l => l.isActive).length} icon={Layers} color="#7C3AED" loading={loadingLoc} />
                            <StatsCard label="Capacidad Total" value={locations.reduce((acc, l) => acc + (l.capacity || 0), 0)} icon={Package} color="#EA580C" loading={loadingLoc} />
                        </div>

                        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden min-h-[500px] flex flex-col mt-6">
                            <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="max-w-md w-full relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                    <input type="text" placeholder="Buscar por código o nombre..." value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-sm transition-all" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#2563EB]/5 px-4 py-2 rounded-xl border border-[#2563EB]/10">
                                        <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">{meta.total} REGISTROS</span>
                                    </div>
                                </div>
                            </div>

                            <DataTable
                                columns={[
                                    {
                                        header: 'Ubicación / Código',
                                        key: 'name',
                                        render: (l) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#2563EB]">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#0F172A] uppercase tracking-tight">{l.name}</span>
                                                    <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{l.code || 'SIN CÓDIGO'}</span>
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        header: 'Almacén',
                                        key: 'warehouse',
                                        render: (l) => (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-[#94A3B8]" />
                                                <span className="text-sm text-[#475569] font-medium">{l.warehouse?.name || '—'}</span>
                                            </div>
                                        )
                                    },
                                    {
                                        header: 'Tipo',
                                        key: 'type',
                                        render: (l) => <TypeBadge type={l.type} />
                                    },
                                    {
                                        header: 'Estado',
                                        key: 'isActive',
                                        render: (l) => (
                                            <StatusBadge
                                                status={l.isActive ? 'optimo' : 'critico'}
                                                label={l.isActive ? 'ACTIVO' : 'INACTIVO'}
                                            />
                                        )
                                    },
                                    {
                                        header: 'Acciones',
                                        key: 'actions',
                                        align: 'right',
                                        render: (l) => (
                                            <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => { setEditLoc(l); setLocForm(true); }} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/5 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => setDeleteLoc(l)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/5 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        )
                                    }
                                ]}
                                data={locations}
                                loading={loadingLoc}
                                onRowClick={(l) => { setEditLoc(l); setLocForm(true); }}
                            />

                            <Pagination
                                currentPage={currentPage}
                                totalPages={meta.totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </motion.div>
                )}

                {/* INFO CARD */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm">
                        <Info className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider mb-1">Módulo de Almacenes y Ubicaciones</h4>
                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            Gestiona tus bodegas, pasillos, estantes y zonas de almacenamiento.
                            Las ubicaciones son utilizadas en transferencias de inventario, conteos físicos y trazabilidad de stock.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
