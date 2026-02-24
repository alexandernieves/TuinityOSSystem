'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, RotateCcw, Search, Calendar, User, AlertTriangle,
    FileText, Loader2, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PurchaseOrder = {
    id: string;
    invoiceNumber: string | null;
    supplierName: string;
    orderDate: string;
    receivedDate: string | null;
    totalCifValue: number;
    status: string;
    branch: { name: string };
    items: {
        id: string;
        productId: string;
        quantity: number;
        receivedQuantity: number;
        unitCifValue: number;
        product: { description: string; internalReference: string | null };
    }[];
};

export default function ReverseEntryPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [reversing, setReversing] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await api<any>('/purchases?status=RECEIVED&limit=50');
            setOrders(data.items || []);
        } catch (err) {
            toast.error('Error al cargar entradas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleReverse = async () => {
        if (!selectedOrder) return;

        try {
            setReversing(true);
            await api(`/purchases/${selectedOrder.id}/reverse`, { method: 'POST' });
            toast.success('Entrada reversada con éxito');
            setSelectedOrder(null);
            fetchOrders();
        } catch (err: any) {
            toast.error(err.message || 'Error al reversar entrada');
        } finally {
            setReversing(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-bg-base pb-20">
            {/* Sticky Header Area */}
            <div className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md pt-6 pb-2">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-white border border-border shadow-lg rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/dashboard/inventario/herramientas')}
                                className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-bg-alt transition-all shadow-sm group"
                            >
                                <ArrowLeft className="w-5 h-5 text-text-secondary group-hover:text-brand-primary transition-colors" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="bg-error/10 text-error border-error/20 text-[9px] font-black tracking-wider px-2 py-0.5">
                                        HERRAMIENTA DE CONTROL
                                    </Badge>
                                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest hidden sm:block">Sync v4.2</span>
                                </div>
                                <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight leading-none">
                                    Reversar Entrada
                                </h1>
                            </div>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <Input
                                placeholder="Buscar entrada..."
                                className="pl-10 h-11 rounded-xl border-none bg-bg-alt/50 focus:bg-white focus:ring-2 focus:ring-error/10 transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-border">
                        <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
                        <p className="text-text-secondary font-medium animate-pulse">Consultando historial de compras...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-border shadow-sm text-center">
                        <div className="w-20 h-20 bg-bg-alt rounded-full flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-text-tertiary opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">No hay entradas para reversar</h3>
                        <p className="text-text-secondary max-w-xs mt-2">Solo se muestran las entradas que han sido marcadas como recibidas recientemente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* List Area */}
                        <div className="lg:col-span-12">
                            <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-bg-alt/50 border-b border-border">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest">Documento</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest">Fecha Recibido</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest">Proveedor</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest">Factura</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest">Sede</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest">Total</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-text-tertiary tracking-widest text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-error/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span className="text-[11px] font-black text-brand-primary bg-brand-primary/5 px-3 py-1.5 rounded-xl border border-brand-primary/10 tracking-widest">#{order.id.slice(0, 6)}</span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-text-tertiary" />
                                                        <span className="text-xs font-bold text-text-primary">{order.receivedDate ? format(new Date(order.receivedDate), 'dd MMM, yyyy', { locale: es }) : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-text-tertiary" />
                                                        <span className="text-xs font-black text-text-primary uppercase truncate max-w-[150px]">{order.supplierName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span className="text-xs font-mono font-bold text-text-secondary">{order.invoiceNumber || '---'}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Badge variant="info" className="text-[9px] font-black">{order.branch?.name}</Badge>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span className="text-sm font-black text-text-primary">${order.totalCifValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="px-4 py-2 h-9 text-[10px] font-black uppercase tracking-widest bg-red-50 text-[#DC2626] border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all rounded-xl"
                                                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                                                    >
                                                        Reversar
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal de Confirmación */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center mb-6">
                                    <AlertTriangle className="w-10 h-10 text-error" />
                                </div>
                                <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">¿Confirmar Reversión?</h2>
                                <p className="text-text-secondary text-sm max-w-sm">
                                    Esta acción descontará el inventario del sistema y marcará la entrada #{selectedOrder.id.slice(0, 6)} como anulada.
                                </p>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="p-6 bg-bg-alt rounded-3xl border border-border">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Factura</p>
                                            <p className="text-sm font-bold text-text-primary font-mono">{selectedOrder.invoiceNumber || 'SIN NUMERO'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Proveedor</p>
                                            <p className="text-sm font-bold text-text-primary uppercase">{selectedOrder.supplierName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Sede de Entrada</p>
                                            <p className="text-sm font-bold text-text-primary">{selectedOrder.branch.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Impacto Total</p>
                                            <p className="text-sm font-black text-error">-${selectedOrder.totalCifValue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-error/5 border border-error/10 rounded-2xl flex items-start gap-4">
                                    <Info className="w-5 h-5 text-error shrink-0 mt-0.5" />
                                    <p className="text-[10px] leading-relaxed text-error font-bold uppercase italic">
                                        Advertencia: El sistema generará movimientos de salida automáticos para cada producto en esta entrada.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="secondary"
                                    className="rounded-xl h-11 font-black uppercase tracking-widest text-[10px] shadow-sm"
                                    onClick={() => setSelectedOrder(null)}
                                >
                                    No, Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    className="rounded-xl h-11 bg-[#DC2626] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#B91C1C] transition-all shadow-lg shadow-red-200/40"
                                    leftIcon={<RotateCcw className="w-4 h-4" />}
                                    isLoading={reversing}
                                    onClick={handleReverse}
                                >
                                    Sí, Reversar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
