'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Plus,
    Edit3,
    Trash2,
    Search,
    MapPin,
    Hash,
    Calendar,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import {
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Divider,
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type Branch = {
    id: string;
    name: string;
    code: string;
    createdAt: string;
};

export default function SucursalesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

    // Form state
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        const session = loadSession();
        if (!session) return;
        setLoading(true);
        try {
            const data = await api<Branch[]>('/branches', { accessToken: session.accessToken });
            setBranches(data);
        } catch (error: any) {
            toast.error('Error al cargar sucursales');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setName(branch.name);
            setCode(branch.code);
        } else {
            setEditingBranch(null);
            setName('');
            setCode('');
        }
        onOpen();
    };

    const handleSave = async () => {
        if (!name || !code) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        const session = loadSession();
        if (!session) return;

        setIsSaving(true);
        try {
            if (editingBranch) {
                await api(`/branches/${editingBranch.id}`, {
                    method: 'PATCH',
                    accessToken: session.accessToken,
                    body: { name, code }
                });
                toast.success('Sucursal actualizada');
            } else {
                await api('/branches', {
                    method: 'POST',
                    accessToken: session.accessToken,
                    body: { name, code }
                });
                toast.success('Sucursal creada');
            }
            fetchBranches();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar sucursal');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;

        const session = loadSession();
        if (!session) return;

        try {
            await api(`/branches/${id}`, {
                method: 'DELETE',
                accessToken: session.accessToken
            });
            toast.success('Sucursal eliminada');
            fetchBranches();
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar sucursal');
        }
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#2980B9]/10">
                            <Building2 className="h-6 w-6 text-[#2980B9]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-[#2C3E50]">Gestión de Sucursales</h1>
                            <p className="text-sm text-[#5A6C7D]">Administra ubicaciones físicas y bodegas centrales</p>
                        </div>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => handleOpenModal()}
                >
                    Nueva Sucursal
                </Button>
            </div>

            {/* Main Content */}
            <Card>
                <div className="flex flex-col gap-4 border-b border-[#E1E8ED] p-6 md:flex-row md:items-center md:justify-between">
                    <Input
                        placeholder="Buscar por nombre o código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        className="md:w-96"
                    />
                    <Badge variant="info">
                        {filteredBranches.length} SUCURSALES ACTIVAS
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F4F7F6]">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Código</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Nombre de Sucursal</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-[#2C3E50]">Registro</th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-[#2C3E50]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E1E8ED]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-sm text-[#5A6C7D] animate-pulse">
                                        Cargando sucursales...
                                    </td>
                                </tr>
                            ) : filteredBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <Building2 className="mx-auto mb-4 h-12 w-12 text-[#B8C5D0]" />
                                        <p className="text-sm text-[#5A6C7D]">No se encontraron sucursales</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id} className="group transition-colors hover:bg-[#F4F7F6]/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="info" className="font-mono text-[10px] uppercase">
                                                    {branch.code}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-[#2C3E50]">{branch.name}</span>
                                                <span className="text-[10px] uppercase tracking-widest text-[#5A6C7D]">Punto Operativo</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#5A6C7D]">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {new Date(branch.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    isIconOnly
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenModal(branch)}
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#C0392B] hover:bg-[#C0392B]/10"
                                                    onClick={() => handleDelete(branch.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Creación/Edición */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                backdrop="blur"
                size="md"
                classNames={{
                    base: "rounded-2xl border border-[#E1E8ED] bg-white shadow-2xl",
                    header: "border-b border-[#E1E8ED] py-6",
                    body: "py-8",
                    footer: "border-t border-[#E1E8ED] py-4",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2980B9]/10">
                                        <Building2 className="h-5 w-5 text-[#2980B9]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#2C3E50]">
                                            {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                                        </h2>
                                        <p className="text-xs text-[#5A6C7D]">Configuración de ubicación operativa</p>
                                    </div>
                                </div>
                            </ModalHeader>
                            <ModalBody className="space-y-6">
                                <Input
                                    label="Nombre de la Sucursal"
                                    placeholder="Ej: Bodega Central Colón"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    leftIcon={<MapPin className="h-4 w-4" />}
                                />
                                <Input
                                    label="Código de Sucursal"
                                    placeholder="Ej: COLON"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    leftIcon={<Hash className="h-4 w-4" />}
                                    className="font-mono uppercase"
                                    maxLength={10}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="ghost" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    leftIcon={<Plus className="h-4 w-4" />}
                                >
                                    {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
