'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Layers,
    Tag,
    Globe,
    Cpu,
    Receipt,
    Barcode,
    MapPin,
    Users,
    FolderCog
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, ModuleCardProps } from '@/components/ui/ModuleCard';

export default function FileSettingsPage() {
    const router = useRouter();

    const modules: ModuleCardProps[] = [
        {
            title: 'Registro de Grupos y Subgrupos',
            description: 'Clasificación jerárquica de productos.',
            icon: Layers,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/inventario/archivos/grupos'
        },
        {
            title: 'Registro de Marcas',
            description: 'Gestión de fabricantes y marcas comerciales.',
            icon: Tag,
            iconColor: 'text-brand-secondary',
            iconBgColor: 'bg-brand-secondary/10',
            href: '/dashboard/inventario/archivos/marcas'
        },
        {
            title: 'Registro de País de Origen',
            description: 'Catálogo de países para importaciones.',
            icon: Globe,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/archivos/paises'
        },
        {
            title: 'Registro de Composición',
            description: 'Detalles de materiales y componentes.',
            icon: Cpu,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/archivos/composicion'
        },
        {
            title: 'Registro de Aranceles',
            description: 'Códigos arancelarios y tasas de importación.',
            icon: Receipt,
            iconColor: 'text-brand-accent',
            iconBgColor: 'bg-brand-accent/10',
            href: '/dashboard/inventario/archivos/aranceles'
        },
        {
            title: 'Registro de Código de Barra',
            description: 'Asignación y gestión de EAN/UPC.',
            icon: Barcode,
            iconColor: 'text-brand-primary',
            iconBgColor: 'bg-brand-primary/10',
            href: '/dashboard/inventario/archivos/barras'
        },
        {
            title: 'Registro de Ubicación',
            description: 'Mapeo de pasillos, estantes y zonas de almacén.',
            icon: MapPin,
            iconColor: 'text-success',
            iconBgColor: 'bg-success/10',
            href: '/dashboard/inventario/archivos/ubicaciones'
        },
        {
            title: 'Registro de Proveedor',
            description: 'Base de datos de proveedores y contactos.',
            icon: Users,
            iconColor: 'text-warning',
            iconBgColor: 'bg-warning/10',
            href: '/dashboard/inventario/archivos/proveedores'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    } as const;

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 100 }
        }
    } as const;

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
                    <FolderCog className="w-4 h-4" />
                    <span>Configuración Maestra</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-2">
                    Administración de Archivos
                </h1>
                <p className="text-text-secondary text-lg max-w-3xl font-light">
                    Mantenimiento de catálogos base, clasificaciones y parámetros del sistema.
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
