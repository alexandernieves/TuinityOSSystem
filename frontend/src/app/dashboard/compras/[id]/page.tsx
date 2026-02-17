'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle2,
    Package,
    AlertTriangle,
    FileText,
    TrendingUp,
    Truck,
    Info,
    History
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    Chip,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Divider,
    Tabs,
    Tab,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function PurchaseDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [purchase, setPurchase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure();
    const [receiving, setReceiving] = useState(false);

    useEffect(() => {
        if (id) fetchPurchase();
    }, [id]);

    const fetchPurchase = async () => {
        const session = loadSession();
        if (!session) return;
        try {
            const data = await api(`/purchases/${id}`, { accessToken: session.accessToken });
            setPurchase(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar la orden de compra');
        } finally {
            setLoading(false);
        }
    };
    // State for receiving items
    const [receiveItems, setReceiveItems] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (purchase) {
            // Initialize with remaining quantities
            const initial: any = {};
            purchase.items.forEach((item: any) => {
                const remaining = Number(item.quantity) - Number(item.receivedQuantity || 0);
                if (remaining > 0) {
                    initial[item.productId] = remaining;
                }
            });
            setReceiveItems(initial);
        }
    }, [purchase, isOpen]);

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando detalles de la orden...</div>;
    if (!purchase) return <div className="p-8 text-center text-red-500">Orden no encontrada</div>;

    const handleReceive = async () => {
        setReceiving(true);
        const session = loadSession();
        if (!session) return;

        try {
            // Filter out items with 0 quantity to receive
            const itemsToReceive = Object.entries(receiveItems)
                .filter(([_, qty]) => qty > 0)
                .map(([productId, qty]) => ({
                    productId,
                    quantity: qty
                }));

            if (itemsToReceive.length === 0) {
                toast.error('Debes ingresar al menos una cantidad a recibir');
                setReceiving(false);
                return;
            }

            const payload = {
                receivedDate: new Date().toISOString(),
                items: itemsToReceive
            };

            await api(`/purchases/${id}/receive`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: payload
            });

            toast.success('Entrada de mercancía registrada exitosamente.');
            fetchPurchase();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al recibir mercancía');
        } finally {
            setReceiving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando detalles de la orden...</div>;
    if (!purchase) return <div className="p-8 text-center text-red-500">Orden no encontrada</div>;

    const isFullyReceived = purchase.status === 'RECEIVED';
    const isPartial = purchase.status === 'PARTIAL';

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                Orden {purchase.invoiceNumber}
                            </h1>
                            <Chip
                                color={isFullyReceived ? "success" : isPartial ? "warning" : "default"}
                                variant="flat"
                                size="sm"
                                className="font-bold uppercase"
                            >
                                {purchase.status === 'DRAFT' ? 'BORRADOR' :
                                    purchase.status === 'OPEN' ? 'ABIERTA' :
                                        purchase.status === 'PARTIAL' ? 'PARCIAL' :
                                            'RECIBIDA'}
                            </Chip>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {purchase.supplierName} • {new Date(purchase.orderDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {!isFullyReceived && (
                    <Button
                        color="primary"
                        radius="lg"
                        startContent={<Package className="w-4 h-4" />}
                        onPress={onOpen}
                        className="font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        Recibir Mercancía
                    </Button>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4 flex flex-row items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor FOB Total</p>
                                <p className="text-xl font-black text-slate-900">${Number(purchase.fobValue).toLocaleString()}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4 flex flex-row items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gastos Importación</p>
                                <p className="text-xl font-black text-slate-900">
                                    ${(Number(purchase.freightCost) + Number(purchase.insuranceCost) + Number(purchase.otherCosts)).toLocaleString()}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4 flex flex-row items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Costo CIF Total</p>
                                <p className="text-xl font-black text-slate-900">${Number(purchase.totalCifValue).toLocaleString()}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4 flex flex-row items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items / Recibidos</p>
                                <p className="text-xl font-black text-slate-900">
                                    {purchase.items.length} <span className="text-slate-400 text-sm font-medium">lines</span>
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Items Table */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-0">
                        <Table aria-label="Purchase items table" removeWrapper shadow="none">
                            <TableHeader>
                                <TableColumn>PRODUCTO</TableColumn>
                                <TableColumn>CANTIDAD</TableColumn>
                                <TableColumn>RECIBIDO</TableColumn>
                                <TableColumn>COSTO FOB</TableColumn>
                                <TableColumn>COSTO CIF (REAL)</TableColumn>
                                <TableColumn>ESTADO</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {purchase.items.map((item: any) => {
                                    const received = Number(item.receivedQuantity || 0);
                                    const total = Number(item.quantity);
                                    const percent = (received / total) * 100;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-bold text-slate-700">{item.product.description}</div>
                                            </TableCell>
                                            <TableCell>{total}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={received < total ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                                                        {received}
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${received < total ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>${Number(item.unitFobValue).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block text-xs">
                                                    ${Number(item.unitCifValue).toFixed(2)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {received >= total ? (
                                                    <Chip size="sm" color="success" variant="flat" className="text-[10px] font-bold">COMPLETO</Chip>
                                                ) : received > 0 ? (
                                                    <Chip size="sm" color="warning" variant="flat" className="text-[10px] font-bold">PARCIAL</Chip>
                                                ) : (
                                                    <Chip size="sm" color="default" variant="flat" className="text-[10px] font-bold">PENDIENTE</Chip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Audit Logs */}
                {purchase.auditLogs && purchase.auditLogs.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History className="w-4 h-4" /> Historial de Movimientos
                        </h3>
                        <div className="space-y-2">
                            {purchase.auditLogs.map((log: any) => (
                                <div key={log.id} className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100 flex justify-between">
                                    <span className="font-medium text-slate-700">{log.action}</span>
                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Receive Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <span className="uppercase tracking-widest text-sm font-black text-slate-500">Recepción de Mercancía</span>
                                <span className="text-xl font-bold text-slate-900">Ingresar Stock Físico</span>
                            </ModalHeader>
                            <ModalBody>
                                <div className="p-4 bg-blue-50 rounded-xl text-blue-700 text-sm flex gap-3 items-start mb-4">
                                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>
                                        Ingresa la cantidad <strong>real</strong> que estás recibiendo. El inventario se actualizará y los costos (PMP) se recalcularán automáticamente.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {purchase.items.filter((i: any) => (Number(i.quantity) - Number(i.receivedQuantity || 0)) > 0).map((item: any) => {
                                        const remaining = Number(item.quantity) - Number(item.receivedQuantity || 0);
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors bg-white">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800 text-sm">{item.product.description}</p>
                                                    <p className="text-xs text-slate-400">
                                                        Pendiente: <strong className="text-slate-600">{remaining}</strong> / Total: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right mr-2">
                                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">A Recibir</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={remaining}
                                                        className="w-24 p-2 border border-slate-200 rounded-lg font-bold text-center text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={receiveItems[item.productId] ?? 0}
                                                        onChange={(e) => {
                                                            const val = Math.min(Number(e.target.value), remaining);
                                                            setReceiveItems(prev => ({ ...prev, [item.productId]: val }));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {purchase.items.every((i: any) => (Number(i.quantity) - Number(i.receivedQuantity || 0)) <= 0) && (
                                        <div className="text-center py-8 text-slate-400">
                                            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-200" />
                                            <p>Orden completada. No hay items pendientes.</p>
                                        </div>
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleReceive}
                                    isLoading={receiving}
                                    startContent={<Package className="w-4 h-4" />}
                                    className="font-bold"
                                    isDisabled={purchase.items.every((i: any) => (Number(i.quantity) - Number(i.receivedQuantity || 0)) <= 0)}
                                >
                                    Confirmar Entrada
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
