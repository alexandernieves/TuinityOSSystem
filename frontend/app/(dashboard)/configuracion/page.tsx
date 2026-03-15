'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Building2,
  Users,
  DollarSign,
  GitBranch,
  BookOpen,
  Bell,
  Shield,
  Server,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { cn } from '@/lib/utils/cn';

const CONFIG_SECTIONS = [
  {
    id: 'empresa',
    title: 'Mi Empresa',
    description: 'Datos legales, sucursales y configuración fiscal',
    icon: Building2,
    href: '/configuracion/empresa',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    count: 3,
    countLabel: 'sucursales',
  },
  {
    id: 'usuarios',
    title: 'Usuarios y Roles',
    description: 'Gestión de usuarios, plantillas de roles y permisos',
    icon: Users,
    href: '/configuracion/usuarios',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    count: 8,
    countLabel: 'usuarios',
  },
  {
    id: 'parametros',
    title: 'Parámetros Comerciales',
    description: 'Niveles de precio, comisiones, impuestos y numeración',
    icon: DollarSign,
    href: '/configuracion/parametros',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    count: 5,
    countLabel: 'niveles',
  },
  {
    id: 'aprobaciones',
    title: 'Flujos de Aprobación',
    description: 'Reglas de aprobación para ventas, devoluciones y anulaciones',
    icon: GitBranch,
    href: '/configuracion/aprobaciones',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    count: 6,
    countLabel: 'flujos',
  },
  {
    id: 'catalogos',
    title: 'Catálogos Maestros',
    description: 'Países, marcas, categorías, bancos y más',
    icon: BookOpen,
    href: '/configuracion/catalogos',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    count: 10,
    countLabel: 'catálogos',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones',
    description: 'Configuración de alertas por email, app y SMS',
    icon: Bell,
    href: '/configuracion/notificaciones',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    count: 8,
    countLabel: 'eventos',
  },
  {
    id: 'auditoria',
    title: 'Auditoría y Seguridad',
    description: 'Log de auditoría, sesiones activas y políticas',
    icon: Shield,
    href: '/configuracion/auditoria',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    count: 12,
    countLabel: 'registros',
  },
  {
    id: 'sistema',
    title: 'Sistema',
    description: 'Versión, integraciones, backups e importación/exportación',
    icon: Server,
    href: '/configuracion/sistema',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    count: 5,
    countLabel: 'integraciones',
  },
];

export default function ConfiguracionPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <Settings className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-gray-500 dark:text-[#888888]">Usuarios, roles, permisos y parámetros del sistema</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar navigation */}
        <div className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {CONFIG_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  router.push(section.href);
                }}
                onMouseEnter={() => setActiveSection(section.id)}
                onMouseLeave={() => setActiveSection(null)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium transition-all',
                  activeSection === section.id
                    ? 'bg-white text-gray-900 dark:text-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)]'
                    : 'text-gray-600 dark:text-[#888888] hover:bg-gray-50'
                )}
              >
                <section.icon className={cn('h-4 w-4 shrink-0', activeSection === section.id ? section.color : 'text-gray-400 dark:text-[#666666]')} />
                <span className="truncate">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right content area - grid of section cards */}
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {CONFIG_SECTIONS.map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(section.href)}
                onMouseEnter={() => setActiveSection(section.id)}
                onMouseLeave={() => setActiveSection(null)}
                className={cn(
                  'group flex items-start gap-4 rounded-[12px] bg-white p-5 text-left transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.2)] hover:bg-[#f7f7f7]',
                  activeSection === section.id && 'ring-2 ring-brand-500 ring-offset-2'
                )}
              >
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', section.bgColor)}>
                  <section.icon className={cn('h-5 w-5', section.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 items-center rounded-full bg-gray-100 dark:bg-[#2a2a2a] px-2 text-xs font-medium text-gray-600 dark:text-[#888888]">
                        {section.count} {section.countLabel}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-[#444444] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-[#888888] line-clamp-2">{section.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

