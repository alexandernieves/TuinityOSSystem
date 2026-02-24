'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Plus, Key, User, Edit, Trash2, X, ChevronDown, AlertTriangle, Check } from 'lucide-react';

const ROLES = [
    { value: 'OWNER', label: 'Gerencia (OWNER)' },
    { value: 'SUPERVISOR', label: 'Supervisor (SUPERVISOR)' },
    { value: 'ACCOUNTING', label: 'Contabilidad (ACCOUNTING)' },
    { value: 'PURCHASING', label: 'Compras (PURCHASING)' },
    { value: 'SALES', label: 'Ventas (SALES)' },
    { value: 'TRAFFIC', label: 'Tráfico (TRAFFIC)' },
    { value: 'WAREHOUSE', label: 'Bodega (WAREHOUSE)' },
];

const ROLE_COLORS: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    SUPERVISOR: 'bg-indigo-100 text-indigo-700',
    ACCOUNTING: 'bg-emerald-100 text-emerald-700',
    PURCHASING: 'bg-amber-100 text-amber-700',
    SALES: 'bg-blue-100 text-blue-700',
    TRAFFIC: 'bg-cyan-100 text-cyan-700',
    WAREHOUSE: 'bg-orange-100 text-orange-700',
    ADMIN: 'bg-rose-100 text-rose-700',
    CLIENT: 'bg-slate-100 text-slate-600',
    MEMBER: 'bg-gray-100 text-gray-600',
};

type UserRecord = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: 'PENDING' | 'ACTIVE' | 'DISABLED';
    createdAt: string;
};

export default function SeguridadPage() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: '', password: '' });
    const [creating, setCreating] = useState(false);

    // Edit modal
    const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
    const [editForm, setEditForm] = useState({ name: '', role: '' });
    const [saving, setSaving] = useState(false);

    // Delete modal
    const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api<UserRecord[]>('/users');
            setUsers(res);
        } catch (e: any) {
            toast.error('Error al cargar usuarios: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // ── CREATE ──────────────────────────────────────────────
    const handleCreate = async () => {
        if (!newUser.name || !newUser.email || !newUser.role || !newUser.password) {
            toast.error('Complete todos los campos obligatorios');
            return;
        }
        setCreating(true);
        const toastId = toast.loading('Creando usuario...');
        try {
            await api('/users', {
                method: 'POST',
                body: { name: newUser.name, email: newUser.email, role: newUser.role, password: newUser.password },
            });
            toast.success('Usuario creado. Estado: Pendiente hasta primer login.', { id: toastId });
            setIsCreateOpen(false);
            setNewUser({ name: '', email: '', role: '', password: '' });
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || 'Error al crear usuario', { id: toastId });
        } finally {
            setCreating(false);
        }
    };

    // ── EDIT ─────────────────────────────────────────────────
    const openEdit = (u: UserRecord) => {
        setEditTarget(u);
        setEditForm({ name: u.name || '', role: u.role });
    };

    const handleSaveEdit = async () => {
        if (!editTarget) return;
        setSaving(true);
        const toastId = toast.loading('Guardando cambios...');
        try {
            await api(`/users/${editTarget.id}`, {
                method: 'PATCH',
                body: { name: editForm.name, role: editForm.role },
            });
            toast.success('Usuario actualizado', { id: toastId });
            setEditTarget(null);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || 'Error al actualizar', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    // ── DELETE ────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const toastId = toast.loading('Eliminando acceso...');
        try {
            await api(`/users/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success(`Acceso de "${deleteTarget.name || deleteTarget.email}" eliminado`, { id: toastId });
            setDeleteTarget(null);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || 'Error al eliminar', { id: toastId });
        } finally {
            setDeleting(false);
        }
    };

    // ── HELPERS ───────────────────────────────────────────────
    const statusBadge = (status: string) => {
        if (status === 'PENDING') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Pendiente
            </span>
        );
        if (status === 'ACTIVE') return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Activo
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Desactivado
            </span>
        );
    };

    const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm";

    // ═══════════════════════════════════════════════════════════
    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-[#2563EB]" />
                        Seguridad y Permisos
                    </h1>
                    <p className="text-sm text-[#475569] mt-1">Gestión centralizada de usuarios y asignación de roles.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Empleado</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Empleado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Rol</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Estado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Creado</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider w-28">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#475569]">Cargando usuarios...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#475569]">No hay usuarios registrados.</td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-[#F7F9FC] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-semibold text-sm shrink-0">
                                                    {u.name ? u.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#0F172A]">{u.name || 'Sin Nombre'}</p>
                                                    <p className="text-xs text-[#94A3B8]">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {statusBadge(u.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-[#475569]">{new Date(u.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors"
                                                    title="Editar usuario"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(u)}
                                                    className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                                                    title="Eliminar acceso"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <Key className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Los usuarios nuevos aparecerán como <strong>Pendiente</strong> hasta que inicien sesión por primera vez con su contraseña. Al hacerlo, su estado cambiará a <strong>Activo</strong> automáticamente. Al eliminar un usuario, perderá el acceso de forma inmediata e irreversible.</p>
            </div>

            {/* ── CREATE MODAL ─────────────────────────────── */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                            <h2 className="text-lg font-semibold text-[#0F172A]">Nuevo Empleado</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="p-1.5 hover:bg-[#F7F9FC] rounded-lg transition-colors">
                                <X className="w-5 h-5 text-[#475569]" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Nombre Completo *</label>
                                <input type="text" className={inputClass} placeholder="Ej. Juan Pérez" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Correo Electrónico *</label>
                                <input type="email" className={inputClass} placeholder="juan@evolution.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Rol Asignado *</label>
                                <div className="relative">
                                    <select className={`${inputClass} appearance-none pr-8`} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                        <option value="" disabled>Seleccione un rol</option>
                                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Contraseña Temporal *</label>
                                <input type="text" className={inputClass} placeholder="Contraseña que usará para su primer login" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                                <p className="text-xs text-[#94A3B8] mt-1">El empleado verá su estado como <strong>Pendiente</strong> hasta que inicie sesión.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                            <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] text-[#475569] transition-colors">Cancelar</button>
                            <button disabled={creating} onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50">
                                {creating ? 'Creando...' : 'Crear Empleado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDIT MODAL ───────────────────────────────── */}
            {editTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditTarget(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                            <h2 className="text-lg font-semibold text-[#0F172A]">Editar Usuario</h2>
                            <button onClick={() => setEditTarget(null)} className="p-1.5 hover:bg-[#F7F9FC] rounded-lg transition-colors">
                                <X className="w-5 h-5 text-[#475569]" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-[#94A3B8]">Editando: <span className="font-medium text-[#475569]">{editTarget.email}</span></p>
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Nombre Completo</label>
                                <input type="text" className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Rol</label>
                                <div className="relative">
                                    <select className={`${inputClass} appearance-none pr-8`} value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                            <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] text-[#475569] transition-colors">Cancelar</button>
                            <button disabled={saving} onClick={handleSaveEdit} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50">
                                <Check className="w-4 h-4" />
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DELETE CONFIRM MODAL ──────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-[#DC2626]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#0F172A]">¿Eliminar acceso?</h3>
                                <p className="text-sm text-[#475569] mt-2">
                                    Vas a revocar el acceso de <strong>{deleteTarget.name || deleteTarget.email}</strong> a la plataforma. Esta acción es <span className="text-[#DC2626] font-semibold">irreversible</span> y el usuario no podrá iniciar sesión.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] text-[#475569] transition-colors">Cancelar</button>
                            <button disabled={deleting} onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 font-semibold">
                                <Trash2 className="w-4 h-4" />
                                {deleting ? 'Eliminando...' : 'Sí, eliminar acceso'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
