'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@heroui/react';
import {
    Plus, Edit, Trash2, Users,
    Mail, Phone, Percent, Search,
    X, Save, CheckCircle, XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Salesperson {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    commissionRate: number;
    isActive: boolean;
}

const AVATAR_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EA580C', '#06B6D4', '#EC4899'];

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

// ── FORM MODAL ───────────────────────────────────────────────────────────────
function FormModal({ open, onClose, editingItem, onSaved }: {
    open: boolean; onClose: () => void; editingItem: Salesperson | null; onSaved: () => void;
}) {
    const [form, setForm] = useState<Partial<Salesperson> & { commissionRate: number }>({
        code: '', name: '', email: '', phone: '', commissionRate: 0, isActive: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(editingItem
                ? { ...editingItem, commissionRate: editingItem.commissionRate * 100 }
                : { code: '', name: '', email: '', phone: '', commissionRate: 0, isActive: true }
            );
        }
    }, [open, editingItem]);

    if (!open) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const endpoint = '/customers/salespeople';
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
            await api(url, {
                method,
                body: { ...form, commissionRate: (form.commissionRate || 0) / 100 },
            });
            toast.success(editingItem ? 'Vendedor actualizado' : 'Vendedor registrado');
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
                style={{ animation: 'scaleIn 0.15s ease' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F7F9FC]">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2563EB]" />
                        <h2 className="text-base font-semibold text-[#0F172A]">
                            {editingItem ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#E2E8F0] transition-colors">
                        <X className="w-4 h-4 text-[#475569]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">

                        {/* Código + Comisión */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel label="Código" required />
                                <input
                                    type="text"
                                    placeholder="Ej. V-01"
                                    value={form.code || ''}
                                    onChange={e => setForm({ ...form, code: e.target.value })}
                                    required
                                    className={inputClass()}
                                />
                            </div>
                            <div>
                                <FieldLabel label="Comisión (%)" />
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        placeholder="0.0"
                                        value={form.commissionRate || ''}
                                        onChange={e => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })}
                                        className={`${inputClass()} pr-8`}
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                </div>
                            </div>
                        </div>

                        {/* Nombre */}
                        <div>
                            <FieldLabel label="Nombre Completo" required />
                            <input
                                type="text"
                                placeholder="Nombre del vendedor"
                                value={form.name || ''}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                className={inputClass()}
                            />
                        </div>

                        {/* Teléfono + Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FieldLabel label="Teléfono" />
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                    <input
                                        type="tel"
                                        placeholder="+58 412..."
                                        value={form.phone || ''}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className={`${inputClass()} pl-9`}
                                    />
                                </div>
                            </div>
                            <div>
                                <FieldLabel label="Email" />
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                                    <input
                                        type="email"
                                        placeholder="vendedor@correo.com"
                                        value={form.email || ''}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className={`${inputClass()} pl-9`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Estado toggle */}
                        <div className="flex items-center justify-between p-3 bg-[#F7F9FC] rounded-lg border border-[#E2E8F0]">
                            <div>
                                <p className="text-sm font-medium text-[#0F172A]">Estado del Vendedor</p>
                                <p className="text-xs text-[#475569]">Los vendedores inactivos no se asignan a nuevos clientes</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-7' : 'left-1'}`} />
                            </button>
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
                            {saving
                                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                                : <><Save className="w-3.5 h-3.5" />Guardar</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── DELETE MODAL ─────────────────────────────────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, loading }: {
    open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#FEF2F2] flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[#DC2626]" />
                    <h2 className="text-base font-semibold text-[#DC2626]">Eliminar Vendedor</h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-[#475569]">¿Estás seguro? Esta acción puede fallar si el vendedor tiene clientes o historial asignado.</p>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-[#475569] border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC]">Cancelar</button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] disabled:opacity-50"
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
export default function SalespeopleConfigPage() {
    const [data, setData] = useState<Salesperson[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Salesperson | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const res = await api<Salesperson[]>('/customers/salespeople');
            setData(res || []);
        } catch {
            toast.error('Error al cargar vendedores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async () => {
        if (!deletingId) return;
        setDeleting(true);
        try {
            await api(`/customers/salespeople/${deletingId}`, { method: 'DELETE' });
            toast.success('Vendedor eliminado');
            setDeleteOpen(false);
            fetchAll();
        } catch {
            toast.error('No se pudo eliminar. Posibles dependencias existentes.');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = data.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = data.filter(s => s.isActive).length;
    const inactiveCount = data.length - activeCount;

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20 space-y-6">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A]">Registro de Vendedores</h1>
                        <p className="text-sm text-[#475569] mt-0.5">Gestión del equipo de ventas y fuerza de campo.</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Nuevo Vendedor
                </button>
            </div>

            {/* ── KPI PILLS ── */}
            {!loading && (
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                        <Users className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-sm text-[#475569]">Total: <strong className="text-[#0F172A]">{data.length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                        <span className="text-sm text-[#16A34A]">Activos: <strong>{activeCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#475569]/5 border border-[#475569]/20 rounded-lg">
                        <XCircle className="w-4 h-4 text-[#475569]" />
                        <span className="text-sm text-[#475569]">Inactivos: <strong>{inactiveCount}</strong></span>
                    </div>
                </div>
            )}

            {/* ── MAIN CARD ── */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">

                {/* Search bar */}
                <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F7F9FC] flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all bg-white placeholder:text-[#94A3B8]"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#0F172A]" />
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-[#94A3B8] ml-auto">{filtered.length} vendedor(es)</span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" color="primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users className="w-10 h-10 text-[#E2E8F0] mx-auto mb-3" />
                        <p className="text-sm text-[#475569]">{search ? 'Sin resultados para la búsqueda.' : 'No hay vendedores registrados.'}</p>
                        {!search && (
                            <button
                                onClick={() => { setEditingItem(null); setFormOpen(true); }}
                                className="mt-4 text-sm text-[#2563EB] hover:underline"
                            >
                                + Registrar el primero
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                                <tr>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Vendedor</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Contacto</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Comisión</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Estado</th>
                                    <th className="text-center px-5 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {filtered.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-[#F7F9FC] transition-colors">
                                        {/* Vendedor */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                                    style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}
                                                >
                                                    {item.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#0F172A]">{item.name}</p>
                                                    <span className="font-mono text-xs bg-[#F1F5F9] text-[#475569] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                                                        {item.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="px-5 py-3.5">
                                            <div className="space-y-1">
                                                {item.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                                                        <Mail className="w-3 h-3 text-[#94A3B8]" />
                                                        <span className="truncate max-w-[160px]">{item.email}</span>
                                                    </div>
                                                )}
                                                {item.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                                                        <Phone className="w-3 h-3 text-[#94A3B8]" />
                                                        {item.phone}
                                                    </div>
                                                )}
                                                {!item.email && !item.phone && (
                                                    <span className="text-xs text-[#94A3B8]">—</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Comisión */}
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-[#16A34A]/10 text-[#16A34A]">
                                                <Percent className="w-3 h-3" />
                                                {(item.commissionRate * 100).toFixed(1)}%
                                            </span>
                                        </td>

                                        {/* Estado */}
                                        <td className="px-5 py-3.5 text-center">
                                            {item.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-[#475569]/10 text-[#475569]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                                                    Inactivo
                                                </span>
                                            )}
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => { setEditingItem(item); setFormOpen(true); }}
                                                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F7F9FC] hover:text-[#2563EB] hover:border-[#2563EB]/30 text-[#475569] transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => { setDeletingId(item.id); setDeleteOpen(true); }}
                                                    className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-[#DC2626]/30 text-[#475569] transition-colors"
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

                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                        <p className="text-xs text-[#475569]">{filtered.length} vendedor(es) {search ? 'encontrado(s)' : 'registrado(s)'}</p>
                    </div>
                )}
            </div>

            {/* ── MODALS ── */}
            <FormModal open={formOpen} onClose={() => setFormOpen(false)} editingItem={editingItem} onSaved={fetchAll} />
            <DeleteModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleting} />

            <style>{`
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
            `}</style>
        </div>
    );
}
