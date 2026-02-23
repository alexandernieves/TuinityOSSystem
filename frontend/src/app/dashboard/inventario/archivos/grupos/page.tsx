'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Pencil, Trash2, Save, X, Layers,
    ChevronRight, AlertTriangle, Loader2, Search, FolderOpen, Folder, Tag,
    Download, Upload
} from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Category {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    parent?: { id: string; name: string } | null;
    children?: Category[];
    _count?: { products: number };
}

interface ApiResponse {
    items: Category[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
interface FormModalProps {
    title: string;
    subtitle?: string;
    accentColor: string; // e.g. '#1E3A8A'
    initialName?: string;
    initialDesc?: string;
    saving: boolean;
    onSave: (name: string, desc: string) => void;
    onClose: () => void;
}

function FormModal({ title, subtitle, accentColor, initialName = '', initialDesc = '', saving, onSave, onClose }: FormModalProps) {
    const [name, setName] = useState(initialName);
    const [desc, setDesc] = useState(initialDesc);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('El nombre es requerido'); return; }
        onSave(name.trim(), desc.trim());
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden"
                initial={{ opacity: 0, scale: 0.93, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: accentColor }}>
                    <div>
                        <h2 className="text-base font-bold text-white">{title}</h2>
                        {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Nombre <span className="text-red-400">*</span>
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value.toUpperCase())}
                            placeholder="Ej: BEBIDAS"
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition font-medium tracking-wide"
                            style={{ '--tw-ring-color': accentColor + '40' } as any}
                            onFocus={e => e.currentTarget.style.borderColor = accentColor}
                            onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Descripción <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                        </label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            placeholder="Descripción breve del grupo..."
                            rows={3}
                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none resize-none transition"
                            onFocus={e => e.currentTarget.style.borderColor = accentColor}
                            onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: accentColor }}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// ─── CONFIRM DELETE DIALOG ────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
        >
            <motion.div
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100"
                initial={{ opacity: 0, scale: 0.93, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-base">Confirmar eliminación</h3>
                        <p className="text-sm text-gray-500 mt-1">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition">
                        Eliminar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type ModalMode = 'new-group' | 'edit-group' | 'new-subgroup' | 'edit-subgroup' | null;

export default function GruposPage() {
    const router = useRouter();

    const [groups, setGroups] = useState<Category[]>([]);
    const [subgroups, setSubgroups] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [selectedGroup, setSelectedGroup] = useState<Category | null>(null);
    const [selectedSubgroup, setSelectedSubgroup] = useState<Category | null>(null);

    const [groupSearch, setGroupSearch] = useState('');
    const [subgroupSearch, setSubgroupSearch] = useState('');

    const [modal, setModal] = useState<ModalMode>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'group' | 'subgroup'; item: Category } | null>(null);

    // ─── FETCH ────────────────────────────────────────────────────────────────
    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api<ApiResponse>('/categories?limit=100&page=1');
            setGroups(res.items.filter(c => !c.parentId));
        } catch {
            toast.error('Error al cargar grupos');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSubgroups = useCallback(async (groupId: string) => {
        try {
            const res = await api<ApiResponse>('/categories?limit=100&page=1');
            setSubgroups(res.items.filter(c => c.parentId === groupId));
        } catch {
            toast.error('Error al cargar subgrupos');
        }
    }, []);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);

    // ─── SELECT ───────────────────────────────────────────────────────────────
    const handleSelectGroup = (group: Category) => {
        setSelectedGroup(group);
        setSelectedSubgroup(null);
        setSubgroupSearch('');
        fetchSubgroups(group.id);
    };

    // ─── SAVE ─────────────────────────────────────────────────────────────────
    const handleSave = async (name: string, desc: string) => {
        setSaving(true);
        try {
            if (modal === 'new-group') {
                await api('/categories', { method: 'POST', body: { name, description: desc || undefined } });
                toast.success('Grupo creado exitosamente');
                setSelectedGroup(null);
                setSubgroups([]);
            } else if (modal === 'edit-group' && selectedGroup) {
                await api(`/categories/${selectedGroup.id}`, { method: 'PATCH', body: { name, description: desc || undefined } });
                toast.success('Grupo actualizado');
                setSelectedGroup(prev => prev ? { ...prev, name, description: desc } : null);
            } else if (modal === 'new-subgroup' && selectedGroup) {
                await api('/categories', { method: 'POST', body: { name, description: desc || undefined, parentId: selectedGroup.id } });
                toast.success('Subgrupo creado exitosamente');
            } else if (modal === 'edit-subgroup' && selectedSubgroup) {
                await api(`/categories/${selectedSubgroup.id}`, { method: 'PATCH', body: { name, description: desc || undefined } });
                toast.success('Subgrupo actualizado');
                setSelectedSubgroup(prev => prev ? { ...prev, name, description: desc } : null);
            }
            setModal(null);
            await fetchGroups();
            if (selectedGroup) await fetchSubgroups(selectedGroup.id);
        } catch (e: any) {
            toast.error(e?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!confirmDelete) return;
        setSaving(true);
        try {
            await api(`/categories/${confirmDelete.item.id}`, { method: 'DELETE' });
            toast.success(`${confirmDelete.type === 'group' ? 'Grupo' : 'Subgrupo'} eliminado`);
            setConfirmDelete(null);
            if (confirmDelete.type === 'group') {
                setSelectedGroup(null);
                setSubgroups([]);
                await fetchGroups();
            } else {
                setSelectedSubgroup(null);
                if (selectedGroup) await fetchSubgroups(selectedGroup.id);
            }
        } catch (e: any) {
            toast.error(e?.message || 'No se puede eliminar: puede tener productos asociados');
            setConfirmDelete(null);
        } finally {
            setSaving(false);
        }
    };

    // ─── FILTERED ─────────────────────────────────────────────────────────────
    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
    const filteredSubgroups = subgroups.filter(s => s.name.toLowerCase().includes(subgroupSearch.toLowerCase()));

    // ─── MODAL CONFIG ─────────────────────────────────────────────────────────
    const getModalConfig = () => {
        switch (modal) {
            case 'new-group': return { title: 'Nuevo Grupo', subtitle: 'Crea una categoría principal', color: '#1E3A8A', name: '', desc: '' };
            case 'edit-group': return { title: 'Editar Grupo', subtitle: selectedGroup?.name, color: '#1E3A8A', name: selectedGroup?.name || '', desc: selectedGroup?.description || '' };
            case 'new-subgroup': return { title: 'Nuevo Subgrupo', subtitle: `Dentro de: ${selectedGroup?.name}`, color: '#0F766E', name: '', desc: '' };
            case 'edit-subgroup': return { title: 'Editar Subgrupo', subtitle: selectedSubgroup?.name, color: '#0F766E', name: selectedSubgroup?.name || '', desc: selectedSubgroup?.description || '' };
            default: return null;
        }
    };
    const modalConfig = getModalConfig();

    if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

    return (
        <div className="min-h-screen bg-[#F8FAFC]" suppressHydrationWarning>

            {/* ── MODALS ── */}
            <AnimatePresence>
                {modal && modalConfig && (
                    <FormModal
                        key="form-modal"
                        title={modalConfig.title}
                        subtitle={modalConfig.subtitle}
                        accentColor={modalConfig.color}
                        initialName={modalConfig.name}
                        initialDesc={modalConfig.desc}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => setModal(null)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {confirmDelete && (
                    <ConfirmDialog
                        key="confirm-dialog"
                        message={
                            confirmDelete.type === 'group'
                                ? `¿Eliminar el grupo "${confirmDelete.item.name}"? Esta acción no se puede deshacer.`
                                : `¿Eliminar el subgrupo "${confirmDelete.item.name}"?`
                        }
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmDelete(null)}
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
                                    Grupos y Subgrupos
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setModal('new-group')}
                                icon={Plus}
                                label="Nuevo Grupo"
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN LAYOUT ── */}
            <div className="p-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ══════════════ LEFT — GRUPOS ══════════════ */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

                        {/* Panel Header */}
                        <div className="bg-[#1E3A8A] px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Folder className="w-4 h-4 text-white/80" />
                                <span className="text-sm font-bold text-white tracking-wide uppercase">Grupos</span>
                                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">{groups.length}</span>
                            </div>
                            <button
                                onClick={() => setModal('new-group')}
                                className="flex items-center gap-1.5 bg-white text-[#1E3A8A] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Nuevo
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="text"
                                    placeholder="Buscar grupo..."
                                    value={groupSearch}
                                    onChange={e => setGroupSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition"
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto" style={{ minHeight: 260, maxHeight: 340 }}>
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 text-[#1E3A8A] animate-spin" />
                                </div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                    <Layers className="w-8 h-8 mb-2 opacity-40" />
                                    <p className="text-sm text-gray-400">Sin grupos registrados</p>
                                    <button onClick={() => setModal('new-group')} className="mt-2 text-xs text-[#1E3A8A] font-bold flex items-center gap-1 hover:underline">
                                        <Plus className="w-3 h-3" /> Crear el primero
                                    </button>
                                </div>
                            ) : (
                                <ul>
                                    {filteredGroups.map(g => (
                                        <li key={g.id}>
                                            <button
                                                onClick={() => handleSelectGroup(g)}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-sm border-b border-gray-50 last:border-0 transition-all group ${selectedGroup?.id === g.id
                                                    ? 'bg-[#1E3A8A]/5 text-[#1E3A8A] font-bold'
                                                    : 'text-gray-600 hover:bg-gray-50 font-medium'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2 h-2 rounded-full transition-colors ${selectedGroup?.id === g.id ? 'bg-[#1E3A8A]' : 'bg-gray-300'}`} />
                                                    <span>{g.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {g._count?.products !== undefined && (
                                                        <span className="text-xs text-gray-400">{g._count.products} prod.</span>
                                                    )}
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedGroup?.id === g.id ? 'text-[#1E3A8A] translate-x-0.5' : 'text-gray-300 group-hover:text-gray-400'}`} />
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Detail footer */}
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                            {selectedGroup ? (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Grupo seleccionado</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{selectedGroup.name}</p>
                                        {selectedGroup.description && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{selectedGroup.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">{selectedGroup._count?.products ?? 0} productos asociados · {subgroups.length} subgrupos</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => setModal('edit-group')}
                                            className="p-2 rounded-xl hover:bg-[#1E3A8A]/10 text-[#1E3A8A] transition-colors"
                                            title="Editar grupo"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete({ type: 'group', item: selectedGroup })}
                                            className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                            title="Eliminar grupo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-1">Selecciona un grupo para ver sus detalles</p>
                            )}
                        </div>
                    </div>

                    {/* ══════════════ RIGHT — SUBGRUPOS ══════════════ */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

                        {/* Panel Header */}
                        <div className={`px-4 py-3 flex items-center justify-between transition-colors ${selectedGroup ? 'bg-[#0F766E]' : 'bg-gray-400'}`}>
                            <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-white/80" />
                                <span className="text-sm font-bold text-white tracking-wide uppercase">Sub-Grupos</span>
                                {selectedGroup && (
                                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">{subgroups.length}</span>
                                )}
                            </div>
                            {selectedGroup && (
                                <button
                                    onClick={() => setModal('new-subgroup')}
                                    className="flex items-center gap-1.5 bg-white text-[#0F766E] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Nuevo
                                </button>
                            )}
                        </div>

                        {/* Context chip */}
                        {selectedGroup && (
                            <div className="px-4 py-2 border-b border-teal-100 bg-teal-50 flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-teal-600" />
                                <p className="text-xs text-teal-700 font-semibold">
                                    Subgrupos de: <span className="font-black">{selectedGroup.name}</span>
                                </p>
                            </div>
                        )}

                        {/* Search (only when group selected) */}
                        {selectedGroup && subgroups.length > 3 && (
                            <div className="px-4 py-3 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input
                                        type="text"
                                        placeholder="Buscar subgrupo..."
                                        value={subgroupSearch}
                                        onChange={e => setSubgroupSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
                                    />
                                </div>
                            </div>
                        )}

                        {/* List */}
                        <div className="overflow-y-auto" style={{ minHeight: 260, maxHeight: 340 }}>
                            {!selectedGroup ? (
                                <div className="flex flex-col items-center justify-center h-full py-16 text-gray-300">
                                    <ChevronRight className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm text-gray-400">Selecciona un grupo para ver sus subgrupos</p>
                                </div>
                            ) : filteredSubgroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                    <FolderOpen className="w-8 h-8 mb-2 opacity-40" />
                                    <p className="text-sm text-gray-400">Sin subgrupos en "{selectedGroup.name}"</p>
                                    <button onClick={() => setModal('new-subgroup')} className="mt-2 text-xs text-[#0F766E] font-bold flex items-center gap-1 hover:underline">
                                        <Plus className="w-3 h-3" /> Agregar el primero
                                    </button>
                                </div>
                            ) : (
                                <ul>
                                    {filteredSubgroups.map(sub => (
                                        <li key={sub.id}>
                                            <button
                                                onClick={() => setSelectedSubgroup(sub)}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-sm border-b border-gray-50 last:border-0 transition-all group ${selectedSubgroup?.id === sub.id
                                                    ? 'bg-teal-50 text-[#0F766E] font-bold'
                                                    : 'text-gray-600 hover:bg-gray-50 font-medium'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2 h-2 rounded-full transition-colors ${selectedSubgroup?.id === sub.id ? 'bg-[#0F766E]' : 'bg-gray-300'}`} />
                                                    <span>{sub.name}</span>
                                                </div>
                                                {sub._count?.products !== undefined && (
                                                    <span className="text-xs text-gray-400">{sub._count.products} prod.</span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Detail footer */}
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                            {selectedSubgroup ? (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subgrupo seleccionado</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{selectedSubgroup.name}</p>
                                        {selectedSubgroup.description && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{selectedSubgroup.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">{selectedSubgroup._count?.products ?? 0} productos asociados</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => setModal('edit-subgroup')}
                                            className="p-2 rounded-xl hover:bg-teal-50 text-[#0F766E] transition-colors"
                                            title="Editar subgrupo"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete({ type: 'subgroup', item: selectedSubgroup })}
                                            className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                            title="Eliminar subgrupo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-1">
                                    {selectedGroup ? 'Selecciona un subgrupo para ver sus detalles' : 'Selecciona un grupo primero'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── TIP CARD ── */}
                <div className="mt-6 bg-[#1E3A8A]/5 border border-[#1E3A8A]/15 rounded-2xl px-5 py-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4 text-[#1E3A8A]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">¿Cómo organizar tu catálogo?</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Los <strong>Grupos</strong> son las categorías principales (ej: BEER, WHISKY).
                            Los <strong>Subgrupos</strong> son subdivisiones del grupo padre (ej: WHISKY → SCOTCH, BOURBON).
                            Al registrar productos, podrás asignarles su grupo y subgrupo correspondiente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
