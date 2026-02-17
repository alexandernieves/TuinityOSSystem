'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Package,
    Search,
    TrendingUp,
    AlertTriangle,
    ArrowRightLeft,
    Settings,
    ShoppingBag,
    FileText,
    Clipboard,
    Wrench,
    ClipboardCheck,
    BarChart2,
    Database,
    FolderCog,
    Tags,
    Truck,
    Globe,
    Scale,
    Barcode,
    MapPin,
    Users
} from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function InventoryHubPage() {
    // KPI Data (Mock)
    const kpis = [
        {
            title: 'Total Productos',
            value: '4,231',
            icon: Package,
            color: 'text-brand-secondary',
            bg: 'bg-brand-secondary/10',
            trend: null
        },
        {
            title: 'Valor del Inventario',
            value: '$842.5K',
            icon: TrendingUp,
            color: 'text-success',
            bg: 'bg-success/10',
            trend: { value: '+3.2%', label: 'vs mes anterior', up: true }
        },
        {
            title: 'Bajo Stock',
            value: '45',
            icon: AlertTriangle,
            color: 'text-warning',
            bg: 'bg-warning/10',
            trend: { value: '12', label: 'críticos', up: false }
        },
        {
            title: 'Rotación',
            value: '4.8x',
            icon: ArrowRightLeft,
            color: 'text-brand-accent',
            bg: 'bg-brand-accent/10',
            trend: null
        }
    ];

    // Modules Data from user images
    const modules: ModuleCardProps[] = [
        {
            title: 'Consulta de Producto',
            description: 'Búsqueda avanzada y visualización de stock en tiempo real.',
            icon: Search,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/consulta'
        },
        {
            title: 'Administración de Productos',
            description: 'Creación, edición y configuración de catálogo de productos.',
            icon: Settings,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/inventario/productos'
        },
        {
            title: 'Registro de Compras',
            description: 'Gestión de órdenes de compra, entradas y análisis de costos.',
            icon: ShoppingBag,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/compras',
            hasSubmodules: true,
            submodulesCount: 4
        },
        {
            title: 'Ajustes de Inventario',
            description: 'Corrección manual de stock por mermas, daños o auditoría.',
            icon: Clipboard,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/ajustes'
        },
        {
            title: 'Transferencia de Mercancía',
            description: 'Movimiento de inventario entre sucursales y almacenes.',
            icon: ArrowRightLeft,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/transferencias'
        },
        {
            title: 'Administración de Archivos',
            description: 'Configuración de marcas, grupos, ubicaciones y proveedores.',
            icon: FolderCog,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/inventario/archivos',
            hasSubmodules: true,
            submodulesCount: 8
        },
        {
            title: 'Reportes de Inventario',
            description: 'Informes detallados de valoración, rotación y existencias.',
            icon: BarChart2,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/reportes',
            hasSubmodules: true,
            submodulesCount: 5 // Placeholder based on generic reporting needs
        },
        {
            title: 'Herramientas',
            description: 'Etiquetado, importación masiva y recálculo de existencias.',
            icon: Wrench,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/herramientas',
            hasSubmodules: true,
            submodulesCount: 10
        },
        {
            title: 'Inventario Físico',
            description: 'Captura y conciliación de conteos físicos de inventario.',
            icon: ClipboardCheck,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/fisico',
            hasSubmodules: true,
            submodulesCount: 1
        },
        {
            title: 'Consulta Bajo Existencia',
            description: 'Monitor de productos que requieren reposición inmediata.',
            icon: AlertTriangle,
            iconColor: 'text-error',
            iconBgColor: 'bg-error/10',
            href: '/dashboard/inventario/bajo-stock'
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
                    <Warehouse className="w-4 h-4" />
                    <span>Gestión de Stock</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Inventario
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Control total de existencias, movimientos, costos y valoración.
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
                                <div className={`flex items-center gap-1.5 text-xs font-medium ${kpi.trend.up ? 'text-success' : 'text-error'}`}>
                                    <TrendingUp className={`w-3.5 h-3.5 ${!kpi.trend.up && 'rotate-180'}`} />
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

// Helper icon component
function Warehouse(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
            <path d="M6 18h12" />
            <path d="M6 14h12" />
            <rect width="12" height="12" x="6" y="10" />
        </svg>
    )
}
