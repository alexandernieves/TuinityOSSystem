
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    Badge,
    Card,
    CardBody,
    Chip,
    ScrollShadow
} from '@heroui/react';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        const session = loadSession();
        if (!session?.accessToken) return;

        try {
            const data = await api('/notifications', {
                skipAuthRedirect: true // Component handles its own state
            }) as any[];
            setNotifications(data || []);

            const unread = await api('/notifications/unread-count', {
                skipAuthRedirect: true
            }) as number;
            setUnreadCount(unread || 0);
        } catch (e: any) {
            // Silently fail for polling or if 401, api handles redirect globally anyway
            if (e.status !== 401) {
                console.error('Error fetching notifications:', e.message);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        const session = loadSession();
        if (!session) return;

        try {
            await api(`/notifications/${id}/read`, {
                method: 'PATCH',
                accessToken: session.accessToken
            });
            fetchNotifications();
        } catch (e) {
            toast.error('Error al marcar como leída');
        }
    };

    const markAllAsRead = async () => {
        const session = loadSession();
        if (!session) return;

        try {
            await api('/notifications/read-all', {
                method: 'POST',
                accessToken: session.accessToken
            });
            fetchNotifications();
            toast.success('Todas las notificaciones leídas');
        } catch (e) {
            toast.error('Error al marcar todas como leídas');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'ERROR': return <X className="w-4 h-4 text-red-500" />;
            case 'AI_INSIGHT': return <Sparkles className="w-4 h-4 text-purple-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <Dropdown placement="bottom-end" className="w-80 border-none shadow-2xl">
            <DropdownTrigger>
                <div className="cursor-pointer" suppressHydrationWarning>
                    <Badge content={unreadCount > 0 ? unreadCount : null} color="danger" size="sm" shape="circle" variant="solid">
                        <Button
                            isIconOnly
                            variant="light"
                            radius="full"
                            className="text-slate-500 hover:text-slate-900"
                        >
                            <Bell className="w-5 h-5" />
                        </Button>
                    </Badge>
                </div>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Notificaciones"
                className="p-0"
                disabledKeys={notifications.length === 0 ? ["empty"] : []}
            >
                <DropdownItem key="header" isReadOnly className="opacity-100 cursor-default p-0">
                    <div className="px-4 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                className="text-[10px] font-bold h-6"
                                onClick={markAllAsRead}
                            >
                                Marcar todo como leído
                            </Button>
                        )}
                    </div>
                </DropdownItem>

                {notifications.length === 0 ? (
                    <DropdownItem key="empty" isReadOnly className="p-8 text-center text-slate-400 font-medium">
                        No hay notificaciones
                    </DropdownItem>
                ) : (
                    <DropdownItem key="list" isReadOnly className="p-0 overflow-visible opacity-100 cursor-default">
                        <ScrollShadow className="max-h-[400px]">
                            <div className="flex flex-col">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer relative ${!notif.readAt ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        {!notif.readAt && (
                                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        )}
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs font-black text-slate-900 leading-tight">{notif.title}</p>
                                                <p className="text-[11px] text-slate-500 leading-normal">{notif.message}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase pt-1">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollShadow>
                    </DropdownItem>
                )}

                <DropdownItem key="footer" isReadOnly className="p-0 border-t border-slate-100 opacity-100 cursor-default">
                    <div className="px-4 py-2 text-center">
                        <a
                            href="/dashboard/notificaciones"
                            className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-tighter transition-colors block w-full"
                        >
                            Ver historial completo
                        </a>
                    </div>
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};
