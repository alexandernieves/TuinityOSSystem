'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Wrench,
    RefreshCw,
    Database,
    HardDriveDownload,
    Cpu,
    Zap,
    AlertTriangle,
    CheckCircle,
    Server
} from 'lucide-react';

export default function HerramientasPage() {
    const router = useRouter();

    const [isClearingCache, setIsClearingCache] = useState(false);
    const [isRebuildingIndices, setIsRebuildingIndices] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleClearCache = async () => {
        setIsClearingCache(true);
        const toastId = toast.loading('Vaciando caché del sistema...');
        // Simulate network/process delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('Caché limpiada correctamente. El sistema funcionará con datos frescos.', { id: toastId });
        setIsClearingCache(false);
    };

    const handleRebuildIndices = async () => {
        setIsRebuildingIndices(true);
        const toastId = toast.loading('Sincronizando índices de búsqueda...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        toast.success('Índices reconstruidos. Las búsquedas ahora serán más precisas.', { id: toastId });
        setIsRebuildingIndices(false);
    };

    const handleExportBackup = async () => {
        setIsExporting(true);
        const toastId = toast.loading('Generando respaldo de seguridad local...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success('Respaldo generado con éxito (MOCK).', { id: toastId });
        setIsExporting(false);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-[#475569] mb-4">
                        <span className="hover:text-[#F59E0B] cursor-pointer transition-colors" onClick={() => router.push('/dashboard')}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-[#F59E0B] cursor-pointer transition-colors" onClick={() => router.push('/dashboard/configuracion')}>Configuración</span>
                        <span>/</span>
                        <span className="text-[#0F172A] font-medium">Herramientas</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                            <Wrench className="h-6 w-6 text-[#F59E0B]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-[#0F172A]">Herramientas del Sistema</h1>
                            <p className="text-sm text-[#475569]">Utilidades avanzadas y mantenimiento del ERP.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status Banner */}
            <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                        <Server className="w-6 h-6 text-[#16A34A] animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#0F172A]">Estado de Servidor: <span className="text-[#16A34A]">Óptimo</span></h3>
                        <p className="text-xs text-[#475569] mt-0.5">Uptime: 99.9% • Latencia media: 45ms</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-[#94A3B8] font-medium uppercase">Uso de BD</p>
                        <p className="text-[#0F172A] font-semibold">1.2 GB <span className="text-xs text-[#94A3B8] font-normal">/ 10 GB</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[#94A3B8] font-medium uppercase">Versión</p>
                        <p className="text-[#0F172A] font-semibold">v1.12.5</p>
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* TOOL: Cache */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center mb-4 text-[#2563EB]">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Limpiar Caché del Sistema</h3>
                    <p className="text-sm text-[#475569] mb-6">
                        Vacía la memoria temporal del sistema para forzar la recarga de configuraciones, listas de precios recientes y permisos actualizados. Útil si nota lentitud o datos desactualizados.
                    </p>
                    <button
                        onClick={handleClearCache}
                        disabled={isClearingCache}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F7F9FC] transition-colors disabled:opacity-50 font-medium"
                    >
                        {isClearingCache ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4" />
                        )}
                        {isClearingCache ? 'Limpiando caché...' : 'Ejecutar Limpieza'}
                    </button>
                </div>

                {/* TOOL: Indices */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center mb-4 text-[#F59E0B]">
                        <Database className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Reconstruir Índices de Búsqueda</h3>
                    <p className="text-sm text-[#475569] mb-6">
                        Sincroniza y optimiza el motor de búsqueda interno para inventario y clientes. Ejecute esta acción si las búsquedas en el POS o inventario no están retornando los resultados esperados.
                    </p>
                    <button
                        onClick={handleRebuildIndices}
                        disabled={isRebuildingIndices}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F7F9FC] transition-colors disabled:opacity-50 font-medium"
                    >
                        {isRebuildingIndices ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Cpu className="w-4 h-4" />
                        )}
                        {isRebuildingIndices ? 'Sincronizando índices...' : 'Forzar Sincronización'}
                    </button>
                </div>

                {/* TOOL: Export */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center mb-4 text-[#16A34A]">
                        <HardDriveDownload className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Respaldo Local de Seguridad</h3>
                    <p className="text-sm text-[#475569] mb-6">
                        TuinityOS realiza respaldos automáticos en la nube cada hora. Sin embargo, puede descargar un archivo comprimido (.zip) con el estado de su base de datos actual y documentos importantes por seguridad.
                    </p>
                    <button
                        onClick={handleExportBackup}
                        disabled={isExporting}
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg hover:bg-[#F7F9FC] transition-colors disabled:opacity-50 font-medium"
                    >
                        {isExporting ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <HardDriveDownload className="w-4 h-4" />
                        )}
                        {isExporting ? 'Generando archivo...' : 'Descargar Respaldo Ahora'}
                    </button>
                </div>

                {/* DANGER ZONE */}
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-6 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center mb-4 text-[#DC2626]">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#991B1B] mb-2">Zona de Peligro</h3>
                    <p className="text-sm text-[#991B1B]/80 mb-6">
                        Opciones destructivas del sistema. Estas opciones requieren autenticación de Nivel 2 y aprobación directa del Administrador Principal del Tenant.
                    </p>
                    <button
                        disabled
                        className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm bg-white border border-[#FECACA] text-[#DC2626] rounded-lg opacity-50 cursor-not-allowed font-medium"
                    >
                        Resetear Transacciones de la Empresa
                    </button>
                </div>

            </div>
        </div>
    );
}
