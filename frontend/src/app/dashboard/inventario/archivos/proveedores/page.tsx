'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Edit, Trash2, X, Users,
    ChevronLeft, ChevronRight, Info, AlertCircle, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Pagination } from '@/components/shared/Pagination';
import { ActionButton } from '@/components/shared/ActionButton';
import { Package, Download, Upload, Tag, Mail, Phone } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Supplier {
    id: string;
    code: string | null;
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    phone2: string | null;
    fax: string | null;
    poBox: string | null;
    contactPerson: string | null;
    address: string | null;
    country: string | null;
    isActive: boolean;
    inventoryAccount: string | null;
    supplierAccount: string | null;
    _count?: { products: number };
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }
interface ApiResponse {
    items: Supplier[];
    meta: ApiMeta;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ProductCountBadge({ count }: { count: number }) {
    return (
        <StatusBadge
            status={count > 0 ? 'optimo' : 'default'}
            label={`${count} PRODUCTOS`}
        />
    );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
interface FormModalProps {
    supplier?: Supplier | null;
    saving: boolean;
    onSave: (data: Partial<Supplier>) => void;
    onClose: () => void;
}

function SupplierFormModal({ supplier, saving, onSave, onClose }: FormModalProps) {
    const isEdit = !!supplier;
    const [name, setName] = useState(supplier?.name ?? '');
    const [code, setCode] = useState(supplier?.code ?? '');
    const [taxId, setTaxId] = useState(supplier?.taxId ?? '');
    const [email, setEmail] = useState(supplier?.email ?? '');
    const [phone, setPhone] = useState(supplier?.phone ?? '');
    const [phone2, setPhone2] = useState(supplier?.phone2 ?? '');
    const [fax, setFax] = useState(supplier?.fax ?? '');
    const [poBox, setPoBox] = useState(supplier?.poBox ?? '');
    const [contactPerson, setContactPerson] = useState(supplier?.contactPerson ?? '');
    const [address, setAddress] = useState(supplier?.address ?? '');
    const [country, setCountry] = useState(supplier?.country ?? '');
    const [isActive, setIsActive] = useState(supplier?.isActive ?? true);
    const [inventoryAccount, setInventoryAccount] = useState(supplier?.inventoryAccount ?? '');
    const [supplierAccount, setSupplierAccount] = useState(supplier?.supplierAccount ?? '');

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('El nombre del proveedor es requerido'); return; }
        onSave({
            name: name.trim().toUpperCase(),
            code: code.trim().toUpperCase(),
            taxId: taxId.trim(),
            email: email.trim(),
            phone: phone.trim(),
            phone2: phone2.trim(),
            fax: fax.trim(),
            poBox: poBox.trim(),
            contactPerson: contactPerson.trim(),
            address: address.trim(),
            country: country.trim().toUpperCase(),
            isActive,
            inventoryAccount: inventoryAccount.trim(),
            supplierAccount: supplierAccount.trim()
        });
    };

    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5";
    const inputCls = "w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
                    <div>
                        <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-widest mb-0.5">MANTENIMIENTO</p>
                        <h2 className="text-xl font-bold text-[#0F172A] uppercase">
                            {isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto">
                    <form id="supplier-form" onSubmit={handleSubmit} className="p-6 space-y-6 bg-[#FBFCFE]">
                        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-5">
                            {/* GENERAL INFo */}
                            <div>
                                <h3 className="text-xs font-black text-[#16A34A] uppercase mb-4 flex items-center gap-2">
                                    GENERALES
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Nombre <span className="text-red-500">*</span></label>
                                        <input ref={inputRef} type="text" value={name} onChange={e => setName(e.target.value.toUpperCase())} className={`${inputCls} flex-1`} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Código</label>
                                        <div className="flex-1 flex gap-2">
                                            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SUP-001" className={inputCls} />
                                            <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Tax ID / RUC" className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Dirección</label>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
                                            <input type="text" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="País" className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Teléfonos</label>
                                        <div className="flex-1 flex gap-2">
                                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
                                            <input type="tel" value={phone2} onChange={e => setPhone2(e.target.value)} className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Fax</label>
                                        <input type="text" value={fax} onChange={e => setFax(e.target.value)} className={`${inputCls} md:w-1/2`} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Apartado</label>
                                        <input type="text" value={poBox} onChange={e => setPoBox(e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>E-Mail</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-32`}>Contacto</label>
                                        <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 pt-2">
                                        <label className={`${labelCls} md:w-32`}>Status</label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-[#2563EB] rounded border-gray-300 focus:ring-[#2563EB]" />
                                            <span className="text-sm text-[#0F172A] font-semibold">Activo</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-[#E2E8F0]" />

                            {/* ACCOUNTING INFO */}
                            <div>
                                <h3 className="text-xs font-black text-[#0F172A] uppercase mb-4 flex items-center gap-2">
                                    Cuentas Contables
                                </h3>
                                <div className="grid grid-cols-1 gap-4 bg-[#F1F5F9] p-4 rounded-lg">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-40 mb-0`}>Cuenta Inventario</label>
                                        <input type="text" value={inventoryAccount} onChange={e => setInventoryAccount(e.target.value)} className={`${inputCls} md:w-48 bg-white`} />
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <label className={`${labelCls} md:w-40 mb-0`}>Cuenta Proveedor</label>
                                        <input type="text" value={supplierAccount} onChange={e => setSupplierAccount(e.target.value)} className={`${inputCls} md:w-48 bg-white`} />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-[#E2E8F0] flex justify-end gap-3 shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] transition-all bg-white text-[#475569]">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="supplier-form"
                        disabled={saving}
                        className="px-6 py-2.5 text-sm font-bold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <AlertCircle className="w-4 h-4 animate-spin" /> : null}
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── DELETE DIALOG ────────────────────────────────────────────────────────────
function DeleteDialog({ supplier, onConfirm, onCancel }: { supplier: Supplier; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
            <motion.div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-[#DC2626]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Eliminar Proveedor</h3>
                        <p className="text-sm text-[#475569]">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg p-3 mb-5 text-center">
                    <span className="text-sm text-[#DC2626] font-bold uppercase">{supplier.name}</span>
                </div>
                <p className="text-sm text-[#475569] mb-5 leading-relaxed">¿Estás seguro de que deseas eliminar este proveedor? Asegúrate de que no tenga transacciones pendientes ni productos asociados.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] font-bold">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors font-bold">
                        Sí, eliminar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function SupplierDetailModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
    if (!supplier) return null;

    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1";
    const valueCls = "text-sm text-[#0F172A] font-medium";
    const sectionBoxCls = "bg-white border border-[#E2E8F0] p-5 rounded-xl";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                className="bg-[#FBFCFE] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                {/* HEAD */}
                <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] font-bold text-lg">
                            {supplier.name.substring(0, 2)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-[#0F172A]">{supplier.name}</h2>
                                {supplier.isActive ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#16A34A]/10 text-[#16A34A]">ACTIVO</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-500">INACTIVO</span>
                                )}
                            </div>
                            <p className="text-xs text-[#64748B] mt-1 font-medium">{supplier.code || 'SIN CÓDIGO'} {supplier.taxId && `• RUC: ${supplier.taxId}`}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 overflow-y-auto space-y-5">
                    <div className={sectionBoxCls}>
                        <h3 className="text-xs font-black text-[#3B82F6] uppercase mb-4 flex items-center gap-2">
                            Contacto
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-2">
                                <p className={labelCls}>Persona Contacto</p>
                                <p className={valueCls}>{supplier.contactPerson || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelCls}>E-Mail</p>
                                <p className={valueCls}>{supplier.email || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelCls}>Teléfono 1</p>
                                <p className={valueCls}>{supplier.phone || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelCls}>Teléfono 2</p>
                                <p className={valueCls}>{supplier.phone2 || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelCls}>Fax</p>
                                <p className={valueCls}>{supplier.fax || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className={sectionBoxCls}>
                        <h3 className="text-xs font-black text-[#F59E0B] uppercase mb-4 flex items-center gap-2">
                            Ubicación
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-4">
                                <p className={labelCls}>Dirección</p>
                                <p className={valueCls}>{supplier.address || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelCls}>País</p>
                                <p className={valueCls}>{supplier.country || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelCls}>Apartado Postal</p>
                                <p className={valueCls}>{supplier.poBox || '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className={sectionBoxCls}>
                        <h3 className="text-xs font-black text-[#16A34A] uppercase mb-4 flex items-center gap-2">
                            Información Contable
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className={labelCls}>Cuenta Inventario</p>
                                <p className={valueCls}>{supplier.inventoryAccount || '—'}</p>
                            </div>
                            <div>
                                <p className={labelCls}>Cuenta Proveedor</p>
                                <p className={valueCls}>{supplier.supplierAccount || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function ListSkeleton() {
    return (
        <div className="divide-y divide-[#E2E8F0]">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="px-4 py-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
            ))}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);

    const loadSuppliers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api<ApiResponse>(`/suppliers?limit=${meta.limit}&page=${currentPage}&search=${search}`);
            setSuppliers(res.items);
            setMeta(res.meta);
        } catch {
            toast.error('Error al cargar proveedores');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, meta.limit]);

    useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleSave = async (data: Partial<Supplier>) => {
        setSaving(true);
        try {
            if (editSupplier) {
                await api(`/suppliers/${editSupplier.id}`, { method: 'PATCH', body: data });
                toast.success('Proveedor actualizado');
            } else {
                await api('/suppliers', { method: 'POST', body: data });
                toast.success('Proveedor creado');
            }
            setShowFormModal(false);
            setEditSupplier(null);
            loadSuppliers();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteSupplier) return;
        try {
            await api(`/suppliers/${deleteSupplier.id}`, { method: 'DELETE' });
            toast.success('Proveedor eliminado');
            setDeleteSupplier(null);
            loadSuppliers();
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar');
        }
    };

    const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);

    if (!mounted) return <div className="min-h-screen bg-[#F8FAFC]" />;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AnimatePresence>
                {(showFormModal || editSupplier) && (
                    <SupplierFormModal
                        supplier={editSupplier}
                        saving={saving}
                        onSave={handleSave}
                        onClose={() => { setShowFormModal(false); setEditSupplier(null); }}
                    />
                )}
                {selectedSupplier && (
                    <SupplierDetailModal
                        supplier={selectedSupplier}
                        onClose={() => setSelectedSupplier(null)}
                    />
                )}
                {deleteSupplier && (
                    <DeleteDialog
                        supplier={deleteSupplier}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteSupplier(null)}
                    />
                )}
            </AnimatePresence>

            {/* Sticky Header Area */}
            <div className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md pt-6 pb-2">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white border border-[#E2E8F0] shadow-lg rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-11 h-11 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                <ArrowLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-black tracking-wider rounded">
                                        GESTIÓN DE ARCHIVOS
                                    </span>
                                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest hidden sm:block">Sync v4.2</span>
                                </div>
                                <h1 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight leading-none">
                                    Proveedores
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ActionButton
                                onClick={() => setEditSupplier(null)}
                                icon={Plus}
                                label="Nuevo Proveedor"
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* CONTENT */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="max-w-md w-full relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Buscar proveedor por nombre, código o RUC..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-sm transition-all text-[#0F172A] font-medium"
                            />
                        </div>
                        <div className="px-3 py-1.5 bg-[#F8FAFC] rounded-full border border-[#E2E8F0]">
                            <p className="text-xs font-semibold text-[#475569]">
                                Total: <span className="text-[#2563EB]">{meta.total}</span> proveedores
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : suppliers.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 mb-4 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                                <Users className="w-10 h-10 text-[#CBD5E1]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0F172A] mb-1 uppercase">Sin Proveedores</h3>
                            <p className="text-sm text-[#94A3B8] mb-8 max-w-xs">No tienes proveedores registrados actualmente.</p>
                            <button onClick={() => setShowFormModal(true)} className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1D4ED8] transition-all">
                                Registrar mi primer proveedor
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Proveedor</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Contacto</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Ubicación</th>
                                        <th className="text-center px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Inventario</th>
                                        <th className="text-right px-6 py-4 text-xs font-bold text-[#64748B] uppercase tracking-widest">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {suppliers.map(s => (
                                        <tr key={s.id} onClick={() => setSelectedSupplier(s)} className="hover:bg-[#F8FAFC]/80 transition-colors group cursor-pointer">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-[#F1F5F9] flex items-center justify-center text-[#2563EB] font-bold text-xs">
                                                        {s.name.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold text-[#0F172A] block">{s.name}</span>
                                                        <div className="flex gap-2 text-[11px] text-[#64748B] mt-0.5">
                                                            <span>{s.code || 'SIN CÓDIGO'}</span>
                                                            {s.taxId && <>• <span>RUC: {s.taxId}</span></>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-[#475569]">
                                                    <div className="font-semibold">{s.contactPerson || '—'}</div>
                                                    <div className="text-xs">{s.email || '—'}</div>
                                                    <div className="text-xs">{s.phone || '—'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-[#475569]">
                                                    <span className="block font-semibold">{s.country || '—'}</span>
                                                    <span className="text-xs line-clamp-1">{s.address || ''}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <ProductCountBadge count={s._count?.products || 0} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => setEditSupplier(s)} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded bg-white border border-[#E2E8F0] shadow-sm transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => setDeleteSupplier(s)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded bg-white border border-[#E2E8F0] shadow-sm transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINATION */}
                    {meta.totalPages > 1 && (
                        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                            <p className="text-xs font-bold text-[#64748B] uppercase">Página {currentPage} de {meta.totalPages}</p>
                            <div className="flex gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-[#E2E8F0] rounded-xl disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                {pages.map(n => (
                                    <button key={n} onClick={() => setCurrentPage(n)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === n ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}>{n}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))} disabled={currentPage === meta.totalPages} className="p-2 bg-white border border-[#E2E8F0] rounded-xl disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm">
                        <Info className="w-6 h-6 text-[#3B82F6]" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider mb-1">Catálogo de Proveedores</h4>
                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">
                            Este registro le permite mantener una base de datos centralizada de sus fábricas y distribuidores.
                            Será utilizado en el módulo de compras para generar órdenes, analizar costos por proveedor y gestionar tiempos de entrega.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
