'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, Plus, Edit, Trash2, X, Barcode as BarcodeIcon,
    ChevronLeft, ChevronRight, Info, AlertCircle, ArrowLeft,
    Star, Package, Check, Copy, ScanLine, Filter, Camera,
    LayoutGrid, List, Maximize2, Minimize2, Image as ImageIcon, RefreshCw,
    Download, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Html5Qrcode } from 'html5-qrcode';
import ReactBarcode from 'react-barcode';

// ─── UTILS ────────────────────────────────────────────────────────────────────
function generateRandomBarcode(type: BarcodeType): string {
    const randomDigits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

    if (type === 'EAN13') {
        let code = randomDigits(12);
        let sum = 0;
        for (let i = 0; i < 12; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
        let check = (10 - (sum % 10)) % 10;
        return code + check;
    }
    if (type === 'EAN8') {
        let code = randomDigits(7);
        let sum = 0;
        for (let i = 0; i < 7; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
        let check = (10 - (sum % 10)) % 10;
        return code + check;
    }
    if (type === 'UPC-A') {
        let code = randomDigits(11);
        let sum = 0;
        for (let i = 0; i < 11; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
        let check = (10 - (sum % 10)) % 10;
        return code + check;
    }
    if (type === 'UPC-E') {
        return randomDigits(8);
    }
    return `ID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type BarcodeType = 'EAN13' | 'EAN8' | 'UPC-A' | 'UPC-E' | 'QR' | 'CODE128' | 'CODE39';

interface Product {
    id: string;
    description: string;
    internalReference: string | null;
    mainImageUrl?: string | null;
}

interface ProductBarcode {
    id: string;
    productId: string;
    barcode: string;
    type: BarcodeType;
    isDefault: boolean;
    description: string | null;
    createdAt: string;
    product: {
        description: string;
        internalReference: string | null;
        mainImageUrl?: string | null;
    };
}

interface ApiMeta { total: number; page: number; limit: number; totalPages: number; }

const BARCODE_TYPES: BarcodeType[] = ['EAN13', 'EAN8', 'UPC-A', 'UPC-E', 'QR', 'CODE128', 'CODE39'];

const TYPE_META: Record<BarcodeType, { color: string; bg: string; digits: string }> = {
    'EAN13': { color: '#2563EB', bg: '#EFF6FF', digits: '13 dígitos' },
    'EAN8': { color: '#7C3AED', bg: '#F5F3FF', digits: '8 dígitos' },
    'UPC-A': { color: '#0891B2', bg: '#ECFEFF', digits: '12 dígitos' },
    'UPC-E': { color: '#0D9488', bg: '#F0FDFA', digits: '8 dígitos' },
    'QR': { color: '#D97706', bg: '#FFFBEB', digits: 'Variable' },
    'CODE128': { color: '#16A34A', bg: '#F0FDF4', digits: '1-80 chars' },
    'CODE39': { color: '#DC2626', bg: '#FEF2F2', digits: 'Variable' },
};

// ─── SCANNER COMPONENT ────────────────────────────────────────────────────────
function BarcodeScanner({ onScan, onClose }: { onScan: (decodedText: string) => void; onClose: () => void }) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 250, height: 150 } },
                    async (text) => {
                        // Stop first, then notify parent
                        if (html5QrCode.isScanning) {
                            await html5QrCode.stop().catch(() => { });
                        }
                        onScan(text);
                    },
                    () => { }
                );
                setStarted(true);
            } catch (err) {
                console.error("Scanner start error:", err);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#0F172A] flex items-center gap-2">
                        <Camera className="w-5 h-5 text-[#2563EB]" /> Lector Láser
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-gray-100">
                    <div id="reader" className="w-full h-full" />
                    {started && (
                        <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-[#2563EB] shadow-[0_0_15px_rgba(37,99,235,0.8)] z-10 opacity-70" />
                    )}
                </div>
                <p className="mt-4 text-center text-[11px] text-[#64748B] font-bold uppercase tracking-widest">Escaneando...</p>
            </motion.div>
        </div>
    );
}

// ─── PRODUCT PICKER COMPONENT ─────────────────────────────────────────────────
function ProductPicker({ products, selectedId, onSelect }: { products: Product[], selectedId: string, onSelect: (id: string) => void }) {
    const [search, setSearch] = useState('');

    const filtered = products.filter(p =>
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.internalReference?.toLowerCase() || '').includes(search.toLowerCase())
    );

    const ProductCard = ({ p }: { p: Product }) => (
        <button type="button" onClick={() => onSelect(p.id)}
            className={`flex transition-all border-2 text-left overflow-hidden relative group ${selectedId === p.id
                ? 'border-[#2563EB] bg-[#EFF6FF] ring-[6px] ring-blue-50/50'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xl hover:-translate-y-1'
                } flex-row items-center rounded-xl p-3 gap-4 shrink-0`}>

            <SharedProductImage src={p.mainImageUrl} size={20} className="w-20 h-20" />

            {/* Details Area */}
            <div className="min-w-0 flex-1 flex flex-col justify-center pr-4">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[#0F172A] uppercase leading-tight text-sm font-black">
                        {p.description}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">
                        {p.internalReference || 'S/REF'}
                    </p>
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    <span className="text-[10px] font-black text-[#16A34A] uppercase">En Existencia</span>
                </div>
            </div>

            {/* Selection Indicator */}
            {selectedId === p.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-blue-600/5 backdrop-blur-[1px] flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-2xl border-4 border-white">
                        <Check className="w-6 h-6 stroke-[3px]" />
                    </div>
                </motion.div>
            )}
        </button>
    );

    return (
        <div className="flex flex-col gap-4 relative mt-2">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-blue-500 transition-colors" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ej: Johnnie Walker..."
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-[#E2E8F0] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-500 focus:bg-white transition-all font-medium" />
                </div>
            </div>

            <div className="overflow-y-auto border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] p-3 custom-scrollbar flex flex-col gap-2 max-h-[180px] shadow-inner">
                {filtered.length === 0 ? (
                    <div className="col-span-full py-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-gray-200">
                            <Package className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Sin resultados</p>
                    </div>
                ) : (
                    filtered.map(p => <ProductCard key={p.id} p={p} />)
                )}
            </div>
        </div>
    );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
function BarcodeFormModal({ barcode, products, saving, onSave, onClose, existingBarcodes }: {
    barcode?: ProductBarcode | null; products: Product[]; saving: boolean;
    onSave: (d: any) => void; onClose: () => void; existingBarcodes: ProductBarcode[];
}) {
    const [productId, setProductId] = useState(barcode?.productId ?? '');
    const [value, setValue] = useState(barcode?.barcode ?? '');
    const [type, setType] = useState<BarcodeType>(barcode?.type ?? 'EAN13');
    const [isDefault, setIsDefault] = useState(barcode?.isDefault ?? false);
    const [description, setDescription] = useState(barcode?.description ?? '');
    const [showScanner, setShowScanner] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (!barcode) setTimeout(() => inputRef.current?.focus(), 80); }, [barcode]);

    const isEdit = !!barcode;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return toast.error('Selecciona un producto');
        if (!value.trim()) return toast.error('El código es requerido');

        // Validation 1: Product already has a barcode?
        const productHasBarcode = existingBarcodes.find(b => b.productId === productId && b.id !== barcode?.id);
        if (productHasBarcode) return toast.error(`El producto '${productHasBarcode.product.description}' ya tiene un código asignado`);

        // Validation 2: Barcode value duplicate?
        const inUse = existingBarcodes.find(b => b.barcode === value.trim() && b.id !== barcode?.id);
        if (inUse) return toast.error(`El código '${value}' ya está en uso por ${inUse.product.description}`);

        // Validation 3: Format specific validation
        if (type === 'EAN13' && value.trim().length !== 13) return toast.error('EAN-13 debe tener exactamente 13 dígitos');
        if (type === 'EAN8' && value.trim().length !== 8) return toast.error('EAN-8 debe tener exactamente 8 dígitos');
        if (type === 'UPC-A' && value.trim().length !== 12) return toast.error('UPC-A debe tener exactamente 12 dígitos');

        onSave({ productId, barcode: value.trim(), type, isDefault, description: description.trim() });
    };

    const playScanSound = () => {
        const audio = new Audio('/scaner.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={e => e.stopPropagation()}>
                    <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                            <p className="text-[9px] text-[#2563EB] font-black uppercase tracking-widest mb-0.5">Gestión de Inventario</p>
                            <h2 className="text-base font-black text-[#0F172A] uppercase tracking-tight">{isEdit ? 'Editar Código' : 'Registrar Identificador'}</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-all"><X className="w-4 h-4 text-[#64748B]" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                        <form id="bc-form" onSubmit={handleSubmit} className="flex flex-col lg:flex-row min-h-[400px]">
                            {/* LEFT COLUMN: BASIC DATA */}
                            <div className="flex-1 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#E2E8F0] bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-4 bg-[#2563EB] rounded-full" />
                                    <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Información Base</h3>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-2 block">Selección de Producto <span className="text-red-500">*</span></label>
                                    {isEdit ? (
                                        <div className="group relative bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-4 transition-all hover:bg-white hover:border-[#2563EB]/20">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white bg-white shadow-sm shrink-0">
                                                <SharedProductImage src={barcode.product.mainImageUrl} size={12} className="object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest mb-1">Producto Vinculado</p>
                                                <h4 className="text-[13px] font-black text-[#0F172A] uppercase truncate leading-tight">{barcode.product.description}</h4>
                                                <p className="text-[10px] font-mono font-bold text-[#94A3B8] mt-1 flex items-center gap-2">
                                                    <span className="bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">REF: {barcode.product.internalReference || 'S/REF'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <ProductPicker products={products} selectedId={productId} onSelect={setProductId} />
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] block">Identificador y Formato <span className="text-red-500">*</span></label>
                                            <select value={type} onChange={e => { setType(e.target.value as BarcodeType); setValue(''); }} className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] bg-transparent focus:outline-none cursor-pointer">
                                                {BARCODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <BarcodeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                                <input ref={inputRef} value={value} onChange={e => {
                                                    setValue(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''));
                                                    if (e.target.value.length > value.length && e.target.value.length >= 8) playScanSound();
                                                }} placeholder={`Escribe o escanea un ${type}...`}
                                                    className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all shadow-sm" />
                                            </div>
                                            <button type="button" onClick={() => setValue(generateRandomBarcode(type))} className="px-3 py-3 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center transition-all shadow-sm shrink-0" title="Generar Automáticamente">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={() => setShowScanner(true)} className="px-3 py-3 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#2563EB] hover:text-[#2563EB] flex items-center gap-2 text-[10px] font-black uppercase transition-all shadow-sm shrink-0">
                                                <Camera className="w-4 h-4" /> <span className="hidden sm:inline">Láser</span>
                                            </button>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-4 cursor-pointer p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 transition-all group">
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isDefault ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-[#E2E8F0] group-hover:border-[#2563EB]'}`}>
                                            {isDefault && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                        </div>
                                        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="hidden" />
                                        <div className="flex-1">
                                            <span className="text-[11px] font-black text-[#0F172A] uppercase tracking-wide">Código Predeterminado</span>
                                            <p className="text-[9px] text-[#64748B] font-medium leading-tight mt-0.5">Prioridad alta en Caja y Ventas.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: PREVIEW */}
                            <div className="w-full lg:w-[42%] bg-[#FBFCFE] flex flex-col items-center justify-center p-8 relative min-h-[300px]">
                                {value ? (
                                    <>
                                        {/* QR Section */}
                                        <div className="absolute top-4 right-4 animate-in slide-in-from-top-4 slide-in-from-right-4 duration-500">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-16 h-16 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=000000&margin=0`}
                                                        alt="QR Code"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <p className="text-[6px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">VISTA QR</p>
                                            </div>
                                        </div>

                                        {/* Barcode Section */}
                                        <div className="flex flex-col items-center gap-3 w-full animate-in fade-in zoom-in duration-300">
                                            <div className="scale-105 origin-center bg-white p-3 rounded-xl shadow-sm border border-[#E2E8F0]">
                                                <BarcodeVisual value={value} type={type} />
                                            </div>
                                            <p className="text-[9px] font-black text-[#2563EB] uppercase tracking-[0.3em] mt-1 text-center">Formato: {type}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center opacity-40">
                                        <ScanLine className="w-12 h-12 text-[#94A3B8] mb-3" />
                                        <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Escaneo Pendiente</p>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end gap-3 bg-white">
                        <button type="button" onClick={onClose} className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-[#64748B] hover:bg-gray-50 rounded-xl transition-all">Cancelar</button>
                        <button type="submit" form="bc-form" disabled={saving} className="px-12 py-3 text-[11px] font-black bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8] disabled:opacity-50 flex items-center gap-2 uppercase tracking-[0.2em] transition-all">
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3px]" />}
                            {saving ? 'Guardando...' : 'Aplicar Cambios'}
                        </button>
                    </div>
                </motion.div>
            </div>
            {showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} onScan={(text) => { setValue(text); setShowScanner(false); playScanSound(); toast.success('Lectura completada'); }} />}
        </>
    );
}

// ─── BARCODE VISUAL COMPONENT ────────────────────────────────────────────────
function BarcodeVisual({ value, type }: { value: string; type: BarcodeType }) {
    if (!value) return null;
    if (type === 'QR') return null;

    let safeFormat: "EAN13" | "EAN8" | "UPC" | "CODE128" | "CODE39" = 'CODE128';
    const isNum = /^\d+$/.test(value);

    // Helpers to prevent ReactBarcode crashes on invalid checksums
    const isEan13Valid = (code: string) => {
        let sum = 0; for (let i = 0; i < 12; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
        return code[12] === String((10 - (sum % 10)) % 10);
    };
    const isEan8Valid = (code: string) => {
        let sum = 0; for (let i = 0; i < 7; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
        return code[7] === String((10 - (sum % 10)) % 10);
    };
    const isUpcaValid = (code: string) => {
        let sum = 0; for (let i = 0; i < 11; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
        return code[11] === String((10 - (sum % 10)) % 10);
    };

    if (type === 'EAN13') {
        if (value.length !== 13) return <InvalidCode msg="Req. 13 dígitos" />;
        if (!isNum || !isEan13Valid(value)) return <InvalidCode msg="Checksum Inválido" />;
        safeFormat = 'EAN13';
    } else if (type === 'EAN8') {
        if (value.length !== 8) return <InvalidCode msg="Req. 8 dígitos" />;
        if (!isNum || !isEan8Valid(value)) return <InvalidCode msg="Checksum Inválido" />;
        safeFormat = 'EAN8';
    } else if (type === 'UPC-A') {
        if (value.length !== 12) return <InvalidCode msg="Req. 12 dígitos" />;
        if (!isNum || !isUpcaValid(value)) return <InvalidCode msg="Checksum Inválido" />;
        safeFormat = 'UPC';
    } else if (type === 'UPC-E') {
        if (value.length !== 8) return <InvalidCode msg="Req. 8 dígitos" />;
        safeFormat = 'CODE128'; // Safe fallback for visual render
    } else if (type === 'CODE39') {
        safeFormat = 'CODE39';
    }

    return (
        <ReactBarcode
            value={value}
            format={safeFormat}
            width={1.6}
            height={50}
            displayValue={true}
            fontSize={12}
            margin={0}
            background="transparent"
            lineColor="#0F172A"
        />
    );
}

function InvalidCode({ msg }: { msg: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-2 bg-red-50/50 border border-red-100 rounded-lg w-[180px] h-[60px]">
            <AlertCircle className="w-4 h-4 text-red-500 mb-1" />
            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">{msg}</span>
        </div>
    );
}

// ─── DELETE DIALOG ────────────────────────────────────────────────────────────
function DeleteDialog({ barcode, onConfirm, onCancel }: { barcode: ProductBarcode; onConfirm: () => void; onCancel: () => void }) {
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
                        <h3 className="text-lg font-semibold text-[#0F172A]">Eliminar Código</h3>
                        <p className="text-sm text-[#475569]">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-lg p-3 mb-5 text-center">
                    <span className="text-sm text-[#DC2626] font-bold uppercase tracking-widest">{barcode.barcode}</span>
                    <p className="text-[10px] text-[#DC2626]/60 font-medium uppercase mt-0.5">{barcode.product.description}</p>
                </div>
                <p className="text-sm text-[#475569] mb-5 leading-relaxed">¿Estás seguro de que deseas eliminar este identificador? El producto dejará de ser rastreable por este código de barras.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm border border-[#E2E8F0] bg-white rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#475569] font-semibold">
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

import { StatsCard } from '@/components/shared/StatsCard';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SharedProductImage } from '@/components/shared/SharedProductImage';
import { Pagination } from '@/components/shared/Pagination';
import { ActionButton } from '@/components/shared/ActionButton';

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function BarrasPage() {
    const router = useRouter();
    const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<ApiMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editBarcode, setEditBarcode] = useState<ProductBarcode | null>(null);
    const [deleteBarcode, setDeleteBarcode] = useState<ProductBarcode | null>(null);
    const [selectedBarcode, setSelectedBarcode] = useState<ProductBarcode | null>(null);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const loadProducts = useCallback(async () => {
        try { const res = await api<{ items: Product[] }>('/products?limit=100&page=1'); setProducts(res.items || []); } catch { }
    }, []);

    const loadBarcodes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(currentPage), limit: '15', ...(search ? { search } : {}), ...(filterType ? { type: filterType } : {}) });
            const res = await api<{ items: ProductBarcode[]; meta: ApiMeta }>(`/barcodes?${params}`);
            setBarcodes(res.items); setMeta(res.meta);
        } catch { toast.error('Error de carga'); } finally { setLoading(false); }
    }, [currentPage, search, filterType]);

    useEffect(() => { loadProducts(); loadBarcodes(); }, [loadProducts, loadBarcodes]);

    const handleSave = async (data: any) => {
        setSaving(true);
        try {
            if (editBarcode) await api(`/barcodes/${editBarcode.id}`, { method: 'PATCH', body: data });
            else await api('/barcodes', { method: 'POST', body: data });
            toast.success('Cambio aplicado'); setShowForm(false); setEditBarcode(null); loadBarcodes();
        } catch (e: any) { toast.error(e.message || 'Error'); } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteBarcode) return;
        try {
            await api(`/barcodes/${deleteBarcode.id}`, { method: 'DELETE' });
            toast.success('Eliminado correctamente');
            setDeleteBarcode(null);
            loadBarcodes();
        } catch (e: any) {
            toast.error(e.message || 'Error al eliminar');
        }
    };

    if (!mounted) return null;

    const columns: Column<ProductBarcode>[] = [
        {
            header: 'Identificador',
            key: 'barcode',
            render: (b) => (
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.isDefault ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-[#F7F9FC]'}`}>
                        {b.isDefault ? <Star className="w-5 h-5 text-orange-400 fill-orange-400" /> : <BarcodeIcon className="w-5 h-5 text-[#94A3B8]" />}
                    </div>
                    <div>
                        <span className="text-sm font-mono font-black text-[#0F172A] tracking-wider group-hover:text-[#2563EB] transition-colors">{b.barcode}</span>
                        {b.isDefault && <div className="text-[8px] font-black text-orange-500 uppercase mt-0.5 tracking-tighter">PREDETERMINADO</div>}
                    </div>
                </div>
            )
        },
        {
            header: 'Producto',
            key: 'product',
            render: (b) => (
                <div className="flex items-center gap-3">
                    <SharedProductImage src={b.product.mainImageUrl} size={10} />
                    <div>
                        <p className="text-sm font-black text-[#0F172A] uppercase truncate max-w-[200px] leading-tight">{b.product.description}</p>
                        <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">REF: {b.product.internalReference || 'S/REF'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Formato',
            key: 'type',
            render: (b) => (
                <span className="px-2.5 py-1 bg-[#F1F5F9] rounded text-[9px] font-black text-[#64748B] uppercase tracking-widest border border-[#E2E8F0]">
                    {b.type}
                </span>
            )
        },
        {
            header: 'Estatus',
            key: 'isDefault',
            render: (b) => (
                <StatusBadge
                    status={b.isDefault ? 'optimo' : 'default'}
                    label={b.isDefault ? 'Canal Principal' : 'Alternativo'}
                />
            )
        },
        {
            header: 'Acciones',
            key: 'actions',
            align: 'right',
            render: (b) => (
                <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { navigator.clipboard.writeText(b.barcode); toast.success('Copiado'); }} className="p-1.5 text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#2563EB]/5 rounded-lg transition-all" title="Copiar"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => setEditBarcode(b)} className="p-1.5 text-[#F59E0B] hover:bg-[#F59E0B]/5 rounded-lg transition-all" title="Editar"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteBarcode(b)} className="p-1.5 text-[#DC2626] hover:bg-[#DC2626]/5 rounded-lg transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6" suppressHydrationWarning>
            <AnimatePresence>
                {(showForm || editBarcode) && <BarcodeFormModal existingBarcodes={barcodes} barcode={editBarcode} products={products} saving={saving} onSave={handleSave} onClose={() => { setShowForm(false); setEditBarcode(null); }} />}
                {deleteBarcode && <DeleteDialog barcode={deleteBarcode} onConfirm={handleDelete} onCancel={() => setDeleteBarcode(null)} />}
                {selectedBarcode && !editBarcode && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBarcode(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b flex justify-between bg-white">
                                <h3 className="font-extrabold uppercase text-xs text-[#0F172A] tracking-wider">Ficha de Identificador</h3>
                                <button onClick={() => setSelectedBarcode(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-6 bg-[#FBFCFE]">
                                <div className="p-8 bg-white border border-[#E2E8F0] rounded-3xl flex flex-col items-center shadow-sm"> <BarcodeVisual value={selectedBarcode.barcode} type={selectedBarcode.type} /> </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start border-b border-[#E2E8F0] pb-2">
                                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">PRODUCTO</span>
                                        <span className="text-xs font-black text-[#0F172A] text-right max-w-[150px] uppercase truncate">{selectedBarcode.product.description}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Ref. Interna</span>
                                        <span className="text-xs font-mono font-black text-[#2563EB]">{selectedBarcode.product.internalReference || '—'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white border-t border-[#E2E8F0] flex gap-2">
                                <button onClick={() => { navigator.clipboard.writeText(selectedBarcode.barcode); toast.success('Copiado'); }} className="flex-1 flex gap-2 items-center justify-center py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[10px] font-black uppercase text-[#475569] hover:bg-gray-50 transition-all"><Copy className="w-3.5 h-3.5" /> Copiar</button>
                                <button onClick={() => { setEditBarcode(selectedBarcode); setSelectedBarcode(null); }} className="flex-1 flex gap-2 items-center justify-center py-2.5 bg-[#2563EB] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-600/20"><Edit className="w-3.5 h-3.5" /> Editar</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
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
                                        Códigos de Barras
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <ActionButton
                                    onClick={() => setShowForm(true)}
                                    icon={Plus}
                                    label="Registrar Código"
                                    variant="primary"
                                    hideLabelOnMobile={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard label="Identificadores" value={meta.total} icon={ScanLine} color="#2563EB" loading={loading} />
                    <StatsCard label="Productos" value={products.length} icon={Package} color="#16A34A" loading={loading} />
                    <StatsCard label="Formatos EAN" value={barcodes.filter(b => b.type === 'EAN13').length} icon={BarcodeIcon} color="#7C3AED" loading={loading} />
                    <StatsCard label="Principal" value={barcodes.filter(b => b.isDefault).length} icon={Star} color="#F59E0B" loading={loading} />
                </div>

                {/* Filters & Table Panel */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#E2E8F0]">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                <input type="text" placeholder="Busca por código, descripción o referencia..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-sm transition-all text-[#0F172A] font-medium" />
                            </div>
                            <div className="flex gap-2">
                                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold uppercase tracking-widest text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]">
                                    <option value="">Formatos</option>
                                    {BARCODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="bg-[#2563EB]/5 px-4 py-2 rounded-lg border border-[#2563EB]/10 flex items-center">
                                    <span className="text-[10px] font-black text-[#2563EB] uppercase whitespace-nowrap">{meta.total} REGISTROS</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={barcodes}
                        loading={loading}
                        onRowClick={(b) => setSelectedBarcode(b)}
                        Skeleton={TableSkeleton}
                        emptyMessage="No hay códigos de barra registrados con estos criterios."
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalPages={meta.totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="divide-y divide-[#E2E8F0]">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="px-4 py-6 flex items-center gap-6 bg-white">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            ))}
        </div>
    );
}
