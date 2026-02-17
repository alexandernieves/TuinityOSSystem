'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    FileText,
    Download,
    Printer,
    Ship,
    Package,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import {
    Button,
    ButtonGroup,
    Card,
    CardBody,
    Chip,
    Tabs,
    Tab,
    Divider
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function ShipmentDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [shipment, setShipment] = useState<any>(null);
    const [packingList, setPackingList] = useState<any>(null);
    const [dmc, setDmc] = useState<any>(null);
    const [bl, setBl] = useState<any>(null);
    const [freeSale, setFreeSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('packing');

    useEffect(() => {
        if (id) {
            fetchShipment();
            fetchDocuments();
        }
    }, [id]);

    const fetchShipment = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            const data = await api(`/traffic/shipments/${id}`, {
                accessToken: session.accessToken
            });
            setShipment(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar el envío');
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            // Fetch all documents in parallel
            const [packingData, dmcData, blData, freeSaleData] = await Promise.all([
                api(`/traffic/shipments/${id}/packing-list`, { accessToken: session.accessToken }).catch(() => null),
                api(`/traffic/shipments/${id}/dmc`, { accessToken: session.accessToken }).catch(() => null),
                api(`/traffic/shipments/${id}/bl`, { accessToken: session.accessToken }).catch(() => null),
                api(`/traffic/shipments/${id}/free-sale`, { accessToken: session.accessToken }).catch(() => null)
            ]);

            setPackingList(packingData);
            setDmc(dmcData);
            setBl(blData);
            setFreeSale(freeSaleData);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <Ship className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Cargando documentos...</p>
                </div>
            </div>
        );
    }

    if (!shipment) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-slate-700 font-medium">Envío no encontrado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-4 print:hidden">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
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
                                    Envío #{shipment.shipmentNumber}
                                </h1>
                                <Chip
                                    color={shipment.status === 'DISPATCHED' ? 'success' : 'warning'}
                                    variant="flat"
                                    size="sm"
                                    className="font-bold uppercase"
                                >
                                    {shipment.status === 'DISPATCHED' ? 'DESPACHADO' : 'PENDIENTE'}
                                </Chip>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {shipment.sale?.customer?.name} • {shipment.destination || 'Destino no especificado'}
                            </p>
                        </div>
                    </div>

                    <Button
                        color="primary"
                        radius="lg"
                        startContent={<Printer className="w-4 h-4" />}
                        onClick={handlePrint}
                        className="font-black uppercase tracking-widest"
                    >
                        Imprimir
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
                {/* Shipment Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                            <p className="text-sm font-bold text-slate-900">{shipment.sale?.customer?.name}</p>
                        </CardBody>
                    </Card>
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destino</p>
                            <p className="text-sm font-bold text-slate-900">{shipment.destination || 'N/A'}</p>
                        </CardBody>
                    </Card>
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peso Total</p>
                            <p className="text-sm font-bold text-slate-900">{Number(shipment.totalWeight || 0).toFixed(2)} kg</p>
                        </CardBody>
                    </Card>
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Items</p>
                            <p className="text-sm font-bold text-slate-900">{shipment.items?.length || 0} productos</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Documents Tabs */}
                <Card className="border-none shadow-sm">
                    <CardBody className="p-6">
                        <Tabs
                            aria-label="Documents"
                            selectedKey={activeTab}
                            onSelectionChange={(key) => setActiveTab(key as string)}
                            classNames={{
                                tabList: "gap-6 print:hidden",
                                cursor: "bg-blue-600",
                                tab: "max-w-fit px-4 h-10",
                                tabContent: "group-data-[selected=true]:text-blue-600 font-bold uppercase text-xs tracking-widest"
                            }}
                        >
                            <Tab key="tracking" title="Seguimiento">
                                <TrackingTab shipment={shipment} onUpdate={fetchShipment} />
                            </Tab>
                            <Tab key="events" title="Hitos Logísticos">
                                <EventsTab shipment={shipment} onUpdate={fetchShipment} />
                            </Tab>
                            <Tab key="packing" title="Packing List">
                                <PackingListView data={packingList} shipment={shipment} />
                            </Tab>
                            <Tab key="dmc" title="DMC">
                                <DmcView data={dmc} shipment={shipment} />
                            </Tab>
                            <Tab key="bl" title="Bill of Lading">
                                <BlView data={bl} shipment={shipment} />
                            </Tab>
                            <Tab key="certificate" title="Certificado Libre Venta">
                                <FreeSaleView data={freeSale} shipment={shipment} />
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

import {
    MapPin,
    Calendar,
    Anchor,
    Box,
    History,
    Save
} from 'lucide-react';
import { Input as HeroInput, Select as HeroSelect, SelectItem as HeroSelectItem } from '@heroui/react';

function TrackingTab({ shipment, onUpdate }: any) {
    const [edit, setEdit] = useState(false);
    const [form, setForm] = useState(shipment);

    const handleSave = async () => {
        const session = loadSession();
        if (!session) return;
        try {
            await api(`/traffic/shipments/${shipment.id}/docs`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: form
            });
            toast.success('Seguimiento actualizado');
            setEdit(false);
            onUpdate();
        } catch (e) {
            toast.error('Error al actualizar');
        }
    };

    return (
        <div className="space-y-8 mt-6">
            <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-blue-600" />
                    Información de Tránsito Marítimo
                </h3>
                <Button size="sm" variant="flat" color={edit ? 'success' : 'primary'} onClick={() => edit ? handleSave() : setEdit(true)}>
                    {edit ? 'Guardar Cambios' : 'Editar Seguimiento'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HeroInput label="Barco / Buque" value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })} isDisabled={!edit} />
                <HeroInput label="Viaje #" value={form.voyageNumber} onChange={(e) => setForm({ ...form, voyageNumber: e.target.value })} isDisabled={!edit} />
                <HeroInput label="Naviera" value={form.carrierName} onChange={(e) => setForm({ ...form, carrierName: e.target.value })} isDisabled={!edit} />

                <HeroInput label="Puerto Salida (POL)" value={form.portOfLoading} onChange={(e) => setForm({ ...form, portOfLoading: e.target.value })} isDisabled={!edit} />
                <HeroInput label="Puerto Llegada (POD)" value={form.portOfDischarge} onChange={(e) => setForm({ ...form, portOfDischarge: e.target.value })} isDisabled={!edit} />
                <HeroInput label="Reserva (Booking)" value={form.bookingNumber} onChange={(e) => setForm({ ...form, bookingNumber: e.target.value })} isDisabled={!edit} />

                <HeroInput label="ETD (Salida Est.)" type="date" value={form.etd?.split('T')[0]} onChange={(e) => setForm({ ...form, etd: e.target.value })} isDisabled={!edit} />
                <HeroInput label="ETA (Llegada Est.)" type="date" value={form.eta?.split('T')[0]} onChange={(e) => setForm({ ...form, eta: e.target.value })} isDisabled={!edit} />
                <HeroInput label="Llegada Real" type="date" value={form.actualArrival?.split('T')[0]} onChange={(e) => setForm({ ...form, actualArrival: e.target.value })} isDisabled={!edit} />
            </div>

            <Divider />

            <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-600" />
                Detalles del Contenedor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <HeroInput label="Contenedor #" value={form.containerNumber} onChange={(e) => setForm({ ...form, containerNumber: e.target.value })} isDisabled={!edit} />
                <HeroInput label="Sello #" value={form.sealNumber} onChange={(e) => setForm({ ...form, sealNumber: e.target.value })} isDisabled={!edit} />
                <HeroSelect label="Tipo Contenedor" selectedKeys={[form.containerType]} onSelectionChange={(keys) => setForm({ ...form, containerType: Array.from(keys)[0] })} isDisabled={!edit}>
                    <HeroSelectItem key="20GP">20' General Purpose</HeroSelectItem>
                    <HeroSelectItem key="40HC">40' High Cube</HeroSelectItem>
                    <HeroSelectItem key="40RF">40' Reefer</HeroSelectItem>
                </HeroSelect>
                <HeroSelect label="Tamaño" selectedKeys={[form.containerSize]} onSelectionChange={(keys) => setForm({ ...form, containerSize: Array.from(keys)[0] })} isDisabled={!edit}>
                    <HeroSelectItem key="20FT">20 Pies</HeroSelectItem>
                    <HeroSelectItem key="40FT">40 Pies</HeroSelectItem>
                </HeroSelect>
            </div>
        </div>
    );
}

function EventsTab({ shipment, onUpdate }: any) {
    const [desc, setDesc] = useState('');
    const [status, setStatus] = useState('IN_TRANSIT');

    const handleAddEvent = async () => {
        const session = loadSession();
        if (!session) return;
        try {
            await api(`/traffic/shipments/${shipment.id}/events`, {
                method: 'POST',
                accessToken: session.accessToken,
                body: { status, description: desc }
            });
            // Also update main status if changed? Manual status update is better
            toast.success('Hito registrado');
            setDesc('');
            onUpdate();
        } catch (e) {
            toast.error('Error al registrar');
        }
    };

    const updateShipmentStatus = async (newStatus: string) => {
        const session = loadSession();
        if (!session) return;
        try {
            await api(`/traffic/shipments/${shipment.id}/status`, {
                method: 'PATCH',
                accessToken: session.accessToken,
                body: { status: newStatus }
            });
            toast.success('Estado del envío actualizado');
            onUpdate();
        } catch (e) {
            toast.error('Error al actualizar estado');
        }
    };

    return (
        <div className="space-y-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Event Form */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-none shadow-sm bg-blue-50">
                        <CardBody className="p-6 space-y-4">
                            <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Actualizar Estado / Hito</h4>

                            <HeroSelect label="Nuevo Estado" selectedKeys={[status]} onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as string)}>
                                <HeroSelectItem key="IN_TRANSIT">En Altamar</HeroSelectItem>
                                <HeroSelectItem key="ARRIVED">Arribado a Puerto</HeroSelectItem>
                                <HeroSelectItem key="CLEARED">Liberado Aduana</HeroSelectItem>
                                <HeroSelectItem key="DELIVERED">Entregado</HeroSelectItem>
                            </HeroSelect>

                            <HeroInput label="Ubicación / Detalle" value={desc} onChange={(e) => setDesc(e.target.value)} />

                            <ButtonGroup fullWidth>
                                <Button color="primary" className="font-bold" onClick={handleAddEvent}>Log Evento</Button>
                                <Button color="secondary" variant="flat" className="font-bold" onClick={() => updateShipmentStatus(status)}>Cambiar Estado</Button>
                            </ButtonGroup>
                        </CardBody>
                    </Card>
                </div>

                {/* Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                        <History className="w-5 h-5 text-slate-400" />
                        Historial Logístico
                    </h3>

                    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                        {shipment.events?.length === 0 && (
                            <p className="text-slate-400 text-sm italic italic">No hay eventos registrados.</p>
                        )}
                        {shipment.events?.map((ev: any) => (
                            <div key={ev.id} className="relative">
                                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-white border-4 border-blue-500 z-10" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Chip size="sm" color="primary" variant="flat" className="font-black text-[10px] uppercase">{ev.status}</Chip>
                                        <span className="text-xs font-bold text-slate-400">{new Date(ev.eventDate).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700">{ev.description || 'Sin descripción'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Registrado por: {ev.createdBy || 'Sistema'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Packing List Component
function PackingListView({ data, shipment }: any) {
    if (!data) {
        return <div className="p-8 text-center text-slate-500">No hay datos disponibles</div>;
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Packing List</h2>
                <p className="text-sm text-slate-500 mt-1">Envío #{data.shipmentNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Consignee</p>
                    <p className="font-bold text-slate-900">{data.consignee}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Destination</p>
                    <p className="font-bold text-slate-900">{data.destination}</p>
                </div>
            </div>

            <Divider />

            <div className="space-y-6">
                <h3 className="font-black text-slate-700 uppercase text-sm">Items Agrupados por Código Arancelario</h3>
                {Object.entries(data.groupedItems || {}).map(([tariffCode, items]: [string, any]) => (
                    <div key={tariffCode} className="border border-slate-200 rounded-lg p-4">
                        <div className="bg-slate-50 -m-4 p-3 rounded-t-lg mb-4">
                            <p className="font-black text-slate-900 text-sm">
                                Código Arancelario: <span className="text-blue-600">{tariffCode}</span>
                            </p>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 font-bold text-slate-600 uppercase text-xs">Descripción</th>
                                    <th className="text-right py-2 font-bold text-slate-600 uppercase text-xs">Cantidad</th>
                                    <th className="text-right py-2 font-bold text-slate-600 uppercase text-xs">Peso (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="py-2 text-slate-700">{item.description}</td>
                                        <td className="py-2 text-right font-medium text-slate-900">{item.quantity}</td>
                                        <td className="py-2 text-right font-medium text-slate-900">{Number(item.weight).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            <Divider />

            <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 uppercase">Peso Total:</span>
                <span className="text-slate-900">{Number(data.totalWeight).toFixed(2)} kg</span>
            </div>
        </div>
    );
}

// DMC Component
function DmcView({ data, shipment }: any) {
    if (!data) {
        return <div className="p-8 text-center text-slate-500">No hay datos disponibles</div>;
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Declaración de Mercancías de Colón (DMC)</h2>
                <p className="text-sm text-slate-500 mt-1">Envío #{data.shipmentNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Exportador</p>
                    <p className="font-bold text-slate-900">{data.exporter}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Consignatario</p>
                    <p className="font-bold text-slate-900">{data.consignee}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">País de Destino</p>
                    <p className="font-bold text-slate-900">{data.destinationCountry}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Valor FOB Total</p>
                    <p className="font-bold text-slate-900">${Number(data.totalFobValue || 0).toFixed(2)}</p>
                </div>
            </div>

            <Divider />

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b-2 border-slate-300">
                        <th className="text-left py-3 font-bold text-slate-700 uppercase text-xs">Código Arancelario</th>
                        <th className="text-left py-3 font-bold text-slate-700 uppercase text-xs">Descripción</th>
                        <th className="text-right py-3 font-bold text-slate-700 uppercase text-xs">Cantidad</th>
                        <th className="text-right py-3 font-bold text-slate-700 uppercase text-xs">Peso (kg)</th>
                        <th className="text-right py-3 font-bold text-slate-700 uppercase text-xs">Valor FOB</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100">
                            <td className="py-3 font-mono text-blue-600">{item.tariffCode}</td>
                            <td className="py-3 text-slate-700">{item.description}</td>
                            <td className="py-3 text-right font-medium text-slate-900">{item.quantity}</td>
                            <td className="py-3 text-right font-medium text-slate-900">{Number(item.weight).toFixed(2)}</td>
                            <td className="py-3 text-right font-medium text-slate-900">${Number(item.fobValue || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold">
                        <td colSpan={3} className="py-3 text-right text-slate-700 uppercase text-xs">Total:</td>
                        <td className="py-3 text-right text-slate-900">{Number(data.totalWeight).toFixed(2)} kg</td>
                        <td className="py-3 text-right text-slate-900">${Number(data.totalFobValue || 0).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

// Bill of Lading Component
function BlView({ data, shipment }: any) {
    if (!data) {
        return <div className="p-8 text-center text-slate-500">No hay datos disponibles</div>;
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Bill of Lading</h2>
                <p className="text-sm text-slate-500 mt-1">B/L #{data.blNumber || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Shipper</p>
                    <p className="font-bold text-slate-900">{data.shipper}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Consignee</p>
                    <p className="font-bold text-slate-900">{data.consignee}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Port of Loading</p>
                    <p className="font-bold text-slate-900">{data.portOfLoading || 'Colón, Panama'}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Port of Discharge</p>
                    <p className="font-bold text-slate-900">{data.portOfDischarge || shipment.destination}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Total Packages</p>
                    <p className="font-bold text-slate-900">{data.totalPackages || shipment.items?.length || 0}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Gross Weight</p>
                    <p className="font-bold text-slate-900">{Number(data.grossWeight || shipment.totalWeight).toFixed(2)} kg</p>
                </div>
            </div>

            <Divider />

            <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-400 font-bold uppercase text-xs mb-2">Description of Goods</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{data.description || 'General merchandise as per packing list'}</p>
            </div>
        </div>
    );
}

// Free Sale Certificate Component
function FreeSaleView({ data, shipment }: any) {
    if (!data) {
        return <div className="p-8 text-center text-slate-500">No hay datos disponibles</div>;
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Certificado de Libre Venta</h2>
                <p className="text-sm text-slate-500 mt-1">Certificate of Free Sale</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium">
                    This is to certify that the products listed below are freely sold and distributed in the Republic of Panama
                    and are fit for human consumption in accordance with Panamanian regulations.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm mb-6">
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Exporter</p>
                    <p className="font-bold text-slate-900">{data.exporter}</p>
                </div>
                <div>
                    <p className="text-slate-400 font-bold uppercase text-xs mb-1">Destination Country</p>
                    <p className="font-bold text-slate-900">{data.destinationCountry}</p>
                </div>
            </div>

            <Divider />

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b-2 border-slate-300">
                        <th className="text-left py-3 font-bold text-slate-700 uppercase text-xs">Product Description</th>
                        <th className="text-left py-3 font-bold text-slate-700 uppercase text-xs">Brand</th>
                        <th className="text-right py-3 font-bold text-slate-700 uppercase text-xs">Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {data.products?.map((product: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100">
                            <td className="py-3 text-slate-700">{product.description}</td>
                            <td className="py-3 text-slate-700">{product.brand || 'N/A'}</td>
                            <td className="py-3 text-right font-medium text-slate-900">{product.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                    Issued by: Evolution Zona Libre • Date: {new Date().toLocaleDateString()} • Valid for export purposes
                </p>
            </div>
        </div>
    );
}
