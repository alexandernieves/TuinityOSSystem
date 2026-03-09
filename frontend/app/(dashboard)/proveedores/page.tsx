'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, MapPin, Mail, Phone, MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonGrid } from '@/components/ui/skeleton-grid';

interface Supplier {
    id: string;
    name: string;
    country: string;
    contact?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
}

export default function ProveedoresPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        country: '',
        contact: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const data = await api.getSuppliers();
            setSuppliers(data);
        } catch (error: any) {
            toast.error('Error al cargar proveedores', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenAdd = () => {
        setFormData({ name: '', country: '', contact: '', email: '', phone: '' });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name,
            country: supplier.country,
            contact: supplier.contact || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDeleteOpen(true);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createSupplier(formData);
            toast.success('Proveedor creado exitosamente');
            setIsAddOpen(false);
            loadSuppliers();
        } catch (error: any) {
            toast.error('Error al crear proveedor', { description: error.message });
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier) return;
        try {
            await api.updateSupplier(selectedSupplier.id, formData);
            toast.success('Proveedor actualizado exitosamente');
            setIsEditOpen(false);
            loadSuppliers();
        } catch (error: any) {
            toast.error('Error al actualizar proveedor', { description: error.message });
        }
    };

    const handleDeleteSubmit = async () => {
        if (!selectedSupplier) return;
        try {
            await api.deleteSupplier(selectedSupplier.id);
            toast.success('Proveedor eliminado');
            setIsDeleteOpen(false);
            loadSuppliers();
        } catch (error: any) {
            toast.error('Error al eliminar proveedor', { description: error.message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona los proveedores de mercancía</p>
                </div>
                <Button onClick={handleOpenAdd}>
                    <Plus className="h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o país..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                </div>
            </div>

            {loading ? (
                <SkeletonGrid items={6} />
            ) : filteredSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-[#2a2a2a] py-16 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No se encontraron proveedores</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza creando tu primer proveedor'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {filteredSuppliers.map((supplier, index) => (
                            <motion.div
                                key={supplier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="group relative p-6 mb-0">
                                    <div className="absolute right-4 top-4">
                                        <Dropdown placement="bottom-end">
                                            <DropdownTrigger>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Acciones de proveedor">
                                                <DropdownItem key="edit" startContent={<Edit className="h-4 w-4" />} onPress={() => handleOpenEdit(supplier)}>
                                                    Editar
                                                </DropdownItem>
                                                <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="h-4 w-4" />} onPress={() => handleOpenDelete(supplier)}>
                                                    Eliminar
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                    <div className="mb-4 flex items-center gap-3 pr-8">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1" title={supplier.name}>{supplier.name}</h3>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {supplier.country}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5 border-t border-gray-100 dark:border-[#2a2a2a] pt-4 text-sm text-gray-600 dark:text-gray-400">
                                        {supplier.contact && (
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3.5 w-3.5" />
                                                {supplier.contact}
                                            </div>
                                        )}
                                        {supplier.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5" />
                                                {supplier.email}
                                            </div>
                                        )}
                                        {supplier.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" />
                                                {supplier.phone}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modals */}
            <CustomModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} size="md">
                <form onSubmit={handleAddSubmit}>
                    <CustomModalHeader onClose={() => setIsAddOpen(false)}>Nuevo Proveedor</CustomModalHeader>
                    <CustomModalBody className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Empresa *</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">País *</label>
                            <input required value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
                            <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                    </CustomModalBody>
                    <CustomModalFooter>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </CustomModalFooter>
                </form>
            </CustomModal>

            <CustomModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} size="md">
                <form onSubmit={handleEditSubmit}>
                    <CustomModalHeader onClose={() => setIsEditOpen(false)}>Editar Proveedor</CustomModalHeader>
                    <CustomModalBody className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de Empresa *</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">País *</label>
                            <input required value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
                            <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 block w-full rounded-lg border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] shadow-sm sm:text-sm" />
                        </div>
                    </CustomModalBody>
                    <CustomModalFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button type="submit">Actualizar</Button>
                    </CustomModalFooter>
                </form>
            </CustomModal>

            <CustomModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} size="sm">
                <CustomModalHeader onClose={() => setIsDeleteOpen(false)}>Eliminar Proveedor</CustomModalHeader>
                <CustomModalBody>
                    ¿Estás seguro que deseas eliminar permanente a <strong>{selectedSupplier?.name}</strong>? Esta acción no se puede revertir.
                </CustomModalBody>
                <CustomModalFooter>
                    <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDeleteSubmit}>Eliminar</Button>
                </CustomModalFooter>
            </CustomModal>
        </div>
    );
}
