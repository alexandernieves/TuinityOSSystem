'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
    dashboard: 'Resumen',
    inventario: 'Inventario',
    ventas: 'Ventas',
    clientes: 'Clientes',
    productos: 'Productos',
    trafico: 'Tráfico',
    pos: 'Punto de Venta',
    reportes: 'Reportes',
    configuracion: 'Configuración',
    ajustes: 'Ajustes',
    transferencias: 'Transferencias',
    valoracion: 'Valoración',
    nueva: 'Nueva',
    nuevo: 'Nuevo',
    cxc: 'Cuentas por Cobrar',
    importar: 'Importar',
};

// Helper to check if string is UUID or MongoID looking
const isId = (str: string) => /^[0-9a-fA-F-]{10,36}$/.test(str);

export const Breadcrumb: React.FC = () => {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    // Filter out "dashboard" if it's the root for cleaner breadcrumbs
    const displayPaths = paths.filter(p => p !== 'dashboard');

    if (displayPaths.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 mb-6 text-sm font-medium">
            <Link
                href="/dashboard"
                className="text-brand-secondary hover:underline transition-colors flex items-center"
            >
                Dashboard
            </Link>

            {displayPaths.map((path, index) => {
                const href = `/${paths.slice(0, paths.indexOf(path) + 1).join('/')}`;
                const isLast = index === displayPaths.length - 1;

                // Format label: capitalize or map
                let label = routeLabels[path.toLowerCase()] || path.charAt(0).toUpperCase() + path.slice(1);
                if (isId(path)) label = 'Detalle';

                return (
                    <React.Fragment key={path}>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        {isLast ? (
                            <span className="text-text-secondary">
                                {label}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="text-brand-secondary hover:underline transition-colors"
                            >
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
