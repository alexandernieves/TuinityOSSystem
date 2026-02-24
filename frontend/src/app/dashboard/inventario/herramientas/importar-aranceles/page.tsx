'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Upload, FileSpreadsheet, Download, CheckCircle2,
    AlertTriangle, Loader2, X, Info, FileUp, Database, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

type ImportResult = {
    created: number;
    updated: number;
    errors: { row: number; error: string }[];
};

export default function ImportArancelesPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Success/Error
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const selectedFile = files[0];
            setFile(selectedFile);
            parsePreview(selectedFile);
        }
    };

    const parsePreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            setPreviewData(json.slice(0, 10)); // Show first 10 rows
            setStep(2);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (!file) return;

        const session = loadSession();
        if (!session?.accessToken) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/products/bulk/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error en la importación');
            }

            const data: ImportResult = await res.json();
            setResult(data);
            setStep(3);
            toast.success('Proceso de importación finalizado');
        } catch (err: any) {
            toast.error(err.message || 'Error al importar archivo');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            {
                Referencia: 'PROD-001',
                Descripcion: 'Producto de Ejemplo',
                Arancel: '1234.56.78',
            }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aranceles');
        XLSX.writeFile(wb, 'Plantilla_Aranceles_Tuinity.xlsx');
    };

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
                                    <Badge variant="outline" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 text-[9px] font-black tracking-wider px-2 py-0.5">
                                        HERRAMIENTA MASIVA
                                    </Badge>
                                    <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest hidden sm:block">v2.4 - Dynamo Sync Enhanced</span>
                                </div>
                                <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight leading-none">
                                    Importar Aranceles
                                </h1>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            className="bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-lg shadow-brand-secondary/20 h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                            onClick={downloadTemplate}
                        >
                            <Download className="w-4 h-4" />
                            <span>Descargar Plantilla</span>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Process Control */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Stepper Visual */}
                        <div className="flex items-center gap-4 px-2">
                            {[1, 2, 3].map((s) => (
                                <React.Fragment key={s}>
                                    <div className={clsx(
                                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all",
                                        step === s ? "bg-brand-primary text-white scale-110 shadow-md shadow-brand-primary/30" :
                                            step > s ? "bg-success text-white" : "bg-bg-alt text-text-tertiary border border-border"
                                    )}>
                                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                    </div>
                                    {s < 3 && <div className={clsx("h-[2px] w-12", step > s ? "bg-success" : "bg-border")} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {step === 1 && (
                            <Card className="border-2 border-dashed border-border bg-white hover:border-brand-primary/50 transition-all group overflow-hidden">
                                <CardContent className="p-0">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-16 flex flex-col items-center justify-center cursor-pointer text-center"
                                    >
                                        <div className="w-24 h-24 bg-brand-primary/5 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-brand-primary/10 group-hover:scale-110 transition-transform">
                                            <FileUp className="w-12 h-12 text-brand-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-text-primary mb-2">Selecciona tu archivo de inventario</h3>
                                        <p className="text-text-secondary max-w-sm mb-8">
                                            Suelta tu Excel (.xlsx) aquí o haz clic para buscarlo.
                                            Soportamos el formato estándar de Dynamo.
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-bg-alt border border-border rounded-xl text-xs font-medium text-text-secondary">
                                                <Database className="w-4 h-4" /> Auto-detección
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-bg-alt border border-border rounded-xl text-xs font-medium text-text-secondary">
                                                <LayoutGrid className="w-4 h-4" /> Mapeo Inteligente
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xl">
                                    <div className="bg-brand-primary/5 px-6 py-4 flex items-center justify-between border-b border-brand-primary/10">
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="w-5 h-5 text-brand-primary" />
                                            <span className="font-bold text-text-primary">{file?.name}</span>
                                            <Badge variant="info" className="text-[10px]">{previewData.length}+ registros</Badge>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-text-tertiary hover:text-error transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto max-h-[400px]">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-bg-alt border-b border-border">
                                                    {previewData[0] && Object.keys(previewData[0]).map(key => (
                                                        <th key={key} className="px-6 py-4 text-[10px] font-black uppercase text-text-tertiary tracking-widest">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {previewData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-bg-alt/50 transition-colors">
                                                        {Object.values(row).map((val: any, j) => (
                                                            <td key={j} className="px-6 py-4 text-xs font-medium text-text-primary whitespace-nowrap">{val?.toString() || '-'}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-bg-alt/50 p-6 flex items-center justify-between">
                                        <div className="flex items-start gap-4 text-text-secondary">
                                            <Info className="w-5 h-5 shrink-0 text-brand-primary" />
                                            <p className="text-xs leading-relaxed max-w-lg">
                                                Hemos detectado las columnas automáticamente. Los productos con la misma <strong>Referencia</strong> actualizarán su Código Arancelario.
                                            </p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            className="px-12 py-6 bg-brand-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-brand-primary/20"
                                            isLoading={loading}
                                            onClick={handleImport}
                                        >
                                            Procesar Ahora
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && result && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                <div className="bg-white rounded-3xl border border-border p-10 shadow-2xl text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success via-brand-primary to-success"></div>
                                    <div className="w-20 h-20 bg-success/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-success" />
                                    </div>
                                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tight mb-2">Importación Completada</h2>
                                    <p className="text-text-secondary mb-10 max-w-sm mx-auto uppercase text-[10px] font-bold tracking-widest">El catálogo ha sido actualizado con éxito</p>

                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        <div className="p-6 bg-success/5 border border-success/10 rounded-2xl">
                                            <p className="text-[10px] font-black text-success uppercase tracking-widest mb-1">Created</p>
                                            <p className="text-3xl font-black text-text-primary">{result.created}</p>
                                        </div>
                                        <div className="p-6 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
                                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Updated</p>
                                            <p className="text-3xl font-black text-text-primary">{result.updated}</p>
                                        </div>
                                    </div>

                                    {result.errors.length > 0 && (
                                        <div className="text-left bg-error/5 border border-error/10 rounded-2xl p-6 mb-10">
                                            <div className="flex items-center gap-2 text-error mb-4">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase">Errores detectados ({result.errors.length})</span>
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                                                {result.errors.slice(0, 50).map((err, i) => (
                                                    <div key={i} className="text-[10px] font-bold text-text-secondary border-b border-border py-1">
                                                        Fila {err.row}: <span className="text-error">{err.error}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full rounded-2xl bg-brand-primary text-white hover:bg-brand-primary/90"
                                        onClick={() => setStep(1)}
                                    >
                                        Importar otro archivo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Rules & Status */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-brand-primary/5 border border-brand-primary/10 shadow-xl rounded-3xl overflow-hidden">
                            <CardContent className="p-8">
                                <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Database className="w-4 h-4" /> Protocolo de Datos
                                </h4>
                                <ul className="space-y-6">
                                    {[
                                        { title: 'Identificador Único', text: 'La columna "Referencia" manda. Si existe el ID, actualizamos; si no, creamos.' },
                                        { title: 'Nuevas Entidades', text: 'Si escribes una Marca o Categoría que no existe, el sistema la creará automáticamente.' },
                                        { title: 'Formato Numérico', text: 'Los precios deben usar punto (.) como separador decimal. Ej: 24.99' },
                                        { title: 'Auditoría', text: 'Cada importación queda registrada con tu firma digital y marca de tiempo.' }
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-4">
                                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-brand-primary rounded-full mt-1.5 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                                            <div>
                                                <p className="text-[10px] font-black text-text-primary uppercase mb-1">{item.title}</p>
                                                <p className="text-[11px] font-medium text-text-secondary tracking-tight">{item.text}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-3xl p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-brand-primary/10 rounded-xl">
                                    <LayoutGrid className="w-5 h-5 text-brand-primary" />
                                </div>
                                <h4 className="text-xs font-black text-text-primary uppercase tracking-[0.1em]">Campos Recomendados</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['Referencia', 'Descripcion', 'Arancel'].map(c => (
                                    <span key={c} className="px-3 py-1 bg-white border border-border rounded-lg text-[9px] font-black text-text-secondary uppercase">{c}</span>
                                ))}
                                <span className="px-3 py-1 bg-white border border-border rounded-lg text-[9px] font-black text-text-tertiary italic">Formato Numérico</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
