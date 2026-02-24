'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wrench, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function ContabilidadHerramientasPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Control de Número de Cheques',
            description: 'Gestionar y resetear correlativos de numeración de cheques.',
            icon: CheckCircle2,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/contabilidad/herramientas/control-cheques'
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
                            onClick={() => router.push('/dashboard/contabilidad')}
                        >
                            Contabilidad
                        </span>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Herramientas</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                <Wrench className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
                                        Utilidades
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                    Herramientas
                                </h1>
                                <p className="text-slate-600 text-lg">
                                    Funciones especiales para el mantenimiento técnico de la contabilidad.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            leftIcon={<ArrowLeft className="w-4 h-4" />}
                            onClick={() => router.push('/dashboard/contabilidad')}
                            className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                        >
                            Volver a Contabilidad
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
