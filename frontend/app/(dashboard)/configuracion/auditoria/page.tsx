'use client';

import { useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Shield,
  Search,
  Clock,
  Monitor,
  LogOut,
  ChevronDown,
  Lock,
  Key,
  Save,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useStore } from '@/hooks/use-store';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  getAuditLog,
  getAuditLogData,
  subscribeAuditLog,
  getSecurityPoliciesData,
  subscribeSecurityPolicies,
  updateSecurityPolicies,
} from '@/lib/mock-data/configuration';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
} from '@/lib/types/configuration';
import type { AuditAction, AuditLogEntry, ActiveSession } from '@/lib/types/configuration';
import { ROLE_LABELS } from '@/lib/constants/roles';
import { api } from '@/lib/services/api';
import { useEffect } from 'react';

const TABS = [
  { id: 'log', label: 'Log de Auditoría' },
  { id: 'sesiones', label: 'Sesiones Activas' },
  { id: 'politicas', label: 'Políticas de Seguridad' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const ACTIONS: { value: AuditAction; label: string }[] = Object.entries(AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value: value as AuditAction, label })
);

export default function AuditoriaPage() {
  const router = useRouter();
  const { checkPermission, user: currentUser } = useAuth();
  const canViewAuditLog = checkPermission('canViewAuditLog');

  const auditLogAll = useStore(subscribeAuditLog, getAuditLogData);
  const securityPolicies = useStore(subscribeSecurityPolicies, getSecurityPoliciesData);

  const [realActiveSessions, setRealActiveSessions] = useState<ActiveSession[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('log');

  const fetchSessions = async () => {
    try {
      const sessions = await api.getSessions();
      if (sessions) {
        setRealActiveSessions(sessions.map((s: any) => ({
          id: s.id,
          userId: s.userId?.id || s.userId,
          userName: s.user?.name || s.user?.email || 'Usuario desconocido',
          userRole: s.user?.role || 'vendedor',
          loginAt: s.loginAt,
          lastActivity: s.lastActivity,
          ipAddress: s.ipAddress,
          browser: s.userAgent || 'Desconocido',
          isCurrent: s.id === (currentUser as any)?.sessionId || false 
        })));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Error al cargar sesiones');
    }
  };

  useEffect(() => {
    if (activeTab === 'sesiones') {
      fetchSessions();
    }
  }, [activeTab]);

  // Derived unique modules/users from the store-backed audit log
  const UNIQUE_MODULES = useMemo(() => [...new Set(auditLogAll.map((e) => e.module))].map((m) => ({
    value: m,
    label: auditLogAll.find((e) => e.module === m)?.moduleLabel || m,
  })), [auditLogAll]);

  const UNIQUE_USERS = useMemo(() => [...new Set(auditLogAll.map((e) => e.userId))].map((id) => ({
    value: id,
    label: auditLogAll.find((e) => e.userId === id)?.userName || id,
  })), [auditLogAll]);

  // Audit log filters
  const [filterUser, setFilterUser] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expandedLogEntry, setExpandedLogEntry] = useState<string | null>(null);

  // Security policies form
  const [policies, setPolicies] = useState({ ...securityPolicies });

  // Filtered audit log
  const auditEntries = useMemo(() => {
    return getAuditLog({
      userId: filterUser || undefined,
      module: filterModule || undefined,
      action: filterAction || undefined,
    });
  }, [filterUser, filterModule, filterAction]);

  const handleCloseSession = async (sessionId: string, userName: string) => {
    try {
      await api.logoutSession(sessionId);
      await fetchSessions();
      toast.success('Sesión cerrada', {
        description: `Se ha cerrado la sesión de ${userName}`,
      });
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleSavePolicies = () => {
    updateSecurityPolicies(policies);
    toast.success('Políticas de seguridad actualizadas', {
      description: 'Los cambios se han guardado correctamente.',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-PA', {
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Auditoría y Seguridad</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">Log de actividad, sesiones y políticas de seguridad</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-[#141414] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-[#888888] hover:text-gray-700 dark:hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Audit Log Tab */}
        {activeTab === 'log' && (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="h-8 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              >
                <option value="">Todos los usuarios</option>
                {UNIQUE_USERS.map((user) => (
                  <option key={user.value} value={user.value}>{user.label}</option>
                ))}
              </select>

              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="h-8 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              >
                <option value="">Todos los módulos</option>
                {UNIQUE_MODULES.map((mod) => (
                  <option key={mod.value} value={mod.value}>{mod.label}</option>
                ))}
              </select>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="h-8 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              >
                <option value="">Todas las acciones</option>
                {ACTIONS.map((action) => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>

              {(filterUser || filterModule || filterAction) && (
                <button
                  onClick={() => {
                    setFilterUser('');
                    setFilterModule('');
                    setFilterAction('');
                  }}
                  className="flex h-8 items-center gap-1 px-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Audit Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Fecha/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Usuario</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Módulo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {auditEntries.map((entry, index) => {
                      const actionColor = AUDIT_ACTION_COLORS[entry.action];
                      const isExpanded = expandedLogEntry === entry.id;

                      return (
                        <Fragment key={entry.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => entry.changes ? setExpandedLogEntry(isExpanded ? null : entry.id) : undefined}
                            className={cn(
                              'transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]',
                              entry.changes && 'cursor-pointer'
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {entry.changes && (
                                  <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                                )}
                                <span className="whitespace-nowrap text-xs text-gray-500 dark:text-[#888888]">{formatTimestamp(entry.timestamp)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.userName}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', actionColor.bg, actionColor.text)}>
                                {AUDIT_ACTION_LABELS[entry.action]}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{entry.moduleLabel}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate block">{entry.description}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-gray-500 dark:text-[#888888]">{entry.ipAddress}</span>
                            </td>
                          </motion.tr>
                          {/* Expanded change details */}
                          {isExpanded && entry.changes && (
                            <tr key={`${entry.id}-details`}>
                              <td colSpan={6} className="bg-gray-50 dark:bg-[#0a0a0a] px-8 py-3">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <h4 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">Cambios realizados:</h4>
                                  <div className="space-y-2">
                                    {entry.changes.map((change, idx) => (
                                      <div key={idx} className="flex items-center gap-3 text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{change.fieldLabel}:</span>
                                        <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-500 line-through">{change.oldValue}</span>
                                        <ArrowRightLeft className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500">{change.newValue}</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-[#888888]">
              Mostrando {auditEntries.length} registros
            </div>
          </motion.div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sesiones' && (
          <motion.div
            key="sesiones"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Inicio Sesión</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Última Actividad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Navegador</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                    {realActiveSessions.map((session, index) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{session.userName}</span>
                            {session.isCurrent && (
                              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">Actual</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{ROLE_LABELS[session.userRole]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-[#888888]">{formatTimestamp(session.loginAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-[#888888]">{formatTimestamp(session.lastActivity)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500 dark:text-[#888888]">{session.ipAddress}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#888888]">
                            <Monitor className="h-3.5 w-3.5" />
                            {session.browser}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!session.isCurrent ? (
                            <button
                              onClick={() => handleCloseSession(session.id, session.userName)}
                              className="flex mx-auto items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:hover:bg-red-900"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Cerrar Sesión
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-[#666666]">Sesión actual</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Policies Tab */}
        {activeTab === 'politicas' && (
          <motion.div
            key="politicas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Políticas de Contraseña y Sesión</h2>
              </div>

              <div className="space-y-6">
                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-[#2a2a2a] pb-2">Contraseñas</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Longitud mínima</label>
                      <input
                        type="number"
                        value={policies.minPasswordLength}
                        onChange={(e) => setPolicies({ ...policies, minPasswordLength: parseInt(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Expiración de contraseña (días)</label>
                      <input
                        type="number"
                        value={policies.passwordExpirationDays}
                        onChange={(e) => setPolicies({ ...policies, passwordExpirationDays: parseInt(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Requerir mayúsculas</p>
                        <p className="text-xs text-gray-500 dark:text-[#888888]">Al menos una letra mayúscula</p>
                      </div>
                      <Switch
                        checked={policies.requireUppercase}
                        onCheckedChange={(v) => setPolicies({ ...policies, requireUppercase: v as boolean })}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Requerir números</p>
                        <p className="text-xs text-gray-500 dark:text-[#888888]">Al menos un dígito numérico</p>
                      </div>
                      <Switch
                        checked={policies.requireNumbers}
                        onCheckedChange={(v) => setPolicies({ ...policies, requireNumbers: v as boolean })}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Requerir caracteres especiales</p>
                        <p className="text-xs text-gray-500 dark:text-[#888888]">Al menos un carácter especial (!@#$%...)</p>
                      </div>
                      <Switch
                        checked={policies.requireSpecialChars}
                        onCheckedChange={(v) => setPolicies({ ...policies, requireSpecialChars: v as boolean })}
                      />
                    </div>
                  </div>
                </div>

                {/* Session Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-[#2a2a2a] pb-2">Sesiones y Bloqueo</h3>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Timeout de sesión (min)</label>
                      <input
                        type="number"
                        value={policies.sessionTimeoutMinutes}
                        onChange={(e) => setPolicies({ ...policies, sessionTimeoutMinutes: parseInt(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Intentos máximos de login</label>
                      <input
                        type="number"
                        value={policies.maxLoginAttempts}
                        onChange={(e) => setPolicies({ ...policies, maxLoginAttempts: parseInt(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-[#888888]">Duración bloqueo (min)</label>
                      <input
                        type="number"
                        value={policies.lockoutDurationMinutes}
                        onChange={(e) => setPolicies({ ...policies, lockoutDurationMinutes: parseInt(e.target.value) || 0 })}
                        className="h-10 w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] px-3 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Autenticación de Dos Factores (2FA)</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-[#888888]">Requiere un código adicional al iniciar sesión</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">Próximamente</span>
                    <Switch
                      checked={policies.twoFactorEnabled}
                      disabled
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                  <button
                    onClick={handleSavePolicies}
                    className="flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                  >
                    <Save className="h-4 w-4" />
                    Guardar Políticas
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
