
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ClipboardCheck,
    Plus,
    Calendar,
    MapPin,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    SelectItem
} from "@heroui/react";

type InventoryCount = {
    id: string;
    description: string;
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    branch: { name: string };
    createdAt: string;
    items: any[];
};

type Branch = { id: string; name: string };

export default function InventoryCountListPage() {
    const router = useRouter();
    const [counts, setCounts] = useState<InventoryCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [branchId, setBranchId] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchCounts();
        fetchBranches();
    }, []);

    const fetchCounts = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;
        setLoading(true);
        try {
            const data = await api<InventoryCount[]>('/inventory-counts', { accessToken: session.accessToken });
            setCounts(data);
        } catch (e) {
            toast.error('Error al cargar conteos');
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;
        try {
            const data = await api<Branch[]>('/branches', { accessToken: session.accessToken });
            setBranches(data);
            if (data.length > 0) setBranchId(data[0].id);
        } catch (e) { console.error(e) }
    };

    const handleCreate = async () => {
        if (!description || !branchId) {
            toast.error('Complete la descripción y seleccione sucursal');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) return;

        setCreating(true);
        try {
            const newCount = await api<InventoryCount>('/inventory-counts', {
                method: 'POST',
                accessToken: session.accessToken,
                body: { branchId, description }
            });
            toast.success('Sesión de conteo creada');
            setIsModalOpen(false);
            router.push(`/dashboard/inventario/conteo/${newCount.id}`);
        } catch (e) {
            toast.error('Error al crear conteo');
        } finally {
            setCreating(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'DRAFT': return { label: 'Borrador', color: 'bg-gray-100 text-gray-600' };
            case 'IN_PROGRESS': return { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' };
            case 'COMPLETED': return { label: 'Completado', color: 'bg-green-100 text-green-700' };
            case 'CANCELLED': return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
            default: return { label: status, color: 'bg-gray-100' };
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventario Físico</h1>
                    <p className="text-gray-500">Gestione sesiones de conteo y ajustes de inventario</p>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsModalOpen(true)}
                >
                    Nuevo Conteo
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse bg-gray-100 rounded-lg"></div>)
                ) : counts.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>No hay sesiones de conteo activas</p>
                    </div>
                ) : (
                    counts.map(count => {
                        const status = getStatusInfo(count.status);
                        return (
                            <Card key={count.id} hover className="cursor-pointer group relative overflow-hidden" onClick={() => router.push(`/dashboard/inventario/conteo/${count.id}`)}>
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${status.color}`}>
                                            {status.label.toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(count.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{count.description}</h3>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {count.branch.name}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <span className="text-sm text-gray-500">
                                            {count.status === 'COMPLETED' ? 'Finalizado' : 'Toca para continuar'}
                                        </span>
                                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Iniciar Nueva Sesión de Conteo</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Referencia</label>
                                <Input
                                    placeholder="Ej: Conteo Mensual Bodega Principal"
                                    value={description}
                                    onValueChange={setDescription}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal a Auditar</label>
                                <Select
                                    label="Seleccionar Sucursal"
                                    selectedKeys={branchId ? [branchId] : []}
                                    onChange={(e) => setBranchId(e.target.value)}
                                >
                                    {branches.map(b => (
                                        <SelectItem key={b.id} textValue={b.name}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex gap-2">
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                <p>Al iniciar, podrá escanear productos y comparar contra el stock del sistema. Las diferencias se ajustarán al finalizar.</p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant="primary"
                            isLoading={creating}
                            onClick={handleCreate}
                        >
                            Crear Sesión
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
