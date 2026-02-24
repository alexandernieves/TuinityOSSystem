'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    DollarSign,
    FileText,
    BarChart3,
    TrendingDown,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function ClientesReportesPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Estado de Cuenta General',
            description: 'Reporte consolidado de saldos y movimientos por cliente.',
            icon: FileText,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/clientes/reportes/estado-cuenta'
        },
        {
            title: 'Análisis de Antigüedad de Saldos',
            description: 'Clasificación de cuentas por cobrar según vencimiento.',
            icon: Calendar,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/clientes/reportes/antiguedad'
        },
        {
            title: 'Reporte de Morosidad',
            description: 'Evaluación de cartera vencida y riesgo crediticio.',
            icon: TrendingDown,
            iconColor: 'text-error',
            iconBgColor: 'bg-error/10',
            href: '/dashboard/clientes/reportes/morosidad'
        },
        {
            title: 'Resumen de Cobranza',
            description: 'Estadísticas de recuperación y gestión de cobros.',
            icon: DollarSign,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/clientes/reportes/cobranza'
        },
        {
            title: 'Análisis de Cartera',
            description: 'Métricas de concentración, rotación y rentabilidad.',
            icon: BarChart3,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/clientes/reportes/analisis-cartera'
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
            transition: { type: 'spring' as const, stiffness: 100 }
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
                    Volver a Clientes
                </Button>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary uppercase tracking-widest mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Análisis Financiero</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Reportes de Cuentas x Cobrar
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Informes financieros y estados de cuenta para gestión de cobranza.
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
