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
            color: 'text-brand-secondary',
            bg: 'bg-brand-secondary/10',
            trend: null
        },
        {
            title: 'Clientes Activos',
            value: '634',
            icon: UserCheck,
            color: 'text-success',
            bg: 'bg-success/10',
            trend: { value: '+12%', label: 'vs mes anterior', up: true }
        },
        {
            title: 'Cuentas por Cobrar',
            value: '$485K',
            icon: DollarSign,
            color: 'text-warning',
            bg: 'bg-warning/10',
            trend: null
        },
        {
            title: 'Crédito Disponible',
            value: '$1.2M',
            icon: Wallet,
            color: 'text-success',
            bg: 'bg-success/10',
            trend: null
        }
    ];

    // Modules Data as per spec
    const modules: ModuleCardProps[] = [
        {
            title: 'Directorio de Clientes',
            description: 'Accede al listado completo de clientes, ficha técnica y estados.',
            icon: Users,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/clientes/consulta'
        },
        {
            title: 'Nuevo Cliente',
            description: 'Registra un nuevo cliente en el sistema con validación RIF/NIT.',
            icon: UserPlus,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/clientes/nuevo'
        },
        {
            title: 'Segmentación de Clientes',
            description: 'Clasifica tu cartera por volumen, frecuencia y rentabilidad.',
            icon: Filter,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/clientes/segmentacion'
        },
        {
            title: 'Gestión de Crédito',
            description: 'Administra límites de crédito, plazos y bloqueos automáticos.',
            icon: CreditCard,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/clientes/credito'
        },
        {
            title: 'Cuentas por Cobrar',
            description: 'Monitor de saldos pendientes, antiguedad y cobranza.',
            icon: DollarSign,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/clientes/cuentas-cobrar'
        },
        {
            title: 'Historial de Compras',
            description: 'Consulta detallada de todas las transacciones históricas.',
            icon: History,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/clientes/historial-compras'
        },
        {
            title: 'Administración de Archivos',
            description: 'Configura tipos de cliente, zonas y parámetros base.',
            icon: FolderOpen,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/clientes/admin-archivos',
            hasSubmodules: true,
            submodulesCount: 2
        },
        {
            title: 'Análisis de Clientes',
            description: 'Insights sobre comportamiento de compra y fidelización.',
            icon: BarChart3,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/clientes/analisis'
        },
        {
            title: 'Zonas de Venta',
            description: 'Gestión geográfica y asignación de vendedores por zona.',
            icon: Map,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/clientes/zonas'
        },
        {
            title: 'Herramientas',
            description: 'Importación masiva, exportación y mantenimiento de datos.',
            icon: Wrench,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/clientes/herramientas',
            hasSubmodules: true,
            submodulesCount: 3
        },
        {
            title: 'Reportes de Cuentas x Cobrar',
            description: 'Genera estados de cuenta y reportes financieros detallados.',
            icon: FileText,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/clientes/reportes-cuentas-cobrar',
            hasSubmodules: true,
            submodulesCount: 5
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
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 bg-bg-base min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary uppercase tracking-widest mb-2">
                    <Users className="w-4 h-4" />
                    <span>Portal de Negocios</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Módulo de Clientes
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Gestión integral de cartera, cuentas por cobrar y servicios al cliente.
                </p>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="border border-border-subtle bg-surface shadow-sm" radius="lg">
                        <CardBody className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                                        {kpi.title}
                                    </p>
                                    <h3 className="text-2xl font-bold text-text-primary">
                                        {kpi.value}
                                    </h3>
                                </div>
                                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                </div>
                            </div>
                            {kpi.trend && (
                                <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>{kpi.trend.value}</span>
                                    <span className="text-text-secondary font-normal">{kpi.trend.label}</span>
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
