'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, ShoppingBag, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { loadSession } from '@/lib/auth-storage';

export default function ImportarCompraPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [provider, setProvider] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file || !provider || !orderNumber) {
            toast.error('Completa todos los campos y selecciona un archivo');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) {
            router.push('/login');
            return;
        }

        setImporting(true);
        const toastId = toast.loading('Importando factura y calculando costos...');

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('provider', provider);
            formData.append('orderNumber', orderNumber);

            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/purchases/bulk/import`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error en la importación');
            }

            const data = await res.json();
            toast.success(`Orden #${orderNumber} creada con ${data.itemCount} productos`, { id: toastId });
            router.push(`/dashboard/compras/${data.id}`);
        } catch (err: any) {
            toast.error(err.message || 'Error al importar la orden de compra', { id: toastId });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
                        <Calculator className="w-10 h-10 text-emerald-600" />
                        Importar Factura de Proveedor
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Carga masiva de ítems de compra. El sistema distribuirá gastos de flete y seguro para calcular el costo CIF.
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
                    <h2 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Cálculo Automático FOB → CIF
                    </h2>
                    <p className="text-emerald-800 text-sm">
                        Al importar este archivo, podrás asignar los costos de flete, seguro y gastos de manejo.
                        El sistema calculará automáticamente el costo CIF por unidad basado en el valor FOB de cada ítem.
                    </p>
                </div>

                {/* Import Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Proveedor</label>
                            <input
                                type="text"
                                placeholder="Ej: Global Brands Panamá"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Número de Factura / Orden</label>
                            <input
                                type="text"
                                placeholder="Ej: INV-2026-001"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Archivo de Factura (CSV / Excel)</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            {file ? (
                                <p className="text-lg font-bold text-slate-900">{file.name}</p>
                            ) : (
                                <p className="text-slate-500">Haz clic o arrastra el archivo aquí</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                        {importing ? 'Procesando Importación...' : 'Importar y Procesar Costos'}
                    </button>
                </div>

                <div className="mt-8 bg-slate-100 rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                        Estructura Requerida
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                        El archivo debe contener al menos las siguientes columnas (el orden no importa):
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-3 py-1 bg-white border border-slate-300 rounded-full font-mono font-bold">description</span>
                        <span className="px-3 py-1 bg-white border border-slate-300 rounded-full font-mono font-bold">sku</span>
                        <span className="px-3 py-1 bg-white border border-slate-300 rounded-full font-mono font-bold">quantity</span>
                        <span className="px-3 py-1 bg-white border border-slate-300 rounded-full font-mono font-bold">fob_cost</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
