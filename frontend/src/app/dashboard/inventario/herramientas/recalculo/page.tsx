'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calculator,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Info,
    TriangleAlert,
    Clock,
    Database,
    History
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecalculoExistenciaPage() {
    const router = useRouter();
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

    const handleRecalcular = async () => {
        setRunning(true);
        setResult(null);
        try {
            const res = await api<{
                success: boolean;
                message: string;
                details: { itemsProcessed: number; discrepanciesFound: number; timeElapsed: string }
            }>('/inventory/recalculate', { method: 'POST' });

            setResult(res);
            toast.success(res.message);
        } catch (e: any) {
            setResult({
                success: false,
                message: e.message || 'Error durante el proceso de recálculo'
            });
            toast.error('Error al recalcular existencia');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Sticky Header Area */}
            <div className="sticky top-0 z-30 bg-bg-base/80 backdrop-blur-md pt-6 pb-2">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="bg-white border border-[#E2E8F0] shadow-lg rounded-2xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-11 h-11 rounded-xl border border-[#E2E8F0] flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                <ArrowLeft className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-black tracking-wider rounded">
                                        UTILIDAD DE SISTEMA
                                    </span>
                                    <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest hidden sm:block">Sync v4.2</span>
                                </div>
                                <h1 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight leading-none">
                                    Recálculo de Existencia
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-6">
                {/* Warning Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                        <TriangleAlert className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide mb-1">Acción Crítica de Mantenimiento</h3>
                        <p className="text-sm text-amber-800 leading-relaxed font-medium">
                            Este proceso reconstruye los balances de inventario basándose estrictamente en el historial de movimientos (compras, ventas, ajustes y transferencias).
                            Se recomienda realizar este proceso en horas de baja actividad.
                        </p>
                    </div>
                </div>

                {/* Main Action Card */}
                <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Calculator className="w-40 h-40 text-[#0F172A]" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
                        <div className="w-20 h-20 rounded-2xl bg-[#2563EB]/5 flex items-center justify-center mb-6">
                            <RefreshCcw className={`w-10 h-10 text-[#2563EB] ${running ? 'animate-spin' : ''}`} />
                        </div>
                        <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight mb-2">Reconstrucción de Balances</h2>
                        <p className="text-[#64748B] text-sm font-medium mb-8">
                            ¿Desea iniciar el proceso de recálculo global de existencias? El sistema analizará todos los movimientos registrados desde el inicio de operaciones para garantizar la integridad de los saldos actuales.
                        </p>

                        <button
                            onClick={handleRecalcular}
                            disabled={running}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${running
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-blue-500/20 active:scale-[0.98]'
                                }`}
                        >
                            {running ? (
                                <>
                                    <Clock className="w-5 h-5 animate-pulse" />
                                    Procesando Información...
                                </>
                            ) : (
                                <>
                                    <Calculator className="w-5 h-5" />
                                    Iniciar Recálculo Global
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`rounded-3xl border p-6 ${result.success
                                ? 'bg-[#F0FDF4] border-[#86EFAC]/30'
                                : 'bg-[#FEF2F2] border-[#FECACA]/30'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-xl scale-125 ${result.success ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                                    {result.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-black uppercase tracking-wider mb-1 ${result.success ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                                        {result.message}
                                    </h4>
                                    {result.details && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                            <div className="bg-white/50 rounded-xl p-3 border border-black/5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    <Database className="w-3 h-3" /> Productos
                                                </div>
                                                <div className="text-xl font-black text-gray-800">{result.details.itemsProcessed}</div>
                                            </div>
                                            <div className="bg-white/50 rounded-xl p-3 border border-black/5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    <TriangleAlert className="w-3 h-3" /> Ajustes
                                                </div>
                                                <div className="text-xl font-black text-[#EA580C]">{result.details.discrepanciesFound}</div>
                                            </div>
                                            <div className="bg-white/50 rounded-xl p-3 border border-black/5">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    <Clock className="w-3 h-3" /> Tiempo
                                                </div>
                                                <div className="text-xl font-black text-gray-800">{result.details.timeElapsed}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                            <History className="w-5 h-5 text-[#64748B]" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1">Historial Perpetuo</h4>
                            <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                                El sistema mantendrá un registro del último recálculo realizado y los ajustes aplicados automáticamente para auditoría posterior.
                            </p>
                        </div>
                    </div>
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-[#64748B]" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1">Integridad de Datos</h4>
                            <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">
                                Utilice esta herramienta si detecta inconsistencias entre su stock físico y los saldos mostrados en pantalla tras fallos eléctricos o de red.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
