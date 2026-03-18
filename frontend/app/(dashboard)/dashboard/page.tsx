'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { api } from '@/lib/services/api';
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Users,
  Truck,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ClipboardList,
  Calendar,
  BarChart3,
  Target,
  Boxes,
  ChevronRight,
  Sparkles,
  Award,
  AlertCircle,
  Ship,
  Building2,
  TrendingDown,
  Percent,
  RotateCcw,
  Landmark,
  Receipt,
  CircleDollarSign,
  CreditCard,
  Settings2,
  LayoutGrid,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { SEED_PRODUCTS } from '@/lib/mock-data/products';
import { getUpcomingExpiryAlerts, getExpiryStats } from '@/lib/mock-data/expiry-batches';
import { EXPIRY_ALERT_CONFIG } from '@/lib/types/expiry';
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// ============================================
// MOCK DATA - Business Intelligence
// ============================================

// F1: Reorder point alerts computed from SEED_PRODUCTS (SSR-safe)
const REORDER_POINT_ALERTS = SEED_PRODUCTS
  .filter((p) => p.reorderPoint != null && p.stock.available <= p.reorderPoint)
  .map((p) => ({
    id: p.id,
    product: p.description,
    reference: p.reference,
    current: p.stock.available,
    reorderPoint: p.reorderPoint!,
    severity: p.stock.available === 0 ? 'critical' as const : p.stock.available <= Math.floor(p.reorderPoint! * 0.5) ? 'warning' as const : 'medium' as const,
  }))
  .sort((a, b) => a.current - b.current);

const REORDER_POINT_COUNT = REORDER_POINT_ALERTS.length;

const STATS = [
  {
    label: 'Total Productos',
    value: '1,247',
    change: '+12',
    changeType: 'positive' as const,
    icon: Package,
    color: 'brand',
    href: '/productos',
  },
  {
    label: 'Órdenes Pendientes',
    value: '23',
    change: '5 urgentes',
    changeType: 'warning' as const,
    icon: ShoppingCart,
    color: 'warning',
    href: '/compras',
  },
  {
    label: 'Ventas del Mes',
    value: '$847,320',
    change: '+18.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
    color: 'success',
    href: '/ventas',
  },
  {
    label: 'Bajo Punto Reorden',
    value: String(REORDER_POINT_COUNT),
    change: `${SEED_PRODUCTS.filter(p => p.stock.available === 0).length} sin stock`,
    changeType: 'negative' as const,
    icon: AlertTriangle,
    color: 'danger',
    href: '/inventario?filter=below_reorder',
  },
];

const KPIS = [
  { label: 'Meta Mensual', current: 847320, target: 1000000, unit: '$', icon: Target, color: 'brand' },
  { label: 'Órdenes Procesadas', current: 156, target: 200, unit: '', icon: ShoppingCart, color: 'info' },
  { label: 'Rotación Inventario', current: 4.2, target: 5.0, unit: 'x', icon: RotateCcw, color: 'success' },
  { label: 'Margen Promedio', current: 21, target: 25, unit: '%', icon: Percent, color: 'warning' },
];

const WEEKLY_SALES = [
  { day: 'Lun', value: 45000, target: 50000 },
  { day: 'Mar', value: 52000, target: 50000 },
  { day: 'Mié', value: 48000, target: 50000 },
  { day: 'Jue', value: 61000, target: 50000 },
  { day: 'Vie', value: 55000, target: 50000 },
  { day: 'Sáb', value: 42000, target: 40000 },
  { day: 'Dom', value: 25000, target: 30000 },
];

const MONTHLY_REVENUE = [
  { month: 'Sep', revenue: 720000, profit: 144000 },
  { month: 'Oct', revenue: 680000, profit: 136000 },
  { month: 'Nov', revenue: 750000, profit: 157500 },
  { month: 'Dic', revenue: 920000, profit: 193200 },
  { month: 'Ene', revenue: 810000, profit: 170100 },
  { month: 'Feb', revenue: 847320, profit: 177937 },
];

const TOP_PRODUCTS = [
  { id: 1, name: 'WHISKY JOHNNIE WALKER BLACK 12YRS', reference: 'EVL-00003', sold: 245, revenue: 48755, trend: 'up', percentChange: 12 },
  { id: 2, name: 'TEQUILA DON JULIO 1942', reference: 'EVL-00004', sold: 89, revenue: 54040, trend: 'up', percentChange: 8 },
  { id: 3, name: 'VODKA GREY GOOSE ORIGINAL', reference: 'EVL-00008', sold: 178, revenue: 21360, trend: 'down', percentChange: -3 },
  { id: 4, name: 'WHISKY CHIVAS REGAL 12YRS', reference: 'EVL-00009', sold: 156, revenue: 22412, trend: 'up', percentChange: 15 },
  { id: 5, name: 'RON DIPLOMÁTICO RESERVA', reference: 'EVL-00010', sold: 134, revenue: 16080, trend: 'up', percentChange: 5 },
];

const TOP_CUSTOMERS = [
  { id: 1, name: 'BRAND DISTRIBUIDOR CURACAO', country: 'Curazao', purchases: 125400, orders: 12, avatar: 'BD' },
  { id: 2, name: 'TRIPLE DOUBLE TRADING', country: 'Panamá', purchases: 98750, orders: 8, avatar: 'TD' },
  { id: 3, name: 'CARIBBEAN SPIRITS LLC', country: 'Puerto Rico', purchases: 87200, orders: 15, avatar: 'CS' },
  { id: 4, name: 'DUTY FREE AMERICAS', country: 'USA', purchases: 76500, orders: 6, avatar: 'DF' },
  { id: 5, name: 'ISLAND BEVERAGES CO', country: 'Bahamas', purchases: 65800, orders: 9, avatar: 'IB' },
];

const PENDING_APPROVALS = [
  { id: 'AJ-00001', type: 'adjustment', title: 'Ajuste de Inventario', description: 'Rotura - 5 unidades', createdBy: 'Ariel (Tráfico)', createdAt: '2026-02-20', value: 339.25, status: 'pendiente' },
  { id: 'AJ-00005', type: 'adjustment', title: 'Ajuste de Inventario', description: 'Merma - 1 unidad', createdBy: 'Ariel (Tráfico)', createdAt: '2026-02-22', value: 59.80, status: 'pendiente' },
  { id: 'TR-00001', type: 'transfer', title: 'Transferencia B2B→B2C', description: 'Bodega ZL → Tienda PTY', createdBy: 'Celly (Compras)', createdAt: '2026-02-21', value: 599.15, status: 'enviada' },
];

const UPCOMING_SHIPMENTS = [
  { id: 'OC-03568', supplier: 'DIAGEO PANAMA', items: 450, eta: '2026-02-28', status: 'in_transit', vessel: 'MSC CAROLINA' },
  { id: 'OC-03569', supplier: 'PERNOD RICARD', items: 280, eta: '2026-03-02', status: 'confirmed', vessel: 'MAERSK DENVER' },
  { id: 'OC-03570', supplier: 'BACARDI GLOBAL', items: 320, eta: '2026-03-05', status: 'processing', vessel: 'Pendiente' },
  { id: 'OC-03571', supplier: 'BEAM SUNTORY', items: 185, eta: '2026-03-08', status: 'processing', vessel: 'Pendiente' },
];

const INVENTORY_ALERTS = [
  { id: 1, product: 'WHISKY BLACK & WHITE 24X375ML', reference: 'EVL-00001', type: 'out_of_stock', current: 0, minimum: 20, severity: 'critical' },
  { id: 2, product: 'VODKA ABSOLUT FIVE MINI 18X5X50ML', reference: 'EVL-00012', type: 'stagnant', monthsWithoutSale: 58, severity: 'warning' },
  { id: 3, product: 'WHISKY CROWN ROYAL CORCHO', reference: 'EVL-00011', type: 'low_stock', current: 2, minimum: 20, severity: 'warning' },
  { id: 4, product: 'TEQUILA CLASE AZUL REPOSADO', reference: 'EVL-00005', type: 'low_stock', current: 7, minimum: 15, severity: 'medium' },
];

const RECENT_ACTIVITY = [
  { id: 1, action: 'Nueva orden de compra', description: 'OC-03567 creada para TRIPLE DOUBLE TRADING', time: 'Hace 5 min', type: 'purchase' },
  { id: 2, action: 'Entrada de mercancía', description: 'OC-03566 recibida - 355 cajas', time: 'Hace 1 hora', type: 'inventory' },
  { id: 3, action: 'Nueva cotización', description: 'COT-2024-0892 para BRAND DISTRIBUIDOR CURACAO', time: 'Hace 2 horas', type: 'sale' },
  { id: 4, action: 'Producto bajo mínimo', description: 'WHISKY JOHNNIE WALKER BLACK - Stock: 30 cajas', time: 'Hace 3 horas', type: 'alert' },
  { id: 5, action: 'Transferencia confirmada', description: 'TR-00002 recibida en Tienda PTY', time: 'Hace 4 horas', type: 'transfer' },
  { id: 6, action: 'Ajuste aprobado', description: 'AJ-00002 aprobado por Javier', time: 'Hace 5 horas', type: 'adjustment' },
];

// CxC & Finance Quick View
const CXC_SUMMARY = {
  totalPending: 285400,
  current: 142700,
  overdue30: 68200,
  overdue60: 42500,
  overdue90: 32000,
  collectedThisMonth: 124800,
  collectionTarget: 200000,
};

const BANK_BALANCES = [
  { name: 'Banesco', balance: 245800, color: 'bg-blue-500' },
  { name: 'Banco General', balance: 189200, color: 'bg-emerald-500' },
  { name: 'BAC', balance: 156700, color: 'bg-red-500' },
  { name: 'Banistmo', balance: 98400, color: 'bg-violet-500' },
];

const OVERDUE_CLIENTS = [
  { name: 'LICORES DEL ISTMO PA', amount: 8750, days: 95 },
  { name: 'DISTRIBUIDORA EL SOL HN', amount: 6200, days: 67 },
  { name: 'IMPORT EXPORT CARIBE', amount: 4800, days: 45 },
];

const CALENDAR_EVENTS = [
  { id: 1, title: 'Llegada contenedor DIAGEO', date: '2026-02-28', type: 'shipment' },
  { id: 2, title: 'Reunión con Pernod Ricard', date: '2026-03-01', type: 'meeting' },
  { id: 3, title: 'Conteo físico Zona A', date: '2026-03-03', type: 'inventory' },
  { id: 4, title: 'Vencimiento crédito BACARDI', date: '2026-03-05', type: 'payment' },
  { id: 5, title: 'Auditoría trimestral', date: '2026-03-10', type: 'audit' },
];

const WIDGETS_CONFIG = [
  { id: 'summary', name: 'Resumen General', icon: Landmark, description: 'Balances globales principales' },
  { id: 'kpis', name: 'Indicadores Clave', icon: Target, description: 'Cumplimiento de metas y KPIs' },
  { id: 'weeklySales', name: 'Ventas Semanales', icon: BarChart3, description: 'Desempeño diario vs meta' },
  { id: 'monthlyTrend', name: 'Tendencia Mensual', icon: TrendingUp, description: 'Ingresos vs Utilidad histórica' },
  { id: 'inventoryAlerts', name: 'Alertas Inventario', icon: AlertTriangle, description: 'Stocks bajos y faltantes' },
  { id: 'expiryAlerts', name: 'Próximos a Vencer', icon: AlertCircle, description: 'Lotes próximos a expirar' },
  { id: 'activity', name: 'Actividad Reciente', icon: Clock, description: 'Últimos eventos en la plataforma' },
  { id: 'quickActions', name: 'Acciones Rápidas', icon: Sparkles, description: 'Accesos directos operativos' },
  { id: 'customers', name: 'Ranking Clientes', icon: Users, description: 'Top clientes por facturación' },
  { id: 'products', name: 'Ranking Productos', icon: Package, description: 'Artículos de mayor rotación' },
];

// ============================================
// COMPONENT
// ============================================

export default function DashboardPage() {
  const { user, checkPermission } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false);
  const [widgetPrefs, setWidgetPrefs] = useState<Record<string, boolean>>({});
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const canViewCosts = checkPermission('canViewCosts');
  const canApproveAdjustments = checkPermission('canApproveAdjustments');
  const canViewInventoryAlerts = checkPermission('canViewInventoryAlerts');
  const canViewExpiryAlerts = checkPermission('canViewExpiryAlerts');

  useEffect(() => {
    api.getDashboardAnalytics()
      .then(data => setAnalytics(data))
      .catch(err => console.error('Error fetching dashboard analytics:', err))
      .finally(() => setIsDataLoading(false));

    // Initialize widget preferences from localStorage (keyed by user email)
    const storageKey = user?.email ? `widget_prefs_${user.email}` : 'widget_prefs_default';
    const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        // Merge: ensure all widgets have a value
        const prefs = { ...parsed };
        WIDGETS_CONFIG.forEach(w => {
          if (prefs[w.id] === undefined) prefs[w.id] = true;
        });
        setWidgetPrefs(prefs);
        return;
      } catch {
        // fallback to defaults below
      }
    }
    // No stored prefs: default all to true
    const defaultPrefs: Record<string, boolean> = {};
    WIDGETS_CONFIG.forEach(w => defaultPrefs[w.id] = true);
    setWidgetPrefs(defaultPrefs);
  }, [user]);

  const handleToggleWidget = (id: string, value: boolean) => {
    setWidgetPrefs(prev => ({ ...prev, [id]: value }));
    const widgetName = WIDGETS_CONFIG.find(w => w.id === id)?.name;
    if (widgetName) {
      toast.success(`${widgetName} ${value ? 'activado' : 'desactivado'}`, {
        description: 'Recuerda guardar los cambios.'
      });
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      // Save to localStorage using email as key (works for both mock and real users)
      const storageKey = user?.email ? `widget_prefs_${user.email}` : 'widget_prefs_default';
      localStorage.setItem(storageKey, JSON.stringify(widgetPrefs));

      // Also attempt backend save if user has a real _id or id (non-blocking)
      const userId = (user as any)?._id || user?.id;
      if (userId && userId !== 'mock-dev-token') {
        api.updateUser(userId, { dashboardPreferences: widgetPrefs }).catch(() => {
          // silently ignore backend failures; prefs are already saved locally
        });
      }

      toast.success('Preferencias guardadas', {
        description: 'El dashboard se ha actualizado correctamente.'
      });
      setIsWidgetsModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar preferencias', {
        description: error.message
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const isVisible = (id: string) => widgetPrefs[id] !== false;

  // F4: Expiry data
  const expiryStats = canViewExpiryAlerts ? getExpiryStats() : null;
  const upcomingExpiryAlerts = canViewExpiryAlerts ? getUpcomingExpiryAlerts().slice(0, 5) : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const realStats = analytics ? [
    {
      label: 'Total Productos',
      value: String(analytics.summary.totalProducts),
      change: 'Catálogo',
      changeType: 'positive' as const,
      icon: Package,
      color: 'brand',
      href: '/productos',
    },
    {
      label: 'Ventas del Mes',
      value: formatCurrency(analytics.summary.monthRevenue),
      change: 'Facturado',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'success',
      href: '/ventas',
    },
    {
      label: 'Cuentas x Cobrar',
      value: formatCurrency(analytics.summary.totalCXC),
      change: `${analytics.topClientsWithBalance.length} clientes`,
      changeType: 'warning' as const,
      icon: CircleDollarSign,
      color: 'warning',
      href: '/clientes/cxc',
    },
    {
      label: 'Cuentas x Pagar',
      value: formatCurrency(analytics.summary.totalCXP),
      change: 'Pendiente',
      changeType: 'negative' as const,
      icon: CreditCard,
      color: 'danger',
      href: '/proveedores/cxp',
    },
  ] : STATS;

  const realActivity = analytics ? analytics.recentSales.map((s: any) => ({
    id: s.id,
    action: `Venta B2B ${s.reference}`,
    description: `Facturada a ${s.clientName} por ${formatCurrency(s.total)}`,
    time: new Date(s.createdAt).toLocaleDateString(),
    type: 'sale',
    status: s.status
  })) : RECENT_ACTIVITY;

  const realTopCustomers = analytics ? analytics.topClientsWithBalance.map((c: any) => ({
    id: c.id,
    name: c.name,
    country: c.reference,
    purchases: c.balance,
    orders: 0,
    avatar: c.name.substring(0, 2).toUpperCase()
  })) : TOP_CUSTOMERS;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };



  const displayWeeklySales = analytics?.weeklySales || WEEKLY_SALES;
  const displayMonthlyRevenue = analytics?.monthlyRevenue || MONTHLY_REVENUE;

  const maxWeeklySale = Math.max(...displayWeeklySales.map((d: any) => d.value));
  const totalWeeklySales = displayWeeklySales.reduce((sum: number, d: any) => sum + d.value, 0);
  const weeklyTarget = displayWeeklySales.reduce((sum: number, d: any) => sum + (d.target || 50000), 0);

  if (isDataLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Bienvenido, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aquí está el resumen de tu actividad comercial • {new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsWidgetsModalOpen(true)}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Widgets
          </Button>
          <Button
            variant="secondary"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Febrero 2026
          </Button>
        </div>
      </motion.div>

      {/* Section: Resumen */}
      {isVisible('summary') && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resumen General</p>

          {/* Stats Grid - Main 4, unified */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {realStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  onClick={() => router.push(stat.href)}
                >
                  <Card className="cursor-pointer transition-all hover:border-blue-400 hover:shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                      <div className={cn(
                        "p-2 rounded-md",
                        stat.color === 'brand' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" :
                        stat.color === 'bg-green-50' ? "bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400" :
                        stat.color === 'warning' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" :
                        "bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="flex items-center mt-1 space-x-1">
                        <span className={cn(
                          "text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center",
                          stat.changeType === 'positive' ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                          stat.changeType === 'negative' ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        )}>
                          {stat.changeType === 'positive' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                          {stat.changeType === 'negative' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                          {stat.change}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Section: KPIs */}
      {isVisible('kpis') && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Indicadores Clave</p>

          {/* KPIs Row - All together, touching */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((kpi) => {
              const Icon = kpi.icon;
              const progress = (kpi.current / kpi.target) * 100;
              return (
                <motion.div key={kpi.label} variants={itemVariants}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        {kpi.unit === '$' ? formatCurrency(kpi.current) : `${kpi.current}${kpi.unit}`}
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-1.5 mt-3" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">Meta: {kpi.unit === '$' ? formatCurrency(kpi.target) : `${kpi.target}${kpi.unit}`}</span>
                        <span className="text-[10px] font-medium">{progress.toFixed(0)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Section: Análisis */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Análisis de Datos</p>

      {/* Charts Row - Sales + Monthly */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Weekly Sales Chart */}
        {isVisible('weeklySales') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("lg:col-span-3", !isVisible('monthlyTrend') && "lg:col-span-5")}
          >
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Ventas de la Semana</h3>
                    <p className="text-xs text-muted">Comparativa con meta diaria</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Ventas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-muted/30" />
                    <span className="text-muted-foreground">Meta</span>
                  </div>
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalWeeklySales)}</p>
                    <p className="text-sm text-muted-foreground">
                      {totalWeeklySales >= weeklyTarget ? (
                        <span className="text-green-600">+{((totalWeeklySales / weeklyTarget - 1) * 100).toFixed(1)}% sobre meta</span>
                      ) : (
                        <span className="text-red-600">{((totalWeeklySales / weeklyTarget - 1) * 100).toFixed(1)}% bajo meta</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex h-48 items-end justify-between gap-3">
                  {displayWeeklySales.map((day: any, index: number) => {
                    const heightPercent = (day.value / maxWeeklySale) * 100;
                    const targetPercent = ((day.target || 50000) / maxWeeklySale) * 100;
                    const isAboveTarget = day.value >= (day.target || 50000);

                    return (
                      <div key={day.day} className="group relative flex flex-1 flex-col items-center">
                        <div className="relative flex h-40 w-full flex-col justify-end">
                          {/* Target line */}
                          <div
                            className="absolute left-0 right-0 border-t-2 border-dashed border-text-muted/30"
                            style={{ bottom: `${targetPercent}%` }}
                          />
                          {/* Bar */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                            className={cn(
                              'w-full rounded-t-md transition-colors',
                              isAboveTarget
                                ? 'bg-blue-500 group-hover:bg-muted dark:bg-blue-600 dark:group-hover:bg-blue-500'
                                : 'bg-amber-500 group-hover:bg-amber-500/80'
                            )}
                          />
                        </div>
                        <p className="mt-2 text-xs font-medium text-muted-foreground">{day.day}</p>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-muted px-3 py-2 text-xs text-foreground opacity-0 shadow-lg ring-1 ring-border transition-opacity group-hover:opacity-100 dark:bg-accent">
                          <p className="font-semibold">{formatCurrency(day.value)}</p>
                          <p className="text-muted">Meta: {formatCurrency(day.target)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Revenue */}
        {isVisible('monthlyTrend') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={cn("lg:col-span-2", !isVisible('weeklySales') && "lg:col-span-5")}
          >
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center gap-3 p-4 mb-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Tendencia Mensual</h3>
                  <p className="text-xs text-muted">Últimos 6 meses</p>
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="p-4">
                <div className="space-y-3">
                  {displayMonthlyRevenue.map((month: any, index: number) => {
                    const maxRevenue = Math.max(...displayMonthlyRevenue.map((m: any) => m.revenue));
                    const widthPercent = (month.revenue / maxRevenue) * 100;
                    const isCurrentMonth = index === displayMonthlyRevenue.length - 1;

                    return (
                      <div key={month.month} className="flex items-center gap-3">
                        <span className={cn('w-8 text-xs font-medium', isCurrentMonth ? 'text-blue-600 dark:text-blue-400' : 'text-muted')}>
                          {month.month}
                        </span>
                        <div className="relative flex h-6 flex-1 overflow-hidden rounded-md bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                            className={cn(
                              'absolute inset-y-0 left-0 rounded-md',
                              isCurrentMonth
                                ? 'bg-blue-500 dark:bg-blue-600'
                                : 'bg-blue-200 dark:bg-blue-800'
                            )}
                          />
                        </div>
                        {canViewCosts && (
                          <span className={cn('w-20 text-right text-xs font-semibold', isCurrentMonth ? 'text-foreground' : 'text-muted-foreground')}>
                            {formatCurrency(month.revenue)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Pending Approvals + Inventory Alerts */}
      {canApproveAdjustments && (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Gestión Operativa</p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Pending Approvals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="p-0">
                <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                      <ClipboardList className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Pendientes de Aprobación</h3>
                      <p className="text-xs text-muted">{PENDING_APPROVALS.length} items requieren acción</p>
                    </div>
                  </div>
                  <Badge variant="warning">
                    {PENDING_APPROVALS.length}
                  </Badge>
                </CardHeader>
                <Separator className="bg-border" />
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {PENDING_APPROVALS.map((item) => (
                      <li
                        key={item.id}
                        className="cursor-pointer px-4 py-4 transition-colors hover:bg-muted"
                        onClick={() => router.push(item.type === 'adjustment' ? `/inventario/ajustes/${item.id}` : `/inventario/transferencias/${item.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              item.type === 'adjustment' ? 'bg-blue-50 text-blue-600' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            )}>
                              {item.type === 'adjustment' ? <FileText className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.id}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {canViewCosts && (
                              <p className="text-sm font-semibold text-foreground">{formatCurrency(item.value)}</p>
                            )}
                            <p className="text-xs text-muted">{item.createdBy}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Inventory Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-0">
                <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Alertas de Inventario</h3>
                      <p className="text-xs text-muted">Productos que requieren atención</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => router.push('/inventario?filter=low_stock')}
                  >
                    Ver todos
                  </Button>
                </CardHeader>
                <Separator className="bg-border" />
                {/* F1: Reorder Point Summary */}
                {canViewInventoryAlerts && REORDER_POINT_COUNT > 0 && (
                  <div className="mx-4 mt-4 mb-2 flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {REORDER_POINT_COUNT} producto{REORDER_POINT_COUNT !== 1 ? 's' : ''} bajo punto de reorden
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push('/inventario?filter=below_reorder')}
                    >
                      Ver Inventario
                    </Button>
                  </div>
                )}
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {INVENTORY_ALERTS.map((alert) => (
                      <li key={alert.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              alert.severity === 'critical' ? 'bg-red-50 text-red-600' :
                                alert.severity === 'warning' ? 'bg-amber-50 text-amber-600' :
                                  'bg-amber-50/50 text-amber-600'
                            )}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground line-clamp-1">{alert.product}</p>
                              <p className="text-xs text-muted">{alert.reference}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {alert.type === 'out_of_stock' && (
                               <Badge variant="destructive">Sin Stock</Badge>
                            )}
                            {alert.type === 'low_stock' && (
                               <Badge variant="warning">{alert.current}/{alert.minimum}</Badge>
                            )}
                            {alert.type === 'stagnant' && (
                               <Badge variant="secondary">{alert.monthsWithoutSale} meses</Badge>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                    {canViewInventoryAlerts && REORDER_POINT_ALERTS.slice(0, 5).map((alert) => (
                      <li key={`rp-${alert.id}`} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full',
                              alert.severity === 'critical' ? 'bg-red-50 text-red-600' :
                                alert.severity === 'warning' ? 'bg-amber-50 text-amber-600' :
                                  'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                            )}>
                              <Package className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground line-clamp-1">{alert.product}</p>
                              <p className="text-xs text-muted">{alert.reference}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <Badge
                               variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
                             >
                               {alert.current}/{alert.reorderPoint}
                             </Badge>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}


      {/* F4: Expiry Alerts Widget */}
      {
        canViewExpiryAlerts && expiryStats && (expiryStats.expired > 0 || expiryStats.critical > 0 || expiryStats.warning > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <Card className="p-0">
              <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                    <Clock className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Próximos a Vencer</h3>
                    <p className="text-xs text-muted">Lotes con fecha de vencimiento cercana</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/inventario')}
                >
                  Ver inventario
                </Button>
              </CardHeader>
              <Separator className="bg-border" />
              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                <div className="px-5 py-3 text-center">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{expiryStats.expired}</p>
                  <p className="text-xs text-muted">Vencidos</p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xl font-bold text-red-500">{expiryStats.critical}</p>
                  <p className="text-xs text-muted">Críticos (&lt;30d)</p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xl font-bold text-amber-500">{expiryStats.warning}</p>
                  <p className="text-xs text-muted">Advertencia (30-60d)</p>
                </div>
              </div>
              <CardContent className="p-4">
                <ul className="divide-y divide-border">
                  {upcomingExpiryAlerts.map((alert) => {
                    const config = EXPIRY_ALERT_CONFIG[alert.alertLevel];
                    return (
                      <li key={alert.batch.id} className="px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', config.bg)}>
                              <Clock className={cn('h-4 w-4', config.text)} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground line-clamp-1">{alert.batch.productDescription}</p>
                              <p className="text-xs text-muted">Lote: {alert.batch.batchNumber} &middot; {alert.batch.quantity} uds</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', config.bg, config.text)}>
                              {alert.label}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )
      }

      {/* Section: Finanzas */}
      {
        checkPermission('canAccessCxC') && (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">Finanzas y Cobranzas</p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* CxC Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="lg:col-span-2"
              >
                <Card className="p-0">
                  <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                        <Receipt className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Cuentas por Cobrar</h3>
                        <p className="text-xs text-muted">Resumen de cartera</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push('/clientes/cxc')}
                    >
                      Ver CxC
                    </Button>
                  </CardHeader>
                  <Separator className="bg-border" />
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted">Total Pendiente</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(CXC_SUMMARY.totalPending)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Corriente</p>
                        <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(CXC_SUMMARY.current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Vencido 30-60</p>
                        <p className="mt-1 text-xl font-bold text-amber-600">{formatCurrency(CXC_SUMMARY.overdue30)}</p>
                      </div>
                      <div>
                        <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(CXC_SUMMARY.overdue60 + CXC_SUMMARY.overdue90)}</p>
                      </div>
                    </div>
                    {/* Aging bar */}
                    <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                      <div className="bg-green-600" style={{ width: `${(CXC_SUMMARY.current / CXC_SUMMARY.totalPending) * 100}%` }} />
                      <div className="bg-amber-500" style={{ width: `${(CXC_SUMMARY.overdue30 / CXC_SUMMARY.totalPending) * 100}%` }} />
                      <div className="bg-orange-500" style={{ width: `${(CXC_SUMMARY.overdue60 / CXC_SUMMARY.totalPending) * 100}%` }} />
                      <div className="bg-red-600" style={{ width: `${(CXC_SUMMARY.overdue90 / CXC_SUMMARY.totalPending) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-600" />Corriente</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />30d</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />60d</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" />90+d</span>
                      </div>
                    </div>
                    {/* Cobros del mes progress */}
                    <div className="mt-4 rounded-lg bg-muted p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cobros del mes</span>
                        <span className="font-semibold text-foreground">{formatCurrency(CXC_SUMMARY.collectedThisMonth)} / {formatCurrency(CXC_SUMMARY.collectionTarget)}</span>
                      </div>
                      <Progress
                        value={(CXC_SUMMARY.collectedThisMonth / CXC_SUMMARY.collectionTarget) * 100}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bank Balances + Overdue Alerts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.47 }}
                className="space-y-6"
              >
                {/* Bank Balances */}
                {checkPermission('canViewBankBalances') && (
                  <Card className="p-0">
                    <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <Landmark className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">Saldos Bancarios</h3>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push('/contabilidad/tesoreria')}
                      >
                        Ver
                      </Button>
                    </CardHeader>
                    <Separator className="bg-border" />
                    <CardContent className="p-0">
                      <ul className="divide-y divide-border">
                        {BANK_BALANCES.map((bank) => (
                          <li key={bank.name} className="flex items-center justify-between px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={cn('h-2.5 w-2.5 rounded-full', bank.color)} />
                              <span className="text-sm text-muted-foreground">{bank.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(bank.balance)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-border bg-muted px-5 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Total</span>
                          <span className="text-sm font-bold text-foreground">{formatCurrency(BANK_BALANCES.reduce((s, b) => s + b.balance, 0))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Overdue Alerts */}
                <Card className="p-0">
                  <CardHeader className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-red-600" />
                      <h3 className="text-sm font-semibold text-foreground">Alertas de Morosidad</h3>
                    </div>
                  </CardHeader>
                  <Separator className="bg-border" />
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                      {OVERDUE_CLIENTS.map((client) => (
                        <li key={client.name} className="px-5 py-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground line-clamp-1">{client.name}</p>
                              <p className="text-xs text-red-600">{client.days} días vencido</p>
                            </div>
                            <span className="text-sm font-semibold text-red-600">{formatCurrency(client.amount)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )
      }

      {/* Section: Logística */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Logística y Productos</p>

      {/* Upcoming Shipments + Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Shipments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Ship className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Próximos Embarques</h3>
                  <p className="text-xs text-muted">Mercancía en tránsito</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/trafico')}
              >
                Ver todos
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {UPCOMING_SHIPMENTS.map((shipment) => (
                  <li key={shipment.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 flex-col items-center justify-center rounded-lg',
                          shipment.status === 'in_transit' ? 'bg-green-50' :
                            shipment.status === 'confirmed' ? 'bg-blue-50' : 'bg-muted'
                        )}>
                          <Truck className={cn(
                            'h-5 w-5',
                            shipment.status === 'in_transit' ? 'text-green-600' :
                              shipment.status === 'confirmed' ? 'text-blue-600' : 'text-muted'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{shipment.id}</p>
                            {shipment.status === 'in_transit' && (
                               <Badge variant="success">En tránsito</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{shipment.supplier}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{shipment.items} cajas</p>
                        <p className="text-xs text-muted">ETA: {new Date(shipment.eta).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Top Productos</h3>
                  <p className="text-xs text-muted">Más vendidos este mes</p>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {TOP_PRODUCTS.slice(0, 4).map((product, index) => (
                  <li key={product.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          index === 0 ? 'bg-amber-50 text-amber-600' :
                            index === 1 ? 'bg-accent text-muted-foreground' :
                              index === 2 ? 'bg-amber-50/50 text-amber-600' : 'bg-muted text-muted'
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted">{product.sold} unidades</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canViewCosts && (
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(product.revenue)}</p>
                        )}
                        <span className={cn(
                          'flex items-center text-xs font-medium',
                          product.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {product.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(product.percentChange)}%
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section: Clientes y Agenda */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted"> Clientes y Agenda</p>

      {/* Top Customers + Calendar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2"
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Principales Clientes</h3>
                  <p className="text-xs text-muted">Por volumen de compras este mes</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push('/clientes')}
              >
                Ver todos
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Cliente</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">País</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Órdenes</th>
                      {canViewCosts && (
                        <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Compras</th>
                      )}
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {realTopCustomers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-muted">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                               <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                 {customer.avatar}
                               </AvatarFallback>
                             </Avatar>
                            <span className="text-sm font-medium text-foreground">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-muted-foreground">{customer.country}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm text-foreground">{customer.orders}</span>
                        </td>
                        {canViewCosts && (
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(customer.purchases)}</span>
                          </td>
                        )}
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/clientes/${customer.id}`)}
                            className="p-2 h-8 w-8 min-w-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Calendar / Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center gap-3 p-4 mb-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Próximos Eventos</h3>
                <p className="text-xs text-muted">Actividades programadas</p>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {CALENDAR_EVENTS.map((event) => {
                  const eventDate = new Date(event.date);
                  const isToday = eventDate.toDateString() === new Date().toDateString();
                  const isSoon = eventDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

                  return (
                    <li key={event.id} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-10 w-10 flex-col items-center justify-center rounded-lg',
                          isToday ? 'bg-blue-500 text-white' : isSoon ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'
                        )}>
                          <span className={cn('text-xs font-medium', isToday ? 'text-white' : 'text-muted')}>
                            {eventDate.toLocaleDateString('es-PA', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className={cn('text-sm font-bold', isToday ? 'text-white' : 'text-foreground')}>
                            {eventDate.getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                                                {event.type === 'shipment' && <Badge variant="success">Embarque</Badge>}
                             {event.type === 'meeting' && <Badge variant="default">Reunión</Badge>}
                             {event.type === 'inventory' && <Badge variant="secondary">Inventario</Badge>}
                             {event.type === 'payment' && <Badge variant="warning">Pago</Badge>}
                             {event.type === 'audit' && <Badge variant="destructive">Auditoría</Badge>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section: Actividad */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted"> Actividad y Acciones</p>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="lg:col-span-2"
        >
          <Card className="p-0">
            <CardHeader className="flex flex-row items-center justify-between p-4 mb-0">
              <h3 className="text-base font-semibold text-foreground">Actividad Reciente</h3>
              <Button
                size="sm"
                onClick={() => router.push('/historial')}
              >
                Ver todo
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {realActivity.map((activity: any, idx: number) => (
                  <li key={`${activity.id}-${idx}`} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        activity.type === 'purchase' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          activity.type === 'inventory' ? 'bg-green-50 text-green-600' :
                            activity.type === 'sale' ? 'bg-blue-50 text-blue-600' :
                              activity.type === 'transfer' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                activity.type === 'adjustment' ? 'bg-blue-50 text-blue-600' :
                                  'bg-amber-50 text-amber-600'
                      )}>
                        {activity.type === 'purchase' && <ShoppingCart className="h-4 w-4" />}
                        {activity.type === 'inventory' && <Package className="h-4 w-4" />}
                        {activity.type === 'sale' && <TrendingUp className="h-4 w-4" />}
                        {activity.type === 'transfer' && <ArrowRightLeft className="h-4 w-4" />}
                        {activity.type === 'adjustment' && <FileText className="h-4 w-4" />}
                        {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-0">
            <CardHeader className="px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Acciones Rápidas</h3>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 p-4">
              <Button
                onClick={() => router.push('/compras?action=new')}
                className="w-full justify-start py-6"
              >
                <ShoppingCart className="h-4 w-4" />
                Nueva Orden de Compra
              </Button>
              <Button
                onClick={() => router.push('/productos?action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <Package className="h-4 w-4" />
                Nuevo Producto
              </Button>
              <Button
                onClick={() => router.push('/ventas?action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <TrendingUp className="h-4 w-4" />
                Nueva Cotización
              </Button>
              <Button
                onClick={() => router.push('/inventario?tab=transferencias&action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Nueva Transferencia
              </Button>
              <Button
                onClick={() => router.push('/inventario?tab=conteo&action=new')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <ClipboardList className="h-4 w-4" />
                Conteo Físico
              </Button>
              <Button
                onClick={() => router.push('/clientes/cxc/cobro')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <CircleDollarSign className="h-4 w-4" />
                Registrar Cobro
              </Button>
              <Button
                onClick={() => router.push('/clientes/nuevo')}
                variant="secondary"
                className="w-full justify-start py-6"
              >
                <Users className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={isWidgetsModalOpen} onOpenChange={(open) => !isSavingPrefs && setIsWidgetsModalOpen(open)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">Configurar Widgets</DialogTitle>
                <DialogDescription className="text-sm text-muted">Personaliza la información de tu dashboard</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto w-full border-y border-border mt-4">
            <div className="divide-y divide-border">
              {WIDGETS_CONFIG.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-5 hover:bg-muted transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                      <widget.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{widget.name}</p>
                      <p className="text-xs text-muted mt-0.5 max-w-[200px]">{widget.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={widgetPrefs[widget.id] ?? true}
                    onCheckedChange={(checked) => handleToggleWidget(widget.id, checked)}
                    disabled={isSavingPrefs}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="p-6 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsWidgetsModalOpen(false)}
              disabled={isSavingPrefs}
              className="px-6 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePreferences}
              isLoading={isSavingPrefs}
              className="px-6 font-semibold shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_1px_0_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.3)] bg-[#1a1a1a] text-white hover:bg-[#333333]"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
