'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Plus, Trash2, Save, Printer, X, Check,
    ClipboardCheck, Package, Hash, Boxes, FileText, User,
    Calendar, MapPin, Monitor, Trash, AlertCircle, Info, ScanLine, MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
    Autocomplete,
    AutocompleteItem,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Tooltip
} from '@heroui/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import clsx from 'clsx';

interface Branch {
    id: string;
    name: string;
}

interface Product {
    id: string;
    description: string;
    internalReference: string;
    barcodes: { barcode: string }[];
}

interface CountItem {
    id: string;
    productId: string;
    product: {
        description: string;
        internalReference: string;
        barcodes: { barcode: string }[];
    };
    countedQuantity: number;
}

interface CountSession {
    id: string;
    branchId: string;
    description: string;
    status: string;
    createdAt: string;
    items: CountItem[];
    totalItems: number;
    totalEntries: number;
}

export default function PhysicalInventoryCapturePage() {
    const router = useRouter();
    const { isOpen: isNewOpen, onOpen: onNewOpen, onOpenChange: onNewOpenChange } = useDisclosure();

    // State
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeSession, setActiveSession] = useState<CountSession | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form for new item
    const [newItem, setNewItem] = useState({
        productId: '',
        quantity: '1',
    });

    const [newSessionData, setNewSessionData] = useState({
        branchId: '',
        description: ''
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [branchesData, productsData] = await Promise.all([
                api<Branch[]>('/branches'),
                api<{ items: Product[] }>('/products?limit=100')
            ]);
            setBranches(branchesData || []);
            setProducts(productsData?.items || []);

            if (branchesData.length > 0) {
                checkActiveSession(branchesData[0].id);
            }
        } catch (e: any) {
            toast.error('Error al cargar datos base');
        } finally {
            setLoading(false);
        }
    };

    const checkActiveSession = async (branchId: string) => {
        try {
            const session = await api<CountSession>(`/inventory/counts/active?branchId=${branchId}`);
            setActiveSession(session);
        } catch (e) {
            setActiveSession(null);
        }
    };

    const handleCreateSession = async () => {
        if (!newSessionData.branchId) {
            toast.error('Indique la sucursal');
            return;
        }
        setIsSubmitting(true);
        try {
            const session = await api<CountSession>('/inventory/counts', {
                method: 'POST',
                body: newSessionData
            });
            setActiveSession({ ...session, items: [], totalItems: 0, totalEntries: 0 });
            onNewOpenChange();
            toast.success('Sesión de auditoría iniciada');
        } catch (e: any) {
            toast.error(e.message || 'Error al iniciar sesión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddItem = async () => {
        if (!activeSession || !newItem.productId || !newItem.quantity) return;

        try {
            await api(`/inventory/counts/${activeSession.id}/items`, {
                method: 'POST',
                body: {
                    productId: newItem.productId,
                    quantity: Number(newItem.quantity)
                }
            });
            checkActiveSession(activeSession.branchId);
            setNewItem({ productId: '', quantity: '1' });
            toast.success('Entrada registrada');
        } catch (e: any) {
            toast.error(e.message || 'Error al agregar');
        }
    };

    const handleComplete = async () => {
        if (!activeSession) return;

        const toastId = toast.loading('Calculando diferencias y cerrando auditoría...');
        try {
            await api(`/inventory/counts/${activeSession.id}/complete`, {
                method: 'PATCH'
            });
            toast.success('Auditoría física finalizada correctamente', { id: toastId });
            router.push('/dashboard/inventario/fisico');
        } catch (e: any) {
            toast.error(e.message || 'Error al completar', { id: toastId });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans tracking-tight">
            {/* Header Moderno con Glassmorphism */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard/inventario/fisico')}
                            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border border-[#2563EB]/10">
                                    Auditoría Técnica
                                </span>
                                {activeSession && (
                                    <Badge variant="success" className="h-5 px-2 text-[9px] font-bold">ACTIVO</Badge>
                                )}
                            </div>
                            <h1 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase">Captura de Conteo Físico</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Sucursal Actual</span>
                            <span className="text-sm font-black text-[#0F172A]">{activeSession ? branches.find(b => b.id === activeSession.branchId)?.name : 'Sin Selección'}</span>
                        </div>
                        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
                            <Tooltip content="Nueva Sesión">
                                <button onClick={onNewOpen} className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-[#64748B]">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <Tooltip content="Imprimir Listado">
                                <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-[#64748B]">
                                    <Printer className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <div className="w-px h-6 bg-[#CBD5E1] mx-1"></div>
                            <Tooltip content="Liquidar y Cerrar">
                                <button
                                    onClick={handleComplete}
                                    disabled={!activeSession}
                                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-[#1D4ED8] disabled:opacity-50 transition-all shadow-sm"
                                >
                                    <Save className="w-4 h-4" /> Finalizar
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 flex flex-col xl:flex-row gap-6">
                {/* Main Section */}
                <div className="flex-1 space-y-6">

                    {/* Top Metadata & Quick Info */}
                    <Card className="border-[#E2E8F0] shadow-sm">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Zona / Ubicación
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-bold text-[#0F172A] focus:bg-white focus:border-[#2563EB] transition-all outline-none"
                                        placeholder="Ej: Pasillo A-01"
                                        defaultValue={activeSession?.description}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Hash className="w-3 h-3" /> Control Interno
                                    </label>
                                    <div className="bg-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm font-black text-[#475569] border border-[#E2E8F0]">
                                        #{activeSession?.id.slice(0, 8).toUpperCase() || '---'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Fecha Inicio
                                    </label>
                                    <div className="bg-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm font-black text-[#475569] border border-[#E2E8F0]">
                                        {activeSession ? new Date(activeSession.createdAt).toLocaleDateString() : '---'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User className="w-3 h-3" /> Operador
                                    </label>
                                    <div className="bg-[#F1F5F9] rounded-xl px-4 py-2.5 text-sm font-black text-[#475569] border border-[#E2E8F0]">
                                        ADMIN EVOLUTION
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Matrix Capture Grid */}
                    <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] w-[20%]">Identificación</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Producto</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] w-[15%]">Canteo Físico</th>
                                        <th className="px-6 py-4 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {/* Entry Form Row */}
                                    <tr className="bg-[#EFF6FF]/30">
                                        <td className="px-6 py-5">
                                            <div className="relative">
                                                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                                                <input
                                                    className="w-full bg-[#F8FAFC] border border-[#2563EB]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs font-black focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none"
                                                    placeholder="REF / SCO / BARRA"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Autocomplete
                                                placeholder="Busque o seleccione producto..."
                                                variant="bordered"
                                                size="lg"
                                                className="w-full"
                                                onSelectionChange={(key) => setNewItem({ ...newItem, productId: key as string })}
                                                classNames={{
                                                    popoverContent: "bg-white shadow-2xl border border-[#E2E8F0]",
                                                    listbox: "bg-white",
                                                }}
                                            >
                                                {products.map((p) => (
                                                    <AutocompleteItem key={p.id} textValue={p.description}>
                                                        <div className="flex flex-col py-1">
                                                            <span className="text-xs font-black text-[#0F172A] uppercase">{p.internalReference}</span>
                                                            <span className="text-[10px] text-[#64748B] uppercase font-bold">{p.description}</span>
                                                        </div>
                                                    </AutocompleteItem>
                                                ))}
                                            </Autocomplete>
                                        </td>
                                        <td className="px-6 py-5">
                                            <input
                                                type="number"
                                                value={newItem.quantity}
                                                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-black text-right focus:border-[#2563EB] transition-all outline-none"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={handleAddItem}
                                                className="p-3 bg-[#2563EB] text-white rounded-xl hover:bg-[#1D4ED8] transition-all shadow-lg shadow-[#2563EB]/20"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* List of Scanned Items */}
                                    {activeSession?.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition-all group">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded-md">
                                                    {item.product.internalReference}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-[#0F172A] uppercase">{item.product.description}</span>
                                                    <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
                                                        UPC: {item.product.barcodes[0]?.barcode || 'S/N'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-[#0F172A] bg-[#F1F5F9] px-4 py-1.5 rounded-lg border border-[#E2E8F0]">
                                                    {item.countedQuantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="p-2 text-[#94A3B8] hover:text-[#EF4444] transition-colors rounded-lg hover:bg-[#FEF2F2]">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {(!activeSession || activeSession.items.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center">
                                                        <Search className="w-8 h-8 text-[#94A3B8]" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">Sin registros de conteo</h3>
                                                        <p className="text-[10px] font-bold text-[#64748B] uppercase">Escanee o busque un producto para iniciar la auditoría</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Shortcuts Legend */}
                        <div className="bg-[#0F172A] text-[#94A3B8] px-6 py-3 flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] border-t border-white/5">
                            <span className="flex items-center gap-2"><span className="text-[#2563EB] font-black">[F2]</span> NUEVO</span>
                            <span className="flex items-center gap-2"><span className="text-[#2563EB] font-black">[F3]</span> ELIMINAR</span>
                            <span className="flex items-center gap-2"><span className="text-[#2563EB] font-black">[F5]</span> BUSCAR</span>
                            <span className="flex items-center gap-2 ml-auto"><span className="text-[#2563EB] font-black">[ESC]</span> SALIR</span>
                        </div>
                    </div>
                </div>

                {/* KPI Sidebar - Evolution Style Containers */}
                <div className="w-full xl:w-[380px] space-y-6">

                    {/* Focus Unit Detail */}
                    <Card className="bg-[#0F172A] text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Info className="w-32 h-32" />
                        </div>
                        <CardContent className="p-8 relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB] mb-6">Detalle de Referencia</h4>
                            <div className="space-y-6">
                                <div className="text-5xl font-black tracking-tighter">
                                    {newItem.productId ? '---' : '0.00'}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-[#94A3B8] uppercase">Último SKU marcado</p>
                                    <p className="text-sm font-black uppercase">{newItem.productId ? 'PRODUCTO SELECCIONADO' : 'PENDIENTE'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
                            <div className="flex">
                                <div className="w-2 bg-[#10B981]"></div>
                                <div className="p-6 flex-1">
                                    <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-2">Total Unidades</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-[#0F172A]">{activeSession?.totalItems || 0}</span>
                                        <div className="p-3 bg-[#10B981]/10 rounded-xl">
                                            <Boxes className="w-6 h-6 text-[#10B981]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="border-[#E2E8F0] shadow-sm bg-white overflow-hidden">
                            <div className="flex">
                                <div className="w-2 bg-[#2563EB]"></div>
                                <div className="p-6 flex-1">
                                    <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-2">Items Diferentes</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-[#0F172A]">{activeSession?.totalEntries || 0}</span>
                                        <div className="p-3 bg-[#2563EB]/10 rounded-xl">
                                            <ClipboardCheck className="w-6 h-6 text-[#2563EB]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* System Information Alert */}
                    <div className="p-6 bg-[#FEF3C7] border border-[#F59E0B]/20 rounded-3xl flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-[#D97706] shrink-0" />
                        <div>
                            <h5 className="text-xs font-black text-[#92400E] uppercase mb-1">Nota de Seguridad</h5>
                            <p className="text-[11px] font-bold text-[#B45309] leading-relaxed uppercase">
                                Los excedentes y faltantes se recalcularán automáticamente al finalizar la sesión basado en el stock teórico de la sucursal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Inicialización */}
            <Modal isOpen={isNewOpen} onOpenChange={onNewOpenChange} backdrop="blur" size="md" radius="3xl">
                <ModalContent className="bg-white border-none shadow-2xl">
                    <ModalHeader className="px-8 pt-8 pb-4 flex flex-col gap-1">
                        <div className="w-12 h-12 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mb-2">
                            <Monitor className="w-6 h-6 text-[#2563EB]" />
                        </div>
                        <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight">Nueva Auditoría</h2>
                        <p className="text-xs font-bold text-[#64748B] uppercase tracking-wide">Configure los parámetros del conteo</p>
                    </ModalHeader>
                    <ModalBody className="px-8 py-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Seleccionar Sucursal</label>
                            <Autocomplete
                                placeholder="Escoja la bodega sucursal..."
                                onSelectionChange={(key) => setNewSessionData({ ...newSessionData, branchId: key as string })}
                                variant="bordered"
                                radius="xl"
                                classNames={{
                                    popoverContent: "bg-white border-none shadow-2xl"
                                }}
                            >
                                {branches.map((b) => (
                                    <AutocompleteItem key={b.id} textValue={b.name}>{b.name}</AutocompleteItem>
                                ))}
                            </Autocomplete>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Detalle / Zona (Nombre)</label>
                            <input
                                onChange={(e) => setNewSessionData({ ...newSessionData, description: e.target.value })}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#2563EB] transition-all outline-none"
                                placeholder="Ej: Pasillo A, Estante 4..."
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter className="px-8 pb-8 pt-4 flex gap-3">
                        <Button variant="ghost" className="rounded-xl" onClick={() => onNewOpenChange()}>Cancelar</Button>
                        <Button
                            variant="primary"
                            isLoading={isSubmitting}
                            onClick={handleCreateSession}
                            className="flex-1 bg-[#2563EB] text-white rounded-xl shadow-lg shadow-[#2563EB]/20 font-black uppercase tracking-widest"
                        >
                            Iniciar Auditoría
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
