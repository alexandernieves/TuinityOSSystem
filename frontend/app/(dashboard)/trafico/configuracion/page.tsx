'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  ArrowLeft,
  MapPin,
  Ship,
  Globe,
  Building2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStore } from '@/hooks/use-store';
import {
  getPortsData,
  subscribePorts,
  getCarriersData,
  subscribeCarriers,
  getDestinationRequirementsData,
  subscribeDestinationRequirements,
  getRelatedCompaniesData,
  subscribeRelatedCompanies,
} from '@/lib/mock-data/traffic';

type ConfigTab = 'puertos' | 'navieras' | 'requisitos' | 'empresas';

const CONFIG_TABS: { key: ConfigTab; label: string; icon: typeof MapPin }[] = [
  { key: 'puertos', label: 'Puertos', icon: MapPin },
  { key: 'navieras', label: 'Navieras', icon: Ship },
  { key: 'requisitos', label: 'Requisitos por Destino', icon: Globe },
  { key: 'empresas', label: 'Empresas Relacionadas', icon: Building2 },
];

const CARRIER_TYPE_LABELS: Record<string, string> = {
  naviera: 'Naviera',
  aerolinea: 'Aerolinea',
  terrestre: 'Terrestre',
};

export default function ConfiguracionTraficoPage() {
  const router = useRouter();
  const { checkPermission } = useAuth();
  const canConfigure = checkPermission('canConfigureTrafico');

  const ports = useStore(subscribePorts, useCallback(() => getPortsData(), []));
  const carriers = useStore(subscribeCarriers, useCallback(() => getCarriersData(), []));
  const destinationRequirements = useStore(subscribeDestinationRequirements, useCallback(() => getDestinationRequirementsData(), []));
  const relatedCompanies = useStore(subscribeRelatedCompanies, useCallback(() => getRelatedCompaniesData(), []));

  const [activeTab, setActiveTab] = useState<ConfigTab>('puertos');

  if (!canConfigure) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Settings className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
          Sin permisos
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#888888]">
          No tienes permiso para acceder a la configuracion de trafico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/trafico')}
          className="flex w-fit items-center gap-1.5 text-sm text-gray-500 dark:text-[#888888] hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Trafico
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Configuracion de Trafico
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">
              Puertos, navieras, requisitos de destino y empresas relacionadas
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-[#2a2a2a]">
        {CONFIG_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-500 dark:text-[#888888] hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* Puertos */}
          {activeTab === 'puertos' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Codigo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Pais
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {ports.map((port, idx) => (
                      <motion.tr
                        key={port.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-sky-500/10 px-2 py-0.5 font-mono text-sm font-medium text-sky-600 dark:text-sky-400">
                            {port.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {port.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {port.country}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 text-center text-xs text-gray-500 dark:text-[#888]">
                {ports.length} puertos registrados
              </div>
            </div>
          )}

          {/* Navieras */}
          {activeTab === 'navieras' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {carriers.map((carrier, idx) => (
                      <motion.tr
                        key={carrier.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {carrier.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                            {CARRIER_TYPE_LABELS[carrier.type] ?? carrier.type}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 text-center text-xs text-gray-500 dark:text-[#888]">
                {carriers.length} navieras registradas
              </div>
            </div>
          )}

          {/* Requisitos por Destino */}
          {activeTab === 'requisitos' && (
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Pais
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        DMC
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Bill of Lading
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Cert. Libre Venta
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Cert. Origen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888]">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {destinationRequirements.map((req, idx) => (
                      <motion.tr
                        key={req.country}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {req.country}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.requiresDMC ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.requiresBL ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.requiresFreeSaleCert ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {req.requiresOriginCert ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-gray-300 dark:text-gray-600" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#888888] max-w-xs">
                          {req.notes ?? '\u2014'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2.5 text-center text-xs text-gray-500 dark:text-[#888]">
                {destinationRequirements.length} destinos configurados
              </div>
            </div>
          )}

          {/* Empresas Relacionadas */}
          {activeTab === 'empresas' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCompanies.map((company, idx) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950">
                      <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {company.name}
                      </h4>
                      <span className="inline-flex rounded-md bg-gray-100 dark:bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-gray-500 dark:text-[#888888]">
                        {company.relationship}
                      </span>
                    </div>
                  </div>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500 dark:text-[#888888]">RUC</dt>
                      <dd className="font-mono text-xs text-gray-900 dark:text-white">
                        {company.ruc}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500 dark:text-[#888888]">Pais</dt>
                      <dd className="text-xs text-gray-900 dark:text-white">{company.country}</dd>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                      <dt className="text-xs text-gray-500 dark:text-[#888888] mb-0.5">
                        Direccion
                      </dt>
                      <dd className="text-xs text-gray-700 dark:text-gray-300">
                        {company.address}
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
