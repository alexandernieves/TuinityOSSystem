'use client';

import React, { useState } from 'react';
import { Bell, Check, ExternalLink, X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotifications } from './NotificationsProvider';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'CRITICAL': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className={cn("h-5 w-5 text-gray-600 dark:text-gray-400", isConnected ? "" : "opacity-30")} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white dark:border-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 max-h-[480px] bg-white dark:bg-[#1a1a1a] rounded-[14px] border border-gray-200 dark:border-[#2a2a2a] shadow-xl z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todo como leído
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                   <X className="h-3 w-3 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[100px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                   <div className="mx-auto w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                     <Bell className="h-5 w-5 text-gray-300" />
                   </div>
                   <p className="text-xs text-gray-500">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {notifications.slice(0, 10).map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group relative",
                        !n.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {getSeverityIcon(n.severity)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-snug">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase">
                              {n.module}
                            </span>
                            {n.actionUrl && (
                               <Link 
                                 href={n.actionUrl}
                                 onClick={() => {
                                   markAsRead(n.id);
                                   setIsOpen(false);
                                 }}
                                 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
                               >
                                 Ver acción <ExternalLink className="h-2.5 w-2.5" />
                               </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="absolute right-2 top-8 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:text-emerald-500 transition-all"
                          title="Marcar como leído"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <Link 
                href="/notificaciones" 
                onClick={() => setIsOpen(false)}
                className="p-3 text-center text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white border-t border-gray-100 dark:border-gray-800 transition-colors"
              >
                Ver todas las notificaciones
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
