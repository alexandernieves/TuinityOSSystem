'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, Download, Upload, Plus, Edit, Trash2, ChevronDown, X,
    Grid3X3, List, Package, AlertTriangle, CheckCircle, Image as ImageIcon,
    ChevronLeft, ChevronRight, Tag, DollarSign, Filter, AlertCircle, Info, Eye,
    Box, FileText, Globe, Scale, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageSearchModal } from './ImageSearchModal';
import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SharedProductImage } from '@/components/shared/SharedProductImage';
import { Pagination } from '@/components/shared/Pagination';
import { ActionButton } from '@/components/shared/ActionButton';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Product {
    id: string;
    description: string;
    description_es?: string;
    description_en?: string;
    description_pt?: string;
    internalReference?: string;
    showroomCode?: string;
    codigoArancelario?: string;
    paisOrigen?: string;
    originId?: string;
    origin?: { id: string; name: string };
    tariffId?: string;
    tariff?: { id: string; code: string; description?: string };
    supplierId?: string;
    supplier?: { id: string; name: string };
    composition?: string;
    mainImageUrl?: string;
    price_a: number | string;
    price_b: number | string;
    price_c: number | string;
    price_d: number | string;
    price_e: number | string;
    lastCifCost?: number | string;
    weightedAvgCost?: number | string;
    minStock?: number;
    unitsPerBox?: number;
    boxesPerPallet?: number;
    weight?: number | string;
    volume?: number | string;
    volumeCubicFeet?: number | string;
    unitOfMeasure?: string;
    categoryId?: string;
    brandId?: string;
    category?: { id: string; name: string };
    brand?: { id: string; name: string };
    barcodes?: { id: string; barcode: string }[];
    inventory?: { quantity: number; minStock: number; branchId: string; branch?: { name: string } }[];
    createdAt: string;
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }
interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }
interface Origin { id: string; name: string; }
interface Tariff { id: string; code: string; description?: string; }
interface Supplier { id: string; name: string; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getStock(p: Product) {
    return p.inventory?.reduce((s, i) => s + i.quantity, 0) ?? 0;
}
function getMinStock(p: Product) {
    return p.inventory?.[0]?.minStock ?? p.minStock ?? 0;
}
function getStatus(p: Product) {
    const stock = getStock(p);
    const min = getMinStock(p);
    if (!p.inventory || p.inventory.length === 0) return 'critico';
    if (stock === 0) return 'critico';
    if (stock < min) return 'bajo';
    return 'optimo';
}

const formatPrice = (val: any) => {
    const n = Number(val);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── DELETE DIALOG ────────────────────────────────────────────────────────────
function DeleteDialog({ product, onConfirm, onCancel }: { product: Product; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-[#DC2626]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#0F172A]">Eliminar Producto</h3>
                        <p className="text-sm text-[#475569]">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg p-3 mb-5">
                    <p className="text-sm text-[#DC2626] font-medium">{product.description}</p>
                    {product.internalReference && <p className="text-xs text-[#DC2626]/70 mt-0.5">Ref: {product.internalReference}</p>}
                </div>
                <p className="text-sm text-[#475569] mb-5">¿Estás seguro de que deseas eliminar este producto? Se eliminará del catálogo y no aparecerá en futuras búsquedas.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569]">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors font-medium">
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── PRODUCT FORM MODAL ───────────────────────────────────────────────────────
interface ProductFormProps {
    product?: Product | null;
    categories: Category[];
    brands: Brand[];
    origins: Origin[];
    tariffs: Tariff[];
    suppliers: Supplier[];
    onClose: () => void;
    onSaved: () => void;
}

function ProductFormModal({ product, categories, brands, origins, tariffs, suppliers, onClose, onSaved }: ProductFormProps) {
    const isEdit = !!product;
    const [activeTab, setActiveTab] = useState<'generales' | 'especificaciones'>('generales');
    const [saving, setSaving] = useState(false);
    const [showImageSearch, setShowImageSearch] = useState(false);
    const [form, setForm] = useState({
        description: product?.description ?? '',
        description_es: product?.description_es ?? '',
        description_en: product?.description_en ?? '',
        description_pt: product?.description_pt ?? '',
        internalReference: product?.internalReference ?? '',
        showroomCode: product?.showroomCode ?? '',
        codigoArancelario: product?.codigoArancelario ?? '',
        paisOrigen: product?.paisOrigen ?? '',
        composition: product?.composition ?? '',
        categoryId: product?.categoryId ?? '',
        brandId: product?.brandId ?? '',
        originId: product?.originId ?? '',
        tariffId: product?.tariffId ?? '',
        supplierId: product?.supplierId ?? '',
        unitOfMeasure: product?.unitOfMeasure ?? 'CJA',
        unitsPerBox: product?.unitsPerBox ?? 1,
        boxesPerPallet: product?.boxesPerPallet ?? 1,
        minStock: product?.minStock ?? 0,
        weight: product?.weight ?? 0,
        volume: product?.volume ?? 0,
        volumeCubicFeet: product?.volumeCubicFeet ?? 0,
        price_a: product?.price_a ?? 0,
        price_b: product?.price_b ?? 0,
        price_c: product?.price_c ?? 0,
        price_d: product?.price_d ?? 0,
        price_e: product?.price_e ?? 0,

        barcode: product?.barcodes?.[0]?.barcode ?? '',
        mainImageUrl: product?.mainImageUrl ?? '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.mainImageUrl ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.description.trim()) { toast.error('La descripción es requerida'); return; }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('description', form.description.trim());
            formData.append('description_es', form.description_es || '');
            formData.append('description_en', form.description_en || '');
            formData.append('description_pt', form.description_pt || '');
            formData.append('internalReference', form.internalReference || '');
            formData.append('showroomCode', form.showroomCode || '');
            formData.append('codigoArancelario', form.codigoArancelario || '');
            formData.append('paisOrigen', form.paisOrigen || '');
            formData.append('composition', form.composition || '');
            formData.append('unitOfMeasure', form.unitOfMeasure);
            formData.append('unitsPerBox', String(form.unitsPerBox || 1));
            formData.append('boxesPerPallet', String(form.boxesPerPallet || 1));
            formData.append('minStock', String(form.minStock || 0));
            formData.append('weight', String(form.weight || 0));
            formData.append('volume', String(form.volume || 0));
            formData.append('volumeCubicFeet', String(form.volumeCubicFeet || 0));
            formData.append('price_a', String(form.price_a || 0));
            formData.append('price_b', String(form.price_b || 0));
            formData.append('price_c', String(form.price_c || 0));
            formData.append('price_d', String(form.price_d || 0));
            formData.append('price_e', String(form.price_e || 0));
            formData.append('categoryId', form.categoryId || '');
            formData.append('brandId', form.brandId || '');
            formData.append('originId', form.originId || '');
            formData.append('tariffId', form.tariffId || '');
            formData.append('supplierId', form.supplierId || '');

            if (form.barcode) {
                formData.append('barcodes', form.barcode);
            }

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (form.mainImageUrl) {
                formData.append('mainImageUrl', form.mainImageUrl);
            }

            if (isEdit) {
                await api(`/products/${product!.id}`, { method: 'PATCH', body: formData });
                toast.success('Producto actualizado');
            } else {
                await api('/products', { method: 'POST', body: formData });
                toast.success('Producto creado');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const sectionBoxCls = "bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-4";
    const labelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5";
    const inputCls = "w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-6 border-b border-[#E2E8F0] flex flex-col gap-1 relative bg-white">
                        <p className="text-sm text-[#3B82F6] font-medium">Referencia: <span className="font-bold">{form.internalReference || 'NUEVA'}</span></p>
                        <h2 className="text-2xl font-extrabold text-[#0F172A] uppercase tracking-tight pr-10">
                            {form.description || 'Producto Sin Nombre'}
                        </h2>
                        <button type="button" onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 border-b border-[#E2E8F0] bg-white flex items-center gap-8 shrink-0">
                        <button type="button" onClick={() => setActiveTab('generales')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'generales' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'}`}>Generales</button>
                        <button type="button" onClick={() => setActiveTab('especificaciones')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'especificaciones' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'}`}>Especificaciones</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-[#FBFCFE] min-h-0">
                        {activeTab === 'generales' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column */}
                                <div className="lg:col-span-7 space-y-6">
                                    <div className={sectionBoxCls}>
                                        <h3 className="text-xs font-black text-[#3B82F6] uppercase flex items-center gap-2 mb-4"><Package className="w-4 h-4" /> GENERALES</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2">
                                                <label className={labelCls}>Descripción / Nombre</label>
                                                <input type="text" className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ej: WHISKY BLACK & WHITE..." />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Categoría</label>
                                                <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                                                    <option value="">Seleccionar...</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Marca</label>
                                                <select className={inputCls} value={form.brandId} onChange={e => set('brandId', e.target.value)}>
                                                    <option value="">Seleccionar...</option>
                                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Proveedor</label>
                                                <select className={inputCls} value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                                                    <option value="">Seleccionar...</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>País Origen</label>
                                                <select className={inputCls} value={form.originId} onChange={e => set('originId', e.target.value)}>
                                                    <option value="">Seleccionar...</option>
                                                    {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Composición</label>
                                                <input type="text" className={inputCls} value={form.composition} onChange={e => set('composition', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={sectionBoxCls}>
                                        <h3 className="text-xs font-black text-[#3B82F6] uppercase flex items-center gap-2 mb-4"><List className="w-4 h-4" /> CÓDIGOS</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className={labelCls}>Referencia Showroom</label>
                                                <input type="text" className={inputCls} value={form.showroomCode} onChange={e => set('showroomCode', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Código de Barra</label>
                                                <input type="text" className={inputCls} value={form.barcode} onChange={e => set('barcode', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Arancel / Tariff Code</label>
                                                <select className={inputCls} value={form.tariffId} onChange={e => set('tariffId', e.target.value)}>
                                                    <option value="">Seleccionar...</option>
                                                    {tariffs.map(t => <option key={t.id} value={t.id}>{t.code} {t.description ? `- ${t.description}` : ''}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={sectionBoxCls}>
                                        <h3 className="text-xs font-black text-[#3B82F6] uppercase flex items-center gap-2 mb-4"><Edit className="w-4 h-4" /> MEDIDAS Y EMPAQUE</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelCls}>Unidad/Medida</label>
                                                <select className={inputCls} value={form.unitOfMeasure} onChange={e => set('unitOfMeasure', e.target.value)}>
                                                    <option value="CJA">CJA</option>
                                                    <option value="UND">UND</option>
                                                </select>
                                            </div>
                                            <div><label className={labelCls}>Cantidad x Bulto</label><input type="number" className={inputCls} value={form.unitsPerBox} onChange={e => set('unitsPerBox', e.target.value)} /></div>
                                            <div><label className={labelCls}>Cantidad x Paleta</label><input type="number" className={inputCls} value={form.boxesPerPallet} onChange={e => set('boxesPerPallet', e.target.value)} /></div>
                                            <div><label className={labelCls}>Cant. Mínima (Reorden)</label><input type="number" className={inputCls} value={form.minStock} onChange={e => set('minStock', e.target.value)} /></div>
                                            <div><label className={labelCls}>Peso (kg)</label><input type="number" step="0.01" className={inputCls} value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
                                            <div><label className={labelCls}>Metros Cúbicos (m³)</label><input type="number" step="0.0001" className={inputCls} value={form.volume} onChange={e => set('volume', e.target.value)} /></div>
                                            <div className="col-span-2 pt-2 border-t border-[#E2E8F0]">
                                                <p className={labelCls}>Pies Cúbicos (ft³)</p>
                                                <input type="number" step="0.0001" className={inputCls} value={form.volumeCubicFeet} onChange={e => set('volumeCubicFeet', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col items-center p-6 gap-6 h-fit sticky top-0">
                                        <div className="w-full aspect-square max-w-[280px] flex items-center justify-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1] relative group overflow-hidden">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="producto" className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon className="w-16 h-16 opacity-20" />
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#F1F5F9] transition-all"
                                            >
                                                <Upload className="w-4 h-4" /> Subir Foto
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowImageSearch(true)}
                                                className="py-2.5 bg-[#3B82F6]/5 border border-[#3B82F6]/20 text-[#3B82F6] rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#3B82F6] hover:text-white transition-all"
                                            >
                                                <Search className="w-4 h-4" /> Google
                                            </button>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />

                                        <div className="w-full">
                                            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5 block">URL de Imagen (Manual)</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                                                value={form.mainImageUrl || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    set('mainImageUrl', val);
                                                    if (!imageFile) setImagePreview(val);
                                                }}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    <div className={sectionBoxCls}>
                                        <h3 className="text-xs font-black text-[#16A34A] uppercase flex items-center gap-2 mb-4"><DollarSign className="w-4 h-4" /> PRECIOS</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'A', field: 'price_a', color: 'bg-[#2563EB]' },
                                                { label: 'B', field: 'price_b', color: 'bg-[#0EA5E9]' },
                                                { label: 'C', field: 'price_c', color: 'bg-[#10B981]' },
                                                { label: 'D', field: 'price_d', color: 'bg-[#F59E0B]' },
                                                { label: 'E', field: 'price_e', color: 'bg-[#EF4444]' },
                                            ].map(p => (
                                                <div key={p.label} className="flex items-center gap-3 p-2 bg-white border border-[#E2E8F0] rounded-lg">
                                                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-white text-xs font-black ${p.color}`}>{p.label}</div>
                                                    <div className="flex-1">
                                                        <label className="text-[9px] font-bold text-[#94A3B8] uppercase block mb-0.5">Precio {p.label}</label>
                                                        <input type="number" step="0.01" className="w-full text-sm font-black text-[#1E293B] focus:outline-none" value={(form as any)[p.field]} onChange={e => set(p.field, e.target.value)} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={sectionBoxCls}>
                                        <h3 className="text-xs font-black text-[#475569] uppercase mb-4 tracking-widest">STATUS</h3>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-[#E2E8F0] text-[#3B82F6] focus:ring-[#3B82F6]" />
                                            <span className="text-sm font-bold text-[#1E293B]">Activo</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className={sectionBoxCls}>
                                    <label className="text-sm font-black text-[#1E293B] mb-3 block">Descripción Detallada (Español)</label>
                                    <textarea className={inputCls + " h-32 resize-none"} value={form.description_es} onChange={e => set('description_es', e.target.value)} placeholder="Describe el producto en español..." />
                                </div>
                                <div className={sectionBoxCls}>
                                    <label className="text-sm font-black text-[#1E293B] mb-3 block">Descripción Inglés</label>
                                    <textarea className={inputCls + " h-32 resize-none"} value={form.description_en} onChange={e => set('description_en', e.target.value)} placeholder="Product description in English..." />
                                </div>
                                <div className={sectionBoxCls}>
                                    <label className="text-sm font-black text-[#1E293B] mb-3 block">Descripción Portugués</label>
                                    <textarea className={inputCls + " h-32 resize-none"} value={form.description_pt} onChange={e => set('description_pt', e.target.value)} placeholder="Descrição do produto em português..." />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white border-t border-[#E2E8F0] flex justify-end gap-3 sticky bottom-0">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F8FAFC] transition-all bg-white flex items-center gap-2">Cancelar</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-all flex items-center gap-2 disabled:opacity-50">
                            {saving ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar' : 'Crear')}
                        </button>
                    </div>
                </form>
                {/* Image Search Modal */}
                <ImageSearchModal
                    isOpen={showImageSearch}
                    initialQuery={`${form.description} ${form.brandId ? brands.find(b => b.id === form.brandId)?.name : ''}`}
                    onClose={() => setShowImageSearch(false)}
                    onSelectImage={(url) => {
                        set('mainImageUrl', url);
                        setShowImageSearch(false);
                    }}
                />
            </div>
        </div>
    );
}

// ─── PRODUCT DETAIL MODAL ────────────────────────────────────────────────────
function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'generales' | 'especificaciones'>('generales');
    if (!product) return null;

    const stock = getStock(product);
    const minStock = getMinStock(product);

    // Helper for box styling
    const sectionBoxCls = "bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-4";
    const fieldLabelCls = "text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1";
    const fieldValueCls = "text-sm font-semibold text-[#1E293B]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-[#E2E8F0] flex flex-col gap-1 relative bg-white">
                    <p className="text-sm text-[#3B82F6] font-medium">Referencia: <span className="font-bold">{product.internalReference || '—'}</span></p>
                    <h2 className="text-2xl font-extrabold text-[#0F172A] uppercase tracking-tight pr-10">{product.description}</h2>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[#F1F5F9] rounded-full transition-colors text-[#64748B]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-[#E2E8F0] bg-white flex items-center gap-8">
                    <button
                        onClick={() => setActiveTab('generales')}
                        className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'generales' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'}`}
                    >
                        Generales
                    </button>
                    <button
                        onClick={() => setActiveTab('especificaciones')}
                        className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'especificaciones' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#94A3B8] hover:text-[#64748B]'}`}
                    >
                        Especificaciones
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#FBFCFE] min-h-0">
                    {activeTab === 'generales' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* GENERALES */}
                                <div className={sectionBoxCls}>
                                    <h3 className="text-xs font-black text-[#3B82F6] uppercase flex items-center gap-2 mb-4">
                                        <Package className="w-4 h-4" /> GENERALES
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <p className={fieldLabelCls}>Grupo / Sub-grupo</p>
                                            <p className={fieldValueCls}>{product.category?.name || '—'} / {product.category?.name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className={fieldLabelCls}>Marca</p>
                                            <p className={fieldValueCls}>{product.brand?.name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className={fieldLabelCls}>País Origen</p>
                                            <p className={fieldValueCls}>
                                                {product.origin?.name || product.paisOrigen || '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className={fieldLabelCls}>Composición</p>
                                            <p className={fieldValueCls}>{product.composition || '—'}</p>
                                        </div>
                                        <div>
                                            <p className={fieldLabelCls}>Proveedor</p>
                                            <p className={fieldValueCls}>{product.supplier?.name || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CÓDIGOS */}
                                <div className={sectionBoxCls}>
                                    <h3 className="text-xs font-black text-[#3B82F6] uppercase flex items-center gap-2 mb-4">
                                        <List className="w-4 h-4" /> CÓDIGOS
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className={fieldLabelCls}>Referencia Showroom</p>
                                            <p className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm font-mono text-[#0F172A]">{product.showroomCode || '—'}</p>
                                        </div>
                                        <div>
                                            <p className={fieldLabelCls}>Código de Barra</p>
                                            <p className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm font-mono text-[#0F172A]">{product.barcodes?.[0]?.barcode || '—'}</p>
                                        </div>
                                        <div>
                                            <p className={fieldLabelCls}>Arancel</p>
                                            <div className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-md text-sm font-mono text-[#0F172A]">
                                                {product.tariff?.code || product.codigoArancelario || '—'}
                                                {product.tariff?.description && (
                                                    <span className="ml-2 text-[10px] font-sans text-[#64748B] lowercase italic bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                                                        {product.tariff.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* MEDIDAS Y EMPAQUE */}
                                <div className={sectionBoxCls}>
                                    <h3 className="text-xs font-black text-[#3B82F6] uppercase flex items-center gap-2 mb-4">
                                        <Edit className="w-4 h-4" /> MEDIDAS Y EMPAQUE
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                        <div><p className={fieldLabelCls}>Unidad/Medida</p><p className={fieldValueCls}>{product.unitOfMeasure || 'CJA'}</p></div>
                                        <div><p className={fieldLabelCls}>Factor</p><p className={fieldValueCls}>1</p></div>
                                        <div><p className={fieldLabelCls}>Cantidad x Bulto</p><p className={fieldValueCls}>{product.unitsPerBox || 1}</p></div>
                                        <div><p className={fieldLabelCls}>Cantidad x Paleta</p><p className={fieldValueCls}>60</p></div>
                                        <div><p className={fieldLabelCls}>Kilos x Bulto</p><p className={fieldValueCls}>{Number(product.weight) || '—'}</p></div>
                                        <div><p className={fieldLabelCls}>Cantidad Mínima</p><p className={fieldValueCls}>{product.minStock || stock}</p></div>

                                        <div className="col-span-2 pt-2 border-t border-[#E2E8F0]">
                                            <p className={fieldLabelCls}>Dimensiones (L x A x H)</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 bg-white border border-[#E2E8F0] rounded p-2 text-center"><p className="text-[10px] text-[#94A3B8]">Largo</p><p className="text-xs font-bold">8 cm</p></div>
                                                <X className="w-3 h-3 text-[#94A3B8]" />
                                                <div className="flex-1 bg-white border border-[#E2E8F0] rounded p-2 text-center"><p className="text-[10px] text-[#94A3B8]">Ancho</p><p className="text-xs font-bold">11 cm</p></div>
                                                <X className="w-3 h-3 text-[#94A3B8]" />
                                                <div className="flex-1 bg-white border border-[#E2E8F0] rounded p-2 text-center"><p className="text-[10px] text-[#94A3B8]">Alto</p><p className="text-xs font-bold">15 cm</p></div>
                                            </div>
                                        </div>
                                        <div className="col-span-1"><p className={fieldLabelCls}>Metros Cúbicos</p><p className={fieldValueCls}>{Number(product.volume) || '0.02163'}</p></div>
                                        <div className="col-span-1"><p className={fieldLabelCls}>Pies Cúbicos</p><p className={fieldValueCls}>0.76388</p></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-5 space-y-6">
                                {/* IMAGE BOX */}
                                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col items-center p-6 gap-6 h-fit sticky top-0">
                                    <div className="w-full aspect-square max-w-[300px] flex items-center justify-center bg-[#F8FAFC] rounded-lg border border-dashed border-[#CBD5E1]">
                                        {product.mainImageUrl ? (
                                            <img src={product.mainImageUrl} alt="producto" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center text-[#94A3B8] gap-2">
                                                <ImageIcon className="w-16 h-16 opacity-20" />
                                                <p className="text-xs">Sin imagen disponible</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PRECIOS */}
                                <div className={sectionBoxCls}>
                                    <h3 className="text-xs font-black text-[#16A34A] uppercase flex items-center gap-2 mb-4">
                                        <DollarSign className="w-4 h-4" /> PRECIOS
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'A', value: product.price_a, color: 'bg-[#2563EB]' },
                                            { label: 'B', value: product.price_b, color: 'bg-[#0EA5E9]' },
                                            { label: 'C', value: product.price_c, color: 'bg-[#10B981]' },
                                            { label: 'D', value: product.price_d, color: 'bg-[#F59E0B]' },
                                            { label: 'E', value: product.price_e, color: 'bg-[#EF4444]' },
                                        ].map(p => (
                                            <div key={p.label} className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-black ${p.color}`}>{p.label}</div>
                                                    <p className="text-sm font-bold text-[#475569]">Precio {p.label}</p>
                                                </div>
                                                <p className="text-base font-black text-[#1E293B]">${formatPrice(p.value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* STATUS */}
                                <div className={sectionBoxCls}>
                                    <h3 className="text-xs font-black text-[#475569] uppercase mb-4 tracking-widest">STATUS</h3>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked readOnly className="w-5 h-5 rounded border-[#E2E8F0] text-[#3B82F6] focus:ring-[#3B82F6]" />
                                        <span className="text-sm font-bold text-[#1E293B]">Activo</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* ESPECIFICACIONES TAB CONTENT */}
                            <div className={sectionBoxCls + " h-fit"}>
                                <h3 className="text-sm font-black text-[#1E293B] mb-3">Detallada</h3>
                                <div className="w-full p-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] leading-relaxed min-h-[120px]">
                                    {product.description_es || 'Sin descripción detallada disponible.'}
                                </div>
                            </div>
                            <div className={sectionBoxCls + " h-fit"}>
                                <h3 className="text-sm font-black text-[#1E293B] mb-3">Inglés</h3>
                                <div className="w-full p-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] leading-relaxed min-h-[120px]">
                                    {product.description_en || 'No English description available.'}
                                </div>
                            </div>
                            <div className={sectionBoxCls + " h-fit"}>
                                <h3 className="text-sm font-black text-[#1E293B] mb-3">Português</h3>
                                <div className="w-full p-4 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] leading-relaxed min-h-[120px]">
                                    {product.description_pt || 'Sem descrição em português disponível.'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProductListSkeleton() {
    return (
        <div className="divide-y divide-[#E2E8F0]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="px-4 py-4 flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>
            ))}
        </div>
    );
}
// ─── IMPORT MODAL ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (file: File) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const requiredColumns = [
        { name: 'Description', req: 'Sí', desc: 'Nombre del producto (ej: Johnnie Walker)' },
        { name: 'TariffCode', req: 'Sí', desc: 'Código arancelario (ej: 2208.30.00)' },
        { name: 'Origin', req: 'Sí', desc: 'País de origen' },
        { name: 'PriceA', req: 'Sí', desc: 'Precio de venta principal' },
        { name: 'Category', req: 'No', desc: 'Categoría para agrupar' },
        { name: 'Brand', req: 'No', desc: 'Marca del fabricante' },
        { name: 'UnitsPerBox', req: 'No', desc: 'Cantidad x bulto (defecto 1)' },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-[#0F172A]">Importar Catálogo</h2>
                        <p className="text-sm text-[#475569] mt-1">Sube un archivo Excel o CSV para cargar productos masivamente</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#F7F9FC] rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[#475569]" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Format Instructions */}
                    <div className="bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-[#2563EB] mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" /> FORMATO DEL DOCUMENTO
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-[#2563EB]/10 text-left">
                                        <th className="pb-2 font-semibold">Columna</th>
                                        <th className="pb-2 font-semibold">Requerido</th>
                                        <th className="pb-2 font-semibold">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#475569]">
                                    {requiredColumns.map(col => (
                                        <tr key={col.name} className="border-b border-[#2563EB]/5 last:border-0">
                                            <td className="py-2 font-mono font-medium text-[#0F172A]">{col.name}</td>
                                            <td className="py-2">{col.req === 'Sí' ? <span className="text-[#DC2626]">Sí</span> : 'No'}</td>
                                            <td className="py-2">{col.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${file ? 'border-[#16A34A] bg-[#16A34A]/5' : 'border-[#CBD5E1] hover:border-[#2563EB] hover:bg-[#F7F9FC]'}`}
                    >
                        <input type="file" ref={fileInputRef} hidden accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                        {file ? (
                            <>
                                <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-[#0F172A]">{file.name}</p>
                                    <p className="text-xs text-[#94A3B8]">{(file.size / 1024).toFixed(1)} KB - Listo para importar</p>
                                </div>
                                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="text-xs text-[#DC2626] font-medium hover:underline">Cambiar archivo</button>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-[#0F172A]">Haz clic o arrastra un archivo</p>
                                    <p className="text-xs text-[#94A3B8]">Excel (.xlsx, .xls) o CSV</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-[#F7F9FC] border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569]">
                        Cancelar
                    </button>
                    <button
                        disabled={!file}
                        onClick={() => file && onImport(file)}
                        className="px-5 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Comenzar Importación
                    </button>
                </div>
            </div>
        </div>
    );
}


// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProductosPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 8, totalPages: 1 });
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [origins, setOrigins] = useState<Origin[]>([]);
    const [tariffs, setTariffs] = useState<Tariff[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterOrigin, setFilterOrigin] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);
    const importRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce(search, 400);

    // Load categories & brands once
    useEffect(() => {
        api<{ items: Category[] }>('/categories?limit=100').then(r => setCategories(r.items ?? [])).catch(() => { });
        api<{ items: Brand[] }>('/brands?limit=100').then(r => setBrands(r.items ?? [])).catch(() => { });
        api<{ items: Origin[] }>('/origins?limit=100').then(r => setOrigins(r.items ?? [])).catch(() => { });
        api<{ items: Tariff[] }>('/tariffs?limit=100').then(r => setTariffs(r.items ?? [])).catch(() => { });
        api<{ items: Supplier[] }>('/suppliers?limit=100').then(r => setSuppliers(r.items ?? [])).catch(() => { });
    }, []);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: '8',
                ...(debouncedSearch ? { search: debouncedSearch } : {}),
                ...(filterCategory ? { categoryId: filterCategory } : {}),
                ...(filterBrand ? { brandId: filterBrand } : {}),
                ...(filterOrigin ? { originId: filterOrigin } : {}),
            });
            const data = await api<{ items: Product[]; meta: ApiMeta }>(`/products?${params}`);
            setProducts(data.items ?? []);
            setMeta(data.meta ?? { total: 0, page: 1, limit: 8, totalPages: 1 });
        } catch (err: any) {
            toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, filterCategory, filterBrand, filterOrigin]);

    useEffect(() => { loadProducts(); }, [loadProducts]);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterCategory, filterBrand, filterOrigin, filterStatus]);

    // Stats
    const totalProducts = meta.total;
    const criticalCount = products.filter(p => getStatus(p) === 'critico').length;
    const lowCount = products.filter(p => getStatus(p) === 'bajo').length;
    const totalValue = products.reduce((s, p) => {
        const pVal = Number(p.price_a) || 0;
        return s + (pVal * getStock(p));
    }, 0);

    const formatStatValue = (val: number) => {
        if (isNaN(val)) return '0';
        if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
        return val.toFixed(0);
    };

    // Client-side status filter
    const filtered = filterStatus
        ? products.filter(p => getStatus(p) === filterStatus)
        : products;

    const clearFilters = () => { setFilterCategory(''); setFilterBrand(''); setFilterOrigin(''); setFilterStatus(''); setSearch(''); };
    const hasFilters = filterCategory || filterBrand || filterOrigin || filterStatus || search;

    // Delete
    const handleDelete = async () => {
        if (!deleteProduct) return;
        setDeleting(true);
        try {
            await api(`/products/${deleteProduct.id}`, { method: 'DELETE' });
            toast.success('Producto eliminado correctamente');
            setDeleteProduct(null);
            loadProducts();
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar el producto');
        } finally {
            setDeleting(false);
        }
    };

    // Export
    const handleExport = async () => {
        toast.info('Preparando exportación...');
        try {
            const data = await api<{ items: Product[] }>('/products?limit=1000');
            const rows = (data.items ?? []).map(p => ({
                Descripcion: p.description,
                Referencia: p.internalReference ?? '',
                Categoria: p.category?.name ?? '',
                Marca: p.brand?.name ?? '',
                PrecioA: p.price_a,
                PrecioB: p.price_b,
                PrecioC: p.price_c,
                Stock: getStock(p),
            }));
            const csv = [Object.keys(rows[0] ?? {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'productos.csv'; a.click();
            toast.success('Exportación completada');
        } catch { toast.error('Error al exportar'); }
    };

    // Import
    const handleImportSubmit = async (file: File) => {
        setShowImportModal(false);
        const toastId = toast.loading('Importando productos...');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'}/products/bulk/import`, {
                method: 'POST',
                headers: {
                    'x-tenant-slug': JSON.parse(localStorage.getItem('session') ?? '{ }')?.tenantSlug ?? '',
                    'authorization': `Bearer ${JSON.parse(localStorage.getItem('session') ?? '{}')?.accessToken ?? ''}`
                },
                body: formData,
            });
            const result = await res.json();
            toast.dismiss(toastId);

            if (res.ok) {
                toast.success(`Importación completada: ${result.created} creados, ${result.updated} actualizados`);
                loadProducts();
            } else {
                toast.error(result.message || 'Error en el formato del archivo');
            }
        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error('Error al conectar con el servidor');
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ background: '#F7F9FC' }}>
            <div className="max-w-screen-xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#0F172A]">Administración de Productos</h1>
                        <p className="text-sm text-[#475569] mt-1">Gestiona el catálogo maestro de licores premium e importaciones</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ActionButton
                            onClick={handleExport}
                            icon={Download}
                            label="Exportar"
                            variant="secondary"
                        />
                        <ActionButton
                            onClick={() => setShowImportModal(true)}
                            icon={Upload}
                            label="Importar"
                            variant="secondary"
                        />
                        <ActionButton
                            onClick={() => setShowCreateModal(true)}
                            icon={Plus}
                            label="Nuevo Producto"
                            variant="primary"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard label="Total Productos" value={totalProducts} icon={Package} color="#2563EB" loading={loading} />
                    <StatsCard label="Stock Crítico" value={criticalCount} icon={AlertCircle} color="#DC2626" loading={loading} />
                    <StatsCard label="Stock Bajo" value={lowCount} icon={AlertTriangle} color="#F59E0B" loading={loading} />
                    <StatsCard label="Valor Inventario" value={`$${formatStatValue(totalValue)}`} icon={DollarSign} color="#16A34A" loading={loading} />
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm">
                    <div className="p-4 border-b border-[#E2E8F0]">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                                <input type="text" placeholder="Buscar por nombre, SKU, marca o referencia..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowFilters(f => !f)} className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-lg transition-colors ${showFilters ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F7F9FC]'}`}>
                                    <Filter className="w-4 h-4" /> Filtros
                                </button>
                                <div className="flex border border-[#E2E8F0] rounded-lg overflow-hidden">
                                    <button onClick={() => setViewMode('list')} className={`px-3 py-2.5 ${viewMode === 'list' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#475569] hover:bg-[#F7F9FC]'}`}><List className="w-4 h-4" /></button>
                                    <button onClick={() => setViewMode('grid')} className={`px-3 py-2.5 border-l border-[#E2E8F0] ${viewMode === 'grid' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#475569] hover:bg-[#F7F9FC]'}`}><Grid3X3 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-4 bg-[#F7F9FC] border-b border-[#E2E8F0]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-[#475569] mb-1.5">Categoría</label>
                                    <div className="relative">
                                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm appearance-none">
                                            <option value="">Todas</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#475569] mb-1.5">Marca</label>
                                    <div className="relative">
                                        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm appearance-none">
                                            <option value="">Todas</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#475569] mb-1.5">Estado de Stock</label>
                                    <div className="relative">
                                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm appearance-none">
                                            <option value="">Todos</option>
                                            <option value="optimo">Óptimo</option>
                                            <option value="bajo">Bajo</option>
                                            <option value="critico">Crítico</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#475569] mb-1.5">Origen</label>
                                    <div className="relative">
                                        <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white text-sm appearance-none">
                                            <option value="">Todos</option>
                                            {origins.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button onClick={clearFilters} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#DC2626] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#FEF2F2] transition-colors">
                                        <X className="w-4 h-4" /> Limpiar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="px-4 py-3 bg-[#F7F9FC] border-b border-[#E2E8F0]">
                        <p className="text-sm text-[#475569]">
                            Mostrando <span className="font-semibold text-[#0F172A]">{filtered.length}</span> de{' '}
                            <span className="font-semibold text-[#0F172A]">{meta.total}</span> productos
                        </p>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <ProductListSkeleton />
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F7F9FC] flex items-center justify-center">
                                <Package className="w-8 h-8 text-[#94A3B8]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No se encontraron productos</h3>
                            <p className="text-sm text-[#94A3B8] mb-4">Intenta con otros filtros o crea un nuevo producto</p>
                            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 text-sm bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
                                Nuevo Producto
                            </button>
                        </div>
                    ) : viewMode === 'list' ? (
                        <DataTable
                            columns={[
                                {
                                    header: 'Producto',
                                    key: 'description',
                                    render: (p) => (
                                        <div className="flex items-center gap-3">
                                            <SharedProductImage src={p.mainImageUrl} size={10} />
                                            <div>
                                                <p className="text-sm font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{p.description}</p>
                                                <p className="text-xs text-[#94A3B8]">{p.category?.name ?? '—'}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Referencia',
                                    key: 'internalReference',
                                    render: (p) => (
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-[#F7F9FC] text-xs font-mono text-[#475569] border border-[#E2E8F0]">
                                            {p.internalReference ?? '—'}
                                        </span>
                                    )
                                },
                                {
                                    header: 'Marca',
                                    key: 'brand',
                                    render: (p) => <span className="text-sm text-[#475569]">{p.brand?.name ?? '—'}</span>
                                },
                                {
                                    header: 'Origen',
                                    key: 'origin',
                                    render: (p) => (
                                        <div className="flex items-center gap-1.5">
                                            <Globe className="w-3 h-3 text-[#3B82F6]" />
                                            <span className="text-xs font-medium text-[#475569] uppercase">{p.origin?.name || p.paisOrigen || '—'}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Precio A',
                                    key: 'price_a',
                                    align: 'right',
                                    render: (p) => (
                                        <div>
                                            <p className="text-sm font-semibold text-[#0F172A]">${formatPrice(p.price_a)}</p>
                                            {p.weightedAvgCost ? <p className="text-xs text-[#94A3B8]">Costo: ${formatPrice(p.weightedAvgCost)}</p> : null}
                                        </div>
                                    )
                                },
                                {
                                    header: 'Stock',
                                    key: 'stock',
                                    align: 'right',
                                    render: (p) => (
                                        <div>
                                            <p className="text-sm font-semibold text-[#0F172A]">{getStock(p)}</p>
                                            <p className="text-xs text-[#94A3B8]">Min: {getMinStock(p)}</p>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Estado',
                                    key: 'status',
                                    align: 'center',
                                    render: (p) => <StatusBadge status={getStatus(p)} />
                                },
                                {
                                    header: 'Acciones',
                                    key: 'actions',
                                    align: 'center',
                                    render: (p) => (
                                        <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setEditProduct(p)} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded transition-colors" title="Editar">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setDeleteProduct(p)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded transition-colors" title="Eliminar">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            data={filtered}
                            loading={loading}
                            onRowClick={setSelectedProduct}
                            Skeleton={ProductListSkeleton}
                        />
                    ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map(p => (
                                <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setSelectedProduct(p)}>
                                    <div className="flex items-start justify-between mb-3">
                                        <SharedProductImage src={p.mainImageUrl} size={12} />
                                        <StatusBadge status={getStatus(p)} />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#0F172A] mb-1 line-clamp-2 group-hover:text-[#2563EB] transition-colors">{p.description}</h3>
                                    <p className="text-xs text-[#94A3B8] mb-1">{p.brand?.name ?? '—'} · {p.category?.name ?? '—'}</p>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Globe className="w-3 h-3 text-[#3B82F6]" />
                                        <span className="text-[10px] font-bold text-[#475569] uppercase">{p.origin?.name || p.paisOrigen || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E2E8F0]">
                                        <div><p className="text-xs text-[#94A3B8]">Precio A</p><p className="text-lg font-semibold text-[#0F172A]">${formatPrice(p.price_a)}</p></div>
                                        <div className="text-right"><p className="text-xs text-[#94A3B8]">Stock</p><p className="text-lg font-semibold text-[#0F172A]">{getStock(p)}</p></div>
                                    </div>
                                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }} className="p-1.5 text-[#2563EB] hover:bg-[#2563EB]/10 rounded transition-colors" title="Ver Detalles">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditProduct(p); }} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded transition-colors" title="Editar">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteProduct(p); }} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/10 rounded transition-colors" title="Eliminar">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={meta.totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Modals */}
            {showImportModal && (
                <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImportSubmit} />
            )}
            {showCreateModal && (
                <ProductFormModal categories={categories} brands={brands} origins={origins} tariffs={tariffs} suppliers={suppliers} onClose={() => setShowCreateModal(false)} onSaved={loadProducts} />
            )}
            {editProduct && (
                <ProductFormModal product={editProduct} categories={categories} brands={brands} origins={origins} tariffs={tariffs} suppliers={suppliers} onClose={() => setEditProduct(null)} onSaved={loadProducts} />
            )}
            {deleteProduct && (
                <DeleteDialog product={deleteProduct} onConfirm={handleDelete} onCancel={() => setDeleteProduct(null)} />
            )}
            {selectedProduct && (
                <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
            )}
        </div>
    );
}
