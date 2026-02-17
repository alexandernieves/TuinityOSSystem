'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { loadSession } from '@/lib/auth-storage';

export default function ImportarProductosPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Selecciona un archivo primero');
            return;
        }

        const session = loadSession();
        if (!session?.accessToken) {
            router.push('/login');
            return;
        }

        setImporting(true);
        const toastId = toast.loading('Importando productos desde Excel...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/products/bulk/import`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Import failed');
            }

            const data = await res.json();
            setResult(data);
            toast.success(`Importados ${data.created || 0} productos exitosamente`, { id: toastId });
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error al importar productos', { id: toastId });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        // Crear CSV de ejemplo
        const csvContent = `description,description_es,description_en,description_pt,codigoArancelario,paisOrigen,weight,volume,unitsPerBox,price_a,price_b,price_c,price_d,price_e
Whisky Black & White 750ml con estuche,Whisky Black & White 750ml con estuche,Black & White Whisky 750ml with case,Whisky Black & White 750ml com estojo,2208.30.20,Escocia,1.2,0.001,6,85.00,80.00,75.00,70.00,65.00
Vodka Absolut 700ml,Vodka Absolut 700ml,Absolut Vodka 700ml,Vodka Absolut 700ml,2208.60.10,Suecia,1.0,0.0009,12,45.00,42.00,40.00,38.00,35.00`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_productos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <Upload className="w-10 h-10 text-emerald-600" />
                        Importar Productos desde Excel
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Carga masiva de productos desde archivos Excel o CSV. Elimina la carga manual producto por producto.
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                    <h2 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Instrucciones
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                        <li>Descarga la plantilla de ejemplo haciendo clic en el botón de abajo</li>
                        <li>Completa el archivo con tus productos (puedes usar Excel, Google Sheets o cualquier editor de CSV)</li>
                        <li>Asegúrate de que la columna <code className="bg-blue-100 px-1 rounded">description</code> esté completa (es obligatoria)</li>
                        <li>Sube el archivo y haz clic en "Importar"</li>
                        <li>El sistema detectará automáticamente si un producto ya existe y lo actualizará</li>
                    </ol>
                </div>

                {/* Download Template */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Paso 1: Descarga la Plantilla</h2>
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Descargar Plantilla CSV
                    </button>
                </div>

                {/* Upload File */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Paso 2: Sube tu Archivo</h2>

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <FileSpreadsheet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            {file ? (
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 mb-2">{file.name}</p>
                                    <p className="text-sm text-slate-600">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 mb-2">
                                        Haz clic para seleccionar un archivo
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        Formatos soportados: CSV, Excel (.xlsx, .xls)
                                    </p>
                                </div>
                            )}
                        </label>
                    </div>

                    {file && (
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-5 h-5" />
                            {importing ? 'Importando...' : 'Importar Productos'}
                        </button>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Resultado de la Importación</h2>

                        <div className="space-y-4">
                            {result.created > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    <div>
                                        <p className="font-semibold text-emerald-900">
                                            {result.created} producto{result.created !== 1 ? 's' : ''} creado{result.created !== 1 ? 's' : ''}
                                        </p>
                                        <p className="text-sm text-emerald-700">
                                            Se agregaron exitosamente al catálogo
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result.updated > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-blue-900">
                                            {result.updated} producto{result.updated !== 1 ? 's' : ''} actualizado{result.updated !== 1 ? 's' : ''}
                                        </p>
                                        <p className="text-sm text-blue-700">
                                            Se actualizaron productos existentes
                                        </p>
                                    </div>
                                </div>
                            )}

                            {result.errors && result.errors.length > 0 && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                        <p className="font-semibold text-red-900">
                                            {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}
                                        </p>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                        {result.errors.map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={() => router.push('/dashboard/productos')}
                                className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
                            >
                                Ver Catálogo de Productos
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
