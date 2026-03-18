'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, MapPin, Mail, Phone, MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/services/api';
import { SkeletonGrid } from '@/components/ui/skeleton-grid';
import { cn } from '@/lib/utils/cn';

interface Supplier {
    id: string;
    code: string;
    legalName: string;
    tradeName?: string;
    country: string;
    contact?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    currentBalance: number;
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
        (s.legalName?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (s.code?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        (s.country?.toLowerCase().includes(searchQuery.toLowerCase()) || '')
    );

    const handleOpenAdd = () => {
        setFormData({ name: '', country: '', contact: '', email: '', phone: '' });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.legalName,
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

    const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
    const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";
    const searchInputClass = "w-full px-3 py-[7px] pl-10 h-10 rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all";
    const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#1e3156] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const buttonSecondaryClass = "px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors disabled:opacity-50";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona los proveedores de mercancía</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className={buttonPrimaryClass}
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Proveedor
                </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o país..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={searchInputClass}
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(supplier)} className="flex items-center gap-2">
                                                    <Edit className="h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDelete(supplier)} className="flex items-center gap-2 text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="mb-4 flex items-center gap-3 pr-8">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1" title={supplier.legalName}>{supplier.legalName}</h3>
                                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-500">
                                                {supplier.code}
                                            </div>
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
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] text-gray-500">Saldo Pendiente:</span>
                                                <span className={cn(
                                                    "font-bold text-[14px]",
                                                    Number(supplier.currentBalance) > 0 ? "text-red-600" : "text-green-600"
                                                )}>
                                                    ${Number(supplier.currentBalance).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nuevo Proveedor</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit}>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className={labelClass}>Nombre de Empresa *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>País *</label>
                                <input required value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Persona de Contacto</label>
                                <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Correo Electrónico</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setIsAddOpen(false)} className={buttonSecondaryClass}>Cancelar</button>
                            <button type="submit" className={buttonPrimaryClass}>Guardar</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Proveedor</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className={labelClass}>Nombre de Empresa *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>País *</label>
                                <input required value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Persona de Contacto</label>
                                <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Correo Electrónico</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                            </div>
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setIsEditOpen(false)} className={buttonSecondaryClass}>Cancelar</button>
                            <button type="submit" className={buttonPrimaryClass}>Actualizar</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Eliminar Proveedor</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
                        ¿Estás seguro que deseas eliminar permanente a <strong>{selectedSupplier?.legalName}</strong>? Esta acción no se puede revertir.
                    </p>
                    <DialogFooter>
                        <button type="button" onClick={() => setIsDeleteOpen(false)} className={buttonSecondaryClass}>Cancelar</button>
                        <button type="button" onClick={handleDeleteSubmit} className="flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-red-600 text-white font-semibold text-[13px] hover:bg-red-700 transition-all">Eliminar</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
