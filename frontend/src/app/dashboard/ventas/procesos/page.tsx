'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, XCircle, RotateCcw, Zap, Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function VentasProcesosEspecialesPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Desaprobar Pedidos',
            description: 'Regresar pedidos aprobados a estado pendiente para corrección.',
            icon: XCircle,
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-600/10',
            href: '/dashboard/ventas/procesos/desaprobar'
        },
        {
            title: 'Reversar Factura',
            description: 'Anular facturas emitidas y liberar pedidos asociados.',
            icon: RotateCcw,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-600/10',
            href: '/dashboard/ventas/procesos/reversar'
        },
        {
            title: 'Emitir Factura Electrónica',
            description: 'Procesar el envío de factura al ente regulador.',
            icon: Zap,
            iconColor: 'text-yellow-600',
            iconBgColor: 'bg-yellow-600/10',
            href: '/dashboard/ventas/procesos/electronica'
        },
        {
            title: 'Documentos Emitidos',
            description: 'Historial y consulta de comprobantes fiscales generados.',
            icon: Library,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            href: '/dashboard/ventas/procesos/documentos'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-20">
            <div className="px-8 py-8 max-w-[1600px] mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <span
                            className="hover:text-brand-primary cursor-pointer transition-colors"
                            onClick={() => router.push('/dashboard')}
                        >
                            Dashboard
                        </span>
                        <span>/</span>
                        <span
                            className="hover:text-brand-primary cursor-pointer transition-colors"
                            onClick={() => router.push('/dashboard/ventas')}
                        >
                            Ventas
                        </span>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Procesos Especiales</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                        Operaciones Críticas
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                    Procesos Especiales
                                </h1>
                                <p className="text-slate-600 text-lg">
                                    Herramientas para la reversión y gestión de documentos electrónicos.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            leftIcon={<ArrowLeft className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/ventas')}
                            className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                        >
                            Volver a Ventas
                        </Button>
                    </div>
                </motion.div>

                {/* Modules Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {modules.map((module, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                        >
                            <ModuleCard {...module} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
