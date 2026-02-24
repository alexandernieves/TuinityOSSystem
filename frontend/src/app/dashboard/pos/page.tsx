'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingCart,
    FileText,
    TrendingUp,
    DollarSign,
    CreditCard,
    RotateCcw,
    Briefcase,
    Lock,
    BarChart2,
    Inbox,
    Package,
    FileBarChart,
    List,
    Store
} from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function POSHubPage() {
    // KPI Data (Mock for now)
    const kpis = [
        {
            title: 'Ventas del Día',
            value: '$12.4K',
            icon: ShoppingCart,
            color: 'text-brand-secondary',
            bg: 'bg-brand-secondary/10',
            trend: { value: '+8%', label: 'vs ayer', up: true }
        },
        {
            title: 'Transacciones',
            value: '142',
            icon: FileText,
            color: 'text-success',
            bg: 'bg-success/10',
            trend: null
        },
        {
            title: 'Total en Caja',
            value: '$3.2K',
            icon: Inbox,
            color: 'text-warning',
            bg: 'bg-warning/10',
            trend: null
        },
        {
            title: 'Ticket Promedio',
            value: '$87.50',
            icon: TrendingUp,
            color: 'text-brand-accent',
            bg: 'bg-brand-accent/10',
            trend: { value: '+2.5%', label: 'vs ayer', up: true }
        }
    ];

    // Modules Data from user request
    const modules: ModuleCardProps[] = [
        {
            title: 'Crear Factura',
            description: 'Genera una nueva venta rápida o factura fiscal.',
            icon: ShoppingCart,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/pos/nueva-venta'
        },
        {
            title: 'Consulta de Facturas',
            description: 'Historial completo de ventas y documentos emitidos.',
            icon: FileText,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/pos/facturas'
        },
        {
            title: 'Consulta de Utilidad',
            description: 'Analiza la ganancia detallada por cada factura emitida.',
            icon: TrendingUp,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/pos/utilidad'
        },
        {
            title: 'Cobros por Factura',
            description: 'Detalle de los pagos recibidos asociados a cada factura.',
            icon: DollarSign,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/pos/cobros-factura'
        },
        {
            title: 'Cobros con Tarjeta',
            description: 'Reporte específico de transacciones y pagos con tarjeta.',
            icon: CreditCard,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/pos/cobros-tarjeta'
        },
        {
            title: 'Consulta de Devoluciones',
            description: 'Historial de devoluciones y gestión de notas de crédito.',
            icon: RotateCcw,
            iconColor: 'text-error', // Using error color for returns to signify negative flow/attention
            iconBgColor: 'bg-error/10',
            href: '/dashboard/pos/devoluciones'
        },
        {
            title: 'Gestión de Ventas',
            description: 'Administración general de operaciones de venta.',
            icon: Briefcase,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/pos/gestion'
        },
        {
            title: 'Cierre de Caja',
            description: 'Realizar arqueos, cuadres y cierres de turno diarios.',
            icon: Lock,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/pos/cierre-caja'
        },
        {
            title: 'Análisis de Ventas',
            description: 'Métricas, KPIs y gráficas de rendimiento comercial.',
            icon: BarChart2,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/pos/analisis'
        },
        {
            title: 'Cobros por Caja',
            description: 'Registro de entradas de dinero desglosado por punto de venta.',
            icon: Inbox,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/pos/cobros-caja'
        },
        {
            title: 'Consulta de Artículos',
            description: 'Reporte de movimiento de inventario y artículos vendidos.',
            icon: Package,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/pos/articulos-vendidos'
        },
        {
            title: 'Reportes de POS',
            description: 'Informes consolidados y estadísticas del punto de venta.',
            icon: FileBarChart,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/pos/reportes'
        },
        {
            title: 'Detalle de Artículos',
            description: 'Desglose pormenorizado de items facturados por cliente.',
            icon: List,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/pos/detalle-articulos'
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
        <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 bg-bg-base min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary uppercase tracking-widest mb-2">
                    <Store className="w-4 h-4" />
                    <span>Portal de Operaciones</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Punto de Venta
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Gestión de facturación, cobros, cajas y reportes de ventas.
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
