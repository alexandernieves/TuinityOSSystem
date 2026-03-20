'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Building2, MapPin, Mail, Phone, MoreVertical, Edit, Trash2, Users, Upload, UploadCloud, FileCheck2, CheckCircle2, X, FileSpreadsheet, AlertCircle, Loader2, DownloadCloud, FileText } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api } from '@/lib/services/api';
import { SkeletonGrid } from '@/components/ui/skeleton-grid';
import { cn } from '@/lib/utils/cn';
import { Progress } from "@/components/ui/progress";
import { Pagination, usePagination } from "@/components/ui/pagination";

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
    const [isImportOpen, setIsImportOpen] = useState(false);
    
    // Import states
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [allProcessedRows, setAllProcessedRows] = useState<any[]>([]);

    const handleCloseImport = () => {
        setIsImportOpen(false);
        setTimeout(() => {
            setSelectedFile(null);
            setImportResults(null);
            setImportSuccess(false);
            setAllProcessedRows([]);
            setImportProgress(0);
        }, 200); // clear after animation
    };

    const handleOpenImport = () => {
        setSelectedFile(null);
        setImportResults(null);
        setImportSuccess(false);
        setAllProcessedRows([]);
        setImportProgress(0);
        setIsImportOpen(true);
    };
    
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

    const {
        currentPage,
        totalPages,
        totalItems,
        rowsPerPage,
        paginatedData,
        handlePageChange,
        handleRowsPerPageChange,
    } = usePagination(filteredSuppliers, 10);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setImportResults(null);
        setImportSuccess(false);
        setAllProcessedRows([]);

        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

                    if (jsonData.length <= 1) {
                        toast.error("El archivo está vacío");
                        return;
                    }

                    // Detect headers
                    let headerRowIndex = 0;
                    let headers: string[] = [];
                    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
                        const row = jsonData[i];
                        if (row && Array.isArray(row) && row.some((v: any) => 
                            v?.toString().toLowerCase().includes('nombre') || 
                            v?.toString().toLowerCase().includes('legal') ||
                            v?.toString().toLowerCase().includes('empresa')
                        )) {
                            headerRowIndex = i;
                            headers = row.map((h: any) => h?.toString().trim().toLowerCase() || '');
                            break;
                        }
                    }

                    if (headers.length === 0) {
                        headers = jsonData[0]?.map((h: any) => h?.toString().trim().toLowerCase() || '') || [];
                    }

                    // Robust delimiter fix
                    if (headers.length === 1 && (headers[0].includes(',') || headers[0].includes(';'))) {
                        const delimiter = headers[0].includes(',') ? ',' : ';';
                        headers = headers[0].split(delimiter).map(h => h.trim().toLowerCase());
                    }

                    const colMap: any = {};
                    headers.forEach((h: string, i: number) => {
                        const clean = h.trim().toLowerCase();
                        if (colMap.legalName === undefined && (clean.includes('nombre') || clean.includes('legal') || clean === 'empresa' || clean.includes('razon') || clean.includes('razón') || clean.includes('proveedor') || clean.includes('supplier'))) colMap.legalName = i;
                        if (colMap.code === undefined && (clean.includes('codigo') || clean.includes('código') || clean.includes('referencia') || clean === 'code')) colMap.code = i;
                        if (colMap.tradeName === undefined && (clean.includes('comercial') || clean === 'fantasia')) colMap.tradeName = i;
                        if (colMap.taxId === undefined && (clean.includes('nit') || clean.includes('rnc') || clean.includes('tax') || clean.includes('identifica'))) colMap.taxId = i;
                        if (colMap.email === undefined && (clean.includes('email') || clean.includes('correo') || clean === 'mail')) colMap.email = i;
                        if (colMap.phone === undefined && (clean.includes('teléfono') || clean.includes('telefono') || clean.includes('phone') || clean === 'movil')) colMap.phone = i;
                        if (colMap.country === undefined && (clean.includes('país') || clean.includes('pais') || clean.includes('country'))) colMap.country = i;
                        if (colMap.address === undefined && (clean.includes('dirección') || clean.includes('direccion') || clean.includes('address'))) colMap.address = i;
                        if (colMap.city === undefined && (clean.includes('ciudad') || clean.includes('city'))) colMap.city = i;
                        if (colMap.paymentTerms === undefined && (clean.includes('términos') || clean.includes('terminos') || clean.includes('plazo') || clean.includes('pago'))) colMap.paymentTerms = i;
                    });

                    const rows = jsonData.slice(headerRowIndex + 1).map((rawRow, index) => {
                        let row = rawRow;
                        if (Array.isArray(row) && row.length === 1 && typeof row[0] === 'string' && (row[0].includes(',') || row[0].includes(';'))) {
                            const delimiter = row[0].includes(',') ? ',' : ';';
                            row = row[0].split(delimiter);
                        }

                        if (!row || (!row[colMap.legalName] && !row[colMap.code])) return null;
                        return {
                            legalName: row[colMap.legalName]?.toString().trim() || 'N/A',
                            code: colMap.code !== undefined ? row[colMap.code]?.toString().trim() : null,
                            tradeName: colMap.tradeName !== undefined ? row[colMap.tradeName]?.toString().trim() : null,
                            taxId: colMap.taxId !== undefined ? row[colMap.taxId]?.toString().trim() : null,
                            email: colMap.email !== undefined ? row[colMap.email]?.toString().trim() : null,
                            phone: colMap.phone !== undefined ? row[colMap.phone]?.toString().trim() : null,
                            country: colMap.country !== undefined ? row[colMap.country]?.toString().trim() : 'General',
                            address: colMap.address !== undefined ? row[colMap.address]?.toString().trim() : null,
                            city: colMap.city !== undefined ? row[colMap.city]?.toString().trim() : null,
                            paymentTerms: colMap.paymentTerms !== undefined ? parseInt(row[colMap.paymentTerms]) || 0 : 0,
                            rowNumber: index + headerRowIndex + 2
                        };
                    }).filter(Boolean);

                    setAllProcessedRows(rows);
                } catch (error: any) {
                    toast.error("Error al procesar archivo: " + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const downloadTemplate = () => {
        const headers = ["Legal Name", "Code", "Trade Name", "Tax ID", "Email", "Phone", "Country", "Address", "City", "Payment Terms"];
        const data = [
            ["Ejemplo Corp", "PROV-001", "Ejemplo Fantasia", "123-45678-9", "admin@ejemplo.com", "8091234567", "República Dominicana", "Av. Central 123", "Santo Domingo", "30"]
        ];
        const csvContent = [headers.join(","), ...data.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "plantilla_proveedores.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const onConfirmImport = async () => {
        if (!selectedFile || allProcessedRows.length === 0) {
            toast.error("No hay datos para importar");
            return;
        }

        setIsImporting(true);
        setImportProgress(0);
        
        try {
            const rows = allProcessedRows;
            const totalRows = rows.length;
            const batchSize = 5;
            let successTotal = 0;
            let failedTotal = 0;
            const errorsTotal: string[] = [];

            for (let i = 0; i < totalRows; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                try {
                    const batchResult = await api.importSuppliersBatch(batch);
                    if (batchResult.success) {
                        successTotal += (batchResult.details?.success || 0);
                        failedTotal += (batchResult.details?.failed || 0);
                        if (batchResult.details?.errors) {
                            errorsTotal.push(...batchResult.details.errors);
                        }
                    }
                    // Breve pausa para asegurar que la barra de progreso se anime fluidamente
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err: any) {
                    failedTotal += batch.length;
                    errorsTotal.push(`Lote fallido: ${err.message}`);
                }
                
                setImportProgress(Math.round(((i + batch.length) / totalRows) * 100));
            }

            setImportResults({
                success: successTotal,
                failed: failedTotal,
                errors: errorsTotal
            });
            setImportProgress(100);
            setImportSuccess(true);
            loadSuppliers();
            toast.success('Importación finalizada');
        } catch (err: any) {
            toast.error('Error de importación', { description: err.message });
        } finally {
            setIsImporting(false);
        }
    };

    const inputClass = "w-full px-3 py-[7px] rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] hover:border-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-[#008060] transition-all dropdown-shadow";
    const labelClass = "block text-[13px] font-semibold text-[#1a1a1a] mb-1.5";
    const buttonPrimaryClass = "flex items-center justify-center gap-2 px-6 py-2 rounded-[10px] bg-[#253D6B] text-white font-semibold text-[13px] shadow-[0_0_0_1px_rgba(0,0,0,0.05)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-2.5px_0_rgba(0,0,0,0.2)] hover:bg-[#1e3156] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const buttonSecondaryClass = "px-4 py-2 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona los proveedores de mercancía</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleOpenImport} variant="outline" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2a2a2a] rounded-[10px] text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        Importar
                    </Button>
                    <Button onClick={handleOpenAdd} className={buttonPrimaryClass}>
                        <Plus className="h-4 w-4" />
                        Nuevo Proveedor
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, código o país..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-[7px] pl-10 h-10 rounded-[8px] border border-[#c9cccf] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#8c9196] focus:outline-none focus:ring-2 focus:ring-[#008060] transition-all"
                />
            </div>

            {loading ? (
                <SkeletonGrid items={6} />
            ) : filteredSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111111] rounded-2xl border border-dashed border-gray-200 dark:border-[#2a2a2a]">
                    <div className="h-20 w-20 bg-gray-50 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                        <Building2 className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No se encontraron proveedores</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-8">
                        {searchQuery 
                            ? `No hay proveedores que coincidan con "${searchQuery}".` 
                            : "Aún no has agregado proveedores. Puedes crear uno nuevo o importar una lista desde Excel."}
                    </p>
                    <div className="flex gap-4">
                        <Button 
                            onClick={handleOpenImport}
                            variant="outline"
                            className="rounded-xl px-6 h-11 border-gray-200 dark:border-[#2a2a2a]"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Importar CSV
                        </Button>
                        <Button 
                            onClick={handleOpenAdd}
                            className={buttonPrimaryClass}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Proveedor
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {paginatedData.map((supplier) => (
                            <motion.div
                                key={supplier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="relative group overflow-hidden border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#111111] hover:shadow-lg transition-all p-5">
                                    <div className="absolute right-4 top-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
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
                
                    {/* Controles de Paginación */}
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            rowsPerPage={rowsPerPage}
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            itemName="proveedores"
                        />
                    </div>
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
                            <Button type="button" onClick={() => setIsAddOpen(false)} variant="ghost" className={buttonSecondaryClass}>Cancelar</Button>
                            <Button type="submit" className={buttonPrimaryClass}>Guardar</Button>
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
                                <label className={labelClass}>Nombre Legal *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>País *</label>
                                <input required value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Contacto</label>
                                <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Teléfono</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={() => setIsEditOpen(false)} variant="ghost" className={buttonSecondaryClass}>Cancelar</Button>
                            <Button type="submit" className={buttonPrimaryClass}>Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Eliminar Proveedor
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            ¿Estás seguro de que deseas eliminar a <strong>{selectedSupplier?.legalName}</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsDeleteOpen(false)} variant="ghost" className={buttonSecondaryClass}>Cancelar</Button>
                        <Button type="button" onClick={handleDeleteSubmit} className="bg-red-600 text-white hover:bg-red-700 rounded-[10px] px-6">Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Modal */}
            <Dialog open={isImportOpen} onOpenChange={(open) => !isImporting && (open ? handleOpenImport() : handleCloseImport())}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <FileSpreadsheet className="h-6 w-6 text-brand-600" />
                            Importar Proveedores
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Sube un archivo Excel (.xlsx, .xls) o CSV para importar proveedores de forma masiva.
                        </DialogDescription>
                    </DialogHeader>

                    {!importSuccess ? (
                        <div className="py-4 space-y-4">
                            {!isImporting ? (
                                <>
                                    <div className={cn(
                                        "relative flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] p-12 transition-all group min-h-[240px]",
                                        "hover:border-brand-500 cursor-pointer bg-gray-50/50 dark:bg-black/20"
                                    )}>
                                        {!selectedFile ? (
                                            <>
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls, .csv"
                                                    onChange={handleFileChange}
                                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                />
                                                <div className="h-16 w-16 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <UploadCloud className="h-8 w-8 text-brand-600" />
                                                </div>
                                                <p className="text-[15px] font-bold text-gray-900 dark:text-white">
                                                    Haz clic para subir o arrastra un archivo
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">Excel o CSV (Máx. 10MB)</p>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-center">
                                                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                                                    <FileText className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <p className="text-[15px] font-bold text-gray-900 dark:text-white mb-1">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mb-4">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        setAllProcessedRows([]);
                                                    }}
                                                    className="text-red-500 hover:text-red-600 font-bold text-[13px] transition-colors"
                                                >
                                                    Cambiar archivo
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {!selectedFile && (
                                        <div className="rounded-[20px] bg-blue-50/50 dark:bg-blue-900/10 p-5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                                                <p className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">COLUMNAS PERMITIDAS:</p>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-300 font-medium">
                                                Nombre Legal, Referencia, Nombre Comercial, Tax ID (NIT/RNC), Email, Teléfono, País, Dirección, Ciudad, Plazo Pago.
                                            </p>
                                            <button 
                                                onClick={downloadTemplate}
                                                className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors uppercase tracking-tight"
                                            >
                                                <DownloadCloud className="h-3.5 w-3.5" />
                                                DESCARGAR PLANTILLA DE EJEMPLO (.CSV)
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-4 py-8 text-center min-h-[240px] flex flex-col justify-center">
                                    <div className="flex justify-center mb-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                                        PROCESANDO...
                                      </p>
                                      <div className="px-10">
                                        <Progress value={importProgress} className="h-2 outline-none border-none bg-gray-100" />
                                        <p className="mt-2 text-xs text-brand-600 font-bold">{importProgress}%</p>
                                      </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-10 text-center animate-in zoom-in duration-500">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6",
                                    importResults.failed > 0 && importResults.success === 0 
                                        ? "bg-rose-100 dark:bg-rose-950/30 text-rose-600" 
                                        : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600"
                                )}
                            >
                                {importResults.failed > 0 && importResults.success === 0 ? (
                                    <AlertCircle className="h-12 w-12" />
                                ) : (
                                    <CheckCircle2 className="h-12 w-12" />
                                )}
                            </motion.div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                {importResults.failed > 0 && importResults.success === 0 
                                    ? "Importación Fallida" 
                                    : "¡Importación Exitosa!"}
                            </h3>
                            <p className="text-gray-500 text-sm mb-8">
                                {importResults.failed > 0 && importResults.success === 0 
                                    ? "Ocurrieron problemas en algunas filas del archivo." 
                                    : "Los proveedores han sido procesados correctamente."}
                            </p>
                            
                            {importResults.errors?.length > 0 && (
                                <div className="mt-4 max-h-[300px] w-full overflow-y-auto rounded-[20px] border border-rose-100 bg-rose-50/20 p-5 text-left scrollbar-thin">
                                    <p className="text-[13px] font-black text-rose-800 mb-4 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        ERRORES DETECTADOS ({importResults.errors.length}):
                                    </p>
                                    <ul className="space-y-3">
                                        {importResults.errors.map((err: string, i: number) => (
                                            <li key={i} className="text-[12px] text-rose-600 flex items-start gap-2 font-semibold bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-rose-100/60 shadow-sm transition hover:border-rose-300">
                                                <X className="h-4 w-4 mt-0.5 shrink-0 text-rose-500" />
                                                <span>{err}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t border-gray-100 dark:border-[#2a2a2a] pt-6 mt-2">
                        <Button 
                            variant="secondary" 
                            disabled={isImporting}
                            onClick={handleCloseImport}
                            className="px-8 h-12 rounded-[14px] bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm border-none transition-all"
                        >
                            {importResults ? "Cerrar" : "Cancelar"}
                        </Button>
                        
                        {selectedFile && !isImporting && !importSuccess && (
                            <Button 
                                onClick={onConfirmImport}
                                className="px-8 h-12 rounded-[14px] bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all transform active:scale-95"
                            >
                                <FileCheck2 className="h-5 w-5" />
                                Confirmar e Importar
                            </Button>
                        )}

                        {importResults && (
                          <Button 
                            onClick={handleCloseImport}
                            className="px-8 h-12 rounded-[14px] bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm"
                          >
                            Listo
                          </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
