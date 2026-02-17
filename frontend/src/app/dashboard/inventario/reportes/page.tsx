'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    BarChart2,
    TrendingUp,
    Package,
    DollarSign,
    FileBarChart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function InventoryReportsPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Reporte de Valoración',
            description: 'Análisis del valor total del inventario por categoría y ubicación.',
            icon: DollarSign,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/reportes/valoracion'
        },
        {
            title: 'Reporte de Rotación',
            description: 'Métricas de movimiento y velocidad de salida de productos.',
            icon: TrendingUp,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/reportes/rotacion'
        },
        {
            title: 'Reporte de Existencias',
            description: 'Inventario actual por sucursal, marca y categoría.',
            icon: Package,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/inventario/reportes/existencias'
        },
        {
            title: 'Reporte de Movimientos',
            description: 'Historial detallado de entradas, salidas y ajustes.',
            icon: BarChart2,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/reportes/movimientos'
        },
        {
            title: 'Reporte Consolidado',
            description: 'Vista integral de métricas clave del inventario.',
            icon: FileBarChart,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/inventario/reportes/consolidado'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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
            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:bg-transparent hover:text-brand-primary"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    onClick={() => router.back()}
                >
                    Volver a Inventario
                </Button>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary uppercase tracking-widest mb-2">
                    <BarChart2 className="w-4 h-4" />
                    <span>Análisis y Reportes</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Reportes de Inventario
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Informes detallados de valoración, rotación y existencias del inventario.
                </p>
            </div>

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
