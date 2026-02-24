'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    Warehouse,
    Plus,
    Edit3,
    Trash2,
    Search,
    MapPin,
    Hash,
    Calendar,
    ChevronDown,
    Package,
    CheckCircle,
    X,
    FileText
} from 'lucide-react';

type Bodega = {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: string;
};

export default function BodegasPage() {
    const router = useRouter();
    const [bodegas, setBodegas] = useState<Bodega[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBodega, setEditingBodega] = useState<Bodega | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '', description: '', address: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchBodegas();
    }, []);

    const fetchBodegas = async () => {
        setLoading(true);
        try {
            const data = await api<Bodega[]>('/locations/warehouses');
            setBodegas(data || []);
        } catch (error: any) {
            toast.error('Error al cargar bodegas: ' + error.message);
            setBodegas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (bod?: Bodega) => {
        if (bod) {
            setEditingBodega(bod);
            setFormData({
                name: bod.name,
                code: bod.code || '',
                description: bod.description || '',
                address: bod.address || ''
            });
        } else {
            setEditingBodega(null);
            setFormData({ name: '', code: '', description: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('El nombre de la bodega es requerido');
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading('Guardando bodega...');
        try {
            if (editingBodega) {
                await api(`/locations/warehouses/${editingBodega.id}`, {
                    method: 'PATCH',
                    body: { ...formData }
                });
                toast.success('Bodega actualizada', { id: toastId });
            } else {
                await api('/locations/warehouses', {
                    method: 'POST',
                    body: { ...formData }
                });
                toast.success('Bodega creada', { id: toastId });
            }
            setIsModalOpen(false);
            fetchBodegas();
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar bodega', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Está seguro de eliminar la bodega "${name}"?`)) return;

        const toastId = toast.loading('Eliminando bodega...');
        try {
            await api(`/locations/warehouses/${id}`, {
                method: 'DELETE'
            });
            toast.success('Bodega eliminada', { id: toastId });
            fetchBodegas();
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar', { id: toastId });
        }
    };

    const filteredBodegas = bodegas.filter(b =>
        (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.code || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-[#475569] mb-4">
                        <span className="hover:text-[#2563EB] cursor-pointer transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-[#2563EB] cursor-pointer transition-colors" onClick={() => router.push('/dashboard/configuracion')}>Configuración</span>
                        <span>/</span>
                        <span className="text-[#0F172A] font-medium">Bodegas</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20">
                            <Warehouse className="h-6 w-6 text-[#2563EB]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-[#0F172A]">Registro de Bodegas</h1>
                            <p className="text-sm text-[#475569]">Gestión de centros de acopio y depósitos de inventario.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors shadow-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Bodega</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm">
                <div className="p-4 border-b border-[#E2E8F0] bg-[#F7F9FC] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Buscar por código o nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold rounded-md">
                        <Package className="w-3.5 h-3.5" />
                        {filteredBodegas.length} BODEGAS ACTIVAS
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F7F9FC] border-b border-[#E2E8F0]">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Detalles</th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#475569] uppercase tracking-wider">Registro</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-[#475569] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[#94A3B8] text-sm animate-pulse">
                                        Cargando información de bodegas...
                                    </td>
                                </tr>
                            ) : filteredBodegas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="w-14 h-14 rounded-full bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-3">
                                            <Warehouse className="w-6 h-6 text-[#94A3B8]" />
                                        </div>
                                        <p className="font-medium text-[#0F172A]">No se encontraron bodegas</p>
                                        <p className="text-xs text-[#64748B] mt-1">Intente con otros términos de búsqueda o cree una nueva.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBodegas.map((bodega) => (
                                    <tr key={bodega.id} className="hover:bg-[#F7F9FC] transition-colors group cursor-pointer" onClick={() => handleOpenModal(bodega)}>
                                        <td className="px-6 py-4">
                                            {bodega.code ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-white text-xs font-mono text-[#475569] border border-[#E2E8F0] shadow-sm">
                                                    {bodega.code}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-[#94A3B8] italic">Sin código</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                                    <Warehouse className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#0F172A]">{bodega.name}</p>
                                                    <span className="inline-flex mt-1 items-center gap-1 px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[10px] font-bold uppercase">
                                                        Centro de Acopio
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-[#475569] line-clamp-2 max-w-[200px]">
                                                {bodega.address || bodega.description || <span className="text-[#94A3B8] italic">Sin detalles extra</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#475569]">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                                                {new Date(bodega.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(bodega); }}
                                                    className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(bodega.id, bodega.name); }}
                                                    className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                                                    title="Eliminar"
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

            {/* Modal de Creación/Edición */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => !isSaving && setIsModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-white">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20">
                                    <Warehouse className="h-5 w-5 text-[#2563EB]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-[#0F172A]">
                                        {editingBodega ? 'Editar Bodega' : 'Nueva Bodega'}
                                    </h2>
                                    <p className="text-xs text-[#475569]">Configuración de lugar físico</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="p-2 hover:bg-[#F7F9FC] rounded-lg transition-colors disabled:opacity-50">
                                <X className="w-5 h-5 text-[#94A3B8]" />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5 flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> Nombre de la Bodega *
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm"
                                    placeholder="Ej: Bodega Central de Zona Libre"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5 flex items-center gap-1">
                                    <Hash className="h-3.5 w-3.5" /> Código Interno (Opcional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#F7F9FC] font-mono text-sm uppercase"
                                    placeholder="Ej: BOD-CEN"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5 flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5" /> Descripción / Uso (Opcional)
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm resize-none"
                                    placeholder="Bodega principal para almacenamiento de productos importados..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                            <button
                                className="px-4 py-2 text-sm font-medium text-[#475569] border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F1F5F9] transition-colors"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Warehouse className="w-4 h-4 animate-bounce" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Guardar Bodega
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
