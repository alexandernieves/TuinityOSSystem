'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Wrench,
    Printer,
    Edit,
    Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function ClientesHerramientasPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Imprimir Estado de Cuenta en Lote',
            description: 'Generación masiva de estados de cuenta para múltiples clientes.',
            icon: Printer,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/clientes/herramientas/imprimir-lote'
        },
        {
            title: 'Cambio de Código de Cliente',
            description: 'Reasignación de códigos internos de clientes.',
            icon: Edit,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/clientes/herramientas/cambio-codigo'
        },
        {
            title: 'Recálculo de Saldo',
            description: 'Reconstrucción de saldos desde transacciones históricas.',
            icon: Calculator,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/clientes/herramientas/recalculo-saldo'
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
                    <Wrench className="w-4 h-4" />
                    <span>Utilidades del Sistema</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Herramientas
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Utilidades de mantenimiento y operaciones masivas para clientes.
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
