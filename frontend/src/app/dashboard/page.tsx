'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { loadSession } from '@/lib/auth-storage';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AreaChart } from '@tremor/react';
import clsx from 'clsx';

type DashboardStats = {
  totalSales: number;
  salesGrowth: number;
  pendingOrders: number;
  productsInStock: number;
  lowStockCount: number;
  activeCustomers: number;
  customersGrowth: number;
};

type Alert = {
  id: string;
  type: 'warning' | 'critical';
  title: string;
  description: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    salesGrowth: 0,
    pendingOrders: 0,
    productsInStock: 0,
    lowStockCount: 0,
    activeCustomers: 0,
    customersGrowth: 0,
  });
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchUserProfile(session.accessToken);
    fetchDashboardData();
  }, [router]);

  const fetchUserProfile = async (token: string) => {
    if (!token) return;
    try {
      const profile = await api<{ name: string; role: string }>('/auth/me');
      setUser(profile);
    } catch (err: any) {
      // 401 is handled by api.ts globally
      if (err.status !== 401) {
        console.error('Error fetching user profile:', err);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      const session = loadSession();
      if (!session?.accessToken) return;

      // Parallel fetch: KPIs + Stagnant Alerts
      const [statsRes, stagnantRes] = await Promise.allSettled([
        api<any>('/sales/stats/dashboard'),
        api<any[]>('/inventory/stagnant?days=120')
      ]);

      // 1. Process KPI & Chart Data
      if (statsRes.status === 'fulfilled') {
        const data = statsRes.value;
        setStats({
          totalSales: data.kpi.totalRevenue,
          salesGrowth: data.kpi.revenueGrowth,
          pendingOrders: data.kpi.pendingOrders,
          productsInStock: data.kpi.productsInStock,
          lowStockCount: data.kpi.lowStockCount,
          activeCustomers: data.kpi.activeCustomers,
          customersGrowth: data.kpi.customersGrowth,
        });

        // Process Chart Data (Group by Month)
        const monthMap = new Map<string, number>();
        data.salesHistory.forEach((s: any) => {
          const date = new Date(s.createdAt);
          const key = date.toLocaleString('es-ES', { month: 'short' }); // Ene, Feb
          monthMap.set(key, (monthMap.get(key) || 0) + Number(s.total));
        });

        // Fill current year months or just used found months
        const processedChart = Array.from(monthMap.entries()).map(([month, total]) => ({
          month,
          ventas: total,
          costos: total * 0.6 // Estimated cost (or fetch real if available)
        }));
        setSalesData(processedChart.length > 0 ? processedChart : [{ month: 'Actual', ventas: 0, costos: 0 }]);
      }

      // 2. Process Alerts
      const baseAlerts: Alert[] = [];

      // Add Stagnant Alerts (Real)
      if (stagnantRes.status === 'fulfilled') {
        const stagnantProducts = stagnantRes.value;
        const stagnantAlerts = stagnantProducts
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map(p => ({
            id: `stagnant-${p.id}`,
            type: 'warning' as const,
            title: `Inmovilizado: ${p.description}`,
            description: `Valor: $${p.value.toLocaleString()} | Sin movimiento >120 días.`
          }));
        setAlerts([...baseAlerts, ...stagnantAlerts]);
      } else {
        setAlerts(baseAlerts);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      toast.error('Error al sincronizar dashboard');
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#F4F7F6]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-[#F4F7F6]" />
          <div className="h-80 animate-pulse rounded-2xl bg-[#F4F7F6]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2980B9]/10">
              <LayoutDashboard className="h-5 w-5 text-[#2980B9]" />
            </div>
            <h1 className="text-2xl font-bold text-[#2C3E50] tracking-tight">Centro de Control</h1>
          </div>
          <p className="mt-1 text-sm text-[#5A6C7D]">Resumen operativo en tiempo real de Evolution ZL</p>
        </div>
        <Badge variant="info" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm">
          Sesión: {user?.role || 'Cargando...'}
        </Badge>
      </div>

      {/* Module Navigation Hub */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Inventario Card */}
        <div
          onClick={() => router.push('/dashboard/inventario')}
          className="group cursor-pointer rounded-3xl border border-white/40 bg-white/60 p-1 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#2980B9]/10"
        >
          <div className="rounded-[22px] bg-gradient-to-br from-white to-[#F4F7F6] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2980B9] shadow-lg shadow-[#2980B9]/20 transition-transform group-hover:rotate-6">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2B3C]">Inventario</h3>
            <p className="mt-2 text-sm text-[#5A6C7D] leading-relaxed">Control global de stock, transferencias y valoración de activos.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Stock', 'Ajustes', 'Valoración'].map((tag) => (
                <span key={tag} className="rounded-full bg-[#2980B9]/5 px-3 py-1 text-[10px] font-bold text-[#2980B9] uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Ventas Card */}
        <div
          onClick={() => router.push('/dashboard/ventas')}
          className="group cursor-pointer rounded-3xl border border-white/40 bg-white/60 p-1 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#2D8A4E]/10"
        >
          <div className="rounded-[22px] bg-gradient-to-br from-white to-[#F4F7F6] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D8A4E] shadow-lg shadow-[#2D8A4E]/20 transition-transform group-hover:rotate-6">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2B3C]">Ventas</h3>
            <p className="mt-2 text-sm text-[#5A6C7D] leading-relaxed">Pipeline comercial, cotizaciones PDF y monitor de ingresos.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Pipeline', 'Nueva Cotiz', 'Facturas'].map((tag) => (
                <span key={tag} className="rounded-full bg-[#2D8A4E]/5 px-3 py-1 text-[10px] font-bold text-[#2D8A4E] uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Clientes Card */}
        <div
          onClick={() => router.push('/dashboard/clientes')}
          className="group cursor-pointer rounded-3xl border border-white/40 bg-white/60 p-1 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#D4AF37]/10"
        >
          <div className="rounded-[22px] bg-gradient-to-br from-white to-[#F4F7F6] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 transition-transform group-hover:rotate-6">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2B3C]">Clientes</h3>
            <p className="mt-2 text-sm text-[#5A6C7D] leading-relaxed">CRM, límite de crédito y estados de cuenta transaccionales.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['CRM', 'CxC', 'Historial'].map((tag) => (
                <span key={tag} className="rounded-full bg-[#D4AF37]/5 px-3 py-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tráfico Card */}
        <div
          onClick={() => router.push('/dashboard/trafico')}
          className="group cursor-pointer rounded-3xl border border-white/40 bg-white/60 p-1 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#1A2B3C]/10"
        >
          <div className="rounded-[22px] bg-gradient-to-br from-white to-[#F4F7F6] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A2B3C] shadow-lg shadow-[#1A2B3C]/20 transition-transform group-hover:rotate-6">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#1A2B3C]">Tráfico</h3>
            <p className="mt-2 text-sm text-[#5A6C7D] leading-relaxed">Documentación ZL, DMC, BL y logística de despachos.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['DMC', 'Despachos', 'Logística'].map((tag) => (
                <span key={tag} className="rounded-full bg-[#1A2B3C]/5 px-3 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card hover>
          <CardContent className="p-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D]">Ventas Consolidadas</p>
              <div className="mt-4">
                <h2 className="text-3xl font-bold text-[#2C3E50]">${stats.totalSales.toLocaleString()}</h2>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-md bg-[#2D8A4E]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2D8A4E]">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.salesGrowth}%
                  </div>
                  <span className="text-[10px] font-medium text-[#5A6C7D] uppercase tracking-wider">vs mes anterior</span>
                </div>
              </div>
            </div>
            <DollarSign className="absolute -right-3 -bottom-3 h-20 w-20 text-[#2D8A4E]/5" />
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D]">Pedidos en Pipeline</p>
              <div className="mt-4">
                <h2 className="text-3xl font-bold text-[#2C3E50]">{stats.pendingOrders}</h2>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-md bg-[#F39C12]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#F39C12]">
                    <Clock className="h-3 w-3" />
                    Activos
                  </div>
                  <span className="text-[10px] font-medium text-[#5A6C7D] uppercase tracking-wider">8 Urgentes</span>
                </div>
              </div>
            </div>
            <ShoppingCart className="absolute -right-3 -bottom-3 h-20 w-20 text-[#F39C12]/5" />
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D]">Índice de Inventario</p>
              <div className="mt-4">
                <h2 className="text-3xl font-bold text-[#2C3E50]">{stats.productsInStock.toLocaleString()}</h2>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-md bg-[#C0392B]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#C0392B]">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.lowStockCount} Bajos
                  </div>
                  <span className="text-[10px] font-medium text-[#5A6C7D] uppercase tracking-wider">Nivel SKUs</span>
                </div>
              </div>
            </div>
            <Package className="absolute -right-3 -bottom-3 h-20 w-20 text-[#2980B9]/5" />
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6 relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5A6C7D]">Cartera de Clientes</p>
              <div className="mt-4">
                <h2 className="text-3xl font-bold text-[#2C3E50]">{stats.activeCustomers}</h2>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-md bg-[#1A2B3C]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1A2B3C]">
                    <Users className="h-3 w-3" />
                    +{stats.customersGrowth}
                  </div>
                  <span className="text-[10px] font-medium text-[#5A6C7D] uppercase tracking-wider">Nuevos hoy</span>
                </div>
              </div>
            </div>
            <Users className="absolute -right-3 -bottom-3 h-20 w-20 text-[#1A2B3C]/5" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#2C3E50] tracking-tight">Análisis de Ingresos</h3>
                <p className="text-xs font-medium text-[#5A6C7D] uppercase tracking-widest">Comparativa Ventas vs Costos (USD)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#2980B9]" />
                  <span className="text-[10px] font-bold text-[#5A6C7D] uppercase">Ventas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#2D8A4E]" />
                  <span className="text-[10px] font-bold text-[#5A6C7D] uppercase">Costos</span>
                </div>
              </div>
            </div>
            <AreaChart
              className="h-80"
              data={salesData}
              index="month"
              categories={['ventas', 'costos']}
              colors={['blue', 'emerald']}
              valueFormatter={(value) => `$${value.toLocaleString()}`}
              showLegend={false}
              showGridLines={false}
              curveType="monotone"
            />
          </CardContent>
        </Card>

        {/* Operations Alerts */}
        <Card className="bg-[#1A2B3C] text-white">
          <CardContent className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#F39C12]" />
              <h3 className="text-lg font-bold tracking-tight uppercase">Alertas de Operación</h3>
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="group relative rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10 border border-white/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className={clsx(
                        "text-[10px] font-bold uppercase tracking-widest",
                        alert.type === 'critical' ? "text-[#C0392B]" : "text-[#F39C12]"
                      )}>
                        {alert.type === 'critical' ? 'Prioridad Crítica' : 'Recordatorio'}
                      </p>
                      <h4 className="text-sm font-semibold text-white/90">{alert.title}</h4>
                      <p className="text-xs text-white/60 leading-relaxed">{alert.description}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/40" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-white/5 p-4 text-center">
              <p className="text-[10px] font-medium leading-relaxed text-white/40 uppercase tracking-widest">
                Monitoreo activo por Evolution Engine<br />Última actualización: hace 2 min
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
