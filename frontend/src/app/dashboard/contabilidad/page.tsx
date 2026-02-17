'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    FileText,
    BarChart3,
    Printer,
    Search,
    Settings,
    FolderOpen,
    Wrench,
    Building2,
    TrendingUp,
    DollarSign,
    Calendar
} from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function ContabilidadHubPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Transacciones del Mayor',
            description: 'Registro y consulta de movimientos contables.',
            icon: BookOpen,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/contabilidad/mayor'
        },
        {
            title: 'Catálogo de Cuentas',
            description: 'Gestión del plan de cuentas contables.',
            icon: FileText,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-600/10',
            href: '/dashboard/contabilidad/catalogo'
        },
        {
            title: 'Consulta de Estados Financieros',
            description: 'Visualización de reportes financieros.',
            icon: BarChart3,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-600/10',
            href: '/dashboard/contabilidad/estados-financieros'
        },
        {
            title: 'Re-Imprimir Cheque',
            description: 'Reimpresión de cheques emitidos.',
            icon: Printer,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-600/10',
            href: '/dashboard/contabilidad/reimprimir-cheque'
        },
        {
            title: 'Consulta de Cuentas',
            description: 'Búsqueda y análisis de cuentas contables.',
            icon: Search,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            href: '/dashboard/contabilidad/consulta-cuentas'
        },
        {
            title: 'Procesos Especiales',
            description: 'Operaciones de cierre y actualización contable.',
            icon: Settings,
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-600/10',
            href: '/dashboard/contabilidad/procesos',
            hasSubmodules: true,
            submodulesCount: 4
        },
        {
            title: 'Administración de Archivos',
            description: 'Configuración de parámetros contables.',
            icon: FolderOpen,
            iconColor: 'text-indigo-600',
            iconBgColor: 'bg-indigo-600/10',
            href: '/dashboard/contabilidad/archivos',
            hasSubmodules: true,
            submodulesCount: 0 // Pendiente de definir
        },
        {
            title: 'Reportes de Contabilidad',
            description: 'Informes y análisis contables.',
            icon: BarChart3,
            iconColor: 'text-green-600',
            iconBgColor: 'bg-green-600/10',
            href: '/dashboard/contabilidad/reportes',
            hasSubmodules: true,
            submodulesCount: 0 // Pendiente de definir
        },
        {
            title: 'Herramientas',
            description: 'Utilidades de mantenimiento contable.',
            icon: Wrench,
            iconColor: 'text-yellow-600',
            iconBgColor: 'bg-yellow-600/10',
            href: '/dashboard/contabilidad/herramientas',
            hasSubmodules: true,
            submodulesCount: 1
        },
        {
            title: 'Conciliación Bancaria',
            description: 'Conciliación de cuentas bancarias.',
            icon: Building2,
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-600/10',
            href: '/dashboard/contabilidad/conciliacion',
            hasSubmodules: true,
            submodulesCount: 3
        },
        {
            title: 'Consulta de Transacciones',
            description: 'Historial y búsqueda de transacciones.',
            icon: Search,
            iconColor: 'text-slate-600',
            iconBgColor: 'bg-slate-600/10',
            href: '/dashboard/contabilidad/transacciones'
        }
    ];

    const kpis = [
        {
            label: 'ACTIVOS TOTALES',
            value: '$2.5M',
            icon: TrendingUp,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            trend: '+5.2%',
            trendColor: 'text-emerald-500'
        },
        {
            label: 'PASIVOS TOTALES',
            value: '$850K',
            icon: DollarSign,
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-600/10',
            trend: '-2.1%',
            trendColor: 'text-blue-500'
        },
        {
            label: 'PATRIMONIO',
            value: '$1.65M',
            icon: BarChart3,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-600/10',
            trend: '+8.4%',
            trendColor: 'text-emerald-500'
        },
        {
            label: 'PERIODO ACTUAL',
            value: 'Feb 2026',
            icon: Calendar,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-600/10',
            trend: 'ACTIVO',
            trendColor: 'text-purple-500'
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
                        <span className="text-slate-900 font-medium">Contabilidad</span>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Building2 className="w-5 h-5 text-brand-primary" />
                                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                                    Portal de Negocios
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                Módulo de Contabilidad
                            </h1>
                            <p className="text-slate-600 text-lg">
                                Gestión integral de finanzas, estados contables y reportes financieros.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* KPIs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                >
                    {kpis.map((kpi, index) => (
                        <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
                            <CardBody className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {kpi.label}
                                    </span>
                                    <div className={`w-10 h-10 rounded-xl ${kpi.iconBgColor} flex items-center justify-center`}>
                                        <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`flex items-center gap-1 text-[11px] font-bold ${kpi.trendColor}`}>
                                            <TrendingUp className="w-3 h-3" />
                                            {kpi.trend}
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium">vs mes anterior</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
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
