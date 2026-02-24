
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Barcode,
    Search,
    CheckCircle2,
    Save,
    ArrowLeft,
    AlertTriangle,
    Package
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Input } from '@/components/ui/Input';
import clsx from 'clsx';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@heroui/react";

type InventoryCountItem = {
    id: string;
    productId: string;
    expectedQuantity: number;
    countedQuantity: number;
    variance: number;
    product: {
        description: string;
        internalReference?: string;
        barcodes: { barcode: string }[];
    };
    updatedAt: string;
};

type InventoryCount = {
    id: string;
    description: string;
    status: string;
    branch: { name: string };
    items: InventoryCountItem[];
};

export default function InventoryCountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [count, setCount] = useState<InventoryCount | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanInput, setScanInput] = useState('');
    const [lastScanned, setLastScanned] = useState<InventoryCountItem | null>(null);
    const [processing, setProcessing] = useState(false);

    // Finalize Modal
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [finalizing, setFinalizing] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCount();
        // Auto-focus logic
        const interval = setInterval(() => {
            if (!processing && !isOpen && document.activeElement !== inputRef.current) {
                inputRef.current?.focus();
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const fetchCount = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;
        try {
            const data = await api<InventoryCount>(`/inventory-counts/${id}`, { accessToken: session.accessToken });
            setCount(data);
        } catch (e) {
            toast.error('Error al cargar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && scanInput.trim()) {
            e.preventDefault();
            await processItem(scanInput.trim());
        }
    };

    const processItem = async (identifier: string) => {
        const session = loadSession();
        if (!session?.accessToken) return;

        setProcessing(true);
        // Optimistic update handled by toast? No, wait for server.
        const toastId = toast.loading('Procesando...');

        try {
            const updatedItem = await api<InventoryCountItem>(`/inventory-counts/${id}/items`, {
                method: 'POST',
                accessToken: session.accessToken,
                body: { productId: identifier, quantity: 1, mode: 'SCAN' } // identifying by 'identifier' but field is named productId in DTO currently? 
                // Wait, Controller calls addItem(..., itemDto.productId). Service expects 'identifier'. 
                // So I pass identifier in 'productId' field. Ideally rename DTO field but this works.
            });

            toast.dismiss(toastId);
            toast.success(`${updatedItem.product.description}`, { description: '+1 Unidad Agregada' });

            setScanInput('');
            setLastScanned(updatedItem);

            // Refresh table locally or fetch?
            // For now fetch full count to keep sync simple
            await fetchCount();

        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error('Error', { description: err.message || 'Producto no encontrado' });
            setScanInput(''); // Clear even on error so they can try next
        } finally {
            setProcessing(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleFinalize = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        setFinalizing(true);
        try {
            await api(`/inventory-counts/${id}/finalize`, {
                method: 'POST',
                accessToken: session.accessToken
            });
            toast.success('Inventario Ajustado Correctamente');
            onOpenChange(); // close modal
            router.push('/dashboard/inventario/conteo');
        } catch (e) {
            toast.error('Error al finalizar');
        } finally {
            setFinalizing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando sesión...</div>;
    if (!count) return <div className="p-8 text-center text-red-500">Sesión no encontrada</div>;

    const totalCounted = count.items.reduce((acc, item) => acc + item.countedQuantity, 0);
    const totalVariance = count.items.reduce((acc, item) => acc + item.variance, 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{count.description}</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{count.branch.name}</span>
                            <span>•</span>
                            <span className={clsx(
                                "font-bold",
                                count.status === 'COMPLETED' ? "text-green-600" : "text-blue-600"
                            )}>{count.status}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-500 uppercase font-bold">Total Contado</div>
                        <div className="text-2xl font-black text-slate-800">{totalCounted}</div>
                    </div>
                    {count.status !== 'COMPLETED' && (
                        <Button color="success" onClick={onOpen}>
                            Finalizar Conteo
                        </Button>
                    )}
                </div>
            </div>

            {/* Scanning Area */}
            {count.status !== 'COMPLETED' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className={clsx("border-2 transition-colors", processing ? "border-amber-400" : "border-blue-500")}>
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <label className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                                    <Barcode className="w-5 h-5" />
                                    Zona de Escaneo
                                </label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        onKeyDown={handleScan}
                                        disabled={processing}
                                        className="w-full text-3xl font-mono p-4 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Escanea Aquí..."
                                        autoComplete="off"
                                    />
                                    {processing && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 text-center">
                                    Presiona Enter si usas teclado manual. El scanner lo hace automático.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Last Scanned Display */}
                    <Card className={clsx("border-l-4", lastScanned ? "border-l-green-500" : "border-l-slate-200")}>
                        <CardContent className="p-6 h-full flex items-center justify-center">
                            {lastScanned ? (
                                <div className="text-center w-full">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-3">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{lastScanned.product.description}</h3>
                                    <p className="text-slate-500 font-mono text-sm mb-2">{lastScanned.product.barcodes[0]?.barcode || 'SIN CODIGO'}</p>
                                    <div className="inline-block bg-slate-100 px-3 py-1 rounded text-2xl font-black text-slate-800">
                                        {lastScanned.countedQuantity} <span className="text-xs font-normal text-slate-400">Total</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-300">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Esperando primer producto...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Inventory Table */}
            <Card>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Progreso de la Sesión</h3>
                    <div className="text-sm font-mono text-slate-500">
                        {count.items.length} productos escaneados
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium">Producto</th>
                                <th className="px-6 py-3 text-left font-medium">Referencia / EAN</th>
                                <th className="px-6 py-3 text-right font-medium">Sistema</th>
                                <th className="px-6 py-3 text-right font-medium">Conteo</th>
                                <th className="px-6 py-3 text-right font-medium">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {count.items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-slate-700">
                                        {item.product.description}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-slate-500">
                                        {item.product.internalReference || item.product.barcodes[0]?.barcode || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right text-slate-400">
                                        {item.expectedQuantity}
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-800 bg-blue-50/50">
                                        {item.countedQuantity}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <Badge variant={item.variance === 0 ? "success" : item.variance > 0 ? "info" : "error"}>
                                            {item.variance > 0 ? `+${item.variance}` : item.variance}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Finalize Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
                <ModalContent>
                    <ModalHeader>Confirmar Ajuste de Inventario</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold mb-1">¿Está seguro de finalizar?</p>
                                    <p>Esta acción creará <strong>ajustes de inventario permanentes</strong> para igualar el sistema con su conteo físico.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="text-xs text-slate-500 uppercase">Variación Total</div>
                                    <div className={clsx("text-xl font-black", totalVariance < 0 ? "text-red-500" : "text-green-500")}>
                                        {totalVariance > 0 ? `+${totalVariance}` : totalVariance}
                                    </div>
                                    <div className="text-xs text-slate-400">Unidades</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                    <div className="text-xs text-slate-500 uppercase">Productos Afectados</div>
                                    <div className="text-xl font-black text-slate-800">
                                        {count.items.filter(i => i.variance !== 0).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={() => onOpenChange()}>Cancelar</Button>
                        <Button
                            color="danger"
                            isLoading={finalizing}
                            onClick={handleFinalize}
                        >
                            Confirmar y Ajustar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
