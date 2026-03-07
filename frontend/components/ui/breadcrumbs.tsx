'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  productos: 'Productos',
  compras: 'Compras',
  inventario: 'Inventario',
  ventas: 'Ventas B2B',
  pos: 'Punto de Venta',
  trafico: 'Tráfico',
  clientes: 'Clientes',
  contabilidad: 'Contabilidad',
  reportes: 'Reportes',
  configuracion: 'Configuración',
  historial: 'Historial',
  // Sub-pages
  cxc: 'Cuentas por Cobrar',
  cobro: 'Registrar Cobro',
  transacciones: 'Transacciones',
  'estados-cuenta': 'Estados de Cuenta',
  anulaciones: 'Anulaciones',
  'libro-diario': 'Libro Diario',
  'libro-mayor': 'Libro Mayor',
  'plan-cuentas': 'Plan de Cuentas',
  'estados-financieros': 'Estados Financieros',
  conciliacion: 'Conciliación Bancaria',
  cierres: 'Cierres Contables',
  tesoreria: 'Tesorería',
  empresa: 'Mi Empresa',
  usuarios: 'Usuarios y Roles',
  parametros: 'Parámetros',
  aprobaciones: 'Aprobaciones',
  catalogos: 'Catálogos',
  notificaciones: 'Notificaciones',
  auditoria: 'Auditoría',
  sistema: 'Sistema',
  nuevo: 'Nuevo',
  editar: 'Editar',
  ajustes: 'Ajustes',
  conteos: 'Conteos',
  transferencias: 'Transferencias',
};

function getSegmentLabel(segment: string): string {
  return ROUTE_LABELS[segment] ?? segment;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on the dashboard home page
  if (pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items from path segments
  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = getSegmentLabel(segment);
    const isLast = index === segments.length - 1;

    return { segment, href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-sm mb-4">
      {crumbs.map((crumb, index) => {
        const isFirst = index === 0;

        return (
          <div key={crumb.href} className="flex items-center gap-1.5">
            {/* Chevron separator before every item except the first */}
            {!isFirst && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-[#444]" />
            )}

            {crumb.isLast ? (
              // Current page: not clickable, bolder text
              <span
                className={cn(
                  'text-gray-900 dark:text-white font-medium',
                  isFirst && 'flex items-center gap-1.5'
                )}
              >
                {isFirst && (
                  <Home className="h-4 w-4 text-gray-400 dark:text-[#666]" />
                )}
                {crumb.label}
              </span>
            ) : (
              // Clickable breadcrumb link
              <Link
                href={crumb.href}
                className={cn(
                  'text-gray-500 dark:text-[#888] hover:text-gray-700 dark:hover:text-white transition-colors',
                  isFirst && 'flex items-center gap-1.5'
                )}
              >
                {isFirst && (
                  <Home className="h-4 w-4 text-gray-400 dark:text-[#666]" />
                )}
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
