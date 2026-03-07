'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShoppingCart,
  AlertCircle,
  CircleDollarSign,
  AlertTriangle,
  Ship,
  Calendar,
  CreditCard,
  Clock,
  BellOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType =
  | 'order'
  | 'approval'
  | 'payment'
  | 'inventory'
  | 'traffic'
  | 'system'
  | 'credit'
  | 'overdue'
  | 'escalation';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  icon: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'order',
    title: 'Nuevo pedido PED-00024',
    description: 'WORLD DUTY FREE GROUP solicitó cotización por $12,450',
    time: 'Hace 5 min',
    isRead: false,
    icon: 'ShoppingCart',
    href: '/ventas',
  },
  {
    id: 'n-esc-1',
    type: 'escalation',
    title: 'Pedido escalado a Gerencia',
    description: 'Pedido PED-00005 escalado a Gerencia (sin respuesta de Jakeira en 24h)',
    time: 'Hace 10 min',
    isRead: false,
    icon: 'AlertTriangle',
    href: '/ventas',
  },
  {
    id: 'n2',
    type: 'approval',
    title: 'Aprobación pendiente',
    description: 'Ajuste de inventario AJ-00045 requiere aprobación',
    time: 'Hace 15 min',
    isRead: false,
    icon: 'AlertCircle',
    href: '/inventario/ajustes',
  },
  {
    id: 'n3',
    type: 'payment',
    title: 'Cobro registrado',
    description: 'COB-00008 por $5,200.00 de CASA VERGARA PA',
    time: 'Hace 1 hora',
    isRead: false,
    icon: 'CircleDollarSign',
    href: '/clientes/cxc',
  },
  {
    id: 'n4',
    type: 'inventory',
    title: 'Stock bajo mínimo',
    description: 'WHISKY JOHNNIE WALKER RED: 5 cajas disponibles (mín: 20)',
    time: 'Hace 2 horas',
    isRead: true,
    icon: 'AlertTriangle',
    href: '/inventario',
  },
  {
    id: 'n9',
    type: 'inventory',
    title: 'Bajo punto de reorden',
    description: 'Producto WHISKY BLACK & WHITE está por debajo del punto mínimo (0 cajas, mínimo: 30)',
    time: 'Hace 30 min',
    isRead: false,
    icon: 'AlertTriangle',
    href: '/inventario?filter=below_reorder',
  },
  {
    id: 'n10',
    type: 'inventory',
    title: 'Stock bajo punto de reorden',
    description: 'Producto JOHNNIE WALKER BLACK tiene stock bajo (30 disponibles, mínimo: 20)',
    time: 'Hace 1 hora',
    isRead: false,
    icon: 'AlertTriangle',
    href: '/inventario?filter=below_reorder',
  },
  {
    id: 'n5',
    type: 'traffic',
    title: 'Embarque en tránsito',
    description: 'Contenedor MSKU-4829 llegará en 3 días',
    time: 'Hace 3 horas',
    isRead: true,
    icon: 'Ship',
    href: '/trafico',
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Cierre mensual pendiente',
    description: 'El cierre de enero 2026 está pendiente de ejecutar',
    time: 'Hace 5 horas',
    isRead: true,
    icon: 'Calendar',
    href: '/contabilidad/cierres',
  },
  {
    id: 'n7',
    type: 'credit',
    title: 'Crédito excedido',
    description: 'DISTRIBUIDORA EL SOL HN superó su límite de crédito en $2,300',
    time: 'Ayer',
    isRead: true,
    icon: 'CreditCard',
    href: '/clientes/CLI-00010',
  },
  {
    id: 'n8',
    type: 'overdue',
    title: 'Factura vencida 90+ días',
    description: 'FAC-00003 de LICORES DEL ISTMO por $8,750 está vencida',
    time: 'Ayer',
    isRead: true,
    icon: 'Clock',
    href: '/clientes/cxc',
  },
];

// ---------------------------------------------------------------------------
// Icon & colour maps
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  AlertCircle,
  CircleDollarSign,
  AlertTriangle,
  Ship,
  Calendar,
  CreditCard,
  Clock,
};

const TYPE_COLOR_MAP: Record<NotificationType, string> = {
  order: 'text-blue-400',
  approval: 'text-amber-400',
  payment: 'text-emerald-400',
  inventory: 'text-orange-400',
  traffic: 'text-cyan-400',
  system: 'text-violet-400',
  credit: 'text-red-400',
  overdue: 'text-red-400',
  escalation: 'text-orange-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement>;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent overlay for click-outside */}
          <div
            className="fixed inset-0 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed right-4 top-12 z-50 w-96 max-h-[480px] flex flex-col bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between shrink-0">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-white">
                  Notificaciones
                </span>
                {unreadCount > 0 && (
                  <span className="inline rounded-full bg-brand-600 text-white text-xs px-1.5 ml-2">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <BellOff className="h-8 w-8 text-zinc-600" />
                  <p className="text-xs text-zinc-500">Sin notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = ICON_MAP[notification.icon];
                  const colorClass = TYPE_COLOR_MAP[notification.type];

                  return (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        'px-4 py-3 flex gap-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors border-b border-[#1a1a1a] last:border-0',
                      )}
                    >
                      {/* Unread dot */}
                      <div className="flex items-start pt-1.5 shrink-0 w-2">
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={cn(
                          'h-8 w-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0',
                          colorClass,
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm leading-snug truncate',
                            notification.isRead
                              ? 'text-zinc-400 font-normal'
                              : 'text-white font-medium',
                          )}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={cn(
                            'text-xs leading-relaxed mt-0.5 line-clamp-2',
                            notification.isRead ? 'text-zinc-500' : 'text-zinc-400',
                          )}
                        >
                          {notification.description}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[#2a2a2a] text-center shrink-0">
              <button className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors">
                Ver todas las notificaciones
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
