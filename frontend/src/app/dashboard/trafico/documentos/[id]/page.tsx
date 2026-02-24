'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    FileText,
    Download,
    Truck,
    Ship,
    ShieldCheck,
    Calendar,
    Hash,
    Activity,
    Package,
    CheckCircle2,
    Printer,
    Globe,
    ExternalLink
} from 'lucide-react';
import {
    Button,
    Input,
    Card,
    Divider,
    Tooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@heroui/react';
import { loadSession } from '@/lib/auth-storage';
import { api, API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

type ShipmentItem = {
    id: string;
    quantity: number;
    tariffCode: string;
    weight: number;
    volume: number;
    product: { description: string };
};

type Shipment = {
    id: string;
    shipmentNumber: string;
    status: string;
    destination: string;
    dmcNumber: string;
    blNumber: string;
    bookingNumber: string;
    containerNumber: string;
    sealNumber: string;
    carrierName: string;
    driverName: string;
    plateNumber: string;
    dispatchDate: string;
    items: ShipmentItem[];
};

export default function TrafficDocsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [formData, setFormData] = useState({
        dmcNumber: '',
        blNumber: '',
        bookingNumber: '',
        containerNumber: '',
        sealNumber: '',
        carrierName: '',
        driverName: '',
        plateNumber: '',
        dispatchDate: ''
    });

    useEffect(() => {
        fetchShipment();
    }, [id]);

    const fetchShipment = async () => {
        const session = loadSession();
        if (!session) return;
        setLoading(true);
        try {
            const data = await api<Shipment>(`/traffic/shipments/${id}`, { accessToken: session.accessToken });
            setShipment(data);
            setFormData({
                dmcNumber: data.dmcNumber || '',
                blNumber: data.blNumber || '',
                bookingNumber: data.bookingNumber || '',
                containerNumber: data.containerNumber || '',
                sealNumber: data.sealNumber || '',
                carrierName: data.carrierName || '',
                driverName: data.driverName || '',
                plateNumber: data.plateNumber || '',
                dispatchDate: data.dispatchDate ? new Date(data.dispatchDate).toISOString().split('T')[0] : ''
            });
        } catch (error) {
            toast.error('Error al cargar envío');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const session = loadSession();
        if (!session) return;
        setSaving(true);
        try {
            // Validation for date
            const payload = {
                ...formData,
                dispatchDate: formData.dispatchDate ? new Date(formData.dispatchDate).toISOString() : undefined
            };

            await api(`/traffic/shipments/${id}/docs`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: payload
            });
            toast.success('Documentos actualizados correctamente');
            fetchShipment();
        } catch (error) {
            toast.error('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async (type: 'dmc' | 'bl' | 'free-sale') => {
        const session = loadSession();
        if (!session) return;

        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/traffic/shipments/${id}/${type}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `${type.toUpperCase()}-${shipment?.shipmentNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error(`Error al generar ${type.toUpperCase()}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando documentos de tráfico...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Top Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/dashboard/trafico')}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-900 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Documentación Logística</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                            Ref: <span className="text-blue-600">{shipment?.shipmentNumber}</span>
                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                            Destino: <span className="text-slate-600">{shipment?.destination}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="flat"
                        radius="lg"
                        startContent={<Package className="w-4 h-4" />}
                        onClick={onOpen}
                        className="font-bold text-slate-600"
                    >
                        Lista de Contenido
                    </Button>
                    <Button
                        color="primary"
                        radius="lg"
                        startContent={<Save className="w-4 h-4" />}
                        onClick={handleSave}
                        isLoading={saving}
                        className="font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Input Form */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Regulatory Docs Section */}
                    <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Documentos de Autoridad</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Información para DGI y Zona Libre</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de DMC</label>
                                <Input
                                    placeholder="Ej: DMC-2026-00123"
                                    value={formData.dmcNumber}
                                    onChange={(e) => setFormData({ ...formData, dmcNumber: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<Hash className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Bill of Lading (BL)</label>
                                <Input
                                    placeholder="Ej: BL-MAE-99881"
                                    value={formData.blNumber}
                                    onChange={(e) => setFormData({ ...formData, blNumber: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<Globe className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Reserva (Booking)</label>
                                <Input
                                    placeholder="Ej: BKG-4512"
                                    value={formData.bookingNumber}
                                    onChange={(e) => setFormData({ ...formData, bookingNumber: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<Activity className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Despacho</label>
                                <Input
                                    type="date"
                                    value={formData.dispatchDate}
                                    onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<Calendar className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logistics Section */}
                    <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Detalles Logísticos</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Control físico del contenedor y transporte</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Contenedor</label>
                                <Input
                                    placeholder="Ej: MSKU 998271 2"
                                    value={formData.containerNumber}
                                    onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<Package className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Precinto (Seal)</label>
                                <Input
                                    placeholder="Ej: SL-00982-A"
                                    value={formData.sealNumber}
                                    onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<ShieldCheck className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transportista / Naviera</label>
                                <Input
                                    placeholder="Ej: MAERSK / LOG CARGO"
                                    value={formData.carrierName}
                                    onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                                    variant="bordered"
                                    radius="lg"
                                    size="lg"
                                    startContent={<Ship className="w-4 h-4 text-slate-300" />}
                                    classNames={{ input: "font-black" }}
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chofer</label>
                                        <Input
                                            placeholder="Nombre"
                                            value={formData.driverName}
                                            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                            variant="bordered"
                                            radius="lg"
                                            size="lg"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa</label>
                                        <Input
                                            placeholder="Placa"
                                            value={formData.plateNumber}
                                            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                            variant="bordered"
                                            radius="lg"
                                            size="lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: PDF Downloads */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl shadow-slate-900/40 space-y-8 sticky top-32">
                        <div className="text-center space-y-2">
                            <Printer className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-xl font-black uppercase tracking-tighter">Centro de Impresión</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Documentos Generados por Evolution</p>
                        </div>

                        <div className="space-y-4">
                            <Button
                                fullWidth
                                size="lg"
                                color="primary"
                                radius="lg"
                                startContent={<Download className="w-5 h-5" />}
                                onClick={() => handleDownload('dmc')}
                                className="font-black uppercase tracking-widest h-16 shadow-xl shadow-blue-500/30"
                            >
                                Imprimir DMC
                            </Button>
                            <Button
                                fullWidth
                                size="lg"
                                variant="bordered"
                                radius="lg"
                                startContent={<Download className="w-5 h-5" />}
                                onClick={() => handleDownload('bl')}
                                className="font-black uppercase tracking-widest h-16 border-slate-700 text-white hover:bg-slate-800"
                            >
                                Imprimir BL
                            </Button>
                            <Button
                                fullWidth
                                size="lg"
                                variant="flat"
                                radius="lg"
                                startContent={<Printer className="w-5 h-5" />}
                                onClick={() => handleDownload('free-sale')}
                                className="font-black uppercase tracking-widest h-16 bg-slate-800 text-slate-300"
                            >
                                Cert. Libre Venta
                            </Button>
                        </div>

                        <Divider className="bg-slate-800" />

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest uppercase">Campos DMC Completos</p>
                            </div>
                            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400 flex items-start gap-3">
                                <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold uppercase leading-relaxed">Nota: Los PDFs se generan automáticamente agrupados por partida arancelaria.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="4xl"
                radius="lg"
                backdrop="blur"
            >
                <ModalContent className="font-sans">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 px-8 pt-8">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Contenido del Envío</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consolidado de productos para exportación</p>
                            </ModalHeader>
                            <ModalBody className="px-8 py-6">
                                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Partida</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Descripción</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Cant</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Peso/Vol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {shipment?.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{item.tariffCode}</td>
                                                    <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">{item.product.description}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-900 text-center">{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-[10px] font-black text-slate-900">{item.weight} KG</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{item.volume} m³</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ModalBody>
                            <ModalFooter className="px-8 pb-8">
                                <Button variant="light" onPress={onClose} className="font-bold text-slate-500 uppercase tracking-widest">Cerrar</Button>
                                <Button color="primary" variant="flat" onPress={onClose} className="font-black uppercase tracking-widest">Exportar Excel</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
