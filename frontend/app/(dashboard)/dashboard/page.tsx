'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Package,
  ShoppingCart, AlertTriangle, ArrowRight, Loader2, CreditCard,
  Building, Calendar, BarChart3, ChevronRight, Activity, Monitor, Receipt
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, colorClass }: any) {
  return (
    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform", colorClass)} />
      
      <div className="flex justify-between items-start mb-4 relative">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5", colorClass.split(' ')[0])}>
          <Icon className={cn("h-5 w-5", colorClass.split(' ')[1])} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
            trend === 'up' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-1 relative">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-black tracking-tight">{value}</p>
        <p className="text-[11px] text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DashboardClientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getDashboardAnalytics();
        setData(res);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-gray-500 font-medium">Cargando métricas de ERP...</p>
      </div>
    );
  }

  // Prevent POS Cashiers from seeing dashboard (extra safety, usually handled by layout)
  if (user?.role === 'pos_cajero') {
    return <div className="p-8 text-center">Acceso denegado al dashboard principal.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">En Tiempo Real</span>
           </div>
           <h1 className="text-3xl font-black">Visión General Operativa</h1>
           <p className="text-gray-500 text-sm mt-1">Monitorea el estado de ventas, inventario y finanzas.</p>
        </div>

        <button 
           onClick={() => router.push('/reportes/ventas')}
           className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <BarChart3 className="h-4 w-4" />
          Ver Reportes Avanzados
        </button>
      </div>

      {/* Main KPIs (Ventas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
           title="Ventas Totales (Hoy)"
           value={fmt(data.today?.total || 0)}
           subtitle={`B2B: ${fmt(data.today?.salesB2B)} | POS: ${fmt(data.today?.salesPOS)}`}
           icon={DollarSign}
           trend="up"
           trendValue="Activo"
           colorClass="from-emerald-500/20 text-emerald-600"
        />
        <KpiCard 
           title="Ventas Totales (Mes)"
           value={fmt(data.month?.total || 0)}
           subtitle={`Proyectado mensual basado en histórico`}
           icon={Activity}
           colorClass="from-blue-500/20 text-blue-600"
        />
        <KpiCard 
           title="Cartera por Cobrar (CxC)"
           value={fmt(data.cxc || 0)}
           subtitle="Facturas pendientes B2B"
           icon={Users}
           colorClass="from-orange-500/20 text-orange-600"
        />
        <KpiCard 
           title="Cuentas por Pagar (CxP)"
           value={fmt(data.cxp || 0)}
           subtitle="A proveedores (Estimado)"
           icon={Building}
           colorClass="from-red-500/20 text-red-600"
        />
      </div>

      {/* Store KPIs (POS) */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-black">Operación en Tienda (Hoy)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
             title="Transacciones"
             value={data.store?.transactionsToday || 0}
             subtitle="Tickets emitidos hoy"
             icon={Receipt}
             colorClass="from-blue-500/20 text-blue-600"
          />
          <KpiCard 
             title="Ticket Promedio"
             value={fmt(data.store?.averageSale || 0)}
             subtitle="Valor medio por venta"
             icon={DollarSign}
             colorClass="from-emerald-500/20 text-emerald-600"
          />
          <KpiCard 
             title="Status Cajas"
             value={`${data.store?.openRegisters || 0} Abiertas`}
             subtitle={`${data.store?.closedRegistersToday || 0} Cerradas hoy`}
             icon={Monitor}
             colorClass="from-purple-500/20 text-purple-600"
          />
          <KpiCard 
             title="Alarmas Inventario"
             value={data.inventory?.totalUnits < 100 ? 'Revisar' : 'Óptimo'}
             subtitle="Bodega Tienda POS"
             icon={AlertTriangle}
             colorClass="from-orange-500/20 text-orange-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Left Column (Activity & Lists) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Sales Activity */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold">Actividad Reciente (Ventas)</h3>
               <button onClick={() => router.push('/ventas')} className="text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1">
                 Ver todo <ChevronRight className="h-3 w-3" />
               </button>
             </div>

             <div className="space-y-4">
                {data.recentActivity?.map((act: any) => (
                   <div key={`${act.origin}-${act.id}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm",
                            act.origin === 'B2B' ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"
                         )}>
                           {act.origin}
                         </div>
                         <div>
                            <p className="text-sm font-bold flex items-center gap-2">
                               {act.number}
                               <span className="text-[10px] font-medium bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-md text-gray-500 truncate max-w-[150px]">
                                  {act.clientOrUser}
                               </span>
                            </p>
                            <p className="text-xs text-gray-500  mt-0.5">{new Date(act.date).toLocaleString()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-gray-900 dark:text-gray-100">{fmt(Number(act.total))}</p>
                         <p className="text-[10px] uppercase font-bold text-gray-400">{act.status}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column (Inventory & POS) */}
        <div className="space-y-6">
          
          {/* Inventory Summary Widget */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <Package className="h-5 w-5 text-purple-500" />
                   <h3 className="font-bold">Resumen de Inventario</h3>
                </div>
                
                <div className="grid gap-4 mt-6">
                   <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Unidades Disponibles</p>
                      <p className="text-2xl font-black">{data.inventory?.totalUnits?.toLocaleString()}</p>
                   </div>
                   <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Valor Estimado</p>
                      <p className="text-2xl font-black text-purple-600">{fmt(data.inventory?.estimatedValue)}</p>
                   </div>
                </div>
                
                <button 
                  onClick={() => router.push('/inventario')}
                  className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-black py-2.5 rounded-xl text-sm font-bold shadow-sm"
                >
                  Gestionar Bodegas
                </button>
             </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
             <h3 className="font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-orange-500" /> Top Productos POS
             </h3>
             <div className="space-y-3">
                {data.topProducts?.map((p: any, i: number) => (
                   <div key={p.sku} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black text-gray-400 w-4">{i + 1}.</span>
                         <div>
                            <p className="font-medium line-clamp-1">{p.name}</p>
                            <p className="text-[10px] text-gray-400 ">{p.sku}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="font-bold text-emerald-600">{p.cantidad}u</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* POS Desgloses */}
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
             <h3 className="font-bold mb-4 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-emerald-500" /> Rendimiento de Cajeros (Hoy)
             </h3>
             <div className="space-y-4">
               {data.posSalesByCashier?.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-2">Sin ventas registradas</p>
               ) : (
                 data.posSalesByCashier?.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center font-bold text-emerald-600 text-xs">
                             {c.name.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                             <p className="font-bold text-gray-900 dark:text-gray-100">{c.name}</p>
                             <p className="text-[10px] text-gray-400">{c.count} transacciones</p>
                          </div>
                       </div>
                       <p className="font-black font-mono">{fmt(c.total)}</p>
                    </div>
                 ))
               )}
             </div>

             <h3 className="font-bold mt-8 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" /> Ingresos por Método (Hoy)
             </h3>
             <div className="space-y-3">
               {data.posIncomesToday?.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-2">Sin ingresos</p>
               ) : (
                 data.posIncomesToday?.map((inc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                       <span className="font-bold text-gray-600 dark:text-gray-300">{inc.method}</span>
                       <span className="font-black font-mono">{fmt(inc.amount)}</span>
                    </div>
                 ))
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
