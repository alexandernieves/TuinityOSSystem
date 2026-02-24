'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    FileText,
    Search,
    DollarSign,
    Inbox,
    ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function PurchasesModulesPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Registro de Ordenes de Compra',
            description: 'Crear nuevas solicitudes de compra a proveedores.',
            icon: FileText,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/inventario/compras/ordenes'
        },
        {
            title: 'Consulta de Orden de Compra',
            description: 'Ver historial y estado de órdenes emitidas.',
            icon: Search,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/compras/consulta-ordenes'
        },
        {
            title: 'Consulta de Costos por Entrada',
            description: 'Análisis detallado de costos de mercancía recibida.',
            icon: DollarSign,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/compras/costos'
        },
        {
            title: 'Consulta de Entradas',
            description: 'Registro de recepciones de mercancía en almacenes.',
            icon: Inbox,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/compras/entradas'
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
                    Volver a Inventario
                </Button>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary uppercase tracking-widest mb-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Módulo de Compras</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Registro de Compras
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Gestión integral de adquisiciones, órdenes y recepción de mercancía.
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
