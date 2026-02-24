'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    UserCheck,
    DollarSign,
    Wallet,
    UserPlus,
    Filter,
    CreditCard,
    History,
    FolderOpen,
    BarChart3,
    Map,
    Wrench,
    FileText,
    TrendingUp
} from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function CustomersHubPage() {
    // KPI Data (Mock for now, would be fetched from API in real impl)
    const kpis = [
        {
            title: 'Total Clientes',
            value: '842',
            icon: Users,
            color: 'text-[#2563EB]',
            bg: 'bg-[#2563EB]/10',
            trend: null
        },
        {
            title: 'Clientes Activos',
            value: '634',
            icon: UserCheck,
            color: 'text-[#16A34A]',
            bg: 'bg-[#16A34A]/10',
            trend: { value: '+12%', label: 'vs mes anterior', up: true }
        },
        {
            title: 'Cuentas por Cobrar',
            value: '$485K',
            icon: DollarSign,
            color: 'text-[#F59E0B]',
            bg: 'bg-[#F59E0B]/10',
            trend: null
        },
        {
            title: 'Crédito Disponible',
            value: '$1.2M',
            icon: Wallet,
            color: 'text-[#16A34A]',
            bg: 'bg-[#16A34A]/10',
            trend: null
        }
    ];

    // Modules Data as per user's images
    const modules: ModuleCardProps[] = [
        {
            title: 'Consulta de Clientes',
            description: 'Búsqueda y visualización de información de clientes.',
            icon: Users,
            iconColor: 'text-[#2563EB]',
            iconBgColor: 'bg-[#2563EB]/10',
            href: '/dashboard/clientes/consulta'
        },
        {
            title: 'Administración de Clientes',
            description: 'Gestión completa del registro de clientes.',
            icon: UserCheck,
            iconColor: 'text-[#2563EB]',
            iconBgColor: 'bg-[#2563EB]/10',
            href: '/dashboard/clientes/administracion'
        },
        {
            title: 'Crear Cliente Contado',
            description: 'Registro rápido de clientes de contado.',
            icon: UserPlus,
            iconColor: 'text-[#16A34A]',
            iconBgColor: 'bg-[#16A34A]/10',
            href: '/dashboard/clientes/crear-contado'
        },
        {
            title: 'Registro de Transacciones',
            description: 'Registro manual de operaciones de clientes.',
            icon: FileText,
            iconColor: 'text-[#2563EB]',
            iconBgColor: 'bg-[#2563EB]/10',
            href: '/dashboard/clientes/transacciones'
        },
        {
            title: 'Análisis de Morosidad',
            description: 'Evaluación de cartera vencida y riesgo crediticio.',
            icon: BarChart3,
            iconColor: 'text-[#F59E0B]',
            iconBgColor: 'bg-[#F59E0B]/10',
            href: '/dashboard/clientes/morosidad'
        },
        {
            title: 'Imprimir Estado de Cuentas',
            description: 'Generación de estados de cuenta individuales.',
            icon: FileText,
            iconColor: 'text-[#2563EB]',
            iconBgColor: 'bg-[#2563EB]/10',
            href: '/dashboard/clientes/imprimir-estado'
        },
        {
            title: 'Administración de Archivos',
            description: 'Configuración de áreas, vendedores y parámetros.',
            icon: FolderOpen,
            iconColor: 'text-[#2563EB]',
            iconBgColor: 'bg-[#2563EB]/10',
            href: '/dashboard/clientes/archivos',
            hasSubmodules: true,
            submodulesCount: 2
        },
        {
            title: 'Reportes de Cuentas x Cobrar',
            description: 'Informes financieros y estados de cuenta.',
            icon: DollarSign,
            iconColor: 'text-[#16A34A]',
            iconBgColor: 'bg-[#16A34A]/10',
            href: '/dashboard/clientes/reportes',
            hasSubmodules: true,
            submodulesCount: 5
        },
        {
            title: 'Herramientas',
            description: 'Utilidades de mantenimiento y operaciones masivas.',
            icon: Wrench,
            iconColor: 'text-[#F59E0B]',
            iconBgColor: 'bg-[#F59E0B]/10',
            href: '/dashboard/clientes/herramientas',
            hasSubmodules: true,
            submodulesCount: 3
        },
        {
            title: 'Consulta de Transacciones',
            description: 'Historial y búsqueda de transacciones de clientes.',
            icon: History,
            iconColor: 'text-[#2563EB]',
            iconBgColor: 'bg-[#2563EB]/10',
            href: '/dashboard/clientes/consulta-transacciones'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 100 }
        }
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 bg-[#F7F9FC] min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2563EB] uppercase tracking-widest mb-2">
                    <Users className="w-4 h-4" />
                    <span>Portal de Negocios</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-2">
                    Módulo de Clientes
                </h1>
                <p className="text-[#475569] text-lg max-w-3xl font-light">
                    Gestión integral de cartera, cuentas por cobrar y servicios al cliente.
                </p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="border border-[#E2E8F0] bg-white shadow-sm" radius="lg">
                        <CardBody className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-medium text-[#475569] uppercase tracking-wide mb-1">
                                        {kpi.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-[#0F172A]">
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                </div>
                            </div>
                            {kpi.trend && (
                                <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-medium">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>{kpi.trend.value}</span>
                                    <span className="text-[#475569] font-normal">{kpi.trend.label}</span>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Modules Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {modules.map((module, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                        <ModuleCard {...module} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
