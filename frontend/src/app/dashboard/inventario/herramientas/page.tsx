'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Printer,
    FileSpreadsheet,
    Edit,
    DollarSign,
    RotateCcw,
    Upload,
    Download,
    Calculator,
    Wrench,
    Tag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function InventoryToolsPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Imprimir Etiquetas',
            description: 'Generación de etiquetas de código de barras para productos.',
            icon: Printer,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/inventario/herramientas/etiquetas'
        },
        {
            title: 'Imprimir Catálogo de Productos',
            description: 'Exportar listado completo de productos en formato imprimible.',
            icon: FileSpreadsheet,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/herramientas/catalogo'
        },
        {
            title: 'Cambio de Código de Producto',
            description: 'Reasignación masiva de códigos internos.',
            icon: Edit,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/herramientas/cambio-codigo'
        },
        {
            title: 'Cambio de Precios',
            description: 'Actualización masiva de precios por categoría o marca.',
            icon: DollarSign,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/herramientas/cambio-precios'
        },
        {
            title: 'Reversar Entrada de Mercancía',
            description: 'Anulación de recepciones de inventario registradas.',
            icon: RotateCcw,
            iconColor: 'text-error',
            iconBgColor: 'bg-error/10',
            href: '/dashboard/inventario/herramientas/reversar-entrada'
        },
        {
            title: 'Importar y Actualizar Productos',
            description: 'Carga masiva desde archivo Excel o CSV.',
            icon: Upload,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/inventario/herramientas/importar-productos'
        },
        {
            title: 'Importar Precios',
            description: 'Actualización de precios mediante importación de archivo.',
            icon: Download,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/inventario/herramientas/importar-precios'
        },
        {
            title: 'Importar Costos',
            description: 'Carga de costos de adquisición desde archivo externo.',
            icon: DollarSign,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/herramientas/importar-costos'
        },
        {
            title: 'Importar Aranceles',
            description: 'Actualización de códigos arancelarios por importación.',
            icon: Tag,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/herramientas/importar-aranceles'
        },
        {
            title: 'Recálculo de Existencia',
            description: 'Reconstrucción de inventario desde movimientos históricos.',
            icon: Calculator,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/herramientas/recalculo'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
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
                    <Wrench className="w-4 h-4" />
                    <span>Utilidades del Sistema</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Herramientas
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Operaciones masivas, importaciones y utilidades de mantenimiento.
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
