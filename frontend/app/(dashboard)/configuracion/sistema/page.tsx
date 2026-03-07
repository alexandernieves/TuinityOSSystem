'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Server,
  Download,
  Upload,
  Database,
  Trash2,
  RefreshCw,
  Settings,
  FileCheck,
  Ship,
  Landmark,
  Mail,
  Bot,
  Zap,
  Clock,
  Code,
  HardDrive,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useStore } from '@/hooks/use-store';
import {
  getSystemInfoData,
  subscribeSystemInfo,
  getIntegrationsData,
  subscribeIntegrations,
} from '@/lib/mock-data/configuration';
import { INTEGRATION_STATUS_CONFIG } from '@/lib/types/configuration';
import type { Integration } from '@/lib/types/configuration';

const INTEGRATION_ICONS: Record<string, React.ElementType> = {
  FileCheck,
  Ship,
  Landmark,
  Mail,
  Bot,
};

const ENV_BADGES: Record<string, { bg: string; text: string }> = {
  development: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  staging: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  production: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
};

const ENV_LABELS: Record<string, string> = {
  development: 'Desarrollo',
  staging: 'Staging',
  production: 'Producción',
};

export default function SistemaPage() {
  const router = useRouter();

  const systemInfo = useStore(subscribeSystemInfo, getSystemInfoData);
  const integrations = useStore(subscribeIntegrations, getIntegrationsData);

  const envBadge = ENV_BADGES[systemInfo.environment] || ENV_BADGES.development;

  const handleExport = () => {
    toast.success('Exportación iniciada', {
      description: 'Se iniciará la descarga del archivo de exportación.',
    });
  };

  const handleImport = () => {
    toast.info('Función próximamente disponible', {
      description: 'La importación de datos estará disponible en una próxima actualización.',
    });
  };

  const handleBackup = () => {
    toast.success('Backup iniciado', {
      description: 'Se está creando un respaldo de la base de datos.',
    });
  };

  const handleClearCache = () => {
    toast.success('Caché limpiada exitosamente', {
      description: 'Todos los datos en caché han sido eliminados.',
    });
  };

  const handleConfigureIntegration = (integration: Integration) => {
    toast.info(`Configurar ${integration.name}`, {
      description: 'Funcionalidad de configuración próximamente disponible.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-PA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Back link and header */}
      <div>
        <button
          onClick={() => router.push('/configuracion')}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-[#888888] transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Configuración
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Server className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sistema</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Información del sistema, integraciones y mantenimiento</p>
          </div>
        </div>
      </div>

      {/* System Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Code className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información del Sistema</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Versión', value: systemInfo.version, icon: Zap },
            { label: 'Build', value: systemInfo.buildNumber, icon: Code },
            { label: 'Entorno', value: ENV_LABELS[systemInfo.environment] || systemInfo.environment, icon: Globe, badge: envBadge },
            { label: 'Último Deploy', value: formatDate(systemInfo.lastDeploy), icon: Clock },
            { label: 'Next.js', value: `v${systemInfo.nextjsVersion}`, icon: Code },
            { label: 'Node.js', value: `v${systemInfo.nodeVersion}`, icon: Server },
            { label: 'Base de Datos', value: systemInfo.database, icon: HardDrive },
            { label: 'Uptime', value: systemInfo.uptime, icon: Clock },
          ].map((item, index) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-3"
            >
              <item.icon className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-[#888888]">{item.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.value}</p>
                  {item.badge && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', item.badge.bg, item.badge.text)}>
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Import / Export */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <RefreshCw className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Importar / Exportar</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Exportar Datos</p>
              <p className="text-xs text-gray-500 dark:text-[#888888]">Descargar todos los datos del sistema en formato JSON</p>
            </div>
            <button
              onClick={handleExport}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#0a0a0a]"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Importar Datos</p>
              <p className="text-xs text-gray-500 dark:text-[#888888]">Cargar datos desde un archivo de respaldo</p>
            </div>
            <button
              onClick={handleImport}
              className="flex h-9 items-center gap-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#0a0a0a]"
            >
              <Upload className="h-4 w-4" />
              Importar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Backup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Database className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Respaldo de Datos</h2>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Último Respaldo</p>
            <p className="text-xs text-gray-500 dark:text-[#888888]">25/02/2026 03:00 AM (automático)</p>
          </div>
          <button
            onClick={handleBackup}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            <Database className="h-4 w-4" />
            Crear Backup
          </button>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Integraciones</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration, index) => {
            const IconComponent = INTEGRATION_ICONS[integration.icon] || Settings;
            const statusConfig = INTEGRATION_STATUS_CONFIG[integration.status];

            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a]">
                    <IconComponent className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig.bg, statusConfig.text)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                    {integration.status === 'activo' ? 'Activo' :
                     integration.status === 'inactivo' ? 'Inactivo' :
                     integration.status === 'error' ? 'Error' : 'Pendiente'}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-[#888888] line-clamp-2">{integration.description}</p>

                {integration.lastSync && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#666666]">
                    <Clock className="h-3 w-3" />
                    Última sincronización: {formatDate(integration.lastSync)}
                  </p>
                )}

                <button
                  onClick={() => handleConfigureIntegration(integration)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Configurar
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Cache */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Trash2 className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Caché del Sistema</h2>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Limpiar Caché</p>
            <p className="text-xs text-gray-500 dark:text-[#888888]">Elimina datos temporales y fuerza la recarga de configuraciones</p>
          </div>
          <button
            onClick={handleClearCache}
            className="flex h-9 items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:hover:bg-red-900"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar Caché
          </button>
        </div>
      </motion.div>
    </div>
  );
}
