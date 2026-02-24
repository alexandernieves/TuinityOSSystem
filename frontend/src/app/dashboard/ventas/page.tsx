'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    FileText,
    CheckCircle,
    ShoppingCart,
    ClipboardCheck,
    Package,
    FilePlus,
    Settings,
    TrendingUp,
    BarChart3,
    Search,
    Users,
    ShoppingBag,
    DollarSign,
    Clock,
    Target
} from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function VentasHubPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Administración de Cotizaciones',
            description: 'Creación y gestión de propuestas comerciales.',
            icon: FileText,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            href: '/dashboard/ventas/cotizaciones'
        },
        {
            title: 'Aprobación de Cotizaciones',
            description: 'Revisión y autorización de cotizaciones pendientes.',
            icon: CheckCircle,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-600/10',
            href: '/dashboard/ventas/aprobacion-cotizaciones'
        },
        {
            title: 'Administración de Pedidos',
            description: 'Gestión de órdenes de venta confirmadas.',
            icon: ShoppingCart,
            iconColor: 'text-indigo-600',
            iconBgColor: 'bg-indigo-600/10',
            href: '/dashboard/ventas/pedidos'
        },
        {
            title: 'Aprobación de Pedidos',
            description: 'Validación de pedidos para su procesamiento.',
            icon: ClipboardCheck,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-600/10',
            href: '/dashboard/ventas/aprobacion-pedidos'
        },
        {
            title: 'Lista de Empaque',
            description: 'Preparación y control de despacho de mercancía.',
            icon: Package,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-600/10',
            href: '/dashboard/ventas/lista-empaque'
        },
        {
            title: 'Generar Factura',
            description: 'Emisión de facturas comerciales a partir de pedidos.',
            icon: FilePlus,
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-600/10',
            href: '/dashboard/ventas/facturar'
        },
        {
            title: 'Procesos Especiales',
            description: 'Operaciones críticas y ajustes de ventas.',
            icon: Settings,
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-600/10',
            href: '/dashboard/ventas/procesos',
            hasSubmodules: true,
            submodulesCount: 4
        },
        {
            title: 'DMC - Movimiento Comercial',
            description: 'Control de movimientos y documentos comerciales.',
            icon: TrendingUp,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/ventas/dmc',
            hasSubmodules: true,
            submodulesCount: 0
        },
        {
            title: 'Reportes de Ventas',
            description: 'Análisis detallado de gestión comercial.',
            icon: BarChart3,
            iconColor: 'text-green-600',
            iconBgColor: 'bg-green-600/10',
            href: '/dashboard/ventas/reportes',
            hasSubmodules: true,
            submodulesCount: 0
        },
        {
            title: 'Consulta de Pedidos Reservados',
            description: 'Seguimiento de mercancía apartada.',
            icon: Search,
            iconColor: 'text-slate-600',
            iconBgColor: 'bg-slate-600/10',
            href: '/dashboard/ventas/pedidos-reservados'
        },
        {
            title: 'Consulta de Ventas x Vendedor',
            description: 'Rendimiento y comisiones por ejecutivo.',
            icon: Users,
            iconColor: 'text-blue-500',
            iconBgColor: 'bg-blue-500/10',
            href: '/dashboard/ventas/ventas-vendedor'
        }
    ];

    const kpis = [
        {
            label: 'VENTAS TOTALES',
            value: '$1.2M',
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-600/10',
            trend: '+12.5%',
            trendColor: 'text-emerald-500'
        },
        {
            label: 'PEDIDOS PENDIENTES',
            value: '45',
            icon: ShoppingCart,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            trend: '-8.2%',
            trendColor: 'text-blue-500'
        },
        {
            label: 'COTIZACIONES ACTIVAS',
            value: '128',
            icon: FileText,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-600/10',
            trend: '+5.4',
            trendColor: 'text-emerald-500'
        },
        {
            label: 'META MENSUAL',
            value: '85%',
            icon: Target,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-600/10',
            trend: 'EN CURSO',
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
                        <span className="text-slate-900 font-medium">Ventas</span>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                    Gestión Comercial
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                Módulo de Ventas
                            </h1>
                            <p className="text-slate-600 text-lg">
                                Control integral del ciclo de ventas: desde la cotización hasta la facturación.
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
