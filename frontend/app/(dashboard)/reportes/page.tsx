'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Package, 
  RotateCcw, ArrowRight, Download,
  FileText, Table, PieChart,
  ChevronRight, Calendar, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const REPORT_MODULES = [
  {
    id: 'sales',
    title: 'Ventas e Ingresos',
    description: 'Análisis detallado de ventas B2B y punto de venta B2C.',
    icon: <TrendingUp className="h-6 w-6 text-emerald-600" />,
    color: 'emerald',
    href: '/reportes/ventas',
    stats: 'Ventas por canal, vendedor y fecha'
  },
  {
    id: 'cash',
    title: 'Caja y POS',
    description: 'Historial de aperturas, cierres y arqueos de caja.',
    icon: <RotateCcw className="h-6 w-6 text-blue-600" />,
    color: 'blue',
    href: '/reportes/caja',
    stats: 'Diferencias, sobrantes y métodos de pago'
  },
  {
    id: 'inventory',
    title: 'Stock e Inventario',
    description: 'Estado de existencias global y por bodega.',
    icon: <Package className="h-6 w-6 text-purple-600" />,
    color: 'purple',
    href: '/reportes/inventario',
    stats: 'Valorización y alertas de stock bajo'
  },
  {
    id: 'cxc',
    title: 'Cartera (CxC)',
    description: 'Control de cuentas por cobrar a clientes.',
    icon: <Users className="h-6 w-6 text-orange-600" />,
    color: 'orange',
    href: '/clientes/cxc',
    stats: 'Saldos vencidos y ranking de deuda'
  }
];

export default function ReportsHubPage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-2">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Business Intelligence</span>
        </div>
        <h1 className="text-3xl font-black">Centro de Reportes</h1>
        <p className="text-gray-500 text-sm">Selecciona un módulo para visualizar métricas avanzadas y exportar resultados.</p>
      </div>

      {/* Grid of Report Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_MODULES.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="cursor-pointer group"
            onClick={() => router.push(report.href)}
          >
            <Card className="h-full bg-white dark:bg-[#141414] border-gray-200 dark:border-white/10 hover:border-blue-500/50 transition-all shadow-sm group-hover:shadow-xl overflow-hidden relative">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform bg-current",
                `text-${report.color}-600`
              )} />
              
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm",
                  report.color === 'emerald' ? "bg-emerald-50 dark:bg-emerald-900/20" :
                  report.color === 'blue' ? "bg-blue-50 dark:bg-blue-900/20" :
                  report.color === 'purple' ? "bg-purple-50 dark:bg-purple-900/20" :
                  "bg-orange-50 dark:bg-orange-900/20"
                )}>
                  {report.icon}
                </div>
                <div>
                  <CardTitle className="text-xl font-black">{report.title}</CardTitle>
                  <CardDescription className="text-xs font-bold text-gray-400 group-hover:text-current transition-colors">
                    {report.stats}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6">
                  {report.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-400">Ver Detalles</span>
                  <div className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics Insight Card (Premium Look) */}
      <div className="bg-gray-900 dark:bg-white rounded-3xl p-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
               <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-400 dark:text-blue-600" />
                  <span className="text-xs font-black text-blue-400 dark:text-blue-600 uppercase tracking-widest">Dashboard Ejecutivo</span>
               </div>
               <h2 className="text-3xl font-black text-white dark:text-black leading-tight">
                  Toma mejores decisiones con datos consolidados.
               </h2>
               <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Nuestro motor de analítica procesa ventas diarias, movimientos de bodega y balances financieros para entregarte una visión 360 de tu negocio.
               </p>
               <Button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-blue-500/20"
               >
                  Ir al Dashboard Operativo
               </Button>
            </div>
            
            <div className="hidden lg:grid grid-cols-2 gap-4">
               {[
                  { l: 'B2B', v: '78%', c: 'text-blue-400' },
                  { l: 'POS', v: '22%', c: 'text-emerald-400' },
                  { l: 'Stock', v: 'Low', c: 'text-orange-400' },
                  { l: 'Audit', v: 'Clear', c: 'text-purple-400' }
               ].map((item, i) => (
                  <div key={i} className="bg-white/5 dark:bg-black/5 backdrop-blur-md border border-white/10 dark:border-black/5 p-4 rounded-2xl min-w-[120px]">
                     <p className="text-[10px] font-black uppercase text-gray-500">{item.l}</p>
                     <p className={cn("text-xl font-black ", item.c)}>{item.v}</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
