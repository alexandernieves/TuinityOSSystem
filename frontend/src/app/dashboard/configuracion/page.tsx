'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Settings,
    Warehouse,
    Wrench,
    ShieldCheck,
    Users,
    Database,
    Activity,
    ArrowLeft,
    Building2,
    Lock,
    ToggleLeft
} from 'lucide-react';
import { Card, CardBody, Button } from '@heroui/react';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function ConfiguracionHubPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Registro de Bodegas',
            description: 'Gestión y configuración de almacenes y depósitos.',
            icon: Warehouse,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            href: '/dashboard/configuracion/bodegas'
        },
        {
            title: 'Herramientas del Sistema',
            description: 'Utilidades avanzadas y configuración técnica del ERP.',
            icon: Wrench,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-600/10',
            href: '/dashboard/configuracion/herramientas',
            hasSubmodules: true,
            submodulesCount: 0 // Pendiente de definir subsecciones
        },
        {
            title: 'Gestión de Sucursales',
            description: 'Administración de puntos de venta y oficinas.',
            icon: Building2,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-600/10',
            href: '/dashboard/configuracion/sucursales'
        },
        {
            title: 'Seguridad y Permisos',
            description: 'Control de acceso y roles de usuario.',
            icon: ShieldCheck,
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-600/10',
            href: '/dashboard/configuracion/seguridad'
        }
    ];

    const kpis = [
        {
            label: 'ESTADO DEL SISTEMA',
            value: 'Óptimo',
            icon: Activity,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-600/10',
            trend: '99.9%',
            trendColor: 'text-emerald-500'
        },
        {
            label: 'USUARIOS ACTIVOS',
            value: '24',
            icon: Users,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-600/10',
            trend: 'Sesiones hoy',
            trendColor: 'text-blue-500'
        },
        {
            label: 'BASE DE DATOS',
            value: '1.2 GB',
            icon: Database,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-600/10',
            trend: 'Copia: 2h ago',
            trendColor: 'text-purple-500'
        },
        {
            label: 'MÓDULOS ACTIVOS',
            value: '12/15',
            icon: ToggleLeft,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-600/10',
            trend: 'Licencia Gold',
            trendColor: 'text-orange-500'
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
                        <span className="text-slate-900 font-medium">Configuración</span>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Settings className="w-5 h-5 text-brand-primary" />
                                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                                    Panel de Control
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                Configuración del Sistema
                            </h1>
                            <p className="text-slate-600 text-lg">
                                Administre parámetros globales, bodegas, seguridad y herramientas técnicas.
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
                                            {kpi.trend}
                                        </div>
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
