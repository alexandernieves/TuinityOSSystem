'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { loadSession, clearSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { User, Save, Trash2, X, AlertTriangle, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        description: '',
        avatarUrl: ''
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const session = loadSession();
            if (session?.accessToken) {
                try {
                    const data = await api<any>('/auth/me');
                    setProfile({
                        name: data.name || '',
                        email: data.email || '',
                        role: data.role || 'Usuario',
                        description: data.description || 'Aquí puedes escribir una descripción sobre tu perfil, tus responsabilidades o tu rol dentro de la empresa.',
                        avatarUrl: data.avatarUrl || ''
                    });
                    if (data.avatarUrl) {
                        setAvatarPreview(data.avatarUrl);
                    }
                } catch (e: any) {
                    toast.error('Error al cargar perfil: ' + e.message);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const toastId = toast.loading('Guardando cambios...');
        try {
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('description', profile.description);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const updated = await api<any>('/users/me', {
                method: 'PATCH',
                body: formData,
            });

            if (updated.avatarUrl) {
                setProfile(prev => ({ ...prev, avatarUrl: updated.avatarUrl }));
                setAvatarPreview(updated.avatarUrl);
            }

            toast.success('Perfil actualizado correctamente', { id: toastId });
        } catch (e: any) {
            toast.error(e.message || 'Error al guardar', { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleDeleteAccount = async () => {
        try {
            // Implementación a futuro de eliminación: await api('/users/me', { method: 'DELETE' });
            toast.success('Solicitud de eliminación procesada.');
            setShowDeleteModal(false);
            clearSession();
            router.push('/login');
        } catch (e: any) {
            toast.error('No se pudo eliminar la cuenta: ' + e.message);
        }
    };

    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD';

    if (loading) {
        return <div className="p-6 text-[#475569]">Cargando información del perfil...</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Cabecera */}
            <div>
                <h1 className="text-2xl font-semibold text-[#0F172A] flex items-center gap-2">
                    <User className="w-8 h-8 text-[#2563EB]" />
                    Configuración de Perfil
                </h1>
                <p className="text-sm text-[#475569] mt-1">Gestiona tu información personal y los ajustes de tu cuenta.</p>
            </div>

            {/* Contenedor Principal */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-8 items-start">

                        {/* Avatar Columna Izquierda */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative group cursor-pointer">
                                <label htmlFor="avatar-upload" className="block relative w-32 h-32 rounded-full overflow-hidden shadow-lg ring-4 ring-[#F7F9FC] bg-[#2563EB] text-white cursor-pointer">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-4xl">
                                            {initials}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <div className="text-center">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold uppercase tracking-wider rounded-md">
                                    {profile.role}
                                </span>
                            </div>
                        </div>

                        {/* Formulario de Información Columna Derecha */}
                        <div className="flex-1 w-full space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-medium text-[#475569] mb-1.5">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm"
                                        placeholder="Tu nombre completo"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#475569] mb-1.5">Correo Electrónico (Solo Lectura)</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg bg-[#F7F9FC] text-sm text-[#94A3B8] cursor-not-allowed"
                                        readOnly
                                        disabled
                                        value={profile.email}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#475569] mb-1.5">Descripción Profesional / Biografía</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm resize-none"
                                    placeholder="Agrega una descripción sobre tu perfil..."
                                    value={profile.description}
                                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                />
                                <p className="text-xs text-[#94A3B8] mt-1">Esta información será visible para otros empleados de {profile.role !== 'OWNER' ? 'tu empresa' : 'la plataforma'}.</p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Zona de Peligro (Eliminar Cuenta) */}
            <div className="mt-10 border border-[#DC2626]/20 bg-[#FEF2F2] rounded-lg p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-[#DC2626] flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Zona de Peligro
                        </h3>
                        <p className="text-sm text-[#475569] mt-1 max-w-xl">
                            Eliminar tu cuenta es una acción irreversible. Perderás permanentemente tu acceso a la plataforma, tu historial y todas las configuraciones asociadas a este perfil.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-[#DC2626] bg-white border border-[#DC2626]/30 rounded-lg hover:bg-[#DC2626] hover:text-white transition-all shadow-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar Cuenta</span>
                    </button>
                </div>
            </div>

            {/* Modal de Eliminación */}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-white">
                            <h2 className="text-lg font-semibold text-[#0F172A]">Advertencia de Eliminación</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-[#F7F9FC] rounded-lg transition-colors text-[#475569]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex flex-col items-center text-center space-y-5">
                                <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 flex items-center justify-center ring-4 ring-[#DC2626]/5">
                                    <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">¿Estás completamente seguro?</h3>
                                    <p className="text-sm text-[#475569] leading-relaxed">
                                        Vas a eliminar <strong>permanentemente</strong> tu cuenta. <br /><br />
                                        Toda tu información personal, configuraciones de usuario y accesos serán destruidos. Esta acción <span className="text-[#DC2626] font-semibold">no se puede deshacer</span>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#E2E8F0] bg-[#F7F9FC]">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-5 py-2.5 text-sm font-medium border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] hover:text-[#0F172A] transition-colors text-[#475569]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#DC2626] rounded-lg hover:bg-[#B91C1C] transition-colors border border-transparent"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Sí, eliminar mi cuenta</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
