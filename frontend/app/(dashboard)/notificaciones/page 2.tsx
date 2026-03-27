'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  CheckCheck, 
  ExternalLink,
  ChevronRight,
  Inbox,
  Clock,
  Briefcase,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

export default function NotificacionesPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (moduleFilter !== 'all' && n.module !== moduleFilter) return false;
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'SUCCESS': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'CRITICAL': return <AlertCircle className="h-5 w-5 text-rose-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'SUCCESS': return 'border-emerald-100 bg-emerald-50/30 text-emerald-700';
      case 'WARNING': return 'border-amber-100 bg-amber-50/30 text-amber-700';
      case 'CRITICAL': return 'border-rose-100 bg-rose-50/30 text-rose-700';
      default: return 'border-blue-100 bg-blue-50/30 text-blue-700';
    }
  };

  const modules = ['all', ...Array.from(new Set(notifications.map(n => n.module)))];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
             <Bell className="h-6 w-6 text-blue-600" />
             Centro de Mensajes
           </h1>
           <p className="text-sm text-gray-500 mt-1">
             Gestiona todas tus notificaciones y alertas en tiempo real.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={markAllAsRead}
             disabled={unreadCount === 0}
             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
           >
             <CheckCheck className="h-4 w-4" />
             Marcar todo como leído
           </button>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Sidebar-like sidebar filters */}
         <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-2">
               <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Vista</div>
               <button 
                 onClick={() => setFilter('all')}
                 className={cn(
                   "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                   filter === 'all' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                 )}
               >
                 <div className="flex items-center gap-3">
                    <Inbox className="h-4 w-4" />
                    <span className="text-sm">Todo</span>
                 </div>
                 <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{notifications.length}</span>
               </button>
               <button 
                 onClick={() => setFilter('unread')}
                 className={cn(
                   "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                   filter === 'unread' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                 )}
               >
                 <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">No leídas</span>
                 </div>
                 {unreadCount > 0 && <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
               </button>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-2">
               <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Módulos</div>
               <div className="space-y-1">
                 {modules.map(mod => (
                    <button 
                      key={mod}
                      onClick={() => setModuleFilter(mod)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm capitalize",
                        moduleFilter === mod ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <Briefcase className="h-4 w-4" />
                      {mod === 'all' ? 'Todos los módulos' : mod.toLowerCase()}
                    </button>
                 ))}
               </div>
            </div>
         </div>

         {/* List */}
         <div className="md:col-span-3 space-y-4">
            {filteredNotifications.length === 0 ? (
               <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-16 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                     <Bell className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bandeja de entrada vacía</h3>
                  <p className="text-gray-500 max-w-xs mx-auto mt-2">
                    {filter === 'unread' 
                      ? "¡Buen trabajo! Has leído todos tus mensajes." 
                      : "No tienes ninguna notificación registrada en este momento."}
                  </p>
               </div>
            ) : (
               <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredNotifications.map((n) => (
                        <div 
                          key={n.id}
                          className={cn(
                            "group p-6 flex gap-5 transition-all relative",
                            !n.isRead && "bg-blue-50/20 dark:bg-blue-900/10 border-l-4 border-l-blue-600"
                          )}
                        >
                           <div className="flex-shrink-0">
                              <div className={cn("p-3 rounded-2xl border", getSeverityClass(n.severity))}>
                                 {getSeverityIcon(n.severity)}
                              </div>
                           </div>
                           
                           <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                      {n.title}
                                    </h4>
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                                       {n.module}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-4">
                                     <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(n.createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                     <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        {!n.isRead && (
                                          <button 
                                            onClick={() => markAsRead(n.id)}
                                            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                                            title="Marcar como leído"
                                          >
                                            <Check className="h-4 w-4" />
                                          </button>
                                        )}
                                        {n.actionUrl && (
                                          <Link 
                                            href={n.actionUrl}
                                            className="p-2 bg-blue-600 border border-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all shadow-sm"
                                            title="Ver detalle"
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </Link>
                                        )}
                                     </div>
                                 </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                                {n.message}
                              </p>

                              {n.actionUrl && (
                                 <div className="pt-2">
                                    <Link 
                                      href={n.actionUrl}
                                      onClick={() => markAsRead(n.id)}
                                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                                    >
                                      REALIZAR ACCIÓN <ExternalLink className="h-3 w-3" />
                                    </Link>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/10 border-t border-gray-100 dark:border-gray-800 text-center">
                      <p className="text-xs text-gray-400">Mostrando {filteredNotifications.length} notificaciones</p>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
