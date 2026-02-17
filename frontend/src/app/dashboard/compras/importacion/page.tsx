'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Upload,
    FileSpreadsheet,
    Calculator,
    Save,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import {
    Button,
    Card,
    CardBody,
    Input,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Divider,
    Tabs,
    Tab
} from '@heroui/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';

export default function ImportAssistantPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Costs, 3: Review
    const [items, setItems] = useState<any[]>([]);

    // Financials
    const [costs, setCosts] = useState({
        fobTotal: 0,
        freight: 0,
        insurance: 0,
        other: 0,
        cifTotal: 0
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setUploading(true);

            const formData = new FormData();
            formData.append('file', selectedFile);

            const session = loadSession();
            if (!session) return;

            try {
                // Real API Call
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/purchases/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Upload failed:', response.status, response.statusText, errorData);
                    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.status === 'success' || data.items) {
                    const loadedItems = data.items.map((i: any) => ({
                        productId: i.productId,
                        description: i.description,
                        quantity: i.quantity,
                        fobUnit: i.unitFobValue,
                        fobTotal: i.quantity * i.unitFobValue
                    }));

                    setItems(loadedItems);
                    const totalFob = loadedItems.reduce((acc: number, curr: any) => acc + curr.fobTotal, 0);
                    setCosts(prev => ({ ...prev, fobTotal: totalFob }));

                    setStep(2);
                    toast.success('Archivo procesado correctamente');
                } else {
                    toast.error('Formato de archivo inválido');
                }
            } catch (err) {
                console.error(err);
                toast.error('Error al procesar el archivo');
            } finally {
                setUploading(false);
            }
        }
    };

    const calculateCif = () => {
        const totalExpenses = Number(costs.freight) + Number(costs.insurance) + Number(costs.other);
        const newCifTotal = costs.fobTotal + totalExpenses;

        setCosts(prev => ({
            ...prev,
            cifTotal: newCifTotal
        }));

        // Distribute costs (Prorate)
        const updatedItems = items.map(item => {
            const proportion = item.fobTotal / costs.fobTotal;
            const itemExpenses = totalExpenses * proportion;
            const itemCifTotal = item.fobTotal + itemExpenses;
            const itemCifUnit = itemCifTotal / item.quantity;

            return {
                ...item,
                cifUnit: itemCifUnit,
                cifTotal: itemCifTotal
            };
        });

        setItems(updatedItems);
        toast.success('Costos CIF calculados y distribuidos');
    };

    const handleFinalize = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            const payload = {
                branchId: 'BZR', // Hardcoded for now, ideal: Selector
                supplierName: 'PROVEEDOR IMPORTACION', // Ideal: Input or from Excel metadata?
                invoiceNumber: `INV-${Date.now()}`, // Ideal: Input
                fobValue: costs.fobTotal,
                freightCost: costs.freight,
                insuranceCost: costs.insurance,
                otherCosts: costs.other,
                dutiesCost: 0,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitFobValue: item.fobUnit
                }))
            };

            await api('/purchases', {
                method: 'POST',
                accessToken: session.accessToken,
                body: payload
            });

            toast.success('Orden de Compra creada exitosamente');
            router.push('/dashboard/compras');
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar la orden');
        }
    };

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
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Asistente de Importación</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                            Paso <span className="text-blue-600">{step}</span> de 3
                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                            {step === 1 ? 'Carga de Archivo' : step === 2 ? 'Definición de Costos' : 'Revisión y Confirmación'}
                        </p>
                    </div>
                </div>
                {step === 2 && (
                    <Button
                        color="primary"
                        radius="lg"
                        startContent={<Calculator className="w-4 h-4" />}
                        onClick={calculateCif}
                        className="font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        Calcular CIF
                    </Button>
                )}
                {step === 3 && (
                    <Button
                        color="success"
                        radius="lg"
                        startContent={<Save className="w-4 h-4" />}
                        onClick={handleFinalize}
                        className="font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 text-white"
                    >
                        Confirmar Orden de Compra
                    </Button>
                )}
            </div>

            <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

                {/* Step 1: Upload */}
                {step === 1 && (
                    <Card className="border-none shadow-sm">
                        <CardBody className="p-12 text-center space-y-6">
                            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <Upload className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Cargar Factura de Proveedor</h2>
                                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                                    Sube el archivo Excel (.xlsx) con el detalle de la compra. El sistema identificará automáticamente los productos por descripción o SKU.
                                </p>
                            </div>

                            <div className="flex justify-center pt-4">
                                <Button
                                    as="label"
                                    htmlFor="file-upload"
                                    color="primary"
                                    size="lg"
                                    radius="lg"
                                    variant="flat"
                                    isLoading={uploading}
                                    startContent={!uploading && <FileSpreadsheet className="w-5 h-5" />}
                                    className="font-black uppercase tracking-widest cursor-pointer"
                                >
                                    {uploading ? 'Procesando...' : 'Seleccionar Archivo Excel'}
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".xlsx, .xls"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Step 2: Costs Input */}
                {step >= 2 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cost Inputs Panel */}
                        <Card className="h-fit border-none shadow-sm lg:col-span-1">
                            <CardBody className="p-6 space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Gastos de Importación</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Valor FOB Total</label>
                                        <div className="text-2xl font-black text-slate-900">${costs.fobTotal.toLocaleString()}</div>
                                    </div>

                                    <Divider className="my-2" />

                                    <Input
                                        label="Flete Internacional"
                                        placeholder="0.00"
                                        startContent={<span className="text-slate-400 text-sm">$</span>}
                                        type="number"
                                        variant="bordered"
                                        value={costs.freight.toString()}
                                        onValueChange={(v) => setCosts({ ...costs, freight: Number(v) })}
                                    />
                                    <Input
                                        label="Seguro"
                                        placeholder="0.00"
                                        startContent={<span className="text-slate-400 text-sm">$</span>}
                                        type="number"
                                        variant="bordered"
                                        value={costs.insurance.toString()}
                                        onValueChange={(v) => setCosts({ ...costs, insurance: Number(v) })}
                                    />
                                    <Input
                                        label="Otros Gastos (Handling/Aduana)"
                                        placeholder="0.00"
                                        startContent={<span className="text-slate-400 text-sm">$</span>}
                                        type="number"
                                        variant="bordered"
                                        value={costs.other.toString()}
                                        onValueChange={(v) => setCosts({ ...costs, other: Number(v) })}
                                    />

                                    <div className="bg-slate-50 p-4 rounded-xl mt-4">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Costo CIF Estimado</label>
                                        <div className="text-xl font-black text-emerald-600">${costs.cifTotal.toLocaleString()}</div>
                                        <p className="text-[10px] text-slate-400 mt-1">Este valor se distribuirá proporcionalmente entre los productos.</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Items Table */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="border-none shadow-sm">
                                <CardBody className="p-0">
                                    <Table aria-label="Import items table" removeWrapper shadow="none">
                                        <TableHeader>
                                            <TableColumn>PRODUCTO</TableColumn>
                                            <TableColumn>CANTIDAD</TableColumn>
                                            <TableColumn>COSTO FOB</TableColumn>
                                            <TableColumn>COSTO CIF (CALC)</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent={"No hay productos cargados."}>
                                            {items.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <div className="font-bold text-slate-700">{item.description}</div>
                                                    </TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>${item.fobUnit.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        {item.cifUnit ? (
                                                            <div className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block">
                                                                ${item.cifUnit.toFixed(2)}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardBody>
                            </Card>

                            {/* Warning if step 2 and no calc */}
                            {step === 2 && costs.cifTotal === 0 && (
                                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl text-amber-700 border border-amber-100">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-medium">Ingresa los gastos y presiona "Calcular CIF" para ver cómo impacta el costo de cada producto.</p>
                                </div>
                            )}

                            {/* Confirmation block */}
                            {items.some(i => i.cifUnit) && (
                                <div className="flex justify-end pt-4">
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        onClick={() => setStep(3)}
                                        endContent={<CheckCircle2 className="w-4 h-4" />}
                                        className="font-bold"
                                    >
                                        Revisar y Finalizar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
