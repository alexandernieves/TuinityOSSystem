'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@heroui/react';
import {
    Plus, Edit, Trash2, Map, MapPin,
    Search, X, ChevronDown, Info, Save,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Area {
    id: string;
    code: string;
    name: string;
    description?: string;
    region?: string;
}
interface SubArea {
    id: string;
    code: string;
    name: string;
    description?: string;
    areaId: string;
    area?: Area;
}

type Tab = 'areas' | 'subareas';

const inputClass = (err?: boolean) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-[#94A3B8] ${err
        ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
        : 'border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
    }`;

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
    return (
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
            {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
    );
}

// ── MODAL ────────────────────────────────────────────────────────────────────
function FormModal({
    open, onClose, tab, editingItem, areas, onSaved,
}: {
    open: boolean;
    onClose: () => void;
    tab: Tab;
    editingItem: any;
    areas: Area[];
    onSaved: () => void;
}) {
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [areaOpen, setAreaOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(editingItem ? { ...editingItem } : { code: '', name: '', description: '', region: '', areaId: '' });
            setAreaOpen(false);
        }
    }, [open, editingItem]);

    if (!open) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const endpoint = tab === 'areas' ? '/customers/areas' : '/customers/sub-areas';
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
            await api(url, { method, body: form });
            toast.success(editingItem ? 'Actualizado correctamente' : 'Creado exitosamente');
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const selectedArea = areas.find(a => a.id === form.areaId);
    const isArea = tab === 'areas';
    const title = `${editingItem ? 'Editar' : 'Nuevo'} ${isArea ? 'Área Principal' : 'Sub-Área'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.15s ease' }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.15s ease' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F7F9FC]">
                    <div className="flex items-center gap-2">
                        {isArea
                            ? <Map className="w-4 h-4 text-[#2563EB]" />
                            : <MapPin className="w-4 h-4 text-[#2563EB]" />
                        }
                        <h2 className="text-base font-semibold text-[#0F172A]">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#E2E8F0] transition-colors">
                        <X className="w-4 h-4 text-[#475569]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">
                        {/* Código */}
                        <div>
                            <FieldLabel label="Código" required />
                            <input
                                type="text"
                                placeholder="Ej. NRT-01"
                                value={form.code || ''}
                                onChange={e => setForm({ ...form, code: e.target.value })}
                                required
                                className={inputClass()}
                            />
                        </div>

                        {/* Nombre */}
                        <div>
                            <FieldLabel label="Nombre" required />
                            <input
                                type="text"
                                placeholder="Nombre descriptivo"
                                value={form.name || ''}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                className={inputClass()}
                            />
                        </div>

                        {/* Area: region | SubArea: area padre */}
                        {isArea ? (
                            <div>
                                <FieldLabel label="Zonificación / Región (opcional)" />
                                <input
                                    type="text"
                                    placeholder="Ej. Zona Norte, Nacional..."
                                    value={form.region || ''}
                                    onChange={e => setForm({ ...form, region: e.target.value })}
                                    className={inputClass()}
                                />
                            </div>
                        ) : (
                            <div>
                                <FieldLabel label="Área Principal" required />
                                <div className="relative">
                                    <div
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white cursor-pointer hover:border-[#2563EB]/40 transition-colors"
                                        onClick={() => setAreaOpen(v => !v)}
                                    >
                                        {selectedArea ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Map className="w-3.5 h-3.5 text-[#2563EB]" />
                                                <span className="text-sm text-[#0F172A]">{selectedArea.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[#94A3B8] flex-1">Seleccione el área padre</span>
                                        )}
                                        <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                                    </div>
                                    {areaOpen && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-44 overflow-y-auto" style={{ animation: 'dropdownIn 0.12s ease' }}>
                                            {areas.map(a => (
                                                <button
                                                    type="button"
                                                    key={a.id}
                                                    className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[#F7F9FC] transition-colors"
                                                    onClick={() => { setForm({ ...form, areaId: a.id }); setAreaOpen(false); }}
                                                >
                                                    <Map className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                                    <span className="text-[#0F172A]">{a.name}</span>
                                                    <span className="text-xs text-[#94A3B8] ml-auto font-mono">{a.code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {!form.areaId && (
                                    <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-1">
                                        <Info className="w-3 h-3" /> Debe seleccionar un área padre
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Descripción */}
                        <div>
                            <FieldLabel label="Descripción (opcional)" />
                            <textarea
                                rows={2}
                                placeholder="Detalles adicionales..."
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className={`${inputClass()} resize-none`}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 text-sm text-[#475569] border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                            ) : (
                                <><Save className="w-3.5 h-3.5" /> Guardar</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, loading }: { open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#FEF2F2] flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[#DC2626]" />
                    <h2 className="text-base font-semibold text-[#DC2626]">Eliminar Registro</h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-[#475569]">¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer y puede fallar si tiene dependencias.</p>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors">Cancelar</button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                    >
                        {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AreasConfigPage() {
    const [tab, setTab] = useState<Tab>('areas');
    const [areas, setAreas] = useState<Area[]>([]);
    const [subAreas, setSubAreas] = useState<SubArea[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form modal
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Delete modal
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [a, s] = await Promise.all([
                api<Area[]>('/customers/areas'),
                api<SubArea[]>('/customers/sub-areas'),
            ]);
            setAreas(a || []);
            setSubAreas(s || []);
        } catch {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async () => {
        if (!deletingId) return;
        setDeleting(true);
        try {
            const endpoint = tab === 'areas' ? '/customers/areas' : '/customers/sub-areas';
            await api(`${endpoint}/${deletingId}`, { method: 'DELETE' });
            toast.success('Registro eliminado');
            setDeleteOpen(false);
            fetchAll();
        } catch {
            toast.error('No se pudo eliminar. Verifique que no tenga dependencias.');
        } finally {
            setDeleting(false);
        }
    };

    const dataList = tab === 'areas' ? areas : subAreas;
    const filtered = dataList.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase())
    );

    const AVATAR_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EA580C'];

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                        <Map className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A]">Registro de Áreas y Sub-Áreas</h1>
                        <p className="text-sm text-[#475569] mt-0.5">Configura las zonas geográficas para la asignación de clientes.</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo {tab === 'areas' ? 'Área' : 'Sub-Área'}
                </button>
            </div>

            {/* ── MAIN CARD ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">

                {/* Tabs + Search bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 border-b border-[#E2E8F0]">
                    {/* Tabs */}
                    <div className="flex">
                        {([
                            { key: 'areas', label: 'Áreas Principales', Icon: Map, count: areas.length },
                            { key: 'subareas', label: 'Sub-Áreas', Icon: MapPin, count: subAreas.length },
                        ] as const).map(t => (
                            <button
                                key={t.key}
                                onClick={() => { setTab(t.key); setSearch(''); }}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key
                                    ? 'border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5'
                                    : 'border-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#F7F9FC]'
                                    }`}
                            >
                                <t.Icon className="w-4 h-4" />
                                {t.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.key ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-[#F1F5F9] text-[#475569]'}`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex-1 sm:ml-auto flex justify-end p-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o código..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <X className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0F172A]" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" color="primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        {tab === 'areas' ? <Map className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" /> : <MapPin className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />}
                        <p className="text-sm text-[#475569]">{search ? 'Sin resultados para la búsqueda' : `No hay ${tab === 'areas' ? 'áreas' : 'sub-áreas'} configuradas.`}</p>
                        {!search && (
                            <button
                                onClick={() => { setEditingItem(null); setFormOpen(true); }}
                                className="mt-4 text-sm text-[#2563EB] hover:underline"
                            >
                                + Crear el primero
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Código</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Nombre</th>
                                    {tab === 'areas'
                                        ? <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Zona / Región</th>
                                        : <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Área Principal</th>
                                    }
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Descripción</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {filtered.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-[#F7F9FC] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs bg-[#F1F5F9] text-[#475569] px-2 py-1 rounded border border-[#E2E8F0]">
                                                {item.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                    style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                                                >
                                                    {item.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-[#0F172A]">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {tab === 'areas' ? (
                                                <span className="text-sm text-[#475569]">{(item as Area).region || '—'}</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#2563EB]/10 text-[#2563EB] rounded-full">
                                                    <Map className="w-3 h-3" />
                                                    {(item as SubArea).area?.name || '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 max-w-[200px]">
                                            <span className="text-sm text-[#475569] truncate block">{item.description || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => { setEditingItem(item); setFormOpen(true); }}
                                                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F7F9FC] text-[#475569] hover:text-[#2563EB] hover:border-[#2563EB]/30 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setDeletingId(item.id); setDeleteOpen(true); }}
                                                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#FEF2F2] text-[#475569] hover:text-[#DC2626] hover:border-[#DC2626]/30 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer count */}
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                        <p className="text-xs text-[#475569]">
                            {filtered.length} {tab === 'areas' ? 'área(s)' : 'sub-área(s)'} {search ? 'encontrada(s)' : 'registrada(s)'}
                        </p>
                    </div>
                )}
            </div>

            {/* ── MODALS ── */}
            <FormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                tab={tab}
                editingItem={editingItem}
                areas={areas}
                onSaved={fetchAll}
            />
            <DeleteModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                loading={deleting}
            />

            {/* Animation keyframes */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
            `}</style>
        </div>
    );
}
