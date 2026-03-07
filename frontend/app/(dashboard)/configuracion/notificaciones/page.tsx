'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
} from '@heroui/react';
import { CustomModal, CustomModalHeader, CustomModalBody, CustomModalFooter } from '@/components/ui/custom-modal';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  BellRing,
  Edit,
  ChevronDown,
  Users,
  User,
  AtSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useStore } from '@/hooks/use-store';
import {
  getNotificationConfigsData,
  subscribeNotificationConfigs,
  updateNotificationConfig,
} from '@/lib/mock-data/configuration';
import type { NotificationConfig, NotificationChannel } from '@/lib/types/configuration';

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  ventas: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  cxc: { bg: 'bg-violet-500/10', text: 'text-violet-500' },
  inventario: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  compras: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  contabilidad: { bg: 'bg-teal-500/10', text: 'text-teal-500' },
  clientes: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
};

const MODULE_LABELS: Record<string, string> = {
  ventas: 'Ventas',
  cxc: 'Cuentas por Cobrar',
  inventario: 'Inventario',
  compras: 'Compras',
  contabilidad: 'Contabilidad',
  clientes: 'Clientes',
};

const CHANNEL_ICONS: Record<NotificationChannel['type'], React.ElementType> = {
  email: Mail,
  in_app: BellRing,
  sms: Smartphone,
};

const CHANNEL_LABELS: Record<NotificationChannel['type'], string> = {
  email: 'Correo',
  in_app: 'En App',
  sms: 'SMS',
};

const RECIPIENT_ICONS: Record<string, React.ElementType> = {
  role: Users,
  user: User,
  custom: AtSign,
};

export default function NotificacionesPage() {
  const router = useRouter();

  const notifications = useStore(subscribeNotificationConfigs, getNotificationConfigsData);

  const [isOpen, setIsOpen] = useState(false);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingNotification, setEditingNotification] = useState<NotificationConfig | null>(null);

  const handleToggleActive = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;
    const newActive = !notification.isActive;
    updateNotificationConfig(id, { isActive: newActive });
    toast.success(newActive ? 'Notificación activada' : 'Notificación desactivada', {
      id: `toggle-notif-${id}`,
      description: notification.eventLabel,
    });
  };

  const handleEditNotification = (notification: NotificationConfig) => {
    setEditingNotification(notification);
    setIsOpen(true);
  };

  const handleSaveNotification = () => {
    toast.success('Configuración de notificación actualizada', {
      description: editingNotification?.eventLabel,
    });
    setIsOpen(false);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notificaciones</h1>
            <p className="text-sm text-gray-500 dark:text-[#888888]">{notifications.length} eventos configurados</p>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Evento</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Módulo</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Canales</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Destinatarios</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Activo</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-[#888888]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {notifications.map((notification, index) => {
                const isExpanded = expandedRow === notification.id;
                const moduleColor = MODULE_COLORS[notification.module] || { bg: 'bg-gray-500/10', text: 'text-gray-500' };

                return (
                  <motion.tr
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer"
                    onClick={() => setExpandedRow(isExpanded ? null : notification.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{notification.eventLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', moduleColor.bg, moduleColor.text)}>
                        {MODULE_LABELS[notification.module] || notification.module}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {notification.channels.map((channel) => {
                          const Icon = CHANNEL_ICONS[channel.type];
                          return (
                            <span
                              key={channel.type}
                              title={`${CHANNEL_LABELS[channel.type]}: ${channel.enabled ? 'Habilitado' : 'Deshabilitado'}`}
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-lg',
                                channel.enabled
                                  ? 'bg-brand-500/10 text-brand-600'
                                  : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#666666]'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {notification.recipients.map((recipient, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-gray-100 dark:bg-[#2a2a2a] px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400"
                          >
                            {recipient.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={notification.isActive}
                        onCheckedChange={() => handleToggleActive(notification.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditNotification(notification)}
                        className="flex mx-auto h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-[#666666] transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-600 dark:hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded Row Details (rendered below table as overlaid section for simplicity) */}
        {expandedRow && (
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] p-4">
            {(() => {
              const notification = notifications.find((n) => n.id === expandedRow);
              if (!notification) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notification.description}</p>

                  {/* Channel details */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Canales de Notificación</h4>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {notification.channels.map((channel) => {
                        const Icon = CHANNEL_ICONS[channel.type];
                        return (
                          <div
                            key={channel.type}
                            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{CHANNEL_LABELS[channel.type]}</span>
                            </div>
                            <Switch defaultChecked={channel.enabled} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recipients */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Destinatarios</h4>
                    <div className="flex flex-wrap gap-2">
                      {notification.recipients.map((recipient, idx) => {
                        const Icon = RECIPIENT_ICONS[recipient.type] || User;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-3 py-1.5"
                          >
                            <Icon className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{recipient.label}</span>
                            <span className={cn(
                              'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                              recipient.type === 'role' ? 'bg-blue-500/10 text-blue-500' :
                              recipient.type === 'user' ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-amber-500/10 text-amber-500'
                            )}>
                              {recipient.type === 'role' ? 'Rol' : recipient.type === 'user' ? 'Usuario' : 'Custom'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Edit Notification Modal */}
      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Notificación</h2>
              <p className="text-sm text-gray-500 dark:text-[#888888]">{editingNotification?.eventLabel}</p>
            </div>
          </div>
        </CustomModalHeader>
        <CustomModalBody className="space-y-4">
          {editingNotification && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">{editingNotification.description}</p>

              {/* Channels */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Canales</h4>
                <div className="space-y-2">
                  {editingNotification.channels.map((channel) => {
                    const Icon = CHANNEL_ICONS[channel.type];
                    return (
                      <div
                        key={channel.type}
                        className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{CHANNEL_LABELS[channel.type]}</p>
                            <p className="text-xs text-gray-500 dark:text-[#888888]">
                              {channel.type === 'email' ? 'Envía un correo electrónico' :
                               channel.type === 'in_app' ? 'Notificación dentro de la aplicación' :
                               'Mensaje de texto SMS'}
                            </p>
                          </div>
                        </div>
                        <Switch defaultChecked={channel.enabled} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Destinatarios</h4>
                <div className="space-y-2">
                  {editingNotification.recipients.map((recipient, idx) => {
                    const Icon = RECIPIENT_ICONS[recipient.type] || User;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3"
                      >
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{recipient.label}</span>
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          recipient.type === 'role' ? 'bg-blue-500/10 text-blue-500' :
                          recipient.type === 'user' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-amber-500/10 text-amber-500'
                        )}>
                          {recipient.type === 'role' ? 'Rol' : recipient.type === 'user' ? 'Usuario' : 'Custom'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CustomModalBody>
        <CustomModalFooter>
          <Button variant="light" onPress={() => setIsOpen(false)}>Cancelar</Button>
          <Button color="primary" onPress={handleSaveNotification} className="bg-brand-600">
            Guardar Cambios
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
